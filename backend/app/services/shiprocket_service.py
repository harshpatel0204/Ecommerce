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
