"""Admin order management + fulfilment. Every route requires get_current_admin."""
import uuid

from fastapi import APIRouter, Depends, Query, Response

from app.core.deps import CurrentAdmin, DbSession, get_current_admin
from app.schemas.order import (
    LabelResponse,
    OrderListItem,
    OrderListResponse,
    OrderResponse,
    OrderStatusUpdate,
    ReturnAction,
)
from app.services import analytics_service, invoice_service, order_service

router = APIRouter(prefix="/admin/orders", tags=["admin:orders"], dependencies=[Depends(get_current_admin)])


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


@router.get("", response_model=OrderListResponse)
async def list_orders(
    db: DbSession,
    status: str | None = None,
    search: str | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
) -> OrderListResponse:
    orders, total, pages = await order_service.admin_list_orders(
        db, status_filter=status, search=search, page=page, limit=limit
    )
    return OrderListResponse(
        items=[_to_list_item(o) for o in orders], total=total, page=page, pages=pages, limit=limit
    )


# Declared before "/{order_id}" so the literal path isn't parsed as a UUID.
@router.get("/export.csv")
async def export_orders_csv(
    db: DbSession, status: str | None = None, search: str | None = None
) -> Response:
    rows = await analytics_service.orders_for_export(db, status, search)
    lines = ["order_number,placed_at,status,payment_status,total_amount,item_count"]
    for r in rows:
        lines.append(
            f"{r['order_number']},{r['placed_at'].isoformat()},{r['status']},"
            f"{r['payment_status']},{r['total_amount']},{r['item_count']}"
        )
    return Response(
        content="\n".join(lines),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=orders.csv"},
    )


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: uuid.UUID, db: DbSession) -> OrderResponse:
    order = await order_service.admin_get_order(db, order_id)
    return OrderResponse.model_validate(order)


@router.get("/{order_id}/invoice.pdf")
async def get_invoice(order_id: uuid.UUID, db: DbSession) -> Response:
    order = await order_service.admin_get_order(db, order_id)
    pdf = invoice_service.build_invoice_pdf(order)
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=invoice_{order.order_number}.pdf"},
    )


@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_status(
    order_id: uuid.UUID, data: OrderStatusUpdate, admin: CurrentAdmin, db: DbSession
) -> OrderResponse:
    order = await order_service.admin_update_status(db, order_id, data.status, data.note, admin.id)
    return OrderResponse.model_validate(order)


@router.post("/{order_id}/ship", response_model=OrderResponse)
async def ship_order(order_id: uuid.UUID, admin: CurrentAdmin, db: DbSession) -> OrderResponse:
    order = await order_service.ship_order(db, order_id, admin.id)
    return OrderResponse.model_validate(order)


@router.get("/{order_id}/label", response_model=LabelResponse)
async def get_label(order_id: uuid.UUID, db: DbSession) -> LabelResponse:
    url = await order_service.get_label_url(db, order_id)
    return LabelResponse(label_url=url)


@router.post("/{order_id}/process-return", response_model=OrderResponse)
async def process_return(
    order_id: uuid.UUID, data: ReturnAction, admin: CurrentAdmin, db: DbSession
) -> OrderResponse:
    order = await order_service.admin_process_return(db, order_id, data.approve, admin.id)
    return OrderResponse.model_validate(order)
