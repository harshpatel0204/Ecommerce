"""Admin newsletter subscriber management. All require get_current_admin."""
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import func, select

from app.core.deps import DbSession, get_current_admin
from app.models.newsletter import NewsletterSubscriber
from app.schemas.admin import NewsletterListResponse, NewsletterSubscriberItem

router = APIRouter(
    prefix="/admin/newsletter", tags=["admin:newsletter"], dependencies=[Depends(get_current_admin)]
)


@router.get("", response_model=NewsletterListResponse)
async def list_subscribers(
    db: DbSession,
    search: str | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
) -> NewsletterListResponse:
    stmt = select(NewsletterSubscriber).order_by(NewsletterSubscriber.created_at.desc())
    count_stmt = select(func.count(NewsletterSubscriber.id))
    if search:
        cond = NewsletterSubscriber.email.ilike(f"%{search}%")
        stmt = stmt.where(cond)
        count_stmt = count_stmt.where(cond)
    total = int(await db.scalar(count_stmt) or 0)
    subs = list((await db.scalars(stmt.limit(limit).offset((page - 1) * limit))).all())
    pages = (total + limit - 1) // limit if limit else 0
    return NewsletterListResponse(
        items=[NewsletterSubscriberItem.model_validate(s) for s in subs],
        total=total,
        page=page,
        pages=pages,
        limit=limit,
    )


@router.get("/export.csv")
async def export_subscribers_csv(db: DbSession) -> Response:
    """Download all subscribers as a CSV (email, subscribed date)."""
    subs = list(
        (await db.scalars(select(NewsletterSubscriber).order_by(NewsletterSubscriber.created_at.desc()))).all()
    )
    lines = ["email,subscribed_at"]
    for s in subs:
        lines.append(f"{s.email},{s.created_at.isoformat()}")
    csv = "\n".join(lines)
    return Response(
        content=csv,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=newsletter_subscribers.csv"},
    )
