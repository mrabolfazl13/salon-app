# backend/tests/test_teams_official_chat.py
"""تست رسمی‌شدن تیم و چت تیمی — حدنصاب، یکتایی رسمیت، پیام‌ها، صفحه‌بندی، unread، دسترسی."""
from sqlmodel import select

from app.config import settings
from app.models.team import Team, TeamAuditEvent
from helpers import auth

BASE = "/api/v1/teams"
CAP = "09370000001"
M1 = "09370000002"
M2 = "09370000003"
STRANGER = "09370000009"


def _ensure(seed, phone):
    from sqlmodel import Session
    from conftest import test_engine
    from app.models.user import User
    with Session(test_engine) as s:
        exists = s.exec(select(User).where(User.phone == phone)).first() is not None
    if not exists:
        seed["user"](phone)


def _uid(phone):
    from sqlmodel import Session
    from conftest import test_engine
    from app.models.user import User
    with Session(test_engine) as s:
        return s.exec(select(User).where(User.phone == phone)).first().id


def _team(client, seed, name, **kw):
    _ensure(seed, CAP)
    body = {"name": name, "visibility": kw.pop("visibility", "private")}
    body.update(kw)
    r = client.post(f"{BASE}/", json=body, headers=auth(CAP))
    assert r.status_code == 201, r.text
    return r.json()


def _add_member(client, seed, tid, phone):
    _ensure(seed, phone)
    inv = client.post(f"{BASE}/{tid}/invite", json={"phone": phone}, headers=auth(CAP))
    assert inv.status_code == 201, inv.text
    mid = inv.json()["member_id"]
    r = client.post(f"{BASE}/{tid}/invitations/{mid}/accept", headers=auth(phone))
    assert r.status_code == 200, r.text
    return mid


def _set_min_members(db, tid, value):
    team = db.exec(select(Team).where(Team.id == tid)).first()
    team.min_members = value
    db.add(team)
    db.commit()


def _official_notifs(sent_notifications):
    return [n for n in sent_notifications if n["type"] == "team_official"]


# ─────────────────────────── رسمی‌شدن ───────────────────────────

def test_new_team_below_quota_not_official(client, seed):
    t = _team(client, seed, "تیم نوقلم")
    detail = client.get(f"{BASE}/{t['id']}", headers=auth(CAP)).json()
    assert detail["is_official"] is False
    assert detail["official_since"] is None
    assert detail["member_count"] == 1
    assert detail["quota"] == settings.TEAM_MIN_MEMBERS


def test_quota_crossing_marks_official(client, seed, db, sent_notifications):
    t = _team(client, seed, "تیم سقف‌دار")
    _set_min_members(db, t["id"], 2)
    _add_member(client, seed, t["id"], M1)

    detail = client.get(f"{BASE}/{t['id']}", headers=auth(CAP)).json()
    assert detail["is_official"] is True
    assert detail["official_since"] is not None
    assert detail["member_count"] == 2
    assert detail["quota"] == 2

    notifs = _official_notifs(sent_notifications)
    assert {n["user_id"] for n in notifs} == {_uid(CAP), _uid(M1)}

    rows = db.exec(select(TeamAuditEvent).where(
        TeamAuditEvent.team_id == t["id"])).all()
    db.commit()
    actions = [r.action.value if hasattr(r.action, "value") else str(r.action)
               for r in rows]
    assert actions.count("team_became_official") == 1


def test_official_status_is_idempotent(client, seed, db, sent_notifications):
    t = _team(client, seed, "تیم یکباررسمی")
    _set_min_members(db, t["id"], 2)
    _add_member(client, seed, t["id"], M1)
    first = client.get(f"{BASE}/{t['id']}", headers=auth(CAP)).json()
    assert first["is_official"] is True
    assert len(_official_notifs(sent_notifications)) == 2

    _add_member(client, seed, t["id"], M2)

    second = client.get(f"{BASE}/{t['id']}", headers=auth(CAP)).json()
    assert second["is_official"] is True
    assert second["official_since"] == first["official_since"]
    assert len(_official_notifs(sent_notifications)) == 2


# ─────────────────────────── چت ───────────────────────────

def test_chat_post_list_and_validation(client, seed):
    t = _team(client, seed, "تیم چت")
    _add_member(client, seed, t["id"], M1)

    r = client.post(f"{BASE}/{t['id']}/messages", json={"content": "  سلام بچه‌ها  "},
                    headers=auth(CAP))
    assert r.status_code == 201, r.text
    assert r.json()["content"] == "سلام بچه‌ها"

    listing = client.get(f"{BASE}/{t['id']}/messages", headers=auth(M1)).json()
    assert len(listing["items"]) == 1
    item = listing["items"][0]
    assert item["content"] == "سلام بچه‌ها"
    assert item["user_id"] == _uid(CAP)
    assert item["full_name"]

    assert client.post(f"{BASE}/{t['id']}/messages", json={"content": ""},
                       headers=auth(CAP)).status_code == 422
    assert client.post(f"{BASE}/{t['id']}/messages", json={"content": "   "},
                       headers=auth(CAP)).status_code == 422


def test_chat_pagination_cursor(client, seed):
    t = _team(client, seed, "تیم صفحه‌بندی")
    _add_member(client, seed, t["id"], M1)
    for text in ("یک", "دو", "سه"):
        r = client.post(f"{BASE}/{t['id']}/messages", json={"content": text},
                        headers=auth(CAP))
        assert r.status_code == 201, r.text

    page1 = client.get(f"{BASE}/{t['id']}/messages?limit=2",
                       headers=auth(M1)).json()
    assert [i["content"] for i in page1["items"]] == ["سه", "دو"]
    assert page1["has_more"] is True

    cursor = page1["items"][-1]["id"]
    page2 = client.get(f"{BASE}/{t['id']}/messages?limit=2&before_id={cursor}",
                       headers=auth(M1)).json()
    assert [i["content"] for i in page2["items"]] == ["یک"]
    assert page2["has_more"] is False


def test_unread_count_and_mark_read(client, seed):
    t = _team(client, seed, "تیم خوانده‌نشده")
    _add_member(client, seed, t["id"], M1)

    assert client.get(f"{BASE}/{t['id']}/unread-count",
                      headers=auth(M1)).json()["unread"] == 0

    for text in ("یک", "دو"):
        assert client.post(f"{BASE}/{t['id']}/messages", json={"content": text},
                           headers=auth(CAP)).status_code == 201

    assert client.get(f"{BASE}/{t['id']}/unread-count",
                      headers=auth(M1)).json()["unread"] == 2
    # پیام خود فرستنده برای خودش خوانده‌نشده نیست
    assert client.get(f"{BASE}/{t['id']}/unread-count",
                      headers=auth(CAP)).json()["unread"] == 0

    read = client.post(f"{BASE}/{t['id']}/messages/read", headers=auth(M1))
    assert read.status_code == 200
    assert read.json()["unread"] == 0
    assert client.get(f"{BASE}/{t['id']}/unread-count",
                      headers=auth(M1)).json()["unread"] == 0


def test_chat_non_member_forbidden(client, seed):
    t = _team(client, seed, "تیم خصوصی چت")
    _ensure(seed, STRANGER)
    assert client.get(f"{BASE}/{t['id']}/messages",
                      headers=auth(STRANGER)).status_code == 403
    assert client.post(f"{BASE}/{t['id']}/messages", json={"content": "سلام"},
                       headers=auth(STRANGER)).status_code == 403


def test_chat_notification_fanout_excludes_author(client, seed, sent_notifications):
    t = _team(client, seed, "تیم اطلاع‌چت")
    _add_member(client, seed, t["id"], M1)

    assert client.post(f"{BASE}/{t['id']}/messages", json={"content": "سلام"},
                       headers=auth(CAP)).status_code == 201

    fanout = [n for n in sent_notifications if n["type"] == "team_message"]
    assert [n["user_id"] for n in fanout] == [_uid(M1)]