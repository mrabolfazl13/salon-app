# backend/app/repositories/customer_repository.py
"""ریپازیتوری CRM — رکورد مشتریِ سالن و تاریخچه کمپین."""
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional

from sqlmodel import Session, col, select

from app.models.customer import CrmCampaign, VenueCustomer
from app.repositories.base import BaseRepository


class VenueCustomerRepository(BaseRepository[VenueCustomer]):

    def __init__(self, session: Session):
        super().__init__(VenueCustomer, session)

    def get_for(self, venue_id: int, user_id: int) -> Optional[VenueCustomer]:
        stmt = select(VenueCustomer).where(
            VenueCustomer.venue_id == venue_id, VenueCustomer.user_id == user_id)
        return self.session.exec(stmt).first()

    def list_by_venue(self, venue_id: int) -> List[VenueCustomer]:
        stmt = select(VenueCustomer).where(VenueCustomer.venue_id == venue_id)
        return list(self.session.exec(stmt).all())

    def list_by_user(self, user_id: int) -> List[VenueCustomer]:
        stmt = select(VenueCustomer).where(VenueCustomer.user_id == user_id)
        return list(self.session.exec(stmt).all())

    def consented_user_ids(self, venue_id: int) -> List[int]:
        stmt = select(VenueCustomer.user_id).where(
            VenueCustomer.venue_id == venue_id,
            VenueCustomer.marketing_consent == True,  # noqa: E712
        )
        return [int(x) for x in self.session.exec(stmt).all()]


class CrmCampaignRepository(BaseRepository[CrmCampaign]):

    def __init__(self, session: Session):
        super().__init__(CrmCampaign, session)

    def count_for_venue_on(self, venue_id: int, day: date) -> int:
        start = datetime(day.year, day.month, day.day, tzinfo=timezone.utc)
        end = start + timedelta(days=1)
        stmt = select(CrmCampaign).where(
            CrmCampaign.venue_id == venue_id,
            col(CrmCampaign.created_at) >= start,
            col(CrmCampaign.created_at) < end,
        )
        return len(list(self.session.exec(stmt).all()))

    def list_by_venue(self, venue_id: int, limit: int = 50, offset: int = 0
                      ) -> List[CrmCampaign]:
        stmt = (select(CrmCampaign)
                .where(CrmCampaign.venue_id == venue_id)
                .order_by(col(CrmCampaign.created_at).desc(), col(CrmCampaign.id).desc())
                .offset(offset).limit(limit))
        return list(self.session.exec(stmt).all())