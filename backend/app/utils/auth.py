# backend/app/utils/auth.py
from datetime import datetime, timedelta, timezone
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
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(hours=settings.JWT_EXPIRY_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Create a long-lived refresh token."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=settings.JWT_REFRESH_EXPIRY_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: Optional[str]) -> Optional[dict]:
    """اعتبارسنجی و decode کردن JWT. در صورت نامعتبر/منقضی بودن None برمی‌گرداند.

    بین وابستگی احراز هویت HTTP (get_current_user) و نقاط پایانی WebSocket مشترک است.
    """
    if not token:
        return None
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None


def get_user_by_token(token: Optional[str], session: Session) -> Optional[User]:
    """کاربر متناظر با یک JWT معتبر را از دیتابیس پیدا می‌کند.

    در صورت توکن خراب/منقضی یا نبودِ کاربر None برمی‌گرداند (بدون raise؛
    تشخیص وضعیت کاربر غیرفعال با فراخوان است). بدون این، نقطه پایان
    WebSocket نباید به وابستگی HTTP Bearer متصل باشد.
    """
    payload = decode_access_token(token)
    if payload is None:
        return None
    phone = payload.get("sub")
    if not phone:
        return None
    return session.exec(select(User).where(User.phone == phone)).first()

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
    if decode_access_token(token) is None:
        raise credentials_exception
    user = get_user_by_token(token, session)
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
