"""DOCeasy - Application configuration."""

import os
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "DOCeasy"
    VERSION: str = "1.0.0"
    DEBUG: bool = True

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    # File storage
    TEMP_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "temp")
    MAX_FILE_SIZE_MB: int = 100
    MAX_FILES_PER_JOB: int = 20
    JOB_EXPIRY_SECONDS: int = 3600  # 1 hour

    # Upload limits
    MAX_UPLOAD_SIZE: int = 100 * 1024 * 1024  # 100MB

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
