"""Shipping/fulfilment tests with a faked Shiprocket HTTP client."""
import itertools
import json

import pytest
import pytest_asyncio
from httpx import AsyncClient

import app.services.shiprocket_service as ss
from app.core.config import settings
from tests.helpers import add_address, cart_add, checkout_and_pay, make_product


class _Resp:
    def __init__(self, payload):
        self._p = payload

    def raise_for_status(self):
        pass

    def json(self):
        return self._p


_awb_counter = itertools.count(1)


class _FakeClient:
    def __init__(self, *a, **k):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, *a):
        return False

    async def post(self, url, json=None):
        return _Resp({"token": "tok"})

    async def get(self, url, params=None, headers=None):
        if "/courier/serviceability" in url:
            return _Resp({"data": {"available_courier_companies": [
                {"courier_name": "Delhivery", "courier_company_id": 12, "rate": 60, "estimated_delivery_days": 3},
            ]}})
        return await self.request("GET", url, params=params, headers=headers)

    async def request(self, method, url, json=None, params=None, headers=None):
        if "/orders/create/adhoc" in url:
            return _Resp({"order_id": 5555, "shipment_id": 9999})
        if "/courier/assign/awb" in url:
            awb = f"AWB{next(_awb_counter)}"
            return _Resp({"response": {"data": {"awb_code": awb, "courier_name": "Delhivery", "etd": "2026-07-20"}}})
        if "/courier/generate/pickup" in url:
            return _Resp({"pickup_status": 1})
        if "/courier/generate/label" in url:
            return _Resp({"label_url": "https://sr.example/label.pdf"})
        if "/courier/track/shipment/" in url:
            return _Resp({"tracking_data": {
                "shipment_track": [{"current_status": "In Transit"}],
                "shipment_track_activities": [{"date": "2026-07-11", "activity": "Picked up", "location": "Surat"}],
            }})
        return _Resp({})


@pytest_asyncio.fixture
async def shiprocket(monkeypatch):
    monkeypatch.setattr(ss.httpx, "AsyncClient", _FakeClient)
    settings.SHIPROCKET_EMAIL = "a@b.com"
    settings.SHIPROCKET_PASSWORD = "pw"
    settings.SHIPROCKET_PICKUP_PINCODE = "395007"
    yield
    settings.SHIPROCKET_EMAIL = ""
    settings.SHIPROCKET_PASSWORD = ""
    settings.SHIPROCKET_PICKUP_PINCODE = ""


async def _paid_order(client, admin_headers, customer_headers):
    _, variant = await make_product(client, admin_headers)
    addr = await add_address(client, customer_headers)
    await cart_add(client, customer_headers, variant["id"])
    return await checkout_and_pay(client, customer_headers, addr["id"])


@pytest.mark.asyncio
async def test_ship_order_assigns_awb(client: AsyncClient, admin_headers, customer_headers, shiprocket):
    co = await _paid_order(client, admin_headers, customer_headers)
    r = await client.post(f"/api/admin/orders/{co['order_id']}/ship", headers=admin_headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "shipped" and body["awb_number"].startswith("AWB")
    assert body["courier_name"] == "Delhivery" and body["tracking_url"]

    # Cannot ship again.
    assert (await client.post(f"/api/admin/orders/{co['order_id']}/ship", headers=admin_headers)).status_code == 400


@pytest.mark.asyncio
async def test_label_and_tracking(client: AsyncClient, admin_headers, customer_headers, shiprocket):
    co = await _paid_order(client, admin_headers, customer_headers)
    await client.post(f"/api/admin/orders/{co['order_id']}/ship", headers=admin_headers)

    label = (await client.get(f"/api/admin/orders/{co['order_id']}/label", headers=admin_headers)).json()
    assert label["label_url"] == "https://sr.example/label.pdf"

    tracking = (await client.get(f"/api/orders/{co['order_number']}/tracking", headers=customer_headers)).json()
    assert tracking["current_status"] == "In Transit" and len(tracking["scans"]) == 1


@pytest.mark.asyncio
async def test_shiprocket_webhook_advances_status(client: AsyncClient, admin_headers, customer_headers, shiprocket):
    co = await _paid_order(client, admin_headers, customer_headers)
    shipped = (await client.post(f"/api/admin/orders/{co['order_id']}/ship", headers=admin_headers)).json()
    awb = shipped["awb_number"]

    body = json.dumps({"awb": awb, "current_status": "Delivered"}).encode()
    assert (await client.post("/api/webhooks/shiprocket", content=body)).status_code == 200
    order = (await client.get(f"/api/orders/{co['order_number']}", headers=customer_headers)).json()
    assert order["status"] == "delivered" and order["delivered_at"]

    # Backward status is ignored.
    back = json.dumps({"awb": awb, "current_status": "In Transit"}).encode()
    await client.post("/api/webhooks/shiprocket", content=back)
    order = (await client.get(f"/api/orders/{co['order_number']}", headers=customer_headers)).json()
    assert order["status"] == "delivered"
