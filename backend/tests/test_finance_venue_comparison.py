# backend/tests/test_finance_venue_comparison.py
"""مقایسهٔ بین-سالنه (P007) — `GET /finance/venue-comparison`.

چرا این تست‌ها: ادعای فیچر «توانایی مقایسهٔ سالن‌ها» است، پس باید ثابت شود
(۱) هر سالنِ دامنه یک ردیف دارد حتی اگر داده‌ای ندارد، (۲) ردیف‌های بی‌سالن و
باطل‌شده وارد هیچ عددی نمی‌شوند، (۳) سهم‌ها و رتبه‌ها با هم می‌خوانند،
(۴) دورهٔ مقایسه هم‌طول و بلافاصله قبل است، و (۵) دامنهٔ کارمند/ادمین همان
قانونِ بقیۀ گزارش‌های مالی است.
"""
from datetime import date, datetime, time as dtime, timedelta, timezone

from sqlmodel import Session, select

from app.models.booking import Booking, BookingStatus
from app.models.slot import Slot, SlotStatus
from app.models.staff import StaffAssignment
from app.models.transaction import (
    FinancialTransaction, TransactionDirection, TransactionStatus, TransactionType,
)
from app.models.user import User, UserRole
from app.models.venue import Venue
from helpers import auth
from conftest import test_engine

BASE = "/api/v1/finance"
FROM = date(2026, 5, 5)
TO = date(2026, 5, 11)
WINDOW = f"from={FROM.isoformat()}&to={TO.isoformat()}"


def _fresh():
    return Session(test_engine)


def _utc(day: date) -> datetime:
    # ظهر UTC — تا تبدیل ساعتی روز را عقب/جلو نبرد
    return datetime(day.year, day.month, day.day, 12, 0, tzinfo=timezone.utc)


def _user(phone, role=UserRole.USER):
    with _fresh() as s:
        u = User(phone=phone, full_name=f"کارب {phone}", hashed_password="x",
                 role=role, is_verified=True)
        s.add(u)
        s.commit()
        s.refresh(u)
        return u


def _venue(manager_id, name, tag):
    with _fresh() as s:
        v = Venue(name=name, address="آ", latitude=35.7, longitude=51.4,
                  phone=f"09120000{tag}", manager_id=manager_id)
        s.add(v)
        s.commit()
        s.refresh(v)
        return v


def _slot(s, venue_id, day, status, hour=18):
    sl = Slot(venue_id=venue_id, slot_date=day, start_time=dtime(hour, 0),
              duration=90, base_price=300_000, current_price=300_000, status=status)
    s.add(sl)
    s.commit()
    s.refresh(sl)
    return sl


def _booking(s, slot_id, user_id, amount, status):
    b = Booking(slot_id=slot_id, user_id=user_id, status=status, payment_amount=amount)
    s.add(b)
    s.commit()
    s.refresh(b)
    return b


def _tx(s, venue_id, on, amount, direction, status=TransactionStatus.CLEARED):
    t = FinancialTransaction(
        type=TransactionType.PAYMENT if direction == TransactionDirection.INCOME
        else TransactionType.EXPENSE,
        direction=direction, amount=amount, venue_id=venue_id,
        occurred_at=_utc(on), status=status, description="x",
    )
    s.add(t)
    s.commit()
    return t


def _world():
    """مدیر با سه سالن (A پُرکار، B متوسط، D بی‌داده) + سالن C متعلق به مدیر دیگر."""
    mgr = _user("09370000001", UserRole.VENUE_MANAGER)
    other = _user("09370000002", UserRole.VENUE_MANAGER)
    a = _venue(mgr.id, "سالن A", "11")
    b = _venue(mgr.id, "سالن B", "12")
    d = _venue(mgr.id, "سالن D", "14")
    c = _venue(other.id, "سالن C", "13")
    cust1 = _user("09370000101")
    cust2 = _user("09370000102")

    with _fresh() as s:
        # دفتر کل — بازهٔ جاری
        _tx(s, a.id, FROM + timedelta(days=1), 1_000_000, TransactionDirection.INCOME)
        _tx(s, a.id, FROM + timedelta(days=2), 200_000, TransactionDirection.EXPENSE)
        _tx(s, b.id, FROM + timedelta(days=3), 500_000, TransactionDirection.INCOME)
        # باطل‌شده نباید شمارش شود
        _tx(s, b.id, FROM + timedelta(days=4), 900_000, TransactionDirection.INCOME,
            status=TransactionStatus.VOIDED)
        # ردیف بی‌سالن — به هیچ ردیفی تعلق ندارد
        _tx(s, None, FROM + timedelta(days=4), 700_000, TransactionDirection.INCOME)
        # بازهٔ قبلی (۲۸ فروردین..۴ خرداد) — فقط A داده دارد
        _tx(s, a.id, date(2026, 4, 30), 400_000, TransactionDirection.INCOME)
        # بیرون از هر دو پنجره
        _tx(s, a.id, date(2026, 3, 1), 8_000_000, TransactionDirection.INCOME)

        # رزروها + سانس‌ها
        for i, (status, bstatus, amount, buyer) in enumerate([
            (SlotStatus.BOOKED, BookingStatus.CONFIRMED, 300_000, cust1.id),
            (SlotStatus.BOOKED, BookingStatus.CONFIRMED, 300_000, cust1.id),
            (SlotStatus.BOOKED, BookingStatus.CONFIRMED, 300_000, cust2.id),
            (SlotStatus.AVAILABLE, BookingStatus.CANCELLED, 300_000, cust2.id),
        ]):
            sl = _slot(s, a.id, FROM + timedelta(days=i), status, hour=8 + i)
            _booking(s, sl.id, buyer, amount, bstatus)
        sl = _slot(s, b.id, FROM + timedelta(days=1), SlotStatus.BOOKED, hour=9)
        _booking(s, sl.id, cust1.id, 450_000, BookingStatus.COMPLETED)
        # سالن D: فقط یک سانس مسدود ⇒ مخرج اشغال صفر
        _slot(s, d.id, FROM, SlotStatus.BLOCKED)
        sl = _slot(s, c.id, FROM, SlotStatus.BOOKED)
        _booking(s, sl.id, cust2.id, 600_000, BookingStatus.CONFIRMED)
        _tx(s, c.id, FROM, 600_000, TransactionDirection.INCOME)

    return {"mgr": mgr, "other": other, "a": a, "b": b, "c": c, "d": d}


def _rows(body):
    return {r["venue_id"]: r for r in body["rows"]}


# ─────────────────────────── شکل پاسخ ───────────────────────────

def test_rows_ranked_by_net_with_share_and_totals(client):
    env = _world()
    h = auth(env["mgr"].phone)
    r = client.get(f"{BASE}/venue-comparison?{WINDOW}", headers=h)
    assert r.status_code == 200, r.text
    body = r.json()

    # سالن مدیر دیگر در دامنه نیست؛ D (بی‌داده) هست
    assert [row["venue_id"] for row in body["rows"]] == [env["a"].id, env["b"].id, env["d"].id]
    rows = _rows(body)
    assert [row["rank"] for row in body["rows"]] == [1, 2, 3]

    a, b = rows[env["a"].id], rows[env["b"].id]
    assert (a["income"], a["expense"], a["net"]) == (1_000_000, 200_000, 800_000)
    assert (b["income"], b["expense"], b["net"]) == (500_000, 0, 500_000)

    # سهم از درآمدِ دامنه (ردیف بی‌سالن و باطل‌شده در مخرج نیستند)
    assert a["share_pct"] == round(1_000_000 / 1_500_000 * 100, 2)
    assert b["share_pct"] == round(500_000 / 1_500_000 * 100, 2)

    t = body["totals"]
    assert t["venues"] == 3
    assert (t["income"], t["expense"], t["net"]) == (1_500_000, 200_000, 1_300_000)
    assert t["bookings"] == 4 and t["cancelled"] == 1


def test_voided_and_null_venue_rows_never_count(client):
    env = _world()
    r = client.get(f"{BASE}/venue-comparison?{WINDOW}",
                   headers=auth(env["mgr"].phone))
    body = r.json()
    assert all(row["venue_id"] is not None for row in body["rows"])
    assert body["totals"]["income"] == 1_500_000      # نه 900k باطل و نه 700k بی‌سالن
    assert body["totals"]["transactions"] == 3


def test_empty_vehicle_still_gets_a_row(client):
    """سالن بی‌داده باید دیده شود — استدلال P007 «ناتوانی در benchmarking» است."""
    env = _world()
    r = client.get(f"{BASE}/venue-comparison?{WINDOW}",
                   headers=auth(env["mgr"].phone))
    d = _rows(r.json())[env["d"].id]
    assert d["income"] == 0 and d["bookings"] == 0 and d["share_pct"] == 0.0
    assert d["total_active_slots"] == 0 and d["occupancy_rate"] == 0.0
    assert d["avg_per_booking"] is None               # تقسیم بر صفر نمی‌شود


# ─────────────────────────── روند / بازهٔ مقایسه ───────────────────────────

def test_prev_window_is_equal_length_and_adjacent(client):
    env = _world()
    body = client.get(f"{BASE}/venue-comparison?{WINDOW}",
                      headers=auth(env["mgr"].phone)).json()
    assert body["prev_to_date"] == "2026-05-04"
    assert body["prev_from_date"] == "2026-04-28"     # همان ۷ روز، بلافاصله قبل
    rows = _rows(body)
    a, b = rows[env["a"].id], rows[env["b"].id]
    assert a["prev_net"] == 400_000 and a["net_change"] == 400_000
    # B بازهٔ قبل خالی بود ⇒ تغییر همان مقدار جاری است (نه تقسیم بر صفر)
    assert b["prev_net"] == 0 and b["net_change"] == 500_000


def test_dates_outside_both_windows_are_ignored(client):
    """ردیف ۸ میلیونی اسفند در هیچ‌کدام از دو پنجره نیست."""
    env = _world()
    body = client.get(f"{BASE}/venue-comparison?{WINDOW}",
                      headers=auth(env["mgr"].phone)).json()
    assert _rows(body)[env["a"].id]["income"] == 1_000_000


def test_reversed_range_is_rejected(client):
    env = _world()
    r = client.get(f"{BASE}/venue-comparison?from=2026-05-11&to=2026-05-05",
                   headers=auth(env["mgr"].phone))
    assert r.status_code == 400
    assert "شروع" in r.json()["detail"]


# ─────────────────────────── رزرو و اشغال ───────────────────────────

def test_booking_metrics_come_from_booking_table(client):
    env = _world()
    rows = _rows(client.get(f"{BASE}/venue-comparison?{WINDOW}",
                            headers=auth(env["mgr"].phone)).json())
    a, b = rows[env["a"].id], rows[env["b"].id]
    assert (a["bookings"], a["cancelled"]) == (3, 1)
    assert a["cancel_rate"] == 25.0
    assert a["booking_revenue"] == 900_000 and a["avg_per_booking"] == 300_000
    assert a["customers"] == 2          # یک مشتری تکراری یک بار شمرده می‌شود
    assert (b["bookings"], b["booking_revenue"], b["avg_per_booking"]) == (1, 450_000, 450_000)
    assert b["cancel_rate"] == 0.0


def test_occupancy_per_venue_and_totals(client):
    env = _world()
    body = client.get(f"{BASE}/venue-comparison?{WINDOW}",
                      headers=auth(env["mgr"].phone)).json()
    rows = _rows(body)
    assert (rows[env["a"].id]["total_active_slots"],
            rows[env["a"].id]["occupied_slots"],
            rows[env["a"].id]["occupancy_rate"]) == (4, 3, 75.0)
    assert rows[env["b"].id]["occupancy_rate"] == 100.0
    assert body["totals"]["total_active_slots"] == 5
    assert body["totals"]["occupied_slots"] == 4
    assert body["totals"]["occupancy_rate"] == 80.0


# ─────────────────────────── دامنهٔ دسترسی ───────────────────────────

def test_venue_filter_narrows_to_one_row(client):
    env = _world()
    body = client.get(f"{BASE}/venue-comparison?venue_id={env['b'].id}&{WINDOW}",
                      headers=auth(env["mgr"].phone)).json()
    assert [r["venue_id"] for r in body["rows"]] == [env["b"].id]
    assert body["venue_ids"] == [env["b"].id]
    assert body["rows"][0]["share_pct"] == 100.0      # دامنهٔ یک‌سالنه ⇒ سهم کامل


def test_manager_cannot_read_another_managers_venue(client):
    env = _world()
    r = client.get(f"{BASE}/venue-comparison?venue_id={env['c'].id}&{WINDOW}",
                   headers=auth(env["mgr"].phone))
    assert r.status_code == 403
    assert r.json()["detail"] == "شما مدیر این سالن نیستید"


def test_super_admin_sees_every_venue(client):
    env = _world()
    sup = _user("09370000003", UserRole.SUPER_ADMIN)
    body = client.get(f"{BASE}/venue-comparison?{WINDOW}", headers=auth(sup.phone)).json()
    assert body["venue_ids"] is None
    assert set(_rows(body)) == {env["a"].id, env["b"].id, env["c"].id, env["d"].id}
    assert body["totals"]["venues"] == 4


def test_staff_must_send_a_venue(client):
    env = _world()
    staff = _user("09370000004")
    with _fresh() as s:
        pos = StaffAssignment(venue_id=env["a"].id, user_id=staff.id,
                              position="accountant", added_by=env["mgr"].id)
        s.add(pos)
        s.commit()
    h = auth(staff.phone)
    missing = client.get(f"{BASE}/venue-comparison?{WINDOW}", headers=h)
    assert missing.status_code == 403
    assert "venue_id" in missing.json()["detail"]

    ok = client.get(f"{BASE}/venue-comparison?venue_id={env['a'].id}&{WINDOW}", headers=h)
    assert ok.status_code == 200, ok.text
    assert [r["venue_id"] for r in ok.json()["rows"]] == [env["a"].id]


def test_anonymous_is_401(client):
    r = client.get(f"{BASE}/venue-comparison?{WINDOW}")
    assert r.status_code in (401, 403)
