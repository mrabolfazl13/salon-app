#!/usr/bin/env python3
"""ژنراتور جدول ممیزی صفحه‌به‌صفحه از خروجی harness (audit-artifacts).

نام فایل شات باید دقیقاً با قاعدهٔ harness یکی باشد (e2e/mobile-audit.spec.ts):
    `${role}__${route.replace(/\\W+/g, '_') || 'root'}__${viewport}.png`
نسخهٔ قبلی اینجا `route.strip('/').replace('/','_') or 'home'` می‌ساخت و یک `___`
اضافه داشت ⇒ `/` و `/manager-dashboard` با اینکه شات دارند، «❌» نشان داده می‌شدند.
در Python هم `\\w` یونیکد است، پس فهرست صریح ASCII می‌نویسیم تا با JS یکی بماند.
"""
import json
import re
from pathlib import Path

HERE = Path(__file__).parent
ART = HERE.parent.parent / 'audit-artifacts'
SHOTS = ART / 'shots'
REPORT = ART / 'audit-report-routes.json'
FINDINGS = ART / 'audit-findings-summary.json'
OUT = HERE / 'PAGE-BY-PAGE-AUDIT.md'

VP = '375x812'  # viewport اصلی بررسی
DATE = '۲۰۲۶-۱۰-۲۰'

# ترتیب دلخواه نمایش؛ هر ترکیبِ نقش+مسیری که در گزارش باشد اضافه می‌شود
ORDER = [
    ('guest', '/'), ('user', '/'), ('guest', '/search'), ('guest', '/venues'),
    ('user', '/venues/1'), ('guest', '/login'), ('guest', '/register'),
    ('user', '/dashboard'), ('manager', '/manager-dashboard'), ('user', '/bookings'),
    ('user', '/finance'), ('manager', '/finance'), ('manager', '/manager/pricing'),
    ('manager', '/manager/shifts'), ('manager', '/manager/contracts'),
    ('manager', '/manager/crm'), ('user', '/teams/1'), ('user', '/tournaments/2'),
    ('user', '/games/1'), ('super_admin', '/admin'), ('super_admin', '/coach'),
    ('user', '/profile'), ('manager', '/profile'),
]


def shot_base(role: str, route: str, vp: str) -> str:
    """قاعدهٔ نام‌گذاری harness — JS \\W == [^A-Za-z0-9_] (یونیکد نه)."""
    clean = re.sub(r'[^A-Za-z0-9_]+', '_', route) or 'root'
    return f'{role}__{clean}__{vp}'


def read_statuses() -> dict:
    """وضعیت‌های دستیِ ستون آخر را از فایل فعلی نگه می‌داریم (بازتولید نباید پاکشان کند)."""
    if not OUT.exists():
        return {}
    saved = {}
    for line in OUT.read_text(encoding='utf-8').splitlines():
        if not line.startswith('| `/'):
            continue
        cells = [c.strip() for c in line.strip().strip('|').split('|')]
        if len(cells) >= 7:
            route = cells[0].strip('`')
            saved.setdefault((route, cells[1]), cells[-1])
    return saved


def main():
    rows = []
    findings_by_rc: dict = {}
    if REPORT.exists():
        data = json.loads(REPORT.read_text(encoding='utf-8'))
        for r in data.get('rows', []):
            if str(r.get('viewport', '')).startswith(VP.split('x')[0]):
                rows.append(r)
    for f in json.loads(FINDINGS.read_text(encoding='utf-8')).get('findings', []) if FINDINGS.exists() else []:
        if str(f.get('viewport', '')).startswith(VP.split('x')[0]):
            findings_by_rc.setdefault((f['role'], f['route']), []).append(f)

    by_rc = {(r['role'], r['route']): r for r in rows}
    pairs = [(r['role'], r['route']) for r in rows]
    for p in ORDER:
        if p not in pairs:
            pairs.append(p)
    pairs.sort(key=lambda p: (ORDER.index(p) if p in ORDER else 999, p[1]))

    statuses = read_statuses()
    lines = [
        '# ممیزی صفحه‌به‌صفحه (Page-by-Page Visual Audit)',
        '',
        f'**تاریخ:** {DATE} | **Viewport:** {VP} | **مبنای سنجش:** WCAG 2.1 AA، اهداف لمس ۴۴px',
        '',
        '> این جدول را `page_table.py` از `audit-artifacts/audit-report-routes.json` و',
        '> اسکرین‌شات‌های harness می‌سازد. تصاویر در `frontend/audit-artifacts/shots/`',
        '> هستند و در git ignore شده‌اند؛ لینکها مسیر نسبی محلی را می‌دهند. ستون',
        '> «وضعیت» دستی پر می‌شود و بازتولید جدول آن را حفظ می‌کند. نقش‌های STAFF/COACH',
        '> در پروداکشن حساب ندارند (`users` فقط USER/VENUE_MANAGER/SUPER_ADMIN دارد)؛',
        '> صفحه‌هایشان با manager و super_admin ممیزی می‌شود چون گارد یکی است.',
        '',
        '| مسیر | نقش | شات | overflow | h1 | هدف<۴۴ | بی‌برچسب | یافته‌ها | وضعیت |',
        '|------|------|------|----------|-----|--------|----------|----------|--------|',
    ]

    for role, route in pairs:
        base = shot_base(role, route, VP)
        shot = f'[📸](../../audit-artifacts/shots/{base}.png)' if (SHOTS / f'{base}.png').exists() else '❌'
        row = by_rc.get((role, route))
        m = (row or {}).get('metrics') or {}
        overflow = f"{m.get('overflowX')}px" if m.get('overflowX', 0) > 1 else ('✅' if m else '—')
        h1 = ('✅' if m.get('h1') else '❌') if m else '—'
        small = m.get('buttonsWithMinHeightBelow44', '—') if m else '—'
        unlabeled = len(m.get('unlabeledButtons', [])) if m else '—'
        fs = findings_by_rc.get((role, route), [])
        kinds = sorted({f['kind'] for f in fs})
        fl = '،'.join(kinds) or '—'
        # وضعیت دستی بر خودکار مقدم است؛ وگرنه از شواهد همان ردیف ساخته می‌شود.
        status = statuses.get((route, role))
        manual = bool(status) and status[0] in '✅🔧⚠❌'
        if not manual:
            if not row:
                status = '—'
            elif row.get('incomplete'):
                status = '❌ BLOCKED'
            elif set(kinds) - {'request-failed', 'console-error', 'expected-http-error', 'section-loading-at-measure'}:
                status = '⚠️ REVIEW'
            elif {'request-failed', 'console-error'} & set(kinds):
                status = '✅ AUDITED (محیطی: Unsplash)' if 'section-loading-at-measure' not in kinds else '⚠️ ACCEPTED (بخش در حال بارگذاری)'
            elif 'section-loading-at-measure' in kinds:
                status = '⚠️ ACCEPTED (بخش در حال بارگذاری)'
            else:
                status = '✅ AUDITED'
        lines.append(f'| `{route}` | {role} | {shot} | {overflow} | {h1} | {small} | {unlabeled} | {fl} | {status} |')

    lines.extend([
        '',
        '## راهنمای بررسی',
        '',
        '| وضعیت | معنی |',
        '|--------|-------|',
        '| ✅ AUDITED | بررسی شد، مشکلی نیست |',
        '| 🔧 FIXED | مشکل یافت و رفع شد |',
        '| ⚠️ ACCEPTED | یافت شد و عامدانه پذیرفته شد (در BUG-TRACKER) |',
        '| ❌ BLOCKED | مشکل مسدودکننده (نیاز به بررسی بیشتر) |',
        '| ⏳ PENDING | هنوز بررسی نشده |',
        '',
        '## NATIVE-ONLY',
        '',
        'مواردی که فقط روی دستگاه واقعی قابل‌بررسی هستند:',
        '- اندازهٔ واقعی touch targets روی صفحه لمسی',
        '- Safe-area insets (notch)',
        '- رفتار keyboard appearance/dismissal',
        '- Tauri Android WebView rendering',
    ])

    OUT.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f'WROTE {OUT} ({len(pairs)} rows, {len(statuses)} statuses preserved)')


if __name__ == '__main__':
    main()
