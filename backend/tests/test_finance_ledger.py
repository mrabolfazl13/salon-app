# backend/tests/test_finance_ledger.py
"""تست دفتر کل مالی — سود ناخالص، ابطال، حساب شخص، دسته‌بندی هزینه، دسترسی و idempotency."""
from datetime import date, time as dtime

from app.models.user import UserRole
from app.models.venue import Venue
from app.models.slot import Slot, SlotStatus
from helpers import auth

BASE = "/api/v1/finance"


def _make_manager(seed, db, phone="09300000001", name="سالن آلفا"):
    """مدیر سالن + یک سالن متعلق به او."""
    user = seed["user"](phone, full_name="مدیر " + name, role=UserRole.VENUE_MANAGER)
    venue = Venue(name=name, category="futsal", address="آدرس", latitude=35.7,
                  longitude=51.4, phone="09121111111", manager_id=user.id)
    db.add(venue)
    db.commit()
    db.refresh(venue)
    db.close()
    return user, venue


def _make_admin(seed):
    return seed["user"]("09309999999", full_name="مدیر کل", role=UserRole.SUPER_ADMIN)


def _create_tx(client, headers, **overrides):
    payload = {"type": "payment", "direction": "income", "amount": 1_000_000,
               "method": "cash", "description": "دریافت دستی"}
    payload.update(overrides)
    r = client.post(f"{BASE}/transactions", json=payload, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


# ─────────────────────────── سود ناخالص ───────────────────────────

def test_income_expense_gross_profit(client, seed, db):
    manager, venue = _make_manager(seed, db)
    h = auth(manager.phone)

    cat = client.post(f"{BASE}/expense-categories",
                      json={"name": "برق", "venue_id": venue.id}, headers=h)
    assert cat.status_code == 201, cat.text
    cat_id = cat.json()["id"]

    income = _create_tx(client, h, venue_id=venue.id, amount=1_000_000)
    expense = _create_tx(client, h, venue_id=venue.id, amount=300_000,
                         type="expense", direction="expense", expense_category_id=cat_id)
    assert income["id"] != expense["id"]

    dash = client.get(f"{BASE}/dashboard?venue_id={venue.id}", headers=h)
    assert dash.status_code == 200, dash.text
    d = dash.json()
    assert d["gross_profit"] == 700_000
    assert d["expenses"] == 300_000
    assert d["today_revenue"] == 700_000
    assert d["month_revenue"] == 700_000
    assert d["today_received"] == 1_000_000


def test_amount_must_be_positive(client, seed, db):
    manager, venue = _make_manager(seed, db, phone="09300000011")
    r = client.post(f"{BASE}/transactions",
                    json={"type": "payment", "direction": "income", "amount": 0,
                          "venue_id": venue.id},
                    headers=auth(manager.phone))
    assert r.status_code == 422


def test_idempotency_key_returns_existing(client, seed, db):
    manager, venue = _make_manager(seed, db, phone="09300000012")
    h = auth(manager.phone)
    first = _create_tx(client, h, venue_id=venue.id, idempotency_key="k-1")
    second = _create_tx(client, h, venue_id=venue.id, idempotency_key="k-1")
    assert first["id"] == second["id"]
    listing = client.get(f"{BASE}/transactions?venue_id={venue.id}", headers=h).json()
    assert listing["total"] == 1


# ─────────────────────────── ابطال (append-only) ───────────────────────────

def test_void_recomputes_balance_and_keeps_row(client, seed, db):
    manager, venue = _make_manager(seed, db, phone="09300000021")
    h = auth(manager.phone)
    cat = client.post(f"{BASE}/expense-categories",
                      json={"name": "تعمیرات", "venue_id": venue.id}, headers=h).json()
    income = _create_tx(client, h, venue_id=venue.id, amount=500_000)
    expense = _create_tx(client, h, venue_id=venue.id, amount=200_000,
                         type="expense", direction="expense", expense_category_id=cat["id"])

    dash = client.get(f"{BASE}/dashboard?venue_id={venue.id}", headers=h).json()
    assert dash["gross_profit"] == 300_000

    voided = client.post(f"{BASE}/transactions/{expense['id']}/void",
                         json={"reason": "ثبت اشتباه"}, headers=h)
    assert voided.status_code == 200, voided.text
    body = voided.json()
    assert body["status"] == "voided"
    assert body["void_reason"] == "ثبت اشتباه"

    # ردیف اصلی حذف نشده — فقط وضعیت عوض شده
    again = client.get(f"{BASE}/transactions/{expense['id']}", headers=h)
    assert again.status_code == 200
    assert again.json()["amount"] == 200_000

    # ابطال دوباره مجاز نیست
    twice = client.post(f"{BASE}/transactions/{expense['id']}/void",
                        json={"reason": "دوباره"}, headers=h)
    assert twice.status_code == 400

    # موجودی/سود بدون لحاظ‌کردن ردیف باطل‌شده بازمحاسبه می‌شود
    dash2 = client.get(f"{BASE}/dashboard?venue_id={venue.id}", headers=h).json()
    assert dash2["gross_profit"] == 500_000
    assert dash2["expenses"] == 0


def test_void_requires_reason(client, seed, db):
    manager, venue = _make_manager(seed, db, phone="09300000022")
    h = auth(manager.phone)
    tx = _create_tx(client, h, venue_id=venue.id)
    r = client.post(f"{BASE}/transactions/{tx['id']}/void", json={"reason": ""}, headers=h)
    assert r.status_code == 422


# ─────────────────────────── حساب شخص ───────────────────────────

def test_person_statement_running_balance(client, seed, db):
    manager, venue = _make_manager(seed, db, phone="09300000031")
    debtor = seed["user"]("09301111111", full_name="بدهکار")
    h = auth(manager.phone)

    _create_tx(client, h, venue_id=venue.id, type="receivable", direction="income",
               amount=500_000, counterparty=debtor.id, description="نسیه هفته اول")
    _create_tx(client, h, venue_id=venue.id, type="payment", direction="income",
               amount=200_000, counterparty=debtor.id, description="اقساط")

    pay = client.post(f"{BASE}/accounts/{debtor.id}/payments",
                      json={"amount": 100_000, "venue_id": venue.id, "method": "cash"},
                      headers=h)
    assert pay.status_code == 201, pay.text

    stmt = client.get(f"{BASE}/accounts/{debtor.id}/statement?venue_id={venue.id}",
                      headers=h)
    assert stmt.status_code == 200, stmt.text
    s = stmt.json()
    assert s["opening_balance"] == 0
    assert s["closing_balance"] == 200_000  # 500k - 200k - 100k
    assert [e["running_balance"] for e in s["entries"]] == [500_000, 300_000, 200_000]

    accounts = client.get(f"{BASE}/accounts?kind=debtors", headers=h).json()
    assert accounts["total"] == 1
    assert accounts["items"][0]["user_id"] == debtor.id
    assert accounts["items"][0]["balance"] == 200_000
    assert accounts["items"][0]["kind"] == "debtor"

    dash = client.get(f"{BASE}/dashboard?venue_id={venue.id}", headers=h).json()
    assert dash["open_receivables"] == 200_000


# ─────────────────────────── دسته‌بندی هزینه ───────────────────────────

def test_expense_category_crud(client, seed, db):
    manager, venue = _make_manager(seed, db, phone="09300000041")
    h = auth(manager.phone)

    created = client.post(f"{BASE}/expense-categories",
                          json={"name": "اینترنت", "venue_id": venue.id}, headers=h)
    assert created.status_code == 201
    cid = created.json()["id"]

    listing = client.get(f"{BASE}/expense-categories", headers=h).json()
    assert [c["id"] for c in listing] == [cid]

    updated = client.put(f"{BASE}/expense-categories/{cid}",
                         json={"name": "تور نت"}, headers=h)
    assert updated.status_code == 200 and updated.json()["name"] == "تور نت"

    # تکراری برای همان سالن رد می‌شود
    dup = client.post(f"{BASE}/expense-categories",
                      json={"name": "تور نت", "venue_id": venue.id}, headers=h)
    assert dup.status_code == 400

    # حذف نرم
    deleted = client.delete(f"{BASE}/expense-categories/{cid}", headers=h)
    assert deleted.status_code == 200
    inactive = client.get(f"{BASE}/expense-categories?include_inactive=true", headers=h).json()
    assert any(c["id"] == cid and not c["is_active"] for c in inactive)

    # دسته‌بندی مصرف‌شده حذف نمی‌شود
    used = client.post(f"{BASE}/expense-categories",
                       json={"name": "آب", "venue_id": venue.id}, headers=h).json()
    _create_tx(client, h, venue_id=venue.id, type="expense", direction="expense",
               amount=50_000, expense_category_id=used["id"])
    assert client.delete(f"{BASE}/expense-categories/{used['id']}", headers=h).status_code == 400


def test_expense_requires_category(client, seed, db):
    manager, venue = _make_manager(seed, db, phone="09300000042")
    r = client.post(f"{BASE}/transactions",
                    json={"type": "expense", "direction": "expense", "amount": 10_000,
                          "venue_id": venue.id},
                    headers=auth(manager.phone))
    assert r.status_code == 422


# ─────────────────────────── دسترسی ───────────────────────────

def test_manager_cannot_read_other_venue_dashboard(client, seed, db):
    manager_a, venue_a = _make_manager(seed, db, phone="09300000051", name="سالن A")
    manager_b, venue_b = _make_manager(seed, db, phone="09300000052", name="سالن B")

    r = client.get(f"{BASE}/dashboard?venue_id={venue_b.id}", headers=auth(manager_a.phone))
    assert r.status_code == 403

    # سرپرست بدون محدودیت سالن
    admin = _make_admin(seed)
    ok = client.get(f"{BASE}/dashboard?venue_id={venue_b.id}", headers=auth(admin.phone))
    assert ok.status_code == 200

    # مدیر A به تراکنش سالن B دسترسی ندارد
    tx = _create_tx(client, auth(manager_b.phone), venue_id=venue_b.id)
    denied = client.get(f"{BASE}/transactions/{tx['id']}", headers=auth(manager_a.phone))
    assert denied.status_code == 403

    # کاربر عادی اصلاً manager نیست
    plain = seed["user"]("09302222222")
    assert client.get(f"{BASE}/dashboard", headers=auth(plain.phone)).status_code == 403