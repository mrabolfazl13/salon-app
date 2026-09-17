# backend/tests/test_crm.py
"""CRM (brief §4) — segmentها، vip/notes، کمپینِ فقط-consent، سقف روزانه، تسک‌ها."""
from datetime import date, datetime, time as dtime, timedelta, timezone

import pytest
from sqlmodel import Session, select

import app.services.pending_booking_service as pbs_module
import app.utils.rate_limit as rate_limit_module
from app.models.booking import Booking, BookingStatus
from app.models.customer import CrmCampaign, VenueCustomer
from app.models.slot import Slot, SlotStatus
from app.models.transaction import (
    FinancialTransaction, TransactionDirection, TransactionStatus,
    TransactionType,
)
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
        u = User(phone=phone, full_name=f"مشتری {phone}", hashed_password="x", role=role)
        s.add(u); s.commit(); s.refresh(u)
        return u


def _venue_env(tag):
    m = _user(f"09390000{tag}", UserRole.VENUE_MANAGER)
    with _fresh() as s:
        v = Venue(name=f"سالن CRM {tag}", address="آ", latitude=35.7, longitude=51.4,
                  manager_id=m.id)
        s.add(v); s.commit(); s.refresh(v)
    return m, v


def _booking(venue_id, user_id, days_ago, amount=200000):
    d = date.today() - timedelta(days=days_ago)
    with _fresh() as s:
        sl = Slot(venue_id=venue_id, slot_date=d, start_time=dtime(18, 0),
                  duration=90, base_price=amount, current_price=amount,
                  status=SlotStatus.BOOKED)
        s.add(sl); s.commit(); s.refresh(sl)
        b = Booking(slot_id=sl.id, user_id=user_id, status=BookingStatus.CONFIRMED,
                    payment_amount=amount,
                    booked_at=datetime.now(timezone.utc) - timedelta(days=days_ago))
        s.add(b); s.commit()
        return b


def _payment(venue_id, user_id, amount):
    with _fresh() as s:
        tx = FinancialTransaction(type=TransactionType.PAYMENT,
                                  direction=TransactionDirection.INCOME,
                                  amount=amount, status=TransactionStatus.CLEARED,
                                  counterparty=user_id, venue_id=venue_id,
                                  description="پرداخت تست")
        s.add(tx); s.commit()
        return tx


def _seed_customers(tag):
    m, v = _venue_env(tag)
    dormant = _user(f"0939110{tag}1")
    regular = _user(f"0939110{tag}2")
    fresh = _user(f"0939110{tag}3")
    vip = _user(f"0939110{tag}4")
    at_risk = _user(f"0939110{tag}5")
    _booking(v.id, dormant.id, 120); _booking(v.id, dormant.id, 130)
    _payment(v.id, dormant.id, 1_000_000)
    for d in (2, 9, 16, 23):
        _booking(v.id, regular.id, d)
    _payment(v.id, regular.id, 300_000)
    _booking(v.id, fresh.id, 3)
    _booking(v.id, vip.id, 1)
    _booking(v.id, at_risk.id, 60)
    with _fresh() as s:
        s.add(VenueCustomer(venue_id=v.id, user_id=vip.id, is_vip=True,
                            tags="ویژه,حساس"))
        s.commit()
    return {"m": m, "v": v, "dormant": dormant, "regular": regular,
            "fresh": fresh, "vip": vip, "at_risk": at_risk}


# ─────────────────────────── لیست و segment ───────────────────────────

def test_segment_math_and_fields(client):
    e = _seed_customers("1")
    r = client.get(f"/api/v1/crm/customers?venue_id={e['v'].id}&limit=100",
                   headers=auth(e["m"].phone))
    assert r.status_code == 200, r.text
    body = r.json()
    by = {x["user_id"]: x for x in body["items"]}
    assert body["total"] == 5
    assert by[e["dormant"].id]["segment"] == "dormant"
    assert by[e["dormant"].id]["bookings_count"] == 2
    assert by[e["dormant"].id]["total_spend"] == 1_000_000
    assert 45 <= by[e["at_risk"].id]["inactive_days"] < 90
    assert by[e["at_risk"].id]["segment"] == "at_risk"
    assert by[e["fresh"].id]["segment"] == "new"
    assert by[e["regular"].id]["segment"] == "regular"
    assert by[e["vip"].id]["segment"] == "vip"
    assert by[e["vip"].id]["tags"] == ["ویژه", "حساس"]
    # مرتب‌سازی بر اساس خرج — dormant پرسرف‌ترین
    r = client.get(f"/api/v1/crm/customers?venue_id={e['v'].id}&sort=spend",
                   headers=auth(e["m"].phone))
    assert r.json()["items"][0]["user_id"] == e["dormant"].id
    # جست‌وجوی تلفن
    q = client.get(f"/api/v1/crm/customers?venue_id={e['v'].id}&search={e['fresh'].phone}",
                   headers=auth(e["m"].phone)).json()
    assert [x["user_id"] for x in q["items"]] == [e["fresh"].id]
    # فیلتر vip/تگ/status
    assert client.get(f"/api/v1/crm/customers?venue_id={e['v'].id}&is_vip=true",
                      headers=auth(e["m"].phone)).json()["total"] == 1
    assert client.get(f"/api/v1/crm/customers?venue_id={e['v'].id}&tag=حساس",
                      headers=auth(e["m"].phone)).json()["total"] == 1
    inact = client.get(f"/api/v1/crm/customers?venue_id={e['v'].id}&status=inactive",
                       headers=auth(e["m"].phone)).json()
    assert {x["user_id"] for x in inact["items"]} == {e["dormant"].id, e["at_risk"].id}
    # balance_due از منطق حساب‌ها (receivable−payment)
    with _fresh() as s:
        s.add(FinancialTransaction(type=TransactionType.RECEIVABLE,
                                   direction=TransactionDirection.INCOME, amount=90_000,
                                   status=TransactionStatus.CLEARED,
                                   counterparty=e["regular"].id, venue_id=e["v"].id))
        s.commit()
    row = client.get(f"/api/v1/crm/customers?venue_id={e['v'].id}&search={e['regular'].phone}",
                     headers=auth(e["m"].phone)).json()["items"][0]
    assert row["balance_due"] == 90_000 - 300_000


def test_detail_vip_notes_update_and_staff_read_access(client, fake_redis):
    e = _seed_customers("2")
    r = client.get(f"/api/v1/crm/customers/{e['regular'].id}?venue_id={e['v'].id}",
                   headers=auth(e["m"].phone))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["customer"]["bookings_count"] == 4
    assert len(body["recent_bookings"]) == 4
    assert "statement" in body and "closing_balance" in body["statement"]
    # به‌روزرسانی vip/notes/tags
    r = client.put(f"/api/v1/crm/customers/{e['regular'].id}?venue_id={e['v'].id}",
                   json={"is_vip": True, "tags": ["hdf", "بیمه"], "notes": "سرکار خانم"},
                   headers=auth(e["m"].phone))
    assert r.status_code == 200, r.text
    assert r.json()["is_vip"] is True and r.json()["segment"] == "vip"
    with _fresh() as s:
        vc = s.exec(select(VenueCustomer).where(
            VenueCustomer.venue_id == e["v"].id,
            VenueCustomer.user_id == e["regular"].id)).first()
        assert vc.notes == "سرکار خانم" and vc.marked_by == e["m"].id
    # staff با customer.view_basic فقط خواندنی
    st = _user("09392201001")
    assert client.post("/api/v1/staff/", json={"phone": st.phone, "venue_id": e["v"].id,
                                               "position": "reception"},
                       headers=auth(e["m"].phone)).status_code == 201
    assert client.get(f"/api/v1/crm/customers?venue_id={e['v'].id}",
                      headers=auth(st.phone)).status_code == 200
    r = client.put(f"/api/v1/crm/customers/{e['regular'].id}?venue_id={e['v'].id}",
                   json={"is_vip": False}, headers=auth(st.phone))
    assert r.status_code == 403
    # stats
    r = client.get(f"/api/v1/crm/stats?venue_id={e['v'].id}", headers=auth(e["m"].phone))
    assert r.status_code == 200
    stats = r.json()
    assert stats["total_customers"] == 5
    assert stats["segments"].get("vip", 0) >= 1 and stats["segments"].get("new", 0) >= 1
    assert stats["top_spenders"][0]["user_id"] == e["dormant"].id
    assert stats["recent_new_customers"]


# ─────────────────────────── کمپین‌ها ───────────────────────────

def _consent(client, user, venue_id, value=True):
    r = client.put("/api/v1/crm/consent",
                   json={"marketing_consent": value, "venue_id": venue_id},
                   headers=auth(user.phone))
    assert r.status_code == 200 and r.json() == {"marketing_consent": value, "updated": 1}


def test_campaign_consent_gating(client, sent_notifications):
    e = _seed_customers("3")
    _consent(client, e["regular"], e["v"].id, True)
    _consent(client, e["fresh"], e["v"].id, False)
    # خودِ consent بدون venue روی همه رکوردها
    r = client.put("/api/v1/crm/consent", json={"marketing_consent": True},
                   headers=auth(e["regular"].phone))
    assert r.status_code == 200
    # کمپین segment=regular → فقط regular با consent
    r = client.post("/api/v1/crm/campaigns",
                    json={"venue_id": e["v"].id, "segment": "regular",
                          "title": "تخفیف هفته", "message": "۲۰٪ تخفیف پنجشنبه",
                          "discount_code": "W20"},
                    headers=auth(e["m"].phone))
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["sent_count"] == 1 and body["skipped_no_consent"] >= 0
    camp = [n for n in sent_notifications if n["type"] == "crm_campaign"]
    assert [c["user_id"] for c in camp] == [e["regular"].id]
    assert "W20" in camp[0]["message"]
    # مخاطب بدون consent اعلان نمی‌گیرد: segment=new (fresh بدون consent)
    sent_notifications.clear()
    r = client.post("/api/v1/crm/campaigns",
                    json={"venue_id": e["v"].id, "segment": "new",
                          "title": "تازه‌وار", "message": "خوش آمدید"},
                    headers=auth(e["m"].phone))
    assert r.status_code == 400 and "سقف" in r.json()["detail"]  # سقف روزانه ۱
    # کمپین customer_ids بدون consent ⇒ sent=0 و هیچ نوتیفی
    with _fresh() as s:
        c1 = s.exec(select(CrmCampaign)).one()
        c1.created_at = c1.created_at - timedelta(days=1)  # آزادسازی سقف برای تست بعد
        s.add(c1); s.commit()
    r = client.post("/api/v1/crm/campaigns",
                    json={"venue_id": e["v"].id, "customer_ids": [e["fresh"].id],
                          "title": "برگشت", "message": "جایتان خالی بود"},
                    headers=auth(e["m"].phone))
    assert r.status_code == 201, r.text
    assert r.json()["sent_count"] == 0 and r.json()["skipped_no_consent"] == 1
    assert [n for n in sent_notifications if n["type"] == "crm_campaign"] == []
    with _fresh() as s:
        rows = s.exec(select(CrmCampaign)).all()
        assert len(rows) == 2
    hist = client.get(f"/api/v1/crm/campaigns?venue_id={e['v'].id}",
                      headers=auth(e["m"].phone)).json()
    assert hist["total"] == 2
    assert hist["items"][0]["sent_count"] == 0  # جدیدترین اول
    # reception نمی‌تواند کمپین بسازد (crm.manage ندارد)
    st = _user("09392203001")
    client.post("/api/v1/staff/", json={"phone": st.phone, "venue_id": e["v"].id,
                                        "position": "reception"},
                headers=auth(e["m"].phone))
    r = client.post("/api/v1/crm/campaigns",
                    json={"venue_id": e["v"].id, "segment": "vip", "title": "تست و",
                          "message": "تست پیام"}, headers=auth(st.phone))
    assert r.status_code == 403


def test_campaign_requires_segment_or_ids_and_manager(client):
    e = _seed_customers("4")
    r = client.post("/api/v1/crm/campaigns",
                    json={"venue_id": e["v"].id, "title": "عنوان تست",
                          "message": "متن تست"},
                    headers=auth(e["m"].phone))
    assert r.status_code == 400
    x = _user("09394100004")
    r = client.post("/api/v1/crm/campaigns",
                    json={"venue_id": e["v"].id, "segment": "new",
                          "title": "کمپین غریبه", "message": "تست"},
                    headers=auth(x.phone))
    assert r.status_code == 403


# ─────────────────────────── تسک‌های تمدید/خواب ───────────────────────────

def _active_contract_ending_in(client, seed_env, days):
    import json
    e = seed_env
    m, v = e["m"], e["v"]
    cust = _user(f"0939500{days}0")
    d = date.today() + timedelta(days=2)
    while d.weekday() != 2:
        d += timedelta(days=1)
    from app.models.contract import Contract, ContractStatus
    with _fresh() as s:
        c = Contract(user_id=cust.id, venue_id=v.id,
                     start_date=date.today() - timedelta(days=30),
                     end_date=date.today() + timedelta(days=days),
                     day_of_week=2, start_time=dtime(18, 0), duration=90,
                     original_price=200000, discounted_price=150000,
                     total_amount=900000, status=ContractStatus.ACTIVE)
        s.add(c); s.commit(); s.refresh(c)
        return c, cust


def test_renewal_reminder_task_direct(client, sent_notifications):
    from app.tasks.crm_tasks import send_contract_renewal_reminders
    e = _venue_env("771")
    m, v = e
    c, cust = _active_contract_ending_in(client, {"m": m, "v": v}, 7)
    out = send_contract_renewal_reminders()
    assert out["notified_contracts"] == 1
    got = [n for n in sent_notifications if n["type"] == "contract_renewal"]
    assert {n["user_id"] for n in got} == {cust.id, m.id}
    # اجرای دوباره در همان روز همان نتیجه را می‌دهد (ضدتکرار بین‌روزی با پنجره‌ی
    # تک‌روز today+7 انجام می‌شود — مستند در crm_tasks)؛ روز بعد هدف نمی‌ماند.
    sent_notifications.clear()
    out2 = send_contract_renewal_reminders()
    assert out2["notified_contracts"] == 1


def test_dormant_weekly_notice_task_direct(client, sent_notifications):
    from app.tasks.crm_tasks import notify_dormant_high_value_customers
    e = _seed_customers("772")
    out = notify_dormant_high_value_customers()
    assert out["dormant_high_value"] >= 1
    got = [n for n in sent_notifications if n["type"] == "crm_dormant_weekly"]
    assert got and got[0]["user_id"] == e["m"].id
    assert e["dormant"].id in got[0]["data"]["user_ids"]


# ─────────────────────────── خوانش consent (پروفایل) ───────────────────────────

def test_get_consent_readback_for_profile_toggles(client):
    _, v1 = _venue_env("81")
    _, v2 = _venue_env("82")
    u = _user("09398100001")
    empty = client.get("/api/v1/crm/consent", headers=auth(u.phone)).json()
    assert empty == {"marketing_consent": False, "notify_deals": False,
                     "venues_with_consent": []}
    with _fresh() as s:
        uu = s.get(User, u.id)
        uu.notify_deals = True
        s.add(uu); s.commit()
    _consent(client, u, v1.id, True)
    _consent(client, u, v2.id, False)
    body = client.get("/api/v1/crm/consent", headers=auth(u.phone)).json()
    assert body["marketing_consent"] is True and body["notify_deals"] is True
    assert body["venues_with_consent"] == [v1.id]
    assert v2.id not in body["venues_with_consent"]
    # فقط رکوردهای خودِ کاربر — کاربر دیگری چیزی از v1 نمی‌گیرد
    other = _user("09398100002")
    assert client.get("/api/v1/crm/consent",
                      headers=auth(other.phone)).json()["venues_with_consent"] == []
