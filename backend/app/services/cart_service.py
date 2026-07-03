"""Cart business logic. Prices are always computed live from the DB — the
client's notion of price is never trusted.
"""
import uuid

from fastapi import HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.cart import CartItem
from app.models.product import Product, ProductVariant
from app.schemas.cart import (
    CartItemResponse,
    CartProductBrief,
    CartResponse,
    CartVariantBrief,
)

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
