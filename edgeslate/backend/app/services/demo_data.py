"""Demo slates for NBA, NFL, and College Football."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone


def _tonight(hour: int, minute: int = 0) -> datetime:
    now = datetime.now(timezone.utc)
    base = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
    if base < now:
        base += timedelta(days=1)
    return base


# ---------- NBA ----------
NBA_TEAMS = [
    {"abbr": "BOS", "name": "Boston Celtics", "conference": "East", "elo": 1680, "offensive_rating": 118.2, "defensive_rating": 109.1, "sport": "NBA"},
    {"abbr": "NYK", "name": "New York Knicks", "conference": "East", "elo": 1610, "offensive_rating": 115.4, "defensive_rating": 110.0, "sport": "NBA"},
    {"abbr": "OKC", "name": "Oklahoma City Thunder", "conference": "West", "elo": 1705, "offensive_rating": 119.5, "defensive_rating": 106.4, "sport": "NBA"},
    {"abbr": "DEN", "name": "Denver Nuggets", "conference": "West", "elo": 1620, "offensive_rating": 117.1, "defensive_rating": 111.5, "sport": "NBA"},
    {"abbr": "MIL", "name": "Milwaukee Bucks", "conference": "East", "elo": 1585, "offensive_rating": 114.8, "defensive_rating": 111.2, "sport": "NBA"},
    {"abbr": "CLE", "name": "Cleveland Cavaliers", "conference": "East", "elo": 1635, "offensive_rating": 116.9, "defensive_rating": 109.8, "sport": "NBA"},
    {"abbr": "MIN", "name": "Minnesota Timberwolves", "conference": "West", "elo": 1595, "offensive_rating": 113.9, "defensive_rating": 108.7, "sport": "NBA"},
    {"abbr": "PHX", "name": "Phoenix Suns", "conference": "West", "elo": 1545, "offensive_rating": 113.6, "defensive_rating": 114.1, "sport": "NBA"},
    {"abbr": "LAL", "name": "Los Angeles Lakers", "conference": "West", "elo": 1570, "offensive_rating": 114.2, "defensive_rating": 112.8, "sport": "NBA"},
    {"abbr": "GSW", "name": "Golden State Warriors", "conference": "West", "elo": 1560, "offensive_rating": 115.0, "defensive_rating": 113.4, "sport": "NBA"},
]

NBA_GAMES = [
    {"external_id": "demo-nba-bos-nyk", "sport": "NBA", "commence_time": _tonight(23, 30), "home_team": "BOS", "away_team": "NYK", "home_ml": -145, "away_ml": 125, "market_home": 0.56},
    {"external_id": "demo-nba-okc-den", "sport": "NBA", "commence_time": _tonight(1, 0), "home_team": "OKC", "away_team": "DEN", "home_ml": -180, "away_ml": 155, "market_home": 0.62},
    {"external_id": "demo-nba-mil-cle", "sport": "NBA", "commence_time": _tonight(0, 0), "home_team": "MIL", "away_team": "CLE", "home_ml": 110, "away_ml": -130, "market_home": 0.44},
    {"external_id": "demo-nba-min-phx", "sport": "NBA", "commence_time": _tonight(2, 0), "home_team": "MIN", "away_team": "PHX", "home_ml": -135, "away_ml": 115, "market_home": 0.54},
    {"external_id": "demo-nba-lal-gsw", "sport": "NBA", "commence_time": _tonight(2, 30), "home_team": "LAL", "away_team": "GSW", "home_ml": -115, "away_ml": -105, "market_home": 0.51},
]

NBA_PLAYERS = [
    {"name": "Jayson Tatum", "team_abbr": "BOS", "position": "F", "sport": "NBA", "usage_rate": 0.31, "season_avg_pts": 27.2, "season_avg_reb": 8.4, "season_avg_ast": 5.1, "season_avg_fg3m": 3.2},
    {"name": "Jalen Brunson", "team_abbr": "NYK", "position": "G", "sport": "NBA", "usage_rate": 0.30, "season_avg_pts": 26.5, "season_avg_reb": 3.4, "season_avg_ast": 7.0, "season_avg_fg3m": 2.4},
    {"name": "Shai Gilgeous-Alexander", "team_abbr": "OKC", "position": "G", "sport": "NBA", "usage_rate": 0.34, "season_avg_pts": 31.4, "season_avg_reb": 5.2, "season_avg_ast": 6.3, "season_avg_fg3m": 1.5},
    {"name": "Nikola Jokic", "team_abbr": "DEN", "position": "C", "sport": "NBA", "usage_rate": 0.29, "season_avg_pts": 26.8, "season_avg_reb": 12.5, "season_avg_ast": 9.8, "season_avg_fg3m": 1.1},
    {"name": "Giannis Antetokounmpo", "team_abbr": "MIL", "position": "F", "sport": "NBA", "usage_rate": 0.33, "season_avg_pts": 30.2, "season_avg_reb": 11.4, "season_avg_ast": 6.1, "season_avg_fg3m": 0.6},
    {"name": "Donovan Mitchell", "team_abbr": "CLE", "position": "G", "sport": "NBA", "usage_rate": 0.30, "season_avg_pts": 25.9, "season_avg_reb": 4.5, "season_avg_ast": 5.4, "season_avg_fg3m": 3.0},
    {"name": "Anthony Edwards", "team_abbr": "MIN", "position": "G", "sport": "NBA", "usage_rate": 0.31, "season_avg_pts": 26.1, "season_avg_reb": 5.3, "season_avg_ast": 4.8, "season_avg_fg3m": 2.6},
    {"name": "LeBron James", "team_abbr": "LAL", "position": "F", "sport": "NBA", "usage_rate": 0.28, "season_avg_pts": 24.4, "season_avg_reb": 7.5, "season_avg_ast": 8.1, "season_avg_fg3m": 2.0},
]

NBA_PROPS = [
    ("Jayson Tatum", "BOS", "Points", 27.5),
    ("Jalen Brunson", "NYK", "Points", 26.5),
    ("Shai Gilgeous-Alexander", "OKC", "Points", 31.5),
    ("Nikola Jokic", "DEN", "Pts+Rebs+Asts", 48.5),
    ("Giannis Antetokounmpo", "MIL", "Points", 29.5),
    ("Donovan Mitchell", "CLE", "Points", 25.5),
    ("Anthony Edwards", "MIN", "Points", 26.5),
    ("LeBron James", "LAL", "Assists", 7.5),
]

# ---------- NFL ----------
NFL_TEAMS = [
    {"abbr": "KC", "name": "Kansas City Chiefs", "conference": "AFC", "elo": 1685, "offensive_rating": 28.4, "defensive_rating": 18.2, "sport": "NFL"},
    {"abbr": "BUF", "name": "Buffalo Bills", "conference": "AFC", "elo": 1660, "offensive_rating": 27.1, "defensive_rating": 19.0, "sport": "NFL"},
    {"abbr": "BAL", "name": "Baltimore Ravens", "conference": "AFC", "elo": 1645, "offensive_rating": 26.8, "defensive_rating": 18.8, "sport": "NFL"},
    {"abbr": "DET", "name": "Detroit Lions", "conference": "NFC", "elo": 1635, "offensive_rating": 27.5, "defensive_rating": 20.1, "sport": "NFL"},
    {"abbr": "SF", "name": "San Francisco 49ers", "conference": "NFC", "elo": 1620, "offensive_rating": 25.9, "defensive_rating": 17.5, "sport": "NFL"},
    {"abbr": "PHI", "name": "Philadelphia Eagles", "conference": "NFC", "elo": 1610, "offensive_rating": 26.2, "defensive_rating": 19.4, "sport": "NFL"},
    {"abbr": "DAL", "name": "Dallas Cowboys", "conference": "NFC", "elo": 1555, "offensive_rating": 24.0, "defensive_rating": 22.5, "sport": "NFL"},
    {"abbr": "MIA", "name": "Miami Dolphins", "conference": "AFC", "elo": 1540, "offensive_rating": 24.8, "defensive_rating": 23.1, "sport": "NFL"},
]

NFL_GAMES = [
    {"external_id": "demo-nfl-kc-buf", "sport": "NFL", "commence_time": _tonight(20, 20), "home_team": "KC", "away_team": "BUF", "home_ml": -135, "away_ml": 115, "market_home": 0.55},
    {"external_id": "demo-nfl-det-phi", "sport": "NFL", "commence_time": _tonight(17, 0), "home_team": "DET", "away_team": "PHI", "home_ml": -110, "away_ml": -110, "market_home": 0.50},
    {"external_id": "demo-nfl-sf-dal", "sport": "NFL", "commence_time": _tonight(0, 15), "home_team": "SF", "away_team": "DAL", "home_ml": -165, "away_ml": 140, "market_home": 0.60},
    {"external_id": "demo-nfl-bal-mia", "sport": "NFL", "commence_time": _tonight(17, 25), "home_team": "BAL", "away_team": "MIA", "home_ml": -190, "away_ml": 160, "market_home": 0.63},
]

NFL_PLAYERS = [
    {"name": "Patrick Mahomes", "team_abbr": "KC", "position": "QB", "sport": "NFL", "usage_rate": 0.99, "season_avg_pts": 275.0, "season_avg_reb": 1.8, "season_avg_ast": 0.0, "season_avg_fg3m": 0.0},
    {"name": "Josh Allen", "team_abbr": "BUF", "position": "QB", "sport": "NFL", "usage_rate": 0.99, "season_avg_pts": 268.0, "season_avg_reb": 2.4, "season_avg_ast": 0.0, "season_avg_fg3m": 0.0},
    {"name": "Lamar Jackson", "team_abbr": "BAL", "position": "QB", "sport": "NFL", "usage_rate": 0.99, "season_avg_pts": 240.0, "season_avg_reb": 3.1, "season_avg_ast": 0.0, "season_avg_fg3m": 0.0},
    {"name": "Jared Goff", "team_abbr": "DET", "position": "QB", "sport": "NFL", "usage_rate": 0.99, "season_avg_pts": 255.0, "season_avg_reb": 0.4, "season_avg_ast": 0.0, "season_avg_fg3m": 0.0},
    {"name": "Christian McCaffrey", "team_abbr": "SF", "position": "RB", "sport": "NFL", "usage_rate": 0.85, "season_avg_pts": 95.0, "season_avg_reb": 0.0, "season_avg_ast": 55.0, "season_avg_fg3m": 0.0},
    {"name": "A.J. Brown", "team_abbr": "PHI", "position": "WR", "sport": "NFL", "usage_rate": 0.70, "season_avg_pts": 0.0, "season_avg_reb": 0.0, "season_avg_ast": 85.0, "season_avg_fg3m": 5.5},
    {"name": "CeeDee Lamb", "team_abbr": "DAL", "position": "WR", "sport": "NFL", "usage_rate": 0.72, "season_avg_pts": 0.0, "season_avg_reb": 0.0, "season_avg_ast": 90.0, "season_avg_fg3m": 6.2},
    {"name": "Tyreek Hill", "team_abbr": "MIA", "position": "WR", "sport": "NFL", "usage_rate": 0.68, "season_avg_pts": 0.0, "season_avg_reb": 0.0, "season_avg_ast": 88.0, "season_avg_fg3m": 5.8},
]

# Football: season_avg_pts ≈ pass/rush yards proxy, season_avg_ast ≈ rec yards, season_avg_fg3m ≈ receptions/TDs
NFL_PROPS = [
    ("Patrick Mahomes", "KC", "Pass Yards", 275.5),
    ("Josh Allen", "BUF", "Pass Yards", 268.5),
    ("Lamar Jackson", "BAL", "Rush Yards", 55.5),
    ("Jared Goff", "DET", "Pass Yards", 255.5),
    ("Christian McCaffrey", "SF", "Rush Yards", 85.5),
    ("A.J. Brown", "PHI", "Receiving Yards", 78.5),
    ("CeeDee Lamb", "DAL", "Receptions", 6.5),
    ("Tyreek Hill", "MIA", "Receiving Yards", 82.5),
]

# ---------- CFB ----------
CFB_TEAMS = [
    {"abbr": "ALA", "name": "Alabama Crimson Tide", "conference": "SEC", "elo": 1720, "offensive_rating": 38.0, "defensive_rating": 14.0, "sport": "CFB"},
    {"abbr": "UGA", "name": "Georgia Bulldogs", "conference": "SEC", "elo": 1740, "offensive_rating": 36.5, "defensive_rating": 12.5, "sport": "CFB"},
    {"abbr": "OHIO", "name": "Ohio State Buckeyes", "conference": "Big Ten", "elo": 1710, "offensive_rating": 39.2, "defensive_rating": 15.1, "sport": "CFB"},
    {"abbr": "ORE", "name": "Oregon Ducks", "conference": "Big Ten", "elo": 1685, "offensive_rating": 40.1, "defensive_rating": 17.8, "sport": "CFB"},
    {"abbr": "TEX", "name": "Texas Longhorns", "conference": "SEC", "elo": 1695, "offensive_rating": 37.4, "defensive_rating": 16.2, "sport": "CFB"},
    {"abbr": "MICH", "name": "Michigan Wolverines", "conference": "Big Ten", "elo": 1650, "offensive_rating": 32.0, "defensive_rating": 14.8, "sport": "CFB"},
    {"abbr": "ND", "name": "Notre Dame Fighting Irish", "conference": "IND", "elo": 1640, "offensive_rating": 34.5, "defensive_rating": 16.9, "sport": "CFB"},
    {"abbr": "PSU", "name": "Penn State Nittany Lions", "conference": "Big Ten", "elo": 1630, "offensive_rating": 33.8, "defensive_rating": 15.5, "sport": "CFB"},
]

CFB_GAMES = [
    {"external_id": "demo-cfb-uga-ala", "sport": "CFB", "commence_time": _tonight(19, 30), "home_team": "UGA", "away_team": "ALA", "home_ml": -125, "away_ml": 105, "market_home": 0.53},
    {"external_id": "demo-cfb-ohio-ore", "sport": "CFB", "commence_time": _tonight(0, 0), "home_team": "OHIO", "away_team": "ORE", "home_ml": -140, "away_ml": 120, "market_home": 0.56},
    {"external_id": "demo-cfb-tex-mich", "sport": "CFB", "commence_time": _tonight(16, 0), "home_team": "TEX", "away_team": "MICH", "home_ml": -155, "away_ml": 130, "market_home": 0.58},
    {"external_id": "demo-cfb-nd-psu", "sport": "CFB", "commence_time": _tonight(19, 0), "home_team": "ND", "away_team": "PSU", "home_ml": -110, "away_ml": -110, "market_home": 0.50},
]

CFB_PLAYERS = [
    {"name": "Jalen Milroe", "team_abbr": "ALA", "position": "QB", "sport": "CFB", "usage_rate": 0.95, "season_avg_pts": 220.0, "season_avg_reb": 2.0, "season_avg_ast": 0.0, "season_avg_fg3m": 0.0},
    {"name": "Carson Beck", "team_abbr": "UGA", "position": "QB", "sport": "CFB", "usage_rate": 0.95, "season_avg_pts": 245.0, "season_avg_reb": 0.5, "season_avg_ast": 0.0, "season_avg_fg3m": 0.0},
    {"name": "Will Howard", "team_abbr": "OHIO", "position": "QB", "sport": "CFB", "usage_rate": 0.95, "season_avg_pts": 235.0, "season_avg_reb": 1.2, "season_avg_ast": 0.0, "season_avg_fg3m": 0.0},
    {"name": "Dillon Gabriel", "team_abbr": "ORE", "position": "QB", "sport": "CFB", "usage_rate": 0.95, "season_avg_pts": 260.0, "season_avg_reb": 0.8, "season_avg_ast": 0.0, "season_avg_fg3m": 0.0},
    {"name": "Quinn Ewers", "team_abbr": "TEX", "position": "QB", "sport": "CFB", "usage_rate": 0.95, "season_avg_pts": 250.0, "season_avg_reb": 0.6, "season_avg_ast": 0.0, "season_avg_fg3m": 0.0},
    {"name": "Jeremiah Smith", "team_abbr": "OHIO", "position": "WR", "sport": "CFB", "usage_rate": 0.70, "season_avg_pts": 0.0, "season_avg_reb": 0.0, "season_avg_ast": 95.0, "season_avg_fg3m": 6.0},
    {"name": "Tetairoa McMillan", "team_abbr": "TEX", "position": "WR", "sport": "CFB", "usage_rate": 0.68, "season_avg_pts": 0.0, "season_avg_reb": 0.0, "season_avg_ast": 90.0, "season_avg_fg3m": 5.5},
    {"name": "Nicholas Singleton", "team_abbr": "PSU", "position": "RB", "sport": "CFB", "usage_rate": 0.75, "season_avg_pts": 105.0, "season_avg_reb": 0.0, "season_avg_ast": 15.0, "season_avg_fg3m": 0.0},
]

CFB_PROPS = [
    ("Jalen Milroe", "ALA", "Pass Yards", 215.5),
    ("Carson Beck", "UGA", "Pass Yards", 240.5),
    ("Will Howard", "OHIO", "Pass Yards", 230.5),
    ("Dillon Gabriel", "ORE", "Pass Yards", 255.5),
    ("Quinn Ewers", "TEX", "Pass Yards", 245.5),
    ("Jeremiah Smith", "OHIO", "Receiving Yards", 88.5),
    ("Tetairoa McMillan", "TEX", "Receptions", 5.5),
    ("Nicholas Singleton", "PSU", "Rush Yards", 95.5),
]

# Back-compat aliases used by older imports
DEMO_TEAMS = NBA_TEAMS
DEMO_GAMES = NBA_GAMES
DEMO_PLAYERS = NBA_PLAYERS

DEMO_BY_SPORT = {
    "NBA": {"teams": NBA_TEAMS, "games": NBA_GAMES, "players": NBA_PLAYERS, "props": NBA_PROPS},
    "NFL": {"teams": NFL_TEAMS, "games": NFL_GAMES, "players": NFL_PLAYERS, "props": NFL_PROPS},
    "CFB": {"teams": CFB_TEAMS, "games": CFB_GAMES, "players": CFB_PLAYERS, "props": CFB_PROPS},
}

DEMO_HISTORICAL_PICKS = [
    *[{"model_prob": 0.55, "won": True} for _ in range(28)],
    *[{"model_prob": 0.55, "won": False} for _ in range(22)],
    *[{"model_prob": 0.60, "won": True} for _ in range(64)],
    *[{"model_prob": 0.60, "won": False} for _ in range(36)],
    *[{"model_prob": 0.65, "won": True} for _ in range(72)],
    *[{"model_prob": 0.65, "won": False} for _ in range(38)],
    *[{"model_prob": 0.70, "won": True} for _ in range(88)],
    *[{"model_prob": 0.70, "won": False} for _ in range(42)],
    *[{"model_prob": 0.75, "won": True} for _ in range(55)],
    *[{"model_prob": 0.75, "won": False} for _ in range(20)],
    *[{"model_prob": 0.52, "won": True} for _ in range(40)],
    *[{"model_prob": 0.52, "won": False} for _ in range(38)],
]
