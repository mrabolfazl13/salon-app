#!/bin/bash
# Test: manager approval by admin + user email verification before booking
set -u
cd /mnt/d/Codes/Apps/Salon/futsal-booking-system
API=http://localhost:8000/api/v1

echo "=== Restart backend ==="
docker compose restart backend 2>&1 | grep -v "level=warning"
for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null)
  [ "$code" = "200" ] && { echo "healthy after ${i}s"; break; }
  sleep 1
done

echo ""
echo "=== One-off: verify seeded accounts (existing data) ==="
docker exec futsal_postgres psql -U futsal -d futsal_db -c "UPDATE users SET is_verified = true WHERE role IN ('user','venue_manager','club_admin','super_admin');"

login() {
  curl -s -X POST $API/auth/login -H "Content-Type: application/json" \
    -d "{\"phone\":\"$1\",\"password\":\"$2\"}"
}

ADMIN_TOKEN=$(login 09123456789 Admin123! | python3 -c "import sys,json;print(json.load(sys.stdin).get('access_token',''))")
echo "admin token: ${#ADMIN_TOKEN}"

echo ""
echo "=== 1. Register NEW manager (should be pending admin approval) ==="
NEW_MGR=$(curl -s -X POST $API/auth/register -H "Content-Type: application/json" \
  -d '{"phone":"09129998877","full_name":"مدیر جدید تستی","password":"Test1234","role":"venue_manager"}')
echo "$NEW_MGR"

echo ""
echo "=== 2. New manager login (should be 403 - pending) ==="
login 09129998877 Test1234 | head -c 300; echo ""

echo ""
echo "=== 3. Admin pending-managers list ==="
PENDING=$(curl -s $API/admin/pending-managers -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$PENDING"
NEW_MGR_ID=$(echo "$PENDING" | python3 -c "
import sys,json
try:
    ps=json.load(sys.stdin)
    m=[p for p in ps if p['phone']=='09129998877']
    print(m[0]['id'] if m else '')
except Exception:
    print('')
")
echo "new manager id: $NEW_MGR_ID"

echo ""
echo "=== 4. Admin approves new manager ==="
curl -s -X POST $API/admin/users/$NEW_MGR_ID/approve -H "Authorization: Bearer $ADMIN_TOKEN"; echo ""

echo ""
echo "=== 5. New manager login (should work now) ==="
login 09129998877 Test1234 | head -c 200; echo ""

echo ""
echo "=== 6. Register NEW user ==="
NEW_USER=$(curl -s -X POST $API/auth/register -H "Content-Type: application/json" \
  -d '{"phone":"09127776655","full_name":"کاربر جدید تستی","password":"Test1234","role":"user"}')
echo "$NEW_USER"

echo ""
echo "=== 7. New user tries to book WITHOUT verification (expect 403) ==="
UT=$(login 09127776655 Test1234 | python3 -c "import sys,json;print(json.load(sys.stdin).get('access_token',''))")
# find any available slot (venue 36, tomorrow)
DATE=$(date -d "+1 day" +%F)
SLOT_ID=$(curl -sL "$API/slots/venue/36/available?slot_date=$DATE" | python3 -c "
import sys,json
try:
    s=json.load(sys.stdin)
    print(s[0]['id'] if s else '')
except Exception:
    print('')
")
echo "slot: $SLOT_ID"
if [ -n "$SLOT_ID" ]; then
  curl -s -X POST $API/bookings/ -H "Authorization: Bearer $UT" -H "Content-Type: application/json" -d "{\"slot_id\": $SLOT_ID}"; echo ""
fi

echo ""
echo "=== 8. Request email code (dev mode returns code) ==="
REQ=$(curl -s -X POST $API/auth/verify/email/request -H "Content-Type: application/json" \
  -d '{"phone":"09127776655","email":"test@example.com"}')
echo "$REQ"
DEV_CODE=$(echo "$REQ" | python3 -c "import sys,json;print(json.load(sys.stdin).get('dev_code',''))")
echo "dev code: $DEV_CODE"

echo ""
echo "=== 9. Confirm code ==="
curl -s -X POST $API/auth/verify/email/confirm -H "Content-Type: application/json" \
  -d "{\"phone\":\"09127776655\",\"code\":\"$DEV_CODE\"}"; echo ""

echo ""
echo "=== 10. New user books NOW (should succeed -> pending booking) ==="
if [ -n "$SLOT_ID" ]; then
  curl -s -X POST $API/bookings/ -H "Authorization: Bearer $UT" -H "Content-Type: application/json" -d "{\"slot_id\": $SLOT_ID}" | head -c 400; echo ""
fi

echo ""
echo "=== 11. Cleanup test accounts (deactivate) ==="
docker exec futsal_postgres psql -U futsal -d futsal_db -c "UPDATE users SET is_active=false, is_verified=false WHERE phone IN ('09129998877','09127776655');"
echo "--- done ---"
