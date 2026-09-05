"""BallDontLie NBA stats client.

Docs: https://docs.balldontlie.io/
"""

from __future__ import annotations

import logging
from typing import Any, Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import get_settings

logger = logging.getLogger(__name__)
BASE = "https://api.balldontlie.io/v1"


class BallDontLieClient:
    def __init__(self, api_key: Optional[str] = None) -> None:
        settings = get_settings()
        self.api_key = api_key if api_key is not None else settings.balldontlie_api_key

    @property
    def configured(self) -> bool:
        return bool(self.api_key)

    def _headers(self) -> dict[str, str]:
        return {"Authorization": self.api_key} if self.api_key else {}

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=0.5, min=0.5, max=4))
    async def fetch_players(self, search: Optional[str] = None, per_page: int = 100) -> list[dict[str, Any]]:
        if not self.configured:
            return []
        params: dict[str, Any] = {"per_page": per_page}
        if search:
            params["search"] = search
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.get(f"{BASE}/players", params=params, headers=self._headers())
            r.raise_for_status()
            return r.json().get("data", [])

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=0.5, min=0.5, max=4))
    async def fetch_injuries(self) -> list[dict[str, Any]]:
        if not self.configured:
            return []
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.get(f"{BASE}/player_injuries", headers=self._headers())
            if r.status_code == 404:
                # Endpoint availability varies by plan
                return []
            r.raise_for_status()
            return r.json().get("data", [])

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=0.5, min=0.5, max=4))
    async def fetch_season_averages(self, player_ids: list[int], season: int = 2025) -> list[dict[str, Any]]:
        if not self.configured or not player_ids:
            return []
        params = [("season", season)] + [("player_ids[]", pid) for pid in player_ids[:25]]
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.get(f"{BASE}/season_averages", params=params, headers=self._headers())
            r.raise_for_status()
            return r.json().get("data", [])
