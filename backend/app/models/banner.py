"""Homepage hero banners.

A banner links to a product and reuses that product's primary image (images
live in Postgres as BYTEA — see product_images), so there is no separate banner
image store. Deleting the product nulls the link (SET NULL) rather than deleting
the banner.
"""
import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import CreatedAtMixin, UUIDMixin


class Banner(UUIDMixin, CreatedAtMixin, Base):
    __tablename__ = "banners"

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    subtitle: Mapped[str | None] = mapped_column(String(300))
    cta_text: Mapped[str | None] = mapped_column(String(50))
    product_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL")
    )
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")

    def __repr__(self) -> str:
        return f"<Banner {self.title}>"
