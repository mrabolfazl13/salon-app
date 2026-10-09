"""Automated database backup task."""
import subprocess
import logging
from datetime import datetime, timezone
from app.tasks.worker import celery_app
from app.config import settings

logger = logging.getLogger(__name__)


@celery_app.task(bind=True)
def perform_database_backup(self):
    """Trigger automated database backup.
    
    Runs daily at 2 AM. Backs up PostgreSQL database and stores in /backups.
    Old backups are automatically cleaned based on RETENTION_DAYS setting.
    """
    logger.info("Starting automated database backup...")
    
    try:
        # Call backup script
        result = subprocess.run(
            ["/bin/bash", "/app/deploy/backup.sh", "7"],  # Keep 7 days
            capture_output=True,
            text=True,
            timeout=3600,  # 1 hour timeout
            env={
                **os.environ,
                "DB_HOST": "postgres",
                "DB_PORT": "5432",
                "DB_NAME": "futsal_db",
                "DB_USER": "futsal",
                "DB_PASSWORD": settings.DATABASE_URL.split("@")[0].split("//")[1].split(":")[1],
            }
        )
        
        if result.returncode == 0:
            logger.info(f"Backup completed: {result.stdout}")
            return {"success": True, "output": result.stdout}
        else:
            logger.error(f"Backup failed: {result.stderr}")
            raise Exception(f"Backup script failed: {result.stderr}")
            
    except subprocess.TimeoutExpired:
        logger.error("Backup timed out after 1 hour")
        raise
    except Exception as e:
        logger.error(f"Backup failed with error: {e}", exc_info=True)
        raise
