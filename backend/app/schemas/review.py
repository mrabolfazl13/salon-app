from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class ReviewCreate(BaseModel):
    venue_id: int
    rating: int = Field(..., ge=1, le=5, description="امتیاز ۱ تا ۵")
    comment: Optional[str] = Field(default=None, max_length=1000)

class ReviewResponse(BaseModel):
    id: int
    venue_id: int
    user_id: int
    rating: int
    comment: Optional[str]
    created_at: datetime

    # اطلاعات تکمیلی برای نمایش بهتر (نام کاربر و سالن)
    user_name: Optional[str] = None
    venue_name: Optional[str] = None

    class Config:
        from_attributes = True

class VenueRatingSummary(BaseModel):
    venue_id: int
    average_rating: float
    total_reviews: int
