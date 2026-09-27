#!/usr/bin/env bash
# Rebuild the Persian pitch deck: fonts.css -> deck.full.html -> pitch-deck.pdf
# Needs: pnpm build output in frontend/dist (Vazirmatn woff2), Edge, python.
set -euo pipefail
cd "$(dirname "$0")"

EDGE="${EDGE:-C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe}"
[ -f "$EDGE" ] || EDGE="C:/Program Files/Microsoft/Edge/Application/msedge.exe"

python build-fonts.py

python - <<'PY'
from pathlib import Path
html = Path('deck.html').read_text(encoding='utf-8')
out = (html.replace('/*__FONTS__*/', Path('fonts.css').read_text(encoding='utf-8'))
           .replace('/*__CSS__*/',    Path('deck.css').read_text(encoding='utf-8')))
Path('deck.full.html').write_text(out, encoding='utf-8')
print('deck.full.html', len(out.encode('utf-8')), 'bytes')
PY

# Edge requires a Windows-style --print-to-pdf path and a three-slash file URL.
WIN="$(cygpath -w "$PWD/pitch-deck.pdf")"
URL="file:///$(cygpath -w "$PWD/deck.full.html" | sed 's|\\|/|g')"
rm -f pitch-deck.pdf

"$EDGE" --headless=new --disable-gpu \
  --user-data-dir="$HOME/deploy-tmp/edge-profile-pitch" \
  --no-pdf-header-footer --virtual-time-budget=30000 \
  --run-all-compositor-stages-before-draw \
  --print-to-pdf="$WIN" "$URL" 2>/dev/null

ls -la pitch-deck.pdf
