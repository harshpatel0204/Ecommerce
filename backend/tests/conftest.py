"""Pytest fixtures: async client, schema setup, auth headers, mocked externals.

Requires a Postgres reachable via DATABASE_URL (a throwaway DB — the schema is
created and dropped around the session). In CI a postgres service provides it.

The app uses a module-level async engine with NullPool, so no connection is
reused across event loops. Schema create/drop runs in isolated ``asyncio.run``
calls (a sync session fixture); all async fixtures are function-scoped.
"""
import asyncio
import os
import uuid

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.core.config import settings

# HARD GUARD: this suite DROPS ALL TABLES at session end. Running it against
# the shared Neon dev/prod DB destroys the schema while leaving alembic_version
# behind (the "stamped at head but no tables" incident of 2026-07-08). Point
# DATABASE_URL at a throwaway local Postgres, or set ALLOW_REMOTE_TEST_DB=1 if
# you really mean it.
if "neon.tech" in settings.DATABASE_URL and not os.environ.get("ALLOW_REMOTE_TEST_DB"):
    pytest.exit(
        "Refusing to run tests: DATABASE_URL points at Neon and this suite "
        "drops all tables afterwards. Use a local throwaway DB "
        "(e.g. docker-compose postgres) or set ALLOW_REMOTE_TEST_DB=1.",
        returncode=2,
    )
from app.core.database import AsyncSessionLocal, Base, engine
from app.core.security import hash_password
from app.main import app
from app.models.user import User

# Deterministic secrets for signature checks in tests.
settings.SECRET_KEY = "test-secret"
settings.RAZORPAY_KEY_ID = "rzp_test_x"
settings.RAZORPAY_KEY_SECRET = "testsecret"
settings.RAZORPAY_WEBHOOK_SECRET = "whsecret"
settings.RESEND_API_KEY = ""  # suppress real email sends


async def _create_all() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def _drop_all() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture(scope="session", autouse=True)
def _schema():
    asyncio.run(_create_all())
    yield
    asyncio.run(_drop_all())


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


async def _make_user(email: str, *, admin: bool = False) -> None:
    async with AsyncSessionLocal() as db:
        db.add(
            User(
                email=email,
                hashed_password=hash_password("Password123"),
                full_name="Admin" if admin else "Customer",
                is_admin=admin,
                is_active=True,
            )
        )
        await db.commit()


async def _auth_header(client: AsyncClient, email: str) -> dict:
    resp = await client.post("/api/auth/login", json={"email": email, "password": "Password123"})
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


@pytest_asyncio.fixture
async def admin_headers(client: AsyncClient) -> dict:
    email = f"admin_{uuid.uuid4().hex[:8]}@example.com"
    await _make_user(email, admin=True)
    return await _auth_header(client, email)


@pytest_asyncio.fixture
async def customer_headers(client: AsyncClient) -> dict:
    email = f"cust_{uuid.uuid4().hex[:8]}@example.com"
    await _make_user(email)
    return await _auth_header(client, email)


@pytest.fixture(autouse=True)
def mock_razorpay_order(monkeypatch):
    """Never hit the real Razorpay API when creating orders."""
    async def _fake(amount_paise, receipt, currency="INR"):
        return {"id": f"order_{uuid.uuid4().hex[:12]}", "amount": amount_paise}

    monkeypatch.setattr("app.services.order_service.razorpay_service.create_order", _fake)
