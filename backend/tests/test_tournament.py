# backend/tests/test_tournament.py
"""تورنمنت و براکت (C2 / P005) — موتور قرعه‌کشی، دروازه‌ها و چرخهٔ کامل یک براکت.

دو نوع آزمون عمداً جدا هستند:
۱) ساختاری (سرویس، با تعداد تیم پارامتری): خاصیت‌های درستِ براکت تک‌حذفی —
   تعداد دیدارها = B−1، byeها ≤ نصف دور اول، سید ۱ و ۲ در دور اول به هم نمی‌خورند،
   و هر تیم دقیقاً یک خانه دارد. یک براکت نمونه این‌ها را اثبات نمی‌کند.
۲) مسیری (API، کد وضعیت دقیق): دروازهٔ کاپیتان/برگزارکننده، رد تساوی، قرعهٔ دوباره
   و «از ثبت‌نام تا قهرمان بدون دخالت دستی» — معیار پذیرش C2.
"""
from datetime import datetime, timezone
from math import log2

import pytest
from app.models.team import Team
from app.unit_of_work import UnitOfWork
from app.services import tournament_service as ts
from helpers import auth

BASE = "/api/v1/tournaments"


# ─────────────────────────── کمکی‌ها ───────────────────────────

@pytest.fixture()
def organizer(seed):
    return seed["user"]("09190000000", "برگزارکننده.test")


def _teams(db, seed, count: int, tag: str):
    """count جفت (کاپیتان، تیم) — کاپیتان یکتا باشد تا UQ تیم رد نشود."""
    out = []
    for index in range(1, count + 1):
        captain = seed["user"](f"09191{index:06d}", f"کاپیتان {tag} {index}")
        team = Team(name=f"تیم {tag} {index}", captain_id=captain.id)
        db.add(team)
        db.commit()
        db.refresh(team)
        db.close()  # آزادکردن write-lock (conftest همین کار را می‌کند)
        out.append((captain, team))
    return out


def _register_all(organizer, roster):
    """ساخت ← بازکردن ثبت‌نام ← ورود همهٔ تیم‌ها؛ شناسهٔ تورنمنت را برمی‌گرداند."""
    with UnitOfWork() as uow:
        tournament = ts.create_tournament(uow, organizer, name="تورنمنت تست")
        tournament_id = tournament.id
        ts.open_registration(uow, organizer, tournament_id)
        uow.commit()
    for captain, team in roster:
        with UnitOfWork() as uow:
            ts.register_team(uow, captain, tournament_id, team.id)
            uow.commit()
    return tournament_id


def _draw(organizer, tournament_id):
    with UnitOfWork() as uow:
        ts.draw_bracket(uow, organizer, tournament_id)
        out = ts.bracket(uow, tournament_id)
        uow.commit()
    return out


def _round1(bracket_out):
    return bracket_out["rounds"][0]["matches"]


# ─────────────────────────── ۱) موتور قرعه‌کشی: خاصیت‌ها ───────────────────────────

@pytest.mark.parametrize("teams,size", [(2, 2), (3, 4), (4, 4), (5, 8), (7, 8),
                                        (8, 8), (9, 16), (16, 16)])
def test_bracket_size_is_next_power_of_two(teams, size):
    assert ts.bracket_size(teams) == size


def test_bracket_size_rejects_one_team():
    with pytest.raises(ValueError):
        ts.bracket_size(1)


def test_seed_order_places_top_seeds_in_opposite_halves():
    order = ts.seed_order(8)
    assert order == [1, 8, 4, 5, 2, 7, 3, 6]          # الگوی استاندارد
    assert sorted(order) == list(range(1, 9))          # هر سید دقیقاً یک بار
    pairs = [(order[i], order[i + 1]) for i in range(0, 8, 2)]
    assert (1, 2) not in pairs and (2, 1) not in pairs  # سید ۱ و ۲ فینال می‌رسند
    half = len(order) // 2
    assert 1 in order[:half] and 2 in order[half:]      # نیمه‌های جدا


def test_round_names_in_persian():
    assert ts.round_name(1, 3) == "نهایی"
    assert ts.round_name(2, 2) == "نیمه‌نهایی"
    assert ts.round_name(4, 1) == "یک‌چهارم نهایی"


@pytest.mark.parametrize("count", [2, 3, 5, 6, 7, 8, 11])
def test_bracket_structure_properties(db, seed, organizer, count):
    """B = توان ۲؛ درایو: B−1 دیدار، byeها = B−count و ≤ نصف دور اول."""
    roster = _teams(db, seed, count, f"s{count}")
    tournament_id = _register_all(organizer, roster)
    out = _draw(organizer, tournament_id)

    size = ts.bracket_size(count)
    rounds = out["rounds"]
    matches = [m for rnd in rounds for m in rnd["matches"]]

    assert len(rounds) == int(log2(size))
    assert rounds[-1]["name"] == "نهایی"
    assert len(matches) == size - 1
    assert len(rounds[0]["matches"]) == size // 2

    first = rounds[0]["matches"]
    byes = [m for m in first if m["status"] == "bye"]
    assert len(byes) == size - count
    assert len(byes) <= size // 2

    # هر bye دقیقاً یک تیم دارد و آن تیم را به مرحلهٔ بعد فرستاده است
    for bye in byes:
        filled = [t for t in (bye["team_a_id"], bye["team_b_id"]) if t]
        assert len(filled) == 1
        assert bye["winner_team_id"] == filled[0]
        assert bye["next_match_id"] is not None

    # هر تیم ثبت‌نام‌کرده دقیقاً یک بار در خانه‌های دور اول نشسته است
    slots = [t for m in first for t in (m["team_a_id"], m["team_b_id"]) if t]
    assert len(slots) == count
    assert len(set(slots)) == count

    # سید ۱ و ۲ (اولین و دومین تیم ثبت‌نام) در دور اول حریف هم نیستند
    seed_map = {p["team_id"]: (p["seed"] or 10_000) for p in out["participants"]}
    for match in first:
        if match["team_a_id"] and match["team_b_id"]:
            assert {seed_map[match["team_a_id"]], seed_map[match["team_b_id"]]} != {1, 2}

    # دیدارهای غیر bye در دور اول «آماده» هستند؛ مراحل بعدی هنوز نامشخص‌اند
    assert all(m["status"] == "ready" for m in first if m["status"] != "bye")
    assert all(m["status"] == "pending"
               for m in matches if m["round_id"] != rounds[0]["id"]
               and not (m["team_a_id"] and m["team_b_id"]))


def test_five_teams_three_byes_and_a_ready_semifinal(db, seed, organizer):
    """۵ تیم ⇒ ۳ bye؛ نیمه‌نهاییِ سمتِ سید ۲ و ۳ از همان قرعه‌کشی آماده است."""
    roster = _teams(db, seed, 5, "x5")
    tournament_id = _register_all(organizer, roster)
    out = _draw(organizer, tournament_id)

    semifinal = out["rounds"][1]["matches"]
    ready = [m for m in semifinal if m["status"] == "ready"]
    assert len(ready) == 1
    assert len(_round1(out)) == 4
    assert len([m for m in _round1(out) if m["status"] == "bye"]) == 3


def test_draw_twice_rejected(db, seed, organizer):
    roster = _teams(db, seed, 4, "dup")
    tournament_id = _register_all(organizer, roster)
    _draw(organizer, tournament_id)
    with UnitOfWork() as uow:
        with pytest.raises(ValueError):
            ts.draw_bracket(uow, organizer, tournament_id)


def test_draw_needs_two_teams(db, seed, organizer):
    roster = _teams(db, seed, 1, "solo")
    tournament_id = _register_all(organizer, roster)
    with UnitOfWork() as uow:
        with pytest.raises(ValueError) as exc:
            ts.draw_bracket(uow, organizer, tournament_id)
    assert "حداقل" in str(exc.value)


# ─────────────────────────── ۲) مسیر API ───────────────────────────

def test_api_creates_and_lists_tournament(client, seed, organizer, db):
    r = client.post(BASE, json={"name": "جام بهار", "entry_fee": 200000,
                                "starts_at": datetime(2026, 11, 1, 18, tzinfo=timezone.utc).isoformat()},
                    headers=auth(organizer.phone))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "draft" and body["format"] == "single_elimination"
    assert body["team_count"] == 0 and body["winner_team_id"] is None

    listed = client.get(f"{BASE}?mine=true", headers=auth(organizer.phone))
    assert listed.status_code == 200
    assert listed.json()["total"] == 1
    assert listed.json()["items"][0]["id"] == body["id"]

    other = seed["user"]("09192000000", "دیگری")
    assert client.get(f"{BASE}?mine=true", headers=auth(other.phone)).json()["total"] == 0


def test_api_rejects_tournament_without_organizer(client, seed):
    stranger = seed["user"]("09192000001", "مزاحم")
    r = client.get(f"{BASE}/999999", headers=auth(stranger.phone))
    assert r.status_code == 404
    assert "یافت نشد" in r.json()["detail"]


def test_api_only_captain_registers_team(client, seed, organizer, db):
    tournament_id = _api_create(client, organizer)
    captain = seed["user"]("09191333001", "کاپیتان یک")
    team = Team(name="تیم API", captain_id=captain.id)
    db.add(team)
    db.commit()
    db.refresh(team)
    db.close()  # آزادکردن write-lock

    outsider = seed["user"]("09191333002", "کاپیتان دیگر")
    r = client.post(f"{BASE}/{tournament_id}/participants",
                    json={"team_id": team.id}, headers=auth(outsider.phone))
    assert r.status_code == 403, r.text
    assert "کاپیتان" in r.json()["detail"]

    ok = client.post(f"{BASE}/{tournament_id}/participants",
                     json={"team_id": team.id}, headers=auth(captain.phone))
    assert ok.status_code == 200, ok.text
    assert ok.json()["team_name"] == "تیم API"

    again = client.post(f"{BASE}/{tournament_id}/participants",
                        json={"team_id": team.id}, headers=auth(captain.phone))
    assert again.status_code == 400, again.text
    assert "قبلاً" in again.json()["detail"]


def test_api_registers_in_order_rejects_future_seed(client, seed, organizer, db):
    tournament_id = _api_create(client, organizer)
    first = _api_team(db, seed, 1, "sq")
    r = client.post(f"{BASE}/{tournament_id}/participants",
                    json={"team_id": first.team.id, "seed": 3}, headers=auth(first.captain.phone))
    assert r.status_code == 400, r.text
    assert "سید" in r.json()["detail"]


def test_api_only_organizer_draws(client, seed, organizer, db):
    tournament_id = _api_create(client, organizer)
    for index in range(1, 3):
        entry = _api_team(db, seed, index, "dr")
        client.post(f"{BASE}/{tournament_id}/participants",
                    json={"team_id": entry.team.id}, headers=auth(entry.captain.phone))

    stranger = seed["user"]("09191444009", "بیگانه")
    r = client.post(f"{BASE}/{tournament_id}/draw", headers=auth(stranger.phone))
    assert r.status_code == 403, r.text
    assert "برگزارکننده" in r.json()["detail"]

    drawn = client.post(f"{BASE}/{tournament_id}/draw", headers=auth(organizer.phone))
    assert drawn.status_code == 200, drawn.text
    assert drawn.json()["tournament"]["status"] == "drawn"
    assert len(drawn.json()["rounds"]) == 1

    # ثبت‌نام پس از قرعه‌کشی بسته است
    late = _api_team(db, seed, 7, "late")
    blocked = client.post(f"{BASE}/{tournament_id}/participants",
                          json={"team_id": late.team.id}, headers=auth(late.captain.phone))
    assert blocked.status_code == 400, blocked.text


def test_api_rejects_equal_score(client, seed, organizer, db):
    tournament_id = _api_create(client, organizer)
    for index in range(1, 3):
        entry = _api_team(db, seed, index, "eq")
        client.post(f"{BASE}/{tournament_id}/participants",
                    json={"team_id": entry.team.id}, headers=auth(entry.captain.phone))
    drawn = client.post(f"{BASE}/{tournament_id}/draw", headers=auth(organizer.phone))
    match_id = drawn.json()["rounds"][0]["matches"][0]["id"]

    tie = client.put(f"{BASE}/matches/{match_id}/result",
                     json={"score_a": 2, "score_b": 2}, headers=auth(organizer.phone))
    assert tie.status_code == 400, tie.text
    assert "مساوی" in tie.json()["detail"]

    # نتیجه فقط برگزارکنندهٔ تورنمنت
    stranger = seed["user"]("09191555001", "بیگانه دو")
    assert client.put(f"{BASE}/matches/{match_id}/result",
                      json={"score_a": 1, "score_b": 0},
                      headers=auth(stranger.phone)).status_code == 403


def _api_create(client, organizer) -> int:
    r = client.post(BASE, json={"name": "جام تابستانه"}, headers=auth(organizer.phone))
    assert r.status_code == 200, r.text
    return r.json()["id"]


def _api_team(db, seed, index: int, tag: str):
    captain = seed["user"](f"09191{index:06d}", f"کاپیتان {tag}{index}")
    team = Team(name=f"تیم {tag}{index}", captain_id=captain.id)
    db.add(team)
    db.commit()
    db.refresh(team)
    db.close()  # آزادکردن write-lock
    return type("Entry", (), {"captain": captain, "team": team})()


# ─────────────────────────── معیار پذیرش C2: هشت تیم تا قهرمان ───────────────────────────

def test_eight_teams_run_to_champion_without_manual_help(client, seed, organizer, db):
    """از ثبت‌نام ۸ تیم تا قهرمان: فقط نتیجه‌ها داده می‌شوند، براکت خودش جلو می‌رود."""
    tournament_id = _api_create(client, organizer)
    roster = []
    for index in range(1, 9):
        entry = _api_team(db, seed, index, "e8")
        r = client.post(f"{BASE}/{tournament_id}/participants",
                        json={"team_id": entry.team.id, "seed": index},
                        headers=auth(entry.captain.phone))
        assert r.status_code == 200, r.text
        roster.append(entry)

    drawn = client.post(f"{BASE}/{tournament_id}/draw", headers=auth(organizer.phone))
    assert drawn.status_code == 200, drawn.text

    def bracket():
        r = client.get(f"{BASE}/{tournament_id}/bracket", headers=auth(organizer.phone))
        assert r.status_code == 200, r.text
        return r.json()

    out = bracket()
    assert [len(r["matches"]) for r in out["rounds"]] == [4, 2, 1]
    assert [r["name"] for r in out["rounds"]] == ["یک‌چهارم نهایی", "نیمه‌نهایی", "نهایی"]
    assert out["tournament"]["status"] == "drawn"
    assert all(m["status"] == "ready" for m in _round1(out))

    # سید ۱ همیشه می‌برد ⇒ قهرمانِ قابل‌پیش‌بینی؛ فقط نتایج ثبت می‌شوند
    seed_of = {p["team_id"]: p["seed"] for p in out["participants"]}
    played = []
    for _ in range(7):
        current = bracket()
        ready = [m for rnd in current["rounds"] for m in rnd["matches"]
                 if m["status"] == "ready"]
        assert ready, current
        match = ready[0]
        a, b = match["team_a_id"], match["team_b_id"]
        winner = a if seed_of[a] < seed_of[b] else b
        loser = b if winner == a else a
        r = client.put(f"{BASE}/matches/{match['id']}/result",
                       json={"score_a": 2 if winner == a else 0,
                             "score_b": 2 if winner == b else 0},
                       headers=auth(organizer.phone))
        assert r.status_code == 200, r.text
        played.append(match["id"])
        assert r.json()["winner_team_id"] == winner
        if match["next_match_id"]:
            advanced = bracket()
            target = [m for rnd in advanced["rounds"] for m in rnd["matches"]
                      if m["id"] == match["next_match_id"]][0]
            assert winner in (target["team_a_id"], target["team_b_id"])
            # برندهٔ یک دیدار هرگز در دو خانهٔ همان مرحله نمی‌نشیند
            assert target["team_a_id"] != target["team_b_id"]

    final = bracket()
    assert len(set(played)) == 7                       # B−1 بازی، بدون تکرار
    assert final["tournament"]["status"] == "completed"
    assert final["tournament"]["winner_team_id"] == roster[0].team.id
    assert final["tournament"]["winner_team_name"] == roster[0].team.name
    assert final["tournament"]["team_count"] == 8

    standings_r = client.get(f"{BASE}/{tournament_id}/standings",
                             headers=auth(organizer.phone))
    assert standings_r.status_code == 200
    rows = standings_r.json()["items"]
    assert [r["rank"] for r in rows] == [1, 2, 3, 3]
    assert rows[0]["team_id"] == roster[0].team.id
    assert rows[0]["label"] == "قهرمان" and rows[1]["label"] == "نایب‌قهرمان"
    assert {r["team_id"] for r in rows[2:]} != {roster[0].team.id}

    # پس از پایان، نتیجهٔ جدید مردود است
    replay = client.put(f"{BASE}/matches/{played[-1]}/result",
                        json={"score_a": 5, "score_b": 0}, headers=auth(organizer.phone))
    assert replay.status_code == 400, replay.text


def test_api_cancel_blocks_results(client, seed, organizer, db):
    tournament_id = _api_create(client, organizer)
    for index in range(1, 3):
        entry = _api_team(db, seed, index, "cn")
        client.post(f"{BASE}/{tournament_id}/participants",
                    json={"team_id": entry.team.id}, headers=auth(entry.captain.phone))
    drawn = client.post(f"{BASE}/{tournament_id}/draw", headers=auth(organizer.phone))
    match_id = drawn.json()["rounds"][0]["matches"][0]["id"]

    r = client.post(f"{BASE}/{tournament_id}/cancel", headers=auth(organizer.phone))
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "cancelled"

    blocked = client.put(f"{BASE}/matches/{match_id}/result",
                         json={"score_a": 1, "score_b": 0}, headers=auth(organizer.phone))
    assert blocked.status_code == 400, blocked.text
    assert "در جریان" in blocked.json()["detail"]


def test_withdraw_only_before_draw(client, seed, organizer, db):
    tournament_id = _api_create(client, organizer)
    entries = []
    for index in range(1, 5):
        entry = _api_team(db, seed, index, "wd")
        client.post(f"{BASE}/{tournament_id}/participants",
                    json={"team_id": entry.team.id}, headers=auth(entry.captain.phone))
        entries.append(entry)

    withdrawn = client.delete(f"{BASE}/{tournament_id}/participants/{entries[3].team.id}",
                              headers=auth(organizer.phone))
    assert withdrawn.status_code == 200, withdrawn.text

    drawn = client.post(f"{BASE}/{tournament_id}/draw", headers=auth(organizer.phone))
    assert drawn.status_code == 200, drawn.text
    assert drawn.json()["tournament"]["team_count"] == 3
    assert len(drawn.json()["participants"]) == 4      # ردیف کناره‌گیری هم دیده می‌شود

    late = client.delete(f"{BASE}/{tournament_id}/participants/{entries[0].team.id}",
                        headers=auth(organizer.phone))
    assert late.status_code == 400, late.text
