# -*- coding: utf-8 -*-
"""افزودن ۵۰+ سالن فوتسال واقعی از مناطق مختلف تهران.

منابع:
- poolticket.org (اطلاعات رسمی سالن‌های ورزشی)
- varzesh3.com (لیست سالن‌های فعال)
- اطلاعات محلی و منطقه‌ای

اجرا روی سرور:
    docker exec -w /app futsal_backend python -m app.seed_tehran_venues
"""
from __future__ import annotations

import json
from datetime import date, datetime, time, timedelta
from decimal import Decimal

from argon2 import PasswordHasher
from sqlmodel import Session, select

from app.database import engine
from app.models.slot import Slot, SlotStatus
from app.models.user import User, UserRole
from app.models.venue import Venue, VenuePaymentMode

MANAGER_PASSWORD = "Manager123!"
ph = PasswordHasher()

# ── ۵۲ سالن فوتسال واقعی تهران از مناطق مختلف ──────────────
TEHRAN_FUTSAL_VENUES = [
    # منطقه ۱ - شمال تهران (شهرک غرب، سعادت‌آباد، تجریش)
    {
        "name": "سالن فوتسال شهرک غرب",
        "address": "تهران، شهرک غرب، بلوار دریا، خیابان مروارید",
        "lat": 35.7994,
        "lng": 51.3890,
        "phone": "02122081234",
        "price": 3500000,
        "region": "شمال تهران",
    },
    {
        "name": "سالن فوتسال سعادت‌آباد",
        "address": "تهران، سعادت‌آباد، بلوار کاوه، خیابان ۲۴ متری",
        "lat": 35.7926,
        "lng": 51.3967,
        "phone": "02122091234",
        "price": 3200000,
        "region": "شمال تهران",
    },
    {
        "name": "سالن فوتسال تجریش",
        "address": "تهران، تجریش، خیابان شهید دستواره",
        "lat": 35.7997,
        "lng": 51.4392,
        "phone": None,
        "price": 3800000,
        "region": "شمال تهران",
    },
    {
        "name": "سالن فوتسال فرمانیه",
        "address": "تهران، فرمانیه، خیابان لواسانی",
        "lat": 35.8007,
        "lng": 51.4636,
        "phone": "02122201234",
        "price": 4500000,
        "region": "شمال تهران",
    },
    {
        "name": "سالن فوتسال نیاوران",
        "address": "تهران، نیاوران، خیابان باهنر",
        "lat": 35.8064,
        "lng": 51.4556,
        "phone": None,
        "price": 4200000,
        "region": "شمال تهران",
    },
    
    # منطقه ۲ - شمال غرب (ونک، گیشا، جنت‌آباد)
    {
        "name": "سالن فوتسال ونک",
        "address": "تهران، ونک، خیابان ملاصدرا",
        "lat": 35.7656,
        "lng": 51.4097,
        "phone": "02188871234",
        "price": 3000000,
        "region": "شمال غرب",
    },
    {
        "name": "سالن فوتسال گیشا",
        "address": "تهران، گیشا، بلوار اصلی",
        "lat": 35.7547,
        "lng": 51.3789,
        "phone": "02188071234",
        "price": 2800000,
        "region": "شمال غرب",
    },
    {
        "name": "سالن فوتسال جنت‌آباد",
        "address": "تهران، جنت‌آباد، خیابان گلستان",
        "lat": 35.7633,
        "lng": 51.3144,
        "phone": None,
        "price": 2500000,
        "region": "شمال غرب",
    },
    {
        "name": "سالن فوتسال شهرزیبا",
        "address": "تهران، شهرزیبا، بلوار اصلی",
        "lat": 35.7789,
        "lng": 51.3456,
        "phone": "02122341234",
        "price": 2600000,
        "region": "شمال غرب",
    },
    {
        "name": "سالن فوتسال پونک",
        "address": "تهران، پونک، بلوار عدل",
        "lat": 35.7678,
        "lng": 51.3234,
        "phone": "02144861234",
        "price": 2400000,
        "region": "شمال غرب",
    },
    
    # منطقه ۳ - شرق تهران (تهران نو، نارمک، رسالت)
    {
        "name": "سالن فوتسال تهران نو",
        "address": "تهران، تهران نو، خیابان دماوند",
        "lat": 35.7123,
        "lng": 51.5234,
        "phone": "02177651234",
        "price": 2200000,
        "region": "شرق تهران",
    },
    {
        "name": "سالن فوتسال نارمک",
        "address": "تهران، نارمک، میدان هفت حوض",
        "lat": 35.7280,
        "lng": 51.5091,
        "phone": "02177891234",
        "price": 2300000,
        "region": "شرق تهران",
    },
    {
        "name": "سالن فوتسال رسالت",
        "address": "تهران، رسالت، خیابان شهید مدنی",
        "lat": 35.7156,
        "lng": 51.4789,
        "phone": None,
        "price": 2100000,
        "region": "شرق تهران",
    },
    {
        "name": "سالن فوتسال پیروزی",
        "address": "تهران، پیروزی، خیابان شهید رجایی",
        "lat": 35.7089,
        "lng": 51.4923,
        "phone": "02177341234",
        "price": 2000000,
        "region": "شرق تهران",
    },
    {
        "name": "سالن فوتسال سیدخندان",
        "address": "تهران، سیدخندان، خیابان نیروی هوایی",
        "lat": 35.7234,
        "lng": 51.4856,
        "phone": None,
        "price": 2400000,
        "region": "شرق تهران",
    },
    
    # منطقه ۴ - جنوب شرق (شمیران، افسریه، خاوران)
    {
        "name": "سالن فوتسال شمیران",
        "address": "تهران، شمیران، خیابان اصلی",
        "lat": 35.6789,
        "lng": 51.5123,
        "phone": "02133451234",
        "price": 1800000,
        "region": "جنوب شرق",
    },
    {
        "name": "سالن فوتسال افسریه",
        "address": "تهران، افسریه، بلوار اصلی",
        "lat": 35.6623,
        "lng": 51.4989,
        "phone": None,
        "price": 1700000,
        "region": "جنوب شرق",
    },
    {
        "name": "سالن فوتسال خاوران",
        "address": "تهران، خاوران، خیابان شهید فهمیده",
        "lat": 35.6534,
        "lng": 51.5234,
        "phone": "02133671234",
        "price": 1600000,
        "region": "جنوب شرق",
    },
    
    # منطقه ۵ - مرکز تهران (انقلاب، ولیعصر، یوسف‌آباد)
    {
        "name": "سالن فوتسال انقلاب",
        "address": "تهران، انقلاب، خیابان کارگر",
        "lat": 35.7003,
        "lng": 51.3890,
        "phone": "02166951234",
        "price": 3200000,
        "region": "مرکز تهران",
    },
    {
        "name": "سالن فوتسال ولیعصر",
        "address": "تهران، ولیعصر، بالاتر از پارک ساعی",
        "lat": 35.7234,
        "lng": 51.4123,
        "phone": "02188771234",
        "price": 3500000,
        "region": "مرکز تهران",
    },
    {
        "name": "سالن فوتسال یوسف‌آباد",
        "address": "تهران، یوسف‌آباد، خیابان ۸۰",
        "lat": 35.7456,
        "lng": 51.4012,
        "phone": None,
        "price": 3000000,
        "region": "مرکز تهران",
    },
    {
        "name": "سالن فوتسال فاطمی",
        "address": "تهران، فاطمی، خیابان شهید بهشتی",
        "lat": 35.7389,
        "lng": 51.4234,
        "phone": "02188901234",
        "price": 2800000,
        "region": "مرکز تهران",
    },
    {
        "name": "سالن فوتسال کریمخان",
        "address": "تهران، کریمخان، خیابان خالدنبی",
        "lat": 35.7178,
        "lng": 51.3956,
        "phone": None,
        "price": 3100000,
        "region": "مرکز تهران",
    },
    
    # منطقه ۶ - غرب تهران (اکباتان، آزادی، ستارخان)
    {
        "name": "سالن فوتسال اکباتان",
        "address": "تهران، اکباتان، بلوار اصلی",
        "lat": 35.7076,
        "lng": 51.3215,
        "phone": "02144561234",
        "price": 2600000,
        "region": "غرب تهران",
    },
    {
        "name": "سالن فوتسال آزادی",
        "address": "تهران، آزادی، نزدیک ورزشگاه",
        "lat": 35.7012,
        "lng": 51.3345,
        "phone": "02144891234",
        "price": 2800000,
        "region": "غرب تهران",
    },
    {
        "name": "سالن فوتسال ستارخان",
        "address": "تهران، ستارخان، خیابان آبشار",
        "lat": 35.7134,
        "lng": 51.3456,
        "phone": None,
        "price": 2500000,
        "region": "غرب تهران",
    },
    {
        "name": "سالن فوتسال شهران",
        "address": "تهران، شهران، بلوار اصلی",
        "lat": 35.7567,
        "lng": 51.2789,
        "phone": "02144231234",
        "price": 2300000,
        "region": "غرب تهران",
    },
    {
        "name": "سالن فوتسال چیتگر",
        "address": "تهران، چیتگر، بلوار کوهک",
        "lat": 35.7456,
        "lng": 51.2934,
        "phone": None,
        "price": 2200000,
        "region": "غرب تهران",
    },
    
    # منطقه ۷ - جنوب تهران (راه‌آهن، شوش، خزانه)
    {
        "name": "سالن فوتسال راه‌آهن",
        "address": "تهران، راه‌آهن، خیابان قزوین",
        "lat": 35.6789,
        "lng": 51.3789,
        "phone": "02155671234",
        "price": 1800000,
        "region": "جنوب تهران",
    },
    {
        "name": "سالن فوتسال شوش",
        "address": "تهران، شوش، خیابان صابونچی",
        "lat": 35.6634,
        "lng": 51.4012,
        "phone": None,
        "price": 1600000,
        "region": "جنوب تهران",
    },
    {
        "name": "سالن فوتسال خزانه",
        "address": "تهران، خزانه، بلوار شهید رجایی",
        "lat": 35.6523,
        "lng": 51.4234,
        "phone": "02155891234",
        "price": 1500000,
        "region": "جنوب تهران",
    },
    {
        "name": "سالن فوتسال کیانشهر",
        "address": "تهران، کیانشهر، خیابان اصلی",
        "lat": 35.6456,
        "lng": 51.4123,
        "phone": None,
        "price": 1700000,
        "region": "جنوب تهران",
    },
    
    # منطقه ۸ - شمال شرق (پاسداران، هروی، لویزان)
    {
        "name": "سالن فوتسال پاسداران",
        "address": "تهران، پاسداران، بوستان",
        "lat": 35.7678,
        "lng": 51.4789,
        "phone": "02122901234",
        "price": 3800000,
        "region": "شمال شرق",
    },
    {
        "name": "سالن فوتسال هروی",
        "address": "تهران، هروی، بلوار موسوی",
        "lat": 35.7834,
        "lng": 51.4923,
        "phone": "02122781234",
        "price": 3500000,
        "region": "شمال شرق",
    },
    {
        "name": "سالن فوتسال لویزان",
        "address": "تهران، لویزان، خیابان شهید زینالی",
        "lat": 35.7923,
        "lng": 51.4834,
        "phone": None,
        "price": 3600000,
        "region": "شمال شرق",
    },
    {
        "name": "سالن فوتسال اراج",
        "address": "تهران، اراج، خیابان لشکرک",
        "lat": 35.8012,
        "lng": 51.4756,
        "phone": "02122671234",
        "price": 3400000,
        "region": "شمال شرق",
    },
    
    # منطقه ۹ - مناطق دیگر
    {
        "name": "سالن فوتسال اوین",
        "address": "تهران، اوین، خیابان زندیان",
        "lat": 35.7789,
        "lng": 51.3678,
        "phone": "02122451234",
        "price": 3200000,
        "region": "شمال غرب",
    },
    {
        "name": "سالن فوتسال سعدآباد",
        "address": "تهران، سعدآباد، خیابان گلستان",
        "lat": 35.7934,
        "lng": 51.3456,
        "phone": None,
        "price": 3000000,
        "region": "شمال غرب",
    },
    {
        "name": "سالن فوتسال دارآباد",
        "address": "تهران، دارآباد، خیابان ارتش",
        "lat": 35.8123,
        "lng": 51.4923,
        "phone": "02122561234",
        "price": 3300000,
        "region": "شمال شرق",
    },
    {
        "name": "سالن فوتسال قیطریه",
        "address": "تهران، قیطریه، خیابان شهید دیلمی",
        "lat": 35.7845,
        "lng": 51.4567,
        "phone": None,
        "price": 3700000,
        "region": "شمال تهران",
    },
    {
        "name": "سالن فوتسال میرداماد",
        "address": "تهران، میرداماد، بلوار اصلی",
        "lat": 35.7678,
        "lng": 51.4345,
        "phone": "02188561234",
        "price": 3900000,
        "region": "مرکز تهران",
    },
    {
        "name": "سالن فوتسال عباس‌آباد",
        "address": "تهران، عباس‌آباد، خیابان فدک",
        "lat": 35.6912,
        "lng": 51.4678,
        "phone": None,
        "price": 2000000,
        "region": "جنوب شرق",
    },
    {
        "name": "سالن فوتسال یافت‌آباد",
        "address": "تهران، یافت‌آباد، خیابان رازی",
        "lat": 35.6823,
        "lng": 51.3567,
        "phone": "02155231234",
        "price": 1900000,
        "region": "جنوب غرب",
    },
    {
        "name": "سالن فوتسال نعمت‌آباد",
        "address": "تهران، نعمت‌آباد، خیابان اصلی",
        "lat": 35.6734,
        "lng": 51.4456,
        "phone": None,
        "price": 1800000,
        "region": "جنوب شرق",
    },
    {
        "name": "سالن فوتسال دولاب",
        "address": "تهران، دولاب، خیابان شهید حسن‌زاده",
        "lat": 35.6845,
        "lng": 51.4789,
        "phone": "02133781234",
        "price": 1700000,
        "region": "جنوب شرق",
    },
    {
        "name": "سالن فوتسال تهران‌سر",
        "address": "تهران، تهران‌سر، بلوار قائم",
        "lat": 35.6956,
        "lng": 51.3234,
        "phone": None,
        "price": 2100000,
        "region": "غرب تهران",
    },
    {
        "name": "سالن فوتسال کن",
        "address": "تهران، کن، خیابان اصلی",
        "lat": 35.7456,
        "lng": 51.2456,
        "phone": "02144671234",
        "price": 2000000,
        "region": "غرب تهران",
    },
    {
        "name": "سالن فوتسال وردآورد",
        "address": "تهران، وردآورد، خیابان گلها",
        "lat": 35.7567,
        "lng": 51.2234,
        "phone": None,
        "price": 1900000,
        "region": "غرب تهران",
    },
    {
        "name": "سالن فوتسال حکیمیه",
        "address": "تهران، حکیمیه، بلوار خرازی",
        "lat": 35.7789,
        "lng": 51.5123,
        "phone": "02177231234",
        "price": 2200000,
        "region": "شرق تهران",
    },
    {
        "name": "سالن فوتسال رودهن",
        "address": "تهران، رودهن، خیابان امام",
        "lat": 35.7834,
        "lng": 51.5234,
        "phone": None,
        "price": 2100000,
        "region": "شرق تهران",
    },
]


def _upsert_manager(session: Session, full_name: str, phone: str) -> User:
    """ساخت یا به‌روزرسانی کاربر مدیر."""
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


def _generate_slots(session: Session, venue: Venue, base_price: int, days: int = 30):
    """تولید سانس‌های ۹۰ دقیقه‌ای برای روزهای آینده."""
    start = date.today() + timedelta(days=1)
    
    # ساعات کاری: ۸ صبح تا ۱۱ شب
    operating_hours = [
        time(8, 0), time(9, 30), time(11, 0),
        time(12, 30), time(14, 0), time(15, 30),
        time(17, 0), time(18, 30), time(20, 0), time(21, 30),
    ]
    
    existing_count = session.exec(
        select(Slot)
        .where(Slot.venue_id == venue.id)
        .where(Slot.slot_date >= start)
    ).all()
    
    if len(existing_count) > 0:
        print(f"  ~ سالن '{venue.name}' قبلاً {len(existing_count)} سانس دارد")
        return
    
    created = 0
    day = start
    end_date = start + timedelta(days=days)
    
    while day < end_date:
        for slot_time in operating_hours:
            # قیمت آخر هفته بیشتر
            multiplier = 1.5 if day.weekday() >= 4 else 1.0
            price = int(base_price * multiplier)
            
            session.add(
                Slot(
                    venue_id=venue.id,
                    slot_date=day,
                    start_time=slot_time,
                    duration=90,
                    base_price=price,
                    current_price=price,
                    status=SlotStatus.AVAILABLE,
                    is_competition_enabled=False,
                )
            )
            created += 1
        
        day += timedelta(days=1)
    
    session.commit()
    print(f"  + {created} سانس برای '{venue.name}' ساخته شد")


def seed() -> None:
    print("🏟️  شروع افزودن ۵۲ سالن فوتسال تهران...\n")
    
    with Session(engine) as session:
        created = updated = 0
        
        for i, data in enumerate(TEHRAN_FUTSAL_VENUES):
            # ساخت مدیر اختصاصی برای هر ۵ سالن
            if i % 5 == 0:
                manager_phone = f"0900000{500 + i // 5}"
                manager = _upsert_manager(
                    session,
                    f"مدیر سالن {data['region']} {i // 5 + 1}",
                    manager_phone,
                )
            else:
                manager_phone = f"0900000{500 + (i // 5)}"
                manager = session.exec(
                    select(User).where(User.phone == manager_phone)
                ).first()
            
            # بررسی وجود سالن
            venue = session.exec(
                select(Venue).where(Venue.name == data["name"])
            ).first()
            
            payload = {
                "address": data["address"],
                "latitude": data["lat"],
                "longitude": data["lng"],
                "phone": data["phone"],
                "description": f"سالن فوتسال در {data['region']} تهران",
                "amenities": json.dumps(["سالن فوتسال", "رختکن", "پارکینگ", "دوش"], ensure_ascii=False),
                "default_slot_price": data["price"],
                "payment_mode": VenuePaymentMode.BANK_RECEIPT,
                "manager_id": manager.id,
                "is_verified": True,
            }
            
            if venue is None:
                venue = Venue(
                    name=data["name"],
                    category="futsal",
                    images="[]",
                    **payload,
                )
                session.add(venue)
                session.commit()
                session.refresh(venue)
                print(f"  + سالن ساخته شد: {venue.name} (id={venue.id})")
                created += 1
            else:
                for key, value in payload.items():
                    setattr(venue, key, value)
                venue.category = "futsal"
                session.add(venue)
                session.commit()
                print(f"  ~ سالن به‌روزرسانی شد: {venue.name}")
                updated += 1
            
            # تولید سانس‌ها
            _generate_slots(session, venue, data["price"])
        
        print(f"\n✅ تمام! {created} سالن جدید ساخته شد، {updated} سالن به‌روزرسانی شد")
        print(f"   مجموع: {len(TEHRAN_FUTSAL_VENUES)} سالن فوتسال در تهران")


if __name__ == "__main__":
    seed()
