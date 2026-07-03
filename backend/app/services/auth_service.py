"""Authentication business logic (registration, login, token rotation, reset).

Routes stay thin and delegate here. Refresh tokens are persisted in the DB so
they can be rotated and revoked; password-reset tokens are stored hashed.
"""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    REFRESH_TOKEN_TYPE,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import RefreshToken, User
from app.schemas.auth import RegisterRequest
from app.services import email_service

_INVALID_CREDENTIALS = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Incorrect email or password",
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _hash_reset_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


async def _persist_refresh_token(db: AsyncSession, user: User) -> str:
    """Create a refresh JWT, store it, and return the raw token."""
    raw = create_refresh_token(str(user.id))
    db.add(
        RefreshToken(
            user_id=user.id,
            token=raw,
            expires_at=_now() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
    )
    return raw


async def _prune_expired_tokens(db: AsyncSession, user_id) -> None:
    await db.execute(
        delete(RefreshToken).where(
            RefreshToken.user_id == user_id, RefreshToken.expires_at < _now()
        )
    )


async def register_user(db: AsyncSession, data: RegisterRequest) -> tuple[User, str, str]:
    existing = await db.scalar(select(User).where(User.email == data.email))
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
        )
    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        phone=data.phone,
        is_admin=False,
        is_active=True,
    )
    db.add(user)
    await db.flush()  # assign user.id before issuing tokens
    access = create_access_token(str(user.id))
    refresh = await _persist_refresh_token(db, user)
    await db.commit()
    await db.refresh(user)
    return user, access, refresh


async def authenticate(db: AsyncSession, email: str, password: str) -> tuple[User, str, str]:
    user = await db.scalar(select(User).where(User.email == email))
    # Same error for unknown email and wrong password — no user enumeration.
    if user is None or not verify_password(password, user.hashed_password):
        raise _INVALID_CREDENTIALS
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated"
        )
    await _prune_expired_tokens(db, user.id)
    access = create_access_token(str(user.id))
    refresh = await _persist_refresh_token(db, user)
    await db.commit()
    return user, access, refresh


async def rotate_refresh_token(db: AsyncSession, raw_refresh: str) -> tuple[User, str, str]:
    """Validate a refresh token, revoke it, and issue a fresh access+refresh pair."""
    import jwt

    try:
        payload = decode_token(raw_refresh, expected_type=REFRESH_TOKEN_TYPE)
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )

    stored = await db.scalar(select(RefreshToken).where(RefreshToken.token == raw_refresh))
    if stored is None:
        # Token not in DB (already used/revoked/logged out).
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )

    user = await db.get(User, stored.user_id)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )

    # Rotate: delete the old token, issue a new pair.
    await db.delete(stored)
    access = create_access_token(str(user.id))
    refresh = await _persist_refresh_token(db, user)
    await db.commit()
    return user, access, refresh


async def revoke_refresh_token(db: AsyncSession, raw_refresh: str) -> None:
    await db.execute(delete(RefreshToken).where(RefreshToken.token == raw_refresh))
    await db.commit()


async def initiate_password_reset(db: AsyncSession, email: str) -> None:
    """Generate + email a reset link. Always succeeds silently (no enumeration)."""
    user = await db.scalar(select(User).where(User.email == email))
    if user is None:
        return
    raw_token = secrets.token_urlsafe(32)
    user.reset_token = _hash_reset_token(raw_token)
    user.reset_token_expires = _now() + timedelta(hours=1)
    await db.commit()
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}"
    email_service.send_password_reset(user.email, reset_link)


async def reset_password(db: AsyncSession, raw_token: str, new_password: str) -> None:
    hashed = _hash_reset_token(raw_token)
    user = await db.scalar(
        select(User).where(
            User.reset_token == hashed, User.reset_token_expires > _now()
        )
    )
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )
    user.hashed_password = hash_password(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    # Revoke all refresh tokens after a password reset.
    await db.execute(delete(RefreshToken).where(RefreshToken.user_id == user.id))
    await db.commit()
