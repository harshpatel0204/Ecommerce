"""Wishlist endpoints (all require authentication)."""
import uuid

from fastapi import APIRouter, status

from app.api.routes._catalog_mappers import to_list_item
from app.core.deps import CurrentUser, DbSession
from app.schemas.product import ProductListItem
from app.services import wishlist_service

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


@router.get("", response_model=list[ProductListItem])
async def get_wishlist(current_user: CurrentUser, db: DbSession) -> list[ProductListItem]:
    entries = await wishlist_service.get_wishlist(db, current_user.id)
    return [to_list_item(e) for e in entries]


@router.post("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def add_to_wishlist(product_id: uuid.UUID, current_user: CurrentUser, db: DbSession) -> None:
    await wishlist_service.add_to_wishlist(db, current_user.id, product_id)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_wishlist(
    product_id: uuid.UUID, current_user: CurrentUser, db: DbSession
) -> None:
    await wishlist_service.remove_from_wishlist(db, current_user.id, product_id)
