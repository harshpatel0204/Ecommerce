"""Shipping serviceability endpoint (public — used on PDP + at checkout)."""
from fastapi import APIRouter

from app.core.deps import DbSession
from app.schemas.shipping import ServiceabilityRequest, ServiceabilityResponse
from app.services import shiprocket_service

router = APIRouter(prefix="/shipping", tags=["shipping"])


@router.post("/check-serviceability", response_model=ServiceabilityResponse)
async def check_serviceability(
    data: ServiceabilityRequest, db: DbSession
) -> ServiceabilityResponse:
    result = await shiprocket_service.check_serviceability(db, data.pincode, data.weight_grams)
    return ServiceabilityResponse(**result)
