"""Public homepage banners (storefront hero)."""
from fastapi import APIRouter

from app.core.deps import DbSession
from app.schemas.banner import BannerPublic
from app.services import banner_service

router = APIRouter(prefix="/banners", tags=["banners"])


@router.get("", response_model=list[BannerPublic])
async def list_banners(db: DbSession) -> list[BannerPublic]:
    return [BannerPublic(**r) for r in await banner_service.list_public(db)]
