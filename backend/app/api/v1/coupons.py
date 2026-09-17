# backend/app/api/v1/coupons.py
"""کدهای تخفیف — CRUD مدیر-سالن-اسکوپ؛ اعمال تنها توسط موتور قیمت سمت سرور."""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app.unit_of_work import get_unit_of_work, UnitOfWork
from app.models.coupon import CouponType
from app.models.user import User, UserRole
from app.schemas.coupon import CouponCreate, CouponResponse, CouponUpdate
from app.services.coupon_service import CouponService
from app.repositories.coupon_repository import normalize_code
from app.utils.auth import get_current_user
from app.utils.permissions import Perm
from app.utils.staff_access import ensure_venue_permission, log_security_event, staff_venue_ids
from app.utils.venue_guard import manager_venue_ids

router = APIRouter(prefix="/coupons", tags=["Coupons"])


def _ensure_scope(uow: UnitOfWork, user: User, venue_id: Optional[int],
                  request: Request = None):
    """کوپن سراسری: فقط سرپرست؛ کوپن سالن: مالک یا کارکنان با coupon.manage."""
    if venue_id is None:
        if user.role != UserRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=403, detail="کوپن سراسری فقط توسط سرپرست سیستم قابل ساخت است")
        return
    ensure_venue_permission(uow, user, venue_id, [Perm.COUPON_MANAGE], request)


@router.get("/", response_model=List[CouponResponse])
def list_coupons(
    request: Request,
    venue_id: Optional[int] = Query(None),
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    if venue_id is not None:
        ensure_venue_permission(uow, current_user, venue_id,
                                [Perm.COUPON_MANAGE], request)
        scope = [venue_id]
    elif current_user.role == UserRole.SUPER_ADMIN:
        scope = None
    elif current_user.role == UserRole.USER:
        scope = staff_venue_ids(uow, current_user, [Perm.COUPON_MANAGE])
        if not scope:
            raise HTTPException(status_code=403, detail="دسترسی مدیریتی لازم را ندارید")
    else:
        scope = manager_venue_ids(uow, current_user) or []
    rows = uow.coupons.list_scope(scope)
    return [CouponResponse.from_model(c) for c in rows]


@router.post("/", response_model=CouponResponse)
def create_coupon(
    data: CouponCreate,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    _ensure_scope(uow, current_user, data.venue_id, request)
    code = normalize_code(data.code)
    if uow.coupons.get_by_code(code):
        raise HTTPException(status_code=400, detail="این کد تخفیف از قبل وجود دارد")
    if data.discount_type == CouponType.PERCENT and data.value > 10000:
        raise HTTPException(status_code=400, detail="درصد تخفیف نمی‌تواند بیش از ۱۰۰٪ باشد")
    if data.valid_from and data.valid_until and data.valid_from > data.valid_until:
        raise HTTPException(status_code=400, detail="تاریخ شروع نمی‌تواند بعد از پایان باشد")
    coupon = uow.coupons.create({
        "code": code,
        "venue_id": data.venue_id,
        "discount_type": data.discount_type,
        "value": data.value,
        "max_uses": data.max_uses,
        "per_user_limit": data.per_user_limit,
        "min_booking_amount": data.min_booking_amount,
        "valid_from": data.valid_from,
        "valid_until": data.valid_until,
        "created_by": current_user.id,
    })
    log_security_event(uow, "coupon.created", current_user.id,
                       target_type="coupon", target_id=coupon.id,
                       venue_id=data.venue_id,
                       data={"code": code, "discount_type": str(data.discount_type),
                             "value": data.value}, request=request)
    uow.commit()
    return CouponResponse.from_model(coupon)


@router.put("/{coupon_id}", response_model=CouponResponse)
def update_coupon(
    coupon_id: int,
    data: CouponUpdate,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    coupon = uow.coupons.get_by_id(coupon_id)
    if not coupon:
        raise HTTPException(status_code=404, detail="کد تخفیف یافت نشد")
    _ensure_scope(uow, current_user, coupon.venue_id, request)
    changes = data.model_dump(exclude_unset=True)
    vf = changes.get("valid_from", coupon.valid_from)
    vu = changes.get("valid_until", coupon.valid_until)
    if vf and vu and vf > vu:
        raise HTTPException(status_code=400, detail="تاریخ شروع نمی‌تواند بعد از پایان باشد")
    if changes:
        coupon = uow.coupons.update(coupon_id, changes)
    uow.commit()
    return CouponResponse.from_model(coupon)


@router.delete("/{coupon_id}")
def disable_coupon(
    coupon_id: int,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """غیرفعال‌سازی نرم — ردیف مصرف‌شده برای ممیزی حفظ می‌شود."""
    coupon = uow.coupons.get_by_id(coupon_id)
    if not coupon:
        raise HTTPException(status_code=404, detail="کد تخفیف یافت نشد")
    _ensure_scope(uow, current_user, coupon.venue_id, request)
    uow.coupons.update(coupon_id, {"is_active": False})
    uow.commit()
    return {"message": "Coupon disabled", "id": coupon_id}