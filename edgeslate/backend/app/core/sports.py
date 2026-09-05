"""Supported sports registry for EdgeSlate (NBA, NFL, CFB)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable


@dataclass(frozen=True)
class SportConfig:
    id: str  # NBA | NFL | CFB
    label: str
    odds_key: str
    prizepicks_league_id: int
    underdog_keys: tuple[str, ...]
    prop_markets: tuple[str, ...]
    home_advantage_elo: float
    efficiency_baseline: float
    polymarket_tag: str
    kalshi_series: str


SPORTS: dict[str, SportConfig] = {
    "NBA": SportConfig(
        id="NBA",
        label="NBA",
        odds_key="basketball_nba",
        prizepicks_league_id=7,
        underdog_keys=("nba", "3"),
        prop_markets=(
            "player_points",
            "player_rebounds",
            "player_assists",
            "player_threes",
        ),
        home_advantage_elo=60.0,
        efficiency_baseline=112.0,
        polymarket_tag="NBA",
        kalshi_series="KXNBAGAME",
    ),
    "NFL": SportConfig(
        id="NFL",
        label="NFL",
        odds_key="americanfootball_nfl",
        prizepicks_league_id=9,
        underdog_keys=("nfl", "1"),
        prop_markets=(
            "player_pass_yds",
            "player_rush_yds",
            "player_reception_yds",
            "player_pass_tds",
            "player_receptions",
        ),
        home_advantage_elo=48.0,
        efficiency_baseline=22.0,  # points-ish baseline for football ratings
        polymarket_tag="NFL",
        kalshi_series="KXNFLGAME",
    ),
    "CFB": SportConfig(
        id="CFB",
        label="College Football",
        odds_key="americanfootball_ncaaf",
        prizepicks_league_id=15,
        underdog_keys=("cfb", "ncaaf", "2"),
        prop_markets=(
            "player_pass_yds",
            "player_rush_yds",
            "player_reception_yds",
            "player_pass_tds",
            "player_receptions",
        ),
        home_advantage_elo=55.0,
        efficiency_baseline=28.0,
        polymarket_tag="CFB",
        kalshi_series="KXNCAAFGAME",
    ),
}

DEFAULT_SPORT = "NFL"
SUPPORTED_SPORTS = tuple(SPORTS.keys())


def normalize_sport(value: str | None) -> str:
    if not value:
        return DEFAULT_SPORT
    key = value.strip().upper()
    aliases = {
        "NCAAF": "CFB",
        "COLLEGEFOOTBALL": "CFB",
        "COLLEGE_FOOTBALL": "CFB",
        "FOOTBALL": "NFL",
        "BASKETBALL_NBA": "NBA",
        "AMERICANFOOTBALL_NFL": "NFL",
        "AMERICANFOOTBALL_NCAAF": "CFB",
    }
    key = aliases.get(key.replace(" ", ""), key)
    if key not in SPORTS:
        raise ValueError(f"Unsupported sport '{value}'. Use one of: {', '.join(SUPPORTED_SPORTS)}")
    return key


def get_sport(value: str | None = None) -> SportConfig:
    return SPORTS[normalize_sport(value)]


def list_sports() -> list[dict[str, str]]:
    return [{"id": s.id, "label": s.label, "odds_key": s.odds_key} for s in SPORTS.values()]


def iter_sports(ids: Iterable[str] | None = None) -> list[SportConfig]:
    if ids is None:
        return list(SPORTS.values())
    return [get_sport(i) for i in ids]
