# backend/tests/test_tournament_round_robin.py
"""لیگِ همه‌با‌همه (C2.5) — چیدمان هفته‌ها، امتیازدهی و رتبه‌بندی.

تست‌ها دو دسته‌اند و عمداً جانشین هم نمی‌شوند:
۱) خاصیتی (توابع خالص، N پارامتری): «هر زوج دقیقاً یک بار»، «حداکثر یک دیدار در هفته»،
   تعداد هفته و تیمِ استراحت‌کرده. یک برنامهٔ نمونهٔ زیبا این‌ها را اثبات نمی‌کند.
۲) مسیری (API، کد وضعیت دقیق): تساوی در لیگ مجاز است ولی در تک‌حذفی نه، جدول لیگ
   از نتایج ساخته می‌شود، و «قهرمان» فقط وقتی اعلام می‌شود که رتبهٔ ۱ یک‌دانه باشد.
"""
from itertools import combinations

import pytest
from app.models.team import Team
from app.unit_of_work import UnitOfWork
from app.services import tournament_service as ts
from helpers import auth

BASE = "/api/v1/tournaments"


@pytest.fixture()
def organizer(seed):
    return seed["user"]("09190000100", "برگزارکننده لیگ")


# ─────────────────────────── ۱) چیدمان: خاصیت‌ها ───────────────────────────

@pytest.mark.parametrize("count", [2, 3, 4, 5, 6, 7, 8, 9])
def test_every_pair_meets_exactly_once_and_no_team_plays_twice_a_week(count):
    teams = list(range(100, 100 + count))
    weeks = ts.round_robin_weeks(teams)

    pairs = [tuple(sorted(pair)) for week in weeks for pair in week]
    assert len(pairs) == count * (count - 1) // 2
    assert len(set(pairs)) == len(pairs)
    assert set(pairs) == {tuple(sorted(pair)) for pair in combinations(teams, 2)}

    assert len(weeks) == (count - 1 if count % 2 == 0 else count)
    for week in weeks:
        played = [team for pair in week for team in pair]
        assert len(played) == len(set(played))  # حداکثر یک دیدار برای هر تیم در هفته


@pytest.mark.parametrize("count", [0, 1])
def test_round_robin_needs_two_teams(count):
    with pytest.raises(ValueError):
        ts.round_robin_weeks(list(range(count)))


@pytest.mark.parametrize("count", [3, 5, 7])
def test_each_team_rests_exactly_once_when_odd(count):
    teams = list(range(200, 200 + count))
    weeks = ts.round_robin_weeks(teams)

    rests = []
    for week in weeks:
        bye = ts.bye_of_week(teams, week)
        assert bye is not None
        rests.append(bye)
    assert sorted(rests) == teams


@pytest.mark.parametrize("count", [2, 4, 6])
def test_no_rest_week_when_even(count):
    teams = list(range(300, 300 + count))
    for week in ts.round_robin_weeks(teams):
        assert ts.bye_of_week(teams, week) is None


def test_week_names_are_persian_with_persian_digits():
    assert ts.week_name(1) == "هفته ۱"
    assert ts.week_name(12) == "هفته ۱۲"


# ─────────────────────────── ۲) قرعه‌کشی لیگ در سرویس ───────────────────────────

def _league_roster(db, seed, count: int, tag: str):
    return [(_captain(db, seed, index, tag)) for index in range(1, count + 1)]


def _captain(db, seed, index: int, tag: str):
    captain = seed["user"](f"09196{index:06d}", f"کاپیتان {tag}{index}")
    team = Team(name=f"تیم {tag}{index}", captain_id=captain.id)
    db.add(team)
    db.commit()
    db.refresh(team)
    db.close()  # آزادکردن write-lock
    return type("Entry", (), {"captain": captain, "team": team})()


def _league_service(organizer, roster, count: int, tag: str):
    """ساخت ← ثبت‌نام ← قرعه؛ (شناسهٔ تورنمنت، payload قرعه) برمی‌گرداند."""
    with UnitOfWork() as uow:
        tournament = ts.create_tournament(uow, organizer, name=f"لیگ {tag}",
                                          format=ts.TournamentFormat.ROUND_ROBIN)
        tournament_id = tournament.id
        ts.open_registration(uow, organizer, tournament_id)
        uow.commit()
    for entry in roster:
        with UnitOfWork() as uow:
            ts.register_team(uow, entry.captain, tournament_id, entry.team.id)
            uow.commit()
    with UnitOfWork() as uow:
        ts.draw_bracket(uow, organizer, tournament_id)
        out = ts.bracket(uow, tournament_id)
        uow.commit()
    return tournament_id, out


def test_league_draw_has_weeks_and_no_advancement_links(db, seed, organizer):
    count = 4
    roster = _league_roster(db, seed, count, "lk")
    tournament_id, out = _league_service(organizer, roster, count, "lk")

    assert out["tournament"]["format"] == "round_robin"
    assert [r["name"] for r in out["rounds"]] == ["هفته ۱", "هفته ۲", "هفته ۳"]

    matches = [m for r in out["rounds"] for m in r["matches"]]
    assert len(matches) == count * (count - 1) // 2
    assert {m["status"] for m in matches} == {"ready"}
    # در لیگ برنده به دیدار بعد «نمی‌رود»؛ پیش‌بینیِ لینک یعنی دو منبع حقیقت
    assert all(m["next_match_id"] is None and m["next_slot"] is None for m in matches)
    assert all(r["bye_team_id"] is None for r in out["rounds"])

    with UnitOfWork() as uow:
        assert ts.get_tournament(uow, tournament_id).status.value == "drawn"


def test_league_with_odd_teams_rests_one_team_per_week(db, seed, organizer):
    roster = _league_roster(db, seed, 5, "od")
    _tournament_id, out = _league_service(organizer, roster, 5, "od")

    assert len(out["rounds"]) == 5
    byes = [r["bye_team_id"] for r in out["rounds"]]
    assert sorted(byes) == sorted(e.team.id for e in roster)
    assert all(r["bye_team_name"] for r in out["rounds"])
    # تیم استراحت‌کرده نباید در دیدارهای همان هفته باشد
    for rnd, bye in zip(out["rounds"], byes):
        in_week = {m["team_a_id"] for m in rnd["matches"]} | {m["team_b_id"] for m in rnd["matches"]}
        assert bye not in in_week


# ─────────────────────────── ۳) مسیر API ───────────────────────────

def _api_league(client, organizer, db, seed, count: int, tag: str):
    created = client.post(BASE, json={"name": f"جام {tag}", "format": "round_robin"},
                          headers=auth(organizer.phone))
    assert created.status_code == 200, created.text
    assert created.json()["format"] == "round_robin"
    tournament_id = created.json()["id"]

    with UnitOfWork() as uow:
        ts.open_registration(uow, organizer, tournament_id)
        uow.commit()

    roster = []
    for index in range(1, count + 1):
        entry = _captain(db, seed, index, tag)
        roster.append(entry)
        registered = client.post(f"{BASE}/{tournament_id}/participants",
                                 json={"team_id": entry.team.id},
                                 headers=auth(entry.captain.phone))
        assert registered.status_code == 200, registered.text

    drawn = client.post(f"{BASE}/{tournament_id}/draw", headers=auth(organizer.phone))
    assert drawn.status_code == 200, drawn.text
    return tournament_id, roster, drawn.json()


def _play(client, organizer, drawn, games):
    """همهٔ دیدارها را طبق `games` تمام می‌کند.

    games: { frozenset({team_id, team_id}): (گل تیم کوچک‌تر, گل تیم بزرگ‌تر) } — جهت
    در payload خودکار پیدا می‌شود تا تست به چیدمانِ خانه‌ها وابسته نشود.
    """
    for rnd in drawn["rounds"]:
        for match in rnd["matches"]:
            ids = (match["team_a_id"], match["team_b_id"])
            key = frozenset(ids)
            assert key in games, f"نتیجه‌ای برای {sorted(key)} تعریف نشده"
            low, high = min(ids), max(ids)
            low_goals, high_goals = games[key]
            score_a = low_goals if ids[0] == low else high_goals
            score_b = high_goals if ids[1] == high else low_goals
            result = client.put(f"{BASE}/matches/{match['id']}/result",
                                json={"score_a": score_a, "score_b": score_b},
                                headers=auth(organizer.phone))
            assert result.status_code == 200, result.text
            assert result.json()["status"] == "final"


def test_api_rejects_unknown_format(client, organizer):
    # «double_elimination» دیگر ناشناخته نیست (C2.6)؛ مثالِ نامعتبر باید واقعاً
    # supports نمی‌شود: swiss هنوز فرمتی است که این برش نمی‌سازد.
    r = client.post(BASE, json={"name": "جام نامعلوم", "format": "swiss"},
                    headers=auth(organizer.phone))
    assert r.status_code == 422, r.text


def test_tie_is_a_real_result_in_league(client, seed, organizer, db):
    tournament_id, roster, drawn = _api_league(client, organizer, db, seed, 2, "tz")
    match = drawn["rounds"][0]["matches"][0]

    tie = client.put(f"{BASE}/matches/{match['id']}/result",
                     json={"score_a": 2, "score_b": 2}, headers=auth(organizer.phone))
    assert tie.status_code == 200, tie.text
    assert tie.json()["winner_team_id"] is None

    body = client.get(f"{BASE}/{tournament_id}", headers=auth(organizer.phone)).json()
    assert body["status"] == "completed"
    assert body["winner_team_id"] is None  # تساوی قهرمان نمی‌سازد

    standings = client.get(f"{BASE}/{tournament_id}/standings",
                           headers=auth(organizer.phone)).json()["items"]
    assert {row["rank"] for row in standings} == {1}
    assert all(row["tied"] and row["drawn"] == 1 and row["points"] == 1
               for row in standings)


def test_single_elimination_still_rejects_a_tie(client, seed, organizer, db):
    created = client.post(BASE, json={"name": "جام حذفی"}, headers=auth(organizer.phone))
    tournament_id = created.json()["id"]
    assert created.json()["format"] == "single_elimination"

    with UnitOfWork() as uow:
        ts.open_registration(uow, organizer, tournament_id)
        uow.commit()
    for index in (1, 2):
        entry = _captain(db, seed, index, "se")
        client.post(f"{BASE}/{tournament_id}/participants",
                    json={"team_id": entry.team.id}, headers=auth(entry.captain.phone))
    drawn = client.post(f"{BASE}/{tournament_id}/draw", headers=auth(organizer.phone))
    match_id = drawn.json()["rounds"][0]["matches"][0]["id"]

    tie = client.put(f"{BASE}/matches/{match_id}/result",
                     json={"score_a": 1, "score_b": 1}, headers=auth(organizer.phone))
    assert tie.status_code == 400, tie.text
    assert "مساوی" in tie.json()["detail"]


def test_league_table_orders_by_points_then_goal_difference_then_goals_for(
        client, seed, organizer, db):
    tournament_id, roster, drawn = _api_league(client, organizer, db, seed, 3, "tb")
    a, b, c = (entry.team.id for entry in roster)

    # A برندهٔ تفاضل برابر با B ولی گل‌زدهٔ بیشتر ⇒ A قبل از B، و رتبهٔ آن‌ها مشترک نیست
    _play(client, organizer, drawn, {
        frozenset({a, c}): (4, 2),   # A ۴ − C ۲
        frozenset({b, c}): (2, 0),   # B ۲ − C ۰
        frozenset({a, b}): (1, 1),   # تساوی
    })

    rows = client.get(f"{BASE}/{tournament_id}/standings",
                      headers=auth(organizer.phone)).json()["items"]
    assert [row["team_id"] for row in rows] == [a, b, c]
    first, second, third = rows
    assert (first["points"], first["goal_difference"], first["goals_for"]) == (4, 2, 5)
    assert (second["points"], second["goal_difference"], second["goals_for"]) == (4, 2, 3)
    assert (third["points"], third["won"], third["lost"]) == (0, 0, 2)
    assert all(row["played"] == 2 for row in rows)
    assert not first["tied"] and not second["tied"]


def test_champion_is_declared_only_when_first_place_is_unique(client, seed, organizer, db):
    tournament_id, roster, drawn = _api_league(client, organizer, db, seed, 4, "ch")
    winner_id, runner_id, third_id, last_id = (entry.team.id for entry in roster)

    # رتبهٔ ۱ یک‌دانه؛ سوم و چهارم روی امتیاز/تفاضل/گل‌زده کاملاً برابر می‌مانند
    _play(client, organizer, drawn, {
        frozenset({winner_id, runner_id}): (2, 0),
        frozenset({winner_id, third_id}): (2, 1),
        frozenset({winner_id, last_id}): (2, 1),
        frozenset({runner_id, third_id}): (1, 0),
        frozenset({runner_id, last_id}): (1, 0),
        frozenset({third_id, last_id}): (1, 1),
    })

    body = client.get(f"{BASE}/{tournament_id}", headers=auth(organizer.phone)).json()
    assert body["status"] == "completed"
    assert body["winner_team_id"] == winner_id
    assert body["winner_team_name"] == "تیم ch1"

    rows = client.get(f"{BASE}/{tournament_id}/standings",
                      headers=auth(organizer.phone)).json()["items"]
    assert [row["rank"] for row in rows] == [1, 2, 3, 3]
    assert rows[2]["team_id"] != rows[3]["team_id"]
    assert rows[2]["tied"] is True and rows[3]["tied"] is True
    assert (rows[2]["points"], rows[2]["goal_difference"], rows[2]["goals_for"]) == \
           (rows[3]["points"], rows[3]["goal_difference"], rows[3]["goals_for"])


def test_league_finishes_only_after_the_last_fixture(client, seed, organizer, db):
    tournament_id, roster, drawn = _api_league(client, organizer, db, seed, 4, "pr")
    matches = [m for rnd in drawn["rounds"] for m in rnd["matches"]]
    assert len(matches) == 4 * 3 // 2

    for match in matches[:-1]:
        result = client.put(f"{BASE}/matches/{match['id']}/result",
                            json={"score_a": 1, "score_b": 0}, headers=auth(organizer.phone))
        assert result.status_code == 200, result.text

    mid = client.get(f"{BASE}/{tournament_id}", headers=auth(organizer.phone)).json()
    assert mid["status"] == "in_progress"
    assert mid["winner_team_id"] is None

    # جدول وسطِ راه هم خوانده می‌شود، اما «قهرمان» نه
    rows = client.get(f"{BASE}/{tournament_id}/standings",
                      headers=auth(organizer.phone)).json()["items"]
    assert len(rows) == 4
    assert sum(row["played"] for row in rows) == 2 * (len(matches) - 1)

    done = client.put(f"{BASE}/matches/{matches[-1]['id']}/result",
                      json={"score_a": 0, "score_b": 2}, headers=auth(organizer.phone))
    assert done.status_code == 200, done.text

    after = client.get(f"{BASE}/{tournament_id}", headers=auth(organizer.phone)).json()
    assert after["status"] == "completed"
    # قهرمان = رتبهٔ ۱ فقط وقتی یک‌دانه است؛ در غیر این صورت None می‌ماند
    top = [row for row in client.get(f"{BASE}/{tournament_id}/standings",
                                     headers=auth(organizer.phone)).json()["items"]
           if row["rank"] == 1]
    assert after["winner_team_id"] == (top[0]["team_id"] if len(top) == 1 else None)
