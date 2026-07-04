"""Auth flow tests."""
import uuid

import pytest
from httpx import AsyncClient


def _email() -> str:
    return f"u_{uuid.uuid4().hex[:8]}@example.com"


@pytest.mark.asyncio
async def test_register_login_and_me(client: AsyncClient):
    email = _email()
    r = await client.post(
        "/api/auth/register",
        json={"email": email, "password": "Password123", "full_name": "Jane"},
    )
    assert r.status_code == 201, r.text
    tokens = r.json()
    assert tokens["user"]["email"] == email and tokens["user"]["is_admin"] is False

    me = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {tokens['access_token']}"})
    assert me.status_code == 200 and me.json()["email"] == email


@pytest.mark.asyncio
async def test_duplicate_register_conflicts(client: AsyncClient):
    email = _email()
    payload = {"email": email, "password": "Password123", "full_name": "Jane"}
    assert (await client.post("/api/auth/register", json=payload)).status_code == 201
    assert (await client.post("/api/auth/register", json=payload)).status_code == 409


@pytest.mark.asyncio
async def test_login_failures_do_not_enumerate(client: AsyncClient):
    email = _email()
    await client.post(
        "/api/auth/register", json={"email": email, "password": "Password123", "full_name": "J"}
    )
    wrong_pw = await client.post("/api/auth/login", json={"email": email, "password": "nope"})
    unknown = await client.post("/api/auth/login", json={"email": _email(), "password": "nope"})
    assert wrong_pw.status_code == 401 and unknown.status_code == 401
    assert wrong_pw.json()["detail"] == unknown.json()["detail"]


@pytest.mark.asyncio
async def test_me_requires_auth(client: AsyncClient):
    assert (await client.get("/api/auth/me")).status_code == 403


@pytest.mark.asyncio
async def test_refresh_rotation_invalidates_old_token(client: AsyncClient):
    email = _email()
    reg = await client.post(
        "/api/auth/register", json={"email": email, "password": "Password123", "full_name": "J"}
    )
    old_refresh = reg.json()["refresh_token"]

    rotated = await client.post("/api/auth/refresh", json={"refresh_token": old_refresh})
    assert rotated.status_code == 200
    # The old refresh token must no longer work after rotation.
    reused = await client.post("/api/auth/refresh", json={"refresh_token": old_refresh})
    assert reused.status_code == 401


@pytest.mark.asyncio
async def test_weak_password_rejected(client: AsyncClient):
    r = await client.post(
        "/api/auth/register", json={"email": _email(), "password": "short", "full_name": "J"}
    )
    assert r.status_code == 422
