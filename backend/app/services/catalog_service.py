"""Catalog business logic: categories, products, variants, and product images.

Routes stay thin and delegate here. Images are stored as BYTEA on product_images
(see image_service for the Pillow pipeline).
"""
import re
import uuid
from typing import Sequence

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.product import Category, Product, ProductImage, ProductVariant
from app.models.review import Review
from app.schemas.product import (
    CategoryCreate,
    CategoryUpdate,
    ProductCreate,
    ProductUpdate,
    VariantCreate,
    VariantUpdate,
)
from app.services.image_service import IngestedImage

_SLUG_RE = re.compile(r"[^a-z0-9]+")


def _slugify(text: str) -> str:
    return _SLUG_RE.sub("-", text.lower()).strip("-") or "item"


async def _unique_slug(db: AsyncSession, model, base: str, exclude_id=None) -> str:
    slug = _slugify(base)
    candidate = slug
    n = 1
    while True:
        stmt = select(model.id).where(model.slug == candidate)
        if exclude_id is not None:
            stmt = stmt.where(model.id != exclude_id)
        if await db.scalar(stmt) is None:
            return candidate
        n += 1
        candidate = f"{slug}-{n}"


# ---------------------------------------------------------------- Ratings
async def _ratings_for(db: AsyncSession, product_ids: Sequence[uuid.UUID]) -> dict:
    if not product_ids:
        return {}
    rows = await db.execute(
        select(
            Review.product_id,
            func.avg(Review.rating),
            func.count(Review.id),
        )
        .where(Review.product_id.in_(product_ids), Review.is_approved.is_(True))
        .group_by(Review.product_id)
    )
    return {pid: (float(avg or 0), int(count)) for pid, avg, count in rows}


def _primary_image(product: Product) -> ProductImage | None:
    live = [i for i in product.images if not i.is_deleted]
    if not live:
        return None
    live.sort(key=lambda i: (not i.is_primary, i.display_order))
    return live[0]


# --------------------------------------------------------------- Categories
async def get_category_tree(db: AsyncSession, include_inactive: bool = False) -> list[Category]:
    stmt = select(Category).order_by(Category.sort_order, Category.name)
    if not include_inactive:
        stmt = stmt.where(Category.is_active.is_(True))
    cats = list((await db.scalars(stmt)).all())
    by_id = {c.id: {"obj": c, "children": []} for c in cats}
    roots = []
    for c in cats:
        node = by_id[c.id]
        if c.parent_id and c.parent_id in by_id:
            by_id[c.parent_id]["children"].append(node)
        else:
            roots.append(node)
    return roots  # list of {"obj": Category, "children": [...]}


async def create_category(db: AsyncSession, data: CategoryCreate) -> Category:
    slug = await _unique_slug(db, Category, data.slug or data.name)
    cat = Category(
        name=data.name,
        slug=slug,
        parent_id=data.parent_id,
        sort_order=data.sort_order,
        is_active=data.is_active,
    )
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return cat


async def update_category(db: AsyncSession, category_id: uuid.UUID, data: CategoryUpdate) -> Category:
    cat = await db.get(Category, category_id)
    if cat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(cat, field, value)
    await db.commit()
    await db.refresh(cat)
    return cat


async def delete_category(db: AsyncSession, category_id: uuid.UUID) -> None:
    cat = await db.get(Category, category_id)
    if cat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    has_products = await db.scalar(select(Product.id).where(Product.category_id == category_id))
    has_children = await db.scalar(select(Category.id).where(Category.parent_id == category_id))
    if has_products or has_children:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category has products or subcategories; deactivate it instead",
        )
    await db.delete(cat)
    await db.commit()


# ----------------------------------------------------------------- Products
_PRODUCT_LOADERS = (selectinload(Product.variants), selectinload(Product.images))


async def create_product(db: AsyncSession, data: ProductCreate) -> Product:
    slug = await _unique_slug(db, Product, data.name)
    sku = data.sku or f"BS-{uuid.uuid4().hex[:8].upper()}"
    if await db.scalar(select(Product.id).where(Product.sku == sku)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="SKU already exists")
    product = Product(**data.model_dump(exclude={"sku"}), slug=slug, sku=sku)
    db.add(product)
    await db.commit()
    return await get_product_by_id(db, product.id)


async def update_product(db: AsyncSession, product_id: uuid.UUID, data: ProductUpdate) -> Product:
    product = await db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    await db.commit()
    return await get_product_by_id(db, product_id)


async def soft_delete_product(db: AsyncSession, product_id: uuid.UUID) -> None:
    product = await db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    product.is_active = False
    await db.commit()


async def get_product_by_id(db: AsyncSession, product_id: uuid.UUID) -> Product:
    product = await db.scalar(
        select(Product).where(Product.id == product_id).options(*_PRODUCT_LOADERS)
    )
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


async def get_product_detail(db: AsyncSession, slug: str, active_only: bool = True):
    stmt = select(Product).where(Product.slug == slug).options(*_PRODUCT_LOADERS)
    if active_only:
        stmt = stmt.where(Product.is_active.is_(True))
    product = await db.scalar(stmt)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    ratings = await _ratings_for(db, [product.id])
    avg, count = ratings.get(product.id, (0.0, 0))
    # Keep only live images, sorted.
    product.images = sorted(
        [i for i in product.images if not i.is_deleted],
        key=lambda i: (not i.is_primary, i.display_order),
    )
    return product, avg, count


async def list_products(
    db: AsyncSession,
    *,
    category_slug: str | None = None,
    search: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    sort: str = "newest",
    page: int = 1,
    limit: int = 20,
    include_inactive: bool = False,
    featured_only: bool = False,
):
    stmt = select(Product).options(*_PRODUCT_LOADERS)
    count_stmt = select(func.count(Product.id))

    conds = []
    if not include_inactive:
        conds.append(Product.is_active.is_(True))
    if featured_only:
        conds.append(Product.is_featured.is_(True))
    if category_slug:
        cat_id = await db.scalar(select(Category.id).where(Category.slug == category_slug))
        conds.append(Product.category_id == (cat_id or uuid.uuid4()))
    if min_price is not None:
        conds.append(Product.selling_price >= min_price)
    if max_price is not None:
        conds.append(Product.selling_price <= max_price)
    if search:
        like = f"%{search}%"
        conds.append(
            or_(
                Product.name.ilike(like),
                Product.brand.ilike(like),
                Product.description.ilike(like),
            )
        )
    for c in conds:
        stmt = stmt.where(c)
        count_stmt = count_stmt.where(c)

    order = {
        "price_asc": Product.selling_price.asc(),
        "price_desc": Product.selling_price.desc(),
        "newest": Product.created_at.desc(),
    }.get(sort, Product.created_at.desc())
    stmt = stmt.order_by(order)

    total = int(await db.scalar(count_stmt) or 0)
    page = max(page, 1)
    stmt = stmt.limit(limit).offset((page - 1) * limit)
    products = list((await db.scalars(stmt)).all())

    ratings = await _ratings_for(db, [p.id for p in products])
    items = []
    for p in products:
        avg, count = ratings.get(p.id, (0.0, 0))
        items.append(
            {
                "product": p,
                "primary_image": _primary_image(p),
                "total_stock": sum(v.stock_quantity for v in p.variants),
                "avg_rating": avg,
                "review_count": count,
            }
        )
    pages = (total + limit - 1) // limit if limit else 0
    return items, total, page, pages


# ------------------------------------------------------------------- Variants
async def add_variant(db: AsyncSession, product_id: uuid.UUID, data: VariantCreate) -> ProductVariant:
    product = await db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    sku = data.sku or f"{product.sku}-{uuid.uuid4().hex[:4].upper()}"
    if await db.scalar(select(ProductVariant.id).where(ProductVariant.sku == sku)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Variant SKU exists")
    variant = ProductVariant(**data.model_dump(exclude={"sku"}), product_id=product_id, sku=sku)
    db.add(variant)
    await db.commit()
    await db.refresh(variant)
    return variant


async def update_variant(db: AsyncSession, variant_id: uuid.UUID, data: VariantUpdate) -> ProductVariant:
    variant = await db.get(ProductVariant, variant_id)
    if variant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(variant, field, value)
    await db.commit()
    await db.refresh(variant)
    return variant


async def set_variant_stock(db: AsyncSession, variant_id: uuid.UUID, stock: int) -> ProductVariant:
    variant = await db.get(ProductVariant, variant_id)
    if variant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found")
    variant.stock_quantity = stock
    await db.commit()
    await db.refresh(variant)
    return variant


# --------------------------------------------------------------------- Images
async def add_product_image(
    db: AsyncSession,
    product_id: uuid.UUID,
    ingested: IngestedImage,
    *,
    is_primary: bool = False,
    alt_text: str | None = None,
) -> ProductImage:
    product = await db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    live = list(
        (
            await db.scalars(
                select(ProductImage).where(
                    ProductImage.product_id == product_id,
                    ProductImage.is_deleted.is_(False),
                )
            )
        ).all()
    )
    # First image is primary by default; explicit primary demotes the others.
    make_primary = is_primary or len(live) == 0
    if make_primary:
        for img in live:
            img.is_primary = False

    image = ProductImage(
        product_id=product_id,
        image_data=ingested.data,
        content_type=ingested.content_type,
        file_size=ingested.file_size,
        width=ingested.width,
        height=ingested.height,
        alt_text=alt_text,
        display_order=len(live),
        is_primary=make_primary,
    )
    db.add(image)
    await db.commit()
    await db.refresh(image)
    return image


async def soft_delete_image(db: AsyncSession, product_id: uuid.UUID, image_id: uuid.UUID) -> None:
    image = await db.get(ProductImage, image_id)
    if image is None or image.product_id != product_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    image.is_deleted = True
    image.is_primary = False
    await db.commit()


async def reorder_images(
    db: AsyncSession, product_id: uuid.UUID, image_ids: list[uuid.UUID]
) -> list[ProductImage]:
    images = list(
        (
            await db.scalars(
                select(ProductImage).where(
                    ProductImage.product_id == product_id,
                    ProductImage.is_deleted.is_(False),
                )
            )
        ).all()
    )
    by_id = {i.id: i for i in images}
    for order, image_id in enumerate(image_ids):
        if image_id in by_id:
            by_id[image_id].display_order = order
    await db.commit()
    return sorted(images, key=lambda i: i.display_order)
