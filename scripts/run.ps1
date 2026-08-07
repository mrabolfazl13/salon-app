# scripts/run.ps1
Write-Host "Starting Futsal Booking System..." -ForegroundColor Cyan
docker-compose up -d
Write-Host "Backend running at http://localhost:8000" -ForegroundColor Green
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Green
