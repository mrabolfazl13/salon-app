# backend/app/api/v1/tournament.py
"""API تورنمنت و براکت (P005).

دروازه‌ها (در tests/test_tournament.py قفل می‌شوند):
- ساخت/قرعه/نتیجه/لغو ← فقط برگزارکننده یا SUPER_ADMIN (سرویس PermissionError → ۴۰۳).
- ثبت‌نام تیم ← فقط کاپیتانِ فعالِ همان تیم.
- خواندن ← هر کاربر احرازهویت‌شده (براکت عمومی است؛ برای اشتراک‌گذاری لینک).
- متن خطاها فارسی است چون مستقیم در UI نشان داده می‌شود.
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.models.tournament import TournamentFormat, TournamentStatus
from app.models.user import User
from app.services import tournament_service
from app.unit_of_work import UnitOfWork, get_unit_of_work
from app.utils.auth import get_current_user

router = APIRouter(prefix="/tournaments", tags=["Tournament"])


class TournamentCreateIn(BaseModel):
    name: str = Field(min_length=3, max_length=120)
    description: Optional[str] = Field(default=None, max_length=1000)
    sport: str = Field(default="futsal", max_length=30)
    venue_id: Optional[int] = None
    starts_at: Optional[datetime] = None
    entry_fee: int = Field(default=0, ge=0)
    # فرمت پس از قرعه‌کشی عوض نمی‌شود؛ همان‌جا برنامه/پیشروی ساخته شده است
    format: TournamentFormat = Field(default=TournamentFormat.SINGLE_ELIMINATION)


class RegisterIn(BaseModel):
    team_id: int
    seed: Optional[int] = Field(default=None, ge=1)


class ResultIn(BaseModel):
    score_a: int = Field(ge=0, le=99)
    score_b: int = Field(ge=0, le=99)


def _fail(exc: Exception) -> None:
    """خطای سرویس → کد وضعیت: PermissionError=۴۰۳، ValueError=۴۰۰ (الگوی coach.py)."""
    if isinstance(exc, PermissionError):
        raise HTTPException(status_code=403, detail=str(exc))
    raise HTTPException(status_code=400, detail=str(exc))


@router.post("")
def create_tournament(
    data: TournamentCreateIn,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    try:
        tournament = tournament_service.create_tournament(
            uow, current_user, name=data.name, starts_at=data.starts_at,
            venue_id=data.venue_id, sport=data.sport,
            description=data.description, entry_fee=data.entry_fee,
            format=data.format)
    except (ValueError, PermissionError) as exc:
        _fail(exc)
    uow.commit()
    return tournament_service.to_out(uow, tournament)


@router.get("")
def list_tournaments(
    status: Optional[TournamentStatus] = None,
    mine: bool = False,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    organizer_id = current_user.id if mine else None
    rows = uow.tournaments.search(status=status, organizer_id=organizer_id,
                                  limit=limit, offset=offset)
    total = uow.tournaments.count_search(status=status, organizer_id=organizer_id)
    return {"total": total, "items": [tournament_service.to_out(uow, t) for t in rows]}


@router.get("/{tournament_id}")
def get_tournament(
    tournament_id: int,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    try:
        tournament = tournament_service.get_tournament(uow, tournament_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return tournament_service.to_out(uow, tournament)


@router.get("/{tournament_id}/bracket")
def get_bracket(
    tournament_id: int,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    try:
        return tournament_service.bracket(uow, tournament_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/{tournament_id}/standings")
def get_standings(
    tournament_id: int,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    try:
        return {"items": tournament_service.standings(uow, tournament_id)}
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.put("/{tournament_id}/open")
def open_registration(
    tournament_id: int,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    try:
        tournament = tournament_service.open_registration(uow, current_user, tournament_id)
    except (ValueError, PermissionError) as exc:
        _fail(exc)
    uow.commit()
    return tournament_service.to_out(uow, tournament)


@router.post("/{tournament_id}/participants")
def register_team(
    tournament_id: int,
    data: RegisterIn,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    try:
        row = tournament_service.register_team(uow, current_user, tournament_id,
                                               data.team_id, seed=data.seed)
    except (ValueError, PermissionError) as exc:
        _fail(exc)
    uow.commit()
    team = uow.teams.get_by_id(row.team_id)
    return {"participant_id": row.id, "team_id": row.team_id,
            "team_name": team.name if team else None, "seed": row.seed}


@router.delete("/{tournament_id}/participants/{team_id}")
def withdraw_team(
    tournament_id: int,
    team_id: int,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    try:
        row = tournament_service.withdraw_team(uow, current_user, tournament_id, team_id)
    except (ValueError, PermissionError) as exc:
        _fail(exc)
    uow.commit()
    return {"participant_id": row.id, "status": "withdrawn"}


@router.post("/{tournament_id}/draw")
def draw_bracket(
    tournament_id: int,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    try:
        tournament = tournament_service.draw_bracket(uow, current_user, tournament_id)
    except (ValueError, PermissionError) as exc:
        _fail(exc)
    uow.commit()
    return tournament_service.bracket(uow, tournament.id)


@router.put("/matches/{match_id}/result")
def record_result(
    match_id: int,
    data: ResultIn,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    try:
        match = tournament_service.record_result(uow, current_user, match_id,
                                                 data.score_a, data.score_b)
    except (ValueError, PermissionError) as exc:
        _fail(exc)
    uow.commit()
    return tournament_service.match_to_out(uow, match)


@router.post("/{tournament_id}/cancel")
def cancel_tournament(
    tournament_id: int,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    try:
        tournament = tournament_service.cancel(uow, current_user, tournament_id)
    except (ValueError, PermissionError) as exc:
        _fail(exc)
    uow.commit()
    return tournament_service.to_out(uow, tournament)
