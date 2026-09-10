# -*- coding: utf-8 -*-
"""
seed_qom.py - درج دیتای واقعی سالن‌های فوتسال قم + سانس‌ها + رزروها + رقابت‌ها
اجرا در کانتینر:   docker exec -w /app futsal_backend python -m app.seed_qom
اجرا از ویندوز:    python backend/seed_qom.py
"""
import os
import sys
import json
import random
from datetime import date, datetime, time, timedelta, timezone

# تضمین پیدا شدن پکیج app (هم از روت backend، هم از داخل کانتینر)
_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from sqlmodel import Session, delete
from argon2 import PasswordHasher

from app.database import engine
from app.models.user import User
from app.models.venue import Venue, Club
from app.models.slot import Slot, SlotStatus
from app.models.booking import Booking, BookingStatus
from app.models.contract import Contract, ContractSlot, ContractPayment
from app.models.competition import PriceCompetition, CompetitionStatus

ph = PasswordHasher()
random.seed(42)

# URL پایه‌ی بک‌اند برای سرو کردن عکس‌های واقعی (استاتیک)
API_BASE = os.environ.get("SEED_API_BASE", "http://localhost:8000")
IMG = f"{API_BASE}/static/venues"


def _img(*nums):
    return [f"{IMG}/futsal-{n:02d}.jpg" for n in nums]


MANAGERS = [
    ("احمد صادقی", "09126412345"),
    ("حسین کاظمی", "09126551234"),
    ("علی رضایی", "09354871234"),
    ("محمد محمدی", "09362784561"),
    ("رضا جعفری", "09123467890"),
    ("سعید احمدپور", "09351239876"),
    ("محمدرضا کریمی", "09138765432"),
    ("عباس نوروزی", "09129988776"),
]

USERS = [
    ("سارا محمدی", "09021112233"),
    ("محمد توکلی", "09021234567"),
    ("فاطمه حسینی", "09032345678"),
    ("امیرعلی شریفی", "09103456789"),
    ("نیما قاسمی", "09104567890"),
    ("زهرا موسوی", "09305678901"),
    ("علیرضا صادقی", "09316789012"),
    ("حسین رحیمی", "09327890123"),
    ("مریم کاظمی", "09338901234"),
    ("بابک حیدری", "09349012345"),
]

# سالن‌های فوتسال قم - نام، آدرس، مختصات، تلفن، توضیحات، امکانات، قیمت، عکس‌ها
VENUES = [
    {
        "name": "سالن فوتسال المپیک قم",
        "address": "قم، بلوار امین، نبش کوچه ۱۵",
        "lat": 34.6553, "lng": 50.8796,
        "phone": "025-3221144",
        "desc": "بزرگ‌ترین سالن فوتسال قم با کفپوش استاندارد ۳۰×۱۹ متر، نورپردازی LED حرفه‌ای و ۲۰۰ صندلی تماشاچی؛ انتخاب تیم‌های لیگ برتر فوتسال استان برای مسابقات رسمی.",
        "amenities": ["پارکینگ", "صندلی تماشاچی", "نمایشگر LED", "سیستم صوتی", "دوش", "رختکن", "بوفه", "دوربین مداربسته"],
        "price": 600000,
        "verified": True,
        "imgs": _img(1, 3, 14),
    },
    {
        "name": "سالن فوتسال صفا",
        "address": "قم، خیابان ولیعصر، پلاک ۴۸۲",
        "lat": 34.6472, "lng": 50.8741,
        "phone": "025-3345678",
        "desc": "سالن مجهز در مرکز شهر با کفپوش درجه یک و نورپردازی استاندارد؛ مناسب تمرین روزانه تیم‌ها و مسابقات قهرمانی.",
        "amenities": ["پارکینگ", "دوش", "رختکن", "کولر گازی", "نورپردازی حرفه‌ای"],
        "price": 450000,
        "verified": True,
        "imgs": _img(2, 10, 12),
    },
    {
        "name": "سالن فوتسال فاطمی",
        "address": "قم، بلوار فاطمی، روبه‌رو از پارکینگ عمومی",
        "lat": 34.6391, "lng": 50.8872,
        "phone": "025-3228890",
        "desc": "سالن اقتصادی و دوطبقه در جنوب شهر؛ کفپوش استاندارد، سالن انتظار مناسب و دسترسی آسان با مترو شهری.",
        "amenities": ["پارکینگ", "دوش", "رختکن", "سالن انتظار", "کفپوش استاندارد"],
        "price": 400000,
        "verified": True,
        "imgs": _img(4, 13, 8),
    },
    {
        "name": "سالن فوتسال آریانا",
        "address": "قم، بلوار معلم، کوچه ۸",
        "lat": 34.6612, "lng": 50.8655,
        "phone": "025-3351245",
        "desc": "سالن نوساز با سیستم صوتی پیشرفته و بوفه داخلی؛ ویژه تمرین‌های شبانه و مسابقات لیگ‌های محلی.",
        "amenities": ["پارکینگ", "دوش", "رختکن", "بوفه", "سیستم صوتی"],
        "price": 500000,
        "verified": True,
        "imgs": _img(5, 11, 9),
    },
    {
        "name": "سالن فوتسال کوثر",
        "address": "قم، شهرک گلستان، خیابان چهارم",
        "lat": 34.6488, "lng": 50.8587,
        "phone": "025-3376612",
        "desc": "سالن خانوادگی در شهرک گلستان با کولر گازی و امکانات کامل؛ مناسب تمرین گروهی و خانواده‌ها.",
        "amenities": ["پارکینگ", "رختکن", "بوفه", "کولر گازی"],
        "price": 350000,
        "verified": False,
        "imgs": _img(6, 7, 12),
    },
    {
        "name": "سالن فوتسال شهید باهنر",
        "address": "قم، بلوار شهید باهنر، نبش کوچه ۲۱",
        "lat": 34.6345, "lng": 50.8729,
        "phone": "025-3224478",
        "desc": "سالن قدیمی و با‌تجربه با ۱۵ سال سابقه میزبانی مسابقات؛ کفپوش باکیفیت و سالن انتظار گسترده.",
        "amenities": ["پارکینگ", "دوش", "رختکن", "سالن انتظار", "دوربین مداربسته"],
        "price": 380000,
        "verified": True,
        "imgs": _img(9, 1, 13),
    },
    {
        "name": "سالن فوتسال مهر",
        "address": "قم، خیابان امام خمینی، پلاک ۲۷۰",
        "lat": 34.6524, "lng": 50.8838,
        "phone": "025-3359921",
        "desc": "سالن مدرن با نمایشگر LED و نورپردازی حرفه‌ای؛ ویژه مسابقات استانی و تمرین تیم‌های حرفه‌ای.",
        "amenities": ["پارکینگ", "دوش", "رختکن", "نمایشگر LED", "نورپردازی حرفه‌ای", "بوفه"],
        "price": 550000,
        "verified": False,
        "imgs": _img(10, 3, 5),
    },
    {
        "name": "سالن فوتسال قمیه",
        "address": "قم، بلوار شهید رجایی، انتهای کوچه ۱۰",
        "lat": 34.6651, "lng": 50.8912,
        "phone": "025-3227733",
        "desc": "خوش‌آب‌ترین سالن فوتسال قم؛ VIP با پارکینگ اختصاصی، رختکن مجهز و خدمات کامل مسابقات رسمی.",
        "amenities": ["پارکینگ اختصاصی", "رختکن VIP", "دوش", "بوفه", "سیستم صوتی", "نمایشگر LED"],
        "price": 650000,
        "verified": True,
        "imgs": _img(14, 4, 6),
    },
]

# ۱۰ سانس ۹۰ دقیقه‌ای در روز - ضریب قیمت نسبت به پایه
SLOTS_PER_DAY = [
    ("08:00", 0.70), ("09:30", 0.80), ("11:00", 0.85), ("12:30", 0.90),
    ("14:00", 0.90), ("15:30", 1.00), ("17:00", 1.15), ("18:30", 1.25),
    ("20:00", 1.35), ("21:30", 1.20),
]
COMPETITION_TIMES = {"18:30", "20:00"}
DAYS_AHEAD = 30


def _round_price(p: int) -> int:
    return int(round(p / 10000) * 10000)


def seed():
    with Session(engine) as s:
        print("🧹 پاک کردن دیتای قبلی...")
        s.exec(delete(ContractPayment))
        s.exec(delete(ContractSlot))
        s.exec(delete(Contract))
        s.exec(delete(PriceCompetition))
        s.exec(delete(Booking))
        s.exec(delete(Slot))
        s.exec(delete(Venue))
        s.exec(delete(Club))
        s.exec(delete(User))
        s.commit()

        # ---------- کاربران ----------
        print("👤 ایجاد کاربران...")
        admin = User(phone="09123456789", hashed_password=ph.hash("Admin123!"),
                     role="super_admin", full_name="مدیر سیستم")
        s.add(admin)
        s.commit()

        managers = []
        for name, phone in MANAGERS:
            m = User(phone=phone, hashed_password=ph.hash("Manager123!"),
                     role="venue_manager", full_name=name)
            s.add(m)
            s.commit()
            managers.append(m)

        users = []
        for name, phone in USERS:
            u = User(phone=phone, hashed_password=ph.hash("123456"),
                     role="user", full_name=name)
            s.add(u)
            s.commit()
            users.append(u)
        print(f"   {len(managers)} مدیر سالن + {len(users)} کاربر + ۱ ادمین")

        # ---------- سالن‌ها ----------
        print("🏟️ ایجاد سالن‌های قم...")
        venues = []
        for i, vd in enumerate(VENUES):
            v = Venue(
                name=vd["name"],
                address=vd["address"],
                latitude=vd["lat"],
                longitude=vd["lng"],
                phone=vd["phone"],
                description=vd["desc"],
                amenities=json.dumps(vd["amenities"], ensure_ascii=False),
                images=json.dumps(vd["imgs"], ensure_ascii=False),
                price=vd["price"],
                is_verified=vd["verified"],
                manager_id=managers[i].id,
            )
            s.add(v)
            s.commit()
            venues.append(v)
        print(f"   {len(venues)} سالن")

        # ---------- سانس‌ها + رزروها ----------
        print("⏰ ایجاد سانس‌ها و رزروها...")
        today = date.today()
        now_hm = datetime.now().strftime("%H:%M")
        total_slots = 0
        total_bookings = 0
        booked_slots = []

        for v, vd in zip(venues, VENUES):
            base = vd["price"]
            for day in range(DAYS_AHEAD):
                slot_date = today + timedelta(days=day)
                for t_str, factor in SLOTS_PER_DAY:
                    price = _round_price(base * factor)
                    if day == 0 and t_str < now_hm:
                        status = SlotStatus.BOOKED  # سانس‌های گذشته‌ی امروز
                    else:
                        status = SlotStatus.BOOKED if random.random() < 0.25 else SlotStatus.AVAILABLE
                    slot = Slot(
                        venue_id=v.id,
                        slot_date=slot_date,
                        start_time=time.fromisoformat(t_str),
                        duration=90,
                        base_price=price,
                        current_price=price,
                        status=status,
                        is_competition_enabled=(t_str in COMPETITION_TIMES),
                    )
                    s.add(slot)
                    s.flush()
                    total_slots += 1
                    if status == SlotStatus.BOOKED:
                        booked_slots.append(slot)

        s.commit()

        # رزرو برای هر سانس پر
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

        # ---------- رقابت‌های فعال قیمت ----------
        print("🏆 ایجاد رقابت‌های فعال...")
        competitions = 0
        for v in (venues[0], venues[3], venues[7]):
            future = [x for x in booked_slots
                      if x.venue_id == v.id and x.slot_date >= today + timedelta(days=1)]
            for slot in random.sample(future, min(2, len(future))) if future else []:
                c = PriceCompetition(
                    slot_id=slot.id,
                    venue_id=v.id,
                    venue_manager_id=v.manager_id,
                    offered_price=slot.base_price - 100000,
                    status=CompetitionStatus.ACTIVE,
                    expires_at=datetime.now(timezone.utc) + timedelta(hours=random.randint(2, 12)),
                )
                s.add(c)
                competitions += 1
        s.commit()

        print("✅ DONE!")
        print(f"   سالن: {len(venues)} | سانس: {total_slots} | رزرو: {total_bookings} | رقابت: {competitions}")
        print(f"   ورود ادمین: 09123456789 / Admin123!")
        print(f"   ورود مدیر سالن: {MANAGERS[0][1]} / Manager123!")
        print(f"   ورود کاربر: {USERS[0][1]} / 123456")


if __name__ == "__main__":
    seed()
