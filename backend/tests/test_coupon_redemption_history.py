# backend/tests/test_coupon_redemption_history.py
"""لغوِ یک مصرف، ردیف را نمی‌سوزاند (گرهٔ C22.1 — راند ۲۷).

تا این راند چرخۀ «رزرو ← لغو/انقضا» ردیف `coupon_redemptions` را `delete` می‌کرد.
نتیجه: فهرستِ مصرفِ مدیر (راند ۲۵) تاریخچۀ کامل نبود و «چه کسی این کد را یک بار
مصرف و بعد لغو کرد؟» هیچ‌جا قابل بازیابی نبود. حالا لغو یک **گذارِ وضعیت** است:
`ACTIVE → RELEASED` با `released_at`، و ردیف سرِ جایش می‌ماند.

دو معنا باید دست‌نخورده بمانند، و این فایل همان‌ها را می‌سنجد:

* ظرفیت **دقیقاً یک بار** برمی‌گردد (`uses_count`);
* سقفِ فردی فقط ردیف‌های `ACTIVE` را می‌شمارد، پس لغو سهمِ کاربر را پر نگه نمی‌دارد.

سطح: unit/SQLite از مسیر API + خودِ repository. شاهدِ شکلِ statement (UPDATE نگهبان‌دار،
نه delete) هم همین‌جاست؛ همزمانیِ واقعی روی PostgreSQL سنجیده می‌شود، چون
`tests/conftest.py` هر تراکنش SQLite را با `BEGIN IMMEDIATE` می‌بندد.
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
from app.repositories.coupon_repository import (
    CouponRedemptionRepository, CouponRepository,
)
from app.services.coupon_service import CouponService

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


def _setup(tag):
    with Session(test_engine) as s:
        mgr_phone = _user(s, f"0912{tag}660001", "مدیر", UserRole.VENUE_MANAGER)
        mgr = s.exec(select(User).where(User.phone == mgr_phone)).one()
        v = Venue(name=f"سالن {tag}", address="آ", latitude=35.7, longitude=51.4,
                  phone="0912", manager_id=mgr.id,
                  payment_mode=VenuePaymentMode.PAY_IN_PLACE)
        s.add(v)
        s.commit()
        venue_id = int(v.id)
        cust = _user(s, f"0935{tag}660002", "مشتری")
        slots = []
        for i in range(4):
            sl = Slot(venue_id=v.id, slot_date=date.today() + timedelta(days=2 + i),
                      start_time=dtime(17, 0), duration=90, base_price=PRICE,
                      current_price=PRICE, status=SlotStatus.AVAILABLE)
            s.add(sl)
            s.commit()
            slots.append(int(sl.id))
    return {"mgr": mgr_phone, "cust": cust, "venue": venue_id, "slots": slots}


def _mk_coupon(client, mgr, code, venue_id, **over):
    body = {"code": code, "venue_id": venue_id, "discount_type": "percent",
            "value": 2000, "max_uses": None, "per_user_limit": 1}
    body.update(over)
    return client.post(COUPONS, json=body, headers=auth(mgr))


def _book(client, phone, slot_id, code):
    return client.post("/api/v1/bookings/", json={"slot_id": slot_id,
                                                 "discount_code": code},
                       headers=auth(phone))


def _coupon_id():
    with Session(test_engine) as s:
        return int(s.exec(select(Coupon)).first().id)


def _red_id():
    with Session(test_engine) as s:
        return int(s.exec(select(CouponRedemption)).first().id)


def _uses():
    with Session(test_engine) as s:
        return int(s.exec(select(Coupon)).first().uses_count)


def _row():
    """نمایِ سادهٔ ردیفِ مصرف (دیکشنری، تا بعد از بستنِ session detach ندهد)."""
    with Session(test_engine) as s:
        red = s.exec(select(CouponRedemption)).first()
        return {
            "status": red.status, "released_at": red.released_at,
            "booking_id": red.booking_id, "amount_discounted": red.amount_discounted,
            "coupon_id": red.coupon_id,
        }


def _capture(fn):
    """statementهای داخل-تراکنشِ این فراخوانی (شاهدِ شکلِ کوئری)."""
    captured = []

    @event.listens_for(test_engine, "before_cursor_execute")
    def _recv(conn, cursor, statement, parameters, context, executemany):
        captured.append(statement)

    try:
        result = fn()
    finally:
        event.remove(test_engine, "before_cursor_execute", _recv)
    return result, [" ".join(st.split()).lower() for st in captured]


# ─────────────── ۱) لغو = گذارِ وضعیت، نه حذف ───────────────

def test_cancelling_a_pending_booking_keeps_the_row_as_released(client, fake_redis):
    a = _setup("901")
    cid = _mk_coupon(client, a["mgr"], "HIST1", a["venue"]).json()["id"]
    pid = _book(client, a["cust"], a["slots"][0], "HIST1").json()["id"]
    assert client.delete(f"/api/v1/bookings/pending/{pid}",
                         headers=auth(a["cust"])).status_code == 200

    red = _row()
    assert red["status"] == RedemptionStatus.RELEASED
    assert red["released_at"] is not None
    assert red["amount_discounted"] == 50_000   # «چقدر تخفیف» هم می‌ماند
    assert _uses() == 0                         # ظرفیت برگشته است


def test_the_api_row_carries_the_status_and_release_time(client, fake_redis):
    a = _setup("902")
    cid = _mk_coupon(client, a["mgr"], "HIST2", a["venue"]).json()["id"]
    pid = _book(client, a["cust"], a["slots"][0], "HIST2").json()["id"]

    fresh = client.get(f"{COUPONS}{cid}/redemptions", headers=auth(a["mgr"])).json()
    assert [r["status"] for r in fresh] == ["ACTIVE"]
    assert fresh[0]["released_at"] is None

    client.delete(f"/api/v1/bookings/pending/{pid}", headers=auth(a["cust"]))
    kept = client.get(f"{COUPONS}{cid}/redemptions", headers=auth(a["mgr"])).json()
    assert [r["status"] for r in kept] == ["RELEASED"]
    assert kept[0]["released_at"] is not None


def test_the_flip_is_a_guarded_update_not_a_delete(client, fake_redis):
    """نگهبان داخل SQL است و delete هیچ‌جا اجرا نمی‌شود (جای `session.delete`)."""
    a = _setup("903")
    _mk_coupon(client, a["mgr"], "HIST3", a["venue"])
    pid = _book(client, a["cust"], a["slots"][0], "HIST3").json()["id"]

    def _cancel():
        return client.delete(f"/api/v1/bookings/pending/{pid}", headers=auth(a["cust"]))

    resp, statements = _capture(_cancel)
    assert resp.status_code == 200, resp.text
    assert not [st for st in statements if st.startswith("delete from coupon_redemptions")]
    flips = [st for st in statements
             if st.startswith("update coupon_redemptions set status")]
    assert len(flips) == 1, statements
    assert "where coupon_redemptions.id = ? and coupon_redemptions.status = ?" in flips[0]


# ─────────────── ۲) ظرفیت دقیقاً یک بار برمی‌گردد ───────────────

def test_a_second_release_is_refused_and_changes_nothing(client, fake_redis):
    """دوباره‌لغو (دو مسیر/کلیک) نباید یک ظرفیتِ اضافه برگرداند."""
    a = _setup("904")
    _mk_coupon(client, a["mgr"], "TWICE", a["venue"], max_uses=3, per_user_limit=None)
    _book(client, a["cust"], a["slots"][0], "TWICE")
    rid = _red_id()
    assert _uses() == 1

    with Session(test_engine) as s:
        assert CouponService.release_by_id(s, rid) is True
        s.commit()
    assert _uses() == 0

    with Session(test_engine) as s:
        assert CouponService.release_by_id(s, rid) is False
        s.commit()
    assert _uses() == 0                         # نه −۱
    assert _row()["status"] == RedemptionStatus.RELEASED


def test_releasing_an_unknown_redemption_is_false():
    with Session(test_engine) as s:
        assert CouponService.release_by_id(s, 999_999) is False
        s.rollback()


def test_release_for_booking_is_idempotent_too(client, fake_redis):
    """مسیرِ `release_for_booking` (لغوِ رزروِ قطعی) هم روی همان نگهبان می‌ایستد."""
    a = _setup("905")
    _mk_coupon(client, a["mgr"], "BYBOOK", a["venue"], max_uses=4, per_user_limit=None)
    pid = _book(client, a["cust"], a["slots"][0], "BYBOOK").json()["id"]
    bid = client.post(f"/api/v1/bookings/pending/{pid}/confirm",
                      headers=auth(a["mgr"])).json()["id"]
    assert client.delete(f"/api/v1/bookings/{bid}",
                         headers=auth(a["cust"])).status_code == 200
    assert _uses() == 0
    with Session(test_engine) as s:
        assert CouponService.release_for_booking(s, bid) is False
        s.rollback()
    assert _uses() == 0
    assert _row()["booking_id"] == bid             # «کجا مصرف شد» گم نمی‌شود


# ─────────────── ۳) سقفِ فردی فقط ACTIVE را می‌شمارد ───────────────

def test_a_released_row_does_not_fill_the_per_user_quota(client, fake_redis):
    a = _setup("906")
    _mk_coupon(client, a["mgr"], "QUOTA", a["venue"])   # per_user_limit=1
    pid = _book(client, a["cust"], a["slots"][0], "QUOTA").json()["id"]

    with Session(test_engine) as s:
        cid = _coupon_id()
        uid = s.exec(select(User).where(User.phone == a["cust"])).one().id
        assert CouponRepository(s).user_redemption_count(cid, uid) == 1

    client.delete(f"/api/v1/bookings/pending/{pid}", headers=auth(a["cust"]))
    with Session(test_engine) as s:
        cid = _coupon_id()
        uid = s.exec(select(User).where(User.phone == a["cust"])).one().id
        assert CouponRepository(s).user_redemption_count(cid, uid) == 0

    again = _book(client, a["cust"], a["slots"][1], "QUOTA")
    assert again.status_code == 200, again.text


def test_the_guard_counting_active_rows_lives_inside_the_insert(client, fake_redis):
    """INSERTِ سقفِ فردی هم باید همان شرط را داخل WHERE داشته باشد (وگرنه سهمِ مرده)."""
    a = _setup("907")
    _mk_coupon(client, a["mgr"], "SHAPE", a["venue"])
    resp, statements = _capture(
        lambda: _book(client, a["cust"], a["slots"][0], "SHAPE"))
    assert resp.status_code == 200, resp.text
    inserts = [st for st in statements if st.startswith("insert into coupon_redemptions")]
    assert len(inserts) == 1, statements
    assert "and coupon_redemptions.status = ?) < ?" in inserts[0]


def test_two_lifetimes_after_two_cancels(client, fake_redis):
    """مصرف ← لغو ← مصرف ← لغو: دو ردیف، هر دو RELEASED، ظرفیت صفر."""
    a = _setup("908")
    cid = _mk_coupon(client, a["mgr"], "TWOLIFE", a["venue"],
                     max_uses=2).json()["id"]
    for i in range(2):
        pid = _book(client, a["cust"], a["slots"][i], "TWOLIFE").json()["id"]
        assert client.delete(f"/api/v1/bookings/pending/{pid}",
                             headers=auth(a["cust"])).status_code == 200
    rows = client.get(f"{COUPONS}{cid}/redemptions", headers=auth(a["mgr"])).json()
    assert [r["status"] for r in rows] == ["RELEASED", "RELEASED"]
    assert _uses() == 0
    # و حالا که سقفِ فردی خالی است، بارِ سوم هم جا دارد
    third = _book(client, a["cust"], a["slots"][2], "TWOLIFE")
    assert third.status_code == 200, third.text


# ─────────────── ۴) مصرفِ تازه ACTIVE متولد می‌شود ───────────────

def test_a_fresh_redemption_starts_active(client, fake_redis):
    """نه مسیرِ سقف‌دار و نه مسیرِ بی‌سقف نباید ردیف را «لغوشده» بسازند."""
    a = _setup("909")
    _mk_coupon(client, a["mgr"], "BORN1", a["venue"], per_user_limit=2)
    _book(client, a["cust"], a["slots"][0], "BORN1")
    assert _row()["status"] == RedemptionStatus.ACTIVE

    b = _setup("910")
    _mk_coupon(client, b["mgr"], "BORN2", b["venue"], per_user_limit=None)
    _book(client, b["cust"], b["slots"][0], "BORN2")
    with Session(test_engine) as s:
        assert s.exec(select(CouponRedemption)
                      .where(CouponRedemption.status == RedemptionStatus.ACTIVE)
                      ).first() is not None


def test_release_does_not_touch_the_paid_booking_path(client, fake_redis):
    """راند ۱۶: لغوِ رزروِ پرداخت‌شده کوپن را آزاد نمی‌کند ⇒ ردیف هم ACTIVE می‌ماند."""
    a = _setup("911")
    cid = _mk_coupon(client, a["mgr"], "PAID1", a["venue"]).json()["id"]
    pid = _book(client, a["cust"], a["slots"][0], "PAID1").json()["id"]
    bid = client.post(f"/api/v1/bookings/pending/{pid}/confirm",
                      headers=auth(a["mgr"])).json()["id"]
    inv = client.post("/api/v1/payments/", json={"booking_id": bid},
                      headers=auth(a["cust"]))
    client.post(f"/api/v1/payments/{inv.json()['id']}/pay",
                json={"card_number": "6037991122334455", "cvv": "123"},
                headers=auth(a["cust"]))
    assert client.delete(f"/api/v1/bookings/{bid}",
                         headers=auth(a["cust"])).status_code == 200

    assert _row()["status"] == RedemptionStatus.ACTIVE
    assert _uses() == 1
    rows = client.get(f"{COUPONS}{cid}/redemptions", headers=auth(a["mgr"])).json()
    assert [r["status"] for r in rows] == ["ACTIVE"]


def test_the_repository_flip_can_stamp_a_given_time():
    """`mark_released` زمان را می‌پذیرد تا شاهدِ PG و تستِ واحد یکسان باشند."""
    from datetime import datetime, timezone

    a = _setup("912")
    with Session(test_engine) as s:
        uid = s.exec(select(User).where(User.phone == a["cust"])).one().id
        c = Coupon(code="STAMP", venue_id=a["venue"], discount_type="percent",
                   value=2000, max_uses=None, per_user_limit=None)
        s.add(c)
        s.commit()
        repo = CouponRedemptionRepository(s)
        red = repo.create({"coupon_id": c.id, "user_id": uid,
                           "amount_discounted": 1000})
        stamp = datetime(2026, 1, 2, 3, 4, 5, tzinfo=timezone.utc)
        assert repo.mark_released(int(red.id), stamp) is True
        s.commit()
        back = repo.get_by_id(int(red.id))
        assert back.status == RedemptionStatus.RELEASED
        assert back.released_at.replace(tzinfo=timezone.utc) == stamp
        # گذارِ دوم روی همان ردیف رد می‌شود (نگهبانِ status داخل WHERE)
        assert repo.mark_released(int(red.id), stamp) is False
