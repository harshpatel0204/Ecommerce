"""Shipping / serviceability schemas."""
from pydantic import BaseModel, Field


class ServiceabilityRequest(BaseModel):
    pincode: str = Field(min_length=4, max_length=10)
    weight_grams: int = Field(default=500, ge=1)


class CourierOption(BaseModel):
    courier_name: str | None = None
    courier_id: int | None = None
    rate: float
    eta_days: int | str | None = None


class ServiceabilityResponse(BaseModel):
    serviceable: bool
    couriers: list[CourierOption] = []
    cheapest: CourierOption | None = None
