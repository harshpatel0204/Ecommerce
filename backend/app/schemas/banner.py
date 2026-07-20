"""Banner schemas (request/response)."""
import uuid
from datetime import datetime

from pydantic import BaseModel


class BannerCreate(BaseModel):
    title: str
    subtitle: str | None = None
    cta_text: str | None = None
    product_id: uuid.UUID | None = None
    sort_order: int = 0
    is_active: bool = True


class BannerUpdate(BaseModel):
    title: str | None = None
    subtitle: str | None = None
    cta_text: str | None = None
    product_id: uuid.UUID | None = None
    sort_order: int | None = None
    is_active: bool | None = None


class BannerReorder(BaseModel):
    ids: list[uuid.UUID]


class BannerAdmin(BaseModel):
    id: uuid.UUID
    title: str
    subtitle: str | None
    cta_text: str | None
    product_id: uuid.UUID | None
    sort_order: int
    is_active: bool
    created_at: datetime
    product_name: str | None
    product_slug: str | None
    image_id: uuid.UUID | None


class BannerPublic(BaseModel):
    id: uuid.UUID
    title: str
    subtitle: str | None
    cta_text: str | None
    product_slug: str | None
    image_id: uuid.UUID | None
