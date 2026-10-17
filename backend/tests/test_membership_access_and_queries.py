# backend/tests/test_membership_access_and_queries.py
"""اشتراک باشگاه (راند ۲۰): نگهبانِ دسترسی + مسیرِ پرداخت + شمارشِ statement لیست‌ها.

سه گره از C15.5 همین‌جا باز می‌شود و یک ادعای راند ۱۸ تصحیح:

۱) `pay_purchase` پلنِ غیرفعال را نمی‌سنجید: فاکتوری که PENDING مانده بود بعد از
   «غیرفعال کردن پلن» (حذفِ نرم) قابل پرداخت بود، برعکسِ `create_purchase`.
۲) `include_inactive=true` روی `GET /plans` بی‌هیچ احراز هویتی کار می‌کرد، یعنی هر
   مهمانی می‌توانست پلن‌های عمرکردهٔ هر سالنی را ببیند.
۳) `_purchase_response` برای **هر ردیف** دو `s.get` می‌زد. دلیلش ظریف است: نتیجهٔ
   `s.get` دور ریخته می‌شد، پس identity map (که weak است) آن را نگه نمی‌داشت و
   ردیفِ بعدی دوباره SELECT می‌زد — اندازه‌گیری‌شده ۱ ردیف ⇒ ۷ statement، ۴ ردیف ⇒ ۱۳.
۴) ادعای «درآمد اشتراک هیچ‌جای کنسول مالی خوانده نمی‌شود» درست نبود:
   `revenue_by_source` عمومی است و ردیفِ `membership_purchase` را می‌شمارد.
"""
from sqlalchemy import event
from sqlmodel import Session, select

from app.models.membership import MembershipPurchase, PurchaseStatus
from app.models.transaction import FinancialTransaction
from app.models.user import User, UserRole
from app.models.venue import Venue

from conftest import test_engine
from helpers import auth

CARD_OK = "6037701150123456"
PRICE_RIAL = 1_400_000
PLANS = "/api/v1/memberships/plans"


def _mk(tag: str, role=UserRole.VENUE_MANAGER) -> tuple:
    """یک مدیر/ادمین + یک باشگاه؛ (phone, venue_id) برمی‌گرداند."""
    with Session(test_engine) as s:
        user = User(phone=f"0912770{tag}", full_name=f"شخص {tag}", hashed_password="x",
                    role=role, is_verified=True)
        s.add(user)
        s.commit()
        s.refresh(user)
        venue = Venue(name=f"باشگاه {tag}", address="قم", latitude=34.64, longitude=50.87,
                      phone="025", manager_id=user.id, category="gym")
        s.add(venue)
        s.commit()
        s.refresh(venue)
        return user.phone, venue.id


def _customer(tag: str) -> str:
    with Session(test_engine) as s:
        s.add(User(phone=f"0912771{tag}", full_name="ورزشکار", hashed_password="x",
                   role=UserRole.USER, is_verified=True))
        s.commit()
    return f"0912771{tag}"


def _plan(client, phone: str, venue_id: int, **over) -> int:
    body = {"venue_id": venue_id, "title": "پک ۱۰ جلسه", "plan_type": "sessions_pack",
            "price": PRICE_RIAL, "sessions_count": 10, "duration_days": None}
    body.update(over)
    r = client.post(PLANS, json=body, headers=auth(phone))
    assert r.status_code == 201, r.text
    return r.json()["id"]


def _deactivate(client, phone: str, plan_id: int) -> None:
    r = client.delete(f"{PLANS}/{plan_id}", headers=auth(phone))
    assert r.status_code == 200, r.text


# ─────────────── ۱) پرداختِ پلنِ غیرفعال ───────────────

def test_pay_refuses_a_plan_deactivated_after_the_invoice(client):
    mgr_phone, venue_id = _mk("001")
    cust = _customer("001")
    plan_id = _plan(client, mgr_phone, venue_id)

    inv = client.post("/api/v1/memberships/purchases", json={"plan_id": plan_id},
                      headers=auth(cust))
    assert inv.status_code == 201, inv.text
    pid = inv.json()["id"]

    _deactivate(client, mgr_phone, plan_id)

    r = client.post(f"/api/v1/memberships/purchases/{pid}/pay",
                    json={"card_number": CARD_OK, "cvv": "123"}, headers=auth(cust))
    assert r.status_code == 400, r.text
    assert "غیرفعال" in r.json()["detail"]

    with Session(test_engine) as s:
        p = s.get(MembershipPurchase, pid)
        assert p.status == PurchaseStatus.PENDING            # نه PAID، نه CANCELLED
        assert p.paid_at is None and p.transaction_id is None
        assert p.sessions_remaining is None
        # دفتر کل هم نباید ردیف بخورد، وگرنه پولی که گرفته نشده ثبت می‌شد
        key = f"membership-purchase:{pid}"
        assert s.exec(select(FinancialTransaction).where(
            FinancialTransaction.idempotency_key == key)).first() is None


def test_new_purchase_of_a_deactivated_plan_is_refused(client):
    mgr_phone, venue_id = _mk("002")
    cust = _customer("002")
    plan_id = _plan(client, mgr_phone, venue_id)
    _deactivate(client, mgr_phone, plan_id)
    r = client.post("/api/v1/memberships/purchases", json={"plan_id": plan_id},
                    headers=auth(cust))
    assert r.status_code == 400, r.text


# ─────────────── ۲) نگهبانِ include_inactive ───────────────

def test_inactive_plans_need_the_venue_manager(client):
    mgr_phone, venue_id = _mk("003")
    other_phone, other_venue = _mk("004")
    cust = _customer("003")
    plan_id = _plan(client, mgr_phone, venue_id)
    _deactivate(client, mgr_phone, plan_id)

    guest = client.get(PLANS, params={"venue_id": venue_id, "include_inactive": True})
    assert guest.status_code == 403, guest.text

    stranger = client.get(PLANS, params={"venue_id": venue_id, "include_inactive": True},
                          headers=auth(other_phone))
    assert stranger.status_code == 403, stranger.text

    customer = client.get(PLANS, params={"venue_id": venue_id, "include_inactive": True},
                          headers=auth(cust))
    assert customer.status_code == 403, customer.text

    # بی venue_id هم کسی حق فهرستِ نامحدودِ پلن‌های باطل‌شده را ندارد
    broad = client.get(PLANS, params={"include_inactive": True}, headers=auth(mgr_phone))
    assert broad.status_code == 403, broad.text

    owner = client.get(PLANS, params={"venue_id": venue_id, "include_inactive": True},
                       headers=auth(mgr_phone))
    assert owner.status_code == 200, owner.text
    assert [p["id"] for p in owner.json()] == [plan_id]
    assert owner.json()[0]["is_active"] is False


def test_super_admin_sees_inactive_without_a_venue_filter(client):
    mgr_phone, venue_id = _mk("005")
    sup_phone, _ = _mk("006", role=UserRole.SUPER_ADMIN)
    plan_id = _plan(client, mgr_phone, venue_id)
    _deactivate(client, mgr_phone, plan_id)

    r = client.get(PLANS, params={"include_inactive": True}, headers=auth(sup_phone))
    assert r.status_code == 200, r.text
    assert plan_id in [p["id"] for p in r.json()]


def test_public_list_still_hides_inactive_and_needs_no_token(client):
    mgr_phone, venue_id = _mk("007")
    plan_id = _plan(client, mgr_phone, venue_id)
    _deactivate(client, mgr_phone, plan_id)

    guest = client.get(PLANS, params={"venue_id": venue_id})
    assert guest.status_code == 200, guest.text
    assert guest.json() == []
    # فعال‌ها برای مهمان دیده می‌شوند (همان رفتارِ صفحهٔ سالن)
    again = _plan(client, mgr_phone, venue_id, title="پک فعال")
    guest2 = client.get(PLANS, params={"venue_id": venue_id})
    assert [p["id"] for p in guest2.json()] == [again]


# ─────────────── ۳) N+1 در لیست خریدها ───────────────

def _seed_purchases(venue_id: int, plan_id: int, n: int) -> None:
    with Session(test_engine) as s:
        for i in range(n):
            cust = User(phone=f"091277200{i}", full_name=f"ورزشکار {i}",
                        hashed_password="x", role=UserRole.USER, is_verified=True)
            s.add(cust)
            s.commit()
            s.refresh(cust)
            s.add(MembershipPurchase(plan_id=plan_id, user_id=cust.id, venue_id=venue_id,
                                     amount=PRICE_RIAL, status=PurchaseStatus.PAID))
            s.commit()


def test_purchases_list_statements_do_not_grow_with_rows(client):
    """۲×N statement حذف شد: شمارش با before_cursor_execute، سطح unit/SQLite."""
    mgr_phone, venue_id = _mk("008")
    plan_id = _plan(client, mgr_phone, venue_id)
    _seed_purchases(venue_id, plan_id, 4)

    def measure(limit: int) -> int:
        seen = []
        receiver = lambda *a: seen.append(a[2])  # noqa: E731
        event.listen(test_engine, "before_cursor_execute", receiver)
        try:
            r = client.get(f"/api/v1/memberships/venue/{venue_id}/purchases",
                           params={"limit": limit}, headers=auth(mgr_phone))
            assert r.status_code == 200, r.text
            rows = r.json()
            assert all(x["plan_title"] and x["venue_name"] for x in rows), rows
            return len(seen)
        finally:
            event.remove(test_engine, "before_cursor_execute", receiver)

    one = measure(1)
    four = measure(4)
    # پیش از رفع: one=۷ و four=۱۳ (یعنی +۲ به ازای هر ردیف). حالا باید ثابت بماند.
    assert four == one, f"per-row queries are back: 1 row={one}, 4 rows={four}"
    assert one <= 7, f"baseline grew: {one}"


# ─────────────── ۴) درآمد اشتراک در کنسول مالی خوانده می‌شود ───────────────

def test_membership_income_is_counted_in_revenue_by_source(client):
    """تصحیحِ ادعای راند ۱۸: `revenue_by_source` منبع را عمومی گروه‌بندی می‌کند.

    آنچه واقعاً درست بود این است که **مغایرگیریِ درگاه** اشتراک را نمی‌بیند، چون
    ردیفِ `BookingPayment` ندارد (C14) — و این به‌خودِ طراحی است، نه باگِ خواندن.
    """
    mgr_phone, venue_id = _mk("009")
    cust = _customer("009")
    plan_id = _plan(client, mgr_phone, venue_id)
    inv = client.post("/api/v1/memberships/purchases", json={"plan_id": plan_id},
                      headers=auth(cust))
    pid = inv.json()["id"]
    paid = client.post(f"/api/v1/memberships/purchases/{pid}/pay",
                       json={"card_number": CARD_OK, "cvv": "123"}, headers=auth(cust))
    assert paid.status_code == 200, paid.text

    r = client.get("/api/v1/finance/revenue/by-source", params={"venue_id": venue_id},
                   headers=auth(mgr_phone))
    assert r.status_code == 200, r.text
    row = next((s for s in r.json()["by_source"] if s["source"] == "membership_purchase"),
               None)
    assert row is not None, r.json()
    assert row["income"] == PRICE_RIAL          # ریال، همان مبلغ فاکتور (بدون ۱۰×)
    assert row["count"] == 1
    assert r.json()["total"] >= PRICE_RIAL
