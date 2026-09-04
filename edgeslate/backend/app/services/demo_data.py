"""Demo / fallback NBA slate so the app works without API keys."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone


def _tonight(hour: int, minute: int = 0) -> datetime:
    now = datetime.now(timezone.utc)
    base = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
    if base < now:
        base += timedelta(days=1)
    return base


DEMO_TEAMS = [
    {"abbr": "BOS", "name": "Boston Celtics", "conference": "East", "elo": 1680, "offensive_rating": 118.2, "defensive_rating": 109.1},
    {"abbr": "NYK", "name": "New York Knicks", "conference": "East", "elo": 1610, "offensive_rating": 115.4, "defensive_rating": 110.0},
    {"abbr": "MIL", "name": "Milwaukee Bucks", "conference": "East", "elo": 1585, "offensive_rating": 114.8, "defensive_rating": 111.2},
    {"abbr": "CLE", "name": "Cleveland Cavaliers", "conference": "East", "elo": 1635, "offensive_rating": 116.9, "defensive_rating": 109.8},
    {"abbr": "OKC", "name": "Oklahoma City Thunder", "conference": "West", "elo": 1705, "offensive_rating": 119.5, "defensive_rating": 106.4},
    {"abbr": "DEN", "name": "Denver Nuggets", "conference": "West", "elo": 1620, "offensive_rating": 117.1, "defensive_rating": 111.5},
    {"abbr": "MIN", "name": "Minnesota Timberwolves", "conference": "West", "elo": 1595, "offensive_rating": 113.9, "defensive_rating": 108.7},
    {"abbr": "LAL", "name": "Los Angeles Lakers", "conference": "West", "elo": 1570, "offensive_rating": 114.2, "defensive_rating": 112.8},
    {"abbr": "GSW", "name": "Golden State Warriors", "conference": "West", "elo": 1560, "offensive_rating": 115.0, "defensive_rating": 113.4},
    {"abbr": "PHX", "name": "Phoenix Suns", "conference": "West", "elo": 1545, "offensive_rating": 113.6, "defensive_rating": 114.1},
]

DEMO_GAMES = [
    {
        "external_id": "demo-bos-nyk",
        "commence_time": _tonight(23, 30),
        "home_team": "BOS",
        "away_team": "NYK",
        "home_ml": -145,
        "away_ml": 125,
        "market_home": 0.56,
    },
    {
        "external_id": "demo-okc-den",
        "commence_time": _tonight(1, 0),
        "home_team": "OKC",
        "away_team": "DEN",
        "home_ml": -180,
        "away_ml": 155,
        "market_home": 0.62,
    },
    {
        "external_id": "demo-mil-cle",
        "commence_time": _tonight(0, 0),
        "home_team": "MIL",
        "away_team": "CLE",
        "home_ml": 110,
        "away_ml": -130,
        "market_home": 0.44,
    },
    {
        "external_id": "demo-lal-gsw",
        "commence_time": _tonight(2, 30),
        "home_team": "LAL",
        "away_team": "GSW",
        "home_ml": -115,
        "away_ml": -105,
        "market_home": 0.51,
    },
    {
        "external_id": "demo-min-phx",
        "commence_time": _tonight(2, 0),
        "home_team": "MIN",
        "away_team": "PHX",
        "home_ml": -135,
        "away_ml": 115,
        "market_home": 0.54,
    },
]

DEMO_PLAYERS = [
    {"name": "Jayson Tatum", "team_abbr": "BOS", "position": "F", "usage_rate": 0.31, "season_avg_pts": 27.2, "season_avg_reb": 8.4, "season_avg_ast": 5.1, "season_avg_fg3m": 3.2},
    {"name": "Jaylen Brown", "team_abbr": "BOS", "position": "G", "usage_rate": 0.28, "season_avg_pts": 23.8, "season_avg_reb": 5.6, "season_avg_ast": 4.2, "season_avg_fg3m": 2.1},
    {"name": "Jalen Brunson", "team_abbr": "NYK", "position": "G", "usage_rate": 0.30, "season_avg_pts": 26.5, "season_avg_reb": 3.4, "season_avg_ast": 7.0, "season_avg_fg3m": 2.4},
    {"name": "Karl-Anthony Towns", "team_abbr": "NYK", "position": "C", "usage_rate": 0.26, "season_avg_pts": 24.1, "season_avg_reb": 12.2, "season_avg_ast": 2.8, "season_avg_fg3m": 2.0},
    {"name": "Shai Gilgeous-Alexander", "team_abbr": "OKC", "position": "G", "usage_rate": 0.34, "season_avg_pts": 31.4, "season_avg_reb": 5.2, "season_avg_ast": 6.3, "season_avg_fg3m": 1.5},
    {"name": "Nikola Jokic", "team_abbr": "DEN", "position": "C", "usage_rate": 0.29, "season_avg_pts": 26.8, "season_avg_reb": 12.5, "season_avg_ast": 9.8, "season_avg_fg3m": 1.1},
    {"name": "Giannis Antetokounmpo", "team_abbr": "MIL", "position": "F", "usage_rate": 0.33, "season_avg_pts": 30.2, "season_avg_reb": 11.4, "season_avg_ast": 6.1, "season_avg_fg3m": 0.6},
    {"name": "Donovan Mitchell", "team_abbr": "CLE", "position": "G", "usage_rate": 0.30, "season_avg_pts": 25.9, "season_avg_reb": 4.5, "season_avg_ast": 5.4, "season_avg_fg3m": 3.0},
    {"name": "Anthony Edwards", "team_abbr": "MIN", "position": "G", "usage_rate": 0.31, "season_avg_pts": 26.1, "season_avg_reb": 5.3, "season_avg_ast": 4.8, "season_avg_fg3m": 2.6},
    {"name": "LeBron James", "team_abbr": "LAL", "position": "F", "usage_rate": 0.28, "season_avg_pts": 24.4, "season_avg_reb": 7.5, "season_avg_ast": 8.1, "season_avg_fg3m": 2.0},
    {"name": "Stephen Curry", "team_abbr": "GSW", "position": "G", "usage_rate": 0.30, "season_avg_pts": 25.0, "season_avg_reb": 4.4, "season_avg_ast": 5.9, "season_avg_fg3m": 4.5},
    {"name": "Kevin Durant", "team_abbr": "PHX", "position": "F", "usage_rate": 0.29, "season_avg_pts": 26.7, "season_avg_reb": 6.4, "season_avg_ast": 4.5, "season_avg_fg3m": 2.2},
]

# Historical graded picks for backtest demo (model_prob buckets around 55–70%)
DEMO_HISTORICAL_PICKS = [
    # when we said ~55%, outcomes
    *[{"model_prob": 0.55, "won": True} for _ in range(28)],
    *[{"model_prob": 0.55, "won": False} for _ in range(22)],
    # ~60%
    *[{"model_prob": 0.60, "won": True} for _ in range(64)],
    *[{"model_prob": 0.60, "won": False} for _ in range(36)],
    # ~65%
    *[{"model_prob": 0.65, "won": True} for _ in range(72)],
    *[{"model_prob": 0.65, "won": False} for _ in range(38)],
    # ~70%
    *[{"model_prob": 0.70, "won": True} for _ in range(88)],
    *[{"model_prob": 0.70, "won": False} for _ in range(42)],
    # ~75%
    *[{"model_prob": 0.75, "won": True} for _ in range(55)],
    *[{"model_prob": 0.75, "won": False} for _ in range(20)],
    # ~52% near threshold
    *[{"model_prob": 0.52, "won": True} for _ in range(40)],
    *[{"model_prob": 0.52, "won": False} for _ in range(38)],
]
