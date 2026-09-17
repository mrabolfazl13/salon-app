# backend/tests/test_pricing_engine_flow.py
"""MODULE 7 — ترتیب کامل: base → rules → deal → coupon → loyalty → PAYABLE."""
from datetime import date, time as dtime, timedelta

import pytest
from fastapi import HTTPException
from sqlmodel import Session, select

import app.services.pending_booking_service as pbs_module
import app.utils.rate_limit as rate_limit_module
from app.models.coupon import Coupon, CouponType
from app.models.loyalty import LoyaltyPoint, LoyaltyReason
from app.models.pricing_rule import PricingRule
from app.models.slot import Slot, SlotStatus
from app.models.user import User, UserRole
from app.models.venue import Venue
from app.services.pricing_service import PricingService
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


def _setup_full_flow():
    with _fresh() as s:
        manager = User(phone="09322000001", full_name="مدیر", hashed_password="x",
                       role=UserRole.VENUE_MANAGER)
        user = User(phone="09322000002", full_name="کاربر", hashed_password="x",
                    role=UserRole.USER, is_verified=True)
        s.add_all([manager, user])
        s.commit()
        s.refresh(manager); s.refresh(user)
        venue = Venue(name="سالن فلو", address="آ", latitude=35.7, longitude=51.4,
                      phone="0912", manager_id=manager.id)
        s.add(venue)
        s.commit()
        s.refresh(venue)
        rule = PricingRule(venue_id=venue.id, holiday_applies=False,
                           modifier_type="percent",
                           value=1000, priority=0, label="+10", is_active=True)
        coupon = Coupon(code="FLOW10", venue_id=venue.id, discount_type=CouponType.PERCENT,
                        value=2000, min_booking_amount=200000, per_user_limit=1,
                        is_active=True, created_by=manager.id)
        point = LoyaltyPoint(user_id=user.id, points=30, reason=LoyaltyReason.MANUAL_ADJUST)
        slot = Slot(venue_id=venue.id, slot_date=date.today() + timedelta(days=2),
                    start_time=dtime(19, 0), duration=90, base_price=300000,
                    current_price=330000, status=SlotStatus.AVAILABLE,
                    is_deal=True, deal_price=250000)
        s.add_all([rule, coupon, point, slot])
        s.commit()
        s.refresh(rule); s.refresh(slot)
        return {"m": (manager.id, manager.phone), "u": (user.id, user.phone),
                "slot": slot.id, "rule": rule.id}


def test_compute_booking_price_full_ordering(db):
    ctx = _setup_full_flow()
    with _fresh() as s:
        slot = s.get(Slot, ctx["slot"])
        user = s.get(User, ctx["u"][0])
        res = PricingService.compute_booking_price(
            s, slot, user, discount_code="flow10", use_loyalty_points=True)
    # 300000 → +10% = 330000 → دیل 250000 → کوپن ۲۰٪ = 200000 → سقف ۵۰٪ ⇒ ۱۰ امتیاز → ۱۰۰۰۰۰
    assert res["rules"][0]["delta"] == 30000
    assert res["deal"] == {"deal_price": 250000, "savings": 80000}
    assert res["coupon"]["discount"] == 50000 and res["coupon"]["code"] == "FLOW10"
    assert res["loyalty"] == {"points": 10, "discount": 100000}
    assert res["final_price"] == 100000
    assert res["discount_amount"] == 230000
    steps = [x["step"] for x in res["breakdown"]]
    assert steps == ["base", "pricing_rules", "deal", "coupon", "loyalty"]


def test_compute_rejects_past_slot(db):
    with _fresh() as s:
        manager = User(phone="09322000003", full_name="م", hashed_password="x",
                       role=UserRole.VENUE_MANAGER)
        user = User(phone="09322000004", full_name="ک", hashed_password="x",
                    role=UserRole.USER)
        s.add_all([manager, user])
        s.commit()
        venue = Venue(name="قدیمی", address="آ", latitude=35.7, longitude=51.4,
                      phone="0912", manager_id=manager.id)
        s.add(venue)
        s.commit()
        slot = Slot(venue_id=venue.id, slot_date=date.today() - timedelta(days=1),
                    start_time=dtime(18, 0), duration=90, base_price=200000,
                    current_price=200000, status=SlotStatus.AVAILABLE)
        s.add(slot)
        s.commit()
        s.refresh(slot); s.refresh(user)
        with pytest.raises(HTTPException) as exc:
            PricingService.compute_booking_price(s, slot, user)
    assert exc.value.status_code == 400


def test_end_to_end_booking_persists_components(client, db, seed, fake_redis):
    ctx = _setup_full_flow()
    (_, mphone), (uid, uphone) = ctx["m"], ctx["u"]
    r = client.post("/api/v1/bookings/",
                    json={"slot_id": ctx["slot"], "discount_code": "flow10",
                          "use_loyalty_points": True}, headers=auth(uphone))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["payment_amount"] == 100000
    assert body["discount_amount"] == 230000
    assert body["coupon_code"] == "FLOW10" and body["loyalty_points_used"] == 10
    assert isinstance(body["pricing_breakdown"], list)
    r = client.post(f"/api/v1/bookings/pending/{body['id']}/confirm", headers=auth(mphone))
    assert r.status_code == 200, r.text
    conf = r.json()
    assert conf["payment_amount"] == 100000 and conf["status"] == "confirmed"
    assert conf["pricing_breakdown"][0]["step"] == "base"
    from app.models.booking import Booking
    from app.models.coupon import CouponRedemption
    with _fresh() as s:
        b = s.get(Booking, conf["id"])
        assert b.pricing_breakdown and '"deal"' in b.pricing_breakdown
        assert b.coupon_code == "FLOW10" and b.discount_amount == 230000
        red = s.exec(select(CouponRedemption)).first()
        assert red.booking_id == b.id and red.amount_discounted == 50000
        lp = s.exec(select(LoyaltyPoint).where(
            LoyaltyPoint.reason == LoyaltyReason.LOYALTY_REDEEM)).first()
        assert lp is not None and lp.points == -10 and lp.source_id == b.id