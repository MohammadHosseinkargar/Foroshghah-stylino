from typing import Literal, Optional
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: str
    referral_code: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str
    referralCode: str
    referredById: Optional[int] = None

    class Config:
        orm_mode = True


class UserRoleUpdate(BaseModel):
    role: Literal["CUSTOMER", "SELLER", "ADMIN"]
