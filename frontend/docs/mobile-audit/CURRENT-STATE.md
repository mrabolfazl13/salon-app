# وضعیت فعلی پروژه (Current State)

**تاریخ:** ۲۰۲۶-۱۰-۱۹ | **شاخه:** `flutter-free-web-tauri`

---

## خلاصه اجرای ممیزی موبایل

این ممیزی با هدف بررسی خودکار تمام Routeها در اندازه‌های موبایل، جمع‌آوری شواهد قابل‌استناد از خطاهای Console، درخواست‌های ناموفق، سرریز افقی، هدف لمس کوچک، نبود h1، و اسکرین‌شات انجام شد.

### فازهای تکمیل‌شده

| فاز | موضوع | وضعیت | مستندات |
|-----|-------|--------|----------|
| ۱ | راه‌اندازی سندباکس + تریاژ یافته‌ها | ✅ COMPLETE | BUG-TRACKER F-01..F-15 |
| ۲ | رفع P1 — ناهم‌خوانی دسترسی UI↔API | ✅ COMPLETE | ماتریس نقش‌ها تأیید شد |
| ۳ | رفع P2 — axe-core violations | ✅ COMPLETE | ۴۰→۰ باریابی، ACCESSIBILITY-REPORT |
| ۴ | رفع P2 — لمسی ≥۴۴px، کنسول، focus ring | ✅ PARTIAL | F-27,F-28 مستند شد |
| ۵ | پروب کیبورد و focus trap | ✅ COMPLETE | keyboard-report.json |
| ۶ | گزارش عملکرد | ✅ COMPLETE | PERFORMANCE-REPORT.md |

### یافته‌های باز

| کد | اولویت | عنوان | وضعیت |
|----|--------|-------|--------|
| F-16..F-19 | P3 | یافته‌های بصری (overflow, alt, landmark, loading) | در انتظار VERIFIED |
| F-28 | P2 | حلقه تمرکز نامرئی روی MUI Button-as-link | DOCUMENTED (چارچوب) |
| F-29 | P2 | اهداف لمسی PersianDatePicker | FIXED (نیاز به تأیید دستگاه) |

### NATIVE-ONLY / BLOCKED

مواردی که بدون دستگاه فیزیکی قابل‌بررسی نیستند:
- Touch target اندازه واقعی روی صفحهٔ لمسی
- Safe-area insets (notch iPhone)
- VoiceOver/TalkBack screen reader
- Tauri Android WebView quirks (CORS, POST body proxy)

## ساختار مستندات تولیدشده

```
docs/mobile-audit/
├── BUG-TRACKER.md          # ردیاب یافته‌ها با کد F-xx
├── ACCESSIBILITY-REPORT.md # گزارش کامل دسترس‌پذیری WCAG 2.1 AA
├── PERFORMANCE-REPORT.md   # اعداد عملکرد از بیلد تحویلی
├── TEST-RESULTS.md         # نتایج vitest, ESLint, tsc, Playwright
├── PAGE-BY-PAGE-AUDIT.md   # (در انتظار تکمیل — ژنراتور آماده)
├── CURRENT-STATE.md        # این فایل
└── FINAL-REVIEW.md         # (در انتظار تکمیل — مرور نهایی A–G)
```

## گیت‌های رگرسیون

همه سبز:
- ✅ `npx tsc --noEmit` → exit 0
- ✅ `npx eslint src` → 0 errors, 201 warnings (pre-existing)
- ✅ `npx vitest run` → all pass (including 6 new contrast tests)
- ✅ `vite build --mode development` → built in ~45s
- ✅ Playwright mobile-audit harness → 8 passed

## اقدامات بعدی پیشنهادی

1. **تکمیل PAGE-BY-PAGE-AUDIT.md**: استفاده از ژنراتور `page_table.py` برای پر کردن وضعیت ۴۲ مسیر
2. **بررسی شات‌های `__p2.png`**: تأیید بصری صفحات second-screen
3. **اجرای backend pytest**: در محیط sandbox backend
4. **بررسی parity Tauri Windows/Android**: فقط config/permission review (بدون دستگاه)
5. **پاکسازی نهایی**: حذف فایل‌های scratch audit-artifacts/tmp-*.cjs
