# backend/tests/test_payment_booking_state_guard.py
"""پرداخت باید وضعیت *به‌روزِ* رزرو را ببیند، نه فقط وضعیت فاکتور (بازبینی #4).

فاکتور هنگام CONFIRMED بودن رزرو ساخته می‌شود، ولی بین ساخت فاکتور و پرداخت ممکن
است رزرو لغو (یا وجهش بازگشت) شود. `/pay` و webhook فقط `payment.status` را
می‌سنجیدند و بعد از گرفتن پول، `booking.status = CONFIRMED` می‌نوشتند — یعنی
رزروی که سانسش آزاد شده (و شاید فروخته شده) بود دوباره زنده می‌شد.
"""
from sqlmodel import Session

from app.models.booking import Booking, BookingStatus
from app.models.slot import Slot, SlotStatus
from app.models.user import UserRole
from helpers import auth

from conftest import test_engine

VALID_CARD = {"card_number": "6037991122334455", "cvv": "123"}
BASE = "/api/v1/finance"


def _fresh():
    return Session(test_engine)


def _manager_booking(seed, db, phone):
    """مدیر + سالن + سانسِ BOOKED + رزروِ CONFIRMED (همان زنجیرۀ واقعیِ مسیر)."""
    user = seed["user"](phone, role=UserRole.VENUE_MANAGER)
    chain = seed["booking"](user)
    db.close()
    return user, chain


def _invoice(client, h, booking_id):
    r = client.post("/api/v1/payments/", json={"booking_id": booking_id}, headers=h)
    assert r.status_code == 201, r.text
    return r.json()["id"]


def _rows(client, h):
    return client.get(f"{BASE}/transactions", headers=h).json()["items"]


def _by_key(client, h, key):
    return next((t for t in _rows(client, h) if t["idempotency_key"] == key), None)


# ─────────── ۱) فاکتورِ رزروِ لغوشده ───────────

def test_invoice_of_a_cancelled_booking_cannot_be_paid(client, seed, db):
    user, chain = _manager_booking(seed, db, "09380000001")
    h = auth(user.phone)
    bid = chain["booking"].id
    sid = chain["slot"].id
    pid = _invoice(client, h, bid)

    assert client.delete(f"/api/v1/bookings/{bid}", headers=h).status_code == 200

    r = client.post(f"/api/v1/payments/{pid}/pay", json=VALID_CARD, headers=h)
    assert r.status_code == 400, r.text
    assert "لغو" in r.json()["detail"]

    with _fresh() as s:
        assert s.get(Booking, bid).status == BookingStatus.CANCELLED
        assert s.get(Slot, sid).status == SlotStatus.AVAILABLE
    # هیچ درآمدی برای رزروی که سانس ندارد نوشته نشده
    assert _by_key(client, h, f"booking-payment:{pid}") is None


def test_confirmed_booking_invoice_is_still_payable(client, seed, db):
    """نگهبانِ رفع: قاعده نباید مسیر عادیِ پرداخت را ببندد."""
    user, chain = _manager_booking(seed, db, "09380000002")
    h = auth(user.phone)
    bid = chain["booking"].id
    pid = _invoice(client, h, bid)

    r = client.post(f"/api/v1/payments/{pid}/pay", json=VALID_CARD, headers=h)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "paid"

    with _fresh() as s:
        assert s.get(Booking, bid).status == BookingStatus.CONFIRMED
    assert _by_key(client, h, f"booking-payment:{pid}") is not None


# ─────────── ۲) فاکتورِ بازگشت‌وجه‌شده ───────────

def test_refunded_invoice_cannot_be_paid_a_second_time(client, seed, db):
    user, chain = _manager_booking(seed, db, "09380000003")
    h = auth(user.phone)
    bid = chain["booking"].id
    pid = _invoice(client, h, bid)

    assert client.post(f"/api/v1/payments/{pid}/pay", json=VALID_CARD, headers=h).status_code == 200
    income = _by_key(client, h, f"booking-payment:{pid}")
    assert income and income["direction"] == "income"

    # لغو ⇒ فاکتور REFUNDED و ردیف برگشت نوشته می‌شود (خالص صفر)
    assert client.delete(f"/api/v1/bookings/{bid}", headers=h).status_code == 200
    refund = _by_key(client, h, f"booking-refund:{pid}")
    assert refund and refund["type"] == "refund"

    r = client.post(f"/api/v1/payments/{pid}/pay", json=VALID_CARD, headers=h)
    assert r.status_code == 400, r.text

    # درآمد جدیدی ساخته نمی‌شود و خالص همان صفر می‌ماند
    rows = [t for t in _rows(client, h) if t.get("source_id") == pid]
    assert sum(t["amount"] for t in rows if t["direction"] == "income") == income["amount"]
    assert sum(t["amount"] for t in rows if t["direction"] == "expense") == refund["amount"]


# ─────────── ۳) webhook درگاه ───────────

class _FakeGateway:
    """درگاه ساختگی — فقط `verify_payment` در مسیر callback خوانده می‌شود."""

    async def verify_payment(self, authority, amount):
        return {"ref_id": "ref-123", "card_pan": "**** 1234", "amount": amount}


def test_webhook_does_not_resurrect_a_cancelled_booking(client, seed, db, monkeypatch,
                                                        sent_notifications):
    import app.api.v1.payments as pay_mod

    user, chain = _manager_booking(seed, db, "09380000004")
    h = auth(user.phone)
    bid = chain["booking"].id
    sid = chain["slot"].id
    pid = _invoice(client, h, bid)

    assert client.delete(f"/api/v1/bookings/{bid}", headers=h).status_code == 200

    monkeypatch.setattr(pay_mod, "get_payment_gateway", lambda: _FakeGateway())
    r = client.post(f"/api/v1/payments/{pid}/callback",
                    json={"Authority": "auth-x", "Status": "OK"})
    assert r.status_code == 200, r.text

    with _fresh() as s:
        # پول واقعاً در درگاه گرفته شده ⇒ فاکتور paid است، ولی رزرو زنده نمی‌شود
        assert s.get(Booking, bid).status == BookingStatus.CANCELLED
        assert s.get(Slot, sid).status == SlotStatus.AVAILABLE
    # و همان پول بی‌سانس برای مدیر قابل‌دید است تا بازگشت وجه را ثبت کند
    warns = [n for n in sent_notifications if n["title"].startswith("⚠️ پرداخت برای رزروِ غیرفعال")]
    assert len(warns) == 1 and warns[0]["user_id"] == user.id


# ─────────── ۴) حالت درگاه واقعی: نشانی ریدایرکت ───────────

class _RedirectGateway(_FakeGateway):
    async def create_payment_request(self, amount, description, callback_url, mobile):
        return {"authority": "auth-42", "payment_url": "https://gateway.test/pay?A=auth-42"}


def test_real_gateway_pay_returns_the_redirect_url(client, seed, db, monkeypatch):
    """`response_model` بی‌صدا کلید ناشناخته را می‌اندازد؛ این تست همان فیلد را می‌سنجد."""
    import app.api.v1.payments as pay_mod

    user, chain = _manager_booking(seed, db, "09380000005")
    h = auth(user.phone)
    pid = _invoice(client, h, chain["booking"].id)

    monkeypatch.setattr(pay_mod, "get_payment_gateway", lambda: _RedirectGateway())
    r = client.post(f"/api/v1/payments/{pid}/pay", json=VALID_CARD, headers=h)
    assert r.status_code == 200, r.text

    body = r.json()
    assert body["payment_url"] == "https://gateway.test/pay?A=auth-42"
    assert body["authority"] == "auth-42"
    # هنوز پولی گرفته نشده ⇒ فاکتور در انتظار می‌ماند و درآمدی ثبت نمی‌شود
    assert body["status"] == "pending"
    assert _by_key(client, h, f"booking-payment:{pid}") is None
