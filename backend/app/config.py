from pydantic_settings import BaseSettings, SettingsConfigDict
from os import urandom


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    APP_NAME: str = "RealDoor"
    DEBUG: bool = False
    SESSION_TTL_SECONDS: int = 86400
    ENCRYPTION_KEY: bytes = urandom(32)
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_DOCUMENT_TYPES: list[str] = ["application/pdf", "image/png", "image/jpeg", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]


settings = Settings()
