"""Public + authenticated review endpoints."""
import uuid

from fastapi import APIRouter, status

from app.core.deps import CurrentUser, DbSession
from app.schemas.review import ProductReviews, ReviewCreate, ReviewResponse
from app.services import review_service

router = APIRouter(tags=["reviews"])


@router.get("/products/{product_id}/reviews", response_model=ProductReviews)
async def product_reviews(product_id: uuid.UUID, db: DbSession) -> ProductReviews:
    return await review_service.get_product_reviews(db, product_id)


@router.post("/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(data: ReviewCreate, current_user: CurrentUser, db: DbSession) -> ReviewResponse:
    review = await review_service.create_review(db, current_user, data)
    return ReviewResponse(
        id=review.id,
        rating=review.rating,
        title=review.title,
        comment=review.comment,
        reviewer_name=current_user.full_name or "Customer",
        is_verified=review.order_id is not None,
        created_at=review.created_at,
    )
