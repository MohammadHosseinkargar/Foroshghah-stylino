import re
from datetime import datetime, timedelta
from typing import Optional
from secrets import token_urlsafe

from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import HTTPException, status

from .config import get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password strength.
    Returns (is_valid, error_message)
    Requirements:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    """
    if len(password) < 8:
        return False, "رمز عبور باید حداقل 8 کاراکتر باشد"
    
    if not re.search(r"[A-Z]", password):
        return False, "رمز عبور باید حداقل یک حرف بزرگ داشته باشد"
    
    if not re.search(r"[a-z]", password):
        return False, "رمز عبور باید حداقل یک حرف کوچک داشته باشد"
    
    if not re.search(r"\d", password):
        return False, "رمز عبور باید حداقل یک عدد داشته باشد"
    
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "رمز عبور باید حداقل یک کاراکتر خاص داشته باشد"
    
    return True, ""


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    settings = get_settings()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    to_encode = {"sub": subject, "type": "access", "exp": expire}
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_refresh_token(subject: str) -> str:
    settings = get_settings()
    expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    to_encode = {"sub": subject, "type": "refresh", "exp": expire}
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> Optional[dict]:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError:
        return None


def generate_verification_token() -> str:
    """Generate a secure random token for email verification"""
    return token_urlsafe(32)


def generate_reset_token() -> str:
    """Generate a secure random token for password reset"""
    return token_urlsafe(32)
