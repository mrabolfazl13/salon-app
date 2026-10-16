# backend/tests/test_finance_refund_void_consistency.py
"""سازگاری جفتِ «درآمد ↔ بازگشت وجه» در دفتر کل (بازبینی #6).

سه قانونی که این فایل می‌پاید:
۱) ردیف درآمدی که برگشتش cleared است، باطل‌شدنی نیست — وگرنه پول دوبار از دفتر
   خارج می‌شود (درآمد از جمع حذف می‌شود و ردیف expenseِ برگشت سر جایش می‌ماند).
۲) راه درست همان است: اول برگشت باطل شود، بعد درآمد ⇒ خالص صفر.
۳) برگشتِ فیش/دریافتِ در محل باید همان جفت `(source_type, source_id)` ردیف درآمدیِ
   خودش را بگیرد؛ اگر `id` خودِ ردیف دفتر کل را بردارد، هیچ کوئری نمی‌تواند بگوید
   «این برگشت، این درآمد را وارونه کرده» و قانون ۱ بی‌اثر می‌ماند.
۴) ابطالِ درآمد با «پوشش» سنجیده می‌شود، نه صرفِ بود و نبودِ برگشت: مجاز تا وقتی که
   جمعِ برگشت‌های زنده از جمعِ درآمدهای زندهٔ دیگرِ همان منبع بیشتر نشود. وگرنه
   رزروِ چندردیفه (فیش + در محل) یا بازگشتِ جزئی، بی‌دلیل قفل می‌شود.
"""
from app.models.user import UserRole
from app.models.venue import Venue, VenuePaymentMode
from app.models.slot import Slot, SlotStatus
from app.models.booking import Booking, BookingStatus
from helpers import auth

BASE = "/api/v1/finance"
VALID_CARD = {"card_number": "6037991122334455", "cvv": "123"}


def _manager_chain(seed, db, phone):
    """مدیر + سالن + سانسِ رزروشده توسط خودش (بدون پرداخت، تا مسیر دستی آزاد باشد)."""
    user = seed["user"](phone, role=UserRole.VENUE_MANAGER)
    chain = seed["booking"](user)
    db.close()
    return user, chain


def _tx_by_key(client, headers, key):
    rows = client.get(f"{BASE}/transactions", headers=headers).json()["items"]
    return next((t for t in rows if t["idempotency_key"] == key), None)


def _pay_and_cancel(client, h, booking_id):
    """رزرو → فاکتور → پرداخت درگاه → لغو (برگشت وجه نوشته می‌شود)."""
    inv = client.post("/api/v1/payments/", json={"booking_id": booking_id}, headers=h)
    assert inv.status_code == 201, inv.text
    pid = inv.json()["id"]
    assert client.post(f"/api/v1/payments/{pid}/pay", json=VALID_CARD, headers=h).status_code == 200
    assert client.delete(f"/api/v1/bookings/{booking_id}", headers=h).status_code == 200
    return pid


# ─────────── قانون ۱ و ۲: ابطالِ درآمدِ برگشت‌خورده ───────────

def test_voiding_a_refunded_income_row_is_rejected(client, seed, db):
    mgr, chain = _manager_chain(seed, db, "09350000001")
    h = auth(mgr.phone)
    _pay_and_cancel(client, h, chain["booking"].id)

    income = _tx_by_key(client, h, f"booking-payment:{chain['booking'].id}") or \
        _tx_by_key(client, h, "booking-payment:1")
    assert income and income["direction"] == "income"
    refund = _tx_by_key(client, h, f"booking-refund:{income['source_id']}")
    assert refund and refund["type"] == "refund"

    r = client.post(f"{BASE}/transactions/{income['id']}/void",
                    json={"reason": "تصفیهٔ حساب"}, headers=h)
    assert r.status_code == 400, r.text
    assert "برگشت خورده" in r.json()["detail"]

    # ردیف دست‌نخورده ماند (نه باطل، نه حذف)
    again = client.get(f"{BASE}/transactions/{income['id']}", headers=h).json()
    assert again["status"] == "cleared"


def test_voiding_the_refund_first_then_income_leaves_net_zero(client, seed, db):
    mgr, chain = _manager_chain(seed, db, "09350000002")
    h = auth(mgr.phone)
    _pay_and_cancel(client, h, chain["booking"].id)

    rows = client.get(f"{BASE}/transactions", headers=h).json()["items"]
    income = next(t for t in rows if t["direction"] == "income")
    refund = next(t for t in rows if t["type"] == "refund")

    # خالصِ قبل از ابطال: ۵۰۰٬۰۰۰ − ۵۰۰٬۰۰۰ = ۰ ( برگشت، درآمد را خنثی کرده)
    before = client.get(f"{BASE}/dashboard?venue_id={chain['venue'].id}", headers=h).json()
    assert before["gross_profit"] == 0

    assert client.post(f"{BASE}/transactions/{refund['id']}/void",
                       json={"reason": "برگشت اشتباه ثبت شد"}, headers=h).status_code == 200
    voided = client.post(f"{BASE}/transactions/{income['id']}/void",
                         json={"reason": "تکراری"}, headers=h)
    assert voided.status_code == 200, voided.text
    assert voided.json()["status"] == "voided"

    after = client.get(f"{BASE}/dashboard?venue_id={chain['venue'].id}", headers=h).json()
    assert after["gross_profit"] == 0          # هیچ‌کدام در جمع نمی‌آیند
    assert after["today_received"] == 0


def test_manual_income_without_a_refund_is_still_voidable(client, seed, db):
    """گاردریل فقط جفتِ واقعیِ برگشت را می‌بندد؛ ردیف دستیِ بی‌منبع نباید قفل شود."""
    mgr, chain = _manager_chain(seed, db, "09350000003")
    h = auth(mgr.phone)
    created = client.post(f"{BASE}/transactions",
                          json={"type": "payment", "direction": "income", "amount": 250_000,
                                "method": "cash", "venue_id": chain["venue"].id,
                                "description": "واریزی دستی"}, headers=h)
    assert created.status_code == 201, created.text
    r = client.post(f"{BASE}/transactions/{created.json()['id']}/void",
                    json={"reason": "اشباه ثبت شد"}, headers=h)
    assert r.status_code == 200, r.text


# ─────────── قانون ۳: جفتِ منبع در مسیرِ در محل ───────────

def _collect_in_person(client, seed, db, phone):
    mgr, chain = _manager_chain(seed, db, phone)
    bk = db.get(Booking, chain["booking"].id)
    bk.payment_mode = VenuePaymentMode.PAY_IN_PLACE
    bk.status = BookingStatus.CONFIRMED
    db.add(bk)
    db.commit()
    db.close()
    h = auth(mgr.phone)
    r = client.post(f"/api/v1/bookings/{chain['booking'].id}/collect-in-person",
                    json={"amount": 300_000, "method": "cash"}, headers=h)
    assert r.status_code == 200, r.text
    return mgr, chain, h


def test_in_person_refund_shares_the_income_source_pair(client, seed, db):
    mgr, chain, h = _collect_in_person(client, seed, db, "09350000004")
    income = _tx_by_key(client, h, f"booking-inperson:{chain['booking'].id}")
    assert income and income["source_type"] == "booking"
    assert income["source_id"] == chain["booking"].id

    assert client.delete(f"/api/v1/bookings/{chain['booking'].id}", headers=h).status_code == 200

    refund = _tx_by_key(client, h, f"booking-refund:{income['id']}")
    assert refund, "ردیف برگشتِ پرداخت در محل نوشته نشد"
    # همین دو فیلد، جفت را با ردیف درآمدی یکی می‌کند (قبلاً source_id = شناسهٔ دفتر کل بود)
    assert refund["source_type"] == income["source_type"]
    assert refund["source_id"] == income["source_id"]

    blocked = client.post(f"{BASE}/transactions/{income['id']}/void",
                          json={"reason": "تصفیه"}, headers=h)
    assert blocked.status_code == 400, blocked.text


def test_gateway_refund_keeps_the_payment_source_pair(client, seed, db):
    """قرارداد موجود: برگشت درگاه، جفتِ پرداخت (= payment id) را نگه می‌دارد."""
    mgr, chain = _manager_chain(seed, db, "09350000005")
    h = auth(mgr.phone)
    pid = _pay_and_cancel(client, h, chain["booking"].id)

    rows = client.get(f"{BASE}/transactions", headers=h).json()["items"]
    income = next(t for t in rows if t["direction"] == "income")
    refund = next(t for t in rows if t["type"] == "refund")
    assert income["source_type"] == "booking_payment" and income["source_id"] == pid
    assert refund["source_type"] == income["source_type"]
    assert refund["source_id"] == income["source_id"]


def test_cancelled_booking_writes_one_refund_per_income_row(client, seed, db):
    """لغو دوباره فراخوانی شود، برگشت دوم نوشته نمی‌شود (idempotency)."""
    mgr, chain = _manager_chain(seed, db, "09350000006")
    h = auth(mgr.phone)
    _pay_and_cancel(client, h, chain["booking"].id)
    # لغوی که دیگر رزرو CONFIRMED نیست: چیزی به دفتر کل اضافه نمی‌کند
    again = client.delete(f"/api/v1/bookings/{chain['booking'].id}", headers=h)
    assert again.status_code in (200, 400), again.text
    rows = client.get(f"{BASE}/transactions?type=refund", headers=h).json()
    assert rows["total"] == 1


# ─────────── قانون ۴: ابطال با «پوششِ» برگشت سنجیده می‌شود، نه بود و نبودش ───────────

def test_void_is_allowed_until_the_refund_loses_its_cover(client, seed, db):
    """چند ردیف درآمد روی یک منبع: ابطالِ ردیفِ اول مجاز است، دومی برگشت را بی‌پوشش می‌گذارد."""
    mgr, chain = _manager_chain(seed, db, "09350000007")
    h = auth(mgr.phone)
    pair = {"source_type": "manual", "source_id": 987654}

    def _income(key: str, amount: int) -> int:
        r = client.post(f"{BASE}/transactions",
                        json={"type": "payment", "direction": "income", "amount": amount,
                              "method": "cash", "venue_id": chain["venue"].id,
                              "description": "درآمدِ هم‌منبع", "idempotency_key": key,
                              **pair}, headers=h)
        assert r.status_code == 201, r.text
        return r.json()["id"]

    big = _income("audit-income-500k", 500_000)
    small = _income("audit-income-300k", 300_000)
    refund = client.post(f"{BASE}/transactions",
                         json={"type": "refund", "direction": "expense", "amount": 300_000,
                               "method": "cash", "venue_id": chain["venue"].id,
                               "description": "بازگشتِ جزئی", "idempotency_key": "audit-refund",
                               **pair}, headers=h)
    assert refund.status_code == 201, refund.text

    # برگشت ۳۰۰ هزار تومانی پس از ابطالِ ردیف ۵۰۰ هزار همچنان با ردیف ۳۰۰ هزار پوشش دارد
    first = client.post(f"{BASE}/transactions/{big}/void",
                        json={"reason": "ثبت تکراری"}, headers=h)
    assert first.status_code == 200, first.text

    # ابطالِ ردیف دوم، ردیف برگشت را یتیم می‌کند (برگشت > درآمدِ زندهٔ باقی‌مانده)
    second = client.post(f"{BASE}/transactions/{small}/void",
                         json={"reason": "ثبت تکراری"}, headers=h)
    assert second.status_code == 400, second.text
    assert "برگشت خورده" in second.json()["detail"]
