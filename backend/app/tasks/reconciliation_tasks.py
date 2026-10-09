"""Daily ledger reconciliation task - compares ledger with payment gateway records."""
from app.tasks.worker import celery_app
from app.unit_of_work import get_unit_of_work
from app.services.finance_service import FinanceService
from datetime import datetime, timedelta, timezone
import logging

logger = logging.getLogger(__name__)


@celery_app.task(bind=True)
def reconcile_ledger_with_gateway(self):
    """Compare yesterday's ledger transactions with actual payment gateway settlements.
    
    Runs daily at midnight to detect:
    - Payments recorded in ledger but not settled by gateway
    - Gateway settlements without corresponding ledger entries
    - Amount mismatches between ledger and gateway
    
    Results stored in reconciliation_report table (to be created).
    """
    logger.info("Starting daily ledger reconciliation...")
    
    try:
        uow = next(get_unit_of_work())
        
        # Get yesterday's date range
        now = datetime.now(timezone.utc)
        yesterday_start = (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        yesterday_end = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Get all BOOKING_PAYMENT transactions from yesterday
        ledger_txns = uow.session.exec(
            uow.transactions.model.select().where(
                (uow.transactions.model.created_at >= yesterday_start) &
                (uow.transactions.model.created_at < yesterday_end) &
                (uow.transactions.model.source_type == "booking_payment")
            )
        ).all()
        
        # Get all PAID payments from yesterday
        paid_payments = uow.session.exec(
            uow.payments.model.select().where(
                (uow.payments.model.paid_at >= yesterday_start) &
                (uow.payments.model.paid_at < yesterday_end) &
                (uow.payments.model.status == "paid")
            )
        ).all()
        
        # Build lookup maps
        ledger_by_booking = {}
        for txn in ledger_txns:
            source_id = txn.source_id
            if source_id:
                ledger_by_booking[source_id] = txn
        
        gateway_by_booking = {}
        for payment in paid_payments:
            gateway_by_booking[payment.booking_id] = payment
        
        # Find discrepancies
        mismatches = []
        
        # Check 1: Ledger has transaction but gateway doesn't show as paid
        for booking_id, txn in ledger_by_booking.items():
            if booking_id not in gateway_by_booking:
                mismatches.append({
                    "type": "ledger_without_gateway",
                    "booking_id": booking_id,
                    "transaction_id": txn.id,
                    "amount": txn.amount,
                    "message": f"تراکنش دفتر کل #{txn.id} برای رزرو {booking_id} ثبت شده اما پرداخت در درگاه یافت نشد"
                })
            else:
                payment = gateway_by_booking[booking_id]
                if txn.amount != payment.amount:
                    mismatches.append({
                        "type": "amount_mismatch",
                        "booking_id": booking_id,
                        "transaction_id": txn.id,
                        "payment_id": payment.id,
                        "ledger_amount": txn.amount,
                        "gateway_amount": payment.amount,
                        "difference": txn.amount - payment.amount,
                        "message": f"تفاوت مبلغ: دفتر کل {txn.amount:,} تومان، درگاه {payment.amount:,} تومان"
                    })
        
        # Check 2: Gateway shows paid but no ledger entry
        for booking_id, payment in gateway_by_booking.items():
            if booking_id not in ledger_by_booking:
                mismatches.append({
                    "type": "gateway_without_ledger",
                    "booking_id": booking_id,
                    "payment_id": payment.id,
                    "amount": payment.amount,
                    "message": f"پرداخت #{payment.id} برای رزرو {booking_id} در درگاه موفق بوده اما در دفتر کل ثبت نشده"
                })
        
        # Log results
        total_ledger = len(ledger_txns)
        total_gateway = len(paid_payments)
        total_mismatches = len(mismatches)
        
        logger.info(
            f"Reconciliation complete: {total_ledger} ledger txns, "
            f"{total_gateway} gateway payments, {total_mismatches} mismatches"
        )
        
        if mismatches:
            logger.warning(f"Mismatches found: {mismatches}")
            
            # Store reconciliation report
            report_data = {
                "date": yesterday_start.isoformat(),
                "total_ledger_transactions": total_ledger,
                "total_gateway_payments": total_gateway,
                "total_mismatches": total_mismatches,
                "mismatches": mismatches,
                "generated_at": now.isoformat(),
            }
            
            # Save to database (assuming reconciliation_reports table exists)
            try:
                from app.models.reconciliation_report import ReconciliationReport
                report = ReconciliationReport(
                    date=yesterday_start.date(),
                    data=report_data,
                    status="completed" if total_mismatches == 0 else "issues_found"
                )
                uow.session.add(report)
                uow.commit()
            except Exception as e:
                logger.error(f"Failed to save reconciliation report: {e}")
                # Still log the mismatches even if we can't save the report
                for mismatch in mismatches:
                    logger.error(f"RECONCILIATION ISSUE: {mismatch['message']}")
        
        return {
            "success": True,
            "date_range": {
                "start": yesterday_start.isoformat(),
                "end": yesterday_end.isoformat(),
            },
            "summary": {
                "ledger_transactions": total_ledger,
                "gateway_payments": total_gateway,
                "mismatches": total_mismatches,
            },
            "mismatches": mismatches[:10],  # Return first 10 for debugging
        }
        
    except Exception as e:
        logger.error(f"Reconciliation failed: {e}", exc_info=True)
        raise
