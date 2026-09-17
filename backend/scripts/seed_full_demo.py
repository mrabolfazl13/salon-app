# -*- coding: utf-8 -*-
"""seed_full_demo.py — DEMO-READY dataset through the app's own UoW/services.

Usage (from backend/):
    python scripts/seed_full_demo.py --reset                 # seed the configured DB (postgres in dev)
    python scripts/seed_full_demo.py --reset --sqlite PATH   # seed into a throwaway sqlite file

--reset drops all data tables and rebuilds the schema via SQLModel metadata
(destructive — demo/dev DBs only). Without --reset the script refuses to seed
twice (idempotency marker = the super-admin demo phone).

Everything is written through models + services (UoW, PricingService,
FinanceService, ContractService, LoyaltyService) — no raw data SQL.
"""
import os
import sys


def _early_url():
    """Parse --sqlite BEFORE importing any app module so the engine binds correctly."""
    argv = sys.argv[1:]
    if "--sqlite" in argv:
        i = argv.index("--sqlite")
        if i + 1 >= len(argv) or argv[i + 1].startswith("--"):
            sys.exit("--sqlite requires a PATH argument")
        path = os.path.abspath(argv[i + 1])
        return "sqlite:///" + path.replace(os.sep, "/")
    return None


_URL = _early_url()
if _URL:
    os.environ["DATABASE_URL"] = _URL

import json
import random
from datetime import date, datetime, time, timedelta, timezone

import sqlalchemy as sa
from sqlmodel import SQLModel, func, select

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from app.config import settings
from app.database import engine
from app.unit_of_work import UnitOfWork
from app.utils.auth import get_password_hash
from app.utils.permissions import StaffPosition
from app.models.user import User, UserRole
from app.models.venue import Venue
from app.models.slot import Slot, SlotStatus
from app.models.booking import Booking, BookingStatus
from app.models.payment import BookingPayment, BookingPaymentStatus
from app.models.transaction import (
    CounterpartyType, ExpenseCategory, FinancialTransaction,
    TransactionDirection, TransactionMethod, TransactionSourceType,
    TransactionStatus, TransactionType,
)
from app.models.contract import (
    Contract, ContractAuditAction, ContractStatus, RecurrenceType,
)
from app.models.holiday import Holiday
from app.models.pricing_rule import ModifierType, PricingRule
from app.models.coupon import Coupon, CouponRedemption, CouponType
from app.models.loyalty import LoyaltyPoint
from app.models.favorite import FavoriteVenue
from app.models.review import Review
from app.models.notification import Notification
from app.models.customer import VenueCustomer
from app.models.staff import StaffAssignment
from app.models.game import (
    Game, GameInvitation, GameJoinRequest, GameParticipant, GamePayment,
    GamePaymentStatus, GameWaitlist, GameStatus, GameVisibility,
    InvitationStatus, ParticipantRole,
)
from app.models.team import (
    Team, TeamAuditEvent, TeamBooking, TeamDues, TeamMember,
    TeamAuditAction, TeamMemberRole, TeamMemberStatus, TeamVisibility,
)
from app.schemas.contract import ContractApprove, ContractCreate, InstallmentPlan
from app.services.contract_service import ContractService
from app.services.finance_service import FinanceService
from app.services.loyalty_service import LoyaltyService
from app.services.pricing_service import PricingService

random.seed(7)
NOW = datetime.now(timezone.utc)
TODAY = date.today()
MARKER_PHONE = "09120000001"  # super admin — idempotency marker


def reset_db():
    """Schema reset: drop every data table then create_all from metadata.
    (alembic_version is preserved so an existing head stamp survives.)"""
    insp = sa.inspect(engine)
    cascade = " CASCADE" if engine.dialect.name == "postgresql" else ""
    with engine.begin() as con:
        for t in insp.get_table_names():
            if t == "alembic_version":
                continue
            con.execute(sa.text(f'DROP TABLE IF EXISTS "{t}"{cascade}'))
    SQLModel.metadata.create_all(engine)


def seed():
    if "--reset" in sys.argv[1:]:
        print("resetting schema (drop all + create_all) ...")
        reset_db()

    summary = {}
    with UnitOfWork() as uow:
        if "--reset" not in sys.argv[1:] and uow.users.get_one(phone=MARKER_PHONE):
            sys.exit("demo data already present (super admin found). Re-run with --reset.")

        # ─────────────────────────── users ───────────────────────────
        def mk_user(phone, name, pw, role=UserRole.USER, verified=True, notify=False):
            return uow.users.create({
                "phone": phone, "full_name": name,
                "hashed_password": get_password_hash(pw), "role": role,
                "is_active": True, "is_verified": verified, "notify_deals": notify,
            })

        admin = mk_user(MARKER_PHONE, "مدیر ارشد سامانه", "admin123", UserRole.SUPER_ADMIN)
        mgr1 = mk_user("09121000001", "علی محمدی", "manager123", UserRole.VENUE_MANAGER)
        mgr2 = mk_user("09121000002", "سارا حسینی", "manager123", UserRole.VENUE_MANAGER)
        staff_defs = [
            ("09122000001", "مریم رضایی", StaffPosition.RECEPTION, 0),
            ("09122000002", "حسین کاظمی", StaffPosition.CASHIER, 0),
            ("09122000003", "فاطمه نادری", StaffPosition.RECEPTION, 1),
            ("09122000004", "امیر شریفی", StaffPosition.ACCOUNTANT, 1),
        ]
        staffs = [mk_user(p, n + " (کارکن)", "staff123") for p, n, _pos, _vi in staff_defs]

        demo_names = [
            ("09123000001", "رضا کریمی"), ("09123000002", "محمد نوروزی"),
            ("09123000003", "نیما قاسمی"), ("09123000004", "زهرا موسوی"),
            ("09123000005", "علیرضا صادقی"), ("09123000006", "حسین رحیمی"),
            ("09123000007", "الهام عزیزی"), ("09123000008", "بابک فرهادی"),
            ("09123000009", "شیرین اکبری"), ("09123000010", "کاوه جهانگیری"),
            ("09123000011", "مهسا رستمی"), ("09123000012", "سعید ملکی"),
        ]
        # the last two demo users stay unverified (phone-verification flag demo)
        demo_users = [mk_user(p, n, "user123", verified=i < 10, notify=(i % 4 == 0))
                      for i, (p, n) in enumerate(demo_names)]

        # ─────────────────────────── venues ───────────────────────────
        venues = [
            uow.venues.create({
                "name": "فوتسال آرش", "category": "futsal",
                "address": "تهران، خیابان آزادی، نبش ۱۵", "latitude": 35.6892, "longitude": 51.3890,
                "phone": "02166701234", "description": "زمین فوتسال با کفپوش استاندارد و نور LED",
                "amenities": '["پارکینگ", "کافه", "دوش", "تجهیزات", "وای‌فای"]',
                "images": '["https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600"]',
                "is_verified": True, "manager_id": mgr1.id, "default_slot_price": 350000,
            }),
            uow.venues.create({
                "name": "فوتسال المپیک", "category": "futsal",
                "address": "تهران، خیابان ولنجک، ابتدای ۵۰", "latitude": 35.7525, "longitude": 51.3940,
                "phone": "02188765432", "description": "سالن سرپوشیده فوتسال با جایگاه تماشاگران",
                "amenities": '["پارکینگ", "دوش", "تابلو", "کافه"]',
                "images": '["https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600"]',
                "is_verified": True, "manager_id": mgr2.id, "default_slot_price": 420000,
            }),
            uow.venues.create({
                "name": "باشگاه تناسب اندام انرژی", "category": "gym",
                "address": "قم، بلوار جمهوری، خیابان ۱۲", "latitude": 34.6416, "longitude": 50.8808,
                "phone": "02537891234", "description": "بدنسازی، رزمی و کلاس‌های گروهی",
                "amenities": '["سونا", "استخر", "پارکینگ", "مربی"]',
                "images": '["https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600"]',
                "is_verified": True, "manager_id": mgr1.id, "default_slot_price": 250000,
            }),
        ]
        v1, v2, v3 = venues
        managers = [mgr1, mgr2]
        for s, (_p, _n, pos, vi) in zip(staffs, staff_defs):
            uow.staff.create(StaffAssignment(
                venue_id=venues[vi].id, user_id=s.id, position=pos,
                permissions="[]", is_active=True, created_by=managers[vi].id,
            ))

        # ─────────── holidays + pricing rules (created BEFORE slot generation) ───────────
        for hd, name, national, vid in [
            ((TODAY + timedelta(days=6)).isoformat(), "تعطیلات سراسری نمونه (دمو)", True, None),
            ((TODAY + timedelta(days=12)).isoformat(), "جشنواره ورزش بانوان", False, v2.id),
            ("2027-03-20", "نوروز ۱۴۰۶", True, None),
            ("2027-04-02", "سیزده‌به‌در", True, None),
        ]:
            y, m, d = (int(x) for x in hd.split("-"))
            uow.holidays.create({"holiday_date": date(y, m, d), "name": name,
                                 "is_national": national, "venue_id": vid})
        for venue in venues:
            uow.pricing_rules.bulk_create([
                {"venue_id": venue.id, "start_time": time(16, 0), "end_time": time(23, 0),
                 "modifier_type": ModifierType.PERCENT, "value": 1500,
                 "priority": 1, "label": "پیک عصر +۱۵٪"},
                {"venue_id": venue.id, "start_time": time(8, 0), "end_time": time(12, 0),
                 "modifier_type": ModifierType.PERCENT, "value": -1000, "priority": 1,
                 "label": "آف‌پیک صبح −۱۰٪"},
                {"venue_id": venue.id, "holiday_applies": True,
                 "modifier_type": ModifierType.PERCENT, "value": 2500, "priority": 5,
                 "label": "تعطیلات +۲۵٪"},
            ])

        # ───────────── 32 past + 30 upcoming days of slots via the pricing engine ─────────────
        for venue in venues:
            for off in range(-32, 31):
                uow.slots.create_daily_slots(venue.id, TODAY + timedelta(days=off))
        uow.commit()

        # ─────────────────────────── coupons ───────────────────────────
        coup_pct = uow.coupons.create({
            "code": "WELCOME10", "venue_id": None, "discount_type": CouponType.PERCENT,
            "value": 1000, "max_uses": 50, "per_user_limit": 1, "min_booking_amount": 200000,
            "valid_from": NOW - timedelta(days=5), "valid_until": NOW + timedelta(days=45),
            "is_active": True, "created_by": mgr1.id,
        })
        coup_fix = uow.coupons.create({
            "code": "FALL50K", "venue_id": v1.id, "discount_type": CouponType.FIXED,
            "value": 50000, "max_uses": 100, "per_user_limit": 2,
            "valid_from": NOW - timedelta(days=10), "valid_until": NOW + timedelta(days=20),
            "is_active": True, "created_by": mgr1.id,
        })

        # ─────────── deals: 3 discounted upcoming Olympic slots (market) ───────────
        deal_count = 0
        for s in uow.slots.get_by_venue_and_date(v2.id, TODAY + timedelta(days=3)):
            if s.status == SlotStatus.AVAILABLE and not s.is_contract_slot and deal_count < 3:
                s.is_deal = True
                s.deal_price = int(s.current_price * 70) // 100
                s.deal_expires_at = NOW + timedelta(hours=48)
                uow.session.add(s)
                deal_count += 1

        # ─────────────────────────── bookings ───────────────────────────
        def future_pool(venue, d_from, d_to):
            out = []
            for off in range(d_from, d_to + 1):
                for s in uow.slots.get_by_venue_and_date(venue.id, TODAY + timedelta(days=off)):
                    if (s.status == SlotStatus.AVAILABLE and not s.is_contract_slot
                            and not s.is_deal and not (s.slot_date == TODAY and s.start_time <= NOW.time())):
                        out.append(s)
            return out

        def past_pool(venue, days_ago):
            return [s for s in uow.slots.get_by_venue_and_date(venue.id, TODAY - timedelta(days=days_ago))                    if s.status == SlotStatus.AVAILABLE and not s.is_contract_slot]

        def mock_pay(booking, slot, user, occurred=None):
            """mock gateway: PAID BookingPayment + append-only ledger INCOME row"""
            paid_at = (occurred or booking.booked_at) + timedelta(minutes=4)
            payment = uow.payments.create({
                "booking_id": booking.id, "user_id": user.id, "amount": booking.payment_amount,
                "status": BookingPaymentStatus.PAID, "gateway": "mock",
                "authority": f"DEMO{booking.id:06d}{random.randint(1000, 9999)}",
                "transaction_id": f"DEMO-TX-{booking.id:08X}",
                "card_pan": str(random.randint(1000, 9999)), "paid_at": paid_at,
            })
            uow.bookings.update(booking.id, {"payment_transaction_id": payment.transaction_id})
            FinanceService.record_tx(uow, FinancialTransaction(
                idempotency_key=f"booking-payment:{payment.id}",
                type=TransactionType.PAYMENT, direction=TransactionDirection.INCOME,
                amount=payment.amount, method=TransactionMethod.GATEWAY,
                status=TransactionStatus.CLEARED, counterparty=user.id,
                counterparty_type=CounterpartyType.USER, venue_id=slot.venue_id,
                source_type=TransactionSourceType.BOOKING_PAYMENT, source_id=payment.id,
                description=f"پرداخت رزرو #{booking.id} — {slot.slot_date} ساعت {slot.start_time}",
                created_by=user.id, occurred_at=paid_at, cleared_at=paid_at,
            ))
            return payment

        # 1) past COMPLETED bookings — mock payment + loyalty award (confirmed → completed)
        for venue, user, days_ago in [
            (v1, demo_users[0], 8), (v1, demo_users[2], 12), (v2, demo_users[3], 6),
            (v2, demo_users[4], 15), (v1, demo_users[5], 20), (v2, demo_users[6], 10),
        ]:
            pool = past_pool(venue, days_ago)
            if not pool:
                continue
            slot = random.choice(pool)
            booked_at = NOW - timedelta(days=days_ago, hours=2)
            b = uow.bookings.create({
                "slot_id": slot.id, "user_id": user.id, "payment_amount": slot.current_price,
                "status": BookingStatus.CONFIRMED, "booked_at": booked_at,
            })
            mock_pay(b, slot, user, occurred=booked_at)
            uow.slots.update(slot.id, {"status": SlotStatus.BOOKED})
            b = uow.bookings.update(b.id, {"status": BookingStatus.COMPLETED})
            LoyaltyService.award_for_booking(uow.session, b)

        # 2) cancelled + REFUNDED example (server pricing breakdown + coupon redemption)
        cpool = past_pool(v1, 25)
        if cpool:
            slot = cpool[0]
            price, steps, _ids = PricingService.resolve_price_detail(
                uow.session, v1.id, slot.slot_date, slot.start_time,
                base_price=slot.base_price, duration=slot.duration or 90)
            payable = max(price - coup_fix.value, 1)
            b = uow.bookings.create({
                "slot_id": slot.id, "user_id": demo_users[1].id, "payment_amount": payable,
                "status": BookingStatus.CONFIRMED, "booked_at": NOW - timedelta(days=25),
                "discount_amount": coup_fix.value, "coupon_code": coup_fix.code,
                "pricing_breakdown": json.dumps(
                    steps + [{"step": "coupon", "amount": -coup_fix.value, "code": coup_fix.code}],
                    ensure_ascii=False),
            })
            payment = mock_pay(b, slot, demo_users[1])
            uow.coupon_redemptions.create({
                "coupon_id": coup_fix.id, "user_id": demo_users[1].id,
                "booking_id": b.id, "amount_discounted": coup_fix.value,
            })
            uow.coupons.update(coup_fix.id, {"uses_count": 1})
            FinanceService.record_refund(
                uow, amount=payable, original_source_id=payment.id, venue_id=v1.id,
                counterparty_user_id=demo_users[1].id,
                description=f"بازگشت وجه رزرو لغوشده #{b.id}",
                idempotency_key=f"refund:{payment.id}", created_by=mgr1.id)
            uow.payments.update(payment.id, {"status": BookingPaymentStatus.REFUNDED})
            uow.bookings.update(b.id, {"status": BookingStatus.CANCELLED})
            uow.slots.update(slot.id, {"status": SlotStatus.AVAILABLE})

        # 3) upcoming CONFIRMED bookings — 5 paid via mock gateway, 4 awaiting payment
        up_pool = future_pool(v1, 1, 20) + future_pool(v2, 1, 20)
        random.shuffle(up_pool)
        confirmed_paid = []
        picks = [(demo_users[7], True), (demo_users[8], True), (demo_users[9], True),
                 (demo_users[0], True), (demo_users[2], True), (demo_users[3], False),
                 (demo_users[4], False), (demo_users[5], False), (demo_users[6], False)]
        for i, (user, paid) in enumerate(picks):
            slot = up_pool[i]
            b = uow.bookings.create({
                "slot_id": slot.id, "user_id": user.id, "payment_amount": slot.current_price,
                "status": BookingStatus.CONFIRMED,
                "booked_at": NOW - timedelta(hours=random.randint(2, 72)),
            })
            if paid:
                mock_pay(b, slot, user)
                confirmed_paid.append(b)
            uow.slots.update(slot.id, {"status": SlotStatus.BOOKED})

        # 4) PENDING — awaiting manager confirmation
        for slot, user in zip(up_pool[9:12], (demo_users[10], demo_users[11], demo_users[3])):
            uow.bookings.create({
                "slot_id": slot.id, "user_id": user.id, "payment_amount": slot.current_price,
                "status": BookingStatus.PENDING, "booked_at": NOW - timedelta(hours=random.randint(1, 5)),
            })
            uow.slots.update(slot.id, {"status": SlotStatus.BOOKED})
        uow.commit()

        # ─────────────────────────── games module demo ───────────────────────────
        game_host = demo_users[7]
        game_booking = confirmed_paid[0]
        game_slot = uow.slots.get_by_id(game_booking.slot_id)
        game = uow.games.create({
            "booking_id": game_booking.id, "organizer_id": game_host.id,
            "name": "برنامه فوتسال جمعه عصر", "description": "بازی دوستانه — سطح متوسط",
            "sport": "futsal", "visibility": GameVisibility.PUBLIC,
            "max_players": 3, "status": GameStatus.OPEN,
        })
        parts = [uow.game_participants.create({
            "game_id": game.id, "user_id": game_host.id, "role": ParticipantRole.ORGANIZER,
            "joined_at": NOW - timedelta(days=2),
        })]
        for uid in (demo_users[8].id, demo_users[9].id):
            parts.append(uow.game_participants.create({
                "game_id": game.id, "user_id": uid, "joined_at": NOW - timedelta(days=1),
            }))
        for i, uid in enumerate((demo_users[10].id, demo_users[11].id), start=1):
            uow.game_waitlist.create({"game_id": game.id, "user_id": uid, "position": i})
        uow.game_join_requests.create({
            "game_id": game.id, "user_id": demo_users[3].id,
            "message": "در صورت کمبود نیرو من هستم", "created_at": NOW - timedelta(hours=5),
        })
        uow.game_invitations.create({
            "game_id": game.id, "invited_user_id": demo_users[4].id,
            "invited_by": game_host.id, "status": InvitationStatus.PENDING,
            "expires_at": NOW + timedelta(days=2),
        })
        uow.game_invite_links.create({
            "game_id": game.id, "token": "demo-" + os.urandom(8).hex(),
            "created_by": game_host.id, "expires_at": NOW + timedelta(days=5),
        })
        shares = FinanceService.split_amount(game_booking.payment_amount, 3)
        for p, amount, paid in zip(parts, shares, (True, True, False)):
            gp = uow.game_payments.create({
                "game_id": game.id, "participant_id": p.id, "user_id": p.user_id,
                "amount": amount,
                "status": GamePaymentStatus.PAID if paid else GamePaymentStatus.PENDING,
                "payment_reference": f"DEMO-GP-{p.id}" if paid else None,
                "paid_at": NOW - timedelta(days=1) if paid else None,
            })
            if paid:
                FinanceService.record_income(
                    uow, amount=amount, source_type=TransactionSourceType.GAME_PAYMENT,
                    source_id=gp.id, venue_id=game_slot.venue_id,
                    counterparty_user_id=gp.user_id, method=TransactionMethod.GATEWAY,
                    description=f"سهم بازی «{game.name}»",
                    idempotency_key=f"game-payment:{gp.id}")

        # ─────────────────────────── teams demo ───────────────────────────
        def mk_team(name, captain, members, public):
            team = uow.teams.create({
                "name": name, "captain_id": captain.id, "sport": "futsal",
                "visibility": TeamVisibility.PUBLIC if public else TeamVisibility.PRIVATE,
                "description": f"تیم دوستانه {name}",
            })
            uow.team_audits.log(team.id, TeamAuditAction.CREATED, captain.id, {"name": name})
            uow.team_members.create({
                "team_id": team.id, "user_id": captain.id,
                "role": TeamMemberRole.CAPTAIN, "status": TeamMemberStatus.ACTIVE,
            })
            for i, m in enumerate(members):
                uow.team_members.create({
                    "team_id": team.id, "user_id": m.id,
                    "role": TeamMemberRole.ADMIN if i == 0 else TeamMemberRole.MEMBER,
                    "status": TeamMemberStatus.ACTIVE, "invited_by": captain.id,
                })
            return team

        team1 = mk_team("تیم آرش", demo_users[0], demo_users[1:5], True)
        team2 = mk_team("تیم المپیک", demo_users[5], demo_users[6:9], False)

        tb_slot = up_pool[12]
        tb = uow.bookings.create({
            "slot_id": tb_slot.id, "user_id": demo_users[0].id,
            "payment_amount": tb_slot.current_price, "status": BookingStatus.CONFIRMED,
            "booked_at": NOW - timedelta(hours=30),
        })
        mock_pay(tb, tb_slot, demo_users[0])
        uow.slots.update(tb_slot.id, {"status": SlotStatus.BOOKED})
        uow.team_bookings.create({"team_id": team1.id, "booking_id": tb.id,
                                  "paid_by_user_id": demo_users[0].id})
        uow.team_audits.log(team1.id, TeamAuditAction.BOOKING_LINKED, demo_users[0].id,
                            {"booking_id": tb.id})

        dues_total = dues_paid = 0
        for team in (team1, team2):
            member_ids = [tm.user_id for tm in uow.team_members.get_all(team_id=team.id)]
            for j, uid in enumerate(member_ids):
                due = uow.team_dues.create({
                    "team_id": team.id, "user_id": uid, "title": "سهم تمرین هفته آینده",
                    "amount": 250000, "due_date": TODAY + timedelta(days=7),
                })
                dues_total += 1
                if j < max(1, len(member_ids) // 2):  # half of the roster already paid
                    tx = FinanceService.record_tx(uow, FinancialTransaction(
                        idempotency_key=f"team-dues:{due.id}",
                        type=TransactionType.PAYMENT, direction=TransactionDirection.INCOME,
                        amount=due.amount, method=TransactionMethod.CASH,
                        status=TransactionStatus.CLEARED, counterparty=None,
                        counterparty_type=CounterpartyType.TEAM, counterparty_ref=team.id,
                        venue_id=v1.id if team is team1 else v2.id,
                        source_type=TransactionSourceType.TEAM_DUES, source_id=due.id,
                        description="پرداخت سهم تیمی", created_by=uid,
                    ))
                    uow.team_dues.update(due.id, {
                        "is_paid": True, "paid_at": NOW - timedelta(hours=6), "paid_by": uid,
                        "payment_method": "cash", "payment_reference": f"DEMO-DUES-{due.id}",
                        "transaction_id": tx.id,
                    })
                    dues_paid += 1
            uow.team_audits.log(team.id, TeamAuditAction.DUES_GENERATED, None,
                                {"members": len(member_ids), "amount_each": 250000})

        # ──── contract lifecycle: PENDING request + ACTIVE w/ RESERVED slots ────
        svc = ContractService(uow)
        thursday = TODAY + timedelta(days=(3 - TODAY.weekday()) % 7 or 7)
        c_active = svc.create_contract(ContractCreate(
            venue_id=v1.id, start_date=thursday, end_date=thursday + timedelta(days=84),
            day_of_week=3, start_time=time(7, 0), end_time=time(8, 0),
            recurrence=RecurrenceType.WEEKLY, discounted_price=240000,
            description="قرارداد هفتگی تیم آرش — ۳ ماهه",
            down_payment_amount=1000000, payment_due_day_of_month=20,
        ), demo_users[0].id)
        svc.approve_contract(uow.contracts.get_by_id(c_active.id), mgr1, ContractApprove(
            installments=InstallmentPlan(count=3, due_in_days_between=14),
            cancellation_policy="لغو تا ۴۸ ساعت قبل آزاد؛ کمتر از آن ۲۰٪ جریمه",
        ))
        uow.session.flush()
        sched = uow.contract_payments.get_by_contract(c_active.id)
        down = [p for p in sched if p.record_type == "down_payment"]
        by_no = {p.installment_no: p for p in sched if p.record_type == "installment"}
        payer = uow.users.get_by_id(demo_users[0].id)
        fresh = uow.contracts.get_by_id(c_active.id)
        if down:
            svc.pay_installment(fresh, uow.contract_payments.get_by_id(down[0].id), payer, None)
        if by_no.get(1):  # installment #1 → PAID via ledger (card-to-card)
            svc.pay_installment(uow.contracts.get_by_id(c_active.id),
                                uow.contract_payments.get_by_id(by_no[1].id),
                                payer, "6037991122334466")
        if by_no.get(2):  # installment #2 → OVERDUE (past-due + audit + reminder)
            uow.contract_payments.update(by_no[2].id, {
                "due_date": TODAY - timedelta(days=3), "is_overdue": True,
                "overdue_notified_at": NOW - timedelta(hours=20),
            })
            uow.contract_audits.log(c_active.id, ContractAuditAction.OVERDUE_NOTIFIED, None,
                                    {"payment_id": by_no[2].id})
        friday = TODAY + timedelta(days=(4 - TODAY.weekday()) % 7 or 7)
        svc.create_contract(ContractCreate(
            venue_id=v2.id, start_date=friday, end_date=friday + timedelta(days=63),
            day_of_week=4, start_time=time(7, 0), end_time=time(8, 0),
            recurrence=RecurrenceType.WEEKLY, discounted_price=300000,
            description="درخواست قرارداد تیم المپیک (در انتظار تأیید مدیر)",
        ), demo_users[5].id)
        uow.commit()

        # ─────────── expense categories + expenses across the ledger ───────────
        for cat_name in ("اجاره", "حقوق", "قبوض", "نظافت", "تجهیزات", "تبلیغات"):
            uow.expense_categories.create({"name": cat_name, "venue_id": None})
        uow.commit()
        cat_ids = {c.name: c.id for c in uow.expense_categories.get_all()}
        for i, (cat, vid, amount, days_ago, desc, actor) in enumerate([
            ("اجاره", v1.id, 90000000, 12, "اجاره ماهانه زمین آرش", mgr1),
            ("اجاره", v2.id, 120000000, 12, "اجاره ماهانه سالن المپیک", mgr2),
            ("حقوق", v1.id, 65000000, 9, "حقوق کارکنان آرش", mgr1),
            ("حقوق", v2.id, 70000000, 9, "حقوق کارکنان المپیک", mgr2),
            ("قبوض", v1.id, 8500000, 5, "برق و آب آرش", mgr1),
            ("نظافت", v2.id, 12000000, 7, "خدمات نظافت هفتگی", mgr2),
            ("تجهیزات", v3.id, 35000000, 15, "خرید دستگاه‌های بدنسازی", mgr1),
            ("تبلیغات", v2.id, 9000000, 4, "کمپین تبلیغات محلی", mgr2),
        ]):
            FinanceService.record_tx(uow, FinancialTransaction(
                idempotency_key=f"demo-expense:{i}",
                type=TransactionType.EXPENSE, direction=TransactionDirection.EXPENSE,
                amount=amount, method=TransactionMethod.CARD_TO_CARD,
                status=TransactionStatus.CLEARED, venue_id=vid,
                expense_category_id=cat_ids[cat], description=desc,
                created_by=actor.id, occurred_at=NOW - timedelta(days=days_ago),
                cleared_at=NOW - timedelta(days=days_ago),
            ))

        # ───────────── CRM / favorites / reviews / notifications ─────────────
        uow.customers.bulk_create([
            {"venue_id": v1.id, "user_id": demo_users[0].id, "is_vip": True,
             "tags": "هرفته‌ای دو بار", "marketing_consent": True, "marked_by": mgr1.id},
            {"venue_id": v1.id, "user_id": demo_users[7].id, "notes": "مشتری دیل‌دوست"},
            {"venue_id": v2.id, "user_id": demo_users[5].id, "is_vip": True,
             "marketing_consent": True, "marked_by": mgr2.id},
            {"venue_id": v3.id, "user_id": demo_users[11].id, "tags": "تازه وارد"},
        ])
        uow.favorites.bulk_create([
            {"user_id": demo_users[i].id, "venue_id": venues[v].id}
            for i, v in [(0, 0), (1, 0), (2, 1), (5, 1), (7, 0), (10, 2), (4, 2)]
        ])
        for i, vi, rating, comment in [
            (0, 0, 5, "کیفیت زمین عالی بود، رزرو سریع انجام شد."),
            (1, 0, 4, "دوش‌ها نیاز به refurbish دارد."),
            (2, 1, 5, "سالن تمیز و منظم."),
            (3, 1, 3, "قیمت سانس‌های عصر بالاست."),
            (4, 0, 4, "پارکینگ کوچک ولی جمع می‌شود."),
            (5, 1, 5, "نور LED فوق‌العاده است."),
            (6, 2, 4, "مربی‌های باتجربه."),
            (7, 0, 5, "همیشه رزرو می‌کنم، راضی‌ام."),
            (8, 1, 4, "پذیرش منظم و سریع."),
            (9, 2, 3, "سونا ظرفیت کم دارد."),
        ]:
            uow.reviews.create({
                "venue_id": venues[vi].id, "user_id": demo_users[i].id, "rating": rating,
                "comment": comment, "created_at": NOW - timedelta(days=random.randint(1, 40)),
            })
        for user, title, msg, ntype in [
            (demo_users[0], "پرداخت موفق", "پرداخت رزرو فوتسال آرش با موفقیت انجام شد.", "payment"),
            (demo_users[2], "رزرو تأیید شد", "رزرو شما تأیید و نهایی شد.", "booking_confirmed"),
            (mgr1, "پرداخت رزرو", "رضا کریمی یک سانس را پرداخت کرد.", "payment"),
            (mgr2, "درخواست قرارداد جدید", "تیم المپیک درخواست قرارداد هفتگی داد.", "contract"),
            (demo_users[0], "سانس لحظه آخری", "فوتسال المپیک سه سانس تخفیفی منتشر کرد.", "deal"),
            (admin, "دموی سامانه", "دیتاست نمایشی seed_full_demo بارگذاری شد.", "info"),
        ]:
            uow.notifications.create({
                "user_id": user.id, "title": title, "message": msg, "type": ntype,
                "data": "{}", "is_read": False,
            })
        uow.notifications.create({  # overdue reminder (demo #2 is past due in the ledger)
            "user_id": demo_users[0].id, "title": "قسط معوق قرارداد",
            "message": "قسط دوم قرارداد هفتگی شما سررسید را رد کرده است.",
            "type": "contract", "data": "{}", "is_read": False,
        })
        uow.commit()

        def count(model):
            return uow.session.exec(select(func.count()).select_from(model)).one()

        for label, model in [
            ("users", User), ("venues", Venue), ("staff_assignments", StaffAssignment),
            ("holidays", Holiday), ("pricing_rules", PricingRule), ("slots", Slot),
            ("bookings", Booking), ("booking_payments", BookingPayment),
            ("ledger_rows", FinancialTransaction), ("expense_categories", ExpenseCategory),
            ("loyalty_rows", LoyaltyPoint), ("coupons", Coupon), ("contracts", Contract),
            ("games", Game), ("game_payments", GamePayment), ("teams", Team),
            ("team_dues", TeamDues), ("favorites", FavoriteVenue), ("reviews", Review),
            ("notifications", Notification), ("customers", VenueCustomer),
        ]:
            summary[label] = count(model)

    print("\n" + "=" * 64)
    print("DEMO SEED COMPLETE")
    print("database:", _URL or settings.DATABASE_URL)
    print("=" * 64)
    for k, v in summary.items():
        print(f"  {k:<20} {v}")
    print("-" * 64)
    print("credentials  phone / password")
    print(f"  super_admin : {MARKER_PHONE} / admin123")
    print("  managers    : 09121000001, 09121000002 / manager123")
    print("  staff       : 09122000001..09122000004 / staff123")
    print("  demo users  : 09123000001 .. 09123000012 / user123")
    print("                (09123000011 and ..012 are NOT phone-verified)")
    print("=" * 64)
    return summary


if __name__ == "__main__":
    if not _URL:
        print("note: no --sqlite given → seeding DATABASE_URL from env/.env "
              f"({settings.DATABASE_URL})")
    seed()



