# BUG TRACKER

فرمت هر رکورد: شناسه | اولویت | وضعیت | Route | نقش | Viewport | علت ریشه‌ای | اصلاح | شاهد

**ستون‌ها:** `ID`, `P` (P0..P3), `Status` (`OPEN` / `FIXED` / `VERIFIED` / `WONTFIX` / `BLOCKED`), `Route`, `Role`, `Viewport`, `Root cause`, `Fix`, `Evidence`

> **سطح آزمون:** همهٔ رکوردهای زیر از **بیلد پروداکشن Web** (`vite build` + `vite preview`) روی **بک‌اند واقعی سندباکس**
> (SQLite لوکال + Redis + uvicorn :8000) و با اندازه‌های شبیه‌سازی‌شدهٔ موبایل در Chromium/Playwright استخراج شده‌اند.
> این یافته‌ها را نباید شاهد Tauri Android دانست؛ آیتم‌های وابسته به WebView/Native در `FINAL-REVIEW.md` بخش `NATIVE-ONLY` جدا هستند.
> **خط مبنا (before):** `audit-artifacts/baseline-before-p1/` — ۱۴۶ ردیف جاروب، **۱۹۶ یافته**:
> P1 http-error ۲۴ | P2 console-error ۲۹ | P2 touch-target ۱۱۸ | P2 request-failed ۵ | P2 stuck-loading ۴ | P3 missing-h1 ۱۲ | P3 missing-header ۴.
> ماتریس شش‌اندازه‌ای (`audit-report-viewports.json`) همان ایرادها را با ضریب بالاتر تکرار می‌کند (۲۵۴ یافته؛ لمس ۱۶۶).

## P1 — شکست عملیات اصلی / ناخوانی UI↔API

| ID | P | Status | Route | Role | Viewport | عنوان | Root cause | Fix | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| F-01 | P1 | FIXED | `/finance`, `/manager/pricing`, `/manager/contracts`, `/manager/crm`, `/manager/shifts` | `user` (بدون انتصاب) | 320x568, 375x812 (+ ماتریس ۶ اندازه) | کاربر معمولی با نشانی مستقیم وارد کنسول مدیر می‌شد و صفحه فقط ۴۰۳ می‌گرفت | `ProtectedRoute` با `allowStaff` فقط «لاگین بودن» را می‌سنجید، نه «انتصاب فعال»؛ گیت سمت کلاینت با بک‌اند هم‌خوان نبود | `src/components/auth/ProtectedRoute.tsx`: `needsStaffCheck` → پرسش `/staff/me` و `isAssignedStaff`؛ بدون انتصاب ⇒ redirect به داشبورد کاربر | before: ۸ ردیف `403 GET /venues/my-venues` + `403 /contracts/manager/pending` در `baseline-before-p1/audit-report-routes.json` (user@/manager/*) |
| F-02 | P1 | FIXED | `/finance`, `/manager/pricing`, `/manager/crm`, `/manager/shifts` | `user`, `staff` | همه | هر کاربر غیرمالک `GET /venues/my-venues` می‌زد و ۴۰۳ می‌گرفت (۱۸ ردیف) | `useManagedVenues` بدون توجه به نقش، دامنهٔ مالکیت را می‌کاود | `src/hooks/useStaffMe.ts`: پرسش `my-venues` فقط برای `venue_manager/club_admin/super_admin`؛ کارمند از `/staff/me` دامنه می‌گیرد | before: ۱۰× `403 /venues/my-venues` در جدول http-error + ۸× در ترکیب با finance/pricing |
| F-03 | P1 | FIXED | `/games/1` | `guest` | 320x568, 375x812 | بازدیدکنندهٔ ناشناس در صفحهٔ بازی `401 GET /games/1/payments` می‌خورد | `PaymentSection` خلاصهٔ پرداخت را مستقل از احرازهویت درخواست می‌کرد | `src/components/game/PaymentSection.tsx`: `enabled = enabled && isAuthenticated` (میزبان تا ورود، خلاصه نمی‌پرسد) | before: ۲ ردیف `401 /games/1/payments` |
| F-04 | P1 | FIXED | `/coach` | `super_admin` | 320x568, 375x812 | ادمین کل به پنل مربی می‌رفت و سه درخواست `403 /coach/*` می‌خورد | بایپس سراسری `super_admin` در کلاینت، در حالی که بک‌اند پنل مربی را نقش‌محور (`role=coach`) گیت می‌کند | `ProtectedRoute.tsx`: `NO_SUPER_ADMIN_BYPASS = ['coach']` ⇒ ادمین کل دیگر وارد مسیر مربی نمی‌شود | before: ۲ ردیف `403 /coach/clients + /coach/dashboard + /coach…` |
| F-05 | P1 | FIXED | `/finance`, `/manager/pricing` | `staff` (پذیرش: `booking.confirm, slot.view_manager, contract.view, crm…` بدون `finance.view`/`pricing.manage`) | 320x568, 375x812 | کارمندِ بدون کد دسترسی، اسکلتون «در حال بارگذاری…» می‌دید که هرگز تمام نمی‌شد (۴ ردیف stuck-loading) و پشت صحنه ۴۰۳ می‌گرفت | کنسول‌ها دسترسی را از دامنهٔ سالن حدس می‌زدند نه از کد permission؛ خطای ۴۰۳ هم state «خطا» نمی‌ساخت | `useStaffPermission(codes)` + `FinanceConsole.tsx` / `ManagerPricing.tsx`: `ready` ⇒ اسپینر کوتاه، سپس `ForbiddenPanel` با راهنمای «مدیر سالن کد را بدهد»؛ `Navbar.tsx` لینک‌ها را از کد می‌سازد | before: ۴× `page-stuck-loading` (`loading=true`) + `403 /finance/venue-comparison`، `403 /pricing/rules?venue_id=1` |
| F-06 | P1 | FIXED | `/tournaments/1` | `user`, `manager` | 320x568, 375x812 | `404 GET /tournaments/1/bracket` و در نتیجهٔ آن صفحهٔ خطای عمومی با دکمهٔ «تلاش مجدد» | دو علت جدا: (الف) سندباکس هیچ تورنمنتی نداشت ⇒ آزمون روی دادهٔ غیاب؛ (ب) UI تفاوت ۴۰۴ (لینک مرده) را از خطای شبکه تفکیک نمی‌کرد | (الف) دادهٔ کنترل‌شده از API عمومی: تورنمنت ۱ (۲ تیم، قرعه‌شده) و تورنمنت ۲ (۸ تیم، ۳ مرحله، `in_progress`)؛ (ب) `TournamentDetail.tsx`: `bracketHttpStatus === 404` ⇒ `EmptyState` «این تورنمنت پیدا نشد» با دکمهٔ بازگشت به فهرست | before: ۴ ردیف `404 /tournaments/1/bracket`؛ after: `GET /tournaments/2/bracket` → ۲۰۰ با `rounds=3, matches=7` (کندل `seed_tournament8.py`) |

## P2 — لمس، کنسول، درخواست ناموفق

| ID | P | Status | Route | Role | Viewport | عنوان | Root cause | Fix | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| F-07 | P2 | VERIFIED | سراسری (۵۹ ردیف) | همه | 320x568 به‌بالا | هدف لمسی ۴۰×۴۰ «منوی حساب کاربری» | `IconButton` آواتار با `p:0.5` و آواتار ۳۲px | `Navbar.tsx`: `width/height: 44` + `flexShrink:0` | پیش‌پایه ۱۱۸ → پس از P1 ۴۶ → پس از P2 **۰** ردیف مربوط به نوار بالا در `audit-report-routes.json` |
| F-08 | P2 | VERIFIED | `/bookings`, `/finance`, `/teams`, `/games`, `/manager/*`, `/tournaments/:id` | user/manager/staff | 320–430 | دکمه‌های `size="small"` با ارتفاع ۳۶–۴۳px (`افزودن 110x40`, `ساخت بازی 107x36`, `انتقال کاپیتانی 120x36`, `بازگشت به تورنمنت‌ها 134x40`) | دو منبع جدا: (الف) `components/ui/Button.tsx` سایز `sm` روی `h-9`=۳۶px؛ (ب) ۱۴ مورد `minHeight: 40/43` دستی در ۷ فایل | (الف) `sm → h-11` + کف سراسری `min-h-11` در همان کامپوننت؛ (ب) همهٔ `minHeight: 40` → `44` | لمس ۴۶ → ۲۸ → **۴** ردیف؛ آن ۴ ردیف فقط **عرض** ۴۱px چیپ ToggleButton بود (F-09b) و ارتفاعشان ۴۴ است
| F-09 | P2 | VERIFIED | `/venues`, `/` | guest/user | 320x568, 360x640 | چیپ‌های فیلتر رشته ۲۴px ارتفاع (`همه رشته‌ها 82x24`, `⚽ فوتسال 76x24`) | چیپ سفاری فیلتر با padding کم و بدون `minHeight` | کف تم `MuiChip` روی حالت کلیک‌پذیر (`&.MuiButtonBase-root: minHeight 44`) | در دو جاروب پس از اصلاح، **صفر** ردیف touch-target برای `/venues` و فیلترهای رشته
| F-09b | P2 | FIXED | `/manager/crm`, `/coach` | staff/manager/coach | هر ۹ اندازه | `ToggleButton` («تازه») ۴۱×۴۴ — ارتفاع درست، **عرض** زیر ۴۴ | `MuiToggleButton` هیچ کف اندازه‌ای در تم نداشت؛ عرض با متن جمع می‌شد | `theme/index.ts`: `MuiToggleButton` ریشه و `sizeSmall` ⇒ `minHeight:44, minWidth:44` (سیستمیک، هر دو صفحه) | ۴ + ۱۰ ردیف «تازه(41x44)» در `audit-report-routes.json` / `audit-report-viewports.json`؛ باید در جاروب بعدی صفر شود
| F-10 | P2 | VERIFIED | فرم‌های تاریخ (`/bookings`, `/manager/shifts`, گزارش‌ها) | user/manager | 320x568 | دکمهٔ «انتخاب تاریخ» ۱۰×۱۰ و ۳۰×۳۰ | آیکن بازکردن تقویم جالاالی داخل `InputAdornment` بدون جعبهٔ لمسی | کف تم `MuiIconButton` ریشه و `sizeSmall`: `minWidth/minHeight: 44` | صفر ردیف touch-target برای دکمه‌های تقویم در جاروب پس از اصلاح
| F-11 | P2 | VERIFIED | `/teams/1` | user (کاپیتان) | 320x568 | آیکن‌های ۲۸×۲۸ «تغییر نقش …» و «حذف … از تیم» | `IconButton size="small"` بدون حداقل جعبهٔ لمسی | همان کف تم `MuiIconButton.sizeSmall` + اصلاح `sm` در `ui/Button` برای «انتقال کاپیتانی» | `/teams/1` در جاروب پس از P2 تنها یک ردیف داشت (دکمهٔ ۳۶px) که در F-08 گرفته شد
| F-12 | P2 | BLOCKED (محیط) | `/`, `/venues`, `/venues/1`, `/manager/contracts/1` | guest/user | همه | `net::ERR_CONNECTION_REFUSED` برای `images.unsplash.com/*` + پیام کنسول همنام | لینک تصویر **بیرونی** در دادهٔ دموی سالن‌ها؛ این ماشین به unsplash مسیر ندارد. `VenueImage` از قبل `onError` + fallback گرادیانی دارد، پس UI نمی‌شکند | اصلاح محصول لازم نیست (دادهٔ واقعی، آپلود محلی/MinIO)؛ در `E-01` ثبت شد و از شمارش یافتهٔ محصول خارج است | ۴×`request-failed` + ۶×`console-error` در جاروب دوم — همه با URL `images.unsplash.com`
| F-13 | P2 | VERIFIED | `/` (بخش اخبار) | guest/user | همه | `Error fetching latest news: timeout of 10000ms exceeded` در کنسول | وابستگی خانه به `varzesh3` با تایم‌اوت ۱۰s و `console.error` | `sportsApi.ts`: تایم‌اوت ۵s (۴ فراخوانی) + `console.warn` فارسی؛ حالت خالی از قبل وجود داشت | در جاروب دوم صفر خطای کنسول varzesh3؛ فقط ۱ ردیف `request-failed` با `ERR_ABORTED` (تایم‌اوت عمدی) — محیط

## P2 — ایرادهای تازهٔ ممیزی بصری (پردهٔ اول و دوم روی ۳۲۰px)

| ID | P | Status | Route | Role | Viewport | عنوان | Root cause | Fix | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| F-16 | P2 | FIXED | `/finance`, `/tournaments/:id`, `/coach`, `/manager/shifts`, `/contracts/:id`, `/teams/:id` | manager/user | 320x568 | مقدار کارت KPI («۱۲,۳۴۵,۶۷۸ ریال») از لبهٔ چپ صفحه بیرون می‌زد و بریده می‌شد (در تورنمنت: «ورودی هر تیم») | `KpiCard` مقدار را در `Typography` بدون شکست‌پذیری می‌گذارد؛ عدد فارسیِ ویرگول‌دار فاصله ندارد ⇒ در کارت ۱۵۰px (دو ستونه روی ۳۲۰) نمی‌گنجد و بیرون می‌زند | `components/finance/shared.tsx`: `overflowWrap:'anywhere'` روی مقدار و `flexWrap:'wrap'` روی ردیف تا چیپ دلتا به خط دوم برود — یک کامپوننت، ۷ مصرف‌کننده | before: `shots/manager___finance__320x568.png`، `shots/user___tournaments_2__320x568.png` |
| F-17 | P2 | FIXED | `/finance` | manager | 320x568 | تب سوم («حساب‌ها») بریده و بدون هیچ نشانهٔ اسکرول | `Tabs variant="scrollable"` با `scrollButtons={false}` روی سه تب ⇒ محتوای بیرون لبه، نامشخص و دست‌نیافتنی به‌نظر | `FinanceConsole.tsx`: `variant="fullWidth"` + `minWidth:0` و `px:1` روی ریشهٔ تب | همان اسکرین‌شات before (لبهٔ چپ تب بریده) |
| F-18 | P2 | FIXED | نوار پایین موبایل در `/finance` | manager | 320x568 به‌بالا | آیکن «امور مالی» در حالت فعال **خالی** بود (پیل کهربایی بی‌محتوا) | `NavIcon` برای حالت فعال پسوند `-outline` می‌سازد؛ `mdi:cash-register-outline` در MDI وجود ندارد و Iconify بی‌صدا هیچی رندر نمی‌کند | `components/mobile/BottomNavigation.tsx`: آیکن این آیتم به `wallet` (هر دو شکل `wallet` و `wallet-outline` موجود) | before: `shots/manager___finance__320x568.png` (پیل خالی پایین صفحه) |
| F-19 | P2 | FIXED | `/manager/shifts` | manager | 320x568 | (الف) بازهٔ هفته «…تا…» بدون فاصله چاپ می‌شد؛ (ب) ورودی «ماه خروجی» بومی مرورگر «October 2026» لاتین نشان می‌داد | (الف) سه گرهٔ JSX جدا بدون فاصلهٔ متنی؛ (ب) `TextField type="month"` وابسته به زبان مرورگر و تقویم میلادی | (الف) یک رشتهٔ واحد `${start} تا ${end}`؛ (ب) `TextField select` با دوازده ماه اخیر و برچسب جلالی، با همان مقدار `YYYY-MM` برای API | before: `shots/manager___manager_shifts__320x568.png` |
| F-20 | P3 | FIXED | هارنس ممیزی (ابزار) | — | — | هر «در حال بارگذاری…» سطح **بخش**، یافته‌های ساختاری کل آن ردیف را بی‌صدا حذف می‌کرد (بریدگی ۳۲۰px مالی همین‌طور از چشم دور ماند) | `incomplete = hasLoadingText \|\| textLen<=25` سطح صفحه را با سطح بخش اشتباه می‌گرفت | `e2e/mobile-audit.spec.ts`: `incomplete` فقط با متن بسیار کم (یا loading + متن کم) و افزوده‌شدن یافتهٔ `section-loading-at-measure` (P3) تا سیگنال سرعت گم نشود | `manager/@finance/@320x568` در جاروب دوم: `textLen=1354` ولی اندازه‌گیری ساختاری لغو شد |

## P2/P3 — دسترس‌پذیری (axe-core 4.10.3 روی بیلد تحویلی)

پیش‌پایه: ۸ مسیر × ۲ نقش (user/manager) در ۳۷۵×۸۱۲ → **۴۰ باریابی** در ۶ قاعده.
پس از اصلاح: همان ۸ مسیر + ۳ مسیر دیگر و هر دو نقش (۲۲ ترکیب) → **صفر**.

| ID | P | Status | Route | Role | Viewport | عنوان | Root cause | Fix | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| F-21 | P2 | VERIFIED | `/games/1`, `/teams/1`, `/finance`, `/tournaments/2`, `/venues/1` | user/manager | 375x812 | ۱۹ باریابی کنتراست: متن ۱۲px با ۲٫۴ تا ۴٫۴۹:۱ («عمومی» ۳٫۴۸، «پرداخت‌شده» ۴٫۴۹، «▼ ۳۳۷۲۷٪» ۴٫۰۱، «۰٪» ۳٫۶۸، «۸۰۰٬۰۰۰ ریال» ۲٫۷۷، برچسب ماه «مهر» ۴٫۰۰) | رنگ‌های تزئینیِ وضعیت (tailwind ۶۰۰/۵۰۰) هم به‌عنوان متن روی کاغذ و هم روی تیغ ۸–۱۲٪ِ خودشان استفاده می‌شد؛ `opacity` هم روی متنِ ۱۲px کنتراست را می‌سوزاند | کامپوننت جدید `utils/contrast.ts` (`readableText`/`chipInk`/`composite`) + مصرف در `finance/shared.tsx` (StatusChip و KpiCard)، `game/shared.tsx`، `team/shared.tsx`، `game/PaymentSection.tsx`، `mobile/DateSelector.tsx` (حذف opacity) | `axe-detail.log` پیش (۱۹ ردیف) → `axe-report.json` پس (صفر)؛ ۶ تست واحد در `src/utils/contrast.test.ts` |
| F-22 | P3 | VERIFIED | `/bookings`, `/dashboard`, `/finance`, `/tournaments/2`, `/venues/1` | user/manager | 375x812 | ۷ باریابی `heading-order`: بعد از `h1` بی‌واسطه `h6` | در MUI `variant="subtitle1/subtitle2/h6"` همه `<h6>` می‌سازند؛ عنوان پنل و عنوان کارت و حتی **مقدار** KPI («۳»، «۱٬۲۷٬۵۰ ریال») سرتیتر بودند | سطح معنایی با `component` جدا شد: `SectionCard`/`EmptyBox`→`h2`/`h3`، عنوان کارت رزرو→`h2`، سرتیتر بخش‌های داشبورد→`h2`، مقدار KPI→`component="div"` (سرتیتر نیست)، فرم نظر→`h3` | پیش ۷ → پس صفر |
| F-23 | P2 | VERIFIED | `/`, `/finance`, `/tournaments/2` | user/manager | 375x812 | ۵ باریابی `scrollable-region-focusable`: جدول/براکت/نتایج زنده با ماوس اسکرول می‌شد ولی با کیبورد نه | ناحیهٔ `overflow` بدون `tabindex` و بدون هیچ فرزند تعاملی (برچسبِ `aria-label` هم نداشت) | `role="region"` + `aria-label` فارسی + `tabIndex={0}` + `:focus-visible` روی ۴ جدول مالی، براکت تورنمنت، گالری تصویر `/venues/1` و باکس نتایج زندهٔ خانه | پیش ۵ → پس صفر؛ `tmp-scroll.cjs` ناحیه‌های واقعاً سرریز را فهرست می‌کند |
| F-24 | P2 | VERIFIED | `/finance` | manager | 375x812 | `aria-input-field-name`: `combobox` «همه سالن‌های من» بدون نام | `InputLabel` برچسب بصری می‌داد ولی `id`/`htmlFor`/`labelId` ست نبودند ⇒ هیچ رابطهٔ نام‌گذاری وجود نداشت | `FinanceDashboardTab.tsx`: `id="finance-venue-select"` + `labelId` + `htmlFor` | پیش ۱ → پس صفر |
| F-25 | P3 | VERIFIED | `/venues/1` | user/manager | 375x812 | `page-has-heading-one`: صفحهٔ جزئیات سالن در موبایل `h1` نداشت | `h1` تنها در هیرو دسکتاپ بود که با `display:{xs:'none'}` پنهان می‌شود؛ عنوان موبایل `<p>` رندر می‌شد | `VenueDetail.tsx`: `component="h1"` روی نام سالن در شاخهٔ موبایل (هیرو دسکتاپ همان `h1` پنهان را دارد؛ در هر نقطهٔ شکست فقط یکی در DOM است) | پیش ۲ (دو نقش) → پس صفر |
| F-26 | P2 | VERIFIED | `/games/1`, `/teams/1` | user/manager | 375x812 | ۶ باریابی `aria-progressbar-name`: نوار ظرفیت/پیشرفت پرداخت فقط `aria-valuenow` داشت | `LinearProgress` مقدار عددی می‌دهد ولی نام ندارد؛ کاربر صفحه‌خوان می‌شنود «نوار پیشرفت ۶۶٪» بدون اینکه بداند پیشرفتِ چه | `aria-label` + `aria-valuetext` فارسی روی همهٔ `LinearProgress`های determinate/indeterminate (ظرفیت بازی، ظرفیت تیم، پیشرفت مالی قرارداد، پرداخت سهم، دانلود بروزرسانی) | پیش ۶ → پس صفر |

## P3 — سرفصل و landmark

| ID | P | Status | Route | Role | Viewport | عنوان | Root cause | Fix | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| F-14 | P3 | VERIFIED | `/competitions`, `/manager/shifts`, `/tournaments/:id` | user/manager | 320x568, 375x812 | صفحه بدون `h1` | عنوان‌ها با `variant="h6"` روی `div` ساخته شده بودند نه `component="h1"` | `component="h1"` روی عنوان هر سه صفحه (فارسی/RTL) | پیش‌پایه ۱۲ باریابی → در دو جاروب پس از اصلاح **صفر** `missing-h1` |
| F-15 | P3 | VERIFIED | `/forgot-password`, مسیر ناموجود | guest | 320x568, 375x812 | نبود landmark `header` | این مسیرها `Layout` را نپوشیده بودند (صفحهٔ ۴۰۴ بی‌هدر و بی‌ناوبری) | `App.tsx`: `NotFound` داخل `<Layout>`؛ `EmptyState` با `asPageHeading` عنوان را `h1` می‌کند | پیش‌پایه ۴ باریابی → **صفر** `missing-header-landmark` در جاروب پس از اصلاح |

## محیط /-artیفکت (ایراد محصول نیست)

| ID | P | Status | عنوان | توضیح |
|---|---|---|---|---|
| E-01 | — | CLOSED | ۲۲ ردیف «stuck/blank» کاذب در اجرای اول جاروب | سرویکچ uvicorn سندباکس با `WinError 64` (asyncio proactor روی ویندوز) افت می‌کرد و وی‌ت ۵۰۰ می‌داد. با `run_backend.py` (watchdog) جایگزین و جاروب تکرار شد؛ این ردیف‌ها حذف شدند. |
| E-02 | — | CLOSED | اجرای ممیزی روی بیلد پروداکشن، لاگین به بک‌اند واقعی | `vite build` پیش‌فرض `VITE_API_URL=http://2.189.255.225/api/v1` را می‌بندد و ممیزی به سرویس پروداکشن می‌رفت. از آن پس بیلد و پیش‌نمایش با `--mode development` و شاهد `baseURL:"/api/v1"` در `dist`. **این قاعده باید حفظ شود.** |
| E-03 | — | OPEN | سقف ورود بک‌اند (۵ درخواست/دقیقه/IP) | هارنس و اسکریپت‌های seed باید توکن را کش کنند و بین ورودها فاصله بگذارند. **محدودیت امنیتی شکانده نمی‌شود** (`rate_limit.py` دست‌نخورده). |

## دسته‌بندی

- **P0** امنیت بحرانی / نشت داده / تخریب داده — تا این لحظه **صفر** (بخش امنیت `FINAL-REVIEW` و `ROLE-MATRIX` را ببینید)
- **P1** شکست عملیات اصلی یا غیرقابل‌استفاده شدن صفحه — ۶ ایراد؛ همه `FIXED` و در جاروب دوم **P1 = صفر** (دو ردیف P1 باقی‌ماندهٔ پیش‌پایه، پروب عمدی ۴۰۴ بودند که حالا `expected-http-error`/P3 ثبت می‌شود)
- **P2** UI/UX مهم، سرعت، گردش کار، دسترس‌پذیری — ۱۶ ایراد (۱۰ `VERIFIED`، ۵ `FIXED` در انتظار جاروب تأیید، ۱ `BLOCKED` محیطی)
- **P3** ظاهری/بهبود تکمیلی — ۵ ایراد (۴ `VERIFIED`، ۱ `FIXED`)
- **دسترس‌پذیری (F-21 تا F-26)** با axe-core روی بیلد تحویلی سنجیده شد: پیش‌پایه ۴۰ باریابی در ۶ قاعده → پس از اصلاح **صفر** در ۲۲ ترکیب مسیر×نقش

**جمع یافته‌های خودکار (جاروب ۵۹ ردیف):** پیش‌پایه **۱۹۶** → پس از P1 **۷۴** → پس از P2 **۱۷**؛
لمس ۱۱۸ → ۴۶ → ۲۸ → ۴ (فقط عرض)؛ `missing-h1` ۱۲ → ۰؛ `missing-header-landmark` ۴ → ۰؛ `stuck-loading` ۴ → ۰؛
`http-error` ۲۴ → ۰. ماتریس اندازه‌ها (۹ اندازه × ۹ صفحهٔ کلیدی، شامل سه اندازهٔ افقی) در `audit-report-viewports.json`.

## دور آخر — تأیید نهایی (۲۰۲۶-۱۰-۱۹)

| ID | P | Status | Route / دامنه | شاهد |
|---|---|---|---|---|
| F-27 | P2 | VERIFIED (محیطی) | همهٔ صفحات دارای تصویر seed | تنها URLهای شکست‌خورده `images.unsplash.com` هستند (`ERR_CONNECTION_REFUSED`)؛ هیچ درخواست داخلی اپ شکست نمی‌خورد. fallback گرادیان رندر می‌شود. |
| F-28 | P2 | CLOSED | ۵ مسیر × ۱۶ ایستگاه Tab | `transition: all` حلقهٔ تمرکز را انیمیت می‌کرد؛ با فهرست صریح پراپرتی‌ها در تم و مکث ۶۰ms در تست: `noRing=0`, `dups=0`. |
| F-29 | P2 | VERIFIED | `PersianDatePicker` | سلول ۴۴×۴۴، ناوبری ۴۴×۴۴، دکمه‌های پانویس ۴۴؛ اندازه‌گیری `getBoundingClientRect`. |
| F-30 | P2 | FIXED | فیلدهای تاریخ نیم‌عرض ۳۷۵px | `scrollWidth === clientWidth === 97`؛ `paddingInline:'10px'` (عدد در `sx` = ×۸px). |
| F-31 | P2 | FIXED | تقویم | `Grid xs:1` = ۱۲ ستون بود؛ جایگزین `repeat(7, 1fr)`؛ ۱ شهریور زیر «یکشنبه». |
| F-32 | P2 | FIXED | `/venues/1` | `Chip` داخل `<p>` → `component="span"`؛ `validateDOMNesting` صفر. |
| F-33 | P2 | FIXED | `/games/1`, `/teams/1` | لینک بازگشت ۱۱۵×۲۵ → `inline-flex` با `minHeight:44`. |
| F-34 | P2 | FIXED | `/admin/users` | جعبهٔ جستجو به `label` ۴۴px تبدیل شد؛ کلیک روی کل جعبه فوکوس می‌دهد. |
| F-35 | P2 | FIXED | جدول قوانین قیمت و کدهای تخفیف | `Switch` ۲۴px و بی‌نام → `MuiSwitch.root minHeight:44` + `FormControlLabel` ۴۴px + `aria-label` فارسی روی input. |

**جاروب نهایی (اجرای واقعی):** ۱۵۴ ردیف مسیر×نقش×ویوپورت + ۸۱ ردیف ماتریس ۹ اندازه + ۴ تست Playwright — همه PASS.
`stuck-loading=0`، `touch-target<44=0`، `overflowX=0`، `imgsNoAlt=0`، `noRing=0`، `dups=0`.
باقی‌ماندهٔ P2 فقط Unsplash محیطی؛ P3: یک بخش مالی در حال بارگذاری (۳ ردیف) و ۴۰۴ عمدی تورنمنت.

**نکتهٔ هارنس:** ۱۳ ردیف stuck-loading جاروب قبلی، full-reload کامپایل سرد Vite dev بود؛ هارنس اکنون یک reload دوباره می‌زند. همان مسیرها در context تازه ۱٫۵–۱٫۸ ثانیه‌ای رندر می‌شوند.

## قواعد ثبت

1. هر ایراد باید مسیر، نقش و viewport داشته باشد.
2. ادعای `FIXED` بدون شاهد (اسکرین‌شات بعد + تست مجدد) ثبت نمی‌شود؛ `VERIFIED` فقط پس از دیده‌شدن در خروجی جاروب جدید.
3. ایراد `BLOCKED` باید علت و اقدام لازم را ذکر کند.
4. یافته‌ای که فقط «مشاهده» شده `AUDITED` می‌شود نه `RETEST_PASSED`.
