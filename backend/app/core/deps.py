"""Shared FastAPI dependencies: DB session and auth guards.

Dependency chain:
  get_db            -> async SQLAlchemy session
  get_current_user  -> decodes the access JWT, loads the User from the DB
  get_current_admin -> get_current_user + enforces is_admin (403 otherwise)

The User model is imported lazily inside get_current_user so this module stays
importable before the models package is populated (Phase 1 skeleton).
"""
from typing import Annotated
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import ACCESS_TOKEN_TYPE, decode_token

bearer_scheme = HTTPBearer(auto_error=True)

DbSession = Annotated[AsyncSession, Depends(get_db)]
BearerToken = Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)]

_CREDENTIALS_ERROR = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_user(credentials: BearerToken, db: DbSession):
    """Decode the bearer access token and return the matching active User."""
    from app.models.user import User  # lazy import — model added in Phase 1 (models)

    try:
        payload = decode_token(credentials.credentials, expected_type=ACCESS_TOKEN_TYPE)
        subject = payload.get("sub")
        if subject is None:
            raise _CREDENTIALS_ERROR
        user_id = UUID(subject)
    except (jwt.PyJWTError, ValueError):
        raise _CREDENTIALS_ERROR

    user = await db.get(User, user_id)
    if user is None:
        raise _CREDENTIALS_ERROR
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated"
        )
    return user


CurrentUser = Annotated["object", Depends(get_current_user)]


async def get_current_admin(current_user: CurrentUser):
    """Require the authenticated user to be an admin."""
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user


CurrentAdmin = Annotated["object", Depends(get_current_admin)]
