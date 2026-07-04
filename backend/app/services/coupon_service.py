"""Coupon validation + admin management.

Discount is always computed server-side; the client's numbers are never trusted.
"""
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.coupon import Coupon
from app.schemas.coupon import CouponCreate, CouponUpdate


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _compute_discount(coupon: Coupon, subtotal: float) -> float:
    if coupon.discount_type == "percent":
        discount = subtotal * float(coupon.discount_value) / 100
        if coupon.max_discount is not None:
            discount = min(discount, float(coupon.max_discount))
    else:  # flat
        discount = float(coupon.discount_value)
    return round(min(discount, subtotal), 2)


async def validate(db: AsyncSession, code: str, subtotal: float) -> dict:
    """Return a validation result dict; never raises for a bad coupon."""
    coupon = await db.scalar(select(Coupon).where(func.lower(Coupon.code) == code.lower().strip()))
    if coupon is None or not coupon.is_active:
        return {"valid": False, "message": "Invalid coupon code"}

    now = _now()
    if coupon.valid_from and now < coupon.valid_from:
        return {"valid": False, "message": "Coupon is not active yet"}
    if coupon.valid_until and now > coupon.valid_until:
        return {"valid": False, "message": "Coupon has expired"}
    if coupon.usage_limit is not None and coupon.times_used >= coupon.usage_limit:
        return {"valid": False, "message": "Coupon usage limit reached"}
    if subtotal < float(coupon.min_order_value):
        return {
            "valid": False,
            "message": f"Minimum order value is ₹{float(coupon.min_order_value):.0f}",
        }

    discount = _compute_discount(coupon, subtotal)
    return {
        "valid": True,
        "code": coupon.code,
        "discount_type": coupon.discount_type,
        "discount_value": float(coupon.discount_value),
        "discount_amount": discount,
        "message": None,
        "_coupon": coupon,
    }


# --------------------------------------------------------------------- Admin
async def list_coupons(db: AsyncSession) -> list[Coupon]:
    return list((await db.scalars(select(Coupon).order_by(Coupon.created_at.desc()))).all())


async def create_coupon(db: AsyncSession, data: CouponCreate) -> Coupon:
    code = data.code.upper().strip()
    if await db.scalar(select(Coupon.id).where(func.upper(Coupon.code) == code)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Coupon code already exists")
    coupon = Coupon(**data.model_dump(exclude={"code"}), code=code)
    db.add(coupon)
    await db.commit()
    await db.refresh(coupon)
    return coupon


async def update_coupon(db: AsyncSession, coupon_id: uuid.UUID, data: CouponUpdate) -> Coupon:
    coupon = await db.get(Coupon, coupon_id)
    if coupon is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(coupon, field, value)
    await db.commit()
    await db.refresh(coupon)
    return coupon


async def delete_coupon(db: AsyncSession, coupon_id: uuid.UUID) -> None:
    coupon = await db.get(Coupon, coupon_id)
    if coupon is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found")
    await db.delete(coupon)
    await db.commit()
