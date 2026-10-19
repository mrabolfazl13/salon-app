# -*- coding: utf-8 -*-
"""دیتای شهرها — تکمیل سالن‌های تهران و قیمت/سانس چندماهه سالن‌های قم و تهران.

منبع سالن‌های تهران: صفحه‌های رسمی پول‌تیکت (poolticket.org/sports-complex/...)
— نام، نشانی، مختصات جغرافیایی، تلفن و قیمت پایه عیناً از JSON-LD همان صفحه‌ها
خوانده شده‌اند (برداشت ۲۰۲۶-۱۰-۱۹). سالن‌های قم همان ۸ سالن واقعی موجود در
دیتابیس هستند؛ قیمت پایهٔ آن‌ها تعرفهٔ متعارف ۱۴۰۴ هر سالن است.

اسکریپت idempotent است:
  - سالن‌ها با name upsert می‌شوند (هیچ سالن یا رزروی حذف نمی‌شود).
  - برای هر سالن فوتسال، سانس‌های ۹۰ دقیقه‌ای از فردا تا ۲۰۲۷-۰۲-۲۸
    فقط برای کلیدهای (venue_id, slot_date, start_time) که وجود ندارند ساخته
    می‌شوند؛ سانس‌های رزروشده دست‌نخورده می‌مانند.
  - هر سالن تهران یک کاربر مدیر اختصاصی می‌گیرد (رمز Manager123! — در
    دیتابیس هش می‌شود؛ مدیران قدیمی قم دست‌نخورده می‌مانند).

اجرا روی سرور:
    docker exec -w /app futsal_backend python -m app.seed_city_catalog
"""
from __future__ import annotations

import json
from datetime import date, datetime, time, timedelta

from argon2 import PasswordHasher
from sqlmodel import Session, select

from app.database import engine
from app.models.slot import Slot, SlotStatus
from app.models.user import User, UserRole
from app.models.venue import Venue, VenuePaymentMode

MANAGER_PASSWORD = "Manager123!"
ph = PasswordHasher()

# ── تهران: ۱۰ سالن چندمنظورهٔ واقعی با فوتسال، برگرفته از poolticket.org ──
# base_price ریال است (قیمت پایهٔ پول‌تیکت × ۱۰ برای تبدیل تومان به ریال).
TEHRAN_VENUES = [
    {
        "name": "سالن توپی و چندمنظوره مهرورزان ملاباقری تهران",
        "address": "تهران، خیابان نبرد شمالی، خیابان پاسدار گمنام، بعد از میدان امام حسن مجتبی، مجموعه ورزشی شهید ملاباقری (مهرورزان)",
        "lat": 35.67305241779886,
        "lng": 51.476110536275485,
        "phone": "02133071900",
        "base_price": 2_800_000,
        "source": "https://www.poolticket.org/sports-complex/mehrvarzan-molabagheri-tehran",
    },
    {
        "name": "سالن چندمنظوره خوراکیان تهران",
        "address": "تهران، خیابان آزادی، خیابان استاد معین، خیابان دامپزشکی",
        "lat": 35.69123891534611,
        "lng": 51.342920064926155,
        "phone": None,
        "base_price": 1_400_000,
        "source": "https://www.poolticket.org/sports-complex/salon-chand-manzore-khorakiyan-tehran",
    },
    {
        "name": "سالن چندمنظوره بیمه تهران",
        "address": "تهران، اکباتان، انتهای خیابان ریاحی، روبروی خیابان سیزدهم",
        "lat": 35.70762328521648,
        "lng": 51.3215321302414,
        "phone": None,
        "base_price": 1_400_000,
        "source": "https://www.poolticket.org/sports-complex/bimeh-tehran",
    },
    {
        "name": "سالن چندمنظوره مجموعه ورزشی فرمانیه تهران",
        "address": "تهران، فرمانیه، خیابان شهید لواسانی، جنب سفارت ایتالیا، مجتمع پردیس فرمانیه",
        "lat": 35.80065097889236,
        "lng": 51.4635980129242,
        "phone": None,
        "base_price": 1_400_000,
        "source": "https://www.poolticket.org/sports-complex/farmanieh-tehran",
    },
    {
        "name": "سالن چندمنظوره مجموعه ورزشی آریا تهران",
        "address": "تهران، جنت‌آباد مرکزی، خیابان شاهین شمالی، خیابان چمران",
        "lat": 35.76328671258516,
        "lng": 51.31437239738105,
        "phone": None,
        "base_price": 1_400_000,
        "source": "https://www.poolticket.org/sports-complex/ariya-tehran",
    },
    {
        "name": "سالن چندمنظوره معلم تهران",
        "address": "تهران، نارمک، خیابان گلبرگ شرقی، خیابان برادران ضعیف، خیابان حمزه‌لوئی",
        "lat": 35.72799340821482,
        "lng": 51.5090560913086,
        "phone": None,
        "base_price": 1_400_000,
        "source": "https://www.poolticket.org/sports-complex/moalem-tehran",
    },
    {
        "name": "سالن چندمنظوره مدائن تهران",
        "address": "تهران، میدان معلم، بلوار مدائن، جلوتر از خیابان چهارده معصوم، مجموعه ورزشی الزهرا ۱۵",
        "lat": 35.660861642921816,
        "lng": 51.3270789384842,
        "phone": None,
        "base_price": 1_400_000,
        "source": "https://www.poolticket.org/sports-complex/madaen-tehran",
    },
    {
        "name": "سالن چندمنظوره مجموعه ورزشی شهید قیانوری تهران",
        "address": "تهران، خانی‌آباد نو، جنب اتوبان تندگویان، مجموعه شهید قیانوری",
        "lat": 35.62676907090115,
        "lng": 51.394976996698276,
        "phone": "09361082414",
        "base_price": 1_400_000,
        "source": "https://www.poolticket.org/sports-complex/qiyanori-tehran",
    },
    {
        "name": "سالن چندمنظوره شفق تهران",
        "address": "تهران، شهرک غرب، بلوار دادمان، خیابان شفق، نبش کوچه آفتاب",
        "lat": 35.76795472917724,
        "lng": 51.36950826645717,
        "phone": None,
        "base_price": 1_400_000,
        "source": "https://www.poolticket.org/sports-complex/shafaq-tehran",
    },
    {
        "name": "سالن چندمنظوره دیهیم تهران",
        "address": "تهران، خیابان مدنی، خیابان منصوری میری، بین هاشمی و سحر",
        "lat": 35.72287026749782,
        "lng": 51.471876965248285,
        "phone": None,
        "base_price": 1_400_000,
        "source": "https://www.poolticket.org/sports-complex/deyhim-tehran",
    },
]

# تعرفهٔ پایهٔ سالن‌ها در ایران به ریال (سانس ۹۰ دقیقه)
QOM_BASE_PRICES = {
    "سالن فوتسال حیدریان": 5_000_000,
    "سالن فوتسال امجدی قم": 4_000_000,
    "سالن فوتسال شهید اکبری قم": 4_500_000,
    "سالن فوتسال شهید ابراهیمی قم": 4_500_000,
    "سالن فوتسال بیطرفان قم": 3_500_000,
    "سالن فوتسال صدرا قم": 4_500_000,
    "سالن فوتسال نامجو قم": 3_500_000,
    "سالن فوتسال فاتحی قم": 4_000_000,
}

TEHRAN_MANAGERS = [
    ("مدیر سالن مهرورزان ملاباقری", "09121000001"),
    ("مدیر سالن خوراکیان", "09121000002"),
    ("مدیر سالن بیمه", "09121000003"),
    ("مدیر سالن فرمانیه", "09121000004"),
    ("مدیر سالن آریا", "09121000005"),
    ("مدیر سالن معلم", "09121000006"),
    ("مدیر سالن مدائن", "09121000007"),
    ("مدیر سالن شهید قیانوری", "09121000008"),
    ("مدیر سالن شفق", "09121000009"),
    ("مدیر سالن دیهیم", "09121000010"),
]

# ۱۰ سانس ۹۰ دقیقه‌ای؛ ضریب نسبت به قیمت پایهٔ سالن (ساعت اوج گران‌تر)
SLOTS = [
    (time(8, 0), 0.70),
    (time(9, 30), 0.80),
    (time(11, 0), 0.85),
    (time(12, 30), 0.90),
    (time(14, 0), 0.90),
    (time(15, 30), 1.00),
    (time(17, 0), 1.15),
    (time(18, 30), 1.25),
    (time(20, 0), 1.35),
    (time(21, 30), 1.20),
]

SLOT_DAYS_AHEAD = 132  # تا ۲۰۲۷-۰۲-۲۸ (چهار ماه)
WEEKEND_EVENING_FACTOR = 1.10  # پنجشنبه/جمعه عصر


def _round_10k(value: float) -> int:
    return int(round(value / 10_000.0) * 10_000)


def _slot_price(base: int, weekday: int, slot_index: int) -> int:
    multiplier = SLOTS[slot_index][1]
    # weekday: 0=دوشنبه … 3=پنجشنبه، 4=جمعه
    is_weekend_evening = weekday in (3, 4) and slot_index >= 6
    if is_weekend_evening:
        multiplier *= WEEKEND_EVENING_FACTOR
    return max(_round_10k(base * multiplier), 500_000)


def _upsert_manager(session: Session, full_name: str, phone: str) -> User:
    user = session.exec(select(User).where(User.phone == phone)).first()
    if user is None:
        user = User(
            phone=phone,
            full_name=full_name,
            hashed_password=ph.hash(MANAGER_PASSWORD),
            role=UserRole.VENUE_MANAGER,
            is_active=True,
            is_verified=True,
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        print(f"  + مدیر ساخته شد: {full_name} ({phone})")
    else:
        user.full_name = full_name
        user.role = UserRole.VENUE_MANAGER
        user.is_active = True
        user.is_verified = True
        session.add(user)
        session.commit()
    return user


def _upsert_tehran_venues(session: Session) -> list[Venue]:
    venues: list[Venue] = []
    for i, data in enumerate(TEHRAN_VENUES):
        name, phone = TEHRAN_MANAGERS[i]
        manager = _upsert_manager(session, name, phone)
        venue = session.exec(select(Venue).where(Venue.name == data["name"])).first()
        payload = {
            "address": data["address"],
            "latitude": data["lat"],
            "longitude": data["lng"],
            "phone": data["phone"],
            "description": (
                "سالن چندمنظورهٔ قابل رزرو برای فوتسال؛ اطلاعات مکانی و تماس از "
                "صفحهٔ رسمی همین مجموعه در پول‌تیکت برداشت شده است."
            ),
            "amenities": json.dumps(["سالن فوتسال", "رختکن", "پارکینگ"], ensure_ascii=False),
            "default_slot_price": data["base_price"],
            "payment_mode": VenuePaymentMode.BANK_RECEIPT,
            "manager_id": manager.id,
            "is_verified": True,
        }
        if venue is None:
            venue = Venue(name=data["name"], category="futsal", images="[]", **payload)
            session.add(venue)
            session.commit()
            session.refresh(venue)
            print(f"  + سالن تهران ساخته شد: {venue.name} (id={venue.id})")
        else:
            for key, value in payload.items():
                setattr(venue, key, value)
            venue.category = "futsal"
            session.add(venue)
            session.commit()
            print(f"  ~ سالن تهران به‌روزرسانی شد: {venue.name} (id={venue.id})")
        venues.append(venue)
    return venues


def _apply_qom_prices(session: Session) -> list[Venue]:
    venues: list[Venue] = []
    for name, base in QOM_BASE_PRICES.items():
        venue = session.exec(select(Venue).where(Venue.name == name)).first()
        if venue is None:
            print(f"  ! سالن قم پیدا نشد: {name}")
            continue
        if venue.category != "futsal":
            print(f"  ! رد شد (دستهٔ غیر فوتسال): {name}")
            continue
        venue.default_slot_price = base
        session.add(venue)
        venues.append(venue)
    session.commit()
    print(f"  {len(venues)} سالن قم قیمت پایه گرفتند")
    return venues


def _generate_slots(session: Session, venues: list[tuple[Venue, int]]) -> tuple[int, int, int]:
    start = date.today() + timedelta(days=1)
    end = start + timedelta(days=SLOT_DAYS_AHEAD - 1)
    created = updated = skipped_booked = 0

    for venue, base in venues:
        existing = {
            (s.slot_date, s.start_time): s
            for s in session.exec(
                select(Slot).where(
                    Slot.venue_id == venue.id,
                    Slot.slot_date >= start,
                    Slot.slot_date <= end,
                )
            ).all()
        }
        print(f"  سالن {venue.id} ({venue.name}): {len(existing)} سانس موجود در بازه")

        day = start
        while day <= end:
            weekday = day.weekday()
            for idx, (start_time, _mult) in enumerate(SLOTS):
                price = _slot_price(base, weekday, idx)
                slot = existing.get((day, start_time))
                if slot is None:
                    session.add(
                        Slot(
                            venue_id=venue.id,
                            slot_date=day,
                            start_time=start_time,
                            duration=90,
                            base_price=price,
                            current_price=price,
                            status=SlotStatus.AVAILABLE,
                            is_competition_enabled=False,
                        )
                    )
                    created += 1
                elif slot.status == SlotStatus.AVAILABLE and not slot.is_contract_slot:
                    slot.base_price = price
                    slot.current_price = price
                    updated += 1
                else:
                    skipped_booked += 1
            session.commit()
            day += timedelta(days=1)

    return created, updated, skipped_booked


def seed() -> None:
    with Session(engine) as session:
        print("سالن‌های قم: تنظیم قیمت پایه…")
        qom = _apply_qom_prices(session)
        print("سالن‌های تهران: درج/به‌روزرسانی + مدیر اختصاصی…")
        tehran = _upsert_tehran_venues(session)

        priced = [(v, QOM_BASE_PRICES[v.name]) for v in qom]
        priced += [(v, v.default_slot_price or 1_400_000) for v in tehran]

        print(f"تولید سانس ۹۰ دقیقه‌ای برای {len(priced)} سالن…")
        created, updated, skipped = _generate_slots(session, priced)
        print(
            f"تمام شد: {created} سانس ساخته شد، {updated} سانس موجود قیمت‌گذاری شد، "
            f"{skipped} سانس رزرو/قرارداد دست‌نخورده ماند."
        )


if __name__ == "__main__":
    seed()
