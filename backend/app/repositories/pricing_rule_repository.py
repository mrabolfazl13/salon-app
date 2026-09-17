# backend/app/repositories/pricing_rule_repository.py
from sqlmodel import Session, select
from typing import List, Optional

from app.models.pricing_rule import PricingRule
from app.repositories.base import BaseRepository


class PricingRuleRepository(BaseRepository[PricingRule]):

    def __init__(self, session: Session):
        super().__init__(PricingRule, session)

    def get_active_for_venue(self, venue_id: int) -> List[PricingRule]:
        """قوانین فعال یک سالن — اولویت صعودی تا اعمالِ «بالاتر آخر/برنده» تضمینی باشد."""
        stmt = select(PricingRule).where(
            PricingRule.venue_id == venue_id,
            PricingRule.is_active == True,  # noqa: E712
        ).order_by(PricingRule.priority.asc(), PricingRule.id.asc())
        return list(self.session.exec(stmt).all())

    def list_for_venues(self, venue_ids: Optional[List[int]]) -> List[PricingRule]:
        stmt = select(PricingRule)
        if venue_ids is not None:
            if not venue_ids:
                return []
            stmt = stmt.where(PricingRule.venue_id.in_(venue_ids))
        return list(self.session.exec(stmt.order_by(PricingRule.venue_id, PricingRule.priority)).all())