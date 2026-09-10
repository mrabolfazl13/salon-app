#!/bin/bash
# CORS diagnostic: check which origins get the access-control-allow-origin header
for o in 'http://localhost:3000' 'http://localhost:3001' 'http://localhost:5173' 'http://127.0.0.1:3000' 'http://127.0.0.1:5173' 'http://tauri.localhost' 'tauri://localhost' 'http://192.168.1.100:3000'; do
  hdr=$(curl -s -D - -o /dev/null -X OPTIONS http://localhost:8000/api/v1/venues/ \
    -H "Origin: $o" -H "Access-Control-Request-Method: GET" | tr -d '\r' | grep -i 'access-control-allow-origin' || true)
  if [ -n "$hdr" ]; then
    echo "ALLOWED  | $o"
  else
    echo "BLOCKED  | $o"
  fi
done
