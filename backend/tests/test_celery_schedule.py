# backend/tests/test_celery_schedule.py
"""گارد زمان‌بندی — هر تسکی که beat صدا می‌زند باید واقعاً register شده باشد.

علت وجود این تست: ۸ از ۹ ورودی beat_schedule نامی مثل `app.tasks.X` داشتند درحالی‌که
تسک‌ها با نام ساده‌ی `X` (یا مسیر کامل ماژول برای bind=True) ثبت می‌شدند؛ celery آن‌ها را
«unregistered task» می‌دانست و بی‌صدا دور می‌ریخت — یعنی اتوماسیون یادآوری/تسویه/بکاپ
از کار افتاده بود بدون هیچ خطایی در CI.
"""
import importlib
import pathlib

from app.tasks.worker import celery_app

_TASK_DIR = pathlib.Path(__file__).resolve().parents[1] / "app" / "tasks"
_TASK_MODULES = sorted(
    p.stem for p in _TASK_DIR.glob("*.py")
    if p.stem != "__init__" and p.stem != "worker"
)


def _registered_names() -> set:
    for mod in _TASK_MODULES:
        importlib.import_module(f"app.tasks.{mod}")
    return {
        name for name, task in celery_app.tasks.items()
        if not name.startswith("celery.")
    }


def test_all_beat_entries_resolve_to_registered_tasks():
    registered = _registered_names()
    schedule = celery_app.conf.beat_schedule or {}
    assert schedule, "beat_schedule نباید خالی باشد"
    missing = {
        key: entry["task"]
        for key, entry in schedule.items()
        if entry["task"] not in registered
    }
    assert not missing, f"ورودی beat به تسک ثبت‌نشده اشاره می‌کند: {missing}"


def test_every_defined_task_is_scheduled_or_named_by_convention():
    registered = _registered_names()
    # نام همهٔ تسک‌ها باید با پیشوند قرارداد پروژه شروع شود تا beat قابل‌استناد بماند
    bad = sorted(n for n in registered if not n.startswith("app.tasks."))
    assert not bad, f"تسک‌هایی بدون نام قراردادی: {bad}"


def test_overdue_contract_payments_is_actually_scheduled():
    """این تسک تعریف شده بود ولی هیچ schedule نداشت → اقساط معوق هرگز اطلاع داده نمی‌شدند."""
    schedule = celery_app.conf.beat_schedule or {}
    tasks = {entry["task"] for entry in schedule.values()}
    assert "app.tasks.notify_overdue_contract_payments" in tasks


def test_reminder_and_reconciliation_jobs_are_scheduled():
    schedule = celery_app.conf.beat_schedule or {}
    tasks = {entry["task"] for entry in schedule.values()}
    for expected in (
        "app.tasks.send_booking_reminders",          # یادآوری رزرو (P011)
        "app.tasks.reconcile_ledger_with_gateway",   # تطبیق مالی خودکار (P009)
        "app.tasks.perform_database_backup",
        "app.tasks.complete_past_bookings",
        "app.tasks.resolve_expired_competitions",
        "app.tasks.check_expired_contracts",
        "app.tasks.send_contract_renewal_reminders",
        "app.tasks.notify_dormant_high_value_customers",
        "app.tasks.cleanup_expired_pending_bookings",
    ):
        assert expected in tasks, f"{expected} در beat schedule نیست"
