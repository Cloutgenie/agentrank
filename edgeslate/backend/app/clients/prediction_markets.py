"""Prediction-market clients: Polymarket (public Gamma API) + Kalshi.

Polymarket Gamma API (no key required for reads):
  https://gamma-api.polymarket.com/events?active=true&closed=false

Kalshi public market data:
  https://api.elections.kalshi.com/trade-api/v2/markets

Robinhood Prediction Markets do not expose a stable public API for v1 —
we synthesize Robinhood deep links from team matchups when available.
"""

from __future__ import annotations

import logging
import re
from typing import Any, Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import get_settings

logger = logging.getLogger(__name__)

POLYMARKET_EVENTS = "https://gamma-api.polymarket.com/events"
KALSHI_MARKETS = "https://api.elections.kalshi.com/trade-api/v2/markets"

NBA_TEAM_ALIASES = {
    "celtics": "BOS",
    "knicks": "NYK",
    "bucks": "MIL",
    "cavaliers": "CLE",
    "cavs": "CLE",
    "thunder": "OKC",
    "nuggets": "DEN",
    "timberwolves": "MIN",
    "wolves": "MIN",
    "lakers": "LAL",
    "warriors": "GSW",
    "suns": "PHX",
    "heat": "MIA",
    "76ers": "PHI",
    "sixers": "PHI",
    "nets": "BKN",
    "raptors": "TOR",
    "hawks": "ATL",
    "hornets": "CHA",
    "magic": "ORL",
    "wizards": "WAS",
    "pistons": "DET",
    "pacers": "IND",
    "bulls": "CHI",
    "mavericks": "DAL",
    "mavs": "DAL",
    "rockets": "HOU",
    "spurs": "SAS",
    "grizzlies": "MEM",
    "pelicans": "NOP",
    "kings": "SAC",
    "clippers": "LAC",
    "jazz": "UTA",
    "blazers": "POR",
    "trail blazers": "POR",
}


def _find_teams(text: str) -> list[str]:
    lower = text.lower()
    found: list[str] = []
    for alias, abbr in NBA_TEAM_ALIASES.items():
        if alias in lower and abbr not in found:
            found.append(abbr)
    return found


class PolymarketClient:
    def __init__(self) -> None:
        self.enabled = get_settings().polymarket_enabled

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=0.5, min=0.5, max=3))
    async def fetch_nba_win_markets(self) -> list[dict[str, Any]]:
        if not self.enabled:
            return []
        params = {
            "active": "true",
            "closed": "false",
            "limit": 100,
            "tag": "NBA",
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                r = await client.get(POLYMARKET_EVENTS, params=params)
                r.raise_for_status()
                events = r.json()
            except Exception as exc:  # noqa: BLE001
                logger.warning("Polymarket fetch failed: %s", exc)
                return []

        results: list[dict[str, Any]] = []
        for event in events if isinstance(events, list) else []:
            title = event.get("title") or event.get("question") or ""
            teams = _find_teams(title)
            if len(teams) < 2:
                continue
            markets = event.get("markets") or []
            home_prob = away_prob = None
            for m in markets:
                outcomes = m.get("outcomes")
                prices = m.get("outcomePrices")
                if isinstance(outcomes, str):
                    try:
                        import json

                        outcomes = json.loads(outcomes)
                        prices = json.loads(prices) if isinstance(prices, str) else prices
                    except Exception:  # noqa: BLE001
                        continue
                if not outcomes or not prices or len(outcomes) < 2:
                    continue
                for outcome, price in zip(outcomes, prices):
                    t = _find_teams(str(outcome))
                    try:
                        p = float(price)
                    except (TypeError, ValueError):
                        continue
                    if t and t[0] == teams[0]:
                        home_prob = p
                    elif t and t[0] == teams[1]:
                        away_prob = p
            if home_prob is None and away_prob is None:
                continue
            if home_prob is None:
                home_prob = 1.0 - float(away_prob or 0.5)
            if away_prob is None:
                away_prob = 1.0 - float(home_prob)
            results.append(
                {
                    "source": "polymarket",
                    "home_team": teams[0],
                    "away_team": teams[1],
                    "home_prob": float(home_prob),
                    "away_prob": float(away_prob),
                    "title": title,
                    "slug": event.get("slug"),
                    "url": f"https://polymarket.com/event/{event.get('slug')}" if event.get("slug") else None,
                }
            )
        return results


class KalshiClient:
    def __init__(self, api_key: Optional[str] = None) -> None:
        self.api_key = api_key if api_key is not None else get_settings().kalshi_api_key

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=0.5, min=0.5, max=3))
    async def fetch_nba_markets(self) -> list[dict[str, Any]]:
        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        params = {"limit": 100, "status": "open", "series_ticker": "KXNBAGAME"}
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                r = await client.get(KALSHI_MARKETS, params=params, headers=headers)
                if r.status_code >= 400:
                    # Fallback search without series filter
                    r = await client.get(
                        KALSHI_MARKETS,
                        params={"limit": 100, "status": "open"},
                        headers=headers,
                    )
                r.raise_for_status()
                payload = r.json()
            except Exception as exc:  # noqa: BLE001
                logger.warning("Kalshi fetch failed: %s", exc)
                return []

        markets = payload.get("markets") or []
        results: list[dict[str, Any]] = []
        for m in markets:
            title = m.get("title") or m.get("subtitle") or m.get("ticker") or ""
            if not re.search(r"nba|basketball", title, re.I) and "KXNBA" not in str(m.get("ticker", "")):
                continue
            teams = _find_teams(title)
            yes_bid = m.get("yes_bid") or m.get("last_price")
            if yes_bid is None:
                continue
            try:
                yes_prob = float(yes_bid) / 100.0 if float(yes_bid) > 1 else float(yes_bid)
            except (TypeError, ValueError):
                continue
            results.append(
                {
                    "source": "kalshi",
                    "teams": teams,
                    "title": title,
                    "yes_prob": yes_prob,
                    "ticker": m.get("ticker"),
                    "url": f"https://kalshi.com/markets/{m.get('ticker')}" if m.get("ticker") else None,
                }
            )
        return results


def robinhood_prediction_deep_link(home: str, away: str) -> str:
    """Best-effort Robinhood Prediction Markets deep link (search-style)."""
    q = f"{away}%20@%20{home}%20NBA"
    return f"https://robinhood.com/prediction-markets/?search={q}"
