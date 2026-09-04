from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import models
from app.db.session import get_db
from app.schemas.api import GamePickOut

router = APIRouter(prefix="/picks", tags=["picks"])


@router.get("/games", response_model=list[GamePickOut])
def list_game_picks(db: Session = Depends(get_db)) -> list[GamePickOut]:
    rows = (
        db.query(models.GamePrediction)
        .join(models.Game)
        .filter(models.GamePrediction.graded.is_(False))
        .order_by(models.GamePrediction.edge_pp.desc())
        .all()
    )
    out: list[GamePickOut] = []
    for pred in rows:
        game = pred.game
        out.append(
            GamePickOut(
                game_id=game.id,
                commence_time=game.commence_time,
                home_team=game.home_team,
                away_team=game.away_team,
                pick_side=pred.pick_side,
                pick_team=pred.pick_team,
                model_prob=pred.model_prob,
                market_prob=pred.market_prob,
                elo_prob=pred.elo_prob,
                edge_pp=pred.edge_pp,
                confidence=pred.confidence,
                deep_link=pred.deep_link,
                status=game.status,
            )
        )
    return out
