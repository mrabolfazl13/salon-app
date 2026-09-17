# backend/tests/test_holidays.py
"""تقویم مناسبت‌ها — CRUD گیت‌شده + بذر دسته‌ای + اثر روی قانون تعطیل."""
from datetime import date, time as dtime, timedelta

import pytest
from sqlmodel import Session, select

from app.models.holiday import Holiday
from app.models.pricing_rule import ModifierType, PricingRule
from app.models.user import User, UserRole
from app.models.venue import Venue
from app.services.pricing_service import PricingService
from helpers import auth

from conftest import test_engine


def _fresh():
    return Session(test_engine)


def _mk_user(phone, role=UserRole.USER):
    with _fresh() as s:
        u = User(phone=phone, full_name="ک", hashed_password="x", role=role,
                 is_verified=True)
        s.add(u)
        s.commit()
        uid, uphone = u.id, u.phone
    return uid, uphone


def _mk_venue(manager_id):
    with _fresh() as s:
        v = Venue(name="سالن تعطیلات", address="آ", latitude=35.7, longitude=51.4,
                  phone="0912", manager_id=manager_id)
        s.add(v)
        s.commit()
        vid = v.id
    return vid


MGR = "09333000001"
MGR2 = "09333000002"
SUPER = "09333000003"
D_FAR = date.today() + timedelta(days=40)


@pytest.fixture()
def actors():
    m_id, m_phone = _mk_user(MGR, UserRole.VENUE_MANAGER)
    m2_id, m2_phone = _mk_user(MGR2, UserRole.VENUE_MANAGER)
    s_id, s_phone = _mk_user(SUPER, UserRole.SUPER_ADMIN)
    v1 = _mk_venue(m_id)
    v2 = _mk_venue(m2_id)
    return {"m": (m_id, m_phone), "m2": (m2_id, m2_phone),
            "sup": (s_id, s_phone), "v1": v1, "v2": v2}


def test_manager_creates_own_and_global_forbidden(client, actors):
    r = client.post("/api/v1/holidays/",
                    json={"holiday_date": D_FAR.isoformat(), "name": "روز سالن",
                          "venue_id": actors["v1"]},
                    headers=auth(actors["m"][1]))
    assert r.status_code == 200, r.text
    assert r.json()["venue_id"] == actors["v1"]
    # بدون venue_id ⇒ سراسری ⇒ برای مدیر رد می‌شود
    assert client.post("/api/v1/holidays/",
                       json={"holiday_date": (D_FAR + timedelta(days=9)).isoformat(),
                             "name": "بدون سالن"},
                       headers=auth(actors["m"][1])).status_code == 403
    r = client.post("/api/v1/holidays/", json={"holiday_date": (D_FAR + timedelta(days=1)).isoformat(),
                                               "name": "سراسری"}, headers=auth(actors["m"][1]))
    assert r.status_code == 403


def test_super_admin_creates_global(client, actors):
    r = client.post("/api/v1/holidays/", json={"holiday_date": D_FAR.isoformat(),
                                               "name": "تعطیلات ملی"},
                    headers=auth(actors["sup"][1]))
    assert r.status_code == 200, r.text
    assert r.json()["venue_id"] is None and r.json()["is_national"] is True


def test_duplicate_date_rejected(client, actors):
    body = {"holiday_date": D_FAR.isoformat(), "name": "اول"}
    assert client.post("/api/v1/holidays/", json=body,
                       headers=auth(actors["sup"][1])).status_code == 200
    r = client.post("/api/v1/holidays/", json={"holiday_date": D_FAR.isoformat(),
                                                "name": "تکراری",
                                                "venue_id": actors["v1"]},
                    headers=auth(actors["m"][1]))
    assert r.status_code == 400 and "ثبت" in r.json()["detail"]


def test_bulk_helper_skips_duplicates(client, actors):
    items = [{"date": D_FAR.isoformat(), "name": "بذر۱"},
             {"date": (D_FAR + timedelta(days=1)).isoformat(), "name": "بذر۲"}]
    r = client.post("/api/v1/holidays/bulk", json={"items": items},
                    headers=auth(actors["sup"][1]))
    assert r.status_code == 200, r.text
    assert r.json()["created"] == 2
    r = client.post("/api/v1/holidays/bulk", json={"items": items},
                    headers=auth(actors["sup"][1]))
    assert r.json() == {"requested": 2, "created": 0, "ids": []}


def test_list_scoping_and_delete(client, actors):
    with _fresh() as s:
        mgr2_only = Holiday(holiday_date=D_FAR, name="مخصوص سالن۲",
                             is_national=False, venue_id=actors["v2"])
        glob = Holiday(holiday_date=D_FAR + timedelta(days=2), name="سراسری",
                       is_national=True)
        s.add_all([mgr2_only, glob])
        s.commit()
        hid_own, hid_other, hid_glob = None, mgr2_only.id, glob.id
    rows = client.get(f"/api/v1/holidays/?start={D_FAR.isoformat()}"
                      f"&end={(D_FAR + timedelta(days=3)).isoformat()}",
                      headers=auth(actors["m"][1])).json()
    dates = {x["holiday_date"] for x in rows}
    assert str(D_FAR + timedelta(days=2)) in dates          # سراسری دیده می‌شود
    assert str(D_FAR) not in dates                          # سالن دیگر نه
    assert client.delete(f"/api/v1/holidays/{hid_other}",
                         headers=auth(actors["m"][1])).status_code == 403
    assert client.delete(f"/api/v1/holidays/{hid_glob}",
                         headers=auth(actors["m"][1])).status_code == 403
    assert client.delete(f"/api/v1/holidays/{hid_glob}",
                         headers=auth(actors["sup"][1])).status_code == 200
    with _fresh() as s:
        assert s.get(Holiday, hid_glob) is None


def test_check_endpoint_and_repo(client, actors):
    with _fresh() as s:
        v2 = s.get(Venue, actors["v2"])
        s.add(Holiday(holiday_date=D_FAR, name="ویژه", is_national=False,
                      venue_id=actors["v2"]))
        s.commit()
    r = client.get(f"/api/v1/holidays/check/{D_FAR.isoformat()}",
                   headers=auth(actors["m"][1]))
    assert r.status_code == 200
    assert r.json()["is_holiday"] is False  # سالن کاربر تعطیل نیست
    r = client.get(f"/api/v1/holidays/check/{D_FAR.isoformat()}?venue_id={actors['v2']}",
                   headers=auth(actors["sup"][1]))
    assert r.json()["is_holiday"] is True


def test_repository_is_holiday_global_or_venue():
    with _fresh() as s:
        from app.repositories.holiday_repository import HolidayRepository
        repo = HolidayRepository(s)
        d = D_FAR + timedelta(days=5)
        s.add(Holiday(holiday_date=d, name="v-خاص", is_national=False, venue_id=999))
        s.commit()
        assert repo.is_holiday(d) is False                      # فقط سالن ۹۹۹
        assert repo.is_holiday(d, 999) is True
        assert repo.is_holiday(d, 123) is False