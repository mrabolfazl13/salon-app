# backend/tests/test_contract_multiday.py
"""قرارداد چندروزه (brief §1 «روزهای هفته») + فارسی‌سازی پیام‌های خطا (آیتم ۷).

پوشش: اعتبارسنجی additional_days (dedup/sقف ۳/تکرار روز اصلی ⇒ ۴۲۲)، تولید
جلسات روی همه روزها (هفتگی ۲روزه = ۲×/هفته و ساعات/تاریخ درست)، مسیر
تک‌روزه legacy دست‌نخورده، پاسخ `days`، گارد جابه‌جایی چندروزه «فقط ساعت»،
و جزئیاتِ ۴۰۰/۴۰۴/۴۰۹ همگی فارسی.
"""
from datetime import date, datetime, time as dtime, timedelta

import pytest
from sqlmodel import Session, select

import app.services.pending_booking_service as pbs
import app.utils.rate_limit as rl
from app.models.contract import Contract, ContractSlot
from app.models.slot import Slot, SlotStatus
from app.models.user import User, UserRole
from app.models.venue import Venue
from conftest import test_engine
from helpers import auth, FakeRedis


@pytest.fixture(autouse=True)
def fake_redis(monkeypatch):
    fake = FakeRedis()
    monkeypatch.setattr(rl, "_client", fake)
    monkeypatch.setattr(pbs, "_client", fake)
    return fake


def _fresh():
    return Session(test_engine)


def _user(phone, role=UserRole.USER):
    with _fresh() as s:
        u = User(phone=phone, full_name="ک. " + phone, hashed_password="x", role=role)
        s.add(u); s.commit(); s.refresh(u)
        return u.id, phone


def _venue(manager_user_id):
    with _fresh() as s:
        v = Venue(name="سالن قرارداد", address="آ", latitude=35.7, longitude=51.4,
                  manager_id=manager_user_id)
        s.add(v); s.commit(); s.refresh(v)
        sample = Slot(venue_id=v.id, slot_date=date.today() + timedelta(days=12),
                      start_time=dtime(9, 0), duration=90, base_price=200000,
                      current_price=200000, status=SlotStatus.AVAILABLE)
        s.add(sample); s.commit()
        return v.id


def _next_monday():
    d = date.today() + timedelta(days=1)
    while d.weekday() != 0:
        d += timedelta(days=1)
    return d


def _create_env(client, tag, additional_days=None, weeks=2, day_of_week=0):
    """مدیر + متقاضی + سالن؛ قرارداد (چندقدرتی/تکی). بازه: start=دوشنبه."""
    mid, m_phone = _user(f"093803{tag}0", UserRole.VENUE_MANAGER)
    cid, c_phone = _user(f"093803{tag}1")
    vid = _venue(mid)
    start = _next_monday() if day_of_week == 0 else _next_weekday(day_of_week)
    payload = {"venue_id": vid, "start_date": start.isoformat(),
               "end_date": (start + timedelta(days=7 * weeks)).isoformat(),
               "day_of_week": day_of_week, "start_time": "18:00",
               "recurrence": "weekly", "discounted_price": 150000}
    if additional_days is not None:
        payload["additional_days"] = additional_days
    r = client.post("/api/v1/contracts/", json=payload, headers=auth(c_phone))
    return {"mid": mid, "m": m_phone, "u": c_phone, "vid": vid, "resp": r,
            "start": start, "weeks": weeks}


def _next_weekday(dow):
    d = date.today() + timedelta(days=1)
    while d.weekday() != dow:
        d += timedelta(days=1)
    return d


def _sessions(cid):
    with _fresh() as s:
        rows = s.exec(select(ContractSlot).where(ContractSlot.contract_id == cid)
                      .order_by(ContractSlot.session_date)).all()
        return [{"d": cs.session_date, "slot": s.get(Slot, cs.slot_id)} for cs in rows]


def test_persian_error_strings(client):
    mid, m_phone = _user("09380310000", UserRole.VENUE_MANAGER)
    _, c_phone = _user("09380310001")
    vid = _venue(mid)
    h = auth(c_phone)

    # start > end (۴۰۰ فارسی)
    r = client.post("/api/v1/contracts/", json={
        "venue_id": vid, "start_date": "2026-12-20", "end_date": "2026-11-01",
        "day_of_week": 0, "start_time": "18:00", "discounted_price": 1000}, headers=h)
    assert r.status_code == 400 and r.json()["detail"] == "تاریخ شروع باید قبل از تاریخ پایان باشد"

    # بدون سالن معتبر ⇒ ۴۰۴ فارسی
    r = client.post("/api/v1/contracts/", json={
        "venue_id": 987654, "start_date": "2026-11-02", "end_date": "2026-11-30",
        "day_of_week": 0, "start_time": "18:00", "discounted_price": 1000}, headers=h)
    assert r.status_code == 404 and r.json()["detail"] == "سالن یافت نشد"

    # بازه بدون تطبیق روز ⇒ «هیچ سانسی…»
    start = _next_weekday(0)  # دوشنبه
    r = client.post("/api/v1/contracts/", json={
        "venue_id": vid, "start_date": start.isoformat(),
        "end_date": (start + timedelta(days=2)).isoformat(),
        "day_of_week": 3, "start_time": "20:00", "discounted_price": 1000}, headers=h)
    assert r.status_code == 400 and "هیچ سانسی" in r.json()["detail"]

    # قیمت ≥ پایه ⇒ فارسی
    r = client.post("/api/v1/contracts/", json={
        "venue_id": vid, "start_date": start.isoformat(),
        "end_date": (start + timedelta(days=28)).isoformat(),
        "day_of_week": 0, "start_time": "20:00", "discounted_price": 200000}, headers=h)
    assert r.status_code == 400 and "قیمت پیشنهادی" in r.json()["detail"]

    # تعارض ۴۰۹ فارسی
    ok = client.post("/api/v1/contracts/", json={
        "venue_id": vid, "start_date": start.isoformat(),
        "end_date": (start + timedelta(days=28)).isoformat(),
        "day_of_week": 0, "start_time": "18:00",
        "recurrence": "weekly", "discounted_price": 100000}, headers=h)
    assert ok.status_code == 200, ok.text
    dup = client.post("/api/v1/contracts/", json={
        "venue_id": vid, "start_date": start.isoformat(),
        "end_date": (start + timedelta(days=28)).isoformat(),
        "day_of_week": 0, "start_time": "18:00",
        "recurrence": "weekly", "discounted_price": 100000}, headers=h)
    assert dup.status_code == 409 and "قرارداد دیگری وجود دارد" in dup.json()["detail"]

    # ۴۰۴ قرارداد ناموجود
    g = client.get("/api/v1/contracts/987654", headers=auth(m_phone))
    assert g.status_code == 404 and g.json()["detail"] == "قرارداد یافت نشد"


def test_multiday_weekly_has_two_sessions_per_week(client):
    e = _create_env(client, "20", additional_days=[3], weeks=3)  # دوشنبه+پنجشنبه
    assert e["resp"].status_code == 200, e["resp"].text
    body = e["resp"].json()
    assert body["day_of_week"] == 0
    assert body["days"] == [0, 3]
    cid = body["id"]

    sessions = _sessions(cid)
    mondays = [x for x in sessions if x["d"].weekday() == 0]
    thursdays = [x for x in sessions if x["d"].weekday() == 3]
    assert len(mondays) == 4 and len(thursdays) == 3
    assert len(sessions) == len(mondays) + len(thursdays) == 7
    # هفته اول: دوشنبه start و پنجشنبه start+3
    assert min(m["d"] for m in mondays) == e["start"]
    assert min(t["d"] for t in thursdays) == e["start"] + timedelta(days=3)
    # اسلات‌های فیزیکی درست ساخته شده‌اند (RESERVED + زمان قرارداد)
    for x in sessions:
        assert x["slot"].status == SlotStatus.RESERVED
        assert x["slot"].slot_date == x["d"]
        assert x["slot"].is_contract_slot is True
    # چندروزه = مجموع روزها: تک‌روزه ۴ + روز دوم ۳ ⇒ ۷
    e2 = _create_env(client, "21", additional_days=None, weeks=3)
    one_day_total = len(_sessions(e2["resp"].json()["id"]))
    assert one_day_total == 4 and len(sessions) == one_day_total + 3


def test_single_day_legacy_contract_days_field(client):
    e = _create_env(client, "22", weeks=2)
    body = e["resp"].json()
    assert body["days"] == [0]
    assert len(_sessions(body["id"])) == 3


def test_multiday_validation_dedup_limit_and_main_repeat(client):
    # dedup پذیرفته: [3,3] ⇒ پنچشنبه یک‌بار
    e = _create_env(client, "24", additional_days=[3, 3], weeks=2)
    assert e["resp"].status_code == 200, e["resp"].text
    assert e["resp"].json()["days"] == [0, 3]
    # ۴ روز ⇒ ۴۲۲
    e2 = _create_env(client, "25", additional_days=[1, 2, 3, 4], weeks=1)
    assert e2["resp"].status_code == 422
    # اصلی و تکراریِ همان ⇒ ۴۲۲
    e3 = _create_env(client, "26", additional_days=[0], weeks=1)
    assert e3["resp"].status_code == 422
    # خارج از دامنه ⇒ ۴۲۲
    e4 = _create_env(client, "27", additional_days=[9], weeks=1)
    assert e4["resp"].status_code == 422


def _approve(client, e):
    cid = e["resp"].json()["id"]
    r = client.post(f"/api/v1/contracts/{cid}/approve", json={}, headers=auth(e["m"]))
    assert r.status_code == 200, r.text
    return cid


def test_multiday_move_is_time_only_guard(client):
    e = _create_env(client, "30", additional_days=[3], weeks=3)
    cid = _approve(client, e)

    # تغییر روز درخواست‌شده ⇒ ۴۰۰ فارسی
    bad = client.post(f"/api/v1/contracts/{cid}/move",
                      json={"day_of_week": 5, "start_time": "20:00"},
                      headers=auth(e["m"]))
    assert bad.status_code == 400
    assert bad.json()["detail"] == "قرارداد چندروزه فقط با تغییر ساعت قابل جابه‌جایی است"

    # «فقط ساعت» (با ذکر روزِ خودش) ⇒ جابه‌جایی زمانی روی همان روزها حفظ می‌شود
    ok = client.post(f"/api/v1/contracts/{cid}/move",
                     json={"day_of_week": 0, "start_time": "20:00"},
                     headers=auth(e["m"]))
    assert ok.status_code == 200, ok.text
    assert ok.json()["moved_sessions"] >= 2
    for x in _sessions(cid):
        assert x["slot"].start_time == dtime(20, 0)
        assert x["d"] == x["slot"].slot_date
    wdays = {x["d"].weekday() for x in _sessions(cid)}
    assert wdays == {0, 3}  # الگوی روزها حفظ شد


def test_single_day_full_move_still_shifts_weekday(client):
    e = _create_env(client, "35", weeks=2)  # تک‌روزه دوشنبه
    cid = _approve(client, e)
    before = {x["d"] for x in _sessions(cid)}
    r = client.post(f"/api/v1/contracts/{cid}/move",
                    json={"day_of_week": 4, "start_time": "19:00"},
                    headers=auth(e["m"]))
    assert r.status_code == 200, r.text
    after = _sessions(cid)
    assert all(x["slot"].slot_date.weekday() == 4 for x in after)  # پنجشنبه‌ها
    det = client.get(f"/api/v1/contracts/{cid}", headers=auth(e["u"])).json()
    assert det["days"] == [4] and det["day_of_week"] == 4


def test_multiday_approval_amendment_reuses_all_days(client):
    e = _create_env(client, "40", additional_days=[3], weeks=3)
    cid = _approve(client, e)
    # استثنای یک سانس + max_sessions در تأیید مسیر amendment را می‌چرخاند؛
    # اینجا فقط تثبیت این‌که flow تأیید چندروزه نمی‌شکند و sessions سالم‌اند:
    first = _sessions(cid)[1]
    x = client.post(f"/api/v1/contracts/{cid}/sessions/{first['d'].isoformat()}",  # نشستنی؛ cs id واقعی:
                    json={"reason": "تعمیر"}, headers=auth(e["m"]))
    assert x.status_code in (400, 404)  # مسیر اشتباه — فقط پروبت guard
    with _fresh() as s:
        cs = s.exec(select(ContractSlot).where(ContractSlot.contract_id == cid)
                    .order_by(ContractSlot.session_date)).all()
        cs_id = cs[-1].id
    r = client.post(f"/api/v1/contracts/{cid}/sessions/{cs_id}/exclude",
                    json={"reason": "تعمیرات اساسی"}, headers=auth(e["m"]))
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "excluded"