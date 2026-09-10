# backend/app/schemas/game.py
"""اسکیمای سیستم بازی گروهی (Group Booking / Open Game)."""
from pydantic import BaseModel, Field
from datetime import datetime, date, time
from typing import Optional, List
from enum import Enum


class GameVisibility(str, Enum):
    PRIVATE = "private"
    PUBLIC = "public"
    PUBLIC_APPROVAL = "public_approval"


class GameStatus(str, Enum):
    DRAFT = "draft"
    OPEN = "open"
    FULL = "full"
    STARTED = "started"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class SkillLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    PRO = "pro"


class PaymentMode(str, Enum):
    ORGANIZER_PAYS = "organizer_pays"
    SPLIT_PAYMENT = "split_payment"
    FREE = "free"


class ParticipantRole(str, Enum):
    ORGANIZER = "organizer"
    ADMIN = "admin"
    MEMBER = "member"


class ParticipantStatus(str, Enum):
    INVITED = "invited"
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    LEFT = "left"
    REMOVED = "removed"


# ─────────────────────────── Game ───────────────────────────

class GameCreate(BaseModel):
    """ساخت بازی روی یک رزرو تأییدشده. capacity و visibility سمت سرور اعتبارسنجی می‌شود."""
    booking_id: int
    name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = Field(default=None, max_length=1000)
    sport: str = Field(default="football", max_length=30)
    max_players: int = Field(..., gt=0, le=100)
    skill_level: SkillLevel = SkillLevel.INTERMEDIATE
    visibility: GameVisibility = GameVisibility.PUBLIC
    payment_mode: PaymentMode = PaymentMode.SPLIT_PAYMENT


class GameUpdate(BaseModel):
    """ویرایش بازی (فقط ارگانایزر/ادمین). تغییر max_players با شرکت‌کننده‌های فعلی اعتبارسنجی می‌شود."""
    name: Optional[str] = Field(default=None, min_length=3, max_length=100)
    description: Optional[str] = Field(default=None, max_length=1000)
    max_players: Optional[int] = Field(default=None, gt=0, le=100)
    skill_level: Optional[SkillLevel] = None
    visibility: Optional[GameVisibility] = None
    status: Optional[GameStatus] = None  # فقط start/complete مجاز است (در سرویس)


class GameResponse(BaseModel):
    id: int
    booking_id: int
    organizer_id: int
    name: str
    description: Optional[str] = None
    sport: str
    visibility: GameVisibility
    join_policy: str
    max_players: int
    skill_level: SkillLevel
    payment_mode: PaymentMode
    status: GameStatus
    created_at: datetime
    updated_at: datetime

    # اطلاعات تکمیلی (سمت سرور enrich می‌شود)
    organizer_name: Optional[str] = None
    current_players: int = 0
    venue_id: Optional[int] = None
    venue_name: Optional[str] = None
    venue_address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    slot_date: Optional[date] = None
    start_time: Optional[time] = None
    duration: Optional[int] = None
    total_price: Optional[int] = None          # هزینه زمین از روی Booking
    price_per_player: Optional[int] = None     # در حالت split
    distance_km: Optional[float] = None        # در صورت ارسال lat/lng در کوئری

    # وضعیت کاربر جاری (در صورت احراز هویت)
    my_participant_status: Optional[str] = None
    my_role: Optional[str] = None
    my_waitlist_position: Optional[int] = None
    has_pending_join_request: bool = False
    has_pending_invitation: bool = False

    class Config:
        from_attributes = True


# ─────────────────────────── Participants ───────────────────────────

class ParticipantResponse(BaseModel):
    id: int
    game_id: int
    user_id: int
    full_name: Optional[str] = None
    role: ParticipantRole
    status: ParticipantStatus
    joined_at: datetime
    left_at: Optional[datetime] = None
    payment_status: Optional[str] = None  # سهم پرداختی این بازیکن

    class Config:
        from_attributes = True


class ParticipantUpdate(BaseModel):
    """تغییر نقش شرکت‌کننده (فقط ارگانایزر). promote/demote ادمین."""
    role: ParticipantRole


# ─────────────────────────── Join Requests ───────────────────────────

class JoinRequestCreate(BaseModel):
    message: Optional[str] = Field(default=None, max_length=300)


class JoinRequestResponse(BaseModel):
    id: int
    game_id: int
    user_id: int
    full_name: Optional[str] = None
    status: str
    message: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class JoinRequestDecision(BaseModel):
    """بدنه اختیاری تأیید/رد درخواست."""
    pass


# ─────────────────────────── Invitations ───────────────────────────

class InvitationCreate(BaseModel):
    user_id: int
    expires_in_days: Optional[int] = Field(default=None, ge=1, le=30)


class InvitationResponse(BaseModel):
    id: int
    game_id: int
    invited_user_id: int
    invited_user_name: Optional[str] = None
    invited_by: int
    status: str
    expires_at: Optional[datetime] = None
    created_at: datetime
    game_name: Optional[str] = None

    class Config:
        from_attributes = True


# ─────────────────────────── Invite Links ───────────────────────────

class InviteLinkCreate(BaseModel):
    expires_in_days: Optional[int] = Field(default=None, ge=1, le=365)
    max_uses: Optional[int] = Field(default=None, ge=1, le=1000)


class InviteLinkResponse(BaseModel):
    id: int
    game_id: int
    token: str
    # مسیر نسبی — فرانت‌ند (Tauri-safe) base URL خودش را prepend می‌کند
    join_path: str
    expires_at: Optional[datetime] = None
    max_uses: Optional[int] = None
    uses_count: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenPreviewResponse(BaseModel):
    """پیش‌نمایش عمومی بازی از طریق توکن دعوت (بدون نیاز به لاگین برای مشاهده)."""
    valid: bool
    game: Optional[GameResponse] = None
    reason: Optional[str] = None  # INVITE_EXPIRED / INVITE_INVALID / GAME_CANCELLED ...


# ─────────────────────────── Waitlist ───────────────────────────

class WaitlistResponse(BaseModel):
    id: int
    game_id: int
    user_id: int
    position: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────────── Payments ───────────────────────────

class GamePaymentResponse(BaseModel):
    id: int
    game_id: int
    participant_id: int
    user_id: int
    amount: int
    status: str
    gateway: str
    payment_reference: Optional[str] = None
    created_at: datetime
    paid_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class GamePaymentSummary(BaseModel):
    """خلاصه سهم‌ها برای صفحه بازی."""
    payment_mode: PaymentMode
    total_price: int
    price_per_player: Optional[int] = None
    paid_count: int = 0
    pending_count: int = 0
    payments: List[GamePaymentResponse] = []


# ─────────────────────────── Misc ───────────────────────────

class GameActionResponse(BaseModel):
    """خروجی عملیات join/leave/promote که کامل‌ترین حالت بازی را برمی‌گرداند."""
    game: GameResponse
    message: str


class MyInvitationsResponse(BaseModel):
    invitations: List[InvitationResponse] = []
