# scripts/stop.ps1
Write-Host "Stopping Futsal Booking System..." -ForegroundColor Cyan
docker-compose down
Write-Host "Services stopped." -ForegroundColor Green
