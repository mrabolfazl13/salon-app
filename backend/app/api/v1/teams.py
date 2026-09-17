# backend/app/api/v1/teams.py
"""API سیستم تیم — مدیریت تیم برای بازیکنان + دید شریک برای مدیران سالن.

نکات:
- شناسه کاربر همیشه از توکن (get_current_user) — هرگز از body.
- ترتیب مسیرها: مسیرهای ثابت (/discover، /invitations/me، /manager/partners)
  پیش از /{team_id} تعریف می‌شوند.
- خطاهای ساختارمند و الگوی dispatch اعلان مطابق games.py.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.unit_of_work import UnitOfWork, get_unit_of_work
from app.models.user import User
from app.schemas.team import (
    TeamActionResponse, TeamAuditListResponse, TeamBalanceResponse,
    TeamBookingListResponse, TeamCreate, TeamDuesGenerate, TeamDuesListResponse,
    TeamDuesPayRequest, TeamDuesVoidRequest, TeamInviteCreate, TeamInvitationResponse,
    TeamJoinRequestCreate, TeamJoinRequestResponse, TeamListResponse, TeamMemberResponse,
    TeamMessageCreate, TeamMessageItem, TeamMessageListResponse, TeamResponse,
    TeamRoleUpdate, TeamTransferCaptain, TeamUnreadCountResponse, TeamUpdate,
)
from app.services.team_service import TeamService
from app.utils.auth import get_current_manager, get_current_user

router = APIRouter(prefix="/teams", tags=["Teams"])


def _bad_request(code: str, message: str) -> HTTPException:
    return HTTPException(status_code=400, detail={"code": code, "message": message})


# ─────────────────────────── ساخت / لیست من ───────────────────────────

@router.post("/", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team(
    data: TeamCreate,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    team, notifications = TeamService.create_team(uow, data, current_user)
    await TeamService.dispatch_notifications(uow, notifications)
    return team


@router.get("/", response_model=List[TeamResponse])
def list_my_teams(
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    """تیم‌های من (نقش و وضعیت عضویت در هر مورد)."""
    return TeamService.list_my_teams(uow, current_user.id)


# ─────────────────────────── مسیرهای ثابت (قبل از /{team_id}) ───────────────────────────

@router.get("/discover", response_model=TeamListResponse)
def discover_teams(
    search: Optional[str] = Query(default=None, max_length=100),
    sport: Optional[str] = Query(default=None, max_length=30),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    """تیم‌های عمومی (public) قابل‌کشف."""
    return TeamService.discover(uow, search, sport, limit, offset)


@router.get("/invitations/me", response_model=List[TeamInvitationResponse])
def my_invitations(
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    """دعوت‌های باز من در همه تیم‌ها."""
    return TeamService.list_my_invitations(uow, current_user.id)


@router.get("/manager/partners", response_model=dict)
def manager_partners(
    venue_id: Optional[int] = Query(default=None),
    current_user: User = Depends(get_current_manager),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    """دید مدیر (brief §6): تیم‌های همکار با رزرو در سالن(های) او.

    فیلتر دامنه: venue_id فقط متعلق به مدیر؛ وگرنه 403 (super_admin فراگیر).
    """
    return TeamService.list_manager_partners(uow, current_user, venue_id)


# ─────────────────────────── جزئیات / ویرایش / غیرفعال‌سازی ───────────────────────────

@router.get("/{team_id}", response_model=TeamResponse)
def get_team(
    team_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    return TeamService.get_team(uow, team_id, current_user)


@router.put("/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: int,
    data: TeamUpdate,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    team, notifications = TeamService.update_team(uow, team_id, current_user, data)
    await TeamService.dispatch_notifications(uow, notifications)
    return team


@router.delete("/{team_id}/deactivate", response_model=dict)
async def deactivate_team(
    team_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    """توقف نرم تیم (فقط کاپیتان) — ابطال دعوت/درخواست‌های باز + اعلان اعضا."""
    result, notifications = TeamService.deactivate_team(uow, team_id, current_user)
    await TeamService.dispatch_notifications(uow, notifications)
    return result


# ─────────────────────────── اعضا / دعوت ───────────────────────────

@router.get("/{team_id}/members", response_model=List[TeamMemberResponse])
def list_members(
    team_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    return TeamService.list_members(uow, team_id, current_user)


@router.post("/{team_id}/invite", response_model=dict, status_code=status.HTTP_201_CREATED)
async def invite_user(
    team_id: int,
    data: TeamInviteCreate,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    inv, notifications = TeamService.invite_user(uow, team_id, current_user, data)
    await TeamService.dispatch_notifications(uow, notifications)
    return inv


@router.post("/{team_id}/invitations/{member_id}/accept", response_model=TeamActionResponse)
async def accept_team_invitation(
    team_id: int,
    member_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    _team, notifications = TeamService.accept_invitation(uow, team_id, member_id, current_user)
    await TeamService.dispatch_notifications(uow, notifications)
    return {"message": "دعوت پذیرفته شد و به تیم پیوستید."}


@router.post("/{team_id}/invitations/{member_id}/decline", response_model=TeamActionResponse)
async def decline_team_invitation(
    team_id: int,
    member_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    result, notifications = TeamService.decline_invitation(uow, team_id, member_id, current_user)
    await TeamService.dispatch_notifications(uow, notifications)
    return result


@router.post("/{team_id}/members/{member_id}/remove", response_model=TeamActionResponse)
async def remove_member(
    team_id: int,
    member_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    result, notifications = TeamService.remove_member(uow, team_id, member_id, current_user)
    await TeamService.dispatch_notifications(uow, notifications)
    return result


@router.post("/{team_id}/members/{member_id}/role", response_model=TeamMemberResponse)
async def set_member_role(
    team_id: int,
    member_id: int,
    data: TeamRoleUpdate,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    if data.role.value == "captain":
        raise _bad_request("INVALID_ROLE", "برای تغییر کاپیتان از /transfer-captain استفاده کنید.")
    result, notifications = TeamService.set_member_role(uow, team_id, member_id,
                                                        data.role, current_user)
    await TeamService.dispatch_notifications(uow, notifications)
    return result


@router.post("/{team_id}/leave", response_model=TeamActionResponse)
async def leave_team(
    team_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    result, notifications = TeamService.leave_team(uow, team_id, current_user)
    await TeamService.dispatch_notifications(uow, notifications)
    return result


@router.post("/{team_id}/transfer-captain", response_model=TeamResponse)
async def transfer_captain(
    team_id: int,
    data: TeamTransferCaptain,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    team, notifications = TeamService.transfer_captain(uow, team_id, data.user_id,
                                                       current_user)
    await TeamService.dispatch_notifications(uow, notifications)
    return team
# ─────────────────────────── درخواست‌های پیوستن ───────────────────────────

@router.post("/{team_id}/join-request", response_model=dict, status_code=status.HTTP_201_CREATED)
async def request_join(
    team_id: int,
    data: TeamJoinRequestCreate,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    result, notifications = TeamService.request_join(uow, team_id, current_user, data)
    await TeamService.dispatch_notifications(uow, notifications)
    return result


@router.get("/{team_id}/join-requests", response_model=List[TeamJoinRequestResponse])
def list_join_requests(
    team_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    return TeamService.list_join_requests(uow, team_id, current_user)


@router.post("/{team_id}/join-requests/{request_id}/approve", response_model=TeamActionResponse)
async def approve_join_request(
    team_id: int,
    request_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    result, notifications = TeamService.decide_join_request(uow, team_id, request_id,
                                                            current_user, approve=True)
    await TeamService.dispatch_notifications(uow, notifications)
    return {"message": "درخواست تأیید شد و کاربر به تیم اضافه گردید."}


@router.post("/{team_id}/join-requests/{request_id}/reject", response_model=TeamActionResponse)
async def reject_join_request(
    team_id: int,
    request_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    result, notifications = TeamService.decide_join_request(uow, team_id, request_id,
                                                            current_user, approve=False)
    await TeamService.dispatch_notifications(uow, notifications)
    return {"message": "درخواست رد شد."}


# ─────────────────────────── سهم / حق‌عضویت ───────────────────────────

@router.get("/{team_id}/dues", response_model=TeamDuesListResponse)
def list_dues(
    team_id: int,
    status_filter: Optional[str] = Query(default=None, alias="status",
                                         pattern="^(pending|paid|voided|overdue)$"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    """اعضای عادی فقط سهم خود؛ کاپیتان/مدیر سهم همه (فیلتر وضعیت اختیاری)."""
    return TeamService.list_dues(uow, team_id, current_user, status_filter, limit, offset)


@router.post("/{team_id}/dues/generate", response_model=dict,
             status_code=status.HTTP_201_CREATED)
async def generate_dues(
    team_id: int,
    data: TeamDuesGenerate,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    result, notifications = TeamService.generate_dues(uow, team_id, current_user, data)
    await TeamService.dispatch_notifications(uow, notifications)
    return result


@router.post("/{team_id}/dues/{due_id}/pay", response_model=dict)
async def pay_due(
    team_id: int,
    due_id: int,
    data: TeamDuesPayRequest,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    """پرداخت خودِ عضو یا وصول نقدی توسط مدیران تیم — ثبت در دفتر کل."""
    due, notifications = TeamService.pay_due(uow, team_id, due_id, current_user,
                                             data.method, data.reference)
    await TeamService.dispatch_notifications(uow, notifications)
    return due


@router.delete("/{team_id}/dues/{due_id}", response_model=dict)
async def void_due(
    team_id: int,
    due_id: int,
    reason: Optional[str] = Query(default=None, max_length=300),
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    result, notifications = TeamService.void_due(uow, team_id, due_id, current_user,
                                                 reason)
    await TeamService.dispatch_notifications(uow, notifications)
    return result


@router.get("/{team_id}/balance", response_model=TeamBalanceResponse)
def team_balance(
    team_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    return TeamService.get_balance(uow, team_id, current_user)


# ─────────────────────────── تاریخچه رزرو / ممیزی ───────────────────────────

@router.get("/{team_id}/bookings", response_model=TeamBookingListResponse)
def list_team_bookings(
    team_id: int,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    return TeamService.list_bookings(uow, team_id, current_user, limit, offset)


@router.post("/{team_id}/bookings/{booking_id}/link", response_model=dict,
             status_code=status.HTTP_201_CREATED)
async def link_booking(
    team_id: int,
    booking_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    result, notifications = TeamService.link_booking(uow, team_id, booking_id, current_user)
    await TeamService.dispatch_notifications(uow, notifications)
    return result


@router.get("/{team_id}/audit", response_model=TeamAuditListResponse)
def list_audit(
    team_id: int,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    """تراکنش‌های ممیزی تیم — فقط مدیران؛ جدیدترین اول."""
    return TeamService.list_audit(uow, team_id, current_user, limit, offset)


# ─────────────────────────── چت تیم ───────────────────────────

@router.get("/{team_id}/messages", response_model=TeamMessageListResponse)
def list_messages(
    team_id: int,
    limit: int = Query(default=50, ge=1, le=200),
    before_id: Optional[int] = Query(default=None),
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    """پیام‌های چت تیم — جدیدترین اول؛ cursor با before_id (id < before_id)."""
    return TeamService.list_messages(uow, team_id, current_user, limit, before_id)


@router.post("/{team_id}/messages", response_model=TeamMessageItem,
             status_code=status.HTTP_201_CREATED)
async def post_message(
    team_id: int,
    data: TeamMessageCreate,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    msg, notifications = TeamService.post_message(uow, team_id, current_user, data)
    await TeamService.dispatch_notifications(uow, notifications)
    return msg


@router.post("/{team_id}/messages/read", response_model=TeamUnreadCountResponse)
def mark_messages_read(
    team_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    return TeamService.mark_messages_read(uow, team_id, current_user)


@router.get("/{team_id}/unread-count", response_model=TeamUnreadCountResponse)
def unread_count(
    team_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    return TeamService.unread_count(uow, team_id, current_user)
