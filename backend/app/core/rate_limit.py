"""DB-backed fixed-window rate limiting (see app.models.rate_limit for why).

Usage — guard a route with a dependency:

    @router.post("/login", dependencies=[Depends(rate_limit("auth-login", 10, 300))])

The counter is keyed by scope + client IP. Window logic runs inside a single
parameterized upsert so concurrent serverless invocations stay consistent.
"""
from fastapi import HTTPException, Request, status
from sqlalchemy import text

from app.core.deps import DbSession

_UPSERT = text(
    """
    INSERT INTO rate_limit_counters (key, window_start, count)
    VALUES (:key, now(), 1)
    ON CONFLICT (key) DO UPDATE SET
        count = CASE
            WHEN rate_limit_counters.window_start <= now() - make_interval(secs => :window)
            THEN 1
            ELSE rate_limit_counters.count + 1
        END,
        window_start = CASE
            WHEN rate_limit_counters.window_start <= now() - make_interval(secs => :window)
            THEN now()
            ELSE rate_limit_counters.window_start
        END
    RETURNING count
    """
)


def _client_ip(request: Request) -> str:
    # On Vercel the client IP arrives via X-Forwarded-For (first hop).
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limit(scope: str, limit: int, window_seconds: int):
    """Dependency factory: at most `limit` requests per IP per `window_seconds`."""

    async def dependency(request: Request, db: DbSession) -> None:
        key = f"{scope}:{_client_ip(request)}"
        result = await db.execute(_UPSERT, {"key": key, "window": window_seconds})
        count = result.scalar_one()
        await db.commit()
        if count > limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later.",
            )

    return dependency
