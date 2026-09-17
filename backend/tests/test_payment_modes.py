# backend/tests/test_payment_modes.py
"""تست روش‌های پرداخت سالن — فیش واریزی (ارسال/تأیید/رد)، پرداخت در محل، آپلود و بازگشت وجه."""
import base64
from datetime import date, time as dtime

from sqlmodel import select

from app.models.booking import Booking, BookingStatus, ReceiptStatus
from app.models.slot import Slot, SlotStatus
from app.models.transaction import (
    FinancialTransaction,
    TransactionDirection,
    TransactionMethod,
    TransactionType,
)
from app.models.user import UserRole
from app.models.venue import VenuePaymentMode
from app.services.storage_service import storage_service
from helpers import auth

B = "/api/v1/bookings"
V = "/api/v1/venues"
PRICE = 500_000

# PNG یک‌پیکسلی برای تست آپلود
PNG_1PX = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ"
    "AAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
)


def _venue_payload(name="سالن آزمون", mode=None):
    payload = {
        "name": name,
        "category": "futsal",
        "address": "آدرس تست",
        "latitude": 35.7,
        "longitude": 51.4,
        "phone": "09123456789",
    }
    if mode is not None:
        payload["payment_mode"] = mode
    return payload


def _create_venue(client, manager, mode=None):
    r = client.post(f"{V}/", json=_venue_payload(mode=mode), headers=auth(manager.phone))
    assert r.status_code == 200, r.text
    return r.json()


def _make_booking(db, owner, venue_id, mode, price=PRICE):
    """سانس BOOKED + رزروی CONFIRMED با اسنپ‌شوت روش پرداخت (نمونه‌ی seed)."""
    slot = Slot(
        venue_id=venue_id, slot_date=date(2026, 9, 10), start_time=dtime(18, 0),
        duration=90, base_price=price, current_price=price, status=SlotStatus.BOOKED,
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)
    booking = Booking(
        slot_id=slot.id, user_id=owner.id, status=BookingStatus.CONFIRMED,
        payment_amount=price, payment_mode=mode,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    db.refresh(slot)
    db.close()  # آزادکردن write-lock (BEGIN IMMEDIATE)
    return booking


def _tx(db, key):
    tx = db.exec(select(FinancialTransaction).where(
        FinancialTransaction.idempotency_key == key)).first()
    db.commit()  # آزادکردن قفل BEGIN IMMEDIATE قبل از درخواست‌های HTTP
    return tx


def _booking_detail(client, user, booking_id):
    r = client.get(f"{B}/{booking_id}", headers=auth(user.phone))
    assert r.status_code == 200, r.text
    return r.json()


def _receipt_body(amount=PRICE):
    return {"amount": amount, "image_url": "http://files.example/receipt.png",
            "reference_number": "REF-12345", "bank_name": "بانک ملی"}


# ─────────────────────────── روش پیش‌فرض سالن ───────────────────────────

def test_venue_default_payment_mode_is_bank_receipt(client, seed, db):
    manager = seed["user"]("09320000001", full_name="مدیر", role=UserRole.VENUE_MANAGER)

    created = _create_venue(client, manager)  # بدون payment_mode
    assert created["payment_mode"] == "bank_receipt"
    vid = created["id"]

    detail = client.get(f"{V}/{vid}")
    assert detail.status_code == 200
    assert detail.json()["payment_mode"] == "bank_receipt"

    updated = client.put(f"{V}/{vid}", json=_venue_payload(mode="gateway"),
                         headers=auth(manager.phone))
    assert updated.status_code == 200, updated.text
    assert updated.json()["payment_mode"] == "gateway"

    bad = client.put(f"{V}/{vid}", json=_venue_payload(mode="crypto"),
                     headers=auth(manager.phone))
    assert bad.status_code == 422


# ─────────────────────────── پرداخت در محل ───────────────────────────

def test_pay_in_place_booking_collect_in_person(client, seed, db, sent_notifications):
    manager = seed["user"]("09320000002", full_name="مدیر", role=UserRole.VENUE_MANAGER)
    venue = _create_venue(client, manager, mode="pay_in_place")
    assert venue["payment_mode"] == "pay_in_place"
    owner = seed["user"]("09321111111")
    booking = _make_booking(db, owner, venue["id"], VenuePaymentMode.PAY_IN_PLACE)

    r = client.post(f"{B}/{booking.id}/collect-in-person", json={},
                    headers=auth(manager.phone))
    assert r.status_code == 200, r.text
    assert r.json()["amount"] == PRICE

    tx = _tx(db, f"booking-inperson:{booking.id}")
    assert tx is not None
    assert tx.type == TransactionType.PAYMENT
    assert tx.direction == TransactionDirection.INCOME
    assert tx.status.value == "cleared"
    assert tx.amount == PRICE
    assert tx.venue_id == venue["id"]
    assert tx.source_id == booking.id
    assert tx.counterparty == owner.id

    # نشان پرداخت روی رزرو
    refreshed = db.exec(select(Booking).where(Booking.id == booking.id)).first()
    assert refreshed.payment_transaction_id == f"inplace-{booking.id}"
    assert refreshed.status == BookingStatus.CONFIRMED
    db.commit()  # آزادکردن قفل BEGIN IMMEDIATE

    assert any(n["type"] == "booking_paid_in_person" and n["user_id"] == owner.id
               for n in sent_notifications)


def test_collect_in_person_idempotent(client, seed, db):
    manager = seed["user"]("09320000003", full_name="مدیر", role=UserRole.VENUE_MANAGER)
    venue = _create_venue(client, manager, mode="pay_in_place")
    owner = seed["user"]("09331111111")
    booking = _make_booking(db, owner, venue["id"], VenuePaymentMode.PAY_IN_PLACE)
    key = f"booking-inperson:{booking.id}"

    first = client.post(f"{B}/{booking.id}/collect-in-person", json={},
                        headers=auth(manager.phone))
    assert first.status_code == 200, first.text

    # فراخوانی دوم: نگهبان «قبلا پرداخت شده» رد می‌کند و ردیف تکراری نمی‌سازد
    second = client.post(f"{B}/{booking.id}/collect-in-person", json={},
                         headers=auth(manager.phone))
    assert second.status_code == 400

    rows = db.exec(select(FinancialTransaction).where(
        FinancialTransaction.idempotency_key == key)).all()
    db.commit()  # آزادکردن قفل BEGIN IMMEDIATE
    assert len(rows) == 1


def test_collect_in_person_wrong_mode_400(client, seed, db):
    manager = seed["user"]("09320000004", full_name="مدیر", role=UserRole.VENUE_MANAGER)
    venue = _create_venue(client, manager, mode="gateway")
    assert venue["payment_mode"] == "gateway"
    owner = seed["user"]("09341111111")
    booking = _make_booking(db, owner, venue["id"], VenuePaymentMode.GATEWAY)

    r = client.post(f"{B}/{booking.id}/collect-in-person", json={},
                    headers=auth(manager.phone))
    assert r.status_code == 400
    assert _tx(db, f"booking-inperson:{booking.id}") is None


# ─────────────────────────── فیش واریزی: ارسال + تأیید ───────────────────────────

def test_bank_receipt_flow_submit_approve(client, seed, db, sent_notifications):
    manager = seed["user"]("09320000005", full_name="مدیر", role=UserRole.VENUE_MANAGER)
    venue = _create_venue(client, manager)  # پیش‌فرض bank_receipt
    owner = seed["user"]("09351111111")
    booking = _make_booking(db, owner, venue["id"], VenuePaymentMode.BANK_RECEIPT)

    sub = client.post(f"{B}/{booking.id}/receipt", json=_receipt_body(),
                      headers=auth(owner.phone))
    assert sub.status_code == 201, sub.text
    assert sub.json()["receipt_status"] == "submitted"

    detail = _booking_detail(client, owner, booking.id)
    assert detail["receipt_status"] == "submitted"
    assert detail["receipt_reference"] == "REF-12345"

    assert any(n["type"] == "booking_receipt_submitted" and n["user_id"] == manager.id
               for n in sent_notifications)

    ap = client.post(f"{B}/{booking.id}/receipt/approve", headers=auth(manager.phone))
    assert ap.status_code == 200, ap.text
    assert ap.json()["receipt_status"] == "approved"

    # ردیف درآمد در دفتر کل با کلید idempotency فیش
    tx = _tx(db, f"booking-receipt:{booking.id}")
    assert tx is not None
    assert tx.type == TransactionType.PAYMENT
    assert tx.direction == TransactionDirection.INCOME
    assert tx.amount == PRICE
    assert tx.counterparty == owner.id
    db.commit()  # آزادکردن قفل BEGIN IMMEDIATE قبل از درخواست HTTP بعدی

    detail2 = _booking_detail(client, owner, booking.id)
    assert detail2["receipt_status"] == "approved"
    assert detail2["status"] == "confirmed"

    assert any(n["type"] == "booking_receipt_approved" and n["user_id"] == owner.id
               for n in sent_notifications)


# ─────────────────────────── فیش واریزی: رد + ارسال مجدد ───────────────────────────



def test_receipt_reject_requires_reason(client, seed, db):
    manager = seed["user"]("09320000006", full_name="مدیر", role=UserRole.VENUE_MANAGER)
    venue = _create_venue(client, manager)
    owner = seed["user"]("09361111111")
    booking = _make_booking(db, owner, venue["id"], VenuePaymentMode.BANK_RECEIPT)

    sub = client.post(f"{B}/{booking.id}/receipt", json=_receipt_body(),
                      headers=auth(owner.phone))
    assert sub.status_code == 201, sub.text

    # دلیل کوتاه → خطای اعتبارسنجی pydantic (min_length=4)
    short = client.post(f"{B}/{booking.id}/receipt/reject", json={"reason": "نه"},
                        headers=auth(manager.phone))
    assert short.status_code == 422

    proper = client.post(f"{B}/{booking.id}/receipt/reject",
                         json={"reason": "مبلغ فیش با مبلغ رزرو نمی‌خواند"},
                         headers=auth(manager.phone))
    assert proper.status_code == 200, proper.text
    assert proper.json()["receipt_status"] == "rejected"

    detail = _booking_detail(client, owner, booking.id)
    assert detail["receipt_status"] == "rejected"
    # رزرو پرداخت/تأیید مالی نشده است — همچنان قابل لغو/دوباره‌ارسال
    assert detail["status"] in ("pending", "confirmed")
    assert _tx(db, f"booking-receipt:{booking.id}") is None

    resub = client.post(f"{B}/{booking.id}/receipt", json=_receipt_body(),
                        headers=auth(owner.phone))
    assert resub.status_code == 201, resub.text
    assert resub.json()["receipt_status"] == "submitted"


# ─────────────────────────── دسترسی ───────────────────────────

def test_receipt_submit_owner_only_403(client, seed, db):
    manager = seed["user"]("09320000007", full_name="مدیر", role=UserRole.VENUE_MANAGER)
    venue = _create_venue(client, manager)
    owner = seed["user"]("09371111111")
    booking = _make_booking(db, owner, venue["id"], VenuePaymentMode.BANK_RECEIPT)
    stranger = seed["user"]("09372222222")

    r = client.post(f"{B}/{booking.id}/receipt", json=_receipt_body(),
                    headers=auth(stranger.phone))
    assert r.status_code == 403

    detail = _booking_detail(client, owner, booking.id)
    assert detail["receipt_status"] == "none"


def test_receipt_approve_requires_permission(client, seed, db):
    manager = seed["user"]("09320000008", full_name="مدیر", role=UserRole.VENUE_MANAGER)
    venue = _create_venue(client, manager)
    owner = seed["user"]("09381111111")
    booking = _make_booking(db, owner, venue["id"], VenuePaymentMode.BANK_RECEIPT)

    sub = client.post(f"{B}/{booking.id}/receipt", json=_receipt_body(),
                      headers=auth(owner.phone))
    assert sub.status_code == 201, sub.text

    # کاربر عادی بدون انتصاب کارکنی ⇒ انکار ensure_venue_permission
    plain = seed["user"]("09382222222")
    r1 = client.post(f"{B}/{booking.id}/receipt/approve", headers=auth(plain.phone))
    assert r1.status_code == 403

    # مدیرِ سالن دیگر ⇒ ۴۰۳
    manager2 = seed["user"]("09383333333", full_name="مدیر دوم",
                            role=UserRole.VENUE_MANAGER)
    _create_venue(client, manager2)
    r2 = client.post(f"{B}/{booking.id}/receipt/approve", headers=auth(manager2.phone))
    assert r2.status_code == 403

    # پس از انکارها ردیفی در دفتر کل ثبت نشده
    assert _tx(db, f"booking-receipt:{booking.id}") is None


# ─────────────────────────── آپلود فیش ───────────────────────────

def test_upload_receipt_user_scoped(client, seed, db, monkeypatch):
    user = seed["user"]("09384444444")  # هر کاربر احراز‌شده
    calls = []

    def fake_upload_bytes(data, filename="receipt.png", prefix="venues/"):
        calls.append({"data": data, "filename": filename, "prefix": prefix})
        return f"http://minio.test/bookings/{prefix}{filename}"

    monkeypatch.setattr(storage_service, "upload_bytes", fake_upload_bytes)

    r = client.post("/api/v1/upload/receipt",
                    files={"file": ("fich.png", PNG_1PX, "image/png")},
                    headers=auth(user.phone))
    assert r.status_code == 200, r.text
    assert "url" in r.json()
    assert r.json()["url"].endswith("receipts/fich.png")
    assert calls and calls[0]["prefix"] == "receipts/"
    assert calls[0]["data"] == PNG_1PX


# ─────────────────────────── لغو رزرب پرداخت‌شده → بازگشت وجه ───────────────────────────

def test_cancel_receipt_paid_booking_refunds_ledger(client, seed, db):
    manager = seed["user"]("09320000010", full_name="مدیر", role=UserRole.VENUE_MANAGER)
    venue = _create_venue(client, manager)
    owner = seed["user"]("09391111111")
    booking = _make_booking(db, owner, venue["id"], VenuePaymentMode.BANK_RECEIPT)

    sub = client.post(f"{B}/{booking.id}/receipt", json=_receipt_body(),
                      headers=auth(owner.phone))
    assert sub.status_code == 201, sub.text
    ap = client.post(f"{B}/{booking.id}/receipt/approve", headers=auth(manager.phone))
    assert ap.status_code == 200, ap.text
    income = _tx(db, f"booking-receipt:{booking.id}")
    assert income is not None

    r = client.delete(f"{B}/{booking.id}", headers=auth(owner.phone))
    assert r.status_code == 200, r.text

    # ردیف بازگشت وجه متناظر با ردیف درآمد تأییدشده (اصل دست‌نخورده)
    refund = _tx(db, f"booking-refund:{income.id}")
    assert refund is not None
    assert refund.type == TransactionType.REFUND
    assert refund.direction == TransactionDirection.EXPENSE
    assert refund.status.value == "cleared"
    assert refund.amount == PRICE
    assert refund.source_id == income.id  # original_source_id → ردیف درآمد فیش
    assert refund.venue_id == venue["id"]

    assert _tx(db, f"booking-receipt:{booking.id}") is not None
    detail = _booking_detail(client, owner, booking.id)
    assert detail["status"] == "cancelled"
