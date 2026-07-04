"""Admin coupon management. All require get_current_admin."""
import uuid

from fastapi import APIRouter, Depends, status

from app.core.deps import DbSession, get_current_admin
from app.schemas.coupon import CouponCreate, CouponResponse, CouponUpdate
from app.services import coupon_service

router = APIRouter(prefix="/admin/coupons", tags=["admin:coupons"], dependencies=[Depends(get_current_admin)])


@router.get("", response_model=list[CouponResponse])
async def list_coupons(db: DbSession) -> list[CouponResponse]:
    return [CouponResponse.model_validate(c) for c in await coupon_service.list_coupons(db)]


@router.post("", response_model=CouponResponse, status_code=status.HTTP_201_CREATED)
async def create_coupon(data: CouponCreate, db: DbSession) -> CouponResponse:
    return CouponResponse.model_validate(await coupon_service.create_coupon(db, data))


@router.patch("/{coupon_id}", response_model=CouponResponse)
async def update_coupon(coupon_id: uuid.UUID, data: CouponUpdate, db: DbSession) -> CouponResponse:
    return CouponResponse.model_validate(await coupon_service.update_coupon(db, coupon_id, data))


@router.delete("/{coupon_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_coupon(coupon_id: uuid.UUID, db: DbSession) -> None:
    await coupon_service.delete_coupon(db, coupon_id)
