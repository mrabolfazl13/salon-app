# backend/tests/test_membership_refund.py
"""بازگشت وجه اشتراک (C15.5.1، راند ۲۱): تا پیش از این هیچ مسیری از `PAID` به بیرون نبود.

نتیجه‌اش این بود که ردیفِ درآمدِ دفتر کلِ یک اشتراکِ کنسل‌شده تا ابد در کنسول مالی
می‌ماند و مدیر فقط می‌توانست «لغو» پیش از پرداخت بزند. قراردادِ جدید همان قراردادی
است که رزرو رعایت می‌کند (C7): ردیفِ درآمدappend-only می‌ماند و یک ردیف
`refund/expense` به همان مبلغ کنارش می‌نشیند؛ اعتبار هم لغو می‌شود.

سطح: unit/SQLite (TestClient + `Session(test_engine)`).
"""
from sqlmodel import Session, select

from app.models.membership import MembershipPurchase, PurchaseStatus
from app.models.transaction import (
    FinancialTransaction,
    TransactionDirection,
    TransactionSourceType,
    TransactionType,
)
from app.models.user import User, UserRole
from app.models.venue import Venue

from conftest import test_engine
from helpers import auth

CARD_OK = "6037701150123456"
PRICE_RIAL = 1_400_000
PAY = {"card_number": CARD_OK, "cvv": "123"}


def _gym(tag: str):
    """یک مدیرِ باشگاه + یک مشتری + یک پلنِ پرداخت‌شده؛ (mgr_phone, cust_phone, pid, vid)."""
    with Session(test_engine) as s:
        mgr = User(phone=f"0912441{tag}", full_name=f"مدیر {tag}", hashed_password="x",
                   role=UserRole.VENUE_MANAGER, is_verified=True)
        cust = User(phone=f"0912442{tag}", full_name="ورزشکار", hashed_password="x",
                    role=UserRole.USER, is_verified=True)
        other = User(phone=f"0912443{tag}", full_name="مدیر دیگر", hashed_password="x",
                     role=UserRole.VENUE_MANAGER, is_verified=True)
        s.add(mgr); s.add(cust); s.add(other)
        s.commit()
        for u in (mgr, cust, other):
            s.refresh(u)
        venue = Venue(name=f"باشگاه {tag}", address="قم", latitude=34.64, longitude=50.87,
                      phone="025", manager_id=mgr.id, category="gym")
        other_venue = Venue(name=f"باشگاهِ دیگر {tag}", address="قم", latitude=34.6,
                            longitude=50.8, phone="025", manager_id=other.id, category="gym")
        s.add(venue); s.add(other_venue)
        s.commit()
        s.refresh(venue)
        mgr_id, cust_id, other_id, vid, other_vid = (
            mgr.id, cust.id, other.id, venue.id, other_venue.id)
    plan = {"venue_id": vid, "title": "پک ۱۰ جلسه", "plan_type": "sessions_pack",
            "price": PRICE_RIAL, "sessions_count": 10, "duration_days": None}
    return mgr_id, cust_id, other_id, vid, other_vid, plan


def _paid(client, tag: str):
    """فاکتورِ پرداخت‌شده می‌سازد؛ (mgr_phone, cust_phone, purchase_id, venue_id, other_phone, other_vid)."""
    mgr_id, cust_id, other_id, vid, other_vid, plan = _gym(tag)
    phones = {mgr_id: f"0912441{tag}", cust_id: f"0912442{tag}", other_id: f"0912443{tag}"}
    r = client.post("/api/v1/memberships/plans", json=plan, headers=auth(phones[mgr_id]))
    assert r.status_code == 201, r.text
    plan_id = r.json()["id"]
    inv = client.post("/api/v1/memberships/purchases", json={"plan_id": plan_id},
                      headers=auth(phones[cust_id]))
    assert inv.status_code == 201, inv.text
    pid = inv.json()["id"]
    paid = client.post(f"/api/v1/memberships/purchases/{pid}/pay", json=PAY,
                       headers=auth(phones[cust_id]))
    assert paid.status_code == 200, paid.text
    return (phones[mgr_id], phones[cust_id], pid, vid, phones[other_id], other_vid)


def _rows(purchase_id: int):
    with Session(test_engine) as s:
        return s.exec(select(FinancialTransaction).where(
            FinancialTransaction.source_type == TransactionSourceType.MEMBERSHIP_PURCHASE,
            FinancialTransaction.source_id == purchase_id).order_by(
                FinancialTransaction.id)).all()


# ─────────────── ۱) مسیرِ بازگشت وجه ───────────────

def test_refund_reverses_in_the_ledger_without_touching_income(client):
    mgr, _cust, pid, vid, *_ = _paid(client, "001")
    with Session(test_engine) as s:
        cust_id = s.get(MembershipPurchase, pid).user_id

    r = client.post(f"/api/v1/memberships/purchases/{pid}/refund",
                    json={"reason": "انصراف مشتری"}, headers=auth(mgr))
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "refunded"
    assert r.json()["sessions_remaining"] == 0

    rows = _rows(pid)
    income = [x for x in rows if x.direction == TransactionDirection.INCOME]
    expense = [x for x in rows if x.type == TransactionType.REFUND]
    assert len(income) == 1 and income[0].amount == PRICE_RIAL   # ردیفِ درآمد دست‌نخورده
    assert len(expense) == 1
    assert expense[0].direction == TransactionDirection.EXPENSE
    assert expense[0].amount == PRICE_RIAL                        # همان ریال، نه ۱۰×
    assert expense[0].idempotency_key == f"membership-refund:{pid}"
    assert expense[0].counterparty == cust_id and expense[0].venue_id == vid
    assert "انصراف مشتری" in expense[0].description
    with Session(test_engine) as s:
        assert s.get(MembershipPurchase, pid).status == PurchaseStatus.REFUNDED


def test_refund_is_idempotent_and_blocked_after_the_first_one(client):
    mgr, _cust, pid, *_ = _paid(client, "002")
    first = client.post(f"/api/v1/memberships/purchases/{pid}/refund", json={},
                        headers=auth(mgr))
    assert first.status_code == 200, first.text

    second = client.post(f"/api/v1/memberships/purchases/{pid}/refund", json={},
                         headers=auth(mgr))
    assert second.status_code == 400, second.text
    assert "پرداخت‌شده" in second.json()["detail"]
    assert len([x for x in _rows(pid) if x.type == TransactionType.REFUND]) == 1


def test_pending_invoice_cannot_be_refunded(client):
    mgr, cust, _pid, vid, *_ = _paid(client, "003")
    # یک فاکتورِ تازه (پرداخت‌نشده) روی همان پلن
    plans = client.get("/api/v1/memberships/plans", params={"venue_id": vid},
                       headers=auth(mgr)).json()
    inv = client.post("/api/v1/memberships/purchases", json={"plan_id": plans[0]["id"]},
                      headers=auth(cust))
    assert inv.status_code == 201, inv.text
    pending_id = inv.json()["id"]

    r = client.post(f"/api/v1/memberships/purchases/{pending_id}/refund", json={},
                    headers=auth(mgr))
    assert r.status_code == 400, r.text
    assert _rows(pending_id) == []                                # هیچ ردیفِ مالیاتی نساخت


def test_only_the_manager_of_that_venue_can_refund(client):
    _mgr, _cust, pid, _vid, other_phone, _other_vid = _paid(client, "004")
    stranger = client.post(f"/api/v1/memberships/purchases/{pid}/refund", json={},
                           headers=auth(other_phone))
    assert stranger.status_code == 403, stranger.text
    with Session(test_engine) as s:
        assert s.get(MembershipPurchase, pid).status == PurchaseStatus.PAID
    assert len([x for x in _rows(pid) if x.type == TransactionType.REFUND]) == 0


def test_customer_cannot_refund_himself(client):
    _mgr, cust, pid, *_ = _paid(client, "005")
    r = client.post(f"/api/v1/memberships/purchases/{pid}/refund", json={}, headers=auth(cust))
    assert r.status_code == 403, r.text


def test_refunded_membership_cannot_be_consumed(client):
    mgr, _cust, pid, *_ = _paid(client, "006")
    assert client.post(f"/api/v1/memberships/purchases/{pid}/refund", json={},
                       headers=auth(mgr)).status_code == 200
    consume = client.post(f"/api/v1/memberships/purchases/{pid}/consume", headers=auth(mgr))
    assert consume.status_code == 400, consume.text


def test_refund_shows_in_the_finance_transactions_list(client):
    """ردیفِ برگشت در فهرستِ مالیِ همان سالن دیده می‌شود (صدای‌کنندۀ انسان‌خوان) و
    درآمدِ ناخالصِ `by-source` را تخریب نمی‌کند — آن endpoint فقط INCOME را می‌شمارد."""
    mgr, _cust, pid, vid, *_ = _paid(client, "007")
    assert client.post(f"/api/v1/memberships/purchases/{pid}/refund",
                       json={"reason": "اشتباهِ ثبت"}, headers=auth(mgr)).status_code == 200

    r = client.get("/api/v1/finance/transactions",
                   params={"venue_id": vid, "type": "refund",
                           "source_type": "membership_purchase"}, headers=auth(mgr))
    assert r.status_code == 200, r.text
    items = r.json()["items"]
    assert len(items) == 1, items
    assert items[0]["amount"] == PRICE_RIAL
    assert items[0]["direction"] == "expense"
    assert items[0]["source_id"] == pid

    by_src = client.get("/api/v1/finance/revenue/by-source", params={"venue_id": vid},
                        headers=auth(mgr))
    assert by_src.status_code == 200, by_src.text
    row = [x for x in by_src.json()["by_source"] if x["source"] == "membership_purchase"]
    assert len(row) == 1, by_src.json()
    assert row[0]["income"] == PRICE_RIAL and row[0]["count"] == 1
