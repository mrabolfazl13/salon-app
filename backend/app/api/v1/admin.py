from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.unit_of_work import get_unit_of_work, UnitOfWork
from app.utils.auth import get_current_admin
from app.services.notification_service import notification_service
from app.models.user import User, UserRole

router = APIRouter(prefix="/admin", tags=["Admin"])

def _public_user(u: User) -> dict:
    """نمایش کاربر بدون فیلد حساس hashed_password"""
    return {
        "id": u.id,
        "phone": u.phone,
        "full_name": u.full_name,
        "role": u.role.value if hasattr(u.role, "value") else str(u.role),
        "is_active": u.is_active,
        "is_verified": u.is_verified,
        "created_at": u.created_at,
        "updated_at": u.updated_at,
        "last_login": u.last_login,
    }


@router.get("/users")
def get_all_users(
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_admin)
):
    users = uow.users.get_all()
    return [_public_user(u) for u in users]

@router.get("/stats/users")
def get_user_stats(
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_admin)
):
    return uow.users.get_user_statistics()

@router.get("/stats/venues")
def get_venue_stats(
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_admin)
):
    total = uow.venues.count()
    verified = uow.venues.count(is_verified=True)
    return {"total_venues": total, "verified_venues": verified, "pending_venues": total - verified}

@router.get("/pending-venues")
def get_pending_venues(
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_admin)
):
    return uow.venues.get_pending_venues()

@router.post("/verify-venue/{venue_id}")
async def verify_venue(
    venue_id: int,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_admin)
):
    venue = uow.venues.verify_venue(venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    uow.commit()

    if venue.manager_id:
        await notification_service.notify_venue_verified(venue.manager_id, {
            "venue_id": venue.id, "venue_name": venue.name})
    return {"message": f"Venue {venue.name} verified"}


# ─────────────────────── تایید مدیران سالن (ثبت‌نام‌های در انتظار) ───────────────────────

@router.get("/pending-managers")
def get_pending_managers(
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_admin)
):
    """مدیران سالنی که ثبت‌نام کرده‌اند ولی هنوز توسط مدیر نرم‌افزار تایید نشده‌اند"""
    users = uow.users.get_all()
    return [
        _public_user(u) for u in users
        if u.role in (UserRole.VENUE_MANAGER, UserRole.CLUB_ADMIN) and not u.is_verified
    ]


@router.post("/users/{user_id}/approve")
async def approve_user(
    user_id: int,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_admin)
):
    """تایید حساب مدیر سالن (یا کاربر) توسط مدیر نرم‌افزار"""
    user = uow.users.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    uow.users.update(user_id, {"is_verified": True, "is_active": True})
    uow.security_audits.log(
        "admin.user_approved", current_user.id,
        target_type="user", target_id=user_id,
        data={"role": user.role.value if hasattr(user.role, "value") else str(user.role)})
    uow.commit()

    await notification_service.notify_account_approved(user_id, {
        "user_id": user_id, "role": user.role.value if hasattr(user.role, "value") else str(user.role)})
    return {"message": f"حساب {user.full_name} تایید شد"}


@router.post("/users/{user_id}/reject")
async def reject_user(
    user_id: int,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_admin)
):
    """رد حساب مدیر سالن — حساب غیرفعال می‌شود"""
    user = uow.users.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    uow.users.update(user_id, {"is_verified": False, "is_active": False})
    uow.security_audits.log(
        "admin.user_rejected", current_user.id,
        target_type="user", target_id=user_id, data={})
    uow.commit()

    await notification_service.notify_account_rejected(user_id, {"user_id": user_id})
    return {"message": f"حساب {user.full_name} رد شد"}


# ─────────────────────── تخصیص نقش ( تنها مسیرِ تغییر نقش ) ───────────────────────

class RoleIn(BaseModel):
    role: UserRole


@router.put("/users/{user_id}/role")
def set_user_role(
    user_id: int,
    data: RoleIn,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_admin)
):
    """تخصیص نقش — تا پیش از این هیچ endpoint‌ای برای تغییر نقش وجود نداشت، پس
    مربی/مدیر/ادمین فقط با SQL دستی ساخته می‌شد (و ثبت‌نام عمومی هم نقش دلخواه
    می‌گرفت). این مسیر نقش را عوض می‌کند و در ممیزی امنیتی ثبت می‌کند.

    تن‌خودِ ادمین را نمی‌توان از همین مسیر پایین آورد: آخرین SUPER_ADMIN فعال
    باید بماند، وگرنه سیستم بی‌ادمین می‌شود (تأیید بعدی دستی/دیتابیس).
    """
    user = uow.users.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role == UserRole.SUPER_ADMIN and data.role != UserRole.SUPER_ADMIN:
        remaining = [u for u in uow.users.get_all(limit=1000)
                     if u.role == UserRole.SUPER_ADMIN and u.is_active and u.id != user_id]
        if not remaining:
            raise HTTPException(
                status_code=400,
                detail="آخرین مدیر سیستم را نمی‌توان تنزل داد؛ اول مدیر دیگری بسازید.")

    old_role = user.role
    uow.users.update(user_id, {"role": data.role})
    # مدیر سالنِ تازه‌انتخاب‌شده باید دوباره از صف تایید عبور کند
    if data.role in (UserRole.VENUE_MANAGER, UserRole.CLUB_ADMIN):
        uow.users.update(user_id, {"is_verified": False})
    uow.security_audits.log(
        "admin.user_role_changed", current_user.id,
        target_type="user", target_id=user_id,
        data={"from": old_role.value, "to": data.role.value})
    uow.commit()
    return {"message": f"نقش {user.full_name} به «{data.role.value}» تغییر کرد",
            "role": data.role.value}

