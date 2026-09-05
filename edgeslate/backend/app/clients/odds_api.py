"""The Odds API client — live odds, spreads, totals, player props.

Docs: https://the-odds-api.com/liveapi/guides/v4/
"""

from __future__ import annotations

import logging
from typing import Any, Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import get_settings

logger = logging.getLogger(__name__)
BASE = "https://api.the-odds-api.com/v4"


class OddsApiClient:
    def __init__(self, api_key: Optional[str] = None, sport_key: Optional[str] = None) -> None:
        settings = get_settings()
        self.api_key = api_key if api_key is not None else settings.odds_api_key
        self.sport = sport_key if sport_key is not None else settings.sport_key

    @property
    def configured(self) -> bool:
        return bool(self.api_key)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=0.5, min=0.5, max=4))
    async def fetch_events(self) -> list[dict[str, Any]]:
        if not self.configured:
            return []
        params = {
            "apiKey": self.api_key,
            "regions": "us",
            "markets": "h2h,spreads,totals",
            "oddsFormat": "american",
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.get(f"{BASE}/sports/{self.sport}/odds", params=params)
            r.raise_for_status()
            return r.json()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=0.5, min=0.5, max=4))
    async def fetch_player_props(self, event_id: str) -> dict[str, Any]:
        if not self.configured:
            return {}
        params = {
            "apiKey": self.api_key,
            "regions": "us",
            "markets": "player_points,player_rebounds,player_assists,player_threes",
            "oddsFormat": "american",
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.get(
                f"{BASE}/sports/{self.sport}/events/{event_id}/odds",
                params=params,
            )
            if r.status_code == 404:
                return {}
            r.raise_for_status()
            return r.json()
