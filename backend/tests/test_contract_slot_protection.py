# backend/tests/test_contract_slot_protection.py
"""تست محافظت از سانس‌های قرارداد — وضعیت RESERVED و رد رزرو عمومی

نکته: بعد از هر commit در سشن تست، آبجکت‌ها expire می‌شوند؛ پس شناسه‌های
عددی بلافاصله پس از ساخت گرفته می‌شوند (الگوی conftest: close قبل از API).
"""
from datetime import date, time as dtime, timedelta

import pytest
from fastapi import HTTPException
from sqlmodel import Session, select

import app.services.pending_booking_service as pbs_module
import app.utils.rate_limit as rate_limit_module
from app.models.booking import Booking, BookingStatus
from app.models.contract import Contract, ContractSlot, ContractStatus, RecurrenceType
from app.models.slot import Slot, SlotStatus
from app.models.user import User, UserRole
from app.models.venue import Venue
from app.repositories.slot_repository import SlotRepository
from app.services.booking_service import BookingService
from app.services.competition_service import CompetitionService
from app.unit_of_work import UnitOfWork
from helpers import auth, FakeRedis
from conftest import test_engine


@pytest.fixture()
def fake_redis(monkeypatch):
    fake = FakeRedis()
    monkeypatch.setattr(pbs_module, "_client", fake)
    monkeypatch.setattr(rate_limit_module, "_client", fake)
    return fake


def _fresh():
    return Session(test_engine)


def _make_slot(session, venue_id, slot_date, start=dtime(18, 0),
               status=SlotStatus.AVAILABLE, **extra):
    s = Slot(venue_id=venue_id, slot_date=slot_date, start_time=start,
             duration=90, base_price=200000, current_price=200000,
             status=status, **extra)
    session.add(s)
    session.commit()
    session.refresh(s)
    return s.id


def _make_verified_user(db, seed, phone):
    """کاربر عادیِ تأییدشده (نقش USER برای رزرو باید verified باشد)"""
    user_id = seed["user"](phone).id
    with _fresh() as s:
        u = s.get(User, user_id)
        u.is_verified = True
        s.commit()
    return user_id, phone


def _setup_contract(client, db, seed, manager_phone, manager_user_id, venue_name):
    """manager+venue+sample slot از قبل ساخته‌شده در seed/db؛ ساخت قرارداد + سانس‌هایش"""
    with _fresh() as s:
        venue = Venue(name=venue_name, address="آدرس", latitude=35.7,
                      longitude=51.4, phone="09120000000", manager_id=manager_user_id)
        s.add(venue)
        s.commit()
        venue_id = venue.id
        sample_slot = _make_slot(s, venue_id, date.today() + timedelta(days=1))
    db.close()

    start = date.today() + timedelta(days=7)
    payload = {
        "venue_id": venue_id,
        "start_date": start.isoformat(),
        "end_date": (start + timedelta(days=28)).isoformat(),
        "day_of_week": start.weekday(),
        "start_time": "18:00",
        "recurrence": RecurrenceType.WEEKLY.value,
        "discounted_price": 150000,
        "description": "قرارداد تست",
    }
    r = client.post("/api/v1/contracts/", json=payload, headers=auth(manager_phone))
    assert r.status_code == 200, r.text
    cid = r.json()["id"]

    with _fresh() as s:
        contract_slots = s.exec(
            select(Slot.id).where(Slot.contract_id == cid)
        ).all()
    return venue_id, cid, list(contract_slots)


def _manager(db, seed, phone):
    m = seed["user"](phone, role=UserRole.VENUE_MANAGER)
    m_id, m_phone = m.id, m.phone
    db.close()
    return m_id, m_phone


# ─────────────────────────── قرارداد → RESERVED ───────────────────────────

def test_contract_creation_creates_reserved_slots(client, db, seed, fake_redis):
    m_id, m_phone = _manager(db, seed, "09113000001")
    venue_id, cid, slot_ids = _setup_contract(client, db, seed, m_phone, m_id, "سالن قرارداد")
    assert len(slot_ids) == 5  # هفتگی در بازه ۲۸ روزه
    with _fresh() as s:
        slots = s.exec(select(Slot).where(Slot.id.in_(slot_ids))).all()
        for slot in slots:
            assert slot.status == SlotStatus.RESERVED
            assert slot.is_contract_slot is True
        links = s.exec(
            select(ContractSlot).where(ContractSlot.slot_id.in_(slot_ids))
        ).all()
        assert {l.contract_id for l in links} == {cid}


# ─────────────────────────── رد رزرو روی سانس RESERVED ───────────────────────────

def test_booking_reserved_slot_fails_with_persian_400(client, db, seed, fake_redis):
    m_id, m_phone = _manager(db, seed, "09113000002")
    venue_id, cid, slot_ids = _setup_contract(client, db, seed, m_phone, m_id, "سالن رد")
    _, booker_phone = _make_verified_user(db, seed, "09113000022")
    r = client.post("/api/v1/bookings/", json={"slot_id": slot_ids[0]},
                    headers=auth(booker_phone))
    assert r.status_code == 400, r.text
    assert "قراردادی" in r.json()["detail"] or "قرارداد" in r.json()["detail"]


# ─────────────────────────── رزرو موفق روی سانس آزاد ───────────────────────────

def test_available_slot_booking_still_works(client, db, seed, fake_redis):
    m_id, m_phone = _manager(db, seed, "09113000003")
    venue_id, cid, slot_ids = _setup_contract(client, db, seed, m_phone, m_id, "سالن آزاد")
    with _fresh() as s:
        normal = _make_slot(s, venue_id, date.today() + timedelta(days=2), dtime(11, 0))
    db.close()
    _, booker_phone = _make_verified_user(db, seed, "09113000033")
    r = client.post("/api/v1/bookings/", json={"slot_id": normal}, headers=auth(booker_phone))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["slot_id"] == normal and body.get("id")
    with _fresh() as s:
        assert s.get(Slot, normal).status == SlotStatus.BOOKED


# ─────────────────────────── دفاع در عمق (دیتای قدیمی) ───────────────────────────

def test_defense_in_depth_available_contract_slot_rejected(client, db, seed, fake_redis):
    """سانس قدیمی AVAILABLE ولی وابسته به قرارداد فعال باید رد شود"""
    m_id, m_phone = _manager(db, seed, "09113000005")
    with _fresh() as s:
        venue = Venue(name="سالن لگسی", address="آدرس", latitude=35.7,
                      longitude=51.4, phone="09120000000", manager_id=m_id)
        s.add(venue)
        s.commit()          # commit قبل از refresh — id بعداً خوانده می‌شود
        s.refresh(venue)
        vid = venue.id
        contract = Contract(user_id=m_id, venue_id=vid,
                            start_date=date.today(),
                            end_date=date.today() + timedelta(days=30),
                            day_of_week=date.today().weekday(),
                            start_time=dtime(19, 0),
                            original_price=200000, discounted_price=150000,
                            total_amount=150000, status=ContractStatus.ACTIVE)
        s.add(contract)
        s.commit()          # commit قبل از refresh — id بعداً خوانده می‌شود
        s.refresh(contract)
        cid = contract.id
        legacy = _make_slot(s, vid, date.today() + timedelta(days=3), dtime(19, 0),
                            status=SlotStatus.AVAILABLE,
                            is_contract_slot=True, contract_id=cid)
    db.close()
    _, booker_phone = _make_verified_user(db, seed, "09113000055")
    r = client.post("/api/v1/bookings/", json={"slot_id": legacy}, headers=auth(booker_phone))
    assert r.status_code == 400, r.text
    assert "قرارداد" in r.json()["detail"]


# ─────────────────────────── نمایش/فیلتر وضعیت ───────────────────────────

def test_available_endpoint_excludes_reserved(client, db, seed, fake_redis):
    m_id, m_phone = _manager(db, seed, "09113000006")
    venue_id, cid, slot_ids = _setup_contract(client, db, seed, m_phone, m_id, "سالن لیست")
    with _fresh() as s:
        target = s.get(Slot, slot_ids[0])
        day = target.slot_date
        tid = target.id
    r = client.get(f"/api/v1/slots/venue/{venue_id}/available",
                   params={"slot_date": day.isoformat()})
    assert r.status_code == 200, r.text
    assert all(item["id"] != tid for item in r.json())

    r2 = client.get(f"/api/v1/slots/venue/{venue_id}", params={"slot_date": day.isoformat()})
    assert r2.status_code == 200, r2.text
    listed = [item for item in r2.json() if item["id"] == tid]
    assert listed, "sanse reserved bayad dar list mudir bashe"   # list-e kamel ba vaz'iat
    assert listed[0]["status"] == "reserved"
    assert listed[0]["is_contract_slot"] is True


def test_check_slot_conflict_treats_reserved_as_occupancy(db, seed):
    m_id, _ = _manager(db, seed, "09113000007")
    with _fresh() as s:
        venue = Venue(name="سالن تداخل", address="آدرس", latitude=35.7,
                      longitude=51.4, phone="09120000000", manager_id=m_id)
        s.add(venue)
        s.commit()
        s.refresh(venue)
        vid = venue.id
        day = date.today() + timedelta(days=4)
        _make_slot(s, vid, day, dtime(18, 0), status=SlotStatus.RESERVED,
                   is_contract_slot=True)
        repo = SlotRepository(s)
        assert repo.check_slot_conflict(vid, day, dtime(18, 0)) is not None
        assert repo.check_slot_conflict(vid, day, dtime(9, 0)) is None


def test_competition_cannot_start_on_reserved(db, seed):
    m_id, m_phone = _manager(db, seed, "09113000008")
    with _fresh() as s:
        venue = Venue(name="سالن رقابت", address="آدرس", latitude=35.7,
                      longitude=51.4, phone="09120000000", manager_id=m_id)
        s.add(venue)
        s.commit()
        s.refresh(venue)
        slot = _make_slot(s, venue.id, date.today() + timedelta(days=3),
                          status=SlotStatus.RESERVED, is_contract_slot=True)
    with pytest.raises(HTTPException) as exc_info:
        with UnitOfWork() as uow:
            CompetitionService.start_competition(uow, slot, m_id, 190000)
    assert exc_info.value.status_code == 400


def test_cancel_confirmed_slot_on_contract_restores_reserved(db, seed):
    """دیتای قدیمی: رزرو قطعی روی سانس قرارداد → پس از لغو باید RESERVED شود"""
    m_id, _ = _manager(db, seed, "09113000009")
    with _fresh() as s:
        venue = Venue(name="سالن لغو", address="آدرس", latitude=35.7,
                      longitude=51.4, phone="09120000000", manager_id=m_id)
        s.add(venue)
        s.commit()
        s.refresh(venue)
        vid = venue.id
        contract = Contract(user_id=m_id, venue_id=vid,
                            start_date=date.today(),
                            end_date=date.today() + timedelta(days=30),
                            day_of_week=date.today().weekday(),
                            start_time=dtime(20, 0),
                            original_price=200000, discounted_price=150000,
                            total_amount=150000, status=ContractStatus.ACTIVE)
        s.add(contract)
        s.commit()
        s.refresh(contract)
        slot = _make_slot(s, vid, date.today() + timedelta(days=5), dtime(20, 0),
                          status=SlotStatus.BOOKED, is_contract_slot=True,
                          contract_id=contract.id)
        booking = Booking(slot_id=slot, user_id=m_id,
                          status=BookingStatus.CONFIRMED, payment_amount=150000)
        s.add(booking)
        s.commit()
        bid = booking.id
    with UnitOfWork() as uow:
        BookingService.cancel_booking(uow, bid, m_id)
        uow.commit()
    with _fresh() as s:
        assert s.get(Slot, slot).status == SlotStatus.RESERVED
        assert s.get(Booking, bid).status == BookingStatus.CANCELLED
