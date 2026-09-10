#!/bin/bash
# E2E test: pending booking flow (Redis -> manager confirm/reject -> DB)
set -u
cd /mnt/d/Codes/Apps/Salon/futsal-booking-system

API=http://localhost:8000/api/v1

echo "=== Restart backend + celery (new code) ==="
docker compose restart backend celery 2>&1 | grep -v "level=warning"
for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null)
  [ "$code" = "200" ] && { echo "backend healthy after ${i}s"; break; }
  sleep 1
done

login() {
  curl -s -X POST $API/auth/login -H "Content-Type: application/json" \
    -d "{\"phone\":\"$1\",\"password\":\"$2\"}" | python3 -c "import sys,json;print(json.load(sys.stdin).get('access_token',''))"
}

USER_TOKEN=$(login 09021112233 123456)
MGMT_TOKEN=$(login 09126412345 Manager123!)
echo "user token: ${#USER_TOKEN} chars | manager token: ${#MGMT_TOKEN} chars"

# manager's venue
VENUE_ID=$(curl -sL $API/venues/my-venues -H "Authorization: Bearer $MGMT_TOKEN" | python3 -c "import sys,json;print(json.load(sys.stdin)[0]['id'])")
echo "manager venue_id: $VENUE_ID"

# find an available slot (scan next 5 days)
SLOT_ID=""
for d in 1 2 3 4 5; do
  DATE=$(date -d "+$d day" +%F)
  SLOT_ID=$(curl -s "$API/slots/venue/$VENUE_ID/available?slot_date=$DATE" | python3 -c "
import sys,json
try:
    s=json.load(sys.stdin)
    print(s[0]['id'] if s else '')
except Exception:
    print('')
")
  [ -n "$SLOT_ID" ] && { echo "found available slot $SLOT_ID on $DATE"; break; }
done
[ -z "$SLOT_ID" ] && { echo "NO AVAILABLE SLOT FOUND"; exit 1; }

echo ""
echo "=== 1. USER creates booking (should be PENDING in Redis, not DB) ==="
CREATE=$(curl -s -X POST $API/bookings/ -H "Authorization: Bearer $USER_TOKEN" -H "Content-Type: application/json" -d "{\"slot_id\": $SLOT_ID}")
echo "$CREATE"
PID=$(echo "$CREATE" | python3 -c "import sys,json;print(json.load(sys.stdin).get('id',''))")
echo "pending id: $PID"

echo ""
echo "=== 2. User pending list ==="
curl -s $API/bookings/pending/my -H "Authorization: Bearer $USER_TOKEN" | python3 -m json.tool

echo ""
echo "=== 3. Manager pending list for venue $VENUE_ID ==="
curl -s $API/bookings/venue/$VENUE_ID/pending -H "Authorization: Bearer $MGMT_TOKEN" | python3 -m json.tool

echo ""
echo "=== 4. Second booking for REJECT path ==="
SLOT2_ID=""
for d in 1 2 3 4 5 6 7; do
  DATE=$(date -d "+$d day" +%F)
  SLOT2_ID=$(curl -s "$API/slots/venue/$VENUE_ID/available?slot_date=$DATE" | python3 -c "
import sys,json
try:
    s=json.load(sys.stdin)
    print(s[0]['id'] if s else '')
except Exception:
    print('')
")
  [ -n "$SLOT2_ID" ] && [ "$SLOT2_ID" != "$SLOT_ID" ] && { echo "second slot $SLOT2_ID on $DATE"; break; }
done
PID2=""
if [ -n "$SLOT2_ID" ]; then
  CREATE2=$(curl -s -X POST $API/bookings/ -H "Authorization: Bearer $USER_TOKEN" -H "Content-Type: application/json" -d "{\"slot_id\": $SLOT2_ID}")
  PID2=$(echo "$CREATE2" | python3 -c "import sys,json;print(json.load(sys.stdin).get('id',''))")
  echo "second pending id: $PID2"
fi

echo ""
echo "=== 5. Manager CONFIRMS first pending -> should land in DB ==="
CONFIRM=$(curl -s -X POST $API/bookings/pending/$PID/confirm -H "Authorization: Bearer $MGMT_TOKEN")
echo "$CONFIRM"

echo ""
echo "=== 6. Manager REJECTS second pending -> slot should be free again ==="
if [ -n "$PID2" ]; then
  REJECT=$(curl -s -X POST $API/bookings/pending/$PID2/reject -H "Authorization: Bearer $MGMT_TOKEN")
  echo "$REJECT"
fi

echo ""
echo "=== 7. User's DB bookings (confirmed one should appear) ==="
curl -s $API/bookings/ -H "Authorization: Bearer $USER_TOKEN" | python3 -c "
import sys,json
bs=json.load(sys.stdin)
print(f'db bookings: {len(bs)}')
for b in bs[:5]:
    print(f\"- id={b['id']} slot={b['slot_id']} status={b['status']} venue={b.get('venue_name')} date={b.get('slot_date')}\")
"

echo ""
echo "=== 8. User pending list after confirm/reject (should be empty) ==="
curl -s $API/bookings/pending/my -H "Authorization: Bearer $USER_TOKEN"

echo ""
echo "=== 9. Redis state ==="
docker exec futsal_redis redis-cli --scan --pattern 'pending:*' | head -20
echo "--- done ---"
