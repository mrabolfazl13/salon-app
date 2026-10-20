# وضعیت فعلی پروژه (Current State)

**تاریخ:** ۲۰۲۶-۱۰-۲۰ | **شاخه:** `flutter-free-web-tauri` | **آخرین کامیت مبنای ممیزی:** `dc4ae7e`

---

## ۱. خلاصه

ممیزی موبایل‌محور کل Routeها (۶ نقش × ۳۲۰/۳۷۵px) تمام شد: **۱۵۲ ردیف، صفر ردیف ناتمام، صفر timeout، صفر سرریز افقی**. همهٔ یافته‌های P1 دسترسی و axe بسته شده‌اند. در این دور، مرور بصری شیت‌های ۰۲–۰۸ سه ایراد واقعی دیگر را نشان داد که رفع شدند (F-40…F-42) و یک مورد (`/manager/crm`) با شات سفید باز مانده است (F-43).

| گیت | نتیجهٔ این دور |
|------|----------------|
| `tsc --noEmit` | ✅ exit 0 |
| `eslint src` | ✅ 0 errors / 203 warnings (از قبل) |
| `vitest run` | ✅ 203/203 در ۲۴ فایل |
| `vite build` | ✅ ۱m ۳s |
| Playwright سنگین manager | ✅ ۵ passed / ۱ skipped (۶٫۵m) — پس از ROUTE_FILTER |
| API `bookings/pending/my` | ✅ 200 `[]` (پس از fail-open بدون Redis) |

## ۲. یافته‌های باز

| کد | اولویت | موضوع | وضعیت |
|----|--------|-------|--------|
| F-43 | P2 | شات سفید `/manager/crm` در سندباکس با وجود DOM کامل | OPEN — نیازمند شات تأییدی در CI/دستگاه |
| X1 | P2 | rate-limit پروداکشن در E2E | وابسته به کاربر |
| X2 | P2 | اعتبارنامهٔ Firebase/FCM | وابسته به کاربر |
| X3 | P2 | تأیید `KEYSTORE_*` در GitHub Secrets | وابسته به CI/tag |
| X4 | P2 | قرارداد SMS/درگاه پرداخت | وابسته به کاربر |
| X5 | P3 | حذف APKهای ۸۹MB از تاریخچهٔ git | بازگشت‌ناپذیر — تصمیم کاربر |
| X7 | P3 | دادهٔ ۱۲ماهه برای ML قیمت | ذاتی زمان‌بر |
| X8 | P2 | اعداد بازاریابی هوم‌پیج بدون endpoint | تصمیم محصول |
| X9 | P2 | تصمیم trigger ابری «Workers Builds: salon-app» | تصمیم کاربر |

## ۳. محیط

- بک‌اند سندباکس: uvicorn روی `127.0.0.1:8000` از `backend/` با venv ریشهٔ ریپو؛ PG18 با pgserver روی ۵۴۳۲؛ **Redis نیست** (pub/sub و فهرست رزروهای معلق fail-open شده‌اند).
- فرانت: Vite روی `:3001` (strictPort).
- محدودیت میزبان: ۸GB RAM ⇒ تست‌های مرورگری تک‌پروسه‌ای و کوتاه.

## ۴. مستندات مرتبط

- `docs/mobile-audit/BUG-TRACKER.md` — F-01…F-44
- `docs/mobile-audit/PAGE-BY-PAGE-AUDIT.md` — ۷۶ ردیف نقش×مسیر
- `docs/mobile-audit/CURRENT-STATE.md` — خلاصهٔ اجرایی ممیزی
- `docs/historical-task-audit.md` / `docs/remaining-tasks.md` / `docs/known-limitations.md`
- `docs/test-report.md` / `docs/build-report.md`
