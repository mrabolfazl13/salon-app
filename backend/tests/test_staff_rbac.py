# backend/tests/test_staff_rbac.py
"""کارکنان RBAC (brief §10) — چرخه عمر انتصاب، ماتریس دسترسی سربه‌سر، ممیزی امنیتی."""
from datetime import date, datetime, time as dtime, timedelta, timezone

import pytest
from sqlmodel import Session, select

import app.services.pending_booking_service as pbs_module
import app.utils.rate_limit as rate_limit_module
from app.models.booking import Booking, BookingStatus
from app.models.slot import Slot, SlotStatus
from app.models.staff import SecurityAuditEvent, StaffAssignment
from app.models.transaction import (
    ExpenseCategory, FinancialTransaction, TransactionType,
)
from app.models.user import User, UserRole
from app.models.venue import Venue
from helpers import auth, FakeRedis
from conftest import test_engine

DENIED = "اجازه دسترسی ندارید"


@pytest.fixture()
def fake_redis(monkeypatch):
    fake = FakeRedis()
    monkeypatch.setattr(pbs_module, "_client", fake)
    monkeypatch.setattr(rate_limit_module, "_client", fake)
    return fake


def _fresh():
    return Session(test_engine)


def _user(phone, role=UserRole.USER, verified=True):
    with _fresh() as s:
        u = User(phone=phone, full_name=f"کارب {phone}", hashed_password="x",
                 role=role, is_verified=verified)
        s.add(u); s.commit(); s.refresh(u)
        return u


def _venue(manager_id):
    with _fresh() as s:
        v = Venue(name="سالن RBAC", address="آ", latitude=35.7, longitude=51.4,
                  manager_id=manager_id)
        s.add(v); s.commit(); s.refresh(v)
        return v


def _slot(venue_id, day=None, status=SlotStatus.AVAILABLE, **kw):
    with _fresh() as s:
        sl = Slot(venue_id=venue_id, slot_date=day or (date.today() + timedelta(days=2)),
                  start_time=kw.get("start", dtime(18, 0)), duration=90,
                  base_price=200000, current_price=200000, status=status)
        s.add(sl); s.commit(); s.refresh(sl)
        return sl


def _env(client, tag, position="reception"):
    """مدیر+سالن + یک کارمند با موقعیت خواسته‌شده (از طریق API واقعی)."""
    m = _user(f"09355000{tag}", UserRole.VENUE_MANAGER)
    m_phone = m.phone
    v = _venue(m.id)
    staff = _user(f"0935612{tag}")
    r = client.post("/api/v1/staff/",
                    json={"phone": staff.phone, "venue_id": v.id,
                          "position": position}, headers=auth(m_phone))
    assert r.status_code == 201, r.text
    return {"m": m, "m_phone": m_phone, "v": v, "staff": staff, "assignment": r.json()}


# ─────────────────────────── چرخه عمر انتصاب ───────────────────────────

def test_create_notify_audit_and_matrix(client, sent_notifications):
    env = _env(client, "01", "reception")
    body = env["assignment"]
    assert body["position"] == "reception" and body["is_active"] is True
    assert body["is_custom_permissions"] is False
    assert sorted(body["permissions"]) == sorted([
        "booking.view", "booking.confirm", "booking.pending_list",
        "slot.view_manager", "slot.block", "customer.view_basic",
        "deal.publish", "contract.view"])
    # اعلان به کاربر
    assert any(n["type"] == "staff_assigned" and n["user_id"] == env["staff"].id
               for n in sent_notifications)
    # ردیف ممیزی در همان UoW
    with _fresh() as s:
        ev = s.exec(select(SecurityAuditEvent).where(
            SecurityAuditEvent.action == "staff.created")).first()
        assert ev is not None and ev.venue_id == env["v"].id
        assert ev.target_type == "staff_assignment"
    # تلفیقی: GET لیست
    rows = client.get(f"/api/v1/staff/?venue_id={env['v'].id}",
                      headers=auth(env["m_phone"])).json()
    assert len(rows) == 1 and rows[0]["user_phone"] == env["staff"].phone


def test_assign_unknown_phone_owner_and_duplicate(client):
    m = _user("09355000901", UserRole.VENUE_MANAGER)
    v = _venue(m.id)
    r = client.post("/api/v1/staff/", json={"phone": "09999999999", "venue_id": v.id,
                                            "position": "cashier"}, headers=auth(m.phone))
    assert r.status_code == 404 and "ثبت نشده" in r.json()["detail"]
    r = client.post("/api/v1/staff/", json={"phone": m.phone, "venue_id": v.id,
                                            "position": "cashier"}, headers=auth(m.phone))
    assert r.status_code == 400 and "مالک" in r.json()["detail"]
    u = _user("09355000902")
    ok = client.post("/api/v1/staff/", json={"phone": u.phone, "venue_id": v.id,
                                             "position": "cashier"}, headers=auth(m.phone))
    assert ok.status_code == 201
    dup = client.post("/api/v1/staff/", json={"phone": u.phone, "venue_id": v.id,
                                              "position": "cashier"}, headers=auth(m.phone))
    assert dup.status_code == 409


def test_lifecycle_update_remove_revive(client):
    m = _user("09355000910", UserRole.VENUE_MANAGER)
    v = _venue(m.id)
    u = _user("09355000911")
    r = client.post("/api/v1/staff/", json={"phone": u.phone, "venue_id": v.id,
                                            "position": "reception"}, headers=auth(m.phone))
    assert r.status_code == 201
    aid = r.json()["id"]
    # سفارشی‌سازی permissions
    r = client.put(f"/api/v1/staff/{aid}", json={"permissions": ["booking.view"]},
                   headers=auth(m.phone))
    assert r.status_code == 200 and r.json()["permissions"] == ["booking.view"]
    assert r.json()["is_custom_permissions"] is True
    # کد نامعتبر → ۴۰۰
    r = client.put(f"/api/v1/staff/{aid}", json={"permissions": ["hacker.mode"]},
                   headers=auth(m.phone))
    assert r.status_code == 400
    # تغییر موقعیت + تغییر دسترسی مؤثر
    r = client.put(f"/api/v1/staff/{aid}", json={"position": "cashier"},
                   headers=auth(m.phone))
    assert r.status_code == 200
    # حذف نرم
    r = client.delete(f"/api/v1/staff/{aid}", headers=auth(m.phone))
    assert r.status_code == 200
    with _fresh() as s:
        a = s.get(StaffAssignment, aid)
        assert a.is_active is False and a.removed_at is not None
    # حذف دوباره → ۴۰۰
    assert client.delete(f"/api/v1/staff/{aid}", headers=auth(m.phone)).status_code == 400
    # انتصاب مجدد ⇒ همان ردیف revive می‌شود (uq حفظ)
    r = client.post("/api/v1/staff/", json={"phone": u.phone, "venue_id": v.id,
                                            "position": "accountant"}, headers=auth(m.phone))
    assert r.status_code == 201, r.text
    assert r.json()["id"] == aid
    with _fresh() as s:
        all_rows = s.exec(select(StaffAssignment).where(
            StaffAssignment.user_id == u.id)).all()
        assert len(all_rows) == 1 and all_rows[0].removed_at is None
    # ممیزی‌ها
    with _fresh() as s:
        actions = [e.action for e in s.exec(select(SecurityAuditEvent)).all()]
    assert "staff.updated" in actions and "staff.removed" in actions \
        and "staff.recreated" in actions


def test_staff_cannot_manage_staff_but_branch_manager_can(client):
    env = _env(client, "20", "reception")
    r = client.post("/api/v1/staff/", json={"phone": "09355999999",
                                            "venue_id": env["v"].id,
                                            "position": "cashier"},
                    headers=auth(env["staff"].phone))
    assert r.status_code == 403 and r.json()["detail"] == DENIED
    # branch_manager (staff) مجاز + ممیزی actor
    m2 = _user("09355000225", UserRole.VENUE_MANAGER)
    v2 = _venue(m2.id)
    b = _user("09355000226")
    assert client.post("/api/v1/staff/", json={"phone": b.phone, "venue_id": v2.id,
                                               "position": "branch_manager"},
                       headers=auth(m2.phone)).status_code == 201
    c = _user("09355000227")
    r = client.post("/api/v1/staff/", json={"phone": c.phone, "venue_id": v2.id,
                                            "position": "cashier"}, headers=auth(b.phone))
    assert r.status_code == 201, r.text
    with _fresh() as s:
        ev = s.exec(select(SecurityAuditEvent).where(
            SecurityAuditEvent.actor_id == b.id,
            SecurityAuditEvent.action == "staff.created")).first()
        assert ev is not None


def test_non_owner_cannot_assign(client):
    m = _user("09355000930", UserRole.VENUE_MANAGER)
    v = _venue(m.id)
    other = _user("09355000931", UserRole.VENUE_MANAGER)
    stranger = _user("09355000932")
    assert client.get(f"/api/v1/staff/?venue_id={v.id}",
                      headers=auth(other.phone)).status_code == 403
    assert client.get(f"/api/v1/staff/?venue_id={v.id}",
                      headers=auth(stranger.phone)).status_code == 403


# ─────────────────────────── ماتریس دسترسی ───────────────────────────

def _make_pending(client, env, u_phone, day=None):
    sl = _slot(env["v"].id, day)
    r = client.post("/api/v1/bookings/", json={"slot_id": sl.id}, headers=auth(u_phone))
    assert r.status_code == 200, r.text
    return sl, r.json()["id"]


def test_reception_can_confirm_pending_but_not_finance(client, fake_redis,
                                                       sent_notifications):
    env = _env(client, "30", "reception")
    cust = _user("09355000301")
    _slot_, pid = _make_pending(client, env, cust.phone)
    r = client.get(f"/api/v1/bookings/venue/{env['v'].id}/pending",
                   headers=auth(env["staff"].phone))
    assert r.status_code == 200 and len(r.json()) == 1
    r = client.post(f"/api/v1/bookings/pending/{pid}/confirm",
                    headers=auth(env["staff"].phone))
    assert r.status_code == 200, r.text
    with _fresh() as s:
        assert s.exec(select(Booking)).first() is not None
    # رد هم با reception مجاز (booking.confirm)
    _sl2, pid2 = _make_pending(client, env, cust.phone)
    r = client.post(f"/api/v1/bookings/pending/{pid2}/reject",
                    headers=auth(env["staff"].phone))
    assert r.status_code == 200
    # ولی مالی نه
    r = client.get(f"/api/v1/finance/transactions?venue_id={env['v'].id}",
                   headers=auth(env["staff"].phone))
    assert r.status_code == 403 and r.json()["detail"] == DENIED
    # انکار در ممیزی امنیتی ثبت شد (middleware پس از پاسخ — best effort)
    with _fresh() as s:
        den = s.exec(select(SecurityAuditEvent).where(
            SecurityAuditEvent.action == "permission.denied",
            SecurityAuditEvent.actor_id == env["staff"].id)).first()
        assert den is not None and den.venue_id == env["v"].id
        assert "finance.view" in den.data


def test_cashier_expense_yes_void_no_accountant_void_ok(client, fake_redis):
    env = _env(client, "40", "cashier")
    with _fresh() as s:
        cat = ExpenseCategory(name="برق", venue_id=env["v"].id)
        s.add(cat); s.commit(); s.refresh(cat)
        cat_id = cat.id
    cust = _user("09355000401")
    # ثبت هزینه توسط کشیر (cashier)
    r = client.post("/api/v1/finance/transactions",
                    json={"type": "expense", "direction": "expense", "amount": 50000,
                          "venue_id": env["v"].id, "expense_category_id": cat_id},
                    headers=auth(env["staff"].phone))
    assert r.status_code == 201, r.text
    tx_id = r.json()["id"]
    # ابطال توسط cashier ⇒ ۴۰۳
    r = client.post(f"/api/v1/finance/transactions/{tx_id}/void",
                    json={"reason": "تست"}, headers=auth(env["staff"].phone))
    assert r.status_code == 403
    # ثبت دریافت نقدی توسط cashier (manual income)
    r = client.post("/api/v1/finance/transactions",
                    json={"type": "payment", "direction": "income", "amount": 70000,
                          "venue_id": env["v"].id, "counterparty": cust.id},
                    headers=auth(env["staff"].phone))
    assert r.status_code == 201, r.text
    # ابطال توسط حسابدار ⇒ ۲۰۰ + ردیف ممیزی مالی global
    b = _user("09355000402")
    r = client.post("/api/v1/staff/", json={"phone": b.phone, "venue_id": env["v"].id,
                                            "position": "accountant"},
                    headers=auth(env["m_phone"]))
    assert r.status_code == 201
    r = client.post(f"/api/v1/finance/transactions/{tx_id}/void",
                    json={"reason": "کسر اشتباه"}, headers=auth(b.phone))
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "voided"
    with _fresh() as s:
        ev = s.exec(select(SecurityAuditEvent).where(
            SecurityAuditEvent.action == "finance.transaction_void")).first()
        assert ev is not None and ev.venue_id == env["v"].id
    # حسابدار گزارش‌ها را می‌بیند:
    assert client.get(f"/api/v1/finance/dashboard?venue_id={env['v'].id}",
                      headers=auth(b.phone)).status_code == 200
    # و خروجی (finance.manage)
    assert client.get(f"/api/v1/finance/export?venue_id={env['v'].id}",
                      headers=auth(b.phone)).status_code == 200
    # cashier بدون finance.manage نمی‌تواند export بگیرد
    assert client.get(f"/api/v1/finance/export?venue_id={env['v'].id}",
                      headers=auth(env["staff"].phone)).status_code == 403


def test_owner_bypass_and_slot_generate(client, fake_redis):
    env = _env(client, "50", "reception")
    # reception بدون slot.generate ⇒ ۴۰۳
    d = (date.today() + timedelta(days=4)).isoformat()
    r = client.post(f"/api/v1/slots/venue/{env['v'].id}/generate?slot_date={d}",
                    headers=auth(env["staff"].phone))
    assert r.status_code == 403
    # مالک ⇒ بایپس
    assert client.post(f"/api/v1/slots/venue/{env['v'].id}/generate?slot_date={d}",
                       headers=auth(env["m_phone"])).status_code == 200
    # branch_manager staff ⇒ مجاز
    bm = _user("09355000506")
    assert client.post("/api/v1/staff/", json={"phone": bm.phone, "venue_id": env["v"].id,
                                               "position": "branch_manager"},
                       headers=auth(env["m_phone"])).status_code == 201
    d2 = (date.today() + timedelta(days=5)).isoformat()
    assert client.post(f"/api/v1/slots/venue/{env['v'].id}/generate?slot_date={d2}",
                       headers=auth(bm.phone)).status_code == 200


def test_non_staff_everywhere_403(client, fake_redis):
    m = _user("0935500060", UserRole.VENUE_MANAGER)
    v = _venue(m.id)
    x = _user("0935500061")
    paths_get = [
        f"/api/v1/bookings/venue/{v.id}/pending",
        f"/api/v1/finance/transactions?venue_id={v.id}",
        f"/api/v1/staff/?venue_id={v.id}",
        f"/api/v1/crm/customers?venue_id={v.id}",
        f"/api/v1/crm/stats?venue_id={v.id}",
        f"/api/v1/contracts/manager/pending",
    ]
    for p in paths_get:
        r = client.get(p, headers=auth(x.phone))
        assert r.status_code == 403, p
    # سوپرادمین: دسترسی فراگیر
    admin = _user("0935500062", UserRole.SUPER_ADMIN)
    assert client.get(f"/api/v1/staff/?venue_id={v.id}",
                      headers=auth(admin.phone)).status_code == 200
    assert client.get(f"/api/v1/finance/transactions",
                      headers=auth(admin.phone)).status_code == 200
    # دامنه‌ی کارکنan برای staff/audit
    assert client.get(f"/api/v1/staff/audit", headers=auth(x.phone)).status_code == 403


def test_staff_audits_endpoint_scope(client):
    env = _env(client, "70", "branch_manager")
    _ = client.get("/api/v1/finance/transactions",
                   headers=auth(env["staff"].phone))  # 403 استاف — دامنه None استاف
    # لیست ممیزی بدون venue_id برای staff سالن خودش (staff.audit در ALL)
    r = client.get("/api/v1/staff/audit", headers=auth(env["staff"].phone))
    assert r.status_code == 200, r.text
    types = [i["action"] for i in r.json()["items"]]
    assert "staff.created" in types
    # مالک هم مجاز است
    assert client.get("/api/v1/staff/audit", headers=auth(env["m_phone"])).status_code == 200
    # reception فقط staff.audit ندارد ⇒ 403
    r = _env(client, "71", "reception")
    assert client.get(f"/api/v1/staff/audit?venue_id={r['v'].id}",
                      headers=auth(r["staff"].phone)).status_code == 403


# ─────────────────────────── خودسرویسی /staff/me ───────────────────────────

def test_staff_me_lists_active_assignments_with_codes(client):
    env = _env(client, "80", "reception")
    r = client.get("/api/v1/staff/me", headers=auth(env["staff"].phone))
    assert r.status_code == 200, r.text
    rows = r.json()
    assert len(rows) == 1
    row = rows[0]
    assert row["id"] == env["assignment"]["id"]
    assert row["venue_id"] == env["v"].id and row["venue_name"] == env["v"].name
    assert row["position"] == "reception" and row["is_active"] is True
    assert "deal.publish" in row["permissions"]  # کدها برای مخفی‌سازی دکمه در فرانت
    # انتصاب دوم در سالن دیگر ⇒ هر دو ردیف فعال
    m2 = _user("09355000802", UserRole.VENUE_MANAGER)
    v2 = _venue(m2.id)
    assert client.post("/api/v1/staff/", json={"phone": env["staff"].phone,
                                               "venue_id": v2.id,
                                               "position": "cashier"},
                       headers=auth(m2.phone)).status_code == 201
    assert {x["venue_id"] for x in client.get("/api/v1/staff/me",
                                              headers=auth(env["staff"].phone)
                                              ).json()} == {env["v"].id, v2.id}
    # حذف نرم ⇒ ردیف از me می‌رود
    assert client.delete(f"/api/v1/staff/{row['id']}",
                         headers=auth(env["m_phone"])).status_code == 200
    venues = {x["venue_id"] for x in client.get("/api/v1/staff/me",
                                                headers=auth(env["staff"].phone)).json()}
    assert venues == {v2.id}
    # مدیر (بدون انتصاب) ⇒ [] — my-venues مثل قبل مخصوص مدیر است
    assert client.get("/api/v1/staff/me", headers=auth(env["m_phone"])).json() == []


# ─────────────────────────── ماتریس deal.publish (تأیید B5) ───────────────────────────

def test_deal_publish_matrix_reception_yes_cashier_no(client):
    env = _env(client, "81", "reception")
    sl = _slot(env["v"].id)
    r = client.post("/api/v1/deals/publish",
                    json={"venue_id": env["v"].id, "slot_ids": [sl.id],
                          "discount_percent": 20}, headers=auth(env["staff"].phone))
    assert r.status_code == 200, r.text  # reception: deal.publish دارد
    cash = _user("09355000812")
    assert client.post("/api/v1/staff/", json={"phone": cash.phone,
                                               "venue_id": env["v"].id,
                                               "position": "cashier"},
                       headers=auth(env["m_phone"])).status_code == 201
    sl2 = _slot(env["v"].id, start=dtime(19, 45))
    r = client.post("/api/v1/deals/publish",
                    json={"venue_id": env["v"].id, "slot_ids": [sl2.id],
                          "discount_percent": 25}, headers=auth(cash.phone))
    assert r.status_code == 403 and r.json()["detail"] == DENIED
    # unpublish هم همین کد را می‌خواهد
    r = client.delete(f"/api/v1/deals/{sl.id}/unpublish", headers=auth(cash.phone))
    assert r.status_code == 403
