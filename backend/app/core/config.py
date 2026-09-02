"""Application configuration loaded from environment variables and .env."""

import secrets
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parents[3]
DEFAULT_DB_FILE = (ROOT_DIR / "talentos.db").as_posix()


class Settings(BaseSettings):
    """Runtime settings for the TalentOS backend."""

    PROJECT_NAME: str = "TalentOS"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = f"sqlite+aiosqlite:///{DEFAULT_DB_FILE}"
    REDIS_URL: str = "redis://localhost:6379/0"
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    GROQ_API_KEY: str | None = None
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    GEMINI_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # Security settings
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    ADMIN_API_KEY: str = secrets.token_urlsafe(32)

    # Rate limiting
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 60

    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    model_config = SettingsConfigDict(
        env_file=("backend/.env", ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Return the cached application settings instance."""

    return Settings()


settings = get_settings()
