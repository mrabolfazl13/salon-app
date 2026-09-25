# backend/app/services/team_service.py
"""سرویس کسب‌وکار تیم (موجودیت ماندگار) — الگو از game_service.

اصول:
- شناسه کاربر هرگز از کلاینت پذیرفته نمی‌شود؛ همه‌چیز از current_user.
- عملیات ظرفیت‌دار (دعوت/پذیرش/تأیید درخواست) تیم را SELECT FOR UPDATE قفل می‌کند.
- خطاهای ساختارمند: detail = {"code": "...", "message": "..."} — همان قرارداد بازی.
- اعلان‌ها: متدها لیست نوتیف برمی‌گردانند؛ روتر async dispatch می‌کند
  (broadcast_team → همه اعضای فعال تیم).
- مالی: پرداخت سهم = ردیف دفتر کل income با counterparty_type=TEAM و
  counterparty_ref=team_id (counterparty شخص null تا موجودی اشخاص آلوده نشود)؛
  idempotency key = «team-dues:{id}» — تسهیم مجدد هیچ ردیف دوم نمی‌سازد.
- TeamBooking فقط انتساب رزرو موجود به تیم است؛ هیچ رزروی ساخته/تغییر نمی‌شود.
  اتصال قراردادها به تیم در موج بعد (این موج خارج از scope — ذکر در گزارش).
"""
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional, Tuple

from fastapi import HTTPException
from sqlmodel import col, select

from app.config import settings
from app.unit_of_work import UnitOfWork
from app.models.booking import Booking, BookingStatus
from app.models.slot import Slot
from app.models.team import (
    Team, TeamMember, TeamInvitation, TeamJoinRequest, TeamBooking, TeamDues,
    TeamMessage, TeamVisibility, TeamMemberRole, TeamMemberStatus,
    TeamInvitationStatus, TeamJoinRequestStatus, TeamAuditAction, TeamDuesMethod,
)
from app.models.transaction import (
    CounterpartyType, FinancialTransaction, TransactionDirection,
    TransactionMethod, TransactionSourceType, TransactionStatus, TransactionType,
)
from app.models.user import User
from app.schemas.team import (
    TeamCreate, TeamUpdate, TeamInviteCreate, TeamDuesGenerate,
    TeamJoinRequestCreate, TeamMessageCreate,
)
from app.services.finance_service import FinanceService


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _err(status: int, code: str, message: str) -> HTTPException:
    return HTTPException(status_code=status, detail={"code": code, "message": message})


_METHOD_MAP = {
    "cash": TransactionMethod.CASH,
    "gateway": TransactionMethod.GATEWAY,
    "card_to_card": TransactionMethod.CARD_TO_CARD,
}


class TeamService:

    # ─────────────────────────── کمکی‌های دسترسی ───────────────────────────

    @staticmethod
    def _get_team_or_404(uow: UnitOfWork, team_id: int) -> Team:
        team = uow.teams.get_by_id(team_id)
        if not team:
            raise _err(404, "TEAM_NOT_FOUND", "تیم مورد نظر یافت نشد.")
        return team

    @staticmethod
    def _get_team_or_404_locked(uow: UnitOfWork, team_id: int) -> Team:
        team = uow.teams.get_by_id_with_lock(team_id)
        if not team:
            raise _err(404, "TEAM_NOT_FOUND", "تیم مورد نظر یافت نشد.")
        return team

    @staticmethod
    def _member(uow: UnitOfWork, team_id: int, user_id: int) -> Optional[TeamMember]:
        return uow.team_members.get_by_team_and_user(team_id, user_id)

    @staticmethod
    def _require_active_member(uow: UnitOfWork, team: Team, user_id: int) -> TeamMember:
        m = TeamService._member(uow, team.id, user_id)
        if not m or m.status != TeamMemberStatus.ACTIVE:
            raise _err(403, "NOT_A_MEMBER", "شما عضو فعال این تیم نیستید.")
        return m

    @staticmethod
    def _require_manage_permission(uow: UnitOfWork, team: Team,
                                   user_id: int) -> TeamMember:
        """فقط کاپیتان یا مدیرِ فعال — الگوی _require_manage_permission بازی."""
        m = TeamService._member(uow, team.id, user_id)
        if not m or m.status != TeamMemberStatus.ACTIVE:
            raise _err(403, "NOT_A_MEMBER", "شما عضو فعال این تیم نیستید.")
        if m.role not in (TeamMemberRole.CAPTAIN, TeamMemberRole.ADMIN):
            raise _err(403, "NOT_AUTHORIZED", "فقط کاپیتان یا مدیر تیم این اجازه را دارد.")
        return m

    @staticmethod
    def _require_active_team(team: Team):
        if not team.is_active:
            raise _err(409, "TEAM_INACTIVE", "تیم غیرفعال است و این عملیات مجاز نیست.")

    @staticmethod
    def _ensure_capacity(uow: UnitOfWork, team_id: int):
        used = uow.team_members.count_by_status(
            team_id, [TeamMemberStatus.ACTIVE, TeamMemberStatus.PENDING])
        if used >= settings.TEAM_MAX_MEMBERS:
            raise _err(409, "TEAM_FULL",
                       f"ظرفیت تیم ({settings.TEAM_MAX_MEMBERS} نفر) تکمیل است.")

    @staticmethod
    def _is_manager_role(member: Optional[TeamMember]) -> bool:
        return bool(member and member.status == TeamMemberStatus.ACTIVE
                    and member.role in (TeamMemberRole.CAPTAIN, TeamMemberRole.ADMIN))

    @staticmethod
    def _can_view_team(uow: UnitOfWork, team: Team, user: Optional[User]) -> bool:
        if team.visibility != TeamVisibility.PRIVATE:
            return True
        if not user:
            return False
        if team.captain_id == user.id:
            return True
        m = TeamService._member(uow, team.id, user.id)
        if m and m.status in (TeamMemberStatus.ACTIVE, TeamMemberStatus.PENDING):
            return True
        inv = uow.team_invitations.get_by_team_user(team.id, user.id)
        return bool(inv and inv.status == TeamInvitationStatus.PENDING)

    @staticmethod
    def _audit(uow: UnitOfWork, team_id: int, action: TeamAuditAction,
               actor_id: Optional[int], data: Optional[dict] = None):
        uow.team_audits.log(team_id, action, actor_id, data)

    @staticmethod
    def _user_name(uow: UnitOfWork, user_id: int) -> Optional[str]:
        u = uow.users.get_by_id(user_id)
        return u.full_name if u else None

    @staticmethod
    def _admin_notifs(uow: UnitOfWork, team: Team, title: str, message: str,
                      notif_type: str,
                      exclude_user_id: Optional[int] = None) -> List[dict]:
        """اعلان يکتا به هر مدیر فعال (کاپیتان + ادمین‌ها)."""
        out = []
        for a in uow.team_members.list_admins(team.id):
            if exclude_user_id is not None and a.user_id == exclude_user_id:
                continue
            out.append({
                "user_id": a.user_id, "title": title, "message": message,
                "data": {"team_id": team.id, "team_name": team.name},
                "notif_type": notif_type,
            })
        return out

    @staticmethod
    def refresh_official_status(uow: UnitOfWork, team: Team,
                                actor_id: Optional[int] = None) -> List[dict]:
        """رسمی‌شدن تیم پس از تغییر تعداد اعضای فعال — یک‌بار برای همیشه (idempotent)."""
        if team.is_official:
            return []
        active_count = uow.team_members.count_by_status(
            team.id, [TeamMemberStatus.ACTIVE])
        if active_count < team.min_members:
            return []
        team.is_official = True
        team.official_since = _utcnow()
        team.updated_at = _utcnow()
        uow.session.add(team)
        uow.session.flush()
        TeamService._audit(
            uow, team.id, TeamAuditAction.TEAM_BECAME_OFFICIAL,
            actor_id if actor_id is not None else team.captain_id,
            {"member_count": active_count, "quota": team.min_members})
        return [{
            "user_id": uid,
            "title": "🎉 تیم شما رسمی شد",
            "message": f"تیم «{team.name}» رسمی شد — به حدنصاب {team.min_members} عضو رسیدید.",
            "data": {"team_id": team.id, "team_name": team.name,
                     "quota": team.min_members},
            "notif_type": "team_official",
        } for uid in uow.team_members.active_user_ids(team.id)]

    # ─────────────────────────── ساخت / خواندن ───────────────────────────

    @staticmethod
    def create_team(uow: UnitOfWork, data: TeamCreate,
                    user: User) -> Tuple[dict, List[dict]]:
        if uow.teams.get_one_by_name_for_captain(user.id, data.name.strip()):
            raise _err(409, "TEAM_NAME_TAKEN", "شما تیمی با همین نام دارید.")
        team = Team(
            name=data.name.strip(), description=data.description,
            logo_url=data.logo_url, sport=(data.sport or "futsal").strip(),
            captain_id=user.id, visibility=data.visibility,
        )
        uow.teams.create(team)
        uow.team_members.create(TeamMember(
            team_id=team.id, user_id=user.id,
            role=TeamMemberRole.CAPTAIN, status=TeamMemberStatus.ACTIVE,
        ))
        TeamService._audit(uow, team.id, TeamAuditAction.CREATED, user.id,
                           {"name": team.name, "visibility": team.visibility.value})
        notifications = [{
            "user_id": user.id,
            "title": "🛡️ تیم شما ساخته شد",
            "message": f"تیم «{team.name}» ایجاد شد و شما کاپیتان آن هستید. حالا می‌توانید اعضا را دعوت کنید.",
            "data": {"team_id": team.id, "team_name": team.name},
            "notif_type": "team_created",
        }]
        notifications += TeamService.refresh_official_status(uow, team, user.id)
        return TeamService.to_response(uow, team, user), notifications

    @staticmethod
    def to_response(uow: UnitOfWork, team: Team, viewer: Optional[User],
                    member_count: Optional[int] = None) -> dict:
        count = (member_count if member_count is not None
                 else uow.team_members.count_by_status(
                     team.id, [TeamMemberStatus.ACTIVE]))
        resp = {
            "id": team.id, "name": team.name, "description": team.description,
            "sport": team.sport, "logo_url": team.logo_url,
            "visibility": (team.visibility.value if hasattr(team.visibility, "value")
                           else str(team.visibility)),
            "captain_id": team.captain_id,
            "captain_name": TeamService._user_name(uow, team.captain_id),
            "is_active": team.is_active, "member_count": count,
            "quota": team.min_members, "is_official": team.is_official,
            "official_since": team.official_since,
            "created_at": team.created_at, "updated_at": team.updated_at,
            "my_role": None, "my_status": None,
            "has_open_join_request": False, "has_pending_invitation": False,
        }
        if viewer:
            m = TeamService._member(uow, team.id, viewer.id)
            if m:
                resp["my_role"] = m.role.value
                resp["my_status"] = m.status.value
                if m.status == TeamMemberStatus.PENDING:
                    resp["has_pending_invitation"] = True
            if not resp["has_pending_invitation"]:
                inv = uow.team_invitations.get_by_team_user(team.id, viewer.id)
                if inv and inv.status == TeamInvitationStatus.PENDING:
                    resp["has_pending_invitation"] = True
            req = uow.team_join_requests.get_pending_by_user(team.id, viewer.id)
            resp["has_open_join_request"] = bool(req)
        return resp

    @staticmethod
    def get_team(uow: UnitOfWork, team_id: int, user: Optional[User]) -> dict:
        team = TeamService._get_team_or_404(uow, team_id)
        if not TeamService._can_view_team(uow, team, user):
            raise _err(403, "PRIVATE_TEAM", "این تیم خصوصی است و فقط اعضا آن را می‌بینند.")
        return TeamService.to_response(uow, team, user)

    @staticmethod
    def list_my_teams(uow: UnitOfWork, user_id: int) -> List[dict]:
        rows = uow.teams.list_by_member(user_id)
        counts = uow.team_members.count_active_by_team([t.id for t, _ in rows])
        out = []
        for team, member in rows:
            resp = TeamService.to_response(uow, team, None, counts.get(team.id, 0))
            resp["my_role"] = member.role.value
            resp["my_status"] = member.status.value
            out.append(resp)
        return out

    @staticmethod
    def discover(uow: UnitOfWork, search: Optional[str], sport: Optional[str],
                 limit: int, offset: int) -> dict:
        rows, total = uow.teams.list_discover(search, sport, limit, offset)
        counts = uow.team_members.count_active_by_team([t.id for t in rows])
        names = {}
        captain_ids = list({t.captain_id for t in rows})
        if captain_ids:
            names = {u.id: u.full_name for u in uow.session.exec(
                select(User).where(col(User.id).in_(captain_ids))).all()}
        items = []
        for t in rows:
            resp = TeamService.to_response(uow, t, None, counts.get(t.id, 0))
            resp["captain_name"] = names.get(t.captain_id)
            items.append(resp)
        return {"items": items, "total": total, "limit": limit, "offset": offset}

    @staticmethod
    def standings(uow: UnitOfWork, user_id: int, limit: int = 50) -> dict:
        """جدول لیگ تیم‌ها بر پایه نتایج بازی‌های ثبت‌شده (برد/بازی انجام‌شده)."""
        rows = uow.teams.standings_rows()
        captain_names = {}
        captain_ids = list({r[0] for r in rows})
        if captain_ids:
            team_ids = [tid for tid, *_ in rows]
            captains = {int(t.id): t.captain_id for t in uow.session.exec(
                select(Team).where(col(Team.id).in_(team_ids))).all()}
            user_ids = list({c for c in captains.values()})
            if user_ids:
                names = {u.id: u.full_name for u in uow.session.exec(
                    select(User).where(col(User.id).in_(user_ids))).all()}
                captain_names = {tid: names.get(captains.get(tid)) for tid in team_ids}

        scored = []
        for tid, name, logo, official, member_count, mids, played, won in rows:
            lost = max(played - won, 0)
            win_rate = round(won / played * 100, 1) if played else 0.0
            scored.append({
                "team_id": tid, "team_name": name, "logo_url": logo,
                "is_official": official, "member_count": member_count,
                "played": played, "won": won, "lost": lost,
                "win_rate": win_rate, "points": won * 3,
                "captain_name": captain_names.get(tid),
                "_mine": user_id in mids,
            })
        scored.sort(key=lambda r: (-r["won"], -r["played"], -r["member_count"], r["team_name"]))
        my_rank = None
        for idx, r in enumerate(scored):
            r["rank"] = idx + 1
            if r.pop("_mine") and my_rank is None:
                my_rank = idx + 1
        top = scored[:limit]
        return {"items": top, "total": len(scored), "my_rank": my_rank, "my_team_ranked": my_rank is not None}
    # ─────────────────────────── ویرایش / غیرفعال‌سازی ───────────────────────────

    @staticmethod
    def update_team(uow: UnitOfWork, team_id: int, user: User,
                    data: TeamUpdate) -> Tuple[dict, List[dict]]:
        team = TeamService._get_team_or_404_locked(uow, team_id)
        TeamService._require_manage_permission(uow, team, user.id)
        changes = data.model_dump(exclude_unset=True)
        touched = False
        if changes.get("name"):
            new_name = changes["name"].strip()
            if new_name != team.name and uow.teams.get_one_by_name_for_captain(
                    team.captain_id, new_name):
                raise _err(409, "TEAM_NAME_TAKEN", "شما تیمی با همین نام دارید.")
            team.name = new_name
            touched = True
        for field in ("description", "logo_url", "sport"):
            if field in changes and changes[field] is not None:
                setattr(team, field, changes[field])
                touched = True
        if changes.get("visibility"):
            team.visibility = changes["visibility"] \
                if isinstance(changes["visibility"], TeamVisibility) \
                else TeamVisibility(changes["visibility"])
            touched = True
        if not touched:
            raise _err(400, "NO_CHANGES", "هیچ تغییری ارسال نشده است.")
        team.updated_at = _utcnow()
        uow.session.add(team)
        uow.session.flush()
        TeamService._audit(uow, team.id, TeamAuditAction.UPDATED, user.id,
                           {k: (v.value if hasattr(v, "value") else v)
                            for k, v in changes.items()})
        notifications = TeamService._admin_notifs(
            uow, team, "✏️ اطلاعات تیم بروزرسانی شد",
            f"اطلاعات تیم «{team.name}» توسط {user.full_name} به‌روزرسانی شد.",
            "team_updated", exclude_user_id=user.id)
        return TeamService.to_response(uow, team, user), notifications

    @staticmethod
    def deactivate_team(uow: UnitOfWork, team_id: int,
                        user: User) -> Tuple[dict, List[dict]]:
        """توقف نرم — فقط کاپیتان. ابطال دعوت/درخواست‌های باز + اعلان اعضا.

        سهم‌های باز حذف نمی‌شوند (دفتر مالی اصیل می‌ماند)؛ تعدادشان در پاسخ
        به‌عنوان اخطار برمی‌گردد.
        """
        team = TeamService._get_team_or_404_locked(uow, team_id)
        if team.captain_id != user.id:
            raise _err(403, "ONLY_CAPTAIN", "فقط کاپیتان می‌تواند تیم را غیرفعال کند.")
        if not team.is_active:
            raise _err(409, "TEAM_INACTIVE", "تیم از قبل غیرفعال است.")
        team.is_active = False
        team.updated_at = _utcnow()
        uow.session.add(team)
        for req, _name in uow.team_join_requests.list_for_team(
                team.id, TeamJoinRequestStatus.PENDING):
            req.status = TeamJoinRequestStatus.REJECTED
            req.reviewed_by = user.id
            req.reviewed_at = _utcnow()
            uow.session.add(req)
        for inv in uow.team_invitations.list_by_team(team.id):
            if inv.status == TeamInvitationStatus.PENDING:
                inv.status = TeamInvitationStatus.REVOKED
                inv.answered_at = _utcnow()
                uow.session.add(inv)
        uow.session.flush()
        open_dues = uow.team_dues.count_open_for_team(team.id)
        TeamService._audit(uow, team.id, TeamAuditAction.DEACTIVATED, user.id,
                           {"open_dues": open_dues})
        notifications = [{
            "user_id": None,
            "title": "🚫 تیم غیرفعال شد",
            "message": f"تیم «{team.name}» توسط کاپیتان غیرفعال شد."
                       + (f" {open_dues} سهم تسویه‌نشده باقی است." if open_dues else ""),
            "data": {"team_id": team.id, "team_name": team.name, "open_dues": open_dues},
            "notif_type": "team_deactivated",
            "broadcast_team": team.id,
        }]
        return {"message": "تیم غیرفعال شد.", "open_dues": open_dues,
                "team": TeamService.to_response(uow, team, user)}, notifications

    # ─────────────────────────── اعضا / دعوت ───────────────────────────

    @staticmethod
    def list_members(uow: UnitOfWork, team_id: int, user: User) -> List[dict]:
        team = TeamService._get_team_or_404(uow, team_id)
        actor = TeamService._member(uow, team.id, user.id)
        if team.visibility == TeamVisibility.PRIVATE and not actor:
            raise _err(403, "PRIVATE_TEAM", "این تیم خصوصی است.")
        show_pending = TeamService._is_manager_role(actor)
        statuses = ([TeamMemberStatus.ACTIVE, TeamMemberStatus.PENDING]
                    if show_pending else [TeamMemberStatus.ACTIVE])
        rows = uow.team_members.list_by_team(team.id, statuses)
        out = []
        for m, name, phone in rows:
            out.append({
                "id": m.id, "team_id": m.team_id, "user_id": m.user_id,
                "full_name": name,
                "phone": phone if (show_pending or actor) else None,
                "role": m.role.value, "status": m.status.value,
                "invited_by": m.invited_by, "joined_at": m.joined_at, "left_at": m.left_at,
            })
        return out

    @staticmethod
    def invite_user(uow: UnitOfWork, team_id: int, actor: User,
                    data: TeamInviteCreate) -> Tuple[dict, List[dict]]:
        """دعوت مستقیم — هدف باید کاربر ثبت‌نام‌شده باشد (user_id یا phone)."""
        team = TeamService._get_team_or_404_locked(uow, team_id)
        TeamService._require_active_team(team)
        TeamService._require_manage_permission(uow, team, actor.id)
        target = None
        if data.user_id:
            target = uow.users.get_by_id(data.user_id)
        elif data.phone:
            target = uow.users.get_one(phone=data.phone.strip())
        if not target:
            raise _err(404, "USER_NOT_FOUND", "کاربر یافت نشد — برای دعوت باید ثبت‌نام کرده باشد.")
        existing = TeamService._member(uow, team.id, target.id)
        if existing and existing.status == TeamMemberStatus.ACTIVE:
            raise _err(409, "ALREADY_MEMBER", "این کاربر از قبل عضو فعال تیم است.")
        if existing and existing.status == TeamMemberStatus.PENDING:
            raise _err(409, "ALREADY_PENDING", "دعوت این کاربر در انتظار پاسخ است.")
        inv = uow.team_invitations.get_by_team_user(team.id, target.id)
        if inv and inv.status == TeamInvitationStatus.PENDING:
            raise _err(409, "ALREADY_PENDING", "دعوت این کاربر در انتظار پاسخ است.")
        TeamService._ensure_capacity(uow, team.id)
        expires_at = (_utcnow() + timedelta(days=data.expires_in_days)
                      if data.expires_in_days else None)
        if existing:  # بازگشت عضو حذف‌شده/ردشده → pending
            existing.status = TeamMemberStatus.PENDING
            existing.role = TeamMemberRole.MEMBER
            existing.left_at = None
            existing.invited_by = actor.id
            existing.updated_at = _utcnow()
            member = existing
            uow.session.add(member)
        else:
            member = uow.team_members.create(TeamMember(
                team_id=team.id, user_id=target.id,
                role=TeamMemberRole.MEMBER, status=TeamMemberStatus.PENDING,
                invited_by=actor.id,
            ))
        if inv:
            inv.status = TeamInvitationStatus.PENDING
            inv.invited_by = actor.id
            inv.expires_at = expires_at
            inv.answered_at = None
            uow.session.add(inv)
        else:
            inv = uow.team_invitations.create(TeamInvitation(
                team_id=team.id, invitee_user_id=target.id,
                invitee_phone=target.phone, invited_by=actor.id,
                expires_at=expires_at,
            ))
        uow.session.flush()
        TeamService._audit(uow, team.id, TeamAuditAction.MEMBER_INVITED, actor.id,
                           {"user_id": target.id, "member_id": member.id})
        notifications = [{
            "user_id": target.id,
            "title": "✉️ دعوت به تیم",
            "message": f"{actor.full_name} شما را به تیم «{team.name}» دعوت کرد.",
            "data": {"team_id": team.id, "team_name": team.name,
                     "member_id": member.id, "invitation_id": inv.id},
            "notif_type": "team_invitation",
        }]
        return {"id": inv.id, "member_id": member.id, "team_id": team.id,
                "invitee_user_id": target.id, "invitee_name": target.full_name,
                "invited_by": actor.id, "status": inv.status.value,
                "expires_at": inv.expires_at, "created_at": inv.created_at}, notifications
    @staticmethod
    def _load_pending_invitation(uow: UnitOfWork, team: Team, member_id: int,
                                 user: User) -> Tuple[TeamMember, TeamInvitation]:
        member = uow.team_members.get_by_id(member_id)
        if not member or member.team_id != team.id or member.user_id != user.id:
            raise _err(404, "INVITATION_NOT_FOUND", "دعوت‌نامه یافت نشد.")
        if member.status != TeamMemberStatus.PENDING:
            raise _err(409, "INVITATION_ALREADY_ANSWERED", "این دعوت‌نامه پاسخ داده شده است.")
        inv = uow.team_invitations.get_by_team_user(team.id, user.id)
        if not inv or inv.status != TeamInvitationStatus.PENDING:
            raise _err(409, "INVITATION_ALREADY_ANSWERED", "این دعوت‌نامه پاسخ داده شده است.")
        if inv.expires_at and inv.expires_at.replace(tzinfo=timezone.utc) < _utcnow():
            raise _err(410, "INVITE_EXPIRED", "دعوت‌نامه منقضی شده است.")
        return member, inv

    @staticmethod
    def accept_invitation(uow: UnitOfWork, team_id: int, member_id: int,
                          user: User) -> Tuple[dict, List[dict]]:
        team = TeamService._get_team_or_404_locked(uow, team_id)
        member, inv = TeamService._load_pending_invitation(uow, team, member_id, user)
        TeamService._require_active_team(team)
        TeamService._ensure_capacity(uow, team.id)
        member.status = TeamMemberStatus.ACTIVE
        member.joined_at = _utcnow()
        member.left_at = None
        member.updated_at = _utcnow()
        uow.session.add(member)
        inv.status = TeamInvitationStatus.ACCEPTED
        inv.answered_at = _utcnow()
        uow.session.add(inv)
        uow.session.flush()
        TeamService._audit(uow, team.id, TeamAuditAction.MEMBER_ACCEPTED, user.id,
                           {"user_id": user.id})
        notifications = [{
            "user_id": user.id,
            "title": "🤝 به تیم پیوستید",
            "message": f"عضو فعال تیم «{team.name}» شدید.",
            "data": {"team_id": team.id, "team_name": team.name},
            "notif_type": "team_joined",
        }] + TeamService._admin_notifs(
            uow, team, "🎉 دعوت پذیرفته شد",
            f"{user.full_name} دعوت تیم «{team.name}» را پذیرفت.",
            "team_invitation_accepted", exclude_user_id=user.id)
        notifications += TeamService.refresh_official_status(uow, team, user.id)
        return TeamService.to_response(uow, team, user), notifications

    @staticmethod
    def decline_invitation(uow: UnitOfWork, team_id: int, member_id: int,
                           user: User) -> Tuple[dict, List[dict]]:
        team = TeamService._get_team_or_404(uow, team_id)
        member, inv = TeamService._load_pending_invitation(uow, team, member_id, user)
        member.status = TeamMemberStatus.DECLINED
        member.left_at = _utcnow()
        member.updated_at = _utcnow()
        uow.session.add(member)
        inv.status = TeamInvitationStatus.DECLINED
        inv.answered_at = _utcnow()
        uow.session.add(inv)
        uow.session.flush()
        TeamService._audit(uow, team.id, TeamAuditAction.MEMBER_DECLINED, user.id,
                           {"user_id": user.id})
        notifications = TeamService._admin_notifs(
            uow, team, "❌ دعوت رد شد",
            f"{user.full_name} دعوت تیم «{team.name}» را رد کرد.",
            "team_invitation_declined", exclude_user_id=user.id)
        return {"message": "دعوت رد شد."}, notifications

    @staticmethod
    def remove_member(uow: UnitOfWork, team_id: int, member_id: int,
                      actor: User) -> Tuple[dict, List[dict]]:
        """حذف عضو — مدیر (کاپیتان/ادمین). کاپیتان بدون انتقال کاپیتانی حذف‌ناپذیر است."""
        team = TeamService._get_team_or_404_locked(uow, team_id)
        target = uow.team_members.get_by_id(member_id)
        if not target or target.team_id != team.id:
            raise _err(404, "MEMBER_NOT_FOUND", "عضو یافت نشد.")
        if target.user_id == actor.id:
            raise _err(409, "USE_LEAVE", "برای خروج خودی از /leave استفاده کنید.")
        manager = TeamService._require_manage_permission(uow, team, actor.id)
        if target.role == TeamMemberRole.CAPTAIN:
            raise _err(409, "CANNOT_REMOVE_CAPTAIN",
                       "کاپیتان قابل حذف نیست؛ ابتدا کاپیتانی را منتقل کنید.")
        if manager.role != TeamMemberRole.CAPTAIN and target.role != TeamMemberRole.MEMBER:
            raise _err(403, "ONLY_CAPTAIN_FOR_ADMINS", "حذف مدیر فقط با کاپیتان مجاز است.")
        was_pending = target.status == TeamMemberStatus.PENDING
        if target.status not in (TeamMemberStatus.ACTIVE, TeamMemberStatus.PENDING):
            raise _err(409, "NOT_A_MEMBER", "این کاربر عضو فعلی تیم نیست.")
        target.status = TeamMemberStatus.REMOVED
        target.left_at = _utcnow()
        target.updated_at = _utcnow()
        uow.session.add(target)
        uow.session.flush()
        if was_pending:
            uow.team_invitations.revoke_pending(team.id, target.user_id)
        TeamService._audit(uow, team.id, TeamAuditAction.MEMBER_REMOVED, actor.id,
                           {"user_id": target.user_id, "invitation_revoked": was_pending})
        notifications = [{
            "user_id": target.user_id,
            "title": "⛔ از تیم حذف شدید",
            "message": f"توسط مدیریت تیم، از «{team.name}» خارج شدید.",
            "data": {"team_id": team.id, "team_name": team.name},
            "notif_type": "team_removed",
        }]
        notifications += TeamService.refresh_official_status(uow, team, actor.id)
        return {"message": "عضو حذف شد."}, notifications

    @staticmethod
    def leave_team(uow: UnitOfWork, team_id: int, user: User) -> Tuple[dict, List[dict]]:
        team = TeamService._get_team_or_404_locked(uow, team_id)
        member = TeamService._member(uow, team.id, user.id)
        if not member or member.status not in (TeamMemberStatus.ACTIVE,
                                               TeamMemberStatus.PENDING):
            raise _err(409, "NOT_A_MEMBER", "شما عضو این تیم نیستید.")
        if member.role == TeamMemberRole.CAPTAIN:
            raise _err(409, "CAPTAIN_MUST_TRANSFER",
                       "کاپیتان نمی‌تواند خارج شود؛ ابتدا کاپیتانی را منتقل یا تیم را غیرفعال کنید.")
        was_pending = member.status == TeamMemberStatus.PENDING
        member.status = TeamMemberStatus.REMOVED
        member.left_at = _utcnow()
        member.updated_at = _utcnow()
        uow.session.add(member)
        uow.session.flush()
        if was_pending:
            uow.team_invitations.revoke_pending(team.id, user.id)
        TeamService._audit(uow, team.id, TeamAuditAction.MEMBER_LEFT, user.id,
                           {"user_id": user.id})
        notifications = TeamService._admin_notifs(
            uow, team, "👋 عضو تیم خارج شد",
            f"{user.full_name} از تیم «{team.name}» خارج شد.",
            "team_left", exclude_user_id=user.id)
        notifications += TeamService.refresh_official_status(uow, team, user.id)
        return {"message": "از تیم خارج شدید."}, notifications

    @staticmethod
    def transfer_captain(uow: UnitOfWork, team_id: int, target_user_id: int,
                         actor: User) -> Tuple[dict, List[dict]]:
        team = TeamService._get_team_or_404_locked(uow, team_id)
        if team.captain_id != actor.id:
            raise _err(403, "ONLY_CAPTAIN", "فقط کاپیتان فعلی می‌تواند کاپیتانی را منتقل کند.")
        if target_user_id == actor.id:
            raise _err(409, "ALREADY_CAPTAIN", "شما هم‌اکنون کاپیتان هستید.")
        new = TeamService._member(uow, team.id, target_user_id)
        if not new or new.status != TeamMemberStatus.ACTIVE:
            raise _err(404, "NOT_A_MEMBER", "کاربر هدف عضو فعال تیم نیست.")
        old = TeamService._member(uow, team.id, actor.id)
        new.role = TeamMemberRole.CAPTAIN
        new.updated_at = _utcnow()
        uow.session.add(new)
        if old:
            old.role = TeamMemberRole.ADMIN
            old.updated_at = _utcnow()
            uow.session.add(old)
        team.captain_id = target_user_id
        team.updated_at = _utcnow()
        uow.session.add(team)
        uow.session.flush()
        TeamService._audit(uow, team.id, TeamAuditAction.CAPTAIN_TRANSFERRED, actor.id,
                           {"from": actor.id, "to": target_user_id})
        new_name = TeamService._user_name(uow, target_user_id) or "کاربر"
        notifications = [{
            "user_id": target_user_id,
            "title": "👑 کاپیتان تیم شدید",
            "message": f"اکنون کاپیتان تیم «{team.name}» هستید.",
            "data": {"team_id": team.id, "team_name": team.name},
            "notif_type": "team_captain_transferred",
        }] + TeamService._admin_notifs(
            uow, team, "👑 انتقال کاپیتانی",
            f"کاپیتانی تیم «{team.name}» به {new_name} منتقل شد.",
            "team_captain_transferred", exclude_user_id=target_user_id)
        return TeamService.to_response(uow, team, actor), notifications

    @staticmethod
    def set_member_role(uow: UnitOfWork, team_id: int, member_id: int,
                        role, actor: User) -> Tuple[dict, List[dict]]:
        """ارتقا/تنزل نقش — فقط کاپیتان؛ قابل‌انتصاب: admin | member."""
        role_val = role.value if hasattr(role, "value") else str(role)
        if role_val not in (TeamMemberRole.ADMIN.value, TeamMemberRole.MEMBER.value):
            raise _err(400, "INVALID_ROLE", "نقش قابل‌انتخاب فقط admin یا member است.")
        team = TeamService._get_team_or_404(uow, team_id)
        if team.captain_id != actor.id:
            raise _err(403, "ONLY_CAPTAIN", "فقط کاپیتان می‌تواند نقش‌ها را تغییر دهد.")
        target = uow.team_members.get_by_id(member_id)
        if not target or target.team_id != team.id:
            raise _err(404, "MEMBER_NOT_FOUND", "عضو یافت نشد.")
        if target.user_id == team.captain_id:
            raise _err(409, "CANNOT_CHANGE_CAPTAIN_ROLE", "نقش کاپیتان قابل تغییر نیست.")
        if target.status != TeamMemberStatus.ACTIVE:
            raise _err(409, "NOT_A_MEMBER", "این کاربر عضو فعال تیم نیست.")
        target.role = TeamMemberRole(role_val)
        target.updated_at = _utcnow()
        uow.session.add(target)
        uow.session.flush()
        TeamService._audit(uow, team.id, TeamAuditAction.ROLE_CHANGED, actor.id,
                           {"user_id": target.user_id, "role": role_val})
        notifications = [{
            "user_id": target.user_id,
            "title": "🔧 نقش شما تغییر کرد",
            "message": f"نقش شما در تیم «{team.name}» به «{role_val}» تغییر کرد.",
            "data": {"team_id": team.id, "team_name": team.name, "role": role_val},
            "notif_type": "team_role_changed",
        }]
        return {"id": target.id, "team_id": team.id, "user_id": target.user_id,
                "full_name": TeamService._user_name(uow, target.user_id),
                "role": target.role.value, "status": target.status.value,
                "joined_at": target.joined_at, "left_at": target.left_at}, notifications
    # ─────────────────────────── درخواست‌های پیوستن ───────────────────────────

    @staticmethod
    def request_join(uow: UnitOfWork, team_id: int, user: User,
                     data: TeamJoinRequestCreate) -> Tuple[dict, List[dict]]:
        team = TeamService._get_team_or_404(uow, team_id)
        TeamService._require_active_team(team)
        if team.visibility != TeamVisibility.PUBLIC:
            raise _err(403, "JOIN_NOT_ALLOWED",
                       "ورود به این تیم فقط با دعوت مستقیم مدیران امکان‌پذیر است.")
        actor = TeamService._member(uow, team.id, user.id)
        if actor and actor.status in (TeamMemberStatus.ACTIVE, TeamMemberStatus.PENDING):
            raise _err(409, "ALREADY_MEMBER", "شما عضو تیم هستید یا دعوت باز دارید.")
        if uow.team_join_requests.get_pending_by_user(team.id, user.id):
            raise _err(409, "ALREADY_REQUESTED", "درخواست شما در انتظار بررسی است.")
        req = uow.team_join_requests.create(TeamJoinRequest(
            team_id=team.id, user_id=user.id, message=data.message))
        TeamService._audit(uow, team.id, TeamAuditAction.JOIN_REQUESTED, user.id,
                           {"user_id": user.id, "request_id": req.id})
        notifications = TeamService._admin_notifs(
            uow, team, "🙋 درخواست پیوستن به تیم",
            f"{user.full_name} درخواست عضویت در تیم «{team.name}» را ثبت کرد.",
            "team_join_request")
        return {"id": req.id, "pending": True, "team_id": team.id,
                "message": "درخواست شما ثبت شد و در انتظار بررسی مدیران است."}, notifications

    @staticmethod
    def list_join_requests(uow: UnitOfWork, team_id: int, actor: User) -> List[dict]:
        team = TeamService._get_team_or_404(uow, team_id)
        TeamService._require_manage_permission(uow, team, actor.id)
        return [
            {"id": r.id, "team_id": r.team_id, "user_id": r.user_id, "full_name": name,
             "status": r.status.value, "message": r.message,
             "reviewed_by": r.reviewed_by, "reviewed_at": r.reviewed_at,
             "created_at": r.created_at}
            for r, name in uow.team_join_requests.list_for_team(
                team.id, TeamJoinRequestStatus.PENDING)
        ]

    @staticmethod
    def decide_join_request(uow: UnitOfWork, team_id: int, request_id: int,
                            actor: User, approve: bool) -> Tuple[dict, List[dict]]:
        team = TeamService._get_team_or_404_locked(uow, team_id)
        TeamService._require_manage_permission(uow, team, actor.id)
        TeamService._require_active_team(team)
        req = uow.team_join_requests.get_by_id(request_id)
        if not req or req.team_id != team.id or req.status != TeamJoinRequestStatus.PENDING:
            raise _err(404, "REQUEST_NOT_FOUND", "درخواست یافت نشد یا بررسی شده است.")
        existing = TeamService._member(uow, team.id, req.user_id)
        if approve and existing and existing.status == TeamMemberStatus.ACTIVE:
            raise _err(409, "ALREADY_MEMBER", "این کاربر از قبل عضو فعال تیم است.")
        name = TeamService._user_name(uow, req.user_id) or "کاربر"
        notifications: List[dict] = []
        if approve:
            TeamService._ensure_capacity(uow, team.id)
            if existing:
                existing.status = TeamMemberStatus.ACTIVE
                existing.joined_at = _utcnow()
                existing.left_at = None
                existing.updated_at = _utcnow()
                uow.session.add(existing)
            else:
                uow.team_members.create(TeamMember(
                    team_id=team.id, user_id=req.user_id,
                    role=TeamMemberRole.MEMBER, status=TeamMemberStatus.ACTIVE,
                    invited_by=actor.id,
                ))
        req.status = TeamJoinRequestStatus.APPROVED if approve else TeamJoinRequestStatus.REJECTED
        req.reviewed_by = actor.id
        req.reviewed_at = _utcnow()
        uow.session.add(req)
        uow.session.flush()
        TeamService._audit(
            uow, team.id,
            TeamAuditAction.JOIN_APPROVED if approve else TeamAuditAction.JOIN_REJECTED,
            actor.id, {"user_id": req.user_id, "request_id": req.id})
        notifications.append({
            "user_id": req.user_id,
            "title": "✅ درخواست شما تأیید شد" if approve else "❌ درخواست شما تأیید نشد",
            "message": (f"به تیم «{team.name}» پیوستید." if approve
                        else f"درخواست عضویت شما در تیم «{team.name}» رد شد."),
            "data": {"team_id": team.id, "team_name": team.name},
            "notif_type": "team_request_approved" if approve else "team_request_rejected",
        })
        notifications += TeamService._admin_notifs(
            uow, team,
            "✅ درخواست پیوستن تأیید شد" if approve else "❌ درخواست پیوستن رد شد",
            f"{name} {'به تیم اضافه شد' if approve else 'رد شد'} (تیم «{team.name}»).",
            "team_join_request_decided", exclude_user_id=req.user_id)
        if approve:
            notifications += TeamService.refresh_official_status(uow, team, actor.id)
        return {"message": "درخواست بررسی شد.", "request_id": req.id,
                "status": req.status.value}, notifications

    # ─────────────────────────── دعوت‌های من / ممیزی ───────────────────────────

    @staticmethod
    def list_my_invitations(uow: UnitOfWork, user_id: int) -> List[dict]:
        out = []
        for inv, team_name in uow.team_invitations.list_pending_for_user(user_id):
            member = TeamService._member(uow, inv.team_id, user_id)
            out.append({
                "id": inv.id, "team_id": inv.team_id, "team_name": team_name,
                "member_id": member.id if member else None,
                "invitee_user_id": inv.invitee_user_id,
                "invitee_name": TeamService._user_name(uow, inv.invitee_user_id),
                "invited_by": inv.invited_by, "status": inv.status.value,
                "expires_at": inv.expires_at, "created_at": inv.created_at,
                "answered_at": inv.answered_at,
            })
        return out

    @staticmethod
    def list_audit(uow: UnitOfWork, team_id: int, actor: User,
                   limit: int, offset: int) -> dict:
        team = TeamService._get_team_or_404(uow, team_id)
        TeamService._require_manage_permission(uow, team, actor.id)
        rows, total = uow.team_audits.list_by_team(team.id, limit, offset)
        names = {}
        actor_ids = list({r.actor_id for r in rows if r.actor_id})
        if actor_ids:
            names = {u.id: u.full_name for u in uow.session.exec(
                select(User).where(col(User.id).in_(actor_ids))).all()}
        import json as _json
        items = []
        for r in rows:
            try:
                data = _json.loads(r.data or "{}")
            except ValueError:
                data = {"raw": r.data}
            items.append({"id": r.id, "team_id": r.team_id, "actor_id": r.actor_id,
                          "actor_name": names.get(r.actor_id) if r.actor_id else None,
                          "action": (r.action.value if hasattr(r.action, "value")
                                     else str(r.action)),
                          "data": data, "created_at": r.created_at})
        return {"items": items, "total": total, "limit": limit, "offset": offset}

    # ─────────────────────────── چت تیم ───────────────────────────

    @staticmethod
    def list_messages(uow: UnitOfWork, team_id: int, actor: User,
                      limit: int, before_id: Optional[int]) -> dict:
        team = TeamService._get_team_or_404(uow, team_id)
        TeamService._require_active_member(uow, team, actor.id)
        rows = uow.team_messages.list_by_team(team.id, before_id, limit + 1)
        has_more = len(rows) > limit
        rows = rows[:limit]
        names = {}
        user_ids = list({m.user_id for m in rows})
        if user_ids:
            names = {u.id: u.full_name for u in uow.session.exec(
                select(User).where(col(User.id).in_(user_ids))).all()}
        return {
            "items": [{
                "id": m.id, "user_id": m.user_id,
                "full_name": names.get(m.user_id), "content": m.content,
                "created_at": m.created_at,
            } for m in rows],
            "has_more": has_more,
        }

    @staticmethod
    def post_message(uow: UnitOfWork, team_id: int, actor: User,
                     data: TeamMessageCreate) -> Tuple[dict, List[dict]]:
        """ارسال پیام چت — عمداً رویداد ممیزی ندارد (حجم بالای چت)."""
        team = TeamService._get_team_or_404(uow, team_id)
        TeamService._require_active_member(uow, team, actor.id)
        msg = uow.team_messages.create(TeamMessage(
            team_id=team.id, user_id=actor.id, content=data.content))
        recipients = [uid for uid in uow.team_members.active_user_ids(team.id)
                      if uid != actor.id]
        notifications = [{
            "user_id": uid,
            "title": f"💬 پیام جدید در تیم {team.name}",
            "message": f"{actor.full_name}: {msg.content[:200]}",
            "data": {"team_id": team.id, "team_name": team.name},
            "notif_type": "team_message",
        } for uid in recipients]
        return {"id": msg.id, "user_id": actor.id, "full_name": actor.full_name,
                "content": msg.content, "created_at": msg.created_at}, notifications

    @staticmethod
    def mark_messages_read(uow: UnitOfWork, team_id: int, actor: User) -> dict:
        team = TeamService._get_team_or_404(uow, team_id)
        member = TeamService._require_active_member(uow, team, actor.id)
        member.last_seen_message_at = _utcnow()
        member.updated_at = _utcnow()
        uow.session.add(member)
        uow.session.flush()
        return {"unread": 0}

    @staticmethod
    def unread_count(uow: UnitOfWork, team_id: int, actor: User) -> dict:
        team = TeamService._get_team_or_404(uow, team_id)
        member = TeamService._require_active_member(uow, team, actor.id)
        return {"unread": uow.team_messages.unread_count(
            team.id, member.last_seen_message_at, exclude_user_id=actor.id)}

    # ─────────────────────────── dispatch اعلان‌ها ───────────────────────────

    @staticmethod
    async def dispatch_notifications(uow: UnitOfWork, notifications: List[dict]):
        """user_id مشخص → ارسال يکتا؛ broadcast_team → همه اعضای فعال تیم."""
        from app.services.notification_service import notification_service
        for n in notifications:
            broadcast_team_id = n.get("broadcast_team")
            if broadcast_team_id:
                targets = set(uow.team_members.active_user_ids(broadcast_team_id))
            elif n.get("user_id"):
                targets = {n["user_id"]}
            else:
                continue
            for uid in targets:
                try:
                    await notification_service.send_to_user(
                        uid, n["title"], n["message"], n.get("data"),
                        n.get("notif_type", "team"))
                except Exception as e:  # اعلان نباید جریان اصلی را بشکند
                    print(f"[TeamService] notification failed: {e}")
    # ─────────────────────────── حق‌عضویت / سهم ───────────────────────────

    @staticmethod
    def generate_dues(uow: UnitOfWork, team_id: int, actor: User,
                      data: TeamDuesGenerate) -> Tuple[dict, List[dict]]:
        """سهم سرانه یکسان (integer ریال) برای اعضا — کاپیتان هم شامل می‌شود.

        ضدتکرار: برای هر کاربر، سهم هم‌عنوان+هم‌سررسیدِ بازِ قبلی دوبار ساخته نمی‌شود.
        """
        team = TeamService._get_team_or_404_locked(uow, team_id)
        TeamService._require_manage_permission(uow, team, actor.id)
        TeamService._require_active_team(team)
        if data.due_date < date.today():
            raise _err(400, "BAD_DUE_DATE", "تاریخ سررسید نمی‌تواند در گذشته باشد.")
        active_ids = uow.team_members.active_user_ids(team.id)
        if data.member_user_ids is not None:
            wanted = set(data.member_user_ids)
            if wanted - set(active_ids):
                raise _err(404, "NOT_A_MEMBER", "برخی کاربران هدف عضو فعال تیم نیستند.")
            targets = sorted(wanted, key=lambda u: active_ids.index(u))
        else:
            targets = active_ids
        if not targets:
            raise _err(409, "NO_MEMBERS", "عضو فعالی برای سهم‌گذاری وجود ندارد.")
        created: List[TeamDues] = []
        skipped = 0
        for uid in targets:
            if uow.team_dues.find_duplicate(team.id, uid, data.title.strip(), data.due_date):
                skipped += 1
                continue
            created.append(uow.team_dues.create(TeamDues(
                team_id=team.id, user_id=uid, title=data.title.strip(),
                amount=data.amount, due_date=data.due_date,
            )))
        uow.session.flush()
        TeamService._audit(uow, team.id, TeamAuditAction.DUES_GENERATED, actor.id,
                           {"title": data.title, "amount": data.amount,
                            "due_date": str(data.due_date),
                            "created": len(created), "skipped": skipped})
        notifications = [{
            "user_id": due.user_id,
            "title": "💰 سهم جدید تیم",
            "message": f"سهم «{due.title}» به مبلغ {due.amount} ریال تا {due.due_date} "
                       f"برای شما در تیم «{team.name}» ثبت شد.",
            "data": {"team_id": team.id, "team_name": team.name, "due_id": due.id,
                     "amount": due.amount},
            "notif_type": "dues_created",
        } for due in created]
        return {"created": len(created), "skipped": skipped,
                "per_user_amount": data.amount,
                "total_amount": data.amount * len(created),
                "items": [TeamService._due_to_dict(uow, d) for d in created]}, notifications

    @staticmethod
    def _due_to_dict(uow: UnitOfWork, due: TeamDues,
                     name: Optional[str] = None) -> dict:
        return {
            "id": due.id, "team_id": due.team_id, "user_id": due.user_id,
            "full_name": name if name is not None else TeamService._user_name(uow, due.user_id),
            "title": due.title, "amount": due.amount, "due_date": due.due_date,
            "is_paid": due.is_paid, "is_voided": due.is_voided,
            "overdue": (not due.is_paid and not due.is_voided
                        and due.due_date < date.today()),
            "paid_at": due.paid_at, "paid_by": due.paid_by,
            "payment_method": due.payment_method.value if due.payment_method else None,
            "payment_reference": due.payment_reference,
            "transaction_id": due.transaction_id, "void_reason": due.void_reason,
            "created_at": due.created_at,
        }

    @staticmethod
    def list_dues(uow: UnitOfWork, team_id: int, actor: User,
                  status: Optional[str], limit: int, offset: int) -> dict:
        """اعضای عادی فقط سهم خود؛ مدیران سهم همه اعضا."""
        team = TeamService._get_team_or_404(uow, team_id)
        member = TeamService._require_active_member(uow, team, actor.id)
        mine_only = member.role not in (TeamMemberRole.CAPTAIN, TeamMemberRole.ADMIN)
        rows, total = uow.team_dues.list_by_team(
            team.id, status, actor.id if mine_only else None, limit, offset)
        names = {}
        if not mine_only and rows:
            uidset = list({d.user_id for d in rows})
            names = {u.id: u.full_name for u in uow.session.exec(
                select(User).where(col(User.id).in_(uidset))).all()}
        return {"items": [TeamService._due_to_dict(uow, d, names.get(d.user_id))
                          for d in rows],
                "total": total, "limit": limit, "offset": offset}

    @staticmethod
    def pay_due(uow: UnitOfWork, team_id: int, due_id: int, actor: User,
                method: str = "cash",
                reference: Optional[str] = None) -> Tuple[dict, List[dict]]:
        """پرداخت (خودی) یا وصول نقدی (فقط مدیران تیم) — یک ردیف دفتر کل با key idempotent."""
        team = TeamService._get_team_or_404(uow, team_id)
        due = uow.team_dues.get_by_id(due_id)
        if not due or due.team_id != team.id:
            raise _err(404, "DUE_NOT_FOUND", "سهم یافت نشد.")
        if due.is_voided:
            raise _err(409, "DUE_VOIDED", "این سهم باطل شده است.")
        self_payment = due.user_id == actor.id
        if not self_payment:
            TeamService._require_manage_permission(uow, team, actor.id)
        else:
            TeamService._require_active_member(uow, team, actor.id)
        if due.is_paid:
            raise _err(409, "DUE_ALREADY_PAID", "این سهم از قبل پرداخت شده است.")
        tx = FinanceService.record_tx(uow, FinancialTransaction(
            idempotency_key=f"team-dues:{due.id}",
            type=TransactionType.PAYMENT,
            direction=TransactionDirection.INCOME,
            amount=due.amount,
            method=_METHOD_MAP.get(method, TransactionMethod.CASH),
            status=TransactionStatus.CLEARED,
            counterparty_ref=team.id,
            counterparty_type=CounterpartyType.TEAM,
            source_type=TransactionSourceType.TEAM_DUES,
            source_id=due.id,
            description=f"سهم تیم #{team.id} «{due.title}» — "
                        f"{TeamService._user_name(uow, due.user_id) or due.user_id}",
            created_by=actor.id,
        ))
        due.is_paid = True
        due.paid_at = _utcnow()
        due.paid_by = actor.id
        due.payment_method = TeamDuesMethod(method)
        due.payment_reference = reference or f"TEAM-{uuid.uuid4().hex[:10].upper()}"
        due.transaction_id = tx.id
        due.updated_at = _utcnow()
        uow.session.add(due)
        uow.session.flush()
        TeamService._audit(uow, team.id, TeamAuditAction.DUES_PAID, actor.id,
                           {"due_id": due.id, "user_id": due.user_id,
                            "amount": due.amount, "method": method})
        due_user_name = TeamService._user_name(uow, due.user_id) or "عضو"
        notifications = []
        if self_payment:
            notifications.append({
                "user_id": actor.id,
                "title": "✅ سهم تیم پرداخت شد",
                "message": f"سهم «{due.title}» در تیم «{team.name}» تسویه شد.",
                "data": {"team_id": team.id, "due_id": due.id},
                "notif_type": "dues_paid",
            })
        notifications += TeamService._admin_notifs(
            uow, team, "💰 وصول سهم تیم",
            f"سهم «{due.title}» ({due.amount} ریال) از {due_user_name} "
            + ("پرداخت شد." if self_payment else f"توسط {actor.full_name} وصول شد."),
            "dues_paid", exclude_user_id=actor.id if self_payment else None)
        return TeamService._due_to_dict(uow, due), notifications

    @staticmethod
    def void_due(uow: UnitOfWork, team_id: int, due_id: int, actor: User,
                 reason: Optional[str] = None) -> Tuple[dict, List[dict]]:
        team = TeamService._get_team_or_404(uow, team_id)
        TeamService._require_manage_permission(uow, team, actor.id)
        due = uow.team_dues.get_by_id(due_id)
        if not due or due.team_id != team.id:
            raise _err(404, "DUE_NOT_FOUND", "سهم یافت نشد.")
        if due.is_paid:
            raise _err(409, "DUE_ALREADY_PAID",
                       "سهم پرداخت‌شده قابل ابطال نیست؛ در دفتر کل اصلاحیه ثبت کنید.")
        if due.is_voided:
            raise _err(409, "DUE_VOIDED", "این سهم از قبل باطل شده است.")
        due.is_voided = True
        due.void_reason = (reason or "")[:300] or None
        due.updated_at = _utcnow()
        uow.session.add(due)
        uow.session.flush()
        TeamService._audit(uow, team.id, TeamAuditAction.DUES_VOIDED, actor.id,
                           {"due_id": due.id, "user_id": due.user_id, "reason": reason})
        notifications = [{
            "user_id": due.user_id,
            "title": "🗑️ سهم تیم باطل شد",
            "message": f"سهم «{due.title}» در تیم «{team.name}» توسط مدیر باطل شد.",
            "data": {"team_id": team.id, "due_id": due.id},
            "notif_type": "dues_voided",
        }]
        return TeamService._due_to_dict(uow, due), notifications

    @staticmethod
    def get_balance(uow: UnitOfWork, team_id: int, actor: User) -> dict:
        """net = مانده حساب تیم در دفتر کل − سهم‌های باز.

        حساب تیم = جمع (income − expense) ردیف‌های غیرباطل با
        counterparty_type=team/counterparty_ref=team؛ سهم پرداختی از طریق
        همین دفتر کل به حساب تیم می‌آید، لذا دوبار شمرده نمی‌شود.
        """
        team = TeamService._get_team_or_404(uow, team_id)
        TeamService._require_active_member(uow, team, actor.id)
        dues = uow.team_dues.status_sums(team.id)
        ledger = uow.team_dues.sum_team_ledger(team.id)
        account = ledger["team_income"] - ledger["team_expense"]
        return {
            "team_id": team.id,
            "dues_total": dues["dues_total"],
            "dues_paid": dues["dues_paid"],
            "dues_unpaid": dues["dues_unpaid"],
            "dues_overdue_amount": dues["dues_overdue_amount"],
            "team_ledger_income": ledger["team_income"],
            "team_ledger_expense": ledger["team_expense"],
            "team_account_balance": account,
            "net_balance": account - dues["dues_unpaid"],
            "as_of": date.today(),
        }
    # ─────────────────────────── تاریخچه رزرو تیم ───────────────────────────

    @staticmethod
    def link_booking(uow: UnitOfWork, team_id: int, booking_id: int,
                     actor: User) -> Tuple[dict, List[dict]]:
        """انتساب رزرو به تیم — فقط صاحب رزرو آن هم عضو فعال تیم.

        قانون ساده و قابل ممیزی: هیچ رزری تغییر نمی‌کند؛ فقط ردیف TeamBooking.
        (انتساب قراردادها — موج بعد؛ عمداً در این موج انجام نشد.)
        """
        team = TeamService._get_team_or_404(uow, team_id)
        TeamService._require_active_member(uow, team, actor.id)
        TeamService._require_active_team(team)
        booking = uow.bookings.get_by_id(booking_id)
        if not booking:
            raise _err(404, "BOOKING_NOT_FOUND", "رزرو یافت نشد.")
        if booking.user_id != actor.id:
            raise _err(403, "NOT_MY_BOOKING", "فقط صاحب رزرو می‌تواند آن را به تیم منتسب کند.")
        existing = uow.team_bookings.get_by_booking_id(booking_id)
        if existing:
            if existing.team_id == team.id:
                raise _err(409, "ALREADY_LINKED", "این رزرو به همین تیم منتسب شده است.")
            raise _err(409, "BOOKING_LINKED_ELSEWHERE",
                       "این رزرو قبلاً به تیم دیگری منتسب شده است.")
        tb = uow.team_bookings.create(TeamBooking(
            team_id=team.id, booking_id=booking_id, paid_by_user_id=actor.id))
        uow.session.flush()
        TeamService._audit(uow, team.id, TeamAuditAction.BOOKING_LINKED, actor.id,
                           {"booking_id": booking_id})
        notifications = TeamService._admin_notifs(
            uow, team, "📅 رزرو به تاریخچه تیم اضافه شد",
            f"{actor.full_name} رزرو #{booking_id} را به تیم «{team.name}» منتسب کرد.",
            "team_booking_linked", exclude_user_id=actor.id)
        return TeamService._booking_to_dict(uow, tb), notifications

    @staticmethod
    def _booking_to_dict(uow: UnitOfWork, tb: TeamBooking) -> dict:
        booking = uow.bookings.get_by_id(tb.booking_id)
        slot = uow.slots.get_by_id(booking.slot_id) if booking else None
        venue = uow.venues.get_by_id(slot.venue_id) if slot else None
        user = uow.users.get_by_id(booking.user_id) if booking else None
        return {
            "id": tb.id, "team_id": tb.team_id, "booking_id": tb.booking_id,
            "paid_by_user_id": tb.paid_by_user_id, "created_at": tb.created_at,
            "booking_user_id": booking.user_id if booking else None,
            "booking_user_name": user.full_name if user else None,
            "venue_id": venue.id if venue else None,
            "venue_name": venue.name if venue else None,
            "slot_date": slot.slot_date if slot else None,
            "start_time": (slot.start_time.strftime("%H:%M")
                           if slot and slot.start_time else None),
            "status": (booking.status.value if hasattr(booking.status, "value")
                       else str(booking.status)) if booking else None,
            "payment_amount": booking.payment_amount if booking else None,
        }

    @staticmethod
    def list_bookings(uow: UnitOfWork, team_id: int, actor: User,
                      limit: int, offset: int) -> dict:
        team = TeamService._get_team_or_404(uow, team_id)
        TeamService._require_active_member(uow, team, actor.id)
        tbs, total = uow.team_bookings.list_by_team(team.id, limit, offset)
        return {"items": [TeamService._booking_to_dict(uow, tb) for tb in tbs],
                "total": total, "limit": limit, "offset": offset}

    # ─────────────────────────── دید مدیر سالن (brief §6) ───────────────────────────

    @staticmethod
    def list_manager_partners(uow: UnitOfWork, actor: User,
                              venue_id: Optional[int]) -> dict:
        """تیم‌های فعالی که عضو/رزروِ منتسب‌شان در سالن(های) مدیر رزرو داشته.

        دامنه از resolve_scope مالی (مدیر: سالن‌های خودش؛ super_admin: همه).
        spent = مجموع payment_amount رزروهای تأیید/تکمیل‌شده‌ی منتسب
        (dedup با شناسه رزرو — ساده و قابل ممیزی؛ بدهی شخص از مالیات‌نامه جداست).
        """
        scope = FinanceService.resolve_scope(uow, actor, venue_id)
        today = date.today()
        stmt = (select(Booking, Slot.slot_date)
                .join(Slot, col(Booking.slot_id) == col(Slot.id))
                .where(col(Booking.status).in_([BookingStatus.CONFIRMED.value,
                                                BookingStatus.COMPLETED.value])))
        if scope is not None:
            stmt = stmt.where(col(Slot.venue_id).in_(scope))
        rows = uow.session.exec(stmt).all()
        if not rows:
            return {"items": [], "total": 0}
        booking_meta = {b.id: (b.user_id, b.payment_amount, d) for b, d in rows}
        owner_ids = list({uid for uid, _a, _d in booking_meta.values()})
        teams_of_users = uow.team_members.teams_of_active_users(owner_ids)
        team_ids = {tid for tset in teams_of_users.values() for tid in tset}
        linked = uow.team_bookings.booking_ids_by_teams(
            sorted(team_ids), sorted(booking_meta.keys()))
        team_ids |= set(linked.keys())
        if not team_ids:
            return {"items": [], "total": 0}
        teams = list(uow.session.exec(select(Team).where(
            col(Team.id).in_(sorted(team_ids)),
            col(Team.is_active) == True,  # noqa: E712
        )).all())
        if not teams:
            return {"items": [], "total": 0}
        members_by_team = uow.team_members.active_user_ids_by_team([t.id for t in teams])
        captains = {u.id: (u.full_name, u.phone) for u in uow.session.exec(
            select(User).where(col(User.id).in_(
                sorted({t.captain_id for t in teams})))).all()}
        items = []
        for team in teams:
            member_ids = members_by_team.get(team.id, set())
            booked_ids = set(linked.get(team.id, set()))
            booked_ids |= {bid for bid, (uid, _a, _d) in booking_meta.items()
                           if uid in member_ids}
            if not booked_ids:
                continue
            dates = [booking_meta[b][2] for b in booked_ids]
            items.append({
                "team_id": team.id, "name": team.name, "sport": team.sport,
                "captain_id": team.captain_id,
                "captain_name": captains.get(team.captain_id, (None, None))[0],
                "captain_phone": captains.get(team.captain_id, (None, None))[1],
                "members_count": len(member_ids),
                "member_count": len(member_ids),
                "quota": team.min_members,
                "is_official": team.is_official,
                "official_since": team.official_since,
                "total_bookings_at_my_venues": len(booked_ids),
                "upcoming_bookings_at_my_venues": sum(1 for d in dates if d >= today),
                "spent_at_my_venues": sum(booking_meta[b][1] for b in booked_ids),
                "last_booking_date": max(dates),
            })
        items.sort(key=lambda x: (-x["spent_at_my_venues"], x["name"]))
        return {"items": items, "total": len(items)}