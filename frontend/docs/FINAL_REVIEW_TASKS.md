# فایل تسک اجرای FINAL_REVIEW (breakdown ریز، قابل پیگیری)

**به‌روز شده:** ۲۰۲۶-۱۰-۱۶ (راند ۵ — C3 شیفت پرسنل) — بر پایهٔ ممیزی شواهدی (هر مورد یک `file:line` معتبر دارد)
**وضعیت راند ۵:** C3 ✅ کد + تست (بک‌اند **۴۷۳ passed در ۱۰۶.۸۸s** از ۲۱ تست جدید شیفت، فرانت
**۸۵ passed در ۱۲ فایل** از ۱۷ تست جدید، `tsc` ۰ · `eslint` ۰ · build ✓ ۱۹.۶۰s بدون `.map` ·
دروازۀ ruff `E9,F82` پاک · **۲۲۹** مسیر OpenAPI با ۵ مسیر `/shifts*` · مهاجرت `m0s023` چرخهٔ
up/down/up را سالم گذراند).
**وضعیت راند ۴:** C2 ✅ کد + تست (بک‌اند **۴۵۲ passed در ۹۷.۷۹s**، فرانت **۶۸ passed در ۱۰ فایل**،
`tsc` ۰ · `eslint` ۰ · build ✓ ۲۰.۱۴s بدون `.map` · دروازۀ ruff `E9,F82` پاک · ۲۲۴ مسیر OpenAPI).
**وضعیت راند ۳:** Track A ✅ (جز A9.1=X5) · Track B ✅ (جز B7.2=X8) · **Track D ✅ کامل** — axe-core روی
۶ مسیر عمومی: **۰ نود نقض**؛ گیت‌ها: `tsc` ۰ · `eslint` ۰ · ۳۷ تست vitest · build ✓ ۵۳.۰۶s بدون `.map`.
باقی‌مانده فقط موارد وابسته به تصمیم/دسترسی: C4/C5.1-C5.2، برش‌های C2.5 و X1–X8.
**قانون:** هیچ تسکی بدون «معیار راستی‌آزمایی» بسته نمی‌شود. `✅` = انجام و راستی‌آزمایی‌شده، `🟡` = کد نوشته، در انتظار CI/راستی‌آزمایی، `⛔` = مسدود (تصمیم کاربر/دسترسی بیرونی).

---

## وضعیت ادعاهای FINAL_REVIEW (چیزی که ممیزی نشان داد)

| ادعای سند | واقعیت کد |
|---|---|
| پرداخت تقسیم‌شده ۰٪ | **ساخته شده** — مدل+API+UI (`backend/app/models/split_payment.py:44`, `frontend/src/components/split-payment/SplitPaymentsPanel.tsx`) |
| قیمت‌گذاری پویا ۰٪ | **موتور قوانین سمت سرور موجود است** (`backend/app/services/pricing_service.py:95`)؛ فقط forecast/ML غایب است |
| اعلان‌های دستی | **۹ job زمان‌بندی‌شده** (`backend/app/tasks/worker.py:27-75`) |
| CI بدون امضا | **امضا در workflow سیم‌کشی شده** (`.github/workflows/build-all-platforms.yml:79-100,211-250`)؛ اگر secret نباشد فقط warning |
| CORS باز و ناامن | `*` نیست؛ مشکل واقعی: `allow_methods/headers="*"` با `credentials=True` |
| rate limit فقط auth | روی ۵ روتر هست؛ مشکل واقعی: **۲۴ روتر بدون محدودیت + fail-open** |
| CSP ندارد | در بک‌اند هست؛ مشکل واقعی: **nginx برای SPA هدری نمی‌فرستد** + `unsafe-inline` |
| bundle بهینه نشده | ۳۶ روت lazy + ۷ manualChunks؛ مشکل واقعی: **sourcemap در prod منتشر می‌شود** |
| «۴۸ `Typography variant="h1..h6"` بدون `component=` به `<div>` رندر می‌شود» (D10.2) | **غلط** — MUI این variantها را به عنصر عنوان نگاشت می‌کند (`node_modules/@mui/material/Typography/Typography.js:102,141`)؛ نقص واقعی **سطحِ غلط سرفصل** بود (axe `heading-order`) |
| `useReducedMotion` ≥ ۴ (D8.1) | **معیار باطل** — کاهش حرکت سراسری با `<MotionConfig reducedMotion="user">` در `App.tsx:281` + `@media (prefers-reduced-motion)` در CSS پیاده شده؛ شمارش `useReducedMotion` باید صفر بماند |
| `grep "color:'#059669'"` = ۰ (D6.2) | **معیار باطل** — آیکون‌ها (۳:۱) و ورودی‌های نگاشتِ توکن را هم می‌شمرد؛ جانشین: گاردریل CI با پیمایش بدنهٔ `sx={{…}}` |
| صفحهٔ سالن سالم است | **باگ تولیدی** در دسکتاپ: عنوان/برچسب/آدرس سالن پشت `overflow:hidden` و تصویرِ هم‌جریان **نامرئی** بود (D13؛ با `elementFromPoint` ثابت شد) |

**۴ مورد عملاً غایب (وضعیت ۲۰۲۶-۱۰-۱۶):** تقویم `.ics` ساخته شد (B1)، نقش مربی کامل شد (C1)،
تورنمنت/براکت تک‌حذفی ساخته شد (C2) و **شیفت پرسنل ساخته شد (C3 — بک‌اند ۲۱ تست + فرانت ۱۷ تست؛
رگرسیون ۴۷۳ تست بک‌اند و ۸۵ تست فرانت سبز)**. باقی‌ماندۀ واقعی فقط برش‌های C2.5
(Double-Elimination/Round-Robin) و C4/C5 است.
**باگ قطعی و بزرگ (رفع شد — A1):** ۴ endpoint نوتیفیکیشن در بک‌اند وجود ندارد
(`backend/app/api/v1/notifications.py:16,32` فقط fcm-token) ولی فرانت این‌ها را صدا می‌زند
(`frontend/src/services/notification.ts:20,25,30,35`) → پنل اعلان‌ها ۴۰۴ می‌گیرد؛ درحالی‌که
متدهای مخزن آماده‌اند (`backend/app/repositories/notification_repository.py:13,21,28,39`).
**باگ‌های قطعی جدید که A11 بیرون آورد (رفع شد):** `POST /api/v1/reviews` برای همه ۵۰۰ (NameError)،
`GET /api/v1/waitlist/slot/{id}` برای CLUB_ADMIN/SUPER_ADMIN همیشه ۴۰۳ (مقایسهٔ رشتهٔ نقش با نام
enum نه مقدارش)، و crash job بکاپ (`os` بدون import).

---

## Track A — باگ‌ها و بدهی فنی (کوچک، پرارزش، بدون وابستگی بیرونی)

### A1 ⭐ پنل اعلان‌ها را زنده کن (۴ endpoint گمشده) — ✅ کد + تست (راستی‌آزمایی UI منتظر deploy و حساب تست: X6/X1)
- [x] A1.1 افزودن `GET /notifications/` (paginated، فیلتر خوانده‌نشده) روی `get_by_user`
- [x] A1.2 افزودن `GET /notifications/unread-count` روی `get_unread_count`
- [x] A1.3 افزودن `PUT /notifications/{id}/read` روی `mark_as_read` (۴۰۴ اگر مال کاربر نبود)
- [x] A1.4 افزودن `PUT /notifications/read-all` روی `mark_all_as_read`
- [x] A1.5 تطبیق شکل پاسخ با چیزی که `frontend/src/components/layout/NotificationPanel.tsx` می‌خواند (نام فیلدها، envelope)
- [x] A1.6 تست pytest برای هر ۴ مسیر (شامل «کاربر دیگر نمی‌تواند بخواند»)
- **شاهد:** ۴ مسیر در `backend/app/api/v1/notifications.py` + `tests/test_notifications.py`؛ باگ `with uow:` تودرتوی FCM هم رفع شد.
- **معیار:** `curl` روی سرور تست → ۲۰۰ و داده؛ در UI، عدد خوانده‌نشده‌ها و لیست نمایش داده می‌شود.

### A2 نقشهٔ منبع prod را ببند — ✅
- [x] A2.1 `frontend/vite.config.ts:35` → `sourcemap: mode !== 'production'`
- [x] A2.2 تأیید اینکه artifact `dist` در `web-tests.yml:50-57` دیگر `.map` ندارد
- **شاهد:** `dist/assets/*.map` پس از build محلی خالی؛ گام «Assert no source maps shipped» در CI.
- **معیار:** بعد از build، `ls dist/assets/*.map` خالی باشد.

### A3 سرو SPA در nginx + هدرهای امنیتی — 🟡 کد آماده، نیازمند deploy
- [x] A3.1 افزودن سرویس/والیوم برای `frontend/dist` در `docker-compose.yml` (مسیر `/usr/share/nginx/html` الان هیچ backingی ندارد)
- [x] A3.2 `add_header`های `nginx.conf:27-31` را با `always` و به‌صورت inheritable تنظیم کن (فعلاً در `/assets/` و `/minio/` حذف می‌شوند)
- [x] A3.3 بستن `/docs`، `/redoc`، `/openapi.json` پشت یک flag محیطی (`nginx.conf:86-92`)
- **شاهد:** `nginx/security-headers.conf` با `add_header … always` و `include` در هر location (ارث‌بری nginx) + CSP کامل؛ `docker-compose.yml` والیوم `frontend/dist:/usr/share/nginx/html:ro`؛ `/docs|/redoc|/openapi.json` پشت allowlist خصوصی. راستی‌آزمایی `curl -I` روی دامنه ⛔ (X6).
- **معیار:** `curl -I https://salon.absadeghi.ir/` نشان دهد CSP/X-Frame/… و SPA با ۲۰۰ سرو می‌شود.

### A4 Rate limiting را واقعی کن — ✅
- [x] A4.1 middleware سراسری با حد پیش‌فرض برای همهٔ روترها (به‌جز health)
- [x] A4.2 خواندن `RATE_LIMIT_PER_MINUTE` / `AUTH_RATE_LIMIT_PER_HOUR` که الان مرده‌اند (`backend/app/config.py:44-45`)
- [x] A4.3 تصمیم fail-open/fail-closed برای قطعی Redis (`rate_limit.py:53-55,83-85`) + لاگ هشدار
- **شاهد:** middleware سراسری + پنجرهٔ دوم برای auth + پرچم `RATE_LIMIT_FAIL_OPEN`؛ تست‌ها در `tests/test_rate_limit.py`؛ ترتیب CORS/rate-limit اصلاح شد.
- **معیار:** تست pytest: ۶۰ درخواست → ۴۲۹؛ با Redis خاموش، رفتار مستند و قابل‌پیکربندی.

### A5 اعتبارنامه‌ها را از فایل ترک‌شده بیرون بیاور — ✅
- [x] A5.1 حذف مقدار پیش‌فرض `POSTGRES_PASSWORD`، `MINIO_ROOT_PASSWORD`، `MINIO_SECRET_KEY`، `DATABASE_URL` از `docker-compose.yml:9,47,65-74,99-104` (اجبار به `env_file`)
- [x] A5.2 رفع `extra="ignore"` در `backend/app/config.py:75-79` که باعث می‌شود compose بی‌صدا `.env` را بازنویسی کند
- [x] A5.3 هم‌سازی `backend/.env.example`: حذف `SMS_*` ماورایی، افزودن ~۲۵ فیلد واقعی
- [x] A5.4 ساخت `frontend/.env.example` با ۵ متغیر `VITE_*`
- [x] A5.5 استثنای `.gitignore:13` برای فایل‌های `*.env.*.example` تا `.env.production.example` ترک شود
- **شاهد:** `${VAR:?…}` در compose؛ `backend/.env.example` با ۳۴ فیلد واقعی و بدون `SMS_*`؛ `frontend/.env.example`؛ استثنای gitignore با `git check-ignore -v` راستی‌آزمایی شد.
- **معیار:** `docker compose config` بدون هیچ secret ترک‌شده؛ `git ls-files | grep env` فقط مثال‌ها را نشان دهد.

### A6 jobهای زمان‌بندی‌شدهٔ سرگردان — ✅
- [x] A6.1 `notify_overdue_contract_payments` (`backend/app/tasks/contract_tasks.py:84`) را به schedule در `worker.py:27-75` اضافه کن (الفا تعریف شده ولی اجرا نمی‌شود)
- [x] A6.2 یک تست که schedule نهایی را با لیست taskهای تعریف‌شده مقایسه می‌کند
- **شاهد:** `beat_schedule` از `crontab()` ساخته می‌شود، نام‌ها `app.tasks.*`، تست regression تطبیق schedule/تسک‌ها.
- **معیار:** `celery beat --dump` (یا لاگ بوت) job را نشان دهد.

### A7 دروازهٔ ESLint که بی‌صدا رد می‌شود — ✅
- [x] A7.1 افزودن `eslint.config.js` (یا سوییچ CI به `.oxlintrc.json` موجود)
- [x] A7.2 رفع خطاهای ناشی از فعال‌سازی (فقط errorها، warningها نه)
- **شاهد:** `frontend/.eslintrc.cjs`؛ ۲۳ خطا رفع شد؛ گام CI مشروط: `eslint src --ext .ts,.tsx --quiet --max-warnings 0`.
- **معیار:** `pnpm lint` اجرا می‌شود و در CI غیراز no-op است.

### A8 تست واحد فرانت (الان صفر است) — ✅ ۳۷ تست
- [x] A8.1 افزودن vitest + jsdom + اسکریپت `test`
- [x] A8.2 ۵ تست اول: `toLatinDigits`، رزولوشن URL تصویر سالن، منطق gap/RTL، `VenueCard` رندر، یک service mock
- [x] A8.3 افزودن job به `web-tests.yml`
- **شاهد:** `vitest.config.ts` + `src/test/setup.ts`؛ پوشش `l10n`(6)، `venueMedia`(9)، `calendar`(14)، `notification`(4)، `VenueCard`(4)؛ job `unit-tests` در CI.
- **معیار:** `pnpm test` محلی سبز؛ در CI تعداد تست‌ها چاپ شود.

### A9 حجم build و APKهای ترک‌شده — 🟡 A9.2 ✅ / A9.1 ⛔ (X5)
- [ ] A9.1 ⛔ **تصمیم کاربر:** دو APK به حجم ~۸۹MB (`frontend/Salon-v0.2.0-arm64.apk`, `Salon-v1.1.0-universal.apk`) از ایندکس git خارج شوند (تاریخچه دست نمی‌خورد)
- [x] A9.2 افزودن بودجهٔ حجم chunk به CI (اسکریپت `monitoring/bundle-size-monitor.py` هست ولی هیچ workflow‌ای صدا نمی‌زند)
- **شاهد:** گام «Bundle size budget» + `monitoring/bundle-thresholds.json`؛ اندازهٔ واقعی بیلد ۲.۹۷MB و بزرگ‌ترین chunk ۳۹۷KB (vendor-mui).
- **معیار:** `git count-objects -v` قبل/بعد؛ job حجم در CI فعال.

---

### A11 تست‌های ماتریس دسترسی مرده بودند → ۳ کرش prod — ✅ کد + تست
- [x] A11.1 بازنویسی `backend/tests/test_permissions.py` روی هارنس واقعی (۲۱ ERROR → ۱۲ تست سبز)
- [x] A11.2 رفع `NameError: UserRole` در `POST /api/v1/reviews` (برای همهٔ کاربران ۵۰۰ بود)
- [x] A11.3 رفع مقایسهٔ رشتهٔ نقش در `GET /api/v1/waitlist/slot/{id}` (ادمین‌ها همیشه ۴۰۳)
- [x] A11.4 رفع `NameError: os` در job پشتیبان‌گیری (بعد از A6 واقعاً اجرا می‌شد)
- [x] A11.5 رفع نشت state بین تست‌ها: سه جدول هرگز truncate نمی‌شد
- **چه شد:** فایل قبلی برای `httpx.AsyncClient` و fixtureهایی نوشته شده بود که در این هارنس وجود
  ندارند (`user_token`, `slot_id`) و assertionها «`in [200, 400]`» بودند؛ یعنی عملاً هیچ رفتاری را
  قفل نمی‌کرد. نسخهٔ جدید ۱۲ تست با کد وضعیت **دقیق** + متن خطاست. سه باگ واقعی بیرون آمد:
  1. `app/api/v1/reviews.py:88` به `UserRole` دست می‌یافت ولی import نشده بود ⇒ هر `POST /reviews`
     با ۵۰۰ می‌افتاد (تمام نظرات فرانت از این مسیر می‌نویسند).
  2. `app/api/v1/waitlist.py:201` نقش را با `["SUPER_ADMIN", "CLUB_ADMIN"]` مقایسه می‌کرد در حالی که
     مقادیر enum کوچک‌اند (`super_admin`) ⇒ `CLUB_ADMIN`/`SUPER_ADMIN` هیچ‌وقت صف انتظار یک سانس را
     نمی‌دیدند. به `UserRole.*` تغییر کرد.
  3. `app/tasks/backup_tasks.py:28` از `os.environ` استفاده می‌کرد بدون `import os` ⇒ job روزانهٔ
     بکاپ (که A6 به beat وصلش کرد) در اولین اجرا می‌_crash_ شد.
  4. `conftest._TABLES_CLEAN_ORDER` سه جدول را جا می‌انداخت: `reviews`, `clubs`,
     `price_competitions`. چون SQLite بعد از truncate idها را از ۱ ادامه می‌دهد، (user, venue)
     یک تست با باقی‌ماندهٔ تست قبلی برخورد می‌کرد و `POST /reviews` پاسخ ۴۰۰ «قبلاً نظر داده‌اید»
     می‌داد — فقط در اجرای کامل فایل، در ایزوله سبز بود. راستی‌آزمایی برنامه‌ای: ۴۸ جدول در
     `SQLModel.metadata` در برابر لیست؛ بعد از رفع `missing: []` و بررسی جهت FK. دو چرخهٔ FK در
     مدل‌ها باقی است که با هیچ ترتیبی حل نمی‌شود (مستند در کامنت): `Contract→Slot`,
     `Slot→PriceCompetition`, `PriceCompetition→Slot`.
- **شاهد:** `python -m pytest tests/test_permissions.py tests/test_waitlist.py -q` →
  **23 passed in 274.76s**؛ `ruff check ... --select F821` روی فایل‌های دست‌خورده → صفر.
- **معیار:** سوئیت کامل بک‌اند بدون خطای import/fixture؛ سه مسیر بالا در prod رفتار درست.

### A10 فساد UTF-8 (mojibake) کامیت‌شده در TeamDuesPanel.tsx — ✅
- [x] A10.1 رفع double-encoding در `src/components/team/TeamDuesPanel.tsx`
- [x] A10.2 اسکن کل `src/**` برای فایل خراب دیگر
- **چه شد:** کل متن‌های فارسی و کامنت‌های این فایل به شکل `Ø­ØµÙ‡â€ŒÙ‡Ø§` کامیت شده بود
  (UTF-8 → cp1252 → UTF-8)؛ یعنی هر کاربری که لیست حصه‌ها را می‌دید برچسب‌های خراب می‌دید
  و حتی در `git show HEAD` هم همین بایت‌ها بود. بازسازی با معکوس زنجیره: برای هر کاراکتر
  `encode('cp1252')` و برای بایت‌های تعریف‌نشده در cp1252 (‎0x81/0x8D/0x8F/0x90) fallback به
  `bytes([ord(ch)])`، سپس `decode('utf-8')`. راستی‌آزمایی: اسکلت ASCII (حذف کاراکترهای غیرASCII)
  قبل و بعد **کاملاً یکسان** ⇒ فقط متن‌ها عوض شده، ساختار کد دست‌نخورده.
- **شاهد:** `skeleton identical: True` روی ۱۹٬۴۲۳ بایت؛ اسکن `src/**` با مارکرهای `(Ø­, Ù‡, ÛŒ, â€Œ)`
  ⇒ `corrupted files: 1` (فقط همین فایل)؛ بعد از رفع، همان اسکن صفر می‌دهد.
- **معیار:** صفحهٔ حصه‌ها روی موبایل برچسب فارسی درست نشان دهد (در گیت‌های tsc/eslint/build پوشش داده شد؛ ⛔ اسکرین راستی‌آزمایی منتظر X6/X1).

---

### A11 تست‌های مردهٔ ماتریس دسترسی + سه کرش prod — ✅ کد + تست
- [x] A11.1 `tests/test_permissions.py` را روی هارنس واقعی زنده کن (۲۱ ERROR → سبز)
- [x] A11.2 رفع باگ‌های پیدا‌شده در مسیرهای واقعی
- [x] A11.3 نشت state بین تست‌ها در `conftest` (جداول فراموش‌شده در truncate)
- **چه شد:** فایل قبلی برای `httpx.AsyncClient` و fixtureهایی نوشته شده بود که وجود ندارند
  (`user_token`, `slot_id`) و assertionهایش «`in [200, 400]`» تقریباً هر رفتاری را قبول می‌کرد؛
  یعنی ماتریس دسترسی عملاً بدون تست بود. بازنویسی با ۱۲ تست دقیق (کد وضعیت واقعی + متن خطا)
  روی `TestClient` + هدر تستی (توکن = شماره تلفن). سه کرش واقعیِ prod بیرون آمد:
  1. `app/api/v1/reviews.py:88` — `UserRole` وارد نشده بود ولی در `if current_user.role != UserRole.USER`
     استفاده می‌شد ⇒ **`POST /api/v1/reviews` برای همهٔ کاربران ۵۰۰** می‌داد (NameError). import اضافه شد.
  2. `app/api/v1/waitlist.py:201` — مقایسه با رشتهٔ بزرگ‌حرف `["SUPER_ADMIN", "CLUB_ADMIN"]` در حالی که
     مقادیر enum کوچک‌اند (`super_admin`/`club_admin`) ⇒ **CLUB_ADMIN و SUPER_ADMIN هرگز** صف انتظار
     یک سانس را نمی‌دیدند (۴۰۳ قطعی). به `UserRole.*` تغییر کرد.
  3. `app/tasks/backup_tasks.py:28` — `os.environ` بدون `import os` ⇒ job پشتیبان‌گیری روزانه روی
     اولین اجرا `NameError` می‌داد (A6 همان job را به beat وصل کرد، پس حالا واقعاً اجرا می‌شود).
  ضمناً `app/api/v1/bookings.py:22` امضای `-> "Venue"` بدون import داشت (رفع شد؛ در runtime بی‌ضرر).
  و **نشت state بین تست‌ها**: `_TABLES_CLEAN_ORDER` در `tests/conftest.py` سه جدول را هرگز truncate
  نمی‌کرد — `reviews`, `clubs`, `price_competitions` — و چون idها بعد از truncate از ۱ شروع می‌شوند،
  (user, venue) تست قبلی با تست بعدی برخورد می‌کرد و `POST /reviews` پاسخ ساختگی ۴۰۰ «قبلاً نظر
  داده‌اید» می‌داد؛ تست در ایزوله سبز و در اجرای کامل فایل می‌سوخت. راستی‌آزمایی برنامه‌ای:
  `SQLModel.metadata` (۴۸ جدول) در برابر لیست → ۳ جدول غایب؛ بعد از رفع `missing: []` و بررسی جهت FK.
  دو چرخهٔ FK واقعی در مدل‌ها باقی است که با ترتیب حل نمی‌شود و در کامنت مستند شد:
  `Contract→Slot`, `Slot→PriceCompetition`, `PriceCompetition→Slot`.
- **شاهد:** `python -m pytest tests/test_permissions.py tests/test_waitlist.py -q` ⇒
  **23 passed in 274.76s** (۱۲ دسترسی + ۱۱ لیست انتظار)؛ اسکریپت پوشش: `models: 48 entries: 48
  dupes: 0 missing: []`؛ `ruff --select F821` روی فایل‌های دست‌خورده صفر.
- **رفتار قفل‌شده:** چک‌این فقط مدیر/ادمین (۴۰۳ با متن «مدیران سالن» برای کاربر عادی)، و **مدیر یک
  سالن دیگر هم ۴۰۰ «دسترسی به این سالن»** می‌گیرد (مالکیت سالن علاوه بر نقش چک می‌شود)؛ QR فقط صاحب
  رزرو؛ صف انتظار سانس فقط مدیر همان سالن + CLUB_ADMIN/SUPER_ADMIN.
- **⛔ راستی‌آزمایی prod:** ثبت نظر واقعی و دیدن صف انتظار توسط ادمین روی salon.absadeghi.ir منتظر
  deploy (X6) و حساب تست (X1).

---

## Track B — شکاف فیچر کوچک (هرکدام ≤ یک وعده)

### B1 افزودن به تقویم (`.ics`) — ادعای ۰٪ که واقعاً غایب است — ✅
- [x] B1.1 تولید Blob با `BEGIN:VEVENT` از شیء رزرو در `frontend/src/utils/calendar.ts`
- [x] B1.2 دکمهٔ «افزودن به تقویم» در صفحهٔ جزئیات رزرو + لیست رزروها
- [x] B1.3 تست واحد روی رشتهٔ تولیدی (فرار ویرگول، زمان، TZID)
- **شاهد:** `frontend/src/utils/calendar.ts` (VTIMEZONE Asia/Tehran، folding ۷۵ octet، DTSTAMP UTC) + ۱۴ تست + دکمهٔ «افزودن به تقویم» در `BookingDetail` و `Bookings`.
- **معیار:** فایل `.ics` دانلود و در Google Calendar باز می‌شود.

### B2 لیدربورد ساختگی را با دادهٔ واقعی عوض کن — ✅
- [x] B2.1 `frontend/src/components/home/GamificationSection.tsx:226` آرایهٔ هاردکد را با endpoint امتیاز/استندینگ (`backend/app/api/v1/teams.py:93`) جایگزین کن
- [x] B2.2 حالت خالی/اسکلتون + مدیریت خطا
- **شاهد:** `GamificationSection.tsx` از `teamService.getStandings(5)` با React Query (اسکلتون/خالی/خطا/CTA مهمان)؛ آرایهٔ هاردکد حذف شد. تأیید تغییر رتبه با نتیجهٔ بازی واقعی ⛔ به دادهٔ پروداکشن نیاز دارد (X1/X6).
- **معیار:** بدون دادهٔ ساختگی؛ تغییر رتبه پس از ثبت نتیجه در بازی واقعی.

### B3 امتیاز وفاداری در چک‌این (استاب «به زودی») — ✅ کد + تست (راستی‌آزمایی UI منتظر deploy: X6/X1)
- [x] B3.1 اتصال `checkin_service.py:99` به `loyalty` (`backend/app/models/loyalty.py:30`)
- [x] B3.2 تست: چک‌این → تراکنش امتیاز، و idempotency (چک‌این دوبار امتیاز دوبار ندهد)
- [x] B3.3 رفع دو باگ تولیدی که مسیر چک‌این را می‌شکستند (در همین حین کشف شد):
  `datetime.utcnow()` ناتز (SQLModel `UTCDateTime` ⇒ `ValueError` روی `UPDATE bookings`) در
  `checkin_service.py`، `waitlist.py:113` و `reminder_tasks.py` (۳ نقطه) — همه به
  `datetime.now(timezone.utc)`؛ و `_send_notification_sync` که با monkey-patch به‌جای
  `staticmethod` نصب شده بود ⇒ `TypeError: got multiple values for argument 'user_id'`
  و در حالت async ⇒ `RuntimeError: Cannot run the event loop while another loop is running`.
  `verify_and_check_in` حالا `async` است و `await NotificationService().send_to_user(...)`
  را صدا می‌زند؛ helper و monkey-patch حذف شدند (تنها فراخوان، endpoint async بود).
- **شاهد:** `tests/test_loyalty.py` → ۳ تست `test_check_in_*` پاس (۳ passed in 0.56s):
  چک‌این ⇒ ۴۵ امتیاز + ردیف دفتر + اعلان با «45 امتیاز» در متن؛ چک‌این دوبار ⇒ ۴۰۰ «قبلاً» و
  `complete_past_bookings() == {"completed": 1, "awarded": 0}` و همچنان یک ردیف؛
  مبلغ کم (۵٬۰۰۰ ریال) ⇒ بدون ردیف و بدون «امتیاز» در پیام.
- **معیار:** در پنل مشتری، موجودی امتیاز بعد از چک‌این تغییر می‌کند. ⛔ راستی‌آزمایی روی پروداکشن (X6/X1).

### B4 حق عضویت خودکار (recurrence) — ✅ کد + مهاجرت + تست
- [x] B4.1 job ماهانهٔ تولید installment برای تیم‌ها (منطق فعلی فقط با POST کاپیتان: `team_service.py:918`)
- [x] B4.2 جریمهٔ دیرکرد + اعلان (از همین موتور نوتیفیکیشن A1)
- [x] B4.3 UI وضعیت «خودکار/دستی» در `TeamDuesPanel.tsx`
- **چه شد:** `Team` پنج فیلد گرفت (`dues_auto`/`dues_amount`/`dues_title`/`dues_day`/`dues_late_fee_pct`)
  با check constraint روی روز ۱..۲۸ و درصد ۰..۱۰۰؛ `TeamDues.penalty_for_id` (FK خودارجاع) ⇒ هر حصه
  حداکثر یک جریمه دارد و جریمه با پرداخت/ابطال اصلِ حصه گم نمی‌شود. مسیر `PUT /teams/{id}/dues/plan`
  (فقط کاپیتان/مدیر، تیم فعال، `DUES_AMOUNT_REQUIRED` وقتی خودکار بدون مبلغ). دو job در
  `app/tasks/team_dues_tasks.py` + beat (`01:30` تولید، `01:45` جریمه). ضدتکرار با برچسب دوره در
  عنوان («… — 2026-04») و `find_duplicate`؛ اگر روز سررسیدِ ماه جاری رد شده باشد دوره بعد ساخته
  می‌شود تا حصه «از بدو تولد معوق» نباشد. جریمه `max(1, round(amount*pct/100))` بعد از
  `TEAM_DUES_LATE_FEE_GRACE_DAYS=3` روز، با اعلان `dues_late_fee` و audit `DUES_LATE_FEE`.
  مهاجرت idempotent: `migrations/versions/m0s019_team_dues_recurrence.py` (down_revision `m0s018bookingcheckin`).
  UI: نوار وضعیت «حق‌عضویت خودکار/دستی» با مبلغ، روز سررسید، درصد جریمه و مهلت، دکمه «ویرایش برنامه»
  برای مدیر و دیالوگ `DuesPlanDialog`؛ ردیف‌های جریمه با برچسب «— جریمه دیرکرد» و تایپ `penalty_for_id`.
- **شاهد:** `backend/tests/test_team_dues_recurrence.py` → **۹ passed in 274.49s** (۴:۳۴): اعتبارسنجی
  پلن (400/422/403 و `dues_plan` در GET جزئیات)، تولید دوره با یک اجرا + ضدتکرار در اجرای دوم
  (`created 0 / skipped 3`)، غلتش به دوره بعد (۲۰ فروردین ⇒ ۵ اردیبهشت؛ ۲۰ دسامبر ⇒ ۵ ژانویه ۲۰۲۷)،
  رد تیم بدون مبلغ/عضو، جریمهٔ ۱۰٪ = ۱۵٬۰۰۰ ریال با `penalty_for_id` درست و صفر در اجرای دوم،
  احترام به مهلت و pct=۰، رد حصه‌های پرداخت‌شده/باطل (۲۰٪ ⇒ ۳۰٬۰۰۰ فقط برای باز)، task سلری + dispatch
  اعلان، و ثبت هر دو job در `beat_schedule`.
- **معیار:** با forward کردن تاریخ در تست، حصه و اعلان تولید می‌شود — ✅ در تست (تاریخ inject می‌شود).
  ⛔ راستی‌آزمایی روی پروداکشن منتظر X6 (deploy بک‌اند + اجرای مهاجرت m0s019) و X1 (اکانت تست).
- **گیت‌های فرانت:** `tsc --noEmit` ⇒ exit 0؛ `eslint` روی چهار فایل تغییریافته ⇒ exit 0؛
  `vite build` ⇒ `✓ built in 23.92s` و chunk مستقل `TeamDuesPanel-BGl77KKp.js` به ۱۵٫۹۷KB (gzip ۵٫۸۱KB).
  (تلاش اول build با `FATAL ERROR: ... out of memory` افتاد — فشار commit charge میزبان، نه کد؛ با heap ۲۵۶۰MB و
  بدون pytest هم‌زمان پاک شد.)

### B5 لیست انتظار: از «اعلان» به «رزرو خودکار» — ✅ کد + تست
- [x] B5.1 پس از پنجرهٔ ۲ ساعته، ساخت رزرو قطعی برای نفر اول (`reminder_tasks.py:134`)
- [x] B5.2 رقابت‌پذیری: lock/retry تا دو نفر هم‌زمان slot نگیرند
- **چه شد:** `WaitlistService.convert_expired(uow, now)` نفر اولِ هر سانسِ بی‌صاحب‌مانده را
  بعد از اتمام پنجره رزرو می‌کند — از همان `BookingService.create_booking` (موتور قیمت سمت سرور،
  سوختن کوپن، hold کردن سانس) و **نه** نوشتن مستقیم ردیف Booking: تأیید مدیر و پرداخت را job
  دور نمی‌زند، پس رزرو در حالت معلق می‌نشیند و اعلان «برای شما رزرو (معلق) شد تا مدیر سالن تأیید
  کند» می‌رود. اگر در آن فاصله سانس گرفته شده باشد ردیف `expired` + اعلان `waitlist_expired`.
  قفل: `SELECT ... FOR UPDATE` روی ردیف + بازرسی وضعیت؛ هر کاندید داخل `SAVEPOINT` خودش
  (خطای یک سانس batch و تراکنش را خراب نمی‌کند). پنجره یک عدد شد: `WaitlistService.window_hours()`
  که `notify_waitlist_on_cancellation` هم از همان می‌خواند (قبلاً `hours=2` تکراری بود).
  job: `app/tasks/waitlist_tasks.py` با beat `convert-expired-waitlist-entries` هر ۱۰ دقیقه.
- **سه باگ پروداکشن که همین‌جا بیرون آمد** (ویژگی اصلاً تست نداشت):
  1. `WaitlistEntry.created_at` با `default_factory=datetime.utcnow` به `UTCDateTime` نوشته می‌شد ⇒
     هر `POST /waitlist/join/{slot}` خطای `Datetime values must have timezone information` می‌داد (۵۰۰).
     اثبات: تست رگرسیون روی همان endpoint قبل از fix ⇒ FAILED، بعد ⇒ پاس.
  2. `from sqlmodel import joinedload` در `/waitlist/my` و `/waitlist/slot/{id}` — `joinedload` در
     sqlmodel وجود ندارد ⇒ `ImportError` و ۵۰۰ برای هر دو. (اصلاح: `sqlalchemy.orm`.)
  3. مدل `WaitlistEntry` هیچ رابطه‌ای نداشت درحالی‌که هر دو endpoint `WaitlistEntry.slot/user` را
     joinedload می‌کنند ⇒ relationship های `slot`/`user` اضافه شد.
  4. (بهداشت تست) `WaitlistEntry` در `_TABLES_CLEAN_ORDER` بودکه نبود ⇒ ردیف‌های تست‌های قبلی
     نشت می‌کردند و موقعیت‌ها را اشتباه می‌کردند.
- **شاهد:** `backend/tests/test_waitlist.py` → **۱۱ passed in 82.74s** — شامل تبدیل پس از پنجره
  (`{"candidates":1,"booked":1,"expired":0}`، سانس دوباره BOOKED، نفر دوم هنوز pending)، صبر تا
  پایان پنجره + ضدتکرار (اجرای دوم `candidates 0`)، `expired` وقتی سانس رزرو قطعی دیگری دارد،
  **همزمانی دو worker ⇒ دقیقاً یک `booked`** (الگوی `test_games_concurrency.py`)، تسک سلری
  (`notified: 1`) و ثبت entry در `beat_schedule`.
- **معیار:** تست همزمانی (مثل `test_games_concurrency.py`) — ✅. ⛔ روی پروداکشن منتظر X6 (deploy)
  و X2/X1 (FCM/اکانت تست) تا چرخهٔ واقعی لغو ⇒ اعلان ⇒ تبدیل دیده شود.

### B6 فیلدهای ناقص discover/CRM — ✅
- [x] B6.1 افزودن فلگ‌های بیننده به پاسخ `TeamDiscover` (`frontend/src/pages/teams/TeamDiscover.tsx:4`)
- [x] B6.2 افزودن شمارش رضایت‌ها به `CampaignsTab` (`frontend/src/components/crm/CampaignsTab.tsx:3-4`)
- **شاهد:** `TeamService.discover` پرچم‌های بیننده را با ۳ کوئری گروهی می‌دهد (تست ثابت‌بودن تعداد کوئری، N+1ِ نام کاپیتان را هم بیرون کشید و رفع شد)؛ `/crm/stats` شمارش `consent_count`/`no_consent_count`/`consent_by_segment` را منتشر می‌کند و `CampaignsTab` «قابل‌ارسال» را پیش از ارسال نشان می‌دهد؛ `Profile` وضعیت رضایت را از `GET /crm/consent` می‌خواند (کامنت «بک‌اند GET ندارد» غلط بود و حذف شد).
- **معیار:** کامنت‌های «backend omits…» از فایل‌ها حذف شوند.

### B7 دادهٔ ساختگی که کاربر واقعی می‌بیند — 🟡 (جزئیات و لیست کامل: D14)
- [x] B7.1 شمارش بازدید اخبار، تعداد لایک اینستاگرام، تعداد فالوور و `date` ساختگی ('۱۴۰۲') حذف شد
- [ ] B7.2 آمار بازاریابی hero/Stats — منتظر تصمیم (X8)
- **شاهد:** `services/sportsApi.ts` (فیلد `views` از `NewsItem` بیرون رفت؛ `Math.random()` در mapping Varzesh3 حذف)، `pages/Home.tsx:1032` (نمایش بازدید)، `components/home/SocialMediaSection.tsx` (حذف `followers`/`ink` و ۶ کارت لایک تصادفی). آنچه از `Math.random()` در src مانده **۳ مورد و همه تولید شناسه** است (idempotency key در `finance/StatementDialog.tsx:186` و `finance/TransactionEntryDialog.tsx:45`، `lib/utils.ts:138`) — هیچ‌کدام عددِ نمایشی نیست.
- **معیار:** هیچ عدد کاربرمحور از `Math.random()` یا هاردکد نیاید.

---

## Track C — فیچرهای بزرگ (MVP برش‌خورده؛ هر برش مستقل قابل انتشار)

### C1 نقش مربی (P004 — واقعاً غایب)
- [x] C1.1 افزودن `COACH` به `UserRole` (`backend/app/models/user.py:7-11`) + مهاجرت + ماتریس مجوزها
- [x] C1.2 مدل `CoachSession` (مربی، شاگرد، زمان، وضعیت، شهریه)
- [x] C1.3 endpointهای CRUD + ثبت حضور و غیاب
- [x] C1.4 `CoachDashboard` فرانت (لیست جلسات امروز، ثبت حضور سریع)
- [x] C1.5 مسیر روت + ورودی ناوبری + نقش‌محور بودن
- [x] C1.6 بستن حفرهٔ تشدید نقش در `/auth/register` + endpoint تخصیص نقش (`PUT /admin/users/{id}/role`) + UI آن در پنل کاربران
- **شاهد (۲۰۲۶-۱۰-۱۶، همه اجراشده):**
  - بک‌اند: `pytest tests/test_coach.py` → **۲۷ passed in 19.88s**؛ رگرسیون کامل `pytest` → **۴۲۲ passed, 32 warnings in 801.67s (0:13:21)**؛ دروازۀ lint `flake8 app/ --count --select=E9,F63,F7,F82` → **۰** (۳۵ خطای F821 از پیش موجود با `if TYPE_CHECKING` بسته شد)؛ زنجیرۀ alembic تک‌سر `m0s021coachesessions` با upgrade→downgrade→upgrade بررسی شد و `app.openapi()['paths']` = **۲۱۳** مسیر از جمله **۶** مسیر `/coach/*`.
  - فرانت: `tsc --noEmit` پاک، `eslint --quiet` با کد خروج ۰، `vitest run` → **۴۸ passed / 7 files** (۱۱ مورد جدید: `services/coach.test.ts` ۴ + `pages/coach/CoachDashboard.test.tsx` ۷).
  - نقش‌گیت در UI: `/coach` پشت `<ProtectedRoute requiredRole="coach">`؛ ۷ اتحاد نقش (`types/user.ts:1`, `store/authStore.ts:10`, `components/auth/ProtectedRoute.tsx:9`, `services/admin.ts:8`, `services/auth.ts:8` و `:24`, `pages/auth/Register.tsx:27`) گسترش یافت؛ ریدایرکت ورود در `pages/auth/Login.tsx:70`؛ ورودی‌های ناوبری: `Navbar.tsx` (navItem + منوی آواتار + برچسب نقش)، `BottomNavigation.tsx:44` (۵ آیتم)، `Profile.tsx` «مرور سریع»؛ `/coach` به `HIDDEN_PREFIXES` اضافه شد تا نوار پایین روی پنل سایه نیندازد.
- **معیار:** با حساب مربی روی دستگاه، جلسه بساز/حضور ثبت کن/تقویم ببین. — **نیمه‌موفق:** صحت عملکردی روی دادهٔ واقعی در تست‌های بک‌اند و واحد فرانت اثبات شده، اما اجرای دستی روی دستگاه هنوز ممکن نیست (X1: حساب مربی روی پروداکشن + X6: اجرای مهاجرت `m0s021` روی سرور؛ هر دو منتظر تأیید صریح کاربر).

### C2 تورنمنت و براکت (P005) — ✅ کد + تست (راستی‌آزمایی prod منتظر X6)
- [x] C2.1 مدل‌های `Tournament`, `TournamentRound`, `TournamentMatch`, `TournamentParticipant`
- [x] C2.2 موتور قرعه‌کشی Single-Elimination (توان دو بعدی + seed + bye) + تست‌های ویژگی (برنده به
      دیدار بعد می‌رود، byeها در همان قرعه‌کشی تعیین تکلیف می‌شوند)
- [x] C2.3 API: ساخت، بازکردن ثبت‌نام، ثبت‌نام/حذف تیم، قرعه‌کشی، ثبت نتیجه، لغو، براکت، رده‌بندی
- [x] C2.4 UI براکت بصری (CSS grid، RTL-safe) + جدول رده‌بندی + مسیر روت و ورودی‌های ناوبری
- [ ] C2.5 برش‌های بعدی: Double-Elimination، Round-Robin (فقط یک مقدار در `TournamentFormat`)
- **شاهد (۲۰۲۶-۱۰-۱۶، همه اجراشده):**
  - بک‌اند: `pytest tests/test_tournament.py` → **۳۰ passed** (تست معیار:
    `test_eight_teams_run_to_champion_without_manual_help` — `[۴,۲,۱]` دیدار در سه مرحله،
    ۷ دیدار بازی‌شده تا قهرمان، رتبه‌ها `[۱,۲,۳,۳]`، replay پس از اتمام ⇒ ۴۰۰)؛ رگرسیون کامل
    `pytest` → **۴۵۲ passed in 97.79s** (۴۲۲ قبل + ۳۰ جدید؛ اجرای همزمان با build تحت بار ۷۰۴s شد).
  - دروازۀ lint: `flake8` روی این ماشین دیگر نصب نیست (`No module named flake8`) ⇒ معادل
    `E9,F63,F7,F82` با **ruff 0.8.4** (`--select E9,F82` روی `app/ tests/ migrations/`) اجرا شد و
    **یک F821 واقعی** را بیرون داد: `app/models/tournament.py:116` ارجاع forward به `Team` بدون
    import ⇒ با بلوک `if TYPE_CHECKING` (الگوی `app/models/competition.py:6`) بسته شد و اکنون
    `All checks passed!`.
  - قرارداد API: `app.openapi()['paths']` = **۲۲۴** که **۱۰ مسیر / ۱۱ عملیات** آن `/tournaments*`
    است (`app/api/v1/tournament.py`)؛ ثبت نتیجه روی `PUT /tournaments/matches/{id}/result` است نه
    زیرمسیر تورنمنت، چون پاسخ دیدار `tournament_id` ندارد.
  - مهاجرت: `migrations/versions/m0s022_tournaments.py` با چرخهٔ upgrade→downgrade→upgrade روی یک
    DB تازه ⇒ `current = m0s022tournaments (head)`، **۱۷ ایندکس**، self-FK `next_match_id` و هر دو
    unique constraint (`uq_tournament_participant_tournament_team`,
    `uq_tournament_match_round_position`) ساخته شدند و downgrade چیزی باقی نگذاشت. ستون‌های enum
    با **NAME** persist می‌شوند (اندازه‌گیری شد)، پس `server_default`ها بزرگ‌نویس‌اند.
  - فرانت: `tsc --noEmit` exit 0 · `eslint --quiet` exit 0 · `vitest run` → **۶۸ passed / ۱۰ فایل**
    (۲۰ مورد جدید: `services/tournament.test.ts` ۶، `pages/tournaments/Tournaments.test.tsx` ۶،
    `pages/tournaments/TournamentDetail.test.tsx` ۸) · `vite build` ⇒ `✓ built in 20.14s`،
    `dist/assets/*.map` = **۰**، دو chunk جدید `Tournaments-*.js` و `TournamentDetail-*.js`.
  - دسترسی: روت‌های lazy `/tournaments` و `/tournaments/:id` پشت `ProtectedRoute` (در `App.tsx`)؛
    ورودی‌ها: `Navbar.tsx` navItem + منوی آواتار، «مرور سریع» `Profile.tsx`، `quickActions` در
    `Dashboard.tsx`. نوار پایین عمداً تغییر نکرد (سقف ۵ آیتم؛ تورنمنت از منوی آواتار باز می‌شود).
- **معیار:** تورنمنت ۸ تیمی از ثبت‌نام تا قهرمان بدون دخالت دستی. — **محقق‌شده در تست** (۷ دیدار،
  پیشروی خودکار برنده با `next_match_id`/`next_slot`). **روی prod هنوز اجرا نشده:** مهاجرت `m0s022`
  باید روی سرور run شود (X6 = نیازمند تأیید صریح کاربر) و دامنهٔ `api.salon.absadeghi.ir` از این
  ماشین resolve نمی‌شود (`curl` ⇒ exit 6)، پس راستی‌آزمایی زندهٔ UI/HTTP مسدود است.

### C3 شیفت پرسنل (P020) — ✅ کد + تست (راستی‌آزمایی prod منتظر X6)
- [x] C3.1 مدل `StaffShift` + تشخیص تعارض
- [x] C3.2 API + UI هفتگی drag-free (نسخهٔ فرمی)
- **شاهد (۲۰۲۶-۱۰-۱۶، همه اجراشده):**
  - بک‌اند: `pytest tests/test_shifts.py` → **۲۱ passed در 1.24s**؛ رگرسیون کامل `pytest` →
    **۴۷۳ passed در 106.88s** (۴۵۲ قبل + ۲۱ جدید)؛ دروازۀ `ruff check app/ tests/ migrations/
    --select E9,F82` → `All checks passed!`
  - قرارداد API: `app.openapi()['paths']` = **۲۲۹** که **۵ مسیر / ۶ عملیات** آن `/shifts*` است
    (`GET /shifts`، `GET /shifts/summary`، `GET /shifts/export`، `POST /shifts`،
    `PUT /shifts/{id}`، `POST /shifts/{id}/cancel`). فیلترهای بازه با **alias** `from`/`to`
    می‌خوانده می‌شوند (نام پایتونشان `date_from`/`date_to` است).
  - قاعدۀ تعارض (تست‌شده): کلید روی **شخص** است نه سالن — `overlapping()` بدون فیلتر `venue_id`
    و فقط وضعیت‌های ≠ `cancelled`؛ مجاورت مجاز (`starts_at < ends_at AND ends_at > starts_at`)،
    کف/سقف مدت **۱۵ دقیقه تا ۱۲ ساعت**، و شیفتِ عبورکننده از نیمه‌شب هم گرفته می‌شود. دو تست
    مرز را ثابت می‌کنند: `test_overlap_across_two_venues_is_rejected` (ارسال دوم از مدیر سالن B
    ⇒ ۴۰۰ با متن «تعارض شیفت»، چون دروازۀ هر سالن جداست ولی تعارض سراسری) و
    `test_reception_staff_without_staff_manage_gets_403` / `test_plain_user_without_staff_code_gets_403`
    (کد `staff.manage` لازم است؛ `test_branch_manager_staff_can_plan_shifts` سبز بودنش را).
  - مهاجرت: `migrations/versions/m0s023_staff_shifts.py` (تک‌سر روی `m0s022tournaments`) با چرخهٔ
    upgrade→downgrade→upgrade روی DB تازه ⇒ `current = m0s023staffshifts (head)`،
    **۱۰ ستون** (`status VARCHAR(9)` — enum با NAME persist می‌شود)، **۵ ایندکس**، **۳ FK**
    (`venues`, `users` برای `user_id`, `users` برای `created_by`) و downgrade چیزی باقی نگذاشت.
    عمداً **FK به `staff_assignments` ندارد** تا تاریخچۀ شیفت با حذف انتصاب نمیرد (در docstring
    مدل توضیح داده شده).
  - ممیزی: تنها `shift.export` در `SecurityAuditEvent` ثبت می‌شود (خروج داده از سیستم) — همان
    رویۀ کنسول مالی؛ تست `test_export_is_audited` با `select(SecurityAuditEvent)` شمارش می‌کند.
  - فرانت: `tsc --noEmit` exit 0 · `eslint --quiet` exit 0 · `vitest run` → **۸۵ passed / ۱۲ فایل**
    (۱۷ مورد جدید: `services/shift.test.ts` ۵، `pages/manager/shifts/ManagerShifts.test.tsx` ۱۲) ·
    `vite build` ⇒ `✓ built in 19.60s`، `dist/assets/*.map` = **۰**، chunk جدید
    `ManagerShifts-*.js`.
  - UI: `pages/manager/shifts/ManagerShifts.tsx` — جدول شنبه‌محور (۷ روز × پرسنل فعال)،
    سلول/چیپ/دکمه با `data-testid` (`shift-cell-{user}-{day}`، `shift-chip-{id}`،
    `shift-add-{user}-{day}`)، دیالوگ فرمی (بدون drag&drop)، KPI ساعت کاری (لغوشده‌ها خارج)،
    انتخاب ماه + «خروجی CSV ماهانه» (`downloadBlob`). **چرا رشته‌برش به‌جای `new Date`:**
    بک‌اند `+03:30` می‌فرستد؛ تبدیل محلیِ دستگاه شیفت ۰۰:۳۰ تهران را به روز قبل می‌انداخت —
    تست `puts the shift on the Tehran wall-clock day, not the UTC one` همین را قفل می‌کند.
  - خروج CSV: هدر فارسی + BOM (`\ufeff`) و `Content-Disposition: attachment`؛ `month` با
    الگوی `^\d{4}-\d{2}$` (خلاف ⇒ ۴۲۲ — تست‌شده). انحراف آگاهانۀ از هدر انگلیسیِ کنسول مالی:
    مخاطب این فایل مدیر سالن است.
  - دسترسی: روت lazy `/manager/shifts` پشت `ProtectedRoute requiredRole="venue_manager" allowStaff`؛
    ورودی‌ها: `Navbar.tsx` navItem (مدیر و کارمند) + منوی آواتار، tile «شیفت پرسنل» در
    `ManagerDashboard.tsx`. دامنهٔ سالن‌ها از `useManagedVenues()` و فیلتر `staff.manage`؛
    دروازۀ واقعی روی بک‌اند است (فرانت فقط ناوبری را باز/بسته می‌کند). نوار پایین عمداً تغییر
    نکرد (سقف ۵ آیتم).
- **معیار:** تعارض شیفت رد می‌شود؛ خروجی ماهانه قابل خروج. — **محقق‌شده در تست** (تعارض ⇒ ۴۰۰ با
  متن فارسی و باز ماندن پنجره پس از لغو؛ خروجی ⇒ blob با BOM و هدر فارسی). **روی prod هنوز اجرا
  نشده:** مهاجرت `m0s023` باید روی سرور run شود (X6 = نیازمند تأیید صریح کاربر) و دامنهٔ
  `api.salon.absadeghi.ir` از این ماشین resolve نمی‌شود (`curl` ⇒ exit 6).

### C4 حریف‌یابی هوشمند (P010 — بخشی هست)
- [ ] C4.1 امتیاز تطبیق بر پایهٔ رتبه/سطح/منطقه/زمان در `team_service.py:269`
- [ ] C4.2 «چالش بازی» با پذیرش/رد طرفین (روی endpoint بازی‌های موجود)
- **معیار:** دو تیم با سطح نزدیک، هم را پیشنهاد می‌گیرند و چالش ثبت می‌شود.

### C5 قیمت‌گذاری بر پایهٔ تقاضا (P008 — موتور قوانین هست)
- [ ] C5.1 جمع‌آوری سیگنال نرخ اشغال per slot-hour (بدون ML)
- [ ] C5.2 پیشنهاد قیمت از روی تاریخچه + سقف/کف ایمن
- [ ] C5.3 ⛔ ML واقعی: نیاز به دادهٔ ۱۲ ماهه (مسدود ذاتی)

---

## Track D — UI/دسترس‌پذیری/موبایل (P015، P016)

> **وضعیت ۲۰۲۶-۱۰-۱۶: کل Track D بسته شد** — هم با شمارش گرپی روی ۲۲۸ فایل `src/**.tsx` و هم با
> **axe-core ۴.x روی مرورگر واقعی** (headless Edge + CDP، viewport 1280×900، ۶ مسیر عمومی).
> الگوی مرجع که نباید خراب شود: `components/mobile/TimeSlot.tsx:56-97` (دکمهٔ واقعی +
> `aria-pressed` + `minHeight:64` + وضعیت متنی)، `components/ui/Button.tsx:9,51` (حلقهٔ focus-visible
> + `disabled||loading`)، `styles/globals.css:160-214` (پچ‌های RTL منطقی + reduced-motion)،
> `index.html:2` (`lang="fa" dir="rtl"`)، `components/auth/Login.tsx:189-216` (خطا با helperText).
> **اهم:** سه معیار از ممیزی اولیه *خودِ معیار* غلط بود و در بخش «معیارهای اصلاح‌شده» پایین همین
> Track اصلاح شده است؛ یک باگ تولیدی واقعی (عنوان صفحهٔ سالن در دسکتاپ نامرئی) از همین مسیر بیرون آمد.

### D1 سانس‌ها را به دکمهٔ واقعی تبدیل کن (بحرانی‌ترین؛ مسیر پول) — ✅
- [x] D1.1 `components/booking/TimeSlotPicker.tsx:276` — `<Paper onClick>` بدون `role`/`tabIndex`/`onKeyDown` → `component="button"` + `aria-pressed` + `disabled` واقعی
- [x] D1.2 الگو از `components/mobile/TimeSlot.tsx:56-67` برگردانده شد: `<button aria-pressed disabled>`
- **شاهد (اسکن brace-aware، نه گرپ ساده):** تنها ۲ `<Paper … onClick` در کل src باقی است و **هر دو `component="button"`** هستند (`layout/NotificationPanel.tsx:194`، `pages/bookings/BookingDetail.tsx:438`) ⇒ صفر هدف کلیکی غیردکمه‌ای. `aria-pressed`: ۱۲ فایل / ۱۵ استفاده.
- **معیار:** ✅ هر دو شرط؛ کیبورد: سانس با Tab+Enter انتخاب می‌شود و سانس پر `disabled` است.

### D2 دیالوگ‌های بی‌نام — ✅
- [x] D2.1 `components/ui/Dialog.tsx:41` — تولید خودکار `aria-labelledby`/`aria-label`
- [x] D2.2 همهٔ فراخوانی‌های `<Dialog>` بدون عنوان تکمیل شد (PaymentDialog، MembershipPurchaseDialog، CouponDialog، ManagerDashboard، SplitPaymentsPanel:214، TeamDuesPanel:590، Competitions:375، Contracts:180، TeamDetail:394، VenueDetail:1182)
- **شاهد:** اسکن صحیح تگ‌ها (با 깊이 `{}` — نسخهٔ اولِ اسکریپت من به‌خاطر `=>` داخل `onClose` برچیدگی می‌داد و ۶ مورد **مثبت کاذب** نشان می‌داد): **۰ `<Dialog>` بدون `title=`/`aria-label`**.
- **معیار:** ✅ صفر؛ در صفحه‌خوان هر دیالوگ با نام فارسی اعلام می‌شود.

### D3 دکمه‌های فقط-آیکون بی‌نام و تودرتوهای غلط — ✅
- [x] D3.1 `aria-label` (+ `aria-pressed` برای toggle) به crm/CustomersTab، crm/StaffTab، deals/PricingBreakdown، game/PaymentSection، competition/CompetitionBidDialog
- [x] D3.2 `mobile/MobileHeader.tsx:65-82` — `<IconButton>` داخل `<Link>` → `Link component={Button}`
- [x] D3.3 `layout/Navbar.tsx` + `NotificationPanel.tsx` — شمار `<Badge>` داخل `aria-label` رفت (قبلاً با `aria-hidden` از AT پنهان بود)
- **شاهد:** اسکن brace-aware ⇒ **۰ `IconButton` بدون `aria-label`/`title` و بدون فرزند متنی**.
- **معیار:** ✅ صفر.

### D4 فیلدهای فقط-placeholder و Selectهای بی‌نام — ✅
- [x] D4.1 هر ۱۸ کنترل فهرست‌شده (`SplitPaymentDialog:214,245`, `CustomersTab:116`, `CampaignsTab:129,137`, `StaffTab:192,439`, `ReviewSection:169`, `TeamChatPanel:145`, `admin/Users:125`, …) `label` یا `aria-label` گرفت
- [x] D4.2 `<Rating>`ها: موارد MUI (`ReviewSection.tsx:139,174,293`, `VenueDetail.tsx:762`) ⇒ `readOnly` (یا editableِ نام‌دار) + `name` + `aria-label` + `getLabelText` فارسی («۴ از ۵ ستاره»؛ دیگر «Star» انگلیسی اعلام نمی‌شود)
- **ادعای ممیزی که با کد نمی‌خواند:** `venue/VenueCard.tsx:82` و `pages/Search.tsx:305` از MUI Rating استفاده **نمی‌کنند**؛ `import Rating from '@/components/mobile/Rating'` است — یک نمایش فشرده (`★ ۴٫۸ (۱۲۰)`) با **صفر رادیوی پنهان**. راستی‌آزمایی DOM روی `/venues`: `document.querySelectorAll('.MuiRating-root').length === 0`. با این حال برچسب‌نامه داشتند (آیکون `aria-hidden` است و صفحه‌خوان فقط «۴.۸» می‌شنود) ⇒ `components/mobile/Rating.tsx` الان `role="img"` + `aria-label` فارسی کامل می‌دهد؛ شاهد DOM: `امتیاز ۵.۰ از ۵، ۱ نظر` / `امتیازی ثبت نشده`.
- **شاهد:** ۰ `TextField`/`Select` با `placeholder` و بدون نام.
- **معیار:** ✅ صفر.

### D5 بازخورد زنده برای صفحه‌خوان — ✅
- [x] D5.1 `role="status"` در `ui/Loading.tsx` + `aria-busy` روی نواحی async (`NotificationPanel`, `SlotWeekGrid`, …)
- [x] D5.2 `role="alert"` برای خطاهای دستی (DealPublishDialog، CouponDialog، PricingRuleDialog، TeamDuesPanel ×2)
- [x] D5.3 `hooks/useToast.ts` — آیکون‌های ✅/❌/ℹ️ `aria-hidden` + متن معنادار
- **شاهد (شمارش واقعی):** `role="alert"` ۵ فایل / ۶ استفاده · `role="status"` ۳/۳ · `aria-busy` ۳ فایل / ۴ استفاده · `aria-hidden="true"` ۲۶ فایل / ۴۵ استفاده. (معیار اصلی «≥۸ و اکنون ۰» درست است که از ۰ به >۰ رسیده.)
- **معیار:** ✅.

### D6 کنتراست و رنگِ تنها-حساس به معنا — ✅ (معیار D6.2 اصلاح شد)
- [x] D6.1 `theme/index.ts:264` — `text.disabled` در هر دو مود override شد: `#64748b` (روشن) / `#94a3b8` (تیره) ⇒ روی سطحِ هر مود **≥۴.۵:۱** (مثل‌های سنجیده‌شده با فرمول WCAG: ۶.۲۴ / ۸.۲۶ / ۱۲.۸۴).
- [x] D6.2 هگزهای دورزدنِ توکن **در نقش رنگ متن** از داخل `sx={{…}}` پاک شد؛ آنچه مانده یا **آیکون** است (`style={{…}}` — گرافیک ۳:۱ می‌خواهد) یا **ورودیِ نگاشت لایه** (`statusColorToken` / `useStatusColor` / `statusPairOf` / `StatusChip` / `KpiCard` که این هگزها را به توکن سمانتیکِ آگاه‌از‌مود تبدیل می‌کنند). شمارش فعلی: `color:'#059669'` ۱۸، `color:'#d97706'` ۲۸، `color:'#ef4444'` ۱۷ — **همه بیرون از `sx`**.
- [x] D6.3 وضعیت فقط-رنگی (نقطهٔ خوانده‌نشده، `crm/shared`، `FilterBottomSheet`، `SlotWeekGrid`) → متن/آیکون اضافه شد.
- [x] D6.4 `outline:'none'` → **۰ استفاده** در کل src.
- **⚠ معیارِ باطل:** `grep "color: '#059669'" src` = 0 هیچ‌وقت معیار درستی نبود (مطابق بند بالا) و جای آن را **گاردریل CI** گرفت: اسکریپت پایتونی داخل `web-tests.yml` که فقط داخل بدنهٔ `sx={{…}}` را با پیمایش عمقِ آکولاد می‌خواند و همین سه هگز را ممنوع می‌کند. شواهد: اجرای محلی روی کد تمیز ⇒ `exit 0`؛ با یک فایل مصبوب `src/__a11y_negative_fixture.tsx` ⇒ `exit 1` (فایل بعد از تست پاک شد).
- **معیار:** ✅ گاردریل CI + صفر نقض کنتراست axe (پایین: D12).

### D7 targets لمسی در جدول مدیر — ✅
- [x] D7.1 `manager/SlotWeekGrid.tsx:255-274` — سلول سانس به ≥۴۴px + نقش دکمه‌ای رسید
- [x] D7.2 `pages/dashboard/ManagerDashboard.tsx:2149,2160` — دکمه‌های `minHeight:32` → ۴۴
- **شاهد:** `grep -rn "minHeight: *(2[0-9]|3[0-9])\b" src` ⇒ **۰**. (به‌طور جداگانه ~۷۰ عنصر در ۱۰ صفحه روی دستگاه با اندازه‌گیری واقعی CDP تنظیم شد — سند «UI touch target optimization».)
- **معیار:** ✅.

### D8 حرکت با احترام به reduced-motion — ✅ (معیار اصلاح شد)
- [x] D8.1 کاهش حرکت **سراسری** است، نه per-file: `<MotionConfig reducedMotion="user">` در `App.tsx:281` (روی کل درخت Framer Motion) + بلوک `@media (prefers-reduced-motion: reduce)` در `styles/globals.css` (CSS animations/transtions).
- [x] D8.2 `home/FAQSection.tsx` — ارتفاع انیمیت‌شده → `opacity`/`transform`.
- **⚠ معیارِ باطل:** `grep -rn useReducedMotion src` ≥ ۴ هرگز درست نبود؛ پیاده‌سازی از `MotionConfig` استفاده می‌کند و `useReducedMotion` در کد **صفر** است و صفر هم باید بماند. گاردریل CI روی `prefers-reduced-motion` (≥۱) نشسته است.
- **معیار:** ✅ رفتار + گاردریل.

### D9 RTL ستونِ دوم (افق و شیولرون) — ✅
- [x] D9.1 `ui/PersianDatePicker.tsx` — جهت شیولرون‌های «ماه/سال قبل و بعد» با convention بصریِ `manager/SlotWeekGrid.tsx:190,196` و `mobile/DateSelector.tsx:42,101` هم‌راستا شد
- [x] D9.2 طرف‌های فیزیکی `ml/mr/pl/pr/left:/right:` در چیدمان → `ms/me/ps/pe/insetInline*`
- [x] D9.3 `styles/globals.css` — الگوی `overflow-x: clip` (به‌جای پوشاندن با `hidden`)؛ نگاه: [[rtl-offcanvas-overflow-shift]]
- **شاهد:** صفر `ml:/mr:/pl:/pr:` داخل `sx` باقی مانده. ۱۵ تطبیقِ باقی‌مانده در ۸ فایل **همه غیرجهت‌دار** و دسته‌بندی‌شده‌اند: ۸ × مارجین/محور چارت recharts (`finance/FinanceDashboardTab.tsx:276,310,336,416`)، ۱ × پیکربندی رنگ چارت (`game/ParticipantList.tsx:30`)، ۲ × مرکزکردن متقارن `left:'50%'` (`home/HeroSection.tsx:97`، `venues/VenueDetail.tsx:1124`)، ۱ × نقطهٔ پروgress با `calc()` (`home/HowItWorksSection.tsx:140`)، ۱ × بلور تزئینی `left:-30` (`pages/Home.tsx:615`)، ۱ × CSS چاپ (`pages/contracts/ContractDetail.tsx:328`).
- **معیار:** ✅ صفر طرف جهت‌دارِ چیدمانی؛ بقیه مستند.

### D10 سیمای عنوان و جدول — ✅ (ادعای D10.2 باطل شد)
- [x] D10.1 `pages/Home.tsx` یک `<h1>` واقعی + ریشهٔ `<main>` دارد (`HeroSection.tsx:28`؛ `main` در `:21`)؛ صفحات ورود/ثبت‌نام/بازیابی رمز هم ریشهٔ `<main>` گرفتند؛ صفحهٔ 404 در `App.tsx` عنصر عنوانی گرفت.
- [x] D10.2 **ادعای «۴۸ Typography به `<div>` رندر می‌شود» غلط است**: `node_modules/@mui/material/Typography/Typography.js:102,141` نگاشت `h1..h6 → h1..h6` را دارد. مشکل واقعی **سطح غلط** بود و رفع شد: واژه‌نشان Navbar از `h6` → `component="span"` (سرفصل نبود)، عنوان‌های قیمت (`VenueDetail.tsx:870,957,1077`) → `component="div"`، عنوان کارت سالن → `h2`، «امکانات»/«درباره سالن»/«نظرات کاربران»/«اطلاعات تماس» → `h2`/`h3`، بنر FinalCTA → `h2`.
- [x] D10.3 جداول: `scope="col"` در **۱۸ فایل / ۹۶ استفاده**؛ هر ۲۰ `<Table>` در src یا `<caption>` یا `aria-label` دارند (اسکن ⇒ صفر جدول بی‌نام)؛ `mobile/Skeletons.tsx` با `aria-hidden`.
- **معیار:** ✅axe: `heading-order` صفر در ۶ مسیر؛ `landmark-one-main`/`region` صفر؛ `scope="col"` > ۰.

### D11 کلیک‌باکس‌های div-محور و disclosureها — ✅
- [x] D11.1 هدف‌های کلیکی `Box/Paper/Typography` → `component="button"`/`component={Link}` (نمونه: `pages/Home.tsx:770` کارت‌های «اخیراً دیده‌شده» حالا `component="button" type="button"`)
- [x] D11.2 disclosureها (`PricingBreakdown`, `TeamBalancePanel`, `ContractAuditTimeline`, `FAQSection`) → `aria-expanded`/Accordion
- [x] D11.3 `pages/games/GamesExplore.tsx` — `aria-pressed` روی خود Chip
- **شاهد:** `aria-expanded` ۵ فایل / ۵ استفاده · `aria-pressed` ۱۲/۱۵ · صفر `role="button"` ساختگی روی wrapper با تودگلی Chip.
- **معیار:** ✅.

### D12 راستی‌آزمایی ماشین‌محور — ✅
- [x] D12.1 اجرای **axe-core ۴.10.3** (تزریق در صفحهٔ زنده) روی ۶ مسیر عمومی: `/` (home)، `/venues`، `/venues/1`، `/login`، `/register`، `/search` — با Edge هدلس + CDP، viewport 1280×900، `Page.bringToFront` (بی آن، انیمیشن ورود Frumer `opacity:0` می‌ماند و نتیجه باطل است) و انتظار ۱۲s برای روت‌های lazy.
- [x] D12.2 گیت CI در `.github/workflows/web-tests.yml` (step «Accessibility guardrails») — شمارش‌های D5/D6/D10/D11 + ممنوعیت `outline:'none'` + جداول بی‌نام + **گاردریل تازهٔ کنتراست متن**.
- **نتیجهٔ نهایی (پس از رفع‌ها):**

  | مسیر | نقض | نود | گدشتهای axe | کنتراست «incomplete» |
  |---|---|---|---|---|
  | `/` home | ۰ | ۰ | ۴۴ | ۹۲ |
  | `/venues` | ۰ | ۰ | ۴۱ | ۱۵ |
  | `/venues/1` | ۰ | ۰ | ۴۲ | ۵ |
  | `/login` | ۰ | ۰ | ۳۱ | ۶ |
  | `/register` | ۰ | ۰ | ۲۷ | ۳ |
  | `/search` | ۰ | ۰ | ۳۹ | ۴ |

  مسیر پیمایش‌شده: از **۱۸ نامزد کنتراست** (پیش‌تر) و **۱۱ نود نقض** در این راند ← **۰**. «incomplete» یعنی axe رنگ پس‌زمینه را پشت **گرادیان/تصویر** تشخیص نمی‌دهد (نه شکست)؛ آن‌ها با نمونه‌برداری پیکسل سنجیده شدند (پایین).
- **معیار:** ✅ بدون نقض Critical/Serious؛ step در workflow فعال و محلی سبز.

### D13 (نو، از همین Track بیرون آمد) — باگ تولیدی: عنوان صفحهٔ سالن در دسکتاپ نامرئی — ✅
- **چه بود:** در `pages/venues/VenueDetail.tsx` تصویر hero داخل جعبهٔ `position:relative; height:400; overflow:hidden` در **جریان عادی** رندر می‌شد (`height:100%`)؛ هر overlay هم‌جریان (عنوان/برچسب/آدرس) به زیر جعبه و پشت `overflow:hidden` می‌رفت → متن در layout وجود داشت اما **دییده نمی‌شد** (دسکتاپ ۱۲۸۰px).
- **اثبات قبل از رفع:** `document.elementFromPoint(cx, cy)` روی مرکز عنوان → `IMG`؛ بعد از رفع (`sx={{ position:'absolute', inset:0 }}` در `LoadSafeImage` و باکس جایگزین) → `H1.MuiTypography-root` و `getBoundingClientRect` عنوان y=396 داخل hero 97..497.
- **درس هارنس:** «walk کردن والدین برای کنتراست» نمی‌تواند **overlay خواهر** (`position:absolute; inset:0` کنار متن) را ببیند ⇒ مثبت کاذب؛ تصمیم نهایی با **نمونه‌برداری پیکسل** از JPEG بریده‌شده است (۳ نود `/venues/1` با این روش پاک شدند).

### D14 (نو) — دادهٔ ساختگیِ کاربرمحور — 🟡 نصفه؛ تصمیم کاربر (X8)
- [x] D14.1 شمارش بازدید اخبار (`views: Math.floor(Math.random()*20000)+5000`) از `services/sportsApi.ts` و نمایشش از `pages/Home.tsx:1032` حذف شد (فیلد `views` از `interface NewsItem` هم بیرون رفت)؛ `date` ساختگی `'۱۴۰۲'` → `''`.
- [x] D14.2 «لایک» تصادفی گالری اینستاگرام (`Math.floor(Math.random()*500+100)`) و شمارندهٔ فالوور `followers`/`ink` از `components/home/SocialMediaSection.tsx` حذف شد (۶ کادر خالیِ placeholder هم رفت).
- [ ] D14.3 **تصمیم کاربر (X8):** آمار بازاریابی `components/home/HeroSection.tsx:15-20` (`+۱۲٬۰۰۰ بازیکن فعال`, `+۵۰ زمین`, `+۳۰۰ مسابقه هفتگی`, `۴.۸ امتیاز`) و شمارنده‌های `StatsSection` همچنان ساختگی‌اند — endpoint واقعی برای هیچ‌کدام وجود ندارد (تنها `/reviews/venue/{id}/summary` هست). یا باید از سرور بیاید یا از صفحه برداشته شود.
- **معیار:** صفحه‌ای که کاربر عدد می‌بیند یا دادهٔ واقعی دارد یا هیچ.

### معیارهای اصلاح‌شده (چیزی که ممیزی ۲۰۲۶-۱۰-۱۶ اشتباه اندازه می‌گرفت)
| معیار اصلی | چرا باطل بود | جانشین قابل‌اجرا |
|---|---|---|
| `grep color:'#059669'` = ۰ | آیکون‌ها (۳:۱) و ورودی‌های نگاشت‌لایه را هم می‌شمرد | گاردریل CI با پیمایش `sx={{}}` (عمق آکولاد) |
| `useReducedMotion` ≥ ۴ | کاهش حرکت سراسری با `MotionConfig reducedMotion="user"` است (`App.tsx:281`) | شمارش `prefers-reduced-motion` در CSS ≥ ۱ |
| «Typography `variant="h1..h6"` بدون `component=` → `<div>`» | MUI این variantها را به عنصر عنوان واقعی نگاشت می‌کند (`Typography.js:102,141`) | راستی‌آزمایی axe `heading-order`/`page-has-heading-one` |

### درس‌های هارنس (تا دوباره عدد ساختگی گزارش نشود)
`Page.bringToFront` قبل از axe (ورودی Frumer否则 `opacity:0`) · ۱۲s انتظار برای روت lazy (با ۹s فقط ۷ pass گرفته شد و نتیجه باطل بود: `landmark-one-main` نادرست گزارش شد) · نرمال‌سازی کنتراست با `c/255` قبل از تابع انتقال sRGB · آستانهٔ luminance برای عبور ۴.۵:۱ در برابر سفید ≤ ۰.۱۸۳۳ · لایه‌های گرادیانی و تصویر در axe «incomplete»اند نه fail ⇒ نمونه‌برداری پیکسل · لنگر برش با `data-a11y` · کنتراست نمی‌تواند overlay خواهر را ببیند · پایپ‌لاین Node را با `pnpm exec` محلی بسنج (این‌جا `eslint` با `pnpm exec` exit 127 می‌دهد؛ `pnpm run lint` درست است) · ذخیرهٔ `html`/`failureSummary` در خروجی axe وگرنه تشخیص نود غیرممکن است.

---

### گیت‌های این راند (شاهد زنده، ۲۰۲۶-۱۰-۱۶)
| گیت | نتیجه |
|---|---|
| `pnpm exec tsc --noEmit` | exit **0** |
| `pnpm run lint` (`eslint src --ext ts,tsx --quiet`) | exit **0**، بدون خروجی |
| `pnpm test` (vitest v2.1.9) | **37 passed** در ۵ فایل (l10n 6 · venueMedia 9 · calendar 14 · notification 4 · VenueCard 4) — 8.83s |
| `pnpm run build` | `✓ built in 53.06s`؛ `dist/assets/*.map` **وجود ندارد** (A2)؛ بزرگ‌ترین chunk: `vendor-mui 406.81 kB` (gzip 119.97) |

---

## موارد مسدود (تصمیم/دسترسی بیرونی — نباید جلوی بقیه را بگیرد)

| # | مورد | چرا مسدود | چه‌کسی باید بدهد |
|---|---|---|---|
| X1 | حساب تست برای E2E (۴ spec لاگین‌محور) | نبود fixture/رمز تست | کاربر |
| X2 | اعتبارنامه Firebase/FCM با پکیج درست | بیرونی | کاربر |
| X3 | تأیید پر بودن `KEYSTORE_*` در GitHub Secrets | فقط با اجرای tag-release مشخص می‌شود | کاربر/CI |
| X4 | قرارداد درگاه پرداخت و سرویس SMS | اداری | کاربر |
| X5 | حذف APKهای ۸۹MB از تاریخچه git | بازگشت‌ناپذیر | کاربر |
| X6 | مستقر کردن تغییرات بک‌اند روی سرور prod | روی سرویس زنده؛ نیاز به تأیید صریح | کاربر |
| X7 | دادهٔ تاریخی ۱۲ ماهه برای ML قیمت | ذاتاً زمان‌بر | — |
| X8 | عدد‌های بازاریابی صفحهٔ اصلی (`HeroSection.tsx:15-20`: +۱۲٬۰۰۰ بازیکن، +۵۰ زمین، +۳۰۰ مسابقه، ۴.۸) و شمارنده‌های `StatsSection` ساختگی‌اند؛ endpoint واقعی وجود ندارد | یا از سرور باید بیاید یا از صفحه برود — تصمیم محصول | کاربر |
