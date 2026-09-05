"""Underdog Fantasy unofficial board endpoints.

Community-confirmed URLs (GitHub code search):
  - https://api.underdogfantasy.com/beta/v5/over_under_lines
  - https://api.underdogfantasy.com/beta/v6/over_under_lines
  - https://api.underdogfantasy.com/v1/over_under_lines

Seen in: JavierC24/BetMaker, linemaker-asup/esports-lines-dashboard,
jaayslaughter-cpu/mework, bchowdar00/mlb-tb-under-engine.

Cloudflare often blocks datacenter IPs; demo fallback covers local/dev.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

UNDERDOG_URLS = [
    "https://api.underdogfantasy.com/beta/v5/over_under_lines",
    "https://api.underdogfantasy.com/beta/v6/over_under_lines",
    "https://api.underdogfantasy.com/v1/over_under_lines",
]

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json",
    "Referer": "https://underdogfantasy.com/",
    "Origin": "https://underdogfantasy.com",
}


def _index_by_id(rows: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    return {str(r.get("id")): r for r in rows if r.get("id") is not None}


class UnderdogClient:
    def __init__(self, sport_keys: tuple[str, ...] | None = None) -> None:
        self.sport_keys = tuple(k.lower() for k in sport_keys) if sport_keys else None

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=0.5, min=0.5, max=3))
    async def fetch_over_under_lines(self) -> list[dict[str, Any]]:
        last_error: Exception | None = None
        async with httpx.AsyncClient(timeout=30.0, http2=True) as client:
            for url in UNDERDOG_URLS:
                try:
                    r = await client.get(url, headers=DEFAULT_HEADERS)
                    if r.status_code in (403, 429, 503):
                        logger.warning("Underdog blocked on %s: %s", url, r.status_code)
                        continue
                    r.raise_for_status()
                    return self._normalize(r.json())
                except Exception as exc:  # noqa: BLE001
                    last_error = exc
                    logger.info("Underdog fetch failed for %s: %s", url, exc)
        if last_error:
            logger.warning("All Underdog endpoints failed: %s", last_error)
        return []

    def _normalize(self, payload: dict[str, Any]) -> list[dict[str, Any]]:
        """Underdog returns a bag of over_under_lines + appearances + players."""
        lines = payload.get("over_under_lines") or payload.get("data") or []
        appearances = _index_by_id(payload.get("appearances") or [])
        players = _index_by_id(payload.get("players") or [])
        over_unders = _index_by_id(payload.get("over_unders") or [])

        props: list[dict[str, Any]] = []
        for line in lines:
            if not isinstance(line, dict):
                continue
            attrs = line.get("attributes") or line
            stat_value = attrs.get("stat_value") or attrs.get("line") or attrs.get("statValue")
            if stat_value is None:
                continue

            appearance_id = attrs.get("appearance_id")
            if appearance_id is None:
                rel = (line.get("relationships") or {}).get("appearance", {}).get("data") or {}
                appearance_id = rel.get("id")

            appearance = appearances.get(str(appearance_id), {})
            player_id = appearance.get("player_id") or (appearance.get("attributes") or {}).get("player_id")
            player = players.get(str(player_id), {})
            player_attrs = player.get("attributes") or player

            ou_id = attrs.get("over_under_id")
            ou = over_unders.get(str(ou_id), {})
            ou_attrs = ou.get("attributes") or ou
            stat_type = (
                ou_attrs.get("stat")
                or attrs.get("stat")
                or attrs.get("title")
                or "unknown"
            )

            sport = (appearance.get("attributes") or appearance).get("sport_id") or ""
            sport_l = str(sport).lower()
            if self.sport_keys:
                if sport_l and not any(k in sport_l or sport_l == k for k in self.sport_keys):
                    continue
            elif sport_l and sport_l not in ("nba", "3") and "nba" not in sport_l:
                if any(x in sport_l for x in ("nfl", "mlb", "nhl", "cfb", "soccer")):
                    continue

            options = attrs.get("options") or []
            over_odds = under_odds = None
            for opt in options:
                choice = str(opt.get("choice") or opt.get("name") or "").lower()
                payout = opt.get("payout_multiplier") or opt.get("american_price")
                if "higher" in choice or choice == "over":
                    over_odds = float(payout) if payout is not None else None
                elif "lower" in choice or choice == "under":
                    under_odds = float(payout) if payout is not None else None

            first = player_attrs.get("first_name") or ""
            last = player_attrs.get("last_name") or ""
            display = player_attrs.get("display_name") or f"{first} {last}".strip() or "Unknown"

            props.append(
                {
                    "platform": "underdog",
                    "external_id": str(line.get("id") or attrs.get("id") or ""),
                    "player_name": display,
                    "team_abbr": (appearance.get("attributes") or appearance).get("team_id")
                    or player_attrs.get("team_id"),
                    "stat_type": str(stat_type),
                    "line": float(stat_value),
                    "over_odds": over_odds,
                    "under_odds": under_odds,
                    "start_time": (appearance.get("attributes") or appearance).get("match_at")
                    or (appearance.get("attributes") or appearance).get("start_time"),
                    "raw": attrs,
                }
            )
        for p in props:
            p["player_name"] = " ".join(str(p["player_name"]).split())
        return props
