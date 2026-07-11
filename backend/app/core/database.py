"""SQLAlchemy 2.0 async engine + session, tuned for Vercel serverless + Neon.

Pooling depends on the runtime (see settings.is_serverless):
- Serverless (Vercel): NullPool, so each stateless invocation doesn't hold a
  long-lived pool that would exhaust Postgres connections. Pair with Neon's
  POOLED connection string (host contains "-pooler").
- Persistent server (local dev / VPS): a real pool. NullPool here is a trap —
  it re-establishes a fresh SSL connection to Neon on EVERY request (~2s+ each
  to a remote region), which stacks up to multi-second logins/page loads. A
  pool pays that cost once and reuses the connection.

Behind the Neon pooler (pgbouncer, transaction mode), asyncpg prepared-statement
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
    args: dict = {"ssl": True}
    # asyncpg prepared-statement caching only breaks behind pgbouncer's
    # transaction pooler (the "-pooler" Neon host). On a direct/non-pooled Neon
    # endpoint, disabling it forces a re-PARSE round trip per statement — pure
    # latency cost. So only disable it when actually pooled.
    if "-pooler" in settings.DATABASE_URL:
        args["statement_cache_size"] = 0
    return args


def _pool_kwargs() -> dict:
    if settings.is_serverless:
        # Stateless invocations: never hold a pool.
        return {"poolclass": NullPool}
    # Long-running server: keep a small pool and reuse connections. pre_ping
    # drops dead connections; recycle avoids Neon idle-timeout staleness.
    return {
        "pool_size": 5,
        "max_overflow": 5,
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DB_ECHO,
    connect_args=_connect_args(),
    **_pool_kwargs(),
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
