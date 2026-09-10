# backend/tests/test_games_crud.py
"""تست ساخت/نمایش/ویرایش/لغو بازی — قوانین visibility و cascade."""
from sqlmodel import Session, select

from conftest import test_engine
from helpers import auth, err_code
from app.models.booking import Booking, BookingStatus
from app.models.game import (
    Game, GameInviteLink, GameInvitation, GameParticipant,
    ParticipantStatus, ParticipantRole, InvitationStatus,
)

BASE = "/api/v1/games"


def _create(client, phone, seed, booking=None, **overrides):
    owner = seed["user"](phone)
    chain = booking or seed["booking"](owner)
    body = {"booking_id": chain["booking"].id, "name": "بازی هفته",
            "max_players": 5, "visibility": "public",
            "payment_mode": "organizer_pays"}
    body.update(overrides)
    r = client.post(f"{BASE}/", json=body, headers=auth(phone))
    return owner, chain, r


# ─────────────────────────── create ───────────────────────────

def test_create_game_success(client, seed):
    owner, _, r = _create(client, "09110000001", seed)
    assert r.status_code == 201, r.text
    g = r.json()
    assert g["status"] == "open"
    assert g["current_players"] == 1
    assert g["organizer_name"] == owner.full_name
    assert g["my_participant_status"] == "accepted"
    assert g["my_role"] == "organizer"
    assert g["venue_name"] == "سالن تست"
    assert g["slot_date"] == "2026-09-10"


def test_create_game_booking_not_found(client, seed):
    owner = seed["user"]("09110000002")
    r = client.post(f"{BASE}/", json={"booking_id": 99999, "name": "بازی",
                                      "max_players": 5}, headers=auth(owner.phone))
    assert r.status_code == 404
    assert err_code(r) == "BOOKING_NOT_FOUND"


def test_create_game_on_others_booking(client, seed):
    owner = seed["user"]("09110000003")
    chain = seed["booking"](owner)
    thief = seed["user"]("09110000004")
    r = client.post(f"{BASE}/", json={"booking_id": chain["booking"].id,
                                      "name": "سرقت", "max_players": 5},
                    headers=auth(thief.phone))
    assert r.status_code == 403
    assert err_code(r) == "NOT_AUTHORIZED"


def test_create_game_booking_not_confirmed(client, seed):
    owner = seed["user"]("09110000005")
    chain = seed["booking"](owner, status=BookingStatus.PENDING)
    r = client.post(f"{BASE}/", json={"booking_id": chain["booking"].id,
                                      "name": "بازی", "max_players": 5},
                    headers=auth(owner.phone))
    assert r.status_code == 409
    assert err_code(r) == "BOOKING_NOT_CONFIRMED"


def test_create_game_duplicate_on_booking(client, seed):
    _, _, r1 = _create(client, "09110000006", seed)
    assert r1.status_code == 201
    booking_id = r1.json()["booking_id"]
    r2 = client.post(f"{BASE}/", json={"booking_id": booking_id,
                                       "name": "دوباره", "max_players": 5},
                     headers=auth("09110000006"))
    assert r2.status_code == 409
    assert err_code(r2) == "GAME_ALREADY_EXISTS"


# ─────────────────────────── visibility / explore ───────────────────────────

def test_public_game_visible_anonymously(client, seed):
    _, _, r = _create(client, "09110000010", seed)
    gid = r.json()["id"]
    detail = client.get(f"{BASE}/{gid}")
    assert detail.status_code == 200
    explore = client.get(f"{BASE}/")
    assert explore.status_code == 200
    ids = [i["id"] for i in explore.json()["items"]]
    assert gid in ids


def test_private_game_hidden(client, seed):
    owner, _, r = _create(client, "09110000011", seed, visibility="private")
    gid = r.json()["id"]
    assert client.get(f"{BASE}/{gid}").status_code == 403
    assert err_code(client.get(f"{BASE}/{gid}")) == "PRIVATE_GAME"
    explore = client.get(f"{BASE}/").json()
    assert gid not in [i["id"] for i in explore["items"]]
    assert client.get(f"{BASE}/{gid}", headers=auth(owner.phone)).status_code == 200
    stranger = seed["user"]("09110000012")
    assert client.get(f"{BASE}/{gid}", headers=auth(stranger.phone)).status_code == 403


def test_explore_filters(client, seed):
    owner = seed["user"]("09110000013")
    chain = seed["booking"](owner, price=500_000)
    r1 = client.post(f"{BASE}/", json={"booking_id": chain["booking"].id, "name": "فوتبال",
                                       "max_players": 5, "sport": "football",
                                       "payment_mode": "organizer_pays"},
                     headers=auth(owner.phone))
    chain2 = seed["booking"](owner, price=900_000)
    r2 = client.post(f"{BASE}/", json={"booking_id": chain2["booking"].id, "name": "بسکتبال",
                                       "max_players": 5, "sport": "basketball",
                                       "payment_mode": "organizer_pays"},
                     headers=auth(owner.phone))
    assert r1.status_code == 201 and r2.status_code == 201

    only_basket = client.get(f"{BASE}/", params={"sport": "basketball"}).json()
    assert [i["name"] for i in only_basket["items"]] == ["بسکتبال"]

    cheap = client.get(f"{BASE}/", params={"max_price_per_player": 150_000}).json()
    names = [i["name"] for i in cheap["items"]]
    assert "فوتبال" in names and "بسکتبال" not in names

    near = client.get(f"{BASE}/", params={"sort": "nearest", "latitude": 35.7,
                                          "longitude": 51.4}).json()
    assert near["items"][0]["distance_km"] is not None


# ─────────────────────────── my games ───────────────────────────

def test_my_games(client, seed):
    owner, _, r = _create(client, "09110000020", seed)
    gid = r.json()["id"]
    mate = seed["user"]("09110000021")
    assert client.post(f"{BASE}/{gid}/join", headers=auth(mate.phone)).status_code == 200
    mine = client.get(f"{BASE}/my", headers=auth(mate.phone)).json()
    assert [g["id"] for g in mine] == [gid]
    organized = client.get(f"{BASE}/my", headers=auth(owner.phone)).json()
    assert gid in [g["id"] for g in organized]


# ─────────────────────────── update ───────────────────────────

def test_update_game_fields(client, seed):
    owner, _, r = _create(client, "09110000030", seed)
    gid = r.json()["id"]
    upd = client.patch(f"{BASE}/{gid}", json={"name": "نام جدید", "max_players": 8},
                       headers=auth(owner.phone))
    assert upd.status_code == 200
    assert upd.json()["name"] == "نام جدید"
    assert upd.json()["max_players"] == 8


def test_update_capacity_below_players_rejected(client, seed):
    owner, _, r = _create(client, "09110000031", seed, max_players=2)
    gid = r.json()["id"]
    mate = seed["user"]("09110000032")
    client.post(f"{BASE}/{gid}/join", headers=auth(mate.phone))
    bad = client.patch(f"{BASE}/{gid}", json={"max_players": 1}, headers=auth(owner.phone))
    assert bad.status_code == 409
    assert err_code(bad) == "CAPACITY_BELOW_PLAYERS"


def test_update_status_via_patch_rejected(client, seed):
    owner, _, r = _create(client, "09110000033", seed)
    gid = r.json()["id"]
    bad = client.patch(f"{BASE}/{gid}", json={"status": "started"}, headers=auth(owner.phone))
    assert bad.status_code == 400
    assert err_code(bad) == "INVALID_STATUS_TRANSITION"


def test_update_requires_manage(client, seed):
    owner, _, r = _create(client, "09110000034", seed)
    gid = r.json()["id"]
    stranger = seed["user"]("09110000035")
    bad = client.patch(f"{BASE}/{gid}", json={"name": "تغییر غیرمجاز"},
                       headers=auth(stranger.phone))
    assert bad.status_code == 403
    assert err_code(bad) == "NOT_AUTHORIZED"


# ─────────────────────────── status transitions ───────────────────────────

def test_start_complete_flow(client, seed):
    owner, _, r = _create(client, "09110000040", seed)
    gid = r.json()["id"]
    started = client.post(f"{BASE}/{gid}/start", headers=auth(owner.phone))
    assert started.status_code == 200 and started.json()["status"] == "started"
    mate = seed["user"]("09110000041")
    late = client.post(f"{BASE}/{gid}/join", headers=auth(mate.phone))
    assert late.status_code == 409
    assert err_code(late) == "GAME_STARTED"
    done = client.post(f"{BASE}/{gid}/complete", headers=auth(owner.phone))
    assert done.status_code == 200 and done.json()["status"] == "completed"


def test_invalid_transition_complete_from_open(client, seed):
    owner, _, r = _create(client, "09110000042", seed)
    gid = r.json()["id"]
    bad = client.post(f"{BASE}/{gid}/complete", headers=auth(owner.phone))
    assert bad.status_code == 409
    assert err_code(bad) == "INVALID_STATUS_TRANSITION"


# ─────────────────────────── cancel cascade ───────────────────────────

def test_cancel_game_cascade(client, seed, db):
    owner, _, r = _create(client, "09110000050", seed, max_players=4,
                          payment_mode="split_payment")
    gid = r.json()["id"]
    mate = seed["user"]("09110000051")
    joined = client.post(f"{BASE}/{gid}/join", headers=auth(mate.phone))
    assert joined.status_code == 200

    # لینک + دعوت + پرداخت سهم
    link = client.post(f"{BASE}/{gid}/invite-links", json={}, headers=auth(owner.phone))
    assert link.status_code == 201
    third = seed["user"]("09110000052")
    inv = client.post(f"{BASE}/{gid}/invitations", json={"user_id": third.id},
                      headers=auth(owner.phone))
    assert inv.status_code == 201
    pay = client.post(f"{BASE}/{gid}/payments/{_pid(db, gid, mate.id)}/pay",
                      headers=auth(mate.phone))
    assert pay.status_code == 200

    cancelled = client.delete(f"{BASE}/{gid}", headers=auth(owner.phone))
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"

    # لینک‌ها غیرفعال
    links = client.get(f"{BASE}/{gid}/invite-links", headers=auth(owner.phone)).json()
    assert links == []
    # دعوت‌نامه‌ها revoked
    invs = client.get(f"{BASE}/{gid}/invitations", headers=auth(owner.phone)).json()
    assert all(i["status"] == "revoked" for i in invs)
    # سهم پرداختی مسترد
    summary = client.get(f"{BASE}/{gid}/payments", headers=auth(owner.phone)).json()
    assert summary["paid_count"] == 0
    assert any(p["status"] == "refunded" for p in summary["payments"])
    # Booking دست‌نخورده (قانون کسب‌وکار)
    booking_id = cancelled.json()["booking_id"]
    booking = db.get(Booking, booking_id)
    booking_status = booking.status
    db.commit()  # آزادکردن قفل BEGIN IMMEDIATE قبل از درخواست بعدی
    assert booking_status == BookingStatus.CONFIRMED
    # join بعد از لغو
    late = client.post(f"{BASE}/{gid}/join", headers=auth(third.phone))
    assert late.status_code == 409
    assert err_code(late) == "GAME_CANCELLED"


def test_cancel_only_by_organizer(client, seed):
    owner, _, r = _create(client, "09110000053", seed)
    gid = r.json()["id"]
    mate = seed["user"]("09110000054")
    client.post(f"{BASE}/{gid}/join", headers=auth(mate.phone))
    bad = client.delete(f"{BASE}/{gid}", headers=auth(mate.phone))
    assert bad.status_code == 403
    assert err_code(bad) == "NOT_ORGANIZER"


def _pid(db, game_id, user_id) -> int:
    p = db.exec(select(GameParticipant).where(
        GameParticipant.game_id == game_id,
        GameParticipant.user_id == user_id)).first()
    pid = p.id
    db.commit()  # آزادکردن قفل BEGIN IMMEDIATE قبل از درخواست‌های HTTP
    return pid
