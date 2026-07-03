"""Cart endpoints (all require authentication)."""
import uuid

from fastapi import APIRouter

from app.core.deps import CurrentUser, DbSession
from app.schemas.cart import CartItemAdd, CartItemUpdate, CartResponse
from app.services import cart_service

router = APIRouter(prefix="/cart", tags=["cart"])


@router.get("", response_model=CartResponse)
async def get_cart(current_user: CurrentUser, db: DbSession) -> CartResponse:
    return await cart_service.get_cart(db, current_user.id)


@router.post("/items", response_model=CartResponse)
async def add_item(data: CartItemAdd, current_user: CurrentUser, db: DbSession) -> CartResponse:
    return await cart_service.add_item(db, current_user.id, data.variant_id, data.quantity)


@router.patch("/items/{item_id}", response_model=CartResponse)
async def update_item(
    item_id: uuid.UUID, data: CartItemUpdate, current_user: CurrentUser, db: DbSession
) -> CartResponse:
    return await cart_service.update_item(db, current_user.id, item_id, data.quantity)


@router.delete("/items/{item_id}", response_model=CartResponse)
async def remove_item(item_id: uuid.UUID, current_user: CurrentUser, db: DbSession) -> CartResponse:
    return await cart_service.remove_item(db, current_user.id, item_id)


@router.delete("", response_model=CartResponse)
async def clear_cart(current_user: CurrentUser, db: DbSession) -> CartResponse:
    return await cart_service.clear_cart(db, current_user.id)
