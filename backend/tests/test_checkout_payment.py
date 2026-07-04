"""Checkout + payment tests: server-side totals, signature verify, webhook idempotency."""
import hashlib
import hmac
import json

import pytest
from httpx import AsyncClient


def _sign(msg: str, secret: str = "testsecret") -> str:
    return hmac.new(secret.encode(), msg.encode(), hashlib.sha256).hexdigest()


async def _make_product(client: AsyncClient, admin_headers: dict, *, stock: int) -> dict:
    prod = (
        await client.post(
            "/api/admin/products",
            json={"name": "Test Coin", "base_price": 1000, "selling_price": 800, "tax_percent": 0},
            headers=admin_headers,
        )
    ).json()
    variant = (
        await client.post(
            f"/api/admin/products/{prod['id']}/variants",
            json={"size": "One", "stock_quantity": stock},
            headers=admin_headers,
        )
    ).json()
    return {"product": prod, "variant": variant}


async def _add_address(client: AsyncClient, headers: dict) -> dict:
    return (
        await client.post(
            "/api/me/addresses",
            json={
                "full_name": "C",
                "phone": "9999999999",
                "line1": "1 St",
                "city": "Surat",
                "state": "GJ",
                "pincode": "395007",
            },
            headers=headers,
        )
    ).json()


async def _checkout(client, admin_headers, customer_headers, qty=2, stock=5):
    p = await _make_product(client, admin_headers, stock=stock)
    addr = await _add_address(client, customer_headers)
    await client.post(
        "/api/cart/items",
        json={"variant_id": p["variant"]["id"], "quantity": qty},
        headers=customer_headers,
    )
    co = (
        await client.post(
            "/api/orders/checkout", json={"address_id": addr["id"]}, headers=customer_headers
        )
    ).json()
    return p, co


@pytest.mark.asyncio
async def test_checkout_recomputes_total_server_side(client, admin_headers, customer_headers):
    _, co = await _checkout(client, admin_headers, customer_headers, qty=2)
    # 2 * 800, tax 0, shipping not configured -> 0
    assert co["total_amount"] == 1600.0 and co["amount_paise"] == 160000
    assert co["razorpay_order_id"].startswith("order_")


@pytest.mark.asyncio
async def test_verify_payment_bad_signature_rejected(client, admin_headers, customer_headers):
    _, co = await _checkout(client, admin_headers, customer_headers)
    r = await client.post(
        "/api/orders/verify-payment",
        json={
            "order_id": co["order_id"],
            "razorpay_order_id": co["razorpay_order_id"],
            "razorpay_payment_id": "pay_x",
            "razorpay_signature": "deadbeef",
        },
        headers=customer_headers,
    )
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_verify_payment_success_marks_paid(client, admin_headers, customer_headers):
    p, co = await _checkout(client, admin_headers, customer_headers, qty=2, stock=5)
    sig = _sign(f"{co['razorpay_order_id']}|pay_ok")
    r = await client.post(
        "/api/orders/verify-payment",
        json={
            "order_id": co["order_id"],
            "razorpay_order_id": co["razorpay_order_id"],
            "razorpay_payment_id": "pay_ok",
            "razorpay_signature": sig,
        },
        headers=customer_headers,
    )
    assert r.status_code == 200 and r.json()["success"] is True

    order = (await client.get(f"/api/orders/{co['order_number']}", headers=customer_headers)).json()
    assert order["status"] == "paid" and order["payment_status"] == "paid"
    # cart cleared
    cart = (await client.get("/api/cart", headers=customer_headers)).json()
    assert cart["item_count"] == 0


@pytest.mark.asyncio
async def test_webhook_idempotent(client, admin_headers, customer_headers):
    _, co = await _checkout(client, admin_headers, customer_headers, qty=1, stock=5)
    body = json.dumps(
        {
            "event": "payment.captured",
            "payload": {"payment": {"entity": {"id": "pay_wh", "order_id": co["razorpay_order_id"]}}},
        }
    ).encode()
    sig = hmac.new(b"whsecret", body, hashlib.sha256).hexdigest()

    # Invalid signature is ignored (still 200), order stays unpaid.
    bad = await client.post("/api/webhooks/razorpay", content=body, headers={"X-Razorpay-Signature": "bad"})
    assert bad.status_code == 200
    order = (await client.get(f"/api/orders/{co['order_number']}", headers=customer_headers)).json()
    assert order["payment_status"] == "unpaid"

    # Valid signature marks paid; duplicate delivery is a no-op.
    for _ in range(2):
        ok = await client.post(
            "/api/webhooks/razorpay", content=body, headers={"X-Razorpay-Signature": sig}
        )
        assert ok.status_code == 200
    order = (await client.get(f"/api/orders/{co['order_number']}", headers=customer_headers)).json()
    assert order["payment_status"] == "paid"


@pytest.mark.asyncio
async def test_checkout_empty_cart_rejected(client, customer_headers):
    addr = await _add_address(client, customer_headers)
    r = await client.post(
        "/api/orders/checkout", json={"address_id": addr["id"]}, headers=customer_headers
    )
    assert r.status_code == 400
