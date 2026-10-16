# backend/tests/test_coupon_burn_and_edit_guard.py
"""عمرِ ردیف مصرف کوپن و نگهبان ویرایش — دو نقص راند ۱۶.

۱) لغو رزروِ **پرداخت‌شده** کوپن یک‌بارمصرف را آزاد می‌کرد و ردیف redemption را
   حذف می‌کرد ⇒ چرخۀ رزرو→لغو، کد را برای همیشه دوباره قابل مصرف می‌کرد.
۲) `PUT /coupons/{id}` نگهبان «درصد ≤ ۱۰۰» را فقط در `POST` می‌خواند ⇒ ویرایش
   می‌توانست percent=۱٬۰۰۰٪ بسازد (تخفیفِ کل مبلغ ⇒ رزروِ رایگان).
"""
from datetime import date, time as dtime, timedelta

import pytest
from sqlmodel import Session, select

import app.services.pending_booking_service as pbs_module
import app.utils.rate_limit as rate_limit_module
from app.models.coupon import Coupon, CouponRedemption
from app.models.slot import Slot, SlotStatus
from app.models.user import User, UserRole
from app.models.venue import Venue, VenuePaymentMode
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
                  phone="0912", manager_id=manager_id,
                  payment_mode=VenuePaymentMode.PAY_IN_PLACE)
        s.add(v)
        s.commit()
        return v.id


def _slot(s, vid, price=250000):
    slot = Slot(venue_id=vid, slot_date=date.today() + timedelta(days=2),
                start_time=dtime(18, 0), duration=90,
                base_price=price, current_price=price, status=SlotStatus.AVAILABLE)
    s.add(slot)
    s.commit()
    return slot.id


def _setup(tag):
    m_id, m = _user(f"0935{tag}000001", UserRole.VENUE_MANAGER)
    u_id, u = _user(f"0935{tag}000002")
    v = _venue(m_id)
    return {"m": m, "u": u, "u_id": u_id, "v": v}


def _mk_coupon(client, mgr, code, venue_id=None, **over):
    body = {"code": code, "venue_id": venue_id, "discount_type": "percent",
            "value": 2000, "per_user_limit": 1}
    body.update(over)
    return client.post("/api/v1/coupons/", json=body, headers=auth(mgr))


def _book_and_confirm(client, mgr, user, slot_id, code):
    r = client.post("/api/v1/bookings/", json={"slot_id": slot_id, "discount_code": code},
                    headers=auth(user))
    assert r.status_code == 200, r.text
    assert r.json()["payment_amount"] == 200000
    conf = client.post(f"/api/v1/bookings/pending/{r.json()['id']}/confirm",
                       headers=auth(mgr))
    assert conf.status_code == 200, conf.text
    return conf.json()["id"]


def _pay(client, user, booking_id):
    inv = client.post("/api/v1/payments/", json={"booking_id": booking_id}, headers=auth(user))
    assert inv.status_code == 201, inv.text
    r = client.post(f"/api/v1/payments/{inv.json()['id']}/pay",
                    json={"card_number": "6037991122334455", "cvv": "123"}, headers=auth(user))
    assert r.status_code == 200, r.text


# ─────────────── ۱) لغوِ رزروِ پرداخت‌شده کوپن را نسوزاند ───────────────

def test_cancel_of_paid_booking_keeps_coupon_burned(client, fake_redis):
    a = _setup("11")
    assert _mk_coupon(client, a["m"], "BURN1", venue_id=a["v"]).status_code == 200
    with _fresh() as s:
        s1 = _slot(s, a["v"])
        s2 = _slot(s, a["v"])
    bid = _book_and_confirm(client, a["m"], a["u"], s1, "BURN1")
    _pay(client, a["u"], bid)

    assert client.delete(f"/api/v1/bookings/{bid}", headers=auth(a["u"])).status_code == 200

    with _fresh() as s:
        red = s.exec(select(CouponRedemption).where(
            CouponRedemption.booking_id == bid)).first()
        assert red is not None, "ردیف مصرفِ یک رزروِ پرداخت‌شده نباید حذف شود"
        assert red.amount_discounted == 50000
        assert s.exec(select(Coupon)).first().uses_count == 1

    # و مهم‌تر: چرخۀ رزرو→پرداخت→لغو نباید کدِ یک‌بارمصرف را دوباره بدهد
    r = client.post("/api/v1/bookings/", json={"slot_id": s2, "discount_code": "BURN1"},
                    headers=auth(a["u"]))
    assert r.status_code == 400, f"کد دوباره مصرف شد: {r.json()}"
    assert "سقف" in r.json()["detail"]


def test_cancel_of_unpaid_booking_still_releases_coupon(client, fake_redis):
    """دفاع در برابر رفعِ بیش‌ازحد: چیزی پرداخت نشده ⇒ کد نباید بسوزد."""
    a = _setup("12")
    assert _mk_coupon(client, a["m"], "FREE1", venue_id=a["v"]).status_code == 200
    with _fresh() as s:
        s1 = _slot(s, a["v"])
        s2 = _slot(s, a["v"])
    bid = _book_and_confirm(client, a["m"], a["u"], s1, "FREE1")

    assert client.delete(f"/api/v1/bookings/{bid}", headers=auth(a["u"])).status_code == 200
    with _fresh() as s:
        assert s.exec(select(CouponRedemption)).first() is None
        assert s.exec(select(Coupon)).first().uses_count == 0

    r = client.post("/api/v1/bookings/", json={"slot_id": s2, "discount_code": "FREE1"},
                    headers=auth(a["u"]))
    assert r.status_code == 200, r.text


# ─────────────── ۲) نگهبان درصد در ویرایش ───────────────

def test_update_cannot_push_percent_above_100(client, fake_redis):
    a = _setup("13")
    cid = _mk_coupon(client, a["m"], "PCT20", venue_id=a["v"]).json()["id"]
    r = client.put(f"/api/v1/coupons/{cid}", json={"value": 100000}, headers=auth(a["m"]))
    assert r.status_code == 400, f"ویرایش بدون نگهبان٪ قبول شد: {r.text}"
    with _fresh() as s:
        assert s.exec(select(Coupon).where(Coupon.id == cid)).first().value == 2000


def test_update_switching_type_to_percent_is_validated(client, fake_redis):
    """فیکس ۵۰٬۰۰۰ ریالی ⇒ percent با همان value یعنی ۵۰۰٪ — جفتِ نهایی باید سنجیده شود."""
    a = _setup("14")
    cid = _mk_coupon(client, a["m"], "FIXED50", venue_id=a["v"],
                     discount_type="fixed", value=50000).json()["id"]
    r = client.put(f"/api/v1/coupons/{cid}",
                   json={"discount_type": "percent", "value": 50000}, headers=auth(a["m"]))
    assert r.status_code == 400, r.text
    with _fresh() as s:
        c = s.exec(select(Coupon).where(Coupon.id == cid)).first()
        assert c.discount_type.value == "fixed" and c.value == 50000


def test_legal_update_still_works(client, fake_redis):
    a = _setup("15")
    cid = _mk_coupon(client, a["m"], "OK10", venue_id=a["v"]).json()["id"]
    r = client.put(f"/api/v1/coupons/{cid}", json={"value": 1000}, headers=auth(a["m"]))
    assert r.status_code == 200, r.text
    assert r.json()["value"] == 1000
    with _fresh() as s:
        assert s.exec(select(Coupon).where(Coupon.id == cid)).first().value == 1000
    # و ۱۰۰٪ دقیقاً مجاز است (کدِ رایگانِ عمدی)
    r = client.put(f"/api/v1/coupons/{cid}", json={"value": 10000}, headers=auth(a["m"]))
    assert r.status_code == 200, r.text
