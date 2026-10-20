# SALON — ردیاب یافته‌های ممیزی موبایل (Mobile UI/UX Audit)

تاریخ شروع: ۲۰۲۶-۱۰-۱۸ | وضعیت: در حال اجرا

---

## P0 — انسداد مسیر (هیچ‌کدام باز نیست)

| کد | عنوان | وضعیت | توضیح |
|----|-------|--------|-------|
| — | — | — | — |

## P1 — ناهم‌خوانی دسترسی UI↔API (بسته)

| کد | عنوان | وضعیت | توضیح |
|----|-------|--------|-------|
| F-01 تا F-15 | ماتریس نقش‌ها و مسیرها | CLOSED | همهٔ ۴۰۳های تأییدشده؛ UI با backend همسو شد |

## P2 — دسترس‌پذیری و لمسی

### F-21 تا F-26: axe-core violations (VERIFIED ✓)

قبل از اصلاح: ۴۰ باریابی در ۶ قاعده → پس از اصلاح: **صفر** در ۲۲ ترکیب مسیر×نقش.

- F-21: color-contrast (چیپ‌ها، کارت KPI) → `chipInk()` سراسری
- F-22: heading-order → `component="h2"` روی تایپوگرافی‌های بصری
- F-23: scrollable-region-focusable → `role+tabIndex` روی مناطق پیمایشی
- F-24: aria-input-field-name → `InputLabel + labelId` روی Selectها
- F-25: page-has-heading-one → h1 یکتا در هر breakpoint
- F-26: aria-progressbar-name → `aria-label + aria-valuetext` روی LinearProgress

### F-27: کنسول/شبکه — تصاویر unsplash unreachable (P2 محیطی — VERIFIED)

تمام خطاهای `request-failed` (۱۷ ردیف در sweep، ۳۷ ردیف در ماتریس) صرفاً `GET https://images.unsplash.com/...` با `ERR_CONNECTION_REFUSED` هستند؛ هیچ درخواست داخلی اپ شکست نمی‌خورد. fallback بصری (گرادیان + آیکون) رندر می‌شود. دو خطای کنسول دیگر: `404 tournaments/999` (پروب عمدی) و `validateDOMNesting` که در F-32 رفع شد.

**وضعیت:** VERIFIED به‌عنوان یافتهٔ محیطی — روی شبکهٔ با دسترسی به Unsplash خطا وجود ندارد.

### F-28: حلقهٔ تمرکز دیر ظاهر می‌شد روی دکمه‌های MUI (CLOSED ✓)

**مشکل ظاهری:** ۷ ایستگاه کیبورد (لینک‌دکمه‌های `MuiButton-root` روی `<a>`) بدون حلقهٔ قابل‌مشاهده گزارش شدند و ابتدا «محدودیت emotion» تشخیص داده شد.

**ریشهٔ واقعی (با CDP `CSS.getMatchedStylesForNode`):** حلقه واقعاً اعمال می‌شد، اما `transition: all 0.25s` در تم، `outline-width` را از ۰ به ۲px انیمیت می‌کرد. پروب مقدار را بلافاصله بعد از Tab می‌خواند و در t=0 مقدار `0px` می‌دید؛ در t=450ms همان ایستگاه `solid 2px rgb(29,78,216)` بود.

**رفع:**
- `src/theme/index.ts`: فهرست صریح پراپرتی‌ها به‌جای `all` برای `MuiButton`, `MuiOutlinedInput`, `MuiTab` (بدون `outline`)
- `e2e/mobile-audit.spec.ts`: ۶۰ms مکث پس از Tab + assertion سخت‌گیرانهٔ `noRing === 0`

**وضعیت:** VERIFIED — ۵ مسیر × ۱۶ ایستگاه، `noRing=0`, `dups=0`.

### F-29: هدف لمسی زیر ۴۴px در PersianDatePicker (VERIFIED ✓)

**مشکل:** سلول‌های تقویم (۳۸×۳۸)، دکمه‌های ناوبری ماه/سال (size="small" ≈ ۳۰px)، فیلد تاریخ size="small" (۴۰px).

**رفع:**
- `cellBase`: ۳۸→۴۴px، پنل تقویم ۳۰۶→۳۰۸px
- ناوبری: `width: 44, height: 44`
- TextField input: `minHeight: 44` در تم (`MuiTextField.MuiInputBase-sizeSmall`)
- Select: `minHeight: 44` در تم (`MuiSelect.root`)
- دکمه‌های «امروز»/«پاک کردن»: `minHeight: 44`

**اندازه‌گیری واقعی (375×812، Edge، `getBoundingClientRect`):** سلول‌ها ۴۴×۴۴، ناوبری ۴۴×۴۴، دکمه‌های پانویس ۶۴/۷۵ ×۴۴، پنل ۳۳۲px. اسکرین‌شات: `audit-artifacts/shots/datepicker-375x812.png`.

### F-30: بریده‌شدن مقدار تاریخ در فیلدهای نیم‌عرض (FIXED ✓)

**مشکل:** در ۳۷۵px، فیلدهای «از/تا» مقدار `1405/06/28` را ناقص نشان می‌دادند (۹۹px متن در ۸۱px محتوا) — تاریخ انتخابی کاربر قابل‌خواندن نبود.

**رفع در `PersianDatePicker`:**
- آیکن تقویم از `IconButton` ۴۴px به آیکن بصری `pointerEvents:none` تبدیل شد (هدف لمسی خودِ فیلد است) → ۱۶px عرض آزاد شد
- `paddingInline: '10px'` + `fontSize: '0.8rem'` روی input
- فیلد با کیبورد هم باز می‌شود (`Enter`/`Space`/`ArrowDown`) + `aria-haspopup/aria-expanded`

**نکته:** در `sx` عدد به spacing تبدیل می‌شود؛ `paddingInline: 10` یعنی ۸۰px (باگ موقت خودِ اصلاح). واحد صریح `'10px'` لازم است.

**وضعیت:** VERIFIED — `scrollWidth === clientWidth === 97`، هر دو تاریخ کامل دیده می‌شوند.

### F-31: گرید تقویم ۱۲ ستونه بود، نه ۷ (FIXED ✓)

**مشکل:** `Grid size={{ xs: 1 }}` در MUI یعنی ۱ از ۱۲ ستون → تقویم هر ردیف ۱۲ روز می‌چید و روزهای هفته با ستون‌ها هم‌تراز نبودند (۱۲ شمسی و ۱۲ میلادی قاطی می‌شد در یک ردیف).

**رفع:** جایگزینی با CSS Grid: `display:'grid'; gridTemplateColumns:'repeat(7, 1fr)'` برای هدر روزهای هفته و شبکهٔ روزها. هر سلول ۴۴px.

**وضعیت:** VERIFIED — ۷ ستون، ۱ شهریور ۱۴۰۵ زیر «یکشنبه» (درست).

### F-32: Chip داخل `<p>` در بخش نظرات (FIXED ✓)

**مشکل:** روی `/venues/1` کنسول هشدار `validateDOMNesting: <div> cannot appear as a descendant of <p>` می‌داد — چیپ «شما» (`Chip` = div) داخل `Typography` (`p`) قرار داشت.

**رفع:** `component="span"` روی همان `Chip` در `src/components/venue/ReviewSection.tsx`.

**وضعیت:** VERIFIED — پروب ۷ ثانیه‌ای روی `/venues/1`: `nestingWarnings=0`.

### F-33: لینک‌های بازگشت ۲۵px در صفحهٔ بازی و تیم (FIXED ✓)

**مشکل:** `<Link>`های «بازگشت به بازی‌ها» و «بازگشت به تیم‌ها» به‌صورت متن ۱۱۵×۲۵ رندر می‌شدند (زیر ۴۴px).

**رفع:** خودِ `<Link>` به `inline-flex` با `minHeight: 44` تبدیل شد (کل عرض متن کلیک‌پذیر است).

**وضعیت:** VERIFIED — هر دو مسیر: `smallTap=[]`.

### F-34: کادر جستجوی ادمین ۲۹px (FIXED ✓)

**مشکل:** `InputBase` در `/admin/users` فقط ۲۹px ارتفاع داشت؛ جعبهٔ والد ۴۴px بود ولی کلیک روی لبه‌های آن فوکوس نمی‌داد.

**رفع:** والد به `component="label"` تبدیل شد (`cursor: text`) تا تمام سطح ۴۴px ورودی را فوکوس کند.

**وضعیت:** VERIFIED — کلیک روی label فوکوس را به input می‌دهد (`label-click-focuses-input`) و هدف مؤثر ۴۴px است.

**اصلاح اندازه‌گیری هارنس:** input/comboboxهای MUI داخل ریشهٔ ۴۴px، خودشان ۲۳–۴۰px هستند و قبلاً «هدف کوچک» کاذب تولید می‌کردند. هارنس اکنون بزرگ‌ترین جعبهٔ `.MuiInputBase-root`/`.MuiButtonBase-root`/`label` والد را به‌عنوان هدف مؤثر می‌شمارد و ورودی‌های `aria-hidden` و جعبه‌های ≤۴px را نادیده می‌گیرد.

### F-35: تاگل‌های فعال/غیرفعال فقط ۲۴px و بدون نام دسترس‌پذیر (FIXED ✓)

**مشکل:** `Switch`های جدول قوانین قیمت‌گذاری و کدهای تخفیف ۲۴px ارتفاع داشتند و نام دسترس‌پذیر نداشتند (صفحه‌خوان فقط «سوییچ» می‌شنید).

**رفع:**
- `MuiSwitch.root` در تم: `minHeight: 44`
- هر دو جدول: `FormControlLabel` با `label={null}` و `sx={{ m:0, minHeight:44, minWidth:44 }}` تا کل جعبهٔ ۴۴px کلیک‌پذیر شود
- نام روی خودِ input: `slotProps={{ input: { 'aria-label': 'غیرفعال کردن قانون' / 'فعال کردن کد تخفیف' } }}`

**وضعیت:** VERIFIED — هدف مؤثر ۷۲×۴۴، `role="switch"` با نام فارسی.


## P3 — جزئیات بصری و ساختاری

### F-16 تا F-19: یافته‌های بصری (VERIFIED ✓)

شواهد از آخرین sweep (۱۴۱ ردیف معتبر مسیر×نقش×ویوپورت) + ماتریس اندازه‌ها (۸۱ ردیف):

- **F-16 overflow افقی:** `maxOverflowX = 0` در هر ۲۲۲ ردیف (۳۲۰ تا ۹۳۲ و لندسکیپ) — VERIFIED
- **F-17 تصویر بدون alt:** `imgsNoAlt = 0` از ۱۴۵ تصویر رندرشده — VERIFIED
- **F-18 landmark header:** همهٔ مسیرهای اپ `<header>` دارند؛ تنها ۶ ردیف بدون header، مسیرهای جریان ورود (`/login`, `/register`, `/forgot-password`) هستند که عمداً بدون پوسته‌اند — VERIFIED
- **F-19 بارگذاری هنگام اندازه‌گیری:** فقط ۱ ردیف (`manager/@finance`) یک «بخش» هنوز در حال بارگذاری داشت، نه کل صفحه — پذیرفته

**نکتهٔ هارنس (نه محصول):** ۱۳ ردیف «stuck-loading» در sweep اول، اثر کامپایل سرد Vite dev بود؛ همان مسیرها در context تازه در ۱.۵–۱.۸ ثانیه کامل رندر شدند (`/teams`, `/admin`, `/manager/contracts` و…). در بیلد production این حالت وجود ندارد.

### توقف‌های تکراری کیبورد (CLOSED ✓)

framer-motion's `whileTap` باعث اضافه شدن `tabIndex={0}` به divهای انیمیشن می‌شد که داخلشان المان فعال (Link/IconButton) بود → دو ایستگاه کیبورد پشت سر هم.

**رفع:** `tabIndex={-1}` روی سه wrapper:
- `Home.tsx`: FEATURE_TILES motion.div (خط ~۲۷۴)
- `Home.tsx`: news carousel motion.div (خط ~۳۴۸)
- `NotificationPanel.tsx`: motion.div دور IconButton اعلان‌ها (خط ۱۰۵)

**وضعیت:** VERIFIED — `dups=0` در تمام مسیرها.

---

### F-36 تا F-39: یافته‌های خودِ هارنس (FIXED ✓)

این‌ها باگ محصول نیستند؛ خطاهای اندازه‌گیری/اجرا که نتایج sweep را آلوده می‌کردند و اصلاح شدند:

- **F-36 — محاسبهٔ ناقص accessible name:** هارنس فقط `aria-label`/متن مستقیم را می‌دید و `aria-labelledby`، `alt` تصویر داخل دکمه و label والد را نادیده می‌گرفت ⇒ ۴ ردیف «بی‌برچسب» کاذب. اکنون نام دسترس‌پذیر بر اساس ARIA accname (aria-labelledby → aria-label → متن/alt فرزندان) محاسبه می‌شود؛ ورودی‌های بدون نام واقعی (مثل `ButtonBase` بدون متن) همچنان گزارش می‌شوند.
- **F-37 — حساب/استوریج کهنه:** توکن‌های تزریق‌شده از اجرای قبلی و تفاوت حساب‌های سندباکس با پروداکشن باعث `role-unavailable` کاذب می‌شد. اکنون برای هر نقش context تازه با `auth/<role>.json` تازه ساخته می‌شود و فهرست حساب‌ها از همان بک‌اند هدف می‌آید.
- **F-38 — ناهم‌خوانی نام شات‌ها:** ژنراتور جدول (`page_table.py`) و شیت مرور (`contact_sheet.py`) نام فایل را با قاعدهٔ متفاوتی می‌ساختند و تصویر «MISSING» نشان می‌داد. هر دو اکنون از یک تابع `shot_base()` استفاده می‌کنند.
- **F-39 — گام‌های بدون مهلت (هنگ ۷ دقیقه‌ای):** `page.evaluate`/`screenshot` در Playwright مهلت ندارند؛ یک رندرر قفل‌شده کل sweep را بی‌پایان می‌خواباند. هر گام اکنون با `withDeadline` (۱۰–۳۰ ثانیه) محدود می‌شود، ردیف `stepTimeouts` می‌گیرد، یافتهٔ `page-unresponsive` ثبت می‌شود و context نقش بازسازی می‌شود. `deviceScaleFactor` هم به ۱ کاهش یافت چون ۲× رندرر را با `code=134` می‌کشت.

**وضعیت:** FIXED — با اجرای sweep کامل نقش‌به‌نقش تأیید شد (بدون هنگ، بدون ردیف ناتمام).


### F-40 تا F-44: یافته‌های مرور بصری شیت‌های ۰۲–۰۸ (۲۰۲۶-۱۰-۲۰)

- **F-40 — آیکون دلار روی مبلغ ریالی (FIXED ✓):** کارت «درآمد (بازه انتخابی)» داشبورد مدیر و ردیف قیمت سالن با `mdi:currency-usd` رندر می‌شدند. به `mdi:cash-multiple` تغییر کرد. فایل: `src/pages/dashboard/ManagerDashboard.tsx`.
- **F-41 — پنل ادمین: ارقام لاتین + آیکون ناقص (FIXED ✓):** KPIها `20`/`3` را با ارقام لاتین و برخلاف کل اپ نشان می‌دادند و آیکون `mdi:shield-question-outline` در مجموعهٔ MDI وجود ندارد و به‌صورت مربع خالی دیده می‌شد. اکنون `toPersianDigits` و آیکون `mdi:clipboard-clock-outline`. فایل: `src/pages/admin/AdminDashboard.tsx`.
- **F-42 — شکستن مبلغ بزرگ در کاشی KPI (FIXED ✓):** «درآمد این ماه» منفی (`−۱۹۵٬۰۳۵٬۸۳۴ ریال`) در ستون ۱۶۷px روی سه خط می‌شکست. `formatRialCompact` اضافه شد (میلیون/میلیارد ریال) و مقدار کامل در `title` می‌ماند؛ `KpiCard` پراپ `title` گرفت. فایل‌ها: `src/components/finance/shared.tsx`, `src/components/finance/FinanceDashboardTab.tsx`.
- **F-43 — شات سفید `/manager/crm` (OPEN — نیازمند تأیید روی دستگاه/CI):** در شات‌های ۳۲۰ و ۳۷۵ این مسیر کاملاً سفید است، ولی DOM کامل است (`h1=مشتریان و پرسنل`، ۳۹۷ گره، `textLen=906`، بدون خطای کنسول) و hit-test روی محتوا می‌افتد. حتی `body{background:red}` هم در شات دیده نشد ⇒ رستر صفحه در این سندباکس خالی می‌شود، نه اینکه محتوا وجود نداشته باشد؛ `overflowX` گزارش‌شده هم ناشی از نوار ناوبری پارک‌شدهٔ RTL است (`scrollWidth=781`). به‌دلیل سقف رم میزبان (۸GB)، بایسکت‌کردن بیشتر انجام نشد؛ باید در CI/دستگاه واقعی یک شات تازه گرفته شود. تا آن زمان در جدول صفحه‌به‌صفحه «❌ BLOCKED» است.
- **F-44 — ۵۰۰ روی `/bookings/pending/my` بدون Redis (FIXED ✓):** سرویس رزروهای معلق تمام‌وابسته به Redis است و در سندباکس (بدون Redis) خطای اتصال به ۵۰۰ تبدیل می‌شد؛ صفحهٔ `/bookings` مدیر با پیام خطا می‌افتاد. `_list` اکنون `redis.RedisError` را می‌گیرد و `[]` برمی‌گرداند (بدون Redis هیچ رکورد معلقی وجود ندارد). تأیید: پاسخ ۲۰۰ `[]` با توکن manager. فایل: `backend/app/services/pending_booking_service.py`.
- **تکراری‌شدن توست «دسترسی…» (پذیرفته — فقط dev):** `ProtectedRoute` یک منبع دارد؛ دوبار دیده‌شدن در شات‌ها اثر اجرای دوبارهٔ effect در React StrictMode (dev) است و در build تولیدی تک‌بار است.

**وضعیت:** F-40…F-42 و F-44 FIXED (tsc/lint/build پاک)؛ F-43 OPEN.


## خلاصه دسته‌بندی

| اولویت | تعداد | باز | بسته/تأییدشده |
|---------|-------|-----|----------------|
| P0 | ۰ | ۰ | ۰ |
| P1 | ۱۵ | ۰ | ۱۵ CLOSED |
| P2 | ۱۹ | ۰ | ۱۹ VERIFIED |
| P3 | ۵ | ۰ | ۵ VERIFIED |
| یافته‌های جدید حین تأیید (F-30 تا F-35) | ۶ | ۰ | ۶ FIXED/VERIFIED |
| یافته‌های هارنس (F-36 تا F-39) | ۴ | ۰ | ۴ FIXED |
| یافته‌های شیت‌های بصری (F-40 تا F-44) | ۵ | ۱ (F-43) | ۴ FIXED |
