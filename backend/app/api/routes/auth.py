"""Authentication endpoints. Routes are thin; logic lives in auth_service.

Rate limiting on /register and /login is added in the Phase 6 security pass
(slowapi); in serverless it is enforced at the edge / via a shared store.
"""
from fastapi import APIRouter, status

from app.core.deps import CurrentUser, DbSession
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    LogoutRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserBrief,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db: DbSession) -> TokenResponse:
    user, access, refresh = await auth_service.register_user(db, data)
    return TokenResponse(access_token=access, refresh_token=refresh, user=UserBrief.model_validate(user))


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: DbSession) -> TokenResponse:
    user, access, refresh = await auth_service.authenticate(db, data.email, data.password)
    return TokenResponse(access_token=access, refresh_token=refresh, user=UserBrief.model_validate(user))


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(data: RefreshRequest, db: DbSession) -> TokenResponse:
    user, access, refresh = await auth_service.rotate_refresh_token(db, data.refresh_token)
    return TokenResponse(access_token=access, refresh_token=refresh, user=UserBrief.model_validate(user))


@router.post("/logout", response_model=MessageResponse)
async def logout(data: LogoutRequest, db: DbSession) -> MessageResponse:
    await auth_service.revoke_refresh_token(db, data.refresh_token)
    return MessageResponse(message="Logged out")


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(data: ForgotPasswordRequest, db: DbSession) -> MessageResponse:
    await auth_service.initiate_password_reset(db, data.email)
    # Always the same response — never reveal whether the email exists.
    return MessageResponse(message="If that email exists, a reset link has been sent")


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(data: ResetPasswordRequest, db: DbSession) -> MessageResponse:
    await auth_service.reset_password(db, data.token, data.new_password)
    return MessageResponse(message="Password updated")


@router.get("/me", response_model=UserBrief)
async def me(current_user: CurrentUser) -> UserBrief:
    return UserBrief.model_validate(current_user)
