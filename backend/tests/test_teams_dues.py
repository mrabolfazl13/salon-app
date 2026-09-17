# backend/tests/test_teams_dues.py
"""تست سهم/حق‌عضویت تیم — تولید، پرداخت idempotent، دفتر کل، تعادل، ابطال."""
from datetime import date, timedelta

from sqlmodel import Session, select

from conftest import test_engine
from helpers import auth, err_code
from app.models.transaction import (
    CounterpartyType, FinancialTransaction, TransactionSourceType, TransactionType,
)

BASE = "/api/v1/teams"
CAP = "09370000001"
M1 = "09370000002"
M2 = "09370000003"
M3 = "09370000004"


def _user_id(phone):
    from app.models.user import User
    with Session(test_engine) as s:
        return s.exec(select(User).where(User.phone == phone)).first().id


def _setup(client, seed, name="تیم سهم"):
    seed["user"](CAP)
    seed["user"](M1)
    seed["user"](M2)
    t = client.post(f"{BASE}/", json={"name": name, "visibility": "public"},
                    headers=auth(CAP)).json()
    for u in (M1, M2):
        mid = client.post(f"{BASE}/{t['id']}/invite", json={"phone": u},
                          headers=auth(CAP)).json()["member_id"]
        client.post(f"{BASE}/{t['id']}/invitations/{mid}/accept", headers=auth(u))
    return t


def _gen(client, phone, tid, amount=100, title="ماهانه", days=10, members=None):
    body = {"amount": amount, "title": title,
            "due_date": str(date.today() + timedelta(days=days))}
    if members is not None:
        body["member_user_ids"] = members
    return client.post(f"{BASE}/{tid}/dues/generate", json=body, headers=auth(phone))


def _ledger_rows_for_due(due_id):
    with Session(test_engine) as s:
        return s.exec(select(FinancialTransaction).where(
            FinancialTransaction.source_type == TransactionSourceType.TEAM_DUES,
            FinancialTransaction.source_id == due_id,
        )).all()


# ─────────────────────────── generate ───────────────────────────

def test_generate_includes_captain_and_all_active(client, seed):
    t = _setup(client, seed)
    r = _gen(client, CAP, t["id"], amount=150, title="شارژ زمین")
    assert r.status_code == 201, r.text
    res = r.json()
    assert res["created"] == 3           # کاپیتان + ۲ عضو
    assert res["per_user_amount"] == 150
    assert res["total_amount"] == 450
    assert {d["user_id"] for d in res["items"]} == {
        _user_id(CAP), _user_id(M1), _user_id(M2)}
    # عضو عادی فقط سهم خود را در لیست می‌بیند
    dues_m1 = client.get(f"{BASE}/{t['id']}/dues", headers=auth(M1)).json()
    assert len(dues_m1["items"]) == 1
    # مدیر همه را
    dues_cap = client.get(f"{BASE}/{t['id']}/dues", headers=auth(CAP)).json()
    assert len(dues_cap["items"]) == 3


def test_generate_duplicate_skipped(client, seed):
    t = _setup(client, seed)
    assert _gen(client, CAP, t["id"], title="ثابت").json()["created"] == 3
    r2 = _gen(client, CAP, t["id"], title="ثابت")
    assert r2.json()["created"] == 0 and r2.json()["skipped"] == 3


def test_generate_requires_admin(client, seed):
    t = _setup(client, seed)
    seed["user"](M3)
    r = _gen(client, M3, t["id"])
    assert r.status_code == 403
    assert err_code(r) == "NOT_A_MEMBER"
    # سررسید گذشته
    r = client.post(f"{BASE}/{t['id']}/dues/generate",
                    json={"amount": 50, "title": "گذشته",
                          "due_date": str(date.today() - timedelta(days=1))},
                    headers=auth(CAP))
    assert r.status_code == 400 and err_code(r) == "BAD_DUE_DATE"
    # عضو غیرفعال در member_user_ids
    r3 = _gen(client, CAP, t["id"], title="گروهی", members=[_user_id(M3)])
    assert r3.status_code == 404 and err_code(r3) == "NOT_A_MEMBER"


# ─────────────────────────── pay + ledger ───────────────────────────

def test_pay_records_single_idempotent_ledger_row(client, seed):
    t = _setup(client, seed)
    items = _gen(client, CAP, t["id"], amount=2500, title="آبجی").json()["items"]
    due = next(d for d in items if d["user_id"] == _user_id(M1))
    r = client.post(f"{BASE}/{t['id']}/dues/{due['id']}/pay",
                    json={"method": "gateway"}, headers=auth(M1))
    assert r.status_code == 200, r.text
    paid = r.json()
    assert paid["is_paid"] is True and paid["transaction_id"] is not None
    # پرداخت دوم → 409 و همان یک ردیف دفتر کل
    r2 = client.post(f"{BASE}/{t['id']}/dues/{due['id']}/pay",
                     json={"method": "gateway"}, headers=auth(M1))
    assert r2.status_code == 409
    assert err_code(r2) == "DUE_ALREADY_PAID"
    rows = _ledger_rows_for_due(due["id"])
    assert len(rows) == 1
    tx = rows[0]
    assert tx.amount == 2500
    assert tx.type == TransactionType.PAYMENT
    assert tx.counterparty_type == CounterpartyType.TEAM
    assert tx.counterparty_ref == t["id"]
    assert tx.idempotency_key == f"team-dues:{due['id']}"
    assert tx.counterparty is None  # موجودی اشخاص آلوده نمی‌شود


def test_cash_collection_by_admin_only(client, seed):
    t = _setup(client, seed)
    items = _gen(client, CAP, t["id"], title="نقدی").json()["items"]
    due = next(d for d in items if d["user_id"] == _user_id(M2))
    # M1 (عضو معمولی) نمی‌تواند سهم M2 را وصول کند
    r = client.post(f"{BASE}/{t['id']}/dues/{due['id']}/pay",
                    json={"method": "cash"}, headers=auth(M1))
    assert r.status_code == 403
    assert err_code(r) == "NOT_AUTHORIZED"
    # کاپیتان (مدیر تیم) وصول نقدی می‌کند
    r2 = client.post(f"{BASE}/{t['id']}/dues/{due['id']}/pay",
                     json={"method": "cash", "reference": "دفتر-۱۲"},
                     headers=auth(CAP))
    assert r2.status_code == 200, r2.text
    assert r2.json()["paid_by"] == _user_id(CAP)
    assert r2.json()["payment_reference"] == "دفتر-۱۲"


def test_due_view_permission_and_not_found(client, seed):
    t = _setup(client, seed)
    items = _gen(client, CAP, t["id"], title="دسترسی").json()["items"]
    my = next(d for d in items if d["user_id"] == _user_id(M2))
    r = client.post(f"{BASE}/{t['id']}/dues/{my['id']}/pay", json={},
                    headers=auth(M1))
    assert r.status_code == 403
    assert err_code(r) == "NOT_AUTHORIZED"
    r2 = client.post(f"{BASE}/{t['id']}/dues/9999/pay", json={}, headers=auth(CAP))
    assert r2.status_code == 404 and err_code(r2) == "DUE_NOT_FOUND"
    # غیرعضو
    seed["user"](M3)
    assert client.get(f"{BASE}/{t['id']}/dues", headers=auth(M3)).status_code == 403


# ─────────────────────────── status filters / overdue ───────────────────────────

def test_status_filters_and_overdue(client, seed):
    t = _setup(client, seed)
    from app.models.team import TeamDues
    with Session(test_engine) as s:
        s.add(TeamDues(team_id=t["id"], user_id=_user_id(CAP), title="معوق",
                       amount=700, due_date=date.today() - timedelta(days=3),
                       created_at=_now_utc(), updated_at=_now_utc()))
        s.commit()
    over = client.get(f"{BASE}/{t['id']}/dues?status=overdue",
                      headers=auth(CAP)).json()
    assert all(d["due_date"] < str(date.today()) for d in over["items"])
    assert any(d["title"] == "معوق" and d["overdue"] for d in over["items"])


def _now_utc():
    from datetime import datetime, timezone
    return datetime.now(timezone.utc)


# ─────────────────────────── void + balance math ───────────────────────────

def test_void_rules(client, seed):
    t = _setup(client, seed)
    items = _gen(client, CAP, t["id"], amount=900, title="باطلی").json()["items"]
    due = next(d for d in items if d["user_id"] == _user_id(M1))
    # عضو عادی نمی‌تواند باطل کند
    r0 = client.delete(f"{BASE}/{t['id']}/dues/{due['id']}?reason=test",
                       headers=auth(M1))
    assert r0.status_code == 403
    r = client.delete(f"{BASE}/{t['id']}/dues/{due['id']}"
                      "?reason=" + "اشتباه", headers=auth(CAP))
    assert r.status_code == 200, r.text
    assert r.json()["is_voided"] is True
    # پرداخت سهم باطل‌شده مسدود
    assert client.post(f"{BASE}/{t['id']}/dues/{due['id']}/pay", json={},
                       headers=auth(M1)).status_code == 409
    # باطل کردن مجدد
    assert client.delete(f"{BASE}/{t['id']}/dues/{due['id']}",
                         headers=auth(CAP)).status_code == 409
    # سهم پرداختی باطل نمی‌شود
    d2 = next(d for d in items if d["user_id"] == _user_id(M2))
    client.post(f"{BASE}/{t['id']}/dues/{d2['id']}/pay", json={}, headers=auth(M2))
    assert client.delete(f"{BASE}/{t['id']}/dues/{d2['id']}",
                         headers=auth(CAP)).status_code == 409


def test_balance_math(client, seed):
    """۳ سهم ۱۰۰۰ تومانی → ۲ پرداخت: حساب=۲۰۰۰، باز=۱۰۰۰، net=۱۰۰۰."""
    t = _setup(client, seed)
    phone_by_uid = {_user_id(CAP): CAP, _user_id(M1): M1, _user_id(M2): M2}
    items = _gen(client, CAP, t["id"], amount=1000, title="تعادل").json()["items"]
    for d in items[:2]:
        r = client.post(f"{BASE}/{t['id']}/dues/{d['id']}/pay", json={},
                        headers=auth(phone_by_uid[d["user_id"]]))
        assert r.status_code == 200, r.text
    b = client.get(f"{BASE}/{t['id']}/balance", headers=auth(CAP)).json()
    assert b["dues_total"] == 3000
    assert b["dues_paid"] == 2000
    assert b["dues_unpaid"] == 1000
    assert b["team_ledger_income"] == 2000
    assert b["team_account_balance"] == 2000
    assert b["net_balance"] == 1000