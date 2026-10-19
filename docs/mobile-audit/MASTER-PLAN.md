# MASTER PLAN — مأموریت ممیزی، بازآرایی و تضمین کیفیت UI/UX موبایل

**پروژه:** Salon App (`futsal-booking-system`)
**شاخه:** `flutter-free-web-tauri`
**شروع:** 2026-10-18
**مالکیت کلی:** Agent A (Lead Architect & Orchestrator)

---

## 0. دامنه و محدودیت‌های قطعی

| مورد | تصمیم |
|---|---|
| خروجی‌های محصول | Web + Tauri Windows + Tauri Android (Flutter حذف‌شده) |
| تست UI/UX | **فقط نسخهٔ Web در Playwright** (بدون گوشی فیزیکی، بدون انتظار برای USB Debugging) |
| تست Native/WebView | جداگانه علامت‌گذاری در ستون `NATIVE-ONLY` — ادعای تست‌شده ندارد |
| Backend | Sandbox محلی (SQLite یک‌بارمصرف + seed demo) برای همهٔ عملیات نوشتن؛ prod فقط read-only |
| زبان گزارش‌ها | فارسی، با اعداد و شواهد واقعی |

---

## 1. تیم نقش‌محور (اجرای مرحله‌ای در یک Agent، با تفکیک مالکیت فایل)

| نقش | محدودهٔ مالکیت فایل | خروجی |
|---|---|---|
| **A — Lead** | `docs/mobile-audit/**`، هماهنگی نهایی، `App.tsx` (فقط هماهنگ‌شده) | MASTER-PLAN، FINAL-REVIEW، تأیید نهایی |
| **B — UI/UX Audit** | صفحات `frontend/src/pages/**` | PAGE-BY-PAGE-AUDIT، رفع ایرادهای چیدمان |
| **C — Frontend Eng** | `frontend/src/components/**`، `hooks/**`، `services/**`، `store/**` | رفع باگ، کاهش تکرار، فرم‌ها |
| **D — QA & Automation** | `frontend/e2e/**`، `playwright.config.ts` | اسکریپت‌های تست، اسکرین‌شات، لاگ Console/Network |
| **E — Backend & Role Security** | فقط خواندن `backend/**` (+ اسکریپت sandbox جدا) | شواهد مجوز API، تست نشت نقش |
| **F — Performance** | گزارش + اصلاحات هدفمند در صفحات/سرویس‌ها | PERFORMANCE-REPORT |
| **G — Design System & A11y** | `frontend/src/theme/**`، `frontend/src/styles/**` | UI-UX-STANDARDS، ACCESSIBILITY-REPORT |
| **H — Build & Regression** | `.github/workflows/**` (فقط خواندن)، اجرای بیلدها | TEST-RESULTS بخش Build |

**قانون ضد تضاد:** فایل‌های مشترک (`App.tsx`، `theme/**`، `styles/**`، `playwright.config.ts`، `package.json`) در هر بازهٔ زمانی فقط توسط یک نقش تغییر می‌کنند و تغییر آن‌ها در Lead ثبت می‌شود.

---

## 2. فازها

### فاز ۰ — آماده‌سازی محیط (Sandbox)
1. `python scripts/seed_full_demo.py --reset --sqlite <sandbox.db>` → DB یک‌بارمصرف.
2. ساخت کاربر `coach` فقط در sandbox.
3. اجرای Backend: `uvicorn app.main:app --port 8000` با `DATABASE_URL` sandbox.
4. اجرای Frontend: vite dev روی 3001 با `VITE_PROXY_TARGET=http://localhost:8000` (از طریق `.env.development.local` — بدون دست‌زدن به فایل‌های موجود).
5. تأیید: `GET /api/v1/health` (یا endpoint سلامت واقعی) + بارگذاری صفحه در مرورگر.

### فاز ۱ — ماتریس و پیمایش خودکار (D)
- Playwright با ۶ viewport موبایل (320/360/375/390/430/600) × Portrait.
- Landscape برای صفحات ضروری.
- اسکرین‌شات قبل/بعد، ثبت Console Error و خطای Network، بررسی overflow افقی.

### فاز ۲ — ممیزی صفحه‌به‌صفحه (B + C)
- هر Route با نقش(های) مجاز باز می‌شود، عملیات اصلی و ناموفق تست می‌شود، نتیجه در PAGE-BY-PAGE-AUDIT و BUG-TRACKER ثبت می‌شود.

### فاز ۳ — امنیت نقش‌ها و API (E)
- تست مستقیم Endpoint با token هر نقش (خارج از UI).
- بررسی 400/401/403/404/409/422/429/500.

### فاز ۴ — Design System و A11y (G)
- یکپارچه‌سازی رنگ/فاصله/تایپوگرافی، لمس ≥44px، کنتراست، RTL، focus.

### فاز ۵ — Performance (F)
- اندازه‌گیری TTI/FCP، حجم باندل، درخواست تکراری، اسکرول لیست‌های بزرگ.

### فاز ۶ — Regression و Build (H)
- `pytest`، `tsc`، `vitest`، `vite build`، `tauri build` (Windows) و در صورت امکان APK.
- تست دوبارهٔ همهٔ صفحات اصلاح‌شده.

### فاز ۷ — گزارش نهایی (A)
- `FINAL-REVIEW.md` با بخش‌های A..G مطابق دستور مأموریت.

---

## 3. اولویت رفع

`P0` امنیت/داده → `P1` شکست عملیات اصلی → `P2` UI/UX و سرعت → `P3` ظاهری.

## 4. معیار پذیرش (خلاصهٔ قابل‌سنجش)

1. ۴۱ Route از کد استخراج و در ROUTE-INVENTORY ثبت شده ✅ (انجام شد)
2. ۵ نقش واقعی + حساب تست شناسایی/آماده شده
3. همهٔ صفحات اصلی در ۶ viewport موبایل بازرسی شده
4. P0 رفع، P1 رفع یا شفاف مستند
5. RTL/فونت فارسی/اعداد بررسی‌شده
6. فرم‌ها و عملیات اصلی با API واقعی تست‌شده
7. تست‌های خودکار مجدداً سبز
8. رگرسیون Web/Windows ثبت‌شده
9. تفکیک صریح «تست مرورگر» از `NATIVE-ONLY`
10. هر ادعای موفقیت با شاهد (اسکرین‌شات/لاگ/خروجی فرمان) پشتیبانی شود

## 5. وضعیت جاری فازها

| فاز | وضعیت |
|---|---|
| فاز ۰ (Sandbox) | IN_PROGRESS |
| فاز ۱ (ماتریس موبایل) | NOT_STARTED |
| فاز ۲ (صفحه‌به‌صفحه) | NOT_STARTED |
| فاز ۳ (امنیت/API) | NOT_STARTED |
| فاز ۴ (Design/A11y) | NOT_STARTED |
| فاز ۵ (Performance) | NOT_STARTED |
| فاز ۶ (Regression/Build) | NOT_STARTED |
| فاز ۷ (گزارش نهایی) | NOT_STARTED |
