from typing import Optional, Sequence

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from prisma.models import User

from .security import decode_token
from ..db import prisma

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_db():
    if not prisma.is_connected():
        await prisma.connect()
    return prisma


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="توکن نامعتبر است")
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="توکن نامعتبر است")

    user = await prisma.user.find_unique(where={"id": int(user_id)})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="کاربر یافت نشد")
    
    # Check if user is banned (using getattr for backward compatibility during migration)
    is_banned = getattr(user, "isBanned", False)
    if is_banned:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="حساب کاربری شما مسدود شده است")
    
    return user


def require_roles(allowed: Sequence[str]):
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="دسترسی غیرمجاز")
        return current_user

    return role_checker
