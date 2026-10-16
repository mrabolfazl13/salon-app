# backend/tests/test_tournament_double_elim.py
"""تورنمنت دو-حذفی (C2.6) — برنامهٔ براکتِ بازندگان، قرعه‌کشی و چرخهٔ کامل تا قهرمان.

دو دستهٔ آزمون، همان الگوی test_tournament.py و عمداً جانشین هم نمی‌شوند:
۱) خاصیتی (تابع خالص `losers_bracket_plan` با N پارامتری): تعداد دیدارهای براکت
   بازندگان = (خوراک‌ها − ۱)، هر خوراک دقیقاً یک بار مصرف می‌شود، فقط خوراکِ نهایی
   بی‌مصرف می‌ماند، و جمع کل دیدارهای بازی‌شده = ۲N−۲. این‌ها را یک برنامهٔ نمونه
   اثبات نمی‌کند؛ برای N=2..۱۶ سنجیده می‌شوند.
۲) ساختاری + مسیری (سرویس/API): نیمه‌های winners/losers/grand_final با نام و
   شمارهٔ درست، لینک‌های `loser_next_match_id` روی دیدارهای غیر-bye، یکتا بودن
   فینالِ بزرگ (`next_match_id IS NULL`)، و «هیچ تیمی بعد از دو باخت بازی نمی‌کند»
   — که خودِ معنای دو-حذفی است و معیار پذیرش C2.6 همین است.
"""
from math import log2

import pytest
from app.models.team import Team
from app.unit_of_work import UnitOfWork
from app.services import tournament_service as ts
from helpers import auth

BASE = "/api/v1/tournaments"
DE = ts.TournamentFormat.DOUBLE_ELIMINATION


# ─────────────────────────── کمکی‌ها ───────────────────────────

@pytest.fixture()
def organizer(seed):
    return seed["user"]("09190000300", "برگزارکننده.dohalfi")


def _teams(db, seed, count: int, tag: str):
    """count جفت (کاپیتان، تیم) — کاپیتان یکتا تا UQ تیم رد نشود."""
    out = []
    for index in range(1, count + 1):
        captain = seed["user"](f"09193{index:06d}", f"کاپیتان {tag} {index}")
        team = Team(name=f"تیم {tag} {index}", captain_id=captain.id)
        db.add(team)
        db.commit()
        db.refresh(team)
        db.close()  # آزادکردن write-lock
        out.append((captain, team))
    return out


def _register_all(organizer, roster):
    """ساختِ تورنمنت دو-حذفی ← بازکردن ثبت‌نام ← ورود همهٔ تیم‌ها."""
    with UnitOfWork() as uow:
        tournament = ts.create_tournament(uow, organizer, name="جام دوحذفی",
                                          format=DE)
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


def _wb_losers_per_round(count: int):
    """مصرفِ خالصِ `losers_bracket_plan` از تعداد تیم — بدون لمس DB.

    همان چیزی که `_draw_double_elimination` می‌سازد: در دور اول فقط دیدارهای
    غیر-bye بازنده دارند (B−N تا از B/2 دیدار، bye‌اند) و مراحل بعدی کامل‌اند.
    """
    size = ts.bracket_size(count)
    first = size // 2 - (size - count)
    rounds = [list(range(1, first + 1))]
    matches = size // 4
    while matches >= 1:
        rounds.append(list(range(1, matches + 1)))
        matches //= 2
    return rounds


def _all_feeders(wb_losers):
    """خوراک‌های نیمهٔ بازندگان از شمارشِ بازنده‌های برندگان — همان نوع «w»."""
    return [("w", r, p)
            for r, positions in enumerate(wb_losers, start=1) for p in positions]


# ─────────────────────────── ۱) برنامهٔ بازندگان: خاصیت‌ها ───────────────────────────

@pytest.mark.parametrize("count", [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
def test_losers_plan_match_count_is_feeders_minus_one(count):
    """تعداد دیدارهای براکت بازندگان = (خوراک‌های برندگان − ۱)."""
    wb_losers = _wb_losers_per_round(count)
    feeders = _all_feeders(wb_losers)
    plan, survivor = ts.losers_bracket_plan(wb_losers)

    lb_matches = sum(len(pairs) for pairs in plan)
    assert lb_matches == len(feeders) - 1
    assert survivor is not None


@pytest.mark.parametrize("count", [2, 3, 4, 5, 6, 7, 8, 9, 10, 16])
def test_total_played_matches_is_two_n_minus_two(count):
    """۲N−۲: (N−۱) برندهٔ بازی‌شدهٔ نیمهٔ برندگان + (N−۲) نیمهٔ بازندگان + فینالِ بزرگ.

    نیمهٔ برندگان N−۱ دیدارِ بازی‌شده دارد (bye بازی نیست). N−۲ = دیدارهای بازندگان
    و ۱ فینالِ بزرگ ⇒ جمع ۲N−۲ — همان استانداردِ دو-حذفیِ بدون bracket reset.
    """
    wb_losers = _wb_losers_per_round(count)
    plan, _ = ts.losers_bracket_plan(wb_losers)
    lb_matches = sum(len(pairs) for pairs in plan)

    assert (count - 1) + lb_matches + 1 == 2 * count - 2


@pytest.mark.parametrize("count", [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 16])
def test_every_feeder_consumed_once_survivor_unused(count):
    """هر خوراک دقیقاً یک بار «مصرف» می‌شود؛ فقط survivor بی‌مصرف می‌ماند."""
    wb_losers = _wb_losers_per_round(count)
    plan, survivor = ts.losers_bracket_plan(wb_losers)

    # plan = مرحله‌ها → فهرستِ جفت‌ها ⇒ خوراک‌ها دو سطح پایین‌ترند
    consumed = [f for pairs in plan for pair in pairs for f in pair]
    assert len(consumed) == len(set(consumed))          # هیچ خوراکی دوبار مصرف نشده
    assert survivor not in consumed                     # فقط فینالِ بازنده‌ها بی‌مصرف

    # N=2 تنها حالتی است که بازندۀ برندگان مستقیم به فینالِ بزرگ می‌رود (بی‌واسطۀ
    # نیمهٔ بازندگان)، پس همان survivor است و در plan ظاهر نمی‌شود.
    tail = {survivor}
    wb_consumed = {f for f in consumed if f[0] == "w"} | (tail if survivor[0] == "w" else set())
    assert wb_consumed == set(_all_feeders(wb_losers))   # هر بازندۀ برندگان دقیقاً یک بار

    lb_wins = {f for f in consumed if f[0] == "l"} | (tail if survivor[0] == "l" else set())
    assert lb_wins == {("l", r, p)
                       for r, pairs in enumerate(plan, start=1)
                       for p in range(1, len(pairs) + 1)}


@pytest.mark.parametrize("count", [2, 3, 4, 5, 6, 7, 8, 9, 16])
def test_survivor_is_last_losers_round_position_one(count):
    """خوراکِ فینالِ بزرگ از نیمهٔ بازندگان، آخرین دیدارِ آن نیمه است (N=2 استثنا)."""
    wb_losers = _wb_losers_per_round(count)
    plan, survivor = ts.losers_bracket_plan(wb_losers)
    if count == 2:
        assert survivor == ("w", 1, 1)                    # بدون بازنده: مستقیم از برندگان
        assert plan == []
    else:
        assert survivor == ("l", len(plan), 1)


def test_interleave_pairs_survivor_with_newcomer_first():
    """در هم‌آمیختن، بازماندۀ قبلی با تازه‌واردها یکی‌درمیان می‌شود (نه روبروی هم)."""
    assert ts._interleave(["a", "c"], ["1", "2", "3"]) == ["a", "1", "c", "2", "3"]
    assert ts._interleave([], ["1", "2"]) == ["1", "2"]
    assert ts._interleave(["a"], []) == ["a"]


def test_odd_losers_round_carries_last_to_next():
    """تعداد فرد ⇒ آخرِ لیست استراحت می‌کند و به مرحلۀ بعد می‌رود (هیچ تیمی بیکار نمی‌ماند).

    ۵ بازندۀ برندگان در یک مرحلۀ واحد جفت نمی‌شوند؛ این حالت با N توان‑دو‑نبودن
    رخ می‌دهد و باید خوراک باقی‌مانده گم نشود.
    """
    plan, survivor = ts.losers_bracket_plan([[1, 2, 3, 4, 5]])
    feeders = _all_feeders([[1, 2, 3, 4, 5]])
    lb_matches = sum(len(pairs) for pairs in plan)
    assert lb_matches == len(feeders) - 1
    assert survivor is not None


# ─────────────────────────── ۲) ساختار قرعه‌کشی (سرویس) ───────────────────────────

@pytest.mark.parametrize("count", [4, 5, 6, 7, 8])
def test_draw_structure_has_three_bracket_halves(db, seed, organizer, count):
    """نیمه‌ها: winners (یک درخت کامل)، losers (همان waves)، و دقیقاً یک grand_final."""
    roster = _teams(db, seed, count, f"d{count}")
    tournament_id = _register_all(organizer, roster)
    out = _draw(organizer, tournament_id)

    size = ts.bracket_size(count)
    winners = [r for r in out["rounds"] if r["bracket"] == "winners"]
    losers = [r for r in out["rounds"] if r["bracket"] == "losers"]
    finals = [r for r in out["rounds"] if r["bracket"] == "grand_final"]

    assert len(winners) == int(log2(size))               # درخت کامل برندگان
    assert len(finals) == 1                              # یک فینالِ بزرگ، بدون reset
    assert winners[0]["name"].startswith(ts.BRACKET_WINNERS_LABEL)
    assert finals[0]["name"] == ts.GRAND_FINAL_LABEL
    if count > 2:
        assert losers and all(r["name"].startswith(ts.BRACKET_LOSERS_LABEL)
                              for r in losers)

    # شماره‌ها سراسری صعودی‌اند تا order_by(number) موجود نشکند
    numbers = [r["number"] for r in out["rounds"]]
    assert numbers == sorted(numbers) and len(set(numbers)) == len(numbers)


@pytest.mark.parametrize("count", [4, 5, 6, 8])
def test_loser_links_only_on_played_winners_matches(db, seed, organizer, count):
    """دیدار غیر-byeٔ برندگان یک `loser_next_match_id` دارد؛ bye هیچ لینکی ندارد."""
    roster = _teams(db, seed, count, f"ll{count}")
    tournament_id = _register_all(organizer, roster)
    out = _draw(organizer, tournament_id)

    winners_ids = {r["id"] for r in out["rounds"] if r["bracket"] == "winners"}
    first_round = [r for r in out["rounds"] if r["bracket"] == "winners"][0]["id"]
    for r in out["rounds"]:
        for m in r["matches"]:
            if r["id"] == first_round:
                if m["status"] == "bye":
                    assert m["loser_next_match_id"] is None   # bye بازنده ندارد
                else:
                    assert m["loser_next_match_id"] is not None
            elif r["id"] in winners_ids:
                # مراحل بعدی برندگان حتماً دو تیم دارند ⇒ لینکِ بازنده دارند
                assert m["loser_next_match_id"] is not None


def test_grand_final_is_unique_terminal(db, seed, organizer):
    """تنها فینالِ بزرگ `next_match_id` ندارد؛ بقیهٔ دیدارها پیشروی دارند."""
    roster = _teams(db, seed, 6, "gf6")
    tournament_id = _register_all(organizer, roster)
    out = _draw(organizer, tournament_id)

    matches = [m for r in out["rounds"] for m in r["matches"]]
    terminals = [m for m in matches if m["next_match_id"] is None]
    gf = [r for r in out["rounds"] if r["bracket"] == "grand_final"][0]
    assert [m["id"] for m in terminals] == [m["id"] for m in gf["matches"]]


def test_bracket_total_matches_is_two_n_minus_one_rows(db, seed, organizer):
    """کل ردیف‌های دیدار = (ردیف‌های درخت برندگان) + (N−۲ نیمهٔ بازندگان) + فینالِ بزرگ.

    این با ۲N−۲ دیدارِ *بازی‌شده* فرق دارد: ردیف‌های bye در جدول شمرده می‌شوند
    ولی بازی نیستند؛ پس تعداد ردیف = (B−۱) + (N−۲) + ۱.
    """
    roster = _teams(db, seed, 5, "tm5")
    tournament_id = _register_all(organizer, roster)
    out = _draw(organizer, tournament_id)

    size = ts.bracket_size(5)
    rows = [m for r in out["rounds"] for m in r["matches"]]
    wb_rows = [m for r in out["rounds"] if r["bracket"] == "winners" for m in r["matches"]]
    assert len(wb_rows) == size - 1
    assert len([m for r in out["rounds"] if r["bracket"] == "grand_final"
                for m in r["matches"]]) == 1
    # ۵ تیم ⇒ ۳ ردیفِ نیمهٔ بازندگان؛ جمع ردیف‌ها:
    assert len(rows) == (size - 1) + 3 + 1


# ─────────────────────────── ۳) مسیر API تا قهرمان ───────────────────────────

def _api_create(client, organizer) -> int:
    r = client.post(BASE, json={"name": "جام دوحذفی API",
                               "format": "double_elimination"},
                    headers=auth(organizer.phone))
    assert r.status_code == 200, r.text
    assert r.json()["format"] == "double_elimination"
    return r.json()["id"]


def _api_team(db, seed, index: int, tag: str):
    captain = seed["user"](f"09193{index:06d}", f"کاپیتان {tag}{index}")
    team = Team(name=f"تیم {tag}{index}", captain_id=captain.id)
    db.add(team)
    db.commit()
    db.refresh(team)
    db.close()
    return type("Entry", (), {"captain": captain, "team": team})()


def test_api_rejects_tie_in_double_elimination(client, seed, organizer, db):
    tournament_id = _api_create(client, organizer)
    for index in range(1, 5):
        entry = _api_team(db, seed, index, "eqd")
        client.post(f"{BASE}/{tournament_id}/participants",
                    json={"team_id": entry.team.id}, headers=auth(entry.captain.phone))
    drawn = client.post(f"{BASE}/{tournament_id}/draw", headers=auth(organizer.phone))
    assert drawn.status_code == 200, drawn.text
    ready = [m for r in drawn.json()["rounds"] for m in r["matches"]
             if m["status"] == "ready"]
    assert ready, drawn.json()

    tie = client.put(f"{BASE}/matches/{ready[0]['id']}/result",
                     json={"score_a": 2, "score_b": 2}, headers=auth(organizer.phone))
    assert tie.status_code == 400, tie.text
    assert "مساوی" in tie.json()["detail"]


def test_api_double_elim_to_champion_no_third_loss(client, seed, organizer, db):
    """از ثبت‌نام ۴ تیم تا قهرمان: فقط نتیجه‌ها داده می‌شوند و هیچ تیمی سه باخت ندارد.

    خاصیت محوری دو-حذفی: تیم با دو باخت باید حذف شده باشد و دیگر دیدارِ READY
    نداشته باشد. این را از ریدِ هر دیدار می‌شماریم، نه از پیش‌فرضِ براکت.
    """
    tournament_id = _api_create(client, organizer)
    roster = []
    for index in range(1, 5):
        entry = _api_team(db, seed, index, "c4")
        r = client.post(f"{BASE}/{tournament_id}/participants",
                        json={"team_id": entry.team.id, "seed": index},
                        headers=auth(entry.captain.phone))
        assert r.status_code == 200, r.text
        roster.append(entry)

    drawn = client.post(f"{BASE}/{tournament_id}/draw", headers=auth(organizer.phone))
    assert drawn.status_code == 200, drawn.text

    def bracket():
        r = client.get(f"{BASE}/{tournament_id}/bracket", headers=auth(organizer.phone))
        return r.json()

    seed_of = {p["team_id"]: p["seed"] for p in bracket()["participants"]}
    losses = {}
    played = []
    for _ in range(2 * 4 - 2):                       # سقف ۲N−۲
        current = bracket()
        if current["tournament"]["status"] == "completed":
            break
        ready = [m for r in current["rounds"] for m in r["matches"]
                 if m["status"] == "ready"]
        assert ready, current
        match = ready[0]
        a, b = match["team_a_id"], match["team_b_id"]
        # تیمی که دو باخت دارد هرگز نباید در دیدارِ ready بنشیند
        assert losses.get(a, 0) < 2 and losses.get(b, 0) < 2
        winner = a if seed_of[a] < seed_of[b] else b
        loser = b if winner == a else a
        r = client.put(f"{BASE}/matches/{match['id']}/result",
                       json={"score_a": 2 if winner == a else 0,
                             "score_b": 2 if winner == b else 0},
                       headers=auth(organizer.phone))
        assert r.status_code == 200, r.text
        played.append(match["id"])
        losses[loser] = losses.get(loser, 0) + 1
        assert losses[loser] <= 2

    final = bracket()
    assert final["tournament"]["status"] == "completed"
    assert len(played) == 2 * 4 - 2                       # ۶ دیدار بازی‌شده
    assert len(set(played)) == len(played)                # بدون تکرار
    assert all(v <= 2 for v in losses.values())
    champion = final["tournament"]["winner_team_id"]
    assert champion == roster[0].team.id                  # سید ۱ همه را می‌بَرد

    standings_r = client.get(f"{BASE}/{tournament_id}/standings",
                             headers=auth(organizer.phone))
    assert standings_r.status_code == 200
    rows = standings_r.json()["items"]
    assert [r["rank"] for r in rows] == [1, 2, 3]
    assert rows[0]["team_id"] == champion
    assert rows[0]["label"] == "قهرمان" and rows[1]["label"] == "نایب‌قهرمان"


def test_api_double_elim_six_teams_loser_bracket_propagates(client, seed, organizer, db):
    """۶ تیم ⇒ bye و نیمهٔ بازندگان واقعی؛ پیشرویِ بازنده لینک‌هایش را پر می‌کند.

    بعد از ثبت نتیجهٔ یک دیدار، بازنده باید در خانۀ دیدارِ `loser_next_match_id`
    نشسته باشد — همان چیزی که «افتادن به براکتِ بازندگان» را encode می‌کند.
    """
    tournament_id = _api_create(client, organizer)
    for index in range(1, 7):
        entry = _api_team(db, seed, index, "c6")
        client.post(f"{BASE}/{tournament_id}/participants",
                    json={"team_id": entry.team.id, "seed": index},
                    headers=auth(entry.captain.phone))
    drawn = client.post(f"{BASE}/{tournament_id}/draw", headers=auth(organizer.phone))
    assert drawn.status_code == 200, drawn.text

    out = drawn.json()
    ready = [m for r in out["rounds"] for m in r["matches"] if m["status"] == "ready"]
    match = ready[0]
    assert match["loser_next_match_id"] is not None
    a, b = match["team_a_id"], match["team_b_id"]
    r = client.put(f"{BASE}/matches/{match['id']}/result",
                   json={"score_a": 1, "score_b": 0}, headers=auth(organizer.phone))
    assert r.status_code == 200, r.text

    after = client.get(f"{BASE}/{tournament_id}/bracket",
                       headers=auth(organizer.phone)).json()
    target = [m for rnd in after["rounds"] for m in rnd["matches"]
              if m["id"] == match["loser_next_match_id"]][0]
    assert b in (target["team_a_id"], target["team_b_id"])   # بازنده به نیمهٔ پایین رفت
    winner_target = [m for rnd in after["rounds"] for m in rnd["matches"]
                     if m["id"] == match["next_match_id"]][0]
    assert a in (winner_target["team_a_id"], winner_target["team_b_id"])
