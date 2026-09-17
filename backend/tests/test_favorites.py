# backend/tests/test_favorites.py
"""علاقه‌مندی‌های سمت سرور — CRUD + یکتایی + اجباری بودن احراز هویت.

NOTE (migration for frontend): داده قبلی در localStorage بود؛ مهاجرت لازم
نیست — فرانت‌اند در اولین بارگذاری، Idهای محلی را POST می‌کند.
"""
from sqlmodel import Session, select

from app.models.favorite import FavoriteVenue
from app.models.user import User, UserRole
from app.models.venue import Venue
from helpers import auth

from conftest import test_engine


def _fresh():
    return Session(test_engine)


def _user(phone):
    with _fresh() as s:
        u = User(phone=phone, full_name="ک", hashed_password="x", role=UserRole.USER)
        s.add(u)
        s.commit()
        return u.id, u.phone


def _venue(manager_id):
    with _fresh() as s:
        v = Venue(name="فالو", address="آ", latitude=35.7, longitude=51.4,
                  phone="0912", manager_id=manager_id)
        s.add(v)
        s.commit()
        return v.id


def test_favorites_crud_and_unique(client):
    mid, _ = _user("09343000001")
    uid, phone = _user("09343000002")
    v1, v2 = _venue(mid), _venue(mid)
    assert client.get("/api/v1/favorites", headers=auth(phone)).json() == {"venue_ids": []}
    assert client.post("/api/v1/favorites/999999", headers=auth(phone)).status_code == 404
    r = client.post(f"/api/v1/favorites/{v1}", headers=auth(phone))
    assert r.status_code == 200 and r.json()["favorite"] is True
    assert client.post(f"/api/v1/favorites/{v1}", headers=auth(phone)).status_code == 200
    client.post(f"/api/v1/favorites/{v2}", headers=auth(phone))
    assert set(client.get("/api/v1/favorites", headers=auth(phone)).json()["venue_ids"]) \
        == {v1, v2}
    with _fresh() as s:
        assert len(s.exec(select(FavoriteVenue)).all()) == 2  # بدون درج تکراری
    assert client.delete(f"/api/v1/favorites/{v1}",
                         headers=auth(phone)).json()["removed"] is True
    assert client.delete(f"/api/v1/favorites/{v1}",
                         headers=auth(phone)).json()["removed"] is False
    assert client.get("/api/v1/favorites", headers=auth(phone)).json()["venue_ids"] == [v2]


def test_favorites_require_auth(client):
    r = client.get("/api/v1/favorites")
    assert r.status_code in (401, 403)