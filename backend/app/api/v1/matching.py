# backend/app/api/v1/matching.py
"""API حریف‌یابی و چالش بازی (P010 / C4).

- دسترسی از «عضویت تیم» می‌آید نه از نقش کاربر: عضو فعال برای دیدن پیشنهادها و
  فهرست چالش‌ها، کاپیتان/مدیر برای فرستادن و پاسخ دادن (قاعده در `matchmaking_service`).
- `from_team_id` در body است چون کاربر ممکن است مدیر چند تیم باشد؛ اما هویت فرستنده
  همیشه از توکن (`current_user`) خوانده می‌شود — هرگز از body.
- چالش رزرو یا بازی نمی‌سازد؛ فقط توافق دو طرف ثبت می‌شود و اعلان می‌فرستد.
"""
from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.models.user import User
from app.schemas.matching import (
    ChallengeCreate, ChallengeListResponse, ChallengeRespond, ChallengeRow,
    MatchListResponse,
)
from app.services.matchmaking_service import MatchmakingService
from app.services.team_service import TeamService
from app.unit_of_work import UnitOfWork, get_unit_of_work
from app.utils.auth import get_current_user

router = APIRouter(prefix="/matching", tags=["Matchmaking"])

_DIRECTIONS = "^(inbox|outbox|all)$"
_STATUSES = "^(pending|accepted|declined|cancelled|expired)$"


@router.get("/teams/{team_id}", response_model=MatchListResponse)
def suggest_opponents(
    team_id: int,
    limit: int = Query(default=20, ge=1, le=50),
    sport: Optional[str] = Query(default=None, max_length=30),
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    """حریف‌های پیشنهادی تیم بر پایهٔ سطح، منطقه و زمانِ رفتار واقعی تیم‌ها."""
    return MatchmakingService.suggest(uow, team_id, current_user.id, limit, sport)


@router.get("/challenges", response_model=ChallengeListResponse)
def list_challenges(
    team_id: int = Query(...),
    status_filter: Optional[str] = Query(default=None, alias="status", pattern=_STATUSES),
    direction: str = Query(default="all", pattern=_DIRECTIONS),
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    """صندوق چالش‌های تیم (ورودی/خروجی/هر دو) — چالش بی‌پاسخِ مهلت‌گذشته اینجا منقضی می‌شود."""
    return MatchmakingService.list_challenges(uow, team_id, current_user,
                                              status_filter, direction)


@router.post("/challenges", response_model=ChallengeRow,
             status_code=status.HTTP_201_CREATED)
async def create_challenge(
    data: ChallengeCreate,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    row, notifications = MatchmakingService.create_challenge(uow, data, current_user)
    await TeamService.dispatch_notifications(uow, notifications)
    return row


@router.get("/challenges/{challenge_id}", response_model=ChallengeRow)
def get_challenge(
    challenge_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    return MatchmakingService.get_challenge(uow, challenge_id, current_user)


@router.post("/challenges/{challenge_id}/accept", response_model=ChallengeRow)
async def accept_challenge(
    challenge_id: int,
    data: ChallengeRespond = ChallengeRespond(),
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    """پذیرش توسط مدیر تیم مقصد — پس از آن چالش بسته است و مهلت معنا ندارد."""
    row, notifications = MatchmakingService.respond(uow, challenge_id, current_user,
                                                    accept=True, note=data.note)
    await TeamService.dispatch_notifications(uow, notifications)
    return row


@router.post("/challenges/{challenge_id}/decline", response_model=ChallengeRow)
async def decline_challenge(
    challenge_id: int,
    data: ChallengeRespond = ChallengeRespond(),
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    row, notifications = MatchmakingService.respond(uow, challenge_id, current_user,
                                                    accept=False, note=data.note)
    await TeamService.dispatch_notifications(uow, notifications)
    return row


@router.post("/challenges/{challenge_id}/cancel", response_model=ChallengeRow)
async def cancel_challenge(
    challenge_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    """پس‌گرفتن تنها از سوی تیم فرستنده و تنها تا پیش از پاسخ."""
    row, notifications = MatchmakingService.cancel(uow, challenge_id, current_user)
    await TeamService.dispatch_notifications(uow, notifications)
    return row
