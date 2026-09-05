from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.sports import list_sports as list_sports, normalize_sport
from app.db import models
from app.db.session import get_db
from app.schemas.api import GamePickOut

router = APIRouter(prefix="/picks", tags=["picks"])


@router.get("/games", response_model=list[GamePickOut])
def list_game_picks(
    sport: str | None = Query(default=None, description="NBA | NFL | CFB"),
    db: Session = Depends(get_db),
) -> list[GamePickOut]:
    try:
        sport_id = normalize_sport(sport) if sport else None
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    q = (
        db.query(models.GamePrediction)
        .join(models.Game)
        .filter(models.GamePrediction.graded.is_(False))
    )
    if sport_id:
        q = q.filter(models.Game.sport == sport_id)
    rows = q.order_by(models.GamePrediction.edge_pp.desc()).all()

    out: list[GamePickOut] = []
    for pred in rows:
        game = pred.game
        out.append(
            GamePickOut(
                game_id=game.id,
                sport=game.sport,
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


@router.get("/sports")
def sports() -> list[dict[str, str]]:
    return list_sports()
