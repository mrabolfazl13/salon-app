# backend/app/utils/time_guard.py
"""نگهبان زمانی سانس‌ها — یکپارچه‌سازی «تغییر داده‌ی سانس گذشته ممنوع»

قاعده: یک سانس گذشته محسوب می‌شود اگر تاریخ آن قبل از امروز باشد، یا امروز
باشد و ساعت شروع آن سپری شده باشد. تمام مسیرهای نوشتن قیمت سانس باید از
این ماژول استفاده کنند.
"""
from datetime import date, datetime, time as dtime
from typing import Union


def slot_start_datetime(slot_date: date, start_time: Union[dtime, str]) -> datetime:
    if isinstance(start_time, str):
        hour, minute = start_time.split(":")[:2]
        start_time = dtime(int(hour), int(minute))
    return datetime.combine(slot_date, start_time)


def is_past_slot(slot_date: date, start_time: Union[dtime, str]) -> bool:
    """آیا این سانس در گذشته شروع شده است؟ (سانس‌های امروزِ باقی‌مانده: آینده)"""
    return slot_start_datetime(slot_date, start_time) < datetime.now()
