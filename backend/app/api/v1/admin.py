from fastapi import APIRouter, Depends, HTTPException
from app.unit_of_work import get_unit_of_work, UnitOfWork
from app.utils.auth import get_current_admin
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
def verify_venue(
    venue_id: int,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_admin)
):
    venue = uow.venues.verify_venue(venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
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
def approve_user(
    user_id: int,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_admin)
):
    """تایید حساب مدیر سالن (یا کاربر) توسط مدیر نرم‌افزار"""
    user = uow.users.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    uow.users.update(user_id, {"is_verified": True, "is_active": True})
    uow.commit()
    return {"message": f"حساب {user.full_name} تایید شد"}


@router.post("/users/{user_id}/reject")
def reject_user(
    user_id: int,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_admin)
):
    """رد حساب مدیر سالن — حساب غیرفعال می‌شود"""
    user = uow.users.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    uow.users.update(user_id, {"is_verified": False, "is_active": False})
    uow.commit()
    return {"message": f"حساب {user.full_name} رد شد"}
