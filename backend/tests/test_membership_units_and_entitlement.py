# backend/tests/test_membership_units_and_entitlement.py
"""اشتراک باشگاه: واحدِ پول، نگهبانِ حقِ جلسه و وضعیتِ فاکتور هنگام پرداختِ ناموفق (C15، راند ۱۸).

سه نقص همین‌جا قفل می‌شوند:

۱) واحد: `MembershipPlan.price` در مودل/اسکیم «به تومان» نوشته شده بود، ولی
   `FinancialTransaction.amount` «مثبت به ریال» است و `lib/utils.ts:10` عدد را
   «ریال» چاپ می‌کند — و سیدِر همان قیمت منبع را `// 10` می‌کرد. یعنی یک جلسه
   روی صفحۀ سالن ۱٬۴۰۰٬۰۰۰ ریال و در کارتِ پلن ۱۴۰٬۰۰۰ ریال.
۲) حقِ مشتری: `pay_purchase` با `plan.sessions_count or 1` و
   `plan.duration_days or 30` مقدارِ خالی را بی‌صدا «یک جلسه / ۳۰ روز» می‌گرفت،
   و `PUT /plans/{id}` هیچ‌وقت جفتِ (نوع، مقدار) را نمی‌سنجید ⇒ پک ۱۰جلسه‌ای با
   یک درخواستِ null به پلنِ بی‌جلسه تبدیل می‌شد و خریدار ۱ جلسه می‌گرفت.
۳) فاکتور: کارتِ بی‌اعتبار (اشتباهِ تایپی) فاکتور را **CANCELLED** می‌کرد و
   commit می‌شد — درحالی‌که همان فاکتورِ لغو‌شده بعداً قابل پرداخت است.
"""
from datetime import datetime, timezone

import pytest
from sqlmodel import Session, select

from app.models.membership import MembershipPlan, MembershipPurchase
from app.models.transaction import FinancialTransaction, TransactionSourceType
from app.models.user import User, UserRole
from app.models.venue import Venue
from app.seed_gyms_poolticket import _seed_session_plan

from conftest import test_engine
from helpers import auth

CARD_OK = "6037701150123456"
CARD_BAD = "603770115012345"  # ۱۵ رقم


def _fresh():
    return Session(test_engine)


@pytest.fixture()
def gym():
    """یک مدیر + یک مشتری + یک سالن ورزشی؛ شناسه‌ها و شماره‌ها برگردانده می‌شوند."""
    with _fresh() as s:
        mgr = User(phone="09128880001", full_name="مدیر باشگاه", hashed_password="x",
                   role=UserRole.VENUE_MANAGER, is_verified=True)
        cust = User(phone="09128880002", full_name="ورزشکار", hashed_password="x",
                    role=UserRole.USER, is_verified=True)
        s.add(mgr)
        s.add(cust)
        s.commit()
        s.refresh(mgr)
        s.refresh(cust)
        venue = Venue(name="باشگاه شاهد", address="قم", latitude=34.64, longitude=50.87,
                      phone="025", manager_id=mgr.id, category="gym")
        s.add(venue)
        s.commit()
        s.refresh(venue)
        return {"manager": (mgr.id, mgr.phone), "customer": (cust.id, cust.phone),
                "venue_id": venue.id, "venue": venue}


def _create_plan(client, phone, gym, **over):
    body = {"venue_id": gym["venue_id"], "title": "پک ۱۰ جلسه",
            "plan_type": "sessions_pack", "price": 1_400_000,
            "sessions_count": 10, "duration_days": None}
    body.update(over)
    r = client.post("/api/v1/memberships/plans", json=body, headers=auth(phone))
    assert r.status_code == 201, r.text
    return r.json()["id"]


def _invoice(client, phone, plan_id):
    r = client.post("/api/v1/memberships/purchases", json={"plan_id": plan_id},
                    headers=auth(phone))
    assert r.status_code == 201, r.text
    return r.json()["id"]


# ─────────────── ۱) واحدِ پول ───────────────

def test_seeder_stores_the_source_price_in_rial(gym):
    """قیمت منبع ۱٬۴۰۰٬۰۰۰ ریال ⇒ همان عدد در پلن، نه یک‌دهم آن."""
    with _fresh() as s:
        _seed_session_plan(s, gym["venue"], 1_400_000)
        s.commit()
        plan = s.exec(select(MembershipPlan).where(
            MembershipPlan.venue_id == gym["venue_id"])).first()
        assert plan is not None
        # پیش از رفع: 140000 (تومانِ ساختگی) ⇒ صفحۀ سالن و کارتِ پلن ۱۰× فاصله داشتند
        assert plan.price == 1_400_000


def test_paid_purchase_books_the_same_rial_amount_in_the_ledger(client, gym):
    """فاکتور، پرداخت و ردیفِ دفتر کل هر سه یک عدد — و همان عددی که UI ریال می‌خواند."""
    _, mgr_phone = gym["manager"]
    _, cust_phone = gym["customer"]
    plan_id = _create_plan(client, mgr_phone, gym, title="جلسه‌ای",
                           plan_type="session", price=250_000, sessions_count=None)
    pid = _invoice(client, cust_phone, plan_id)
    paid = client.post(f"/api/v1/memberships/purchases/{pid}/pay",
                       json={"card_number": CARD_OK, "cvv": "123"}, headers=auth(cust_phone))
    assert paid.status_code == 200, paid.text
    assert paid.json()["amount"] == 250_000
    with _fresh() as s:
        tx = s.exec(select(FinancialTransaction).where(
            FinancialTransaction.source_type == TransactionSourceType.MEMBERSHIP_PURCHASE,
            FinancialTransaction.source_id == pid)).first()
        assert tx is not None
        assert tx.amount == 250_000, "دفتر کل ریال است؛ یک‌دهم یعنی درآمدِ ۱۰× کمتر"


# ─────────────── ۲) حقِ جلسه ───────────────

def test_put_cannot_null_a_sessions_pack(client, gym):
    """`{"sessions_count": null}` روی پکِ جلسه‌ای ⇒ ۴۰۰ و مقدارِ دیتابیس دست‌نخورده."""
    _, mgr_phone = gym["manager"]
    plan_id = _create_plan(client, mgr_phone, gym)
    bad = client.put(f"/api/v1/memberships/plans/{plan_id}",
                     json={"sessions_count": None}, headers=auth(mgr_phone))
    assert bad.status_code == 400, bad.text
    with _fresh() as s:
        assert s.get(MembershipPlan, plan_id).sessions_count == 10


def test_put_cannot_null_monthly_duration(client, gym):
    _, mgr_phone = gym["manager"]
    plan_id = _create_plan(client, mgr_phone, gym, title="ماهانه", plan_type="monthly",
                           sessions_count=None, duration_days=45)
    bad = client.put(f"/api/v1/memberships/plans/{plan_id}",
                     json={"duration_days": None}, headers=auth(mgr_phone))
    assert bad.status_code == 400, bad.text
    with _fresh() as s:
        assert s.get(MembershipPlan, plan_id).duration_days == 45


def test_pay_refuses_a_pack_that_lost_its_session_count(client, gym):
    """پلنِ بی‌جلسه نباید بی‌صدا «یک جلسه» بدهد؛ فاکتور باید PENDING بماند."""
    _, mgr_phone = gym["manager"]
    _, cust_phone = gym["customer"]
    plan_id = _create_plan(client, mgr_phone, gym)
    with _fresh() as s:
        # داده‌ای که نگهبانِ جدید نمی‌سازد، ولی سید/مهاجرتِ قدیمی می‌ساخت
        plan = s.get(MembershipPlan, plan_id)
        plan.sessions_count = None
        s.add(plan)
        s.commit()
    pid = _invoice(client, cust_phone, plan_id)
    r = client.post(f"/api/v1/memberships/purchases/{pid}/pay",
                    json={"card_number": CARD_OK, "cvv": "123"}, headers=auth(cust_phone))
    # پیش از رفع: ۲۰۰ با sessions_remaining=1 (مشتری پولِ ۱۰ جلسه داد، ۱ جلسه گرفت)
    assert r.status_code == 400, r.text
    with _fresh() as s:
        p = s.get(MembershipPurchase, pid)
        assert p.status.value == "pending"
        assert p.sessions_remaining is None


def test_monthly_expiry_is_the_declared_duration(client, gym):
    """۴۵ روز اعلام‌شده ⇒ ۴۵ روز اعتبار، نه fallbackِ ۳۰ روزه."""
    _, mgr_phone = gym["manager"]
    _, cust_phone = gym["customer"]
    plan_id = _create_plan(client, mgr_phone, gym, title="ماهانه", plan_type="monthly",
                           sessions_count=None, duration_days=45)
    pid = _invoice(client, cust_phone, plan_id)
    r = client.post(f"/api/v1/memberships/purchases/{pid}/pay",
                    json={"card_number": CARD_OK, "cvv": "123"}, headers=auth(cust_phone))
    assert r.status_code == 200, r.text
    body = r.json()
    starts = datetime.fromisoformat(body["starts_at"])
    expires = datetime.fromisoformat(body["expires_at"])
    if starts.tzinfo is None:
        starts = starts.replace(tzinfo=timezone.utc)
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    assert (expires - starts).days == 45


def test_single_session_plan_gives_one_session(client, gym):
    """پلنِ «جلسه‌ای» (SESSION) همان یک جلسه است — رفتارِ درستِ مسیر باید دست‌نخورده بماند."""
    _, mgr_phone = gym["manager"]
    _, cust_phone = gym["customer"]
    plan_id = _create_plan(client, mgr_phone, gym, title="جلسه‌ای", plan_type="session",
                           sessions_count=None)
    pid = _invoice(client, cust_phone, plan_id)
    r = client.post(f"/api/v1/memberships/purchases/{pid}/pay",
                    json={"card_number": CARD_OK, "cvv": "123"}, headers=auth(cust_phone))
    assert r.status_code == 200, r.text
    assert r.json()["sessions_remaining"] == 1


# ─────────────── ۳) فاکتور و کارتِ بی‌اعتبار ───────────────

def test_invalid_card_does_not_cancel_the_invoice(client, gym):
    """اعتبارسنجیِ ناموفق نباید وضعیتِ ماندگار را تغییر دهد."""
    _, mgr_phone = gym["manager"]
    _, cust_phone = gym["customer"]
    plan_id = _create_plan(client, mgr_phone, gym)
    pid = _invoice(client, cust_phone, plan_id)
    r = client.post(f"/api/v1/memberships/purchases/{pid}/pay",
                    json={"card_number": CARD_BAD, "cvv": "123"}, headers=auth(cust_phone))
    assert r.status_code == 400, r.text
    with _fresh() as s:
        # پیش از رفع: "cancelled" commit شده بود
        assert s.get(MembershipPurchase, pid).status.value == "pending"

    # و همان فاکتور با کارتِ درست پرداخت می‌شود
    ok = client.post(f"/api/v1/memberships/purchases/{pid}/pay",
                     json={"card_number": CARD_OK, "cvv": "123"}, headers=auth(cust_phone))
    assert ok.status_code == 200, ok.text
    assert ok.json()["sessions_remaining"] == 10


def test_double_pay_is_rejected(client, gym):
    """پرداختِ دوبارۀ همان فاکتور ⇒ ۴۰۰ و فقط یک ردیفِ درآمد در دفتر کل."""
    _, mgr_phone = gym["manager"]
    _, cust_phone = gym["customer"]
    plan_id = _create_plan(client, mgr_phone, gym)
    pid = _invoice(client, cust_phone, plan_id)
    first = client.post(f"/api/v1/memberships/purchases/{pid}/pay",
                        json={"card_number": CARD_OK, "cvv": "123"}, headers=auth(cust_phone))
    assert first.status_code == 200, first.text
    second = client.post(f"/api/v1/memberships/purchases/{pid}/pay",
                         json={"card_number": CARD_OK, "cvv": "123"}, headers=auth(cust_phone))
    assert second.status_code == 400, second.text
    with _fresh() as s:
        rows = s.exec(select(FinancialTransaction).where(
            FinancialTransaction.source_type == TransactionSourceType.MEMBERSHIP_PURCHASE,
            FinancialTransaction.source_id == pid)).all()
        assert len(rows) == 1


def test_consume_decrements_and_refuses_exhausted(client, gym):
    """مسیرِ مدیریتِ جلسات: کسر تا صفر، و بعد از آن ۴۰۰ (نه عددِ منفی)."""
    _, mgr_phone = gym["manager"]
    _, cust_phone = gym["customer"]
    plan_id = _create_plan(client, mgr_phone, gym, title="دو جلسه",
                           plan_type="sessions_pack", sessions_count=2)
    pid = _invoice(client, cust_phone, plan_id)
    client.post(f"/api/v1/memberships/purchases/{pid}/pay",
                json={"card_number": CARD_OK, "cvv": "123"}, headers=auth(cust_phone))
    for expected in (1, 0):
        r = client.post(f"/api/v1/memberships/purchases/{pid}/consume",
                        headers=auth(mgr_phone))
        assert r.status_code == 200, r.text
        assert r.json()["sessions_remaining"] == expected
    last = client.post(f"/api/v1/memberships/purchases/{pid}/consume",
                       headers=auth(mgr_phone))
    assert last.status_code == 400, last.text
    with _fresh() as s:
        assert s.get(MembershipPurchase, pid).sessions_remaining == 0
