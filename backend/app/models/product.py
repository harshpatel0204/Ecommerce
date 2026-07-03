"""Catalog models: Category, Product, ProductVariant, ProductImage.

Images are stored IN the database as BYTEA (no Cloudinary) and served via
/api/images/{id}. Stock lives on variants, not products.
"""
import uuid

from sqlalchemy import (
    Boolean,
    ForeignKey,
    Index,
    Integer,
    LargeBinary,
    Numeric,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import CreatedAtMixin, TimestampMixin, UUIDMixin


class Category(UUIDMixin, CreatedAtMixin, Base):
    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id")
    )
    # Category banner bytes (served via /api/images) — no external image host.
    image_data: Mapped[bytes | None] = mapped_column(LargeBinary)
    image_content_type: Mapped[str | None] = mapped_column(String(100))
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")

    children: Mapped[list["Category"]] = relationship(
        backref="parent", remote_side="Category.id"
    )
    products: Mapped[list["Product"]] = relationship(back_populates="category")

    def __repr__(self) -> str:
        return f"<Category {self.slug}>"


class Product(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "products"

    category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id")
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    sku: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    short_desc: Mapped[str | None] = mapped_column(String(500))
    brand: Mapped[str | None] = mapped_column(String(100))
    base_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)     # MRP
    selling_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    tax_percent: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False, server_default="18")
    # Shipping dimensions/weight required by Shiprocket.
    weight_grams: Mapped[int] = mapped_column(Integer, nullable=False, server_default="500")
    length_cm: Mapped[float | None] = mapped_column(Numeric(6, 2))
    width_cm: Mapped[float | None] = mapped_column(Numeric(6, 2))
    height_cm: Mapped[float | None] = mapped_column(Numeric(6, 2))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    meta_title: Mapped[str | None] = mapped_column(String(255))
    meta_desc: Mapped[str | None] = mapped_column(String(500))

    category: Mapped["Category | None"] = relationship(back_populates="products")
    variants: Mapped[list["ProductVariant"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )
    images: Mapped[list["ProductImage"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_products_category", "category_id"),
        Index("idx_products_featured", "is_featured"),
        # Full-text search GIN index over name + brand + description.
        # Expressed as opaque SQL text() so Alembic renders it verbatim (avoids
        # trying to bind the 'english' regconfig as a literal).
        Index(
            "idx_products_fts",
            text(
                "to_tsvector('english', "
                "coalesce(name,'') || ' ' || coalesce(brand,'') || ' ' "
                "|| coalesce(description,''))"
            ),
            postgresql_using="gin",
        ),
    )

    def __repr__(self) -> str:
        return f"<Product {self.slug}>"


class ProductVariant(UUIDMixin, CreatedAtMixin, Base):
    __tablename__ = "product_variants"

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), index=True
    )
    sku: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    size: Mapped[str | None] = mapped_column(String(20))
    color: Mapped[str | None] = mapped_column(String(30))
    color_hex: Mapped[str | None] = mapped_column(String(10))
    price_delta: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, server_default="0")
    stock_quantity: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    low_stock_threshold: Mapped[int] = mapped_column(Integer, nullable=False, server_default="5")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")

    product: Mapped["Product"] = relationship(back_populates="variants")

    def __repr__(self) -> str:
        return f"<ProductVariant {self.sku} stock={self.stock_quantity}>"


class ProductImage(UUIDMixin, CreatedAtMixin, Base):
    __tablename__ = "product_images"

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), index=True
    )
    variant_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("product_variants.id")
    )
    # Raw image bytes live directly in Postgres — no Cloudinary, no external URL.
    image_data: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int | None] = mapped_column(Integer)
    width: Mapped[int | None] = mapped_column(Integer)
    height: Mapped[int | None] = mapped_column(Integer)
    alt_text: Mapped[str | None] = mapped_column(String(255))
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    # SOFT delete only — order_items.image_id references this row for historical orders.
    is_deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")

    product: Mapped["Product"] = relationship(back_populates="images")

    def __repr__(self) -> str:
        return f"<ProductImage {self.id} primary={self.is_primary}>"
