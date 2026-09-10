#!/bin/bash
# Download REAL futsal photos from Wikimedia Commons using exact API thumburls
OUT=/mnt/d/Codes/Apps/Salon/futsal-booking-system/backend/app/static/venues
rm -f "$OUT"/*.jpg
mkdir -p "$OUT"

# Collect candidate "title<TAB>thumburl" lines from several searches
python3 - <<'EOF'
import json, urllib.request, urllib.parse

queries = ["futsal court", "futsal game", "futsal hall", "futsal arena", "indoor soccer"]
seen = set()
out = []
for q in queries:
    enc = urllib.parse.quote(q)
    url = ("https://commons.wikimedia.org/w/api.php?action=query&generator=search"
           f"&gsrsearch={enc}&gsrnamespace=6&gsrlimit=15&prop=imageinfo"
           "&iiprop=url|mime|size&iiurlwidth=1200&format=json")
    try:
        with urllib.request.urlopen(url, timeout=20) as r:
            d = json.load(r)
    except Exception as e:
        print(f"# {q}: {e}")
        continue
    pages = (d.get("query") or {}).get("pages") or {}
    for p in pages.values():
        title = p.get("title", "")
        if title in seen:
            continue
        ii = (p.get("imageinfo") or [{}])[0]
        if ii.get("mime") != "image/jpeg" or ii.get("width", 0) < 900:
            continue
        tu = ii.get("thumburl") or ii.get("url") or ""
        if not tu.startswith("http"):
            continue
        tu = tu.split("?")[0]
        seen.add(title)
        out.append(f"{title}\t{tu}")
    if len(out) >= 24:
        break
print("\n".join(out[:24]))
EOF

echo "=== downloading ==="
i=0
while IFS=$'\t' read -r title url; do
  [ -z "$url" ] && continue
  i=$((i+1))
  name=$(printf "futsal-%02d.jpg" "$i")
  code=$(curl -sL -o "$OUT/$name" -w "%{http_code}" -m 60 "$url")
  size=$(stat -c%s "$OUT/$name" 2>/dev/null || echo 0)
  echo "$code $size $name  <=  $title"
done < <(python3 - <<'EOF'
import json, urllib.request, urllib.parse
queries = ["futsal court", "futsal game", "futsal hall", "futsal arena", "indoor soccer"]
seen = set()
out = []
for q in queries:
    enc = urllib.parse.quote(q)
    url = ("https://commons.wikimedia.org/w/api.php?action=query&generator=search"
           f"&gsrsearch={enc}&gsrnamespace=6&gsrlimit=15&prop=imageinfo"
           "&iiprop=url|mime|size&iiurlwidth=1200&format=json")
    try:
        with urllib.request.urlopen(url, timeout=20) as r:
            d = json.load(r)
    except Exception:
        continue
    pages = (d.get("query") or {}).get("pages") or {}
    for p in pages.values():
        title = p.get("title", "")
        if title in seen:
            continue
        ii = (p.get("imageinfo") or [{}])[0]
        if ii.get("mime") != "image/jpeg" or ii.get("width", 0) < 900:
            continue
        tu = (ii.get("thumburl") or ii.get("url") or "").split("?")[0]
        if not tu.startswith("http"):
            continue
        seen.add(title)
        out.append(f"{title}\t{tu}")
    if len(out) >= 24:
        break
print("\n".join(out[:24]))
EOF
)

echo "=== verify ==="
file "$OUT"/*.jpg 2>/dev/null
