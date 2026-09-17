# backend/app/repositories/staff_repository.py
"""ریپازیتوری کارکنان + ممیزی امنیتی سراسری (الگوی team_audit/contract_audit)."""
import json
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy import func as sa_func
from sqlmodel import Session, col, select

from app.models.staff import StaffAssignment, SecurityAuditEvent
from app.repositories.base import BaseRepository


class StaffAssignmentRepository(BaseRepository[StaffAssignment]):

    def __init__(self, session: Session):
        super().__init__(StaffAssignment, session)

    def get_active(self, venue_id: int, user_id: int) -> Optional[StaffAssignment]:
        stmt = select(StaffAssignment).where(
            StaffAssignment.venue_id == venue_id,
            StaffAssignment.user_id == user_id,
            StaffAssignment.is_active == True,  # noqa: E712
        )
        return self.session.exec(stmt).first()

    def get_for_venue_user(self, venue_id: int, user_id: int
                           ) -> Optional[StaffAssignment]:
        """ردیف (حتی حذف‌شده) — برای revive هنگام انتصاب مجدد."""
        stmt = select(StaffAssignment).where(
            StaffAssignment.venue_id == venue_id,
            StaffAssignment.user_id == user_id,
        )
        return self.session.exec(stmt).first()

    def list_by_venue(self, venue_id: int, include_inactive: bool = False
                      ) -> List[StaffAssignment]:
        conds = [StaffAssignment.venue_id == venue_id]
        if not include_inactive:
            conds.append(StaffAssignment.is_active == True)  # noqa: E712
        stmt = select(StaffAssignment).where(*conds).order_by(col(StaffAssignment.created_at))
        return list(self.session.exec(stmt).all())

    def list_active_for_user(self, user_id: int) -> List[StaffAssignment]:
        """انتصاب‌های فعال کاربر در همه سالن‌ها (خودسرویس /staff/me)."""
        stmt = select(StaffAssignment).where(
            StaffAssignment.user_id == user_id,
            StaffAssignment.is_active == True,  # noqa: E712
        ).order_by(col(StaffAssignment.venue_id))
        return list(self.session.exec(stmt).all())

    def active_venue_ids(self, user_id: int, codes: Optional[Tuple[str, ...]] = None
                         ) -> List[int]:
        """سالن‌هایی که کاربر در آن‌ها کارکنان فعال است (اختیار فیلتر کد).

        فیلتر کد روی رشته‌ی permissions در SQL انجام نمی‌شود (JSON رشته‌ای)؛
        سطح کوچک ردیف‌ها اجازه می‌دهد فیلتر سمت پایتون باشد (مستند).
        """
        stmt = select(StaffAssignment).where(
            StaffAssignment.user_id == user_id,
            StaffAssignment.is_active == True,  # noqa: E712
        ).order_by(col(StaffAssignment.venue_id))
        rows = list(self.session.exec(stmt).all())
        if codes is None:
            return [r.venue_id for r in rows]
        wanted = set(codes)
        return [r.venue_id for r in rows if wanted & set(r.permission_codes())]

    def deactivate(self, assignment_id: int) -> Optional[StaffAssignment]:
        obj = self.get_by_id(assignment_id)
        if not obj:
            return None
        obj.is_active = False
        obj.removed_at = datetime.now(timezone.utc)
        obj.updated_at = obj.removed_at
        self.session.add(obj)
        self.session.flush()
        self.session.refresh(obj)
        return obj


class SecurityAuditEventRepository(BaseRepository[SecurityAuditEvent]):

    def __init__(self, session: Session):
        super().__init__(SecurityAuditEvent, session)

    def log(self, action: str, actor_id: Optional[int] = None, *,
            target_type: Optional[str] = None, target_id: Optional[int] = None,
            venue_id: Optional[int] = None, data: Optional[dict] = None,
            ip: Optional[str] = None) -> SecurityAuditEvent:
        return self.create({
            "action": action,
            "actor_id": actor_id,
            "target_type": target_type,
            "target_id": target_id,
            "venue_id": venue_id,
            "data": json.dumps(data or {}, ensure_ascii=False, default=str),
            "ip": ip,
        })

    def list_events(self, venue_ids: Optional[List[int]] = None, action: Optional[str] = None,
                    limit: int = 50, offset: int = 0) -> Tuple[List[SecurityAuditEvent], int]:
        conds = []
        if venue_ids is not None:
            if not venue_ids:
                return [], 0
            conds.append(col(SecurityAuditEvent.venue_id).in_(venue_ids))
        if action:
            conds.append(SecurityAuditEvent.action == action)
        stmt = select(SecurityAuditEvent)
        count_stmt = select(sa_func.count()).select_from(SecurityAuditEvent)
        if conds:
            stmt = stmt.where(*conds)
            count_stmt = count_stmt.where(*conds)
        total = int(self.session.exec(count_stmt).one() or 0)
        stmt = stmt.order_by(col(SecurityAuditEvent.created_at).desc(),
                             col(SecurityAuditEvent.id).desc()).offset(offset).limit(limit)
        return list(self.session.exec(stmt).all()), total