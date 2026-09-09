"""Game winner consensus model: 70% market-implied + 30% Elo/efficiency."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from sqlalchemy.orm import Session

from app.clients.prediction_markets import robinhood_prediction_deep_link
from app.core.config import get_settings
from app.core.sports import get_sport
from app.db import models
from app.services.probs import american_to_implied, blend_probs, clamp, elo_win_prob, remove_vig_two_way


@dataclass
class PickResult:
    game_id: int
    pick_side: str
    pick_team: str
    model_prob: float
    market_prob: float
    elo_prob: float
    edge_pp: float
    confidence: float
    deep_link: str


def _team_elo(db: Session, abbr: str, sport: str) -> float:
    team = (
        db.query(models.Team)
        .filter(models.Team.abbr == abbr, models.Team.sport == sport)
        .one_or_none()
    )
    if not team:
        team = db.query(models.Team).filter(models.Team.abbr == abbr).one_or_none()
    if not team:
        return 1500.0
    cfg = get_sport(sport)
    baseline = cfg.efficiency_baseline
    # Football baselines are points-ish; scale nudge smaller than basketball
    scale = 4.0 if sport == "NBA" else 2.5
    off_adj = (team.offensive_rating - baseline) * scale
    def_adj = (baseline - team.defensive_rating) * scale
    return team.elo + off_adj + def_adj


def _consensus_market_home_prob(db: Session, game: models.Game) -> float:
    snaps = (
        db.query(models.OddsSnapshot)
        .filter(
            models.OddsSnapshot.game_id == game.id,
            models.OddsSnapshot.market == "h2h",
        )
        .all()
    )
    book_probs: list[float] = []
    by_book: dict[str, dict[str, float]] = {}
    for s in snaps:
        by_book.setdefault(s.bookmaker, {})[s.outcome] = s.implied_prob or american_to_implied(s.price)

    for outcomes in by_book.values():
        home_p = outcomes.get(game.home_team) or outcomes.get("home")
        away_p = outcomes.get(game.away_team) or outcomes.get("away")
        if home_p is None or away_p is None:
            continue
        h, _ = remove_vig_two_way(home_p, away_p)
        book_probs.append(h)

    sportsbook = sum(book_probs) / len(book_probs) if book_probs else None

    market_rows = (
        db.query(models.MarketProbability)
        .filter(models.MarketProbability.game_id == game.id)
        .all()
    )
    pm_home = [r.probability for r in market_rows if r.side == "home"]
    prediction = sum(pm_home) / len(pm_home) if pm_home else None

    if sportsbook is not None and prediction is not None:
        return 0.6 * sportsbook + 0.4 * prediction
    if sportsbook is not None:
        return sportsbook
    if prediction is not None:
        return prediction
    return 0.5


def score_game(db: Session, game: models.Game) -> Optional[PickResult]:
    settings = get_settings()
    cfg = get_sport(game.sport)
    market_home = clamp(_consensus_market_home_prob(db, game))
    home_elo = _team_elo(db, game.home_team, game.sport)
    away_elo = _team_elo(db, game.away_team, game.sport)
    elo_home = clamp(elo_win_prob(home_elo, away_elo, home_advantage=cfg.home_advantage_elo))

    model_home = clamp(
        blend_probs(
            market_home,
            elo_home,
            settings.market_weight,
            settings.elo_weight,
        )
    )
    model_away = 1.0 - model_home
    market_away = 1.0 - market_home

    edge_home = (model_home - market_home) * 100.0
    edge_away = (model_away - market_away) * 100.0

    if edge_home >= edge_away:
        pick_side, pick_team = "home", game.home_team
        model_prob, market_prob, elo_prob, edge_pp = model_home, market_home, elo_home, edge_home
    else:
        pick_side, pick_team = "away", game.away_team
        model_prob, market_prob, elo_prob, edge_pp = model_away, market_away, 1.0 - elo_home, edge_away

    if edge_pp < settings.edge_threshold_pp:
        return None

    confidence = clamp(abs(model_prob - 0.5) * 2.0 * (edge_pp / 10.0 + 0.5))
    deep_link = robinhood_prediction_deep_link(game.home_team, game.away_team)

    return PickResult(
        game_id=game.id,
        pick_side=pick_side,
        pick_team=pick_team,
        model_prob=round(model_prob, 4),
        market_prob=round(market_prob, 4),
        elo_prob=round(elo_prob, 4),
        edge_pp=round(edge_pp, 2),
        confidence=round(confidence, 4),
        deep_link=deep_link,
    )


def run_game_predictions(db: Session, sport: str | None = None) -> list[models.GamePrediction]:
    q = db.query(models.Game).filter(models.Game.status.in_(["scheduled", "live"]))
    if sport:
        q = q.filter(models.Game.sport == normalize_sport_safe(sport))
    games = q.order_by(models.Game.commence_time.asc()).all()
    created: list[models.GamePrediction] = []
    for game in games:
        result = score_game(db, game)
        if result is None:
            continue
        db.query(models.GamePrediction).filter(
            models.GamePrediction.game_id == game.id,
            models.GamePrediction.graded.is_(False),
        ).delete()
        row = models.GamePrediction(
            game_id=result.game_id,
            pick_side=result.pick_side,
            pick_team=result.pick_team,
            model_prob=result.model_prob,
            market_prob=result.market_prob,
            elo_prob=result.elo_prob,
            edge_pp=result.edge_pp,
            confidence=result.confidence,
            deep_link=result.deep_link,
        )
        db.add(row)
        created.append(row)
    db.commit()
    for row in created:
        db.refresh(row)
    return created


def normalize_sport_safe(value: str) -> str:
    from app.core.sports import normalize_sport

    return normalize_sport(value)
