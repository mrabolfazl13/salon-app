"""اعلان کاربران: لیست/شمارش خوانده‌نشده/تعیین وضعیت خوانده‌شده + توکن FCM."""
from fastapi import APIRouter, Depends, HTTPException, Query
from app.unit_of_work import UnitOfWork, get_unit_of_work
from app.models.user import User
from app.schemas.notification import NotificationResponse, UnreadCountResponse
from app.utils.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/notifications", tags=["Notifications"])


class FCMTokenRequest(BaseModel):
    fcm_token: str


@router.get("/", response_model=list[NotificationResponse])
def list_notifications(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    """اعلان‌های خود کاربر، جدیدترین در اول."""
    items = uow.notifications.get_by_user(
        current_user.id, limit=limit, offset=offset, unread_only=unread_only
    )
    # تبدیل به schema همین‌جا: بعد از بسته‌شدن session اینستنس‌ها قابل‌خواندن نیستند
    return [NotificationResponse.model_validate(n) for n in items]


@router.get("/unread-count", response_model=UnreadCountResponse)
def unread_count(
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    """تعداد اعلان‌های خوانده‌نشدهٔ خود کاربر."""
    return UnreadCountResponse(count=uow.notifications.get_unread_count(current_user.id))


@router.put("/read-all", response_model=UnreadCountResponse)
def mark_all_read(
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    """همهٔ اعلان‌های خود کاربر را خوانده‌شده می‌کند؛ تعداد تغییر‌یافته را برمی‌گرداند."""
    return UnreadCountResponse(count=uow.notifications.mark_all_as_read(current_user.id))


@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    notif = uow.notifications.mark_as_read(notification_id, current_user.id)
    if not notif:
        raise HTTPException(status_code=404, detail="اعلان یافت نشد.")
    return NotificationResponse.model_validate(notif)


@router.post("/users/me/fcm-token")
def register_fcm_token(
    body: FCMTokenRequest,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    """Register or update user's FCM token for push notifications."""
    user = uow.session.get(User, current_user.id)
    user.fcm_token = body.fcm_token
    uow.session.add(user)

    return {"message": "FCM token registered successfully"}


@router.delete("/users/me/fcm-token")
def unregister_fcm_token(
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    """Remove user's FCM token (e.g., on logout)."""
    user = uow.session.get(User, current_user.id)
    user.fcm_token = None
    uow.session.add(user)

    return {"message": "FCM token removed successfully"}
