"""Customer address book endpoints (all require authentication)."""
import uuid

from fastapi import APIRouter, status

from app.core.deps import CurrentUser, DbSession
from app.schemas.address import AddressCreate, AddressResponse, AddressUpdate
from app.services import address_service

router = APIRouter(prefix="/me/addresses", tags=["addresses"])


@router.get("", response_model=list[AddressResponse])
async def list_addresses(current_user: CurrentUser, db: DbSession) -> list[AddressResponse]:
    rows = await address_service.list_addresses(db, current_user.id)
    return [AddressResponse.model_validate(a) for a in rows]


@router.post("", response_model=AddressResponse, status_code=status.HTTP_201_CREATED)
async def create_address(
    data: AddressCreate, current_user: CurrentUser, db: DbSession
) -> AddressResponse:
    addr = await address_service.create_address(db, current_user.id, data)
    return AddressResponse.model_validate(addr)


@router.patch("/{address_id}", response_model=AddressResponse)
async def update_address(
    address_id: uuid.UUID, data: AddressUpdate, current_user: CurrentUser, db: DbSession
) -> AddressResponse:
    addr = await address_service.update_address(db, current_user.id, address_id, data)
    return AddressResponse.model_validate(addr)


@router.delete("/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_address(address_id: uuid.UUID, current_user: CurrentUser, db: DbSession) -> None:
    await address_service.delete_address(db, current_user.id, address_id)


@router.patch("/{address_id}/set-default", response_model=AddressResponse)
async def set_default_address(
    address_id: uuid.UUID, current_user: CurrentUser, db: DbSession
) -> AddressResponse:
    addr = await address_service.set_default(db, current_user.id, address_id)
    return AddressResponse.model_validate(addr)
