import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration with environment variable loading."""
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "TripWise"

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./tripwise.db"

    # Supabase Auth
    SUPABASE_URL: str = ""
    SUPABASE_JWT_SECRET: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # External APIs
    OPENTRIPMAP_KEY: str = ""
    GEOAPIFY_KEY: str = ""
    AMADEUS_CLIENT_ID: str = ""
    AMADEUS_CLIENT_SECRET: str = ""
    DUFFEL_TOKEN: str = ""
    CALENDARIFIC_KEY: str = ""
    TICKETMASTER_KEY: str = ""
    TICKETMASTER_SECRET: str = ""
    TOMTOM_KEY: str = ""
    UNSPLASH_KEY: str = ""
    UNSPLASH_SECRET: str = ""
    EXCHANGERATE_API_KEY: str = ""

    # Razorpay Sandbox
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]


settings = Settings()
