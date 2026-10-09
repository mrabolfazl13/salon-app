"""Date formatting utilities with automatic Jalali conversion for Persian locale."""
from datetime import date, datetime
from typing import Optional, Union
from app.utils.jalali import jalali_string


def format_persian_date(d: Union[date, datetime, str, None]) -> Optional[str]:
    """Convert any date to Persian/Jalali string.
    
    Handles:
    - date objects → "۱ فروردین ۱۴۰۴"
    - datetime objects → "۱ فروردین ۱۴۰۴ ساعت ۱۴:۳۰"
    - ISO strings → converts to date then formats
    - None → None
    """
    if d is None:
        return None
    
    # Parse ISO string if needed
    if isinstance(d, str):
        try:
            d = datetime.fromisoformat(d).date()
        except (ValueError, TypeError):
            return d  # Return as-is if can't parse
    
    # Extract date from datetime
    if isinstance(d, datetime):
        date_part = d.date()
        time_str = f"ساعت {d.hour:02d}:{d.minute:02d}"
        return f"{jalali_string(date_part)} {time_str}"
    
    # Pure date object
    if isinstance(d, date):
        return jalali_string(d)
    
    return str(d)


def format_persian_datetime(dt: Union[datetime, str, None]) -> Optional[str]:
    """Format datetime as Persian with time."""
    if dt is None:
        return None
    
    if isinstance(dt, str):
        try:
            dt = datetime.fromisoformat(dt)
        except (ValueError, TypeError):
            return dt
    
    if isinstance(dt, datetime):
        return format_persian_date(dt)
    
    return str(dt)
