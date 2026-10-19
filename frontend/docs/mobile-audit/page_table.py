#!/usr/bin/env python3
"""ژنراتور جدول ممیزی صفحه‌به‌صفحه از اسکرین‌شات‌های harness."""
import os, json, sys
from pathlib import Path

ART = Path(__file__).parent.parent.parent / 'audit-artifacts' / 'shots'
OUT = Path(__file__).parent / 'PAGE-BY-PAGE-AUDIT.md'

# مسیرهای اصلی استخراج‌شده از App.tsx
ROUTES = [
    ('/', 'guest'), ('/search', 'user'), ('/favorites', 'user'),
    ('/venues', 'guest'), ('/venues/1', 'user'), ('/login', 'guest'),
    ('/register', 'guest'), ('/bookings', 'user'), ('/bookings/1', 'user'),
    ('/dashboard', 'user'), ('/manager-dashboard', 'manager'),
    ('/finance', 'manager'), ('/manager/shifts', 'manager'),
    ('/manager/contracts', 'manager'), ('/manager/crm', 'manager'),
    ('/teams/1', 'user'), ('/tournaments/2', 'user'), ('/games/1', 'user'),
]

VP = '375x812'  # viewport اصلی برای بررسی

def shot_exists(role: str, route: str, vp: str, suffix='') -> bool:
    """بررسی وجود فایل شات."""
    route_clean = route.strip('/').replace('/', '_') or 'home'
    name = f'{role}___{route_clean}__{vp}{suffix}.png'
    return (ART / name).exists()

def main():
    lines = [
        '# ممیزی صفحه‌به‌صفحه (Page-by-Page Visual Audit)',
        '',
        '**تاریخ:** ۲۰۲۶-۱۰-۱۹ | **Viewport اصلی:** ۳۷۵×۸۱۲ (iPhone X)',
        '',
        '> این جدول توسط `page_table.py` از روی اسکرین‌شات‌های harness تولید شده.',
        '> ستون «وضعیت» باید پس از بررسی بصری پر شود.',
        '',
        '| مسیر | نقش | شات اصلی | شات دوم | overflow | h1 | وضعیت |',
        '|------|------|-----------|---------|----------|-----|--------|',
    ]

    for route, role in ROUTES:
        route_clean = route.strip('/').replace('/', '_') or 'home'
        has_p1 = shot_exists(role, route_clean, VP)
        has_p2 = shot_exists(role, route_clean, VP, '__p2')

        p1_link = f'[📸](shots/{role}___{route_clean}__{VP}.png)' if has_p1 else '❌'
        p2_link = f'[📸](shots/{role}___{route_clean}__{VP}__p2.png)' if has_p2 else '—'

        # خواندن متریک از audit-report-routes.json اگر موجود باشد
        overflow = '؟'
        h1 = '؟'
        metrics_file = ART.parent / 'audit-report-routes.json'
        if metrics_file.exists():
            try:
                data = json.loads(metrics_file.read_text(encoding='utf-8'))
                for row in data.get('rows', []):
                    if row.get('role') == role and row.get('route') == route and row.get('viewport', '').startswith('375'):
                        m = row.get('metrics', {})
                        overflow = f"{m.get('overflowX', '?')}px" if m.get('overflowX', 0) > 1 else '✅'
                        h1_count = len(m.get('h1', []))
                        h1 = '✅' if h1_count > 0 else '❌'
                        break
            except Exception:
                pass

        status = '⏳ PENDING'
        lines.append(f'| `{route}` | {role} | {p1_link} | {p2_link} | {overflow} | {h1} | {status} |')

    lines.extend([
        '',
        '## راهنمای بررسی',
        '',
        '| وضعیت | معنی |',
        '|--------|-------|',
        '| ✅ AUDITED | بررسی شد، مشکلی نیست |',
        '| 🔧 FIXED | مشکل یافت و رفع شد |',
        '| ❌ BLOCKED | مشکل مسدودکننده (نیاز به بررسی بیشتر) |',
        '| ⏳ PENDING | هنوز بررسی نشده |',
        '',
        '## NATIVE-ONLY',
        '',
        'مواردی که فقط روی دستگاه واقعی قابل‌بررسی هستند:',
        '- اندازهٔ واقعی touch targets روی صفحه لمسی',
        '- Safe-area insets (notch iPhone)',
        '- رفتار keyboard appearance/dismissal',
        '- Tauri Android WebView rendering',
    ])

    OUT.write_text('\n'.join(lines), encoding='utf-8')
    print(f'WROTE {OUT} ({len(ROUTES)} rows)')

if __name__ == '__main__':
    main()
