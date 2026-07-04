"""Product review tests: submit, moderation, visibility, verified purchase."""
import pytest
from httpx import AsyncClient

from tests.helpers import add_address, cart_add, checkout_and_pay, make_product


@pytest.mark.asyncio
async def test_review_hidden_until_approved(client: AsyncClient, admin_headers, customer_headers):
    prod, _ = await make_product(client, admin_headers)
    r = await client.post(
        "/api/reviews",
        json={"product_id": prod["id"], "rating": 5, "title": "Nice", "comment": "Loved it"},
        headers=customer_headers,
    )
    assert r.status_code == 201 and r.json()["rating"] == 5

    # Not visible publicly until an admin approves it.
    pub = await client.get(f"/api/products/{prod['id']}/reviews")
    assert pub.json()["review_count"] == 0

    review_id = (await client.get("/api/admin/reviews?approved=false", headers=admin_headers)).json()[0]["id"]
    assert (await client.patch(f"/api/admin/reviews/{review_id}/approve", headers=admin_headers)).status_code == 204

    pub = await client.get(f"/api/products/{prod['id']}/reviews")
    assert pub.json()["review_count"] == 1 and pub.json()["avg_rating"] == 5.0
    assert pub.json()["rating_distribution"]["5"] == 1


@pytest.mark.asyncio
async def test_one_review_per_user_per_product(client: AsyncClient, admin_headers, customer_headers):
    prod, _ = await make_product(client, admin_headers)
    body = {"product_id": prod["id"], "rating": 4}
    assert (await client.post("/api/reviews", json=body, headers=customer_headers)).status_code == 201
    assert (await client.post("/api/reviews", json=body, headers=customer_headers)).status_code == 409


@pytest.mark.asyncio
async def test_verified_purchase_flag(client: AsyncClient, admin_headers, customer_headers):
    prod, variant = await make_product(client, admin_headers)
    addr = await add_address(client, customer_headers)
    await cart_add(client, customer_headers, variant["id"])
    co = await checkout_and_pay(client, customer_headers, addr["id"])

    r = await client.post(
        "/api/reviews",
        json={"product_id": prod["id"], "order_id": co["order_id"], "rating": 5},
        headers=customer_headers,
    )
    assert r.status_code == 201 and r.json()["is_verified"] is True


@pytest.mark.asyncio
async def test_review_requires_auth(client: AsyncClient, admin_headers):
    prod, _ = await make_product(client, admin_headers)
    assert (await client.post("/api/reviews", json={"product_id": prod["id"], "rating": 5})).status_code == 403


@pytest.mark.asyncio
async def test_admin_can_delete_review(client: AsyncClient, admin_headers, customer_headers):
    prod, _ = await make_product(client, admin_headers)
    rid = (await client.post("/api/reviews", json={"product_id": prod["id"], "rating": 3}, headers=customer_headers)).json()["id"]
    assert (await client.delete(f"/api/admin/reviews/{rid}", headers=admin_headers)).status_code == 204
    assert (await client.get("/api/admin/reviews", headers=admin_headers)).json() == [] or all(
        x["id"] != rid for x in (await client.get("/api/admin/reviews", headers=admin_headers)).json()
    )
