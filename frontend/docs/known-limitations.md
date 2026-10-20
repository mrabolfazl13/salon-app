# محدودیت‌های شناخته‌شده (Known Limitations)

**به‌روز شده:** ۲۰۲۶-۱۰-۲۰ | **شاخه:** `flutter-free-web-tauri`

این فایل فقط محدودیت‌هایی را ثبت می‌کند که با کد/آزمون محلی قابل رفع نیستند. وضعیت تسک‌های باز در
[`remaining-tasks.md`](remaining-tasks.md) و ماتریس تاریخی در [`historical-task-audit.md`](historical-task-audit.md) است.

---

## ۱. وابسته به دستگاه/سخت‌افزار (NATIVE-ONLY)

| مورد | چرا سنجیده نمی‌شود | پوشش جایگزین |
|---|---|---|
| اندازهٔ واقعی هدف لمس روی صفحهٔ لمسی | شبیه‌سازی مرورگر فقط هندسهٔ CSS را می‌دهد | اندازه‌گیری WAI با جعبه‌های layout + قاعدهٔ ≥۴۴px در تست |
| Safe-area (ناچ iPhone / نوار ناوبری اندروید) | نیاز به دستگاه | `env(safe-area-inset-*)` در CSS + بازبینی config |
| VoiceOver / TalkBack | نیاز به دستگاه | axe-core + محاسبهٔ ARIA accname در هارنس |
| WebView اندروید Tauri (CORS، بدنهٔ POST در dev proxy) | نیاز به دستگاه؛ dev proxy محلی در release وجود ندارد | بیلد release با URL مطلق API + تست ویندوز |
| iOS (cert/TestFlight) | نیاز به حساب Apple Developer | خارج از دامنه (X-خارجی) |

## ۲. مسدودهای بیرونی (تصمیم/دسترسی)

| کد | مورد | وضعیت ۲۰۲۶-۱۰-۲۰ |
|---|---|---|
| X1 | حساب تست E2E روی **پروداکشن** | سندباکس حل شد (۹ حساب دمو seed شد)؛ پروداکشن rate-limit 10 login/h دارد ⇒ E2E فقط روی سندباکس |
| X2 | اعتبارنامهٔ Firebase/FCM با پکیج درست | مسدود — بیرونی |
| X3 | تأیید پر بودن `KEYSTORE_*` در GitHub Secrets | فقط با اجرای tag-release مشخص می‌شود |
| X4 | قرارداد درگاه پرداخت و سرویس SMS | مسدود — اداری |
| X5 | حذف APKهای ۸۹MB از تاریخچهٔ git | بازگشت‌ناپذیر؛ نیاز به تأیید کاربر |
| X6 | استقرار آخرین بک‌اند روی prod | **انجام شد ۲۰۲۶-۱۰-۱۹**؛ شاهد: `GET /api/v1/venues/` → ۲۰۰ و مسیرهای `shifts`، `coach/sessions`، `tournaments/2`، `reconciliation/reports` → ۴۰۱ (وجود دارند) |
| X7 | دادهٔ تاریخی ۱۲ ماهه برای ML قیمت | ذاتاً زمان‌بر؛ C5.3 بدون داده واقعی باقی است |
| X8 | اعداد بازاریابی صفحهٔ اصلی (`HeroSection.tsx` و `StatsSection`) | تصمیم محصول: از سرور بیاید یا حذف شود |
| X9 | trigger ابرِ «Workers Builds: salon-app» | تصمیم/دسترسی به Cloudflare pipeline |

## ۳. محدودیت محیط سندباکس (روی محصول اثر ندارد)

- **Redis محلی نیست:** WebSocket pub/sub در سندباکس غیرفعال است (`Redis unavailable - WebSocket pub/sub disabled`) و فهرست رزروهای معلق (`/bookings/pending/my`) خالی برمی‌گردد. از ۲۰۲۶-۱۰-۲۰ بک‌اند در نبود Redis هم بالا می‌آید (fail-open)؛ مسیر realtime چند-worker فقط در prod (docker-compose با redis) معتبر است.
- **دادهٔ seed سندباکس زیرمجموعهٔ prod است:** ۱۰ سالن (تهران) در برابر ۵۰ سالن prod؛ اعداد «تعداد ردیف» در ممیزی، نه «تعداد کل داده».
- **Vite dev server:** کامپایل سرد می‌تواند یک بار «loading» طولانی بسازد؛ یافته‌های stuck-loading با context تازه بازبینی می‌شوند.
- **حافظهٔ ماشین:** sweep در تکه‌های نقش‌به‌نقش اجرا می‌شود (`MOBILE_AUDIT_ROLES`) و `deviceScaleFactor=1` است؛ اجرای هم‌زمان چند context باعث `code=134` می‌شود.
- **بدون Chrome:** تست‌های دستی/CDP با Edge headless انجام می‌شود.
- **سقف RAM ۸GB:** تست‌های مرورگری فقط تک‌پروسه و کوتاه؛ بایسکت کامل فقط با اجراهای کوتاه و تک‌مرورگری ممکن است.

## ۴. محدودیت‌های عملکردی گزارش‌شده

- اعداد `PERFORMANCE-REPORT.md` از localhost هستند؛ TTFB/LCP پروداکشن به شبکه و CDN وابسته است.
- تصاویر Unsplash در شبکهٔ ایران `ERR_CONNECTION_REFUSED` می‌دهند؛ fallback گرادیان رندر می‌شود (خطای محصول نیست).
