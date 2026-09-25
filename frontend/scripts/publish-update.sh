#!/usr/bin/env bash
# Publish a new Android APK version for the in-app updater.
# Usage: ./scripts/publish-update.sh <version> [note ...]
# Example: ./scripts/publish-update.sh 0.2.0 "بروزرسانی خودکار اضافه شد" "باگ‌های کوچک رفع شد"
set -euo pipefail

VERSION="${1:?usage: publish-update.sh <version> [notes...]}"
shift
NOTES=("$@")
[ ${#NOTES[@]} -gt 0 ] || NOTES=("بهبودهای عمومی")

SERVER="salonapp"
REMOTE_DIR="updates"
APK_NAME="app-arm64-release-${VERSION}.apk"
DOMAIN="http://2.189.255.225"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_APK="${APK_PATH:-$REPO_ROOT/src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk}"
[ -f "$SRC_APK" ] || { echo "APK not found: $SRC_APK (set APK_PATH to override)"; exit 1; }

SIZE=$(stat -c %s "$SRC_APK")
PUB_DATE=$(date -u +%Y-%m-%d)

TMP_JSON="$(mktemp)"
OUT="$TMP_JSON" node -e '
const fs = require("fs");
const [version, pubDate, size, apkPath, ...notes] = process.argv.slice(1);
const manifest = { version, notes, pub_date: pubDate, force: false, min_supported: "0.0.0", apk: apkPath, size: Number(size) };
fs.writeFileSync(process.env.OUT, JSON.stringify(manifest, null, 2) + "\n");
' "$VERSION" "$PUB_DATE" "$SIZE" "$DOMAIN/$REMOTE_DIR/$APK_NAME" "${NOTES[@]}"

echo "== uploading $SRC_APK ($SIZE bytes) as $APK_NAME"
scp -o BatchMode=yes "$SRC_APK" "$SERVER:$REMOTE_DIR/$APK_NAME"
scp -o BatchMode=yes "$TMP_JSON" "$SERVER:$REMOTE_DIR/latest.json"
rm -f "$TMP_JSON"

echo "== verifying"
ssh -o BatchMode=yes "$SERVER" "cat ~/$REMOTE_DIR/latest.json"
curl -sf "$DOMAIN/updates/latest.json?t=$(date +%s)" | head -c 400; echo
curl -sI -H 'Range: bytes=0-99' "$DOMAIN/updates/$APK_NAME" | sed -n '1p;/Content-Range/p;/Accept-Ranges/p'
echo "Published v$VERSION"
