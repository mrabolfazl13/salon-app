#!/usr/bin/env bash
# Rebuild a Persian deck: fonts.css -> <src>.full.html -> <out>.pdf
# Usage: ./build.sh [src-basename=deck] [out-basename=pitch-deck]
# Needs: pnpm build output in frontend/dist (Vazirmatn woff2), Edge, python.
set -euo pipefail
cd "$(dirname "$0")"

SRC="${1:-deck}"
OUT="${2:-pitch-deck}"
EDGE="${EDGE:-C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe}"
[ -f "$EDGE" ] || EDGE="C:/Program Files/Microsoft/Edge/Application/msedge.exe"

if [ ! -s fonts.css ] || [ ! -d ../dist/assets ]; then
  echo "fonts.css missing or no dist build; regenerating fonts.css"
  python build-fonts.py
fi

python - <<PY
from pathlib import Path
html = Path('${SRC}.html').read_text(encoding='utf-8')
out = (html.replace('/*__FONTS__*/', Path('fonts.css').read_text(encoding='utf-8'))
           .replace('/*__CSS__*/',    Path('deck.css').read_text(encoding='utf-8')))
Path('${SRC}.full.html').write_text(out, encoding='utf-8')
print('${SRC}.full.html', len(out.encode('utf-8')), 'bytes')
PY

# Edge requires a Windows-style --print-to-pdf path and a three-slash file URL.
WIN="$(cygpath -w "$PWD/${OUT}.pdf")"
URL="file:///$(cygpath -w "$PWD/${SRC}.full.html" | sed 's|\\|/|g')"
rm -f "${OUT}.pdf"

"$EDGE" --headless=new --disable-gpu \
  --user-data-dir="$HOME/deploy-tmp/edge-profile-pitch" \
  --no-pdf-header-footer --virtual-time-budget=30000 \
  --run-all-compositor-stages-before-draw \
  --print-to-pdf="$WIN" "$URL" 2>/dev/null

ls -la "${OUT}.pdf"
