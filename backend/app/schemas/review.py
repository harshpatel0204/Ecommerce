"""Product review schemas."""
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReviewCreate(BaseModel):
    product_id: uuid.UUID
    order_id: uuid.UUID | None = None
    rating: int = Field(ge=1, le=5)
    title: str | None = Field(default=None, max_length=100)
    comment: str | None = Field(default=None, max_length=2000)


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    rating: int
    title: str | None
    comment: str | None
    reviewer_name: str
    is_verified: bool
    created_at: datetime


class ProductReviews(BaseModel):
    avg_rating: float
    review_count: int
    rating_distribution: dict[int, int]  # {5: n, 4: n, ...}
    reviews: list[ReviewResponse]


class AdminReviewItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    rating: int
    title: str | None
    comment: str | None
    reviewer_name: str
    is_approved: bool
    created_at: datetime
