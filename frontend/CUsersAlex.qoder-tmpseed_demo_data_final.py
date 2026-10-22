# -*- coding: utf-8 -*-
"""دیتای کامل دمو برای ارائه — تیم‌ها، رقابت‌ها، سال مالی، تراکنش‌ها.

اجرا روی سرور:
    docker exec -w /app futsal_backend python -m app.seed_demo_data
"""
from __future__ import annotations

import json
from datetime import date, datetime, timedelta
from decimal import Decimal

from sqlmodel import Session, select

from app.database import engine
from app.models.booking import Booking
from app.models.team import Team
from app.models.tournament import Tournament
from app.models.transaction import FinancialTransaction
from app.models.user import User, UserRole
from app.models.venue import Venue


# ── تنظیمات ──────────────────────────────────────────────
DEMO_MANAGER_PHONES = ["09000000211", "09000000212", "09000000213"]
TEAM_NAMES = [
    "ستارگان تهران",
    "فوتبال‌بانان پایتخت",
    "تیم ملی فوتسال",
    "برق تهران",
    "آریا ورزش",
    "شهرداری تهران",
    "پاس تهران",
    "استقلال جوانان",
]
COMPETITION_NAMES = [
    "لیگ برتر فوتسال تهران ۱۴۰۵",
    "جام حذفی تهران",
    "مسابقات نوروزی",
]


def _get_or_create_user(session: Session, phone: str, full_name: str, role: UserRole) -> User:
    user = session.exec(select(User).where(User.phone == phone)).first()
    if user is None:
        user = User(
            phone=phone,
            full_name=full_name,
            hashed_password="$argon2id$v=19$m=65536,t=3,p=4$dummy$hash",
            role=role,
            is_active=True,
            is_verified=True,
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        print(f"  + کاربر ساخته شد: {full_name} ({phone})")
    return user


def _assign_venues_to_demo_managers(session: Session) -> list[tuple[Venue, User]]:
    """۳ سالن فوتسال تهران را به ۳ مدیر دمو وصل کن."""
    venues = session.exec(
        select(Venue)
        .where(Venue.category == "futsal")
        .where(Venue.id >= 41)  # سالن‌های تهران
        .limit(3)
    ).all()

    assignments = []
    for i, venue in enumerate(venues):
        phone = DEMO_MANAGER_PHONES[i]
        manager = _get_or_create_user(
            session,
            phone,
            f"مدیر سالن نمونه {i+1}",
            UserRole.VENUE_MANAGER,
        )
        venue.manager_id = manager.id
        session.add(venue)
        session.commit()
        print(f"  ✓ سالن '{venue.name}' به مدیر '{manager.full_name}' وصل شد")
        assignments.append((venue, manager))

    return assignments


def _create_teams(session: Session, venue: Venue, captain: User) -> list[Team]:
    """۸ تیم برای یک سالن بساز."""
    teams = []
    for team_name in TEAM_NAMES:
        team = session.exec(
            select(Team).where(Team.name == team_name).where(Team.sport == "futsal")
        ).first()
        if team is None:
            team = Team(
                name=team_name,
                description=f"تیم فوتسال {team_name}",
                sport="futsal",
                captain_id=captain.id,
                visibility="public",
                is_active=True,
                min_members=7,
                is_official=True,
                official_since=date.today(),
            )
            session.add(team)
            session.commit()
            session.refresh(team)
            print(f"  + تیم '{team_name}' ساخته شد (id={team.id})")

        teams.append(team)

    return teams


def _create_competitions(session: Session, venue: Venue, teams: list[Team]):
    """۳ رقابت با جدول امتیازی بساز."""
    for comp_name in COMPETITION_NAMES:
        tournament = session.exec(
            select(Tournament)
            .where(Tournament.name == comp_name)
            .where(Tournament.venue_id == venue.id)
        ).first()

        if tournament is None:
            start_date = datetime.now() + timedelta(days=7)
            end_date = start_date + timedelta(days=60)
            tournament = Tournament(
                name=comp_name,
                description=f"رقابت {comp_name}",
                sport="futsal",
                organizer_id=venue.manager_id,
                venue_id=venue.id,
                status="registration",
                format="round_robin",
                starts_at=start_date,
                entry_fee=Decimal("5000000"),  # ۵ میلیون تومان
            )
            session.add(tournament)
            session.commit()
            session.refresh(tournament)
            print(f"  + رقابت '{comp_name}' ساخته شد (id={tournament.id})")

        break  # فقط یکی کافی است


def _create_financial_transactions(session: Session, venue: Venue, manager: User):
    """تراکنش‌های مالی نمونه برای کنسول مالی."""
    from app.models.transaction import TransactionMethod, TransactionSourceType, TransactionStatus

    transaction_types = [
        ("درآمد رزرو سانس", "receivable", "income"),
        ("هزینه اجاره سالن", "expense", "expense"),
        ("کارمزد درگاه پرداخت", "expense", "expense"),
        ("بازگشت وجه لغو رزرو", "refund", "expense"),
        ("درآمد مسابقه", "receivable", "income"),
    ]

    methods = ["gateway", "cash", "card_to_card"]

    for type_name, txn_type, direction in transaction_types:
        for j in range(3):  # ۳ تراکنش از هر نوع
            amount = Decimal(str(5000000 + j * 1000000))  # ۵-۷ میلیون
            session.add(
                FinancialTransaction(
                    type=txn_type,
                    direction=direction,
                    amount=int(amount),
                    method=methods[j % len(methods)],
                    status="cleared",
                    venue_id=venue.id,
                    source_type="booking_payment",
                    description=f"{type_name} - نمونه {j+1}",
                    occurred_at=datetime.now() - timedelta(days=j * 2),
                )
            )

    session.commit()
    print(f"  + ۱۵ تراکنش مالی نمونه برای سالن '{venue.name}' ساخته شد")


def _create_bookings(session: Session, venue: Venue, teams: list[Team]):
    """رزروهای نمونه برای نمایش تاریخچه."""
    from app.models.slot import Slot

    slots = session.exec(
        select(Slot)
        .where(Slot.venue_id == venue.id)
        .where(Slot.slot_date >= date.today())
        .limit(10)
    ).all()

    for i, slot in enumerate(slots[:5]):
        team = teams[i % len(teams)]
        booking = session.exec(
            select(Booking)
            .where(Booking.slot_id == slot.id)
            .where(Booking.user_id == team.captain_id)
        ).first()

        if booking is None:
            booking = Booking(
                slot_id=slot.id,
                user_id=team.captain_id,
                status="confirmed",
                payment_amount=int(slot.current_price or Decimal("5000000")),
                booked_at=datetime.now() - timedelta(days=i + 1),
            )
            session.add(booking)
            session.commit()
            print(f"  + رزرو نمونه برای کاربر '{team.captain_id}' در تاریخ {slot.slot_date}")


def seed() -> None:
    print("🚀 شروع ساخت داده‌های دمو...\n")

    with Session(engine) as session:
        # ۱. وصل کردن سالن‌ها به مدیران دمو
        print("۱. وصل کردن سالن‌ها به مدیران دمو...")
        assignments = _assign_venues_to_demo_managers(session)

        # ۲. ساخت تیم‌ها و رقابت‌ها برای هر سالن
        for venue, manager in assignments:
            print(f"\n۲. ساخت داده برای سالن '{venue.name}'...")

            # تیم‌ها
            print("  الف) ساخت تیم‌ها...")
            teams = _create_teams(session, venue, manager)

            # رقابت‌ها
            print("  ب) ساخت رقابت‌ها...")
            _create_competitions(session, venue, teams)

            # تراکنش‌های مالی
            print("  ج) ساخت تراکنش‌های مالی...")
            _create_financial_transactions(session, venue, manager)

            # رزروها
            print("  د) ساخت رزروهای نمونه...")
            _create_bookings(session, venue, teams)

    print("\n✅ تمام! داده‌های دمو آماده است.")
    print("\nخلاصه:")
    print(f"  • ۳ سالن فوتسال تهران به مدیران دمو وصل شد")
    print(f"  • {len(TEAM_NAMES)} تیم برای هر سالن ساخته شد")
    print(f"  • {len(COMPETITION_NAMES)} رقابت فعال ایجاد شد")
    print(f"  • تراکنش‌های مالی نمونه برای کنسول مالی ساخته شد")
    print(f"  • رزروهای نمونه برای نمایش تاریخچه ایجاد شد")


if __name__ == "__main__":
    seed()
