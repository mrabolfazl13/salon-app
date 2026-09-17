# backend/app/schemas/team.py
"""اسکیمای سیستم تیم — ورودی‌ها سخت‌گیرانه، خروجی‌ها enrich‌شده سمت سرور."""
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field, model_validator

from app.models.team import (
    TeamVisibility, TeamMemberRole, TeamMemberStatus,
)


# ─────────────────────────── Team ───────────────────────────

class TeamCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = Field(default=None, max_length=1000)
    sport: str = Field(default="futsal", max_length=30)
    visibility: TeamVisibility = TeamVisibility.PRIVATE
    logo_url: Optional[str] = Field(default=None, max_length=500)


class TeamUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=3, max_length=100)
    description: Optional[str] = Field(default=None, max_length=1000)
    sport: Optional[str] = Field(default=None, max_length=30)
    visibility: Optional[TeamVisibility] = None
    logo_url: Optional[str] = Field(default=None, max_length=500)


class TeamResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    sport: str
    logo_url: Optional[str] = None
    visibility: str
    captain_id: int
    captain_name: Optional[str] = None
    is_active: bool
    member_count: int = 0
    created_at: datetime
    updated_at: datetime
    # وضعیت کاربر جاری (None اگر عضو نیست)
    my_role: Optional[str] = None
    my_status: Optional[str] = None
    has_open_join_request: bool = False
    has_pending_invitation: bool = False

    class Config:
        from_attributes = True


class TeamActionResponse(BaseModel):
    message: str


class TeamListResponse(BaseModel):
    items: List[TeamResponse]
    total: int
    limit: int
    offset: int = 0


# ─────────────────────────── Members / Invitations ───────────────────────────

class TeamInviteCreate(BaseModel):
    """دعوت فقط برای کاربران ثبت‌نام‌شده: user_id یا phone (یکی الزامی)."""
    user_id: Optional[int] = None
    phone: Optional[str] = Field(default=None, max_length=11)
    expires_in_days: Optional[int] = Field(default=None, ge=1, le=90)

    @model_validator(mode="after")
    def _one_of(self):
        if self.user_id is None and not self.phone:
            raise ValueError("user_id یا phone الزامی است")
        return self


class TeamMemberResponse(BaseModel):
    id: int
    team_id: int
    user_id: int
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: str
    status: str
    invited_by: Optional[int] = None
    joined_at: datetime
    left_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TeamRoleUpdate(BaseModel):
    role: TeamMemberRole = Field(description="فقط admin یا member قابل انتصاب است")


class TeamTransferCaptain(BaseModel):
    user_id: int


class TeamInvitationResponse(BaseModel):
    id: int
    team_id: int
    team_name: Optional[str] = None
    member_id: Optional[int] = Field(default=None, description="شناسه TeamMember برای accept/decline")
    invitee_user_id: int
    invitee_name: Optional[str] = None
    invited_by: int
    status: str
    expires_at: Optional[datetime] = None
    created_at: datetime
    answered_at: Optional[datetime] = None


# ─────────────────────────── Join Requests ───────────────────────────

class TeamJoinRequestCreate(BaseModel):
    message: Optional[str] = Field(default=None, max_length=300)


class TeamJoinRequestResponse(BaseModel):
    id: int
    team_id: int
    user_id: int
    full_name: Optional[str] = None
    status: str
    message: Optional[str] = None
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime


# ─────────────────────────── Dues ───────────────────────────

class TeamDuesGenerate(BaseModel):
    """تولید سهم یکسان ریالی برای اعضا (پیش‌فرض: همه اعضای فعال)."""
    amount: int = Field(..., gt=0, description="مبلغ به ریال (سهم سرانه هر عضو)")
    title: str = Field(..., min_length=2, max_length=100)
    due_date: date
    member_user_ids: Optional[List[int]] = Field(
        default=None, description="فقط این کاربران (حداکثر اعضای فعال تیم)")


class TeamDuesPayRequest(BaseModel):
    method: str = Field(default="cash", pattern="^(cash|gateway|card_to_card)$")
    reference: Optional[str] = Field(default=None, max_length=120)


class TeamDuesVoidRequest(BaseModel):
    reason: Optional[str] = Field(default=None, max_length=300)


class TeamDuesResponse(BaseModel):
    id: int
    team_id: int
    user_id: int
    full_name: Optional[str] = None
    title: str
    amount: int
    due_date: date
    is_paid: bool
    is_voided: bool
    overdue: bool = False
    paid_at: Optional[datetime] = None
    paid_by: Optional[int] = None
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    transaction_id: Optional[int] = None
    void_reason: Optional[str] = None
    created_at: datetime


class TeamDuesListResponse(BaseModel):
    items: List[TeamDuesResponse]
    total: int
    limit: int
    offset: int


class TeamBalanceResponse(BaseModel):
    team_id: int
    dues_total: int
    dues_paid: int
    dues_unpaid: int
    dues_overdue_amount: int
    team_ledger_income: int
    team_ledger_expense: int
    team_account_balance: int
    net_balance: int
    as_of: date


# ─────────────────────────── Bookings ───────────────────────────

class TeamBookingItem(BaseModel):
    id: int
    team_id: int
    booking_id: int
    paid_by_user_id: Optional[int] = None
    created_at: datetime
    # rich (سمت سرویس)
    booking_user_id: Optional[int] = None
    booking_user_name: Optional[str] = None
    venue_id: Optional[int] = None
    venue_name: Optional[str] = None
    slot_date: Optional[date] = None
    start_time: Optional[str] = None
    status: Optional[str] = None
    payment_amount: Optional[int] = None


class TeamBookingListResponse(BaseModel):
    items: List[TeamBookingItem]
    total: int
    limit: int
    offset: int


# ─────────────────────────── Audit ───────────────────────────

class TeamAuditItem(BaseModel):
    id: int
    team_id: int
    actor_id: Optional[int] = None
    actor_name: Optional[str] = None
    action: str
    data: dict = Field(default_factory=dict)
    created_at: datetime


class TeamAuditListResponse(BaseModel):
    items: List[TeamAuditItem]
    total: int
    limit: int
    offset: int


# ─────────────────────────── Manager partners (visibility شریک سالن) ───────────────────────────

class TeamPartnerItem(BaseModel):
    team_id: int
    name: str
    sport: str
    captain_id: int
    captain_name: Optional[str] = None
    captain_phone: Optional[str] = None
    members_count: int = 0
    total_bookings_at_my_venues: int = 0
    upcoming_bookings_at_my_venues: int = 0
    spent_at_my_venues: int = Field(default=0, description="مجموع payment_amount رزروهای منتسب (ریال)")
    last_booking_date: Optional[date] = None