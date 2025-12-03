import random
import string
from fastapi import HTTPException, status

from prisma import Prisma
from prisma.errors import UniqueViolationError
from prisma.models import User

from ..core.security import get_password_hash, verify_password, create_access_token


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
            }
        )
        return user
    except UniqueViolationError as exc:
        # concurrent race on email/phone unique constraints
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ایمیل یا شماره موبایل تکراری است") from exc


async def login_user(prisma: Prisma, email: str, password: str) -> str:
    user = await prisma.user.find_unique(where={"email": email})
    if not user or not verify_password(password, user.passwordHash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="ورود ناموفق")
    token = create_access_token(str(user.id))
    return token
