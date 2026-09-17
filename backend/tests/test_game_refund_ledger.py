# backend/tests/test_game_refund_ledger.py
"""دفتر کل استرداد سهم بازی — لغو/خروج/حذف هرکدام ردیف refund متناظر می‌نویسند؛
درآمد خالص سالن پس از بازگشت‌ها درست است؛ لغو دوتایی ردیف تکراری نمی‌سازد."""
from sqlmodel import Session, select

from app.models.game import GameParticipant, GamePayment, GamePaymentStatus
from app.models.transaction import (
    FinancialTransaction, TransactionDirection, TransactionSourceType,
    TransactionType,
)
from conftest import test_engine
from helpers import auth, err_code

BASE = "/api/v1/games"


def _ledger_rows():
    with Session(test_engine) as c:
        return list(c.exec(
            select(FinancialTransaction).where(
                FinancialTransaction.source_type == TransactionSourceType.GAME_PAYMENT)
        ).all())


def _by_key(key):
    return [r for r in _ledger_rows() if r.idempotency_key == key]


def _split_game(client, seed, phone, max_players=5):
    owner = seed["user"](phone)
    chain = seed["booking"](owner)  # 500_000 // 5 = سهم 100_000
    r = client.post(f"{BASE}/", json={"booking_id": chain["booking"].id,
                                      "name": "بازی استرداد", "max_players": max_players,
                                      "visibility": "public",
                                      "payment_mode": "split_payment"},
                    headers=auth(phone))
    assert r.status_code == 201, r.text
    return owner, r.json()["id"], chain


def _pay(client, gid, user, owner_headers):
    ps = client.get(f"{BASE}/{gid}/participants", headers=owner_headers).json()
    pid = next(p["id"] for p in ps if p["user_id"] == user.id)
    r = client.post(f"{BASE}/{gid}/payments/{pid}/pay", headers=auth(user.phone))
    assert r.status_code == 200, r.text
    return r.json()["payment"]["id"]


def _payment_id(client, gid, user_id, headers):
    summary = client.get(f"{BASE}/{gid}/payments", headers=headers).json()
    return next(p["id"] for p in summary["payments"] if p["user_id"] == user_id)


def test_cancel_game_writes_refund_reversals_and_net_zero(client, seed):
    owner, gid, chain = _split_game(client, seed, "09380000001")
    oh = auth(owner.phone)
    m1 = seed["user"]("09380000011")
    m2 = seed["user"]("09380000012")
    for mk in (m1, m2):
        assert client.post(f"{BASE}/{gid}/join", headers=auth(mk.phone)).status_code == 200
    pay1 = _pay(client, gid, m1, oh)
    pay2 = _pay(client, gid, m2, oh)

    # درآمد اولیه سهم‌ها در دفتر
    assert len(_by_key(f"game-payment:{pay1}")) == 1
    assert len(_by_key(f"game-payment:{pay2}")) == 1

    r = client.delete(f"{BASE}/{gid}", headers=oh)
    assert r.status_code == 200, r.text

    ref1 = _by_key(f"game-refund:{pay1}")
    ref2 = _by_key(f"game-refund:{pay2}")
    assert len(ref1) == 1 and len(ref2) == 1
    row = ref1[0]
    assert row.type == TransactionType.REFUND
    assert row.direction == TransactionDirection.EXPENSE
    assert row.amount == 100_000
    assert row.venue_id == chain["venue"].id if hasattr(chain["venue"], "id") else True

    with Session(test_engine) as c:
        pays = list(c.exec(select(GamePayment).where(
            GamePayment.game_id == gid)).all())
    assert {p.status for p in pays if p.id in (pay1, pay2)} == {GamePaymentStatus.REFUNDED}

    # خالص درآمد دفتر از سهم‌ها = ۰ (۲۰۰هزار دریافت − ۲۰۰هزار استرداد)
    income = sum(r.amount for r in _ledger_rows() if r.direction == TransactionDirection.INCOME and r.status.value == "cleared")
    expense = sum(r.amount for r in _ledger_rows() if r.direction == TransactionDirection.EXPENSE and r.status.value == "cleared")
    assert income == 200_000 and expense == 200_000 and income - expense == 0

    # لغو دوبار ⇒ ۴۰۹ و بدون ردیف تکراری
    again = client.delete(f"{BASE}/{gid}", headers=oh)
    assert again.status_code == 409
    assert err_code(again) == "GAME_CANCELLED"
    assert len(_by_key(f"game-refund:{pay1}")) == 1
    assert len(_by_key(f"game-refund:{pay2}")) == 1


def test_leave_with_paid_share_records_refund(client, seed):
    owner, gid, _ = _split_game(client, seed, "09380000021")
    m1 = seed["user"]("09380000022")
    client.post(f"{BASE}/{gid}/join", headers=auth(m1.phone))
    pay1 = _pay(client, gid, m1, auth(owner.phone))
    r = client.post(f"{BASE}/{gid}/leave", headers=auth(m1.phone))
    assert r.status_code == 200, r.text
    rows = _by_key(f"game-refund:{pay1}")
    assert len(rows) == 1 and rows[0].type == TransactionType.REFUND


def test_remove_with_paid_share_records_refund(client, seed):
    owner, gid, _ = _split_game(client, seed, "09380000031")
    m1 = seed["user"]("09380000032")
    client.post(f"{BASE}/{gid}/join", headers=auth(m1.phone))
    pay1 = _pay(client, gid, m1, auth(owner.phone))
    r = client.delete(f"{BASE}/{gid}/participants/{m1.id}", headers=auth(owner.phone))
    assert r.status_code == 200, r.text
    rows = _by_key(f"game-refund:{pay1}")
    assert len(rows) == 1 and rows[0].type == TransactionType.REFUND
    # سهم پرداختیِ حذف‌شده ⇒ refunded
    with Session(test_engine) as c:
        p = c.get(GamePayment, pay1)
    assert p.status == GamePaymentStatus.REFUNDED