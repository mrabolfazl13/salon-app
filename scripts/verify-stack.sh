#!/bin/bash
echo "=== 1) venues list (first venue):"
curl -s http://localhost:8000/api/v1/venues | python3 -c "
import json,sys
d=json.load(sys.stdin)
print('total venues:', len(d))
v=d[0]
print('name:', v['name'])
print('address:', v['address'])
print('phone:', v['phone'])
print('price:', v.get('price'))
print('amenities:', v.get('amenities'))
print('images:', v.get('images'))
print('is_verified:', v.get('is_verified'))
print('manager:', (v.get('manager') or {}).get('full_name'))
"
echo ""
echo "=== 2) static image served:"
curl -s -o /dev/null -w "%{http_code} %{size_download} bytes\n" http://localhost:8000/static/venues/futsal-01.jpg
echo ""
echo "=== 3) login as manager + upload to MinIO:"
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"09126412345","password":"Manager123!"}' | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('access_token') or d.get('token') or '')")
echo "token: ${TOKEN:0:25}..."
# make a tiny test png (1x1 red pixel)
python3 -c "
import base64
png = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==')
open('/tmp/test-upload.png','wb').write(png)
"
curl -s -X POST http://localhost:8000/api/v1/upload/images \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@/tmp/test-upload.png" | head -c 300
echo ""
echo ""
echo "=== 4) fetch uploaded object from MinIO (public URL above):"
URL=$(curl -s -X POST http://localhost:8000/api/v1/upload/images \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@/tmp/test-upload.png" | python3 -c "import json,sys; print(json.load(sys.stdin)['urls'][0])")
echo "url: $URL"
curl -s -o /dev/null -w "%{http_code} %{size_download} bytes\n" "$URL"
