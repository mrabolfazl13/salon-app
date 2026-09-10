# -*- coding: utf-8 -*-
"""
seed_gym_qom.py - درج ۲۰ باشگاه بدنسازی برتر قم (فاز بدنسازی)
اجرا در کانتینر:   docker exec -w /app futsal_backend python -m app.seed_gym_qom
اجرا از ویندوز:    python backend/app/seed_gym_qom.py

نکته: این اسکریپت فقط دیتای بدنسازی (gym) را اضافه/بازسازی می‌کند و
به سالن‌های فوتسال موجود دست نمی‌زند.
عکس‌ها: فایل‌های gym-01.jpg تا gym-20.jpg در backend/app/static/venues/ قرار می‌گیرند.
"""
import os
import sys
import json
import random
from datetime import date, datetime, time, timedelta, timezone

_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from sqlmodel import Session, delete, select
from argon2 import PasswordHasher

from app.database import engine
from app.models.user import User
from app.models.venue import Venue, Club
from app.models.slot import Slot, SlotStatus
from app.models.booking import Booking, BookingStatus

ph = PasswordHasher()
random.seed(7)

# عکس‌ها به صورت filename ذخیره می‌شوند؛ فرانت آن‌ها را با VITE_DOMAIN/static/venues ترکیب می‌کند
def _img(*nums):
    return [f"gym-{n:02d}.jpg" for n in nums]


MANAGERS = [
    ("مهدی رستمی", "09121112233"),
    ("امیر حسینی", "09122223344"),
    ("جواد مرادی", "09123334455"),
    ("کاظم شریفی", "09124445566"),
    ("سعید رحیمی", "09125556677"),
    ("رضا اکبری", "09126667788"),
    ("حمید صادقی", "09127778899"),
    ("مجید کریمی", "09128889900"),
    ("فرهاد محمدی", "09129990011"),
    ("ناصر قاسمی", "09351112233"),
    ("بهرام جعفری", "09352223344"),
    ("علی نوری", "09353334455"),
    ("محسن توکلی", "09354445566"),
    ("داریوش کاظمی", "09355556677"),
    ("شهرام یوسفی", "09356667788"),
    ("عباس حیدری", "09357778899"),
    ("حسن عابدی", "09358889900"),
    ("روح‌الله سلطانی", "09359990011"),
    ("یوسف ایمانی", "09123337777"),
    ("محمد صالحی", "09124448888"),
]

USERS = [
    ("مریم احمدی", "09023334455"),
    ("الهام رضایی", "09024445566"),
    ("نگار محمدی", "09035556677"),
    ("آرش کریمی", "09106667788"),
    ("پوریا حسینی", "09107778899"),
    ("سارا نادری", "09306667788"),
    ("میلاد قاسمی", "09317778899"),
    ("کتایون موسوی", "09328889900"),
    ("امید شریفی", "09339990011"),
    ("لیلا جعفری", "09340001122"),
]

# ۲۰ باشگاه بدنسازی برتر قم
GYMS = [
    {
        "name": "باشگاه بدنسازی المپیک قم",
        "address": "قم، بلوار امین، نبش کوچه ۵",
        "lat": 34.6553, "lng": 50.8796,
        "phone": "025-3221144",
        "desc": "مجهزترین باشگاه پرورش اندام قم با دستگاه‌های روز دنیا، سالن اسپینینگ، سونا و جکوزی؛ برگزارکننده مسابقات پرورش اندام استان.",
        "amenities": ["دستگاه بدنسازی", "مربی اختصاصی", "سونا", "جکوزی", "اسپینینگ", "سالن ایروبیک", "رختکن", "پارکینگ"],
        "price": 220000,
        "imgs": _img(1),
    },
    {
        "name": "باشگاه بدنسازی آریا",
        "address": "قم، خیابان ۱۵ خرداد، کوچه آریا",
        "lat": 34.6472, "lng": 50.8741,
        "phone": "025-3345661",
        "desc": "باشگاه بدنسازی با سابقه در مرکز شهر قم؛ مجهز به میز بادی، کراس‌فیت و برنامه تمرینی اختصاصی برای بدنسازان حرفه‌ای.",
        "amenities": ["دستگاه بدنسازی", "میز بادی", "کراس‌فیت", "مربی", "دوش", "رختکن"],
        "price": 180000,
        "imgs": _img(2),
    },
    {
        "name": "باشگاه بدنسازی پرشین",
        "address": "قم، بلوار غدیر، پلاک ۲۴",
        "lat": 34.6501, "lng": 50.8622,
        "phone": "025-3266884",
        "desc": "باشگاه مدرن با سالن ایروبیک و اسپینینگ، دستگاه‌های هوازی جدید و مربیان مجرب؛ مناسب بانوان و آقایان در سانس‌های مجزا.",
        "amenities": ["سالن ایروبیک", "اسپینینگ", "تردمیل", "دستگاه بدنسازی", "مربی", "رختکن", "دوش"],
        "price": 200000,
        "imgs": _img(3),
    },
    {
        "name": "باشگاه بدنسازی آفاق",
        "address": "قم، شهرک قدس، بلوار امام علی",
        "lat": 34.6588, "lng": 50.8531,
        "phone": "025-3299445",
        "desc": "باشگاه خانوادگی در شهرک قدس با فضای بزرگ و نورپردازی حرفه‌ای؛ دارای سالن کار با وزنه، کراس‌فیت و استخر مجاور.",
        "amenities": ["دستگاه بدنسازی", "کراس‌فیت", "سونا", "استخر", "رختکن", "پارکینگ"],
        "price": 190000,
        "imgs": _img(4),
    },
    {
        "name": "باشگاه بدنسازی قهرمان",
        "address": "قم، خیابان ارم، نبش کوچه ۱۲",
        "lat": 34.6412, "lng": 50.8705,
        "phone": "025-3227788",
        "desc": "محل تمرین قهرمانان پرورش اندام قم؛ مجهز به دستگاه‌های حرفه‌ای هالتر، میز پرس سینه و مربیان درجه‌یک ملی.",
        "amenities": ["دستگاه بدنسازی", "مربی درجه یک", "میز پرس", "هالتر", "رختکن", "دوش"],
        "price": 210000,
        "imgs": _img(5),
    },
    {
        "name": "باشگاه بدنسازی پهلوان",
        "address": "قم، خیابان باجک، کوچه ۸",
        "lat": 34.6455, "lng": 50.8688,
        "phone": "025-3355223",
        "desc": "باشگاه قدیمی و معتبر باجک با ۲۰ سال سابقه؛ مناسب بدنسازان حرفه‌ای با برنامه‌های حجم و کات تخصصی.",
        "amenities": ["دستگاه بدنسازی", "مربی تخصصی", "سونا", "رختکن", "بوفه"],
        "price": 170000,
        "imgs": _img(6),
    },
    {
        "name": "باشگاه بدنسازی تیتان",
        "address": "قم، بلوار الغدیر، جنب پارک شهر",
        "lat": 34.6529, "lng": 50.8863,
        "phone": "025-3288447",
        "desc": "باشگاه بزرگ با سالن‌های مجزا برای وزنه، هوازی و کراس‌فیت؛ دارای نورپردازی مدرن و تهویه مطبوع.",
        "amenities": ["دستگاه بدنسازی", "کراس‌فیت", "سالن هوازی", "تهویه مطبوع", "رختکن", "دوش", "پارکینگ"],
        "price": 200000,
        "imgs": _img(7),
    },
    {
        "name": "باشگاه بدنسازی دلتا",
        "address": "قم، خیابان معلم، پلاک ۴۷",
        "lat": 34.6612, "lng": 50.8655,
        "phone": "025-3344889",
        "desc": "باشگاه نوساز با دستگاه‌های تمام‌اتومات و سالن اسپینینگ؛ ارائه برنامه تغذیه و مکمل توسط متخصص تغذیه.",
        "amenities": ["دستگاه بدنسازی", "اسپینینگ", "مشاور تغذیه", "مربی", "رختکن", "دوش"],
        "price": 190000,
        "imgs": _img(8),
    },
    {
        "name": "باشگاه بدنسازی رعد",
        "address": "قم، خیابان سمیه، کوچه ۳",
        "lat": 34.6438, "lng": 50.8779,
        "phone": "025-3233667",
        "desc": "باشگاه قدرتی با تمرکز بر پاورلیفتینگ و وزنه‌برداری؛ مجهز به میز پرس، اسکات‌رک و صفحه‌های استاندارد.",
        "amenities": ["دستگاه بدنسازی", "پاورلیفتینگ", "میز پرس", "اسکات رک", "رختکن"],
        "price": 160000,
        "imgs": _img(9),
    },
    {
        "name": "باشگاه بدنسازی نیرو",
        "address": "قم، بلوار جمهوری، پلاک ۱۱۲",
        "lat": 34.6496, "lng": 50.8902,
        "phone": "025-3377556",
        "desc": "باشگاه معتبر با سانس‌های صبح و شب ویژه کارمندان؛ دارای دستگاه‌های روز و سالن بدنسازی بانوان.",
        "amenities": ["دستگاه بدنسازی", "سالن بانوان", "مربی", "رختکن", "دوش", "پارکینگ"],
        "price": 180000,
        "imgs": _img(10),
    },
    {
        "name": "باشگاه بدنسازی پیکار",
        "address": "قم، خیابان طالقانی، کوچه ۱۶",
        "lat": 34.6477, "lng": 50.8824,
        "phone": "025-3255774",
        "desc": "باشگاه رقابتی مخصوص بدنسازان حرفه‌ای؛ برگزاری دوره‌های آمادگی مسابقه و فیتنس چالش با جوایز.",
        "amenities": ["دستگاه بدنسازی", "مربی درجه یک", "فیتنس چالش", "سونا", "رختکن"],
        "price": 210000,
        "imgs": _img(11),
    },
    {
        "name": "باشگاه بدنسازی صدرا",
        "address": "قم، شهرک پردیسان، بلوار دانشجو",
        "lat": 34.5722, "lng": 50.8329,
        "phone": "025-3488221",
        "desc": "اولین باشگاه بدنسازی مجهز پردیسان؛ با فضای وسیع، سالن ایروبیک بانوان و پارکینگ اختصاصی.",
        "amenities": ["دستگاه بدنسازی", "سالن ایروبیک", "مربی", "رختکن", "دوش", "پارکینگ"],
        "price": 170000,
        "imgs": _img(12),
    },
    {
        "name": "باشگاه بدنسازی بهمن",
        "address": "قم، خیابان شهدا، پلاک ۸۵",
        "lat": 34.6405, "lng": 50.8752,
        "phone": "025-3266119",
        "desc": "باشگاه باسابقه در مرکز شهر با دستگاه‌های سینمک و هایپر؛ مناسب تمرینات فیتنس و بدنسازی عمومی.",
        "amenities": ["دستگاه بدنسازی", "مربی", "تردمیل", "رختکن", "دوش"],
        "price": 150000,
        "imgs": _img(13),
    },
    {
        "name": "باشگاه بدنسازی کوثر",
        "address": "قم، شهرک گلستان، خیابان چهارم",
        "lat": 34.6488, "lng": 50.8587,
        "phone": "025-3376612",
        "desc": "باشگاه خانوادگی شهرک گلستان با سانس‌های مجزا و فضای مناسب برای نوجوانان؛ دارای سالن کار با وزنه و هوازی.",
        "amenities": ["دستگاه بدنسازی", "سالن هوازی", "مربی", "رختکن", "دوش"],
        "price": 140000,
        "imgs": _img(14),
    },
    {
        "name": "باشگاه بدنسازی سپید",
        "address": "قم، بلوار مرجعیت، کوچه ۴",
        "lat": 34.6533, "lng": 50.8711,
        "phone": "025-3299883",
        "desc": "باشگاه لوکس با دکوراسیون مدرن، سونا و جکوزی؛ مجهز به جدیدترین دستگاه‌های هوازی و بدنسازی.",
        "amenities": ["دستگاه بدنسازی", "سونا", "جکوزی", "مربی", "رختکن", "پارکینگ"],
        "price": 230000,
        "imgs": _img(15),
    },
    {
        "name": "باشگاه بدنسازی ایران‌مهر",
        "address": "قم، خیابان باجک، کوچه ۲۱",
        "lat": 34.6466, "lng": 50.8669,
        "phone": "025-3355776",
        "desc": "باشگاه تخصصی پرورش اندام با کادر مربیگری حرفه‌ای؛ برگزاری کلاس‌های هیت، کراس‌فیت و ایروبیک.",
        "amenities": ["دستگاه بدنسازی", "کراس‌فیت", "هیت", "مربی", "رختکن", "دوش"],
        "price": 190000,
        "imgs": _img(16),
    },
    {
        "name": "باشگاه بدنسازی اوج",
        "address": "قم، بلوار بهار، جنب فرهنگسرای جوان",
        "lat": 34.6389, "lng": 50.8847,
        "phone": "025-3233778",
        "desc": "باشگاه مدرن با سالن‌های مجزا برای بدنسازی و فیتنس؛ مناسب ورزشکاران حرفه‌ای و آماتور.",
        "amenities": ["دستگاه بدنسازی", "سالن فیتنس", "مربی", "اسپینینگ", "رختکن", "دوش"],
        "price": 185000,
        "imgs": _img(17),
    },
    {
        "name": "باشگاه بدنسازی آسمان",
        "address": "قم، خیابان آیت‌الله بروجردی، پلاک ۹۰",
        "lat": 34.6564, "lng": 50.8681,
        "phone": "025-3244667",
        "desc": "باشگاه با تجهیزات کامل بدنسازی و هوازی؛ دارای سالن مخصوص بانوان و مشاوره تغذیه رایگان.",
        "amenities": ["دستگاه بدنسازی", "سالن بانوان", "مشاور تغذیه", "مربی", "رختکن", "دوش"],
        "price": 175000,
        "imgs": _img(18),
    },
    {
        "name": "باشگاه بدنسازی بانوان نجمه",
        "address": "قم، بلوار امامزاده ابراهیم، جنب بوستان",
        "lat": 34.6485, "lng": 50.8941,
        "phone": "025-3277339",
        "desc": "باشگاه تخصصی بانوان با فضای کاملاً مجزا و امن؛ برنامه‌های فیتنس، لاغری، ایروبیک و بدنسازی بانوان.",
        "amenities": ["دستگاه بدنسازی", "سالن ایروبیک", "مربی بانوان", "سونا", "رختکن"],
        "price": 195000,
        "imgs": _img(19),
    },
    {
        "name": "باشگاه بدنسازی شمیم",
        "address": "قم، شهرک امام حسن، بلوار قائم",
        "lat": 34.6679, "lng": 50.8521,
        "phone": "025-3499772",
        "desc": "باشگاه جوان و پرطرفدار شهرک امام حسن؛ مجهز به دستگاه‌های مدرن، سالن اسپینینگ و کافه پروتئین.",
        "amenities": ["دستگاه بدنسازی", "اسپینینگ", "کافه پروتئین", "مربی", "رختکن", "دوش", "پارکینگ"],
        "price": 205000,
        "imgs": _img(20),
    },
]

# سانس‌های ۶۰ دقیقه‌ای برای باشگاه‌ها - ضریب قیمت نسبت به پایه
GYM_SLOTS_PER_DAY = [
    ("08:00", 0.70), ("09:00", 0.80), ("10:00", 0.85), ("11:00", 0.90),
    ("12:00", 0.90), ("13:00", 1.00), ("14:00", 1.00), ("15:00", 1.10),
    ("16:00", 1.15), ("17:00", 1.20), ("18:00", 1.25), ("19:00", 1.20),
    ("20:00", 1.10), ("21:00", 1.00),
]
DAYS_AHEAD = 30


def _round_price(p: int) -> int:
    return int(round(p / 10000) * 10000)


def _get_or_create_user(s, phone, full_name, role, password):
    """اگر کاربر با این شماره موجود نباشد ایجاد می‌کند؛ در هر حال برمی‌گرداند (idempotent)."""
    existing = s.exec(select(User).where(User.phone == phone)).first()
    if existing:
        return existing
    u = User(phone=phone, hashed_password=ph.hash(password),
             role=role, full_name=full_name)
    s.add(u)
    s.commit()
    return u


def seed():
    with Session(engine) as s:
        print("🧹 پاک کردن دیتای قبلی بدنسازی (gym)...")

        # فقط سالن‌های gym و متعلقات آن‌ها
        gyms = s.exec(select(Venue).where(Venue.category == "gym")).all()
        gym_ids = [g.id for g in gyms]
        for gid in gym_ids:
            s.exec(delete(Booking).where(Booking.slot_id.in_(
                select(Slot.id).where(Slot.venue_id == gid))))
            s.exec(delete(Slot).where(Slot.venue_id == gid))
        s.exec(delete(Venue).where(Venue.category == "gym"))
        s.commit()

        # ---------- کاربران ----------
        print("👤 ایجاد مدیران باشگاه‌ها و کاربران...")
        admin = _get_or_create_user(s, "09123456789", "مدیر سیستم", "super_admin", "Admin123!")

        managers = []
        for name, phone in MANAGERS:
            m = _get_or_create_user(s, phone, name, "venue_manager", "Manager123!")
            managers.append(m)

        users = []
        for name, phone in USERS:
            u = _get_or_create_user(s, phone, name, "user", "123456")
            users.append(u)
        print(f"   {len(managers)} مدیر باشگاه + {len(users)} کاربر")

        # ---------- باشگاه‌ها ----------
        print("🏋️ ایجاد ۲۰ باشگاه بدنسازی قم...")
        venues = []
        for i, gd in enumerate(GYMS):
            v = Venue(
                name=gd["name"],
                category="gym",
                address=gd["address"],
                latitude=gd["lat"],
                longitude=gd["lng"],
                phone=gd["phone"],
                description=gd["desc"],
                amenities=json.dumps(gd["amenities"], ensure_ascii=False),
                images=json.dumps(gd["imgs"], ensure_ascii=False),
                price=gd["price"],
                is_verified=True,
                manager_id=managers[i].id,
            )
            s.add(v)
            s.commit()
            venues.append(v)
        print(f"   {len(venues)} باشگاه بدنسازی")

        # ---------- سانس‌ها + رزروها ----------
        print("⏰ ایجاد سانس‌ها و رزروها...")
        today = date.today()
        now_hm = datetime.now().strftime("%H:%M")
        total_slots = 0
        total_bookings = 0
        booked_slots = []

        for v, gd in zip(venues, GYMS):
            base = gd["price"]
            for day in range(DAYS_AHEAD):
                slot_date = today + timedelta(days=day)
                for t_str, factor in GYM_SLOTS_PER_DAY:
                    price = _round_price(base * factor)
                    if day == 0 and t_str < now_hm:
                        status = SlotStatus.BOOKED
                    else:
                        status = SlotStatus.BOOKED if random.random() < 0.25 else SlotStatus.AVAILABLE
                    slot = Slot(
                        venue_id=v.id,
                        slot_date=slot_date,
                        start_time=time.fromisoformat(t_str),
                        duration=60,
                        base_price=price,
                        current_price=price,
                        status=status,
                        is_competition_enabled=False,
                    )
                    s.add(slot)
                    s.flush()
                    total_slots += 1
                    if status == SlotStatus.BOOKED:
                        booked_slots.append(slot)

        s.commit()

        for slot in booked_slots:
            u = random.choice(users)
            when = datetime.now(timezone.utc) - timedelta(
                days=random.randint(0, 3), hours=random.randint(1, 20))
            b = Booking(
                slot_id=slot.id,
                user_id=u.id,
                booked_at=when,
                status=BookingStatus.CONFIRMED,
                payment_amount=slot.current_price,
            )
            s.add(b)
            total_bookings += 1
        s.commit()
        print(f"   {total_slots} سانس ({DAYS_AHEAD} روز) + {total_bookings} رزرو")

        print("✅ DONE!")
        print(f"   باشگاه بدنسازی: {len(venues)}")
        print(f"   ورود مدیر باشگاه: {MANAGERS[0][1]} / Manager123!")
        print(f"   ورود کاربر: {USERS[0][1]} / 123456")


if __name__ == "__main__":
    seed()
