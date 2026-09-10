#!/bin/bash
# Retest: unverified user cannot book; email OTP verify; then can book
set -u
API=http://localhost:8000/api/v1
PHONE=09125554433

# wait for backend (daemon may be restarting)
for i in $(seq 1 40); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null)
  [ "$code" = "200" ] && break
  sleep 2
done
echo "health: $code"

login_with_retry() {
  for i in 1 2 3; do
    R=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" \
      -d "{\"phone\":\"$1\",\"password\":\"$2\"}")
    T=$(echo "$R" | python3 -c "import sys,json;print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)
    [ -n "$T" ] && { echo "$T"; return; }
    sleep 3
  done
  echo "LOGIN FAILED: $R" >&2
  return 1
}

UT=$(login_with_retry $PHONE Test1234)
echo "user token: ${#UT}"

echo ""
echo "=== Booking WITHOUT verification (expect 403 with Persian msg) ==="
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
curl -s -X POST $API/bookings/ -H "Authorization: Bearer $UT" -H "Content-Type: application/json" -d "{\"slot_id\": $SLOT_ID}"; echo ""

echo ""
echo "=== Request email code ==="
REQ=$(curl -s -X POST $API/auth/verify/email/request -H "Content-Type: application/json" -d "{\"phone\":\"$PHONE\",\"email\":\"test@example.com\"}")
echo "$REQ"
DEV_CODE=$(echo "$REQ" | python3 -c "import sys,json;print(json.load(sys.stdin).get('dev_code',''))")
echo "dev code: $DEV_CODE"

echo ""
echo "=== Confirm code ==="
curl -s -X POST $API/auth/verify/email/confirm -H "Content-Type: application/json" -d "{\"phone\":\"$PHONE\",\"code\":\"$DEV_CODE\"}"; echo ""

echo ""
echo "=== Booking AFTER verification (expect pending booking JSON) ==="
curl -s -X POST $API/bookings/ -H "Authorization: Bearer $UT" -H "Content-Type: application/json" -d "{\"slot_id\": $SLOT_ID}"; echo ""

echo ""
echo "=== Check no hashed_password leak in login response ==="
curl -s -X POST $API/auth/login -H "Content-Type: application/json" -d "{\"phone\":\"$PHONE\",\"password\":\"Test1234\"}" | grep -c "hashed_password" || echo "no leak (0)"

echo ""
echo "=== Cleanup: deactivate debug user + remove his pending booking slot hold ==="
docker exec futsal_postgres psql -U futsal -d futsal_db -c "UPDATE users SET is_active=false, is_verified=false WHERE phone='$PHONE';"
# release the pending booking (user is now inactive; free slot + redis key)
docker exec futsal_redis redis-cli --scan --pattern "pending:booking:*" | while read k; do
  echo "$k"
done
echo "--- done ---"
