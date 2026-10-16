# backend/tests/test_admin_approval_flow.py
"""مسیر حساس ۲: درخواست سالن/مدیر ← تأیید مدیر نرم‌افزار ← فعال‌سازی دسترسی.

تأیید یا رد حساب و تأیید سالن باید برای کاربر «بازخورد» داشته باشد (اعلان
درون‌برنامگی) و تغییر وضعیت حساب در ممیزی امنیتی ثبت شود.
"""
from sqlmodel import Session, select

import app.services.pending_booking_service as pbs_module
import app.utils.rate_limit as rate_limit_module
from app.models.staff import SecurityAuditEvent
from app.models.user import User, UserRole
from app.models.venue import Venue
from helpers import auth, FakeRedis

import pytest
from conftest import test_engine


@pytest.fixture()
def fake_redis(monkeypatch):
    fake = FakeRedis()
    monkeypatch.setattr(pbs_module, "_client", fake)
    monkeypatch.setattr(rate_limit_module, "_client", fake)
    return fake


def _fresh():
    return Session(test_engine)


def _mk(seed, phone, role):
    u = seed["user"](phone, full_name=f"نام {phone}", role=role)
    return u.id, u.phone


def _mk_venue(db, manager_id, name="سالن تأیید"):
    venue = Venue(name=name, address="آدرس", latitude=35.7, longitude=51.4,
                  phone="09120000001", manager_id=manager_id)
    db.add(venue)
    db.commit()
    db.refresh(venue)
    db.close()  # آزادکردن write-lock (BEGIN IMMEDIATE) تا handler قفل نکند
    return venue.id


def _audits(action, target_id):
    with _fresh() as s:
        return s.exec(select(SecurityAuditEvent).where(
            SecurityAuditEvent.action == action,
            SecurityAuditEvent.target_id == target_id)).all()


def _notif(sent, notif_type, user_id):
    return [n for n in sent if n["type"] == notif_type and n["user_id"] == user_id]


# ─────────────────────────── تأیید حساب مدیر سالن ───────────────────────────

def test_pending_manager_is_listed_then_approved_with_feedback(client, seed, sent_notifications, fake_redis):
    a_id, a_phone = _mk(seed, "09115000101", UserRole.SUPER_ADMIN)
    m_id, m_phone = _mk(seed, "09115000102", UserRole.VENUE_MANAGER)

    pending = client.get("/api/v1/admin/pending-managers", headers=auth(a_phone))
    assert pending.status_code == 200
    assert m_id in [u["id"] for u in pending.json()]

    r = client.post(f"/api/v1/admin/users/{m_id}/approve", headers=auth(a_phone))
    assert r.status_code == 200, r.text

    with _fresh() as s:
        u = s.get(User, m_id)
        assert u.is_verified is True and u.is_active is True

    # بازخورد به کاربر: اعلان درون‌برنامگی برای همان مدیر
    assert len(_notif(sent_notifications, "account_approved", m_id)) == 1
    # ردپای ممیزی: چه کسی، چه کسی را تأیید کرد
    rows = _audits("admin.user_approved", m_id)
    assert len(rows) == 1 and rows[0].actor_id == a_id


def test_rejected_account_is_deactivated_and_the_user_is_told(client, seed, sent_notifications, fake_redis):
    a_id, a_phone = _mk(seed, "09115000103", UserRole.SUPER_ADMIN)
    m_id, _ = _mk(seed, "09115000104", UserRole.VENUE_MANAGER)

    r = client.post(f"/api/v1/admin/users/{m_id}/reject", headers=auth(a_phone))
    assert r.status_code == 200, r.text

    with _fresh() as s:
        u = s.get(User, m_id)
        assert u.is_verified is False and u.is_active is False

    assert len(_notif(sent_notifications, "account_rejected", m_id)) == 1
    assert len(_audits("admin.user_rejected", m_id)) == 1


def test_unknown_user_returns_404_and_no_notification(client, seed, sent_notifications, fake_redis):
    a_id, a_phone = _mk(seed, "09115000105", UserRole.SUPER_ADMIN)
    assert client.post("/api/v1/admin/users/999999/approve",
                       headers=auth(a_phone)).status_code == 404
    assert client.post("/api/v1/admin/users/999999/reject",
                       headers=auth(a_phone)).status_code == 404
    assert sent_notifications == []


def test_ordinary_user_cannot_approve_accounts(client, seed, sent_notifications, fake_redis):
    _, phone = _mk(seed, "09115000106", UserRole.USER)
    victim, _ = _mk(seed, "09115000107", UserRole.VENUE_MANAGER)
    assert client.post(f"/api/v1/admin/users/{victim}/approve",
                       headers=auth(phone)).status_code == 403
    with _fresh() as s:
        assert s.get(User, victim).is_verified is False
    assert sent_notifications == []


# ─────────────────────────── تأیید سالن (فعال‌سازی دسترسی) ───────────────────────────

def test_verify_venue_activates_the_hall_and_notifies_its_manager(client, db, seed, sent_notifications, fake_redis):
    a_id, a_phone = _mk(seed, "09115000108", UserRole.SUPER_ADMIN)
    m_id, _ = _mk(seed, "09115000109", UserRole.VENUE_MANAGER)
    vid = _mk_venue(db, m_id, name="سالن کوثر")

    stats_before = client.get("/api/v1/admin/stats/venues", headers=auth(a_phone)).json()
    assert stats_before["pending_venues"] == 1

    r = client.post(f"/api/v1/admin/verify-venue/{vid}", headers=auth(a_phone))
    assert r.status_code == 200, r.text

    with _fresh() as s:
        venue = s.get(Venue, vid)
        assert venue.is_verified is True

    stats = client.get("/api/v1/admin/stats/venues", headers=auth(a_phone)).json()
    assert stats["verified_venues"] == 1 and stats["pending_venues"] == 0

    notes = _notif(sent_notifications, "venue_verified", m_id)
    assert len(notes) == 1
    assert notes[0]["data"]["venue_name"] == "سالن کوثر"


def test_verify_unknown_venue_returns_404(client, seed, sent_notifications, fake_redis):
    a_id, a_phone = _mk(seed, "09115000111", UserRole.SUPER_ADMIN)
    assert client.post("/api/v1/admin/verify-venue/987654",
                       headers=auth(a_phone)).status_code == 404
