from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class HealthOut(BaseModel):
    status: str
    demo_mode: bool
    sport: str = "NBA"


class GamePickOut(BaseModel):
    game_id: int
    commence_time: datetime
    home_team: str
    away_team: str
    pick_side: str
    pick_team: str
    model_prob: float
    market_prob: float
    elo_prob: float
    edge_pp: float
    confidence: float
    deep_link: Optional[str] = None
    status: str = "scheduled"


class PropPick(BaseModel):
    player_name: str
    team_abbr: Optional[str] = None
    stat_type: str
    line: float
    side: str  # over / under
    model_mean: float
    hit_prob: float
    edge: float
    platform_id: Optional[str] = None


class LineupOut(BaseModel):
    rank: int
    platform: str
    expected_value: float
    win_prob: float
    salary_used: Optional[float] = None
    picks: list[PropPick]
    deep_link: Optional[str] = None


class CalibrationBin(BaseModel):
    bucket: str
    predicted: float
    actual: float
    count: int


class BacktestSummary(BaseModel):
    total_picks: int
    graded_picks: int
    wins: int
    win_rate: float
    avg_edge_pp: float
    avg_model_prob: float
    positive_ev: bool
    launch_ready: bool
    calibration: list[CalibrationBin]
    notes: str


class PipelineStatusOut(BaseModel):
    job_name: str
    status: str
    detail: Optional[str] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None


class OptimizeRequest(BaseModel):
    platform: str = Field(default="prizepicks", pattern="^(prizepicks|underdog)$")
    slate_size: int = Field(default=5, ge=2, le=6)
    top_n: int = Field(default=5, ge=1, le=20)
    max_from_team: int = Field(default=3, ge=1, le=5)


class IngestResponse(BaseModel):
    ok: bool
    message: str
    stats: dict[str, Any] = Field(default_factory=dict)
