"""PrizePicks unofficial public board endpoint.

Source references (GitHub / community):
  - https://api.prizepicks.com/projections?league_id=7&per_page=250&single_stat=true&game_mode=pickem
  - bryanrg22/Lambda-Rim abritage/src/prizepicks_client.py
  - StackOverflow: clayjones94 answer on PrizePicks scraping

NBA league_id = 7. Requires browser-like headers; Cloudflare may block datacenter IPs.
"""

from __future__ import annotations

import logging
from typing import Any, Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import get_settings

logger = logging.getLogger(__name__)

PROJECTIONS_URL = "https://api.prizepicks.com/projections"

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Referer": "https://app.prizepicks.com/",
    "Origin": "https://app.prizepicks.com",
}


class PrizePicksClient:
    def __init__(self, league_id: Optional[int] = None) -> None:
        settings = get_settings()
        self.league_id = league_id or settings.prizepicks_league_id

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=0.5, min=0.5, max=3))
    async def fetch_projections(self) -> list[dict[str, Any]]:
        params = {
            "league_id": str(self.league_id),
            "per_page": "250",
            "single_stat": "true",
            "game_mode": "pickem",
        }
        async with httpx.AsyncClient(timeout=30.0, http2=True) as client:
            r = await client.get(PROJECTIONS_URL, params=params, headers=DEFAULT_HEADERS)
            if r.status_code in (403, 429, 503):
                logger.warning("PrizePicks blocked or rate-limited: %s", r.status_code)
                return []
            r.raise_for_status()
            payload = r.json()

        players: dict[str, dict[str, Any]] = {}
        for item in payload.get("included", []):
            if item.get("type") == "new_player":
                attrs = item.get("attributes", {})
                players[item["id"]] = {
                    "name": attrs.get("display_name") or attrs.get("name"),
                    "team": attrs.get("team"),
                    "position": attrs.get("position"),
                }

        props: list[dict[str, Any]] = []
        for proj in payload.get("data", []):
            attrs = proj.get("attributes", {})
            odds_type = attrs.get("odds_type", "standard")
            if odds_type not in (None, "standard"):
                continue
            rel = proj.get("relationships", {}).get("new_player", {}).get("data") or {}
            player = players.get(rel.get("id"), {})
            line_score = attrs.get("line_score")
            if line_score is None:
                continue
            props.append(
                {
                    "platform": "prizepicks",
                    "external_id": str(proj.get("id")),
                    "player_name": player.get("name") or "Unknown",
                    "team_abbr": player.get("team"),
                    "stat_type": attrs.get("stat_type") or attrs.get("stat_display_name") or "unknown",
                    "line": float(line_score),
                    "start_time": attrs.get("start_time"),
                    "raw": attrs,
                }
            )
        return props
