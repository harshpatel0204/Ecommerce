"""Cart and wishlist schemas."""
import uuid

from pydantic import BaseModel, ConfigDict, Field


class CartItemAdd(BaseModel):
    variant_id: uuid.UUID
    quantity: int = Field(default=1, ge=1, le=10)


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=0, le=10)  # 0 removes the item


class CartProductBrief(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    image_id: uuid.UUID | None = None


class CartVariantBrief(BaseModel):
    id: uuid.UUID
    sku: str
    size: str | None = None
    color: str | None = None
    color_hex: str | None = None
    stock_quantity: int


class CartItemResponse(BaseModel):
    id: uuid.UUID
    quantity: int
    product: CartProductBrief
    variant: CartVariantBrief
    unit_price: float
    line_total: float
    available: bool  # false if variant/product went inactive or out of stock


class CartResponse(BaseModel):
    items: list[CartItemResponse]
    subtotal: float
    item_count: int


class WishlistItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
