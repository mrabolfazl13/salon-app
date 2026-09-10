#!/bin/bash
API=http://localhost:8000/api/v1
# wait for backend (daemon may be restarting)
for i in $(seq 1 40); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null)
  [ "$code" = "200" ] && break
  sleep 2
done
echo "health: $code"

T=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" \
  -d '{"phone":"09123456789","password":"Admin123!"}' | python3 -c "import sys,json;print(json.load(sys.stdin).get('access_token',''))")
echo "admin token: ${#T}"

echo "pending-managers:"
curl -s $API/admin/pending-managers -H "Authorization: Bearer $T"
echo ""

echo "users (first, check no hash leak):"
curl -s $API/admin/users -H "Authorization: Bearer $T" | head -c 300
echo ""
grep -c "hashed_password" <<< "$(curl -s $API/admin/users -H "Authorization: Bearer $T")" || echo "no leak (0)"

echo "containers:"
docker ps --format '{{.Names}} {{.Status}}' | grep futsal
