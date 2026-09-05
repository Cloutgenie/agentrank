"""Data pipeline: odds / prediction markets / DFS boards + multi-sport demo seed."""

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
from app.core.sports import SUPPORTED_SPORTS, get_sport, iter_sports, normalize_sport
from app.db import models
from app.services.demo_data import DEMO_BY_SPORT
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


def seed_demo(db: Session, sports: list[str] | None = None) -> dict[str, Any]:
    """Seed demo teams/games/players/props for NBA, NFL, and CFB."""
    settings = get_settings()
    sport_ids = [normalize_sport(s) for s in (sports or list(SUPPORTED_SPORTS))]
    teams_n = players_n = games_n = props_n = 0

    for sport_id in sport_ids:
        pack = DEMO_BY_SPORT[sport_id]

        for t in pack["teams"]:
            row = (
                db.query(models.Team)
                .filter(models.Team.sport == sport_id, models.Team.abbr == t["abbr"])
                .one_or_none()
            )
            if not row:
                db.add(models.Team(**t))
                teams_n += 1
            else:
                for k, v in t.items():
                    setattr(row, k, v)

        for p in pack["players"]:
            row = (
                db.query(models.Player)
                .filter(models.Player.sport == sport_id, models.Player.name == p["name"])
                .one_or_none()
            )
            if not row:
                db.add(models.Player(**p))
                players_n += 1
            else:
                for k, v in p.items():
                    setattr(row, k, v)

        for g in pack["games"]:
            row = (
                db.query(models.Game)
                .filter(models.Game.external_id == g["external_id"])
                .one_or_none()
            )
            if not row:
                row = models.Game(
                    external_id=g["external_id"],
                    sport=sport_id,
                    commence_time=g["commence_time"],
                    home_team=g["home_team"],
                    away_team=g["away_team"],
                    status="scheduled",
                )
                db.add(row)
                db.flush()
                games_n += 1
            else:
                row.sport = sport_id
                row.commence_time = g["commence_time"]
                row.home_team = g["home_team"]
                row.away_team = g["away_team"]
                row.status = "scheduled"

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

        if settings.use_demo_data:
            db.query(models.PropLine).filter(
                models.PropLine.sport == sport_id,
                models.PropLine.platform.in_(["prizepicks", "underdog"]),
            ).delete(synchronize_session=False)

        for i, (name, team, stat, line) in enumerate(pack["props"]):
            for platform in ("prizepicks", "underdog"):
                db.add(
                    models.PropLine(
                        platform=platform,
                        sport=sport_id,
                        external_id=f"demo-{sport_id.lower()}-{platform}-{i}",
                        player_name=name,
                        team_abbr=team,
                        stat_type=stat,
                        line=line,
                    )
                )
                props_n += 1

    db.commit()
    return {
        "teams": teams_n,
        "players": players_n,
        "games": games_n,
        "props": props_n,
        "sports": sport_ids,
    }


TEAM_NAME_TO_ABBR: dict[str, str] = {
    "Boston Celtics": "BOS",
    "New York Knicks": "NYK",
    "Oklahoma City Thunder": "OKC",
    "Denver Nuggets": "DEN",
    "Milwaukee Bucks": "MIL",
    "Cleveland Cavaliers": "CLE",
    "Minnesota Timberwolves": "MIN",
    "Phoenix Suns": "PHX",
    "Los Angeles Lakers": "LAL",
    "Golden State Warriors": "GSW",
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
    "Kansas City Chiefs": "KC",
    "Buffalo Bills": "BUF",
    "Baltimore Ravens": "BAL",
    "Detroit Lions": "DET",
    "San Francisco 49ers": "SF",
    "Philadelphia Eagles": "PHI",
    "Dallas Cowboys": "DAL",
    "Miami Dolphins": "MIA",
    "Green Bay Packers": "GB",
    "New York Jets": "NYJ",
    "New York Giants": "NYG",
    "Los Angeles Rams": "LAR",
    "Los Angeles Chargers": "LAC",
    "Las Vegas Raiders": "LV",
    "New England Patriots": "NE",
    "Pittsburgh Steelers": "PIT",
    "Cincinnati Bengals": "CIN",
    "Cleveland Browns": "CLE",
    "Houston Texans": "HOU",
    "Indianapolis Colts": "IND",
    "Jacksonville Jaguars": "JAX",
    "Tennessee Titans": "TEN",
    "Denver Broncos": "DEN",
    "Chicago Bears": "CHI",
    "Minnesota Vikings": "MIN",
    "Atlanta Falcons": "ATL",
    "Carolina Panthers": "CAR",
    "New Orleans Saints": "NO",
    "Tampa Bay Buccaneers": "TB",
    "Arizona Cardinals": "ARI",
    "Seattle Seahawks": "SEA",
    "Washington Commanders": "WAS",
    "Alabama Crimson Tide": "ALA",
    "Georgia Bulldogs": "UGA",
    "Ohio State Buckeyes": "OHIO",
    "Oregon Ducks": "ORE",
    "Texas Longhorns": "TEX",
    "Michigan Wolverines": "MICH",
    "Notre Dame Fighting Irish": "ND",
    "Penn State Nittany Lions": "PSU",
}


def _team_abbr(name: str) -> str:
    if name in TEAM_NAME_TO_ABBR:
        return TEAM_NAME_TO_ABBR[name]
    if len(name) <= 4:
        return name.upper()
    return name[:4].upper()


async def ingest_odds(db: Session, sport: str | None = None) -> int:
    cfg = get_sport(sport)
    client = OddsApiClient(sport_key=cfg.odds_key)
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
                sport=cfg.id,
                commence_time=commence,
                home_team=home,
                away_team=away,
                status="scheduled",
            )
            db.add(game)
            db.flush()
        else:
            game.sport = cfg.id
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


async def ingest_prediction_markets(db: Session, sport: str | None = None) -> int:
    cfg = get_sport(sport)
    poly = PolymarketClient()
    kalshi = KalshiClient()
    count = 0
    markets = await poly.fetch_win_markets(tag=cfg.polymarket_tag)
    for m in markets:
        game = (
            db.query(models.Game)
            .filter(
                models.Game.sport == cfg.id,
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

    for m in await kalshi.fetch_markets(series_ticker=cfg.kalshi_series):
        teams = m.get("teams") or []
        if not teams:
            continue
        game = (
            db.query(models.Game)
            .filter(
                models.Game.sport == cfg.id,
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


async def ingest_dfs_boards(db: Session, sport: str | None = None) -> dict[str, int]:
    cfg = get_sport(sport)
    pp = PrizePicksClient(league_id=cfg.prizepicks_league_id)
    ud = UnderdogClient(sport_keys=cfg.underdog_keys)
    stats = {"prizepicks": 0, "underdog": 0}
    try:
        for prop in await pp.fetch_projections():
            db.add(
                models.PropLine(
                    platform="prizepicks",
                    sport=cfg.id,
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
        logger.warning("PrizePicks ingest failed (%s): %s", cfg.id, exc)

    try:
        for prop in await ud.fetch_over_under_lines():
            db.add(
                models.PropLine(
                    platform="underdog",
                    sport=cfg.id,
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
        logger.warning("Underdog ingest failed (%s): %s", cfg.id, exc)

    db.commit()
    return stats


async def ingest_balldontlie(db: Session) -> int:
    """NBA-only injury feed."""
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
        existing = (
            db.query(models.Player)
            .filter(models.Player.sport == "NBA", models.Player.name == name)
            .one_or_none()
        )
        status = (row.get("status") or row.get("description") or "injured").lower()
        flag = "out" if "out" in status else "injured"
        if existing:
            existing.status = flag
            updated += 1
        else:
            team = (player.get("team") or {}).get("abbreviation")
            db.add(
                models.Player(
                    name=name,
                    sport="NBA",
                    team_abbr=team,
                    status=flag,
                    external_id=str(player.get("id")),
                )
            )
            updated += 1
    db.commit()
    return updated


async def run_full_pipeline(db: Session, sports: list[str] | None = None) -> dict[str, Any]:
    settings = get_settings()
    run = models.PipelineRun(job_name="full_pipeline", status="running")
    db.add(run)
    db.commit()
    db.refresh(run)

    sport_cfgs = iter_sports(sports)
    stats: dict[str, Any] = {"by_sport": {}}
    try:
        if settings.use_demo_data or not OddsApiClient().configured:
            stats["demo"] = seed_demo(db, sports=[s.id for s in sport_cfgs])

        for cfg in sport_cfgs:
            sport_stats: dict[str, Any] = {
                "odds": await ingest_odds(db, cfg.id),
                "prediction_markets": await ingest_prediction_markets(db, cfg.id),
                "dfs": await ingest_dfs_boards(db, cfg.id),
            }
            stats["by_sport"][cfg.id] = sport_stats

        stats["injuries"] = await ingest_balldontlie(db)

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


# Aliases expected by main / ingest routers


# Names expected by app.main / app.api.ingest
seed_demo = seed_demo
run_full_pipeline = run_full_pipeline
