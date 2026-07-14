"""Homepage banner logic. Banners link to a product and reuse its primary
image (bytes in Postgres), so image resolution is a subquery over product_images."""
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.banner import Banner
from app.models.product import Product, ProductImage
from app.schemas.banner import BannerCreate, BannerUpdate


def _primary_image_subq():
    """Scalar subquery: the correlated banner's product primary image id."""
    return (
        select(ProductImage.id)
        .where(ProductImage.product_id == Banner.product_id, ProductImage.is_deleted.is_(False))
        .order_by(ProductImage.is_primary.desc(), ProductImage.display_order)
        .limit(1)
        .scalar_subquery()
    )


async def list_public(db: AsyncSession) -> list[dict]:
    """Active banners for the storefront hero. Returns [] gracefully if the
    banners table doesn't exist yet (code deployed before the migration ran)."""
    stmt = (
        select(Banner, Product.slug, _primary_image_subq())
        .join(Product, Product.id == Banner.product_id, isouter=True)
        .where(Banner.is_active.is_(True))
        .order_by(Banner.sort_order, Banner.created_at)
    )
    try:
        rows = (await db.execute(stmt)).all()
    except ProgrammingError:
        await db.rollback()
        return []
    return [
        {
            "id": b.id,
            "title": b.title,
            "subtitle": b.subtitle,
            "cta_text": b.cta_text,
            "product_slug": slug,
            "image_id": img_id,
        }
        for b, slug, img_id in rows
    ]


async def admin_list(db: AsyncSession) -> list[dict]:
    stmt = (
        select(Banner, Product.name, Product.slug, _primary_image_subq())
        .join(Product, Product.id == Banner.product_id, isouter=True)
        .order_by(Banner.sort_order, Banner.created_at)
    )
    rows = (await db.execute(stmt)).all()
    return [
        {
            "id": b.id,
            "title": b.title,
            "subtitle": b.subtitle,
            "cta_text": b.cta_text,
            "product_id": b.product_id,
            "sort_order": b.sort_order,
            "is_active": b.is_active,
            "created_at": b.created_at,
            "product_name": name,
            "product_slug": slug,
            "image_id": img_id,
        }
        for b, name, slug, img_id in rows
    ]


async def create(db: AsyncSession, data: BannerCreate) -> uuid.UUID:
    banner = Banner(**data.model_dump())
    db.add(banner)
    await db.commit()
    await db.refresh(banner)
    return banner.id


async def update(db: AsyncSession, banner_id: uuid.UUID, data: BannerUpdate) -> None:
    banner = await db.get(Banner, banner_id)
    if banner is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Banner not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(banner, field, value)
    await db.commit()


async def delete(db: AsyncSession, banner_id: uuid.UUID) -> None:
    banner = await db.get(Banner, banner_id)
    if banner is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Banner not found")
    await db.delete(banner)
    await db.commit()
