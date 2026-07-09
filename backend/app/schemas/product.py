"""Pydantic v2 schemas for the catalog (categories, products, variants, images)."""
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, computed_field


# ------------------------------------------------------------------- Images
class ProductImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    is_primary: bool
    display_order: int
    alt_text: str | None = None
    width: int | None = None
    height: int | None = None

    @computed_field
    @property
    def url(self) -> str:
        # Clients append ?w=/&h=/&q= for on-the-fly resizing.
        return f"/api/images/{self.id}"


class ImageReorderRequest(BaseModel):
    image_ids: list[uuid.UUID]


# ----------------------------------------------------------------- Categories
class CategoryBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    slug: str | None = Field(default=None, max_length=100)
    parent_id: uuid.UUID | None = None
    sort_order: int = 0
    is_active: bool = True


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    parent_id: uuid.UUID | None = None
    sort_order: int | None = None
    is_active: bool | None = None


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    parent_id: uuid.UUID | None
    sort_order: int
    is_active: bool
    children: list["CategoryResponse"] = []


# ------------------------------------------------------------------- Variants
class VariantBase(BaseModel):
    size: str | None = Field(default=None, max_length=20)
    color: str | None = Field(default=None, max_length=30)
    color_hex: str | None = Field(default=None, max_length=10)
    price_delta: float = 0
    stock_quantity: int = Field(default=0, ge=0)
    low_stock_threshold: int = Field(default=5, ge=0)
    is_active: bool = True


class VariantCreate(VariantBase):
    sku: str | None = Field(default=None, max_length=50)


class VariantUpdate(BaseModel):
    size: str | None = Field(default=None, max_length=20)
    color: str | None = Field(default=None, max_length=30)
    color_hex: str | None = Field(default=None, max_length=10)
    price_delta: float | None = None
    stock_quantity: int | None = Field(default=None, ge=0)
    low_stock_threshold: int | None = Field(default=None, ge=0)
    is_active: bool | None = None


class StockUpdate(BaseModel):
    stock_quantity: int = Field(ge=0)


class VariantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    sku: str
    size: str | None
    color: str | None
    color_hex: str | None
    price_delta: float
    stock_quantity: int
    low_stock_threshold: int
    is_active: bool


# ------------------------------------------------------------------- Products
class ProductBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    category_id: uuid.UUID | None = None
    sku: str | None = Field(default=None, max_length=50)
    description: str | None = Field(default=None, max_length=5000)
    short_desc: str | None = Field(default=None, max_length=500)
    brand: str | None = Field(default=None, max_length=100)
    base_price: float = Field(gt=0)
    selling_price: float = Field(gt=0)
    tax_percent: float = 18
    weight_grams: int = Field(default=500, ge=0)
    length_cm: float | None = None
    width_cm: float | None = None
    height_cm: float | None = None
    is_active: bool = True
    is_featured: bool = False
    meta_title: str | None = Field(default=None, max_length=255)
    meta_desc: str | None = Field(default=None, max_length=500)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    category_id: uuid.UUID | None = None
    description: str | None = Field(default=None, max_length=5000)
    short_desc: str | None = Field(default=None, max_length=500)
    brand: str | None = Field(default=None, max_length=100)
    base_price: float | None = Field(default=None, gt=0)
    selling_price: float | None = Field(default=None, gt=0)
    tax_percent: float | None = None
    weight_grams: int | None = Field(default=None, ge=0)
    length_cm: float | None = None
    width_cm: float | None = None
    height_cm: float | None = None
    is_active: bool | None = None
    is_featured: bool | None = None
    meta_title: str | None = Field(default=None, max_length=255)
    meta_desc: str | None = Field(default=None, max_length=500)


class ImportRowError(BaseModel):
    row: int
    error: str


class ProductImportResult(BaseModel):
    created: int
    errors: list[ImportRowError]


def _discount_percent(base: float, selling: float) -> int:
    if base and base > selling:
        return round((base - selling) / base * 100)
    return 0


class ProductListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    brand: str | None
    base_price: float
    selling_price: float
    is_active: bool
    is_featured: bool
    primary_image: ProductImageResponse | None = None
    total_stock: int = 0
    avg_rating: float = 0
    review_count: int = 0

    @computed_field
    @property
    def discount_percent(self) -> int:
        return _discount_percent(self.base_price, self.selling_price)


class ProductDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    sku: str
    description: str | None
    short_desc: str | None
    brand: str | None
    category_id: uuid.UUID | None
    base_price: float
    selling_price: float
    tax_percent: float
    weight_grams: int
    length_cm: float | None
    width_cm: float | None
    height_cm: float | None
    is_active: bool
    is_featured: bool
    meta_title: str | None
    meta_desc: str | None
    created_at: datetime
    variants: list[VariantResponse] = []
    images: list[ProductImageResponse] = []
    avg_rating: float = 0
    review_count: int = 0

    @computed_field
    @property
    def discount_percent(self) -> int:
        return _discount_percent(self.base_price, self.selling_price)


class PaginatedProducts(BaseModel):
    items: list[ProductListItem]
    total: int
    page: int
    pages: int
    limit: int
