# backend/tests/test_games_invitations.py
"""تست لینک دعوت (توکن) و دعوت مستقیم — اعتبارسنجی، انقضا، استفاده مجدد."""
from helpers import auth, err_code

BASE = "/api/v1/games"


def _game(client, seed, phone="09310000001", **overrides):
    owner = seed["user"](phone)
    chain = seed["booking"](owner)
    body = {"booking_id": chain["booking"].id, "name": "بازی دعوت",
            "max_players": 4, "visibility": "public",
            "payment_mode": "organizer_pays"}
    body.update(overrides)
    r = client.post(f"{BASE}/", json=body, headers=auth(phone))
    assert r.status_code == 201, r.text
    return owner, r.json()["id"]


# ─────────────────────────── invite links ───────────────────────────

def test_link_lifecycle(client, seed):
    owner, gid = _game(client, seed)
    created = client.post(f"{BASE}/{gid}/invite-links",
                          json={"expires_in_days": 7, "max_uses": 2},
                          headers=auth(owner.phone))
    assert created.status_code == 201
    link = created.json()
    assert link["join_path"].startswith("/join/g/")
    assert link["token"] and link["is_active"]
    token = link["token"]

    # پیش‌نمایش عمومی بدون لاگین
    prev = client.get(f"{BASE}/join/{token}")
    assert prev.status_code == 200
    assert prev.json()["valid"] is True
    assert prev.json()["game"]["id"] == gid

    # توکن نامعتبر
    bad = client.get(f"{BASE}/join/nosuchtoken123")
    assert bad.json()["valid"] is False
    assert bad.json()["reason"] == "INVITE_INVALID"

    # join با توکن — دو بار (max_uses=2)
    m1 = seed["user"]("09310000010")
    m2 = seed["user"]("09310000011")
    assert client.post(f"{BASE}/join/{token}", headers=auth(m1.phone)).status_code == 200
    assert client.post(f"{BASE}/join/{token}", headers=auth(m2.phone)).status_code == 200
    # ظرفیت لینک تمام
    m3 = seed["user"]("09310000012")
    exhausted = client.post(f"{BASE}/join/{token}", headers=auth(m3.phone))
    assert exhausted.status_code == 410
    assert err_code(exhausted) == "INVITE_INVALID"

    # غیرفعال‌سازی
    off = client.post(f"{BASE}/{gid}/invite-links/{link['id']}/disable",
                      headers=auth(owner.phone))
    assert off.status_code == 200 and off.json()["is_active"] is False
    assert client.get(f"{BASE}/join/{token}").json()["valid"] is False


def test_link_regenerate_invalidates_old(client, seed):
    owner, gid = _game(client, seed)
    old = client.post(f"{BASE}/{gid}/invite-links", json={},
                      headers=auth(owner.phone)).json()
    new = client.post(f"{BASE}/{gid}/invite-links/{old['id']}/regenerate",
                      headers=auth(owner.phone))
    assert new.status_code == 200
    new_token = new.json()["token"]
    assert new_token != old["token"]
    assert client.get(f"{BASE}/join/{old['token']}").json()["valid"] is False
    assert client.get(f"{BASE}/join/{new_token}").json()["valid"] is True


def test_link_requires_manage(client, seed):
    owner, gid = _game(client, seed)
    stranger = seed["user"]("09310000020")
    r = client.post(f"{BASE}/{gid}/invite-links", json={}, headers=auth(stranger.phone))
    assert r.status_code == 403
    assert err_code(r) == "NOT_AUTHORIZED"


def test_expired_link_rejected(client, seed, db):
    """انقضا با دستکاری expires_at در دیتابیس (توکن‌های سرویس همیشه آینده‌اند)."""
    from datetime import datetime, timedelta, timezone
    from app.models.game import GameInviteLink
    owner, gid = _game(client, seed)
    link = client.post(f"{BASE}/{gid}/invite-links", json={"expires_in_days": 1},
                       headers=auth(owner.phone)).json()
    row = db.get(GameInviteLink, link["id"])
    row.expires_at = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=1)
    db.add(row)
    db.commit()
    prev = client.get(f"{BASE}/join/{link['token']}")
    assert prev.json()["valid"] is False
    assert prev.json()["reason"] == "INVITE_EXPIRED"
    m = seed["user"]("09310000030")
    join = client.post(f"{BASE}/join/{link['token']}", headers=auth(m.phone))
    assert join.status_code == 410
    assert err_code(join) == "INVITE_EXPIRED"


# ─────────────────────────── direct invitations ───────────────────────────

def test_invitation_flow(client, seed):
    owner, gid = _game(client, seed, visibility="private")
    mate = seed["user"]("09310000040")
    inv = client.post(f"{BASE}/{gid}/invitations", json={"user_id": mate.id},
                      headers=auth(owner.phone))
    assert inv.status_code == 201
    inv_id = inv.json()["id"]
    assert inv.json()["status"] == "pending"

    # دعوت‌شده دعوت را در لیست خودش می‌بیند
    mine = client.get(f"{BASE}/invitations/my", headers=auth(mate.phone)).json()
    assert len(mine) == 1 and mine[0]["id"] == inv_id

    # پذیرش → عضو قطعی (حتی بازی private)
    ok = client.post(f"{BASE}/invitations/{inv_id}/accept", headers=auth(mate.phone))
    assert ok.status_code == 200, ok.text
    assert ok.json()["game"]["current_players"] == 2
    detail = client.get(f"{BASE}/{gid}", headers=auth(mate.phone))
    assert detail.status_code == 200

    # پاسخ تکراری
    again = client.post(f"{BASE}/invitations/{inv_id}/accept", headers=auth(mate.phone))
    assert again.status_code == 409
    assert err_code(again) == "INVITATION_ALREADY_ANSWERED"


def test_invitation_decline(client, seed):
    owner, gid = _game(client, seed)
    mate = seed["user"]("09310000041")
    inv_id = client.post(f"{BASE}/{gid}/invitations", json={"user_id": mate.id},
                         headers=auth(owner.phone)).json()["id"]
    r = client.post(f"{BASE}/invitations/{inv_id}/reject", headers=auth(mate.phone))
    assert r.status_code == 200
    detail = client.get(f"{BASE}/{gid}", headers=auth(mate.phone)).json()
    assert detail["current_players"] == 1  # دعوت‌شده رد کرده → قطعی نیست


def test_invitation_duplicate_rejected(client, seed):
    owner, gid = _game(client, seed)
    mate = seed["user"]("09310000042")
    first = client.post(f"{BASE}/{gid}/invitations", json={"user_id": mate.id},
                        headers=auth(owner.phone))
    assert first.status_code == 201
    dup = client.post(f"{BASE}/{gid}/invitations", json={"user_id": mate.id},
                      headers=auth(owner.phone))
    assert dup.status_code == 409
    assert err_code(dup) == "ALREADY_INVITED"


def test_invitation_other_user_cannot_answer(client, seed):
    owner, gid = _game(client, seed)
    mate = seed["user"]("09310000043")
    invader = seed["user"]("09310000044")
    inv_id = client.post(f"{BASE}/{gid}/invitations", json={"user_id": mate.id},
                         headers=auth(owner.phone)).json()["id"]
    r = client.post(f"{BASE}/invitations/{inv_id}/accept", headers=auth(invader.phone))
    assert r.status_code == 404
    assert err_code(r) == "INVITATION_NOT_FOUND"


def test_invite_nonexistent_user(client, seed):
    owner, gid = _game(client, seed)
    r = client.post(f"{BASE}/{gid}/invitations", json={"user_id": 99999},
                    headers=auth(owner.phone))
    assert r.status_code == 404
    assert err_code(r) == "USER_NOT_FOUND"
