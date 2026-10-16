# backend/tests/test_waitlist.py
"""صف انتظار — ورود/خروج/جابه‌جایی موقعیت و تبدیل خودکار پس از پنجرهٔ ۲ ساعته (B5).

تست اول همان مسیر واقعی (endpoint) را می‌زند، نه مدل را.
نکتهٔ زمان که در CI (۲۰۲۶-۱۰-۱۶) اندازه‌گیری شد: روی SQLite با `sqlmodel==0.0.42` (استکِ
CI/prod) مقدار `created_at` naive برمی‌گردد، ولی روی PostgreSQL مهاجرت‌شده همهٔ ۱۸۴ ستون
زمانی `timestamp with time zone`‌اند ⇒ برای اینکه تست روی هر دو stack معنا داشته باشد،
مقایسه‌ها از `app.utils.utc.as_utc` رد می‌شوند.
"""
from datetime import datetime, timedelta, timezone

import pytest
from sqlmodel import Session, select

from conftest import test_engine
from helpers import FakeRedis, auth
from app.models.slot import Slot, SlotStatus
from app.models.waitlist import WaitlistEntry
from app.utils.utc import as_utc

BASE = "/api/v1/waitlist"


@pytest.fixture(autouse=True)
def _pending_store():
    """create_booking رزرو معلق را در Redis نگه می‌دارد — اینجا همان _client را fake می‌کنیم."""
    from app.services import pending_booking_service as pbs

    fake = FakeRedis()
    pbs._client = fake
    try:
        yield fake
    finally:
        pbs._client = None


def _rows(slot_id: int, active_only: bool = False):
    """ردیف‌های صف: (id, user_id, position, status, created_at).

    leave حذف فیزیکی نمی‌کند، وضعیت را cancelled می‌کند ⇒ برای دیدن صف واقعی
    باید active_only=True (همان فیلتری که endpoint ها می‌زنند).
    """
    with Session(test_engine) as s:
        stmt = select(WaitlistEntry).where(WaitlistEntry.slot_id == slot_id)
        if active_only:
            stmt = stmt.where(WaitlistEntry.status.in_(["pending", "notified"]))
        rows = s.exec(stmt.order_by(WaitlistEntry.position, WaitlistEntry.id)).all()
        return [(r.id, r.user_id, r.position, r.status, r.created_at) for r in rows]


def _make_booked(client, seed, phone: str):
    owner = seed["user"](phone)
    chain = seed["booking"](owner)
    return owner, chain


# ─────────────────────────── ورود/خروج ───────────────────────────

def test_join_waitlist_returns_201_and_position(client, seed):
    owner, chain = _make_booked(client, seed, "09191000001")
    waiter = seed["user"]("09191000002")
    r = client.post(f"{BASE}/join/{chain['slot'].id}", headers=auth(waiter.phone))
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["position"] == 1
    assert "موقعیت" in body["message"]
    rows = _rows(chain["slot"].id)
    assert len(rows) == 1
    assert rows[0][3] == "pending"
    # رگرسیون زمانی: ردیف باید «اکنونِ UTC» را ثبت کرده باشد، چون پنجرهٔ ۲ ساعتهٔ
    # convert_expired به همین عدد تکیه می‌کند. awareness عمداً سنجیده نمی‌شود: هیچ مدلی
    # `DateTime(timezone=True)` ندارد، پس روی PostgreSQL (و با sqlmodel==0.0.42 که CI/prod
    # نصب می‌کند) مقدار بازگشتی naive است — ادعای قبلیِ همین فایل («باید aware باشد وگرنه
    # INSERT می‌سوزد») با همان نسخهٔ pinned نقض شد، درحالی‌که مسیر INSERT درست کار می‌کند.
    stored = as_utc(rows[0][4])
    now = datetime.now(timezone.utc)
    assert now - timedelta(minutes=5) <= stored <= now + timedelta(seconds=5)


def test_join_waitlist_requires_booked_slot(client, seed):
    owner, chain = _make_booked(client, seed, "09191000003")
    waiter = seed["user"]("09191000004")
    with Session(test_engine) as s:
        slot = s.get(Slot, chain["slot"].id)
        slot.status = SlotStatus.AVAILABLE
        s.add(slot)
        s.commit()
    r = client.post(f"{BASE}/join/{chain['slot'].id}", headers=auth(waiter.phone))
    assert r.status_code == 400
    assert "not fully booked" in r.text


def test_join_waitlist_twice_rejected(client, seed):
    owner, chain = _make_booked(client, seed, "09191000005")
    waiter = seed["user"]("09191000006")
    first = client.post(f"{BASE}/join/{chain['slot'].id}", headers=auth(waiter.phone))
    assert first.status_code == 201, first.text
    second = client.post(f"{BASE}/join/{chain['slot'].id}", headers=auth(waiter.phone))
    assert second.status_code == 400
    assert "already in the waitlist" in second.text


def test_queue_positions_and_leave_repacks(client, seed):
    owner, chain = _make_booked(client, seed, "09191000007")
    slot_id = chain["slot"].id
    w1, w2, w3 = (seed["user"](f"091910000{8 + i}") for i in range(3))
    for w in (w1, w2, w3):
        r = client.post(f"{BASE}/join/{slot_id}", headers=auth(w.phone))
        assert r.status_code == 201, r.text
    assert [row[2] for row in _rows(slot_id, active_only=True)] == [1, 2, 3]

    left = client.post(f"{BASE}/leave/{slot_id}", headers=auth(w1.phone))
    assert left.status_code == 200, left.text
    active = _rows(slot_id, active_only=True)
    assert [row[2] for row in active] == [1, 2]
    assert {row[1] for row in active} == {w2.id, w3.id}
    # ردیف خروج باقی می‌ماند و فقط cancelled می‌شود (تاریخچه)
    cancelled = [row for row in _rows(slot_id) if row[3] == "cancelled"]
    assert [row[1] for row in cancelled] == [w1.id]
    # فقط مدیر سالن (صاحب رزرو) صف را می‌بیند
    as_stranger = client.get(f"{BASE}/slot/{slot_id}", headers=auth(w2.phone))
    assert as_stranger.status_code == 403
    queue = client.get(f"{BASE}/slot/{slot_id}", headers=auth(owner.phone))
    assert queue.status_code == 200, queue.text
    body = queue.json()
    assert body["total_waiting"] == 2
    assert [e["position"] for e in body["entries"]] == [1, 2]


def test_my_waitlist_uses_joined_relations(client, seed):
    """/waitlist/my رابطه‌های slot→venue را joinedload می‌کند (قبلاً ImportError می‌داد)."""
    owner, chain = _make_booked(client, seed, "09191000020")
    w = seed["user"]("09191000021")
    j = client.post(f"{BASE}/join/{chain['slot'].id}", headers=auth(w.phone))
    assert j.status_code == 201, j.text
    r = client.get(f"{BASE}/my", headers=auth(w.phone))
    assert r.status_code == 200, r.text
    items = r.json()["items"]
    assert len(items) == 1
    assert items[0]["status"] == "pending"
    assert items[0]["venue_name"] == "سالن تست"
    assert items[0]["slot_date"] == "2026-09-10"


# ─────────────────────────── B5: تبدیل خودکار بعد از پنجره ───────────────────────────

def _mark_notified(entry_id: int, hours_ago: float = 0.1):
    """شبیه‌سازی «اعلان شده و مهلتش تمام شده» (همان وضعیت پس از ۲ ساعت سکوت)."""
    with Session(test_engine) as s:
        e = s.get(WaitlistEntry, entry_id)
        e.status = "notified"
        e.expires_at = datetime.now(timezone.utc) - timedelta(hours=hours_ago)
        s.add(e)
        s.commit()


def _free_slot(slot_id: int):
    """صاحب سانس لغو کرده و سانس به صف برمی‌گردد.

    دقیقاً همان کاری که cancel_booking می‌کند (رزرو فعال → cancelled، سانس → available)؛
    تاریخ به فردا منتقل می‌شود چون seed یک سانس گذشته‌کار (۲۰۲۶-۰۹-۱۰) می‌سازد و
    موتور قیمت رزرو گذشته را رد می‌کند.
    """
    from datetime import date, timedelta as _td

    from app.models.booking import Booking, BookingStatus
    with Session(test_engine) as s:
        for b in s.exec(select(Booking).where(Booking.slot_id == slot_id,
                                              Booking.status == BookingStatus.CONFIRMED)).all():
            b.status = BookingStatus.CANCELLED
            s.add(b)
        slot = s.get(Slot, slot_id)
        slot.status = SlotStatus.AVAILABLE
        slot.slot_date = date.today() + _td(days=2)
        s.add(slot)
        s.commit()


def _run_convert(now=None):
    from app.services.waitlist_service import WaitlistService
    from app.unit_of_work import UnitOfWork
    with UnitOfWork() as uow:
        result, notifications = WaitlistService.convert_expired(uow, now=now)
        uow.commit()
    return result, notifications


def test_convert_books_head_of_queue_after_window(client, seed, sent_notifications):
    owner, chain = _make_booked(client, seed, "09191000030")
    slot_id = chain["slot"].id
    w1, w2 = seed["user"]("09191000031"), seed["user"]("09191000032")
    for w in (w1, w2):
        assert client.post(f"{BASE}/join/{slot_id}", headers=auth(w.phone)).status_code == 201
    first_id = _rows(slot_id, active_only=True)[0][0]
    _free_slot(slot_id)
    _mark_notified(first_id)

    result, notes = _run_convert()
    reasons = [n["data"].get("reason") for n in notes]
    assert result == {"candidates": 1, "booked": 1, "expired": 0}, (result, reasons)
    rows = _rows(slot_id)
    assert {r[0]: r[3] for r in rows}[first_id] == "booked"
    # نفر دوم هنوز در صف است — نوبتش نشده
    still = [r for r in _rows(slot_id, active_only=True) if r[0] != first_id]
    assert len(still) == 1 and still[0][3] == "pending"
    # سانس دوباره hold شد تا کسی هم‌زمان نگیرد
    with Session(test_engine) as s:
        assert s.get(Slot, slot_id).status == SlotStatus.BOOKED
    assert [n["notif_type"] for n in notes] == ["waitlist_auto_booked"]
    assert notes[0]["user_id"] == w1.id
    assert notes[0]["data"]["slot_id"] == slot_id


def test_convert_waits_for_window_and_is_idempotent(client, seed):
    owner, chain = _make_booked(client, seed, "09191000033")
    slot_id = chain["slot"].id
    w = seed["user"]("09191000034")
    assert client.post(f"{BASE}/join/{slot_id}", headers=auth(w.phone)).status_code == 201
    entry_id = _rows(slot_id, active_only=True)[0][0]
    _free_slot(slot_id)
    _mark_notified(entry_id, hours_ago=-3)  # هنوز ۳ ساعت به پایان مهلت مانده

    assert _run_convert()[0]["candidates"] == 0
    _mark_notified(entry_id)
    assert _run_convert()[0]["booked"] == 1
    # اجرای دوم هیچی پیدا نمی‌کند (وضعیت booked از کاندیدها بیرون می‌اندازدش)
    assert _run_convert()[0] == {"candidates": 0, "booked": 0, "expired": 0}


def test_convert_expires_entry_when_slot_already_taken(client, seed):
    owner, chain = _make_booked(client, seed, "09191000036")
    slot_id = chain["slot"].id
    w = seed["user"]("09191000037")
    assert client.post(f"{BASE}/join/{slot_id}", headers=auth(w.phone)).status_code == 201
    entry_id = _rows(slot_id, active_only=True)[0][0]
    _free_slot(slot_id)
    # سانس توسط کاربر دیگری رزرو قطعی شده، ولی slot هم AVAILABLE مانده (سناریوی رقابت)
    stranger = seed["user"]("09191000038")
    with Session(test_engine) as s:
        from app.models.booking import Booking, BookingStatus
        s.add(Booking(slot_id=slot_id, user_id=stranger.id, status=BookingStatus.CONFIRMED,
                      payment_amount=100_000))
        s.commit()
    _mark_notified(entry_id)

    result, notes = _run_convert()
    assert result == {"candidates": 1, "booked": 0, "expired": 1}, (result, [n["data"].get("reason") for n in notes])
    assert {r[0]: r[3] for r in _rows(slot_id)}[entry_id] == "expired"
    assert notes[0]["notif_type"] == "waitlist_expired"


def test_concurrent_workers_convert_head_once(client, seed):
    """دو worker هم‌زمان روی یک ردیف: قفل ردیف ⇒ دقیقاً یک رزرو معلق."""
    import threading

    owner, chain = _make_booked(client, seed, "09191000040")
    slot_id = chain["slot"].id
    w = seed["user"]("09191000041")
    assert client.post(f"{BASE}/join/{slot_id}", headers=auth(w.phone)).status_code == 201
    entry_id = _rows(slot_id, active_only=True)[0][0]
    _free_slot(slot_id)
    _mark_notified(entry_id)

    barrier = threading.Barrier(2, timeout=30)
    out = []

    def _worker():
        from app.services.waitlist_service import WaitlistService
        from app.unit_of_work import UnitOfWork
        barrier.wait()
        with UnitOfWork() as uow:
            res, _ = WaitlistService.convert_expired(uow)
            uow.commit()
            out.append(res)

    ts = [threading.Thread(target=_worker) for _ in range(2)]
    for t in ts:
        t.start()
    for t in ts:
        t.join(timeout=90)

    assert len(out) == 2, out
    assert sum(r["booked"] for r in out) == 1, out
    assert {r[0]: r[3] for r in _rows(slot_id)}[entry_id] == "booked"


def test_celery_task_runs_conversion(client, seed):
    owner, chain = _make_booked(client, seed, "09191000042")
    slot_id = chain["slot"].id
    w = seed["user"]("09191000043")
    assert client.post(f"{BASE}/join/{slot_id}", headers=auth(w.phone)).status_code == 201
    entry_id = _rows(slot_id, active_only=True)[0][0]
    _free_slot(slot_id)
    _mark_notified(entry_id)

    from app.tasks.waitlist_tasks import convert_expired_waitlist_entries
    result = convert_expired_waitlist_entries()
    assert result["booked"] == 1
    assert result["notified"] == 1
    assert {r[0]: r[3] for r in _rows(slot_id)}[entry_id] == "booked"


def test_convert_job_registered_in_beat_schedule():
    from app.tasks.worker import celery_app
    schedule = celery_app.conf.beat_schedule or {}
    assert "convert-expired-waitlist-entries" in schedule
    assert schedule["convert-expired-waitlist-entries"]["task"] == "app.tasks.convert_expired_waitlist"
