#!/bin/bash
URL="https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Futsal_Court.jpg/1280px-Futsal_Court.jpg"
echo "--- no UA:"
curl -s -o /dev/null -w "%{http_code}\n" -m 20 -A "" "$URL"
echo "--- browser UA:"
curl -s -o /dev/null -w "%{http_code}\n" -m 20 -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36" "$URL"
echo "--- custom app UA:"
curl -s -o /dev/null -w "%{http_code}\n" -m 20 -A "FutsalBookingApp/1.0 (demo seed data; contact: dev@example.com)" "$URL"
echo "--- body of 403 (browser UA):"
curl -s -m 20 -A "Mozilla/5.0" "$URL" | head -c 400
echo ""
echo "--- original (non-thumb):"
curl -s -o /dev/null -w "%{http_code}\n" -m 20 -A "Mozilla/5.0" "https://upload.wikimedia.org/wikipedia/commons/9/93/Futsal_Court.jpg"
