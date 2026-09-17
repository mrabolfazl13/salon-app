# backend/tests/test_dashboard_teams_crm_loyalty.py
"""داشبورد مالی: فیلدهای ماهِ قبل + active_teams؛ و فیلد loyalty_balance در ردیف
مشتری‌های CRM (لیست و جزئیات — تک‌کوئری گروهی)."""
from datetime import date, datetime, time as dtime, timedelta, timezone

import pytest
from sqlmodel import Session, select

import app.services.pending_booking_service as pbs
import app.utils.rate_limit as rl
from app.models.booking import Booking, BookingStatus
from app.models.loyalty import LoyaltyPoint, LoyaltyReason
from app.models.slot import Slot, SlotStatus
from app.models.team import Team, TeamBooking, TeamMember, TeamMemberStatus
from app.models.transaction import (
    FinancialTransaction, TransactionDirection, TransactionMethod,
    TransactionType,
)
from app.models.user import User, UserRole
from app.models.venue import Venue
from conftest import test_engine
from helpers import auth, FakeRedis

DENIED = "دسترسی مدیریتی لازم را ندارید"


@pytest.fixture(autouse=True)
def fake_redis(monkeypatch):
    fake = FakeRedis()
    monkeypatch.setattr(rl, "_client", fake)
    monkeypatch.setattr(pbs, "_client", fake)
    return fake


def _fresh():
    return Session(test_engine)


def _user(phone, role=UserRole.USER):
    with _fresh() as s:
        u = User(phone=phone, full_name="ک. " + phone, hashed_password="x", role=role)
        s.add(u); s.commit(); s.refresh(u)
        return u.id, phone


def _venue(manager_user_id):
    with _fresh() as s:
        v = Venue(name="سالن داشبورد", address="آ", latitude=35.7, longitude=51.4,
                  manager_id=manager_user_id)
        s.add(v); s.commit(); s.refresh(v)
        return v.id


def _tx(venue_id, tx_type, direction, amount, occurred):
    with _fresh() as s:
        s.add(FinancialTransaction(type=tx_type, direction=direction, amount=amount,
                                  method=TransactionMethod.CASH,
                                  venue_id=venue_id, occurred_at=occurred))
        s.commit()


def _slot_booking(venue_id, user_id, day, price=200000):
    with _fresh() as s:
        sl = Slot(venue_id=venue_id, slot_date=day, start_time=dtime(18, 0),
                  duration=90, base_price=price, current_price=price,
                  status=SlotStatus.BOOKED)
        s.add(sl); s.commit(); s.refresh(sl)
        b = Booking(slot_id=sl.id, user_id=user_id, status=BookingStatus.CONFIRMED,
                    payment_amount=price)
        s.add(b); s.commit(); s.refresh(b)
        return b.id


def _jalali(d):
    from app.utils.jalali import gregorian_to_jalali
    return gregorian_to_jalali(d.year, d.month, d.day)


def test_jalali_reference_dates():
    assert _jalali(date(2026, 9, 15)) == (1405, 6, 24)   # شهریور
    assert _jalali(date(2026, 3, 21)) == (1405, 1, 1)    # نوروز ۱۴۰۵
    assert _jalali(date(2025, 3, 21)) == (1404, 1, 1)    # نوروز ۱۴۰۴
    assert _jalali(date(2024, 3, 20)) == (1403, 1, 1)    # نوروز ۱۴۰۳
    assert _jalali(date(2025, 3, 20)) == (1403, 12, 30)  # اسفند کبیسه ۱۴۰۳


def test_dashboard_prev_month_and_active_teams(client):
    mid, m_phone = _user("093802000001", UserRole.VENUE_MANAGER)
    vid = _venue(mid)
    uid, _ = _user("093802000002")
    _slot_booking(vid, uid, date.today() + timedelta(days=1))

    # occurred_at در UTC ذخیره می‌شود؛ سبدهای ماه/روز داشبورد باید روز UTC باشند.
    today = datetime.now(timezone.utc).date()
    first_this = today.replace(day=1)
    last_month_end = first_this - timedelta(days=1)
    last_month_start = last_month_end.replace(day=1)

    # ماه قبل: درآمد ۶۰۰هزار هزینه ۱۰۰هزار ⇒ خالص ۵۰۰هزار
    _tx(vid, TransactionType.PAYMENT, TransactionDirection.INCOME, 600_000,
        datetime.combine(last_month_start + timedelta(days=3), dtime(10), tzinfo=timezone.utc))
    _tx(vid, TransactionType.EXPENSE, TransactionDirection.EXPENSE, 100_000,
        datetime.combine(last_month_end, dtime(10), tzinfo=timezone.utc))
    # ماه جاری
    _tx(vid, TransactionType.PAYMENT, TransactionDirection.INCOME, 250_000,
        datetime.combine(today, dtime(12), tzinfo=timezone.utc))

    # تیم‌ها — دامنه سالن
    _with_book, uid_b = None, uid

    def _team(name_prefix, owner_idx, active=True):
        with _fresh() as s:
            t = Team(name=f"{name_prefix}{owner_idx}", captain_id=owner_idx,
                     is_active=active)
            s.add(t); s.commit(); s.refresh(t)
            return t.id

    def _member(team_id, user_id, status):
        with _fresh() as s:
            s.add(TeamMember(team_id=team_id, user_id=user_id, status=status))
            s.commit()

    t1 = _team("تیم-۱-", mid)                       # عضو فعال + رزرو → بشمار
    _member(t1, uid, TeamMemberStatus.ACTIVE)
    t2 = _team("تیم-۲-", mid)                       # فقط TeamBooking در سالن → بشمار
    _member(t2, uid, TeamMemberStatus.ACTIVE)
    other_booking = _slot_booking(vid, uid, date.today() + timedelta(days=2))
    with _fresh() as s:
        s.add(TeamBooking(team_id=t2, booking_id=other_booking)); s.commit()
    idle, _idle_phone = _user("093802000003")
    t3 = _team("تیم-۳-", mid)                       # عضو فعال بدون رزرو → نشمار
    _member(t3, idle, TeamMemberStatus.ACTIVE)
    t4 = _team("تیم-۴-", mid, active=False)         # غیرفعال → نشمار
    _member(t4, uid, TeamMemberStatus.REMOVED)

    r = client.get("/api/v1/finance/dashboard", params={"venue_id": vid},
                   headers=auth(m_phone))
    assert r.status_code == 200, r.text
    body = r.json()
    for field in ("prev_month_revenue", "prev_month_expenses", "active_teams"):
        assert field in body, field
        assert isinstance(body[field], int)
    assert body["prev_month_expenses"] == 100_000
    assert body["prev_month_revenue"] == 500_000      # 600k − 100k
    assert body["month_revenue"] == 250_000
    assert body["active_teams"] == 2

    # بدون venue: دامنه مدیر (همان سالن) — نتیجه یکسان
    r2 = client.get("/api/v1/finance/dashboard", headers=auth(m_phone))
    assert r2.status_code == 200
    assert r2.json()["active_teams"] == 2


def _crm_setup(client):
    """CRM: مدیر + دو مشتری در یک سالن؛ یکی امتیاز وفاداری دارد."""
    from datetime import datetime
    mid, m_phone = _user("093802000010", UserRole.VENUE_MANAGER)
    vid = _venue(mid)
    cust, cust_phone = _user("093802000011")
    ghost, ghost_phone = _user("093802000012")
    with _fresh() as s:
        sl = Slot(venue_id=vid, slot_date=date.today() - timedelta(days=2),
                  start_time=dtime(18), duration=90, base_price=1000,
                  current_price=1000, status=SlotStatus.BOOKED)
        s.add(sl); s.commit(); s.refresh(sl)
        s.add(Booking(slot_id=sl.id, user_id=cust, status=BookingStatus.CONFIRMED,
                      payment_amount=1000))
        s.add(LoyaltyPoint(user_id=cust, points=100, reason=LoyaltyReason.MANUAL_ADJUST,
                           source_type="booking", source_id=1))
        s.add(LoyaltyPoint(user_id=cust, points=70, reason=LoyaltyReason.MANUAL_ADJUST,
                           source_type="booking", source_id=2))
        s.add(LoyaltyPoint(user_id=cust, points=-30, reason=LoyaltyReason.MANUAL_ADJUST,
                           source_type="booking", source_id=3))
        s.commit()
    return mid, m_phone, vid, cust, cust_phone, ghost


def test_crm_rows_include_loyalty_balance(client):
    _, m_phone, vid, cust, _, ghost = _crm_setup(client)
    h = auth(m_phone)
    r = client.get("/api/v1/crm/customers", params={"venue_id": vid}, headers=h)
    assert r.status_code == 200, r.text
    row = next(x for x in r.json()["items"] if x["user_id"] == cust)
    assert row["loyalty_balance"] == 140

    d = client.get(f"/api/v1/crm/customers/{cust}", params={"venue_id": vid}, headers=h)
    assert d.status_code == 200, d.text
    assert d.json()["customer"]["loyalty_balance"] == 140

    # مشتریِ بدون هیچ فعالیت — صف جزئیات fallback هم فیلد را دارد
    d2 = client.get(f"/api/v1/crm/customers/{ghost}", params={"venue_id": vid}, headers=h)
    assert d2.status_code == 200
    assert d2.json()["customer"]["loyalty_balance"] == 0


def test_crm_loyalty_single_batched_query(client):
    """no-N+1: کوئری loyalty_points در لیست حداکثر یک‌بار اجرا شود."""
    _, m_phone, vid, cust, _, _ = _crm_setup(client)
    stmt_counter = {"n": 0}
    from sqlalchemy import event

    def _count(conn, cursor, statement, parameters, context, executemany):
        if "loyalty_points" in statement and "SUM" in statement.upper():
            stmt_counter["n"] += 1
    event.listen(test_engine, "before_cursor_execute", _count)
    try:
        r = client.get("/api/v1/crm/customers", params={"venue_id": vid},
                       headers=auth(m_phone))
        assert r.status_code == 200
    finally:
        event.remove(test_engine, "before_cursor_execute", _count)
    assert stmt_counter["n"] == 1