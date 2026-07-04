"""Admin user management. All require get_current_admin."""
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select

from app.core.deps import CurrentAdmin, DbSession, get_current_admin
from app.models.user import User
from app.schemas.admin import AdminUserItem, AdminUserListResponse

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
