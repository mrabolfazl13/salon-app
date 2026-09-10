from sqlmodel import Session, select, func, update as sql_update
from typing import List, Optional

from app.models.notification import Notification
from app.repositories.base import BaseRepository


class NotificationRepository(BaseRepository[Notification]):

    def __init__(self, session: Session):
        super().__init__(Notification, session)

    def get_by_user(self, user_id: int, limit: int = 50, offset: int = 0,
                    unread_only: bool = False) -> List[Notification]:
        stmt = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            stmt = stmt.where(Notification.is_read == False)  # noqa: E712
        stmt = stmt.order_by(Notification.created_at.desc()).offset(offset).limit(limit)
        return list(self.session.exec(stmt).all())

    def get_unread_count(self, user_id: int) -> int:
        stmt = select(func.count()).select_from(Notification).where(
            Notification.user_id == user_id,
            Notification.is_read == False  # noqa: E712
        )
        return self.session.exec(stmt).one()

    def mark_as_read(self, notification_id: int, user_id: int) -> Optional[Notification]:
        notif = self.session.get(Notification, notification_id)
        if not notif or notif.user_id != user_id:
            return None
        if not notif.is_read:
            notif.is_read = True
            self.session.add(notif)
            self.session.flush()
            self.session.refresh(notif)
        return notif

    def mark_all_as_read(self, user_id: int) -> int:
        stmt = (
            sql_update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read == False)  # noqa: E712
            .values(is_read=True)
        )
        result = self.session.exec(stmt)
        self.session.flush()
        return result.rowcount or 0
