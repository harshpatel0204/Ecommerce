"""Public newsletter signup (storefront footer)."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy import select

from app.core.deps import DbSession
from app.core.rate_limit import rate_limit
from app.models.newsletter import NewsletterSubscriber
from app.schemas.auth import MessageResponse

router = APIRouter(prefix="/newsletter", tags=["newsletter"])


class SubscribeRequest(BaseModel):
    email: EmailStr


@router.post(
    "/subscribe",
    response_model=MessageResponse,
    dependencies=[Depends(rate_limit("newsletter", limit=5, window_seconds=3600))],
)
async def subscribe(data: SubscribeRequest, db: DbSession) -> MessageResponse:
    email = data.email.lower()
    existing = await db.scalar(
        select(NewsletterSubscriber.id).where(NewsletterSubscriber.email == email)
    )
    if existing is None:
        db.add(NewsletterSubscriber(email=email))
        await db.commit()
    # Same response either way — no way to probe which emails are subscribed.
    return MessageResponse(message="You're on the list! 🎉")
