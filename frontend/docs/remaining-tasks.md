# تسک‌های باقی‌مانده (Remaining Tasks)

**به‌روز شده:** ۲۰۲۶-۱۰-۲۰ | **شاخه:** `flutter-free-web-tauri`

منبع حقیقت برای کارهای باز. تاریخچهٔ ۱۸۹ تسک ریز در [`FINAL_REVIEW_TASKS.md`](FINAL_REVIEW_TASKS.md)
و ماتریس درخواست↔واقعیت در [`historical-task-audit.md`](historical-task-audit.md) است.
محدودیت‌های غیرقابل‌رفع در [`known-limitations.md`](known-limitations.md).

---

## P0 — مسدودکنندهٔ انتشار

**هیچ.** تمام گیت‌های کد/تست/بیلد سبزند (جدول در [`test-report.md`](test-report.md) و [`build-report.md`](build-report.md)).

## P1 — باگ/شکاف جدی

**هیچ باز.** P1 ممیزی (۱۵ مورد) بسته شد؛ ماتریس دسترسی UI↔API در `docs/mobile-audit/FINAL-REVIEW.md` تأیید شده است.

## P2 — نیازمند تصمیم کاربر (کد آماده است، انتخاب محصولی/دسترسی نه)

| # | مورد | چه چیزی لازم است | مرجع |
|---|---|---|---|
| F-43 | شات سفید `/manager/crm` در سندباکس (DOM سالم، رستر خالی) | یک شات تأییدی در CI یا دستگاه واقعی؛ بایسکت بیشتر به‌دلیل سقف RAM انجام نشد | `docs/mobile-audit/BUG-TRACKER.md` F-43 |
| X8 | اعداد بازاریابی hero/Stats ساختگی‌اند | تصمیم: endpoint واقعی بسازیم یا اعداد حذف/خنثی شوند | `FINAL_REVIEW_TASKS.md` B7.2 / D14.3 |
| X9 | trigger ابرِ «Workers Builds: salon-app» | تصمیم: build+dist یا غیرفعال‌کردن pipeline | `FINAL_REVIEW_TASKS.md` Track F |
| X2 | Firebase/FCM با پکیج نادرست | اعتبارنامهٔ درست از کنسول Firebase | `android-release-v151-and-fcm-blockers` |
| X3 | تأیید `KEYSTORE_*` در GitHub Secrets | اجرای یک tag-release واقعی | CI |
| X4 | قرارداد درگاه پرداخت/SMS | سند و کلید از طرف سرویس‌دهنده | `deployment-guide-external-deps.md` |
| X1 | E2E روی پروداکشن | rate-limit 10 login/h مانع است؛ یا حساب سرویس‌ی جدا یا صرف‌نظر | `FINAL_REVIEW_TASKS.md` |

## P3 — بدهی/بهبود (بدون مسدودکننده)

| # | مورد | وضعیت |
|---|---|---|
| X5 | حذف APKهای ۸۹MB از تاریخچهٔ git | فقط با تأیید صریح (بازگشت‌ناپذیر) |
| X7 | دادهٔ تاریخی ۱۲ ماهه برای ML قیمت | C5.3 با داده واقعی قابل راستی‌آزمایی نیست |
| — | بازطراحی پنل ادمین | آگاهانه به بعد موکول شد (`ui-redesign-sport-energy-and-discoverability-gap`) |
| — | ناوبری پایین موبایل | گزینهٔ طراحی؛ تصمیم کاربر |
| — | iOS (cert/TestFlight) | نیاز به حساب Apple |

## اقدامات اجرایی همین دور (بدون وابستگی)

| # | اقدام | وضعیت |
|---|---|---|
| 1 | اجرای sweep کامل ۶ نقش روی بک‌اند واقعی (نقش‌به‌نقش برای حافظه) | ✅ ۱۵۲ ردیف، ۰ ناتمام |
| 2 | پر کردن ستون «وضعیت» جدول صفحه‌به‌صفحه | ✅ ۷۶ ردیف؛ فقط F-43 باز |
| 3 | شیت‌های مرور بصری ۳۷۵×۸۱۲ و بازبینی چشمی | ✅ شیت‌های ۰۱–۰۸؛ F-40…F-42 رفع شد |
| 4 | گیت‌های رگرسیون (`tsc`, `eslint`, `vitest`, `vite build`, Playwright heavy) | ✅ همه سبز (جزئیات در `test-report.md`) |
| 5 | به‌روزرسانی مستندات و ردیف‌های کهنهٔ X1/X6 | ✅ |
| 6 | کامیت/پوش و پایش CI | در جریان |
