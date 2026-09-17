# backend/tests/test_contracts_lifecycle.py
"""چرخه عمر قرارداد: PENDING → تأیید(با اصلاحات)/رد/لغو + ممیزی + تمدید خودکار.

الگوی session همان test_contract_slot_protection.py است (commit→refresh→close
قبل از صدازدن API تا قفل BEGIN IMMEDIATE آزاد بماند).
"""
from datetime import date, time as dtime, timedelta

import pytest
from sqlmodel import Session, select

import app.services.pending_booking_service as pbs_module
import app.utils.rate_limit as rate_limit_module
from app.models.contract import (
    Contract, ContractSlot, ContractSlotStatus, ContractStatus, ContractAuditEvent,
    ContractAuditAction, RecurrenceType,
)
from app.models.slot import Slot, SlotStatus
from app.models.user import User, UserRole
from app.models.venue import Venue
from helpers import auth, FakeRedis


@pytest.fixture()
def fake_redis(monkeypatch):
    fake = FakeRedis()
    monkeypatch.setattr(pbs_module, "_client", fake)
    monkeypatch.setattr(rate_limit_module, "_client", fake)
    return fake


from conftest import test_engine


def _fresh():
    return Session(test_engine)


def _make_manager(seed, phone):
    m = seed["user"](phone, role=UserRole.VENUE_MANAGER)
    mid, mphone = m.id, m.phone
    return mid, mphone


def _make_user(seed, phone):
    u = seed["user"](phone)
    return u.id, u.phone


def _make_venue(db, manager_id, name="سالن قرارداد"):
    venue = Venue(name=name, address="آدرس", latitude=35.7, longitude=51.4,
                  phone="09120000000", manager_id=manager_id)
    db.add(venue)
    db.commit()
    db.refresh(venue)
    vid = venue.id
    return vid


def _next_weekday(weekday: int, days_ahead_min: int = 1) -> date:
    d = date.today() + timedelta(days=days_ahead_min)
    while d.weekday() != weekday:
        d += timedelta(days=1)
    return d


def _create_payload(venue_id, price=150000, weeks=6, day_of_week=2, down_payment=None,
                    auto_renew=False):
    start = _next_weekday(day_of_week)
    payload = {
        "venue_id": venue_id,
        "start_date": start.isoformat(),
        "end_date": (start + timedelta(days=7 * weeks)).isoformat(),
        "day_of_week": day_of_week,
        "start_time": "18:00",
        "recurrence": RecurrenceType.WEEKLY.value,
        "discounted_price": price,
        "description": "قرارداد تست",
        "auto_renew": auto_renew,
    }
    if down_payment is not None:
        payload["down_payment_amount"] = down_payment
    return payload


def _create_contract(client, seed, db, manager_phone, venue_id, **overrides_kw):
    _, user_phone = _make_user(seed, "09114000100")
    payload = _create_payload(venue_id, **overrides_kw)
    r = client.post("/api/v1/contracts/", json=payload, headers=auth(user_phone))
    assert r.status_code == 200, r.text
    return r.json(), user_phone


def _contract_slots(cid):
    with _fresh() as s:
        return s.exec(select(ContractSlot).where(ContractSlot.contract_id == cid)).all()


def _contract_slot_rows(cid):
    with _fresh() as s:
        return s.exec(select(Slot).where(Slot.contract_id == cid)).all()


def _audit_actions(cid):
    with _fresh() as s:
        rows = s.exec(select(ContractAuditEvent).where(
            ContractAuditEvent.contract_id == cid).order_by(
            ContractAuditEvent.created_at, ContractAuditEvent.id)).all()
        return [r.action for r in rows]


# ─────────────────────────── درخواست: PENDING + RESERVED ───────────────────────────

def test_creation_is_pending_with_reserved_slots(client, db, seed, sent_notifications, fake_redis):
    m_id, m_phone = _make_manager(seed, "09114000201")
    vid = _make_venue(db, m_id)
    body, user_phone = _create_contract(client, seed, db, m_phone, vid)
    assert body["status"] == "pending"
    cid = body["id"]
    slots = _contract_slot_rows(cid)
    assert len(slots) == 7  # هفتگی ۶ هفته = ۷ سانس
    for sl in slots:
        assert sl.status == SlotStatus.RESERVED
        assert sl.is_contract_slot is True
    csls = _contract_slots(cid)
    assert all(c.status == ContractSlotStatus.SCHEDULED for c in csls)
    assert _audit_actions(cid) == [ContractAuditAction.CREATED]
    types = [n["type"] for n in sent_notifications]
    assert "contract" in types and "contract_pending" in types
    assert any(n["user_id"] == m_id for n in sent_notifications)


# ─────────────────────────── صف تأیید مدیر ───────────────────────────

def test_manager_pending_and_all_lists(client, db, seed, fake_redis):
    m_id, m_phone = _make_manager(seed, "09114000202")
    vid = _make_venue(db, m_id)
    body, _ = _create_contract(client, seed, db, m_phone, vid)
    r = client.get("/api/v1/contracts/manager/pending", headers=auth(m_phone))
    assert r.status_code == 200, r.text
    rows = r.json()
    assert len(rows) == 1
    row = rows[0]
    assert row["venue_name"] == "سالن قرارداد"
    assert row["user_full_name"]
    assert row["total_sessions"] == 7
    assert row["contract"]["id"] == body["id"]

    r2 = client.get("/api/v1/contracts/manager/all",
                    params={"status": "pending", "venue_id": vid}, headers=auth(m_phone))
    assert r2.status_code == 200 and len(r2.json()) == 1
    r3 = client.get("/api/v1/contracts/manager/all",
                    params={"status": "active"}, headers=auth(m_phone))
    assert r3.status_code == 200 and r3.json() == []


# ─────────────────────────── تأیید با اصلاحات ───────────────────────────

def test_approve_with_amendment_reprices_future_slots(client, db, seed, sent_notifications, fake_redis):
    m_id, m_phone = _make_manager(seed, "09114000203")
    vid = _make_venue(db, m_id)
    body, _ = _create_contract(client, seed, db, m_phone, vid, price=150000)
    cid = body["id"]
    r = client.post(f"/api/v1/contracts/{cid}/approve",
                    json={"adjusted_price_per_session": 160000,
                          "cancellation_policy": "لغو تا ۴۸ ساعت قبل از سانس"},
                    headers=auth(m_phone))
    assert r.status_code == 200, r.text
    got = r.json()
    assert got["status"] == "active"
    assert got["discounted_price"] == 160000
    assert got["total_amount"] == 7 * 160000
    assert got["cancellation_policy"].startswith("لغو")
    with _fresh() as s:
        c = s.get(Contract, cid)
        assert c.status == ContractStatus.ACTIVE and c.approved_at is not None
        assert c.approved_by == m_id
    for sl in _contract_slot_rows(cid):
        assert sl.status == SlotStatus.RESERVED
        assert sl.current_price == 160000
    actions = _audit_actions(cid)
    assert actions == [ContractAuditAction.CREATED, ContractAuditAction.APPROVED,
                       ContractAuditAction.AMENDED_ON_APPROVAL]
    assert any(n["type"] == "contract_approved" and n["user_id"] != m_id
               for n in sent_notifications)


def test_approve_requires_pending_status(client, db, seed, fake_redis):
    m_id, m_phone = _make_manager(seed, "09114000204")
    vid = _make_venue(db, m_id)
    body, _ = _create_contract(client, seed, db, m_phone, vid)
    cid = body["id"]
    ok = client.post(f"/api/v1/contracts/{cid}/approve", json={}, headers=auth(m_phone))
    assert ok.status_code == 200
    twice = client.post(f"/api/v1/contracts/{cid}/approve", json={}, headers=auth(m_phone))
    assert twice.status_code == 400


def test_approve_max_sessions_growth_shrinks_schedule(client, db, seed, fake_redis):
    m_id, m_phone = _make_manager(seed, "09114000205")
    vid = _make_venue(db, m_id)
    body, _ = _create_contract(client, seed, db, m_phone, vid, price=120000)
    cid = body["id"]
    r = client.post(f"/api/v1/contracts/{cid}/approve",
                    json={"max_sessions": 5}, headers=auth(m_phone))
    assert r.status_code == 200, r.text
    assert r.json()["total_amount"] == 5 * 120000
    csls = [c for c in _contract_slots(cid) if c.status == ContractSlotStatus.SCHEDULED]
    assert len(csls) == 5
    with _fresh() as s:
        # دو سانس اضافی باید از ید قرارداد آزاد شده باشند
        free = s.exec(select(Slot).where(Slot.venue_id == vid,
                                         Slot.status == SlotStatus.AVAILABLE)).all()
        assert len(free) == 2
        assert all(not f.is_contract_slot and f.contract_id is None for f in free)


def test_approve_max_sessions_below_played_rejected(client, db, seed, fake_redis):
    """قرارداد با occurrence گذشته؛ سقف کمتر از برگزارشده → ۴۰۰."""
    m_id, m_phone = _make_manager(seed, "09114000206")
    vid = _make_venue(db, m_id)
    u_id, u_phone = _make_user(seed, "09114000207")
    start = date.today() - timedelta(days=(date.today().weekday() - 2) % 7 or 7) - timedelta(days=7)  # دو occurrence گذشته
    payload = {
        "venue_id": vid,
        "start_date": start.isoformat(),
        "end_date": (date.today() + timedelta(days=21)).isoformat(),
        "day_of_week": 2, "start_time": "18:00",
        "recurrence": "weekly", "discounted_price": 150000,
    }
    r = client.post("/api/v1/contracts/", json=payload, headers=auth(u_phone))
    assert r.status_code == 200, r.text
    cid = r.json()["id"]
    bad = client.post(f"/api/v1/contracts/{cid}/approve", json={"max_sessions": 1},
                      headers=auth(m_phone))
    assert bad.status_code == 400, bad.text
    ok = client.post(f"/api/v1/contracts/{cid}/approve", json={}, headers=auth(m_phone))
    assert ok.status_code == 200, ok.text


# ─────────────────────────── رد قرارداد ───────────────────────────

def test_reject_requires_reason_and_frees_future_slots(client, db, seed, sent_notifications, fake_redis):
    m_id, m_phone = _make_manager(seed, "09114000208")
    vid = _make_venue(db, m_id)
    body, _ = _create_contract(client, seed, db, m_phone, vid)
    cid = body["id"]
    bad = client.post(f"/api/v1/contracts/{cid}/reject", json={}, headers=auth(m_phone))
    assert bad.status_code == 422  # reason الزامی
    r = client.post(f"/api/v1/contracts/{cid}/reject",
                    json={"reason": "تداخل با برنامه رقابت"}, headers=auth(m_phone))
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "rejected"
    assert r.json()["reject_reason"] == "تداخل با برنامه رقابت"
    for sl in _contract_slot_rows(cid):
        assert sl.status == SlotStatus.AVAILABLE
        assert sl.is_contract_slot is False
    csls = _contract_slots(cid)
    assert all(c.status == ContractSlotStatus.EXCLUDED for c in csls)
    actions = _audit_actions(cid)
    assert actions[-1] == ContractAuditAction.REJECTED
    assert any(n["type"] == "contract_rejected" for n in sent_notifications)


# ─────────────────────────── لغو توسط کاربر ───────────────────────────

def test_user_cancel_frees_future_and_records_reason(client, db, seed, sent_notifications, fake_redis):
    m_id, m_phone = _make_manager(seed, "09114000209")
    vid = _make_venue(db, m_id)
    body, user_phone = _create_contract(client, seed, db, m_phone, vid)
    cid = body["id"]
    client.post(f"/api/v1/contracts/{cid}/approve", json={}, headers=auth(m_phone))
    r = client.post(f"/api/v1/contracts/{cid}/cancel",
                    json={"reason": "تغییر برنامه تیم"}, headers=auth(user_phone))
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "cancelled"
    assert r.json()["cancel_reason"] == "تغییر برنامه تیم"
    for sl in _contract_slot_rows(cid):
        assert sl.status == SlotStatus.AVAILABLE and sl.is_contract_slot is False
    assert any(n["type"] == "contract_cancelled" for n in sent_notifications)


def test_cancel_expired_full_past_contract_rejected(client, db, seed, fake_redis):
    """سیاست لغو: قرارداد تمام‌شده (end_date گذشته) لغو نمی‌شود."""
    m_id, m_phone = _make_manager(seed, "09114000210")
    vid = _make_venue(db, m_id)
    u_id, u_phone = _make_user(seed, "09114000211")
    with _fresh() as s:
        c = Contract(user_id=u_id, venue_id=vid,
                     start_date=date.today() - timedelta(days=40),
                     end_date=date.today() - timedelta(days=2),
                     day_of_week=2, start_time=dtime(18, 0),
                     original_price=200000, discounted_price=150000,
                     total_amount=600000, status=ContractStatus.ACTIVE)
        s.add(c); s.commit(); s.refresh(c)
        cid = c.id
    from app.models.contract import PaymentStatus
    r = client.post(f"/api/v1/contracts/{cid}/cancel", json={"reason": "لغو"},
                    headers=auth(u_phone))
    assert r.status_code == 400
    assert "گذشته" in r.json()["detail"] or "تمام" in r.json()["detail"]


# ─────────────────────────── دسترسی/Visibility ───────────────────────────

def test_detail_owner_manager_ok_other_user_403(client, db, seed, fake_redis):
    m_id, m_phone = _make_manager(seed, "09114000212")
    vid = _make_venue(db, m_id)
    body, user_phone = _create_contract(client, seed, db, m_phone, vid)
    cid = body["id"]
    other_id, other_phone = _make_user(seed, "09114000213")
    r_owner = client.get(f"/api/v1/contracts/{cid}", headers=auth(user_phone))
    assert r_owner.status_code == 200
    det = r_owner.json()
    assert det["venue_name"] == "سالن قرارداد"
    assert "economics" in det and det["economics"]["total_sessions"] == 7
    assert len(det["sessions"]) == 7
    r_mgr = client.get(f"/api/v1/contracts/{cid}", headers=auth(m_phone))
    assert r_mgr.status_code == 200
    r_other = client.get(f"/api/v1/contracts/{cid}", headers=auth(other_phone))
    assert r_other.status_code == 403


def test_user_list_only_own_contracts(client, db, seed, fake_redis):
    m_id, m_phone = _make_manager(seed, "09114000214")
    vid = _make_venue(db, m_id)
    body, user_phone = _create_contract(client, seed, db, m_phone, vid)
    other_id, other_phone = _make_user(seed, "09114000215")
    mine = client.get("/api/v1/contracts/", headers=auth(user_phone)).json()
    theirs = client.get("/api/v1/contracts/", headers=auth(other_phone)).json()
    assert [c["id"] for c in mine] == [body["id"]]
    assert theirs == []


def test_cross_venue_manager_cannot_act(client, db, seed, fake_redis):
    m_id, m_phone = _make_manager(seed, "09114000216")
    vid = _make_venue(db, m_id)
    body, _ = _create_contract(client, seed, db, m_phone, vid)
    cid = body["id"]
    m2_id, m2_phone = _make_manager(seed, "09114000217")
    with _fresh() as s:
        v2 = Venue(name="سالن دیگر", address="آدرس", latitude=35.7, longitude=51.4,
                   manager_id=m2_id)
        s.add(v2); s.commit()
    a = client.get("/api/v1/contracts/manager/pending", headers=auth(m2_phone)).json()
    assert a == []
    for path, payload in (
        (f"/api/v1/contracts/{cid}/approve", {}),
        (f"/api/v1/contracts/{cid}/reject", {"reason": "دلیل تستی"}),
    ):
        r = client.post(path, json=payload, headers=auth(m2_phone))
        assert r.status_code == 403, path


# ─────────────────────────── ممیزی: ترتیب کامل ───────────────────────────

def test_audit_trail_full_ordering(client, db, seed, fake_redis):
    m_id, m_phone = _make_manager(seed, "09114000218")
    vid = _make_venue(db, m_id)
    body, user_phone = _create_contract(client, seed, db, m_phone, vid)
    cid = body["id"]
    client.post(f"/api/v1/contracts/{cid}/approve",
                json={"adjusted_price_per_session": 140000}, headers=auth(m_phone))
    client.post(f"/api/v1/contracts/{cid}/cancel",
                json={"reason": "لغو تیم"}, headers=auth(user_phone))
    r = client.get(f"/api/v1/contracts/{cid}/audit", headers=auth(user_phone))
    assert r.status_code == 200
    events = r.json()
    order = [e["action"] for e in events]
    assert order == ["created", "approved", "amended_on_approval", "cancelled"]
    approved = events[1]["data"]
    assert approved["price_per_session"] == 140000
    amend = events[2]["data"]
    assert amend["before"]["price"] == 150000 and amend["after"]["price"] == 140000
    cancelled = events[3]["data"]
    assert cancelled["freed_slots"] == 7


# ─────────────────────────── تسک انقضا: تمدید خودکار / انقضا / COMPLETED ───────────────────────────

def test_auto_renew_extends_term_and_materializes_new_sessions(client, db, seed, fake_redis):
    from app.tasks.contract_tasks import check_expired_contracts
    m_id, m_phone = _make_manager(seed, "09114000219")
    vid = _make_venue(db, m_id)
    body, _ = _create_contract(client, seed, db, m_phone, vid, price=140000, auto_renew=True)
    cid = body["id"]
    client.post(f"/api/v1/contracts/{cid}/approve", json={}, headers=auth(m_phone))
    with _fresh() as s:
        c = s.get(Contract, cid)
        term = (c.end_date - c.start_date).days
        old_end = c.end_date
        c.end_date = date.today() - timedelta(days=1)  # مهلت تمام‌شده
        s.add(c); s.commit()
    result = check_expired_contracts()
    assert result["renewed_count"] == 1
    with _fresh() as s:
        c = s.get(Contract, cid)
        assert c.status == ContractStatus.ACTIVE
        # term = max(end-start,7) پس از تغییر end به دیروز → ۷ روز به جلو رفته
        assert c.end_date == date.today() - timedelta(days=1) + timedelta(days=7)
        assert c.total_amount > body["total_amount"]
    assert ContractAuditAction.RENEWED in _audit_actions(cid)
    future = [c2 for c2 in _contract_slots(cid)
              if c2.status == ContractSlotStatus.SCHEDULED]
    assert future, "سانس جدید برای دوره تمدید ساخته نشده"


def test_auto_renew_with_objection_expires(client, db, seed, fake_redis):
    from app.tasks.contract_tasks import check_expired_contracts
    m_id, m_phone = _make_manager(seed, "09114000220")
    vid = _make_venue(db, m_id)
    body, _ = _create_contract(client, seed, db, m_phone, vid, price=140000, auto_renew=True)
    cid = body["id"]
    client.post(f"/api/v1/contracts/{cid}/approve", json={}, headers=auth(m_phone))
    with _fresh() as s:
        c = s.get(Contract, cid)
        c.end_date = date.today() - timedelta(days=1)
        c.renewal_objection = True
        s.add(c); s.commit()
    result = check_expired_contracts()
    assert result["expired_count"] == 1
    with _fresh() as s:
        assert s.get(Contract, cid).status == ContractStatus.EXPIRED


def test_expiry_task_marks_past_scheduled_completed_keeps_slot(client, db, seed, fake_redis):
    from app.tasks.contract_tasks import check_expired_contracts
    m_id, m_phone = _make_manager(seed, "09114000221")
    vid = _make_venue(db, m_id)
    u_id, u_phone = _make_user(seed, "09114000222")
    start = date.today() - timedelta(days=(date.today().weekday() - 2) % 7 or 7)
    payload = {
        "venue_id": vid, "start_date": start.isoformat(),
        "end_date": (date.today() + timedelta(days=21)).isoformat(),
        "day_of_week": 2, "start_time": "18:00",
        "recurrence": "weekly", "discounted_price": 150000,
    }
    cid = client.post("/api/v1/contracts/", json=payload, headers=auth(u_phone)).json()["id"]
    client.post(f"/api/v1/contracts/{cid}/approve", json={}, headers=auth(m_phone))
    result = check_expired_contracts()
    assert result["completed_sessions"] >= 1
    past = [c for c in _contract_slots(cid) if c.session_date < date.today()]
    assert all(c.status == ContractSlotStatus.COMPLETED for c in past)
    with _fresh() as s:
        st = s.get(Slot, past[0].slot_id).status
        assert st in (SlotStatus.RESERVED, SlotStatus.BOOKED)  # سانس واقعی دست‌نخورده (مستند)
    future = [c for c in _contract_slots(cid) if c.session_date > date.today()]
    assert all(c.status == ContractSlotStatus.SCHEDULED for c in future)
