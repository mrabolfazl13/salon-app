# backend/tests/test_teams_roster.py
"""تست اعضا: دعوت/پذیرش/رد، حذف، خروج، انتقال کاپیتانی، درخواست‌ها، سقف اعضا."""
import pytest

from app.config import settings
from helpers import auth, err_code

BASE = "/api/v1/teams"
CAP = "09360000001"
M1 = "09360000002"
M2 = "09360000003"
M3 = "09360000004"


def _ensure(seed, phone):
    """ساخت کاربر فقط اگر وجود ندارد — helpers این فایل idempotent."""
    from sqlmodel import Session, select
    from conftest import test_engine
    from app.models.user import User
    with Session(test_engine) as s:
        exists = s.exec(select(User).where(User.phone == phone)).first() is not None
    if not exists:
        seed["user"](phone)


def _team(client, seed, captain=CAP, name="تیم راوی", **kw):
    _ensure(seed, captain)
    body = {"name": name, "visibility": kw.pop("visibility", "private")}
    body.update(kw)
    return client.post(f"{BASE}/", json=body, headers=auth(captain)).json()


def _uid(phone):
    from sqlmodel import Session, select
    from conftest import test_engine
    from app.models.user import User
    with Session(test_engine) as s:
        return s.exec(select(User).where(User.phone == phone)).first().id


def _invite(client, phone, tid, target):
    return client.post(f"{BASE}/{tid}/invite", json={"phone": target},
                       headers=auth(phone))


def _active_member(client, seed, tid, captain=CAP):
    _ensure(seed, M1)
    mid = _invite(client, captain, tid, M1).json()["member_id"]
    client.post(f"{BASE}/{tid}/invitations/{mid}/accept", headers=auth(M1))
    return mid


# ─────────────────────────── invitations ───────────────────────────

def test_invite_accept_flow_with_notification(client, seed, sent_notifications):
    t = _team(client, seed)
    _ensure(seed, M1)
    r = _invite(client, CAP, t["id"], M1)
    assert r.status_code == 201, r.text
    inv = r.json()
    assert inv["status"] == "pending"
    # کاپیتان دعوت‌شده را در لیست pending می‌بیند
    assert any(m["status"] == "pending" for m in
               client.get(f"{BASE}/{t['id']}/members", headers=auth(CAP)).json())
    assert inv["team_id"] == t["id"] or "team_id" in inv
    # دعوت‌نامه در فهرست من
    mine = client.get(f"{BASE}/invitations/me", headers=auth(M1)).json()
    assert len(mine) == 1 and mine[0]["member_id"] == inv["member_id"]
    assert mine[0]["team_name"] == t["name"]
    # پذیرش توسط خود کاربر
    r2 = client.post(f"{BASE}/{t['id']}/invitations/{inv['member_id']}/accept",
                     headers=auth(M1))
    assert r2.status_code == 200, r2.text
    members = client.get(f"{BASE}/{t['id']}/members", headers=auth(CAP)).json()
    assert len(members) == 2
    assert {m["role"] for m in members} == {"captain", "member"}
    types = [n["type"] for n in sent_notifications]
    assert "team_invitation" in types
    assert "team_joined" in types or "team_invitation_accepted" in types


def test_duplicate_invite_blocked(client, seed):
    t = _team(client, seed)
    _ensure(seed, M1)
    assert _invite(client, CAP, t["id"], M1).status_code == 201
    r = _invite(client, CAP, t["id"], M1)
    assert r.status_code == 409
    assert err_code(r) == "ALREADY_PENDING"
    # پذیرش و سپس دعوت مجدد → ALREADY_MEMBER
    mid = client.get(f"{BASE}/invitations/me", headers=auth(M1)).json()[0]["member_id"]
    client.post(f"{BASE}/{t['id']}/invitations/{mid}/accept", headers=auth(M1))
    r2 = _invite(client, CAP, t["id"], M1)
    assert r2.status_code == 409
    assert err_code(r2) == "ALREADY_MEMBER"


def test_invite_unknown_phone_404(client, seed):
    t = _team(client, seed)
    r = _invite(client, CAP, t["id"], "09369999999")
    assert r.status_code == 404
    assert err_code(r) == "USER_NOT_FOUND"


def test_accept_only_by_invitee(client, seed):
    t = _team(client, seed)
    _ensure(seed, M1)
    _ensure(seed, M2)
    mid = _invite(client, CAP, t["id"], M1).json()["member_id"]
    r = client.post(f"{BASE}/{t['id']}/invitations/{mid}/accept", headers=auth(M2))
    assert r.status_code == 404  # دعوت متعلق به او نیست
    assert err_code(r) == "INVITATION_NOT_FOUND"
    # پاسخ دوم به همان دعوت → 409
    client.post(f"{BASE}/{t['id']}/invitations/{mid}/accept", headers=auth(M1))
    r2 = client.post(f"{BASE}/{t['id']}/invitations/{mid}/accept", headers=auth(M1))
    assert r2.status_code == 409
    assert err_code(r2) == "INVITATION_ALREADY_ANSWERED"


def test_decline_flow(client, seed, sent_notifications):
    t = _team(client, seed)
    _ensure(seed, M1)
    mid = _invite(client, CAP, t["id"], M1).json()["member_id"]
    r = client.post(f"{BASE}/{t['id']}/invitations/{mid}/decline", headers=auth(M1))
    assert r.status_code == 200
    active = [m for m in client.get(f"{BASE}/{t['id']}/members", headers=auth(CAP)).json()
              if m["status"] == "active"]
    assert len(active) == 1  # فقط کاپیتان
    # پذیرش بعد از رد مسدود
    assert client.post(f"{BASE}/{t['id']}/invitations/{mid}/accept",
                       headers=auth(M1)).status_code == 409


# ─────────────────────────── remove / leave / transfer ───────────────────────────

def test_remove_rules(client, seed, sent_notifications):
    t = _team(client, seed)
    mid = _active_member(client, seed, t["id"])
    # عضو معمولی نمی‌تواند عضو دیگری را حذف کند
    _ensure(seed, M2)
    assert _invite(client, CAP, t["id"], M2).status_code == 201
    m2_member_id = next(m["id"] for m in client.get(f"{BASE}/{t['id']}/members",
                                                    headers=auth(CAP)).json()
                        if m["status"] == "pending")
    r = client.post(f"{BASE}/{t['id']}/members/{m2_member_id}/remove", headers=auth(M1))
    assert r.status_code == 403
    assert err_code(r) == "NOT_AUTHORIZED"
    # حذف کاپیتان مسدود — حتی توسط مدیر (ادمین منصوب‌شده)
    m1_member_id = next(m["id"] for m in client.get(f"{BASE}/{t['id']}/members",
                                                    headers=auth(CAP)).json()
                        if m["user_id"] == _uid(M1))
    assert client.post(f"{BASE}/{t['id']}/members/{m1_member_id}/role",
                       json={"role": "admin"}, headers=auth(CAP)).status_code == 200
    cap_member_id = [m for m in client.get(f"{BASE}/{t['id']}/members",
                                           headers=auth(CAP)).json()
                     if m["role"] == "captain"][0]["id"]
    r2 = client.post(f"{BASE}/{t['id']}/members/{cap_member_id}/remove",
                     headers=auth(M1))
    assert r2.status_code == 409
    assert err_code(r2) == "CANNOT_REMOVE_CAPTAIN"
    # و حذف عضو عادی (M2 در انتظار پاسخ) توسط ادمین مجاز است
    assert client.post(f"{BASE}/{t['id']}/members/{m2_member_id}/remove",
                       headers=auth(M1)).status_code == 200
    # حذف خودی → بگو از leave استفاده کن
    r3 = client.post(f"{BASE}/{t['id']}/members/{mid}/remove", headers=auth(M1))
    assert r3.status_code == 409 and err_code(r3) == "USE_LEAVE"
    # حذف عادی توسط کاپیتان
    r4 = client.post(f"{BASE}/{t['id']}/members/{mid}/remove", headers=auth(CAP))
    assert r4.status_code == 200, r4.text
    assert any(n["type"] == "team_removed" for n in sent_notifications)
    # حذف‌شده می‌تواند دوباره دعوت و پذیرفته شود
    mid2 = _invite(client, CAP, t["id"], M1).json()["member_id"]
    assert client.post(f"{BASE}/{t['id']}/invitations/{mid2}/accept",
                       headers=auth(M1)).status_code == 200


def test_leave_rules(client, seed):
    t = _team(client, seed)
    _active_member(client, seed, t["id"])
    # کاپیتان بدون انتقال خارج نمی‌شود
    r = client.post(f"{BASE}/{t['id']}/leave", headers=auth(CAP))
    assert r.status_code == 409
    assert err_code(r) == "CAPTAIN_MUST_TRANSFER"
    # عضو عادی خارج می‌شود
    assert client.post(f"{BASE}/{t['id']}/leave", headers=auth(M1)).status_code == 200


def test_transfer_captain(client, seed, sent_notifications):
    t = _team(client, seed)
    _active_member(client, seed, t["id"])
    # ادمینِ نبودن: M1 عضو عادی است → انتقال نمی‌تواند
    r = client.post(f"{BASE}/{t['id']}/transfer-captain", json={"user_id": 1},
                    headers=auth(M1))
    assert r.status_code == 403
    assert err_code(r) == "ONLY_CAPTAIN"
    # انتقال به عضوفعال
    m1 = uow_user_id = None
    from sqlmodel import Session as _S, select as _sel
    from app.models.user import User as _U
    with _S(_engine()) as s:
        m1 = s.exec(_sel(_U).where(_U.phone == M1)).first().id
    r2 = client.post(f"{BASE}/{t['id']}/transfer-captain", json={"user_id": m1},
                     headers=auth(CAP))
    assert r2.status_code == 200, r2.text
    assert r2.json()["captain_id"] == m1
    roles = {m["phone"]: m["role"] for m in
             client.get(f"{BASE}/{t['id']}/members", headers=auth(M1)).json()}
    assert roles[M1] == "captain" and roles[CAP] == "admin"
    # کاپیتان جدید الان می‌تواند خارج شود (دیگر کاپیتان نیست؟ هست!) — کاپیتان قبلی ادمین است
    assert client.post(f"{BASE}/{t['id']}/leave", headers=auth(M1)).status_code == 409
    assert any(n["type"] == "team_captain_transferred" for n in sent_notifications)


def _engine():
    from conftest import test_engine
    return test_engine


# ─────────────────────────── join requests ───────────────────────────

def test_join_request_flow_public_team(client, seed, sent_notifications):
    t = _team(client, seed, visibility="public", name="تیم مردمی")
    _ensure(seed, M2)
    r = client.post(f"{BASE}/{t['id']}/join-request", json={"message": "سلام"},
                    headers=auth(M2))
    assert r.status_code == 201, r.text
    rid = r.json()["id"]
    assert client.post(f"{BASE}/{t['id']}/join-request", json={},
                       headers=auth(M2)).status_code == 409  # ALREADY_REQUESTED
    reqs = client.get(f"{BASE}/{t['id']}/join-requests", headers=auth(CAP)).json()
    assert len(reqs) == 1 and reqs[0]["id"] == rid
    # عضو معمولی نمی‌تواند فهرست را ببیند
    assert client.get(f"{BASE}/{t['id']}/join-requests", headers=auth(M2)).status_code == 403
    ap = client.post(f"{BASE}/{t['id']}/join-requests/{rid}/approve", headers=auth(CAP))
    assert ap.status_code == 200, ap.text
    members = client.get(f"{BASE}/{t['id']}/members", headers=auth(CAP)).json()
    assert len(members) == 2 and members[1]["status"] == "active"
    assert any(n["type"] == "team_request_approved" for n in sent_notifications)


def test_join_request_reject_and_non_public(client, seed, sent_notifications):
    t = _team(client, seed, visibility="public", name="تیم رددرخواست")
    _ensure(seed, M2)
    rid = client.post(f"{BASE}/{t['id']}/join-request", json={},
                      headers=auth(M2)).json()["id"]
    rj = client.post(f"{BASE}/{t['id']}/join-requests/{rid}/reject", headers=auth(CAP))
    assert rj.status_code == 200
    assert any(n["type"] == "team_request_rejected" for n in sent_notifications)
    # تیم خصوصی/فقط-با-دعوت درخواست نمی‌پذیرد
    t2 = _team(client, seed, name="تیم فقط‌دعوتی", visibility="invite_only")
    r2 = client.post(f"{BASE}/{t2['id']}/join-request", json={}, headers=auth(M2))
    assert r2.status_code == 403
    assert err_code(r2) == "JOIN_NOT_ALLOWED"


# ─────────────────────────── ظرفیت ───────────────────────────

def test_max_members_cap(client, seed, monkeypatch):
    monkeypatch.setattr(settings, "TEAM_MAX_MEMBERS", 2)
    t = _team(client, seed, name="تیم کوچک")
    _ensure(seed, M1)
    mid = _invite(client, CAP, t["id"], M1).json()["member_id"]
    client.post(f"{BASE}/{t['id']}/invitations/{mid}/accept", headers=auth(M1))
    _ensure(seed, M2)
    r = _invite(client, CAP, t["id"], M2)
    assert r.status_code == 409
    assert err_code(r) == "TEAM_FULL"