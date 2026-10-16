# backend/tests/test_matchmaking.py
"""حریف‌یابی و چالش بازی (P010 / C4).

معیار پذیرش فیچر در همین فایل قفل می‌شود:
- «دو تیم با سطح نزدیک، هم را پیشنهاد می‌گیرند» ⇒ test_suggest_prefers_* و
  test_suggest_ranks_closer_level_first
- «چالش با پذیرش/رد طرفین ثبت می‌شود» ⇒ test_accept_/test_decline_* و
  test_challenge_creates_no_booking (چالش فقط توافق است، نه رزرو)
- «سیگنال بدون داده جریمه نمی‌کند» ⇒ test_rookie_pair_is_not_penalised
"""
import json
from datetime import date, datetime, time as dtime, timedelta, timezone

from sqlmodel import Session, col, select

from app.models.booking import Booking, BookingStatus
from app.models.game import Game, GameParticipant, GameStatus, ParticipantRole, ParticipantStatus
from app.models.slot import Slot, SlotStatus
from app.models.team import (
    Team, TeamAuditAction, TeamBooking, TeamMember, TeamMemberRole, TeamMemberStatus,
)
from app.models.team_challenge import ChallengeStatus, TeamChallenge
from app.models.user import User
from app.models.venue import Venue
from app.services.matchmaking_service import (
    FAR_KM, LEVEL_UNKNOWN_ONE, MatchmakingService, TeamSignals, _bucket, _has_geo,
)
from conftest import test_engine
from helpers import auth, err_code

M = "/api/v1/matching"


def _fresh():
    return Session(test_engine)


def _now():
    """now با zone — SQLModel روی این استک نوشتن datetime بی‌zone را رد می‌کند."""
    return datetime.now(timezone.utc)


# ─────────────────────────── ساخت داده ───────────────────────────

def _user(phone, name=None):
    with _fresh() as s:
        u = User(phone=phone, full_name=name or f"کاربر {phone}", hashed_password="x",
                 is_verified=True)
        s.add(u); s.commit(); s.refresh(u)
        return u


def _team(captain, name, members=(), visibility="public", sport="futsal"):
    with _fresh() as s:
        t = Team(name=name, captain_id=captain.id, visibility=visibility, sport=sport)
        s.add(t); s.commit(); s.refresh(t)
        tid = int(t.id)
        s.add(TeamMember(team_id=tid, user_id=captain.id,
                         role=TeamMemberRole.CAPTAIN, status=TeamMemberStatus.ACTIVE))
        for m in members:
            s.add(TeamMember(team_id=tid, user_id=m.id, status=TeamMemberStatus.ACTIVE))
        s.commit()
        return tid


def _venue(manager, lat, lng, name="سالن"):
    with _fresh() as s:
        v = Venue(name=name, category="futsal", address="آدرس", latitude=lat,
                  longitude=lng, phone="09120000000", manager_id=manager.id)
        s.add(v); s.commit(); s.refresh(v)
        return int(v.id)


def _team_booking(team_id, captain, venue_id, day, hour):
    """رزرو تیمی واقعی: Booking + Slot در سالن + پیوند TeamBooking."""
    with _fresh() as s:
        slot = Slot(venue_id=venue_id, slot_date=date(2026, 9, day),
                    start_time=dtime(hour, 0), duration=90, base_price=100_000,
                    current_price=100_000, status=SlotStatus.BOOKED)
        s.add(slot); s.commit(); s.refresh(slot)
        booking = Booking(slot_id=int(slot.id), user_id=captain.id,
                          status=BookingStatus.CONFIRMED, payment_amount=100_000)
        s.add(booking); s.commit(); s.refresh(booking)
        s.add(TeamBooking(team_id=team_id, booking_id=int(booking.id)))
        s.commit()
        return int(booking.id)


def _game_booking(captain, venue_id, day, hour):
    """رزرو برای میزبانی یک بازی — بدون TeamBooking، تا نتایج بازی سیگنال
    منطقه/زمان نسازد (آن‌ها فقط از رزروهای تیمی می‌آیند)."""
    with _fresh() as s:
        slot = Slot(venue_id=venue_id, slot_date=date(2026, 9, day),
                    start_time=dtime(hour, 0), duration=90, base_price=100_000,
                    current_price=100_000, status=SlotStatus.BOOKED)
        s.add(slot); s.commit(); s.refresh(slot)
        booking = Booking(slot_id=int(slot.id), user_id=captain.id,
                          status=BookingStatus.CONFIRMED, payment_amount=100_000)
        s.add(booking); s.commit(); s.refresh(booking)
        return int(booking.id)


def _results(team_id, users, played, won):
    """بازی‌های completed با نتیجه — همان منبعی که جدول لیگ از آن خوانده می‌شود.

    فقط برد/بازی مهم است؛ برای هر بازی یک Booking مستقل لازم است (booking_id یکتا).
    """
    with _fresh() as s:
        venue = Venue(name="سالن بازی", category="futsal", address="آ", latitude=35.7,
                      longitude=51.4, phone="0912", manager_id=users[0].id)
        s.add(venue); s.commit(); s.refresh(venue)
        vid = int(venue.id)
    for i in range(played):
        booking_id = _game_booking(users[0], vid, 1 + i, 9)
        winners = [int(users[0].id)] if i < won else []
        with _fresh() as s:
            game = Game(booking_id=booking_id, organizer_id=users[0].id,
                        name=f"بازی {i} تیم {team_id}", max_players=len(users),
                        status=GameStatus.COMPLETED, result_set=True,
                        winner_ids=json.dumps(winners))
            s.add(game); s.commit(); s.refresh(game)
            for u in users:
                s.add(GameParticipant(game_id=int(game.id), user_id=int(u.id),
                                      role=ParticipantRole.MEMBER,
                                      status=ParticipantStatus.ACCEPTED))
            s.commit()


def _env(tag, n_candidates=2, **_kw):
    """یک تیم من + N تیم عمومی دیگر، هر کدام با کاپیتان خودش."""
    mine_cap = _user(f"0939{tag}00001")
    mine = _team(mine_cap, f"تیم من {tag}")
    others = []
    for i in range(n_candidates):
        cap = _user(f"0939{tag}100{i}")
        tid = _team(cap, f"تیم حریف {tag}-{i}")
        others.append({"captain": cap, "team_id": tid})
    return {"mine": mine, "me": mine_cap, "others": others}


# ─────────────────────────── ریاضی امتیاز (بدون DB) ───────────────────────────

def _sig(win_rate=None, played=0, lat=None, lng=None, venue_id=None, slots=()):
    s = TeamSignals(1)
    s.win_rate, s.played = win_rate, played
    s.lat, s.lng, s.home_venue_id = lat, lng, venue_id
    s.slots = set(slots)
    return s


def test_level_signal_prefers_close_win_rate():
    mine = _sig(0.5, 4)
    near = MatchmakingService._level_signal(mine, _sig(0.6, 5))["value"]
    far = MatchmakingService._level_signal(mine, _sig(1.0, 5))["value"]
    assert near == 0.9 and far == 0.5


def test_level_signal_one_rookie_is_discounted_not_zero():
    out = MatchmakingService._level_signal(_sig(0.5, 4), _sig(None, 0))
    assert out["value"] == LEVEL_UNKNOWN_ONE
    assert "بازی ندارد" in out["note"]


def test_region_signal_decays_linearly_between_near_and_far():
    mine = _sig(lat=35.7, lng=51.4, venue_id=1)
    near = MatchmakingService._region_signal(mine, _sig(lat=35.7, lng=51.4, venue_id=2))
    assert near[0]["value"] == 1.0 and near[1] == 0.0
    far = MatchmakingService._region_signal(mine, _sig(lat=36.0, lng=51.4, venue_id=3))
    km = far[1]
    assert km > 0
    expected = round((FAR_KM - km) / (FAR_KM - 3.0), 3) if km < FAR_KM else 0.0
    assert far[0]["value"] == expected


def test_region_signal_without_geo_is_unavailable_not_zero():
    out, km = MatchmakingService._region_signal(_sig(venue_id=1), _sig(venue_id=2))
    assert km is None and out["value"] is None
    assert "معلوم نیست" in out["note"]


def test_zero_coordinates_are_not_a_location():
    assert _has_geo(0.0, 0.0) is False
    assert _has_geo(35.7, 51.4) is True


def test_time_signal_is_overlap_of_shared_windows():
    mine = _sig(slots={(2, "عصر و شب"), (5, "صبح")})
    same = MatchmakingService._time_signal(mine, _sig(slots={(2, "عصر و شب")}))
    assert same[0]["value"] == 0.5 and same[1] == 1
    none = MatchmakingService._time_signal(mine, _sig(slots={(0, "بعدازظهر")}))
    assert none[0]["value"] == 0.0 and none[1] == 0
    empty = MatchmakingService._time_signal(_sig(), _sig())
    assert empty[0]["value"] is None


def test_score_drops_unavailable_signals_from_denominator():
    """سیگنالِ بی‌داده جریمه نیست: وزنش از مخرج می‌رود نه اینکه صفر بگیرد."""
    level = MatchmakingService._level_signal(_sig(None, 0), _sig(None, 0))
    region, _ = MatchmakingService._region_signal(_sig(), _sig())
    time_sig, _ = MatchmakingService._time_signal(_sig(), _sig())
    assert MatchmakingService._score(level, region, time_sig) == 100
    # با یک سیگنالِ صفرِ واقعی، مخرج همان سه وزن می‌ماند
    level2 = MatchmakingService._level_signal(_sig(0.0, 4), _sig(1.0, 4))
    assert MatchmakingService._score(level2, region, time_sig) == 0


def test_bucket_boundaries():
    assert _bucket(8) == "صبح" and _bucket(14) == "بعدازظهر" and _bucket(20) == "عصر و شب"


# ─────────────────────────── پیشنهاد از API ───────────────────────────

def test_suggest_requires_active_membership(client):
    env = _env("01")
    stranger = _user("09390199999")
    r = client.get(f"{M}/teams/{env['mine']}", headers=auth(stranger.phone))
    assert r.status_code == 403 and err_code(r) == "NOT_A_MEMBER"


def test_suggest_ranks_closer_level_first(client):
    env = _env("02")
    _results(env["mine"], [env["me"]], played=4, won=2)          # ۵۰٪
    _results(env["others"][0]["team_id"], [env["others"][0]["captain"]], 4, 2)
    _results(env["others"][1]["team_id"], [env["others"][1]["captain"]], 4, 4)
    r = client.get(f"{M}/teams/{env['mine']}", headers=auth(env["me"].phone))
    assert r.status_code == 200, r.text
    items = r.json()["items"]
    assert [i["team_id"] for i in items] == [env["others"][0]["team_id"],
                                             env["others"][1]["team_id"]]
    assert items[0]["score"] == 100 and items[1]["score"] == 50
    assert items[0]["win_rate"] == 50.0


def test_suggest_prefers_near_home_venue(client):
    env = _env("03")
    near = _venue(env["me"], 35.701, 51.401, "سالن محله")
    far = _venue(env["me"], 36.30, 51.30, "سالن دور")
    _team_booking(env["mine"], env["me"], near, 2, 18)
    _team_booking(env["others"][0]["team_id"], env["others"][0]["captain"], near, 2, 19)
    _team_booking(env["others"][1]["team_id"], env["others"][1]["captain"], far, 2, 19)
    items = client.get(f"{M}/teams/{env['mine']}",
                       headers=auth(env["me"].phone)).json()["items"]
    assert items[0]["team_id"] == env["others"][0]["team_id"]
    assert items[0]["score"] > items[1]["score"]
    assert items[0]["distance_km"] is not None and items[0]["distance_km"] < items[1]["distance_km"]


def test_suggest_scores_shared_time_window(client):
    env = _env("04")
    v1 = _venue(env["me"], 35.70, 51.40, "سالن الف")
    v2 = _venue(env["me"], 35.70, 51.40, "سالن ب")   # همان مختصات ⇒ منطقه یکسان
    _team_booking(env["mine"], env["me"], v1, 2, 18)
    _team_booking(env["others"][0]["team_id"], env["others"][0]["captain"], v2, 2, 19)  # همان بازه
    _team_booking(env["others"][1]["team_id"], env["others"][1]["captain"], v2, 5, 8)   # بازهٔ دیگر
    items = client.get(f"{M}/teams/{env['mine']}",
                       headers=auth(env["me"].phone)).json()["items"]
    assert [i["shared_time_slots"] for i in items] == [1, 0]
    assert items[0]["score"] == 100
    assert items[1]["score"] < 100


def test_rookie_pair_is_not_penalised(client):
    """تیم تازه‌ثبت‌نام باید حریف پیدا کند، نه اینکه به‌خاطر بی‌سابقگی صفر شود."""
    env = _env("05")
    body = client.get(f"{M}/teams/{env['mine']}", headers=auth(env["me"].phone)).json()
    assert body["total"] == 2
    assert all(i["score"] == 100 for i in body["items"])
    assert body["basis"] == {"pool": 2, "results_used": 0, "bookings_scanned": 0}


def test_suggest_pool_is_same_sport_and_excludes_own_team(client):
    env = _env("06")
    football_cap = _user("09390670000")
    football = _team(football_cap, "تیم فوتبال", sport="football")
    ids = [i["team_id"] for i in client.get(
        f"{M}/teams/{env['mine']}", headers=auth(env["me"].phone)).json()["items"]]
    assert env["mine"] not in ids and football not in ids


def test_suggest_excludes_private_teams(client):
    env = _env("07")
    hidden_cap = _user("09390770000")
    hidden = _team(hidden_cap, "تیم خصوصی", visibility="private")
    ids = [i["team_id"] for i in client.get(
        f"{M}/teams/{env['mine']}", headers=auth(env["me"].phone)).json()["items"]]
    assert hidden not in ids


def test_suggest_marks_team_with_open_challenge(client):
    env = _env("08")
    target = env["others"][0]
    r = client.post(f"{M}/challenges", headers=auth(env["me"].phone), json={
        "from_team_id": env["mine"], "to_team_id": target["team_id"]})
    assert r.status_code == 201, r.text
    items = client.get(f"{M}/teams/{env['mine']}",
                       headers=auth(env["me"].phone)).json()["items"]
    flags = {i["team_id"]: i["has_open_challenge"] for i in items}
    assert flags[target["team_id"]] is True
    assert all(v is False for k, v in flags.items() if k != target["team_id"])


# ─────────────────────────── چالش: ساخت ───────────────────────────

def test_create_challenge_returns_row_and_notifies_target(client, sent_notifications):
    env = _env("10")
    target = env["others"][0]
    r = client.post(f"{M}/challenges", headers=auth(env["me"].phone), json={
        "from_team_id": env["mine"], "to_team_id": target["team_id"],
        "message": "جمعه بازی کنیم؟"})
    assert r.status_code == 201, r.text
    row = r.json()
    assert row["status"] == "pending" and row["direction"] == "outbox"
    assert row["from_team_name"] == "تیم من 10" and row["to_team_name"] == "تیم حریف 10-0"
    assert row["created_by_name"] == env["me"].full_name
    assert row["message"] == "جمعه بازی کنیم؟"
    assert "expires_at" in row
    notes = [n for n in sent_notifications if n["type"] == "team_challenge_received"]
    assert len(notes) == 1 and notes[0]["user_id"] == target["captain"].id
    assert "چالش" in notes[0]["title"]
    with _fresh() as s:
        audits = s.exec(select(TeamChallenge).where(
            col(TeamChallenge.id) == row["id"])).all()
        assert len(audits) == 1
        assert audits[0].expires_at > _now()


def test_challenge_records_audit_on_both_teams(client):
    env = _env("11")
    r = client.post(f"{M}/challenges", headers=auth(env["me"].phone), json={
        "from_team_id": env["mine"], "to_team_id": env["others"][0]["team_id"]})
    cid = r.json()["id"]
    with _fresh() as s:
        from app.models.team import TeamAuditEvent
        rows = s.exec(select(TeamAuditEvent).where(
            col(TeamAuditEvent.action) == TeamAuditAction.CHALLENGE_SENT)).all()
    assert {int(a.team_id) for a in rows} == {env["mine"], env["others"][0]["team_id"]}
    assert all(a.data and str(cid) in a.data for a in rows)


def test_self_challenge_rejected(client):
    env = _env("12")
    r = client.post(f"{M}/challenges", headers=auth(env["me"].phone), json={
        "from_team_id": env["mine"], "to_team_id": env["mine"]})
    assert r.status_code == 400 and err_code(r) == "SELF_CHALLENGE"


def test_private_target_rejected(client):
    env = _env("13")
    hidden_cap = _user("09391370000")
    hidden = _team(hidden_cap, "تیم خصوصی", visibility="private")
    r = client.post(f"{M}/challenges", headers=auth(env["me"].phone), json={
        "from_team_id": env["mine"], "to_team_id": hidden})
    assert r.status_code == 400 and err_code(r) == "PRIVATE_TEAM"


def test_one_open_challenge_per_pair_in_either_direction(client):
    env = _env("14")
    other = env["others"][0]
    first = client.post(f"{M}/challenges", headers=auth(env["me"].phone), json={
        "from_team_id": env["mine"], "to_team_id": other["team_id"]})
    assert first.status_code == 201
    # جهت مخالف هم مجاز نیست تا اولی باز است
    second = client.post(f"{M}/challenges", headers=auth(other["captain"].phone), json={
        "from_team_id": other["team_id"], "to_team_id": env["mine"]})
    assert second.status_code == 409
    assert err_code(second) == "CHALLENGE_OPEN_EXISTS"


def test_plain_member_cannot_send_challenge(client):
    env = _env("15")
    player = _user("09391590000")
    with _fresh() as s:
        s.add(TeamMember(team_id=env["mine"], user_id=player.id,
                         status=TeamMemberStatus.ACTIVE))
        s.commit()
    r = client.post(f"{M}/challenges", headers=auth(player.phone), json={
        "from_team_id": env["mine"], "to_team_id": env["others"][0]["team_id"]})
    assert r.status_code == 403 and err_code(r) == "NOT_AUTHORIZED"


def test_unknown_venue_proposal_rejected(client):
    env = _env("16")
    r = client.post(f"{M}/challenges", headers=auth(env["me"].phone), json={
        "from_team_id": env["mine"], "to_team_id": env["others"][0]["team_id"],
        "proposed_venue_id": 999999})
    assert r.status_code == 404 and err_code(r) == "VENUE_NOT_FOUND"


# ─────────────────────────── چالش: پاسخ ───────────────────────────

def _open_challenge(client, env, idx=0, **body):
    other = env["others"][idx]
    r = client.post(f"{M}/challenges", headers=auth(env["me"].phone), json={
        "from_team_id": env["mine"], "to_team_id": other["team_id"], **body})
    assert r.status_code == 201, r.text
    return int(r.json()["id"]), other


def test_accept_by_target_manager(client, sent_notifications):
    env = _env("20")
    cid, other = _open_challenge(client, env)
    r = client.post(f"{M}/challenges/{cid}/accept", headers=auth(other["captain"].phone),
                    json={"note": "باشه، جمعه"})
    assert r.status_code == 200, r.text
    row = r.json()
    assert row["status"] == "accepted" and row["direction"] == "inbox"
    assert row["accepted_by"] == other["captain"].id and row["responded_at"]
    assert row["response_note"] == "باشه، جمعه"
    notes = [n for n in sent_notifications if n["type"] == "team_challenge_accepted"]
    assert len(notes) == 1 and notes[0]["user_id"] == env["me"].id
    with _fresh() as s:
        ch = s.get(TeamChallenge, cid)
        assert ch.status == ChallengeStatus.ACCEPTED


def test_decline_keeps_note_and_notifies_sender(client, sent_notifications):
    env = _env("21")
    cid, other = _open_challenge(client, env)
    r = client.post(f"{M}/challenges/{cid}/decline", headers=auth(other["captain"].phone),
                    json={"note": "آن روز مسافرتیم"})
    assert r.status_code == 200 and r.json()["status"] == "declined"
    notes = [n for n in sent_notifications if n["type"] == "team_challenge_declined"]
    assert notes[0]["user_id"] == env["me"].id


def test_challenge_creates_no_booking(client):
    """چالش فقط توافق است — ساخت رزرو/پرداخت کارِ جریان رزرو می‌ماند."""
    env = _env("22")
    cid, other = _open_challenge(client, env)
    with _fresh() as s:
        before = len(s.exec(select(Booking)).all())
    client.post(f"{M}/challenges/{cid}/accept", headers=auth(other["captain"].phone),
                json={})
    with _fresh() as s:
        assert len(s.exec(select(Booking)).all()) == before


def test_sender_cannot_accept_its_own_challenge(client):
    env = _env("23")
    cid, _ = _open_challenge(client, env)
    r = client.post(f"{M}/challenges/{cid}/accept", headers=auth(env["me"].phone), json={})
    # دروازه، مدیرِ تیم مقصد را می‌خواهد؛ فرستنده عضو آن تیم نیست
    assert r.status_code == 403 and err_code(r) == "NOT_A_MEMBER"


def test_unrelated_team_cannot_respond(client):
    env = _env("24")
    cid, _ = _open_challenge(client, env)
    outsider = _user("09392490000")
    _team(outsider, "تیم سوم")
    r = client.post(f"{M}/challenges/{cid}/accept", headers=auth(outsider.phone), json={})
    assert r.status_code == 403 and err_code(r) == "NOT_A_MEMBER"
    # پاسخ از تیم مبدأ هم ممنوع است
    assert client.post(f"{M}/challenges/{cid}/accept",
                       headers=auth(env["me"].phone)).status_code == 403


def test_responding_twice_is_conflict(client):
    env = _env("25")
    cid, other = _open_challenge(client, env)
    assert client.post(f"{M}/challenges/{cid}/accept",
                       headers=auth(other["captain"].phone), json={}).status_code == 200
    r = client.post(f"{M}/challenges/{cid}/decline",
                    headers=auth(other["captain"].phone), json={})
    assert r.status_code == 409 and err_code(r) == "CHALLENGE_ALREADY_ANSWERED"


def test_expired_challenge_is_answered_with_410(client):
    env = _env("26")
    cid, other = _open_challenge(client, env)
    with _fresh() as s:
        ch = s.get(TeamChallenge, cid)
        ch.expires_at = _now() - timedelta(days=1)
        s.add(ch); s.commit()
    r = client.post(f"{M}/challenges/{cid}/accept", headers=auth(other["captain"].phone),
                    json={})
    assert r.status_code == 410 and err_code(r) == "CHALLENGE_EXPIRED"


def test_listing_expires_stale_challenges(client):
    env = _env("27")
    cid, _ = _open_challenge(client, env)
    with _fresh() as s:
        ch = s.get(TeamChallenge, cid)
        ch.expires_at = _now() - timedelta(hours=1)
        s.add(ch); s.commit()
    body = client.get(f"{M}/challenges?team_id={env['mine']}",
                      headers=auth(env["me"].phone)).json()
    assert body["items"][0]["status"] == "expired"
    pending = client.get(f"{M}/challenges?team_id={env['mine']}&status=pending",
                         headers=auth(env["me"].phone)).json()
    assert pending["total"] == 0
    with _fresh() as s:
        assert s.get(TeamChallenge, cid).status == ChallengeStatus.EXPIRED


def test_cancel_only_by_sender_before_answer(client, sent_notifications):
    env = _env("28")
    cid, other = _open_challenge(client, env)
    r = client.post(f"{M}/challenges/{cid}/cancel", headers=auth(other["captain"].phone))
    assert r.status_code == 403 and err_code(r) == "NOT_A_MEMBER"
    ok = client.post(f"{M}/challenges/{cid}/cancel", headers=auth(env["me"].phone))
    assert ok.status_code == 200 and ok.json()["status"] == "cancelled"
    notes = [n for n in sent_notifications if n["type"] == "team_challenge_cancelled"]
    assert notes[0]["user_id"] == other["captain"].id
    # پس از پاسخ‌دادن/پس‌گرفتن، دیگر قابل پس‌گرفتن نیست
    assert client.post(f"{M}/challenges/{cid}/cancel",
                       headers=auth(env["me"].phone)).status_code == 409


def test_cancelled_pair_can_challenge_again(client):
    env = _env("29")
    cid, other = _open_challenge(client, env)
    assert client.post(f"{M}/challenges/{cid}/cancel",
                       headers=auth(env["me"].phone)).status_code == 200
    again = client.post(f"{M}/challenges", headers=auth(env["me"].phone), json={
        "from_team_id": env["mine"], "to_team_id": other["team_id"]})
    assert again.status_code == 201


# ─────────────────────────── صندوق چالش‌ها ───────────────────────────

def test_challenge_inbox_outbox_direction(client):
    env = _env("30")
    cid, _ = _open_challenge(client, env)
    outbox = client.get(f"{M}/challenges?team_id={env['mine']}&direction=outbox",
                        headers=auth(env["me"].phone)).json()
    assert outbox["total"] == 1 and outbox["items"][0]["direction"] == "outbox"
    inbox = client.get(
        f"{M}/challenges?team_id={env['others'][0]['team_id']}&direction=inbox",
        headers=auth(env["others"][0]["captain"].phone)).json()
    assert inbox["total"] == 1 and inbox["items"][0]["direction"] == "inbox"
    assert inbox["items"][0]["id"] == cid
    wrong = client.get(f"{M}/challenges?team_id={env['mine']}&direction=inbox",
                       headers=auth(env["me"].phone)).json()
    assert wrong["total"] == 0


def test_challenge_list_requires_membership(client):
    env = _env("31")
    _open_challenge(client, env)
    stranger = _user("09393190000")
    r = client.get(f"{M}/challenges?team_id={env['mine']}", headers=auth(stranger.phone))
    assert r.status_code == 403 and err_code(r) == "NOT_A_MEMBER"


def test_get_challenge_detail_for_either_side(client):
    env = _env("32")
    cid, other = _open_challenge(client, env, proposed_date="2026-09-02",
                                 proposed_time="18:00:00")
    mine = client.get(f"{M}/challenges/{cid}", headers=auth(env["me"].phone))
    theirs = client.get(f"{M}/challenges/{cid}", headers=auth(other["captain"].phone))
    assert mine.status_code == theirs.status_code == 200
    assert mine.json()["direction"] == "outbox"
    assert theirs.json()["direction"] == "inbox"
    assert theirs.json()["proposed_date"] == "2026-09-02"
    assert theirs.json()["proposed_time"].startswith("18:00")


def test_get_challenge_hidden_from_outsider(client):
    env = _env("33")
    cid, _ = _open_challenge(client, env)
    stranger = _user("09393390000")
    r = client.get(f"{M}/challenges/{cid}", headers=auth(stranger.phone))
    assert r.status_code == 403 and err_code(r) == "NOT_A_MEMBER"


def test_challenge_not_found(client):
    env = _env("34")
    r = client.get(f"{M}/challenges/424242", headers=auth(env["me"].phone))
    assert r.status_code == 404 and err_code(r) == "CHALLENGE_NOT_FOUND"
