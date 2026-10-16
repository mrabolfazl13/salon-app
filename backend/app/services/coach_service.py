# backend/app/services/coach_service.py
"""منطق جلسات مربی (P004) — ساخت، ویرایش، ثبت حضور/غیبت و داشبورد.

چرا این‌قدر کوچک نگه داشته شده: تنها «تصمیم»های واقعی همین سه‌تا هستند —
۱) تضاد زمانی مربی (یک مربی نمی‌تواند هم‌زمان دو شاگرد داشته باشد)،
۲) اینکه شاگرد و مربی می‌توانند یک نفر نباشند و شاگرد حساب فعال داشته باشد،
۳) اینکه درآمد فقط از جلساتِ برگزارشده (attended) شمرده می‌شود نه رزروهای لغوشده.
باقی کرده‌ها HTTPException نمی‌دهند؛ ValueError با متن فارسی برمی‌گردانند و
روتِر آن را به ۴۰۰ تبدیل می‌کند (الگوی team_service).
"""
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple

from app.models.coach import CoachSession, CoachSessionStatus
from app.models.user import User, UserRole
from app.unit_of_work import UnitOfWork

# جلسه‌ای که در آن شاگرد آمده = درآمد. لغوشده هرگز شمرده نمی‌شود.
_REVENUE_STATUSES = (CoachSessionStatus.ATTENDED,)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def as_aware(dt: datetime) -> datetime:
    """SQLModel `UTCDateTime` با مقدار naive روی INSERT می‌سوزد ⇒ همه را aware می‌کنیم.

    ورودی naive از کلاینت = وقت تهران (رابط کاربری فارسی است و UTC را کاربر نمی‌فهمد).
    """
    if dt.tzinfo is not None:
        return dt
    return dt.replace(tzinfo=timezone(timedelta(hours=3, minutes=30)))  # Asia/Tehran


def tz_day_window(day: datetime) -> Tuple[datetime, datetime]:
    start = day.replace(hour=0, minute=0, second=0, microsecond=0)
    return start, start + timedelta(days=1)


def _get_client(uow: UnitOfWork, phone: str) -> User:
    client = uow.users.get_by_phone(phone)
    if not client:
        raise ValueError("کاربری با این شماره ثبت نشده است؛ ابتدا او را دعوت کنید.")
    if not client.is_active:
        raise ValueError("حساب شاگرد غیرفعال است.")
    return client


def _check_place(uow: UnitOfWork, venue_id: Optional[int], slot_id: Optional[int]) -> None:
    """لینک به سالن/سانس فقط وقتی معتبر است که ردیف واقعاً وجود داشته باشد (FK خام)."""
    if venue_id is not None and not uow.venues.get_by_id(venue_id):
        raise ValueError("سالن انتخابی وجود ندارد.")
    if slot_id is not None and not uow.slots.get_by_id(slot_id):
        raise ValueError("سانس انتخابی وجود ندارد.")


def create_session(uow: UnitOfWork, coach: User, client_phone: str,
                   starts_at: datetime, duration_min: int, fee: int = 0,
                   venue_id: Optional[int] = None, slot_id: Optional[int] = None,
                   notes: Optional[str] = None) -> CoachSession:
    client = _get_client(uow, client_phone)
    if client.id == coach.id:
        raise ValueError("مربی نمی‌تواند شاگرد خودش باشد.")
    _check_place(uow, venue_id, slot_id)


    start = as_aware(starts_at)
    end = start + timedelta(minutes=duration_min)
    clash = uow.coach_sessions.overlapping(coach.id, start, end)
    if clash:
        raise ValueError(
            f"تعارض زمانی: جلسهٔ #{clash[0].id} از {clash[0].starts_at:%H:%M} "
            f"تا {clash[0].ends_at:%H:%M} رزرو شده است.")

    session = CoachSession(coach_id=coach.id, client_id=client.id,
                           venue_id=venue_id, slot_id=slot_id,
                           fee=fee, notes=notes,
                           status=CoachSessionStatus.SCHEDULED)
    session.set_window(start, duration_min)
    return uow.coach_sessions.create(session)


def update_session(uow: UnitOfWork, coach: User, session_id: int, *,
                   starts_at: Optional[datetime] = None,
                   duration_min: Optional[int] = None,
                   fee: Optional[int] = None,
                   notes: Optional[str] = None,
                   venue_id: Optional[int] = None,
                   slot_id: Optional[int] = None) -> CoachSession:
    session = _owned(uow, coach, session_id)
    if session.status == CoachSessionStatus.CANCELLED:
        raise ValueError("جلسهٔ لغوشده قابل ویرایش نیست.")
    _check_place(uow, venue_id, slot_id)


    new_start = as_aware(starts_at) if starts_at else session.starts_at
    new_duration = duration_min if duration_min else session.duration_min
    if new_start != session.starts_at or new_duration != session.duration_min:
        new_end = new_start + timedelta(minutes=new_duration)
        clash = uow.coach_sessions.overlapping(coach.id, new_start, new_end,
                                               exclude_id=session.id)
        if clash:
            raise ValueError(
                f"تعارض زمانی با جلسهٔ #{clash[0].id} "
                f"({clash[0].starts_at:%H:%M}–{clash[0].ends_at:%H:%M}).")
        session.set_window(new_start, new_duration)

    if fee is not None:
        session.fee = fee
    if notes is not None:
        session.notes = notes
    if venue_id is not None:
        session.venue_id = venue_id
    if slot_id is not None:
        session.slot_id = slot_id
    session.updated_at = _utcnow()
    uow.session.add(session)
    uow.session.flush()
    return session


def set_attendance(uow: UnitOfWork, actor: User, session_id: int,
                   status: CoachSessionStatus) -> CoachSession:
    """ثبت حضور/غیبت/لغو — فقط مربیِ همان جلسه (یا ادمین)."""
    session = _owned(uow, actor, session_id, allow_admin=True)
    if status == session.status:
        raise ValueError("وضعیت جلسه همان است که هست؛ تغییری ثبت نشد.")

    session.status = status
    session.updated_at = _utcnow()
    if status == CoachSessionStatus.ATTENDED:
        session.attended_at = _utcnow()
        session.marked_by = actor.id
    else:
        session.attended_at = None
        session.marked_by = None
    uow.session.add(session)
    uow.session.flush()
    return session


def set_settled(uow: UnitOfWork, actor: User, session_id: int, settled: bool) -> CoachSession:
    session = _owned(uow, actor, session_id, allow_admin=True)
    if settled and session.status != CoachSessionStatus.ATTENDED:
        raise ValueError("شهریه فقط پس از ثبت حضور قابل تسویه است.")
    session.fee_settled = settled
    session.updated_at = _utcnow()
    uow.session.add(session)
    uow.session.flush()
    return session


def _owned(uow: UnitOfWork, actor: User, session_id: int,
           allow_admin: bool = False) -> CoachSession:
    session = uow.coach_sessions.get_by_id(session_id)
    if not session:
        raise ValueError("جلسه یافت نشد.")
    is_admin = actor.role == UserRole.SUPER_ADMIN
    if session.coach_id != actor.id and not (allow_admin and is_admin):
        raise PermissionError("این جلسه متعلق به مربی دیگری است.")
    return session


def clients_of(uow: UnitOfWork, coach_id: int) -> List[dict]:
    """شاگردهای مربی با تعداد جلسات و آخرین جلسه — از دادهٔ واقعی، نه ساختگی."""
    from sqlalchemy import func
    from sqlmodel import select
    rows = uow.session.exec(
        select(CoachSession.client_id,
               func.count().label("sessions"),
               func.max(CoachSession.starts_at).label("last_at"),
               func.sum(CoachSession.fee).label("fee_total"))
        .where(CoachSession.coach_id == coach_id)
        .group_by(CoachSession.client_id)
        .order_by(func.count().desc())
    ).all()
    out = []
    for row in rows:
        client = uow.users.get_by_id(row[0])
        if not client:
            continue
        out.append({
            "user_id": client.id,
            "full_name": client.full_name,
            "phone": client.phone,
            "sessions": row[1],
            "last_session_at": row[2],
            "fee_total": int(row[3] or 0),
        })
    return out


def dashboard(uow: UnitOfWork, coach_id: int, now: Optional[datetime] = None) -> dict:
    now = as_aware(now) if now else _utcnow()
    day_start, day_end = tz_day_window(now)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    today = uow.coach_sessions.for_coach(coach_id, date_from=day_start, date_to=day_end,
                                         limit=100)
    upcoming = uow.coach_sessions.upcoming(coach_id, now, limit=10)
    month_rows = uow.coach_sessions.for_coach(coach_id, date_from=month_start,
                                              date_to=now + timedelta(days=1), limit=1000)
    attended = [s for s in month_rows if s.status in _REVENUE_STATUSES]

    return {
        "today": [_to_dict(s, uow) for s in today],
        "upcoming": [_to_dict(s, uow) for s in upcoming],
        "today_count": len([s for s in today
                            if s.status != CoachSessionStatus.CANCELLED]),
        "month_sessions": len(attended),
        "month_revenue": sum(s.fee for s in attended),
        "month_outstanding": sum(s.fee for s in attended if not s.fee_settled),
        "active_clients": len(uow.coach_sessions.client_ids_of(coach_id)),
    }


def _to_dict(s: CoachSession, uow: UnitOfWork) -> dict:
    client = uow.users.get_by_id(s.client_id)
    coach = uow.users.get_by_id(s.coach_id)
    return {
        "id": s.id,
        "coach_id": s.coach_id,
        "coach_name": coach.full_name if coach else None,
        "client_id": s.client_id,
        "client_name": client.full_name if client else None,
        "client_phone": client.phone if client else None,
        "venue_id": s.venue_id,
        "slot_id": s.slot_id,
        "starts_at": s.starts_at,
        "ends_at": s.ends_at,
        "duration_min": s.duration_min,
        "status": s.status.value if hasattr(s.status, "value") else str(s.status),
        "fee": s.fee,
        "fee_settled": s.fee_settled,
        "notes": s.notes,
        "attended_at": s.attended_at,
    }


def to_out(s: CoachSession, uow: UnitOfWork) -> dict:
    return _to_dict(s, uow)
