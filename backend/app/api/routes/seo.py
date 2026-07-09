"""SEO endpoints: sitemap.xml and robots.txt.

Served by FastAPI (not static files) so they can use FRONTEND_URL and live
product/category slugs. vercel.json rewrites /sitemap.xml and /robots.txt to
this function, so each route answers on both the bare and /api-prefixed path
(the /api path is what the Vite dev proxy reaches locally).
"""
from datetime import datetime
from xml.sax.saxutils import escape

from fastapi import APIRouter, Response
from sqlalchemy import select

from app.core.config import settings
from app.core.deps import DbSession
from app.models.product import Category, Product

router = APIRouter(tags=["seo"])


def _url_entry(loc: str, lastmod: datetime | None = None) -> str:
    lastmod_tag = f"<lastmod>{lastmod.date().isoformat()}</lastmod>" if lastmod else ""
    return f"<url><loc>{escape(loc)}</loc>{lastmod_tag}</url>"


@router.get("/sitemap.xml", include_in_schema=False)
@router.get("/api/sitemap.xml", include_in_schema=False)
async def sitemap(db: DbSession) -> Response:
    base = settings.FRONTEND_URL.rstrip("/")
    entries = [_url_entry(f"{base}/"), _url_entry(f"{base}/products")]

    categories = await db.execute(
        select(Category.slug).where(Category.is_active.is_(True))
    )
    entries.extend(
        _url_entry(f"{base}/products?category_slug={slug}") for (slug,) in categories
    )

    products = await db.execute(
        select(Product.slug, Product.updated_at).where(Product.is_active.is_(True))
    )
    entries.extend(
        _url_entry(f"{base}/products/{slug}", updated_at) for slug, updated_at in products
    )

    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        + "".join(entries)
        + "</urlset>"
    )
    return Response(
        content=xml,
        media_type="application/xml",
        headers={"Cache-Control": "public, max-age=3600"},
    )


@router.get("/robots.txt", include_in_schema=False)
@router.get("/api/robots.txt", include_in_schema=False)
async def robots() -> Response:
    base = settings.FRONTEND_URL.rstrip("/")
    body = (
        "User-agent: *\n"
        "Disallow: /admin\n"
        "Disallow: /account\n"
        "Disallow: /cart\n"
        "Disallow: /checkout\n"
        "Disallow: /orders\n"
        "Disallow: /wishlist\n"
        "Allow: /\n"
        f"Sitemap: {base}/sitemap.xml\n"
    )
    return Response(
        content=body,
        media_type="text/plain",
        headers={"Cache-Control": "public, max-age=3600"},
    )
