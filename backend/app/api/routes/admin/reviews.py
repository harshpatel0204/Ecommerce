"""Admin review moderation. All require get_current_admin."""
import uuid

from fastapi import APIRouter, Depends, status

from app.core.deps import DbSession, get_current_admin
from app.schemas.review import AdminReviewItem
from app.services import review_service

router = APIRouter(prefix="/admin/reviews", tags=["admin:reviews"], dependencies=[Depends(get_current_admin)])


@router.get("", response_model=list[AdminReviewItem])
async def list_reviews(db: DbSession, approved: bool | None = None) -> list[AdminReviewItem]:
    return await review_service.admin_list_reviews(db, approved)


@router.patch("/{review_id}/approve", status_code=status.HTTP_204_NO_CONTENT)
async def approve_review(review_id: uuid.UUID, db: DbSession) -> None:
    await review_service.admin_approve_review(db, review_id)


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(review_id: uuid.UUID, db: DbSession) -> None:
    await review_service.admin_delete_review(db, review_id)
