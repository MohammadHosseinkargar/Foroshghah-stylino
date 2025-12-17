import random
import string
from datetime import datetime, timedelta
from fastapi import HTTPException, status

from prisma import Prisma
from prisma.errors import UniqueViolationError
from prisma.models import User

from ..core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    validate_password_strength,
    generate_verification_token,
    generate_reset_token,
    decode_token,
)
from .email_service import send_verification_email, send_password_reset_email


def _generate_referral_code(length: int = 8) -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


async def generate_unique_referral(prisma: Prisma) -> str:
    for _ in range(5):
        code = _generate_referral_code()
        exists = await prisma.user.find_unique(where={"referralCode": code})
        if not exists:
            return code
    raise HTTPException(status_code=500, detail="خطا در ایجاد کد دعوت")


async def register_user(prisma: Prisma, name: str, email: str, password: str, phone: str | None, referral_code: str | None) -> User:
    # Validate password strength
    is_valid, error_msg = validate_password_strength(password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)
    
    existing = await prisma.user.find_unique(where={"email": email})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ایمیل قبلا ثبت شده است")
    if phone:
        existing_phone = await prisma.user.find_unique(where={"phone": phone})
        if existing_phone:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="شماره موبایل قبلا ثبت شده است")

    referred_by_id = None
    if referral_code:
        referrer = await prisma.user.find_first(where={"referralCode": referral_code})
        if not referrer:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="کد دعوت نامعتبر است")
        referred_by_id = referrer.id

    code = await generate_unique_referral(prisma)
    password_hash = get_password_hash(password)
    verification_token = generate_verification_token()
    verification_expires = datetime.utcnow() + timedelta(hours=24)

    try:
        user = await prisma.user.create(
            data={
                "name": name,
                "email": email,
                "phone": phone,
                "passwordHash": password_hash,
                "role": "CUSTOMER",
                "referralCode": code,
                "referredById": referred_by_id,
                "emailVerified": False,
                "emailVerificationToken": verification_token,
                "emailVerificationExpires": verification_expires,
            }
        )
        
        # Send verification email
        await send_verification_email(email, verification_token)
        
        return user
    except UniqueViolationError as exc:
        # concurrent race on email/phone unique constraints
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ایمیل یا شماره موبایل تکراری است") from exc


async def login_user(prisma: Prisma, email: str, password: str) -> tuple[str, str]:
    """
    Login user and return (access_token, refresh_token)
    """
    user = await prisma.user.find_unique(where={"email": email})
    if not user or not verify_password(password, user.passwordHash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="ورود ناموفق")
    
    # Check if user is banned (using getattr for backward compatibility during migration)
    is_banned = getattr(user, "isBanned", False)
    if is_banned:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="حساب کاربری شما مسدود شده است")
    
    # Check if email is verified (optional - can be enforced later)
    # if not user.emailVerified:
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="لطفا ابتدا ایمیل خود را تایید کنید")
    
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    
    # Store refresh token in database
    await prisma.refreshtoken.create(
        data={
            "userId": user.id,
            "token": refresh_token,
            "expiresAt": datetime.utcnow() + timedelta(days=7),
        }
    )
    
    return access_token, refresh_token


async def verify_email(prisma: Prisma, token: str) -> bool:
    """Verify user email with token"""
    user = await prisma.user.find_first(
        where={
            "emailVerificationToken": token,
            "emailVerificationExpires": {"gt": datetime.utcnow()},
        }
    )
    
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="لینک تایید نامعتبر یا منقضی شده است")
    
    await prisma.user.update(
        where={"id": user.id},
        data={
            "emailVerified": True,
            "emailVerificationToken": None,
            "emailVerificationExpires": None,
        }
    )
    
    return True


async def resend_verification_email(prisma: Prisma, email: str) -> bool:
    """Resend verification email"""
    user = await prisma.user.find_unique(where={"email": email})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="کاربر یافت نشد")
    
    if user.emailVerified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ایمیل قبلا تایید شده است")
    
    verification_token = generate_verification_token()
    verification_expires = datetime.utcnow() + timedelta(hours=24)
    
    await prisma.user.update(
        where={"id": user.id},
        data={
            "emailVerificationToken": verification_token,
            "emailVerificationExpires": verification_expires,
        }
    )
    
    await send_verification_email(email, verification_token)
    return True


async def request_password_reset(prisma: Prisma, email: str) -> bool:
    """Request password reset - send reset email"""
    user = await prisma.user.find_unique(where={"email": email})
    if not user:
        # Don't reveal if email exists for security
        return True
    
    reset_token = generate_reset_token()
    reset_expires = datetime.utcnow() + timedelta(hours=1)
    
    await prisma.user.update(
        where={"id": user.id},
        data={
            "passwordResetToken": reset_token,
            "passwordResetExpires": reset_expires,
        }
    )
    
    await send_password_reset_email(email, reset_token)
    return True


async def reset_password(prisma: Prisma, token: str, new_password: str) -> bool:
    """Reset password with token"""
    # Validate password strength
    is_valid, error_msg = validate_password_strength(new_password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)
    
    user = await prisma.user.find_first(
        where={
            "passwordResetToken": token,
            "passwordResetExpires": {"gt": datetime.utcnow()},
        }
    )
    
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="لینک بازیابی نامعتبر یا منقضی شده است")
    
    password_hash = get_password_hash(new_password)
    
    await prisma.user.update(
        where={"id": user.id},
        data={
            "passwordHash": password_hash,
            "passwordResetToken": None,
            "passwordResetExpires": None,
        }
    )
    
    return True


async def refresh_access_token(prisma: Prisma, refresh_token: str) -> tuple[str, str]:
    """Refresh access token using refresh token"""
    # Verify token
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="توکن نامعتبر است")
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="توکن نامعتبر است")
    
    # Check if refresh token exists in database
    token_record = await prisma.refreshtoken.find_first(
        where={
            "token": refresh_token,
            "userId": int(user_id),
            "expiresAt": {"gt": datetime.utcnow()},
        }
    )
    
    if not token_record:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="توکن منقضی شده یا نامعتبر است")
    
    # Generate new tokens
    new_access_token = create_access_token(user_id)
    new_refresh_token = create_refresh_token(user_id)
    
    # Update refresh token in database
    await prisma.refreshtoken.update(
        where={"id": token_record.id},
        data={
            "token": new_refresh_token,
            "expiresAt": datetime.utcnow() + timedelta(days=7),
        }
    )
    
    return new_access_token, new_refresh_token


async def logout(prisma: Prisma, refresh_token: str) -> bool:
    """Logout - invalidate refresh token"""
    await prisma.refreshtoken.delete_many(where={"token": refresh_token})
    return True
