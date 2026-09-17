# backend/tests/test_contracts_sessions.py
"""قواعد تک‌سانس: استثنا (آزادسازی دقیقاً یک سانس)، جابه‌جایی (گذشته ۴۰۰/تداخل ۴۰۹)،
جابه‌جایی کل قرارداد با pre-check تصادم‌ها، و درخواست لغو کاربر.

نکته: _cs_map فقط dict برمی‌گرداند (ORM Object را از سشن خارج نکنید — commit
باعث expire و DetachedInstanceError می‌شود).
"""
from datetime import date, time as dtime, timedelta

import pytest
from sqlmodel import Session, select

import app.services.pending_booking_service as pbs_module
import app.utils.rate_limit as rate_limit_module
from app.models.contract import (
    Contract, ContractSlot, ContractSlotStatus, ContractAuditAction,
)
from app.models.slot import Slot, SlotStatus
from app.models.user import UserRole
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


def _env(client, seed, db, suffix, weeks=5, day_of_week=2, price=150000):
    """owner user + venue+sample slot — sample slot قیمت پایه را از هک ۳۰۰هزار
    به ۲۰۰هزار تغییر می‌دهد (مسیر «نمونه‌سانس واقعی» در G)."""
    m = seed["user"](f"0911600{suffix}0", role=UserRole.VENUE_MANAGER)
    u = seed["user"](f"0911600{suffix}1")
    with _fresh() as s:
        venue = Venue(name="سالن سانس", address="آدرس", latitude=35.7, longitude=51.4,
                      manager_id=m.id)
        s.add(venue); s.commit(); s.refresh(venue)
        vid = venue.id
        sample = Slot(venue_id=vid, slot_date=date.today() + timedelta(days=12),
                      start_time=dtime(9, 0), duration=90, base_price=200000,
                      current_price=200000, status=SlotStatus.AVAILABLE)
        s.add(sample); s.commit()
    d = date.today() + timedelta(days=1)
    while d.weekday() != day_of_week:
        d += timedelta(days=1)
    payload = {
        "venue_id": vid, "start_date": d.isoformat(),
        "end_date": (d + timedelta(days=7 * weeks)).isoformat(),
        "day_of_week": day_of_week, "start_time": "18:00",
        "recurrence": "weekly", "discounted_price": price,
    }
    cid = client.post("/api/v1/contracts/", json=payload, headers=auth(u.phone)).json()["id"]
    approve = client.post(f"/api/v1/contracts/{cid}/approve", json={}, headers=auth(m.phone))
    assert approve.status_code == 200, approve.text
    return {"m": m, "u": u, "vid": vid, "cid": cid}


def _sessions(cid):
    """dict-safe snapshot از برنامه سانس‌ها (بدون آبجکت ORM زنده)."""
    with _fresh() as s:
        out = []
        for cs in s.exec(select(ContractSlot).where(ContractSlot.contract_id == cid)
                         .order_by(ContractSlot.session_date)).all():
            slot = s.get(Slot, cs.slot_id)
            out.append({
                "cs_id": cs.id, "slot_id": cs.slot_id,
                "session_date": cs.session_date, "status": cs.status,
                "slot_date": slot.slot_date if slot else None,
                "slot_status": slot.status if slot else None,
                "slot_time": slot.start_time if slot else None,
                "is_contract_slot": slot.is_contract_slot if slot else None,
            })
        return out


def _mark_past(cid, index):
    """سانس indexام را به گذشته می‌بریم (برای تست گاردها)."""
    with _fresh() as s:
        rows = s.exec(select(ContractSlot).where(ContractSlot.contract_id == cid)
                      .order_by(ContractSlot.session_date)).all()
        cs = rows[index]
        slot = s.get(Slot, cs.slot_id)
        cs.session_date = date.today() - timedelta(days=1)
        slot.slot_date = date.today() - timedelta(days=1)
        s.add(cs); s.add(slot); s.commit()
        return cs.id


# ─────────────────────────── استثنا (exclude) ───────────────────────────

def test_exclude_frees_exactly_one_future_slot(client, db, seed, sent_notifications, fake_redis):
    e = _env(client, seed, db, "20")
    items = _sessions(e["cid"])
    assert len(items) == 6
    target = items[1]
    r = client.post(f"/api/v1/contracts/{e['cid']}/sessions/{target['cs_id']}/exclude",
                    json={"reason": "تعمیرات سالن"}, headers=auth(e["m"].phone))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "excluded"
    assert body["exclusion_reason"] == "تعمیرات سالن"
    after = _sessions(e["cid"])
    released = [i for i in after if i["slot_status"] == SlotStatus.AVAILABLE]
    assert len(released) == 1 and released[0]["cs_id"] == target["cs_id"]
    assert released[0]["is_contract_slot"] is False
    det = client.get(f"/api/v1/contracts/{e['cid']}", headers=auth(e["u"].phone)).json()
    assert det["total_amount"] == 6 * 150000
    assert det["economics"]["excluded_sessions"] == 1
    assert det["economics"]["total_sessions"] == 5
    assert det["payments"] == []
    trail = client.get(f"/api/v1/contracts/{e['cid']}/audit", headers=auth(e["u_phone"] if False else e["u"].phone)).json()
    assert trail[-1]["action"] == "session_excluded"
    assert any(n["type"] == "contract_session" and n["user_id"] == e["u"].id
               for n in sent_notifications)


def test_exclude_past_session_400(client, db, seed, fake_redis):
    e = _env(client, seed, db, "21")
    cs_id = _mark_past(e["cid"], 0)
    r = client.post(f"/api/v1/contracts/{e['cid']}/sessions/{cs_id}/exclude",
                    json={"reason": "لغو سانس گذشته"}, headers=auth(e["m"].phone))
    assert r.status_code == 400, r.text
    assert "گذشته" in r.json()["detail"]


def test_exclude_requires_manager(client, db, seed, fake_redis):
    e = _env(client, seed, db, "22")
    items = _sessions(e["cid"])
    r = client.post(f"/api/v1/contracts/{e['cid']}/sessions/{items[0]['cs_id']}/exclude",
                    json={"reason": "دست کاربر"}, headers=auth(e["u"].phone))
    assert r.status_code == 403


# ─────────────────────────── جابه‌جایی یک سانس ───────────────────────────

def test_reschedule_past_session_400(client, db, seed, fake_redis):
    e = _env(client, seed, db, "23")
    cs_id = _mark_past(e["cid"], 0)
    new_day = date.today() + timedelta(days=3)
    r = client.post(f"/api/v1/contracts/{e['cid']}/sessions/{cs_id}/reschedule",
                    json={"new_date": new_day.isoformat(), "new_time": "18:00"},
                    headers=auth(e["m"].phone))
    assert r.status_code == 400, r.text
    assert "گذشته" in r.json()["detail"]


def test_reschedule_future_slot_moves_physical_slot(client, db, seed, sent_notifications, fake_redis):
    e = _env(client, seed, db, "24")
    items = _sessions(e["cid"])
    tgt = items[2]
    new_day = tgt["slot_date"] + timedelta(days=1)  # پنجشنبه ۱۸:۰۰ آزاد است
    r = client.post(f"/api/v1/contracts/{e['cid']}/sessions/{tgt['cs_id']}/reschedule",
                    json={"new_date": new_day.isoformat(), "new_time": "18:00"},
                    headers=auth(e["m"].phone))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "rescheduled"
    assert body["rescheduled_date"] == new_day.isoformat()
    assert body["session_date"] == tgt["session_date"].isoformat()  # اصلی حفظ شده
    moved = next(i for i in _sessions(e["cid"]) if i["cs_id"] == tgt["cs_id"])
    assert moved["slot_date"] == new_day
    assert moved["slot_status"] == SlotStatus.RESERVED
    assert any(n["type"] == "contract_session" and n["user_id"] == e["u"].id
               for n in sent_notifications)


def test_reschedule_to_past_datetime_400(client, db, seed, fake_redis):
    e = _env(client, seed, db, "25")
    items = _sessions(e["cid"])
    old = date.today() - timedelta(days=5)
    r = client.post(f"/api/v1/contracts/{e['cid']}/sessions/{items[1]['cs_id']}/reschedule",
                    json={"new_date": old.isoformat(), "new_time": "18:00"},
                    headers=auth(e["m"].phone))
    assert r.status_code == 400 and "گذشته" in r.json()["detail"]


def test_reschedule_into_occupied_slot_409(client, db, seed, fake_redis):
    e = _env(client, seed, db, "26")
    items = _sessions(e["cid"])
    tgt = items[3]
    blocker_day = tgt["slot_date"] + timedelta(days=2)
    with _fresh() as s:
        s.add(Slot(venue_id=e["vid"], slot_date=blocker_day, start_time=dtime(18, 0),
                   duration=90, base_price=200000, current_price=200000,
                   status=SlotStatus.BOOKED))
        s.commit()
    r = client.post(f"/api/v1/contracts/{e['cid']}/sessions/{tgt['cs_id']}/reschedule",
                    json={"new_date": blocker_day.isoformat(), "new_time": "18:00"},
                    headers=auth(e["m"].phone))
    assert r.status_code == 409, r.text
    assert "تداخل" in r.json()["detail"]
    after = next(i for i in _sessions(e["cid"]) if i["cs_id"] == tgt["cs_id"])
    assert after["slot_date"] == tgt["slot_date"]  # جابه‌جا نشد


# ─────────────────────────── جابه‌جایی کل قرارداد ───────────────────────────

def test_move_whole_contract_with_collision_400_lists_all(client, db, seed, fake_redis):
    e = _env(client, seed, db, "27")
    items = _sessions(e["cid"])
    with _fresh() as s:
        for offset_session in (items[0], items[2]):
            collision_day = offset_session["slot_date"] + timedelta(days=1)  # پنجشنبه‌ها
            s.add(Slot(venue_id=e["vid"], slot_date=collision_day, start_time=dtime(18, 0),
                       duration=90, base_price=200000, current_price=200000,
                       status=SlotStatus.BOOKED))
        s.commit()
    r = client.post(f"/api/v1/contracts/{e['cid']}/move",
                    json={"day_of_week": 3, "start_time": "18:00"}, headers=auth(e["m"].phone))
    assert r.status_code == 400, r.text
    detail = r.json()["detail"]
    assert detail["code"] == "MOVE_HAS_COLLISIONS"
    assert len(detail["collisions"]) == 2
    assert all("collides_with_slot_id" in c for c in detail["collisions"])
    after = _sessions(e["cid"])
    assert [i["slot_date"] for i in after] == [i["slot_date"] for i in items]  # اتمیک/بدوتغییر


def test_move_whole_contract_clear_moves_every_future_session(client, db, seed, sent_notifications, fake_redis):
    e = _env(client, seed, db, "28")
    items = _sessions(e["cid"])
    r = client.post(f"/api/v1/contracts/{e['cid']}/move",
                    json={"day_of_week": 3, "start_time": "20:00"}, headers=auth(e["m"].phone))
    assert r.status_code == 200, r.text
    assert r.json()["moved_sessions"] == 6
    after = _sessions(e["cid"])
    for orig, cur in zip(items, after):
        assert cur["slot_date"] == orig["slot_date"] + timedelta(days=1)  # سه‌شنبه→پنجشنبه
        assert cur["slot_time"] == dtime(20, 0)
        assert cur["slot_status"] == SlotStatus.RESERVED
    with _fresh() as s:
        c = s.get(Contract, e["cid"])
        assert c.day_of_week == 3 and c.start_time == dtime(20, 0)
    assert any(n["type"] == "contract_session" for n in sent_notifications)
    trail = client.get(f"/api/v1/contracts/{e['cid']}/audit", headers=auth(e["u"].phone)).json()
    assert trail[-1]["action"] == "whole_contract_rescheduled"


# ─────────────────────────── درخواست لغو سانس (کاربر) ───────────────────────────

def test_session_cancel_request_flags_notifies_manager(client, db, seed, sent_notifications, fake_redis):
    e = _env(client, seed, db, "29")
    items = _sessions(e["cid"])
    r = client.post(f"/api/v1/contracts/{e['cid']}/sessions/{items[0]['cs_id']}/cancel-request",
                    json={"reason": "مسافرت تیم"}, headers=auth(e["u"].phone))
    assert r.status_code == 200, r.text
    assert r.json()["cancel_requested"] is True
    assert r.json()["cancellation_reason"] == "مسافرت تیم"
    still = _sessions(e["cid"])[0]
    assert still["slot_status"] == SlotStatus.RESERVED  # درخواست اجرا نمی‌کند
    req_notifs = [n for n in sent_notifications if n["type"] == "contract_session_request"]
    assert any(n["user_id"] == e["m"].id for n in req_notifs)
    trail = client.get(f"/api/v1/contracts/{e['cid']}/audit", headers=auth(e["m"].phone)).json()
    assert trail[-1]["action"] == "session_cancel_requested"
    ex = client.post(f"/api/v1/contracts/{e['cid']}/sessions/{items[0]['cs_id']}/exclude",
                     json={"reason": "موافقت با درخواست کاربر"}, headers=auth(e["m"].phone))
    assert ex.status_code == 200, ex.text
    assert _sessions(e["cid"])[0]["slot_status"] == SlotStatus.AVAILABLE


def test_cancel_request_on_past_session_400(client, db, seed, fake_redis):
    e = _env(client, seed, db, "30", weeks=1)
    cs_id = _mark_past(e["cid"], -1)
    r = client.post(f"/api/v1/contracts/{e['cid']}/sessions/{cs_id}/cancel-request",
                    json={"reason": "لغو گذشته"}, headers=auth(e["u"].phone))
    assert r.status_code == 400
    assert "گذشته" in r.json()["detail"]