"""Shiprocket integration.

The bearer token (valid ~24h) is cached in the `service_tokens` DB table, NOT in
module memory — the backend runs as stateless Vercel functions where in-memory
caches don't survive between invocations. Only serviceability is implemented in
this phase; order/AWB/tracking arrive in Phase 5.
"""
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.service_token import ServiceToken

BASE_URL = "https://apiv2.shiprocket.in/v1/external"
_SERVICE = "shiprocket"
_TOKEN_TTL = timedelta(hours=24)
_REFRESH_BUFFER = timedelta(minutes=5)


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def get_auth_token(db: AsyncSession) -> str:
    """Return a valid bearer token, refreshing (and DB-caching) only when needed."""
    row = await db.scalar(select(ServiceToken).where(ServiceToken.service_name == _SERVICE))
    if row is not None and row.expires_at > _now() + _REFRESH_BUFFER:
        return row.token

    if not settings.SHIPROCKET_EMAIL or not settings.SHIPROCKET_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Shipping is not configured",
        )

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{BASE_URL}/auth/login",
                json={
                    "email": settings.SHIPROCKET_EMAIL,
                    "password": settings.SHIPROCKET_PASSWORD,
                },
            )
        resp.raise_for_status()
        token = resp.json()["token"]
    except (httpx.HTTPError, KeyError):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not authenticate with the shipping provider",
        )

    expires_at = _now() + _TOKEN_TTL
    if row is None:
        db.add(ServiceToken(service_name=_SERVICE, token=token, expires_at=expires_at))
    else:
        row.token = token
        row.expires_at = expires_at
    await db.commit()
    return token


async def check_serviceability(db: AsyncSession, delivery_pincode: str, weight_grams: int) -> dict:
    """Return delivery serviceability + cheapest courier for a pincode."""
    if not settings.SHIPROCKET_PICKUP_PINCODE:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Shipping is not configured"
        )
    token = await get_auth_token(db)
    params = {
        "pickup_postcode": settings.SHIPROCKET_PICKUP_PINCODE,
        "delivery_postcode": delivery_pincode,
        "weight": max(weight_grams, 1) / 1000,  # kg
        "cod": 0,
    }
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{BASE_URL}/courier/serviceability/",
                params=params,
                headers={"Authorization": f"Bearer {token}"},
            )
        resp.raise_for_status()
        data = resp.json()
    except httpx.HTTPError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Shipping provider is unavailable",
        )

    couriers = (data.get("data") or {}).get("available_courier_companies") or []
    if not couriers:
        return {"serviceable": False, "couriers": [], "cheapest": None}

    options = [
        {
            "courier_name": c.get("courier_name"),
            "courier_id": c.get("courier_company_id"),
            "rate": float(c.get("rate", 0)),
            "eta_days": c.get("estimated_delivery_days"),
        }
        for c in couriers
    ]
    cheapest = min(options, key=lambda o: o["rate"])
    return {"serviceable": True, "couriers": options, "cheapest": cheapest}


PICKUP_LOCATION = "Primary"

# Map Shiprocket scan/status strings to our internal order status.
STATUS_MAP = {
    "PICKUP SCHEDULED": "shipped",
    "PICKED UP": "shipped",
    "IN TRANSIT": "shipped",
    "SHIPPED": "shipped",
    "OUT FOR DELIVERY": "out_for_delivery",
    "DELIVERED": "delivered",
}


def map_status(shiprocket_status: str | None) -> str | None:
    if not shiprocket_status:
        return None
    return STATUS_MAP.get(shiprocket_status.strip().upper())


async def _authed_request(
    db: AsyncSession, method: str, path: str, *, json: dict | None = None, params: dict | None = None
) -> dict:
    token = await get_auth_token(db)
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.request(
                method,
                f"{BASE_URL}{path}",
                json=json,
                params=params,
                headers={"Authorization": f"Bearer {token}"},
            )
        resp.raise_for_status()
        return resp.json()
    except httpx.HTTPError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Shipping provider is unavailable",
        )


async def create_shipment_order(db: AsyncSession, order, items) -> dict:
    """Create an ad-hoc Shiprocket order from our Order + snapshot items."""
    addr = order.shipping_address
    total_weight_kg = max(sum((getattr(i, "quantity", 1) for i in items)) * 0.3, 0.5)
    payload = {
        "order_id": order.order_number,
        "order_date": order.placed_at.strftime("%Y-%m-%d %H:%M"),
        "pickup_location": PICKUP_LOCATION,
        "billing_customer_name": addr.get("full_name", ""),
        "billing_last_name": "",
        "billing_address": addr.get("line1", ""),
        "billing_address_2": addr.get("line2") or "",
        "billing_city": addr.get("city", ""),
        "billing_pincode": addr.get("pincode", ""),
        "billing_state": addr.get("state", ""),
        "billing_country": addr.get("country", "India"),
        "billing_email": settings.EMAIL_FROM,
        "billing_phone": addr.get("phone", ""),
        "shipping_is_billing": True,
        "order_items": [
            {
                "name": i.product_name,
                "sku": i.variant_sku,
                "units": i.quantity,
                "selling_price": float(i.unit_price),
            }
            for i in items
        ],
        "payment_method": "Prepaid",
        "sub_total": float(order.total_amount),
        "length": 10,
        "breadth": 10,
        "height": 10,
        "weight": total_weight_kg,
    }
    data = await _authed_request(db, "POST", "/orders/create/adhoc", json=payload)
    return {
        "shiprocket_order_id": str(data.get("order_id", "")),
        "shipment_id": str(data.get("shipment_id", "")),
    }


async def assign_awb(db: AsyncSession, shipment_id: str, courier_id: int | None) -> dict:
    body: dict = {"shipment_id": shipment_id}
    if courier_id:
        body["courier_id"] = courier_id
    data = await _authed_request(db, "POST", "/courier/assign/awb", json=body)
    resp = (data.get("response") or {}).get("data") or {}
    awb = resp.get("awb_code")
    return {
        "awb_number": awb,
        "courier_name": resp.get("courier_name"),
        "tracking_url": f"https://shiprocket.co/tracking/{awb}" if awb else None,
        "estimated_delivery": resp.get("etd"),
    }


async def schedule_pickup(db: AsyncSession, shipment_id: str) -> dict:
    return await _authed_request(
        db, "POST", "/courier/generate/pickup", json={"shipment_id": [shipment_id]}
    )


async def get_tracking(db: AsyncSession, shipment_id: str) -> dict:
    data = await _authed_request(db, "GET", f"/courier/track/shipment/{shipment_id}")
    tracking = (data.get("tracking_data") or {})
    activities = tracking.get("shipment_track_activities") or []
    scans = [
        {
            "date": a.get("date"),
            "activity": a.get("activity"),
            "location": a.get("location"),
        }
        for a in activities
    ]
    current = None
    track = tracking.get("shipment_track") or []
    if track:
        current = track[0].get("current_status")
    return {"current_status": current, "scans": scans}


async def get_label(db: AsyncSession, shipment_id: str) -> str | None:
    data = await _authed_request(
        db, "POST", "/courier/generate/label", json={"shipment_id": [shipment_id]}
    )
    return data.get("label_url")
