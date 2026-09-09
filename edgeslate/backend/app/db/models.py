"""SQLAlchemy ORM models for EdgeSlate."""

from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Team(Base):
    __tablename__ = "teams"
    __table_args__ = (UniqueConstraint("sport", "abbr", name="uq_team_sport_abbr"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sport: Mapped[str] = mapped_column(String(16), default="NBA", index=True)
    abbr: Mapped[str] = mapped_column(String(8), index=True)
    name: Mapped[str] = mapped_column(String(64))
    conference: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
    elo: Mapped[float] = mapped_column(Float, default=1500.0)
    offensive_rating: Mapped[float] = mapped_column(Float, default=110.0)
    defensive_rating: Mapped[float] = mapped_column(Float, default=110.0)


class Player(Base):
    __tablename__ = "players"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    external_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(128), index=True)
    sport: Mapped[str] = mapped_column(String(16), default="NBA", index=True)
    team_abbr: Mapped[Optional[str]] = mapped_column(String(8), nullable=True, index=True)
    position: Mapped[Optional[str]] = mapped_column(String(8), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="active")  # active / injured / out
    usage_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    # Basketball: pts/reb/ast/fg3m. Football: pts≈pass/rush yds, reb≈rush/rec TDs proxy, ast≈rec yds, fg3m≈receptions
    season_avg_pts: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    season_avg_reb: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    season_avg_ast: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    season_avg_fg3m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)


class Game(Base):
    __tablename__ = "games"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    external_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, unique=True)
    sport: Mapped[str] = mapped_column(String(16), default="NBA", index=True)
    commence_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    home_team: Mapped[str] = mapped_column(String(8), index=True)
    away_team: Mapped[str] = mapped_column(String(8), index=True)
    home_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    away_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="scheduled")  # scheduled/live/final
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    odds_snapshots: Mapped[list["OddsSnapshot"]] = relationship(back_populates="game")
    predictions: Mapped[list["GamePrediction"]] = relationship(back_populates="game")


class OddsSnapshot(Base):
    __tablename__ = "odds_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id"), index=True)
    bookmaker: Mapped[str] = mapped_column(String(64))
    market: Mapped[str] = mapped_column(String(32))  # h2h / spreads / totals / player_prop
    outcome: Mapped[str] = mapped_column(String(128))
    price: Mapped[float] = mapped_column(Float)
    point: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    implied_prob: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    is_closing: Mapped[bool] = mapped_column(Boolean, default=False)

    game: Mapped["Game"] = relationship(back_populates="odds_snapshots")


class MarketProbability(Base):
    """Prediction-market implied win probabilities (Polymarket / Kalshi / Robinhood)."""

    __tablename__ = "market_probabilities"
    __table_args__ = (UniqueConstraint("game_id", "source", "side", name="uq_market_prob"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id"), index=True)
    source: Mapped[str] = mapped_column(String(32))  # polymarket / kalshi / robinhood
    side: Mapped[str] = mapped_column(String(8))  # home / away
    probability: Mapped[float] = mapped_column(Float)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class GamePrediction(Base):
    __tablename__ = "game_predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id"), index=True)
    pick_side: Mapped[str] = mapped_column(String(8))  # home / away
    pick_team: Mapped[str] = mapped_column(String(8))
    model_prob: Mapped[float] = mapped_column(Float)
    market_prob: Mapped[float] = mapped_column(Float)
    elo_prob: Mapped[float] = mapped_column(Float)
    edge_pp: Mapped[float] = mapped_column(Float)
    confidence: Mapped[float] = mapped_column(Float)
    deep_link: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    graded: Mapped[bool] = mapped_column(Boolean, default=False)
    won: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    closing_market_prob: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    game: Mapped["Game"] = relationship(back_populates="predictions")


class PropLine(Base):
    __tablename__ = "prop_lines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    platform: Mapped[str] = mapped_column(String(32), index=True)  # prizepicks / underdog / odds_api
    sport: Mapped[str] = mapped_column(String(16), default="NBA", index=True)
    external_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True, index=True)
    player_name: Mapped[str] = mapped_column(String(128), index=True)
    team_abbr: Mapped[Optional[str]] = mapped_column(String(8), nullable=True)
    stat_type: Mapped[str] = mapped_column(String(64))
    line: Mapped[float] = mapped_column(Float)
    over_odds: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    under_odds: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    game_id: Mapped[Optional[int]] = mapped_column(ForeignKey("games.id"), nullable=True)
    start_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    raw: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class OptimizedLineup(Base):
    __tablename__ = "optimized_lineups"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    platform: Mapped[str] = mapped_column(String(32), index=True)
    sport: Mapped[str] = mapped_column(String(16), default="NBA", index=True)
    rank: Mapped[int] = mapped_column(Integer)
    expected_value: Mapped[float] = mapped_column(Float)
    win_prob: Mapped[float] = mapped_column(Float)
    salary_used: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    picks: Mapped[dict] = mapped_column(JSON)
    deep_link: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PipelineRun(Base):
    __tablename__ = "pipeline_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    job_name: Mapped[str] = mapped_column(String(64), index=True)
    status: Mapped[str] = mapped_column(String(32), default="running")
    detail: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
