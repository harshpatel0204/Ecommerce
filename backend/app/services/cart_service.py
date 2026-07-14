"""Cart business logic. Prices are always computed live from the DB — the
client's notion of price is never trusted.
"""
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.cart import CartItem
from app.models.product import Product, ProductVariant
from app.models.user import User
from app.schemas.cart import (
    CartItemResponse,
    CartProductBrief,
    CartResponse,
    CartVariantBrief,
)
from app.services import email_service

_MAX_CART_ITEMS = 20


def _primary_image_id(product: Product) -> uuid.UUID | None:
    live = [i for i in product.images if not i.is_deleted]
    if not live:
        return None
    live.sort(key=lambda i: (not i.is_primary, i.display_order))
    return live[0].id


async def _load_variant(db: AsyncSession, variant_id: uuid.UUID) -> ProductVariant:
    variant = await db.scalar(
        select(ProductVariant)
        .where(ProductVariant.id == variant_id)
        .options(selectinload(ProductVariant.product).selectinload(Product.images))
    )
    if variant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found")
    return variant


def _unit_price(variant: ProductVariant) -> float:
    return float(variant.product.selling_price) + float(variant.price_delta)


async def get_cart(db: AsyncSession, user_id: uuid.UUID) -> CartResponse:
    items = list(
        (
            await db.scalars(
                select(CartItem).where(CartItem.user_id == user_id).order_by(CartItem.added_at)
            )
        ).all()
    )
    if not items:
        return CartResponse(items=[], subtotal=0, item_count=0)

    variant_ids = [i.variant_id for i in items]
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

    out: list[CartItemResponse] = []
    subtotal = 0.0
    count = 0
    for item in items:
        variant = variants.get(item.variant_id)
        if variant is None:
            continue
        product = variant.product
        available = (
            variant.is_active and product.is_active and variant.stock_quantity >= item.quantity
        )
        unit = _unit_price(variant)
        line = unit * item.quantity
        if available:
            subtotal += line
            count += item.quantity
        out.append(
            CartItemResponse(
                id=item.id,
                quantity=item.quantity,
                product=CartProductBrief(
                    id=product.id,
                    name=product.name,
                    slug=product.slug,
                    image_id=_primary_image_id(product),
                ),
                variant=CartVariantBrief(
                    id=variant.id,
                    sku=variant.sku,
                    size=variant.size,
                    color=variant.color,
                    color_hex=variant.color_hex,
                    stock_quantity=variant.stock_quantity,
                ),
                unit_price=unit,
                line_total=line,
                available=available,
            )
        )
    return CartResponse(items=out, subtotal=round(subtotal, 2), item_count=count)


async def add_item(
    db: AsyncSession, user_id: uuid.UUID, variant_id: uuid.UUID, quantity: int
) -> CartResponse:
    variant = await _load_variant(db, variant_id)
    if not variant.is_active or not variant.product.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product unavailable")

    existing = await db.scalar(
        select(CartItem).where(CartItem.user_id == user_id, CartItem.variant_id == variant_id)
    )
    desired = (existing.quantity if existing else 0) + quantity
    if desired > variant.stock_quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only {variant.stock_quantity} in stock",
        )

    if existing:
        existing.quantity = desired
    else:
        # Soft cap on the number of distinct cart lines.
        line_count = await db.scalar(
            select(func.count(CartItem.id)).where(CartItem.user_id == user_id)
        )
        if (line_count or 0) >= _MAX_CART_ITEMS:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is full")
        db.add(CartItem(user_id=user_id, variant_id=variant_id, quantity=quantity))
    await db.commit()
    return await get_cart(db, user_id)


async def update_item(
    db: AsyncSession, user_id: uuid.UUID, item_id: uuid.UUID, quantity: int
) -> CartResponse:
    item = await db.get(CartItem, item_id)
    if item is None or item.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
    if quantity == 0:
        await db.delete(item)
        await db.commit()
        return await get_cart(db, user_id)
    variant = await _load_variant(db, item.variant_id)
    if quantity > variant.stock_quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only {variant.stock_quantity} in stock",
        )
    item.quantity = quantity
    await db.commit()
    return await get_cart(db, user_id)


async def remove_item(db: AsyncSession, user_id: uuid.UUID, item_id: uuid.UUID) -> CartResponse:
    item = await db.get(CartItem, item_id)
    if item is None or item.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
    await db.delete(item)
    await db.commit()
    return await get_cart(db, user_id)


async def clear_cart(db: AsyncSession, user_id: uuid.UUID) -> CartResponse:
    await db.execute(delete(CartItem).where(CartItem.user_id == user_id))
    await db.commit()
    return CartResponse(items=[], subtotal=0, item_count=0)


async def admin_list_abandoned_carts(db: AsyncSession, hours: int = 3) -> list[dict]:
    """Non-empty carts whose oldest item has sat untouched longer than `hours`.
    Value is computed live (product selling price + variant delta) x quantity."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    price = Product.selling_price + ProductVariant.price_delta
    rows = await db.execute(
        select(
            User.id,
            User.full_name,
            User.email,
            func.count(CartItem.id),
            func.coalesce(func.sum(price * CartItem.quantity), 0),
            func.min(CartItem.added_at),
            func.bool_or(CartItem.reminder_sent_at.isnot(None)),
        )
        .join(CartItem, CartItem.user_id == User.id)
        .join(ProductVariant, ProductVariant.id == CartItem.variant_id)
        .join(Product, Product.id == ProductVariant.product_id)
        .where(User.is_active.is_(True))
        .group_by(User.id, User.full_name, User.email)
        .having(func.min(CartItem.added_at) < cutoff)
        .order_by(func.min(CartItem.added_at))
    )
    return [
        {
            "user_id": uid,
            "full_name": name,
            "email": email,
            "item_count": int(count),
            "total_value": float(value or 0),
            "oldest_added_at": oldest,
            "reminder_sent": bool(reminded),
        }
        for uid, name, email, count, value, oldest, reminded in rows
    ]


async def send_abandoned_cart_reminders(db: AsyncSession) -> int:
    """Email users whose cart items sat untouched for 24h–7d. Called by the
    daily cron. Each item is reminded about at most once (reminder_sent_at)."""
    now = datetime.now(timezone.utc)
    newest_allowed = now - timedelta(hours=24)
    oldest_allowed = now - timedelta(days=7)

    rows = await db.execute(
        select(User.id, User.email, User.full_name, func.count(CartItem.id))
        .join(CartItem, CartItem.user_id == User.id)
        .where(
            CartItem.reminder_sent_at.is_(None),
            CartItem.added_at < newest_allowed,
            CartItem.added_at > oldest_allowed,
            User.is_active.is_(True),
        )
        .group_by(User.id, User.email, User.full_name)
    )

    cart_link = f"{settings.FRONTEND_URL.rstrip('/')}/cart"
    sent = 0
    for user_id, email, full_name, item_count in rows:
        email_service.send_abandoned_cart(email, full_name, item_count, cart_link)
        await db.execute(
            update(CartItem)
            .where(CartItem.user_id == user_id, CartItem.reminder_sent_at.is_(None))
            .values(reminder_sent_at=now)
        )
        sent += 1
    await db.commit()
    return sent
