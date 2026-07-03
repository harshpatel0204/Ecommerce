"""ORM -> Pydantic response mappers for the catalog, shared by public + admin routes."""
from app.models.product import Category, Product, ProductImage
from app.schemas.product import (
    CategoryResponse,
    ProductDetail,
    ProductImageResponse,
    ProductListItem,
)


def to_image(image: ProductImage) -> ProductImageResponse:
    return ProductImageResponse.model_validate(image)


def to_list_item(entry: dict) -> ProductListItem:
    p: Product = entry["product"]
    primary = entry["primary_image"]
    return ProductListItem(
        id=p.id,
        name=p.name,
        slug=p.slug,
        brand=p.brand,
        base_price=float(p.base_price),
        selling_price=float(p.selling_price),
        is_active=p.is_active,
        is_featured=p.is_featured,
        primary_image=to_image(primary) if primary else None,
        total_stock=entry["total_stock"],
        avg_rating=entry["avg_rating"],
        review_count=entry["review_count"],
    )


def to_detail(product: Product, avg_rating: float, review_count: int) -> ProductDetail:
    detail = ProductDetail.model_validate(product)
    detail.avg_rating = avg_rating
    detail.review_count = review_count
    return detail


def to_category_response(node: dict) -> CategoryResponse:
    cat: Category = node["obj"]
    return CategoryResponse(
        id=cat.id,
        name=cat.name,
        slug=cat.slug,
        parent_id=cat.parent_id,
        sort_order=cat.sort_order,
        is_active=cat.is_active,
        children=[to_category_response(child) for child in node["children"]],
    )
