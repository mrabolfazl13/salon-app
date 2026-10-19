"""حساب‌های نمایشی پنل «دسترسی سریع» صفحهٔ ورود.

اجرا داخل کانتینر بک‌اند:  python -m app.seed_quick_access

حساب‌ها idempotent هستند: اگر وجود داشته باشند رمز/نام/نقششان همسان می‌شود.
رمز عمداً ساده و عمومی است چون این حساب‌ها فقط برای دمو و آزمون نقش‌ها هستند.
"""

from sqlmodel import Session, select

from app.database import engine
from app.models.user import User, UserRole
from app.utils.auth import get_password_hash

DEMO_PASSWORD = "demo1234"

DEMO_USERS: list[tuple[str, str, UserRole]] = [
    ("09000000111", "کاربر نمونه ۱", UserRole.USER),
    ("09000000112", "کاربر نمونه ۲", UserRole.USER),
    ("09000000113", "کاربر نمونه ۳", UserRole.USER),
    ("09000000211", "مدیر سالن نمونه ۱", UserRole.VENUE_MANAGER),
    ("09000000212", "مدیر سالن نمونه ۲", UserRole.VENUE_MANAGER),
    ("09000000213", "مدیر سالن نمونه ۳", UserRole.VENUE_MANAGER),
    ("09000000311", "مدیر کل نمونه ۱", UserRole.SUPER_ADMIN),
    ("09000000312", "مدیر کل نمونه ۲", UserRole.SUPER_ADMIN),
    ("09000000313", "مدیر کل نمونه ۳", UserRole.SUPER_ADMIN),
]


def seed() -> None:
    created = updated = 0
    with Session(engine) as session:
        for phone, full_name, role in DEMO_USERS:
            user = session.exec(select(User).where(User.phone == phone)).first()
            if user:
                user.full_name = full_name
                user.role = role
                user.is_active = True
                user.is_verified = True
                user.hashed_password = get_password_hash(DEMO_PASSWORD)
                updated += 1
            else:
                session.add(
                    User(
                        phone=phone,
                        full_name=full_name,
                        hashed_password=get_password_hash(DEMO_PASSWORD),
                        role=role,
                        is_active=True,
                        is_verified=True,
                    )
                )
                created += 1
        session.commit()
    print(f"quick-access users ready: created={created} updated={updated}")


if __name__ == "__main__":
    seed()
