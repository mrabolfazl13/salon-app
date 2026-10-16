# backend/app/api/v1/coach.py
"""API جلسات مربی (P004) — نقش `coach` علاوه بر کاربر عادی و مدیر سالن.

دروازهٔ نقش (آزمون‌پذیر و در tests/test_coach.py قفل‌شده):
- نوشتن (ساخت/ویرایش/حضور/تسویه): فقط خودِ مربیِ جلسه؛ SUPER_ADMIN فقط می‌تواند
  حضور را تصحیح کند. کاربر عادی (USER) هیچ دسترسی نوشتن ندارد.
- خواندن: مربی ← جلسات خودش؛ شاگرد ← جلساتی که در آن‌ها client است؛
  SUPER_ADMIN ← همه. بقیه ۴۰۳.
- متن خطاها فارسی است چون مستقیم در UI نشان داده می‌شود.
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.models.coach import CoachSessionStatus
from app.models.user import User, UserRole
from app.services import coach_service
from app.unit_of_work import UnitOfWork, get_unit_of_work
from app.utils.auth import get_current_user

router = APIRouter(prefix="/coach", tags=["Coach"])


class SessionCreateIn(BaseModel):
    client_phone: str = Field(pattern=r"^09[0-9]{9}$")
    starts_at: datetime
    duration_min: int = Field(default=60, ge=15, le=480)
    fee: int = Field(default=0, ge=0)
    venue_id: Optional[int] = None
    slot_id: Optional[int] = None
    notes: Optional[str] = Field(default=None, max_length=500)


class SessionUpdateIn(BaseModel):
    starts_at: Optional[datetime] = None
    duration_min: Optional[int] = Field(default=None, ge=15, le=480)
    fee: Optional[int] = Field(default=None, ge=0)
    venue_id: Optional[int] = None
    slot_id: Optional[int] = None
    notes: Optional[str] = Field(default=None, max_length=500)


class AttendanceIn(BaseModel):
    status: CoachSessionStatus


class SettleIn(BaseModel):
    settled: bool = True


def _require_coach(user: User) -> User:
    if user.role != UserRole.COACH:
        raise HTTPException(status_code=403,
                            detail="این بخش فقط برای حساب‌های با نقش مربی فعال است.")
    return user


def _fail(exc: Exception) -> None:
    """خطای سرویس → کد وضعیت: PermissionError=۴۰۳، ValueError=۴۰۰."""
    if isinstance(exc, PermissionError):
        raise HTTPException(status_code=403, detail=str(exc))
    raise HTTPException(status_code=400, detail=str(exc))


def _aware(value: Optional[datetime]) -> Optional[datetime]:
    return coach_service.as_aware(value) if value else None


@router.post("/sessions")
def create_session(
    data: SessionCreateIn,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    coach = _require_coach(current_user)
    try:
        session = coach_service.create_session(
            uow, coach, data.client_phone, data.starts_at, data.duration_min,
            fee=data.fee, venue_id=data.venue_id, slot_id=data.slot_id, notes=data.notes)
    except (ValueError, PermissionError) as exc:
        _fail(exc)
    uow.commit()
    return coach_service.to_out(session, uow)


@router.get("/sessions")
def list_sessions(
    status: Optional[CoachSessionStatus] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    coach_id: Optional[int] = None,
    as_client: bool = False,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """مربی ← جلسات خودش؛ `as_client=true` ← جلساتی که شاگردشان است؛
    مدیر سیستم ← همه (اختیاری با `coach_id` تنگ‌تر می‌شود)."""
    start, end = _aware(date_from), _aware(date_to)
    if as_client:
        total = uow.coach_sessions.count_for_client(current_user.id)
        rows = uow.coach_sessions.for_client(current_user.id, limit=limit, offset=offset)
    elif current_user.role == UserRole.COACH:
        total = uow.coach_sessions.count_for_coach(current_user.id, status=status,
                                                   date_from=start, date_to=end)
        rows = uow.coach_sessions.for_coach(current_user.id, status=status,
                                            date_from=start, date_to=end,
                                            limit=limit, offset=offset)
    elif current_user.role == UserRole.SUPER_ADMIN:
        total = uow.coach_sessions.count_search(coach_id=coach_id, status=status,
                                                date_from=start, date_to=end)
        rows = uow.coach_sessions.search(coach_id=coach_id, status=status,
                                         date_from=start, date_to=end,
                                         limit=limit, offset=offset)
    else:
        raise HTTPException(status_code=403,
                            detail="فقط مربی یا شاگرد می‌تواند جلسات را ببیند.")
    return {"total": total, "items": [coach_service.to_out(s, uow) for s in rows]}


@router.get("/sessions/{session_id}")
def get_session(
    session_id: int,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    session = uow.coach_sessions.get_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="جلسه یافت نشد.")
    visible = (session.coach_id == current_user.id
               or session.client_id == current_user.id
               or current_user.role == UserRole.SUPER_ADMIN)
    if not visible:
        raise HTTPException(status_code=403, detail="دسترسی به این جلسه مجاز نیست.")
    return coach_service.to_out(session, uow)


@router.put("/sessions/{session_id}")
def update_session(
    session_id: int,
    data: SessionUpdateIn,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    _require_coach(current_user)
    try:
        session = coach_service.update_session(
            uow, current_user, session_id,
            starts_at=data.starts_at, duration_min=data.duration_min, fee=data.fee,
            notes=data.notes, venue_id=data.venue_id, slot_id=data.slot_id)
    except (ValueError, PermissionError) as exc:
        _fail(exc)
    uow.commit()
    return coach_service.to_out(session, uow)


@router.put("/sessions/{session_id}/attendance")
def set_attendance(
    session_id: int,
    data: AttendanceIn,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in (UserRole.COACH, UserRole.SUPER_ADMIN):
        raise HTTPException(status_code=403, detail="فقط مربی یا مدیر سیستم.")
    try:
        session = coach_service.set_attendance(uow, current_user, session_id, data.status)
    except (ValueError, PermissionError) as exc:
        _fail(exc)
    uow.commit()
    return coach_service.to_out(session, uow)


@router.put("/sessions/{session_id}/settle")
def set_settle(
    session_id: int,
    data: SettleIn,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    _require_coach(current_user)
    try:
        session = coach_service.set_settled(uow, current_user, session_id, data.settled)
    except (ValueError, PermissionError) as exc:
        _fail(exc)
    uow.commit()
    return coach_service.to_out(session, uow)


@router.get("/dashboard")
def dashboard(
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    coach = _require_coach(current_user)
    return coach_service.dashboard(uow, coach.id)


@router.get("/clients")
def clients(
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    coach = _require_coach(current_user)
    return {"items": coach_service.clients_of(uow, coach.id)}
