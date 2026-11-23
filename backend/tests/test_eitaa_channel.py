# backend/tests/test_eitaa_channel.py
"""کانال ایتا: تنظیمات مدیر، متن جدول و ارسال مجدد با تیک.

شبکه همیشه mock میشود — هیچ تستی نباید به eitaayar.ir دست بزند.
"""
from datetime import date, datetime, time as dtime
from zoneinfo import ZoneInfo

import pytest
from sqlmodel import select

from app.models.booking import Booking, BookingStatus, ReceiptStatus
from app.models.eitaa import EitaaChannel
from app.models.slot import Slot, SlotStatus
from app.models.user import UserRole
from app.models.venue import Venue, VenuePaymentMode
from app.unit_of_work import UnitOfWork

import app.services.eitaa_service as eitaa_service
from app.services.eitaa_service import build_schedule_text, publish_schedule

DAY = date(2026, 11, 23)
NOW = datetime(2026, 11, 23, 10, 30, tzinfo=ZoneInfo("Asia/Tehran"))
BASE = "/api/v1"


def _auth(phone):
    return {"Authorization": f"Bearer {phone}"}


def _venue_and_slots(seed, db, phone="09550000001"):
    """همه چیز را یکجا commit و refresh میکند؛ فقط id/phone برمیگرداند."""
    manager = seed["user"](phone, full_name="مدیر ایتا", role=UserRole.VENUE_MANAGER)
    manager_id, manager_phone = manager.id, manager.phone
    venue = Venue(name="سالن ایتا", category="futsal", address="تهران",
                  latitude=35.7, longitude=51.4, phone="09123456789",
                  manager_id=manager_id)
    db.add(venue)
    db.commit()
    db.refresh(venue)
    slots = [
        Slot(venue_id=venue.id, slot_date=DAY, start_time=dtime(hour, 0),
             duration=90, base_price=100_000, current_price=100_000,
             status=SlotStatus.AVAILABLE)
        for hour in (18, 19)
    ]
    db.add_all(slots)
    db.commit()
    for slot in slots:
        db.refresh(slot)
    result = {
        "manager_phone": manager_phone,
        "manager_id": manager_id,
        "venue_id": venue.id,
        "slot_ids": [slot.id for slot in slots],
    }
    db.close()
    return result


def _confirm_slot(slot_id, user_id):
    with UnitOfWork() as uow:
        uow.session.add(Booking(
            slot_id=slot_id, user_id=user_id,
            status=BookingStatus.CONFIRMED, payment_amount=100_000,
        ))


class _FakeResponse:
    def __init__(self, message_id: int):
        self._message_id = message_id

    def json(self):
        return {"ok": True, "result": {"message_id": self._message_id}}


class _FakeClient:
    calls = []

    def __init__(self, timeout=None):
        pass

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def post(self, url, data=None):
        self.calls.append({"url": url, "data": dict(data or {})})
        return _FakeResponse(7000 + len(self.calls))


@pytest.fixture()
def fake_eitaa(monkeypatch):
    _FakeClient.calls = []
    monkeypatch.setattr(eitaa_service.httpx, "Client", _FakeClient)
    return _FakeClient.calls


def _configure_channel(venue_id, *, active=True, pin=True):
    with UnitOfWork() as uow:
        uow.session.add(EitaaChannel(
            venue_id=venue_id, chat_id="salon_channel", bot_token="bot123:secret",
            is_active=active, pin_updates=pin,
        ))


def test_token_crypto_roundtrip_and_legacy(monkeypatch):
    from app.utils import token_crypto

    monkeypatch.setattr(token_crypto.settings, "EITAA_TOKEN_KEY", "stable-test-key")
    encrypted = token_crypto.encrypt_token("bot123:secret")
    assert encrypted.startswith("enc:")
    assert token_crypto.decrypt_token(encrypted) == "bot123:secret"
    assert token_crypto.decrypt_token("bot123:secret") == "bot123:secret"  # legacy DB value
    assert token_crypto.decrypt_token(encrypted[:-3] + "aaa") == ""  # wrong key/ciphertext


def test_upsert_channel_hides_token(client, seed, db):
    ctx = _venue_and_slots(seed, db, "09550000002")
    payload = {"chat_id": "@salon_channel", "bot_token": "bot123:secret",
               "is_active": True, "pin_updates": True}

    r = client.put(f"{BASE}/venues/{ctx['venue_id']}/eitaa-channel",
                   json=payload, headers=_auth(ctx["manager_phone"]))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["chat_id"] == "salon_channel"
    assert "bot_token" not in body

    got = client.get(f"{BASE}/venues/{ctx['venue_id']}/eitaa-channel",
                     headers=_auth(ctx["manager_phone"]))
    assert got.status_code == 200
    assert got.json()["last_post_date"] is None

    with UnitOfWork() as uow:
        channel = uow.session.exec(
            select(EitaaChannel).where(EitaaChannel.venue_id == ctx["venue_id"])
        ).first()
        assert channel is not None
        assert channel.bot_token.startswith("enc:")
        assert "bot123:secret" not in channel.bot_token


def test_upsert_keeps_existing_token_when_blank(client, seed, db):
    ctx = _venue_and_slots(seed, db, "09550000009")
    headers = _auth(ctx["manager_phone"])
    url = f"{BASE}/venues/{ctx['venue_id']}/eitaa-channel"

    first = client.put(url, json={"chat_id": "salon_channel", "bot_token": "bot123:secret"},
                       headers=headers)
    assert first.status_code == 200, first.text
    with UnitOfWork() as uow:
        stored = uow.session.exec(
            select(EitaaChannel).where(EitaaChannel.venue_id == ctx["venue_id"])
        ).first().bot_token

    second = client.put(url, json={"chat_id": "salon_channel", "bot_token": "",
                                   "is_active": False},
                        headers=headers)
    assert second.status_code == 200, second.text
    assert second.json()["is_active"] is False
    with UnitOfWork() as uow:
        after = uow.session.exec(
            select(EitaaChannel).where(EitaaChannel.venue_id == ctx["venue_id"])
        ).first().bot_token
    assert after == stored


def test_build_schedule_marks_confirmed_slot(seed, db):
    ctx = _venue_and_slots(seed, db, "09550000003")
    _confirm_slot(ctx["slot_ids"][0], ctx["manager_id"])

    with UnitOfWork() as uow:
        text = build_schedule_text(uow, ctx["venue_id"], DAY, now=NOW)

    assert "✅ ۱۸:۰۰ — رزرو تأیید شد" in text
    assert "☐ ۱۹:۰۰ — آزاد" in text
    assert "۱۰:۳۰" in text


def test_repost_sends_new_message_with_reply_and_check(fake_eitaa, seed, db):
    ctx = _venue_and_slots(seed, db, "09550000004")
    _confirm_slot(ctx["slot_ids"][0], ctx["manager_id"])
    _configure_channel(ctx["venue_id"])

    with UnitOfWork() as uow:
        first = publish_schedule(uow, ctx["venue_id"], day=DAY, is_update=False)
        second = publish_schedule(uow, ctx["venue_id"], day=DAY, is_update=True)

    assert len(fake_eitaa) == 2
    assert "id_message_to_reply" not in fake_eitaa[0]["data"]
    assert fake_eitaa[1]["data"]["id_message_to_reply"] == first["message_id"]
    assert fake_eitaa[1]["data"]["pin"] == 1
    assert "✅ ۱۸:۰۰ — رزرو تأیید شد" in second["text"]
    assert second["reposted"] is True
    assert fake_eitaa[0]["url"].endswith("/bot123:secret/sendMessage")


def test_daily_task_is_idempotent(fake_eitaa, seed, db):
    ctx = _venue_and_slots(seed, db, "09550000005")
    _configure_channel(ctx["venue_id"])

    from app.tasks.eitaa_tasks import post_daily_eitaa_schedules

    first = post_daily_eitaa_schedules()
    second = post_daily_eitaa_schedules()

    assert first["posted"] == 1
    assert second["skipped"] == 1
    assert len(fake_eitaa) == 1


def test_repost_task_skips_other_days(fake_eitaa, seed, db):
    ctx = _venue_and_slots(seed, db, "09550000006")
    with UnitOfWork() as uow:
        uow.slots.update(ctx["slot_ids"][0], {"slot_date": DAY.replace(year=DAY.year + 1)})
    _configure_channel(ctx["venue_id"])

    from app.tasks.eitaa_tasks import repost_eitaa_schedule_with_check

    result = repost_eitaa_schedule_with_check(ctx["venue_id"], ctx["slot_ids"][0])

    assert result == {"skipped": "slot_not_today"}
    assert fake_eitaa == []


def test_failed_send_records_error(monkeypatch, seed, db):
    ctx = _venue_and_slots(seed, db, "09550000007")
    _configure_channel(ctx["venue_id"])

    def _raise(**kwargs):
        raise eitaa_service.EitaaError("serializable_error")

    monkeypatch.setattr(eitaa_service, "send_message", _raise)
    with UnitOfWork() as uow, pytest.raises(eitaa_service.EitaaError):
        publish_schedule(uow, ctx["venue_id"], day=DAY, is_update=True)

    with UnitOfWork() as uow:
        channel = uow.session.exec(
            select(EitaaChannel).where(EitaaChannel.venue_id == ctx["venue_id"])
        ).first()
        assert channel.last_error is not None


def test_approval_dispatches_repost(monkeypatch, client, seed, db):
    manager = seed["user"]("09550000008", role=UserRole.VENUE_MANAGER)
    data = seed["booking"](manager)
    booking_id, venue_id, slot_id, manager_phone = (
        data["booking"].id, data["venue"].id, data["slot"].id, manager.phone
    )
    with UnitOfWork() as uow:
        uow.bookings.update(booking_id, {
            "payment_mode": VenuePaymentMode.BANK_RECEIPT,
            "receipt_status": ReceiptStatus.SUBMITTED,
            "needs_receipt": True,
            "status": BookingStatus.PENDING,
        })
    db.commit()

    from app.tasks import eitaa_tasks

    calls = []
    monkeypatch.setattr(eitaa_tasks.repost_eitaa_schedule_with_check, "delay",
                        lambda *args: calls.append(args))

    r = client.post(f"{BASE}/bookings/{booking_id}/receipt/approve",
                    headers=_auth(manager_phone))
    assert r.status_code == 200, r.text
    assert (venue_id, slot_id) in calls
