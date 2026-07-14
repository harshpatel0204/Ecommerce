"""Admin abandoned-cart visibility. All require get_current_admin."""
from fastapi import APIRouter, Depends, Query

from app.core.deps import DbSession, get_current_admin
from app.schemas.admin import AbandonedCart
from app.services import cart_service

router = APIRouter(prefix="/admin", tags=["admin:carts"], dependencies=[Depends(get_current_admin)])


@router.get("/abandoned-carts", response_model=list[AbandonedCart])
async def abandoned_carts(
    db: DbSession, hours: int = Query(default=3, ge=1, le=168)
) -> list[AbandonedCart]:
    return [AbandonedCart(**r) for r in await cart_service.admin_list_abandoned_carts(db, hours)]
