"""Authentication endpoints. Routes are thin; logic lives in auth_service.

Credential and OTP endpoints are rate-limited per client IP via DB-backed
fixed-window counters (serverless-safe — see app.core.rate_limit).
"""
from fastapi import APIRouter, Depends, status

from app.core.deps import CurrentUser, DbSession
from app.core.rate_limit import rate_limit
from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    LogoutRequest,
    MessageResponse,
    ProfileUpdateRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserBrief,
    GoogleLoginRequest,
    FirebasePhoneLoginRequest,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit("auth-register", limit=10, window_seconds=3600))],
)
async def register(data: RegisterRequest, db: DbSession) -> TokenResponse:
    user, access, refresh = await auth_service.register_user(db, data)
    return TokenResponse(access_token=access, refresh_token=refresh, user=UserBrief.model_validate(user))


@router.post(
    "/login",
    response_model=TokenResponse,
    dependencies=[Depends(rate_limit("auth-login", limit=15, window_seconds=300))],
)
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


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    dependencies=[Depends(rate_limit("auth-forgot", limit=5, window_seconds=3600))],
)
async def forgot_password(data: ForgotPasswordRequest, db: DbSession) -> MessageResponse:
    await auth_service.initiate_password_reset(db, data.email)
    # Always the same response — never reveal whether the email exists.
    return MessageResponse(message="If that email exists, a reset link has been sent")


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    dependencies=[Depends(rate_limit("auth-reset", limit=10, window_seconds=3600))],
)
async def reset_password(data: ResetPasswordRequest, db: DbSession) -> MessageResponse:
    await auth_service.reset_password(db, data.token, data.new_password)
    return MessageResponse(message="Password updated")


@router.post(
    "/google",
    response_model=TokenResponse,
    dependencies=[Depends(rate_limit("auth-google", limit=15, window_seconds=300))],
)
async def login_google(data: GoogleLoginRequest, db: DbSession) -> TokenResponse:
    user, access, refresh = await auth_service.authenticate_google(db, data.id_token)
    return TokenResponse(
        access_token=access, refresh_token=refresh, user=UserBrief.model_validate(user)
    )


@router.post(
    "/firebase-phone",
    response_model=TokenResponse,
    dependencies=[Depends(rate_limit("auth-phone", limit=15, window_seconds=300))],
)
async def login_firebase_phone(data: FirebasePhoneLoginRequest, db: DbSession) -> TokenResponse:
    user, access, refresh = await auth_service.authenticate_firebase_phone(
        db, data.id_token, data.full_name
    )
    return TokenResponse(
        access_token=access, refresh_token=refresh, user=UserBrief.model_validate(user)
    )


@router.get("/me", response_model=UserBrief)
async def me(current_user: CurrentUser) -> UserBrief:
    return UserBrief.model_validate(current_user)


@router.patch("/me", response_model=UserBrief)
async def update_me(
    data: ProfileUpdateRequest, current_user: CurrentUser, db: DbSession
) -> UserBrief:
    user = await auth_service.update_profile(db, current_user, data.full_name, data.phone)
    return UserBrief.model_validate(user)


@router.post("/change-password", response_model=TokenResponse)
async def change_password(
    data: ChangePasswordRequest, current_user: CurrentUser, db: DbSession
) -> TokenResponse:
    user, access, refresh = await auth_service.change_password(
        db, current_user, data.current_password, data.new_password
    )
    return TokenResponse(
        access_token=access, refresh_token=refresh, user=UserBrief.model_validate(user)
    )
