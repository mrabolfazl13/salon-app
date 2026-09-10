# backend/tests/helpers.py
"""کمکی‌های مشترک تست‌ها."""


def auth(phone: str) -> dict:
    """هدر احراز هویت تست — توکن = شماره تلفن (resolve در conftest)."""
    return {"Authorization": f"Bearer {phone}"}


def err_code(response) -> str | None:
    """استخراج کد خطای ساختارمند از detail دیکشنری."""
    try:
        detail = response.json().get("detail")
    except Exception:
        return None
    if isinstance(detail, dict):
        return detail.get("code")
    return None
