"""Wishlist business logic."""
import uuid

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.cart import WishlistItem
from app.models.product import Product
from app.services.catalog_service import _primary_image, _ratings_for


async def get_wishlist(db: AsyncSession, user_id: uuid.UUID) -> list[dict]:
    product_ids = list(
        (
            await db.scalars(
                select(WishlistItem.product_id)
                .where(WishlistItem.user_id == user_id)
                .order_by(WishlistItem.added_at.desc())
            )
        ).all()
    )
    if not product_ids:
        return []
    products = {
        p.id: p
        for p in (
            await db.scalars(
                select(Product)
                .where(Product.id.in_(product_ids))
                .options(selectinload(Product.images), selectinload(Product.variants))
            )
        ).all()
    }
    ratings = await _ratings_for(db, product_ids)
    entries = []
    for pid in product_ids:  # preserve added order
        p = products.get(pid)
        if p is None:
            continue
        avg, count = ratings.get(pid, (0.0, 0))
        entries.append(
            {
                "product": p,
                "primary_image": _primary_image(p),
                "total_stock": sum(v.stock_quantity for v in p.variants),
                "avg_rating": avg,
                "review_count": count,
            }
        )
    return entries


async def add_to_wishlist(db: AsyncSession, user_id: uuid.UUID, product_id: uuid.UUID) -> None:
    product = await db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    existing = await db.scalar(
        select(WishlistItem.id).where(
            WishlistItem.user_id == user_id, WishlistItem.product_id == product_id
        )
    )
    if existing is None:  # idempotent
        db.add(WishlistItem(user_id=user_id, product_id=product_id))
        await db.commit()


async def remove_from_wishlist(db: AsyncSession, user_id: uuid.UUID, product_id: uuid.UUID) -> None:
    await db.execute(
        delete(WishlistItem).where(
            WishlistItem.user_id == user_id, WishlistItem.product_id == product_id
        )
    )
    await db.commit()
