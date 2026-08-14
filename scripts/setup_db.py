#!/usr/bin/env python3
"""
Database Setup Script for Futsal Booking System
This script creates the database tables and initializes the admin user.
"""

import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.database import engine, Base
from app.models.user import User, UserRole
from app.models.venue import Venue, Club
from app.models.slot import Slot
from app.models.booking import Booking
from app.models.competition import Competition
from app.models.contract import Contract, ContractSlot, ContractPayment
from sqlmodel import Session
from datetime import date, time
from decimal import Decimal

def create_tables():
    """Create all database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created successfully!")

def create_admin_user(phone: str = "09123456789", password: str = "admin123"):
    """Create the default admin user"""
    print(f"Creating admin user with phone: {phone}...")
    
    with Session(engine) as session:
        # Check if admin already exists
        from sqlmodel import select
        statement = select(User).where(User.phone == phone)
        admin = session.exec(statement).first()
        
        if admin:
            print("✓ Admin user already exists!")
            return admin
        
        # Create admin user
        admin_user = User(
            phone=phone,
            full_name="مدیر سیستم",
            password=password,
            role=UserRole.SUPER_ADMIN,
            is_active=True,
            is_verified=True,
        )
        
        session.add(admin_user)
        session.commit()
        session.refresh(admin_user)
        
        print(f"✓ Admin user created successfully! (ID: {admin_user.id})")
        return admin_user

def create_sample_venue(manager_phone: str = "09111111111", password: str = "manager123"):
    """Create a sample venue manager and venue for testing"""
    print("Creating sample venue manager and venue...")
    
    with Session(engine) as session:
        from sqlmodel import select
        
        # Check if manager already exists
        statement = select(User).where(User.phone == manager_phone)
        manager = session.exec(statement).first()
        
        if not manager:
            # Create manager user
            manager = User(
                phone=manager_phone,
                full_name="مدیر نمونه",
                password=password,
                role=UserRole.VENUE_MANAGER,
                is_active=True,
                is_verified=True,
            )
            session.add(manager)
            session.commit()
            session.refresh(manager)
            print(f"✓ Manager user created! (ID: {manager.id})")
        
        # Check if venue already exists
        statement = select(Venue).where(Venue.manager_id == manager.id)
        existing_venue = session.exec(statement).first()
        
        if existing_venue:
            print("✓ Sample venue already exists!")
            return existing_venue
        
        # Create sample venue
        venue = Venue(
            name="سالن نمونه فوتسال",
            address="تهران، خیابان آزادی، پلاک ۱",
            phone="021-12345678",
            description="سالن نمونه برای تست سیستم رزرو",
            latitude=35.6892,
            longitude=51.3890,
            amenities='["پارکینگ", "دوش آب گرم", "رختکن", "نمایندگی"]',
            images='[]',
            manager_id=manager.id,
            is_verified=True,
        )
        
        session.add(venue)
        session.commit()
        session.refresh(venue)
        
        print(f"✓ Sample venue created! (ID: {venue.id})")
        
        # Generate sample slots for today
        generate_sample_slots(venue.id)
        
        return venue

def generate_sample_slots(venue_id: int):
    """Generate sample slots for a venue"""
    from app.repositories.slot_repository import SlotRepository
    
    print("Generating sample slots...")
    
    with Session(engine) as session:
        repo = SlotRepository(session)
        today = date.today()
        
        # Generate slots for today and next 7 days
        for day_offset in range(8):
            slot_date = today.replace(day=today.day + day_offset)
            slots = repo.create_daily_slots(venue_id, slot_date)
            print(f"  Created {len(slots)} slots for {slot_date}")
        
        session.commit()
        print("✓ Sample slots generated!")

def drop_tables():
    """Drop all database tables (WARNING: This will delete all data!)"""
    confirm = input("Are you sure you want to drop all tables? This will delete all data! (yes/no): ")
    if confirm.lower() != 'yes':
        print("Operation cancelled.")
        return
    
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("✓ All tables dropped!")

def main():
    """Main setup function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Database Setup Script")
    parser.add_argument(
        "--action", 
        choices=["setup", "create-admin", "create-sample", "drop"],
        default="setup",
        help="Action to perform: setup (default), create-admin, create-sample, drop"
    )
    parser.add_argument("--phone", help="Phone number for admin/manager user")
    parser.add_argument("--password", help="Password for admin/manager user")
    
    args = parser.parse_args()
    
    print("=" * 50)
    print("Futsal Booking System - Database Setup")
    print("=" * 50)
    
    if args.action == "setup":
        create_tables()
        create_admin_user(args.phone, args.password)
        create_sample_venue(args.phone, args.password)
        print("\n" + "=" * 50)
        print("Setup complete!")
        print("\nDefault Admin Credentials:")
        print(f"  Phone: 09123456789")
        print(f"  Password: admin123")
        print("\nSample Manager Credentials:")
        print(f"  Phone: 09111111111")
        print(f"  Password: manager123")
        print("=" * 50)
        
    elif args.action == "create-admin":
        create_tables()
        create_admin_user(args.phone, args.password)
        
    elif args.action == "create-sample":
        create_sample_venue(args.phone, args.password)
        
    elif args.action == "drop":
        drop_tables()

if __name__ == "__main__":
    main()