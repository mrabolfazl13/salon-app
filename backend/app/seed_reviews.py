# -*- coding: utf-8 -*-
"""
seed_reviews.py - درج نظرات برای سالن‌های فوتسال و باشگاه‌های بدنسازی
اجرا در کانتینر:   docker exec -w /app futsal_backend python -m app.seed_reviews
اجرا از ویندوز:    python backend/app/seed_reviews.py

نظرات تصادفی برای هر دو دسته‌بندی ایجاد می‌کند تا کاربران بتوانند
امتیازها و نظرات واقعی را در UI مشاهده کنند.
"""
import os
import sys
import random
from datetime import datetime, timedelta, timezone

_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from sqlmodel import Session, delete, select

from app.database import engine
from app.models.review import Review
from app.models.venue import Venue
from app.models.user import User

random.seed(42)

# کامنت‌های تصادفی برای فوتسال
FUTSAL_COMMENTS = [
    "سالن خیلی خوبی بود، کفپاش عالی و نورپردازی حرفه‌ای.",
    "کیفیت چمن مصنوعی عالی بود، حتماً دوباره میام.",
    "دستشویی و رختکن تمیز و مرتب بود.",
    "پارکینگ مناسب داشت، رفت و آمد راحت بود.",
    "قیمت مناسبی داره نسبت به بقیه سالن‌های قم.",
    "مدیر سالن خوش‌برخورد و حرفه‌ای بود.",
    "کفپوش سالن استاندارد بود و آسیب‌زا نبود.",
    "سیستم تهویه خوبی داشت، گرم نبود.",
    "حیف که سرویس نوشیدنی نداشت.",
    "نورپردازی عالی برای فیلمبرداری مسابقه.",
    "صندلی تماشاچی کافی داشت.",
    "بوفه سالن تنوع خوبی داشت.",
    "زمین کمی کوچک بود ولی کیفیت خوب بود.",
    "تخته‌های تعویض دیجیتال عالی بودن.",
    "دوش‌ها آب گرم مناسب داشت.",
    "دوربین مداربسته باعث امنیت وسایل می‌شه.",
    "کفپوش سالن تاریخ انقضا داشت ولی هنوز خوب بود.",
    "برای جشنواره و مسابقات داخلی عالیه.",
    "رختکن‌ها جادار و تمیز بودن.",
    "تجربه خوبی بود، حتماً بازم میام.",
    "سیستم صوتی سالن عالی بود.",
    "اینترنت wifi هم داشتیم.",
    "متاسفانه جای پارک محدوده.",
    "سالن نزدیک مرکز شهره و دسترسی راحتی داره.",
]

# کامنت‌های تصادفی برای بدنسازی
GYM_COMMENTS = [
    "دستگاه‌های بدنسازی نو و باکیفیت بودن.",
    "مربی‌ها حرفه‌ای و با حوصله بودن.",
    "فضای باشگاه بزرگ و تمیز بود.",
    "قیمت اشتراک ماهانه مناسبی داره.",
    "ساعت کاری صبح و عصر منعطفه.",
    "کمد و رختکن تمیز و مرتب بود.",
    "دستگاه‌های هوازی جدید عالی بودن.",
    "کلاس اسپینینگ فوق‌العاده‌ای داره.",
    "مربی اختصاصی برنامه خوبی داد.",
    "تنوع دستگاه‌ها خیلی خوب بود.",
    "سونا و جکوزی بعد تمرین عالیه.",
    "باشگاه شلوغ می‌شه ولی جا هست.",
    "سیستم تهویه مناسب داره.",
    "کف باشگاه تمیز و استاندارد بود.",
    "موسیقی باشگاه انرژی‌بخش بود.",
    "پارکینگ اختصاصی داره.",
    "حیف که ساعات بانوان محدوده.",
    "محیط خانوادگی و امنی داره.",
    "مشاور تغذیه خیلی کمک کرد.",
    "تمرینات کراس‌فیت چالش‌برانگیزه.",
    "قیمت نسبت به امکانات مناسبه.",
    "برنامه تمرینی اختصاصی میدن.",
    "فضای باشگاه برای بدنسازی حرفه‌ای مناسبه.",
    "دستگاه‌های سینمک و هایپر عالی بودن.",
]


def seed():
    with Session(engine) as s:
        # پاک کردن نظرات قبلی
        print("🧹 پاک کردن نظرات قبلی...")
        s.exec(delete(Review))
        s.commit()

        # دریافت همه کاربران عادی
        print("👤 دریافت کاربران...")
        users = s.exec(select(User).where(User.role == "user")).all()
        if not users:
            print("❌ هیچ کاربر عادی یافت نشد!")
            return
        print(f"   {len(users)} کاربر")

        # دریافت همه سالن‌ها
        print("🏟️ دریافت سالن‌ها...")
        venues = s.exec(select(Venue).where(Venue.is_verified == True)).all()
        if not venues:
            print("❌ هیچ سالنی یافت نشد!")
            return
        print(f"   {len(venues)} سالن")

        reviews = []
        now = datetime.now(timezone.utc)

        for v in venues:
            # ۳ تا ۵ نظر تصادفی برای هر سالن
            num_reviews = random.randint(3, 5)
            selected_users = random.sample(users, min(num_reviews, len(users)))

            for u in selected_users:
                if v.category == "futsal":
                    rating = random.choices([3, 4, 5], weights=[1, 3, 6])[0]
                    comment = random.choice(FUTSAL_COMMENTS)
                else:
                    rating = random.choices([3, 4, 5], weights=[1, 3, 5])[0]
                    comment = random.choice(GYM_COMMENTS)

                # ایجاد زمان تصادفی در ۳۰ روز گذشته
                days_ago = random.randint(0, 30)
                hours_ago = random.randint(0, 23)
                created = now - timedelta(days=days_ago, hours=hours_ago)

                review = Review(
                    venue_id=v.id,
                    user_id=u.id,
                    rating=rating,
                    comment=comment,
                    created_at=created,
                )
                reviews.append(review)

        s.add_all(reviews)
        s.commit()
        print(f"✅ {len(reviews)} نظر با موفقیت ثبت شد!")

        # نمایش خلاصه
        print("\n📊 خلاصه نظرات:")
        for v in venues:
            venue_reviews = [r for r in reviews if r.venue_id == v.id]
            if venue_reviews:
                avg = sum(r.rating for r in venue_reviews) / len(venue_reviews)
                print(f"   {v.name}: {len(venue_reviews)} نظر - میانگین: {avg:.1f}/5")


if __name__ == "__main__":
    seed()