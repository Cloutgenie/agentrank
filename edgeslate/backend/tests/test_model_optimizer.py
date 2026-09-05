"""SQLite-backed smoke tests for model + optimizer (no Postgres required)."""

from datetime import datetime, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.models import Base, Game, MarketProbability, OddsSnapshot, Player, PropLine, Team
from app.db import models  # noqa: F401
from app.services.game_model import run_game_predictions
from app.services.optimizer import optimize_lineups
from app.services.probs import american_to_implied


@pytest.fixture()
def db():
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    # JSONB is Postgres-specific; remap for sqlite tests
    for table in Base.metadata.tables.values():
        for col in table.columns:
            if col.type.__class__.__name__ == "JSONB":
                from sqlalchemy import JSON

                col.type = JSON()
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    session.add(Team(sport="NBA", abbr="BOS", name="Boston Celtics", elo=1680, offensive_rating=118, defensive_rating=109))
    session.add(Team(sport="NBA", abbr="NYK", name="New York Knicks", elo=1580, offensive_rating=115, defensive_rating=111))
    game = Game(
        external_id="t1",
        sport="NBA",
        commence_time=datetime.now(timezone.utc),
        home_team="BOS",
        away_team="NYK",
        status="scheduled",
    )
    session.add(game)
    session.flush()
    session.add(
        OddsSnapshot(
            game_id=game.id,
            bookmaker="draftkings",
            market="h2h",
            outcome="BOS",
            price=-140,
            implied_prob=american_to_implied(-140),
        )
    )
    session.add(
        OddsSnapshot(
            game_id=game.id,
            bookmaker="draftkings",
            market="h2h",
            outcome="NYK",
            price=120,
            implied_prob=american_to_implied(120),
        )
    )
    session.add(MarketProbability(game_id=game.id, source="polymarket", side="home", probability=0.52))
    session.add(MarketProbability(game_id=game.id, source="polymarket", side="away", probability=0.48))

    for name, team, pts, reb, ast in [
        ("Jayson Tatum", "BOS", 27.2, 8.4, 5.1),
        ("Jalen Brunson", "NYK", 26.5, 3.4, 7.0),
        ("Jaylen Brown", "BOS", 23.8, 5.6, 4.2),
        ("Karl-Anthony Towns", "NYK", 24.1, 12.2, 2.8),
        ("Derrick White", "BOS", 15.0, 4.0, 5.0),
    ]:
        session.add(
            Player(
                name=name,
                sport="NBA",
                team_abbr=team,
                season_avg_pts=pts,
                season_avg_reb=reb,
                season_avg_ast=ast,
                status="active",
            )
        )
        session.add(
            PropLine(
                platform="prizepicks",
                sport="NBA",
                external_id=f"p-{name}",
                player_name=name,
                team_abbr=team,
                stat_type="Points",
                line=pts - 1.5,
            )
        )
    session.commit()
    yield session
    session.close()


def test_game_predictions_surface_edge(db, monkeypatch):
    monkeypatch.setenv("EDGE_THRESHOLD_PP", "1.0")
    from app.core.config import get_settings

    get_settings.cache_clear()
    preds = run_game_predictions(db)
    assert len(preds) >= 1
    assert preds[0].edge_pp >= 1.0
    get_settings.cache_clear()


def test_optimizer_returns_lineups(db, monkeypatch):
    monkeypatch.setenv("MONTE_CARLO_SIMS", "1000")
    from app.core.config import get_settings

    get_settings.cache_clear()
    rows = optimize_lineups(db, platform="prizepicks", slate_size=3, top_n=3, max_from_team=2)
    assert len(rows) >= 1
    assert len(rows[0].picks) == 3
    get_settings.cache_clear()
