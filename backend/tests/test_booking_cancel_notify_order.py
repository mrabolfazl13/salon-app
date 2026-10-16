# backend/tests/test_booking_cancel_notify_order.py
"""ترتیب دیسپچِ اعلانِ صف انتظار در مسیر لغو (بازبینی #4).

قانون: `notify_waitlist_on_cancellation` سشن **خودش** را باز می‌کند (`Session(engine)`
داخل تسک)، پس تا لغو committed نشده نباید اجرا شود. پیش از این رفع، `.delay()` در
`DELETE /api/v1/bookings/{id}` بالا‌تر از `uow.commit()` نشسته بود ⇒ تسک سانس را
هنوز `booked` و رزرو را هنوز `confirmed` می‌دید و پنجرهٔ پاسخ‌گویی را برای
سانسِ‌هنوز-اشغال‌شده می‌سوزاند.
"""
from types import SimpleNamespace

from sqlmodel import Session, select

from conftest import test_engine
from helpers import auth
from app.models.slot import Slot, SlotStatus
from app.models.booking import BookingStatus
from app.models.waitlist import WaitlistEntry


def _snapshot_at_dispatch(booking_id: int, log: list):
    """جای‌نمای تسک celery: در لحظهٔ `.delay()` وضعیتِ **committed** را می‌خواند.

    از SQLAlchemy عمداً استفاده نشد: `test_engine` برای هر تراکنش `BEGIN IMMEDIATE`
    می‌فرستد (conftest.py:104)، پس یک سشنِ خواندنی هم قفلِ نوشتن می‌گیرد و اگر
    request هنوز commit نکرده باشد به‌جای «دادهٔ قدیمی» با `database is locked`
    می‌ترکد. خواندنِ خامِ WAL دقیقاً همان چیزی را می‌بیند که تسکِ واقعی در worker
    می‌بیند: فقط ردیف‌های committed.
    """
    import sqlite3

    db_path = test_engine.url.database

    def _delay(slot_id: int):
        conn = sqlite3.connect(db_path)
        try:
            slot = conn.execute("select status from slots where id = ?", (slot_id,)).fetchone()
            bk = conn.execute("select status from bookings where id = ?", (booking_id,)).fetchone()
        finally:
            conn.close()
        log.append({"slot_status": slot[0], "booking_status": bk[0]})

    return SimpleNamespace(delay=_delay)


def test_waitlist_task_runs_after_the_cancellation_is_committed(client, seed, monkeypatch):
    owner = seed["user"]("09370000001")
    chain = seed["booking"](owner)
    bid = chain["booking"].id

    import app.tasks.reminder_tasks as rt

    log: list = []
    monkeypatch.setattr(rt, "notify_waitlist_on_cancellation",
                        _snapshot_at_dispatch(bid, log))

    r = client.delete(f"/api/v1/bookings/{bid}", headers=auth(owner.phone))
    assert r.status_code == 200, r.text

    # تسک دقیقاً یک بار و بعد از commit اجرا شده باشد
    assert len(log) == 1, f"تسک {len(log)} بار صدا زده شد"
    # ستون Enum در دیتابیس **نام** عضو را ذخیره می‌کند (AVAILABLE)، نه مقدارش
    assert log[0]["slot_status"] == SlotStatus.AVAILABLE.name, (
        "سانس در لحظهٔ دیسپچ هنوز آزاد نشده بود: " + str(log[0]))
    assert log[0]["booking_status"] == BookingStatus.CANCELLED.name


def test_cancel_notifies_the_waitlist_head_through_the_real_task(client, seed, monkeypatch):
    """بدنۀ واقعیِ تسک (celery در تست eager است) باید ردیف صف را notified کند.

    تنها چیزی که mock می‌شود **ارسالِ اعلان** است (FCM/WebSocket — از این ماشین در
    دسترس نیست)؛ کوئری صف، نوشتن وضعیت و commitِ سشنِ خودِ تسک واقعی‌اند. پس این
    تست می‌گوید: تسک در لحظه‌ای اجرا می‌شود که می‌تواند بنویسد، نه داخل تراکنشِ بازِ
    request. (یادآور: `_send_waitlist_notification_sync` داخل event loop نمی‌تواند
    `run_until_complete` کند — با `task_eager_propagates=False` خطا بلعیده می‌شد و
    صفِ انتظار بی‌خبر می‌ماند.)
    """
    owner = seed["user"]("09370000002")
    chain = seed["booking"](owner)
    waiter = seed["user"]("09370000003")

    sent: list = []
    import app.tasks.reminder_tasks as rt

    monkeypatch.setattr(rt, "_send_waitlist_notification_sync",
                        lambda **kw: sent.append(kw))

    join = client.post(f"/api/v1/waitlist/join/{chain['slot'].id}", headers=auth(waiter.phone))
    assert join.status_code == 201, join.text

    r = client.delete(f"/api/v1/bookings/{chain['booking'].id}", headers=auth(owner.phone))
    assert r.status_code == 200, r.text

    assert len(sent) == 1, "اعلانِ آزادشدنِ سانس ارسال نشد"
    assert sent[0]["user_id"] == waiter.id
    assert "آزاد شد" in sent[0]["title"]

    with Session(test_engine) as s:
        assert s.get(Slot, chain["slot"].id).status == SlotStatus.AVAILABLE
        entry = s.exec(select(WaitlistEntry)
                       .where(WaitlistEntry.slot_id == chain["slot"].id)).first()
        assert entry is not None
        assert entry.status == "notified", f"سرِ صف خبر نشد: {entry.status}"
        assert entry.expires_at is not None
