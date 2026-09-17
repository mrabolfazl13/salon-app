# backend/app/tasks/contract_tasks.py
"""تسک‌های قرارداد:
- check_expired_contracts (روزانه ۰۲:۰۰):
  ۱) سانس‌های گذشته SCHEDULED → COMPLETED (لایه رزرو؛ Slot دست‌نخورده — مستند)
  ۲) قرارداد گذشته: اگر auto_renew و عدم objection → تمدید یک دوره (EXTEND) +
     متریالایز سانس‌های جدید + ممیزی `renewed`؛ در غیر این صورت EXPIRED.
- notify_overdue_contract_payments (روزانه ۰۳:۰۰): اقساط معوق پرداخت‌نشده →
  علامت OVERDUE + اعلان به کاربر و مدیر (یک‌بار؛ overdue_notified_at ضدتکرار).
"""
import asyncio
from datetime import date, timedelta

from celery.schedules import crontab

from app.tasks.worker import celery_app


@celery_app.task(name="check_expired_contracts")
def check_expired_contracts():
    from app.models.contract import (ContractSlotStatus, ContractStatus, ContractAuditAction)
    from app.services.contract_service import ContractService, cs_effective
    from app.unit_of_work import UnitOfWork

    with UnitOfWork() as uow:
        service = ContractService(uow)

        # ۱) تکمیل سانس‌های گذشته — برای همه قراردادهای زنده (ACTIVE/PENDING)
        completed = 0
        for cs in uow.contract_slots.get_past_scheduled():
            contract = uow.contracts.get_by_id(cs.contract_id)
            if contract is None or contract.status not in (ContractStatus.ACTIVE, ContractStatus.PENDING):
                continue
            eff_date, _ = cs_effective(cs)
            if eff_date >= date.today():
                continue
            obj = uow.contract_slots.get_by_id(cs.id)
            obj.status = ContractSlotStatus.COMPLETED
            from datetime import datetime as _dt, timezone as _tz
            obj.updated_at = _dt.now(_tz.utc)  # ثبت تکمیل — ادعای حضور نیست
            uow.session.add(obj)
            completed += 1

        # ۲) انقضا / تمدید خودکار
        expired_count = 0
        renewed_count = 0
        objections = 0
        for contract in uow.contracts.get_expired_contracts():
            if contract.auto_renew and not contract.renewal_objection:
                term_days = max((contract.end_date - contract.start_date).days, 7)
                old_end = contract.end_date
                new_end = old_end + timedelta(days=term_days)
                uow.contracts.renew_contract(contract.id, new_end)
                fresh = uow.contracts.get_by_id(contract.id)
                full_series = ContractService.iterate_days_session_dates(
                    fresh.start_date, new_end, ContractService.contract_days(fresh),
                    fresh.recurrence)
                # ادامه‌ی همان سری هفتگی قرارداد، نه بازگام‌برداری از ابتدای دوره جدید
                new_dates = [d for d in full_series if d > old_end and d >= date.today()]
                added = service._materialize_slots(fresh, new_dates)
                fresh.total_amount = fresh.total_amount + added * fresh.discounted_price
                uow.session.add(fresh)
                uow.contract_audits.log(
                    contract.id, ContractAuditAction.RENEWED, None,
                    {"auto": True, "old_end": str(old_end), "new_end": str(new_end),
                     "added_sessions": added})
                renewed_count += 1
                continue

            if contract.auto_renew and contract.renewal_objection:
                objections += 1
            uow.contracts.update(contract.id, {"status": ContractStatus.EXPIRED})
            uow.contract_audits.log(
                contract.id, ContractAuditAction.CANCELLED if False else ContractAuditAction.RENEWED
                if False else ContractAuditAction.APPROVED, None,
                {"expired": True, "end_date": str(contract.end_date)})
            expired_count += 1

        uow.commit()
        return {"expired_count": expired_count, "renewed_count": renewed_count,
                "completed_sessions": completed, "renewal_objections": objections}


@celery_app.task(name="notify_overdue_contract_payments")
def notify_overdue_contract_payments():
    from datetime import datetime, timezone

    from app.models.contract import ContractAuditAction, PaymentStatus
    from app.services.notification_service import notification_service
    from app.unit_of_work import UnitOfWork

    with UnitOfWork() as uow:
        rows = uow.contract_payments.get_overdue_payments()

        async def _notify_all():
            for row in rows:
                payment = row["payment"]
                msg = (f"قسط «{payment.label}» به مبلغ {payment.amount:,} برای قرارداد "
                       f"#{payment.contract_id} معوق شده است (سررسید: {payment.due_date}).")
                await notification_service.notify_contract_overdue(row["contract_user_id"], {
                    "contract_id": payment.contract_id, "payment_id": payment.id,
                    "amount": payment.amount, "message": msg})
                venue = uow.venues.get_by_id(row["contract_venue_id"])
                await notification_service.notify_contract_overdue_manager(
                    venue.manager_id if venue else None, {
                        "contract_id": payment.contract_id, "venue_id": row["contract_venue_id"],
                        "user_id": row["contract_user_id"], "message": msg})

        if rows:
            try:
                asyncio.run(_notify_all())
            except RuntimeError:  # pragma: no cover — داخل event loop سلری
                loop = asyncio.new_event_loop()
                loop.run_until_complete(_notify_all())
                loop.close()

        now = datetime.now(timezone.utc)
        for row in rows:
            uow.contract_payments.update(row["payment"].id, {
                "is_overdue": True, "overdue_notified_at": now})
            uow.contract_audits.log(row["payment"].contract_id,
                                    ContractAuditAction.OVERDUE_NOTIFIED, None,
                                    {"payment_id": row["payment"].id,
                                     "amount": row["payment"].amount,
                                     "due_date": str(row["payment"].due_date)})
            uow.contracts.update_payment_status(row["payment"].contract_id, PaymentStatus.OVERDUE)
        uow.commit()
        return {"overdue_count": len(rows)}


celery_app.conf.beat_schedule.update({
    "check-expired-contracts": {
        "task": "check_expired_contracts",
        "schedule": crontab(hour=2, minute=0),
    },
    "notify-overdue-contract-payments": {
        "task": "notify_overdue_contract_payments",
        "schedule": crontab(hour=3, minute=0),
    },
})