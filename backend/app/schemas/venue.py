# backend/app/schemas/venue.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
import json

# موبایل (09XXXXXXXXX) یا تلفن ثابت (0XX-XXXXXXX / 0XXXXXXXXX)
PHONE_PATTERN = r"^0(9[0-9]{9}|2[0-9]-?[0-9]{7,8})$"

class VenueBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    category: str = Field(default="futsal", description="نوع مجموعه: futsal | gym")
    address: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    phone: Optional[str] = Field(default=None, pattern=PHONE_PATTERN, description="شماره تماس (اختیاری — در صورت عدم اطلاع)")
    description: Optional[str] = None
    amenities: List[str] = Field(default_factory=list)
    images: List[str] = Field(default_factory=list)
    price: Optional[int] = Field(default=None, description="قیمت هر جلسه (حداقل قیمت)")

class VenueCreate(VenueBase):
    pass

class VenueResponse(VenueBase):
    id: int
    is_verified: bool
    manager_id: int
    club_id: Optional[int]
    created_at: datetime
    average_rating: float = 0.0
    total_reviews: int = 0
    
    class Config:
        from_attributes = True
        
    @classmethod
    def from_orm_with_json(cls, venue, min_price: int = None, average_rating: float = 0.0, total_reviews: int = 0):
        """تبدیل مدل با JSON fields به List"""
        data = {
            "id": venue.id,
            "name": venue.name,
            "category": venue.category,
            "address": venue.address,
            "latitude": venue.latitude,
            "longitude": venue.longitude,
            "phone": venue.phone,
            "description": venue.description,
            "is_verified": venue.is_verified,
            "manager_id": venue.manager_id,
            "club_id": venue.club_id,
            "created_at": venue.created_at,
            "price": min_price or 0,
            "average_rating": average_rating or 0.0,
            "total_reviews": total_reviews or 0,
        }
        
        # تبدیل JSON string به List
        if venue.amenities:
            try:
                data["amenities"] = json.loads(venue.amenities)
            except (json.JSONDecodeError, TypeError):
                data["amenities"] = []
        else:
            data["amenities"] = []
            
        if venue.images:
            try:
                data["images"] = json.loads(venue.images)
            except (json.JSONDecodeError, TypeError):
                data["images"] = []
        else:
            data["images"] = []
            
        return cls(**data)
