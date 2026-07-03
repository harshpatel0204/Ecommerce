"""Razorpay integration: order creation + signature verification.

Security rules (see CLAUDE.md):
- Amounts are always in paise and always computed server-side.
- Payment is verified two ways: the frontend-triggered HMAC check
  (RAZORPAY_KEY_SECRET) and the authoritative webhook (RAZORPAY_WEBHOOK_SECRET).
- The signature itself is NEVER persisted; only the public order/payment ids are.
"""
import hashlib
import hmac

import razorpay
from anyio import to_thread
from fastapi import HTTPException, status

from app.core.config import settings


def _client() -> razorpay.Client:
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Payments not configured"
        )
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


async def create_order(amount_paise: int, receipt: str, currency: str = "INR") -> dict:
    """Create a Razorpay order. The SDK is sync, so run it off the event loop."""
    client = _client()

    def _create() -> dict:
        return client.order.create(
            {
                "amount": amount_paise,
                "currency": currency,
                "receipt": receipt,
                "payment_capture": 1,
            }
        )

    try:
        return await to_thread.run_sync(_create)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not create the payment order",
        )


def verify_payment_signature(order_id: str, payment_id: str, signature: str) -> bool:
    msg = f"{order_id}|{payment_id}".encode()
    expected = hmac.new(settings.RAZORPAY_KEY_SECRET.encode(), msg, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def verify_webhook_signature(payload_bytes: bytes, received_sig: str) -> bool:
    if not settings.RAZORPAY_WEBHOOK_SECRET:
        return False
    expected = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode(), payload_bytes, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, received_sig)
