"""Public (unauthenticated) catalog endpoints."""
from fastapi import APIRouter, Query

from app.api.routes._catalog_mappers import to_category_response, to_detail, to_list_item
from app.core.deps import DbSession
from app.schemas.product import (
    CategoryResponse,
    PaginatedProducts,
    ProductDetail,
    ProductListItem,
)
from app.services import catalog_service

router = APIRouter(tags=["catalog"])


@router.get("/products", response_model=PaginatedProducts)
async def list_products(
    db: DbSession,
    category_slug: str | None = None,
    search: str | None = None,
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    sort: str = Query(default="newest", pattern="^(price_asc|price_desc|newest)$"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
) -> PaginatedProducts:
    items, total, page, pages = await catalog_service.list_products(
        db,
        category_slug=category_slug,
        search=search,
        min_price=min_price,
        max_price=max_price,
        sort=sort,
        page=page,
        limit=limit,
    )
    return PaginatedProducts(
        items=[to_list_item(i) for i in items], total=total, page=page, pages=pages, limit=limit
    )


@router.get("/products/featured", response_model=list[ProductListItem])
async def featured_products(db: DbSession) -> list[ProductListItem]:
    items, _, _, _ = await catalog_service.list_products(db, featured_only=True, limit=12)
    return [to_list_item(i) for i in items]


@router.get("/search", response_model=PaginatedProducts)
async def search_products(
    db: DbSession,
    q: str = Query(min_length=1),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
) -> PaginatedProducts:
    items, total, page, pages = await catalog_service.list_products(
        db, search=q, page=page, limit=limit
    )
    return PaginatedProducts(
        items=[to_list_item(i) for i in items], total=total, page=page, pages=pages, limit=limit
    )


@router.get("/products/{slug}", response_model=ProductDetail)
async def product_detail(slug: str, db: DbSession) -> ProductDetail:
    product, avg, count = await catalog_service.get_product_detail(db, slug)
    return to_detail(product, avg, count)


@router.get("/categories", response_model=list[CategoryResponse])
async def category_tree(db: DbSession) -> list[CategoryResponse]:
    tree = await catalog_service.get_category_tree(db)
    return [to_category_response(node) for node in tree]
