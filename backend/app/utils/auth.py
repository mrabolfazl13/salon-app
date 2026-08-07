# backend/app/utils/auth.py
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerificationError, InvalidHash
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select
from app.config import settings
from app.database import get_session
from app.models.user import User
from app.schemas.user import TokenData

# استفاده از Argon2 که محدودیت 72 بایت ندارد
ph = PasswordHasher(
    time_cost=2,       # تعداد تکرار
    memory_cost=1024,  # حافظه مصرفی (KB)
    parallelism=2,     # تعداد تردها
    hash_len=16,       # طول هش
    salt_len=16        # طول سالت
)

security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """بررسی رمز عبور با Argon2"""
    try:
        ph.verify(hashed_password, plain_password)
        return True
    except (VerificationError, InvalidHash):
        return False
    except Exception as e:
        print(f"Error verifying password: {e}")
        return False

def get_password_hash(password: str) -> str:
    """هش کردن رمز عبور با Argon2"""
    try:
        return ph.hash(password)
    except Exception as e:
        print(f"Error hashing password: {e}")
        raise e

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRY_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session)
) -> User:
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        phone: str = payload.get("sub")
        if phone is None:
            raise credentials_exception
        token_data = TokenData(phone=phone)
    except JWTError:
        raise credentials_exception
    
    user = session.exec(select(User).where(User.phone == token_data.phone)).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user

async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

async def get_current_manager(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ["venue_manager", "club_admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Manager access required")
    return current_user