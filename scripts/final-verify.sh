#!/bin/bash
# Final end-to-end verification of the futsal stack in WSL
set -u
cd /mnt/d/Codes/Apps/Salon/futsal-booking-system

echo "=== 1. Restarting backend (to load updated storage_service) ==="
docker compose restart backend
echo ""

echo "=== 2. Waiting for backend health ==="
for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null)
  if [ "$code" = "200" ]; then echo "healthy after ${i}s"; break; fi
  sleep 1
done
echo "health: $code"
echo ""

echo "=== 3. Venues endpoint (trailing slash, no auth needed for GET list) ==="
curl -s http://localhost:8000/api/v1/venues/ -o /tmp/venues.json -w "http:%{http_code} size:%{size_download}\n"
python3 - <<'EOF'
import json
try:
    data = json.load(open("/tmp/venues.json"))
    print(f"venues count: {len(data)}")
    for v in data[:3]:
        imgs = v.get("images") or []
        if isinstance(imgs, str):
            try: imgs = json.loads(imgs)
            except Exception: imgs = [imgs]
        print(f"- {v.get('name')} | {v.get('address')} | phone={v.get('phone')} | images={len(imgs)}")
except Exception as e:
    print("parse error:", e)
EOF
echo ""

echo "=== 4. Login as manager and upload a test image ==="
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login -H "Content-Type: application/json" \
  -d '{"phone":"09126412345","password":"Manager123!"}' | python3 -c "import sys,json;print(json.load(sys.stdin).get('access_token',''))")
echo "token len: ${#TOKEN}"

# make a tiny png
python3 -c "
import base64
png = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==')
open('/tmp/test.png','wb').write(png)
"

UPLOAD=$(curl -s -X POST http://localhost:8000/api/v1/upload/images -H "Authorization: Bearer $TOKEN" -F "files=@/tmp/test.png")
echo "upload resp: $UPLOAD"
IMG_URL=$(echo "$UPLOAD" | python3 -c "import sys,json;print(json.load(sys.stdin)['urls'][0])" 2>/dev/null)
echo "img url: $IMG_URL"

if [ -n "$IMG_URL" ]; then
  code=$(curl -s -o /dev/null -w "%{http_code}" "$IMG_URL")
  echo "minio fetch: $code"
fi
echo ""
echo "=== DONE ==="
