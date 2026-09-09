import logging
from contextlib import asynccontextmanager

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import backtest, health, ingest, lineups, picks
from app.core.config import get_settings
from app.db.session import Base, SessionLocal, engine
from app.services.pipeline import run_full_pipeline, seed_demo
from app.services.game_model import run_game_predictions

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("edgeslate")

scheduler = BackgroundScheduler()


def _scheduled_pipeline() -> None:
    db = SessionLocal()
    try:
        import asyncio

        asyncio.run(run_full_pipeline(db))
    except Exception:  # noqa: BLE001
        logger.exception("Scheduled pipeline failed")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    Base.metadata.create_all(bind=engine)

    # Bootstrap demo slate so UI works on first boot
    db = SessionLocal()
    try:
        from app.db import models

        if db.query(models.Game).count() == 0:
            seed_demo(db)
            run_game_predictions(db)
            logger.info("Bootstrapped demo slate")
    finally:
        db.close()

    if settings.enable_scheduler:
        scheduler.add_job(_scheduled_pipeline, "interval", minutes=30, id="pipeline")
        scheduler.start()
        logger.info("APScheduler started (30m interval)")

    yield

    if scheduler.running:
        scheduler.shutdown(wait=False)


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="EdgeSlate API",
        description="AI sports prediction & DFS lineup optimizer (NBA MVP)",
        version="0.1.0",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health.router)
    app.include_router(picks.router, prefix="/api")
    app.include_router(lineups.router, prefix="/api")
    app.include_router(backtest.router, prefix="/api")
    app.include_router(ingest.router, prefix="/api")
    return app


app = create_app()
