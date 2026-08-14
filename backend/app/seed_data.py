# backend/seed_data.py
from sqlmodel import Session
from app.database import engine
from app.models import User, Venue, Slot, Booking, PriceCompetition, Contract, UserRole, SlotStatus, CompetitionStatus
from app.utils.auth import get_password_hash
from datetime import datetime, date, time, timedelta, timezone
import random

def seed_database():
    with Session(engine) as session:
        print("🌱 Seeding database...")

        # ==================== USERS ====================
        users = [
            User(
                phone="09123456789",
                full_name="مدیر سیستم",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.SUPER_ADMIN,
                is_active=True,
                is_verified=True,
                created_at=datetime.now(timezone.utc)
            ),
            User(
                phone="09121111111",
                full_name="علی محمدی",
                hashed_password=get_password_hash("123456"),
                role=UserRole.VENUE_MANAGER,
                is_active=True,
                is_verified=True,
                created_at=datetime.now(timezone.utc)
            ),
            User(
                phone="09122222222",
                full_name="سارا حسینی",
                hashed_password=get_password_hash("123456"),
                role=UserRole.VENUE_MANAGER,
                is_active=True,
                is_verified=True,
                created_at=datetime.now(timezone.utc)
            ),
            User(
                phone="09123333333",
                full_name="رضا کریمی",
                hashed_password=get_password_hash("123456"),
                role=UserRole.USER,
                is_active=True,
                is_verified=True,
                created_at=datetime.now(timezone.utc)
            ),
            User(
                phone="09124444444",
                full_name="مریم احمدی",
                hashed_password=get_password_hash("123456"),
                role=UserRole.USER,
                is_active=True,
                is_verified=True,
                created_at=datetime.now(timezone.utc)
            ),
            User(
                phone="09125555555",
                full_name="محمد نوروزی",
                hashed_password=get_password_hash("123456"),
                role=UserRole.USER,
                is_active=True,
                is_verified=True,
                created_at=datetime.now(timezone.utc)
            ),
        ]
        session.add_all(users)
        session.commit()
        print(f"✅ Created {len(users)} users")

        # ==================== VENUES ====================
        venues_data = [
            {
                "name": "سالن آبی",
                "address": "تهران، خیابان آزادی، نبش خیابان ۱۵",
                "latitude": 35.6892,
                "longitude": 51.3890,
                "phone": "02112345678",
                "description": "سالن فوتسال با امکانات کامل و استانداردهای بین‌المللی",
                "amenities": '["پارکینگ", "کافه", "دوش", "سالن انتظار", "تلویزیون"]',
                "images": '["https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600"]',
                "is_verified": True,
                "manager_id": 2,
            },
            {
                "name": "سالن سبز",
                "address": "تهران، خیابان ولیعصر، تقاطع خیابان ۵۰",
                "latitude": 35.6992,
                "longitude": 51.3990,
                "phone": "02187654321",
                "description": "سالن فوتسال با کفپوش استاندارد و سیستم صوتی پیشرفته",
                "amenities": '["پارکینگ", "کافه", "دوش"]',
                "images": '["https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600"]',
                "is_verified": True,
                "manager_id": 3,
            },
            {
                "name": "سالن قرمز",
                "address": "تهران، خیابان انقلاب، خیابان ۱۲",
                "latitude": 35.6792,
                "longitude": 51.3790,
                "phone": "02198765432",
                "description": "سالن فوتسال مدرن با امکانات کامل",
                "amenities": '["پارکینگ", "دوش", "سالن انتظار", "اینترنت"]',
                "images": '["https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600"]',
                "is_verified": True,
                "manager_id": 2,
            },
        ]

        venues = []
        for v_data in venues_data:
            venue = Venue(**v_data)
            session.add(venue)
            venues.append(venue)
        
        session.commit()
        print(f"✅ Created {len(venues)} venues")

        # ==================== SLOTS ====================
        today = date.today()
        slots = []
        
        for venue in venues:
            # سانس‌های ۳ روز آینده
            for day_offset in range(3):
                slot_date = today + timedelta(days=day_offset)
                
                # سانس‌ها از ۸ صبح تا ۱۱ شب
                start_hours = [8, 10, 12, 14, 16, 18, 20]
                
                for hour in start_hours:
                    start_time = time(hour, 0)
                    price = random.randint(200000, 500000)
                    
                    # بعضی سانس‌ها پر هستند
                    status = SlotStatus.BOOKED if random.random() < 0.3 else SlotStatus.AVAILABLE
                    
                    slot = Slot(
                        venue_id=venue.id,
                        slot_date=slot_date,
                        start_time=start_time,
                        duration=90,
                        base_price=price,
                        current_price=price,
                        status=status,
                        is_competition_enabled=False
                    )
                    session.add(slot)
                    slots.append(slot)
        
        session.commit()
        print(f"✅ Created {len(slots)} slots")

        # ==================== BOOKINGS ====================
        bookings = []
        
        # رزروهای نمونه
        booking_data = [
            {"slot_id": slots[0].id, "user_id": 4},
            {"slot_id": slots[2].id, "user_id": 5},
            {"slot_id": slots[5].id, "user_id": 6},
            {"slot_id": slots[8].id, "user_id": 4},
            {"slot_id": slots[11].id, "user_id": 5},
        ]
        
        for b_data in booking_data:
            booking = Booking(
                slot_id=b_data["slot_id"],
                user_id=b_data["user_id"],
                payment_amount=random.randint(200000, 500000),
                status="confirmed"
            )
            session.add(booking)
            bookings.append(booking)
        
        session.commit()
        print(f"✅ Created {len(bookings)} bookings")

        # ==================== COMPETITIONS ====================
        competitions = []
        
        # رقابت‌های فعال
        for i in range(3):
            slot = slots[i * 3 + 1] if len(slots) > i * 3 + 1 else slots[0]
            competition = PriceCompetition(
                slot_id=slot.id,
                venue_id=slot.venue_id,
                venue_manager_id=random.choice([2, 3]),
                offered_price=random.randint(150000, 250000),
                status=CompetitionStatus.ACTIVE,
                expires_at=datetime.now(timezone.utc) + timedelta(hours=random.randint(2, 12))
            )
            session.add(competition)
            competitions.append(competition)
        
        session.commit()
        print(f"✅ Created {len(competitions)} competitions")

        # ==================== CONTRACTS ====================
        contracts = []
        
        # قرارداد نمونه
        contract = Contract(
            user_id=4,
            venue_id=venues[0].id,
            start_date=today,
            end_date=today + timedelta(days=365),
            recurrence="weekly",
            day_of_week=1,  # یکشنبه
            start_time=time(17, 0),
            duration=90,
            original_price=300000,
            discounted_price=250000,
            total_amount=13000000,
            status="active",
            description="قرارداد یک ساله تیم آبی‌ها"
        )
        session.add(contract)
        contracts.append(contract)
        
        session.commit()
        print(f"✅ Created {len(contracts)} contract")

        print("\n🎉 Database seeded successfully!")
        print("=" * 50)
        print("👤 Users:")
        print("  - Admin: 09123456789 / admin123")
        print("  - Manager1: 09121111111 / 123456")
        print("  - Manager2: 09122222222 / 123456")
        print("  - User1: 09123333333 / 123456")
        print("  - User2: 09124444444 / 123456")
        print("  - User3: 09125555555 / 123456")
        print("=" * 50)

if __name__ == "__main__":
    seed_database()