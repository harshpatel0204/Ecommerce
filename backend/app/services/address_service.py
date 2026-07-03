"""Address book business logic. All operations are scoped to the owning user."""
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import Address
from app.schemas.address import AddressCreate, AddressUpdate


async def _clear_defaults(db: AsyncSession, user_id: uuid.UUID) -> None:
    await db.execute(
        update(Address).where(Address.user_id == user_id).values(is_default=False)
    )


async def _get_owned(db: AsyncSession, user_id: uuid.UUID, address_id: uuid.UUID) -> Address:
    addr = await db.get(Address, address_id)
    if addr is None or addr.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    return addr


async def list_addresses(db: AsyncSession, user_id: uuid.UUID) -> list[Address]:
    stmt = select(Address).where(Address.user_id == user_id).order_by(
        Address.is_default.desc(), Address.created_at.desc()
    )
    return list((await db.scalars(stmt)).all())


async def create_address(db: AsyncSession, user_id: uuid.UUID, data: AddressCreate) -> Address:
    # First address is default; explicit default demotes the others.
    existing = await db.scalar(select(Address.id).where(Address.user_id == user_id))
    make_default = data.is_default or existing is None
    if make_default:
        await _clear_defaults(db, user_id)
    addr = Address(**data.model_dump(exclude={"is_default"}), user_id=user_id, is_default=make_default)
    db.add(addr)
    await db.commit()
    await db.refresh(addr)
    return addr


async def update_address(
    db: AsyncSession, user_id: uuid.UUID, address_id: uuid.UUID, data: AddressUpdate
) -> Address:
    addr = await _get_owned(db, user_id, address_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(addr, field, value)
    await db.commit()
    await db.refresh(addr)
    return addr


async def delete_address(db: AsyncSession, user_id: uuid.UUID, address_id: uuid.UUID) -> None:
    addr = await _get_owned(db, user_id, address_id)
    was_default = addr.is_default
    await db.delete(addr)
    await db.flush()
    if was_default:
        # Promote the most recent remaining address to default.
        nxt = await db.scalar(
            select(Address).where(Address.user_id == user_id).order_by(Address.created_at.desc())
        )
        if nxt is not None:
            nxt.is_default = True
    await db.commit()


async def set_default(db: AsyncSession, user_id: uuid.UUID, address_id: uuid.UUID) -> Address:
    addr = await _get_owned(db, user_id, address_id)
    await _clear_defaults(db, user_id)
    addr.is_default = True
    await db.commit()
    await db.refresh(addr)
    return addr
