# backend/tests/test_games_join.py
"""تست join/leave/waitlist/درخواست‌ها — قوانین ظرفیت و سیاست تأیید."""
from helpers import auth, err_code

BASE = "/api/v1/games"


def _game(client, seed, phone="09210000001", **overrides):
    owner = seed["user"](phone)
    chain = overrides.pop("chain", None) or seed["booking"](owner)
    body = {"booking_id": chain["booking"].id, "name": "بازی join",
            "max_players": 3, "visibility": "public",
            "payment_mode": "organizer_pays"}
    body.update(overrides)
    r = client.post(f"{BASE}/", json=body, headers=auth(phone))
    assert r.status_code == 201, r.text
    return owner, r.json()["id"]


# ─────────────────────────── join ───────────────────────────

def test_join_success(client, seed):
    _, gid = _game(client, seed)
    mate = seed["user"]("09210000010")
    r = client.post(f"{BASE}/{gid}/join", headers=auth(mate.phone))
    assert r.status_code == 200, r.text
    game = r.json()["game"]
    assert game["current_players"] == 2
    assert r.json()["message"] == "به بازی پیوستید."


def test_join_requires_auth(client, seed):
    _, gid = _game(client, seed)
    assert client.post(f"{BASE}/{gid}/join").status_code == 401


def test_join_twice_rejected(client, seed):
    _, gid = _game(client, seed)
    mate = seed["user"]("09210000011")
    assert client.post(f"{BASE}/{gid}/join", headers=auth(mate.phone)).status_code == 200
    again = client.post(f"{BASE}/{gid}/join", headers=auth(mate.phone))
    assert again.status_code == 409
    assert err_code(again) == "ALREADY_JOINED"


def test_join_private_requires_token(client, seed):
    owner, gid = _game(client, seed, visibility="private")
    mate = seed["user"]("09210000012")
    direct = client.post(f"{BASE}/{gid}/join", headers=auth(mate.phone))
    assert direct.status_code == 403
    assert err_code(direct) == "PRIVATE_GAME"
    # با لینک دعوت مجاز است
    link = client.post(f"{BASE}/{gid}/invite-links", json={}, headers=auth(owner.phone))
    token = link.json()["token"]
    via = client.post(f"{BASE}/join/{token}", headers=auth(mate.phone))
    assert via.status_code == 200, via.text
    assert via.json()["game"]["current_players"] == 2


def test_join_approval_policy_creates_request(client, seed):
    owner, gid = _game(client, seed, visibility="public_approval")
    mate = seed["user"]("09210000013")
    r = client.post(f"{BASE}/{gid}/join", headers=auth(mate.phone))
    assert r.status_code == 200, r.text
    assert "در انتظار تأیید" in r.json()["message"]
    assert r.json()["game"]["current_players"] == 1  # هنوز قطعی نشده
    again = client.post(f"{BASE}/{gid}/join", headers=auth(mate.phone))
    assert again.status_code == 409
    assert err_code(again) == "ALREADY_REQUESTED"

    # ارگانایزر درخواست را می‌بیند و تأیید می‌کند
    reqs = client.get(f"{BASE}/{gid}/join-requests", headers=auth(owner.phone)).json()
    assert len(reqs) == 1 and reqs[0]["user_id"] == mate.id
    ok = client.post(f"{BASE}/{gid}/join-requests/{reqs[0]['id']}/approve",
                     headers=auth(owner.phone))
    assert ok.status_code == 200
    assert ok.json()["game"]["current_players"] == 2

    # درخواست تکراری بعد از تأیید → ALREADY_JOINED
    dup = client.post(f"{BASE}/{gid}/join", headers=auth(mate.phone))
    assert err_code(dup) == "ALREADY_JOINED"


def test_reject_join_request(client, seed):
    owner, gid = _game(client, seed, visibility="public_approval")
    mate = seed["user"]("09210000014")
    client.post(f"{BASE}/{gid}/join", headers=auth(mate.phone))
    reqs = client.get(f"{BASE}/{gid}/join-requests", headers=auth(owner.phone)).json()
    bad = client.post(f"{BASE}/{gid}/join-requests/{reqs[0]['id']}/reject",
                      headers=auth(owner.phone))
    assert bad.status_code == 200
    after = client.get(f"{BASE}/{gid}/join-requests", headers=auth(owner.phone)).json()
    assert after == []


def test_join_requests_require_manage(client, seed):
    owner, gid = _game(client, seed, visibility="public_approval")
    mate = seed["user"]("09210000015")
    client.post(f"{BASE}/{gid}/join", headers=auth(mate.phone))
    stranger = seed["user"]("09210000016")
    r = client.get(f"{BASE}/{gid}/join-requests", headers=auth(stranger.phone))
    assert r.status_code == 403
    assert err_code(r) == "NOT_AUTHORIZED"


# ─────────────────────────── capacity / waitlist ───────────────────────────

def test_full_game_waitlists(client, seed):
    owner, gid = _game(client, seed, max_players=2)
    m1 = seed["user"]("09210000020")
    m2 = seed["user"]("09210000021")
    assert client.post(f"{BASE}/{gid}/join", headers=auth(m1.phone)).status_code == 200
    full = client.post(f"{BASE}/{gid}/join", headers=auth(m2.phone))
    assert full.status_code == 200
    assert "لیست انتظار" in full.json()["message"]
    assert full.json()["game"]["current_players"] == 2
    assert full.json()["game"]["status"] == "full"
    detail = client.get(f"{BASE}/{gid}", headers=auth(m2.phone)).json()
    assert detail["my_waitlist_position"] == 1
    dup = client.post(f"{BASE}/{gid}/join", headers=auth(m2.phone))
    assert err_code(dup) == "ALREADY_WAITLISTED"


def test_leave_promotes_from_waitlist(client, seed):
    owner, gid = _game(client, seed, max_players=2)
    m1 = seed["user"]("09210000030")
    m2 = seed["user"]("09210000031")
    m3 = seed["user"]("09210000032")
    client.post(f"{BASE}/{gid}/join", headers=auth(m1.phone))
    client.post(f"{BASE}/{gid}/join", headers=auth(m2.phone))  # waitlist
    client.post(f"{BASE}/{gid}/join", headers=auth(m3.phone))  # waitlist pos 2
    # m1 خارج می‌شود → m2 ارتقا می‌یابد
    leave = client.post(f"{BASE}/{gid}/leave", headers=auth(m1.phone))
    assert leave.status_code == 200
    game = leave.json()["game"]
    assert game["current_players"] == 2
    assert game["status"] == "full"
    # m3 حالا در موقعیت ۱ است
    detail = client.get(f"{BASE}/{gid}", headers=auth(m3.phone)).json()
    assert detail["my_waitlist_position"] == 1
    # m2 عضو قطعی شده
    detail2 = client.get(f"{BASE}/{gid}", headers=auth(m2.phone)).json()
    assert detail2["my_participant_status"] == "accepted"


def test_organizer_cannot_leave(client, seed):
    owner, gid = _game(client, seed)
    r = client.post(f"{BASE}/{gid}/leave", headers=auth(owner.phone))
    assert r.status_code == 409
    assert err_code(r) == "ORGANIZER_CANNOT_LEAVE"


def test_leave_non_participant(client, seed):
    _, gid = _game(client, seed)
    stranger = seed["user"]("09210000040")
    r = client.post(f"{BASE}/{gid}/leave", headers=auth(stranger.phone))
    assert r.status_code == 409
    assert err_code(r) == "NOT_A_PARTICIPANT"


def test_rejoin_after_leave(client, seed):
    _, gid = _game(client, seed)
    mate = seed["user"]("09210000041")
    client.post(f"{BASE}/{gid}/join", headers=auth(mate.phone))
    client.post(f"{BASE}/{gid}/leave", headers=auth(mate.phone))
    back = client.post(f"{BASE}/{gid}/join", headers=auth(mate.phone))
    assert back.status_code == 200
    assert back.json()["game"]["current_players"] == 2


# ─────────────────────────── remove participant ───────────────────────────

def test_remove_participant_by_organizer(client, seed):
    owner, gid = _game(client, seed)
    mate = seed["user"]("09210000050")
    client.post(f"{BASE}/{gid}/join", headers=auth(mate.phone))
    r = client.delete(f"{BASE}/{gid}/participants/{mate.id}", headers=auth(owner.phone))
    assert r.status_code == 200
    assert r.json()["game"]["current_players"] == 1
    # حذف‌شده می‌تواند دوباره join کند
    assert client.post(f"{BASE}/{gid}/join", headers=auth(mate.phone)).status_code == 200


def test_cannot_remove_organizer(client, seed):
    owner, gid = _game(client, seed)
    r = client.delete(f"{BASE}/{gid}/participants/{owner.id}", headers=auth(owner.phone))
    assert r.status_code == 409
    assert err_code(r) == "CANNOT_REMOVE_ORGANIZER"


def test_remove_requires_manage(client, seed):
    owner, gid = _game(client, seed)
    mate = seed["user"]("09210000051")
    client.post(f"{BASE}/{gid}/join", headers=auth(mate.phone))
    r = client.delete(f"{BASE}/{gid}/participants/{owner.id}", headers=auth(mate.phone))
    assert r.status_code in (403, 409)


# ─────────────────────────── roles ───────────────────────────

def test_set_admin_role_grants_manage(client, seed):
    owner, gid = _game(client, seed)
    mate = seed["user"]("09210000060")
    client.post(f"{BASE}/{gid}/join", headers=auth(mate.phone))
    r = client.patch(f"{BASE}/{gid}/participants/{mate.id}",
                     json={"role": "admin"}, headers=auth(owner.phone))
    assert r.status_code == 200 and r.json()["role"] == "admin"
    # admin می‌تواند لینک بسازد
    link = client.post(f"{BASE}/{gid}/invite-links", json={}, headers=auth(mate.phone))
    assert link.status_code == 201
    # ولی نقش کسی را نتواند تغییر دهد (فقط organizer)
    bad = client.patch(f"{BASE}/{gid}/participants/{owner.id}",
                       json={"role": "member"}, headers=auth(mate.phone))
    assert bad.status_code == 403
    assert err_code(bad) == "NOT_ORGANIZER"


def test_cannot_change_organizer_role(client, seed):
    owner, gid = _game(client, seed)
    mate = seed["user"]("09210000061")
    client.post(f"{BASE}/{gid}/join", headers=auth(mate.phone))
    r = client.patch(f"{BASE}/{gid}/participants/{owner.id}",
                     json={"role": "member"}, headers=auth(owner.phone))
    assert r.status_code == 409
    assert err_code(r) == "CANNOT_CHANGE_ORGANIZER_ROLE"


def test_invalid_role_rejected(client, seed):
    owner, gid = _game(client, seed)
    mate = seed["user"]("09210000062")
    client.post(f"{BASE}/{gid}/join", headers=auth(mate.phone))
    r = client.patch(f"{BASE}/{gid}/participants/{mate.id}",
                     json={"role": "organizer"}, headers=auth(owner.phone))
    assert r.status_code == 400
    assert err_code(r) == "INVALID_ROLE"


# ─────────────────────────── waitlist endpoints ───────────────────────────

def test_waitlist_endpoints(client, seed):
    owner, gid = _game(client, seed, max_players=2)  # organizer + m1 = capacity 2
    m1 = seed["user"]("09210000070")
    m2 = seed["user"]("09210000071")
    client.post(f"{BASE}/{gid}/join", headers=auth(m1.phone))  # accepted
    wl = client.post(f"{BASE}/{gid}/waitlist", headers=auth(m2.phone))
    assert wl.status_code == 201
    assert wl.json()["position"] == 1
    listed = client.get(f"{BASE}/{gid}/waitlist", headers=auth(owner.phone)).json()
    assert len(listed) == 1 and listed[0]["user_id"] == m2.id
    out = client.delete(f"{BASE}/{gid}/waitlist", headers=auth(m2.phone))
    assert out.status_code == 200
    assert client.get(f"{BASE}/{gid}/waitlist", headers=auth(owner.phone)).json() == []
