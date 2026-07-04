"""COD checkout + returns/refunds tests."""
import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.product import ProductVariant
from tests.helpers import add_address, cart_add, checkout_and_pay, make_product


async def _stock(variant_id: str) -> int:
    async with AsyncSessionLocal() as db:
        return await db.scalar(select(ProductVariant.stock_quantity).where(ProductVariant.id == variant_id))


async def _advance(client, admin_headers, order_id, statuses):
    for s in statuses:
        await client.patch(f"/api/admin/orders/{order_id}/status", json={"status": s}, headers=admin_headers)


@pytest.mark.asyncio
async def test_cod_confirms_immediately(client: AsyncClient, admin_headers, customer_headers):
    prod, variant = await make_product(client, admin_headers, stock=5)
    addr = await add_address(client, customer_headers)
    await cart_add(client, customer_headers, variant["id"], qty=2)
    co = (
        await client.post(
            "/api/orders/checkout",
            json={"address_id": addr["id"], "payment_method": "cod"},
            headers=customer_headers,
        )
    ).json()
    assert co["razorpay_order_id"] is None

    order = (await client.get(f"/api/orders/{co['order_number']}", headers=customer_headers)).json()
    assert order["status"] == "processing" and order["payment_status"] == "unpaid"
    # Stock decremented at order time; cart cleared.
    assert await _stock(variant["id"]) == 3
    assert (await client.get("/api/cart", headers=customer_headers)).json()["item_count"] == 0


@pytest.mark.asyncio
async def test_cod_delivered_marks_paid(client: AsyncClient, admin_headers, customer_headers):
    prod, variant = await make_product(client, admin_headers, stock=5)
    addr = await add_address(client, customer_headers)
    await cart_add(client, customer_headers, variant["id"])
    co = (
        await client.post(
            "/api/orders/checkout",
            json={"address_id": addr["id"], "payment_method": "cod"},
            headers=customer_headers,
        )
    ).json()
    await _advance(client, admin_headers, co["order_id"], ["packed", "shipped", "out_for_delivery", "delivered"])
    order = (await client.get(f"/api/orders/{co['order_number']}", headers=customer_headers)).json()
    assert order["status"] == "delivered" and order["payment_status"] == "paid"


@pytest.mark.asyncio
async def test_return_request_and_admin_approve(client: AsyncClient, admin_headers, customer_headers):
    prod, variant = await make_product(client, admin_headers, stock=5)
    addr = await add_address(client, customer_headers)
    await cart_add(client, customer_headers, variant["id"])
    co = await checkout_and_pay(client, customer_headers, addr["id"])
    order_id = co["order_id"]
    await _advance(client, admin_headers, order_id, ["processing", "packed", "shipped", "out_for_delivery", "delivered"])

    # Customer requests a return (only allowed once delivered).
    r = await client.post(f"/api/orders/{order_id}/return", json={"reason": "defective"}, headers=customer_headers)
    assert r.status_code == 200 and r.json()["status"] == "return_requested"

    before = await _stock(variant["id"])
    approved = (
        await client.post(f"/api/admin/orders/{order_id}/process-return", json={"approve": True}, headers=admin_headers)
    ).json()
    assert approved["status"] == "refunded" and approved["payment_status"] == "refunded"
    assert await _stock(variant["id"]) == before + 1  # restocked


@pytest.mark.asyncio
async def test_return_only_when_delivered(client: AsyncClient, admin_headers, customer_headers):
    prod, variant = await make_product(client, admin_headers)
    addr = await add_address(client, customer_headers)
    await cart_add(client, customer_headers, variant["id"])
    co = await checkout_and_pay(client, customer_headers, addr["id"])  # status = paid
    r = await client.post(f"/api/orders/{co['order_id']}/return", json={"reason": "x"}, headers=customer_headers)
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_admin_reject_return(client: AsyncClient, admin_headers, customer_headers):
    prod, variant = await make_product(client, admin_headers)
    addr = await add_address(client, customer_headers)
    await cart_add(client, customer_headers, variant["id"])
    co = await checkout_and_pay(client, customer_headers, addr["id"])
    oid = co["order_id"]
    await _advance(client, admin_headers, oid, ["processing", "packed", "shipped", "out_for_delivery", "delivered"])
    await client.post(f"/api/orders/{oid}/return", json={"reason": "x"}, headers=customer_headers)
    rejected = (
        await client.post(f"/api/admin/orders/{oid}/process-return", json={"approve": False}, headers=admin_headers)
    ).json()
    assert rejected["status"] == "delivered"  # back to delivered
