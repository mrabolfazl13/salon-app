# backend/app/repositories/venue_repository.py
from sqlmodel import Session, select, or_, func
from typing import Optional, List, Tuple
from math import radians, sin, cos, sqrt, atan2
from app.models.venue import Venue, Club
from app.repositories.base import BaseRepository
import json

class VenueRepository(BaseRepository[Venue]):
    
    def __init__(self, session: Session):
        super().__init__(Venue, session)
    
    def get_by_manager(self, manager_id: int) -> List[Venue]:
        return self.get_all(manager_id=manager_id)
    
    def get_by_club(self, club_id: int) -> List[Venue]:
        return self.get_all(club_id=club_id)
    
    def get_verified_venues(self) -> List[Venue]:
        return self.get_all(is_verified=True)
    
    def get_pending_venues(self) -> List[Venue]:
        return self.get_all(is_verified=False)
    
    def search_by_name_or_address(self, query: str, limit: int = 20) -> List[Venue]:
        statement = select(Venue).where(
            or_(
                Venue.name.contains(query),
                Venue.address.contains(query)
            )
        ).limit(limit)
        return self.session.exec(statement).all()
    
    def get_nearby_venues(self, lat: float, lng: float, radius_km: float = 5) -> List[Tuple[Venue, float]]:
        """پیدا کردن سالن‌های نزدیک با شعاع مشخص"""
        results = []
        venues = self.get_verified_venues()
        
        for venue in venues:
            distance = self._calculate_distance(lat, lng, venue.latitude, venue.longitude)
            if distance <= radius_km:
                results.append((venue, distance))
        
        results.sort(key=lambda x: x[1])
        return results
    
    @staticmethod
    def _calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        R = 6371
        lat1, lng1, lat2, lng2 = map(radians, [lat1, lng1, lat2, lng2])
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlng/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        return R * c
    
    def get_amenities_stats(self) -> dict:
        """آمار امکانات موجود در سالن‌ها"""
        venues = self.get_all()
        amenities_count = {}
        
        for venue in venues:
            try:
                amenities = json.loads(venue.amenities) if venue.amenities else []
                for amenity in amenities:
                    amenities_count[amenity] = amenities_count.get(amenity, 0) + 1
            except:
                pass
        
        return amenities_count
    
    def verify_venue(self, venue_id: int) -> Optional[Venue]:
        return self.update(venue_id, {"is_verified": True})
    
    def unverify_venue(self, venue_id: int) -> Optional[Venue]:
        return self.update(venue_id, {"is_verified": False})

class ClubRepository(BaseRepository[Club]):
    
    def __init__(self, session: Session):
        super().__init__(Club, session)
    
    def get_by_owner(self, owner_id: int) -> List[Club]:
        return self.get_all(owner_id=owner_id)
