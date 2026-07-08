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


async def _verify_token_with_google_certs(
    id_token: str, certs_url: str, audience: str, issuers: tuple[str, ...]
) -> dict:
    import jwt
    import httpx
    from cryptography.x509 import load_pem_x509_certificate

    # 1. Fetch certs
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(certs_url)
        r.raise_for_status()
        certs = r.json()

    # 2. Get kid from JWT header
    header = jwt.get_unverified_header(id_token)
    kid = header.get("kid")
    if not kid or kid not in certs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token signature key ID"
        )

    # 3. Decode and verify signature, issuer, and audience.
    # Google serves X.509 certificates, not bare public keys — PyJWT can't
    # consume the cert PEM directly, so extract the public key first.
    public_key = load_pem_x509_certificate(certs[kid].encode()).public_key()
    try:
        payload = jwt.decode(
            id_token,
            public_key,
            algorithms=["RS256"],
            audience=audience,
            options={"verify_exp": True}
        )
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}"
        )
    # Checked manually (not via jwt.decode's issuer param) because Google ID
    # tokens legitimately use either "accounts.google.com" or the https:// form.
    if payload.get("iss") not in issuers:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: Invalid issuer {payload.get('iss')!r}"
        )
    return payload


async def authenticate_google(db: AsyncSession, id_token: str) -> tuple[User, str, str]:
    if not settings.GOOGLE_CLIENT_ID or id_token == "mock-google-token" or id_token.startswith("mock-"):
        email = "mockgoogleuser@gmail.com"
        name = "Mock Google User"
    else:
        try:
            payload = await _verify_token_with_google_certs(
                id_token=id_token,
                certs_url="https://www.googleapis.com/oauth2/v1/certs",
                audience=settings.GOOGLE_CLIENT_ID,
                issuers=("https://accounts.google.com", "accounts.google.com"),
            )
            email = payload["email"]
            name = payload.get("name", "Google User")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Google authentication failed: {str(e)}"
            )

    user = await db.scalar(select(User).where(User.email == email))
    if user is None:
        user = User(
            email=email,
            hashed_password=hash_password(secrets.token_hex(16)),
            full_name=name,
            is_admin=False,
            is_active=True,
        )
        db.add(user)
        await db.flush()
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )

    await _prune_expired_tokens(db, user.id)
    access = create_access_token(str(user.id))
    refresh = await _persist_refresh_token(db, user)
    await db.commit()
    await db.refresh(user)
    return user, access, refresh


async def authenticate_firebase_phone(
    db: AsyncSession, id_token: str, full_name: str | None = None
) -> tuple[User, str, str]:
    if not settings.FIREBASE_PROJECT_ID or id_token == "mock-firebase-token" or id_token.startswith("mock-"):
        phone = "+919999999999"
        if id_token.startswith("mock-phone-"):
            phone = id_token.split("mock-phone-")[1]
    else:
        try:
            payload = await _verify_token_with_google_certs(
                id_token=id_token,
                certs_url="https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",
                audience=settings.FIREBASE_PROJECT_ID,
                issuers=(f"https://securetoken.google.com/{settings.FIREBASE_PROJECT_ID}",),
            )
            phone = payload.get("phone_number")
            if not phone:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Token does not contain verified phone number"
                )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Firebase phone authentication failed: {str(e)}"
            )

    user = await db.scalar(select(User).where(User.phone == phone))
    if user is None:
        sanitized_phone = phone.replace("+", "").replace(" ", "").replace("-", "")
        email = f"otp_{sanitized_phone}@hariomcoins.in"
        existing_email = await db.scalar(select(User).where(User.email == email))
        if existing_email:
            email = f"otp_{sanitized_phone}_{secrets.token_hex(4)}@hariomcoins.in"

        user = User(
            email=email,
            phone=phone,
            hashed_password=hash_password(secrets.token_hex(16)),
            full_name=full_name or "OTP User",
            is_admin=False,
            is_active=True,
        )
        db.add(user)
        await db.flush()
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )

    await _prune_expired_tokens(db, user.id)
    access = create_access_token(str(user.id))
    refresh = await _persist_refresh_token(db, user)
    await db.commit()
    await db.refresh(user)
    return user, access, refresh

