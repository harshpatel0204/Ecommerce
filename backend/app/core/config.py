"""Application settings loaded from environment variables via pydantic-settings.

All configuration for BharatShop lives here. Never read os.environ directly
elsewhere — import `settings` from this module instead.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ------------------------------------------------------------------ App
    APP_NAME: str = "BharatShop"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    # Comma-separated dev origins allowed for CORS in local cross-port dev.
    # In production FE + BE share one Vercel domain, so this stays empty (no CORS).
    DEV_ALLOWED_ORIGINS: str = ""
    # Public site URL — used in transactional email links.
    FRONTEND_URL: str = "http://localhost:5173"

    # -------------------------------------------------------------- Admin seed
    ADMIN_EMAIL: str = "admin@bharatshop.local"
    ADMIN_PASSWORD: str = "change-me-strong"

    # ----------------------------------------------------------------- Security
    SECRET_KEY: str = "dev-secret-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    GOOGLE_CLIENT_ID: str = ""
    FIREBASE_PROJECT_ID: str = ""

    # ----------------------------------------------------------------- Database
    # Use the Neon POOLED connection string for serverless (host contains "-pooler").
    # Driver must be asyncpg: postgresql+asyncpg://...
    DATABASE_URL: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/bharatshop"
    )
    DB_ECHO: bool = False

    # ----------------------------------------------------------------- Razorpay
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""

    # --------------------------------------------------------------- Shiprocket
    SHIPROCKET_EMAIL: str = ""
    SHIPROCKET_PASSWORD: str = ""
    SHIPROCKET_PICKUP_PINCODE: str = ""

    # ------------------------------------------------------------------- Images
    # Images are stored in Postgres as BYTEA and served via /api/images/{id}.
    MAX_IMAGE_UPLOAD_MB: int = 5
    IMAGE_ALLOWED_TYPES: str = "image/jpeg,image/png,image/webp"

    # -------------------------------------------------------------------- Email
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "orders@bharatshop.local"

    # --------------------------------------------------------------- Properties
    @property
    def dev_allowed_origins(self) -> list[str]:
        return [o.strip() for o in self.DEV_ALLOWED_ORIGINS.split(",") if o.strip()]

    @property
    def image_allowed_types(self) -> set[str]:
        return {t.strip() for t in self.IMAGE_ALLOWED_TYPES.split(",") if t.strip()}

    @property
    def max_image_upload_bytes(self) -> int:
        return self.MAX_IMAGE_UPLOAD_MB * 1024 * 1024

    @property
    def is_local_db(self) -> bool:
        return "localhost" in self.DATABASE_URL or "127.0.0.1" in self.DATABASE_URL


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
