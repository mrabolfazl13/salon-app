# tests/test_team_standings.py — جدول لیگ تیم‌ها از نتایج بازی‌ها
import json

from app.models.game import Game, GameParticipant, GameStatus, ParticipantRole, ParticipantStatus
from app.models.team import Team, TeamMember, TeamMemberRole, TeamMemberStatus
from tests.helpers import auth


def _mk_team(db, captain, members, name):
    team = Team(name=name, captain_id=captain.id, visibility="public")
    db.add(team)
    db.commit()
    db.refresh(team)
    db.add(TeamMember(team_id=team.id, user_id=captain.id,
                      role=TeamMemberRole.CAPTAIN, status=TeamMemberStatus.ACTIVE))
    for m in members:
        db.add(TeamMember(team_id=team.id, user_id=m.id, status=TeamMemberStatus.ACTIVE))
    db.commit()
    db.close()
    return team


def _mk_game_with_result(db, organizer, booking, participants, winners):
    game = Game(booking_id=booking["booking"].id, organizer_id=organizer.id,
                name="بازی تست", max_players=len(participants),
                status=GameStatus.COMPLETED, result_set=True,
                winner_ids=json.dumps(sorted(winners)))
    db.add(game)
    db.commit()
    db.refresh(game)
    for u in participants:
        db.add(GameParticipant(game_id=game.id, user_id=u.id,
                               role=ParticipantRole.MEMBER, status=ParticipantStatus.ACCEPTED))
    db.commit()
    db.close()
    return game


def test_standings_ranks_teams_by_wins(client, seed, db):
    cap_a = seed["user"]("09302000001")
    p_a2 = seed["user"]("09302000002")
    cap_b = seed["user"]("09302000003")
    _mk_team(db, cap_a, [p_a2], "تیم آلفا")
    _mk_team(db, cap_b, [], "تیم بتا")

    b1 = seed["booking"](cap_a)
    b2 = seed["booking"](cap_b)
    b3 = seed["booking"](cap_a)
    # گیم۱: هر دو تیم بازی کردند، آلفا برد؛ گیم۲: فقط بتا، بتا برد؛ گیم۳: آلفا برد
    _mk_game_with_result(db, cap_a, b1, [cap_a, p_a2, cap_b], [cap_a.id])
    _mk_game_with_result(db, cap_b, b2, [cap_b], [cap_b.id])
    _mk_game_with_result(db, cap_a, b3, [cap_a, p_a2], [cap_a.id])

    r = client.get("/api/v1/teams/standings", headers=auth(cap_a.phone))
    assert r.status_code == 200
    body = r.json()
    items = body["items"]
    by_name = {i["team_name"]: i for i in items}
    assert by_name["تیم آلفا"]["played"] == 2
    assert by_name["تیم آلفا"]["won"] == 2
    assert by_name["تیم آلفا"]["lost"] == 0
    assert by_name["تیم بتا"]["played"] == 2
    assert by_name["تیم بتا"]["won"] == 1
    assert by_name["تیم بتا"]["lost"] == 1
    assert items[0]["team_name"] == "تیم آلفا"
    assert items[0]["rank"] == 1
    assert items[0]["points"] == 6
    assert body["my_rank"] == 1
