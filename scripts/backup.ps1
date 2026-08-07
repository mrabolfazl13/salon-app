# scripts/backup.ps1
 = Get-Date -Format "yyyyMMdd_HHmmss"
 = "backup_.sql"
docker-compose exec -T postgres pg_dump -U futsal futsal_db > "backups/"
Write-Host "Backup created: " -ForegroundColor Green
