# backend/app/api/v1/venues.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from typing import List, Optional
import json
from datetime import date

from app.database import get_session
from app.unit_of_work import get_unit_of_work, UnitOfWork
from app.schemas.venue import VenueCreate, VenueResponse
from app.repositories.venue_repository import VenueRepository, ClubRepository
from app.repositories.slot_repository import SlotRepository
from app.utils.auth import get_current_user, get_current_manager, get_current_admin
from app.models.user import User, UserRole
from app.models.venue import Venue
from app.models.slot import SlotStatus
from app.services.notification_service import notification_service

router = APIRouter(prefix="/venues", tags=["Venues"])

def get_venue_min_price(session: Session, venue_id: int) -> int:
    """محاسبه حداقل قیمت سانس‌های موجود یک سالن"""
    slot_repo = SlotRepository(session)
    
    # گرفتن سانس‌های موجود برای امروز و ۳ روز آینده
    today = date.today()
    slots = slot_repo.get_by_venue_and_date_range(
        venue_id, 
        today, 
        today
    )
    
    # فیلتر سانس‌های آزاد
    available_slots = [s for s in slots if s.status == SlotStatus.AVAILABLE]
    
    if available_slots:
        return min(s.current_price for s in available_slots)
    
    # اگر سانس آزاد نبود، از سانس‌های رزرو شده قیمت بگیر
    booked_slots = [s for s in slots if s.status == SlotStatus.BOOKED]
    if booked_slots:
        return min(s.current_price for s in booked_slots)
    
    return 0

@router.get("/", response_model=List[VenueResponse])
def get_venues(
    latitude: Optional[float] = Query(None, description="عرض جغرافیایی"),
    longitude: Optional[float] = Query(None, description="طول جغرافیایی"),
    radius: float = Query(5.0, description="شعاع جستجو بر حسب کیلومتر"),
    is_verified: Optional[bool] = Query(None, description="فقط سالن‌های تایید شده"),
    search: Optional[str] = Query(None, description="جستجو بر اساس نام یا آدرس"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session)
):
    """لیست همه سالن‌ها با قابلیت فیلتر و جستجو"""
    venue_repo = VenueRepository(session)
    
    # جستجوی نزدیک‌ترین سالن‌ها
    if latitude and longitude:
        venues_with_distance = venue_repo.get_nearby_venues(latitude, longitude, radius)
        venues = [v for v, d in venues_with_distance]
        # محاسبه قیمت برای هر سالن
        result = []
        for v in venues[:limit]:
            min_price = get_venue_min_price(session, v.id)
            result.append(VenueResponse.from_orm_with_json(v, min_price))
        return result
    
    # جستجوی متنی
    if search:
        venues = venue_repo.search_by_name_or_address(search, limit)
        result = []
        for v in venues:
            min_price = get_venue_min_price(session, v.id)
            result.append(VenueResponse.from_orm_with_json(v, min_price))
        return result
    
    # فیلتر ساده
    filters = {}
    if is_verified is not None:
        filters["is_verified"] = is_verified
    
    venues = venue_repo.get_all(limit=limit, offset=offset, **filters)
    result = []
    for v in venues:
        min_price = get_venue_min_price(session, v.id)
        result.append(VenueResponse.from_orm_with_json(v, min_price))
    return result

@router.get("/{venue_id}", response_model=VenueResponse)
def get_venue(
    venue_id: int,
    session: Session = Depends(get_session)
):
    """جزئیات یک سالن با قیمت"""
    venue_repo = VenueRepository(session)
    venue = venue_repo.get_by_id(venue_id)
    
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    min_price = get_venue_min_price(session, venue_id)
    return VenueResponse.from_orm_with_json(venue, min_price)

@router.post("/", response_model=VenueResponse)
def create_venue(
    venue_data: VenueCreate,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_manager)
):
    """ایجاد سالن جدید - فقط مدیران سالن"""
    # Check if user already has a venue
    existing_venues = uow.venues.get_by_manager_id(current_user.id)
    if existing_venues:
        raise HTTPException(status_code=400, detail="شما قبلاً یک سالن ایجاد کرده‌اید")
    
    venue = uow.venues.create({
        "name": venue_data.name,
        "address": venue_data.address,
        "latitude": venue_data.latitude,
        "longitude": venue_data.longitude,
        "phone": venue_data.phone,
        "description": venue_data.description,
        "amenities": json.dumps(venue_data.amenities),
        "images": json.dumps(venue_data.images),
        "manager_id": current_user.id,
    })
    
    uow.commit()
    
    min_price = get_venue_min_price(uow.session, venue.id)
    return VenueResponse.from_orm_with_json(venue, min_price)

@router.get("/my-venues", response_model=List[VenueResponse])
def get_my_venues(
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_manager)
):
    """لیست سالن‌های مدیر"""
    venues = uow.venues.get_by_manager_id(current_user.id)
    result = []
    for v in venues:
        min_price = get_venue_min_price(uow.session, v.id)
        result.append(VenueResponse.from_orm_with_json(v, min_price))
    return result

@router.put("/{venue_id}", response_model=VenueResponse)
def update_venue(
    venue_id: int,
    venue_data: VenueCreate,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_manager)
):
    """ویرایش سالن - فقط مدیر سالن"""
    venue = uow.venues.get_by_id(venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    if venue.manager_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = {
        "name": venue_data.name,
        "address": venue_data.address,
        "latitude": venue_data.latitude,
        "longitude": venue_data.longitude,
        "phone": venue_data.phone,
        "description": venue_data.description,
        "amenities": json.dumps(venue_data.amenities),
        "images": json.dumps(venue_data.images),
    }
    
    uow.venues.update(venue_id, update_data)
    uow.commit()
    
    min_price = get_venue_min_price(uow.session, venue_id)
    return VenueResponse.from_orm_with_json(venue, min_price)

@router.post("/{venue_id}/verify")
def verify_venue(
    venue_id: int,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_admin)
):
    """تایید سالن - فقط ادمین"""
    venue = uow.venues.get_by_id(venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    uow.venues.update(venue_id, {"is_verified": True})
    uow.commit()
    
    return {"message": "Venue verified successfully"}

@router.post("/{venue_id}/prices")
def set_venue_prices(
    venue_id: int,
    prices: dict,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_manager)
):
    """قیمت‌گذاری سانس‌های سالن - فقط مدیر سالن"""
    venue = uow.venues.get_by_id(venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    if venue.manager_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # prices format: {"17:00": 300000, "18:30": 350000, ...}
    # Update prices for slots on this venue
    from app.models.slot import Slot
    from sqlmodel import select
    from datetime import date
    
    # Get all slots for this venue
    statement = select(Slot).where(Slot.venue_id == venue_id)
    slots = uow.session.exec(statement).all()
    
    for slot in slots:
        slot_time = slot.start_time.strftime("%H:%M")
        if slot_time in prices:
            price = int(prices[slot_time])
            slot.base_price = price
            slot.current_price = price
    
    uow.commit()
    
    return {"message": f"Prices updated for {len(slots)} slots"}

@router.get("/{venue_id}/prices")
def get_venue_prices(
    venue_id: int,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_manager)
):
    """دریافت قیمت‌های سالن - فقط مدیر سالن"""
    venue = uow.venues.get_by_id(venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    if venue.manager_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    from app.models.slot import Slot
    from sqlmodel import select
    
    statement = select(Slot).where(Slot.venue_id == venue_id)
    slots = uow.session.exec(statement).all()
    
    prices = {}
    for slot in slots:
        slot_time = slot.start_time.strftime("%H:%M")
        if slot_time not in prices:
            prices[slot_time] = {
                "base_price": slot.base_price,
                "current_price": slot.current_price
            }
    
    return {"prices": prices}
