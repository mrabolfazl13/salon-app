# backend/tests/test_pricing_insight.py
"""C5 — سیگنال اشغال از رزروهای واقعی + پیشنهاد قیمت با کف/سقف ایمن (بدون ML).

پنجره فقط گذشته است (امروز منهای ۱ تا پشت‌سرِ `days` روز)، پس فیکس‌ها روی `_past_date`
ساخته می‌شوند و `_next_date` فقط برای مقصد پیشنهاد خوانده می‌شود.
"""
from datetime import date, time as dtime, timedelta

import pytest
from sqlmodel import Session, select

from app.models.booking import Booking, BookingStatus
from app.models.pricing_rule import ModifierType, PricingRule
from app.models.slot import Slot, SlotStatus
from app.models.user import User, UserRole
from app.models.venue import Venue
from app.repositories.slot_repository import SlotRepository
from app.services.pricing_insight_service import PricingInsightService
from app.services.pricing_service import PricingService
from app.utils.weekdays import WEEKDAY_NAMES_PY

from helpers import auth

from conftest import test_engine

MONDAY = 0   # date.weekday() پایتون: ۰=دوشنبه
TUESDAY = 1


def _fresh():
    return Session(test_engine)


def _occupancy(venue_id, days=None):
    """سشن حتماً بسته شود وگرنه BEGIN IMMEDIATE قفل SQLite را نگه می‌دارد."""
    with _fresh() as s:
        return PricingInsightService.occupancy(s, venue_id, days)


def _mk_user(phone, role=UserRole.USER):
    with _fresh() as s:
        u = User(phone=phone, full_name="ک", hashed_password="x", role=role,
                 is_verified=True)
        s.add(u)
        s.commit()
        return u.id, u.phone


def _mk_venue(manager_id, default_price=200000):
    with _fresh() as s:
        v = Venue(name="سالن تقاضا", address="آدرس", latitude=35.7, longitude=51.4,
                  phone="09121110001", manager_id=manager_id,
                  default_slot_price=default_price)
        s.add(v)
        s.commit()
        return v.id


def _past_date(weekday: int, weeks_ago: int = 2) -> date:
    d = date.today() - timedelta(weeks=weeks_ago)
    while d.weekday() != weekday:
        d -= timedelta(days=1)
    return d


def _next_date(weekday: int) -> date:
    d = date.today() + timedelta(days=1)
    while d.weekday() != weekday:
        d += timedelta(days=1)
    return d


def _mk_slots(venue_id, when, hour, count):
    """n سانس در یک دسته؛ عمداً AVAILABLE می‌مانند تا ثابت شود شمارش از Booking است."""
    ids = []
    with _fresh() as s:
        for _ in range(count):
            slot = Slot(venue_id=venue_id, slot_date=when, start_time=dtime(hour, 0),
                        duration=90, base_price=200000, current_price=200000,
                        status=SlotStatus.AVAILABLE)
            s.add(slot)
            s.commit()
            ids.append(slot.id)
    return ids


def _mk_bookings(slot_ids, user_id, amount, status=BookingStatus.CONFIRMED):
    with _fresh() as s:
        for sid in slot_ids:
            s.add(Booking(slot_id=sid, user_id=user_id, payment_amount=amount,
                          status=status))
            s.commit()


def _mk_bucket(venue_id, weekday, hour, slots, bookings, user_id, paid=200000):
    ids = _mk_slots(venue_id, _past_date(weekday), hour, slots)
    _mk_bookings(ids[:bookings], user_id, paid)
    return ids


def _mk_rule(venue_id, day, value, mtype=ModifierType.PERCENT):
    with _fresh() as s:
        r = PricingRule(venue_id=venue_id, day_of_week=day, modifier_type=mtype,
                        value=value, priority=0, label="r", is_active=True)
        s.add(r)
        s.commit()
        return r.id


# ─────────────────────────── C5.1 — مخرج و صورتِ اشغال ───────────────────────────

def test_bucket_totals_keyed_by_python_weekday_not_sunday_first():
    """کلید باید با PricingRule.day_of_week (۰=دوشنبه) هم‌خوان بماند، نه دامنهٔ ۰=یکشنبه."""
    mid, _ = _mk_user("09312220001", UserRole.VENUE_MANAGER)
    vid = _mk_venue(mid)
    monday = _past_date(MONDAY)
    _mk_bucket(vid, MONDAY, 18, 2, 0, mid)
    with _fresh() as s:
        totals = SlotRepository(s).slot_bucket_totals(vid, monday, monday)
    assert totals == {(MONDAY, 18): 2}
    occ = _occupancy(vid, 30)
    assert occ["buckets"][0]["weekday"] == MONDAY
    assert occ["buckets"][0]["label"].startswith(WEEKDAY_NAMES_PY[MONDAY])


def test_cancelled_and_pending_bookings_never_count_in_occupancy():
    mid, _ = _mk_user("09312220002", UserRole.VENUE_MANAGER)
    vid = _mk_venue(mid)
    uid, _ = _mk_user("09312220003")
    ids = _mk_slots(vid, _past_date(MONDAY), 18, 6)
    _mk_bookings(ids[0:3], uid, 200000)
    _mk_bookings(ids[3:5], uid, 200000, status=BookingStatus.CANCELLED)
    _mk_bookings(ids[5:6], uid, 200000, status=BookingStatus.PENDING)
    occ = _occupancy(vid, 30)
    bucket = occ["buckets"][0]
    assert bucket["slots"] == 6
    assert bucket["bookings"] == 3
    assert bucket["occupancy"] == 50.0
    assert bucket["avg_paid"] == 200000
    assert occ["total_bookings"] == 3


def test_occupancy_reports_none_instead_of_zero_when_there_is_no_denominator():
    """سالنِ بی‌سانس ⇒ صفرِ گمراه‌کننده نه، هیچ؛ مخرجِ غایب از شمارش بیرون می‌رود."""
    mid, _ = _mk_user("09312220004", UserRole.VENUE_MANAGER)
    vid = _mk_venue(mid)
    occ = _occupancy(vid, 30)
    assert occ["buckets"] == []
    assert occ["total_slots"] == 0
    assert occ["overall_occupancy"] is None
    assert occ["overall_avg_paid"] is None


def test_window_is_past_only_and_ignores_future_bookings():
    mid, _ = _mk_user("09312220005", UserRole.VENUE_MANAGER)
    vid = _mk_venue(mid)
    uid, _ = _mk_user("09312220006")
    ids = _mk_slots(vid, _next_date(TUESDAY), 20, 3)
    _mk_bookings(ids, uid, 250000)
    occ = _occupancy(vid, 30)
    assert occ["buckets"] == []
    assert occ["total_bookings"] == 0
    assert occ["end_date"] < date.today()


def test_window_days_is_clamped_to_sane_bounds():
    mid, _ = _mk_user("09312220007", UserRole.VENUE_MANAGER)
    vid = _mk_venue(mid)
    assert _occupancy(vid, 1)["days"] == 7
    assert _occupancy(vid, 9999)["days"] == 365
    default = _occupancy(vid, None)
    assert default["days"] == 90
    assert (default["end_date"] - default["start_date"]).days == default["days"] - 1


def test_avg_paid_is_reported_from_realized_amounts_not_asking_price():
    mid, _ = _mk_user("09312220008", UserRole.VENUE_MANAGER)
    vid = _mk_venue(mid)
    uid, _ = _mk_user("09125220008")
    ids = _mk_slots(vid, _past_date(MONDAY), 18, 3)
    with _fresh() as s:
        sl = s.get(Slot, ids[2])
        sl.current_price = 999999  # قیمت درخواستیِ drift کرده — نباید در آمار بیاید
        s.add(sl)
        s.commit()
    _mk_bookings([ids[0]], uid, 150000)
    _mk_bookings([ids[1]], uid, 250000)
    _mk_bookings([ids[2]], uid, 200000)
    occ = _occupancy(vid, 30)
    bucket = next(x for x in occ["buckets"] if x["weekday"] == MONDAY and x["hour"] == 18)
    assert bucket["avg_paid"] == 200000
    assert occ["overall_avg_paid"] == 200000


# ─────────────────────────── C5.2 — پیشنهاد قیمت ───────────────────────────

def test_high_demand_bucket_suggests_a_raise_anchored_on_engine_price():
    mid, _ = _mk_user("09312220011", UserRole.VENUE_MANAGER)
    vid = _mk_venue(mid)
    uid, _ = _mk_user("09129220011")
    _mk_bucket(vid, MONDAY, 18, 4, 4, uid)    # دستهٔ مقصد: ۱۰۰٪
    _mk_bucket(vid, TUESDAY, 10, 4, 0, uid)   # بقیهٔ سالن: ۰٪ ⇒ میانگین ۵۰٪
    with _fresh() as s:
        res = PricingInsightService.suggest_price(s, vid, _next_date(MONDAY), dtime(18, 0))
    assert res["engine_price"] == 200000
    assert res["overall_occupancy"] == 50.0
    assert res["bucket"]["occupancy"] == 100.0
    assert res["demand_gap"] == 50.0
    # ضریب ۱ + ۰.۵×۰.۲۵ = ۱.۱۲۵ ⇒ ۲۲۵٬۰۰۰ (درون باند ±۱۵٪)
    assert res["recommended_price"] == 225000
    assert res["applies"] is True
    assert res["delta_percent"] == 12.5
    assert res["confidence"] == "medium"
    assert any("تقاضای بالاتر" in r for r in res["reasons"])
    assert any("قیمت موتور" in r for r in res["reasons"])


def test_low_demand_bucket_suggests_a_reduction():
    mid, _ = _mk_user("09312220012", UserRole.VENUE_MANAGER)
    vid = _mk_venue(mid)
    uid, _ = _mk_user("09129220012")
    _mk_bucket(vid, MONDAY, 18, 4, 4, uid)
    _mk_bucket(vid, TUESDAY, 10, 10, 3, uid)  # مقصد: ۳۰٪ در برابر میانگین ۵۰٪
    with _fresh() as s:
        res = PricingInsightService.suggest_price(s, vid, _next_date(TUESDAY), dtime(10, 0))
    assert res["bucket"]["occupancy"] == 30.0
    assert res["overall_occupancy"] == 50.0
    assert res["demand_gap"] == -20.0
    assert res["recommended_price"] == 190000
    assert res["delta_percent"] == -5.0
    assert res["applies"] is True
    assert res["floor_price"] < res["recommended_price"] < res["ceiling_price"]
    assert any("تقاضای پایین‌تر" in r for r in res["reasons"])


def test_safe_band_limits_the_demand_factor():
    """اختلاف اشغالِ افراطی نباید قیمت را از ±۱۵٪ بیرون ببرد."""
    mid, _ = _mk_user("09312220013", UserRole.VENUE_MANAGER)
    vid = _mk_venue(mid)
    uid, _ = _mk_user("09129220013")
    _mk_bucket(vid, MONDAY, 18, 4, 4, uid)
    _mk_bucket(vid, TUESDAY, 10, 36, 0, uid)  # میانگین سالن ⇒ ۱۰٪
    with _fresh() as s:
        res = PricingInsightService.suggest_price(s, vid, _next_date(MONDAY), dtime(18, 0))
    assert res["bucket"]["occupancy"] == 100.0
    assert res["overall_occupancy"] == 10.0
    assert res["demand_gap"] == 90.0
    assert res["recommended_price"] == 230000  # ۲۰۰٬۰۰۰ × ۱٫۱۵ نه × ۱٫۲۲۵
    assert res["delta_percent"] == pytest.approx(15.0)
    assert any("محدود شد" in r for r in res["reasons"])


def test_suggestion_refuses_when_samples_below_minimum():
    mid, _ = _mk_user("09312220014", UserRole.VENUE_MANAGER)
    vid = _mk_venue(mid)
    uid, _ = _mk_user("09129220014")
    _mk_bucket(vid, MONDAY, 18, 5, 5, uid)
    _mk_bucket(vid, TUESDAY, 10, 5, 2, uid)   # فقط ۲ رزرو < حداقل ۳
    with _fresh() as s:
        res = PricingInsightService.suggest_price(s, vid, _next_date(TUESDAY), dtime(10, 0))
    assert res["applies"] is False
    assert res["recommended_price"] == res["engine_price"] == 200000
    assert res["confidence"] == "low"
    assert res["bucket"]["bookings"] == 2
    assert any("کافی نیست" in r for r in res["reasons"])


def test_confidence_high_needs_three_times_min_samples():
    mid, _ = _mk_user("09312220015", UserRole.VENUE_MANAGER)
    vid = _mk_venue(mid)
    uid, _ = _mk_user("09129220015")
    _mk_bucket(vid, MONDAY, 18, 10, 9, uid)   # مقصد ۹۰٪
    _mk_bucket(vid, TUESDAY, 10, 10, 1, uid)  # ⇒ میانگین ۵۰٪
    with _fresh() as s:
        res = PricingInsightService.suggest_price(s, vid, _next_date(MONDAY), dtime(18, 0))
    assert res["bucket"]["bookings"] == 9
    assert res["confidence"] == "high"
    assert res["recommended_price"] == 220000  # ۱ + ۰.۴×۰.۲۵ = ۱.۱
    assert res["applies"] is True


def test_unknown_bucket_returns_engine_price_with_explanation():
    mid, _ = _mk_user("09312220016", UserRole.VENUE_MANAGER)
    vid = _mk_venue(mid)
    with _fresh() as s:
        res = PricingInsightService.suggest_price(s, vid, _next_date(TUESDAY), dtime(21, 0))
    assert res["bucket"] is None
    assert res["applies"] is False
    assert res["recommended_price"] == res["engine_price"] == 200000
    assert any("هیچ سانسِ فعالی" in r for r in res["reasons"])


def test_suggestion_anchors_on_engine_price_not_bare_base():
    """لنگر = مبنا + قوانین (قیمت موتور)، نه مبنا خالی."""
    mid, _ = _mk_user("09312220017", UserRole.VENUE_MANAGER)
    vid = _mk_venue(mid)
    uid, _ = _mk_user("09129220017")
    _mk_bucket(vid, MONDAY, 18, 4, 4, uid)
    _mk_bucket(vid, TUESDAY, 10, 4, 0, uid)
    _mk_rule(vid, day=MONDAY, value=1000)  # +۱۰٪ دوشنبه
    with _fresh() as s:
        engine, rules, _ids = PricingService.resolve_price_detail(
            s, vid, _next_date(MONDAY), dtime(18, 0), base_price=200000)
        res = PricingInsightService.suggest_price(s, vid, _next_date(MONDAY), dtime(18, 0))
    assert engine == 220000 and len(rules) == 1
    assert res["engine_price"] == 220000
    assert res["floor_price"] == 154000 and res["ceiling_price"] == 286000
    # ۲۲۰٬۰۰۰ × ۱٫۱۲۵ = ۲۴۷٬۵۰۰ → گرد به مضرب ۵٬۰۰۰ ⇒ ۲۵۰٬۰۰۰
    assert res["recommended_price"] == 250000
    assert res["recommended_price"] % 5000 == 0
    assert res["delta_percent"] == pytest.approx(13.6)


def test_suggestion_never_invents_price_for_zero_engine():
    """قانونِ مبلغ ثابتِ سنگین قیمت موتور را صفر می‌کند؛ آن‌جا پیشنهاد نمی‌دهیم."""
    mid, _ = _mk_user("09312220018", UserRole.VENUE_MANAGER)
    vid = _mk_venue(mid)
    uid, _ = _mk_user("09129220018")
    _mk_bucket(vid, MONDAY, 18, 4, 4, uid, paid=0)
    _mk_rule(vid, day=None, value=-900000, mtype=ModifierType.FIXED)
    with _fresh() as s:
        res = PricingInsightService.suggest_price(s, vid, _next_date(MONDAY), dtime(18, 0))
    assert res["engine_price"] == 0
    assert res["recommended_price"] == 0
    assert res["applies"] is False
    assert any("صفر است" in r for r in res["reasons"])


# ─────────────────────────── API ───────────────────────────

def test_suggest_price_writes_nothing(client):
    """پیشنهاد فقط‌خواندنی است — هیچ سانس/قانون/رزروی نمی‌سازد."""
    mid, mphone = _mk_user("09312220021", UserRole.VENUE_MANAGER)
    vid = _mk_venue(mid)
    with _fresh() as s:
        before = (len(s.exec(select(Slot)).all()),
                  len(s.exec(select(PricingRule)).all()),
                  len(s.exec(select(Booking)).all()))
    r = client.get(f"/api/v1/pricing/suggestion?venue_id={vid}"
                   f"&slot_date={_next_date(MONDAY).isoformat()}&start_time=18:00",
                   headers=auth(mphone))
    assert r.status_code == 200, r.text
    with _fresh() as s:
        after = (len(s.exec(select(Slot)).all()),
                 len(s.exec(select(PricingRule)).all()),
                 len(s.exec(select(Booking)).all()))
    assert after == before


def test_occupancy_and_suggestion_endpoints_are_venue_scoped(client):
    m1, p1 = _mk_user("09312220022", UserRole.VENUE_MANAGER)
    m2, p2 = _mk_user("09312220023", UserRole.VENUE_MANAGER)
    v1 = _mk_venue(m1)
    uid, _ = _mk_user("09124220022")
    ids = _mk_slots(v1, _past_date(MONDAY), 18, 2)
    _mk_bookings(ids, uid, 200000)
    assert client.get(f"/api/v1/pricing/occupancy?venue_id={v1}",
                      headers=auth(p2)).status_code == 403
    r = client.get(f"/api/v1/pricing/occupancy?venue_id={v1}&days=30", headers=auth(p1))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["days"] == 30
    assert body["total_bookings"] >= 2
    assert body["buckets"][0]["label"]
    assert client.get(f"/api/v1/pricing/occupancy?venue_id={v1}&days=2",
                      headers=auth(p1)).status_code == 422
    target = _next_date(MONDAY)
    r = client.get(f"/api/v1/pricing/suggestion?venue_id={v1}"
                   f"&slot_date={target.isoformat()}&start_time=18:00&days=30",
                   headers=auth(p1))
    assert r.status_code == 200, r.text
    sug = r.json()
    assert sug["weekday"] == MONDAY and sug["hour"] == 18
    assert sug["bucket"]["bookings"] >= 2
    assert sug["recommended_price"] == sug["engine_price"]  # ۲ نمونه < حداقل ۳
    assert sug["confidence"] == "low"
    assert client.get(f"/api/v1/pricing/suggestion?venue_id={v1}"
                      f"&slot_date={target.isoformat()}&start_time=18:00",
                      headers=auth(p2)).status_code == 403
