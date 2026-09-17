# backend/app/repositories/coupon_repository.py
from sqlmodel import Session, select, func, or_
from datetime import datetime, timezone
from typing import List, Optional

from app.models.coupon import Coupon, CouponRedemption
from app.repositories.base import BaseRepository


def normalize_code(code: str) -> str:
    """یکپارچه‌سازی کد — یکتایی case-insensitive با ذخیره‌ی upper."""
    return (code or "").strip().upper()


class CouponRepository(BaseRepository[Coupon]):

    def __init__(self, session: Session):
        super().__init__(Coupon, session)

    def get_by_code(self, code: str) -> Optional[Coupon]:
        stmt = select(Coupon).where(Coupon.code == normalize_code(code))
        return self.session.exec(stmt).first()

    def list_scope(self, venue_ids: Optional[List[int]]) -> List[Coupon]:
        """venue_ids=None ⇒ همه (super_admin)؛ لیست ⇒ کوپن‌های آن سالن‌ها + سراسری."""
        stmt = select(Coupon)
        if venue_ids is not None:
            if not venue_ids:
                stmt = stmt.where(Coupon.venue_id == None)  # noqa: E711
            else:
                stmt = stmt.where(or_(Coupon.venue_id.in_(venue_ids),
                                      Coupon.venue_id == None))  # noqa: E711
        return list(self.session.exec(stmt.order_by(Coupon.id.desc())).all())

    def user_redemption_count(self, coupon_id: int, user_id: int) -> int:
        stmt = select(func.count()).select_from(CouponRedemption).where(
            CouponRedemption.coupon_id == coupon_id,
            CouponRedemption.user_id == user_id,
        )
        return int(self.session.exec(stmt).one())

    def bump_uses(self, coupon_id: int, delta: int = 1) -> Optional[Coupon]:
        """تغییر uses_count؛ کف صفر رعایت می‌شود (آزادسازی بیش‌ازحد ممکن نکند)."""
        coupon = self.get_by_id(coupon_id)
        if coupon is None:
            return None
        coupon.uses_count = max(0, coupon.uses_count + delta)
        coupon.updated_at = datetime.now(timezone.utc)
        self.session.add(coupon)
        self.session.flush()
        return coupon


class CouponRedemptionRepository(BaseRepository[CouponRedemption]):

    def __init__(self, session: Session):
        super().__init__(CouponRedemption, session)

    def get_by_booking(self, booking_id: int) -> Optional[CouponRedemption]:
        stmt = select(CouponRedemption).where(CouponRedemption.booking_id == booking_id)
        return self.session.exec(stmt).first()

    def get_by_ids(self, ids: List[int]) -> List[CouponRedemption]:
        if not ids:
            return []
        stmt = select(CouponRedemption).where(CouponRedemption.id.in_(ids))
        return list(self.session.exec(stmt).all())