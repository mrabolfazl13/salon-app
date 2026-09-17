# backend/tests/test_deals.py
"""بازار سانس‌های لحظه آخری — انتشار/فهرست/رزرو/لغو انتشار، fan-out اعلان، بدون oversell."""
from datetime import date, datetime, time as dtime, timedelta, timezone

import pytest
from sqlmodel import Session, select

import app.services.pending_booking_service as pbs_module
import app.utils.rate_limit as rate_limit_module
from app.models.slot import Slot, SlotStatus
from app.models.user import User, UserRole
from app.models.venue import Venue
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


def _venue(manager_id, lat=35.7, lng=51.4):
    with _fresh() as s:
        v = Venue(name="دیل‌مارکت", address="آ", latitude=lat, longitude=lng,
                  phone="0912", manager_id=manager_id)
        s.add(v)
        s.commit()
        return v.id


def _slot(s, vid, when=None, start=dtime(18, 0), price=200000, status=SlotStatus.AVAILABLE):
    sl = Slot(venue_id=vid, slot_date=when or date.today() + timedelta(days=2),
              start_time=start, duration=90, base_price=price, current_price=price,
              status=status)
    s.add(sl)
    s.commit()
    return sl.id


def _setup(tag, lat=35.7, lng=51.4):
    m_id, m = _user(f"0934400000{tag}", UserRole.VENUE_MANAGER)
    v = _venue(m_id, lat, lng)
    return {"m": m, "m_id": m_id, "v": v}


D2 = date.today() + timedelta(days=2)
D3 = date.today() + timedelta(days=3)


# ─────────────────────────── انتشار ───────────────────────────

def test_publish_percent_and_absolute(client):
    a = _setup("1")
    with _fresh() as s:
        s1 = _slot(s, a["v"])
        s2 = _slot(s, a["v"])
    r = client.post("/api/v1/deals/publish",
                    json={"venue_id": a["v"], "slot_ids": [s1],
                          "discount_percent": 20, "expires_in_minutes": 120},
                    headers=auth(a["m"]))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["published"] == 1 and body["slot_ids"] == [s1]
    assert body["deal_expires_at"]
    with _fresh() as s:
        sl = s.get(Slot, s1)
        exp = sl.deal_expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        assert sl.is_deal and sl.deal_price == 160000
        assert exp > datetime.now(timezone.utc) - timedelta(seconds=5)
        assert exp <= datetime.now(timezone.utc) + timedelta(minutes=121)
    # deal_price دستی
    r = client.post("/api/v1/deals/publish",
                    json={"venue_id": a["v"], "slot_ids": [s2], "deal_price": 90000},
                    headers=auth(a["m"]))
    assert r.status_code == 200 and r.json()["published"] == 1
    with _fresh() as s:
        assert s.get(Slot, s2).deal_price == 90000 and s.get(Slot, s2).deal_expires_at is None


def test_publish_rejects_bad_inputs(client):
    a = _setup("2")
    other = _setup("3")
    with _fresh() as s:
        sid = _slot(s, a["v"])
        past_id = _slot(s, a["v"], when=date.today() - timedelta(days=1))
        booked_id = _slot(s, a["v"], status=SlotStatus.BOOKED)
    # مدیر دیگر سالن
    r = client.post("/api/v1/deals/publish",
                    json={"venue_id": a["v"], "slot_ids": [sid], "discount_percent": 20},
                    headers=auth(other["m"]))
    assert r.status_code == 403
    # گذشته
    r = client.post("/api/v1/deals/publish",
                    json={"venue_id": a["v"], "slot_ids": [past_id], "discount_percent": 20},
                    headers=auth(a["m"]))
    assert r.status_code == 400 and "گذشته" in r.json()["detail"]
    # اشغال‌شده
    r = client.post("/api/v1/deals/publish",
                    json={"venue_id": a["v"], "slot_ids": [booked_id], "discount_percent": 20},
                    headers=auth(a["m"]))
    assert r.status_code == 400 and "آزاد نیست" in r.json()["detail"]
    # گران‌تر از قیمت مصوب
    r = client.post("/api/v1/deals/publish",
                    json={"venue_id": a["v"], "slot_ids": [sid], "deal_price": 250000},
                    headers=auth(a["m"]))
    assert r.status_code == 400 and "کمتر" in r.json()["detail"]
    # هر دو تخفیف با هم / هیچ‌کدام
    assert client.post("/api/v1/deals/publish",
                       json={"venue_id": a["v"], "slot_ids": [sid],
                             "discount_percent": 20, "deal_price": 100},
                       headers=auth(a["m"])).status_code == 400
    assert client.post("/api/v1/deals/publish",
                       json={"venue_id": a["v"], "slot_ids": [sid]},
                       headers=auth(a["m"])).status_code == 400


def test_publish_date_range_skips_ineligible(client):
    a = _setup("4")
    with _fresh() as s:
        ok1 = _slot(s, a["v"], start=dtime(10, 0))
        booked = _slot(s, a["v"], when=date.today() + timedelta(days=5),
                       start=dtime(20, 0), status=SlotStatus.BOOKED)
    r = client.post("/api/v1/deals/publish",
                    json={"venue_id": a["v"], "date_from": D3.isoformat(),
                          "date_to": (D3 + timedelta(days=1)).isoformat(),
                          "discount_percent": 10},
                    headers=auth(a["m"]))
    assert r.status_code == 400  # بازهٔ بدون سانس
    # بازه شامل تاریخ سانس ok1 (D2) — booked در آن شمار نمی‌آید
    r = client.post("/api/v1/deals/publish",
                    json={"venue_id": a["v"], "date_from": D2.isoformat(),
                          "date_to": D2.isoformat(), "discount_percent": 10},
                    headers=auth(a["m"]))
    assert r.status_code == 200, r.text
    out = r.json()
    assert out["published"] == 1 and out["skipped"] == 0
    with _fresh() as s:
        assert s.get(Slot, ok1).deal_price == 180000


# ─────────────────────────── فهرست عمومی ───────────────────────────

def _publish_two_deals(client, a, tag):
    u1_id, u1 = _user(f"09344010{tag}")
    with _fresh() as s:
        s18 = _slot(s, a["v"], start=dtime(18, 0))
        s10 = _slot(s, a["v"], start=dtime(10, 0), price=300000)
    r = client.post("/api/v1/deals/publish",
                    json={"venue_id": a["v"], "slot_ids": [s18],
                          "discount_percent": 20}, headers=auth(a["m"]))
    assert r.status_code == 200
    r = client.post("/api/v1/deals/publish",
                    json={"venue_id": a["v"], "slot_ids": [s10],
                          "deal_price": 270000}, headers=auth(a["m"]))
    assert r.status_code == 200
    return u1, s18, s10


def test_available_listing_filters_and_sorts(client, fake_redis):
    a = _setup("5")
    u1, s18, s10 = _publish_two_deals(client, a, "5a")
    items = client.get("/api/v1/deals/available", headers=auth(u1)).json()
    by_id = {x["slot_id"]: x for x in items}
    assert set(by_id) == {s18, s10}
    assert by_id[s18]["original_price"] == 200000 and by_id[s18]["deal_price"] == 160000
    assert by_id[s18]["savings"] == 40000 and by_id[s18]["discount_percent"] == 20
    assert by_id[s18]["venue_name"] == "دیل‌مارکت"
    # max_price
    got = client.get(f"/api/v1/deals/available?max_price=200000", headers=auth(u1)).json()
    assert {x["slot_id"] for x in got} == {s18}
    # time_of_day
    got = client.get("/api/v1/deals/available?time_of_day=morning", headers=auth(u1)).json()
    assert {x["slot_id"] for x in got} == {s10}
    # sort
    asc = client.get("/api/v1/deals/available?sort=price_asc", headers=auth(u1)).json()
    assert [x["slot_id"] for x in asc] == [s18, s10]
    desc = client.get("/api/v1/deals/available?sort=price_desc", headers=auth(u1)).json()
    assert [x["slot_id"] for x in desc] == [s10, s18]
    # شعاع — سالن در 35.7/51.4
    near = client.get("/api/v1/deals/available?near_lat=35.71&near_lng=51.41&radius_km=5",
                      headers=auth(u1)).json()
    assert {x["slot_id"] for x in near} == {s18, s10}
    assert all(x["distance_km"] < 5 for x in near)
    far = client.get("/api/v1/deals/available?near_lat=36.5&near_lng=51.4&radius_km=5",
                     headers=auth(u1)).json()
    assert far == []


def test_expired_deal_hidden_and_not_applied(client, fake_redis):
    a = _setup("6")
    u_id, u = _user("09344000606")
    with _fresh() as s:
        sid = _slot(s, a["v"])
    assert client.post("/api/v1/deals/publish",
                       json={"venue_id": a["v"], "slot_ids": [sid],
                             "discount_percent": 20, "expires_in_minutes": 30},
                       headers=auth(a["m"])).status_code == 200
    # انقضا از آینده به گذشته
    with _fresh() as s:
        obj = s.get(Slot, sid)
        obj.deal_expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
        s.add(obj); s.commit()
    assert client.get("/api/v1/deals/available", headers=auth(u)).json() == []
    # رزرو بدون تخفیف دیل؛ دیلِ منقضی مصرف شمرده نمی‌شود
    r = client.post("/api/v1/bookings/", json={"slot_id": sid}, headers=auth(u))
    assert r.status_code == 200 and r.json()["payment_amount"] == 200000
    conf = client.post(f"/api/v1/bookings/pending/{r.json()['id']}/confirm",
                       headers=auth(a["m"])).json()
    with _fresh() as s:
        flag = s.get(Slot, sid).is_deal  # تأیید شد ولی دیل اعمال نشده بود ⇒ پرچم دست‌نخورده
        assert flag is True
# ─────────────────────────── رزرو دیل / بدون oversell ───────────────────────────

def test_booking_deal_honors_price_and_unpublishes(client, fake_redis):
    a = _setup("7")
    u1_id, u1 = _user("09344000707")
    u2_id, u2 = _user("09344000708")
    with _fresh() as s:
        sid = _slot(s, a["v"])
    assert client.post("/api/v1/deals/publish",
                       json={"venue_id": a["v"], "slot_ids": [sid], "discount_percent": 20},
                       headers=auth(a["m"])).status_code == 200
    r = client.post("/api/v1/bookings/", json={"slot_id": sid}, headers=auth(u1))
    assert r.status_code == 200, r.text
    assert r.json()["payment_amount"] == 160000
    # بلافاصله از فهرست بیرون می‌رود (سانس رزرو معلق ⇒ BOOKED)
    assert client.get("/api/v1/deals/available", headers=auth(u2)).json() == []
    # کاربر دوم — بدون oversell
    r2 = client.post("/api/v1/bookings/", json={"slot_id": sid}, headers=auth(u2))
    assert r2.status_code == 400
    # تأیید مدیر → دیل هم permanently خاموش
    conf = client.post(f"/api/v1/bookings/pending/{r.json()['id']}/confirm",
                       headers=auth(a["m"]))
    assert conf.status_code == 200, conf.text
    with _fresh() as s:
        sl = s.get(Slot, sid)
        assert sl.is_deal is False and sl.deal_price is None and sl.deal_expires_at is None
    # و کاربر دوم هرگز نمی‌تواند
    assert client.post("/api/v1/bookings/", json={"slot_id": sid},
                       headers=auth(u2)).status_code == 400


def test_deal_stacking_with_coupon(client, fake_redis):
    a = _setup("8")
    u_id, u = _user("09344000808")
    with _fresh() as s:
        sid = _slot(s, a["v"])
    assert client.post("/api/v1/deals/publish",
                       json={"venue_id": a["v"], "slot_ids": [sid], "discount_percent": 20},
                       headers=auth(a["m"])).status_code == 200
    c = client.post("/api/v1/coupons/",
                    json={"code": "X10", "venue_id": a["v"],
                          "discount_type": "percent", "value": 1000,
                          "per_user_limit": None}, headers=auth(a["m"]))
    assert c.status_code == 200, c.text
    r = client.post("/api/v1/bookings/", json={"slot_id": sid, "discount_code": "X10"},
                    headers=auth(u))
    assert r.status_code == 200, r.text
    # ۲۰۰هزار → دیل ۱۶۰هزار → ۱۰٪ = ۱۶هزار → ۱۴۴هزار
    body = r.json()
    assert body["payment_amount"] == 144000
    assert body["discount_amount"] == 56000


# ─────────────────────────── اعلان fan-out ───────────────────────────

def test_subscribe_and_notification_fanout(client, fake_redis, sent_notifications):
    a = _setup("9")
    fav_on, fav_phone = _user("09344000909")   # favorite + subscribe
    fav_off, off_phone = _user("09344000910")  # favorite بدون اشتراک
    nofav, nf_phone = _user("09344000911")     # مشترک ولی بدون favorite
    assert client.post(f"/api/v1/favorites/{a['v']}", headers=auth(fav_phone)).status_code == 200
    assert client.post(f"/api/v1/favorites/{a['v']}", headers=auth(off_phone)).status_code == 200
    for ph in (fav_phone, nf_phone):
        r = client.put("/api/v1/deals/subscription?enabled=true", headers=auth(ph))
        assert r.status_code == 200 and r.json() == {"notify_deals": True}
    assert client.get("/api/v1/deals/subscription", headers=auth(fav_phone)).json() \
        == {"notify_deals": True}
    assert client.get("/api/v1/deals/subscription", headers=auth(off_phone)).json() \
        == {"notify_deals": False}
    with _fresh() as s:
        sid = _slot(s, a["v"])
    r = client.post("/api/v1/deals/publish",
                    json={"venue_id": a["v"], "slot_ids": [sid],
                          "discount_percent": 20}, headers=auth(a["m"]))
    assert r.status_code == 200, r.text
    deal_notifs = [n for n in sent_notifications if n["type"] == "deal"]
    assert [n["user_id"] for n in deal_notifs] == [fav_on]  # فقط favorite ∧ مشترک
    # unsubscribe
    assert client.put("/api/v1/deals/subscription?enabled=false",
                      headers=auth(fav_phone)).json() == {"notify_deals": False}
    r = client.post("/api/v1/deals/publish",
                    json={"venue_id": a["v"], "date_from": D2.isoformat(),
                          "date_to": D3.isoformat(), "discount_percent": 20},
                    headers=auth(a["m"]))
    assert r.status_code == 200, r.text
    assert [n for n in sent_notifications if n["type"] == "deal"][0]["user_id"] == fav_on
    assert sum(1 for n in sent_notifications if n["type"] == "deal") == 1


def test_unpublish(client, fake_redis):
    a = _setup("10")
    u_id, u = _user("09344001010")
    with _fresh() as s:
        sid = _slot(s, a["v"])
    assert client.post("/api/v1/deals/publish",
                       json={"venue_id": a["v"], "slot_ids": [sid],
                             "discount_percent": 25}, headers=auth(a["m"])).status_code == 200
    assert len(client.get("/api/v1/deals/available", headers=auth(u)).json()) == 1
    assert client.delete(f"/api/v1/deals/{sid}/unpublish",
                         headers=auth(a["m"])).status_code == 200
    assert client.get("/api/v1/deals/available", headers=auth(u)).json() == []
    assert client.delete(f"/api/v1/deals/{sid}/unpublish",
                         headers=auth(a["m"])).status_code == 400  # دیلی وجود ندارد
    with _fresh() as s:
        sl = s.get(Slot, sid)
        assert sl.is_deal is False and sl.deal_price is None
    # مدیر دیگر ⇒ 403 (پس از انتشار دوباره)
    assert client.post("/api/v1/deals/publish",
                       json={"venue_id": a["v"], "slot_ids": [sid],
                             "discount_percent": 25}, headers=auth(a["m"])).status_code == 200
    other = _user("09344001011", UserRole.USER)[1]
    assert client.delete(f"/api/v1/deals/{sid}/unpublish",
                         headers=auth(other)).status_code == 403