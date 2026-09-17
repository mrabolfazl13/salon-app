# backend/app/api/v1/holidays.py
"""تقویم مناسبت‌ها — مدیر: سالن خودش + مشاهده سراسری؛ سرپرست: مدیریت سراسری.

قاعده یکتایی: holiday_date روی کل تقویم یکتاست (spec) — یک مناسبت در هر تاریخ؛
ردیف سالن‌دار همان روز مجاز نیست (پیام فارسی ۴۰۰ بدون IntegrityError).
"""
from datetime import date, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app.unit_of_work import get_unit_of_work, UnitOfWork
from app.models.holiday import Holiday
from app.models.user import User, UserRole
from app.schemas.holiday import HolidayBulkCreate, HolidayCreate, HolidayResponse
from app.utils.auth import get_current_user
from app.utils.permissions import Perm
from app.utils.staff_access import ensure_venue_permission, staff_venue_ids
from app.utils.venue_guard import manager_venue_ids

router = APIRouter(prefix="/holidays", tags=["Holidays"])


def _assert_can_write(uow: UnitOfWork, current_user: User, venue_id: Optional[int],
                      request: Request = None):
    """سراسری: فقط سرپرست؛ سالن: مالک یا branch_manager (holiday.manage)."""
    if venue_id is None:
        if current_user.role != UserRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=403, detail="ثبت مناسبت سراسری فقط توسط سرپرست سیستم مجاز است")
        return
    ensure_venue_permission(uow, current_user, venue_id,
                            [Perm.HOLIDAY_MANAGE], request)


@router.get("/", response_model=List[HolidayResponse])
def list_holidays(
    start: Optional[date] = Query(None),
    end: Optional[date] = Query(None),
    from_date: Optional[date] = Query(None, alias="from"),
    to_date: Optional[date] = Query(None, alias="to"),
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """مناسبت‌های بازه — سراسری + سالن‌های کاربر (سرپرست: همه).

    پارامترهای صریح from/to (هماهنگ با پارامترهای زمانی API مالی)
    بر start/end برامدگی دارند؛ بدون پارامتر ⇒ واندوی پیش‌فرض حفظ می‌شود.
    """
    if from_date is not None:
        start = from_date
    if to_date is not None:
        end = to_date
    if start is None:
        start = date.today() - timedelta(days=365)
    if end is None:
        end = start + timedelta(days=730)
    if end < start:
        raise HTTPException(status_code=400, detail="تاریخ پایان نمی‌تواند قبل از شروع باشد")
    if current_user.role == UserRole.USER:
        ids = staff_venue_ids(uow, current_user, [Perm.HOLIDAY_MANAGE])
        if not ids:
            raise HTTPException(status_code=403,
                                detail="دسترسی مدیریتی لازم را ندارید")
    else:
        ids = manager_venue_ids(uow, current_user)
    rows = uow.holidays.list_range(start, end)
    if ids is not None:
        rows = [h for h in rows if h.venue_id is None or h.venue_id in ids]
    return rows


@router.post("/", response_model=HolidayResponse)
def create_holiday(
    data: HolidayCreate,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    _assert_can_write(uow, current_user, data.venue_id, request)
    if uow.holidays.get_one(holiday_date=data.holiday_date):
        raise HTTPException(
            status_code=400,
            detail=f"برای تاریخ {data.holiday_date} از قبل مناسبتی ثبت شده است")
    holiday = uow.holidays.create({
        "holiday_date": data.holiday_date,
        "name": data.name,
        "is_national": data.is_national,
        "venue_id": data.venue_id,
    })
    uow.commit()
    return holiday


@router.post("/bulk", response_model=dict)
def bulk_add_holidays(
    data: HolidayBulkCreate,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """Seed helper — افزودن دسته‌ای؛ سراسری فقط سرپرست، سالن‌ای مالک/branch_manager."""
    for item in data.items:
        _assert_can_write(uow, current_user, item.venue_id, request)
    created = uow.holidays.bulk_add([item.model_dump() for item in data.items])
    uow.commit()
    return {"requested": len(data.items), "created": len(created),
            "ids": [h.id for h in created]}


@router.delete("/{holiday_id}")
def delete_holiday(
    holiday_id: int,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    holiday = uow.holidays.get_by_id(holiday_id)
    if not holiday:
        raise HTTPException(status_code=404, detail="مناسبت یافت نشد")
    _assert_can_write(uow, current_user, holiday.venue_id, request)
    uow.holidays.delete(holiday_id, soft_delete=False)
    uow.commit()
    return {"message": "Holiday deleted"}


@router.get("/check/{target_date}", response_model=dict)
def check_date(
    target_date: date,
    venue_id: Optional[int] = Query(None),
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """آیا این تاریخ برای این سالن تعطیل است؟ (سراسری یا سالن‌محور)"""
    if current_user.role == UserRole.USER and not staff_venue_ids(
            uow, current_user, [Perm.HOLIDAY_MANAGE]):
        raise HTTPException(status_code=403,
                            detail="دسترسی مدیریتی لازم را ندارید")
    return {"date": target_date, "venue_id": venue_id,
            "is_holiday": uow.holidays.is_holiday(target_date, venue_id)}