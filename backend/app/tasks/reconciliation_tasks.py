"""کارِ شبانۀ مغایرگیری دفتر کل ↔ درگاه (C14).

منطقِ مقایسه در `ReconciliationService` است تا بدون Celery/Redis و بدون درگاه
تست‌پذیر بماند؛ این فایل فقط بازه را می‌سازد، کار را صدا می‌زند و گزارش را
می‌نویسد (قبلاً همین‌جا `from app.models.reconciliation_report import …` داشت که
ماژولش وجود نداشت ⇒ هرچی مغایرت پیدا می‌شد فقط در لاگ می‌سوخت).
"""
from datetime import datetime, timedelta, timezone
import logging

from app.services.reconciliation_service import ReconciliationService
from app.tasks.worker import celery_app
from app.unit_of_work import UnitOfWork

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="app.tasks.reconcile_ledger_with_gateway")
def reconcile_ledger_with_gateway(self):
    """مغایرت‌های «دیروز» را می‌یابد و ردیف گزارش را در دیتابیس می‌گذارد.

    بازه بر حسب UTC ساخته می‌شود؛ روزِ کاری تهران ۳:۳۰ ساعت جلوتر است ⇒ پرداخت‌های
    ۰۰:۰۰ تا ۰۳:۳۰ صبح تهران در گزارشِ شبِ قبل می‌افتند (گره‌ای که در C14 ثبت شده،
    نه اینکه اینجا نادیده گرفته شود).
    """
    logger.info("Starting daily ledger reconciliation...")

    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).date()

    try:
        with UnitOfWork() as uow:
            report = ReconciliationService.run(
                uow, period_from=yesterday, period_to=yesterday)
            uow.commit()
    except Exception as exc:  # noqa: BLE001 — مرزِ worker؛ خطا باید در لاگ و retry بماند
        logger.error(f"Reconciliation failed: {exc}", exc_info=True)
        raise

    for mismatch in report["mismatches"]:
        logger.warning(f"RECONCILIATION ISSUE: {mismatch['message']}")

    logger.info(
        "Reconciliation complete: %s payments, %s ledger income rows, %s mismatches",
        report["payments_checked"], report["ledger_income_rows"], report["mismatch_count"])

    return {
        "success": True,
        "period": {"from": report["period_from"], "to": report["period_to"]},
        "summary": {
            "payments_checked": report["payments_checked"],
            "ledger_income_rows": report["ledger_income_rows"],
            "mismatches": report["mismatch_count"],
        },
        "mismatches": report["mismatches"][:10],
    }
