# backend/tests/test_coupon_redemption_release_audit.py
"""C24.3/C24.4: «چه کسی، از کدام مسیر» آزادسازیِ مصرف را ثبت می‌کند + خطاها دیگر بی‌صدا نیستند.

تا راند ۲۹ لغو/رد یک رزرو ردیفِ `coupon_redemptions` را `ACTIVE → RELEASED` می‌برد، ولی
نمی‌گفت مدیری که رزرو معلق را رد کرد، خودِ مشتری که پیش از تأیید لغو کرد، یا جاروبِ
Celery سه روز بعد سوخت — و هر دو فراخوانندهٔ `release_*` مقدارِ bool برگشتی را نادیده
می‌گرفتند (گرهٔ C24.4).

سطح: unit/SQLite از مسیر API + repository؛ شاهدِ شکلِ statement (یک UPDATE نگهبان‌دار
که همزمان `status/released_at/released_by/released_via` را می‌نویسد) و caplog برای
دو حالتِ refusal.
"""
from datetime import date, timedelta
from datetime import time as dtime
import json as _json
from datetime import datetime, timezone, timedelta as td

import pytest
from sqlalchemy import event, text as sa_text
from sqlmodel import Session, select

import app.services.pending_booking_service as pbs_module
import app.utils.rate_limit as rate_limit_module
from app.models.coupon import Coupon, CouponRedemption, RedemptionStatus, ReleaseVia
from app.models.slot import Slot, SlotStatus
from app.models.user import User, UserRole
from app.models.venue import Venue, VenuePaymentMode
from app.repositories.coupon_repository import CouponRedemptionRepository, CouponRepository
from app.services.coupon_service import CouponService
from app.tasks.pending_booking_tasks import cleanup_expired_pending_bookings

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


def _red_row():
    """نمایِ سادهٔ ردیفِ مصرف."""
    with Session(test_engine) as s:
        red = s.exec(select(CouponRedemption)).first()
        return {
            "id": red.id, "status": red.status, "released_at": red.released_at,
            "released_by": red.released_by, "released_via": red.released_via,
            "booking_id": red.booking_id, "amount_discounted": red.amount_discounted,
        }


def _capture(fn):
    """statementهای داخل-تراکنشِ این فراخوانی."""
    captured = []

    @event.listens_for(test_engine, "before_cursor_execute")
    def _recv(conn, cursor, statement, parameters, context, executemany):
        captured.append(statement)

    try:
        result = fn()
    finally:
        event.remove(test_engine, "before_cursor_execute", _recv)
    return result, [" ".join(st.split()).lower() for st in captured]


# ─────────────── ۱) actor و via روی هر مسیر درست نوشته می‌شود ───────────────

def test_manager_rejection_stamps_the_actor_and_path(client, fake_redis):
    a = _setup("A01")
    _mk_coupon(client, a["mgr"], "REJ1", a["venue"])
    pid = _book(client, a["cust"], a["slots"][0], "REJ1").json()["id"]
    assert client.post(f"/api/v1/bookings/pending/{pid}/reject",
                       headers=auth(a["mgr"])).status_code == 200
    row = _red_row()
    assert row["status"] == RedemptionStatus.RELEASED
    assert row["released_by"] is not None
    with Session(test_engine) as s:
        mgr_id = s.exec(select(User).where(User.phone == a["mgr"])).one().id
    assert row["released_by"] == mgr_id
    assert row["released_via"] == ReleaseVia.PENDING_REJECTED.value


def test_customer_cancel_of_pending_stamps_self_and_path(client, fake_redis):
    a = _setup("A02")
    _mk_coupon(client, a["mgr"], "CAN1", a["venue"])
    pid = _book(client, a["cust"], a["slots"][0], "CAN1").json()["id"]
    assert client.delete(f"/api/v1/bookings/pending/{pid}",
                         headers=auth(a["cust"])).status_code == 200
    row = _red_row()
    assert row["status"] == RedemptionStatus.RELEASED
    with Session(test_engine) as s:
        uid = s.exec(select(User).where(User.phone == a["cust"])).one().id
    assert row["released_by"] == uid
    assert row["released_via"] == ReleaseVia.PENDING_CANCELLED.value


def test_expiry_sweep_has_no_actor_but_names_the_path(client, fake_redis):
    a = _setup("A03")
    _mk_coupon(client, a["mgr"], "EXP1", a["venue"], max_uses=3)
    pid = _book(client, a["cust"], a["slots"][0], "EXP1").json()["id"]
    key = f"pending:booking:{pid}"
    rec = _json.loads(fake_redis.get(key))
    rec["expires_at"] = (datetime.now(timezone.utc) - td(minutes=5)).isoformat()
    fake_redis.set(key, _json.dumps(rec))
    out = cleanup_expired_pending_bookings()
    assert out["released"] == 1
    row = _red_row()
    assert row["status"] == RedemptionStatus.RELEASED
    assert row["released_by"] is None
    assert row["released_via"] == ReleaseVia.PENDING_EXPIRED.value


def test_confirm_defense_names_which_defense_fired(client, fake_redis):
    """سانس قبل از تأیید آزاد شده ⇒ CONFIRM_SLOT_LOST با actor=مدیر."""
    a = _setup("A04")
    _mk_coupon(client, a["mgr"], "DEF1", a["venue"], max_uses=3)
    pid = _book(client, a["cust"], a["slots"][0], "DEF1").json()["id"]
    # سانس را دستی آزاد کن (مثل وقتی که مدیر قبلاً آزاد کرده)
    with Session(test_engine) as s:
        sl = s.get(Slot, a["slots"][0])
        sl.status = SlotStatus.AVAILABLE
        s.add(sl)
        s.commit()
    resp = client.post(f"/api/v1/bookings/pending/{pid}/confirm",
                       headers=auth(a["mgr"]))
    assert resp.status_code == 400
    row = _red_row()
    assert row["status"] == RedemptionStatus.RELEASED
    with Session(test_engine) as s:
        mid = s.exec(select(User).where(User.phone == a["mgr"])).one().id
    assert row["released_by"] == mid
    assert row["released_via"] == ReleaseVia.CONFIRM_SLOT_LOST.value


# ─────────────── ۲) دوباره‌لغو ممیزی را خراب نمی‌کند ───────────────

def test_double_cancel_does_not_rewrite_the_audit(client, fake_redis):
    """اولین لغو توسط مشتری؛ تلاش دوم (ردِ مدیر از مسیرِ مستقیم) باید False بدهد و ستون‌ها دست‌نخورده."""
    a = _setup("A05")
    _mk_coupon(client, a["mgr"], "DBL1", a["venue"], max_uses=3)
    pid = _book(client, a["cust"], a["slots"][0], "DBL1").json()["id"]
    client.delete(f"/api/v1/bookings/pending/{pid}", headers=auth(a["cust"]))
    first = _red_row()
    with Session(test_engine) as s:
        cid = s.exec(select(User).where(User.phone == a["cust"])).one().id
    assert first["released_by"] == cid
    assert first["released_via"] == ReleaseVia.PENDING_CANCELLED.value

    # تلاشِ مستقیم برای آزادسازیِ دوباره (همان چیزی که reject در لایهٔ سرویس صدا می‌زند)
    with Session(test_engine) as s:
        rid = first["id"]
        mid = s.exec(select(User).where(User.phone == a["mgr"])).one().id
        result = CouponService.release_by_id(s, rid, actor_id=mid, via=ReleaseVia.PENDING_REJECTED)
        s.commit()
    assert result is False
    second = _red_row()
    assert second["released_by"] == first["released_by"]
    assert second["released_via"] == first["released_via"]


# ─────────────── ۳) ممیزی در همان UPDATE نگهبان‌دار نوشته می‌شود ───────────────

def test_the_audit_is_written_in_the_same_guarded_update(client, fake_redis):
    """یک UPDATE تنها؛ SET شامل released_by/released_via و WHERE شامل status guard."""
    a = _setup("A06")
    _mk_coupon(client, a["mgr"], "SHAPE1", a["venue"])
    pid = _book(client, a["cust"], a["slots"][0], "SHAPE1").json()["id"]

    def _cancel():
        return client.delete(f"/api/v1/bookings/pending/{pid}", headers=auth(a["cust"]))

    resp, statements = _capture(_cancel)
    assert resp.status_code == 200, resp.text
    flips = [st for st in statements if st.startswith("update coupon_redemptions")]
    assert len(flips) == 1, statements
    assert "set status" in flips[0] and "released_by" in flips[0] and "released_via" in flips[0]
    assert "where coupon_redemptions.id = ? and coupon_redemptions.status = ?" in flips[0]


def test_no_caller_writes_the_audit_in_a_second_statement(client, fake_redis):
    """هیچ کدی بعد از flip اصلی یک UPDATE جدا روی coupon_redemptions نمی‌زند."""
    a = _setup("A07")
    _mk_coupon(client, a["mgr"], "SING1", a["venue"])
    pid = _book(client, a["cust"], a["slots"][0], "SING1").json()["id"]
    resp, statements = _capture(
        lambda: client.delete(f"/api/v1/bookings/pending/{pid}", headers=auth(a["cust"])))
    assert resp.status_code == 200
    updates = [st for st in statements if "coupon_redemptions" in st and "update" in st]
    assert len(updates) == 1, updates


# ─────────────── ۴) refusal ها دیگر بی‌صدا نیستند ───────────────

def test_release_refusal_for_missing_row_is_logged(caplog):
    with Session(test_engine) as s:
        with caplog.at_level("WARNING"):
            assert CouponService.release_by_id(s, 999_999, via=ReleaseVia.BOOKING_CANCELLED) is False
    assert any("does not exist" in r.message for r in caplog.records)


def test_release_refusal_for_already_released_is_logged(caplog):
    a = _setup("A08")
    with Session(test_engine) as s:
        uid = s.exec(select(User).where(User.phone == a["cust"])).one().id
        c = Coupon(code="LOG1", venue_id=a["venue"], discount_type="percent",
                   value=2000, max_uses=None, per_user_limit=None)
        s.add(c)
        s.commit()
        repo = CouponRedemptionRepository(s)
        red = repo.create({"coupon_id": c.id, "user_id": uid, "amount_discounted": 1000})
        repo.mark_released(int(red.id), via=ReleaseVia.BOOKING_CANCELLED)
        s.commit()
        with caplog.at_level("WARNING"):
            assert CouponService.release_by_id(s, int(red.id), via=ReleaseVia.BOOKING_CANCELLED) is False
    assert any("already RELEASED" in r.message for r in caplog.records)


def test_a_coupon_free_cancel_stays_silent(client, fake_redis, caplog):
    """رزروی بدون کد تخفیف لغو شود ⇒ هیچ warningای دربارهٔ کوپن نباید باشد."""
    a = _setup("A09")
    pid = _book(client, a["cust"], a["slots"][0], "").json()["id"]
    with caplog.at_level("WARNING"):
        resp = client.delete(f"/api/v1/bookings/pending/{pid}", headers=auth(a["cust"]))
    assert resp.status_code == 200
    assert not any("coupon" in r.message.lower() for r in caplog.records)


def test_expiry_sweep_logs_when_release_raises(client, fake_redis, caplog, monkeypatch):
    """اگر release در sweep خطا دهد، pass جایگزین warning شده است (گرهٔ C24.4)."""
    a = _setup("A10")
    _mk_coupon(client, a["mgr"], "ERR1", a["venue"], max_uses=3)
    pid = _book(client, a["cust"], a["slots"][0], "ERR1").json()["id"]
    key = f"pending:booking:{pid}"
    rec = _json.loads(fake_redis.get(key))
    rec["expires_at"] = (datetime.now(timezone.utc) - td(minutes=5)).isoformat()
    fake_redis.set(key, _json.dumps(rec))

    from app.services import booking_service as bs_mod
    original = bs_mod.BookingService.release_pending_promotions
    called = []

    def _raise(uow, pending, *, actor_id=None, via):
        called.append(True)
        raise RuntimeError("boom")

    monkeypatch.setattr(bs_mod.BookingService, "release_pending_promotions", _raise)
    with caplog.at_level("WARNING"):
        out = cleanup_expired_pending_bookings()
    assert called
    assert out["released"] == 1
    assert any("could not release" in r.message for r in caplog.records)


# ─────────────── ۵) API فیلدهای جدید را نشان می‌دهد ───────────────

def test_the_api_exposes_releaser_name_and_via(client, fake_redis):
    a = _setup("A11")
    cid = _mk_coupon(client, a["mgr"], "VIS1", a["venue"]).json()["id"]
    pid = _book(client, a["cust"], a["slots"][0], "VIS1").json()["id"]
    client.post(f"/api/v1/bookings/pending/{pid}/reject", headers=auth(a["mgr"]))
    items = client.get(f"{COUPONS}{cid}/redemptions", headers=auth(a["mgr"])).json()["items"]
    assert len(items) == 1
    item = items[0]
    assert item["released_by"] is not None
    assert item["released_by_name"] == "مدیر"
    assert item["released_via"] == ReleaseVia.PENDING_REJECTED.value


def test_deleted_releaser_still_shows_the_row(client, fake_redis):
    """outer join: اگر کاربرِ عامل دیگر وجود نداشته باشد، ردیف گم نمی‌شود و نام None است."""
    a = _setup("A12")
    cid = _mk_coupon(client, a["mgr"], "DEL1", a["venue"]).json()["id"]
    pid = _book(client, a["cust"], a["slots"][0], "DEL1").json()["id"]
    client.post(f"/api/v1/bookings/pending/{pid}/reject", headers=auth(a["mgr"]))
    # released_by را به یک id خیالی تغییر بده (بدون درگیر شدن با FK واقعی)
    with Session(test_engine) as s:
        s.execute(sa_text("UPDATE coupon_redemptions SET released_by = :fake WHERE released_by IS NOT NULL"),
                  {"fake": 999_999})
        s.commit()
    items = client.get(f"{COUPONS}{cid}/redemptions", headers=auth(a["mgr"])).json()["items"]
    assert len(items) == 1
    assert items[0]["released_by"] == 999_999
    assert items[0]["released_by_name"] is None
    assert items[0]["released_via"] == ReleaseVia.PENDING_REJECTED.value


def test_stats_and_paging_are_unaffected_by_the_join(client, fake_redis):
    """total/stats دقیقاً مثل قبل هستند؛ outer join صفحۀ کمتری نمی‌گیرد."""
    a = _setup("A13")
    cid = _mk_coupon(client, a["mgr"], "STA1", a["venue"], max_uses=5, per_user_limit=None).json()["id"]
    # سه مصرف زنده
    for i in range(3):
        _book(client, a["cust"], a["slots"][i], "STA1")
    # یکی لغو
    pid = _book(client, a["cust"], a["slots"][3], "STA1").json()["id"]
    client.delete(f"/api/v1/bookings/pending/{pid}", headers=auth(a["cust"]))

    page = client.get(f"{COUPONS}{cid}/redemptions?limit=10&offset=0",
                      headers=auth(a["mgr"])).json()
    assert page["total"] == 4
    stats = page["stats"]
    assert stats["active_count"] == 3
    assert stats["released_count"] == 1
    assert len(page["items"]) == 4
