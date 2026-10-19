# ACCESSIBILITY REPORT

**مالک:** Agent G (طراحی سیستم و دسترس‌پذیری)
**وضعیت:** انجام‌شده روی Web (بیلد تحویلی) — آیتم‌های Native در انتهای سند جدا شده‌اند.

## ۱) روش و محیط اندازه‌گیری

| مورد | مقدار |
|---|---|
| ابزار خودکار | `axe-core` 4.10.3 (از `node_modules`) با `resultTypes: violations` و تگ‌های `wcag2a/aa`, `wcag21a/aa`, `best-practice` |
| نحوهٔ تزریق | `page.addScriptTag` در Playwright 1.64 (Chromium) — بدون تغییر در کد محصول |
| مسیر تحویلی | `vite preview --mode development` روی `:3001` (بیلد `terser` + chunk + پروکسی `/api/v1` به سندباکس) |
| Viewport | 375×812 (موبایل) — جاروب ساختاری/لمس روی ۹ اندازهٔ دیگر هم انجام شده (بخش ۴) |
| نقش‌ها | `user`، `manager` (لاگین واقعی به بک‌اند سندباکس، توکن در `storageState`) |
| مسیرها | ۱۱ مسیر: `/`, `/venues`, `/venues/1`, `/bookings`, `/dashboard`, `/finance`, `/manager/shifts`, `/teams/1`, `/tournaments/2`, `/login`, `/games/1` |
| خروجی خام | `frontend/audit-artifacts/axe-report.json` (پس از اصلاح)، `axe-detail.json`, `axe-detail.log`, `axe-detail2.log` |
| اسکریپت | `audit-artifacts/tmp-axe.cjs` (تجمیعی) و `tmp-axe-detail.cjs` (هر گره با `target`/`html`/پیام کنتراست) |

> اعداد این سند «گرهٔ نقض‌شده» است، نه «قاعده»: یک قاعده می‌تواند در چند صفحه چند گره داشته باشد.

## ۲) پیش‌پایه ← پس از اصلاح

| قاعدهٔ axe | شدت | پیش‌پایه | پس از اصلاح | ریشه |
|---|---|---|---|---|
| `color-contrast` | serious | ۱۹ | **۰** | رنگ تزئینی وضعیت به‌عنوان متن، و متن ۱۲px با `opacity` |
| `heading-order` | moderate | ۷ | **۰** | `variant` به‌جای `component`؛ مقدار KPI سرتیتر بود |
| `aria-progressbar-name` | serious | ۶ | **۰** | `LinearProgress` بدون `aria-label` |
| `scrollable-region-focusable` | serious | ۵ | **۰** | ناحیهٔ `overflow` بدون `tabindex` و بدون فرزند تعاملی |
| `page-has-heading-one` | moderate | ۲ | **۰** | `h1` فقط در هیرو دسکتاپ (مخفی در موبایل) |
| `aria-input-field-name` | serious | ۱ | **۰** | `Select` بدون `labelId`/`id` |
| **جمع** | | **۴۰** | **۰** (در ۲۲ ترکیب مسیر×نقش) | |

جزئیات هر ردیف، با `target` و `html` و نسبت کنتراست اندازه‌گیری‌شده، در `audit-artifacts/axe-detail.log` (پیش) و `axe-detail.json` (پس) است.
ردیف‌های ایراد: **F-21 تا F-26** در `BUG-TRACKER.md`.

## ۳) اصلاحات انجام‌شده (با شاهد)

| اقدام | فایل(ها) | قبل | بعد |
|---|---|---|---|
| کامپوننت محاسبهٔ کنتراست (WCAG نسبی + ترکیب رنگ شفاف + تیره/روشن‌کردن تا ۴٫۵:۱) | `src/utils/contrast.ts` + `src/utils/contrast.test.ts` (۶ تست) | هر مصرف‌کننده رنگ خام می‌گرفت | `readableText`/`chipInk`/`composite`؛ تست واحد سبز |
| جوهر چیپ وضعیت با **خودِ زمینهٔ تیغ‌خورده** سنجیده می‌شود | `components/finance/shared.tsx` (`StatusChip`)، `components/game/shared.tsx`، `components/team/shared.tsx`، `components/game/PaymentSection.tsx` | ۲٫۴ تا ۴٫۴۹:۱ | ≥۴٫۵:۱ (مثلاً «عمومی» ۳٫۴۸ ← ۵٫۰) |
| مقدار `KpiCard` روی کاغذ سفید/تیره | `components/finance/shared.tsx` (`KpiCard`) | «۰٪» ۳٫۶۸، «۸۰۰٬۰۰۰ ریال» ۲٫۷۷ | ≥۴٫۵:۱، hue حفظ |
| حذف `opacity` از متن ۱۲px انتخاب تاریخ | `components/mobile/DateSelector.tsx` | «مهر» ۴٫۰۰:۱ | ۷٫۱:۱ |
| سطح سرتیتر از ظاهر جدا شد | `SectionCard`/`EmptyBox` (`finance/shared.tsx`)، `FinanceDashboardTab.tsx`، `pages/dashboard/Dashboard.tsx`، `pages/bookings/Bookings.tsx`، `pages/tournaments/TournamentDetail.tsx`، `components/venue/ReviewSection.tsx` | `h1` ← `h6` (پرش دو سطح) و عددِ KPI به‌عنوان سرتیتر | `h2`/`h3` معنایی؛ مقدار KPI `component="div"` |
| `h1` در نمای موبایل جزئیات سالن | `pages/venues/VenueDetail.tsx` | بدون `h1` | `component="h1"` روی نام سالن |
| نام دسترس‌پذیر نوارهای پیشرفت | `game/shared.tsx`، `game/PaymentSection.tsx`، `team/shared.tsx`، `contract/ContractEconomics.tsx`، `split-payment/SplitPaymentsPanel.tsx`، `modals/UpdateDialog.tsx` | «progressbar ۶۶٪» بی‌نام | `aria-label` + `aria-valuetext` فارسی (مثلاً «۳ از ۸ نفر») |
| کیبورد-رس شدن ناحیه‌های اسکرول | `finance/{FinanceDashboardTab,AccountsPanel,TransactionsPanel,VenueComparisonPanel}.tsx`، `tournaments/TournamentDetail.tsx` (براکت)، `venues/VenueDetail.tsx` (گالری)، `pages/Home.tsx` (نتایج زنده) | فقط با ماوس | `role="region"` + `aria-label` + `tabIndex={0}` + `:focus-visible` |
| نام‌گذاری `Select` فیلتر سالن | `components/finance/FinanceDashboardTab.tsx` | برچسب فقط بصری | `id`/`htmlFor`/`labelId` |

## ۴) چک‌لیست

| معیار | روش بررسی | نتیجه | شاهد |
|---|---|---|---|
| کنتراست متن/پس‌زمینه | axe-core + محاسبهٔ دستی نسبت (`tmp-contrast.cjs`) | ✔ پس از اصلاح | ۱۹ → ۰؛ `axe-detail.log` |
| اندازهٔ متن قابل‌خواندن | بازرسی computed style در ۳۲۰–۴۳۰px | ✔ (کمینهٔ متن ۱۲px، برچسب‌ها ۰٫۷۵rem) | `PAGE-BY-PAGE-AUDIT.md` |
| نام دسترس‌پذیر دکمه‌های آیکونی | بازرسی DOM + `button-name` axe | ✔ | `axe-report.json` (صفر) |
| Label فیلدهای فرم | axe `aria-input-field-name`, `label` | ✔ (یک نقض، رفع شد) | F-24 |
| Focus قابل‌مشاهده | پیمایش Tab + `:focus-visible` | ✔ برای ناحیه‌های تازه‌ی تمرکزپذیر؛ پیش‌فرض MUI برای بقیه | بخش ۶ |
| ترتیب منطقی Focus | پیمایش Tab در `/venues/1` و `/finance` | ✔ (DOM order، بدون element جابه‌جا‌شده با `tabIndex>0`) | بخش ۶ |
| ساختار Heading | axe `heading-order` + `page-has-heading-one` + پرایش DOM توالی `h1..h6` | ✔ | ۷+۲ → ۰؛ `tmp-headings.cjs` |
| پیام خطای قابل‌شناسایی | بازرسی `Alert`/`ErrorBox` + `role` | ✔ (متن فارسی، بدون اتکای صرف به رنگ) | `PAGE-BY-PAGE-AUDIT.md` |
| عناصر معنایی (`button`/`nav`/`main`) | بازرسی DOM + ممیزی landmark هارنس | ✔ | F-15 (`missing-header-landmark` ۴ → ) |
| رفتار Dialog | باز/بسته + focus trap در `PaymentDialog`/`FilterBottomSheet` | ✔ (رفتار MUI `Modal`؛ بدون تغییر) | `PAGE-BY-PAGE-AUDIT.md` |
| عدم اتکای صرف به رنگ | چیپ‌های وضعیت با آیکن + متن (نه فقط رنگ) | ✔ | `game/shared.tsx`, `finance/shared.tsx` |
| هدف لمس ≥44px | هارنس Playwright روی ۹ اندازه (۶ عمودی + ۳ افقی) | ✔ صفر باریابی | `audit-report-viewports.json`؛ F-07..F-09b |

## ۵) آنچه خودکار نمی‌شود سنجید (بررسی دستی)

- **فارسی/RTL:** axe زبان محتوا و جهت را برای کنتراست/برچسب تحلیل نمی‌کند؛ برچسب‌های `aria-label` دستی نوشته و بازبینی شدند (متن فارسی، رقم جلالی/فارسی).
- **خوانایی اعداد:** جداکنندهٔ هزارگان فارسی و `fontVariantNumeric: tabular-nums` در کارت‌ها اعمال شده تا اعداد در جدول هم‌عرض بمانند.
- **لحن پیام خطا:** پیام‌ها فارسی و عملیاتی‌اند («تلاش دوباره» دکمهٔ retry دارد) — خارج از توان ابزار خودکار.

## ۶) NATIVE-ONLY / BLOCKED

| مورد | وضعیت | توضیح |
|---|---|---|
| رندر واقعی در Android WebView (Tauri) | `NATIVE-ONLY` | فونت/ضخامت متن و کنتراست در WebView هدف می‌تواند با Chromium دسکتاپ فرق کند؛ بدون دستگاه تأیید نمی‌شود. |
| رفتار TalkBack روی نوار پایین و دیالوگ‌ها | `NATIVE-ONLY` | نیازمند دستگاه فیزیکی/امولاتور — خارج از دامنهٔ این ممیزی (تصمیم مأموریت: بدون گوشی). |
| زوم ۲۰۰٪ و reflow | `NOT_VERIFIED` | در مرورگر دسکتاپ با شبیه‌سازی viewport انجام شد، نه با زوم واقعی سیستم‌عامل. |
| فوکوس کیبورد روی تب‌های اخبار خانه | `AUDITED` | تب‌ها `component="button"` واقعی‌اند؛ `role="tablist"`/`aria-selected` هنوز ست نشده (بهبود بعدی، نقض axe نیست). |

## ۷) دور آخر — F-28 تا F-35 (۲۰۲۶-۱۰-۱۹)

| مورد | نتیجه | شاهد |
|---|---|---|
| حلقهٔ تمرکز (۲.۴.۷) | `noRing=0` در ۵ مسیر × ۱۶ ایستگاه | ریشه: `transition: all` که `outline-width` را انیمیت می‌کرد؛ حذف `outline` از فهرست transition |
| تاریخ‌یاب | سلول/ناوبری/پانویس ۴۴px، گرید ۷ ستونه، `aria-label` کامل روز | `PersianDatePicker` |
| هدف لمسی | کل sweep: `smallTap=0` در ۲۳۵ ردیف | اندازه‌گیری «هدف مؤثر» = بزرگ‌ترین جعبهٔ `.MuiInputBase-root`/`.MuiButtonBase-root`/`label` والد؛ ورودی‌های `aria-hidden`/≤۴px نادیده |
| ساختار DOM | `validateDOMNesting` صفر | چیپ «شما» در نظرات سالن `component="span"` شد |
| لینک بازگشت و جستجوی ادمین | ۴۴px | `/games/1`, `/teams/1`, `/admin/users` |
| تاگل‌های قیمت‌گذاری | ۴۴px + نام فارسی | `Switch` + `FormControlLabel` + `slotProps.input['aria-label']` |

**جاروب نهایی:** ۱۵۴ + ۸۱ ردیف، `overflowX=0`، `imgsNoAlt=0`، `smallTap=0`، `stuck-loading=0`.

## ۸) بازتولید

```bash
# ۱) بیلد تحویلی + پیش‌نمایش روی :3001 (قاعده E-02: حتما --mode development)
python %TEMP%/opencode/salon-audit/run_web.py build
python %TEMP%/opencode/salon-audit/run_web.py preview
# ۲) axe تجمیعی و جزئی (نیازمند audit-artifacts/auth/{user,manager}.json)
node audit-artifacts/tmp-axe.cjs
node audit-artifacts/tmp-axe-detail.cjs
# ۳) تست واحد کامپوننت کنتراست
npx vitest run src/utils/contrast.test.ts
```
