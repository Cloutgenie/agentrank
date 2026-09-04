from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import models
from app.db.session import get_db
from app.schemas.api import IngestResponse, PipelineStatusOut
from app.services.game_model import run_game_predictions
from app.services.pipeline import run_full_pipeline, seed_demo

router = APIRouter(prefix="/ingest", tags=["ingest"])


@router.post("/run", response_model=IngestResponse)
async def run_ingest(db: Session = Depends(get_db)) -> IngestResponse:
    stats = await run_full_pipeline(db)
    return IngestResponse(ok=True, message="Pipeline completed", stats=stats)


@router.post("/demo", response_model=IngestResponse)
def seed(db: Session = Depends(get_db)) -> IngestResponse:
    stats = seed_demo(db)
    preds = run_game_predictions(db)
    stats["predictions"] = len(preds)
    return IngestResponse(ok=True, message="Demo slate seeded", stats=stats)


@router.get("/status", response_model=list[PipelineStatusOut])
def status(db: Session = Depends(get_db)) -> list[PipelineStatusOut]:
    rows = (
        db.query(models.PipelineRun)
        .order_by(models.PipelineRun.started_at.desc())
        .limit(10)
        .all()
    )
    return [
        PipelineStatusOut(
            job_name=r.job_name,
            status=r.status,
            detail=r.detail,
            started_at=r.started_at,
            finished_at=r.finished_at,
        )
        for r in rows
    ]
