"""Shared async helpers for the test suite."""
import hashlib
import hmac
import uuid

from httpx import AsyncClient

ADDRESS = {
    "full_name": "Cust",
    "phone": "9999999999",
    "line1": "1 Test St",
    "city": "Surat",
    "state": "GJ",
    "pincode": "395007",
}


def sign(msg: str, secret: str = "testsecret") -> str:
    return hmac.new(secret.encode(), msg.encode(), hashlib.sha256).hexdigest()


async def make_product(
    client: AsyncClient,
    admin_headers: dict,
    *,
    stock: int = 10,
    base: float = 1000,
    price: float = 800,
    tax: float = 0,
) -> tuple[dict, dict]:
    prod = (
        await client.post(
            "/api/admin/products",
            json={
                "name": f"Product {uuid.uuid4().hex[:8]}",
                "base_price": base,
                "selling_price": price,
                "tax_percent": tax,
            },
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
    return prod, variant


async def add_address(client: AsyncClient, headers: dict) -> dict:
    return (await client.post("/api/me/addresses", json=ADDRESS, headers=headers)).json()


async def cart_add(client: AsyncClient, headers: dict, variant_id: str, qty: int = 1) -> None:
    await client.post(
        "/api/cart/items", json={"variant_id": variant_id, "quantity": qty}, headers=headers
    )


async def checkout_and_pay(
    client: AsyncClient, headers: dict, address_id: str, *, coupon: str | None = None
) -> dict:
    """Checkout online + complete payment. Returns the checkout response JSON."""
    co = (
        await client.post(
            "/api/orders/checkout",
            json={"address_id": address_id, "coupon_code": coupon, "payment_method": "online"},
            headers=headers,
        )
    ).json()
    payment_id = f"pay_{uuid.uuid4().hex[:8]}"
    await client.post(
        "/api/orders/verify-payment",
        json={
            "order_id": co["order_id"],
            "razorpay_order_id": co["razorpay_order_id"],
            "razorpay_payment_id": payment_id,
            "razorpay_signature": sign(f"{co['razorpay_order_id']}|{payment_id}"),
        },
        headers=headers,
    )
    return co
