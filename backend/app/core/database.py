"""SQLAlchemy 2.0 async engine + session, tuned for Vercel serverless + Neon.

Serverless notes:
- Use Neon's POOLED connection string (host contains "-pooler").
- Use NullPool so each stateless invocation doesn't hold a long-lived pool that
  would exhaust Postgres connections.
- Behind the Neon pooler (pgbouncer, transaction mode), asyncpg prepared-statement
  caching must be disabled (`statement_cache_size=0`), and SSL must be enabled.
"""
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.core.config import settings


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


def _connect_args() -> dict:
    if settings.is_local_db:
        # Local Postgres: no SSL, prepared statements fine.
        return {}
    # Neon (pooled): disable prepared statement cache for pgbouncer + require SSL.
    return {"ssl": True, "statement_cache_size": 0}


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    poolclass=NullPool,
    connect_args=_connect_args(),
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding a request-scoped async session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
