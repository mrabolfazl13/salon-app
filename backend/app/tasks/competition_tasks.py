from app.tasks.worker import celery_app
from app.unit_of_work import UnitOfWork
from app.services.competition_service import CompetitionService
from celery.schedules import crontab

@celery_app.task(name="resolve_expired_competitions")
def resolve_expired_competitions():
    with UnitOfWork() as uow:
        resolved_count = CompetitionService.resolve_expired_competitions(uow)
        return {"resolved_count": resolved_count}

celery_app.conf.beat_schedule = {
    "resolve-competitions": {
        "task": "resolve_expired_competitions",
        "schedule": crontab(minute="*/30"),
    },
}
