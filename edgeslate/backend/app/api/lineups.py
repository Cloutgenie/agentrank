from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import models
from app.db.session import get_db
from app.schemas.api import LineupOut, OptimizeRequest, PropPick
from app.services.optimizer import optimize_lineups

router = APIRouter(prefix="/lineups", tags=["lineups"])


def _to_out(row: models.OptimizedLineup) -> LineupOut:
    picks = [
        PropPick(
            player_name=p["player_name"],
            team_abbr=p.get("team_abbr"),
            stat_type=p["stat_type"],
            line=p["line"],
            side=p["side"],
            model_mean=p["model_mean"],
            hit_prob=p["hit_prob"],
            edge=p["edge"],
            platform_id=p.get("platform_id"),
        )
        for p in (row.picks or [])
    ]
    return LineupOut(
        rank=row.rank,
        platform=row.platform,
        expected_value=row.expected_value,
        win_prob=row.win_prob,
        salary_used=row.salary_used,
        picks=picks,
        deep_link=row.deep_link,
    )


@router.get("", response_model=list[LineupOut])
def list_lineups(platform: str = "prizepicks", db: Session = Depends(get_db)) -> list[LineupOut]:
    rows = (
        db.query(models.OptimizedLineup)
        .filter(models.OptimizedLineup.platform == platform)
        .order_by(models.OptimizedLineup.created_at.desc(), models.OptimizedLineup.rank.asc())
        .limit(5)
        .all()
    )
    # Keep only latest batch (same created_at minute / first rank=1 cluster)
    if not rows:
        return []
    latest = rows[0].created_at
    batch = [r for r in rows if r.created_at == latest]
    return [_to_out(r) for r in sorted(batch, key=lambda x: x.rank)]


@router.post("/optimize", response_model=list[LineupOut])
def optimize(body: OptimizeRequest, db: Session = Depends(get_db)) -> list[LineupOut]:
    rows = optimize_lineups(
        db,
        platform=body.platform,
        slate_size=body.slate_size,
        top_n=body.top_n,
        max_from_team=body.max_from_team,
    )
    return [_to_out(r) for r in rows]
