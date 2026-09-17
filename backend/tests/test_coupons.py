# backend/tests/test_coupons.py
"""کوپن‌ها — گیت‌های مدیر، اعمال در رزرو، ردّ صحیح‌ها، و آزادسازی در لغو/رد/انقضا."""
import json as _json
from datetime import date, datetime, time as dtime, timedelta, timezone

import pytest
from sqlmodel import Session, select

import app.services.pending_booking_service as pbs_module
import app.tasks.pending_booking_tasks as tasks_module
import app.utils.rate_limit as rate_limit_module
from app.models.booking import Booking, BookingStatus
from app.models.coupon import Coupon, CouponRedemption
from app.models.payment import BookingPaymentStatus
from app.models.slot import Slot, SlotStatus
from app.models.transaction import FinancialTransaction, TransactionType
from app.models.user import User, UserRole
from app.models.venue import Venue
from app.tasks.pending_booking_tasks import cleanup_expired_pending_bookings
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
        u = User(phone=phone, full_name="ک", hashed_password="x",
                 role=role, is_verified=True)
        s.add(u)
        s.commit()
        return u.id, u.phone


def _venue(manager_id):
    with _fresh() as s:
        v = Venue(name="کوپنی", address="آ", latitude=35.7, longitude=51.4,
                  phone="0912", manager_id=manager_id)
        s.add(v)
        s.commit()
        return v.id


def _slot(s, vid, when=None, price=250000, **kw):
    slot = Slot(venue_id=vid, slot_date=when or date.today() + timedelta(days=2),
                start_time=kw.pop("start", dtime(18, 0)), duration=90,
                base_price=price, current_price=price,
                status=SlotStatus.AVAILABLE, **kw)
    s.add(slot)
    s.commit()
    return slot.id


def _create_coupon(client, phone, vid=None, **over):
    body = {"code": over.pop("code", "SAVE20"), "venue_id": vid,
            "discount_type": "percent", "value": 2000, "per_user_limit": 1}
    body.update(over)
    return client.post("/api/v1/coupons/", headers=auth(phone), json=body)


def _setup(actors_tag="41"):
    m_id, m = _user(f"0934100000{actors_tag}", UserRole.VENUE_MANAGER)
    u_id, u = _user(f"0934100010{actors_tag}")
    u2_id, u2 = _user(f"0934100020{actors_tag}")
    sup_id, sup = _user(f"0934100030{actors_tag}", UserRole.SUPER_ADMIN)
    v1 = _venue(m_id)
    v2 = _venue(m_id)
    return {"m": m, "m_id": m_id, "u": u, "u_id": u_id,
            "u2": u2, "u2_id": u2_id, "sup": sup, "v1": v1, "v2": v2}


# ─────────────────────────── ساخت کوپن ───────────────────────────

def test_manager_creates_and_lists_own_coupons(client):
    a = _setup("1")
    r = _create_coupon(client, a["m"], a["v1"], code="VIP10")
    assert r.status_code == 200, r.text
    assert r.json()["code"] == "VIP10" and r.json()["venue_id"] == a["v1"]
    items = client.get(f"/api/v1/coupons/?venue_id={a['v1']}", headers=auth(a["m"])).json()
    assert [x["code"] for x in items] == ["VIP10"]
    assert _create_coupon(client, a["m"], a["v2"], code="vip10").status_code == 400
    assert _create_coupon(client, a["u"], a["v1"]).status_code == 403


def test_global_coupon_only_super(client):
    a = _setup("2")
    assert _create_coupon(client, a["m"], None).status_code == 403
    r = _create_coupon(client, a["sup"], None, code="FREE10")
    assert r.status_code == 200 and r.json()["venue_id"] is None


def test_coupon_validation_rules(client):
    a = _setup("3")
    assert _create_coupon(client, a["m"], a["v1"], value=15000).status_code == 400
    body = {"code": "W3", "venue_id": a["v1"], "discount_type": "percent", "value": 2000,
            "valid_from": (datetime.now(timezone.utc) + timedelta(days=5)).isoformat(),
            "valid_until": datetime.now(timezone.utc).isoformat()}
    assert client.post("/api/v1/coupons/", json=body, headers=auth(a["m"])).status_code == 400


# ─────────────────────────── اعمال در رزرو ───────────────────────────

def test_booking_with_coupon_happy_path(client, fake_redis):
    a = _setup("4")
    assert _create_coupon(client, a["m"], a["v1"], code="SAVE20").status_code == 200
    with _fresh() as s:
        sid = _slot(s, a["v1"])
    r = client.post("/api/v1/bookings/", json={"slot_id": sid, "discount_code": "save20"},
                    headers=auth(a["u"]))  # case-insensitive
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["payment_amount"] == 200000
    assert body["discount_amount"] == 50000 and body["coupon_code"] == "SAVE20"
    with _fresh() as s:
        red = s.exec(select(CouponRedemption)).first()
        c = s.exec(select(Coupon)).first()
        assert red.user_id == a["u_id"] and red.booking_id is None and red.amount_discounted == 50000
        assert c.uses_count == 1
    # تایید مدیر → اتصال کوپن به رزرو قطعی
    r = client.post(f"/api/v1/bookings/pending/{body['id']}/confirm", headers=auth(a["m"]))
    assert r.status_code == 200, r.text
    conf = r.json()
    assert conf["payment_amount"] == 200000 and conf["discount_amount"] == 50000
    with _fresh() as s:
        b = s.get(Booking, conf["id"])
        assert b.coupon_code == "SAVE20" and b.discount_amount == 50000
        red = s.exec(select(CouponRedemption)).first()
        assert red.booking_id == b.id


def test_rejects_bad_coupons(client, fake_redis):
    a = _setup("5")
    with _fresh() as s:
        sid = _slot(s, a["v1"])
    # ناشناخته
    r = client.post("/api/v1/bookings/", json={"slot_id": sid, "discount_code": "NOPE"},
                    headers=auth(a["u"]))
    assert r.status_code == 400 and "نامعتبر" in r.json()["detail"]
    # منقضی
    past = datetime.now(timezone.utc) - timedelta(days=1)
    assert _create_coupon(client, a["m"], a["v1"], code="DEAD",
                          valid_until=past.isoformat()).status_code == 200
    r = client.post("/api/v1/bookings/", json={"slot_id": sid, "discount_code": "dead"},
                    headers=auth(a["u"]))
    assert r.status_code == 400 and "منقضی" in r.json()["detail"]
    # برای سالن دیگر
    with _fresh() as s:
        sid2 = _slot(s, a["v2"])
    assert _create_coupon(client, a["m"], a["v1"], code="S1ONLY").status_code == 200
    r = client.post("/api/v1/bookings/", json={"slot_id": sid2, "discount_code": "s1only"},
                    headers=auth(a["u"]))
    assert r.status_code == 400 and "سالن دیگری" in r.json()["detail"]
    # حد پایین مبلغ
    assert _create_coupon(client, a["m"], a["v1"], code="BIGMIN",
                          min_booking_amount=300000).status_code == 200
    r = client.post("/api/v1/bookings/", json={"slot_id": sid, "discount_code": "bigmin"},
                    headers=auth(a["u"]))
    assert r.status_code == 400 and "حداقل مبلغ" in r.json()["detail"]
    # غیرفعال پس از حذف نرم
    cid = _create_coupon(client, a["m"], a["v1"], code="OFF10").json()["id"]
    assert client.delete(f"/api/v1/coupons/{cid}", headers=auth(a["m"])).status_code == 200
    r = client.post("/api/v1/bookings/", json={"slot_id": sid, "discount_code": "off10"},
                    headers=auth(a["u"]))
    assert r.status_code == 400 and "غیرفعال" in r.json()["detail"]


def test_exhausted_and_per_user(client, fake_redis):
    a = _setup("6")
    assert _create_coupon(client, a["m"], a["v1"], code="MAX1", max_uses=1,
                          per_user_limit=None).status_code == 200
    with _fresh() as s:
        s1 = _slot(s, a["v1"])
        s2 = _slot(s, a["v1"])
    r = client.post("/api/v1/bookings/", json={"slot_id": s1, "discount_code": "MAX1"},
                    headers=auth(a["u"]))
    assert r.status_code == 200
    r = client.post("/api/v1/bookings/", json={"slot_id": s2, "discount_code": "MAX1"},
                    headers=auth(a["u2"]))
    assert r.status_code == 400 and "تکمیل" in r.json()["detail"]
    # رد کردن رزرو اول → ظرفیت آزاد؛ کاربر ۲ می‌تواند
    pid = r = client.post("/api/v1/bookings/", json={"slot_id": s2, "discount_code": "MAX1"},
                          headers=auth(a["u"]))
    assert r.status_code == 400  # سقف per-user پیش‌فرض None است اما کاربر۱ یک بار مصرف کرده؟ per_user_limit=None ⇒ بی‌سقف
    # (s1 pending هنوز سرِ جاست) — ابتدا پس زدن s1:
    pend = client.post("/api/v1/bookings/", json={"slot_id": s1, "discount_code": "MAX1"},
                       headers=auth(a["m"]))
    assert pend.status_code == 400  # سانس رزرو معلق دارد
    # کاربر ۲ روی سانس ۲ (پس از رد رزرو کاربر ۱)
    venue_pendings = client.get(f"/api/v1/bookings/venue/{a['v1']}/pending",
                                headers=auth(a["m"])).json()
    client.post(f"/api/v1/bookings/pending/{venue_pendings[0]['id']}/reject",
                headers=auth(a["m"]))
    r = client.post("/api/v1/bookings/", json={"slot_id": s2, "discount_code": "MAX1"},
                    headers=auth(a["u2"]))
    assert r.status_code == 200 and r.json()["payment_amount"] == 200000
    with _fresh() as sess:
        c = sess.exec(select(Coupon)).first()
        assert c.uses_count == 1
    # per-user limit
    assert _create_coupon(client, a["m"], a["v1"], code="PU1", max_uses=None,
                          per_user_limit=1).status_code == 200
    with _fresh() as s:
        s3 = _slot(s, a["v1"])
        s4 = _slot(s, a["v1"])
    r = client.post("/api/v1/bookings/", json={"slot_id": s3, "discount_code": "PU1"},
                    headers=auth(a["u"]))
    assert r.status_code == 200
    r = client.post("/api/v1/bookings/", json={"slot_id": s4, "discount_code": "PU1"},
                    headers=auth(a["u"]))
    assert r.status_code == 400 and "سقف" in r.json()["detail"]


# ─────────────────────────── آزادسازی ───────────────────────────

def test_cancel_pending_releases_coupon(client, fake_redis):
    a = _setup("7")
    assert _create_coupon(client, a["m"], a["v1"], code="REL1").status_code == 200
    with _fresh() as s:
        sid = _slot(s, a["v1"])
        sid2 = _slot(s, a["v1"])
    r = client.post("/api/v1/bookings/", json={"slot_id": sid, "discount_code": "REL1"},
                    headers=auth(a["u"]))
    pid = r.json()["id"]
    assert client.delete(f"/api/v1/bookings/pending/{pid}", headers=auth(a["u"])).status_code == 200
    with _fresh() as s:
        assert s.exec(select(CouponRedemption)).first() is None
        assert s.exec(select(Coupon)).first().uses_count == 0
    # دوباره قابل مصرف
    r = client.post("/api/v1/bookings/", json={"slot_id": sid2, "discount_code": "REL1"},
                    headers=auth(a["u"]))
    assert r.status_code == 200


def test_cancel_confirmed_booking_releases_coupon(client, fake_redis):
    a = _setup("8")
    assert _create_coupon(client, a["m"], a["v1"], code="REL2").status_code == 200
    with _fresh() as s:
        sid = _slot(s, a["v1"])
    bid = client.post("/api/v1/bookings/", json={"slot_id": sid, "discount_code": "REL2"},
                      headers=auth(a["u"])).json()["id"]
    conf = client.post(f"/api/v1/bookings/pending/{bid}/confirm",
                       headers=auth(a["m"])).json()["id"]
    r = client.delete(f"/api/v1/bookings/{conf}", headers=auth(a["u"]))
    assert r.status_code == 200, r.text
    with _fresh() as s:
        assert s.exec(select(CouponRedemption)).first() is None
        assert s.exec(select(Coupon)).first().uses_count == 0
        b = s.get(Booking, conf)
        assert b.status == BookingStatus.CANCELLED


def test_expiry_task_releases_coupon(client, fake_redis):
    a = _setup("9")
    assert _create_coupon(client, a["m"], a["v1"], code="RELEXP").status_code == 200
    with _fresh() as s:
        sid = _slot(s, a["v1"])
    pid = client.post("/api/v1/bookings/", json={"slot_id": sid, "discount_code": "RELEXP"},
                      headers=auth(a["u"])).json()["id"]
    # منقضی کردن رکورد معلق در Redis
    key = f"pending:booking:{pid}"
    rec = _json.loads(fake_redis.get(key))
    rec["expires_at"] = (datetime.now(timezone.utc) - minutes_ago()).isoformat()
    fake_redis.set(key, _json.dumps(rec))
    out = cleanup_expired_pending_bookings()
    assert out["released"] == 1
    with _fresh() as s:
        assert s.exec(select(Slot).where(Slot.id == sid)).first().status == SlotStatus.AVAILABLE
        assert s.exec(select(CouponRedemption)).first() is None
        assert s.exec(select(Coupon)).first().uses_count == 0


def minutes_ago():
    return timedelta(minutes=5)


def test_ledger_reflects_net_discounted_amount(client, fake_redis):
    """درآمد ثبت‌شده = مبلغ خالصِ پرداختی(کاهش‌یافته)؛ تخفیف هرگز در دفتر کل نمی‌آید."""
    a = _setup("10")
    assert _create_coupon(client, a["m"], a["v1"], code="NET").status_code == 200
    with _fresh() as s:
        sid = _slot(s, a["v1"])
    pid = client.post("/api/v1/bookings/",
                      json={"slot_id": sid, "discount_code": "NET"},
                      headers=auth(a["u"])).json()["id"]
    bid = client.post(f"/api/v1/bookings/pending/{pid}/confirm",
                      headers=auth(a["m"])).json()["id"]
    pay = client.post("/api/v1/payments/", json={"booking_id": bid},
                      headers=auth(a["u"]))
    assert pay.status_code == 201, pay.text
    pay = pay.json()
    assert pay["amount"] == 200000  # نه ۲۵۰هزارِ اولیه
    r = client.post(f"/api/v1/payments/{pay['id']}/pay",
                    json={"card_number": "6037991122334455", "cvv": "123"}, headers=auth(a["u"]))
    assert r.status_code == 200, r.text
    with _fresh() as s:
        tx = s.exec(select(FinancialTransaction).where(
            FinancialTransaction.idempotency_key == f"booking-payment:{pay['id']}")).first()
        assert tx.amount == 200000
    # لغو → بازگشت همان خالص؛ خالصِ درآمد صفر
    client.delete(f"/api/v1/bookings/{bid}", headers=auth(a["u"]))
    with _fresh() as s:
        rf = s.exec(select(FinancialTransaction).where(
            FinancialTransaction.type == TransactionType.REFUND)).first()
        assert rf.amount == 200000