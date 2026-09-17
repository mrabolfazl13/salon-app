# backend/tests/test_contract_gap_fixups.py
"""fixupهای بخش ۸ — cash-mark اقساط (۴۰۳/۲۰۱/idempotency + ledger)،
manager_rows (تلفن/مانده)، و سازگاری برچسب weekday سری مالی."""
from datetime import date, time as dtime, timedelta

import pytest
from sqlmodel import Session, select

import app.services.pending_booking_service as pbs_module
import app.utils.rate_limit as rate_limit_module
from app.models.contract import Contract, ContractPayment, ContractStatus, PaymentStatus
from app.models.staff import SecurityAuditEvent
from app.models.transaction import (
    FinancialTransaction, TransactionMethod, TransactionSourceType,
    TransactionStatus,
)
from app.models.user import User, UserRole
from app.models.venue import Venue
from helpers import auth, FakeRedis
from conftest import test_engine


@pytest.fixture()
def fake_redis(monkeypatch):
    fake = FakeRedis()
    monkeypatch.setattr(pbs_module, "_client", fake)
    monkeypatch.setattr(rate_limit_module, "_client", fake)
    return fake


def _fresh():
    return Session(test_engine)


def _user(phone, role=UserRole.USER):
    with _fresh() as s:
        u = User(phone=phone, full_name=f"ک {phone}", hashed_password="x", role=role)
        s.add(u); s.commit(); s.refresh(u)
        return u


def _approve_contract(client, tag):
    m = _user(f"0911600{tag}0", UserRole.VENUE_MANAGER)
    u = _user(f"0911600{tag}1")
    with _fresh() as s:
        v = Venue(name="سالن کش", address="آ", latitude=35.7, longitude=51.4,
                  manager_id=m.id)
        s.add(v); s.commit(); s.refresh(v)
        vid = v.id
    d = date.today() + timedelta(days=1)
    while d.weekday() != 2:
        d += timedelta(days=1)
    payload = {"venue_id": vid, "start_date": d.isoformat(),
               "end_date": (d + timedelta(days=42)).isoformat(),
               "day_of_week": 2, "start_time": "18:00", "recurrence": "weekly",
               "discounted_price": 100001, "down_payment_amount": 100000}
    r = client.post("/api/v1/contracts/", json=payload, headers=auth(u.phone))
    assert r.status_code == 200, r.text
    cid = r.json()["id"]
    ap = client.post(f"/api/v1/contracts/{cid}/approve",
                     json={"installments": {"count": 2}}, headers=auth(m.phone))
    assert ap.status_code == 200, ap.text
    pays = client.get(f"/api/v1/contracts/{cid}/payments",
                      headers=auth(m.phone)).json()
    return m, u, vid, cid, pays


def test_cashmark_permissions_idempotency_and_ledger(client, fake_redis,
                                                     sent_notifications):
    m, u, vid, cid, pays = _approve_contract(client, "31")
    down = pays[0]
    cash = _user("0911600312")
    st = client.post("/api/v1/staff/", json={"phone": cash.phone, "venue_id": vid,
                                             "position": "cashier"},
                     headers=auth(m.phone))
    assert st.status_code == 201, st.text
    # کاربر غریبه ⇒ ۴۰۳
    r = client.post(f"/api/v1/contracts/{cid}/payments/{down['id']}/mark-paid",
                    headers=auth(_user("09116999999").phone))
    assert r.status_code == 403
    # کشیر سالن ⇒ ۲۰۰ + cash در دفتر کل
    r = client.post(f"/api/v1/contracts/{cid}/payments/{down['id']}/mark-paid",
                    headers=auth(cash.phone))
    assert r.status_code == 200, r.text
    assert r.json()["is_paid"] is True and r.json()["transaction_id"]
    with _fresh() as s:
        tx = s.exec(select(FinancialTransaction).where(
            FinancialTransaction.idempotency_key == f"contract-payment:{down['id']}")).one()
        assert tx.method == TransactionMethod.CASH
        assert tx.source_type == TransactionSourceType.CONTRACT_PAYMENT
        assert tx.status == TransactionStatus.CLEARED and tx.venue_id == vid
        assert tx.counterparty == u.id
        ev = s.exec(select(SecurityAuditEvent).where(
            SecurityAuditEvent.action == "contract.installment_cash_marked")).first()
        assert ev is not None and ev.venue_id == vid
    # فراخوانی دوم ⇒ همان پاسخ، بدون ردیف دوم (idempotent)
    r2 = client.post(f"/api/v1/contracts/{cid}/payments/{down['id']}/mark-paid",
                     headers=auth(cash.phone))
    assert r2.status_code == 200 and r2.json()["id"] == down["id"]
    with _fresh() as s:
        n = s.exec(select(FinancialTransaction).where(
            FinancialTransaction.idempotency_key == f"contract-payment:{down['id']}")).all()
        assert len(n) == 1
    # در تراکنش‌های مدیر سالن دیده می‌شود
    fin = client.get(f"/api/v1/finance/transactions?venue_id={vid}",
                     headers=auth(m.phone)).json()
    keys = [i["idempotency_key"] for i in fin["items"]]
    assert f"contract-payment:{down['id']}" in keys
    # reception (بدون finance.record_payment) ⇒ ۴۰۳ روی mark-paid
    rec = _user("0911600313")
    client.post("/api/v1/staff/", json={"phone": rec.phone, "venue_id": vid,
                                        "position": "reception"}, headers=auth(m.phone))
    inst = [p for p in client.get(f"/api/v1/contracts/{cid}/payments",
                                  headers=auth(m.phone)).json()
            if p["record_type"] == "installment"]
    r = client.post(f"/api/v1/contracts/{cid}/payments/{inst[0]['id']}/mark-paid",
                    headers=auth(rec.phone))
    assert r.status_code == 403
    assert any(n["type"] == "contract_payment" for n in sent_notifications)


def test_cashmark_not_blocked_for_voided_and_owner_bypass(client, fake_redis):
    m, u, vid, cid, pays = _approve_contract(client, "32")
    inst = pays[1]
    # ابطال سپس تلاش برای کش‌مارک ⇒ ۴۰۰
    client.post(f"/api/v1/contracts/{cid}/payments/{inst['id']}/void",
                json={"reason": "تست ابطال"}, headers=auth(m.phone))
    r = client.post(f"/api/v1/contracts/{cid}/payments/{inst['id']}/mark-paid",
                    headers=auth(m.phone))
    assert r.status_code == 400
    # مالک سالن (بایپس) قسط موجود را نقد می‌کند
    r = client.post(f"/api/v1/contracts/{cid}/payments/{pays[0]['id']}/mark-paid",
                    headers=auth(m.phone))
    assert r.status_code == 200, r.text


def test_manager_rows_have_phone_and_outstanding(client, fake_redis):
    m, u, vid, cid, pays = _approve_contract(client, "33")
    rows = client.get("/api/v1/contracts/manager/all", headers=auth(m.phone)).json()
    assert len(rows) == 1
    row = rows[0]
    assert row["user_phone"] == u.phone and row["user_full_name"] == u.full_name
    total = row["contract"]["total_amount"]
    assert row["outstanding_amount"] == total
    # پرداخت یک قسط ⇒ مانده کم می‌شود
    client.post(f"/api/v1/contracts/{cid}/payments/{pays[0]['id']}/pay",
                json={}, headers=auth(u.phone))
    row2 = client.get("/api/v1/contracts/manager/all", headers=auth(m.phone)).json()[0]
    assert row2["outstanding_amount"] == total - pays[0]["amount"]
    # ابطال قسط ⇒ از مانده خارج (total − paid با حذف voided)
    client.post(f"/api/v1/contracts/{cid}/payments/{pays[1]['id']}/void",
                json={"reason": "لغو تستی"}, headers=auth(m.phone))
    row3 = client.get("/api/v1/contracts/manager/all", headers=auth(m.phone)).json()[0]
    assert row3["outstanding_amount"] == total - pays[0]["amount"]


def test_finance_weekday_series_shared_constants(client, fake_redis):
    from app.services.finance_service import FinanceService
    from app.utils.weekdays import (
        WEEKDAY_NAMES_SUNDAY_FIRST, ledger_key_from_python, to_python_weekday,
    )
    assert tuple(FinanceService.WEEKDAY_FA) == WEEKDAY_NAMES_SUNDAY_FIRST
    # دایره‌ی تبدیل با date.weekday() سازگار است (مبنای قراردادها پایتون است)
    for k in range(7):
        assert ledger_key_from_python(to_python_weekday(k)) == k
    ref = date(2026, 9, 13)  # یکشنبه (۱۳ سپتامبر ۲۰۲۶)
    assert ref.weekday() == 6
    assert to_python_weekday(int(ref.strftime("%w"))) == 6
    m, u, vid, cid, pays = _approve_contract(client, "34")
    r = client.get(f"/api/v1/finance/revenue/series?group_by=weekday&venue_id={vid}",
                   headers=auth(m.phone))
    assert r.status_code == 200, r.text


# ─────────────────── درخواست تقسیط/یادداشت (contract parity) ───────────────────

def _pending_with_request(client, tag, status=200, **extra):
    m = _user(f"0911600{tag}0", UserRole.VENUE_MANAGER)
    u = _user(f"0911600{tag}1")
    with _fresh() as s:
        v = Venue(name="سالن درخواست", address="آ", latitude=35.7, longitude=51.4,
                  manager_id=m.id)
        s.add(v); s.commit(); s.refresh(v)
        vid = v.id
    d = date.today() + timedelta(days=1)
    while d.weekday() != 2:
        d += timedelta(days=1)
    payload = {"venue_id": vid, "start_date": d.isoformat(),
               "end_date": (d + timedelta(days=84)).isoformat(),
               "day_of_week": 2, "start_time": "18:00", "recurrence": "weekly",
               "discounted_price": 100001}
    payload.update(extra)
    r = client.post("/api/v1/contracts/", json=payload, headers=auth(u.phone))
    assert r.status_code == status, r.text
    return m, u, vid, (r.json()["id"] if status == 200 else r)


def test_desired_installments_in_pending_payload_and_used_at_approval(client, fake_redis):
    m, u, vid, cid = _pending_with_request(
        client, "51", desired_installments=3, note="لطفاً ۳ قسط ماهانه باشد")
    rows = client.get("/api/v1/contracts/manager/pending",
                      headers=auth(m.phone)).json()
    assert len(rows) == 1
    c = rows[0]["contract"]
    assert c["desired_installments"] == 3
    assert c["note"] == "لطفاً ۳ قسط ماهانه باشد"   # مدیر در صف تأیید می‌بیند
    ap = client.post(f"/api/v1/contracts/{cid}/approve", json={},
                     headers=auth(m.phone))
    assert ap.status_code == 200, ap.text
    pays = client.get(f"/api/v1/contracts/{cid}/payments",
                      headers=auth(m.phone)).json()
    inst = [p for p in pays if p["record_type"] == "installment"]
    assert len(inst) == 3  # پیش‌فرض از درخواست کاربر، نه ماه‌های قراردادی
    assert sum(p["amount"] for p in inst) == c["total_amount"]


def test_desired_installments_validation_and_explicit_plan_wins(client, fake_redis):
    # سقف validate می‌شود (le=60، هم‌راستا با سقف ۶۰ سانس)
    _, _, _, r = _pending_with_request(client, "52", status=422,
                                       desired_installments=61)
    assert r.status_code == 422
    m, u, vid, cid = _pending_with_request(client, "53", desired_installments=5)
    # پلن صریح مدیر بر درخواست کاربر مقدم است
    ap = client.post(f"/api/v1/contracts/{cid}/approve",
                     json={"installments": {"count": 2, "due_in_days_between": 14}},
                     headers=auth(m.phone))
    assert ap.status_code == 200, ap.text
    pays = client.get(f"/api/v1/contracts/{cid}/payments",
                      headers=auth(m.phone)).json()
    assert len([p for p in pays if p["record_type"] == "installment"]) == 2
    # قرارداد بدون desired ⇒ رفتار قبلی بی‌تغییر (بدون پلن = بدون تقویم)
    m2, u2, vid2, cid2 = _pending_with_request(client, "54")
    ap2 = client.post(f"/api/v1/contracts/{cid2}/approve", json={},
                      headers=auth(m2.phone))
    assert ap2.status_code == 200
    assert client.get(f"/api/v1/contracts/{cid2}/payments",
                      headers=auth(m2.phone)).json() == []
