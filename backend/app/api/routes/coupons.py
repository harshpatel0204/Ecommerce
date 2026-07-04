"""Customer coupon validation."""
from fastapi import APIRouter

from app.core.deps import CurrentUser, DbSession
from app.schemas.coupon import CouponValidateRequest, CouponValidateResponse
from app.services import coupon_service

router = APIRouter(prefix="/coupons", tags=["coupons"])


@router.post("/validate", response_model=CouponValidateResponse)
async def validate_coupon(
    data: CouponValidateRequest, _current_user: CurrentUser, db: DbSession
) -> CouponValidateResponse:
    result = await coupon_service.validate(db, data.code, data.cart_subtotal)
    result.pop("_coupon", None)  # never expose the ORM object
    return CouponValidateResponse(**result)
