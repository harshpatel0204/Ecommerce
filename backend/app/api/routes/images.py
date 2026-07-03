"""Public image serving: GET /api/images/{id}.

Streams the BYTEA bytes from Postgres with an immutable long-lived cache header
(so Vercel's CDN + the browser cache aggressively) and an ETag. Optional
?w=&h=&q= params resize/re-encode on the fly via Pillow — this replaces
Cloudinary transformation URLs.
"""
import uuid

from fastapi import APIRouter, Query, Request, Response, status

from app.core.deps import DbSession
from app.models.product import ProductImage
from app.services import image_service

router = APIRouter(tags=["images"])

_CACHE_CONTROL = "public, max-age=31536000, immutable"


@router.get("/images/{image_id}")
async def get_image(
    image_id: uuid.UUID,
    db: DbSession,
    request: Request,
    w: int | None = Query(default=None, ge=1, le=4000),
    h: int | None = Query(default=None, ge=1, le=4000),
    q: int | None = Query(default=None, ge=1, le=100),
) -> Response:
    image = await db.get(ProductImage, image_id)
    if image is None or image.is_deleted:
        return Response(status_code=status.HTTP_404_NOT_FOUND)

    # Immutable bytes -> ETag keyed by id + requested transform.
    etag = f'"{image.id.hex}-{w or 0}x{h or 0}-q{q or 0}"'
    if request.headers.get("if-none-match") == etag:
        return Response(
            status_code=status.HTTP_304_NOT_MODIFIED,
            headers={"ETag": etag, "Cache-Control": _CACHE_CONTROL},
        )

    data, content_type = image_service.resize(
        image.image_data, image.content_type, width=w, height=h, quality=q
    )
    return Response(
        content=data,
        media_type=content_type,
        headers={"ETag": etag, "Cache-Control": _CACHE_CONTROL},
    )
