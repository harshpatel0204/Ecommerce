"""Security helpers: password hashing (bcrypt) and JWT create/verify (HS256).

Access tokens are short-lived (15 min); refresh tokens live 7 days and are also
persisted in the DB so they can be revoked. Both are signed with SECRET_KEY.
"""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt as _bcrypt
import jwt
from passlib.context import CryptContext

from app.core.config import settings

# Compatibility shim: passlib 1.7.4 reads bcrypt.__about__.__version__, which was
# removed in bcrypt >= 4.1. Without this, passlib logs a (harmless but noisy)
# traceback on first use. Provide the attribute it expects.
if not hasattr(_bcrypt, "__about__"):
    class _About:  # noqa: D401
        __version__ = getattr(_bcrypt, "__version__", "unknown")

    _bcrypt.__about__ = _About  # type: ignore[attr-defined]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ACCESS_TOKEN_TYPE = "access"
REFRESH_TOKEN_TYPE = "refresh"


# --------------------------------------------------------------------- Passwords
def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ------------------------------------------------------------------------ Tokens
def _create_token(subject: str, token_type: str, expires_delta: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
        # Unique per-token id so two tokens issued in the same second (same subject)
        # are never byte-identical — required by the refresh_tokens unique constraint.
        "jti": uuid.uuid4().hex,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(subject: str) -> str:
    return _create_token(
        subject,
        ACCESS_TOKEN_TYPE,
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(subject: str) -> str:
    return _create_token(
        subject,
        REFRESH_TOKEN_TYPE,
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )


def decode_token(token: str, expected_type: str | None = None) -> dict[str, Any]:
    """Decode and validate a JWT. Raises jwt.PyJWTError on any failure.

    If `expected_type` is provided, the token's `type` claim must match.
    """
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    if expected_type is not None and payload.get("type") != expected_type:
        raise jwt.InvalidTokenError(
            f"Expected {expected_type} token, got {payload.get('type')}"
        )
    return payload
