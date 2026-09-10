# backend/app/services/pending_booking_service.py
"""انبار رزروهای در انتظار تأیید (Redis) — قبل از ذخیره‌سازی در دیتابیس

فرآیند:
1. کاربر رزرو می‌کند → رکورد در Redis نگه داشته می‌شود (slot هم BOOKED می‌شود تا کسی دیگر رزرو نکند)
2. مدیر سالن تأیید می‌کند → رکورد به دیتابیس (bookings) منتقل می‌شود و ورودی Redis پاک می‌شود
3. مدیر سالن رد می‌کند / رزرو منقضی می‌شود → ورودی Redis پاک و slot دوباره AVAILABLE می‌شود
"""
import json
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

import redis

from app.config import settings

PENDING_TTL = timedelta(hours=settings.PENDING_BOOKING_TTL_HOURS)

_client: Optional[redis.Redis] = None


def _get_redis() -> redis.Redis:
    global _client
    if _client is None:
        _client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _client


def _booking_key(pid: str) -> str:
    return f"pending:booking:{pid}"


def _slot_key(slot_id: int) -> str:
    return f"pending:slot:{slot_id}"


def _venue_key(venue_id: int) -> str:
    return f"pending:venue:{venue_id}"


def _user_key(user_id: int) -> str:
    return f"pending:user:{user_id}"


class PendingBookingService:

    def has_pending_for_slot(self, slot_id: int) -> bool:
        """آیا برای این سانس رزرو در انتظار تأیید وجود دارد؟"""
        return _get_redis().exists(_slot_key(slot_id)) > 0

    def create(self, slot_id: int, venue_id: int, user_id: int, payment_amount: int) -> dict:
        """ایجاد رزرو معلق در Redis"""
        r = _get_redis()
        pid = uuid.uuid4().hex
        now = datetime.now(timezone.utc)
        record = {
            "id": pid,
            "slot_id": slot_id,
            "venue_id": venue_id,
            "user_id": user_id,
            "booked_at": now.isoformat(),
            "status": "pending",
            "payment_amount": payment_amount,
            "expires_at": (now + PENDING_TTL).isoformat(),
        }
        ttl = int(PENDING_TTL.total_seconds())
        pipe = r.pipeline()
        pipe.set(_booking_key(pid), json.dumps(record), ex=ttl)
        pipe.set(_slot_key(slot_id), pid, ex=ttl)
        pipe.sadd(_venue_key(venue_id), pid)
        pipe.sadd(_user_key(user_id), pid)
        pipe.execute()
        return record

    def get(self, pid: str) -> Optional[dict]:
        raw = _get_redis().get(_booking_key(pid))
        return json.loads(raw) if raw else None

    def remove(self, pid: str) -> Optional[dict]:
        """حذف رزرو معلق و همه‌ی شاخص‌های مربوطه"""
        r = _get_redis()
        record = self.get(pid)
        if not record:
            return None
        pipe = r.pipeline()
        pipe.delete(_booking_key(pid))
        pipe.delete(_slot_key(record["slot_id"]))
        pipe.srem(_venue_key(record["venue_id"]), pid)
        pipe.srem(_user_key(record["user_id"]), pid)
        pipe.execute()
        return record

    def list_by_venue(self, venue_id: int) -> list[dict]:
        return self._list(_venue_key(venue_id))

    def list_by_user(self, user_id: int) -> list[dict]:
        return self._list(_user_key(user_id))

    def _list(self, index_key: str) -> list[dict]:
        pids = _get_redis().smembers(index_key)
        records = []
        for pid in pids:
            rec = self.get(pid)
            if rec:
                records.append(rec)
        records.sort(key=lambda x: x.get("booked_at", ""), reverse=True)
        return records

    def all_expired(self) -> list[dict]:
        """لیست رزروهای معلقی که تاریخ انقضایشان گذشته (برای کارکردن توسط celery)"""
        r = _get_redis()
        expired = []
        now = datetime.now(timezone.utc)
        for key in r.scan_iter("pending:booking:*"):
            raw = r.get(key)
            if raw:
                try:
                    rec = json.loads(raw)
                    exp = datetime.fromisoformat(rec["expires_at"])
                    if now > exp:
                        expired.append(rec)
                except (ValueError, KeyError):
                    r.delete(key)
        return expired


pending_booking_service = PendingBookingService()
