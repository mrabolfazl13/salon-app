# backend/app/api/v1/eitaa.py
"""تنظیمات کانال ایتای سالن توسط مدیر سالن.

مدیر ابتدا کانال را در ایتا میسازد و ربات ایتایار را ادمین آن میکند؛ سپس
chat_id و توکن پنل ایتایار را اینجا ثبت میکند. توکن هرگز در پاسخ API برگردانده
نمیشود.
"""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, ConfigDict, Field
from sqlmodel import select

from app.models.eitaa import EitaaChannel
from app.models.user import User
from app.services.eitaa_service import EitaaError, publish_schedule, today_tehran
from app.unit_of_work import UnitOfWork, get_unit_of_work
from app.utils.auth import get_current_user
from app.utils.permissions import Perm
from app.utils.staff_access import ensure_venue_permission
from app.utils.token_crypto import encrypt_token

router = APIRouter(prefix="/venues", tags=["Eitaa Channel"])

_ACCESS = [Perm.SLOT_GENERATE]  # مالک/سرپرست pass-through؛ کارکنان با این کد


class EitaaChannelUpsert(BaseModel):
    chat_id: str = Field(min_length=1, max_length=128,
                         description="شناسه یا username کانال (با یا بدون @)")
    bot_token: Optional[str] = Field(default=None, max_length=512,
                                     description="توکن API پنل ایتایار؛ خالی = حفظ توکن قبلی")
    is_active: bool = True
    pin_updates: bool = True


class EitaaChannelOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    venue_id: int
    chat_id: str
    is_active: bool
    pin_updates: bool
    last_post_date: Optional[date] = None
    last_message_id: Optional[int] = None
    last_error: Optional[str] = None


def _get_channel(uow: UnitOfWork, venue_id: int) -> Optional[EitaaChannel]:
    return uow.session.exec(
        select(EitaaChannel).where(EitaaChannel.venue_id == venue_id)
    ).first()


def _require_channel(uow: UnitOfWork, venue_id: int) -> EitaaChannel:
    channel = _get_channel(uow, venue_id)
    if channel is None:
        raise HTTPException(status_code=404, detail="کانال ایتا برای این سالن تنظیم نشده است")
    return channel


@router.get("/{venue_id}/eitaa-channel", response_model=EitaaChannelOut)
def get_eitaa_channel(
    venue_id: int,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    venue = ensure_venue_permission(uow, current_user, venue_id, _ACCESS, request,
                                    denial_action="eitaa.channel.view")
    return _require_channel(uow, venue.id)


@router.put("/{venue_id}/eitaa-channel", response_model=EitaaChannelOut)
def upsert_eitaa_channel(
    venue_id: int,
    data: EitaaChannelUpsert,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    venue = ensure_venue_permission(uow, current_user, venue_id, _ACCESS, request,
                                    denial_action="eitaa.channel.upsert")
    chat_id = data.chat_id.strip().lstrip("@")
    if not chat_id:
        raise HTTPException(status_code=400, detail="chat_id نمیتواند خالی باشد")

    channel = _get_channel(uow, venue.id)
    token_value = (data.bot_token or "").strip()
    if channel is None and not token_value:
        raise HTTPException(status_code=400, detail="برای اتصال جدید توکن ایتایار لازم است")

    values = {
        "chat_id": chat_id,
        "is_active": data.is_active,
        "pin_updates": data.pin_updates,
    }
    if token_value:
        values["bot_token"] = encrypt_token(token_value)

    if channel is None:
        channel = EitaaChannel(venue_id=venue.id, **values)
        uow.session.add(channel)
    else:
        for key, value in values.items():
            setattr(channel, key, value)
    uow.commit()
    uow.session.refresh(channel)
    return channel


@router.delete("/{venue_id}/eitaa-channel", status_code=204)
def delete_eitaa_channel(
    venue_id: int,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    venue = ensure_venue_permission(uow, current_user, venue_id, _ACCESS, request,
                                    denial_action="eitaa.channel.delete")
    channel = _get_channel(uow, venue.id)
    if channel is not None:
        uow.session.delete(channel)
        uow.commit()
    return Response(status_code=204)


@router.post("/{venue_id}/eitaa-channel/post-now")
def post_eitaa_schedule_now(
    venue_id: int,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """ارسال دستی جدول امروز — برای تست تنظیمات بدون انتظار تا فردا صبح."""
    venue = ensure_venue_permission(uow, current_user, venue_id, _ACCESS, request,
                                    denial_action="eitaa.channel.post_now")
    channel = _require_channel(uow, venue.id)
    day = today_tehran()
    try:
        return publish_schedule(uow, venue.id, day=day, is_update=channel.last_post_date == day)
    except EitaaError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
