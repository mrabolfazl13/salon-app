#!/bin/bash
# Automated database backup script with retention policy
# Usage: ./backup.sh [retention_days]

set -euo pipefail

RETENTION_DAYS=${1:-7}  # Default: keep backups for 7 days
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/futsal_db_${TIMESTAMP}.sql.gz"

# Database connection from environment (set in docker-compose)
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-futsal_db}"
DB_USER="${DB_USER:-futsal}"
PGPASSWORD="${DB_PASSWORD:-secret}" export PGPASSWORD

echo "📦 Starting database backup..."
echo "   Host: ${DB_HOST}:${DB_PORT}"
echo "   Database: ${DB_NAME}"
echo "   Backup file: ${BACKUP_FILE}"
echo "   Retention: ${RETENTION_DAYS} days"

# Create backup directory if not exists
mkdir -p "${BACKUP_DIR}"

# Perform backup with compression
pg_dump -h "${DB_HOST}" \
        -p "${DB_PORT}" \
        -U "${DB_USER}" \
        -d "${DB_NAME}" \
        --no-owner \
        --no-acl \
        --format=custom \
        | gzip > "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -sh "${BACKUP_FILE}" | cut -f1)
    echo "✅ Backup completed successfully (${BACKUP_SIZE})"
else
    echo "❌ Backup failed!"
    exit 1
fi

# Clean up old backups
echo "🧹 Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "futsal_db_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
REMAINING=$(find "${BACKUP_DIR}" -name "futsal_db_*.sql.gz" | wc -l)
echo "   Remaining backups: ${REMAINING}"

# Upload to remote storage if configured (optional)
if [ -n "${S3_BACKUP_BUCKET:-}" ]; then
    echo "☁️  Uploading to S3..."
    aws s3 cp "${BACKUP_FILE}" "s3://${S3_BACKUP_BUCKET}/$(basename ${BACKUP_FILE})"
fi

echo "✨ Backup process complete"
