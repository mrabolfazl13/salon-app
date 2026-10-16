# backend/tests/test_reconciliation_reports.py
"""مغایرگیری دفتر کل ↔ درگاه — C14 (راند ۱۷).

سه نقصِ همین‌جا قفل می‌شوند:

۱) جدول گزارش هیچ‌وقت ساخته نشده بود ⇒ `GET /reconciliation/reports` با
   `except ImportError` همیشه «صفر مورد» برمی‌گرداند (همان «همه‌چیز درست است» کاذب).
۲) مقایسه با کلیدِ اشتباه: ردیفِ دفتر کل با `source_id = payment.id` نوشته می‌شود
   ولی کارِ قبلی آن را با `payment.booking_id` می‌گرفت ⇒ هر پرداختِ سالم مغایرت
   می‌خورد و برخوردِ عددیِ idِ دو جدول، دو رکوردِ بی‌ربط را با هم مقایسه می‌کرد.
۳) فیلترِ بدون `direction`/`type`، ردیفِ بازگشت وجه را هم «درآمد» می‌شمرد ⇒
   هر رزروِ بازگشت‌وجه‌دار مغایرتِ جعلی می‌ساخت.
"""
from datetime import date, datetime, time as dtime, timezone

import pytest
from sqlmodel import Session, select

from app.models.booking import Booking, BookingStatus
from app.models.payment import BookingPayment, BookingPaymentStatus
from app.models.reconciliation_report import ReconciliationReport, ReconciliationStatus
from app.models.slot import Slot, SlotStatus
from app.models.transaction import (
    FinancialTransaction, TransactionDirection, TransactionSourceType,
    TransactionType,
)
from app.models.user import User, UserRole
from app.models.venue import Venue
from app.services.reconciliation_service import ReconciliationService
from app.unit_of_work import UnitOfWork
from helpers import auth

from conftest import test_engine

DAY = date(2026, 10, 10)
PAID_AT = datetime(2026, 10, 10, 10, 0, tzinfo=timezone.utc)


def _fresh():
    return Session(test_engine)


def _user(phone, role=UserRole.USER):
    with _fresh() as s:
        u = User(phone=phone, full_name="مغایر", hashed_password="x",
                 role=role, is_verified=True)
        s.add(u)
        s.commit()
        return u.id, u.phone


@pytest.fixture()
def world():
    """یک سالن + دو رزروِ تأییدشده؛ idها برای ساخت پرداخت/ردیف دفتر کل برگردانده می‌شوند."""
    mgr_id, mgr_phone = _user("09120000001", UserRole.VENUE_MANAGER)
    admin_id, admin_phone = _user("09120000002", UserRole.SUPER_ADMIN)
    with _fresh() as s:
        venue = Venue(name="سالن مغایرت", address="آ", latitude=35.7, longitude=51.4,
                      phone="0912", manager_id=mgr_id)
        s.add(venue)
        s.commit()
        s.refresh(venue)
        vid = venue.id

    def _booking(price=200000, tag="a"):
        with _fresh() as s:
            slot = Slot(venue_id=vid, slot_date=date(2026, 10, 12),
                        start_time=dtime(18, 0), duration=90, base_price=price,
                        current_price=price, status=SlotStatus.BOOKED)
            s.add(slot)
            s.commit()
            s.refresh(slot)
            booking = Booking(slot_id=slot.id, user_id=mgr_id,
                              status=BookingStatus.CONFIRMED, payment_amount=price,
                              note=tag)
            s.add(booking)
            s.commit()
            return booking.id

    def _pay(booking_id, amount=200000, status=BookingPaymentStatus.PAID, paid_at=PAID_AT):
        with _fresh() as s:
            p = BookingPayment(booking_id=booking_id, user_id=mgr_id, amount=amount,
                               status=status, gateway="mock", paid_at=paid_at)
            s.add(p)
            s.commit()
            s.refresh(p)
            return p.id

    def _ledger(source_id, amount=200000, *, direction=TransactionDirection.INCOME,
                tx_type=TransactionType.PAYMENT, venue_id=vid):
        """ردیف دفتر کل دقیقاً با همان برچسبِ مسیرِ واقعی: (booking_payment, payment.id)."""
        with _fresh() as s:
            tx = FinancialTransaction(
                type=tx_type, direction=direction, amount=amount, venue_id=venue_id,
                source_type=TransactionSourceType.BOOKING_PAYMENT, source_id=source_id,
                description=f"پرداخت رزرو #{source_id}",
                occurred_at=PAID_AT)
            s.add(tx)
            s.commit()
            s.refresh(tx)
            return tx.id

    return {"venue_id": vid, "manager": (mgr_id, mgr_phone), "admin": (admin_id, admin_phone),
            "booking": _booking, "pay": _pay, "ledger": _ledger}


def _compare(**kw):
    with UnitOfWork() as uow:
        return ReconciliationService.compare(uow, period_from=DAY, period_to=DAY)


def _types(report):
    return sorted(m["type"] for m in report["mismatches"])


# ─────────────────── ۲) کلیدِ مقایسه ───────────────────

def test_consistent_payment_is_clean(world):
    bk = world["booking"]()
    pid = world["pay"](bk, 200000)
    world["ledger"](pid, 200000)

    report = _compare()
    assert report["payments_checked"] == 1
    assert report["mismatch_count"] == 0, report["mismatches"]


def test_paid_payment_without_ledger_row_is_flagged(world):
    bk = world["booking"]()
    pid = world["pay"](bk, 200000)

    report = _compare()
    assert _types(report) == ["payment_without_ledger"]
    assert report["mismatches"][0]["payment_id"] == pid
    assert report["mismatches"][0]["ledger_amount"] == 0


def test_amount_mismatch_is_reported_with_difference(world):
    bk = world["booking"]()
    pid = world["pay"](bk, 200000)
    world["ledger"](pid, 220000)  # دفتر کل ۲۰٬۰۰۰ ریال بیشتر از درگاه

    report = _compare()
    assert _types(report) == ["amount_mismatch"]
    m = report["mismatches"][0]
    assert (m["payment_id"], m["gateway_amount"], m["ledger_amount"], m["difference"]) \
        == (pid, 200000, 220000, 20000)
    # پول در این ریپو ریال است؛ پیامِ قبلی «تومان» می‌گفت (واحدِ غلط در متنِ مالی)
    assert "ریال" in m["message"] and "تومان" not in m["message"]


def test_booking_id_collison_does_not_compare_unrelated_rows(world):
    """با کلیدِ booking‌محور، `payment.id == booking.id` رکوردهای بی‌ربط را به هم می‌دوخت.

    اینجا دو رزرو و دو پرداخت ساخته می‌شود؛ فقط پرداختِ دوم ردیفِ دفتر کل دارد.
    مقایسهٔ درست ⇒ دقیقاً یک مغایرت و همان هم دربارهٔ پرداختِ اول است.
    """
    bk_paid = world["booking"](price=300000)
    pid_ok = world["pay"](bk_paid, 300000)
    world["ledger"](pid_ok, 300000)

    bk_missing = world["booking"](price=150000)
    pid_bad = world["pay"](bk_missing, 150000)

    report = _compare()
    assert _types(report) == ["payment_without_ledger"]
    assert [m["payment_id"] for m in report["mismatches"]] == [pid_bad]
    assert report["mismatches"][0]["booking_id"] == bk_missing


def test_split_payment_each_share_checked_separately(world):
    """پرداخت چندسهمی: سه `BookingPayment` روی یک رزرو — هیچ‌کس گم نمی‌شود."""
    bk = world["booking"](price=300000)
    p1 = world["pay"](bk, 100000)
    p2 = world["pay"](bk, 100000)
    p3 = world["pay"](bk, 100000)
    world["ledger"](p1, 100000)
    world["ledger"](p2, 100000)
    # سهم سوم ردیف ندارد

    report = _compare()
    assert report["payments_checked"] == 3
    assert _types(report) == ["payment_without_ledger"]
    assert [m["payment_id"] for m in report["mismatches"]] == [p3]


# ─────────────────── ۳) برگشتِ وجه به‌عنوان درآمد ───────────────────

def test_refunded_payment_with_refund_row_is_clean(world):
    bk = world["booking"]()
    pid = world["pay"](bk, 200000, status=BookingPaymentStatus.REFUNDED)
    world["ledger"](pid, 200000)
    world["ledger"](pid, 200000, direction=TransactionDirection.EXPENSE,
                    tx_type=TransactionType.REFUND)

    report = _compare()
    assert report["mismatch_count"] == 0, report["mismatches"]


def test_refunded_payment_without_refund_ledger_row_is_flagged(world):
    bk = world["booking"]()
    pid = world["pay"](bk, 200000, status=BookingPaymentStatus.REFUNDED)
    world["ledger"](pid, 200000)  # برگشت در دفتر کل نیست

    report = _compare()
    assert _types(report) == ["refund_without_ledger"]
    assert report["mismatches"][0]["difference"] == 200000


def test_ledger_refund_while_payment_still_paid_is_flagged(world):
    bk = world["booking"]()
    pid = world["pay"](bk, 200000)  # status = paid
    world["ledger"](pid, 200000)
    world["ledger"](pid, 200000, direction=TransactionDirection.EXPENSE,
                    tx_type=TransactionType.REFUND)

    report = _compare()
    assert _types(report) == ["refunded_while_paid"]


def test_ledger_income_for_unpaid_payment_is_flagged(world):
    bk = world["booking"]()
    pid = world["pay"](bk, 200000, status=BookingPaymentStatus.FAILED,
                       paid_at=PAID_AT)
    world["ledger"](pid, 200000)  # درآمد ثبت شده، ولی پرداخت شکست خورده است

    report = _compare()
    assert _types(report) == ["ledger_without_paid_payment"]
    m = report["mismatches"][0]
    assert m["payment_id"] == pid and m["payment_status"] == "failed"


# ─────────────────── ۱) ماندگاری و خواندن ───────────────────

def test_run_writes_a_row_and_rerun_updates_it(world):
    bk = world["booking"]()
    pid = world["pay"](bk, 200000)  # بدون ردیف دفتر کل ⇒ یک مغایرت

    with UnitOfWork() as uow:
        ReconciliationService.run(uow, period_from=DAY, period_to=DAY)
        uow.commit()
    with _fresh() as s:
        rows = s.exec(select(ReconciliationReport)).all()
        assert len(rows) == 1
        assert rows[0].mismatch_count == 1
        assert rows[0].status == ReconciliationStatus.ISSUES_FOUND
        first_id = rows[0].id

    # اجرای دوبادِ همان بازه ردیفِ دوم نمی‌سازد
    world["ledger"](pid, 200000)
    with UnitOfWork() as uow:
        ReconciliationService.run(uow, period_from=DAY, period_to=DAY)
        uow.commit()
    with _fresh() as s:
        rows = s.exec(select(ReconciliationReport)).all()
        assert len(rows) == 1 and rows[0].id == first_id
        assert rows[0].mismatch_count == 0
        assert rows[0].status == ReconciliationStatus.COMPLETED


def test_list_endpoint_is_super_admin_only_and_counts_really(client, world):
    _, mgr_phone = world["manager"]
    _, admin_phone = world["admin"]
    bk = world["booking"]()
    world["pay"](bk, 200000)
    with UnitOfWork() as uow:
        ReconciliationService.run(uow, period_from=DAY, period_to=DAY)
        uow.commit()

    denied = client.get("/api/v1/reconciliation/reports", headers=auth(mgr_phone))
    assert denied.status_code == 403

    ok = client.get("/api/v1/reconciliation/reports", headers=auth(admin_phone))
    assert ok.status_code == 200, ok.text
    body = ok.json()
    assert body["total"] == 1 and len(body["items"]) == 1
    item = body["items"][0]
    assert item["status"] == "issues_found"
    assert item["mismatch_count"] == 1
    assert item["period_from"] == "2026-10-10"


def test_detail_endpoint_returns_mismatches_and_404(client, world):
    _, admin_phone = world["admin"]
    bk = world["booking"]()
    pid = world["pay"](bk, 200000)
    with UnitOfWork() as uow:
        ReconciliationService.run(uow, period_from=DAY, period_to=DAY)
        uow.commit()
    with _fresh() as s:
        report_id = s.exec(select(ReconciliationReport)).first().id

    detail = client.get(f"/api/v1/reconciliation/reports/{report_id}",
                        headers=auth(admin_phone))
    assert detail.status_code == 200, detail.text
    assert [m["payment_id"] for m in detail.json()["mismatches"]] == [pid]

    missing = client.get("/api/v1/reconciliation/reports/999999",
                         headers=auth(admin_phone))
    assert missing.status_code == 404


def test_manual_run_endpoint_persists_a_report(client, world):
    """Celery در تست‌ها eager است ⇒ `/run` واقعاً کار را اجرا و ردیف می‌سازد."""
    _, admin_phone = world["admin"]
    _, mgr_phone = world["manager"]

    denied = client.post("/api/v1/reconciliation/run", headers=auth(mgr_phone))
    assert denied.status_code == 403

    started = client.post("/api/v1/reconciliation/run", headers=auth(admin_phone))
    assert started.status_code == 200, started.text
    assert started.json()["task_id"]

    with _fresh() as s:
        rows = s.exec(select(ReconciliationReport)).all()
    # بازۀ کارِ دستی = دیروزِ UTC؛ در تست «دیروز» ممکن است با DAY نخواند، پس
    # فقط می‌سنجیم که مسیرِ end-to-end یک ردیف نوشت (نه صفر).
    assert len(rows) >= 1
