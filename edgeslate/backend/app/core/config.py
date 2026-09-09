from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+psycopg://edgeslate:edgeslate@localhost:5432/edgeslate"
    odds_api_key: str = ""
    balldontlie_api_key: str = ""
    kalshi_api_key: str = ""
    polymarket_enabled: bool = True
    edge_threshold_pp: float = 2.0
    market_weight: float = 0.70
    elo_weight: float = 0.30
    monte_carlo_sims: int = 10_000
    max_team_exposure: int = 3
    enable_scheduler: bool = False
    use_demo_data: bool = True
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    sport_key: str = "basketball_nba"
    prizepicks_league_id: int = 7  # NBA
    underdog_sport: str = "NBA"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
