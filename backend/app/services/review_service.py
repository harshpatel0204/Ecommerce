"""Product review business logic (with moderation)."""
import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.review import Review
from app.models.user import User
from app.schemas.review import (
    AdminReviewItem,
    ProductReviews,
    ReviewCreate,
    ReviewResponse,
)


def _to_response(review: Review, name: str | None) -> ReviewResponse:
    return ReviewResponse(
        id=review.id,
        rating=review.rating,
        title=review.title,
        comment=review.comment,
        reviewer_name=name or "Customer",
        is_verified=review.order_id is not None,
        created_at=review.created_at,
    )


async def create_review(db: AsyncSession, user: User, data: ReviewCreate) -> Review:
    product = await db.get(Product, data.product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    existing = await db.scalar(
        select(Review.id).where(
            Review.product_id == data.product_id, Review.user_id == user.id
        )
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="You have already reviewed this product"
        )

    verified_order_id = None
    if data.order_id is not None:
        # Verify the user actually bought this product in that order.
        owns = await db.scalar(
            select(Order.id).where(Order.id == data.order_id, Order.user_id == user.id)
        )
        bought = await db.scalar(
            select(OrderItem.id).where(
                OrderItem.order_id == data.order_id, OrderItem.product_sku == product.sku
            )
        )
        if owns is not None and bought is not None:
            verified_order_id = data.order_id

    review = Review(
        product_id=data.product_id,
        user_id=user.id,
        order_id=verified_order_id,
        rating=data.rating,
        title=data.title,
        comment=data.comment,
        is_approved=False,  # admin moderates before it shows
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review


async def get_product_reviews(db: AsyncSession, product_id: uuid.UUID) -> ProductReviews:
    rows = await db.execute(
        select(Review, User.full_name)
        .join(User, User.id == Review.user_id, isouter=True)
        .where(Review.product_id == product_id, Review.is_approved.is_(True))
        .order_by(Review.created_at.desc())
    )
    reviews = []
    ratings: list[int] = []
    for review, name in rows:
        reviews.append(_to_response(review, name))
        ratings.append(review.rating)

    distribution = {star: 0 for star in range(1, 6)}
    for r in ratings:
        distribution[r] += 1
    avg = round(sum(ratings) / len(ratings), 2) if ratings else 0.0
    return ProductReviews(
        avg_rating=avg,
        review_count=len(ratings),
        rating_distribution=distribution,
        reviews=reviews,
    )


async def admin_list_reviews(db: AsyncSession, approved: bool | None) -> list[AdminReviewItem]:
    stmt = (
        select(Review, User.full_name)
        .join(User, User.id == Review.user_id, isouter=True)
        .order_by(Review.created_at.desc())
    )
    if approved is not None:
        stmt = stmt.where(Review.is_approved.is_(approved))
    rows = await db.execute(stmt)
    return [
        AdminReviewItem(
            id=r.id,
            product_id=r.product_id,
            rating=r.rating,
            title=r.title,
            comment=r.comment,
            reviewer_name=name or "Customer",
            is_approved=r.is_approved,
            created_at=r.created_at,
        )
        for r, name in rows
    ]


async def admin_approve_review(db: AsyncSession, review_id: uuid.UUID) -> None:
    review = await db.get(Review, review_id)
    if review is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    review.is_approved = True
    await db.commit()


async def admin_delete_review(db: AsyncSession, review_id: uuid.UUID) -> None:
    review = await db.get(Review, review_id)
    if review is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    await db.delete(review)
    await db.commit()
