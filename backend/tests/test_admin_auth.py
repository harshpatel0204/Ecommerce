"""Admin authorization tests — the server-side gate is the real security layer."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_anonymous_cannot_access_admin(client: AsyncClient):
    assert (await client.get("/api/admin/products")).status_code == 403
    assert (await client.get("/api/admin/orders")).status_code == 403
    assert (await client.get("/api/admin/dashboard/stats")).status_code == 403


@pytest.mark.asyncio
async def test_customer_cannot_access_admin(client: AsyncClient, customer_headers: dict):
    r = await client.post("/api/admin/categories", json={"name": "X"}, headers=customer_headers)
    assert r.status_code == 403
    r2 = await client.get("/api/admin/dashboard/stats", headers=customer_headers)
    assert r2.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_manage_catalog(client: AsyncClient, admin_headers: dict):
    cat = await client.post("/api/admin/categories", json={"name": "Coins"}, headers=admin_headers)
    assert cat.status_code == 201 and cat.json()["slug"] == "coins"

    prod = await client.post(
        "/api/admin/products",
        json={"name": "Silver Coin", "base_price": 1000, "selling_price": 900},
        headers=admin_headers,
    )
    assert prod.status_code == 201 and prod.json()["sku"].startswith("BS-")
