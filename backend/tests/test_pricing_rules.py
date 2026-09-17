# backend/tests/test_pricing_rules.py
"""موتور قیمت: حل قوانین (روز هفته/پیک/تعطیل/اولویت/کف) + API + تولید سانس + اقتدار سرور.

الگوی session: فقط `_fresh()` (بسته‌شدن با with ⇒ آزادسازی قفل BEGIN IMMEDIATE)؛
فیکسچر `db` هرگز نوشته نمی‌شود چون تراکنشش باز می‌ماند و قفل می‌کند.
"""
from datetime import date, time as dtime, timedelta

import pytest
from sqlmodel import Session, select

import app.services.pending_booking_service as pbs_module
import app.utils.rate_limit as rate_limit_module
from app.models.holiday import Holiday
from app.models.pricing_rule import ModifierType, PricingRule
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


def _mk_verified_user(phone, role=UserRole.USER):
    with _fresh() as s:
        u = User(phone=phone, full_name="ک", hashed_password="x", role=role,
                 is_verified=True)
        s.add(u)
        s.commit()
        uid, uphone = u.id, u.phone
    return uid, uphone


def _mk_venue(manager_id, default_price=None, name="سالن قیمت‌گذار"):
    with _fresh() as s:
        venue = Venue(name=name, address="آدرس", latitude=35.7, longitude=51.4,
                      phone="09120000001", manager_id=manager_id,
                      default_slot_price=default_price)
        s.add(venue)
        s.commit()
        vid = venue.id
    return vid


def _mk_slot(s, venue_id, slot_date, start, base=200000, current=None, **kw):
    slot = Slot(venue_id=venue_id, slot_date=slot_date, start_time=start,
                duration=kw.pop("duration", 90), base_price=base,
                current_price=current if current is not None else base,
                status=SlotStatus.AVAILABLE, **kw)
    s.add(slot)
    s.commit()
    return slot


def _mk_rule(s, venue_id, day=None, tfrom=None, tto=None, holiday=False,
             mtype=ModifierType.PERCENT, value=1000, priority=0, label="r", active=True):
    rule = PricingRule(venue_id=venue_id, day_of_week=day, start_time=tfrom,
                       end_time=tto, holiday_applies=holiday, modifier_type=mtype,
                       value=value, priority=priority, label=label, is_active=active)
    s.add(rule)
    s.commit()
    return rule


def _next_date(weekday: int) -> date:
    d = date.today() + timedelta(days=1)
    while d.weekday() != weekday:
        d += timedelta(days=1)
    return d


# ─────────────────────────── حل قوانین (سرویس) ───────────────────────────

def test_weekday_rule_matches_only_its_day():
    mid, _ = _mk_verified_user("09311000001", UserRole.VENUE_MANAGER)
    vid = _mk_venue(mid)
    mon, tue = _next_date(0), _next_date(1)
    with _fresh() as s:
        _mk_rule(s, vid, day=0, value=1000)  # +10% دوشنبه
        p_mon, ids = PricingService.resolve_price(s, vid, mon, dtime(18, 0), base_price=200000)
        p_tue, ids_tue = PricingService.resolve_price(s, vid, tue, dtime(18, 0), base_price=200000)
    assert p_mon == 220000 and ids
    assert p_tue == 200000 and not ids_tue


def test_peak_window_overlap_semantics():
    mid, _ = _mk_verified_user("09311000002", UserRole.VENUE_MANAGER)
    vid = _mk_venue(mid)
    d = date.today() + timedelta(days=2)
    with _fresh() as s:
        _mk_rule(s, vid, tfrom=dtime(17, 0), tto=dtime(22, 0), value=1500, label="peak")
        # 16:00+90 ⇒ 17:30 — همپوشانی دارد؛ 15:00+90 ⇒ 16:30 — ندارد
        p1, ids1 = PricingService.resolve_price(s, vid, d, dtime(16, 0), base_price=200000)
        p2, ids2 = PricingService.resolve_price(s, vid, d, dtime(15, 0), base_price=200000)
    assert p1 == 230000 and ids1
    assert p2 == 200000 and not ids2


def test_priority_higher_wins_and_absolute_replaces():
    mid, _ = _mk_verified_user("09311000003", UserRole.VENUE_MANAGER)
    vid = _mk_venue(mid)
    d = date.today() + timedelta(days=4)
    with _fresh() as s:
        _mk_rule(s, vid, value=1000, priority=0, label="+10%")
        _mk_rule(s, vid, mtype=ModifierType.ABSOLUTE, value=250000, priority=5, label="abs")
        p, _ = PricingService.resolve_price(s, vid, d, dtime(18, 0), base_price=200000)
        assert p == 250000  # absolute با اولویت بالاتر آخر ⇒ جایگزین نهایی
    with _fresh() as s:
        for r in s.exec(select(PricingRule)).all():
            r.priority = 5 if r.label == "+10%" else 0
            s.add(r)
        s.commit()
        # این بار absolute(۲۵۰هزار) اول، ۱۰٪ بعد ⇒ ۲۷۵هزار
        p, _ = PricingService.resolve_price(s, vid, d, dtime(18, 0), base_price=200000)
        assert p == 275000


def test_negative_fixed_clamps_to_floor():
    mid, _ = _mk_verified_user("09311000004", UserRole.VENUE_MANAGER)
    vid = _mk_venue(mid)
    d = date.today() + timedelta(days=3)
    with _fresh() as s:
        _mk_rule(s, vid, mtype=ModifierType.FIXED, value=-300000)
        p, _ = PricingService.resolve_price(s, vid, d, dtime(18, 0), base_price=200000)
        assert p == 0
        p2, _ = PricingService.resolve_price(s, vid, d, dtime(18, 0), base_price=200000,
                                             min_floor=50000)
        assert p2 == 50000


def test_holiday_rule_semantics():
    """holiday_applies=True فقط در تعطیل (بدون شرط روز)؛ قوانین عادی در تعطیل خاموش."""
    mid, _ = _mk_verified_user("09311000005", UserRole.VENUE_MANAGER)
    vid = _mk_venue(mid)
    d = date.today() + timedelta(days=6)
    with _fresh() as s:
        normal = _mk_rule(s, vid, day=None, value=1000, label="normal")
        hol = _mk_rule(s, vid, holiday=True, value=2500,
                       day=(d.weekday() + 3) % 7, label="hol")
        p, ids = PricingService.resolve_price(s, vid, d, dtime(18, 0), base_price=200000)
        assert p == 220000 and ids == [normal.id]
        s.add(Holiday(holiday_date=d, name="تعطیلات تست", is_national=True))
        s.commit()
        p2, ids2 = PricingService.resolve_price(s, vid, d, dtime(18, 0), base_price=200000)
        assert p2 == 250000 and ids2 == [hol.id]  # روز هفته‌ی قانون تعطیل نادیده


def test_inactive_rule_never_applies():
    mid, _ = _mk_verified_user("09311000006", UserRole.VENUE_MANAGER)
    vid = _mk_venue(mid)
    d = date.today() + timedelta(days=5)
    with _fresh() as s:
        _mk_rule(s, vid, value=5000, active=False)
        p, ids = PricingService.resolve_price(s, vid, d, dtime(18, 0), base_price=200000)
    assert p == 200000 and not ids


# ─────────────────────────── تولید سانس با موتور ───────────────────────────

def test_generate_slots_applies_rules_and_venue_default(client):
    mid, mphone = _mk_verified_user("09311000010", UserRole.VENUE_MANAGER)
    vid = _mk_venue(mid, default_price=200000)
    gen_date = date.today() + timedelta(days=9)
    with _fresh() as s:
        _mk_rule(s, vid, day=gen_date.weekday(), tfrom=dtime(18, 0), tto=dtime(21, 0),
                 value=1000)
    r = client.post(f"/api/v1/slots/venue/{vid}/generate?slot_date={gen_date.isoformat()}",
                    headers=auth(mphone))
    assert r.status_code == 200, r.text
    with _fresh() as s:
        slots = s.exec(select(Slot).where(Slot.venue_id == vid).order_by(Slot.start_time)).all()
        assert slots and all(sl.base_price == 200000 for sl in slots)
        late = [sl for sl in slots if dtime(18, 0) <= sl.start_time < dtime(21, 0)]
        early = [sl for sl in slots if sl.start_time < dtime(17, 0)]
        outside = [sl for sl in slots if sl.start_time >= dtime(21, 0)]
        assert late and early
        assert all(sl.current_price == 220000 for sl in late)
        assert all(sl.current_price == 200000 for sl in early)
        assert outside and all(sl.current_price == 200000 for sl in outside)


def test_generate_slots_venue_default_base_and_config_fallback(client):
    mid, mphone = _mk_verified_user("09311000011", UserRole.VENUE_MANAGER)
    vid = _mk_venue(mid, default_price=None)
    r = client.post(f"/api/v1/slots/venue/{vid}/generate"
                    f"?slot_date={(date.today() + timedelta(days=10)).isoformat()}",
                    headers=auth(mphone))
    assert r.status_code == 200, r.text
    with _fresh() as s:
        slots = s.exec(select(Slot).where(Slot.venue_id == vid)).all()
        assert slots and all(sl.base_price == 200000 for sl in slots)
    mid2, mphone2 = _mk_verified_user("09311000012", UserRole.VENUE_MANAGER)
    vid2 = _mk_venue(mid2, default_price=350000)
    r = client.post(f"/api/v1/slots/venue/{vid2}/generate"
                    f"?slot_date={(date.today() + timedelta(days=10)).isoformat()}",
                    headers=auth(mphone2))
    assert r.status_code == 200, r.text
    with _fresh() as s:
        slots = s.query(Slot).filter(Slot.venue_id == vid2).all()
        assert slots and all(sl.base_price == 350000 and sl.current_price == 350000
                             for sl in slots)


# ─────────────────────────── API قوانین/پیش‌نمایش ───────────────────────────

def _rule_payload(vid, **over):
    body = {"venue_id": vid, "modifier_type": "percent", "value": 1000,
            "day_of_week": None, "label": "test"}
    body.update(over)
    return body


def test_rule_crud_and_gating(client):
    m1_id, m1 = _mk_verified_user("09311000020", UserRole.VENUE_MANAGER)
    m2_id, m2 = _mk_verified_user("09311000021", UserRole.VENUE_MANAGER)
    v1, v2 = _mk_venue(m1_id), _mk_venue(m2_id)
    r = client.post("/api/v1/pricing/rules", json=_rule_payload(v1, value=15000),
                    headers=auth(m1))
    assert r.status_code == 400, r.text  # خارج از بازهٔ درصد
    r = client.post("/api/v1/pricing/rules", json=_rule_payload(v1), headers=auth(m2))
    assert r.status_code == 403
    r = client.post("/api/v1/pricing/rules", json=_rule_payload(v1), headers=auth(m1))
    assert r.status_code == 200, r.text
    rid = r.json()["id"]
    got = client.get(f"/api/v1/pricing/rules?venue_id={v1}", headers=auth(m1)).json()
    assert [x["id"] for x in got] == [rid]
    assert client.get(f"/api/v1/pricing/rules?venue_id={v1}",
                      headers=auth(m2)).status_code == 403
    r = client.put(f"/api/v1/pricing/rules/{rid}", json={"is_active": False},
                   headers=auth(m1))
    assert r.status_code == 200 and r.json()["is_active"] is False
    assert client.get(f"/api/v1/pricing/rules?venue_id={v1}", headers=auth(m1)).json() == []
    assert client.delete(f"/api/v1/pricing/rules/{rid}", headers=auth(m1)).status_code == 200


def test_preview_endpoint(client):
    mid, mphone = _mk_verified_user("09311000022", UserRole.VENUE_MANAGER)
    vid = _mk_venue(mid, default_price=300000)
    d = date.today() + timedelta(days=7)
    with _fresh() as s:
        _mk_rule(s, vid, day=d.weekday(), value=-1000)
    r = client.post("/api/v1/pricing/preview",
                    json={"venue_id": vid, "slot_date": d.isoformat(),
                          "start_time": "18:00"}, headers=auth(mphone))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["base_price"] == 300000
    assert body["final_price"] == 270000
    assert len(body["rules"]) == 1 and body["rules"][0]["delta"] == -30000
    assert body["is_holiday"] is False
    r = client.post("/api/v1/pricing/preview",
                    json={"venue_id": vid, "slot_date": d.isoformat(),
                          "start_time": "18:00", "base_price": 500000},
                    headers=auth(mphone))
    assert r.json()["final_price"] == 450000


def test_venue_default_price_endpoint(client):
    mid, mphone = _mk_verified_user("09311000023", UserRole.VENUE_MANAGER)
    other, op = _mk_verified_user("09311000024", UserRole.VENUE_MANAGER)
    vid = _mk_venue(mid)
    assert client.put(f"/api/v1/pricing/venue/{vid}/default-price",
                      json={"default_slot_price": 250000},
                      headers=auth(op)).status_code == 403
    r = client.put(f"/api/v1/pricing/venue/{vid}/default-price",
                   json={"default_slot_price": 250000}, headers=auth(mphone))
    assert r.status_code == 200, r.text
    with _fresh() as s:
        assert s.get(Venue, vid).default_slot_price == 250000


# ─────────────────────────── اقتدار سرور در رزرو ───────────────────────────

def test_booking_ignores_tampered_client_and_row_price(client, fake_redis):
    mid, mphone = _mk_verified_user("09311000030", UserRole.VENUE_MANAGER)
    uid, uphone = _mk_verified_user("09311000031")
    vid = _mk_venue(mid)
    with _fresh() as s:
        slot = _mk_slot(s, vid, date.today() + timedelta(days=2), dtime(18, 0))
        sid = slot.id
        obj = s.get(Slot, sid)
        obj.current_price = 999999
        s.add(obj)
        s.commit()
    r = client.post("/api/v1/bookings/",
                    json={"slot_id": sid, "payment_amount": 7, "price": 1,
                          "final_price": 0},  # هیچ فیلد قیمتی از کلاینت خوانده نمی‌شود
                    headers=auth(uphone))
    assert r.status_code == 200, r.text
    assert r.json()["payment_amount"] == 200000


def test_booking_honors_downward_server_adjustment(client, fake_redis):
    """برنده رقابت قیمت، current_price را کاه می‌دهد — رزرو همان را می‌پردازد."""
    mid, mphone = _mk_verified_user("09311000032", UserRole.VENUE_MANAGER)
    uid, uphone = _mk_verified_user("09311000033")
    vid = _mk_venue(mid)
    with _fresh() as s:
        slot = _mk_slot(s, vid, date.today() + timedelta(days=2), dtime(20, 0),
                        base=200000, current=150000)
        sid = slot.id
    r = client.post("/api/v1/bookings/", json={"slot_id": sid}, headers=auth(uphone))
    assert r.status_code == 200, r.text
    assert r.json()["payment_amount"] == 150000