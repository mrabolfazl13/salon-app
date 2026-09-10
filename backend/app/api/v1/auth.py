from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, EmailStr

from app.unit_of_work import get_unit_of_work, UnitOfWork
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.services.auth_service import AuthService
from app.services import verification_service
from app.utils.auth import create_access_token, get_current_user, get_password_hash
from app.models.user import User, UserRole

router = APIRouter(prefix="/auth", tags=["Authentication"])


class EmailVerifyRequest(BaseModel):
    phone: str = Field(..., pattern=r"^09[0-9]{9}$")
    email: EmailStr


class EmailVerifyConfirm(BaseModel):
    phone: str = Field(..., pattern=r"^09[0-9]{9}$")
    code: str = Field(..., min_length=6, max_length=6)


class ProfileUpdate(BaseModel):
    full_name: str = Field(..., min_length=3, max_length=100)


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., max_length=70)
    new_password: str = Field(..., min_length=4, max_length=70)


class ForgotPasswordRequest(BaseModel):
    phone: str = Field(..., pattern=r"^09[0-9]{9}$")


class ResetPasswordRequest(BaseModel):
    phone: str = Field(..., pattern=r"^09[0-9]{9}$")
    code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=4, max_length=70)


@router.post("/register", response_model=UserResponse)
def register(user_data: UserCreate, uow: UnitOfWork = Depends(get_unit_of_work)):
    """ثبت‌نام با شماره و رمز عبور

    - کاربر عادی: برای رزرو باید بعداً ایمیل (یا شماره) خود را تأیید کند
    - مدیر سالن: حساب تا تایید توسط مدیر نرم‌افزار (super admin) فعال نمی‌شود
    """
    existing_user = uow.users.get_by_phone(user_data.phone)
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    user = AuthService.create_user(
        uow=uow,
        phone=user_data.phone,
        full_name=user_data.full_name,
        password=user_data.password,
        role=user_data.role.value
    )
    return user


@router.post("/login", response_model=Token)
def login(user_data: UserLogin, uow: UnitOfWork = Depends(get_unit_of_work)):
    user = AuthService.authenticate_user(uow, user_data.phone, user_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect phone or password")

    # مدیر سالن: تا تایید مدیر نرم‌افزار، اجازه ورود ندارد
    if user.role in (UserRole.VENUE_MANAGER, UserRole.CLUB_ADMIN) and not user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="حساب شما در انتظار تایید مدیر نرم‌افزار است. پس از تایید می‌توانید وارد شوید."
        )

    uow.users.update_last_login(user.id)
    access_token = create_access_token(data={"sub": user.phone})
    return {"access_token": access_token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# ─────────────────────────── تایید ایمیل (کد یکبار مصرف) ───────────────────────────

@router.post("/verify/email/request")
def request_email_verification(
    data: EmailVerifyRequest,
    uow: UnitOfWork = Depends(get_unit_of_work)
):
    """درخواست کد تایید به ایمیل (روش رایگان). در حالت توسعه کد در dev_code برمی‌گردد."""
    user = uow.users.get_by_phone(data.phone)
    if not user:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")
    if user.is_verified:
        return {"message": "شماره شما از قبل تایید شده است", "dev_code": ""}

    dev_code = verification_service.request_email_code(data.phone, data.email)
    return {
        "message": "کد تایید به ایمیل شما ارسال شد",
        "dev_code": dev_code,
    }


@router.post("/verify/email/confirm")
def confirm_email_verification(
    data: EmailVerifyConfirm,
    uow: UnitOfWork = Depends(get_unit_of_work)
):
    """تایید کد یکبار مصرف و فعال‌سازی امکان رزرو"""
    user = uow.users.get_by_phone(data.phone)
    if not user:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")

    if not verification_service.confirm_code(data.phone, data.code):
        raise HTTPException(status_code=400, detail="کد تایید نادرست است")

    uow.users.update(user.id, {"is_verified": True})
    uow.commit()
    return {"message": "ایمیل شما با موفقیت تایید شد. حالا می‌توانید رزرو کنید."}


# ─────────────────────────── مدیریت حساب کاربری ───────────────────────────

@router.put("/profile", response_model=UserResponse)
def update_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work)
):
    """ویرایش اطلاعات پروفایل کاربر جاری (فعلاً نام نمایشی)"""
    updated = uow.users.update(current_user.id, {"full_name": data.full_name.strip()})
    uow.commit()
    return updated


@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work)
):
    """تغییر رمز عبور با ارائه رمز فعلی"""
    ok = AuthService.change_password(
        uow, current_user.id, data.old_password, data.new_password
    )
    if not ok:
        raise HTTPException(status_code=400, detail="رمز عبور فعلی نادرست است")
    uow.commit()
    return {"message": "رمز عبور با موفقیت تغییر کرد"}


@router.post("/forgot-password")
def forgot_password(
    data: ForgotPasswordRequest,
    uow: UnitOfWork = Depends(get_unit_of_work)
):
    """درخواست کد یکبار مصرف بازیابی رمز.

    برای جلوگیری از افشای وجود حساب، پاسخ همیشه یکسان است.
    در حالت توسعه کد در dev_code برگردانده می‌شود.
    """
    user = uow.users.get_by_phone(data.phone)
    generic = {"message": "اگر حسابی با این شماره وجود داشته باشد، کد بازیابی برای شما ارسال می‌شود."}
    if not user:
        return generic

    dev_code = verification_service.request_password_reset_code(data.phone)
    return {"message": generic["message"], "dev_code": dev_code}


@router.post("/reset-password")
def reset_password(
    data: ResetPasswordRequest,
    uow: UnitOfWork = Depends(get_unit_of_work)
):
    """بازیابی رمز عبور با کد یکبار مصرف"""
    user = uow.users.get_by_phone(data.phone)
    if not user:
        raise HTTPException(status_code=400, detail="کد بازیابی نادرست یا منقضی شده است")

    if not verification_service.confirm_reset_code(data.phone, data.code):
        raise HTTPException(status_code=400, detail="کد بازیابی نادرست یا منقضی شده است")

    uow.users.update(user.id, {"hashed_password": get_password_hash(data.new_password)})
    uow.commit()
    return {"message": "رمز عبور شما با موفقیت بازنشانی شد. اکنون وارد شوید."}
