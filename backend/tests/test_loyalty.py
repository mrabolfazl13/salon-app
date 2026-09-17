# backend/tests/test_loyalty.py
"""وفاداری — جایزۀ تکمیل (idempotent)، خرج با سقف ۵۰٪، هدیه/تنظیم، بازگشت در لغو."""
from datetime import date, datetime, time as dtime, timedelta, timezone

import pytest
from sqlmodel import Session, select

import app.services.pending_booking_service as pbs_module
import app.utils.rate_limit as rate_limit_module
from app.models.booking import Booking, BookingStatus
from app.models.loyalty import LoyaltyPoint, LoyaltyReason
from app.models.slot import Slot, SlotStatus
from app.models.user import User, UserRole
from app.models.venue import Venue
from app.tasks.loyalty_tasks import complete_past_bookings
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
        u = User(phone=phone, full_name="ک", hashed_password="x", role=role,
                 is_verified=True)
        s.add(u)
        s.commit()
        return u.id, u.phone


def _venue(manager_id):
    with _fresh() as s:
        v = Venue(name="وفاداری", address="آ", latitude=35.7, longitude=51.4,
                  phone="0912", manager_id=manager_id)
        s.add(v)
        s.commit()
        return v.id


def _slot(s, vid, when, price=400000):
    slot = Slot(venue_id=vid, slot_date=when, start_time=dtime(11, 0), duration=90,
                base_price=price, current_price=price, status=SlotStatus.AVAILABLE)
    s.add(slot)
    s.commit()
    return slot.id


def _setup(tag):
    m_id, m = _user(f"0934200000{tag}", UserRole.VENUE_MANAGER)
    u_id, u = _user(f"0934200010{tag}")
    v = _venue(m_id)
    return {"m": m, "u": u, "u_id": u_id, "v": v}


# ─────────────────────────── موجودی و تاریخچه ───────────────────────────

def test_me_endpoint_empty_then_after_gift(client):
    a = _setup("1")
    r = client.get("/api/v1/loyalty/me", headers=auth(a["u"])).json()
    assert r["balance"] == 0 and r["history"] == [] and r["point_value_rial"] == 10000
    r = client.post(f"/api/v1/loyalty/{a['u_id']}/adjust",
                    json={"points": 100, "note": "هدیه"}, headers=auth(a["m"]))
    assert r.status_code == 200, r.text
    r = client.get("/api/v1/loyalty/me", headers=auth(a["u"])).json()
    assert r["balance"] == 100 and len(r["history"]) == 1
    assert r["history"][0]["reason"] == "manual_adjust"


def test_manager_or_super_only_for_gift(client):
    a = _setup("2")
    someone, _ = _user("09342000992", UserRole.VENUE_MANAGER)
    assert client.post(f"/api/v1/loyalty/{a['u_id']}/adjust", json={"points": 5},
                       headers=auth(a["u"])).status_code == 403
    r = client.post(f"/api/v1/loyalty/{a['u_id']}/adjust", json={"points": 5},
                    headers=auth(a["m"]))
    assert r.status_code == 200
    assert client.post(f"/api/v1/loyalty/{a['u_id']}/adjust", json={"points": 0},
                       headers=auth(a["m"])).status_code == 400
    assert client.post("/api/v1/loyalty/99999/adjust", json={"points": 10},
                       headers=auth(a["m"])).status_code == 404
    # کسر بیش از موجودی رد
    assert client.post(f"/api/v1/loyalty/{a['u_id']}/adjust", json={"points": -50},
                       headers=auth(a["m"])).status_code == 400


# ─────────────────────────── خرج در checkout ───────────────────────────

def test_redeem_capped_at_50_percent(client, fake_redis):
    a = _setup("3")
    client.post(f"/api/v1/loyalty/{a['u_id']}/adjust", json={"points": 50},
                headers=auth(a["m"]))
    with _fresh() as s:
        sid = _slot(s, a["v"], date.today() + timedelta(days=2))  # 400000
    r = client.post("/api/v1/bookings/",
                    json={"slot_id": sid, "use_loyalty_points": True},
                    headers=auth(a["u"]))
    assert r.status_code == 200, r.text
    body = r.json()
    # موجودی ۵۰ امتیاز (۵۰۰هزار) ولی سقف ۵۰٪ ⇒ ۲۰۰هزار ⇒ ۲۰ امتیاز
    assert body["payment_amount"] == 200000
    assert body["loyalty_points_used"] == 20 and body["discount_amount"] == 200000
    pid = body["id"]
    conf = client.post(f"/api/v1/bookings/pending/{pid}/confirm",
                       headers=auth(a["m"])).json()
    assert conf["loyalty_points_used"] == 20
    with _fresh() as s:
        row = s.exec(select(LoyaltyPoint).where(
            LoyaltyPoint.reason == LoyaltyReason.LOYALTY_REDEEM)).first()
        assert row.points == -20 and row.source_type == "booking"
        assert row.source_id == conf["id"]
        bal = s.exec(select(LoyaltyPoint.points)).all()
        assert sum(bal) == 50 - 20


def test_redeem_below_cap_uses_all(client, fake_redis):
    a = _setup("4")
    client.post(f"/api/v1/loyalty/{a['u_id']}/adjust", json={"points": 5},
                headers=auth(a["m"]))
    with _fresh() as s:
        sid = _slot(s, a["v"], date.today() + timedelta(days=2))
    r = client.post("/api/v1/bookings/",
                    json={"slot_id": sid, "use_loyalty_points": True},
                    headers=auth(a["u"]))
    assert r.json()["payment_amount"] == 350000
    assert r.json()["loyalty_points_used"] == 5


def test_no_points_change_price(client, fake_redis):
    a = _setup("5")
    with _fresh() as s:
        sid = _slot(s, a["v"], date.today() + timedelta(days=2))
    r = client.post("/api/v1/bookings/",
                    json={"slot_id": sid, "use_loyalty_points": True},
                    headers=auth(a["u"]))
    assert r.status_code == 200
    assert r.json()["payment_amount"] == 400000 and r.json()["loyalty_points_used"] == 0


# ─────────────────────────── تسک تکمیل + جایزه ───────────────────────────

def test_award_on_completion_idempotent(client):
    a = _setup("6")
    past = date.today() - timedelta(days=1)
    with _fresh() as s:
        sid = _slot(s, a["v"], past)
        booking = Booking(slot_id=sid, user_id=a["u_id"], status=BookingStatus.CONFIRMED,
                          payment_amount=250000)
        s.add(booking)
        s.commit()
        bid = booking.id
    out = complete_past_bookings()
    assert out["completed"] == 1 and out["awarded"] == 1
    with _fresh() as s:
        b = s.get(Booking, bid)
        assert b.status == BookingStatus.COMPLETED
        award = s.exec(select(LoyaltyPoint).where(
            LoyaltyPoint.reason == LoyaltyReason.BOOKING_COMPLETED)).one()
        assert award.points == 25  # ۲۵۰هزار ÷ ۱۰هزار
    out2 = complete_past_bookings()
    assert out2["completed"] == 0 and out2["awarded"] == 0
    with _fresh() as s:
        assert len(s.exec(select(LoyaltyPoint)).all()) == 1


def test_future_and_today_slots_not_completed(client):
    a = _setup("7")
    with _fresh() as s:
        sid = _slot(s, a["v"], date.today() + timedelta(days=1))
        s.add(Booking(slot_id=sid, user_id=a["u_id"], status=BookingStatus.CONFIRMED,
                      payment_amount=200000))
        s.commit()
    out = complete_past_bookings()
    assert out["completed"] == 0


def test_refund_points_on_cancel(client, fake_redis):
    a = _setup("8")
    client.post(f"/api/v1/loyalty/{a['u_id']}/adjust", json={"points": 50},
                headers=auth(a["m"]))
    with _fresh() as s:
        sid = _slot(s, a["v"], date.today() + timedelta(days=2))
    pid = client.post("/api/v1/bookings/",
                      json={"slot_id": sid, "use_loyalty_points": True},
                      headers=auth(a["u"])).json()["id"]
    conf = client.post(f"/api/v1/bookings/pending/{pid}/confirm",
                       headers=auth(a["m"])).json()
    assert conf["loyalty_points_used"] == 20
    r = client.delete(f"/api/v1/bookings/{conf['id']}", headers=auth(a["u"]))
    assert r.status_code == 200, r.text
    with _fresh() as s:
        rows = s.exec(select(LoyaltyPoint)).all()
        assert sum(x.points for x in rows) == 50  # خرج برگشت خورده
        refund = [x for x in rows if x.reason == LoyaltyReason.LOYALTY_REFUND]
        assert len(refund) == 1 and refund[0].points == 20