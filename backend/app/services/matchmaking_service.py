# backend/app/services/matchmaking_service.py
"""حریف‌یابی و چالش بازی (P010 / C4).

چرا این داده‌ها و نه ستون‌های تازه روی `Team`: «سطح»، «منطقه» و «زمان» تیم چیزی است
که از **رفتار واقعی** بیرون می‌آید — نتایج بازی‌های ثبت‌نتیجه (همان `standings_rows`)
و رزروهای تیم (`TeamBooking` → `Slot` → `Venue`). ستون `level/city` را کسی پر
نمی‌کرد و بی‌اعتبار می‌ماند.

امتیاز (۰..۱۰۰) میانگین وزنی سه سیگنال است و سیگنالِ بدون داده از **مخرج** حذف
می‌شود، نه اینکه صفر بگیرد: تیم تازه‌ثبت‌نام باید قابل رتبه‌بندی باشد، نه جریمه.

چالش هیچ رزرو یا بازی‌ای نمی‌سازد — فقط توافق دو کاپیتان را ثبت می‌کند؛ ظرفیت و
پرداخت در جریان رزرو باقی است. مهلت به‌صورت تنبل منقضی می‌شود تا job جدا نخواهد.
"""
from datetime import timedelta
from math import asin, cos, radians, sin, sqrt
from typing import Dict, List, Optional, Tuple

from sqlmodel import col, select

from app.models.booking import Booking, BookingStatus
from app.models.slot import Slot
from app.models.team import (
    Team, TeamAuditAction, TeamBooking, TeamMemberStatus, TeamVisibility,
)
from app.models.team_challenge import ChallengeStatus, TeamChallenge
from app.models.user import User
from app.models.venue import Venue
from app.schemas.matching import ChallengeCreate
from app.services.team_service import TeamService, _err, _utcnow

# وزن‌ها: سطح بیشترین اثر را دارد چون «بازی متعادل» خواستۀ اصلی چالش است.
WEIGHT_LEVEL = 0.45
WEIGHT_REGION = 0.35
WEIGHT_TIME = 0.20

NEAR_KM = 3.0        # تا این فاصله «هم‌منطقه» کامل
FAR_KM = 40.0        # از این فاصله دیگر امتیازی برای منطقه نمی‌ماند
LEVEL_UNKNOWN_BOTH = 1.0   # هر دو بی‌سابقه ⇒ هم‌سطح‌اند (نه «نمی‌دانیم»)
LEVEL_UNKNOWN_ONE = 0.35   # یک طرف بی‌سابقه ⇒ تطریق محتاطانه
CHALLENGE_TTL_DAYS = 7


def _bucket(hour: int) -> str:
    if hour < 12:
        return "صبح"
    if hour < 17:
        return "بعدازظهر"
    return "عصر و شب"


def _km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """فاصلۀ تقریبی دو نقطه (haversine) — کیلومتر."""
    r1, r2 = radians(lat1), radians(lat2)
    d_lat, d_lng = radians(lat2 - lat1), radians(lng2 - lng1)
    a = sin(d_lat / 2) ** 2 + cos(r1) * cos(r2) * sin(d_lng / 2) ** 2
    return 6371.0 * 2 * asin(sqrt(a))


def _has_geo(lat: Optional[float], lng: Optional[float]) -> bool:
    """عرض/طول صفر «موقعیت ثبت‌نشده» است، نه جزیره‌ای در خط استوا."""
    return lat is not None and lng is not None and (abs(lat) + abs(lng)) > 0.0001


def _ratio(value: Optional[float]) -> Optional[float]:
    return None if value is None else round(value, 3)


class TeamSignals:
    """آنچه یک تیم برای تطبیق «معلوم» است — از نتایج و رزروهای خودش."""

    def __init__(self, team_id: int):
        self.team_id = team_id
        self.played = 0
        self.won = 0
        self.win_rate: Optional[float] = None    # ۰..۱
        self.rank: Optional[int] = None
        self.bookings = 0
        self.home_venue_id: Optional[int] = None
        self.home_venue_name: Optional[str] = None
        self.lat: Optional[float] = None
        self.lng: Optional[float] = None
        self.slots: set = set()                   # {(weekday, bucket)}

    @property
    def known_level(self) -> bool:
        return self.win_rate is not None


class MatchmakingService:

    # ─────────────────────────── سیگنال‌ها ───────────────────────────

    @staticmethod
    def _load_signals(uow, team_ids: List[int]) -> Dict[int, TeamSignals]:
        """نتایج + رزروها با دو کوئری گروهی (بدون N+1 روی فهرست پیشنهادها)."""
        signals = {tid: TeamSignals(tid) for tid in team_ids}
        if not team_ids:
            return signals

        # رتبه/برد از همان جدول لیگ — تا «رتبه» در دو جای سیستم یکی باشد؛
        # limit کل تیم‌های فعال است تا هیچ کاندیدایی از جدول بیرون نماند.
        table = TeamService.standings(uow, user_id=0, limit=uow.teams.count(is_active=True))
        for row in table["items"]:
            sig = signals.get(row["team_id"])
            if sig is None:
                continue
            sig.played = row["played"]
            sig.won = row["won"]
            sig.rank = row["rank"]
            if row["played"]:
                sig.win_rate = row["won"] / row["played"]

        rows = uow.session.exec(
            select(TeamBooking.team_id, Slot.venue_id, Venue.name, Venue.latitude,
                   Venue.longitude, Slot.slot_date, Slot.start_time)
            .join(Booking, col(TeamBooking.booking_id) == col(Booking.id))
            .join(Slot, col(Booking.slot_id) == col(Slot.id))
            .join(Venue, col(Slot.venue_id) == col(Venue.id))
            .where(col(TeamBooking.team_id).in_(team_ids),
                   Booking.status != BookingStatus.CANCELLED)
        ).all()

        venue_hits: Dict[int, Dict[int, int]] = {}
        slot_hits: Dict[int, Dict[Tuple[int, str], int]] = {}
        names: Dict[int, str] = {}
        geo: Dict[int, Tuple[Optional[float], Optional[float]]] = {}
        for team_id, venue_id, v_name, lat, lng, slot_date, start_time in rows:
            tid = int(team_id)
            sig = signals.get(tid)
            if sig is None:
                continue
            sig.bookings += 1
            vid = int(venue_id)
            hits = venue_hits.setdefault(tid, {})
            hits[vid] = hits.get(vid, 0) + 1
            names[vid] = v_name
            geo[vid] = (lat, lng)
            key = (slot_date.weekday(), _bucket(start_time.hour))
            s_hits = slot_hits.setdefault(tid, {})
            s_hits[key] = s_hits.get(key, 0) + 1

        for tid, sig in signals.items():
            hits = venue_hits.get(tid) or {}
            if hits:
                # سالن اصلی = پربسامد؛ تساوی ⇒ venue_id کوچک‌تر تا خروجی قطعی بماند
                best = sorted(hits.items(), key=lambda kv: (-kv[1], kv[0]))[0][0]
                sig.home_venue_id = best
                sig.home_venue_name = names.get(best)
                sig.lat, sig.lng = geo.get(best, (None, None))
            sig.slots = set(slot_hits.get(tid) or {})
        return signals

    # ─────────────────────────── امتیاز ───────────────────────────

    @staticmethod
    def _level_signal(mine: TeamSignals, theirs: TeamSignals) -> dict:
        if mine.known_level and theirs.known_level:
            value = max(0.0, 1.0 - abs(mine.win_rate - theirs.win_rate))
            note = (f"برد {round(mine.win_rate * 100)}٪ در {mine.played} بازی در برابر "
                    f"{round(theirs.win_rate * 100)}٪ در {theirs.played} بازی")
        elif not mine.known_level and not theirs.known_level:
            value = LEVEL_UNKNOWN_BOTH
            note = "هر دو تیم هنوز نتیجۀ ثبت‌شده ندارند"
        else:
            value = LEVEL_UNKNOWN_ONE
            note = "یکی از تیم‌ها سابقۀ بازی ندارد"
        return {"value": _ratio(value), "weight": WEIGHT_LEVEL, "note": note}

    @staticmethod
    def _region_signal(mine: TeamSignals, theirs: TeamSignals) -> Tuple[dict, Optional[float]]:
        km = None
        if (mine.home_venue_id and theirs.home_venue_id
                and _has_geo(mine.lat, mine.lng) and _has_geo(theirs.lat, theirs.lng)):
            km = round(_km(mine.lat, mine.lng, theirs.lat, theirs.lng), 1)
        if km is None:
            return ({"value": None, "weight": WEIGHT_REGION,
                     "note": "سالن اصلی یکی از تیم‌ها معلوم نیست"}, None)
        if km <= NEAR_KM:
            value = 1.0
        elif km >= FAR_KM:
            value = 0.0
        else:
            value = (FAR_KM - km) / (FAR_KM - NEAR_KM)
        return ({"value": _ratio(value), "weight": WEIGHT_REGION,
                 "note": f"{km} کیلومتر تا سالن «{theirs.home_venue_name}»"}, km)

    @staticmethod
    def _time_signal(mine: TeamSignals, theirs: TeamSignals) -> Tuple[dict, int]:
        shared = mine.slots & theirs.slots
        union = mine.slots | theirs.slots
        if not union:
            return ({"value": None, "weight": WEIGHT_TIME,
                     "note": "هیچ‌کدام رزرو ثبت‌شده ندارند"}, 0)
        value = len(shared) / len(union)
        note = (f"{len(shared)} بازۀ زمانی مشترک" if shared
                else "بازهٔ زمانی مشترکی پیدا نشد")
        return ({"value": _ratio(value), "weight": WEIGHT_TIME, "note": note}, len(shared))

    @staticmethod
    def _score(level: dict, region: dict, time_sig: dict) -> int:
        parts = [s for s in (level, region, time_sig) if s["value"] is not None]
        if not parts:
            return 0
        total_w = sum(p["weight"] for p in parts)
        return round(100 * sum(p["weight"] * p["value"] for p in parts) / total_w)

    @staticmethod
    def suggest(uow, team_id: int, user_id: int, limit: int = 20,
                sport: Optional[str] = None) -> dict:
        """حریف‌های پیشنهادی تیم، با امتیاز و دلیل هر سیگنال."""
        team = TeamService._get_team_or_404(uow, team_id)
        TeamService._require_active_member(uow, team, user_id)

        sport = sport or team.sport
        pool, _total = uow.teams.list_discover(None, sport, 100, 0)
        candidates = [t for t in pool if int(t.id) != int(team.id)]
        if not candidates:
            return {"team_id": team_id, "items": [], "total": 0,
                    "basis": {"pool": 0, "results_used": 0, "bookings_scanned": 0}}

        ids = [team_id] + [int(t.id) for t in candidates]
        signals = MatchmakingService._load_signals(uow, ids)
        mine = signals[team_id]

        counts = uow.team_members.count_active_by_team([int(t.id) for t in candidates])
        open_against = set()
        for ch in uow.team_challenges.pending_between_any(ids):
            if int(ch.from_team_id) == team_id:
                open_against.add(int(ch.to_team_id))
            elif int(ch.to_team_id) == team_id:
                open_against.add(int(ch.from_team_id))

        items = []
        for t in candidates:
            theirs = signals.get(int(t.id)) or TeamSignals(int(t.id))
            level = MatchmakingService._level_signal(mine, theirs)
            region, km = MatchmakingService._region_signal(mine, theirs)
            time_sig, shared = MatchmakingService._time_signal(mine, theirs)
            score = MatchmakingService._score(level, region, time_sig)
            items.append({
                "team_id": int(t.id), "team_name": t.name, "logo_url": t.logo_url,
                "sport": t.sport, "is_official": bool(t.is_official),
                "member_count": counts.get(int(t.id), 0),
                "score": score, "level": level, "region": region, "schedule": time_sig,
                "rank": theirs.rank, "played": theirs.played, "won": theirs.won,
                "win_rate": None if theirs.win_rate is None
                else round(theirs.win_rate * 100, 1),
                "home_venue": ({"id": theirs.home_venue_id, "name": theirs.home_venue_name,
                                "latitude": theirs.lat, "longitude": theirs.lng}
                               if theirs.home_venue_id else None),
                "distance_km": km, "shared_time_slots": shared,
                "has_open_challenge": int(t.id) in open_against,
                "reasons": [p["note"] for p in (level, region, time_sig) if p["note"]],
            })

        # رتبه‌بندی قطعی: امتیاز، سپس سابقۀ بیشتر، سپس عضو فعال، سپس id
        items.sort(key=lambda r: (-r["score"], -r["played"], -r["member_count"], r["team_id"]))
        return {
            "team_id": team_id, "items": items[:limit], "total": len(items),
            "basis": {
                "pool": len(candidates),
                "results_used": sum(1 for r in items if r["played"]),
                "bookings_scanned": sum(s.bookings for s in signals.values()),
            },
        }

    # ─────────────────────────── چالش ───────────────────────────

    @staticmethod
    def _expire_stale(uow, team_ids: Optional[List[int]] = None) -> int:
        """انقضای تنبل: PENDINGِ گذشته از مهلت ⇒ EXPIRED (job جدا نمی‌خواهد)."""
        n = 0
        for ch in uow.team_challenges.stale_pending(team_ids):
            ch.status = ChallengeStatus.EXPIRED
            ch.updated_at = _utcnow()
            uow.session.add(ch)
            n += 1
        return n

    @staticmethod
    def _manager_notifs(uow, team: Team, *, title: str, message: str,
                        notif_type: str, exclude_user_id: Optional[int],
                        extra: dict) -> List[dict]:
        """یک اعلان به هر مدیر فعال تیم، با داده‌های مخصوص چالش."""
        out = []
        for a in uow.team_members.list_admins(team.id):
            if exclude_user_id is not None and a.user_id == exclude_user_id:
                continue
            data = {"team_id": team.id, "team_name": team.name}
            data.update(extra)
            out.append({"user_id": a.user_id, "title": title, "message": message,
                        "data": data, "notif_type": notif_type})
        return out

    @staticmethod
    def _open_for_side(uow, challenge_id: int, user: User, side: str) -> TeamChallenge:
        """چالش را باز می‌کند و مدیرِ سمتِ خواسته‌شده را می‌سنجد.

        اول انقضای تنبل، بعد وضعیت: چالشِ مهلت‌گذشته باید ۴۱۰ بدهد نه «پاسخ داده
        شده» — ترتیب این دو شرط پیام خطا را تعیین می‌کند.
        """
        ch = uow.team_challenges.get_by_id(challenge_id)
        if ch is None:
            raise _err(404, "CHALLENGE_NOT_FOUND", "چالش موردنظر یافت نشد.")
        MatchmakingService._expire_stale(
            uow, [int(ch.from_team_id), int(ch.to_team_id)])
        team_id = int(ch.to_team_id if side == "to" else ch.from_team_id)
        team = TeamService._get_team_or_404_locked(uow, team_id)
        TeamService._require_manage_permission(uow, team, user.id)
        if ch.status == ChallengeStatus.EXPIRED:
            raise _err(410, "CHALLENGE_EXPIRED", "مهلت پاسخ به این چالش تمام شده است.")
        if ch.status != ChallengeStatus.PENDING:
            raise _err(409, "CHALLENGE_ALREADY_ANSWERED",
                       "این چالش پیش‌تر پاسخ داده شده است.")
        return ch

    @staticmethod
    def create_challenge(uow, data: ChallengeCreate, user: User) -> Tuple[dict, List[dict]]:
        from_team = TeamService._get_team_or_404_locked(uow, data.from_team_id)
        TeamService._require_manage_permission(uow, from_team, user.id)
        TeamService._require_active_team(from_team)

        if data.from_team_id == data.to_team_id:
            raise _err(400, "SELF_CHALLENGE", "به تیم خودتان چالش بازی نفرستید.")
        to_team = TeamService._get_team_or_404(uow, data.to_team_id)
        TeamService._require_active_team(to_team)
        if to_team.visibility == TeamVisibility.PRIVATE:
            raise _err(400, "PRIVATE_TEAM",
                       "چالش فقط برای تیم‌های عمومی قابل ارسال است.")

        if uow.team_challenges.get_pending_between(int(from_team.id), int(to_team.id)):
            raise _err(409, "CHALLENGE_OPEN_EXISTS",
                       "برای این دو تیم یک چالش باز وجود دارد؛ همان را پاسخ دهید.")

        if data.proposed_venue_id is not None and uow.venues.get_by_id(
                data.proposed_venue_id) is None:
            raise _err(404, "VENUE_NOT_FOUND", "سالن پیشنهادی یافت نشد.")

        MatchmakingService._expire_stale(uow, [int(from_team.id), int(to_team.id)])
        ch = uow.team_challenges.create(TeamChallenge(
            from_team_id=int(from_team.id), to_team_id=int(to_team.id),
            created_by=user.id, message=data.message,
            proposed_date=data.proposed_date, proposed_time=data.proposed_time,
            proposed_venue_id=data.proposed_venue_id,
            status=ChallengeStatus.PENDING,
            expires_at=_utcnow() + timedelta(days=CHALLENGE_TTL_DAYS),
        ))
        TeamService._audit(uow, from_team.id, TeamAuditAction.CHALLENGE_SENT, user.id,
                           {"challenge_id": ch.id, "opponent_team_id": to_team.id})
        TeamService._audit(uow, to_team.id, TeamAuditAction.CHALLENGE_SENT, user.id,
                           {"challenge_id": ch.id, "opponent_team_id": from_team.id})

        notifications = MatchmakingService._manager_notifs(
            uow, to_team, exclude_user_id=user.id,
            title="🆚 چالش بازی",
            message=f"{user.full_name} از تیم «{from_team.name}» شما را به یک بازی "
                    f"چالشی دعوت کرد.",
            notif_type="team_challenge_received",
            extra={"challenge_id": ch.id, "from_team_id": from_team.id,
                   "from_team_name": from_team.name},
        )
        return MatchmakingService._rows(uow, [ch], int(from_team.id))[0], notifications

    @staticmethod
    def respond(uow, challenge_id: int, user: User, accept: bool,
                note: Optional[str]) -> Tuple[dict, List[dict]]:
        """پذیرش/رد فقط توسط مدیر تیم مقصد — چالش در همان لحظه بسته می‌شود."""
        ch = MatchmakingService._open_for_side(uow, challenge_id, user, "to")
        from_team = TeamService._get_team_or_404(uow, ch.from_team_id)
        to_team = TeamService._get_team_or_404(uow, ch.to_team_id)

        now = _utcnow()
        ch.status = ChallengeStatus.ACCEPTED if accept else ChallengeStatus.DECLINED
        ch.responded_at = now
        ch.updated_at = now
        ch.response_note = note
        if accept:
            ch.accepted_by = user.id
        uow.session.add(ch)

        action = (TeamAuditAction.CHALLENGE_ACCEPTED if accept
                  else TeamAuditAction.CHALLENGE_DECLINED)
        TeamService._audit(uow, to_team.id, action, user.id,
                           {"challenge_id": ch.id, "opponent_team_id": from_team.id})
        TeamService._audit(uow, from_team.id, action, user.id,
                           {"challenge_id": ch.id, "opponent_team_id": to_team.id})

        verb = "پذیرفت" if accept else "رد کرد"
        notifications = MatchmakingService._manager_notifs(
            uow, from_team, exclude_user_id=user.id,
            title="🆚 پاسخ چالش بازی",
            message=f"{user.full_name} از تیم «{to_team.name}» چالش شما را {verb}.",
            notif_type="team_challenge_accepted" if accept else "team_challenge_declined",
            extra={"challenge_id": ch.id, "to_team_id": to_team.id,
                   "to_team_name": to_team.name, "status": ch.status.value},
        )
        return MatchmakingService._rows(uow, [ch], int(to_team.id))[0], notifications

    @staticmethod
    def cancel(uow, challenge_id: int, user: User) -> Tuple[dict, List[dict]]:
        """پس‌گرفتن تنها از سوی تیم فرستنده و تنها پیش از پاسخ."""
        ch = MatchmakingService._open_for_side(uow, challenge_id, user, "from")
        from_team = TeamService._get_team_or_404(uow, ch.from_team_id)
        to_team = TeamService._get_team_or_404(uow, ch.to_team_id)

        ch.status = ChallengeStatus.CANCELLED
        ch.responded_at = _utcnow()
        ch.updated_at = _utcnow()
        uow.session.add(ch)
        TeamService._audit(uow, from_team.id, TeamAuditAction.CHALLENGE_CANCELLED,
                           user.id, {"challenge_id": ch.id,
                                     "opponent_team_id": to_team.id})
        notifications = MatchmakingService._manager_notifs(
            uow, to_team, exclude_user_id=user.id,
            title="🆚 چالش پس گرفته شد",
            message=f"تیم «{from_team.name}» چالش بازی را پس گرفت.",
            notif_type="team_challenge_cancelled",
            extra={"challenge_id": ch.id, "from_team_id": from_team.id,
                   "from_team_name": from_team.name},
        )
        return MatchmakingService._rows(uow, [ch], int(from_team.id))[0], notifications

    @staticmethod
    def list_challenges(uow, team_id: int, user: User, status: Optional[str] = None,
                        direction: str = "all") -> dict:
        team = TeamService._get_team_or_404(uow, team_id)
        TeamService._require_active_member(uow, team, user_id=user.id)
        MatchmakingService._expire_stale(uow, [team_id])
        st = ChallengeStatus(status) if status else None
        rows = uow.team_challenges.list_for_team(team_id, st, direction)
        items = MatchmakingService._rows(uow, rows, team_id)
        return {"team_id": team_id, "items": items, "total": len(items)}

    @staticmethod
    def get_challenge(uow, challenge_id: int, user: User) -> dict:
        ch = uow.team_challenges.get_by_id(challenge_id)
        if ch is None:
            raise _err(404, "CHALLENGE_NOT_FOUND", "چالش موردنظر یافت نشد.")
        team_ids = [int(ch.from_team_id), int(ch.to_team_id)]
        MatchmakingService._expire_stale(uow, team_ids)
        perspective = None
        for tid in team_ids:
            m = uow.team_members.get_by_team_and_user(tid, user.id)
            if m and m.status == TeamMemberStatus.ACTIVE:
                perspective = tid
                break
        if perspective is None:
            raise _err(403, "NOT_A_MEMBER", "شما عضو هیچ‌یک از دو تیم این چالش نیستید.")
        return MatchmakingService._rows(uow, [ch], perspective)[0]

    # ─────────────────────────── ردیف‌ها ───────────────────────────

    @staticmethod
    def _rows(uow, rows: List[TeamChallenge], perspective_team_id: int) -> List[dict]:
        """نام تیم‌ها/کاربران/سالن با سه کوئری گروهی (نه ردیف‌به‌ردیف)."""
        if not rows:
            return []
        team_ids = list({int(r.from_team_id) for r in rows}
                        | {int(r.to_team_id) for r in rows})
        user_ids = list({int(r.created_by) for r in rows}
                        | {int(r.accepted_by) for r in rows if r.accepted_by})
        venue_ids = list({int(r.proposed_venue_id) for r in rows if r.proposed_venue_id})

        teams = {int(t.id): t for t in uow.session.exec(
            select(Team).where(col(Team.id).in_(team_ids))).all()}
        users = {int(u.id): u for u in uow.session.exec(
            select(User).where(col(User.id).in_(user_ids))).all()} if user_ids else {}
        venues = {int(v.id): v for v in uow.session.exec(
            select(Venue).where(col(Venue.id).in_(venue_ids))).all()} if venue_ids else {}

        out = []
        for r in rows:
            from_team = teams.get(int(r.from_team_id))
            to_team = teams.get(int(r.to_team_id))
            creator = users.get(int(r.created_by))
            acceptor = users.get(int(r.accepted_by)) if r.accepted_by else None
            venue = venues.get(int(r.proposed_venue_id)) if r.proposed_venue_id else None
            out.append({
                "id": int(r.id),
                "from_team_id": int(r.from_team_id),
                "from_team_name": from_team.name if from_team else "—",
                "to_team_id": int(r.to_team_id),
                "to_team_name": to_team.name if to_team else "—",
                "created_by": int(r.created_by),
                "created_by_name": creator.full_name if creator else None,
                "accepted_by": int(r.accepted_by) if r.accepted_by else None,
                "accepted_by_name": acceptor.full_name if acceptor else None,
                "responded_at": r.responded_at,
                "message": r.message,
                "response_note": r.response_note,
                "proposed_date": r.proposed_date,
                "proposed_time": r.proposed_time,
                "proposed_venue_id": int(r.proposed_venue_id) if r.proposed_venue_id else None,
                "proposed_venue_name": venue.name if venue else None,
                "status": r.status.value,
                "expires_at": r.expires_at,
                "created_at": r.created_at,
                "direction": ("inbox" if int(r.to_team_id) == perspective_team_id
                              else "outbox"),
            })
        return out


matchmaking_service = MatchmakingService()
