"""Server-to-server webhooks (no auth — verified by signature)."""
from fastapi import APIRouter, Request, Response

from app.core.deps import DbSession
from app.services import order_service

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/razorpay")
async def razorpay_webhook(request: Request, db: DbSession) -> Response:
    # Authoritative payment source of truth. Always return 200 so Razorpay doesn't
    # retry indefinitely; signature + idempotency are handled in the service.
    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")
    await order_service.process_webhook(db, body, signature)
    return Response(status_code=200)


@router.post("/shiprocket")
async def shiprocket_webhook(request: Request, db: DbSession) -> Response:
    # Shipment status updates (picked up / in transit / delivered ...).
    body = await request.body()
    await order_service.process_shiprocket_webhook(db, body)
    return Response(status_code=200)
