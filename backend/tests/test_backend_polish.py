# backend/tests/test_backend_polish.py
"""پولیش بک‌اند — venue.default_slot_price round-trip، فیلتر venue_id برای دیل،
   و پارامترهای صریح from/to در تقویم مناسبت‌ها."""
from datetime import date, time as dtime, timedelta

import pytest
from sqlmodel import Session, select

import app.services.pending_booking_service as pbs_module
import app.utils.rate_limit as rate_limit_module
from app.models.holiday import Holiday
from app.models.slot import Slot, SlotStatus
from app.models.user import User, UserRole
from app.models.venue import Venue
from helpers import auth, FakeRedis

from conftest import test_engine


def _fresh():
    return Session(test_engine)


def _user(phone, role=UserRole.USER):
    with _fresh() as s:
        u = User(phone=phone, full_name="ك", hashed_password="x", role=role,
                 is_verified=True)
        s.add(u)
        s.commit()
        return u.id, u.phone


@pytest.fixture()
def fake_redis(monkeypatch):
    fake = FakeRedis()
    monkeypatch.setattr(pbs_module, "_client", fake)
    monkeypatch.setattr(rate_limit_module, "_client", fake)
    return fake


# ─────────────────────────── ۱) venue.default_slot_price ───────────────────────────

def test_venue_response_serializes_default_slot_price(client):
    mid, mphone = _user("09390000001", UserRole.VENUE_MANAGER)
    body = {"name": "سالن پالیش", "category": "futsal", "address": "آدرس",
            "latitude": 35.7, "longitude": 51.4, "phone": "09120000001",
            "default_slot_price": 275000}
    r = client.post("/api/v1/venues/", json=body, headers=auth(mphone))
    assert r.status_code == 200, r.text
    vid = r.json()["id"]
    assert r.json()["default_slot_price"] == 275000          # پاسخ ساخت
    assert client.get(f"/api/v1/venues/{vid}").json()["default_slot_price"] == 275000
    assert client.get("/api/v1/venues/").json()[0]["default_slot_price"] == 275000
    body["default_slot_price"] = 320000                        # PUT قابل تنظیم مدیر
    ru = client.put(f"/api/v1/venues/{vid}", json=body, headers=auth(mphone))
    assert ru.status_code == 200, ru.text
    assert ru.json()["default_slot_price"] == 320000
    with _fresh() as s:
        assert s.get(Venue, vid).default_slot_price == 320000


def test_venue_response_default_slot_price_absent_is_null(client):
    mid, mphone = _user("09390000002", UserRole.VENUE_MANAGER)
    r = client.post("/api/v1/venues/",
                    json={"name": "بدون پایه", "category": "futsal", "address": "آ",
                          "latitude": 35.7, "longitude": 51.4},
                    headers=auth(mphone))
    assert r.status_code == 200, r.text
    assert "default_slot_price" in r.json() and r.json()["default_slot_price"] is None


# ─────────────────────────── ۲) /deals/available?venue_id ───────────────────────────

def _venue_with_deal(client, phone_tag, mphone_tag):
    mid, mphone = _user(f"093900{mphone_tag}0", UserRole.VENUE_MANAGER)
    with _fresh() as s:
        v = Venue(name=f"دیل{phone_tag}", address="آ", latitude=35.7, longitude=51.4,
                  phone="0912", manager_id=mid)
        s.add(v)
        s.commit()
        vid = v.id
        sl = Slot(venue_id=vid, slot_date=date.today() + timedelta(days=2),
                  start_time=dtime(18, 0), duration=90, base_price=200000,
                  current_price=200000, status=SlotStatus.AVAILABLE)
        s.add(sl)
        s.commit()
        sid = sl.id
    r = client.post("/api/v1/deals/publish",
                    json={"venue_id": vid, "slot_ids": [sid], "discount_percent": 20},
                    headers=auth(mphone))
    assert r.status_code == 200, r.text
    return vid, sid


def test_deals_available_venue_id_exact_filter(client, fake_redis):
    uid, uphone = _user("09390099000")
    va, sa = _venue_with_deal(client, "A", "01000")
    vb, sb = _venue_with_deal(client, "B", "02000")
    both = client.get("/api/v1/deals/available", headers=auth(uphone)).json()
    assert {x["slot_id"] for x in both} == {sa, sb}
    only_a = client.get(f"/api/v1/deals/available?venue_id={va}", headers=auth(uphone)).json()
    assert {x["slot_id"] for x in only_a} == {sa}
    assert {x["venue_id"] for x in only_a} == {va}
    none = client.get(f"/api/v1/deals/available?venue_id={999999}", headers=auth(uphone)).json()
    assert none == []


# ─────────────────────────── ۳) /holidays/?from=&to= ───────────────────────────

def test_holidays_explicit_from_to_override_default_window(client):
    sid, sphone = _user("09390007001", UserRole.SUPER_ADMIN)
    base = date.today() + timedelta(days=10)
    with _fresh() as s:
        s.add_all([
            Holiday(holiday_date=base, name="الف", is_national=True),
            Holiday(holiday_date=base + timedelta(days=3), name="ب", is_national=True),
            Holiday(holiday_date=base + timedelta(days=30), name="ج", is_national=True),
        ])
        s.commit()
    # بدون آرگومان ⇒ واندوی پیش‌فرض (3 مناسبت در بازه)
    r_all = client.get("/api/v1/holidays/", headers=auth(sphone))
    assert r_all.status_code == 200 and len(r_all.json()) == 3
    # from/to صریح بازه را تنگ می‌کند
    r_win = client.get(f"/api/v1/holidays/?from={base.isoformat()}"
                       f"&to={(base + timedelta(days=3)).isoformat()}",
                       headers=auth(sphone))
    assert r_win.status_code == 200
    assert [x["name"] for x in r_win.json()] == ["الف", "ب"]
    # فقط from بدون to ⇒ پایان = شروع + 730 روز (پیش‌فرض حفظ)
    r_from = client.get(f"/api/v1/holidays/?from={base.isoformat()}", headers=auth(sphone))
    assert {x["name"] for x in r_from.json()} == {"الف", "ب", "ج"}
    # بازهٔ معکوس ⇒ ۴۰۰
    assert client.get(f"/api/v1/holidays/?from={(base + timedelta(days=30)).isoformat()}"
                      f"&to={base.isoformat()}",
                      headers=auth(sphone)).status_code == 400
