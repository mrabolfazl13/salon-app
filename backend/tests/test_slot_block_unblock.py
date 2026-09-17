# backend/tests/test_slot_block_unblock.py
"""سانس بلاک/آنبلاک — کد slot.block (مالک/سرپرست/Branch Manager/Reception)،
رده‌های ۴۰۰ فارسی، رفت‌وبرگشت، و خارج‌شدن از /available."""
from datetime import date, time as dtime, timedelta

import pytest
from sqlmodel import Session, select

from app.models.slot import Slot, SlotStatus
from app.models.user import User, UserRole
from app.models.venue import Venue
from helpers import auth, FakeRedis
from conftest import test_engine

DENIED = "اجازه دسترسی ندارید"


@pytest.fixture(autouse=True)
def fake_redis(monkeypatch):
    import app.utils.rate_limit as rl
    import app.services.pending_booking_service as pbs
    fake = FakeRedis()
    monkeypatch.setattr(rl, "_client", fake)
    monkeypatch.setattr(pbs, "_client", fake)
    return fake


def _fresh():
    return Session(test_engine)


def _user(phone, role=UserRole.USER):
    with _fresh() as s:
        u = User(phone=phone, full_name="کاربر " + phone, hashed_password="x", role=role)
        s.add(u); s.commit(); s.refresh(u)
        return u



def _venue_and_slot(manager_id, day=None, status=SlotStatus.AVAILABLE,
                    venue_id=None, **kw):
    with _fresh() as s:
        if venue_id is not None:
            v = s.get(Venue, venue_id)
        else:
            v = Venue(name="سالن بلاک", address="آ", latitude=35.7, longitude=51.4,
                      manager_id=manager_id)
            s.add(v); s.commit(); s.refresh(v)
        sl = Slot(venue_id=v.id, slot_date=day or (date.today() + timedelta(days=2)),
                  start_time=dtime(18, 0), duration=90, base_price=200000,
                  current_price=200000, status=status, **kw)
        s.add(sl); s.commit(); s.refresh(sl)
        return {"venue_id": v.id, "slot_id": sl.id}


def _staff(client, m_phone, venue_id, phone, position):
    r = client.post("/api/v1/staff/",
                    json={"phone": phone, "venue_id": venue_id, "position": position},
                    headers=auth(m_phone))
    assert r.status_code == 201, r.text


def test_block_ok_for_owner_branch_reception_super(client):
    m = _user("09399000001", UserRole.VENUE_MANAGER)
    e = _venue_and_slot(m.id)
    vid, sid = e["venue_id"], e["slot_id"]
    # مالک سالن
    r = client.post(f"/api/v1/slots/{sid}/block", headers=auth(m.phone))
    assert r.status_code == 200, r.text
    assert r.json() == {"slot_id": sid, "venue_id": vid, "status": "blocked"}
    client.post(f"/api/v1/slots/{sid}/unblock", headers=auth(m.phone))

    tag = 1
    for pos in ("branch_manager", "reception"):
        _reset_slot(sid)
        st = _user(f"0939900001{tag}")
        _staff(client, m.phone, vid, st.phone, pos)
        r = client.post(f"/api/v1/slots/{sid}/block", headers=auth(st.phone))
        assert r.status_code == 200, f"{pos}: {r.text}"
        assert r.json()["status"] == "blocked"
        tag += 1

    _reset_slot(sid)
    sa = _user("09399000009", UserRole.SUPER_ADMIN)
    r = client.post(f"/api/v1/slots/{sid}/block", headers=auth(sa.phone))
    assert r.status_code == 200


def _reset_slot(slot_id):
    with _fresh() as s:
        fresh = s.get(Slot, slot_id)
        fresh.status = SlotStatus.AVAILABLE
        s.add(fresh); s.commit()


def test_cashier_and_plain_user_denied(client):
    m = _user("09399000020", UserRole.VENUE_MANAGER)
    e = _venue_and_slot(m.id)
    vid, sid = e["venue_id"], e["slot_id"]
    cashier = _user("09399000021")
    _staff(client, m.phone, vid, cashier.phone, "cashier")
    r = client.post(f"/api/v1/slots/{sid}/block", headers=auth(cashier.phone))
    assert r.status_code == 403 and r.json()["detail"] == DENIED
    acct = _user("09399000022")
    _staff(client, m.phone, vid, acct.phone, "accountant")
    assert client.post(f"/api/v1/slots/{sid}/block",
                       headers=auth(acct.phone)).status_code == 403
    outsider = _user("09399000023")
    assert client.post(f"/api/v1/slots/{sid}/block",
                       headers=auth(outsider.phone)).status_code == 403


def test_reject_states_400_persian(client):
    m = _user("09399000030", UserRole.VENUE_MANAGER)
    booked = _venue_and_slot(m.id, status=SlotStatus.BOOKED)["slot_id"]
    r = client.post(f"/api/v1/slots/{booked}/block", headers=auth(m.phone))
    assert r.status_code == 400 and "فقط سانس آزاد" in r.json()["detail"]

    past = _venue_and_slot(m.id, day=date.today() - timedelta(days=3))["slot_id"]
    r = client.post(f"/api/v1/slots/{past}/block", headers=auth(m.phone))
    assert r.status_code == 400 and "گذشته" in r.json()["detail"]

    contract_slot = _venue_and_slot(m.id, is_contract_slot=True)["slot_id"]
    r = client.post(f"/api/v1/slots/{contract_slot}/block", headers=auth(m.phone))
    assert r.status_code == 400 and "قرارداد" in r.json()["detail"]

    assert client.post("/api/v1/slots/999999/block",
                       headers=auth(m.phone)).status_code == 404


def test_roundtrip_and_available_exclusion(client):
    m = _user("09399000040", UserRole.VENUE_MANAGER)
    day = date.today() + timedelta(days=2)
    e1 = _venue_and_slot(m.id, day=day)
    vid, sid = e1["venue_id"], e1["slot_id"]
    sl2 = _venue_and_slot(m.id, day=day, venue_id=vid)["slot_id"]
    h = auth(m.phone)
    url = f"/api/v1/slots/venue/{vid}/available"

    avail = client.get(url, params={"slot_date": day.isoformat()}).json()
    assert sid in [x["id"] for x in avail]

    assert client.post(f"/api/v1/slots/{sid}/block", headers=h).status_code == 200
    avail = client.get(url, params={"slot_date": day.isoformat()}).json()
    assert sid not in [x["id"] for x in avail]
    assert sl2 in [x["id"] for x in avail]

    # بلاک روی بلاک ⇒ ۴۰۰
    assert client.post(f"/api/v1/slots/{sid}/block", headers=h).status_code == 400
    # انبلاک ⇒ موجودی آزاد
    r2 = client.post(f"/api/v1/slots/{sid}/unblock", headers=h)
    assert r2.status_code == 200
    assert r2.json() == {"slot_id": sid, "venue_id": vid, "status": "available"}
    avail = client.get(url, params={"slot_date": day.isoformat()}).json()
    assert sid in [x["id"] for x in avail]
    # انبلاک روی آزاد ⇒ ۴۰۰
    assert client.post(f"/api/v1/slots/{sid}/unblock", headers=h).status_code == 400