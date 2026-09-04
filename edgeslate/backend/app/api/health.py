from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.api import HealthOut

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthOut)
def health() -> HealthOut:
    settings = get_settings()
    return HealthOut(status="ok", demo_mode=settings.use_demo_data, sport="NBA")
