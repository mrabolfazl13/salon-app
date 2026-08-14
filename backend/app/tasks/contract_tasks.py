from app.tasks.worker import celery_app
from celery.schedules import crontab

@celery_app.task(name="check_expired_contracts")
def check_expired_contracts():
    from app.unit_of_work import UnitOfWork
    with UnitOfWork() as uow:
        expired = uow.contracts.get_expired_contracts()
        for contract in expired:
            uow.contracts.update(contract.id, {"status": "expired"})
        uow.commit()
        return {"expired_count": len(expired)}

celery_app.conf.beat_schedule.update({
    "check-expired-contracts": {
        "task": "check_expired_contracts",
        "schedule": crontab(hour=2, minute=0),
    },
})
