from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from typing import List
import json

from app.database import get_session
from app.schemas.notification import NotificationResponse, UnreadCountResponse
from app.repositories.notification_repository import NotificationRepository
from app.utils.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def _to_response(n) -> NotificationResponse:
    data = None
    if n.data:
        try:
            data = json.loads(n.data)
        except Exception:
            data = None
    return NotificationResponse(
        id=n.id,
        user_id=n.user_id,
        title=n.title,
        message=n.message,
        data=data,
        type=n.type,
        is_read=n.is_read,
        created_at=n.created_at,
    )


@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    unread_only: bool = False,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """دریافت لیست اعلان‌های کاربر جاری"""
    repo = NotificationRepository(session)
    notifications = repo.get_by_user(current_user.id, limit=limit, offset=offset, unread_only=unread_only)
    return [_to_response(n) for n in notifications]


@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """تعداد اعلان‌های خوانده‌نشده"""
    repo = NotificationRepository(session)
    return UnreadCountResponse(count=repo.get_unread_count(current_user.id))


@router.put("/read-all", response_model=dict)
def mark_all_as_read(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """علامت‌گذاری همه اعلان‌ها به عنوان خوانده‌شده"""
    repo = NotificationRepository(session)
    updated = repo.mark_all_as_read(current_user.id)
    session.commit()
    return {"message": "همه اعلان‌ها خوانده شد", "updated": updated}


@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_as_read(
    notification_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """علامت‌گذاری یک اعلان به عنوان خوانده‌شده"""
    repo = NotificationRepository(session)
    notif = repo.mark_as_read(notification_id, current_user.id)
    if not notif:
        raise HTTPException(status_code=404, detail="اعلان یافت نشد")
    session.commit()
    return _to_response(notif)
