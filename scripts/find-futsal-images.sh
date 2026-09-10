#!/bin/bash
# Search Wikimedia Commons for real futsal photos and print candidate URLs
for q in "futsal court" "futsal game" "futsal hall" "indoor soccer court" "futsal arena" "futsal match"; do
  enc=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$q")
  echo "=== $q ==="
  curl -s -m 15 "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=$enc&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=1200&format=json" \
  | python3 -c '
import json,sys
d=json.load(sys.stdin)
pages=(d.get("query") or {}).get("pages") or {}
for p in pages.values():
    ii=(p.get("imageinfo") or [{}])[0]
    if ii.get("mime")=="image/jpeg" and ii.get("width",0)>=900:
        print(p.get("title"), "|", ii.get("thumburl"))
'
done
