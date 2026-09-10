# -*- coding: utf-8 -*-
"""Download real gym/bodybuilding photos from Wikimedia Commons (rate-limit friendly)."""
import json, os, re, sys, time, urllib.request, urllib.parse, urllib.error

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"}
OUT = r"d:/Codes/Apps/Salon/futsal-booking-system/backend/app/static/venues"
os.makedirs(OUT, exist_ok=True)

SKIP_WORDS = ["diagram", "map", "hockey", "tennis", "boxing ring", "person", "selfie", "logo"]
TARGET = 24  # need >= 20 for the 20 gyms; buffer for failures


def get_json(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def candidates():
    queries = [
        "gym interior",
        "bodybuilding gym",
        "weight room",
        "fitness center interior",
        "weight training gym",
        "dumbbell rack gym",
        "treadmill gym",
        "gym equipment",
        "crossfit gym",
    ]
    seen = set()
    out = []
    for q in queries:
        enc = urllib.parse.quote(q)
        url = ("https://commons.wikimedia.org/w/api.php?action=query&generator=search"
               f"&gsrsearch={enc}&gsrnamespace=6&gsrlimit=15&prop=imageinfo"
               "&iiprop=url|mime|size&iiurlwidth=1200&format=json")
        try:
            d = get_json(url)
        except Exception as e:
            print(f"# {q}: {e}", flush=True)
            continue
        pages = (d.get("query") or {}).get("pages") or {}
        for p in pages.values():
            title = p.get("title", "")
            if title in seen:
                continue
            low = title.lower()
            if any(w in low for w in SKIP_WORDS):
                continue
            ii = (p.get("imageinfo") or [{}])[0]
            if ii.get("mime") != "image/jpeg" or ii.get("width", 0) < 900:
                continue
            tu = (ii.get("thumburl") or ii.get("url") or "").split("?")[0]
            if not tu.startswith("http"):
                continue
            seen.add(title)
            out.append((title, tu))
        if len(out) >= 40:
            break
    return out


def download(url, path):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=120) as r, open(path, "wb") as f:
        f.write(r.read())


def download_with_retry(url, path):
    delays = [20, 60, 120]
    for i, d in enumerate(delays + [0]):
        if d:
            print(f"  waiting {d}s ...", flush=True)
            time.sleep(d)
        try:
            download(url, path)
            return True
        except urllib.error.HTTPError as e:
            if e.code in (429, 503):
                print(f"  HTTP {e.code}, retry {i+1}", flush=True)
                continue
            print(f"  HTTP {e.code} (no retry)", flush=True)
            return False
        except Exception as e:
            print(f"  {e}, retry {i+1}", flush=True)
            continue
    return False


def main():
    cands = candidates()[:TARGET]
    print(f"downloading {len(cands)} images (12s between requests)", flush=True)

    temps = []
    for idx, (title, tu) in enumerate(cands, 1):
        tmp = os.path.join(OUT, f".tmp-gym-{idx:02d}.jpg")
        print(f"[{idx:02d}/{len(cands)}] {title}", flush=True)
        ok = download_with_retry(tu, tmp)
        if ok and os.path.getsize(tmp) > 30000:
            temps.append((tmp, title))
            print(f"    OK {os.path.getsize(tmp)}", flush=True)
        else:
            if os.path.exists(tmp):
                os.remove(tmp)
            print("    FAILED", flush=True)
        time.sleep(12)

    # clean old gym files and rename sequentially
    for f in os.listdir(OUT):
        if f.startswith("gym-"):
            os.remove(os.path.join(OUT, f))
    for i, (tmp, title) in enumerate(temps, 1):
        final = os.path.join(OUT, f"gym-{i:02d}.jpg")
        os.rename(tmp, final)
        print(f"FINAL gym-{i:02d}.jpg  <=  {title}")
    print(f"TOTAL: {len(temps)} images")


if __name__ == "__main__":
    main()
