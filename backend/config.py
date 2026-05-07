"""
Configuration settings for the Essay Scoring System.
All values can be overridden via environment variables or .env file.
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Automated Essay Scoring System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # PostgreSQL (optional - system runs on simulated data if not set)
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "essay_scoring"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "password"

    # MongoDB (optional - system runs on simulated data if not set)
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB: str = "essay_scoring"

    # NLP Settings
    USE_LANGUAGE_TOOL: bool = False        # Set True if Java is installed
    USE_SENTENCE_TRANSFORMERS: bool = False  # Set True for real plagiarism detection
    SIMILARITY_THRESHOLD: float = 0.75    # Plagiarism detection threshold

    # LLM Settings (optional)
    OPENAI_API_KEY: Optional[str] = None
    USE_LLM_FEEDBACK: bool = False        # Falls back to template-based if False

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"
    
    @property
    def allowed_origins_list(self) -> list:
        """Convert comma-separated ALLOWED_ORIGINS string to list."""
        if isinstance(self.ALLOWED_ORIGINS, str):
            return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
        return self.ALLOWED_ORIGINS


settings = Settings()

# Database connection strings
POSTGRES_URL = (
    f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}"
    f"@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
)
MONGO_URL = settings.MONGO_URI
