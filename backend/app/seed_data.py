# backend/seed_data.py
from sqlmodel import Session, select
from app.database import engine
from app.models import User, Venue, Slot, Booking, PriceCompetition, Contract, UserRole, SlotStatus, CompetitionStatus
from app.models.favorite import FavoriteVenue
from app.models.team import (
    Team, TeamMember, TeamInvitation, TeamJoinRequest, TeamBooking, TeamDues,
    TeamVisibility, TeamMemberRole, TeamMemberStatus, TeamInvitationStatus,
    TeamJoinRequestStatus, TeamDuesMethod, TeamAuditAction, TeamAuditEvent, TeamMessage,
)
from app.models.transaction import (
    FinancialTransaction, ExpenseCategory,
    TransactionType, TransactionDirection, TransactionMethod, TransactionStatus,
    CounterpartyType, TransactionSourceType,
)
from app.models.pricing_rule import PricingRule, ModifierType
from app.models.coupon import Coupon, CouponRedemption, CouponType
from app.models.loyalty import LoyaltyPoint, LoyaltyReason
from app.models.holiday import Holiday
from app.models.customer import VenueCustomer, CrmCampaign
from app.models.game import (
    Game, GameParticipant, GameJoinRequest, GameInvitation, GameInviteLink,
    GameWaitlist, GamePayment,
    GameVisibility, GameStatus, SkillLevel, PaymentMode, JoinPolicy,
    ParticipantRole, ParticipantStatus, JoinRequestStatus, InvitationStatus,
    WaitlistStatus, GamePaymentStatus,
)
from app.utils.auth import get_password_hash
from datetime import datetime, date, time, timedelta, timezone
import random


def seed_database():
    with Session(engine) as session:
        print("Seeding database...")

        # ==================== USERS ====================
        users = [
            User(phone="09123456789", full_name="مدیر سیستم", hashed_password=get_password_hash("admin123"), role=UserRole.SUPER_ADMIN, is_active=True, is_verified=True, created_at=datetime.now(timezone.utc)),
            User(phone="09121111111", full_name="علی محمدی", hashed_password=get_password_hash("123456"), role=UserRole.VENUE_MANAGER, is_active=True, is_verified=True, created_at=datetime.now(timezone.utc)),
            User(phone="09122222222", full_name="سارا حسینی", hashed_password=get_password_hash("123456"), role=UserRole.VENUE_MANAGER, is_active=True, is_verified=True, created_at=datetime.now(timezone.utc)),
            User(phone="09123333333", full_name="رضا کریمی", hashed_password=get_password_hash("123456"), role=UserRole.USER, is_active=True, is_verified=True, created_at=datetime.now(timezone.utc)),
            User(phone="09124444444", full_name="مریم احمدی", hashed_password=get_password_hash("123456"), role=UserRole.USER, is_active=True, is_verified=True, created_at=datetime.now(timezone.utc)),
            User(phone="09125555555", full_name="محمد نوروزی", hashed_password=get_password_hash("123456"), role=UserRole.USER, is_active=True, is_verified=True, created_at=datetime.now(timezone.utc)),
        ]
        session.add_all(users)
        session.commit()
        print(f"Created {len(users)} users")

        # ==================== VENUES ====================
        venues_data = [
            {"name": "سالن آبی", "address": "تهران، خیابان آزادی، نبش خیابان ۱۵", "latitude": 35.6892, "longitude": 51.3890, "phone": "02112345678", "description": "سالن فوتسال با امکانات کامل و استانداردهای بین‌المللی", "amenities": '["پارکینگ", "کافه", "دوش", "سالن انتظار", "تلویزیون"]', "images": '["https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600"]', "is_verified": True, "manager_id": 2},
            {"name": "سالن سبز", "address": "تهران، خیابان ولیعصر، تقاطع خیابان ۵۰", "latitude": 35.6992, "longitude": 51.3990, "phone": "02187654321", "description": "سالن فوتسال با کفپوش استاندارد و سیستم صوتی پیشرفته", "amenities": '["پارکینگ", "کافه", "دوش"]', "images": '["https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600"]', "is_verified": True, "manager_id": 3},
            {"name": "سالن قرمز", "address": "تهران، خیابان انقلاب، خیابان ۱۲", "latitude": 35.6792, "longitude": 51.3790, "phone": "02198765432", "description": "سالن فوتسال مدرن با امکانات کامل", "amenities": '["پارکینگ", "دوش", "سالن انتظار", "اینترنت"]', "images": '["https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600"]', "is_verified": True, "manager_id": 2},
        ]
        venues = []
        for v_data in venues_data:
            venue = Venue(**v_data)
            session.add(venue)
            venues.append(venue)
        session.commit()
        print(f"Created {len(venues)} venues")

        # ==================== SLOTS ====================
        today = date.today()
        slots = []
        for venue in venues:
            for day_offset in range(3):
                slot_date = today + timedelta(days=day_offset)
                start_hours = [8, 10, 12, 14, 16, 18, 20]
                for hour in start_hours:
                    start_time = time(hour, 0)
                    price = random.randint(200000, 500000)
                    status = SlotStatus.BOOKED if random.random() < 0.3 else SlotStatus.AVAILABLE
                    slot = Slot(venue_id=venue.id, slot_date=slot_date, start_time=start_time, duration=90, base_price=price, current_price=price, status=status, is_competition_enabled=False)
                    session.add(slot)
                    slots.append(slot)
        session.commit()
        print(f"Created {len(slots)} slots")

        # ==================== BOOKINGS ====================
        bookings = []
        booking_data = [
            {"slot_id": slots[0].id, "user_id": 4},
            {"slot_id": slots[2].id, "user_id": 5},
            {"slot_id": slots[5].id, "user_id": 6},
            {"slot_id": slots[8].id, "user_id": 4},
            {"slot_id": slots[11].id, "user_id": 5},
        ]
        for b_data in booking_data:
            booking = Booking(slot_id=b_data["slot_id"], user_id=b_data["user_id"], payment_amount=random.randint(200000, 500000), status="confirmed")
            session.add(booking)
            bookings.append(booking)
        session.commit()
        print(f"Created {len(bookings)} bookings")

        # ==================== COMPETITIONS ====================
        competitions = []
        for i in range(3):
            slot = slots[i * 3 + 1] if len(slots) > i * 3 + 1 else slots[0]
            competition = PriceCompetition(slot_id=slot.id, venue_id=slot.venue_id, venue_manager_id=random.choice([2, 3]), offered_price=random.randint(150000, 250000), status=CompetitionStatus.ACTIVE, expires_at=datetime.now(timezone.utc) + timedelta(hours=random.randint(2, 12)))
            session.add(competition)
            competitions.append(competition)
        session.commit()
        print(f"Created {len(competitions)} competitions")

        # ==================== CONTRACTS ====================
        contract = Contract(user_id=4, venue_id=venues[0].id, start_date=today, end_date=today + timedelta(days=365), recurrence="weekly", day_of_week=1, start_time=time(17, 0), duration=90, original_price=300000, discounted_price=250000, total_amount=13000000, status="active", description="قرارداد یک ساله تیم آبی‌ها")
        session.add(contract)
        session.commit()
        print("Created 1 contract")

        # ==================== FAVORITES ====================
        favorites = [
            FavoriteVenue(user_id=4, venue_id=venues[0].id),
            FavoriteVenue(user_id=4, venue_id=venues[1].id),
            FavoriteVenue(user_id=5, venue_id=venues[0].id),
            FavoriteVenue(user_id=5, venue_id=venues[2].id),
            FavoriteVenue(user_id=6, venue_id=venues[1].id),
        ]
        session.add_all(favorites)
        session.commit()
        print(f"Created {len(favorites)} favorites")

        # ==================== TEAMS ====================
        team1 = Team(name="آبی‌های تهران", description="تیم دوستانه فوتبال سالنی", captain_id=4, sport="futsal", visibility=TeamVisibility.PUBLIC, is_active=True, min_members=5, is_official=True, official_since=datetime.now(timezone.utc))
        team2 = Team(name="سبزپوشان", description="تیم حرفه‌ای فوتسال", captain_id=5, sport="futsal", visibility=TeamVisibility.INVITE_ONLY, is_active=True, min_members=5, is_official=False)
        session.add(team1)
        session.add(team2)
        session.commit()
        print(f"Created 2 teams")

        members = [
            TeamMember(team_id=team1.id, user_id=4, role=TeamMemberRole.CAPTAIN, status=TeamMemberStatus.ACTIVE),
            TeamMember(team_id=team1.id, user_id=5, role=TeamMemberRole.ADMIN, status=TeamMemberStatus.ACTIVE),
            TeamMember(team_id=team1.id, user_id=6, role=TeamMemberRole.MEMBER, status=TeamMemberStatus.ACTIVE),
            TeamMember(team_id=team2.id, user_id=5, role=TeamMemberRole.CAPTAIN, status=TeamMemberStatus.ACTIVE),
            TeamMember(team_id=team2.id, user_id=4, role=TeamMemberRole.MEMBER, status=TeamMemberStatus.ACTIVE),
        ]
        session.add_all(members)
        session.commit()
        print(f"Created {len(members)} team members")

        invitations = [
            TeamInvitation(team_id=team1.id, invitee_user_id=6, invited_by=4, status=TeamInvitationStatus.ACCEPTED, answered_at=datetime.now(timezone.utc)),
        ]
        session.add_all(invitations)
        session.commit()
        print(f"Created {len(invitations)} team invitations")

        join_requests = [
            TeamJoinRequest(team_id=team1.id, user_id=6, status=TeamJoinRequestStatus.APPROVED, reviewed_by=4, reviewed_at=datetime.now(timezone.utc), message="میخواهم عضو شوم"),
        ]
        session.add_all(join_requests)
        session.commit()
        print(f"Created {len(join_requests)} team join requests")

        dues = [
            TeamDues(team_id=team1.id, user_id=5, title="سهم جمعه", amount=150000, due_date=today + timedelta(days=3), is_paid=True, paid_at=datetime.now(timezone.utc), paid_by=5, payment_method=TeamDuesMethod.CASH),
            TeamDues(team_id=team1.id, user_id=6, title="سهم جمعه", amount=150000, due_date=today + timedelta(days=3), is_paid=False),
        ]
        session.add_all(dues)
        session.commit()
        print(f"Created {len(dues)} team dues")

        audit_events = [
            TeamAuditEvent(team_id=team1.id, actor_id=4, action=TeamAuditAction.CREATED, data='{}'),
            TeamAuditEvent(team_id=team1.id, actor_id=4, action=TeamAuditAction.MEMBER_ACCEPTED, data='{"user_id": 5}'),
        ]
        session.add_all(audit_events)
        session.commit()
        print(f"Created {len(audit_events)} team audit events")

        messages = [
            TeamMessage(team_id=team1.id, user_id=4, content="سلام بچه‌ها، جمعه ساعت ۵ بازی داریم"),
            TeamMessage(team_id=team1.id, user_id=5, content="عالیه، من هستم"),
            TeamMessage(team_id=team1.id, user_id=6, content="من هم میام"),
        ]
        session.add_all(messages)
        session.commit()
        print(f"Created {len(messages)} team messages")

        # ==================== FINANCE LEDGER ====================
        expense_cats = [
            ExpenseCategory(name="اجاره", is_active=True),
            ExpenseCategory(name="برق و آب", is_active=True),
            ExpenseCategory(name="حقوق کارکنان", is_active=True),
            ExpenseCategory(name="تعمیرات", is_active=True),
        ]
        session.add_all(expense_cats)
        session.commit()
        print(f"Created {len(expense_cats)} expense categories")

        transactions = [
            FinancialTransaction(type=TransactionType.PAYMENT, direction=TransactionDirection.INCOME, amount=350000, method=TransactionMethod.GATEWAY, status=TransactionStatus.CLEARED, counterparty=4, counterparty_type=CounterpartyType.USER, venue_id=venues[0].id, source_type=TransactionSourceType.BOOKING, source_id=bookings[0].id, description="پرداخت رزرو", created_by=4, occurred_at=datetime.now(timezone.utc)),
            FinancialTransaction(type=TransactionType.PAYMENT, direction=TransactionDirection.INCOME, amount=420000, method=TransactionMethod.CASH, status=TransactionStatus.CLEARED, counterparty=5, counterparty_type=CounterpartyType.USER, venue_id=venues[0].id, source_type=TransactionSourceType.BOOKING, source_id=bookings[1].id, description="پرداخت نقدی رزرو", created_by=5, occurred_at=datetime.now(timezone.utc)),
            FinancialTransaction(type=TransactionType.EXPENSE, direction=TransactionDirection.EXPENSE, amount=5000000, method=TransactionMethod.TRANSFER, status=TransactionStatus.CLEARED, venue_id=venues[0].id, expense_category_id=expense_cats[0].id, source_type=TransactionSourceType.MANUAL, description="اجاره ماهانه", created_by=2, occurred_at=datetime.now(timezone.utc)),
            FinancialTransaction(type=TransactionType.RECEIVABLE, direction=TransactionDirection.INCOME, amount=250000, method=TransactionMethod.CREDIT, status=TransactionStatus.PENDING, counterparty=6, counterparty_type=CounterpartyType.USER, venue_id=venues[1].id, source_type=TransactionSourceType.CONTRACT, source_id=contract.id, description="قسط قرارداد", created_by=3, occurred_at=datetime.now(timezone.utc)),
            FinancialTransaction(type=TransactionType.DISCOUNT, direction=TransactionDirection.EXPENSE, amount=50000, method=TransactionMethod.OTHER, status=TransactionStatus.CLEARED, counterparty=4, counterparty_type=CounterpartyType.USER, venue_id=venues[0].id, source_type=TransactionSourceType.BOOKING, source_id=bookings[0].id, description="تخفیف وفاداری", created_by=2, occurred_at=datetime.now(timezone.utc)),
        ]
        session.add_all(transactions)
        session.commit()
        print(f"Created {len(transactions)} financial transactions")

        # ==================== PRICING RULES ====================
        pricing_rules = [
            PricingRule(venue_id=venues[0].id, day_of_week=4, start_time=time(18, 0), end_time=time(22, 0), modifier_type=ModifierType.PERCENT, value=2000, priority=1, label="Peak Friday evening +20%"),
            PricingRule(venue_id=venues[0].id, day_of_week=2, start_time=time(8, 0), end_time=time(12, 0), modifier_type=ModifierType.PERCENT, value=-1500, priority=1, label="Off-peak Wednesday morning -15%"),
            PricingRule(venue_id=venues[1].id, holiday_applies=True, modifier_type=ModifierType.FIXED, value=100000, priority=2, label="Holiday surcharge +100K"),
            PricingRule(venue_id=venues[2].id, modifier_type=ModifierType.ABSOLUTE, value=300000, priority=0, label="Base rate override 300K"),
        ]
        session.add_all(pricing_rules)
        session.commit()
        print(f"Created {len(pricing_rules)} pricing rules")

        # ==================== COUPONS ====================
        coupons = [
            Coupon(code="WELCOME10", discount_type=CouponType.PERCENT, value=1000, max_uses=100, per_user_limit=1, valid_from=datetime.now(timezone.utc), valid_until=datetime.now(timezone.utc) + timedelta(days=30), is_active=True, created_by=1),
            Coupon(code="SUMMER50K", venue_id=venues[0].id, discount_type=CouponType.FIXED, value=50000, max_uses=50, per_user_limit=1, valid_from=datetime.now(timezone.utc), valid_until=datetime.now(timezone.utc) + timedelta(days=60), is_active=True, created_by=2),
            Coupon(code="VIP20", discount_type=CouponType.PERCENT, value=2000, max_uses=None, per_user_limit=2, min_booking_amount=400000, is_active=True, created_by=1),
        ]
        session.add_all(coupons)
        session.commit()
        print(f"Created {len(coupons)} coupons")

        redemptions = [
            CouponRedemption(coupon_id=coupons[0].id, user_id=4, booking_id=bookings[0].id, amount_discounted=35000),
        ]
        session.add_all(redemptions)
        session.commit()
        print(f"Created {len(redemptions)} coupon redemptions")

        # ==================== LOYALTY POINTS ====================
        loyalty_points = [
            LoyaltyPoint(user_id=4, points=100, reason=LoyaltyReason.BOOKING_COMPLETED, source_type="booking", source_id=bookings[0].id),
            LoyaltyPoint(user_id=5, points=100, reason=LoyaltyReason.BOOKING_COMPLETED, source_type="booking", source_id=bookings[1].id),
            LoyaltyPoint(user_id=4, points=50, reason=LoyaltyReason.REVIEW, source_type="review", source_id=1),
            LoyaltyPoint(user_id=4, points=-30, reason=LoyaltyReason.LOYALTY_REDEEM, source_type="booking", source_id=bookings[3].id),
        ]
        session.add_all(loyalty_points)
        session.commit()
        print(f"Created {len(loyalty_points)} loyalty point entries")

        # ==================== HOLIDAYS ====================
        holidays = [
            Holiday(holiday_date=date(today.year, 2, 11), name="پیروزی انقلاب اسلامی", is_national=True),
            Holiday(holiday_date=date(today.year, 3, 20), name="نوروز", is_national=True),
            Holiday(holiday_date=date(today.year, 3, 21), name="نوروز", is_national=True),
            Holiday(holiday_date=date(today.year, 3, 22), name="نوروز", is_national=True),
        ]
        session.add_all(holidays)
        session.commit()
        print(f"Created {len(holidays)} holidays")

        # ==================== CRM CUSTOMERS ====================
        customers = [
            VenueCustomer(venue_id=venues[0].id, user_id=4, is_vip=True, tags="regular,vip", notes="مشتری قدیمی", marketing_consent=True, consent_updated_at=datetime.now(timezone.utc), marked_by=2),
            VenueCustomer(venue_id=venues[0].id, user_id=5, is_vip=False, tags="", marketing_consent=True, consent_updated_at=datetime.now(timezone.utc)),
            VenueCustomer(venue_id=venues[1].id, user_id=6, is_vip=False, tags="new", marketing_consent=False),
        ]
        session.add_all(customers)
        session.commit()
        print(f"Created {len(customers)} CRM customers")

        campaigns = [
            CrmCampaign(venue_id=venues[0].id, created_by=2, title="تخفیف ویژه پایان هفته", message="این هفته ۲۰٪ تخفیف بگیرید!", discount_code="WEEKEND20", segment="all", sent_count=2, skipped_no_consent=1),
        ]
        session.add_all(campaigns)
        session.commit()
        print(f"Created {len(campaigns)} CRM campaigns")

        # ==================== GAMES ====================
        game1 = Game(booking_id=bookings[0].id, organizer_id=4, name="بازی دوستانه جمعه", description="فوتبال سالنی دوستانه", sport="football", visibility=GameVisibility.PUBLIC, join_policy=JoinPolicy.OPEN, max_players=10, skill_level=SkillLevel.INTERMEDIATE, payment_mode=PaymentMode.SPLIT_PAYMENT, status=GameStatus.OPEN)
        game2 = Game(booking_id=bookings[1].id, organizer_id=5, name="تمرین تیم سبزپوشان", description="تمرین هفتگی", sport="football", visibility=GameVisibility.PRIVATE, join_policy=JoinPolicy.APPROVAL, max_players=8, skill_level=SkillLevel.ADVANCED, payment_mode=PaymentMode.ORGANIZER_PAYS, status=GameStatus.OPEN)
        session.add(game1)
        session.add(game2)
        session.commit()
        print("Created 2 games")

        participants = [
            GameParticipant(game_id=game1.id, user_id=4, role=ParticipantRole.ORGANIZER, status=ParticipantStatus.ACCEPTED),
            GameParticipant(game_id=game1.id, user_id=5, role=ParticipantRole.MEMBER, status=ParticipantStatus.ACCEPTED),
            GameParticipant(game_id=game1.id, user_id=6, role=ParticipantRole.MEMBER, status=ParticipantStatus.PENDING),
            GameParticipant(game_id=game2.id, user_id=5, role=ParticipantRole.ORGANIZER, status=ParticipantStatus.ACCEPTED),
            GameParticipant(game_id=game2.id, user_id=4, role=ParticipantRole.MEMBER, status=ParticipantStatus.ACCEPTED),
        ]
        session.add_all(participants)
        session.commit()
        print(f"Created {len(participants)} game participants")

        game_join_requests = [
            GameJoinRequest(game_id=game1.id, user_id=6, status=JoinRequestStatus.PENDING, message="میشه بیام؟"),
        ]
        session.add_all(game_join_requests)
        session.commit()
        print(f"Created {len(game_join_requests)} game join requests")

        game_invitations = [
            GameInvitation(game_id=game1.id, invitee_user_id=5, invited_by=4, status=InvitationStatus.ACCEPTED, answered_at=datetime.now(timezone.utc)),
        ]
        session.add_all(game_invitations)
        session.commit()
        print(f"Created {len(game_invitations)} game invitations")

        game_payments = [
            GamePayment(game_id=game1.id, user_id=5, amount=50000, status=GamePaymentStatus.PAID),
            GamePayment(game_id=game1.id, user_id=6, amount=50000, status=GamePaymentStatus.PENDING),
        ]
        session.add_all(game_payments)
        session.commit()
        print(f"Created {len(game_payments)} game payments")

        print("\nDatabase seeded successfully!")
        print("=" * 50)
        print("Users:")
        print("  - Admin: 09123456789 / admin123")
        print("  - Manager1: 09121111111 / 123456")
        print("  - Manager2: 09122222222 / 123456")
        print("  - User1: 09123333333 / 123456")
        print("  - User2: 09124444444 / 123456")
        print("  - User3: 09125555555 / 123456")
        print("=" * 50)


if __name__ == "__main__":
    seed_database()