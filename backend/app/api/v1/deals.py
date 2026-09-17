# backend/app/api/v1/deals.py
"""بازار سانس‌های لحظه آخری — اهرم درآمد اشغال.

- مدیر روی سانس‌های AVAILABLE آینده دیل منتشر می‌کند (تخفیف درصدی یا قیمت دستی)؛
  اعتبارسنجی: آینده + آزاد + غیرقراردادی + کف قیمت و حتماً ارزان‌تر از قیمت قوانین.
- فهرست عمومیِ دیل‌های فعال با فیلتر مکان/قیمت/بازه زمانی/مرتب‌سازی.
- رزروِ سانس دیل همان قفل FOR UPDATE مسیر رزرو است ⇒ without oversell؛
  پس از تأیید رزرو، سانس از بازار خارج می‌شود (confirm_pending).
- اعلان fan-out: فقط کاربرانی که این سالن را favorite کرده‌اند و
  notify_deals=true دارند (NotificationService).
"""
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel import select

from app.database import get_session
from app.unit_of_work import get_unit_of_work, UnitOfWork
from app.models.slot import Slot, SlotStatus
from app.models.user import User
from app.models.venue import Venue
from app.repositories.venue_repository import VenueRepository
from app.schemas.deal import DealAvailableItem, DealPublishRequest, DealPublishResponse
from app.services.notification_service import notification_service
from app.services.pricing_service import PricingService
from app.utils.auth import get_current_user
from app.utils.permissions import Perm
from app.utils.staff_access import ensure_venue_permission, log_security_event
from app.utils.time_guard import is_past_slot

router = APIRouter(prefix="/deals", tags=["Deals"])

_TIME_BUCKETS = (("morning", 0, 12), ("afternoon", 12, 18), ("evening", 18, 24))


def _time_bucket(hour: int) -> str:
    for name, lo, hi in _TIME_BUCKETS:
        if lo <= hour < hi:
            return name
    return "evening"


@router.post("/publish", response_model=DealPublishResponse)
async def publish_deal(
    data: DealPublishRequest,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    venue = ensure_venue_permission(uow, current_user, data.venue_id,
                                    [Perm.DEAL_PUBLISH], request)
    if data.discount_percent and data.deal_price:
        raise HTTPException(
            status_code=400, detail="فقط یکی از discount_percent یا deal_price")
    if not data.discount_percent and not data.deal_price:
        raise HTTPException(
            status_code=400, detail="باید discount_percent یا deal_price داده شود")
    if not data.slot_ids and not (data.date_from and data.date_to):
        raise HTTPException(
            status_code=400, detail="slot_ids یا بازه تاریخ (date_from/date_to) الزامی است")

    skipped = 0
    if data.slot_ids:
        slots = uow.slots.get_by_ids(data.slot_ids)
        if len(slots) != len(data.slot_ids):
            raise HTTPException(status_code=404, detail="برخی سانس‌ها یافت نشدند")
        explicit = True
    else:
        if data.date_from > data.date_to:
            raise HTTPException(status_code=400, detail="بازه تاریخ نامعتبر است")
        slots = []
        d = data.date_from
        while d <= data.date_to:
            slots.extend(uow.slots.get_by_venue_and_date(data.venue_id, d))
            d += timedelta(days=1)
        explicit = False

    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=data.expires_in_minutes)
                  if data.expires_in_minutes else None)

    published: List[int] = []
    errors: List[str] = []
    for slot in slots:
        if slot.venue_id != data.venue_id:
            if explicit:
                raise HTTPException(status_code=400, detail="برخی سانس‌ها متعلق به این سالن نیستند")
            skipped += 1
            continue
        reason = None
        if is_past_slot(slot.slot_date, slot.start_time):
            reason = "سانس گذشته است"
        elif slot.status != SlotStatus.AVAILABLE:
            reason = "سانس آزاد نیست"
        elif slot.is_contract_slot:
            reason = "سانس متعلق به قرارداد است"
        if reason:
            if explicit:
                errors.append(f"سانس {slot.id}: {reason}")
                continue
            skipped += 1
            continue
        rule_price, _ = PricingService.resolve_price(
            uow.session, slot.venue_id, slot.slot_date, slot.start_time,
            base_price=slot.base_price, duration=slot.duration or 90)
        price = int(data.deal_price) if data.deal_price else int(round(
            rule_price * (10000 - int(data.discount_percent) * 100) / 10000))
        price = max(price, 1)  # کف قیمت ۱ ریال
        if price >= rule_price:
            if explicit:
                errors.append(f"سانس {slot.id}: قیمت دیل باید از قیمت مصوب کمتر باشد")
                continue
            skipped += 1
            continue
        obj = uow.slots.get_by_id(slot.id)
        obj.is_deal = True
        obj.deal_price = price
        obj.deal_expires_at = expires_at
        uow.session.add(obj)
        published.append(slot.id)

    if explicit and errors:
        raise HTTPException(status_code=400, detail="؛ ".join(errors))
    if not published:
        raise HTTPException(status_code=400, detail="هیچ سانس واجد شرایطی برای انتشار دیل وجود نداشت")
    log_security_event(uow, "deal.published", current_user.id,
                       target_type="venue", target_id=venue.id, venue_id=venue.id,
                       data={"published": len(published), "slot_ids": published[:50]},
                       request=request)
    uow.commit()

    # fan-out اعلان — فقط مشترکین دیلِ همان سالن
    subscriber_ids = uow.favorites.user_ids_subscribed_for(venue.id)
    first = uow.slots.get_by_id(published[0])
    for uid in subscriber_ids:
        await notification_service.send_to_user(
            uid,
            title="🔥 سانس لحظه آخری با تخفیف",
            message=f"{venue.name} برای {first.slot_date} ساعت {first.start_time} "
                    f"سانس تخفیفی {first.deal_price:,} ریالی منتشر کرد.",
            data={"venue_id": venue.id, "slot_ids": published,
                  "deal_count": len(published)},
            notif_type="deal",
        )
    return DealPublishResponse(published=len(published), skipped=skipped,
                               slot_ids=published, deal_expires_at=expires_at)


@router.get("/subscription")
def get_deal_subscription(
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    return {"notify_deals": bool(current_user.notify_deals)}


@router.put("/subscription")
def set_deal_subscription(
    enabled: bool = Query(...),
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """اشتراک اعلان سانس‌های لحظه آخری — fan-out فقط favorite ∧ مشترک."""
    user = uow.users.get_by_id(current_user.id)
    user.notify_deals = enabled
    uow.session.add(user)
    uow.commit()
    return {"notify_deals": enabled}


@router.delete("/{slot_id}/unpublish")
def unpublish_deal(
    slot_id: int,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    slot = uow.slots.get_by_id(slot_id)
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    ensure_venue_permission(uow, current_user, slot.venue_id,
                            [Perm.DEAL_PUBLISH], request)
    if not slot.is_deal:
        raise HTTPException(status_code=400, detail="این سانس دیل فعالی ندارد")
    log_security_event(uow, "deal.unpublished", current_user.id,
                       target_type="slot", target_id=slot.id, venue_id=slot.venue_id,
                       request=request)
    # BaseRepository.update مقدار None را نادیده می‌گیرد ⇒ نوشتن مستقیم
    slot.is_deal = False
    slot.deal_price = None
    slot.deal_expires_at = None
    uow.session.add(slot)
    uow.commit()
    return {"message": "Deal unpublished", "slot_id": slot_id}


@router.get("/available", response_model=List[DealAvailableItem])
def list_available_deals(
    near_lat: Optional[float] = Query(None),
    near_lng: Optional[float] = Query(None),
    radius_km: float = Query(50.0, gt=0, le=500),
    max_price: Optional[int] = Query(None, gt=0),
    venue_id: Optional[int] = Query(None, ge=1, description="فیلتر دقیق سالن"),
    time_of_day: Optional[str] = Query(None, pattern="^(morning|afternoon|evening)$"),
    sort: str = Query("time", pattern="^(price_asc|price_desc|distance|time)$"),
    limit: int = Query(50, ge=1, le=200),
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """دیل‌های فعال سراسری — AVAILABLE، آینده، منقضی‌نشده و واقعاً ارزان‌تر."""
    now = datetime.now(timezone.utc)
    today = date.today()
    stmt = select(Slot, Venue).join(
        Venue, Slot.venue_id == Venue.id
    ).where(
        Slot.is_deal == True,  # noqa: E712
        Slot.status == SlotStatus.AVAILABLE,
        Slot.slot_date >= today,
    )
    if venue_id is not None:
        stmt = stmt.where(Slot.venue_id == venue_id)
    stmt = stmt.limit(1000)
    items: List[DealAvailableItem] = []
    for slot, venue in uow.session.exec(stmt).all():
        if is_past_slot(slot.slot_date, slot.start_time):
            continue
        if not PricingService.deal_active(slot, now):
            continue
        if max_price is not None and slot.deal_price > max_price:
            continue
        if time_of_day and _time_bucket(slot.start_time.hour) != time_of_day:
            continue
        distance = None
        if near_lat is not None and near_lng is not None:
            distance = VenueRepository._calculate_distance(
                near_lat, near_lng, venue.latitude, venue.longitude)
            if distance > radius_km:
                continue
        original, _ = PricingService.resolve_price(
            uow.session, slot.venue_id, slot.slot_date, slot.start_time,
            base_price=slot.base_price, duration=slot.duration or 90)
        if slot.deal_price >= original:
            continue
        items.append(DealAvailableItem(
            slot_id=slot.id, venue_id=venue.id, venue_name=venue.name,
            slot_date=slot.slot_date, start_time=slot.start_time,
            duration=slot.duration, original_price=original,
            deal_price=slot.deal_price, savings=original - slot.deal_price,
            discount_percent=round((original - slot.deal_price) * 100 / original)
            if original else 0,
            deal_expires_at=slot.deal_expires_at, distance_km=distance,
        ))
    if sort == "price_asc":
        items.sort(key=lambda x: x.deal_price)
    elif sort == "price_desc":
        items.sort(key=lambda x: -x.deal_price)
    elif sort == "distance":
        items.sort(key=lambda x: (x.distance_km is None, x.distance_km or 0))
    else:
        items.sort(key=lambda x: (x.slot_date, x.start_time))
    return items[:limit]