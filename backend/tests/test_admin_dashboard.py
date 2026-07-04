"""Admin dashboard + user management tests."""
import pytest
from httpx import AsyncClient

from tests.helpers import add_address, cart_add, checkout_and_pay, make_product


@pytest.mark.asyncio
async def test_dashboard_endpoints_gated(client: AsyncClient, customer_headers):
    for path in ["/api/admin/dashboard/stats", "/api/admin/dashboard/low-stock", "/api/admin/dashboard/recent-orders"]:
        assert (await client.get(path)).status_code == 403
        assert (await client.get(path, headers=customer_headers)).status_code == 403


@pytest.mark.asyncio
async def test_dashboard_stats_shape(client: AsyncClient, admin_headers):
    stats = (await client.get("/api/admin/dashboard/stats", headers=admin_headers)).json()
    for key in ["revenue_total", "orders_today", "low_stock_products", "customers_total", "products_total"]:
        assert key in stats and isinstance(stats[key], (int, float))


@pytest.mark.asyncio
async def test_sales_chart_periods(client: AsyncClient, admin_headers):
    for period, n in [("7d", 7), ("30d", 30), ("90d", 90)]:
        chart = (await client.get(f"/api/admin/dashboard/sales-chart?period={period}", headers=admin_headers)).json()
        assert len(chart["labels"]) == n and len(chart["revenue"]) == n and len(chart["orders"]) == n


@pytest.mark.asyncio
async def test_paid_order_counts_toward_revenue(client: AsyncClient, admin_headers, customer_headers):
    before = (await client.get("/api/admin/dashboard/stats", headers=admin_headers)).json()["revenue_total"]
    _, variant = await make_product(client, admin_headers, price=800, tax=0)
    addr = await add_address(client, customer_headers)
    await cart_add(client, customer_headers, variant["id"])
    await checkout_and_pay(client, customer_headers, addr["id"])
    after = (await client.get("/api/admin/dashboard/stats", headers=admin_headers)).json()["revenue_total"]
    assert after >= before + 800


@pytest.mark.asyncio
async def test_low_stock_listed(client: AsyncClient, admin_headers):
    prod = (
        await client.post(
            "/api/admin/products",
            json={"name": "LowStock", "base_price": 100, "selling_price": 90},
            headers=admin_headers,
        )
    ).json()
    await client.post(
        f"/api/admin/products/{prod['id']}/variants",
        json={"size": "S", "stock_quantity": 1, "low_stock_threshold": 5},
        headers=admin_headers,
    )
    low = (await client.get("/api/admin/dashboard/low-stock", headers=admin_headers)).json()
    assert any(item["product_name"] == "LowStock" for item in low)


@pytest.mark.asyncio
async def test_user_list_and_deactivate(client: AsyncClient, admin_headers, customer_headers):
    users = (await client.get("/api/admin/users", headers=admin_headers)).json()
    assert users["total"] >= 1
    customer = next(u for u in users["items"] if not u["is_admin"])

    deactivated = (await client.patch(f"/api/admin/users/{customer['id']}/deactivate", headers=admin_headers)).json()
    assert deactivated["is_active"] is False
    reactivated = (await client.patch(f"/api/admin/users/{customer['id']}/deactivate", headers=admin_headers)).json()
    assert reactivated["is_active"] is True


@pytest.mark.asyncio
async def test_users_gated(client: AsyncClient, customer_headers):
    assert (await client.get("/api/admin/users")).status_code == 403
    assert (await client.get("/api/admin/users", headers=customer_headers)).status_code == 403
