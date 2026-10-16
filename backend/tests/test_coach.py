# backend/tests/test_coach.py
"""نقش مربی (C1) — دروازهٔ نقش، تضاد زمانی، ثبت حضور/غیبت، تسویه و داشبورد.

ماتریس دسترسی که اینجا قفل می‌شود (کد وضعیت **دقیق**؛ الگوی test_permissions):
- POST/PUT /coach/* : فقط نقش `coach` ⇒ کاربر عادی و مدیر سالن ۴۰۳
- GET /coach/sessions : مربی ← خودش | `as_client` ← شاگرد | سوپرادمین ← همه
- GET /coach/sessions/{id} : مربیِ جلسه، شاگردِ جلسه یا سوپرادمین؛ بقیه ۴۰۳
- جلسهٔ مربی دیگر ⇒ ۴۰۳ (نه ۴۰۴): مالکیت جدا از وجود ردیف چک می‌شود.
"""
from datetime import datetime, timedelta, timezone

import pytest

from helpers import auth

BASE = "/api/v1/coach"


def _iso(dt: datetime) -> str:
    return dt.isoformat()


@pytest.fixture()
def actors(seed):
    """مربی، شاگرد، کاربر مزاحم، مدیر سالن و سوپرادمین."""
    from app.models.user import UserRole
    return {
        "coach": seed["user"]("09120000001", "مربی.test", role=UserRole.COACH),
        "client": seed["user"]("09120000002", "شاگرد.test", role=UserRole.USER),
        "stranger": seed["user"]("09120000003", "مزاحم.test", role=UserRole.USER),
        "manager": seed["user"]("09120000004", "مدیر.test", role=UserRole.VENUE_MANAGER),
        "admin": seed["user"]("09120000005", "ادمین.test", role=UserRole.SUPER_ADMIN),
    }


def _create(client, actor, client_phone, starts_at, duration=60, fee=200000, **kw):
    payload = {"client_phone": client_phone, "starts_at": _iso(starts_at),
               "duration_min": duration, "fee": fee}
    payload.update(kw)
    return client.post(f"{BASE}/sessions", json=payload, headers=auth(actor.phone))


def _today_at(hour: int, minute: int = 0) -> datetime:
    now = datetime.now(timezone.utc)
    return now.replace(hour=hour, minute=minute, second=0, microsecond=0)


# ─────────────────────────── دروازهٔ نقش ───────────────────────────

def test_only_coach_role_can_create(client, actors):
    r = _create(client, actors["client"], actors["client"].phone, _today_at(10))
    assert r.status_code == 403, r.text
    assert "مربی" in r.json()["detail"]

    r2 = _create(client, actors["manager"], actors["client"].phone, _today_at(11))
    assert r2.status_code == 403, r2.text


def test_coach_creates_session(client, actors):
    start = _today_at(18)
    r = _create(client, actors["coach"], actors["client"].phone, start)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["coach_id"] == actors["coach"].id
    assert body["client_id"] == actors["client"].id
    assert body["status"] == "scheduled"
    assert body["fee"] == 200000
    # ends_at ستون واقعی است (نه محاسبهٔ سمت کلاینت) تا تضاد در SQL دیده شود
    assert body["ends_at"][:16] == (start + timedelta(minutes=60)).isoformat()[:16]


def test_dashboard_requires_coach(client, actors):
    assert client.get(f"{BASE}/dashboard", headers=auth(actors["stranger"].phone)
                      ).status_code == 403
    r = client.get(f"{BASE}/dashboard", headers=auth(actors["coach"].phone))
    assert r.status_code == 200, r.text
    for key in ("today", "upcoming", "today_count", "month_sessions",
                "month_revenue", "month_outstanding", "active_clients"):
        assert key in r.json(), key


# ─────────────────────────── اعتبار داده ───────────────────────────

def test_unknown_client_phone_rejected(client, actors):
    r = _create(client, actors["coach"], "09199999999", _today_at(9))
    assert r.status_code == 400, r.text
    assert "ثبت نشده" in r.json()["detail"]


def test_coach_cannot_be_own_client(client, actors):
    r = _create(client, actors["coach"], actors["coach"].phone, _today_at(9))
    assert r.status_code == 400, r.text
    assert "خودش" in r.json()["detail"]


def test_missing_venue_rejected(client, actors):
    r = _create(client, actors["coach"], actors["client"].phone, _today_at(9),
                venue_id=424242)
    assert r.status_code == 400, r.text
    assert "سالن" in r.json()["detail"]


# ─────────────────────────── تضاد زمانی ───────────────────────────

def test_overlapping_session_rejected(client, actors):
    a = _create(client, actors["coach"], actors["client"].phone, _today_at(10))
    assert a.status_code == 200, a.text
    b = _create(client, actors["coach"], actors["client"].phone, _today_at(10, 30))
    assert b.status_code == 400, b.text
    assert "تعارض زمانی" in b.json()["detail"]


def test_back_to_back_sessions_allowed(client, actors):
    """پایان جلسهٔ اول = شروع جلسهٔ دوم ⇒ هم‌پوشانی ندارد (مرز باز/بسته)."""
    a = _create(client, actors["coach"], actors["client"].phone, _today_at(10), duration=60)
    b = _create(client, actors["coach"], actors["client"].phone, _today_at(11), duration=60)
    assert a.status_code == 200 and b.status_code == 200, (a.text, b.text)


def test_conflict_ignores_cancelled_session(client, actors):
    first = _create(client, actors["coach"], actors["client"].phone, _today_at(10))
    sid = first.json()["id"]
    cancel = client.put(f"{BASE}/sessions/{sid}/attendance",
                        json={"status": "cancelled"}, headers=auth(actors["coach"].phone))
    assert cancel.status_code == 200, cancel.text
    again = _create(client, actors["coach"], actors["client"].phone, _today_at(10))
    assert again.status_code == 200, again.text


def test_update_conflict_checked_too(client, actors):
    a = _create(client, actors["coach"], actors["client"].phone, _today_at(10))
    b = _create(client, actors["coach"], actors["client"].phone, _today_at(14))
    assert a.status_code == 200 and b.status_code == 200
    r = client.put(f"{BASE}/sessions/{b.json()['id']}",
                   json={"starts_at": _iso(_today_at(10, 15))},
                   headers=auth(actors["coach"].phone))
    assert r.status_code == 400, r.text
    assert "تعارض" in r.json()["detail"]
    # جابه‌جایی بی‌تعارض موفق است و ends_at را بازمی‌سازد
    ok = client.put(f"{BASE}/sessions/{b.json()['id']}",
                    json={"starts_at": _iso(_today_at(16)), "duration_min": 90},
                    headers=auth(actors["coach"].phone))
    assert ok.status_code == 200, ok.text
    body = ok.json()
    assert body["duration_min"] == 90
    assert body["ends_at"][:16] == (_today_at(17, 30)).isoformat()[:16]


# ─────────────────────────── دید (مربی/شاگرد/ادمین) ───────────────────────────

def test_visibility_matrix(client, actors):
    sid = _create(client, actors["coach"], actors["client"].phone,
                  _today_at(10)).json()["id"]

    assert client.get(f"{BASE}/sessions/{sid}",
                      headers=auth(actors["coach"].phone)).status_code == 200
    assert client.get(f"{BASE}/sessions/{sid}",
                      headers=auth(actors["client"].phone)).status_code == 200
    assert client.get(f"{BASE}/sessions/{sid}",
                      headers=auth(actors["admin"].phone)).status_code == 200
    stranger = client.get(f"{BASE}/sessions/{sid}", headers=auth(actors["stranger"].phone))
    assert stranger.status_code == 403, stranger.text


def test_client_lists_own_sessions(client, actors):
    _create(client, actors["coach"], actors["client"].phone, _today_at(10))
    _create(client, actors["coach"], actors["client"].phone, _today_at(20))
    r = client.get(f"{BASE}/sessions", params={"as_client": "true"},
                   headers=auth(actors["client"].phone))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["total"] == 2
    assert {i["coach_name"] for i in body["items"]} == {"مربی.test"}


def test_stranger_cannot_list(client, actors):
    r = client.get(f"{BASE}/sessions", headers=auth(actors["manager"].phone))
    assert r.status_code == 403, r.text


def test_admin_can_list_all(client, actors):
    _create(client, actors["coach"], actors["client"].phone, _today_at(10))
    r = client.get(f"{BASE}/sessions", headers=auth(actors["admin"].phone))
    assert r.status_code == 200, r.text
    assert r.json()["total"] == 1


def test_missing_session_is_404(client, actors):
    r = client.get(f"{BASE}/sessions/999999", headers=auth(actors["coach"].phone))
    assert r.status_code == 404, r.text


# ─────────────────────────── حضور / غیبت / تسویه ───────────────────────────

def test_attendance_flow(client, actors):
    sid = _create(client, actors["coach"], actors["client"].phone,
                  _today_at(10)).json()["id"]

    settle_first = client.put(f"{BASE}/sessions/{sid}/settle", json={"settled": True},
                              headers=auth(actors["coach"].phone))
    assert settle_first.status_code == 400, settle_first.text
    assert "حضور" in settle_first.json()["detail"]

    attended = client.put(f"{BASE}/sessions/{sid}/attendance", json={"status": "attended"},
                          headers=auth(actors["coach"].phone))
    assert attended.status_code == 200, attended.text
    body = attended.json()
    assert body["status"] == "attended"
    assert body["attended_at"] is not None

    again = client.put(f"{BASE}/sessions/{sid}/attendance", json={"status": "attended"},
                       headers=auth(actors["coach"].phone))
    assert again.status_code == 400, again.text
    assert "همان است" in again.json()["detail"]

    settled = client.put(f"{BASE}/sessions/{sid}/settle", json={"settled": True},
                         headers=auth(actors["coach"].phone))
    assert settled.status_code == 200, settled.text
    assert settled.json()["fee_settled"] is True


def test_other_coach_cannot_mark_attendance(client, seed, actors):
    from app.models.user import UserRole
    rival = seed["user"]("09120000006", "مربی.رقیب", role=UserRole.COACH)
    sid = _create(client, actors["coach"], actors["client"].phone,
                  _today_at(10)).json()["id"]
    r = client.put(f"{BASE}/sessions/{sid}/attendance", json={"status": "attended"},
                   headers=auth(rival.phone))
    assert r.status_code == 403, r.text
    assert "مربی دیگری" in r.json()["detail"]


def test_user_cannot_mark_attendance(client, actors):
    sid = _create(client, actors["coach"], actors["client"].phone,
                  _today_at(10)).json()["id"]
    r = client.put(f"{BASE}/sessions/{sid}/attendance", json={"status": "attended"},
                   headers=auth(actors["stranger"].phone))
    assert r.status_code == 403, r.text


def test_cancelled_session_not_editable(client, actors):
    sid = _create(client, actors["coach"], actors["client"].phone,
                  _today_at(10)).json()["id"]
    client.put(f"{BASE}/sessions/{sid}/attendance", json={"status": "cancelled"},
               headers=auth(actors["coach"].phone))
    r = client.put(f"{BASE}/sessions/{sid}", json={"fee": 10},
                   headers=auth(actors["coach"].phone))
    assert r.status_code == 400, r.text
    assert "لغوشده" in r.json()["detail"]


def test_admin_can_fix_attendance(client, actors):
    sid = _create(client, actors["coach"], actors["client"].phone,
                  _today_at(10)).json()["id"]
    r = client.put(f"{BASE}/sessions/{sid}/attendance", json={"status": "attended"},
                   headers=auth(actors["admin"].phone))
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "attended"


# ─────────────────────────── داشبورد و لیست شاگردان ───────────────────────────

def test_dashboard_numbers_come_from_real_rows(client, actors):
    coach_h = auth(actors["coach"].phone)
    morning = _create(client, actors["coach"], actors["client"].phone,
                      _today_at(8), fee=150000).json()
    evening = _create(client, actors["coach"], actors["client"].phone,
                      _today_at(20), fee=300000).json()
    client.put(f"{BASE}/sessions/{morning['id']}/attendance", json={"status": "attended"},
               headers=coach_h)
    client.put(f"{BASE}/sessions/{evening['id']}/attendance", json={"status": "cancelled"},
               headers=coach_h)

    d = client.get(f"{BASE}/dashboard", headers=coach_h).json()
    assert d["today_count"] == 1, d           # لغوشده شمرده نمی‌شود
    assert d["month_sessions"] == 1, d
    assert d["month_revenue"] == 150000, d    # فقط attended درآمد است
    assert d["month_outstanding"] == 150000, d
    assert d["active_clients"] == 1, d

    settle = client.put(f"{BASE}/sessions/{morning['id']}/settle", json={"settled": True},
                        headers=coach_h)
    assert settle.status_code == 200, settle.text
    d2 = client.get(f"{BASE}/dashboard", headers=coach_h).json()
    assert d2["month_outstanding"] == 0, d2


def test_dashboard_upcoming_excludes_past(client, actors):
    coach_h = auth(actors["coach"].phone)
    _create(client, actors["coach"], actors["client"].phone, _today_at(1))
    future = datetime.now(timezone.utc) + timedelta(days=2)
    _create(client, actors["coach"], actors["client"].phone, future)
    d = client.get(f"{BASE}/dashboard", headers=coach_h).json()
    assert len(d["upcoming"]) == 1
    assert d["upcoming"][0]["starts_at"][:10] == future.isoformat()[:10]


def test_clients_aggregation(client, actors, seed):
    from app.models.user import UserRole
    second = seed["user"]("09120000007", "شاگرد.دوم", role=UserRole.USER)
    coach_h = auth(actors["coach"].phone)
    _create(client, actors["coach"], actors["client"].phone, _today_at(9))
    _create(client, actors["coach"], actors["client"].phone, _today_at(11))
    _create(client, actors["coach"], second.phone, _today_at(13))

    r = client.get(f"{BASE}/clients", headers=coach_h)
    assert r.status_code == 200, r.text
    items = r.json()["items"]
    assert [i["full_name"] for i in items] == ["شاگرد.test", "شاگرد.دوم"]  # بیشترین جلسه اول
    assert items[0]["sessions"] == 2
    assert items[0]["fee_total"] == 400000
    assert items[1]["sessions"] == 1


# ─────────────────────────── مسیرهای جدیدِ نقش (ثبت‌نام/ادمین) ───────────────────────────

def test_register_allows_coach_but_not_super_admin(client):
    base = {"full_name": "مربی.جدید", "password": "1234"}
    ok = client.post("/api/v1/auth/register",
                     json={**base, "phone": "09121110001", "role": "coach"})
    assert ok.status_code == 200, ok.text
    assert ok.json()["role"] == "coach"

    esc = client.post("/api/v1/auth/register",
                      json={**base, "phone": "09121110002", "role": "super_admin"})
    assert esc.status_code == 400, esc.text
    assert "قابل انتخاب نیست" in esc.json()["detail"]

    club = client.post("/api/v1/auth/register",
                       json={**base, "phone": "09121110003", "role": "club_admin"})
    assert club.status_code == 400, club.text


def test_admin_can_assign_role(client, actors):
    from app.models.user import User
    from conftest import test_engine
    from sqlmodel import Session, select
    target = actors["stranger"]
    r = client.put(f"/api/v1/admin/users/{target.id}/role", json={"role": "coach"},
                   headers=auth(actors["admin"].phone))
    assert r.status_code == 200, r.text
    with Session(test_engine) as s:
        fresh = s.get(User, target.id)
        assert fresh.role.value == "coach"


def test_role_assignment_requires_admin(client, actors):
    r = client.put(f"/api/v1/admin/users/{actors['client'].id}/role",
                   json={"role": "coach"}, headers=auth(actors["stranger"].phone))
    assert r.status_code in (401, 403), r.text


def test_last_super_admin_cannot_self_demote(client, actors):
    from app.models.user import User, UserRole
    from conftest import test_engine
    from sqlmodel import Session, select
    admin = actors["admin"]
    with Session(test_engine) as s:
        others = s.exec(select(User).where(User.role == UserRole.SUPER_ADMIN,
                                          User.id != admin.id)).all()
    assert not others, "فرض تست: تنها سوپرادمین همین است"
    r = client.put(f"/api/v1/admin/users/{admin.id}/role", json={"role": "coach"},
                   headers=auth(admin.phone))
    assert r.status_code == 400, r.text
    assert "آخرین مدیر" in r.json()["detail"]
