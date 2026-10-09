"""FCM Push Notification endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.unit_of_work import UnitOfWork, get_unit_of_work
from app.models.user import User
from app.utils.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/notifications", tags=["Notifications"])


class FCMTokenRequest(BaseModel):
    fcm_token: str


@router.post("/users/me/fcm-token")
def register_fcm_token(
    body: FCMTokenRequest,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    """Register or update user's FCM token for push notifications."""
    with uow:
        # Update user's FCM token
        current_user.fcm_token = body.fcm_token
        uow.session.add(current_user)
        uow.commit()

    return {"message": "FCM token registered successfully"}


@router.delete("/users/me/fcm-token")
def unregister_fcm_token(
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    """Remove user's FCM token (e.g., on logout)."""
    with uow:
        current_user.fcm_token = None
        uow.session.add(current_user)
        uow.commit()

    return {"message": "FCM token removed successfully"}
