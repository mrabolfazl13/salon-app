#!/bin/bash
GW=$(ip route | grep default | awk '{print $3}')
echo "win-gw: $GW"
URL="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100"
echo "--- direct:"
curl -s -o /dev/null -w "%{http_code}\n" -m 8 "$URL"
echo "--- via proxies:"
for p in 7890 1080 8080 10809 2080 10810 3128 10808; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -m 4 -x "http://$GW:$p" "$URL")
  echo "proxy $p -> $code"
done
