# backend/app/services/shift_service.py
"""زمان‌بندی شیفت پرسنل (P020) — ساخت، ویرایش، لغو، خلاصهٔ ساعت کاری و خروجی ماهانه.

سه «تصمیم» واقعی همین‌جا است (باقی لایه‌ها فقط HTTP می‌دهند):
۱) تضاد روی **شخص در همهٔ سالن‌ها** چک می‌شود و انتصاب فعال در سالن الزامی است،
   وگرنه می‌توان برای کسی شیفت گذاشت که کارمند آن سالن نیست؛
۲) بازه باید حداقل ۱۵ و حداکثر ۷۲۰ دقیقه باشد (ضد غلط تایپی: شیفت ۲۵ ساعته)؛
۳) ساعت کاری شمرده‌شده لغوشده را شامل نمی‌شود، ولی در ستون جدا گزارش می‌شود تا
   سابقه گم نشود (حقوق از «انجام‌شده» + «برنامه‌ریزی‌شده» حساب می‌شود).

خطاها `ValueError` با متن فارسی‌اند و روتر آن‌ها را به ۴۰۰ تبدیل می‌کند
(الگوی coach_service / tournament_service).
"""
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple

from sqlmodel import col, select

from app.models.staff_shift import ShiftStatus, StaffShift
from app.models.user import User
from app.schemas.staff_shift import (
    ShiftListResponse, ShiftRow, ShiftStaffSummary, ShiftSummaryResponse,
)
from app.unit_of_work import UnitOfWork

MIN_MIN = 15
MAX_MIN = 720
_STATUSES = {s.value: s for s in ShiftStatus}
_LABELS = {
    ShiftStatus.SCHEDULED: "برنامه‌ریزی‌شده",
    ShiftStatus.DONE: "انجام‌شده",
    ShiftStatus.CANCELLED: "لغوشده",
}
# UI فارسی است و UTC برای مدیر بی‌معنا ⇒ ورودی naive = وقت تهران (الگوی coach)
_TEHRAN = timezone(timedelta(hours=3, minutes=30))


def as_aware(dt: datetime) -> datetime:
    """ستون‌ها tz-aware می‌خواهند (naive روی INSERT در SQLModel می‌سوزد)."""
    if dt.tzinfo is not None:
        return dt
    return dt.replace(tzinfo=_TEHRAN)


def as_tehran(dt: datetime) -> datetime:
    """به وقت محلی برای نمایش/خروجی.

    naive بودن = «دیوارِ تهران» نه UTC: SQLite برچسب منطقه را ذخیره نمی‌کند و
    همان ساعتِ تهران را naive برمی‌گرداند، PostgreSQL با `timestamptz` لحظه را
    نگه می‌دارد و aware (UTC) می‌دهد. با این تعریف هر دو بک‌اند به یک عدد می‌رسند.
    """
    aware = dt if dt.tzinfo is not None else dt.replace(tzinfo=_TEHRAN)
    return aware.astimezone(_TEHRAN)


def _status_of(value) -> ShiftStatus:
    """هم عضو enum و هم رشته (نامِ ستون/مقدار `.value`) از DB می‌رسد."""
    if isinstance(value, ShiftStatus):
        return value
    return _STATUSES.get(str(getattr(value, "value", value)).lower(),
                         ShiftStatus.SCHEDULED)


def month_window(month: str) -> Tuple[datetime, datetime]:
    """«۲۰۲۶-۱۰» ⇒ [اول ماه, اول ماه بعد) به وقت تهران — پنجرهٔ خروجی ماهانه."""
    try:
        year, mon = (int(x) for x in month.split("-"))
        first = datetime(year, mon, 1, tzinfo=_TEHRAN)
        nxt = (datetime(year + 1, 1, 1, tzinfo=_TEHRAN) if mon == 12
               else datetime(year, mon + 1, 1, tzinfo=_TEHRAN))
    except (ValueError, TypeError) as exc:
        raise ValueError("قالب ماه باید YYYY-MM باشد (مثلاً 2026-10).") from exc
    return first, nxt


def _window(starts_at: datetime, ends_at: datetime) -> Tuple[datetime, datetime]:
    start, end = as_aware(starts_at), as_aware(ends_at)
    minutes = int((end - start).total_seconds() // 60)
    if minutes < MIN_MIN:
        raise ValueError(f"کوتاه‌ترین شیفت مجاز {MIN_MIN} دقیقه است.")
    if minutes > MAX_MIN:
        raise ValueError(f"بلندترین شیفت مجاز {MAX_MIN} دقیقه (۱۲ ساعت) است.")
    return start, end


def _require_staff(uow: UnitOfWork, venue_id: int, user_id: int) -> User:
    """انتصاب فعال در همان سالن — شیفت فقط برای کارمندِ آن سالن معنادار است."""
    user = uow.users.get_by_id(user_id)
    if user is None:
        raise ValueError("کاربری با این شناسه وجود ندارد.")
    if uow.staff.get_active(venue_id, user_id) is None:
        raise ValueError("این کاربر در این سالن کارمند فعال نیست؛ "
                         "ابتدا از بخش کارکنان او را انتصاب دهید.")
    return user


def _clash_message(clash: List[StaffShift]) -> str:
    other = clash[0]
    return (f"تعارض شیفت: این فرد در شیفت #{other.id} "
            f"({as_tehran(other.starts_at):%Y-%m-%d %H:%M} تا "
            f"{as_tehran(other.ends_at):%H:%M}) حضور دارد. "
            "یک نفر نمی‌تواند هم‌زمان دو شیفت داشته باشد.")


# ─────────────────────────── نوشتن ───────────────────────────

def create_shift(uow: UnitOfWork, *, venue_id: int, user_id: int,
                 starts_at: datetime, ends_at: datetime,
                 notes: Optional[str] = None,
                 actor_id: Optional[int] = None) -> StaffShift:
    _require_staff(uow, venue_id, user_id)
    start, end = _window(starts_at, ends_at)
    clash = uow.shifts.overlapping(user_id, start, end)
    if clash:
        raise ValueError(_clash_message(clash))
    return uow.shifts.create(StaffShift(
        venue_id=venue_id, user_id=user_id, starts_at=start, ends_at=end,
        status=ShiftStatus.SCHEDULED, notes=notes, created_by=actor_id,
    ))


def update_shift(uow: UnitOfWork, shift_id: int, *,
                 starts_at: Optional[datetime] = None,
                 ends_at: Optional[datetime] = None,
                 status: Optional[str] = None,
                 notes: Optional[str] = None) -> StaffShift:
    shift = _get(uow, shift_id)
    if shift.status == ShiftStatus.CANCELLED:
        raise ValueError("شیفتِ لغوشده قابل ویرایش نیست؛ شیفت جدید بسازید.")
    if status is not None and status not in _STATUSES:
        raise ValueError("وضعیت نامعتبر است (scheduled | done | cancelled).")

    new_start = as_aware(starts_at) if starts_at else shift.starts_at
    new_end = as_aware(ends_at) if ends_at else shift.ends_at
    moved = new_start != as_aware(shift.starts_at) or new_end != as_aware(shift.ends_at)
    window = _window(new_start, new_end) if moved else None
    if window:
        clash = uow.shifts.overlapping(shift.user_id, window[0], window[1],
                                       exclude_id=shift.id)
        if clash:
            raise ValueError(_clash_message(clash))

    if status is not None:
        shift.status = _STATUSES[status]
    if notes is not None:
        shift.notes = notes
    if window:
        shift.starts_at, shift.ends_at = window
    shift.updated_at = datetime.now(timezone.utc)
    uow.session.add(shift)
    uow.session.flush()
    uow.session.refresh(shift)
    return shift


def cancel_shift(uow: UnitOfWork, shift_id: int) -> StaffShift:
    shift = _get(uow, shift_id)
    if shift.status == ShiftStatus.CANCELLED:
        raise ValueError("این شیفت از قبل لغو شده است.")
    shift.status = ShiftStatus.CANCELLED
    shift.updated_at = datetime.now(timezone.utc)
    uow.session.add(shift)
    uow.session.flush()
    uow.session.refresh(shift)
    return shift


def _get(uow: UnitOfWork, shift_id: int) -> StaffShift:
    shift = uow.shifts.get_by_id(shift_id)
    if shift is None:
        raise ValueError("شیفت موردنظر یافت نشد.")
    return shift


# ─────────────────────── خواندن و گزارش ───────────────────────

def _people(uow: UnitOfWork, venue_id: int,
            user_ids: List[int]) -> Dict[int, Tuple[str, Optional[str]]]:
    """(نام, موقعیت) برای هر شناسه — دو کوئری برای کل لیست، نه به‌ازای هر ردیف."""
    wanted = {i for i in user_ids if i}
    if not wanted:
        return {}
    users = list(uow.session.exec(select(User).where(col(User.id).in_(wanted))).all())
    assignments = {a.user_id: a
                   for a in uow.staff.list_by_venue(venue_id, include_inactive=True)}
    out: Dict[int, Tuple[str, Optional[str]]] = {}
    for user in users:
        assignment = assignments.get(user.id)
        position = None
        if assignment is not None:
            position = (assignment.position.value
                        if hasattr(assignment.position, "value")
                        else str(assignment.position))
        out[user.id] = (user.full_name or user.phone, position)
    return out


def to_rows(uow: UnitOfWork, shifts: List[StaffShift]) -> List[ShiftRow]:
    """ردیف‌های یک سالن (لیست/خلاصه همیشه venue-scoped ساخته می‌شوند)."""
    if not shifts:
        return []
    people = _people(uow, shifts[0].venue_id, [s.user_id for s in shifts])
    out = []
    for s in shifts:
        name, position = people.get(s.user_id, (f"#{s.user_id}", None))
        out.append(ShiftRow(
            id=s.id, venue_id=s.venue_id, user_id=s.user_id,
            user_name=name, position=position,
            starts_at=as_tehran(s.starts_at), ends_at=as_tehran(s.ends_at),
            duration_min=s.duration_min, status=_status_of(s.status).value,
            notes=s.notes, created_by=s.created_by,
        ))
    return out


def list_shifts(uow: UnitOfWork, venue_id: int, *,
                date_from: Optional[datetime] = None,
                date_to: Optional[datetime] = None,
                status: Optional[str] = None,
                user_id: Optional[int] = None) -> ShiftListResponse:
    rows = uow.shifts.in_window(
        venue_id,
        as_aware(date_from) if date_from else None,
        as_aware(date_to) if date_to else None,
        status=_STATUSES[status] if status else None,
        user_id=user_id)
    items = to_rows(uow, rows)
    return ShiftListResponse(items=items, total=len(items))


def summary(uow: UnitOfWork, venue_id: int, *, date_from: datetime,
            date_to: datetime) -> ShiftSummaryResponse:
    rows = uow.shifts.in_window(venue_id, as_aware(date_from), as_aware(date_to))
    people = _people(uow, venue_id, [s.user_id for s in rows])
    per: Dict[int, ShiftStaffSummary] = {}
    total_min = 0
    for s in rows:
        agg = per.get(s.user_id)
        if agg is None:
            name, position = people.get(s.user_id, (f"#{s.user_id}", None))
            agg = ShiftStaffSummary(user_id=s.user_id, user_name=name,
                                    position=position, shifts=0,
                                    scheduled_min=0, done_min=0, cancelled=0)
            per[s.user_id] = agg
        agg.shifts += 1
        status = _status_of(s.status)
        if status == ShiftStatus.CANCELLED:
            agg.cancelled += 1
            continue
        if status == ShiftStatus.DONE:
            agg.done_min += s.duration_min
        else:
            agg.scheduled_min += s.duration_min
        total_min += s.duration_min
    return ShiftSummaryResponse(
        venue_id=venue_id, date_from=as_aware(date_from), date_to=as_aware(date_to),
        total_shifts=len(rows), total_min=total_min,
        per_staff=sorted(per.values(), key=lambda a: a.user_id),
    )


def export_csv(uow: UnitOfWork, venue_id: int, month: str) -> str:
    """فایل ماهانه برای تحویل به حسابداری.

    سرستون فارسی است (خروجی مالی انگلیسی است؛ مخاطبِ این فایل مدیر سالن است و
    با BOMِ روتر در Excel مستقیم خوانده می‌شود).
    """
    import csv
    import io

    date_from, date_to = month_window(month)
    rows = uow.shifts.in_window(venue_id, date_from, date_to)
    people = _people(uow, venue_id, [s.user_id for s in rows])
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["شناسه", "پرسنل", "موقعیت", "شروع", "پایان",
                     "دقیقه", "وضعیت", "یادداشت"])
    for s in rows:
        name, position = people.get(s.user_id, (f"#{s.user_id}", None))
        status = _status_of(s.status)
        writer.writerow([
            s.id, name, position or "",
            as_tehran(s.starts_at).strftime("%Y-%m-%d %H:%M"),
            as_tehran(s.ends_at).strftime("%Y-%m-%d %H:%M"),
            s.duration_min, _LABELS[status], s.notes or "",
        ])
    return buffer.getvalue()
