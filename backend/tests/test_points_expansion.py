# backend/tests/test_points_expansion.py
"""گسترش امتیاز وفاداری — برد بازی گروهی (game_win) و ثبت نظر (review).

پوشش: جایزه/ضدتکرار/اعتبارسنجی برندگان/دسترسی + جایزه یک‌بارهٔ نظر و ویرایش بی‌جایزه.
"""
from sqlmodel import Session, select

from conftest import test_engine
from helpers import auth, err_code
from app.models.loyalty import LoyaltyPoint, LoyaltyReason

BASE = "/api/v1/games"
REVIEWS = "/api/v1/reviews/"
LOYALTY_ME = "/api/v1/loyalty/me"


def _make_game(client, seed, phone, max_players=5, mode="organizer_pays", **overrides):
    owner = seed["user"](phone)
    chain = seed["booking"](owner)
    body = {"booking_id": chain["booking"].id, "name": "بازی امتیاز",
            "max_players": max_players, "visibility": "public",
            "payment_mode": mode}
    body.update(overrides)
    r = client.post(f"{BASE}/", json=body, headers=auth(phone))
    assert r.status_code == 201, r.text
    return owner, r.json()["id"]


def _join(client, gid, phone):
    r = client.post(f"{BASE}/{gid}/join", headers=auth(phone))
    assert r.status_code == 200, r.text
    return r.json()


def _balance(client, phone):
    return client.get(LOYALTY_ME, headers=auth(phone)).json()


def _points(reason):
    with Session(test_engine) as s:
        return s.exec(select(LoyaltyPoint).where(LoyaltyPoint.reason == reason)).all()


def _result(client, gid, phone, winner_ids):
    return client.post(f"{BASE}/{gid}/result", json={"winner_ids": winner_ids},
                       headers=auth(phone))


# ─────────────────────────── ثبت نتیجه + جایزه برد ───────────────────────────

def test_game_result_awards_winners(client, seed, sent_notifications):
    owner, gid = _make_game(client, seed, "09350000001")
    mate = seed["user"]("09350000002")
    _join(client, gid, mate.phone)

    r = _result(client, gid, owner.phone, [owner.id, mate.id])
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["awarded"] == 2
    assert body["points_each"] == 500
    assert set(body["winner_ids"]) == {owner.id, mate.id}

    detail = client.get(f"{BASE}/{gid}", headers=auth(owner.phone)).json()
    assert detail["status"] == "completed"
    assert detail["result_set"] is True
    assert set(detail["winner_ids"]) == {owner.id, mate.id}

    assert _balance(client, mate.phone)["balance"] == 500
    rows = _points(LoyaltyReason.GAME_WIN)
    assert len(rows) == 2 and all(x.points == 500 for x in rows)
    assert all(x.source_type == "game" for x in rows)
    assert _balance(client, owner.phone)["history"][0]["reason"] == "game_win"


def test_game_result_repeat_409_no_extra(client, seed):
    owner, gid = _make_game(client, seed, "09350000003")
    mate = seed["user"]("09350000004")
    _join(client, gid, mate.phone)

    assert _result(client, gid, owner.phone, [owner.id]).status_code == 200
    again = _result(client, gid, owner.phone, [owner.id])
    assert again.status_code == 409
    assert len(_points(LoyaltyReason.GAME_WIN)) == 1
    assert _balance(client, owner.phone)["balance"] == 500


def test_game_result_non_participant_rejected(client, seed):
    owner, gid = _make_game(client, seed, "09350000005")
    stranger = seed["user"]("09350000006")

    bad = _result(client, gid, owner.phone, [stranger.id])
    assert bad.status_code in (400, 422)
    empty = _result(client, gid, owner.phone, [])
    assert empty.status_code == 422
    assert _points(LoyaltyReason.GAME_WIN) == []
    detail = client.get(f"{BASE}/{gid}", headers=auth(owner.phone)).json()
    assert detail["result_set"] is False


def test_game_result_non_organizer_403(client, seed):
    owner, gid = _make_game(client, seed, "09350000007")
    mate = seed["user"]("09350000008")
    _join(client, gid, mate.phone)

    bad = _result(client, gid, mate.phone, [mate.id])
    assert bad.status_code == 403
    assert err_code(bad) == "NOT_AUTHORIZED"


# ─────────────────────────── جایزه ثبت نظر ───────────────────────────

def test_review_awards_once_and_edit_no_reaward(client, seed):
    owner = seed["user"]("09350000010")
    chain = seed["booking"](owner)
    vid = chain["venue"].id
    u1 = seed["user"]("09350000011")
    u2 = seed["user"]("09350000012")

    r = client.post(REVIEWS, json={"venue_id": vid, "rating": 5, "comment": "عالی"},
                    headers=auth(u1.phone))
    assert r.status_code == 201, r.text
    rid = r.json()["id"]
    assert _balance(client, u1.phone)["balance"] == 50

    up = client.put(f"{REVIEWS}{rid}", json={"venue_id": vid, "rating": 4, "comment": "خوب"},
                    headers=auth(u1.phone))
    assert up.status_code == 200, up.text
    assert _balance(client, u1.phone)["balance"] == 50  # ویرایش ⇒ بدون جایزه مجدد

    r2 = client.post(REVIEWS, json={"venue_id": vid, "rating": 3}, headers=auth(u2.phone))
    assert r2.status_code == 201, r2.text
    assert _balance(client, u2.phone)["balance"] == 50

    rows = _points(LoyaltyReason.REVIEW)
    assert len(rows) == 2
    assert all(x.source_type == "review" and x.points == 50 for x in rows)


def test_balance_surfaces_both_new_reasons(client, seed):
    owner, gid = _make_game(client, seed, "09350000020")
    assert _result(client, gid, owner.phone, [owner.id]).status_code == 200

    chain = seed["booking"](owner)
    r = client.post(REVIEWS, json={"venue_id": chain["venue"].id, "rating": 5},
                    headers=auth(owner.phone))
    assert r.status_code == 201, r.text

    me = _balance(client, owner.phone)
    assert me["balance"] == 550
    reasons = {h["reason"] for h in me["history"]}
    assert {"game_win", "review"} <= reasons