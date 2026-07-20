"""Admin homepage-banner management. All require get_current_admin."""
import uuid

from fastapi import APIRouter, Depends, status

from app.core.deps import DbSession, get_current_admin
from app.schemas.banner import BannerAdmin, BannerCreate, BannerReorder, BannerUpdate
from app.services import banner_service

router = APIRouter(prefix="/admin/banners", tags=["admin:banners"], dependencies=[Depends(get_current_admin)])


@router.get("", response_model=list[BannerAdmin])
async def list_banners(db: DbSession) -> list[BannerAdmin]:
    return [BannerAdmin(**r) for r in await banner_service.admin_list(db)]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_banner(data: BannerCreate, db: DbSession) -> dict[str, str]:
    banner_id = await banner_service.create(db, data)
    return {"id": str(banner_id)}


# Declared before "/{banner_id}" so "reorder" isn't parsed as a banner UUID.
@router.patch("/reorder")
async def reorder_banners(data: BannerReorder, db: DbSession) -> dict[str, bool]:
    await banner_service.reorder(db, data.ids)
    return {"ok": True}


@router.patch("/{banner_id}")
async def update_banner(banner_id: uuid.UUID, data: BannerUpdate, db: DbSession) -> dict[str, bool]:
    await banner_service.update(db, banner_id, data)
    return {"ok": True}


@router.delete("/{banner_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_banner(banner_id: uuid.UUID, db: DbSession) -> None:
    await banner_service.delete(db, banner_id)
