"""Cron-triggered jobs (Vercel Cron hits these on a schedule via vercel.json).

Vercel sends `Authorization: Bearer $CRON_SECRET` automatically when the
CRON_SECRET project env var is set. With no secret configured the routes are
disabled entirely, so they can never be triggered anonymously.
"""
import secrets

from fastapi import APIRouter, HTTPException, Request, status

from app.core.config import settings
from app.core.deps import DbSession
from app.services import cart_service

router = APIRouter(prefix="/cron", tags=["cron"])


def _require_cron_secret(request: Request) -> None:
    expected = settings.CRON_SECRET
    provided = request.headers.get("authorization", "")
    if not expected or not secrets.compare_digest(provided, f"Bearer {expected}"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid cron credentials"
        )


@router.get("/abandoned-carts")
async def abandoned_carts(request: Request, db: DbSession) -> dict[str, int]:
    _require_cron_secret(request)
    sent = await cart_service.send_abandoned_cart_reminders(db)
    return {"reminders_sent": sent}
