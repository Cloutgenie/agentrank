from fastapi import APIRouter

from app.core.config import get_settings
from app.core.sports import DEFAULT_SPORT, list_sports
from app.schemas.api import HealthOut

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthOut)
def health() -> HealthOut:
    settings = get_settings()
    return HealthOut(
        status="ok",
        demo_mode=settings.use_demo_data,
        sport=DEFAULT_SPORT,
        sports=list_sports(),
    )
