#!/usr/bin/env python3
"""Regenerate fonts.css: Vazirmatn woff2 from frontend/dist/assets, base64-embedded."""
from pathlib import Path
import base64
import glob

DIST = Path(__file__).resolve().parent.parent / 'dist' / 'assets'
WEIGHTS = [400, 500, 600, 700, 800]
RANGES = {
    'arabic': 'U+0600-06FF,U+FB8E-FBFF,U+060C-060C',
    'latin': 'U+0000-00FF,U+2000-206F',
}

parts = []
for weight in WEIGHTS:
    for subset, rng in RANGES.items():
        matches = glob.glob(str(DIST / f'vazirmatn-{subset}-{weight}-normal-*.woff2'))
        if not matches:
            raise SystemExit(f'missing woff2 for {subset}/{weight}; run `pnpm build` first')
        b64 = base64.b64encode(Path(matches[0]).read_bytes()).decode()
        parts.append(
            f'@font-face{{font-family:"Vazirmatn";font-style:normal;font-weight:{weight};'
            f'font-display:swap;src:url(data:font/woff2;base64,{b64}) format("woff2");'
            f'unicode-range:{rng}}}'
        )

out = Path(__file__).resolve().parent / 'fonts.css'
out.write_text('\n'.join(parts), encoding='utf-8')
print('fonts.css', out.stat().st_size, 'bytes')
