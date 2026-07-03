"""FastAPI application factory for BharatShop.

Runs both locally (uvicorn) and on Vercel as a Python serverless function
(see backend/api/index.py). In production the SPA and this API share one Vercel
domain, so CORS is only enabled when DEV_ALLOWED_ORIGINS is set (local dev).

All routes are mounted under /api so the root vercel.json can rewrite
`/api/*` -> this app and `/*` -> the SPA.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import addresses, auth, cart, images, products, shipping, wishlist
from app.api.routes.admin import products as admin_products
from app.core.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

# CORS only for local cross-port dev; production is same-origin (no CORS).
if settings.dev_allowed_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.dev_allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )


@app.get("/api/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok", "version": settings.APP_VERSION}


# All API routers are mounted under /api (matches the vercel.json rewrite).
app.include_router(auth.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(images.router, prefix="/api")
app.include_router(addresses.router, prefix="/api")
app.include_router(cart.router, prefix="/api")
app.include_router(wishlist.router, prefix="/api")
app.include_router(shipping.router, prefix="/api")
app.include_router(admin_products.router, prefix="/api")
