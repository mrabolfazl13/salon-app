# backend/app/services/tournament_service.py
"""موتور قرعه‌کشی و پیشروی تورنمنت تک‌حذفی (P005).

چرا این «تصمیم»ها این‌جا هستند (و نه در روتر یا DB):
- اندازهٔ براکت = کوچک‌ترین توان ۲ ≥ تعداد تیم ⇒ bye فقط به سیدهای بالا می‌رسد
  و تعداد bye هرگز از نصف دیدارهای دور اول بیشتر نمی‌شود (زیرا B < 2N).
- جای هر سید با بازگشت استاندارد `[x, B+1-x]` تعیین می‌شود؛ یعنی سید ۱ و ۲ هیچ‌وقت
  در دور اول به هم نمی‌خورند — همین را خاصیت‌تست‌ها می‌سنجند، نه یک براکت نمونه.
- bye در همان قرعه‌کشی «نتیجه» می‌گیرد (status=BYE و برنده منتشر می‌شود)، پس
  براکت از لحظهٔ قرعه‌کشی کامل و خواناست و هیچ دیداری تیمِ منتظرِ نامعلوم ندارد.
- ثبت نتیجه: تساوی مردود است (تک‌حذفی بدون وقت اضافه در این برش پشتیبانی نمی‌شود)،
  برنده فقط از طریق `next_match_id`/`next_slot` جلو می‌رود، و تمام‌شدنِ دیدارِ
  بدونِ `next_match_id` یعنی قهرمان و `status=COMPLETED`.
- خطاها ValueError/PermissionError با متن فارسی‌اند (روتِر → ۴۰۰/۴۰۳)؛ همان الگوی
  coach_service و team_service.
"""
from datetime import datetime, timedelta, timezone
from math import log2
from typing import Dict, List, Optional, Tuple

from app.models.team import TeamMemberStatus
from app.models.tournament import (
    MatchStatus, Tournament, TournamentFormat, TournamentMatch,
    TournamentParticipant, TournamentParticipantStatus, TournamentRound,
    TournamentStatus,
)
from app.models.user import User, UserRole
from app.unit_of_work import UnitOfWork

# سیدِ بدون مقدار در انتهای ترتیب می‌نشیند (ورود زودهنگام هم یعنی رتبهٔ پایین‌تر)
_UNSEEDED = 10_000


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def as_aware(dt: datetime) -> datetime:
    """ستون‌ها UTCDateTimeاند و با مقدار naive روی INSERT می‌سوزند.

    ورودی naive از کلاینت = وقت تهران (همان قرارداد coach_service؛ UI فارسی است).
    """
    if dt.tzinfo is not None:
        return dt
    return dt.replace(tzinfo=timezone(timedelta(hours=3, minutes=30)))


# ─────────────────────────── قرعه‌کشی (محاسبهٔ خالص) ───────────────────────────

def bracket_size(teams: int) -> int:
    """کوچک‌ترین توان ۲ که حداقل `teams` جای دیدار داشته باشد."""
    if teams < 2:
        raise ValueError("برای قرعه‌کشی حداقل ۲ تیم لازم است.")
    size = 1
    while size < teams:
        size *= 2
    return size


def seed_order(size: int) -> List[int]:
    """ترتیب سیدها در خانه‌های براکت (چپ→راست) — الگوی استاندارد single-elimination.

    بازگشت: هر سید `x` در نیمه‌های قبلی، حریفش `size+1-x` است ⇒ سید ۱ با سید ۲
    تنها در دیدار پایایی دیدار می‌کند که هر نیمه را برده باشند.
    """
    if size == 1:
        return [1]
    prev = seed_order(size // 2)
    out: List[int] = []
    for seed in prev:
        out.append(seed)
        out.append(size + 1 - seed)
    return out


def round_name(matches_in_round: int, number: int) -> str:
    if matches_in_round == 1:
        return "نهایی"
    if matches_in_round == 2:
        return "نیمه‌نهایی"
    if matches_in_round == 4:
        return "یک‌چهارم نهایی"
    if matches_in_round == 8:
        return "یک‌هشتم نهایی"
    if matches_in_round == 16:
        return "یک‌شانزدهم نهایی"
    if matches_in_round == 32:
        return "یک‌سی‌ودوم نهایی"
    return f"مرحله {number}"


# ─────────────────────────── گیت‌ها ───────────────────────────

def get_tournament(uow: UnitOfWork, tournament_id: int) -> Tournament:
    tournament = uow.tournaments.get_by_id(tournament_id)
    if not tournament:
        raise ValueError("تورنمنت یافت نشد.")
    return tournament


def _manage(uow: UnitOfWork, actor: User, tournament: Tournament) -> None:
    """فقط برگزارکنندهٔ تورنمنت (یا مدیر سیستم) می‌تواند آن را بسازد/قرعه بکشد/نتیجه ثبت کند."""
    if tournament.organizer_id != actor.id and actor.role != UserRole.SUPER_ADMIN:
        raise PermissionError("فقط برگزارکنندهٔ تورنمنت می‌تواند این کار را انجام دهد.")


def _team(uow: UnitOfWork, team_id: int):
    team = uow.teams.get_by_id(team_id)
    if not team or not team.is_active:
        raise ValueError("تیم انتخابی وجود ندارد یا غیرفعال است.")
    return team


def _captain(uow: UnitOfWork, actor: User, team_id: int) -> None:
    team = _team(uow, team_id)
    if team.captain_id == actor.id or actor.role == UserRole.SUPER_ADMIN:
        return
    member = uow.team_members.get_by_team_and_user(team_id, actor.id)
    if not member or member.status != TeamMemberStatus.ACTIVE:
        raise PermissionError("فقط کاپیتان تیم می‌تواند آن را در تورنمنت ثبت‌نام کند.")


# ─────────────────────────── چرخهٔ حیات ───────────────────────────

def create_tournament(uow: UnitOfWork, organizer: User, *, name: str,
                      starts_at: Optional[datetime] = None,
                      venue_id: Optional[int] = None, sport: str = "futsal",
                      description: Optional[str] = None,
                      entry_fee: int = 0) -> Tournament:
    if venue_id is not None and not uow.venues.get_by_id(venue_id):
        raise ValueError("سالن انتخابی وجود ندارد.")
    tournament = Tournament(
        name=name.strip(), description=description, sport=sport,
        organizer_id=organizer.id, venue_id=venue_id,
        format=TournamentFormat.SINGLE_ELIMINATION,
        status=TournamentStatus.DRAFT, entry_fee=entry_fee,
        starts_at=as_aware(starts_at) if starts_at else None)
    return uow.tournaments.create(tournament)


def open_registration(uow: UnitOfWork, actor: User, tournament_id: int) -> Tournament:
    tournament = get_tournament(uow, tournament_id)
    _manage(uow, actor, tournament)
    if tournament.status != TournamentStatus.DRAFT:
        raise ValueError("ثبت‌نام فقط روی تورنمنت پیش‌نویس باز می‌شود.")
    tournament.status = TournamentStatus.REGISTRATION
    tournament.updated_at = _utcnow()
    uow.session.add(tournament)
    uow.session.flush()
    return tournament


def register_team(uow: UnitOfWork, actor: User, tournament_id: int,
                  team_id: int, seed: Optional[int] = None) -> TournamentParticipant:
    tournament = get_tournament(uow, tournament_id)
    if tournament.status not in (TournamentStatus.DRAFT, TournamentStatus.REGISTRATION):
        raise ValueError("ثبت‌نام این تورنمنت بسته شده است.")
    _team(uow, team_id)
    _captain(uow, actor, team_id)
    if uow.tournament_participants.get_by_team(tournament_id, team_id):
        raise ValueError("این تیم قبلاً در تورنمنت ثبت‌نام کرده است.")
    if seed is not None:
        if uow.tournament_participants.count_registered(tournament_id) + 1 < seed:
            raise ValueError(f"سید {seed} هنوز قابل‌واگذاری نیست؛ ابتدا تیم‌های بالاتر را ثبت کنید.")

    row = TournamentParticipant(tournament_id=tournament_id, team_id=team_id,
                                seed=seed, status=TournamentParticipantStatus.REGISTERED)
    return uow.tournament_participants.create(row)


def withdraw_team(uow: UnitOfWork, actor: User, tournament_id: int,
                  team_id: int) -> TournamentParticipant:
    tournament = get_tournament(uow, tournament_id)
    _manage(uow, actor, tournament)
    if tournament.status not in (TournamentStatus.DRAFT, TournamentStatus.REGISTRATION):
        raise ValueError("پس از قرعه‌کشی نمی‌توان تیم را حذف کرد؛ او را بازندهٔ دیدارش کنید.")
    row = uow.tournament_participants.get_by_team(tournament_id, team_id)
    if not row:
        raise ValueError("این تیم در تورنمنت ثبت‌نام نشده است.")
    row.status = TournamentParticipantStatus.WITHDRAWN
    uow.session.add(row)
    uow.session.flush()
    return row


def draw_bracket(uow: UnitOfWork, actor: User, tournament_id: int) -> Tournament:
    """قرعه‌کشی: ردیف‌های مرحله و دیدارها ساخته و byeها منتشر می‌شوند."""
    tournament = get_tournament(uow, tournament_id)
    _manage(uow, actor, tournament)
    if tournament.status not in (TournamentStatus.DRAFT, TournamentStatus.REGISTRATION):
        raise ValueError("این تورنمنت قبلاً قرعه‌کشی شده است.")

    rows = uow.tournament_participants.of_tournament(tournament_id, only_registered=True)
    teams_by_seed = _teams_by_seed(rows)
    count = len(teams_by_seed)
    size = bracket_size(count)

    rounds = _create_rounds(uow, tournament_id, size)
    matches = _create_matches(uow, tournament_id, rounds, teams_by_seed, size)
    _link_feeders(uow, rounds, matches)
    _resolve_byes(uow, matches)

    tournament.status = TournamentStatus.DRAWN
    tournament.drawn_at = _utcnow()
    tournament.updated_at = _utcnow()
    uow.session.add(tournament)
    uow.session.flush()
    return tournament


def _teams_by_seed(rows: List[TournamentParticipant]) -> Dict[int, int]:
    ordered = sorted(rows, key=lambda r: (r.seed if r.seed is not None else _UNSEEDED, r.id))
    return {i + 1: r.team_id for i, r in enumerate(ordered)}


def _create_rounds(uow: UnitOfWork, tournament_id: int, size: int) -> List[TournamentRound]:
    total_rounds = int(log2(size))
    out = []
    for number in range(1, total_rounds + 1):
        matches_in_round = size // (2 ** number)
        out.append(uow.tournament_rounds.create(TournamentRound(
            tournament_id=tournament_id, number=number,
            name=round_name(matches_in_round, number))))
    return out


def _create_matches(uow: UnitOfWork, tournament_id: int,
                    rounds: List[TournamentRound], teams_by_seed: Dict[int, int],
                    size: int) -> List[TournamentMatch]:
    """دور اول از سیدها پر می‌شود؛ بقیهٔ مراحل خالی (بعداً با `_link_feeders` وصل می‌شوند)."""
    first = rounds[0]
    slots = seed_order(size)
    matches: List[TournamentMatch] = []
    for index in range(0, len(slots), 2):
        position = index // 2 + 1
        a, b = slots[index], slots[index + 1]
        team_a = teams_by_seed.get(a)
        team_b = teams_by_seed.get(b)
        matches.append(uow.tournament_matches.create(TournamentMatch(
            tournament_id=tournament_id, round_id=first.id, position=position,
            team_a_id=team_a, team_b_id=team_b,
            status=MatchStatus.PENDING)))
    for round_index in range(1, len(rounds)):
        rnd = rounds[round_index]
        for position in range(1, size // (2 ** (round_index + 1)) + 1):
            matches.append(uow.tournament_matches.create(TournamentMatch(
                tournament_id=tournament_id, round_id=rnd.id, position=position,
                status=MatchStatus.PENDING)))
    _assign_first_round_status(uow, matches[: size // 2])
    return matches


def _assign_first_round_status(uow: UnitOfWork, first_round: List[TournamentMatch]) -> None:
    for match in first_round:
        if match.team_a_id and match.team_b_id:
            match.status = MatchStatus.READY
        elif match.team_a_id or match.team_b_id:
            match.status = MatchStatus.BYE
        # دیدار با هر دو خانهٔ خالی در براکت تک‌حذفیِ B < 2N پیش نمی‌آید
        uow.session.add(match)
    uow.session.flush()


def _link_feeders(uow: UnitOfWork, rounds: List[TournamentRound],
                  matches: List[TournamentMatch]) -> None:
    """برندهٔ دیدار i و i+1 در مرحلهٔ r به خانه‌های a و b دیدار i//2 در مرحلهٔ r+1 می‌رود."""
    by_round: Dict[int, List[TournamentMatch]] = {}
    for match in matches:
        by_round.setdefault(match.round_id, []).append(match)
    ordered = [sorted(by_round[r.id], key=lambda m: m.position) for r in rounds]

    for round_index in range(len(ordered) - 1):
        current, nxt = ordered[round_index], ordered[round_index + 1]
        for i, feeder in enumerate(current):
            feeder.next_match_id = nxt[i // 2].id
            feeder.next_slot = "ab"[i % 2]
            uow.session.add(feeder)
    uow.session.flush()


def _resolve_byes(uow: UnitOfWork, matches: List[TournamentMatch]) -> None:
    """bye در همان قرعه‌کشی تمام می‌شود: برنده مشخص و به مرحلهٔ بعد منتشر می‌شود."""
    for match in matches:
        if match.status != MatchStatus.BYE:
            continue
        match.winner_team_id = match.team_a_id or match.team_b_id
        match.played_at = _utcnow()
        uow.session.add(match)
    uow.session.flush()
    for match in matches:
        if match.status == MatchStatus.BYE:
            _advance(uow, match, match.winner_team_id)


def _refresh_readiness(uow: UnitOfWork, match: TournamentMatch) -> None:
    """دیداری که هر دو تیمش روشن شد و بازی نشده، READY است."""
    if match.team_a_id and match.team_b_id and match.status == MatchStatus.PENDING:
        match.status = MatchStatus.READY
        uow.session.add(match)
        uow.session.flush()


def _advance(uow: UnitOfWork, match: TournamentMatch, winner_team_id: int) -> bool:
    """برنده را به دیدار بعد می‌فرستد. False ⇒ این دیدار فینال بود (تورنمنت تمام شد)."""
    if not match.next_match_id:
        return False
    target = uow.tournament_matches.get_by_id(match.next_match_id)
    if not target:
        raise ValueError("ساختار براکت آسیب دیده است؛ دیدار بعدی یافت نشد.")
    if getattr(target, f"team_{match.next_slot}_id") is not None:
        raise ValueError("خانهٔ مقصد در براکت قبلاً پُر شده است.")
    if winner_team_id in (target.team_a_id, target.team_b_id):
        raise ValueError("یک تیم نمی‌تواند در دو خانهٔ همان دیدار باشد.")
    setattr(target, f"team_{match.next_slot}_id", winner_team_id)
    uow.session.add(target)
    uow.session.flush()
    _refresh_readiness(uow, target)
    return True


def record_result(uow: UnitOfWork, actor: User, match_id: int,
                  score_a: int, score_b: int) -> TournamentMatch:
    match = uow.tournament_matches.get_by_id(match_id)
    if not match:
        raise ValueError("دیدار یافت نشد.")
    tournament = get_tournament(uow, match.tournament_id)
    _manage(uow, actor, tournament)

    if tournament.status not in (TournamentStatus.DRAWN, TournamentStatus.IN_PROGRESS):
        raise ValueError("نتیجه فقط در تورنمنتِ در جریان قابل ثبت است.")
    if match.status not in (MatchStatus.READY, MatchStatus.LIVE):
        raise ValueError("این دیدار آمادهٔ ثبت نتیجه نیست (یا تمام شده یا bye است).")
    if not match.team_a_id or not match.team_b_id:
        raise ValueError("هر دو تیم این دیدار مشخص نیستند.")
    if score_a == score_b:
        raise ValueError("نتیجهٔ مساوی در تورنمنت تک‌حذفی ثبت نمی‌شود؛ برنده باید مشخص باشد.")

    winner = match.team_a_id if score_a > score_b else match.team_b_id
    match.score_a, match.score_b = score_a, score_b
    match.winner_team_id = winner
    match.status = MatchStatus.FINAL
    match.played_at = _utcnow()
    match.updated_at = _utcnow()
    uow.session.add(match)
    uow.session.flush()

    reached_final = _advance(uow, match, winner)
    if tournament.status == TournamentStatus.DRAWN:
        tournament.status = TournamentStatus.IN_PROGRESS
        tournament.updated_at = _utcnow()
        uow.session.add(tournament)
        uow.session.flush()

    if not reached_final:
        tournament.status = TournamentStatus.COMPLETED
        tournament.winner_team_id = winner
        tournament.completed_at = _utcnow()
        tournament.updated_at = _utcnow()
        uow.session.add(tournament)
        uow.session.flush()
    return match


def cancel(uow: UnitOfWork, actor: User, tournament_id: int) -> Tournament:
    tournament = get_tournament(uow, tournament_id)
    _manage(uow, actor, tournament)
    if tournament.status == TournamentStatus.COMPLETED:
        raise ValueError("تورنمنت تمام‌شده قابل لغو نیست.")
    tournament.status = TournamentStatus.CANCELLED
    tournament.updated_at = _utcnow()
    uow.session.add(tournament)
    uow.session.flush()
    return tournament


# ─────────────────────────── خواندن / payload ───────────────────────────

def _team_names(uow: UnitOfWork, ids: List[Optional[int]]) -> Dict[int, str]:
    out: Dict[int, str] = {}
    for team_id in {i for i in ids if i}:
        team = uow.teams.get_by_id(team_id)
        out[team_id] = team.name if team else f"تیم #{team_id}"
    return out


def _enum_name(value) -> str:
    """UI `member.value` کوچک را می‌خواهد (`final`, `bye`)؛ ستون‌ها NAME نگه می‌دارند."""
    return value.value if hasattr(value, "value") else str(value)


def bracket(uow: UnitOfWork, tournament_id: int) -> dict:
    """ساختار کامل براکت: مرحله‌ها → دیدارها، با ترتیب چپ→راستِ رندر RTL."""
    tournament = get_tournament(uow, tournament_id)
    rounds = uow.tournament_rounds.of_tournament(tournament_id)
    matches = uow.tournament_matches.bracket(tournament_id)
    participants = uow.tournament_participants.of_tournament(tournament_id)

    names = _team_names(uow, [p.team_id for p in participants]
                        + [m.team_a_id for m in matches] + [m.team_b_id for m in matches]
                        + [tournament.winner_team_id])

    by_round: Dict[int, List[dict]] = {}
    for match in matches:
        by_round.setdefault(match.round_id, []).append(match_out(match, names))

    return {
        "tournament": to_out(uow, tournament, names=names),
        "rounds": [{"id": r.id, "number": r.number, "name": r.name,
                    "matches": by_round.get(r.id, [])} for r in rounds],
        "participants": [{"team_id": p.team_id, "team_name": names.get(p.team_id),
                          "seed": p.seed, "status": _enum_name(p.status)}
                         for p in participants],
    }


def match_out(match: TournamentMatch, names: Dict[int, str]) -> dict:
    return {
        "id": match.id,
        "round_id": match.round_id,
        "position": match.position,
        "team_a_id": match.team_a_id,
        "team_a_name": names.get(match.team_a_id) if match.team_a_id else None,
        "team_b_id": match.team_b_id,
        "team_b_name": names.get(match.team_b_id) if match.team_b_id else None,
        "score_a": match.score_a,
        "score_b": match.score_b,
        "status": _enum_name(match.status),
        "winner_team_id": match.winner_team_id,
        "next_match_id": match.next_match_id,
        "next_slot": match.next_slot,
        "played_at": match.played_at,
    }


def to_out(uow: UnitOfWork, tournament: Tournament,
           names: Optional[Dict[int, str]] = None) -> dict:
    if names is None:
        names = _team_names(uow, [tournament.winner_team_id])
    organizer = uow.users.get_by_id(tournament.organizer_id)
    return {
        "id": tournament.id,
        "name": tournament.name,
        "description": tournament.description,
        "sport": tournament.sport,
        "organizer_id": tournament.organizer_id,
        "organizer_name": organizer.full_name if organizer else None,
        "venue_id": tournament.venue_id,
        "status": _enum_name(tournament.status),
        "format": _enum_name(tournament.format),
        "starts_at": tournament.starts_at,
        "entry_fee": tournament.entry_fee,
        "drawn_at": tournament.drawn_at,
        "completed_at": tournament.completed_at,
        "winner_team_id": tournament.winner_team_id,
        "winner_team_name": names.get(tournament.winner_team_id)
        if tournament.winner_team_id else None,
        "team_count": uow.tournament_participants.count_registered(tournament.id),
    }


def match_to_out(uow: UnitOfWork, match: TournamentMatch) -> dict:
    return match_out(match, _team_names(uow, [match.team_a_id, match.team_b_id,
                                              match.winner_team_id]))


def standings(uow: UnitOfWork, tournament_id: int) -> List[dict]:
    """رتبه‌بندی از خودِ براکت: قهرمان، نایب‌قهرمان، بازنده‌های نیمه‌نهایی (مشترکاً سوم).

    بدون دیدار رده‌بندی ساخته می‌شود، چون این برش چنین مسابقه‌ای ندارد؛ رتبهٔ ۳
    عمداً دوتایی است و UI همان را «سوم‌های مشترک» نشان می‌دهد.
    """
    get_tournament(uow, tournament_id)
    final = uow.tournament_matches.final_match(tournament_id)
    if not final:
        return []

    rows: List[Tuple[int, Optional[int], str]] = []
    names: Dict[int, str] = {}
    if final.status == MatchStatus.FINAL and final.winner_team_id:
        runner_up = final.team_b_id if final.winner_team_id == final.team_a_id else final.team_a_id
        rows.append((1, final.winner_team_id, "قهرمان"))
        if runner_up:
            rows.append((2, runner_up, "نایب‌قهرمان"))
        semifinal = [m for m in uow.tournament_matches.bracket(tournament_id)
                    if m.next_match_id == final.id and m.status == MatchStatus.FINAL]
        for feeder in semifinal:
            loser = feeder.team_b_id if feeder.winner_team_id == feeder.team_a_id else feeder.team_a_id
            if loser:
                rows.append((3, loser, "نیمه‌نهایی"))
    for _, team_id, _label in rows:
        if team_id and team_id not in names:
            team = uow.teams.get_by_id(team_id)
            names[team_id] = team.name if team else f"تیم #{team_id}"
    return [{"rank": rank, "team_id": team_id, "team_name": names.get(team_id), "label": label}
            for rank, team_id, label in rows]
