"""Coupon tests: validation, checkout discount, usage limits, min-order."""
import uuid

import pytest
from httpx import AsyncClient

from tests.helpers import add_address, cart_add, make_product


def _code() -> str:
    return f"SAVE{uuid.uuid4().hex[:6].upper()}"


async def _make_coupon(client, admin_headers, **overrides):
    payload = {"code": _code(), "discount_type": "percent", "discount_value": 10, "min_order_value": 0}
    payload.update(overrides)
    r = await client.post("/api/admin/coupons", json=payload, headers=admin_headers)
    assert r.status_code == 201, r.text
    return r.json()


@pytest.mark.asyncio
async def test_validate_percent_coupon(client: AsyncClient, admin_headers, customer_headers):
    c = await _make_coupon(client, admin_headers, discount_value=20)
    r = await client.post(
        "/api/coupons/validate", json={"code": c["code"], "cart_subtotal": 1000}, headers=customer_headers
    )
    body = r.json()
    assert body["valid"] is True and body["discount_amount"] == 200


@pytest.mark.asyncio
async def test_percent_coupon_respects_max_discount(client: AsyncClient, admin_headers, customer_headers):
    c = await _make_coupon(client, admin_headers, discount_value=50, max_discount=100)
    r = await client.post(
        "/api/coupons/validate", json={"code": c["code"], "cart_subtotal": 1000}, headers=customer_headers
    )
    assert r.json()["discount_amount"] == 100  # capped


@pytest.mark.asyncio
async def test_min_order_value_enforced(client: AsyncClient, admin_headers, customer_headers):
    c = await _make_coupon(client, admin_headers, min_order_value=2000)
    r = await client.post(
        "/api/coupons/validate", json={"code": c["code"], "cart_subtotal": 500}, headers=customer_headers
    )
    assert r.json()["valid"] is False


@pytest.mark.asyncio
async def test_invalid_code(client: AsyncClient, customer_headers):
    r = await client.post(
        "/api/coupons/validate", json={"code": "NOPENOPE", "cart_subtotal": 1000}, headers=customer_headers
    )
    assert r.json()["valid"] is False


@pytest.mark.asyncio
async def test_coupon_applied_at_checkout_and_usage_increments(client: AsyncClient, admin_headers, customer_headers):
    c = await _make_coupon(client, admin_headers, discount_value=10, min_order_value=500)
    prod, variant = await make_product(client, admin_headers, price=1000, tax=0)
    addr = await add_address(client, customer_headers)
    await cart_add(client, customer_headers, variant["id"], qty=2)  # 2000
    co = (
        await client.post(
            "/api/orders/checkout",
            json={"address_id": addr["id"], "coupon_code": c["code"]},
            headers=customer_headers,
        )
    ).json()
    assert co["total_amount"] == 1800.0  # 2000 - 10%

    coupons = (await client.get("/api/admin/coupons", headers=admin_headers)).json()
    used = next(x for x in coupons if x["code"] == c["code"])["times_used"]
    assert used == 1


@pytest.mark.asyncio
async def test_usage_limit_blocks_checkout(client: AsyncClient, admin_headers, customer_headers):
    c = await _make_coupon(client, admin_headers, usage_limit=1)
    prod, variant = await make_product(client, admin_headers, price=1000)
    addr = await add_address(client, customer_headers)
    # First use consumes the single allowed usage.
    await cart_add(client, customer_headers, variant["id"])
    await client.post(
        "/api/orders/checkout", json={"address_id": addr["id"], "coupon_code": c["code"]}, headers=customer_headers
    )
    # Second use is rejected (422).
    await cart_add(client, customer_headers, variant["id"])
    r = await client.post(
        "/api/orders/checkout", json={"address_id": addr["id"], "coupon_code": c["code"]}, headers=customer_headers
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_admin_coupon_crud_gated(client: AsyncClient, customer_headers):
    assert (await client.get("/api/admin/coupons", headers=customer_headers)).status_code == 403
    assert (await client.get("/api/admin/coupons")).status_code == 403
