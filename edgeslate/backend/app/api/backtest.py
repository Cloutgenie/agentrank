from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.api import BacktestSummary
from app.services.backtest import backtest_summary, grade_final_games

router = APIRouter(prefix="/backtest", tags=["backtest"])


@router.get("/summary", response_model=BacktestSummary)
def summary(db: Session = Depends(get_db)) -> BacktestSummary:
    grade_final_games(db)
    return backtest_summary(db)
