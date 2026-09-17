# backend/tests/test_contracts_payments.py
"""اقساط قرارداد: تولید تقویم (floor + باقیمانده روی قسط آخر)، تسویه از طریق
دفتر کل، ابطال با دلیل، و تسک معوقی — همه روی SQLite تست.
"""
from datetime import date, time as dtime, timedelta

import pytest
from sqlmodel import Session, select

import app.services.pending_booking_service as pbs_module
import app.utils.rate_limit as rate_limit_module
from app.models.contract import (
    Contract, ContractPayment, ContractStatus, PaymentStatus, RecurrenceType,
    ContractAuditAction,
)
from app.models.transaction import FinancialTransaction, TransactionSourceType, TransactionStatus
from app.models.user import UserRole
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


def _setup(client, seed, db, phone_suffix, price=100001, down=None, weeks=6, day_of_week=2):
    m = seed["user"](f"0911500{phone_suffix}0", role=UserRole.VENUE_MANAGER)
    m_id, m_phone = m.id, m.phone
    u = seed["user"](f"0911500{phone_suffix}1")
    u_id, u_phone = u.id, u.phone
    with _fresh() as s:
        venue = Venue(name="سالن اقساط", address="آدرس", latitude=35.7, longitude=51.4,
                      manager_id=m_id)
        s.add(venue); s.commit(); s.refresh(venue)
        vid = venue.id
    d = date.today() + timedelta(days=1)
    while d.weekday() != day_of_week:
        d += timedelta(days=1)
    payload = {
        "venue_id": vid, "start_date": d.isoformat(),
        "end_date": (d + timedelta(days=7 * weeks)).isoformat(),
        "day_of_week": day_of_week, "start_time": "18:00",
        "recurrence": "weekly", "discounted_price": price,
    }
    if down is not None:
        payload["down_payment_amount"] = down
    r = client.post("/api/v1/contracts/", json=payload, headers=auth(u_phone))
    assert r.status_code == 200, r.text
    cid = r.json()["id"]
    total = r.json()["total_amount"]
    return {"m_id": m_id, "m_phone": m_phone, "u_id": u_id, "u_phone": u_phone,
            "vid": vid, "cid": cid, "total": total, "price": price}


def _payments(client, env):
    r = client.get(f"/api/v1/contracts/{env['cid']}/payments", headers=auth(env["u_phone"]))
    assert r.status_code == 200, r.text
    return r.json()


# ─────────────────────────── تولید تقویم در تأیید ───────────────────────────

def test_schedule_generated_with_remainder_on_last(client, db, seed, fake_redis):
    env = _setup(client, seed, db, "10", down=130000)
    approve = client.post(f"/api/v1/contracts/{env['cid']}/approve",
                          json={"installments": {"count": 3}}, headers=auth(env["m_phone"]))
    assert approve.status_code == 200, approve.text
    rows = _payments(client, env)
    amounts = [p["amount"] for p in rows]
    assert rows[0]["record_type"] == "down_payment" and rows[0]["label"] == "پیش‌پرداخت"
    assert sum(amounts) == env["total"]            # هیچ ریالی گم نمی‌شود
    assert amounts[1] == 190002 and amounts[2] == 190002 and amounts[3] == 190003
    dues = [p["due_date"] for p in rows]
    assert dues[1] < dues[2] < dues[3]             # فاصله ماهانه
    assert all(not p["is_paid"] and p["transaction_id"] is None for p in rows)
    with _fresh() as s:
        c = s.get(Contract, env["cid"])
        assert c.payment_status == PaymentStatus.PENDING
    trail = client.get(f"/api/v1/contracts/{env['cid']}/audit", headers=auth(env["u_phone"])).json()
    assert [e["action"] for e in trail][-1] == ContractAuditAction.PAYMENT_SCHEDULE_GENERATED.value


def test_no_schedule_without_trigger(client, db, seed, fake_redis):
    env = _setup(client, seed, db, "11", down=None)
    client.post(f"/api/v1/contracts/{env['cid']}/approve", json={}, headers=auth(env["m_phone"]))
    assert _payments(client, env) == []


def test_default_monthly_installments_from_down_payment(client, db, seed, fake_redis):
    env = _setup(client, seed, db, "12", down=50000)
    client.post(f"/api/v1/contracts/{env['cid']}/approve", json={}, headers=auth(env["m_phone"]))
    inst = [p for p in _payments(client, env) if p["record_type"] == "installment"]
    assert len(inst) >= 2  # بازه ~۶ هفته → حداقل ۲ قسط ماهانه
    assert sum(p["amount"] for p in inst) == env["total"] - 50000


def test_payment_due_day_of_month_clamps_due_dates(client, db, seed, fake_redis):
    env = _setup(client, seed, db, "13", down=100000)
    with _fresh() as s:
        c = s.get(Contract, env["cid"])
        c.payment_due_day_of_month = 5   # همه سررسیدها روز ۵ ماه
        s.add(c); s.commit()
    client.post(f"/api/v1/contracts/{env['cid']}/approve",
                json={"installments": {"count": 2}}, headers=auth(env["m_phone"]))
    inst = [p for p in _payments(client, env) if p["record_type"] == "installment"]
    assert inst and all(date.fromisoformat(p["due_date"]).day == 5 for p in inst)


# ─────────────────────────── پرداخت → دفتر کل ───────────────────────────

def test_pay_installment_settles_through_ledger_and_appears_in_finance(client, db, seed, sent_notifications, fake_redis):
    env = _setup(client, seed, db, "14", down=130000)
    client.post(f"/api/v1/contracts/{env['cid']}/approve",
                json={"installments": {"count": 3}}, headers=auth(env["m_phone"]))
    rows = _payments(client, env)
    down_row = rows[0]
    r = client.post(f"/api/v1/contracts/{env['cid']}/payments/{down_row['id']}/pay",
                    json={"card_number": "۶۰۳۷۹۹۷۰۰۰۰۰۰۰۱۲"}, headers=auth(env["u_phone"]))
    assert r.status_code == 200, r.text
    got = next(x for x in r.json() if x["id"] == down_row["id"]) if isinstance(r.json(), list) else r.json()
    assert got["is_paid"] and got["transaction_id"]
    with _fresh() as s:
        tx = s.exec(select(FinancialTransaction).where(
            FinancialTransaction.idempotency_key == f"contract-payment:{down_row['id']}")).first()
        assert tx is not None
        assert tx.source_type == TransactionSourceType.CONTRACT_PAYMENT
        assert tx.source_id == down_row["id"]
        assert tx.amount == down_row["amount"]
        assert tx.counterparty == env["u_id"] and tx.venue_id == env["vid"]
        assert tx.status == TransactionStatus.CLEARED
    fin = client.get("/api/v1/finance/transactions",
                     params={"venue_id": env["vid"]}, headers=auth(env["m_phone"]))
    assert fin.status_code == 200, fin.text
    items = fin.json()["items"]
    keys = [i.get("idempotency_key") for i in items]
    assert f"contract-payment:{down_row['id']}" in keys
    with _fresh() as s:
        c = s.get(Contract, env["cid"])
        assert c.payment_status == PaymentStatus.PARTIAL
    assert any(n["type"] == "contract_payment" for n in sent_notifications)


def test_pay_invalid_card_and_double_and_foreign_user(client, db, seed, fake_redis):
    env = _setup(client, seed, db, "15", down=100000)
    client.post(f"/api/v1/contracts/{env['cid']}/approve",
                json={"installments": {"count": 2}}, headers=auth(env["m_phone"]))
    row = _payments(client, env)[1]
    bad = client.post(f"/api/v1/contracts/{env['cid']}/payments/{row['id']}/pay",
                      json={"card_number": "123"}, headers=auth(env["u_phone"]))
    assert bad.status_code == 400 and "کارت" in bad.json()["detail"]
    ok = client.post(f"/api/v1/contracts/{env['cid']}/payments/{row['id']}/pay",
                     json={}, headers=auth(env["u_phone"]))   # بدون کارت = نقد
    assert ok.status_code == 200
    twice = client.post(f"/api/v1/contracts/{env['cid']}/payments/{row['id']}/pay",
                        json={}, headers=auth(env["u_phone"]))
    assert twice.status_code == 400
    with _fresh() as s:
        n = s.exec(select(FinancialTransaction).where(
            FinancialTransaction.idempotency_key == f"contract-payment:{row['id']}")).all()
        assert len(n) == 1
    other = seed["user"]("09115999995")
    row2 = _payments(client, env)[2]
    foreign = client.post(f"/api/v1/contracts/{env['cid']}/payments/{row2['id']}/pay",
                          json={}, headers=auth(other.phone))
    assert foreign.status_code == 403


def test_paying_all_installments_marks_paid(client, db, seed, fake_redis):
    env = _setup(client, seed, db, "16", price=100000, down=100000)
    client.post(f"/api/v1/contracts/{env['cid']}/approve",
                json={"installments": {"count": 1}}, headers=auth(env["m_phone"]))
    rows = _payments(client, env)
    for p in rows:
        r = client.post(f"/api/v1/contracts/{env['cid']}/payments/{p['id']}/pay",
                        json={}, headers=auth(env["u_phone"]))
        assert r.status_code == 200, r.text
    with _fresh() as s:
        assert s.get(Contract, env["cid"]).payment_status == PaymentStatus.PAID


# ─────────────────────────── ابطال قسط با دلیل (ledger void) ───────────────────────────

def test_void_paid_installment_records_reason_on_ledger(client, db, seed, fake_redis):
    env = _setup(client, seed, db, "17", down=60000)
    client.post(f"/api/v1/contracts/{env['cid']}/approve",
                json={"installments": {"count": 2}}, headers=auth(env["m_phone"]))
    row = _payments(client, env)[0]
    client.post(f"/api/v1/contracts/{env['cid']}/payments/{row['id']}/pay",
                json={}, headers=auth(env["u_phone"]))
    bad_actor = client.post(f"/api/v1/contracts/{env['cid']}/payments/{row['id']}/void",
                            json={"reason": "اشتباه کاربر"}, headers=auth(env["u_phone"]))
    assert bad_actor.status_code == 403  # فقط مدیر
    r = client.post(f"/api/v1/contracts/{env['cid']}/payments/{row['id']}/void",
                    json={"reason": "کسر اشتباه از حساب"}, headers=auth(env["m_phone"]))
    assert r.status_code == 200, r.text
    assert r.json()["is_voided"] and r.json()["void_reason"] == "کسر اشتباه از حساب"
    with _fresh() as s:
        tx = s.exec(select(FinancialTransaction).where(
            FinancialTransaction.idempotency_key == f"contract-payment:{row['id']}")).first()
        assert tx.status == TransactionStatus.VOIDED
        assert tx.void_reason == "کسر اشتباه از حساب"      # دلیل واید در دفتر کل ثبت شد
    trail = client.get(f"/api/v1/contracts/{env['cid']}/audit", headers=auth(env["m_phone"])).json()
    assert [e["action"] for e in trail][-1] == ContractAuditAction.PAYMENT_VOIDED.value


# ─────────────────────────── economics + دسترسی فهرست اقساط ───────────────────────────

def test_economics_and_payments_access(client, db, seed, fake_redis):
    env = _setup(client, seed, db, "18", down=100000)
    client.post(f"/api/v1/contracts/{env['cid']}/approve",
                json={"installments": {"count": 2}}, headers=auth(env["m_phone"]))
    mgr_view = client.get(f"/api/v1/contracts/{env['cid']}/payments", headers=auth(env["m_phone"]))
    assert mgr_view.status_code == 200 and len(mgr_view.json()) == 3
    stranger = seed["user"]("09115999998")
    forb = client.get(f"/api/v1/contracts/{env['cid']}/payments", headers=auth(stranger.phone))
    assert forb.status_code == 403
    det = client.get(f"/api/v1/contracts/{env['cid']}", headers=auth(env["u_phone"])).json()
    econ = det["economics"]
    assert econ["total_sessions"] == 7
    assert econ["paid_amount"] == 0
    assert econ["remaining_amount"] == env["total"]
    assert econ["overdue"] is False
    # معوق‌کردن دستی سررسید و بازخوانی
    rows = _payments(client, env)
    with _fresh() as s:
        p = s.get(ContractPayment, rows[0]["id"])
        p.due_date = date.today() - timedelta(days=3)
        s.add(p); s.commit()
    det2 = client.get(f"/api/v1/contracts/{env['cid']}", headers=auth(env["u_phone"])).json()
    assert det2["economics"]["overdue"] is True


# ─────────────────────────── تسک معوقی (فراخوانی مستقیم) ───────────────────────────

def test_overdue_task_marks_notifies_audits_once(client, db, seed, sent_notifications, fake_redis):
    from app.tasks.contract_tasks import notify_overdue_contract_payments
    env = _setup(client, seed, db, "19", down=100000)
    client.post(f"/api/v1/contracts/{env['cid']}/approve",
                json={"installments": {"count": 2}}, headers=auth(env["m_phone"]))
    rows = _payments(client, env)
    with _fresh() as s:
        p = s.get(ContractPayment, rows[0]["id"])
        p.due_date = date.today() - timedelta(days=2)
        s.add(p); s.commit()
    result = notify_overdue_contract_payments()
    assert result["overdue_count"] == 1
    with _fresh() as s:
        p = s.get(ContractPayment, rows[0]["id"])
        assert p.is_overdue and p.overdue_notified_at is not None
        c = s.get(Contract, env["cid"])
        assert c.payment_status == PaymentStatus.OVERDUE
    types = [n["type"] for n in sent_notifications]
    assert types.count("contract_overdue") >= 2      # کاربر + مدیر سالن
    assert any(n["user_id"] == env["u_id"] for n in sent_notifications if n["type"] == "contract_overdue")
    assert any(n["user_id"] == env["m_id"] for n in sent_notifications if n["type"] == "contract_overdue")
    trail = client.get(f"/api/v1/contracts/{env['cid']}/audit", headers=auth(env["m_phone"])).json()
    assert [e["action"] for e in trail].count(ContractAuditAction.OVERDUE_NOTIFIED.value) == 1
    # اجرای دوم دوباره اعلان نمی‌دهد (overdue_notified_at ضدتکرار)
    sent_notifications.clear()
    result2 = notify_overdue_contract_payments()
    assert result2["overdue_count"] == 0
    assert [n for n in sent_notifications if n["type"] == "contract_overdue"] == []