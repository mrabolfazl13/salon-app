# backend/tests/test_coupon_redemption_paging_and_stats.py
"""صفحه‌بندیِ واقعی، صافیِ سمتِ سرور و سرجمعِ «زنده در برابرِ برگشتی» (راند ۲۸).

سه گرهٔ هم‌خانواده بسته می‌شوند:

C22.3 (راند ۲۵) و C24.1 (راند ۲۷) — APIِ مصرف `limit`/`offset` را می‌فهمید ولی UI یک
تکه‌ی ۲۰۰ تایی می‌گرفت و «فقط زنده‌ها» را در JS فیلتر می‌کرد. پاسخِ آرایه‌ای هیچ راهی
برای فهمیدنِ «چند ردیف مانده» نداشت، پس عددی که مدیر می‌دید عددِ *صفحه* بود نه عددِ
کوپن. رفع: پاسخ به `CouponRedemptionPage` (items/total/limit/offset/status/stats)
تبدیل شد و `status` به خودِ SQL رفت.

C24.2 (راند ۲۷) — لغوِ یک مصرف از راند ۲۷ ردیف را نگه می‌دارد، ولی مبلغش در هیچ
جمعی شمرده نمی‌شد؛ «چقدر تخفیف دادم و چقدر برگشت» بی‌پاسخ می‌ماند. رفع:
`stats_for_coupon` با جمعِ شرطیِ **یک SELECT** روی کلِ کوپن.

سطح: unit/SQLite از مسیر API + شکلِ statement.
"""
from datetime import date, timedelta
from datetime import time as dtime

import pytest
from sqlalchemy import event
from sqlmodel import Session, select

import app.services.pending_booking_service as pbs_module
import app.utils.rate_limit as rate_limit_module
from app.models.coupon import Coupon, CouponRedemption, RedemptionStatus
from app.models.slot import Slot, SlotStatus
from app.models.user import User, UserRole
from app.models.venue import Venue, VenuePaymentMode
from app.repositories.coupon_repository import CouponRedemptionRepository

from conftest import test_engine
from helpers import auth, FakeRedis

PRICE = 250_000          # ۲۰٪ آن = ۵۰٬۰۰۰ ریال تخفیف
COUPONS = "/api/v1/coupons/"


@pytest.fixture()
def fake_redis(monkeypatch):
    fake = FakeRedis()
    monkeypatch.setattr(pbs_module, "_client", fake)
    monkeypatch.setattr(rate_limit_module, "_client", fake)
    return fake


def _user(s: Session, phone: str, name: str, role=UserRole.USER) -> str:
    s.add(User(phone=phone, full_name=name, hashed_password="x",
               role=role, is_verified=True))
    s.commit()
    return phone


def _venue(s: Session, mgr_phone: str, tag: str) -> int:
    mgr = s.exec(select(User).where(User.phone == mgr_phone)).one()
    v = Venue(name=f"سالن {tag}", address="آ", latitude=35.7, longitude=51.4,
              phone="0912", manager_id=mgr.id,
              payment_mode=VenuePaymentMode.PAY_IN_PLACE)
    s.add(v)
    s.commit()
    return int(v.id)


def _slots(s: Session, venue_id: int, n: int) -> list:
    out = []
    for i in range(n):
        sl = Slot(venue_id=venue_id, slot_date=date.today() + timedelta(days=2 + i),
                  start_time=dtime(17, 0), duration=90, base_price=PRICE,
                  current_price=PRICE, status=SlotStatus.AVAILABLE)
        s.add(sl)
        s.commit()
        out.append(int(sl.id))
    return out


def _setup(tag, customers=3):
    """یک سالن با مدیرش، سرپرست سیستم، یک مدیر رقیب و `customers` مشتریِ متمایز."""
    with Session(test_engine) as s:
        sup = _user(s, f"0912{tag}900001", "سرپرست", UserRole.SUPER_ADMIN)
        mgr_a = _user(s, f"0912{tag}900002", "مدیر الف", UserRole.VENUE_MANAGER)
        mgr_b = _user(s, f"0912{tag}900003", "مدیر ب", UserRole.VENUE_MANAGER)
        v_a = _venue(s, mgr_a, f"{tag}الف")
        v_b = _venue(s, mgr_b, f"{tag}ب")
        custs = [_user(s, f"0935{tag}91000{i}", f"مشتری {i}") for i in range(1, customers + 1)]
        slots_a = _slots(s, v_a, customers + 3)
        slots_b = _slots(s, v_b, 2)
    return {"sup": sup, "mgr_a": mgr_a, "mgr_b": mgr_b, "custs": custs,
            "venue_a": v_a, "venue_b": v_b, "slots_a": slots_a, "slots_b": slots_b}


def _mk_coupon(client, mgr, code, venue_id, **extra):
    body = {"code": code, "venue_id": venue_id, "discount_type": "percent",
            "value": 2000, "max_uses": None, "per_user_limit": None}
    body.update(extra)
    return client.post(COUPONS, json=body, headers=auth(mgr))


def _book(client, phone, slot_id, code):
    return client.post("/api/v1/bookings/", json={"slot_id": slot_id,
                                                  "discount_code": code},
                       headers=auth(phone))


def _page(client, mgr, coupon_id, **params):
    return client.get(f"{COUPONS}{coupon_id}/redemptions", params=params,
                      headers=auth(mgr))


def _use(client, a, code, n):
    """`n` مصرفِ موفقِ زنده روی یک کوپن (هر کدام با مشتری و سانسِ خودش)."""
    for i in range(n):
        r = _book(client, a["custs"][i], a["slots_a"][i], code)
        assert r.status_code == 200, r.text


def _confirm_and_cancel(client, a, i, code):
    """رزروی که هنوز پرداخت نشده را لغو می‌کند ⇒ ردیفش RELEASED می‌شود (راند ۲۷)."""
    pending = _book(client, a["custs"][i], a["slots_a"][i], code)
    assert pending.status_code == 200, pending.text
    bid = client.post(f"/api/v1/bookings/pending/{pending.json()['id']}/confirm",
                      headers=auth(a["mgr_a"])).json()["id"]
    assert client.delete(f"/api/v1/bookings/{bid}",
                         headers=auth(a["custs"][i])).status_code == 200
    return bid


# ─────────────── C22.3/C24.1 — صفحه‌بندیِ واقعی ───────────────

def test_the_response_is_a_page_with_a_total_not_a_bare_list(client, fake_redis):
    a = _setup("821")
    cid = _mk_coupon(client, a["mgr_a"], "ENV1", a["venue_a"]).json()["id"]
    _use(client, a, "ENV1", 1)

    r = _page(client, a["mgr_a"], cid)
    assert r.status_code == 200, r.text
    body = r.json()
    assert set(body) == {"items", "total", "limit", "offset", "status", "stats"}
    assert body["total"] == 1
    assert body["offset"] == 0
    # پیش‌فرضِ ۲۰۰ تاییِ راند ۲۵ جای خودش را به صفحۀ کوچک داد
    assert body["limit"] == 50
    assert len(body["items"]) == 1


def test_total_counts_every_row_while_items_are_one_page(client, fake_redis):
    a = _setup("822", customers=3)
    cid = _mk_coupon(client, a["mgr_a"], "TOT1", a["venue_a"]).json()["id"]
    _use(client, a, "TOT1", 3)

    first = _page(client, a["mgr_a"], cid, limit=2).json()
    assert len(first["items"]) == 2
    assert first["total"] == 3              # «۳ تا هست» را صفحه نمی‌پاید

    tail = _page(client, a["mgr_a"], cid, limit=2, offset=2).json()
    assert [r["user_phone"] for r in tail["items"]] == [a["custs"][0]]
    assert tail["total"] == 3


def test_pages_never_repeat_or_drop_a_row(client, fake_redis):
    a = _setup("823", customers=3)
    cid = _mk_coupon(client, a["mgr_a"], "WALK1", a["venue_a"]).json()["id"]
    _use(client, a, "WALK1", 3)

    seen = []
    for offset in (0, 1, 2, 3):
        page = _page(client, a["mgr_a"], cid, limit=1, offset=offset).json()
        seen += [r["id"] for r in page["items"]]
        assert page["total"] == 3
    assert len(seen) == len(set(seen)) == 3     # tie-break روی id: بی‌تکرار و بی‌ جا‌مانده


def test_the_status_filter_is_applied_in_sql_not_after_the_page(client, fake_redis):
    """قلبِ C24.1: «فقط زنده‌ها» باید پیش از صفحه‌شدنِ ردیف‌ها در SQL اعمال شود.

    اگر صافی در JS روی `items` می‌آمد، `total` هنوز همهٔ ردیف‌ها را می‌گفت و شمارِ
    «چند ردیفِ زنده مانده» عددِ آن صفحه بود. این تست همان را با دو عدد می‌پاید.
    """
    a = _setup("824")
    cid = _mk_coupon(client, a["mgr_a"], "FILT1", a["venue_a"]).json()["id"]
    _use(client, a, "FILT1", 1)
    _confirm_and_cancel(client, a, 1, "FILT1")

    live = _page(client, a["mgr_a"], cid, status="ACTIVE").json()
    assert live["status"] == "ACTIVE"
    assert [r["status"] for r in live["items"]] == ["ACTIVE"]
    assert live["total"] == 1

    hist = _page(client, a["mgr_a"], cid, status="RELEASED").json()
    assert [r["status"] for r in hist["items"]] == ["RELEASED"]
    assert hist["total"] == 1

    everything = _page(client, a["mgr_a"], cid).json()
    assert everything["status"] is None
    assert everything["total"] == 2


def test_an_unknown_status_is_refused_with_a_persian_message(client, fake_redis):
    a = _setup("825")
    cid = _mk_coupon(client, a["mgr_a"], "BAD1", a["venue_a"]).json()["id"]
    r = _page(client, a["mgr_a"], cid, status="live")
    assert r.status_code == 400, r.text
    assert "ACTIVE" in r.json()["detail"] and "RELEASED" in r.json()["detail"]
    # صافیِ نامعتبر نباید بی‌صدا «همه» یا «هیچ» برگرداند
    assert _page(client, a["mgr_a"], cid, status="ACTIVE").json()["total"] == 0


def test_the_filter_and_the_paging_compose(client, fake_redis):
    a = _setup("826", customers=4)
    cid = _mk_coupon(client, a["mgr_a"], "MIX1", a["venue_a"]).json()["id"]
    _use(client, a, "MIX1", 3)
    bid = _confirm_and_cancel(client, a, 3, "MIX1")

    live = _page(client, a["mgr_a"], cid, status="ACTIVE", limit=2).json()
    # صافی در SQL و *پیش از* صفحه‌شدن: total سه ردیفِ زنده است، نه دو و نه چهار
    assert live["total"] == 3 and len(live["items"]) == 2
    assert [r["status"] for r in live["items"]] == ["ACTIVE", "ACTIVE"]
    hist = _page(client, a["mgr_a"], cid, status="RELEASED").json()
    assert hist["total"] == 1 and [r["booking_id"] for r in hist["items"]] == [bid]
    assert _page(client, a["mgr_a"], cid).json()["total"] == 4
    assert {r["id"] for r in live["items"]} != {r["id"] for r in hist["items"]}


# ─────────────── C24.2 — زنده در برابرِ برگشتی ───────────────

def test_the_stats_split_live_discount_from_returned_discount(client, fake_redis):
    a = _setup("827")
    cid = _mk_coupon(client, a["mgr_a"], "STAT1", a["venue_a"]).json()["id"]
    _use(client, a, "STAT1", 1)
    _confirm_and_cancel(client, a, 1, "STAT1")

    stats = _page(client, a["mgr_a"], cid).json()["stats"]
    assert stats["total_count"] == 2
    assert stats["active_count"] == 1 and stats["released_count"] == 1
    assert stats["active_discount"] == 50_000
    assert stats["released_discount"] == 50_000       # برگشتی، ولی گم‌شده نیست


def test_the_stats_describe_the_coupon_not_the_current_page(client, fake_redis):
    a = _setup("828", customers=3)
    cid = _mk_coupon(client, a["mgr_a"], "WHOLE1", a["venue_a"]).json()["id"]
    _use(client, a, "WHOLE1", 3)

    page = _page(client, a["mgr_a"], cid, limit=1).json()
    assert len(page["items"]) == 1
    assert page["stats"]["active_count"] == 3
    assert page["stats"]["active_discount"] == 150_000


def test_an_unused_coupon_reports_zeros_not_nulls(client, fake_redis):
    a = _setup("829")
    cid = _mk_coupon(client, a["mgr_a"], "ZERO1", a["venue_a"]).json()["id"]
    body = _page(client, a["mgr_a"], cid).json()
    assert body["items"] == [] and body["total"] == 0
    assert body["stats"] == {"total_count": 0, "active_count": 0, "released_count": 0,
                             "active_discount": 0, "released_discount": 0}


def test_the_aggregate_is_one_statement_with_case_inside(client, fake_redis):
    """جمع‌ها نباید «دو کوئری» یا «یک صفحۀ JS» باشند (الگوی راندهای ۲۳/۲۴)."""
    a = _setup("830")
    cid = _mk_coupon(client, a["mgr_a"], "SQL1", a["venue_a"]).json()["id"]
    _use(client, a, "SQL1", 1)

    seen = []
    hook = lambda conn, cur, stmt, params, many, ctx: seen.append(stmt.lower())  # noqa: E731
    event.listen(test_engine, "before_cursor_execute", hook)
    try:
        with Session(test_engine) as s:
            CouponRedemptionRepository(s).stats_for_coupon(cid)
    finally:
        event.remove(test_engine, "before_cursor_execute", hook)

    selects = [q for q in seen if q.startswith("select") and "coupon_redemptions" in q]
    assert len(selects) == 1, seen
    assert "case when" in selects[0] and "sum(" in selects[0]
    assert "limit" not in selects[0]                   # سرجمع هرگز صفحه‌ای نیست


def test_the_repository_agrees_with_the_api_view(client, fake_redis):
    a = _setup("831", customers=3)
    cid = _mk_coupon(client, a["mgr_a"], "AGREE1", a["venue_a"]).json()["id"]
    _use(client, a, "AGREE1", 2)
    bid = _confirm_and_cancel(client, a, 2, "AGREE1")

    with Session(test_engine) as s:
        repo = CouponRedemptionRepository(s)
        stats = repo.stats_for_coupon(cid)
        assert repo.count_for_coupon(cid) == stats["total_count"] == 3
        assert repo.count_for_coupon(cid, RedemptionStatus.ACTIVE) == stats["active_count"] == 2
        assert repo.count_for_coupon(cid, RedemptionStatus.RELEASED) == stats["released_count"] == 1
    assert _page(client, a["mgr_a"], cid).json()["stats"] == stats
    assert _page(client, a["mgr_a"], cid, status="RELEASED").json()["items"][0]["booking_id"] == bid


# ─────────────── دامنهٔ دسترسی جابه‌جا نشد ───────────────

def test_the_page_keeps_the_same_access_rules_as_the_list(client, fake_redis):
    a = _setup("832")
    cid = _mk_coupon(client, a["mgr_a"], "SCOPE2", a["venue_a"]).json()["id"]
    _use(client, a, "SCOPE2", 1)

    assert _page(client, a["mgr_b"], cid).status_code == 403
    assert _page(client, a["custs"][0], cid).status_code == 403
    assert _page(client, a["mgr_a"], 999_999).status_code == 404
    assert _page(client, a["mgr_a"], cid).json()["total"] == 1


def test_a_global_coupon_page_is_super_admin_only_with_venue_mates_stats(client, fake_redis):
    a = _setup("833", customers=3)
    cid = _mk_coupon(client, a["sup"], "GLOBAL2", None).json()["id"]
    _use(client, a, "GLOBAL2", 3)

    assert _page(client, a["mgr_a"], cid).status_code == 403
    body = _page(client, a["sup"], cid).json()
    assert body["total"] == 3
    # کوپن سراسری: مصرف‌های همهٔ سالن‌ها، پس سرجمع هم بی‌مرزِ سالن است
    assert body["stats"]["active_discount"] == 150_000
