# backend/tests/test_games_notifications.py
"""تست fan-out اعلان‌های بازی — یکپارچگی با سیستم اعلان موجود."""
from helpers import auth

BASE = "/api/v1/games"


def _game(client, seed, phone="09210000300", max_players=3):
    owner = seed["user"](phone)
    chain = seed["booking"](owner)
    r = client.post(f"{BASE}/", json={"booking_id": chain["booking"].id,
                                      "name": "بازی اعلان", "max_players": max_players,
                                      "visibility": "public",
                                      "payment_mode": "split_payment"},
                    headers=auth(phone))
    assert r.status_code == 201, r.text
    return owner, r.json()["id"]


def _types_for(sent, user_id):
    return [n["type"] for n in sent if n["user_id"] == user_id]


def test_join_notifies_organizer(client, seed, sent_notifications):
    owner, gid = _game(client, seed)
    mate = seed["user"]("09210000310")
    assert client.post(f"{BASE}/{gid}/join", headers=auth(mate.phone)).status_code == 200
    assert "game_joined" in _types_for(sent_notifications, owner.id)


def test_leave_notifies_organizer(client, seed, sent_notifications):
    owner, gid = _game(client, seed)
    mate = seed["user"]("09210000311")
    client.post(f"{BASE}/{gid}/join", headers=auth(mate.phone))
    sent_notifications.clear()
    assert client.post(f"{BASE}/{gid}/leave", headers=auth(mate.phone)).status_code == 200
    assert "game_left" in _types_for(sent_notifications, owner.id)


def test_waitlist_promotion_notifies_promoted(client, seed, sent_notifications):
    owner, gid = _game(client, seed, max_players=2)
    m1 = seed["user"]("09210000312")
    m2 = seed["user"]("09210000313")
    client.post(f"{BASE}/{gid}/join", headers=auth(m1.phone))
    client.post(f"{BASE}/{gid}/join", headers=auth(m2.phone))  # waitlist
    sent_notifications.clear()
    client.post(f"{BASE}/{gid}/leave", headers=auth(m1.phone))
    assert "game_waitlist_promoted" in _types_for(sent_notifications, m2.id)


def test_cancel_notifies_all_participants(client, seed, sent_notifications):
    owner, gid = _game(client, seed)
    m1 = seed["user"]("09210000314")
    m2 = seed["user"]("09210000315")
    client.post(f"{BASE}/{gid}/join", headers=auth(m1.phone))
    client.post(f"{BASE}/{gid}/join", headers=auth(m2.phone))
    sent_notifications.clear()
    assert client.delete(f"{BASE}/{gid}", headers=auth(owner.phone)).status_code == 200
    # broadcast_participants → organizer + m1 + m2
    cancelled = [n for n in sent_notifications if n["type"] == "game_cancelled"]
    assert {n["user_id"] for n in cancelled} == {owner.id, m1.id, m2.id}


def test_payment_notifies_organizer(client, seed, sent_notifications):
    owner, gid = _game(client, seed)
    mate = seed["user"]("09210000316")
    client.post(f"{BASE}/{gid}/join", headers=auth(mate.phone))
    ps = client.get(f"{BASE}/{gid}/participants", headers=auth(mate.phone)).json()
    pid = next(p["id"] for p in ps if p["user_id"] == mate.id)
    sent_notifications.clear()
    assert client.post(f"{BASE}/{gid}/payments/{pid}/pay",
                       headers=auth(mate.phone)).status_code == 200
    assert "game_payment_paid" in _types_for(sent_notifications, owner.id)


def test_invitation_notifies_invitee(client, seed, sent_notifications):
    owner, gid = _game(client, seed)
    mate = seed["user"]("09210000317")
    sent_notifications.clear()
    r = client.post(f"{BASE}/{gid}/invitations", json={"user_id": mate.id},
                    headers=auth(owner.phone))
    assert r.status_code == 201
    assert "game_invitation" in _types_for(sent_notifications, mate.id)
