"""DB-cached external service tokens (serverless-safe).

The backend runs as stateless Vercel functions, so module-level in-memory caches
don't survive between invocations. The Shiprocket bearer token (valid 24h) is
cached here and refreshed only when near expiry.
"""
from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import UUIDMixin


class ServiceToken(UUIDMixin, Base):
    __tablename__ = "service_tokens"

    service_name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    token: Mapped[str] = mapped_column(Text, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self) -> str:
        return f"<ServiceToken {self.service_name}>"
