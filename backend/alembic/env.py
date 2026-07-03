"""Alembic environment — async, wired to app settings and Base.metadata.

Run migrations from the CLI / CI (never at serverless boot):
    alembic revision --autogenerate -m "message"
    alembic upgrade head
"""
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.core.database import Base

# Import all models so their tables register on Base.metadata for autogenerate.
import app.models  # noqa: F401

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# Functional GIN indexes (e.g. the products full-text index) are reflected by
# Postgres in a normalized form that never matches the model's text() expression,
# which makes autogenerate emit spurious "changed index" diffs on every run.
# Exclude them by name here. This does NOT affect Base.metadata.create_all — the
# index still lives in the model and is created by the initial migration.
_AUTOGEN_EXCLUDED_INDEXES = {"idx_products_fts"}


def include_object(obj, name, type_, reflected, compare_to) -> bool:
    if type_ == "index" and name in _AUTOGEN_EXCLUDED_INDEXES:
        return False
    return True


def _connect_args() -> dict:
    if settings.is_local_db:
        return {}
    return {"ssl": True, "statement_cache_size": 0}


def run_migrations_offline() -> None:
    context.configure(
        url=settings.DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        include_object=include_object,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        include_object=include_object,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    connectable = async_engine_from_config(
        {"sqlalchemy.url": settings.DATABASE_URL},
        prefix="sqlalchemy.",
        poolclass=NullPool,
        connect_args=_connect_args(),
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
