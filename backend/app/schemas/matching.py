# backend/app/schemas/matching.py
"""اسکیمای حریف‌یابی و چالش بازی (P010 / C4).

امتیاز تطبیق سه سیگنال دارد و هر کدام می‌تواند «در دسترس نباشد» (`value=None`):
تیم تازه‌ثبت‌نام سابقۀ بازی/رزرو ندارد، پس نباید صفر گرفت — وزنش از مخرج حذف
می‌شود. `score` همان میانگین وزنیِ ۰..۱۰۰ است.
"""
from datetime import date, datetime, time
from typing import List, Optional

from pydantic import BaseModel, Field


class VenueBrief(BaseModel):
    id: int
    name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class SignalScore(BaseModel):
    """یک سیگنال تطبیق؛ `value` ۰..۱ و `None` یعنی داده‌ای برای آن وجود ندارد."""
    value: Optional[float] = None
    weight: float
    note: Optional[str] = None


class MatchSuggestion(BaseModel):
    team_id: int
    team_name: str
    logo_url: Optional[str] = None
    sport: str
    is_official: bool
    member_count: int
    score: int = Field(description="۰..۱۰۰ — میانگین وزنی سیگنال‌های در دسترس")
    level: SignalScore
    region: SignalScore
    schedule: SignalScore
    rank: Optional[int] = None
    played: int = 0
    won: int = 0
    win_rate: Optional[float] = Field(default=None, description="٪ برد، None بدون سابقه")
    home_venue: Optional[VenueBrief] = None
    distance_km: Optional[float] = None
    shared_time_slots: int = 0
    has_open_challenge: bool = False
    reasons: List[str] = []


class MatchListResponse(BaseModel):
    team_id: int
    items: List[MatchSuggestion]
    total: int
    basis: dict = Field(description="چه داده‌ای پشت امتیازهاست: results/bookings")


class ChallengeCreate(BaseModel):
    from_team_id: int
    to_team_id: int
    message: Optional[str] = Field(default=None, max_length=300)
    proposed_date: Optional[date] = None
    proposed_time: Optional[time] = None
    proposed_venue_id: Optional[int] = None


class ChallengeRespond(BaseModel):
    note: Optional[str] = Field(default=None, max_length=300)


class ChallengeRow(BaseModel):
    id: int
    from_team_id: int
    from_team_name: str
    to_team_id: int
    to_team_name: str
    created_by: Optional[int] = None
    created_by_name: Optional[str] = None
    accepted_by: Optional[int] = None
    accepted_by_name: Optional[str] = None
    responded_at: Optional[datetime] = None
    message: Optional[str] = None
    response_note: Optional[str] = None
    proposed_date: Optional[date] = None
    proposed_time: Optional[time] = None
    proposed_venue_id: Optional[int] = None
    proposed_venue_name: Optional[str] = None
    status: str
    expires_at: datetime
    created_at: datetime
    direction: str = Field(default="all",
                           description="inbox=به این تیم، outbox=از این تیم")


class ChallengeListResponse(BaseModel):
    team_id: int
    items: List[ChallengeRow]
    total: int
