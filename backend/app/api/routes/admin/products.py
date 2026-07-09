"""Admin catalog management. Every route requires get_current_admin."""
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.api.routes._catalog_mappers import to_category_response, to_detail, to_image, to_list_item
from app.core.deps import DbSession, get_current_admin
from app.schemas.product import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
    ImageReorderRequest,
    PaginatedProducts,
    ProductCreate,
    ProductDetail,
    ProductImageResponse,
    ProductImportResult,
    ProductUpdate,
    StockUpdate,
    VariantCreate,
    VariantResponse,
    VariantUpdate,
)
from app.services import catalog_service, image_service

# Admin gate applied to the whole router.
router = APIRouter(prefix="/admin", tags=["admin:catalog"], dependencies=[Depends(get_current_admin)])


# ------------------------------------------------------------------ Categories
@router.get("/categories", response_model=list[CategoryResponse])
async def list_categories(db: DbSession) -> list[CategoryResponse]:
    tree = await catalog_service.get_category_tree(db, include_inactive=True)
    return [to_category_response(node) for node in tree]


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(data: CategoryCreate, db: DbSession) -> CategoryResponse:
    cat = await catalog_service.create_category(db, data)
    return to_category_response({"obj": cat, "children": []})


@router.patch("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(category_id: uuid.UUID, data: CategoryUpdate, db: DbSession) -> CategoryResponse:
    cat = await catalog_service.update_category(db, category_id, data)
    return to_category_response({"obj": cat, "children": []})


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(category_id: uuid.UUID, db: DbSession) -> None:
    await catalog_service.delete_category(db, category_id)


# -------------------------------------------------------------------- Products
@router.get("/products", response_model=PaginatedProducts)
async def list_products(
    db: DbSession,
    search: str | None = None,
    category_slug: str | None = None,
    page: int = 1,
    limit: int = 20,
) -> PaginatedProducts:
    items, total, page, pages = await catalog_service.list_products(
        db, search=search, category_slug=category_slug, page=page, limit=limit, include_inactive=True
    )
    return PaginatedProducts(
        items=[to_list_item(i) for i in items], total=total, page=page, pages=pages, limit=limit
    )


@router.get("/products/{product_id}", response_model=ProductDetail)
async def get_product(product_id: uuid.UUID, db: DbSession) -> ProductDetail:
    product, avg, count = await catalog_service.get_product_admin_detail(db, product_id)
    return to_detail(product, avg, count)


@router.post("/products", response_model=ProductDetail, status_code=status.HTTP_201_CREATED)
async def create_product(data: ProductCreate, db: DbSession) -> ProductDetail:
    product = await catalog_service.create_product(db, data)
    return to_detail(product, 0, 0)


@router.post("/products/import-csv", response_model=ProductImportResult)
async def import_products_csv(db: DbSession, file: UploadFile = File(...)) -> ProductImportResult:
    raw = await file.read()
    try:
        # utf-8-sig strips the BOM Excel prepends to exported CSVs.
        content = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be UTF-8 encoded CSV",
        )
    created, errors = await catalog_service.import_products_from_csv(db, content)
    return ProductImportResult(created=created, errors=errors)


@router.patch("/products/{product_id}", response_model=ProductDetail)
async def update_product(product_id: uuid.UUID, data: ProductUpdate, db: DbSession) -> ProductDetail:
    product = await catalog_service.update_product(db, product_id, data)
    return to_detail(product, 0, 0)


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: uuid.UUID, db: DbSession) -> None:
    await catalog_service.soft_delete_product(db, product_id)


# -------------------------------------------------------------------- Variants
@router.post("/products/{product_id}/variants", response_model=VariantResponse, status_code=201)
async def add_variant(product_id: uuid.UUID, data: VariantCreate, db: DbSession) -> VariantResponse:
    variant = await catalog_service.add_variant(db, product_id, data)
    return VariantResponse.model_validate(variant)


@router.patch("/variants/{variant_id}", response_model=VariantResponse)
async def update_variant(variant_id: uuid.UUID, data: VariantUpdate, db: DbSession) -> VariantResponse:
    variant = await catalog_service.update_variant(db, variant_id, data)
    return VariantResponse.model_validate(variant)


@router.patch("/variants/{variant_id}/stock", response_model=VariantResponse)
async def update_stock(variant_id: uuid.UUID, data: StockUpdate, db: DbSession) -> VariantResponse:
    variant = await catalog_service.set_variant_stock(db, variant_id, data.stock_quantity)
    return VariantResponse.model_validate(variant)


# ---------------------------------------------------------------------- Images
@router.post(
    "/products/{product_id}/images",
    response_model=ProductImageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_image(
    product_id: uuid.UUID,
    db: DbSession,
    file: UploadFile = File(...),
    is_primary: bool = Form(default=False),
    alt_text: str | None = Form(default=None),
) -> ProductImageResponse:
    ingested = await image_service.validate_and_ingest(file)
    image = await catalog_service.add_product_image(
        db, product_id, ingested, is_primary=is_primary, alt_text=alt_text
    )
    return to_image(image)


@router.delete(
    "/products/{product_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_image(product_id: uuid.UUID, image_id: uuid.UUID, db: DbSession) -> None:
    await catalog_service.soft_delete_image(db, product_id, image_id)


@router.patch("/products/{product_id}/images/reorder", response_model=list[ProductImageResponse])
async def reorder_images(
    product_id: uuid.UUID, data: ImageReorderRequest, db: DbSession
) -> list[ProductImageResponse]:
    images = await catalog_service.reorder_images(db, product_id, data.image_ids)
    return [to_image(i) for i in images]
