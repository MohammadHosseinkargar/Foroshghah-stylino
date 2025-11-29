from fastapi import APIRouter, Depends
from fastapi import HTTPException, status

from prisma import Prisma
from prisma.models import User

from ..core.deps import get_db, get_current_user
from ..schemas.auth import Token
from ..schemas.user import UserCreate, UserLogin, UserOut
from ..services.auth_service import register_user, login_user

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
    )


@router.post("/login", response_model=Token, summary="ورود")
async def login(payload: UserLogin, db: Prisma = Depends(get_db)):
    token = await login_user(db, email=payload.email, password=payload.password)
    return Token(access_token=token)


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
    )
