#!/bin/bash
cd /mnt/d/Codes/Apps/Salon/futsal-booking-system
docker compose up -d backend 2>&1 | grep -v "level=warning"
for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null)
  [ "$code" = "200" ] && { echo "healthy after ${i}s"; break; }
  sleep 1
done
bash /mnt/d/Codes/Apps/Salon/futsal-booking-system/scripts/cors-check.sh
