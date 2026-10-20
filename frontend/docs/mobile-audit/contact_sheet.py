#!/usr/bin/env python3
"""شیت‌های مرور بصری: شات‌های ۳۷۵×۸۱۲ را سه‌تا‌سه‌تا کنار هم می‌چیند.

استفاده: python docs/mobile-audit/contact_sheet.py
خروجی: audit-artifacts/review/sheet-01.png … (برای Read کردن؛ داخل gitignore است)
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.stdout.reconfigure(encoding='utf-8')

ART = Path(__file__).parent.parent.parent / 'audit-artifacts'
SHOTS = ART / 'shots'
OUT = ART / 'review'
VP = '375x812'
SCALE_W = 500
PER_SHEET = 3

# (role, route) — همان فهرست جدول صفحه‌به‌صفحه
ROWS = [
    ('guest', '/'), ('user', '/'), ('guest', '/search'), ('guest', '/venues'),
    ('user', '/venues/1'), ('guest', '/login'), ('guest', '/register'),
    ('user', '/dashboard'), ('manager', '/manager-dashboard'), ('user', '/bookings'),
    ('user', '/finance'), ('manager', '/finance'), ('manager', '/manager/pricing'),
    ('manager', '/manager/shifts'), ('manager', '/manager/contracts'),
    ('manager', '/manager/crm'), ('user', '/teams/1'), ('user', '/tournaments/2'),
    ('user', '/games/1'), ('super_admin', '/admin'), ('super_admin', '/coach'),
    ('user', '/profile'), ('manager', '/profile'),
]


def base(role: str, route: str) -> str:
    import re
    return f'{role}__{re.sub(r"[^A-Za-z0-9_]+", "_", route) or "root"}__{VP}'


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for f in OUT.glob('sheet-*.png'):
        f.unlink()
    items = []
    for role, route in ROWS:
        p = SHOTS / f'{base(role, route)}.png'
        items.append((f'{role} {route}', p))
    sheets = []
    for i in range(0, len(items), PER_SHEET):
        chunk = items[i:i + PER_SHEET]
        h = int(SCALE_W * 812 / 375) + 34
        sheet = Image.new('RGB', (SCALE_W * len(chunk) + 8 * (len(chunk) + 1), h), (245, 245, 245))
        d = ImageDraw.Draw(sheet)
        for j, (label, path) in enumerate(chunk):
            x = 8 + j * (SCALE_W + 8)
            d.text((x + 2, 4), label, fill=(20, 20, 20))
            if path.exists():
                im = Image.open(path).convert('RGB')
                im = im.resize((SCALE_W, int(SCALE_W * im.height / im.width)))
                sheet.paste(im, (x, 30))
            else:
                d.rectangle([x, 30, x + SCALE_W, 30 + h], outline=(200, 0, 0))
                d.text((x + 6, 40), 'MISSING', fill=(200, 0, 0))
        name = OUT / f'sheet-{i // PER_SHEET + 1:02d}.png'
        sheet.save(name)
        sheets.append(name)
    print(f'{len(sheets)} sheets, {len(items)} rows')
    for s in sheets:
        print(s, s.stat().st_size // 1024, 'KB')


if __name__ == '__main__':
    main()
