# backend/tests/test_notifications.py
"""پنل اعلان‌ها — چهار مسیری که فرانت صدا می‌زند ولی در بک‌اند نوشته نشده بود.

پوشش: فقط اعلان خود کاربر، ترتیب جدیدترین-اول، فیلتر خوانده‌نشده، صفحه‌بندی،
رمزگشایی ستون data (رشتهٔ JSON در DB → شیء در پاسخ) و رد دسترسی به اعلان دیگران.
"""
from datetime import datetime, timedelta, timezone

from sqlmodel import Session

from app.models.notification import Notification
from app.models.user import User, UserRole
from helpers import auth

from conftest import test_engine


def _user(phone: str) -> tuple[int, str]:
    with Session(test_engine) as s:
        u = User(phone=phone, full_name="ا", hashed_password="x", role=UserRole.USER)
        s.add(u)
        s.commit()
        return u.id, u.phone


def _notif(user_id: int, title: str, *, is_read: bool = False,
           notif_type: str = "info", data: str = "{}",
           minutes_ago: int = 0) -> int:
    with Session(test_engine) as s:
        n = Notification(
            user_id=user_id,
            title=title,
            message=f"پیام {title}",
            type=notif_type,
            data=data,
            is_read=is_read,
            created_at=datetime.now(timezone.utc) - timedelta(minutes=minutes_ago),
        )
        s.add(n)
        s.commit()
        return n.id


def test_fcm_token_endpoints_do_not_500(client):
    """`with uow:` روی UnitOfWork که از Depends می‌آید session را null می‌کند و
    teardown وابستگی را می‌ترکاند — این دو مسیر همیشه ۵۰۰ برمی‌گرداندند."""
    from app.models.user import User
    from conftest import test_engine as eng

    uid, phone = _user("09344000008")
    r = client.post("/api/v1/notifications/users/me/fcm-token",
                    json={"fcm_token": "tok-abc"}, headers=auth(phone))
    assert r.status_code == 200
    with Session(eng) as s:
        assert s.get(User, uid).fcm_token == "tok-abc"

    r = client.post("/api/v1/notifications/users/me/fcm-token",
                    json={"fcm_token": "tok-xyz"}, headers=auth(phone))
    assert r.status_code == 200
    with Session(eng) as s:
        assert s.get(User, uid).fcm_token == "tok-xyz"

    assert client.delete("/api/v1/notifications/users/me/fcm-token",
                         headers=auth(phone)).status_code == 200
    with Session(eng) as s:
        assert s.get(User, uid).fcm_token is None


def test_list_only_own_newest_first_and_decodes_data(client):
    uid, phone = _user("09344000001")
    other, _ = _user("09344000002")
    _notif(other, "اعلان نفر دیگر")
    old = _notif(uid, "قدیمی", minutes_ago=30)
    new = _notif(uid, "تازه", minutes_ago=1,
                 data='{"booking_id": 7, "venue": "سالن"}')

    r = client.get("/api/v1/notifications/", headers=auth(phone))
    assert r.status_code == 200
    body = r.json()
    assert [n["id"] for n in body] == [new, old]
    assert body[0]["data"] == {"booking_id": 7, "venue": "سالن"}
    assert body[0]["title"] == "تازه" and body[0]["is_read"] is False


def test_unread_filter_pagination_and_unauthorized(client):
    uid, phone = _user("09344000003")
    read = _notif(uid, "خوانده‌شده", is_read=True, minutes_ago=5)
    unread = _notif(uid, "ناخوانده", minutes_ago=1)

    only_unread = client.get("/api/v1/notifications/",
                             params={"unread_only": True}, headers=auth(phone)).json()
    assert [n["id"] for n in only_unread] == [unread]

    page = client.get("/api/v1/notifications/",
                      params={"limit": 1, "offset": 1}, headers=auth(phone)).json()
    assert [n["id"] for n in page] == [read]

    assert client.get("/api/v1/notifications/").status_code == 401


def test_unread_count_and_mark_read_flows(client):
    uid, phone = _user("09344000004")
    stranger, stranger_phone = _user("09344000005")
    n1 = _notif(uid, "یک")
    n2 = _notif(uid, "دو")
    foreign = _notif(stranger, "mal_other")

    assert client.get("/api/v1/notifications/unread-count",
                      headers=auth(phone)).json() == {"count": 2}

    r = client.put(f"/api/v1/notifications/{n1}/read", headers=auth(phone))
    assert r.status_code == 200
    assert r.json()["id"] == n1 and r.json()["is_read"] is True
    assert client.get("/api/v1/notifications/unread-count",
                      headers=auth(phone)).json() == {"count": 1}

    # کاربر دیگر نمی‌تواند اعلان من را بخواند/تغییر دهد
    assert client.put(f"/api/v1/notifications/{n2}/read",
                      headers=auth(stranger_phone)).status_code == 404
    assert client.put(f"/api/v1/notifications/{n2}/read", headers=auth(phone)).status_code == 200

    # خوانده‌شدهٔ تکراری خطا نمی‌دهد و وضعیت را عوض نمی‌کند
    again = client.put(f"/api/v1/notifications/{n2}/read", headers=auth(phone))
    assert again.status_code == 200 and again.json()["is_read"] is True

    assert client.put("/api/v1/notifications/999999/read",
                      headers=auth(phone)).status_code == 404


def test_mark_all_as_read_only_touches_own_rows(client):
    uid, phone = _user("09344000006")
    other, other_phone = _user("09344000007")
    for i in range(3):
        _notif(uid, f"پیام {i}")
    foreign = _notif(other, "بیگانه")

    r = client.put("/api/v1/notifications/read-all", headers=auth(phone))
    assert r.status_code == 200
    assert r.json() == {"count": 3}
    assert client.get("/api/v1/notifications/unread-count",
                      headers=auth(phone)).json() == {"count": 0}
    # اعلان کاربر دیگر دست نخورد
    assert client.get("/api/v1/notifications/", headers=auth(other_phone)).json()[0]["id"] == foreign

    # بدون مورد خوانده‌نشده ⇒ صفر
    assert client.put("/api/v1/notifications/read-all",
                      headers=auth(phone)).json() == {"count": 0}
