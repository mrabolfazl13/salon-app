# backend/app/api/v1/games.py
"""API سیستم بازی گروهی (Group Booking / Open Game).

نکات امنیتی:
- شناسه کاربر همیشه از توکن احراز هویت گرفته می‌شود (هرگز از body/query).
- مسیرهای عمومی (explore/preview توکن) با get_optional_user — لاگین اختیاری است.
- ترتیب تعریف مسیرها: /my و /join/{token} و /invitations/... قبل از /{game_id}.
"""
from datetime import date, time
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from jose import JWTError, jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select

from app.config import settings
from app.database import get_session
from app.unit_of_work import UnitOfWork, get_unit_of_work
from app.models.user import User
from app.models.game import GameStatus, ParticipantRole
from app.schemas.user import TokenData
from app.schemas.game import (
    GameCreate, GameUpdate, GameResponse, ParticipantResponse, ParticipantUpdate,
    JoinRequestResponse, InvitationCreate, InvitationResponse,
    InviteLinkCreate, InviteLinkResponse, WaitlistResponse,
    TokenPreviewResponse, GamePaymentSummary, GameActionResponse,
)
from app.services.game_service import GameService

router = APIRouter(prefix="/games", tags=["Games"])

_optional_bearer = HTTPBearer(auto_error=False)


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_optional_bearer),
    session: Session = Depends(get_session),
) -> Optional[User]:
    """کاربر جاری را اگر توکن معتبر بود برمی‌گرداند؛ وگرنه None (برای مسیرهای عمومی)."""
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, settings.JWT_SECRET,
                             algorithms=[settings.JWT_ALGORITHM])
        phone: str = payload.get("sub")
        if phone is None:
            return None
        user = session.exec(select(User).where(User.phone == phone)).first()
        if user and user.is_active:
            return user
    except JWTError:
        return None
    return None


from app.utils.auth import get_current_user  # noqa: E402


# ─────────────────────────── ساخت / لیست ───────────────────────────

@router.post("/", response_model=GameResponse, status_code=status.HTTP_201_CREATED)
async def create_game(
    data: GameCreate,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    game, notifications = GameService.create_game(uow, data, current_user.id)
    await GameService.dispatch_notifications(uow, notifications)
    return GameService.to_response(uow, game, current_user)


@router.get("/", response_model=dict)
def explore_games(
    sport: Optional[str] = Query(default=None, max_length=30),
    skill_level: Optional[str] = Query(default=None),
    venue_id: Optional[int] = Query(default=None),
    date_from: Optional[date] = Query(default=None),
    date_to: Optional[date] = Query(default=None),
    time_from: Optional[time] = Query(default=None),
    time_to: Optional[time] = Query(default=None),
    max_price_per_player: Optional[int] = Query(default=None, ge=0),
    availability_only: bool = Query(default=False),
    latitude: Optional[float] = Query(default=None),
    longitude: Optional[float] = Query(default=None),
    sort: str = Query(default="soonest", pattern="^(soonest|nearest|cheapest|most_available|popular)$"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: Optional[User] = Depends(get_optional_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    """بازی‌های عمومی قابل‌کشف با فیلتر و مرتب‌سازی."""
    return GameService.list_explore(
        uow, current_user, sport=sport, skill_level=skill_level, venue_id=venue_id,
        date_from=date_from, date_to=date_to, time_from=time_from, time_to=time_to,
        max_price_per_player=max_price_per_player, availability_only=availability_only,
        lat=latitude, lng=longitude, sort=sort, limit=limit, offset=offset)


@router.get("/my", response_model=List[GameResponse])
def get_my_games(
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    """بازی‌های من (ساخته‌شده + شرکت‌شده)."""
    return GameService.list_my_games(uow, current_user.id)


# ─────────────────────────── دعوت‌نامه‌های من ───────────────────────────

@router.get("/invitations/my", response_model=List[InvitationResponse])
def get_my_invitations(
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    return GameService.list_my_invitations(uow, current_user.id)


@router.post("/invitations/{invitation_id}/accept", response_model=GameActionResponse)
async def accept_invitation(
    invitation_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    result, notifications = GameService.decide_invitation(uow, invitation_id, current_user.id, accept=True)
    await GameService.dispatch_notifications(uow, notifications)
    return {"game": result["game"], "message": "دعوت پذیرفته شد و به بازی پیوستید."}


@router.post("/invitations/{invitation_id}/reject", response_model=dict)
async def reject_invitation(
    invitation_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    result, notifications = GameService.decide_invitation(uow, invitation_id, current_user.id, accept=False)
    await GameService.dispatch_notifications(uow, notifications)
    return result


# ─────────────────────────── لینک دعوت (توکن) ───────────────────────────

@router.get("/join/{token}", response_model=TokenPreviewResponse)
def preview_invite_token(
    token: str,
    current_user: Optional[User] = Depends(get_optional_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    """پیش‌نمایش عمومی بازی از طریق توکن دعوت — بدون افشای ID دایرکت."""
    return GameService.preview_token(uow, token, current_user)


@router.post("/join/{token}", response_model=GameActionResponse)
async def join_by_token(
    token: str,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    result, notifications = GameService.join_by_token(uow, token, current_user.id)
    await GameService.dispatch_notifications(uow, notifications)
    message = ("به بازی پیوستید." if result["joined"]
               else "در لیست انتظار ثبت شدید." if result["waitlisted"]
               else "درخواست شما ثبت شد و در انتظار تأیید است.")
    return {"game": result["game"], "message": message}


# ─────────────────────────── جزئیات / ویرایش / لغو ───────────────────────────

@router.get("/{game_id}", response_model=GameResponse)
def get_game(
    game_id: int,
    current_user: Optional[User] = Depends(get_optional_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    return GameService.get_game(uow, game_id, current_user)


@router.patch("/{game_id}", response_model=GameResponse)
async def update_game(
    game_id: int,
    data: GameUpdate,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    if data.status is not None:
        raise HTTPException(status_code=400,
                            detail={"code": "INVALID_STATUS_TRANSITION",
                                    "message": "برای تغییر وضعیت از /start یا /complete استفاده کنید."})
    game, notifications = GameService.update_game(uow, game_id, current_user.id, data)
    await GameService.dispatch_notifications(uow, notifications)
    return game


@router.delete("/{game_id}", response_model=GameResponse)
async def cancel_game(
    game_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    """لغو بازی (فقط برگزارکننده) — استرداد سهم‌ها + ابطال لینک‌ها + اعلان به همه."""
    game, notifications = GameService.cancel_game(uow, game_id, current_user.id)
    await GameService.dispatch_notifications(uow, notifications)
    return game


@router.post("/{game_id}/start", response_model=GameResponse)
async def start_game(
    game_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    game, notifications = GameService.transition_status(uow, game_id, current_user.id, GameStatus.STARTED)
    await GameService.dispatch_notifications(uow, notifications)
    return game


@router.post("/{game_id}/complete", response_model=GameResponse)
async def complete_game(
    game_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    game, notifications = GameService.transition_status(uow, game_id, current_user.id, GameStatus.COMPLETED)
    await GameService.dispatch_notifications(uow, notifications)
    return game


# ─────────────────────────── Join / Leave ───────────────────────────

@router.post("/{game_id}/join", response_model=GameActionResponse)
async def join_game(
    game_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    result, notifications = GameService.join_game(uow, game_id, current_user.id)
    await GameService.dispatch_notifications(uow, notifications)
    message = ("به بازی پیوستید." if result["joined"]
               else "ظرفیت پر است — در لیست انتظار ثبت شدید." if result["waitlisted"]
               else "درخواست شما ثبت شد و در انتظار تأیید برگزارکننده است.")
    return {"game": result["game"], "message": message}


@router.post("/{game_id}/leave", response_model=GameActionResponse)
async def leave_game(
    game_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    result, notifications = GameService.leave_game(uow, game_id, current_user.id)
    await GameService.dispatch_notifications(uow, notifications)
    return {"game": result["game"], "message": "از بازی خارج شدید."}


# ─────────────────────────── شرکت‌کننده‌ها ───────────────────────────

@router.get("/{game_id}/participants", response_model=List[ParticipantResponse])
def list_participants(
    game_id: int,
    current_user: Optional[User] = Depends(get_optional_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    return GameService.list_participants(uow, game_id, current_user)


@router.patch("/{game_id}/participants/{user_id}", response_model=ParticipantResponse)
def set_participant_role(
    game_id: int,
    user_id: int,
    data: ParticipantUpdate,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    return GameService.set_participant_role(uow, game_id, current_user.id, user_id, data.role)


@router.delete("/{game_id}/participants/{user_id}", response_model=GameActionResponse)
async def remove_participant(
    game_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    result, notifications = GameService.remove_participant(uow, game_id, current_user.id, user_id)
    await GameService.dispatch_notifications(uow, notifications)
    return {"game": result["game"], "message": "بازیکن حذف شد."}


# ─────────────────────────── درخواست‌های پیوستن ───────────────────────────

@router.get("/{game_id}/join-requests", response_model=List[JoinRequestResponse])
def list_join_requests(
    game_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    return GameService.list_join_requests(uow, game_id, current_user.id)


@router.post("/{game_id}/join-requests/{request_id}/approve", response_model=GameActionResponse)
async def approve_join_request(
    game_id: int,
    request_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    result, notifications = GameService.decide_join_request(uow, game_id, request_id, current_user.id, approve=True)
    await GameService.dispatch_notifications(uow, notifications)
    return {"game": result["game"], "message": "درخواست تأیید شد."}


@router.post("/{game_id}/join-requests/{request_id}/reject", response_model=GameActionResponse)
async def reject_join_request(
    game_id: int,
    request_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    result, notifications = GameService.decide_join_request(uow, game_id, request_id, current_user.id, approve=False)
    await GameService.dispatch_notifications(uow, notifications)
    return {"game": result["game"], "message": "درخواست رد شد."}


# ─────────────────────────── دعوت مستقیم ───────────────────────────

@router.post("/{game_id}/invitations", response_model=InvitationResponse, status_code=status.HTTP_201_CREATED)
async def invite_user(
    game_id: int,
    data: InvitationCreate,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    inv, notifications = GameService.invite_user(uow, game_id, current_user.id,
                                                 data.user_id, data.expires_in_days)
    await GameService.dispatch_notifications(uow, notifications)
    return inv


@router.get("/{game_id}/invitations", response_model=List[InvitationResponse])
def list_game_invitations(
    game_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    game = GameService._get_game_or_404(uow, game_id)
    actor = uow.game_participants.get_by_game_and_user(game.id, current_user.id)
    GameService._require_manage_permission(game, actor)
    return [
        {"id": inv.id, "game_id": inv.game_id, "invited_user_id": inv.invited_user_id,
         "invited_user_name": name, "invited_by": inv.invited_by,
         "status": inv.status.value, "expires_at": inv.expires_at,
         "created_at": inv.created_at, "game_name": game.name}
        for inv, name in uow.game_invitations.list_by_game(game.id)
    ]


# ─────────────────────────── لینک‌های دعوت ───────────────────────────

@router.post("/{game_id}/invite-links", response_model=InviteLinkResponse, status_code=status.HTTP_201_CREATED)
def create_invite_link(
    game_id: int,
    data: InviteLinkCreate,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    return GameService.create_invite_link(uow, game_id, current_user.id, data)


@router.get("/{game_id}/invite-links", response_model=List[InviteLinkResponse])
def list_invite_links(
    game_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    return GameService.list_invite_links(uow, game_id, current_user.id)


@router.post("/{game_id}/invite-links/{link_id}/disable", response_model=InviteLinkResponse)
def disable_invite_link(
    game_id: int,
    link_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    return GameService.disable_invite_link(uow, game_id, link_id, current_user.id)


@router.post("/{game_id}/invite-links/{link_id}/regenerate", response_model=InviteLinkResponse)
def regenerate_invite_link(
    game_id: int,
    link_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    return GameService.regenerate_invite_link(uow, game_id, link_id, current_user.id)


# ─────────────────────────── لیست انتظار ───────────────────────────

@router.get("/{game_id}/waitlist", response_model=List[WaitlistResponse])
def list_waitlist(
    game_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    return GameService.list_waitlist(uow, game_id, current_user.id)


@router.post("/{game_id}/waitlist", response_model=WaitlistResponse, status_code=status.HTTP_201_CREATED)
async def join_waitlist(
    game_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    entry, notifications = GameService.join_waitlist(uow, game_id, current_user.id)
    await GameService.dispatch_notifications(uow, notifications)
    return entry


@router.delete("/{game_id}/waitlist", response_model=dict)
def leave_waitlist(
    game_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    return GameService.leave_waitlist(uow, game_id, current_user.id)


# ─────────────────────────── پرداخت سهم ───────────────────────────

@router.get("/{game_id}/payments", response_model=GamePaymentSummary)
def get_payment_summary(
    game_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    return GameService.get_payment_summary(uow, game_id)


@router.post("/{game_id}/payments/{participant_id}/pay", response_model=dict)
async def pay_share(
    game_id: int,
    participant_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    """پرداخت سهم (gateway=mock — هم‌راستا با سیستم پرداخت موجود)."""
    result = GameService.pay_share(uow, game_id, participant_id, current_user.id)
    await GameService.dispatch_notifications(uow, result["notifications"])
    return result
