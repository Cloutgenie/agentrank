"""Data pipeline: pull odds/stats/DFS boards into Postgres (+ demo seed)."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Optional

from dateutil.parser import isoparse
from sqlalchemy.orm import Session

from app.clients.balldontlie import BallDontLieClient
from app.clients.odds_api import OddsApiClient
from app.clients.prediction_markets import KalshiClient, PolymarketClient
from app.clients.prizepicks import PrizePicksClient
from app.clients.underdog import UnderdogClient
from app.core.config import get_settings
from app.db import models
from app.services.demo_data import DEMO_GAMES, DEMO_PLAYERS, DEMO_TEAMS
from app.services.game_model import run_game_predictions
from app.services.probs import american_to_implied

logger = logging.getLogger(__name__)


def _parse_dt(value: Any) -> Optional[datetime]:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    try:
        dt = isoparse(str(value))
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except Exception:  # noqa: BLE001
        return None


def seed_demo(db: Session) -> dict[str, int]:
    settings = get_settings()
    teams_n = players_n = games_n = props_n = 0

    for t in DEMO_TEAMS:
        row = db.query(models.Team).filter(models.Team.abbr == t["abbr"]).one_or_none()
        if not row:
            db.add(models.Team(**t))
            teams_n += 1
        else:
            for k, v in t.items():
                setattr(row, k, v)

    for p in DEMO_PLAYERS:
        row = (
            db.query(models.Player)
            .filter(models.Player.name == p["name"])
            .one_or_none()
        )
        if not row:
            db.add(models.Player(**p))
            players_n += 1
        else:
            for k, v in p.items():
                setattr(row, k, v)

    for g in DEMO_GAMES:
        row = (
            db.query(models.Game)
            .filter(models.Game.external_id == g["external_id"])
            .one_or_none()
        )
        if not row:
            row = models.Game(
                external_id=g["external_id"],
                commence_time=g["commence_time"],
                home_team=g["home_team"],
                away_team=g["away_team"],
                status="scheduled",
            )
            db.add(row)
            db.flush()
            games_n += 1
        else:
            row.commence_time = g["commence_time"]
            row.status = "scheduled"

        # Odds snapshots
        for book in ("draftkings", "fanduel", "betmgm"):
            for outcome, ml in (
                (g["home_team"], g["home_ml"]),
                (g["away_team"], g["away_ml"]),
            ):
                db.add(
                    models.OddsSnapshot(
                        game_id=row.id,
                        bookmaker=book,
                        market="h2h",
                        outcome=outcome,
                        price=float(ml),
                        implied_prob=american_to_implied(float(ml)),
                    )
                )

        # Prediction market consensus (replace prior demo rows for this game)
        db.query(models.MarketProbability).filter(
            models.MarketProbability.game_id == row.id
        ).delete(synchronize_session=False)
        db.add(
            models.MarketProbability(
                game_id=row.id,
                source="polymarket",
                side="home",
                probability=g["market_home"],
            )
        )
        db.add(
            models.MarketProbability(
                game_id=row.id,
                source="polymarket",
                side="away",
                probability=1.0 - g["market_home"],
            )
        )

    # Demo prop lines for both platforms
    prop_defs = [
        ("Jayson Tatum", "BOS", "Points", 27.5),
        ("Jaylen Brown", "BOS", "Points", 23.5),
        ("Jalen Brunson", "NYK", "Points", 26.5),
        ("Karl-Anthony Towns", "NYK", "Rebounds", 11.5),
        ("Shai Gilgeous-Alexander", "OKC", "Points", 31.5),
        ("Nikola Jokic", "DEN", "Pts+Rebs+Asts", 48.5),
        ("Giannis Antetokounmpo", "MIL", "Points", 29.5),
        ("Donovan Mitchell", "CLE", "Points", 25.5),
        ("Anthony Edwards", "MIN", "Points", 26.5),
        ("LeBron James", "LAL", "Assists", 7.5),
        ("Stephen Curry", "GSW", "3-PT Made", 4.5),
        ("Kevin Durant", "PHX", "Points", 26.5),
        ("Jayson Tatum", "BOS", "Rebounds", 8.5),
        ("Nikola Jokic", "DEN", "Assists", 9.5),
        ("Shai Gilgeous-Alexander", "OKC", "Assists", 6.5),
        ("Jaylen Brown", "BOS", "Pts+Rebs+Asts", 34.5),
    ]
    existing = db.query(models.PropLine).count()
    if existing == 0 or settings.use_demo_data:
        # Clear stale demo props when reseeding
        if settings.use_demo_data:
            db.query(models.PropLine).filter(
                models.PropLine.platform.in_(["prizepicks", "underdog"])
            ).delete(synchronize_session=False)
        for i, (name, team, stat, line) in enumerate(prop_defs):
            for platform in ("prizepicks", "underdog"):
                db.add(
                    models.PropLine(
                        platform=platform,
                        external_id=f"demo-{platform}-{i}",
                        player_name=name,
                        team_abbr=team,
                        stat_type=stat,
                        line=line,
                    )
                )
                props_n += 1

    db.commit()
    return {"teams": teams_n, "players": players_n, "games": games_n, "props": props_n}


async def ingest_odds(db: Session) -> int:
    client = OddsApiClient()
    if not client.configured:
        return 0
    events = await client.fetch_events()
    count = 0
    for event in events:
        external_id = event.get("id")
        home = _team_abbr(event.get("home_team", ""))
        away = _team_abbr(event.get("away_team", ""))
        commence = _parse_dt(event.get("commence_time"))
        if not external_id or not commence:
            continue
        game = db.query(models.Game).filter(models.Game.external_id == external_id).one_or_none()
        if not game:
            game = models.Game(
                external_id=external_id,
                commence_time=commence,
                home_team=home,
                away_team=away,
                status="scheduled",
            )
            db.add(game)
            db.flush()
        for book in event.get("bookmakers", []):
            book_key = book.get("key") or book.get("title") or "unknown"
            for market in book.get("markets", []):
                mkey = market.get("key")
                for outcome in market.get("outcomes", []):
                    name = outcome.get("name")
                    price = outcome.get("price")
                    if price is None:
                        continue
                    outcome_abbr = _team_abbr(name) if mkey == "h2h" else name
                    db.add(
                        models.OddsSnapshot(
                            game_id=game.id,
                            bookmaker=book_key,
                            market=mkey,
                            outcome=outcome_abbr,
                            price=float(price),
                            point=outcome.get("point"),
                            implied_prob=american_to_implied(float(price)) if mkey == "h2h" else None,
                        )
                    )
                    count += 1
    db.commit()
    return count


def _team_abbr(name: str) -> str:
    mapping = {
        "Boston Celtics": "BOS",
        "New York Knicks": "NYK",
        "Milwaukee Bucks": "MIL",
        "Cleveland Cavaliers": "CLE",
        "Oklahoma City Thunder": "OKC",
        "Denver Nuggets": "DEN",
        "Minnesota Timberwolves": "MIN",
        "Los Angeles Lakers": "LAL",
        "Golden State Warriors": "GSW",
        "Phoenix Suns": "PHX",
        "Miami Heat": "MIA",
        "Philadelphia 76ers": "PHI",
        "Brooklyn Nets": "BKN",
        "Toronto Raptors": "TOR",
        "Atlanta Hawks": "ATL",
        "Charlotte Hornets": "CHA",
        "Orlando Magic": "ORL",
        "Washington Wizards": "WAS",
        "Detroit Pistons": "DET",
        "Indiana Pacers": "IND",
        "Chicago Bulls": "CHI",
        "Dallas Mavericks": "DAL",
        "Houston Rockets": "HOU",
        "San Antonio Spurs": "SAS",
        "Memphis Grizzlies": "MEM",
        "New Orleans Pelicans": "NOP",
        "Sacramento Kings": "SAC",
        "LA Clippers": "LAC",
        "Los Angeles Clippers": "LAC",
        "Utah Jazz": "UTA",
        "Portland Trail Blazers": "POR",
    }
    if name in mapping:
        return mapping[name]
    if len(name) <= 3:
        return name.upper()
    return name[:3].upper()


async def ingest_prediction_markets(db: Session) -> int:
    poly = PolymarketClient()
    kalshi = KalshiClient()
    count = 0
    markets = await poly.fetch_nba_win_markets()
    for m in markets:
        game = (
            db.query(models.Game)
            .filter(
                models.Game.home_team == m["home_team"],
                models.Game.away_team == m["away_team"],
                models.Game.status.in_(["scheduled", "live"]),
            )
            .order_by(models.Game.commence_time.asc())
            .first()
        )
        if not game:
            continue
        for side, prob in (("home", m["home_prob"]), ("away", m["away_prob"])):
            db.add(
                models.MarketProbability(
                    game_id=game.id,
                    source="polymarket",
                    side=side,
                    probability=float(prob),
                )
            )
            count += 1

    for m in await kalshi.fetch_nba_markets():
        teams = m.get("teams") or []
        if len(teams) < 1:
            continue
        # Kalshi titles often focus on one team winning
        game = (
            db.query(models.Game)
            .filter(
                (models.Game.home_team.in_(teams)) | (models.Game.away_team.in_(teams)),
                models.Game.status.in_(["scheduled", "live"]),
            )
            .first()
        )
        if not game:
            continue
        side = "home" if game.home_team in teams else "away"
        db.add(
            models.MarketProbability(
                game_id=game.id,
                source="kalshi",
                side=side,
                probability=float(m["yes_prob"]),
            )
        )
        count += 1
    db.commit()
    return count


async def ingest_dfs_boards(db: Session) -> dict[str, int]:
    pp = PrizePicksClient()
    ud = UnderdogClient()
    stats = {"prizepicks": 0, "underdog": 0}
    try:
        for prop in await pp.fetch_projections():
            db.add(
                models.PropLine(
                    platform="prizepicks",
                    external_id=prop.get("external_id"),
                    player_name=prop["player_name"],
                    team_abbr=prop.get("team_abbr"),
                    stat_type=prop["stat_type"],
                    line=prop["line"],
                    start_time=_parse_dt(prop.get("start_time")),
                    raw=prop.get("raw"),
                )
            )
            stats["prizepicks"] += 1
    except Exception as exc:  # noqa: BLE001
        logger.warning("PrizePicks ingest failed: %s", exc)

    try:
        for prop in await ud.fetch_over_under_lines():
            db.add(
                models.PropLine(
                    platform="underdog",
                    external_id=prop.get("external_id"),
                    player_name=prop["player_name"],
                    team_abbr=str(prop.get("team_abbr")) if prop.get("team_abbr") else None,
                    stat_type=prop["stat_type"],
                    line=prop["line"],
                    over_odds=prop.get("over_odds"),
                    under_odds=prop.get("under_odds"),
                    start_time=_parse_dt(prop.get("start_time")),
                    raw=prop.get("raw"),
                )
            )
            stats["underdog"] += 1
    except Exception as exc:  # noqa: BLE001
        logger.warning("Underdog ingest failed: %s", exc)

    db.commit()
    return stats


async def ingest_balldontlie(db: Session) -> int:
    client = BallDontLieClient()
    if not client.configured:
        return 0
    injuries = await client.fetch_injuries()
    updated = 0
    for row in injuries:
        player = row.get("player") or {}
        name = f"{player.get('first_name', '')} {player.get('last_name', '')}".strip()
        if not name:
            continue
        existing = db.query(models.Player).filter(models.Player.name == name).one_or_none()
        status = (row.get("status") or row.get("description") or "injured").lower()
        flag = "out" if "out" in status else "injured"
        if existing:
            existing.status = flag
            updated += 1
        else:
            team = (player.get("team") or {}).get("abbreviation")
            db.add(models.Player(name=name, team_abbr=team, status=flag, external_id=str(player.get("id"))))
            updated += 1
    db.commit()
    return updated


async def run_full_pipeline(db: Session) -> dict[str, Any]:
    settings = get_settings()
    run = models.PipelineRun(job_name="full_pipeline", status="running")
    db.add(run)
    db.commit()
    db.refresh(run)

    stats: dict[str, Any] = {}
    try:
        if settings.use_demo_data or not OddsApiClient().configured:
            stats["demo"] = seed_demo(db)

        stats["odds"] = await ingest_odds(db)
        stats["prediction_markets"] = await ingest_prediction_markets(db)
        stats["dfs"] = await ingest_dfs_boards(db)
        stats["injuries"] = await ingest_balldontlie(db)

        # If live DFS failed and we have no props, ensure demo props exist
        if db.query(models.PropLine).count() == 0:
            stats["demo_props_fallback"] = seed_demo(db)

        preds = run_game_predictions(db)
        stats["predictions"] = len(preds)

        run.status = "success"
        run.detail = str(stats)
        run.finished_at = datetime.now(timezone.utc)
        db.commit()
    except Exception as exc:  # noqa: BLE001
        logger.exception("Pipeline failed")
        run.status = "failed"
        run.detail = str(exc)
        run.finished_at = datetime.now(timezone.utc)
        db.commit()
        raise

    return stats
