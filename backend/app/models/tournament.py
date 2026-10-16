# backend/app/models/tournament.py
"""تورنمنت و براکت (P005) — تک‌حذفی با bye، و لیگِ همه-بازی (round-robin).

انتخاب‌های طراحی (عمداً مستند شده، چون بقیهٔ فیچرها همین قیده را دارند):
- شرکت‌کننده **تیم** است نه کاربر (`team_id` → `teams.id`): محصول تیم‌محور است و
  کاپیتان/اعضا/سطح از همان موجودیت Team خوانده می‌شود؛ یک کاربر می‌تواند عضو چند
  تیم باشد، پس «ورود کاربر» معنای مسابقه‌ای ندارد.
- round و match **ردیف واقعی در DB** هستند نه محاسبهٔ لحظه‌ای: نتیجه باید ثبت و
  ممیزی شود و براکت باید از دادهٔ ذخیره‌شده رندر گردد (نه بازسازی با فرمول).
- پیشروی برنده با `next_match_id` + `next_slot` encode شده: انتشار نتیجه O(1) و
  کاملاً تست‌پذیر است، بدون نیاز به بازچینی کل براکت.
- ستون‌های وضعیت enum‌های SQLAlchemy با **NAME** عضو هستند (اندازه‌گیری شد: روی
  SQLite DDL آن‌ها `VARCHAR(n)` + CHECK و روی PostgreSQL نوع native است، و در هر دو
  مقدار persist‌شده نامِ عضو است: 'FINAL' نه 'final'). server_default در مهاجرت هم
  بزرگ‌نویس است، وگرنه پیش‌فرض DB با چیزی که ORM می‌خواند نمی‌خواند.
- فرمت‌ها: `SINGLE_ELIMINATION` و `ROUND_ROBIN`. برخلاف ادعای قبلی این فایل، افزودن
  عضو تازه **مهاجرت لازم دارد** (اندازه‌گیری شد): روی PostgreSQL نوع `tournamentformat`
  native است و باید `ALTER TYPE … ADD VALUE` بخورد؛ روی SQLite ستون `VARCHAR(18)` **بدون
  CHECK** است (DDLِ ساختۀ مهاجرت دیده شد) پس آنجا no-op است. کرقتد بودن نام برچسب هم
  از همان‌جا می‌آید: ۱۸ کاراکترِ `SINGLE_ELIMINATION` طول ستون SQLite را قفل کرده است.
  `DOUBLE_ELIMINATION` در این برش پیاده نشده (به ستون «کدام براکت» و منطق reset نیاز دارد).
- تاریخ‌ها همیشه tz-aware (SQLModel `UTCDateTime` با naive مقدار می‌سوزد).
"""
from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:  # فقط برای type-check؛ در runtime اجرا نمی‌شود
    from app.models.team import Team


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class TournamentStatus(str, Enum):
    DRAFT = "draft"                    # ساخته شده، هنوز ثبت‌نام باز نشده
    REGISTRATION = "registration"      # تیم‌ها می‌توانند وارد شوند
    DRAWN = "drawn"                    # قرعه‌کشی انجام و براکت ساخته شد
    IN_PROGRESS = "in_progress"        # اولین بازی تمام شده
    COMPLETED = "completed"            # قهرمان مشخص شد
    CANCELLED = "cancelled"


class TournamentFormat(str, Enum):
    SINGLE_ELIMINATION = "single_elimination"
    ROUND_ROBIN = "round_robin"


class TournamentParticipantStatus(str, Enum):
    """نام کامل عمداً: `ParticipantStatus` در `models/game.py` عضو دیگری دارد و
    import ستاره‌ای از `app.models` آن را می‌پوشاند."""
    REGISTERED = "registered"
    WITHDRAWN = "withdrawn"


class MatchStatus(str, Enum):
    PENDING = "pending"   # هنوز هر دو طرف مشخص نیست
    READY = "ready"       # دو تیم معلوم، بازی انجام نشده
    LIVE = "live"         # در جریان (نتیجهٔ موقت ثبت شده)
    FINAL = "final"       # نتیجه قطعی و برنده منتشر شد
    BYE = "bye"           # این دیدار رقیبی ندارد؛ تیم حاضر خودکار بالا می‌رود


class Tournament(SQLModel, table=True):
    __tablename__ = "tournaments"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=120, index=True)
    description: Optional[str] = Field(default=None, max_length=1000)
    sport: str = Field(default="futsal", max_length=30, index=True)

    organizer_id: int = Field(foreign_key="users.id", index=True)
    venue_id: Optional[int] = Field(default=None, foreign_key="venues.id", index=True)

    status: TournamentStatus = Field(default=TournamentStatus.DRAFT, index=True)
    format: TournamentFormat = Field(default=TournamentFormat.SINGLE_ELIMINATION)

    starts_at: Optional[datetime] = Field(default=None, index=True)
    entry_fee: int = Field(default=0, ge=0, description="ورودی هر تیم (ریال)")

    drawn_at: Optional[datetime] = Field(default=None)
    completed_at: Optional[datetime] = Field(default=None)
    winner_team_id: Optional[int] = Field(default=None, foreign_key="teams.id", index=True)

    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)

    participants: List["TournamentParticipant"] = Relationship(
        back_populates="tournament",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    rounds: List["TournamentRound"] = Relationship(
        back_populates="tournament",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    matches: List["TournamentMatch"] = Relationship(
        back_populates="tournament",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class TournamentParticipant(SQLModel, table=True):
    __tablename__ = "tournament_participants"
    __table_args__ = (
        UniqueConstraint("tournament_id", "team_id",
                         name="uq_tournament_participant_tournament_team"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    tournament_id: int = Field(foreign_key="tournaments.id", index=True)
    team_id: int = Field(foreign_key="teams.id", index=True)

    seed: Optional[int] = Field(default=None, ge=1,
                                description="سید قرعه‌کشی (۱ = بهترین)؛ None = بدون سید")
    status: TournamentParticipantStatus = Field(
        default=TournamentParticipantStatus.REGISTERED, index=True)
    registered_at: datetime = Field(default_factory=_utcnow)

    tournament: Optional[Tournament] = Relationship(back_populates="participants")
    team: Optional["Team"] = Relationship()


class TournamentRound(SQLModel, table=True):
    __tablename__ = "tournament_rounds"

    id: Optional[int] = Field(default=None, primary_key=True)
    tournament_id: int = Field(foreign_key="tournaments.id", index=True)
    number: int = Field(ge=1, description="شمارهٔ مرحله از پایین (۱ = دور اول)")
    name: str = Field(max_length=60, description="برچسب فارسی: یک‌چهارم نهایی، نهایی و…")

    tournament: Optional[Tournament] = Relationship(back_populates="rounds")


class TournamentMatch(SQLModel, table=True):
    __tablename__ = "tournament_matches"
    __table_args__ = (
        # جای دیدار در براکت یکتاست؛ هم‌پوشانی مرحله/position یعنی براکت خراب شده
        UniqueConstraint("round_id", "position",
                         name="uq_tournament_match_round_position"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    tournament_id: int = Field(foreign_key="tournaments.id", index=True)
    round_id: int = Field(foreign_key="tournament_rounds.id", index=True)
    position: int = Field(ge=1, description="ترتیب دیدار در همان مرحله (براکت چپ→راست)")

    team_a_id: Optional[int] = Field(default=None, foreign_key="teams.id", index=True)
    team_b_id: Optional[int] = Field(default=None, foreign_key="teams.id", index=True)
    score_a: Optional[int] = Field(default=None, ge=0)
    score_b: Optional[int] = Field(default=None, ge=0)

    status: MatchStatus = Field(default=MatchStatus.PENDING, index=True)
    winner_team_id: Optional[int] = Field(default=None, foreign_key="teams.id", index=True)

    # پیشروی برنده — تک‌منبع تنظیم «برنده به کجا می‌رود»
    next_match_id: Optional[int] = Field(default=None, foreign_key="tournament_matches.id")
    next_slot: Optional[str] = Field(default=None, max_length=1, description="'a' یا 'b'")

    played_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)

    tournament: Optional[Tournament] = Relationship(back_populates="matches")
    round: Optional[TournamentRound] = Relationship()
    # `team_a`/`team_b` عمداً Relationship نیستند: سه FK به teams (دو طرف + برنده)
    # join را مبهم می‌کند و خواندن نام تیم از `uow.teams.get_by_id` انجام می‌شود.
