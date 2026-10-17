# backend/app/repositories/coupon_repository.py
from sqlmodel import Session, select, func, or_
from sqlalchemy import insert, literal
from datetime import datetime, timezone
from typing import List, Optional

from app.models.coupon import Coupon, CouponRedemption, RedemptionStatus
from app.models.user import User
from app.repositories.base import BaseRepository

NULLABLE_COUPON_FIELDS = ("max_uses", "per_user_limit", "min_booking_amount",
                          "valid_from", "valid_until")


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
        """شمارشِ مصرفِ **زنده** — ردیفِ RELEASED دیگر جایی در سقفِ فردی ندارد.

        از راند ۲۷ لغو دیگر ردیف را حذف نمی‌کند (C22.1)، پس اگر این شرط نباشد
        مصرفِ لغوشده برای همیشه سهمِ کاربرِ `per_user_limit` را پر نگه می‌دارد.
        """
        stmt = select(func.count()).select_from(CouponRedemption).where(
            CouponRedemption.coupon_id == coupon_id,
            CouponRedemption.user_id == user_id,
            CouponRedemption.status == RedemptionStatus.ACTIVE,
        )
        return int(self.session.exec(stmt).one())

    def clear_fields(self, coupon_id: int, names: List[str]) -> Optional[Coupon]:
        """فیلدهای انتخابی را روی NULL می‌نویسد — «بی‌سقف» از مسیر ORM نوشتنی نیست.

        دو سد جدا جلوی این کار را گرفته بودند (گرهٔ C21.2): `BaseRepository.update`
        مقدار `None` را رد می‌کند، و روی INSERT خودِ SQLAlchemy مقدار پیش‌فرضِ ستون
        (`per_user_limit=1`) را به‌جای NULL می‌گذارد. پس تنها راهِ درستِ نوشتن، یک
        UPDATE در سطح ستون است. اسم‌های خارج از فهرستِ مجاز خطا می‌دهند تا یک تایپو
        به «صفرِ بی‌صدا» تبدیل نشود.
        """
        bad = [n for n in names if n not in NULLABLE_COUPON_FIELDS]
        if bad:
            raise ValueError(f"این فیلدها برای NULL کردن مجاز نیستند: {bad}")
        if not names:
            return self.get_by_id(coupon_id)
        table = Coupon.__table__
        values = {table.c[n]: None for n in names}
        values[table.c.updated_at] = datetime.now(timezone.utc)
        self.session.execute(table.update().where(table.c.id == coupon_id).values(values))
        coupon = self.get_by_id(coupon_id)
        if coupon is not None:
            self.session.refresh(coupon)   # identity map بعد از Core update همگام نیست
        return coupon

    def try_consume_capacity(self, coupon_id: int) -> bool:
        """یک ظرفیت را با compare-and-set می‌گیرد.

        `uses_count < max_uses` داخل خودِ UPDATE است، نه در Python، پس دو رزروِ موازیِ
        یک کدِ `max_uses=1` نمی‌توانند هر دو بالا بیایند (گرهٔ C13.3.1). rowcount هر
        dialectی را درست می‌گوید؛ `SELECT … FOR UPDATE` روی SQLite هیچ کاری نیست.
        """
        table = Coupon.__table__
        result = self.session.execute(
            table.update()
            .where(
                table.c.id == coupon_id,
                or_(table.c.max_uses.is_(None),
                    table.c.uses_count < table.c.max_uses),
            )
            .values(
                uses_count=table.c.uses_count + 1,
                updated_at=datetime.now(timezone.utc),
            )
        )
        if result.rowcount == 0:
            return False
        coupon = self.get_by_id(coupon_id)
        if coupon is not None:
            self.session.refresh(coupon)   # identity map بعد از Core update همگام نیست
        return True

    def release_capacity(self, coupon_id: int) -> bool:
        """یک ظرفیت را برمی‌گرداند، هرگز زیر صفر نمی‌رود (نگهبان داخل SQL)."""
        table = Coupon.__table__
        result = self.session.execute(
            table.update()
            .where(table.c.id == coupon_id, table.c.uses_count > 0)
            .values(
                uses_count=table.c.uses_count - 1,
                updated_at=datetime.now(timezone.utc),
            )
        )
        if result.rowcount == 0:
            return False
        coupon = self.get_by_id(coupon_id)
        if coupon is not None:
            self.session.refresh(coupon)
        return True


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

    def list_for_coupon(self, coupon_id: int, limit: int = 200, offset: int = 0
                        ) -> List[tuple]:
        """ردیف‌های مصرفِ یک کوپن، به‌همراه اسم و شمارهٔ کاربر (سابقاً هیچ‌جا فهرست نمی‌شد — C13.3.2).

        `outerjoin` چون کاربر می‌تواند حذف شده باشد؛ ردیفِ مصرفِ مالی نباید با حذفِ
        کاربر ناپدید شود. ترتیب از تازه به کهنه و `id` به‌عنوان tie-break، تا `offset`
        روی یک صفحه پایدار بماند.
        """
        stmt = (
            select(CouponRedemption, User.phone, User.full_name)
            .outerjoin(User, User.id == CouponRedemption.user_id)
            .where(CouponRedemption.coupon_id == coupon_id)
            .order_by(CouponRedemption.created_at.desc(), CouponRedemption.id.desc())
            .offset(offset)
            .limit(limit)
        )
        return [(row[0], row[1], row[2]) for row in self.session.exec(stmt).all()]

    def insert_within_user_limit(self, coupon_id: int, user_id: int,
                                 amount_discounted: int, per_user_limit: int
                                 ) -> Optional[CouponRedemption]:
        """یک ردیف مصرف، با نگهبانِ سقفِ فردی داخل خودِ INSERT.

        `INSERT … SELECT … WHERE (SELECT count(*) …) < limit` ⇒ وقتی سهمِ کاربر پر
        شده rowcount صفر است و هیچ ردیفی نوشته نمی‌شود؛ «خواندنِ شمارش» و «نوشتنِ
        ردیف» دیگر دو statement جدا نیستند (نصفِ بازِ گرهٔ C13.3.1).

        `from_select` همان `lastrowid` همیشگی را برنمی‌گرداند (`inserted_primary_key`
        نال است)، پس idِ ردیف تازه با `max(id)` خوانده می‌شود — و این درست است چون
        `reserve` قبلِ این INSERT ردیفِ کوپن را قفل کرده، یعنی هیچ نویسندۀ دیگری
        نمی‌تواند هم‌زمان ردیفِ مصرفِ همین کوپن بسازد.

        شمارشِ `used` فقط ردیف‌های `ACTIVE` را می‌شمارد (راند ۲۷): لغوِ یک مصرف دیگر
        ردیف را حذف نمی‌کند، پس بدونِ این شرط سهمِ `per_user_limit` کاربر برای همیشه
        پر می‌ماند و معناهای شمارنده نسبت به راند ۲۴ عوض می‌شد.
        """
        table = CouponRedemption.__table__
        used = (
            select(func.count()).select_from(table)
            .where(table.c.coupon_id == coupon_id, table.c.user_id == user_id,
                   table.c.status == RedemptionStatus.ACTIVE)
            .scalar_subquery()
        )
        result = self.session.execute(
            insert(table).from_select(
                [table.c.coupon_id, table.c.user_id,
                 table.c.amount_discounted, table.c.status, table.c.created_at],
                select(literal(coupon_id), literal(user_id),
                       literal(amount_discounted),
                       literal(RedemptionStatus.ACTIVE),
                       literal(datetime.now(timezone.utc)))
                .where(used < per_user_limit),
            )
        )
        if result.rowcount == 0:
            return None
        newest = self.session.exec(
            select(func.max(CouponRedemption.id))
            .where(CouponRedemption.coupon_id == coupon_id,
                   CouponRedemption.user_id == user_id)
        ).one()
        return self.get_by_id(int(newest))

    def mark_released(self, redemption_id: int, now: Optional[datetime] = None) -> bool:
        """مصرف را با نگهبانِ statement به `RELEASED` تبدیل می‌کند؛ ردیف می‌ماند.

        `WHERE id = ? AND status = 'ACTIVE'` ⇒ لغوِ دوباره (دو مسیرِ همزمانِ لغوِ یک
        رزرو) rowcount صفر می‌گیرد، پس شمارندۀ `uses_count` یک ظرفیت را **یک بار**
        برمی‌گرداند. تا راند ۲۷ اینجا `session.delete(red)` بود و همان حذف، هم
        تاریخچه را می‌سوزاند (C22.1) و هم read-checkِ «ردیف هست؟» را تنها سدِ دوباره‌لغو
        می‌کرد.
        """
        ts = now or datetime.now(timezone.utc)
        table = CouponRedemption.__table__
        rowcount = self.session.execute(
            table.update()
            .where(table.c.id == redemption_id,
                   table.c.status == RedemptionStatus.ACTIVE)
            .values(status=RedemptionStatus.RELEASED, released_at=ts)
        ).rowcount
        if rowcount == 0:
            return False
        red = self.get_by_id(redemption_id)
        if red is not None:
            self.session.refresh(red)   # identity map بعد از Core update همگام نیست
        return True