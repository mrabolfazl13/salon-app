# backend/app/utils/utc.py
"""هنجار زمانی: قبل از هر مقایسهٔ پایتونی، مقدار دیتابیس را آگاه کن.

اندازه‌گیری‌شده (۲۰۲۶-۱۰-۱۶): روی PostgreSQLِ مهاجرت‌شده هر ۱۸۴ ستون زمانی
`timestamp with time zone` است (ستون naive پیدا نشد)، پس prod مقدار آگاه برمی‌گرداند.
اما روی SQLiteِ تست‌ها با `sqlmodel==0.0.42` (همان که CI/prod نصب می‌کند) همان ستون
**naive** برمی‌گردد — با sqlmodel 0.0.47ِ محیط توسعه برعکس، آگاه. نتیجه:
`row.some_at < datetime.now(timezone.utc)` در CI تیب‌ارور می‌دهد و در محیط توسعه رد می‌شود.
`as_utc` هر دو حالت را به یک شکل می‌برد (روی PG بی‌اثر است).

(این با `as_aware` در سرویس‌های مربی/شیفت/تورنمت فرق دارد: آن‌ها ورودی naive *کلاینت* را
وقت تهران می‌دانند و برای نوشتن است؛ این تابع برای خواندن است و UTC فرض می‌کند.)
"""
from datetime import datetime, timezone


def as_utc(dt: datetime) -> datetime:
    """مقدارِ UTCِ naive (خروجی SQLite در تست‌ها) را به datetime آگاه تبدیل می‌کند."""
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt
