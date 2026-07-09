"""DB-backed rate-limit counters (serverless-safe).

The backend runs as stateless Vercel functions, so in-memory limiters (slowapi
et al.) reset on every cold start and don't share state between instances.
Fixed-window counters live in Postgres instead — one upsert per guarded request.
"""
from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import UUIDMixin


class RateLimitCounter(UUIDMixin, Base):
    __tablename__ = "rate_limit_counters"

    # "{scope}:{client-ip}", e.g. "auth-login:203.0.113.7"
    key: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    window_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    def __repr__(self) -> str:
        return f"<RateLimitCounter {self.key} {self.count}>"
