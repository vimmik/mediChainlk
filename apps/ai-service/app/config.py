from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    API_URL: str = "http://localhost:3001"
    PORT: int = 8000
    DEBUG: bool = True
    AWS_REGION: str = "ap-south-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    S3_BUCKET_NAME: str = "medichainlk-prescriptions"
    GOOGLE_APPLICATION_CREDENTIALS: str = ""
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/medichainlk_dev"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
