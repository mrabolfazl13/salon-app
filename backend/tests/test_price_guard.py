# backend/tests/test_price_guard.py
"""نگهبان زمانی قیمت سانس — قیمت‌گذاری دسته‌ای نباید سانس‌های گذشته را تغییر دهد"""
from datetime import date, datetime, time as dtime, timedelta

import pytest
from sqlmodel import Session

from app.models.slot import Slot, SlotStatus
from app.models.user import UserRole
from app.models.venue import Venue
from app.repositories.slot_repository import SlotRepository
from app.utils.time_guard import is_past_slot
from conftest import test_engine
from helpers import auth


def _fresh():
    return Session(test_engine)


def _make_slot(session, venue_id, slot_date, start, price=300000):
    s = Slot(venue_id=venue_id, slot_date=slot_date, start_time=start,
             duration=90, base_price=price, current_price=price,
             status=SlotStatus.AVAILABLE)
    session.add(s)
    session.commit()
    session.refresh(s)
    return s.id


@pytest.fixture()
def venue_setup(db, seed):
    manager = seed["user"]("09114000001", role=UserRole.VENUE_MANAGER)
    m_id, m_phone = manager.id, manager.phone
    with _fresh() as s:
        venue = Venue(name="سالن قیمت", address="آدرس", latitude=35.7,
                      longitude=51.4, phone="09120000000", manager_id=m_id)
        s.add(venue)
        s.commit()
        s.refresh(venue)
        vid = venue.id
        today = date.today()
        past_id = _make_slot(s, vid, today - timedelta(days=3), dtime(18, 0))
        future_id = _make_slot(s, vid, today + timedelta(days=3), dtime(18, 0))
    db.close()
    return m_phone, vid, past_id, future_id


def test_is_past_slot_rule():
    today = date.today()
    assert is_past_slot(today - timedelta(days=1), dtime(23, 59)) is True
    assert is_past_slot(today, (datetime.now() - timedelta(hours=1)).time()) is True
    future_dt = datetime.now() + timedelta(days=1)
    assert is_past_slot(future_dt.date(), future_dt.time()) is False


def test_bulk_prices_skip_past_slots(client, venue_setup):
    m_phone, vid, past_id, future_id = venue_setup
    r = client.post(f"/api/v1/venues/{vid}/prices",
                    json={"18:00": 250000},
                    headers=auth(m_phone))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["updated"] == 1
    assert body["skipped_past"] == 1

    with _fresh() as s:
        past = s.get(Slot, past_id)
        future = s.get(Slot, future_id)
        assert past.current_price == 300000 and past.base_price == 300000
        assert future.current_price == 250000 and future.base_price == 250000


def test_repository_update_price_refuses_past_slot(venue_setup):
    m_phone, vid, past_id, future_id = venue_setup
    with _fresh() as s:
        repo = SlotRepository(s)
        assert repo.update_price(past_id, 123456) is None
        assert s.get(Slot, past_id).current_price == 300000
        updated = repo.update_price(future_id, 123456)
        assert updated is not None
        assert s.get(Slot, future_id).current_price == 123456
