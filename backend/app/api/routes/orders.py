"""Customer order + checkout + payment endpoints (all require authentication)."""
import uuid

from fastapi import APIRouter, Query

from app.core.deps import CurrentUser, DbSession
from app.schemas.order import (
    CheckoutRequest,
    CheckoutResponse,
    OrderListItem,
    OrderListResponse,
    OrderResponse,
    TrackingResponse,
    VerifyPaymentRequest,
    VerifyPaymentResponse,
)
from app.services import order_service

router = APIRouter(prefix="/orders", tags=["orders"])


def _to_list_item(order) -> OrderListItem:
    return OrderListItem(
        id=order.id,
        order_number=order.order_number,
        status=order.status,
        payment_status=order.payment_status,
        total_amount=float(order.total_amount),
        placed_at=order.placed_at,
        item_count=sum(i.quantity for i in order.items),
        first_image_id=order.items[0].image_id if order.items else None,
    )


@router.post("/checkout", response_model=CheckoutResponse)
async def checkout(data: CheckoutRequest, current_user: CurrentUser, db: DbSession) -> CheckoutResponse:
    return await order_service.checkout(db, current_user, data.address_id)


@router.post("/verify-payment", response_model=VerifyPaymentResponse)
async def verify_payment(
    data: VerifyPaymentRequest, current_user: CurrentUser, db: DbSession
) -> VerifyPaymentResponse:
    order = await order_service.verify_payment(
        db,
        current_user,
        data.order_id,
        data.razorpay_order_id,
        data.razorpay_payment_id,
        data.razorpay_signature,
    )
    return VerifyPaymentResponse(success=True, order_number=order.order_number)


@router.get("", response_model=OrderListResponse)
async def list_orders(
    current_user: CurrentUser,
    db: DbSession,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=50),
) -> OrderListResponse:
    orders, total, pages = await order_service.list_orders(db, current_user, page, limit)
    return OrderListResponse(
        items=[_to_list_item(o) for o in orders], total=total, page=page, pages=pages, limit=limit
    )


@router.get("/{order_number}", response_model=OrderResponse)
async def get_order(order_number: str, current_user: CurrentUser, db: DbSession) -> OrderResponse:
    order = await order_service.get_order(db, current_user, order_number)
    return OrderResponse.model_validate(order)


@router.get("/{order_number}/tracking", response_model=TrackingResponse)
async def order_tracking(order_number: str, current_user: CurrentUser, db: DbSession) -> TrackingResponse:
    data = await order_service.get_order_tracking(db, current_user, order_number)
    return TrackingResponse(**data)


@router.post("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(order_id: uuid.UUID, current_user: CurrentUser, db: DbSession) -> OrderResponse:
    order = await order_service.cancel_order(db, current_user, order_id)
    return OrderResponse.model_validate(order)
