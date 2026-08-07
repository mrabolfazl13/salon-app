# backend/app/schemas/user.py
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    USER = "user"
    VENUE_MANAGER = "venue_manager"
    CLUB_ADMIN = "club_admin"
    SUPER_ADMIN = "super_admin"

class UserBase(BaseModel):
    phone: str = Field(..., pattern=r"^09[0-9]{9}$")
    full_name: str = Field(..., min_length=3, max_length=100)
    role: UserRole = UserRole.USER

class UserCreate(UserBase):
    password: str = Field(..., min_length=4, max_length=70)  # ← محدود کردن به 70 کاراکتر
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) > 70:
            raise ValueError('Password cannot be longer than 70 characters')
        return v

class UserLogin(BaseModel):
    phone: str
    password: str = Field(..., max_length=70)
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) > 70:
            raise ValueError('Password cannot be longer than 70 characters')
        return v

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    phone: str | None = None