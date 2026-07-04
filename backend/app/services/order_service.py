"""Checkout + order lifecycle + payment processing.

Security invariants (CLAUDE.md):
- Prices/totals are ALWAYS recomputed server-side; the client's amount is ignored.
- An order is only marked paid after a valid signature (frontend verify OR webhook).
- Stock decrement + cart clearing happen in one transaction after verification.
- The Razorpay signature is never stored; only the public payment/order ids are.
"""
import json
import random
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.cart import CartItem
from app.models.order import Order, OrderItem, OrderStatusHistory, PaymentEvent
from app.models.product import Product, ProductVariant
from app.models.user import Address, User
from app.schemas.order import CheckoutResponse
from app.services import coupon_service, email_service, razorpay_service, shiprocket_service

_CANCELLABLE = {"pending", "paid", "processing"}

# Linear fulfilment order — used to only ever advance status forward from webhooks.
_STATUS_RANK = {
    "pending": 0,
    "paid": 1,
    "processing": 2,
    "packed": 3,
    "shipped": 4,
    "out_for_delivery": 5,
    "delivered": 6,
}
# Statuses an admin may set manually.
_ADMIN_STATUSES = {"processing", "packed", "shipped", "out_for_delivery", "delivered"}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _primary_image_id(product: Product) -> uuid.UUID | None:
    live = [i for i in product.images if not i.is_deleted]
    if not live:
        return None
    live.sort(key=lambda i: (not i.is_primary, i.display_order))
    return live[0].id


async def _generate_order_number(db: AsyncSession) -> str:
    year = _now().year
    for _ in range(10):
        candidate = f"BS-{year}-{random.randint(0, 999999):06d}"
        if await db.scalar(select(Order.id).where(Order.order_number == candidate)) is None:
            return candidate
    raise HTTPException(status_code=500, detail="Could not allocate order number")


async def _shipping_fee(db: AsyncSession, pincode: str, weight_grams: int) -> float:
    """Serviceability + cheapest rate. If shipping isn't configured, fall back to 0."""
    try:
        result = await shiprocket_service.check_serviceability(db, pincode, weight_grams)
    except HTTPException as exc:
        if exc.status_code == status.HTTP_503_SERVICE_UNAVAILABLE:
            return 0.0  # provider not configured (dev) — don't block checkout
        raise
    if not result["serviceable"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Delivery is not available to this pincode",
        )
    return float(result["cheapest"]["rate"]) if result["cheapest"] else 0.0


async def checkout(
    db: AsyncSession,
    user: User,
    address_id: uuid.UUID,
    *,
    coupon_code: str | None = None,
    payment_method: str = "online",
) -> CheckoutResponse:
    cart_items = list(
        (await db.scalars(select(CartItem).where(CartItem.user_id == user.id))).all()
    )
    if not cart_items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")

    address = await db.get(Address, address_id)
    if address is None or address.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")

    # Reload every variant fresh from the DB — never trust client-side prices.
    variant_ids = [ci.variant_id for ci in cart_items]
    variants = {
        v.id: v
        for v in (
            await db.scalars(
                select(ProductVariant)
                .where(ProductVariant.id.in_(variant_ids))
                .options(selectinload(ProductVariant.product).selectinload(Product.images))
            )
        ).all()
    }

    subtotal = 0.0
    tax_amount = 0.0
    total_weight = 0
    snapshots: list[dict] = []
    for ci in cart_items:
        variant = variants.get(ci.variant_id)
        if variant is None or not variant.is_active or not variant.product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A product in your cart is no longer available",
            )
        if variant.stock_quantity < ci.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for {variant.product.name}",
            )
        product = variant.product
        unit_price = float(product.selling_price) + float(variant.price_delta)
        line_total = unit_price * ci.quantity
        subtotal += line_total
        tax_amount += line_total * float(product.tax_percent) / 100
        total_weight += product.weight_grams * ci.quantity
        snapshots.append(
            {
                "variant_id": variant.id,
                "product_name": product.name,
                "product_sku": product.sku,
                "variant_sku": variant.sku,
                "size": variant.size,
                "color": variant.color,
                "image_id": _primary_image_id(product),
                "unit_price": unit_price,
                "quantity": ci.quantity,
                "line_total": line_total,
            }
        )

    shipping_fee = await _shipping_fee(db, address.pincode, total_weight)
    tax_amount = round(tax_amount, 2)

    # Coupon: validate + compute discount server-side (client numbers ignored).
    discount_amount = 0.0
    applied_coupon = None
    applied_code = None
    if coupon_code:
        result = await coupon_service.validate(db, coupon_code, round(subtotal, 2))
        if not result["valid"]:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=result["message"] or "Invalid coupon",
            )
        discount_amount = result["discount_amount"]
        applied_coupon = result["_coupon"]
        applied_code = result["code"]

    total_amount = round(subtotal + shipping_fee + tax_amount - discount_amount, 2)
    is_cod = payment_method == "cod"

    order = Order(
        order_number=await _generate_order_number(db),
        user_id=user.id,
        shipping_address={
            "full_name": address.full_name,
            "phone": address.phone,
            "line1": address.line1,
            "line2": address.line2,
            "city": address.city,
            "state": address.state,
            "pincode": address.pincode,
            "country": address.country,
        },
        subtotal=round(subtotal, 2),
        shipping_fee=shipping_fee,
        discount_amount=discount_amount,
        coupon_code=applied_code,
        tax_amount=tax_amount,
        total_amount=total_amount,
        status="processing" if is_cod else "pending",
        payment_status="unpaid",
        payment_method="cod" if is_cod else "online",
    )
    db.add(order)
    await db.flush()

    for s in snapshots:
        db.add(OrderItem(order_id=order.id, **s))

    if applied_coupon is not None:
        applied_coupon.times_used += 1

    amount_paise = round(total_amount * 100)

    if is_cod:
        # No payment gateway: confirm immediately — decrement stock + clear cart.
        for ci in cart_items:
            variant = variants.get(ci.variant_id)
            if variant is not None:
                variant.stock_quantity = max(variant.stock_quantity - ci.quantity, 0)
        await db.execute(delete(CartItem).where(CartItem.user_id == user.id))
        db.add(OrderStatusHistory(order_id=order.id, status="processing", note="COD order placed"))
        await db.commit()
        email_service.send_order_confirmation(user.email, order.order_number, float(total_amount))
        return CheckoutResponse(
            order_id=order.id,
            order_number=order.order_number,
            razorpay_order_id=None,
            razorpay_key_id=settings.RAZORPAY_KEY_ID,
            amount_paise=amount_paise,
            total_amount=total_amount,
        )

    rzp = await razorpay_service.create_order(amount_paise, receipt=order.order_number)
    order.razorpay_order_id = rzp.get("id")
    db.add(OrderStatusHistory(order_id=order.id, status="pending", note="Order created"))
    await db.commit()

    return CheckoutResponse(
        order_id=order.id,
        order_number=order.order_number,
        razorpay_order_id=order.razorpay_order_id,
        razorpay_key_id=settings.RAZORPAY_KEY_ID,
        amount_paise=amount_paise,
        total_amount=total_amount,
    )


async def _apply_paid(db: AsyncSession, order: Order, payment_id: str, *, note: str) -> None:
    """Idempotently mark an order paid: decrement stock + clear cart in one tx."""
    if order.payment_status == "paid":
        return
    items = list((await db.scalars(select(OrderItem).where(OrderItem.order_id == order.id))).all())
    for item in items:
        if item.variant_id is None:
            continue
        variant = await db.get(ProductVariant, item.variant_id)
        if variant is not None:
            variant.stock_quantity = max(variant.stock_quantity - item.quantity, 0)
    await db.execute(delete(CartItem).where(CartItem.user_id == order.user_id))

    order.status = "paid"
    order.payment_status = "paid"
    order.paid_at = _now()
    order.razorpay_payment_id = payment_id  # public id; signature is NOT stored
    db.add(OrderStatusHistory(order_id=order.id, status="paid", note=note))


async def verify_payment(
    db: AsyncSession,
    user: User,
    order_id: uuid.UUID,
    razorpay_order_id: str,
    razorpay_payment_id: str,
    signature: str,
) -> Order:
    order = await db.get(Order, order_id)
    if order is None or order.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.payment_status == "paid":
        return order  # already processed (e.g. webhook won the race)
    if not razorpay_service.verify_payment_signature(
        razorpay_order_id, razorpay_payment_id, signature
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payment signature")

    await _apply_paid(db, order, razorpay_payment_id, note="Payment verified")
    await db.commit()
    email_service.send_order_confirmation(user.email, order.order_number, float(order.total_amount))
    return order


async def process_webhook(db: AsyncSession, body: bytes, signature: str) -> None:
    """Authoritative payment source of truth. Always returns (caller sends 200)."""
    if not razorpay_service.verify_webhook_signature(body, signature):
        return  # invalid — silently ignore (don't reveal rejection)

    payload = json.loads(body.decode() or "{}")
    event = payload.get("event", "")
    entity = (
        payload.get("payload", {}).get("payment", {}).get("entity", {})
    )
    payment_id = entity.get("id")

    # Idempotency: unique constraint on payment_events.razorpay_payment_id.
    if payment_id:
        dup = await db.scalar(
            select(PaymentEvent.id).where(PaymentEvent.razorpay_payment_id == payment_id)
        )
        if dup is not None:
            return
    db.add(
        PaymentEvent(
            event_type=event,
            razorpay_payload=payload,
            razorpay_payment_id=payment_id,
            processed=False,
        )
    )
    await db.flush()

    if event == "payment.captured" and payment_id:
        rzp_order_id = entity.get("order_id")
        order = await db.scalar(select(Order).where(Order.razorpay_order_id == rzp_order_id))
        if order is not None and order.payment_status != "paid":
            await _apply_paid(db, order, payment_id, note="Payment captured (webhook)")
    await db.commit()


async def list_orders(db: AsyncSession, user: User, page: int, limit: int):
    total = int(
        await db.scalar(select(func.count(Order.id)).where(Order.user_id == user.id)) or 0
    )
    orders = list(
        (
            await db.scalars(
                select(Order)
                .where(Order.user_id == user.id)
                .order_by(Order.placed_at.desc())
                .options(selectinload(Order.items))
                .limit(limit)
                .offset((page - 1) * limit)
            )
        ).all()
    )
    pages = (total + limit - 1) // limit if limit else 0
    return orders, total, pages


async def get_order(db: AsyncSession, user: User, order_number: str) -> Order:
    order = await db.scalar(
        select(Order)
        .where(Order.order_number == order_number, Order.user_id == user.id)
        .options(selectinload(Order.items), selectinload(Order.status_history))
    )
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


async def cancel_order(db: AsyncSession, user: User, order_id: uuid.UUID) -> Order:
    order = await db.get(Order, order_id)
    if order is None or order.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.status not in _CANCELLABLE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order cannot be cancelled while {order.status}",
        )

    if order.payment_status == "paid":
        # Restock what was decremented and flag for refund.
        items = list(
            (await db.scalars(select(OrderItem).where(OrderItem.order_id == order.id))).all()
        )
        for item in items:
            if item.variant_id is not None:
                variant = await db.get(ProductVariant, item.variant_id)
                if variant is not None:
                    variant.stock_quantity += item.quantity
        order.payment_status = "refunded"

    order.status = "cancelled"
    order.cancelled_at = _now()
    db.add(OrderStatusHistory(order_id=order.id, status="cancelled", note="Cancelled by customer"))
    await db.commit()
    return await get_order(db, user, order.order_number)


async def request_return(db: AsyncSession, user: User, order_id: uuid.UUID, reason: str | None) -> Order:
    order = await db.get(Order, order_id)
    if order is None or order.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.status != "delivered":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Returns can only be requested for delivered orders",
        )
    order.status = "return_requested"
    db.add(
        OrderStatusHistory(
            order_id=order.id, status="return_requested", note=reason or "Return requested", changed_by=user.id
        )
    )
    await db.commit()
    return await get_order(db, user, order.order_number)


async def admin_process_return(
    db: AsyncSession, order_id: uuid.UUID, approve: bool, admin_id: uuid.UUID
) -> Order:
    order = await db.scalar(
        select(Order).where(Order.id == order_id).options(selectinload(Order.items))
    )
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.status != "return_requested":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No pending return for this order"
        )
    if approve:
        for item in order.items:
            if item.variant_id is not None:
                variant = await db.get(ProductVariant, item.variant_id)
                if variant is not None:
                    variant.stock_quantity += item.quantity
        order.status = "refunded"
        order.payment_status = "refunded"
        db.add(OrderStatusHistory(order_id=order.id, status="refunded", note="Return approved & refunded", changed_by=admin_id))
    else:
        order.status = "delivered"
        db.add(OrderStatusHistory(order_id=order.id, status="delivered", note="Return rejected", changed_by=admin_id))
    await db.commit()
    return await admin_get_order(db, order_id)


# ============================ Admin / fulfilment ============================
def _stamp_status(order: Order, new_status: str) -> None:
    if new_status == "shipped" and order.shipped_at is None:
        order.shipped_at = _now()
    elif new_status == "delivered":
        if order.delivered_at is None:
            order.delivered_at = _now()
        # COD is collected on delivery.
        if order.payment_method == "cod" and order.payment_status != "paid":
            order.payment_status = "paid"
            order.paid_at = _now()
    order.status = new_status


async def admin_list_orders(
    db: AsyncSession, *, status_filter: str | None, search: str | None, page: int, limit: int
):
    conds = []
    if status_filter:
        conds.append(Order.status == status_filter)
    if search:
        conds.append(Order.order_number.ilike(f"%{search}%"))
    count_stmt = select(func.count(Order.id))
    stmt = select(Order).options(selectinload(Order.items)).order_by(Order.placed_at.desc())
    for c in conds:
        stmt = stmt.where(c)
        count_stmt = count_stmt.where(c)
    total = int(await db.scalar(count_stmt) or 0)
    orders = list((await db.scalars(stmt.limit(limit).offset((page - 1) * limit))).all())
    pages = (total + limit - 1) // limit if limit else 0
    return orders, total, pages


async def admin_get_order(db: AsyncSession, order_id: uuid.UUID) -> Order:
    order = await db.scalar(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items), selectinload(Order.status_history))
    )
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


async def admin_update_status(
    db: AsyncSession, order_id: uuid.UUID, new_status: str, note: str | None, admin_id: uuid.UUID
) -> Order:
    if new_status not in _ADMIN_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")
    order = await db.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    _stamp_status(order, new_status)
    db.add(
        OrderStatusHistory(order_id=order.id, status=new_status, note=note, changed_by=admin_id)
    )
    await db.commit()
    return await admin_get_order(db, order_id)


async def ship_order(db: AsyncSession, order_id: uuid.UUID, admin_id: uuid.UUID) -> Order:
    order = await db.scalar(
        select(Order).where(Order.id == order_id).options(selectinload(Order.items))
    )
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.status not in ("paid", "processing", "packed"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order cannot be shipped while {order.status}",
        )
    if order.awb_number:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order already shipped")

    pincode = order.shipping_address.get("pincode", "")
    serviceability = await shiprocket_service.check_serviceability(db, pincode, 500)
    if not serviceability["serviceable"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Pincode not serviceable"
        )
    courier_id = serviceability["cheapest"]["courier_id"] if serviceability["cheapest"] else None

    created = await shiprocket_service.create_shipment_order(db, order, order.items)
    awb = await shiprocket_service.assign_awb(db, created["shipment_id"], courier_id)

    order.shiprocket_order_id = created["shiprocket_order_id"]
    order.shiprocket_shipment_id = created["shipment_id"]
    order.awb_number = awb["awb_number"]
    order.courier_name = awb["courier_name"]
    order.tracking_url = awb["tracking_url"]
    _stamp_status(order, "shipped")
    db.add(
        OrderStatusHistory(
            order_id=order.id, status="shipped", note=f"AWB {awb['awb_number']}", changed_by=admin_id
        )
    )
    await db.commit()

    # Best-effort pickup scheduling — don't lose the AWB if this fails.
    try:
        await shiprocket_service.schedule_pickup(db, created["shipment_id"])
    except HTTPException:
        pass

    user = await db.get(User, order.user_id)
    if user is not None:
        email_service.send_order_shipped(user.email, order.order_number, order.awb_number, order.tracking_url)
    return await admin_get_order(db, order_id)


async def get_label_url(db: AsyncSession, order_id: uuid.UUID) -> str | None:
    order = await db.get(Order, order_id)
    if order is None or not order.shiprocket_shipment_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found")
    return await shiprocket_service.get_label(db, order.shiprocket_shipment_id)


async def get_order_tracking(db: AsyncSession, user: User, order_number: str) -> dict:
    order = await get_order(db, user, order_number)
    if not order.shiprocket_shipment_id:
        return {"current_status": order.status, "scans": []}
    return await shiprocket_service.get_tracking(db, order.shiprocket_shipment_id)


async def process_shiprocket_webhook(db: AsyncSession, body: bytes) -> None:
    try:
        payload = json.loads(body.decode() or "{}")
    except json.JSONDecodeError:
        return
    awb = payload.get("awb") or payload.get("awb_code")
    raw_status = payload.get("current_status") or payload.get("shipment_status")
    new_status = shiprocket_service.map_status(raw_status)
    if not new_status:
        return

    order = None
    if awb:
        order = await db.scalar(select(Order).where(Order.awb_number == str(awb)))
    if order is None:
        sr_id = payload.get("order_id") or payload.get("channel_order_id")
        if sr_id:
            order = await db.scalar(
                select(Order).where(Order.shiprocket_order_id == str(sr_id))
            )
    if order is None:
        return

    # Only ever advance forward.
    if _STATUS_RANK.get(new_status, 0) <= _STATUS_RANK.get(order.status, 0):
        return
    _stamp_status(order, new_status)
    db.add(OrderStatusHistory(order_id=order.id, status=new_status, note="Shiprocket update"))
    await db.commit()

    if new_status == "delivered":
        user = await db.get(User, order.user_id)
        if user is not None:
            email_service.send_order_delivered(user.email, order.order_number)
