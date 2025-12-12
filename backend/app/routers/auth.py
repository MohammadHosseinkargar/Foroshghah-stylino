from fastapi import APIRouter, Depends
from fastapi import HTTPException, status

from prisma import Prisma
from prisma.models import User

from ..core.deps import get_db, get_current_user
from ..schemas.auth import (
    Token,
    RefreshTokenRequest,
    EmailVerificationRequest,
    ResendVerificationRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
)
from ..schemas.user import UserCreate, UserLogin, UserOut
from ..services.auth_service import (
    register_user,
    login_user,
    verify_email,
    resend_verification_email,
    request_password_reset,
    reset_password,
    refresh_access_token,
    logout,
)

router = APIRouter()


@router.post("/register", response_model=UserOut, summary="ثبت‌نام کاربر جدید")
async def register(payload: UserCreate, db: Prisma = Depends(get_db)):
    user = await register_user(
        prisma=db,
        name=payload.name,
        email=payload.email,
        password=payload.password,
        phone=payload.phone,
        referral_code=payload.referral_code,
    )
    return UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        phone=user.phone,
        role=user.role,
        referralCode=user.referralCode,
        referredById=user.referredById,
        emailVerified=user.emailVerified or False,
    )


@router.post("/login", response_model=Token, summary="ورود")
async def login(payload: UserLogin, db: Prisma = Depends(get_db)):
    access_token, refresh_token = await login_user(db, email=payload.email, password=payload.password)
    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=Token, summary="تازه‌سازی توکن")
async def refresh(payload: RefreshTokenRequest, db: Prisma = Depends(get_db)):
    access_token, refresh_token = await refresh_access_token(db, payload.refresh_token)
    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/logout", summary="خروج")
async def logout_user(payload: RefreshTokenRequest, db: Prisma = Depends(get_db)):
    await logout(db, payload.refresh_token)
    return {"message": "با موفقیت خارج شدید"}


@router.post("/verify-email", summary="تایید ایمیل")
async def verify_user_email(payload: EmailVerificationRequest, db: Prisma = Depends(get_db)):
    await verify_email(db, payload.token)
    return {"message": "ایمیل با موفقیت تایید شد"}


@router.post("/resend-verification", summary="ارسال مجدد ایمیل تایید")
async def resend_verification(payload: ResendVerificationRequest, db: Prisma = Depends(get_db)):
    await resend_verification_email(db, payload.email)
    return {"message": "ایمیل تایید مجددا ارسال شد"}


@router.post("/forgot-password", summary="درخواست بازیابی رمز عبور")
async def forgot_password(payload: PasswordResetRequest, db: Prisma = Depends(get_db)):
    await request_password_reset(db, payload.email)
    return {"message": "اگر ایمیل شما در سیستم ثبت شده باشد، لینک بازیابی رمز عبور ارسال شد"}


@router.post("/reset-password", summary="بازیابی رمز عبور")
async def reset_user_password(payload: PasswordResetConfirm, db: Prisma = Depends(get_db)):
    await reset_password(db, payload.token, payload.new_password)
    return {"message": "رمز عبور با موفقیت تغییر کرد"}


@router.get("/me", response_model=UserOut, summary="نمایش اطلاعات کاربر")
async def me(current_user: User = Depends(get_current_user)):
    return UserOut(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        phone=current_user.phone,
        role=current_user.role,
        referralCode=current_user.referralCode,
        referredById=current_user.referredById,
        emailVerified=getattr(current_user, "emailVerified", False),
    )
