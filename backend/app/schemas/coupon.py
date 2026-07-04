"""Coupon schemas."""
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CouponValidateRequest(BaseModel):
    code: str
    cart_subtotal: float = Field(ge=0)


class CouponValidateResponse(BaseModel):
    valid: bool
    code: str | None = None
    discount_type: str | None = None
    discount_value: float | None = None
    discount_amount: float = 0
    message: str | None = None


class CouponBase(BaseModel):
    code: str = Field(min_length=1, max_length=30)
    description: str | None = None
    discount_type: str = Field(pattern="^(percent|flat)$")
    discount_value: float = Field(gt=0)
    min_order_value: float = 0
    max_discount: float | None = None
    valid_from: datetime | None = None
    valid_until: datetime | None = None
    usage_limit: int | None = None
    is_active: bool = True


class CouponCreate(CouponBase):
    pass


class CouponUpdate(BaseModel):
    description: str | None = None
    discount_value: float | None = Field(default=None, gt=0)
    min_order_value: float | None = None
    max_discount: float | None = None
    valid_from: datetime | None = None
    valid_until: datetime | None = None
    usage_limit: int | None = None
    is_active: bool | None = None


class CouponResponse(CouponBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    times_used: int
