"""Admin user management. All require get_current_admin."""
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select

from app.core.deps import CurrentAdmin, DbSession, get_current_admin
from app.models.order import Order
from app.models.user import User
from app.schemas.admin import (
    AdminUserItem,
    AdminUserListResponse,
    CustomerDetail,
    CustomerOrderSummary,
)

router = APIRouter(prefix="/admin/users", tags=["admin:users"], dependencies=[Depends(get_current_admin)])


@router.get("", response_model=AdminUserListResponse)
async def list_users(
    db: DbSession,
    search: str | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
) -> AdminUserListResponse:
    stmt = select(User).order_by(User.created_at.desc())
    count_stmt = select(func.count(User.id))
    if search:
        like = f"%{search}%"
        cond = or_(User.email.ilike(like), User.full_name.ilike(like))
        stmt = stmt.where(cond)
        count_stmt = count_stmt.where(cond)
    total = int(await db.scalar(count_stmt) or 0)
    users = list((await db.scalars(stmt.limit(limit).offset((page - 1) * limit))).all())
    pages = (total + limit - 1) // limit if limit else 0
    return AdminUserListResponse(
        items=[AdminUserItem.model_validate(u) for u in users],
        total=total,
        page=page,
        pages=pages,
        limit=limit,
    )


@router.get("/{user_id}", response_model=CustomerDetail)
async def get_customer(user_id: uuid.UUID, db: DbSession) -> CustomerDetail:
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    paid = Order.payment_status == "paid"
    total_spent = await db.scalar(
        select(func.coalesce(func.sum(Order.total_amount), 0)).where(Order.user_id == user_id, paid)
    )
    orders_count = await db.scalar(select(func.count(Order.id)).where(Order.user_id == user_id))
    last_order_at = await db.scalar(select(func.max(Order.placed_at)).where(Order.user_id == user_id))
    recent = await db.execute(
        select(Order.order_number, Order.status, Order.total_amount, Order.placed_at)
        .where(Order.user_id == user_id)
        .order_by(Order.placed_at.desc())
        .limit(20)
    )

    return CustomerDetail(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        is_admin=user.is_admin,
        is_active=user.is_active,
        created_at=user.created_at,
        orders_count=int(orders_count or 0),
        total_spent=float(total_spent or 0),
        last_order_at=last_order_at,
        orders=[
            CustomerOrderSummary(order_number=num, status=st, total_amount=float(total), placed_at=at)
            for num, st, total, at in recent
        ],
    )


@router.patch("/{user_id}/deactivate", response_model=AdminUserItem)
async def toggle_active(user_id: uuid.UUID, admin: CurrentAdmin, db: DbSession) -> AdminUserItem:
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot deactivate yourself")
    if user.is_admin:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot deactivate an admin")
    user.is_active = not user.is_active
    await db.commit()
    await db.refresh(user)
    return AdminUserItem.model_validate(user)
