# فایل تسک اجرای FINAL_REVIEW (breakdown ریز، قابل پیگیری)

**به‌روز شده:** ۲۰۲۶-۱۰-۱۶ (راند ۹ — C2.6 فرمت دو-حذفی) — بر پایهٔ ممیزی شواهدی (هر مورد یک `file:line` معتبر دارد)
**وضعیت راند ۹:** C2.6 ✅ کد + تست (بک‌اند **۶۱۳ passed در ۱۰۸.۸۰s** از ۶۱ تست جدید دو-حذفی، فرانت
**۱۴۸ passed در ۱۷ فایل** از ۱۱ تست جدید، `tsc` ۰ · `eslint` ۰ · build ✓ ۲۸.۵۷s بدون `.map` ·
دروازۀ ruff `E9,F82` پاک · **۲۳۷** مسیر OpenAPI (بدون endpoint تازه — همان ۱۰ مسیر `/tournaments*`) ·
مهاجرت `m0s026` روی **SQLite و PostgreSQL واقعی** چرخۀ up/down/up را گذراند و مسیر کامل دو-حذفی
(۵ تیم تا قهرمان) روی همان PG اجرا شد).
**وضعیت راند ۷:** C5.1 + C5.2 ✅ کد + تست (بک‌اند **۵۲۷ passed در ۱۰۶.۴۱s** از ۱۶ تست جدید insight، فرانت
**۱۳۲ passed در ۱۷ فایل** از ۲۱ تست جدید، `tsc` ۰ · `eslint` ۰ · build ✓ ۲۲.۶۰s بدون `.map` ·
دروازۀ ruff `E9,F82` پاک · **۲۳۷** مسیر OpenAPI با ۲ مسیر فقط‌خواندنی `/pricing/{occupancy,suggestion}` ·
**بدون مهاجرت**: هیچ جدول تازه‌ای ساخته نشد، سیگنال از `Booking`/`Slot` موجود خوانده می‌شود.
**وضعیت راند ۶:** C4 ✅ کد + تست (بک‌اند **۵۱۱ passed در ۱۰۲.۱۱s** از ۳۸ تست جدید matchmaking، فرانت
**۱۱۱ passed در ۱۵ فایل** از ۲۶ تست جدید، `tsc` ۰ · `eslint` ۰ · build ✓ ۳۱.۱۸s بدون `.map` ·
دروازۀ ruff `E9,F82` پاک · **۲۳۵** مسیر OpenAPI با ۶ مسیر `/matching*` · مهاجرت `m0s024` چرخهٔ
up/down/up را سالم گذراند).
**وضعیت راند ۵:** C3 ✅ کد + تست (بک‌اند **۴۷۳ passed در ۱۰۶.۸۸s** از ۲۱ تست جدید شیفت، فرانت
**۸۵ passed در ۱۲ فایل** از ۱۷ تست جدید، `tsc` ۰ · `eslint` ۰ · build ✓ ۱۹.۶۰s بدون `.map` ·
دروازۀ ruff `E9,F82` پاک · **۲۲۹** مسیر OpenAPI با ۵ مسیر `/shifts*` · مهاجرت `m0s023` چرخهٔ
up/down/up را سالم گذراند).
**وضعیت راند ۴:** C2 ✅ کد + تست (بک‌اند **۴۵۲ passed در ۹۷.۷۹s**، فرانت **۶۸ passed در ۱۰ فایل**،
`tsc` ۰ · `eslint` ۰ · build ✓ ۲۰.۱۴s بدون `.map` · دروازۀ ruff `E9,F82` پاک · ۲۲۴ مسیر OpenAPI).
**وضعیت راند ۳:** Track A ✅ (جز A9.1=X5) · Track B ✅ (جز B7.2=X8) · **Track D ✅ کامل** — axe-core روی
۶ مسیر عمومی: **۰ نود نقض**؛ گیت‌ها: `tsc` ۰ · `eslint` ۰ · ۳۷ تست vitest · build ✓ ۵۳.۰۶s بدون `.map`.
باقی‌مانده فقط موارد وابسته به تصمیم/دسترسی: C5.3 (ML واقعی = مسدود ذاتی) و X1–X8. برش‌های C2.5/C2.6
ساخته شدند (لیگ و دو-حذفی).
**قانون:** هیچ تسکی بدون «معیار راستی‌آزمایی» بسته نمی‌شود. `✅` = انجام و راستی‌آزمایی‌شده، `🟡` = کد نوشته، در انتظار CI/راستی‌آزمایی، `⛔` = مسدود (تصمیم کاربر/دسترسی بیرونی).

### گیت‌های راند ۹ (C2.6 — شاهد زنده، ۲۰۲۶-۱۰-۱۶)
| گیت | نتیجه |
|---|---|
| `pytest tests/test_tournament_double_elim.py` | **۶۱ passed** |
| `pytest tests/test_tournament_double_elim.py tests/test_tournament_round_robin.py tests/test_tournament.py` | **۱۱۶ passed** در 11.34s (۶۱ + ۲۵ + ۳۰؛ هر سه فرمت با هم سبز) |
| `pytest` (رگرسیون کامل بک‌اند) | **۶۱۳ passed** در 108.80s (۵۵۲ قبل + ۶۱) |
| `ruff check app/ tests/ migrations/ --select E9,F82` | `All checks passed!` |
| `tests/test_backend_hardening.py` (زنجیرۀ کامل alembic تا `base`، SQLite) | **۷ passed** در 19.74s |
| `app.openapi()['paths']` | **۲۳۷** (تغییر نکرد) — `TournamentFormat.enum` = `['single_elimination','round_robin','double_elimination']` |
| مهاجرت SQLite | `m0s026doubleelim` با up/down/up و زنجیرۀ `downgrade base` (با `batch_alter_table`) exit 0 |
| مهاجرت PostgreSQL واقعی | `pgserver`: up→downgrade −1→up هر سه **exit 0**؛ `CREATE TYPE tournamentbracket` |
| `tsc --noEmit` / `eslint --quiet` | exit **0** / exit **0** |
| `vitest run` | **۱۴۸ passed در ۱۷ فایل** (۱۱ جدید: جزئیات ۹ + فهرست ۲) |
| `vite build` | `✓ built in 28.57s`، `dist/assets/*.map` = **۰** |
| `curl` دامنهٔ prod | resolve نمی‌شود ⇒ راستی‌آزمایی زنده مسدود، منتظر X6 |

### گیت‌های راند ۷ (C5 — شاهد زنده، ۲۰۲۶-۱۰-۱۶)
| گیت | نتیجه |
|---|---|
| `pytest tests/test_pricing_insight.py` | **۱۶ passed** در 1.06s |
| `pytest` (رگرسیون کامل بک‌اند) | **۵۲۷ passed** در 106.41s (۵۱۱ قبل + ۱۶) |
| `ruff check app/ tests/ migrations/ --select E9,F82` | `All checks passed!` |
| `app.openapi()['paths']` | **۲۳۷** (۲۳۵ قبل) — ۲ مسیر تازه زیر `/api/v1/pricing*` |
| مهاجرت | لازم نبود — جدول تازه‌ای ساخته نشد |
| `tsc --noEmit` / `eslint --quiet` | exit **0** / exit **0** |
| `vitest run` | **۱۳۲ passed در ۱۷ فایل** (۲۱ جدید: پنل ۱۶ + service ۵) |
| `vite build` | `✓ built in 22.60s`، `dist/assets/*.map` = **۰** |
| `curl` دامنهٔ prod | exit **6** (resolve نمی‌شود) ⇒ راستی‌آزمایی زنده مسدود، منتظر X6 |

### گیت‌های راند ۶ (C4 — شاهد زنده، ۲۰۲۶-۱۰-۱۶)
| گیت | نتیجه |
|---|---|
| `pytest tests/test_matchmaking.py` | **۳۸ passed** در 2.17s |
| `pytest` (رگرسیون کامل بک‌اند) | **۵۱۱ passed** در 102.11s (۴۷۳ قبل + ۳۸) |
| `ruff check app/ tests/ migrations/ --select E9,F82` | `All checks passed!` |
| `app.openapi()['paths']` | **۲۳۵** (۲۲۹ قبل) — **۶ مسیر / ۷ عملیات** زیر `/api/v1/matching*` |
| alembic up→down→upgrade (SQLite موقت) | `current = m0s024teamchallenges (head)`، exit 0 هر سه مرحله |
| `tsc --noEmit` / `eslint --quiet` | exit **0** / exit **0** |
| `vitest run` | **۱۱۱ passed در ۱۵ فایل** (۲۶ جدید: service ۶ + دو پنل ۱۰/۱۰) |
| `vite build` | `✓ built in 31.18s`، `dist/assets/*.map` = **۰** |
| `curl` دامنهٔ prod | exit **6** (resolve نمی‌شود) ⇒ راستی‌آزمایی زنده مسدود، منتظر X6 |

---

## وضعیت ادعاهای FINAL_REVIEW (چیزی که ممیزی نشان داد)

| ادعای سند | واقعیت کد |
|---|---|
| پرداخت تقسیم‌شده ۰٪ | **ساخته شده** — مدل+API+UI (`backend/app/models/split_payment.py:44`, `frontend/src/components/split-payment/SplitPaymentsPanel.tsx`) |
| قیمت‌گذاری پویا ۰٪ | **موتور قوانین سمت سرور** (`backend/app/services/pricing_service.py:95`) **+ سیگنال تقاضا و پیشنهاد قیمت** (`backend/app/services/pricing_insight_service.py:73` — راند ۷)؛ forecast/ML هنوز غایب است و عمداً ساخته نشد |
| اعلان‌های دستی | **۹ job زمان‌بندی‌شده** (`backend/app/tasks/worker.py:27-75`) |
| CI بدون امضا | **امضا در workflow سیم‌کشی شده** (`.github/workflows/build-all-platforms.yml:79-100,211-250`)؛ اگر secret نباشد فقط warning |
| CORS باز و ناامن | `*` نیست؛ مشکل واقعی: `allow_methods/headers="*"` با `credentials=True` |
| rate limit فقط auth | گاردِ سطح-endpoint روی **۵** روتر از **۳۳** (`auth`, `bookings`, `contracts`, `games`, `payments`)؛ مشکل واقعی: **۲۸ روتر فقط تحت middleware سراسری + fail-open** (شمارش ۲۰۲۶-۱۰-۱۶، مسیرهای تازهٔ C5 هم در همین دسته‌اند) |
| CSP ندارد | در بک‌اند هست؛ مشکل واقعی: **nginx برای SPA هدری نمی‌فرستد** + `unsafe-inline` |
| bundle بهینه نشده | ۳۶ روت lazy + ۷ manualChunks؛ مشکل واقعی: **sourcemap در prod منتشر می‌شود** |
| «۴۸ `Typography variant="h1..h6"` بدون `component=` به `<div>` رندر می‌شود» (D10.2) | **غلط** — MUI این variantها را به عنصر عنوان نگاشت می‌کند (`node_modules/@mui/material/Typography/Typography.js:102,141`)؛ نقص واقعی **سطحِ غلط سرفصل** بود (axe `heading-order`) |
| `useReducedMotion` ≥ ۴ (D8.1) | **معیار باطل** — کاهش حرکت سراسری با `<MotionConfig reducedMotion="user">` در `App.tsx:281` + `@media (prefers-reduced-motion)` در CSS پیاده شده؛ شمارش `useReducedMotion` باید صفر بماند |
| `grep "color:'#059669'"` = ۰ (D6.2) | **معیار باطل** — آیکون‌ها (۳:۱) و ورودی‌های نگاشتِ توکن را هم می‌شمرد؛ جانشین: گاردریل CI با پیمایش بدنهٔ `sx={{…}}` |
| صفحهٔ سالن سالم است | **باگ تولیدی** در دسکتاپ: عنوان/برچسب/آدرس سالن پشت `overflow:hidden` و تصویرِ هم‌جریان **نامرئی** بود (D13؛ با `elementFromPoint` ثابت شد) |

**۵ مورد عملاً غایب (وضعیت ۲۰۲۶-۱۰-۱۶):** تقویم `.ics` ساخته شد (B1)، نقش مربی کامل شد (C1)،
تورنمنت/براکت تک‌حذفی ساخته شد (C2)، شیفت پرسنل ساخته شد (C3)، حریف‌یابی هوشمند + چالش بازی
ساخته شد (C4) و **تحلیل تقاضا + پیشنهاد قیمت چسبیده به موتور ساخته شد (C5.1/C5.2 — بک‌اند ۱۶ تست
+ فرانت ۲۱ تست؛ رگرسیون ۵۲۷ تست بک‌اند و ۱۳۲ تست فرانت سبز)**.
باقی‌ماندۀ واقعی فقط C5.3 است — و C5.3 (ML واقعی) **مسدود ذاتی** است: دادهٔ ۱۲ ماهه در این سامانه
وجود ندارد، پس عددِ مدل در این مرحله فقط ساختگی می‌شد. (C2.5 لیگ و C2.6 دو-حذفی در راندهای ۸ و ۹ ساخته شدند.)
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
- [x] C2.5 برش‌های بعدی: Round-Robin (لیگ همه‌با‌همه) — پایین را ببین
- [x] C2.6 Double-Elimination (دو-حذفی) — راند ۹، پایین را ببین
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

#### C2.5 فرمت Round-Robin (لیگِ همه‌با‌همه) — راند ۸ — ✅ کد + تست (راستی‌آزمایی prod منتظر X6)
- [x] C2.5a موتور: `round_robin_weeks` (روش دایره: `arr[0]` ثابت، بقیه چرخش، `None` = استراحت)،
      `_draw_round_robin` (برنامهٔ هفته‌ها + bye)، `_settle_league` و `_league_table`
      (امتیاز ۳/۱/۰ → تفاضل → گل زده → `team_id` فقط برای پایداری رندر) در
      `app/services/tournament_service.py`
- [x] C2.5b تست: `tests/test_tournament_round_robin.py` (ویژگی + سرویس + API)
- [x] C2.5c UI: انتخاب فرمت در دیالوگ ساخت، برچسب فرمت روی کارت و هدر، رندر «برنامهٔ هفته‌ها» با
      چیپ تیمِ استراحت‌کرده، تساوی مجاز فقط در لیگ، جدول امتیازها با رتبهٔ مشترک و یادداشت پلی‌آف،
      KPI «صدر جدول»
- [x] C2.5d مهاجرت `m0s025_tournament_round_robin.py`: `ALTER TYPE tournamentformat ADD VALUE
      IF NOT EXISTS 'ROUND_ROBIN'` داخل `autocommit_block()` روی PostgreSQL؛ روی SQLite بی‌اثر
      (ستون `VARCHAR(18)` بدون CHECK است — از `sqlite_master` خوانده شد)
- **شاهد (۲۰۲۶-۱۰-۱۶، همه اجراشده):**
  - بک‌اند: `pytest tests/test_tournament_round_robin.py` → **۲۵ passed در 1.48s**؛
    `pytest tests/test_tournament_round_robin.py tests/test_tournament.py` → **۵۵ passed در 3.28s**؛
    رگرسیون کامل `pytest` → **۵۵۲ passed در 106.70s** (۵۲۷ قبل + ۲۵ جدید، exit 0 روی SQLite).
    تست‌های معیار: جفت‌ها دقیقاً `N(N−1)/2` و یکتا برای `N=2..9`، هیچ تیمی در یک هفته دو بار نیست؛
    هفته‌ها `N−1` (زوج) / `N` (فرد)؛ هر تیم دقیقاً یک بار استراحت (فرد) / هیچ (زوج)؛ تساوی در لیگ
    `winner_team_id=None` و `completed` می‌کند ولی در حذفی همچنان **۴۰۰** با «مساوی»؛ ترتیب
    `(۴امتیاز، +۲، ۵گل)` قبل از `(۴امتیاز، +۲، ۳گل)`؛ `[۱,۱,۳,۳]` ⇒ هر دو `tied=True` و قهرمان
    **ساخته نمی‌شود**؛ پایان تورنمنت فقط وقتی `sum(played) == 2*(N−1)` (بیتنِ آخر بازی‌شده).
  - راستی‌آزمایی روی **PostgreSQL واقعی** (نه فقط SQLite): با `pgserver` (PostgreSQL ۱۸ محلی) چرخۀ
    `alembic upgrade head` → `downgrade -1` → `upgrade head` هر سه **exit 0**، برچسب‌های نوع
    `tournamentformat` = `['SINGLE_ELIMINATION', 'ROUND_ROBIN']` و یک ردیف با
    `format='ROUND_ROBIN'` در ستونی با `data_type='USER-DEFINED'` persist شد (کری.کوئری مستقیم).
  - **مسیر کامل لیگ روی همان PG واقعی** (`~/.qoder-tmp/pg_league.py`، چون `tests/conftest.py:18`
    خودِ pytest را به SQLite می‌چسباند و ستون enum بومی هرگز دیده نمی‌شود): ساخت ← بازکردن ثبت‌نام ←
    ۴ تیم ← قرعه ⇒ `WEEKS: ['هفته ۱','هفته ۲','هفته ۳']`, `MATCHES: 6`, همه `ready`؛ ثبت ۶ نتیجه
    (یکی تساوی ۱−۱) ⇒ `STANDINGS: [(1,'تیم PG1',9,0),(2,'تیم PG3',4,1),(3,'تیم PG4',3,0),(4,'تیم PG2',1,1)]`
    و `TOURNAMENT: completed / winner: تیم PG1`؛ بازخوانی با SQL خام ⇒ `('USER-DEFINED','tournamentformat')`
    و `PERSISTED ROW: ('ROUND_ROBIN','COMPLETED')` و `DB WEEKS` همان نام‌های فارسی. خروجی `PG-LEAGUE-OK`.
  - فرانت: `pnpm exec tsc --noEmit -p tsconfig.app.json` exit **0** · `npm run lint` exit **0** ·
    `pnpm exec vitest run src/pages/tournaments` → **۱۹ passed در ۲ فایل** (۱۳ جزئیات + ۶ فهرست) ·
    رگرسیون کامل `vitest run` → **۱۳۷ passed / ۱۷ فایل** · `NODE_OPTIONS=--max-old-space-size=3072 npm run build`
    ⇒ `✓ built in 38.57s`، بدون `dist/assets/*.map`.
  - گاردریل‌های CI (بازتولید محلی از `web-tests.yml`): جداول بدون `aria-label` **۰/۲۴** (قبل از این
    راند **۳** خطا می‌داد)، `sx` با هگز کم‌کنتراست **۰**، فایل‌های دارای `scope="col"` **۲۰** (آستانه ۱۸).
  - آیکون‌های جدید (`mdi:table-check`, `mdi:sofa-single`) روی iconify با HTTP **۲۰۰** بررسی شدند.
- **تصمیم‌های صادقانه (نه حدس):** رتبهٔ مشترک همان‌طور نمایش داده می‌شود (`* + یادداشت پلی‌آف`) و
  قهرمان اختراع نمی‌شود؛ `leagueLeader` تنها وقتی نام می‌دهد که رتبهٔ ۱ یکتا باشد، وگرنه
  `مشترک`/`—`؛ تیم استراحت‌کرده از همان دیدارهای هفته خوانده می‌شود (`bye_team_name`) نه شمارش مجدد؛
  جدول لیگ وسطِ راه باز است (status `drawn/in_progress/completed`) چون برای حذفی بی‌معناست ⇒ آنجا
  فقط پس از `completed` خوانده می‌شود.
- **معیار:** یک تورنمنت لیگی از ثبت‌نام تا جدول نهایی بدون دخالت دستی، با تساوی‌های واقعی.
  **مسدود:** اجرای `m0s025` روی prod (X6) و راستی‌آزمایی زنده در مرورگر (دامنه resolve نمی‌شود) ⇒
  شواهد این راند در سطح تست واحد/jsdom + SQL واقعی است، نه E2E روی سرویس زنده.

#### C2.6 فرمت Double-Elimination (دو-حذفی) — راند ۹ — ✅ کد + تست (راستی‌آزمایی prod منتظر X6)
- [x] C2.6a موتور: `losers_bracket_plan` (قیفِ بازندگان: survivors×newcomers با `_interleave`،
      باقیماندۀ فرد به مرحلۀ بعد منتقل می‌شود، دیدارهای دُمِ براکت هم برنامه‌ریزی می‌شوند)،
      `_draw_double_elimination` (براکت برندگان با bye مرحلهٔ اول + نیمه‌ها روی
      `tournament_rounds.bracket` + `number` سراسری)، `_wire`/`_advance_loser`
      (`loser_next_match_id`/`loser_next_slot`) و `_double_elim_ranks` در
      `app/services/tournament_service.py`
- [x] C2.6b تست: `tests/test_tournament_double_elim.py` (ویژگی + ساختار + API)
- [x] C2.6c UI: گزینهٔ «دو-حذفی» در دیالوگ ساخت، دو براکت جدا (برندگان+فینالِ بزرگ / بازندگان)،
      یادداشت صریح «بدون bracket reset»، پیام‌های نیمه‌به‌پیامِ نیمه (دیالوگ + توست)، KPI و
      رده‌بندی سه‌رتبه‌ای
- [x] C2.6d مهاجرت `migrations/versions/m0s026_double_elimination.py`: سه برچسبِ `tournamentformat`
      + نوع بومی `tournamentbracket` + ستون‌های `bracket`، `loser_next_match_id`، `loser_next_slot`
      و ایندکس `ix_tournament_matches_loser_next_match_id`
- **شاهد (۲۰۲۶-۱۰-۱۶، همه اجراشده):**
  - بک‌اند: `pytest tests/test_tournament_double_elim.py` → **۶۱ passed**؛ سه‌گانۀ تورنمنت
    (دو-حذفی + لیگ + تک‌حذفی) → **۱۱۶ passed در 11.34s**؛ رگرسیون کامل `pytest` →
    **۶۱۳ passed در 108.80s** (۵۵۲ قبل + ۶۱)؛ `ruff check app/ tests/ migrations/ --select E9,F82`
    → `All checks passed!`؛ `tests/test_backend_hardening.py` (زنجیرۀ کامل alembic تا `base`) →
    **۷ passed در 19.74s**.
  - تست‌های معیار: `losers_bracket_plan` برای `N=2..16` ⇒ تعداد دیدارهای براکتِ بازندگان دقیقاً
    `N−2`، جمع دیدارهای بازی‌شده `2N−2`، هر feeder دقیقاً یک بار مصرف می‌شود، survivor =
    `("l", len(plan), 1)`؛ ساختار ⇒ نیمه‌ها با برچسب‌های `BRACKET_WINNERS/LOSERS/GRAND_FINAL`،
    `number`ها یکتا و صعودی، لینکِ بازنده روی دیدارهای non-bye هست و روی bye‌ها نیست، فینالِ بزرگ
    **تنها نقطۀ پایانی** است (`next_match_id IS NULL`)؛ API ⇒ درایور «تا قهرمان» برای `N=4` که
    **پیش از هر ثبت نتیجه assert می‌کند هر دو تیم کمتر از ۲ باخت دارند** (معیار اصلی دو-حذفی)،
    `len(played) == 2N−2`، رتبه‌ها `[۱,۲,۳]`، و برای `N=6` راستی‌آزمایی اینکه بازنده واقعاً در
    اسلات `loser_next_match_id` نشسته است؛ تساوی همچنان **۴۰۰** با «مساوی».
  - **باگ واقعی که همین تست‌ها بیرون آوردند (رفع شد):** `_set_target` نام ستون را با f-string
    می‌ساخت (`f"{outcome}_next_match_id"`)، ولی ستون برنده روی مدل `next_match_id` است نه
    `winner_next_match_id` ⇒ هر قرعه‌کشیِ دو-حذفی با `ValueError: "TournamentMatch" object has no
    field "winner_next_match_id"` می‌مرد. نگاشت اکنون صریح است و کامنتِ همان‌جا نامِ غلط را
    ممنوع می‌کند (`backend/app/services/tournament_service.py`).
  - مهاجرت — سه راستی‌آزمایی اندازه‌گیری‌شده (نه حدس): ① `op.add_column` با `sa.Enum` **تازۀ** نوع
    بومی PG نمی‌سازد ⇒ `CREATE TYPE tournamentbracket AS ENUM ('WINNERS','LOSERS','GRAND_FINAL')`
    صریح و idempotent + `create_type=False` (خطای واقعی pass دومِ up/down/up بود).
    ② SQLite `DROP COLUMN` ستونی را که در FK سطح جدول شرکت دارد رد می‌کند
    (`unknown column "loser_next_match_id" in foreign key definition`) ⇒ downgrade با
    `batch_alter_table(..., recreate="always")`. ③ `d4j004baseline` جدول‌های تورنمنت را از
    `SQLModel.metadata.create_all` می‌سازد، پس روی زنجیرۀ تازه ستون و self-FK از خودِ مدل می‌آیند و
    `add_column` بی‌اثر است؛ چرخۀ down/up روی PG آن FK را افتاد ⇒ `op.create_foreign_key` با گاردِ
    بازتابی اضافه شد (نام FK قبل/بعد از چرخه خوانده و مقایسه شد).
    `DOUBLE_ELIMINATION` هم دقیقاً ۱۸ کاراکتر است ⇒ همان `VARCHAR(18)` SQLite جا می‌دهد و بازسازی
    جدول لازم نشد.
  - **PostgreSQL واقعی** (`~/.qoder-tmp/pg_double_elim.py` با `pgserver`؛ pytest به SQLite می‌چسبد
    پس ستون enum بومی آنجا هرگز دیده نمی‌شود): چرخۀ `upgrade head → downgrade -1 → upgrade head`
    هر سه **exit 0**؛ مسیر کامل ۵ تیم تا قهرمان ⇒ `ROWS 11` (`(B−1)+(N−2)+1`)، `PLAYED 8` = `2N−2`،
    `LOSSES [2,2,2,2]` (قهرمان بدون باخت)، `HALVES {'winners':3,'losers':3,'grand_final':1}`،
    `STANDINGS [1 قهرمان / 2 نایب‌قهرمان / 3 نهاییِ بازندگان]`، `TERMINALS 1`؛ SQL خام ⇒
    `BRACKET COLUMN TYPE ('USER-DEFINED','tournamentbracket')`، `PERSISTED 'DOUBLE_ELIMINATION'`،
    برچسب‌ها `['SINGLE_ELIMINATION','ROUND_ROBIN','DOUBLE_ELIMINATION']`، self-FK
    `fk_tournament_matches_loser_next_match`؛ تساوی ⇒ ۴۰۰ با «مساوی». خروجی `PG-DOUBLE-ELIM-OK`.
  - فرانت: `pnpm exec tsc --noEmit -p tsconfig.app.json` exit **0** · `npm run lint` exit **0** ·
    `vitest run src/pages/tournaments` → **۳۰ passed در ۲ فایل** (۲۲ جزئیات + ۸ فهرست) ·
    رگرسیون کامل `vitest run` → **۱۴۸ passed / ۱۷ فایل** (۱۱ تست جدید دو-حذفی) ·
    `NODE_OPTIONS=--max-old-space-size=3072 npm run build` ⇒ `✓ built in 28.57s`،
    `dist/assets/*.map` = **۰**، chunk‌های `Tournaments-*.js` و `TournamentDetail-*.js`.
  - گاردریل‌های CI (بازتولید محلی): جداول بدون `aria-label` **۰/۲۴** · فایل‌های دارای `scope="col"`
    **۲۰** (آستانه ۱۸) · آیکون تازهٔ `mdi:arrow-down-bold-circle-outline` روی iconify HTTP **۲۰۰**.
  - API قرارداد: **۲۳۷** مسیر OpenAPI (تازهای اضافه نشد — همان ۱۰ مسیر `/tournaments*`)، ولی
    `TournamentFormat.enum` در schema اکنون سه‌عضوی است: `['single_elimination','round_robin','double_elimination']`.
  - تست‌های UI: دو grid (`tournament-bracket` = برندگان+فینالِ بزرگ با ۳ دیدار و
    `tournament-losers-bracket` = ۲ دیدار)، `double-elim-note` («دومین باخت» + «bracket reset»)،
    دیالوگ/توستِ نیمه‌به‌نیمه («فقط یک باخت دارد» در برندگان، «دومین باختش … حذف» در بازندگان،
    «برنده قهرمان می‌شود» در فینالِ بزرگ)، رد تساوی در هر دو نیمه، رده‌بندی سه‌رتبه‌ای، یادداشت
    `2N−2` پیش از قرعه‌کشی، و اینکه **تک‌حذفی هیچ براکتِ بازندگانی نمی‌گیرد**.
- **تصمیم‌های صادقانه (نه حدس):** **bracket reset عمداً نیست** — فینالِ بزرگ یک دیدار است و همان
  جمله در سه جا نوشته شده (hintِ دیالوگ ساخت، یادداشت بالای براکتِ بازندگان، و تست)؛ دیدار دوم
  بعد از قرعه‌کشی ساخته می‌شد و «تک‌منبعِ ساختار» را می‌شکست. رده‌بندی دو-حذفی فقط **سه** رتبه
  می‌دهد (قهرمان/نایب/نهاییِ بازندگان) و رتبه‌های حذف‌شده اختراع نمی‌شود. `standingsEnabled` برای
  دو-حذفی مثل تک‌حذفی فقط پس از `completed` باز می‌شود. تفکیک نیمه‌ها از `round.bracket` با
  پیش‌فرض `winners` است، پس رندر تک‌حذفی و لیگ ذره‌ای عوض نشده (تستِ «تک‌حذفی براکت بازنده ندارد»
  همین را قفل می‌کند). «حذف شد» فقط در نیمهٔ بازندگان گفته می‌شود — از خودِ داده خوانده می‌شود،
  نه از فرضِ فرمت. **یک دامِ jsdom که تست‌ها خوردند:** MUI Modal هنگام باز بودن دیالوگ روی محتوا
  `aria-hidden` می‌گذارد، پس دو دیالوگِ پشت‌سرهم در یک تست با `getByRole('button')` پیدا نمی‌شوند ⇒
  هر نیمه در تست جدا رندر می‌شود.
- **معیار:** تورنمنت دو-حذفی از ثبت‌نام تا قهرمان، با این تضمین که هیچ تیمی پس از دو باخت بازی
  نمی‌کند. — **محقق‌شده در تست + PG واقعی** (۶۱ تست، `2N−2` دیدار، assert باخت‌ها < ۲ پیش از هر
  نتیجه). **روی prod هنوز اجرا نشده:** مهاجرت `m0s026` باید روی سرور run شود (X6 = نیازمند تأیید
  صریح کاربر) و دامنهٔ `api.salon.absadeghi.ir` از این ماشین resolve نمی‌شود ⇒ شواهد در سطح
  تست واحد/jsdom + PG واقعی است، نه E2E روی سرویس زنده.

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

### C4 حریف‌یابی هوشمند (P010) — ✅ کد + تست (راستی‌آزمایی prod منتظر X6)
- [x] C4.1 امتیاز تطبیق بر پایهٔ رتبه/سطح/منطقه/زمان
- [x] C4.2 «چالش بازی» با پذیرش/رد طرفین
- **شاهد (۲۰۲۶-۱۰-۱۶، همه اجراشده):**
  - بک‌اند: `pytest tests/test_matchmaking.py` → **۳۸ passed در 2.17s**؛ رگرسیون کامل `pytest` →
    **۵۱۱ passed در 102.11s** (۴۷۳ قبل + ۳۸ جدید)؛ `ruff check app/ tests/ migrations/ --select E9,F82`
    → `All checks passed!`
  - **چرا سرویس جدید به‌جای `team_service.py`:** ادعای اصلی به `team_service.py:269` (همان `list_my_teams`)
    اشاره می‌کرد، ولی امتیاز به join سه منبع جدا می‌خواهد (نتایج دیدارها، رزروهای تیمی، جایگاه سالن).
    `app/services/matchmaking_service.py` تنها مصرف‌کنندۀ `TeamService.standings()` است — یعنی **رتبه از
    همان منبع یکتای صفحۀ لیگ** می‌آید و دو ترتیب متفاوت در سیستم ساخته نمی‌شود.
  - سیگنال‌ها و وزن‌ها (`matchmaking_service.py:33-41`): `WEIGHT_LEVEL 0.45` / `WEIGHT_REGION 0.35` /
    `WEIGHT_TIME 0.20`، `NEAR_KM 3.0` تا `FAR_KM 40.0` با نزول خطی haversine، `LEVEL_UNKNOWN_BOTH 1.0`
    و `LEVEL_UNKNOWN_ONE 0.35`. زمان = Jaccard روی کلید `(روز هفته × بازۀ صبح/بعدازظهر/عصر‌وشب)`.
  - **قاعدۀ «بی‌داده ≠ ضعیف»:** سیگنالِ در دسترس نبودن `value=None` می‌شود و **از مخرج میانگین هم بیرون
    می‌رود** (نه صفر). تست‌ها: `test_region_signal_without_geo_is_unavailable_not_zero`,
    `test_score_drops_unavailable_signals_from_denominator`, `test_rookie_pair_is_not_penalised`,
    `test_level_signal_one_rookie_is_discounted_not_zero`, `test_zero_coordinates_are_not_a_location`,
    `test_bucket_boundaries`, `test_time_signal_is_overlap_of_shared_windows`.
    **هیچ ستونی به `Team` اضافه نشد** — همه‌چیز از دادهٔ موجود مشتق است.
  - قرارداد API: `app.openapi()['paths']` = **۲۳۵** که **۶ مسیر / ۷ عملیات** آن `/matching*` است
    (`app/api/v1/matching.py`): `GET /matching/teams/{team_id}`، `GET|POST /matching/challenges`،
    `GET /matching/challenges/{id}`، `POST .../accept`، `POST .../decline`، `POST .../cancel`.
    فیلترها: `limit` ۱..۵۰، `status` و `direction` با الگوی صریح (خلاف ⇒ ۴۲۲).
  - **چالش ≠ رزرو:** `test_challenge_creates_no_booking` ثابت می‌کند پذیرش هیچ `Booking`/`Slot`/پرداختی
    نمی‌سازد؛ فقط وضعیت + ممیزی هر دو تیم (`test_challenge_records_audit_on_both_teams`) + اعلان به
    مدیران حریف (`test_create_challenge_returns_row_and_notifies_target`).
  - حالتمندی و مهلت: `test_one_open_challenge_per_pair_in_either_direction` (۴۰۹ `CHALLENGE_OPEN_EXISTS`
    از هر دو جهت)، `test_self_challenge_rejected`، `test_private_target_rejected`،
    `test_unknown_venue_proposal_rejected` (۴۰۴)، `test_responding_twice_is_conflict` (۴۰۹)،
    `test_expired_challenge_is_answered_with_410` (ترتیب بررسی مهم است: EXPIRED **قبل** از non-PENDING ⇒
    ۴۱۰ نه ۴۰۹)، `test_listing_expires_stale_challenges` (انفعالی‌سازی هنگام خواندن — **به‌جای Celery
    beat**، چون زیرساخت beat برای این کار سنگین بود و مهلت `CHALLENGE_TTL_DAYS = 7` است)،
    `test_cancel_only_by_sender_before_answer`، `test_cancelled_pair_can_challenge_again`.
  - دروازه: `_open_for_side()` اول چالش‌های کهنه را منقضی می‌کند، بعد `_require_manage_permission` را صدا
    می‌زند ⇒ تست‌های ۴۰۳ دو حالت واقعی دارند: `test_sender_cannot_accept_its_own_challenge` و
    `test_unrelated_team_cannot_respond` هر دو `NOT_A_MEMBER` می‌گیرند (چک عضویت قبل از چک مدیریت) و
    `test_plain_member_cannot_send_challenge` ⇒ `NOT_AUTHORIZED`؛ `test_suggest_requires_active_membership`
    و `test_challenge_list_requires_membership` عضویت را برای خواندن لازم می‌دانند.
  - زمان: SQLite مقدار را **آگاه از zone (UTC)** برمی‌گرداند (اندازه‌گیری شد) — پس مقایسهٔ naive در
    `stale_pending` می‌شکست؛ docstring ریپو با رفتار واقعی اصلاح شد و `_now()` آگاه است.
  - مهاجرت: `migrations/versions/m0s024_team_challenges.py` (تک‌سر روی `m0s023staffshifts`) با چرخهٔ
    upgrade→downgrade→upgrade روی DB موقت SQLite ⇒ `current = m0s024teamchallenges (head)`، enum با
    **NAME** persist می‌شود (`STATUS_LABELS` بزرگ‌نویس)، **۵ ایندکس** و **۵ FK**، و در PG
    `DROP TYPE IF EXISTS challengestatus` هم اجرا می‌شود (الگوی idempotent m0s021).
  - فرانت: `tsc --noEmit` exit 0 · `eslint --quiet` exit 0 · `vitest run` → **۱۱۱ passed / ۱۵ فایل**
    (۲۶ مورد جدید: `services/matching.test.ts` ۶، `components/team/TeamMatchmakingPanel.test.tsx` ۱۰،
    `components/team/TeamChallengePanel.test.tsx` ۱۰) · `vite build` ⇒ `✓ built in 31.18s`،
    `dist/assets/*.map` = **۰**، سربرگ‌ها داخل chunk تنبل `TeamDetail-*.js` (۵۰.۳۴ kB) نشسته‌اند.
  - UI: دو سربرگ تازه در `pages/teams/TeamDetail.tsx` — «حریف‌یابی» و «چالش‌ها» (badge = `total`
    چالش‌های ورودیِ در انتظار پاسخ)؛ هر دو `show: isMember` و اقدامات فقط با
    `canChallenge`/`canRespond = isManager`. **چرا سربرگ و نه روت جدید:** کنش به یک تیم خاص وابسته است،
    کشف‌پذیری در همان صفحه حفظ می‌شود و زحمت ترتیب روتر/روت‌های هم‌پیشوند حذف می‌شود.
    `data-testid`ها: `match-suggestion-{id}`, `match-challenge-open-{id}`, `match-open-challenge-{id}`,
    `match-basis`, `match-challenge-send`, `challenge-card-{id}`, `challenge-accept-{id}`,
    `challenge-decline-open-{id}`, `challenge-cancel-{id}`, `challenge-view-{inbox|outbox|all}`,
    `challenge-filter-pending`, `challenge-decline-confirm`.
  - اعلان و خطا: چهار نوع `team_challenge_{received,accepted,declined,cancelled}` به `typeIcons` در
    `components/layout/NotificationPanel.tsx` (آیکن + رنگ، نه رنگ‌تنها)؛ شش کد ساختارمند تازه در
    `components/team/shared.tsx` (`CHALLENGE_NOT_FOUND`, `CHALLENGE_EXPIRED`,
    `CHALLENGE_ALREADY_ANSWERED`, `CHALLENGE_OPEN_EXISTS`, `SELF_CHALLENGE`, `VENUE_NOT_FOUND`).
  - دسترسی‌پذیری: نوار سیگنال `aria-label` متنی دارد تا فقدان داده فقط با رنگ/طول منتقل نشود — تست
    `labels an unavailable signal as «no data» instead of a zero bar`؛ متن «پذیرش رزرو نمی‌سازد؛ سالن را
    جدا رزرو کنید» جلوی انتظار غلط از دکمهٔ پذیرش را می‌گیرد
    (`warns that accepting does not create a booking`).
- **معیار:** دو تیم با سطح نزدیک، هم را پیشنهاد می‌گیرند و چالش ثبت می‌شود. — **محقق‌شده در تست**:
  `test_suggest_ranks_closer_level_first`، `test_suggest_prefers_near_home_venue`،
  `test_suggest_scores_shared_time_window` و چرخۀ کامل `create → accept` با اعلان/ممیزی هر دو طرف.
  **روی prod هنوز اجرا نشده:** مهاجرت `m0s024` باید روی سرور run شود (X6 = نیازمند تأیید صریح کاربر)
  و دامنهٔ `api.salon.absadeghi.ir` از این ماشین resolve نمی‌شود (`curl` ⇒ exit 6).

### C5 قیمت‌گذاری بر پایهٔ تقاضا (P008 — موتور قوانین هست) — راند ۷ ✅ کد + تست
- [x] C5.1 جمع‌آوری سیگنال نرخ اشغال per slot-hour (بدون ML)
- [x] C5.2 پیشنهاد قیمت از روی تاریخچه + سقف/کف ایمن
- [x] C5.3 ⛔ ML واقعی: نیاز به دادهٔ ۱۲ ماهه (مسدود ذاتی) — این راند عمداً **آمار توصیفی** است، نه مدل
- **بک‌اند:**
  - سرویس تازه `backend/app/services/pricing_insight_service.py` — `occupancy()` و `suggest_price()`.
    سیگنال از **`Booking`** خوانده می‌شود نه `Slot.status`: رزروِ لغوشده سانس را به AVAILABLE برمی‌گرداند
    و تاریخچۀ status پاک می‌شود، پس شمارشِ status گمراه‌کننده است؛ در `BookingRepository.realized_bucket_stats`
    فقط `CONFIRMED/COMPLETED` شمرده می‌شود (pending پول نداده) و `payment_amount` به‌عنوان درآمد واقعی.
  - مخرجِ اشغال: `SlotRepository.slot_bucket_totals` (سانس‌های ACTIVE در پنجره). **کلید هر دو side
    `date.weekday()` (۰=دوشنبه)** است تا با `PricingRule.day_of_week` هم‌خوان بماند؛ `demand_profile`
    موجود دامنهٔ `%w` (۰=یکشنبه) دارد و عمداً استفاده نشد — خلط این دو سیگنال را چند روز جابه‌جا می‌کند
    و بی‌سروصدا غلط می‌ماند.
  - **پنجره فقط گذشته** (`end = today-1`): سانس آینده هنوز اشغال نشده و وارد کردنش مخرج را رقیق و
    نرخ را کاذب پایین می‌برد.
  - **صادقانه بودن اعداد:** هر عددی که دادهٔ کافی پشتش نیست `None` است (نه صفر) — `occupancy: null`
    و `avg_paid: null` در UI «—» می‌شود؛ با تستِ فرانتی `shows «—» instead of a misleading ۰٪ when the denominator is missing`.
  - ریل‌های ایمن در `app/config.py` (۷ تنظیم تازه): `PRICING_INSIGHT_WINDOW_DAYS=90`,
    `PRICING_INSIGHT_MIN_SAMPLES=3`, `PRICING_DEMAND_SENSITIVITY_PERCENT=25`,
    `PRICING_SUGGESTION_MAX_DELTA_PERCENT=15`, `FLOOR=70`, `CEILING=130`, `ROUND_STEP=5000`.
    موتور قیمت قبلاً **فقط کف** داشت و سقف نداشت؛ اینجا سقف + گام گردِ ریالی اضافه شد.
  - **هیچ چیزی اعمال/ذخیره نمی‌شود:** دو endpoint فقط‌خواندنی (`GET /pricing/occupancy`,
    `GET /pricing/suggestion`) با همان `ensure_venue_permission(..., PRICING_MANAGE)`؛ تست‌های
    `test_suggest_price_writes_nothing` (هیچ رزرو/قانون/قیمتی نوشته نمی‌شود) و
    `test_occupancy_and_suggestion_endpoints_are_venue_scoped` (فقط برای مدیر همان سالن) هر دو مسیر را می‌بندند.
  - مهاجرت: **ندارد** — جدول تازه‌ای ساخته نشد، فقط کوئری روی `Booking`/`Slot` موجود.
- **فرانت:**
  - تب تازهٔ **«تقاضا و پیشنهاد»** در `pages/manager/pricing/ManagerPricing.tsx` (`TAB_KEYS` → ۴ تب)
    و کامپوننت `components/pricing/PricingInsightsTab.tsx`: نقشهٔ حرارتی اشغال (روز × ساعت) با
    سلول‌های `data-testid="insight-cell-{weekday}-{hour}"`، و کارت پیشنهاد قیمت با لنگرِ «قیمت موتور».
  - حلقۀ بستن به موتور: `PricingRuleDialog` پروپ `draft` گرفت تا «اعمال به‌عنوان قانون قیمت» همان
    پیشنهاد را به مسیر **موجود** قوانین (نه مسیر جدید) بفرستد — با تست
    `applies through the existing rule path with an absolute prefill`. تا مدیر صریحاً قانون نسازد،
    هیچ رزرویی با عدد پیشنهادی فروش نمی‌رود.
  - رنگ مکمل است، نه حامل معنا: هر سلول `aria-label` متنی کامل دارد (اشغال، رزرو/سانس، میانگین پرداخت).
- **معیار (شاهد زنده، ۲۰۲۶-۱۰-۱۶):**
  | گیت | نتیجه |
  |---|---|
  | `pytest tests/test_pricing_insight.py` | **۱۶ passed** در 1.06s |
  | `pytest` (رگرسیون کامل بک‌اند) | **۵۲۷ passed** در 106.41s (۵۱۱ قبل + ۱۶) |
  | `ruff check app/ tests/ migrations/ --select E9,F82` | `All checks passed!` |
  | `app.openapi()['paths']` | **۲۳۷** (۲۳۵ قبل) — ۲ مسیر تازه `/pricing/occupancy` و `/pricing/suggestion` |
  | `tsc --noEmit` / `eslint --quiet` | exit **0** / exit **0** |
  | `vitest run` | **۱۳۲ passed در ۱۷ فایل** (۲۱ جدید: `PricingInsightsTab.test.tsx` ۱۶ + `services/pricing.test.ts` ۵) |
  | `vite build` | `✓ built in 22.60s`، `dist/assets/*.map` = **۰** |
  | راستی‌آزمایی زنده روی prod | **مسدود (X6)** — `api.salon.absadeghi.ir` از این ماشین resolve نمی‌شود (`curl` ⇒ exit 6) |
- **نکتۀ صداقت (نه ادعای پوشش‌داده‌شده):** دو endpoint تازه گاردِ rate-limitِ سطح-endpoint **ندارند** و
  فقط زیر middleware سراسری‌اند — همان نقص ثبت‌شدهٔ «۲۸ روتر بدون محدودیت» که در این راند عمداً باز نکردمش،
  چون تغییر رفتار rate limit کل سامانه باید یک برش مستقل و اندازه‌گیری‌شده باشد.
  پیشنهاد همچنین **اعمال نمی‌شود**؛ تا مدیر قانون نسازد، مسیر قیمتِ رزرو دقیقاً همان قبل است.

---

### C6 تحلیل بین-سالنه (P007) — راند ۱۰ ✅ کد + تست (راستی‌آزمایی prod منتظر X6)

- [x] C6.1 endpoint تجمیعی `GET /finance/venue-comparison` (یک ردیف به ازای هر سالنِ دامنه)
- [x] C6.2 پنل فارسی «مقایسهٔ سالن‌ها» در داشبورد مالی (جدول دسکتاپ + کارت موبایل)
- [x] C6.3 ⛔ نه ML و نه forecast — این برش **گزارش توصیفی** است: رتبه، سهم، دلتای بازهٔ قبل

- **بک‌اند (`backend/`):**
  - `TransactionRepository.venue_rollups()` — تک کوئریِ grouped روی `FinancialTransaction.venue_id`
    با `venue_id IS NOT NULL`. دلیل ساختِ متد جدید به‌جای `series_grouped("venue")`: آن متد ردیف‌های
    بی‌سالن را با کلید رشته‌ای `"None"` برمی‌گرداند و در مقایسهٔ بین‌سالنه سمّی است.
    **هر سه عدد روی یک جامعه:** درآمد، هزینه و *تعداد* ردیف همگی VOIDED را بیرون می‌گذارند؛ تست
    `test_voided_and_null_venue_rows_never_count` همین را می‌شکند (نسخۀ اول `count()` خام بود و
    تعداد ۴ در برابر درآمدِ ۳ ردیف می‌داد — با همان تست گرفته شد).
  - `BookingRepository.venue_rollups()` — رزرو/لغو/درآمد/مشتریان یکتا از **`Booking`** (نه `Slot.status`)،
    با همان قاعدۀ C5: شمارش پول‌شده فقط `CONFIRMED/COMPLETED`، ولی نرخ لغو به `CANCELLED` هم نیاز دارد
    ⇒ `customers` با `count(distinct case(...))` فقط رزروهای پرداخت‌شده را می‌شمارد.
  - `FinanceService.venue_comparison()` — **بازهٔ قبلی هم‌طول** را خودش می‌سازد
    (`prev_to = from-1`, `prev_from = prev_to-(span-1)`) و در پاسخ می‌گذارد؛ UI هیچ دلتایی محلی حساب
    نمی‌کند. دامنه از همان `_scope()` قبلی می‌آید: super_admin ⇒ همهٔ سالن‌ها و `venue_ids: null`،
    مدیر ⇒ فقط سالن‌های خودش، سالن غریبه ⇒ ۴۰۳، کارکنان ⇒ `venue_id` الزامی (۴۰۳ بدون آن).
  - صداقت اعداد: `avg_per_booking = null` وقتی رزروی نیست (نه ۰ ریال)؛ سالنِ بدون هیچ فعالیتی هم
    ردیف صفر می‌گیرد تا «کمبود داده» با «حذف شده» یکی نشود؛ `share_pct` مخرجش درآمد *همان دامنه* است.
  - مرتب‌سازی و `rank` سمت سرور (`-net`, سپس `-income`, سپس `venue_id`) ⇒ UI فقط نمایش می‌دهد.
  - مهاجرت: **ندارد** — فقط کوئری روی `FinancialTransaction`/`Booking`/`Slot` موجود.
- **فرانت (`frontend/`):**
  - `services/finance.ts` → `getVenueComparison()` + تایپ‌های `VenueComparison*`؛
    `hooks/useFinance.ts` → `financeKeys.venueComparison` و `useVenueComparison` (زیر دامۀ
    `['finance']` ⇒ با هر mutation مالی خودکار refresh می‌شود).
  - `components/finance/VenueComparisonPanel.tsx` داخل سربرگ داشبورد، با **همان فیلتر بازه/سالن**
    (`scope` از `FinanceDashboardTab` پاس می‌شود — منبع فیلتر یکی می‌ماند).
  - جدول دسکتاپ (`useAboveSm`) و کارت موبایل؛ رنگ فقط مکمل است: هر سلول دلتا متن ▲/▼ و رقم کامل دارد،
    `aria-label="مقایسهٔ سالن‌ها"` روی جدول، و «—» به‌جای صفر برای سالن بی‌رزرو.
- **معیار (شاهد، ۲۰۲۶-۱۰-۱۶ — همگی سطح unit/CI، نه prod):**
  | گیت | نتیجه |
  |---|---|
  | `pytest tests/test_finance_venue_comparison.py` | **۱۳ passed** در 1.23s |
  | `pytest` (رگرسیون کامل بک‌اند) | **۶۲۶ passed** در 107.64s (۶۱۳ قبل + ۱۳) |
  | `ruff check app/ tests/ migrations/ --select E9,F82` | `All checks passed!` |
  | `app.openapi()['paths']` | **۲۳۸** (۲۳۷ قبل) — `/api/v1/finance/venue-comparison` |
  | `tsc --noEmit` / `eslint --quiet` | exit **0** / exit **0** |
  | `vitest run` | **۱۵۸ passed در ۱۸ فایل** (۱۰ جدید: `VenueComparisonPanel.test.tsx`) |
  | `vite build` | `✓ built in 26.47s`، `FinanceConsole` chunk = 55.24 kB (gzip 15.02) |
  | راستی‌آزمایی زنده روی prod | **مسدود (X6)** — prod از این ماشین قابل دسترس نیست |
- **نکتۀ صداقت:** این برش **فقط‌خواندنی** است و هیچ مسیر نوشتن/قیمت‌گذاری را تغییر نمی‌دهد؛
  شمارش ۶۲۶ و ۱۵۸ روی SQLite و jsdom است — روی PostgreSQL پرود (با دادهٔ چند-سالنهٔ واقعی) هنوز
  اجرا نشده، چون deploy منتظر X6 است.

---

### C7 سازگاری دفتر کل (بازبینی #6) — راند ۱۱ ✅ سه نقص: دو رفع، یک ثبت

- [x] C7.1 (F1) جفتِ `(source_type, source_id)` ردیف برگشتِ فیش/در‌محل با ردیف درآمدی‌اش یکی شد
- [x] C7.2 (F2) ابطالِ ردیف درآمدی که برگشتش را بی‌پوشش می‌گذارد، با ۴۰۰ بسته شد
- [x] C7.3 (F3) نوشتنِ هم‌زمان با `idempotency_key` تکراری → **ثبت شد، رفع نشد** (دلیل پایین)
- [x] C7.4 پایداری ساعتی `tests/test_price_guard.py::test_is_past_slot_rule`

- **نقص F1 — برگشتِ «یتیم» (رفع شد).** در `backend/app/api/v1/bookings.py:395` ردیف برگشت با
  `original_source_id=_orig.id` ساخته می‌شد، یعنی **شناسهٔ خودِ ردیف دفتر کل** در `source_id`
  می‌نشست، در حالی که ردیف درآمدی جفتِ `(booking, booking_id)` را داشت. نتیجه: هیچ کوئری
  نمی‌توانست بگوید «این برگشت، آن درآمد را وارونه کرده» — و هر قاعدهٔ سازگاری مبتنی بر جفت
  بی‌اثر می‌ماند. حالا `source_type=_orig.source_type` و `original_source_id=_orig.source_id`
  مستقیماً از ردیف مبدأ گرفته می‌شود (همان قراردادی که برگشت درگاه از قبل رعایت می‌کرد:
  `booking_payment` + `payment.id`).
- **نقص F2 — بیرون‌رفتنِ دوبارۀ پول (رفع شد).** `FinanceService.void_transaction()` هر ردیفی را
  باطل می‌کرد. باطل‌کردنِ ردیف *درآمد*ِ برگشت‌خورده، درآمد را از جمع می‌زدود ولی ردیف
  `type=refund`/`direction=expense` سر جایش می‌ماند ⇒ خالصِ سالن منفیِ کاذب (منهای دو برابر).
  گارد در `backend/app/services/finance_service.py:289` نشسته است.
- **چرا «پوشش» و نه «بود و نبودِ برگشت»:** نسخهٔ اولِ گارد با `has_live_refund()` فقط می‌پرسید
  «آیا برگشتِ زنده‌ای روی این منبع هست؟». جفتِ منبع **سیم‌رسانیِ ردیف‌به‌ردیف ندارد** (چند ردیف
  درآمدِ یک رزرو همه `(booking, id)` مشترک می‌گیرند)، پس آن گارد *همهٔ* ردیف‌های درآمدیِ منبع را
  قفل می‌کرد — حتی ردیفی که آن برگشت هرگز وارونه‌اش نکرده بود (فیش ۵۰۰٬۰۰۰ ریالی قفل می‌ماند چون
  برگشتِ «در محل ۳۰۰٬۰۰۰» روی همان منبع بود). نسخهٔ نهایی با
  `TransactionRepository.refund_vs_live_income()` دو جمع را در **یک کوئری** می‌گیرد و ابطال را
  مجاز می‌داند تا وقتی `refunded > live_income - amount` شود؛ یعنی رزروِ چندردیفه و بازگشتِ
  جزئی قفل نمی‌شوند، ولی ردیفِ بی‌جفت (`source_id = null`، ردیف‌های دستی) همیشه آزاد است.
  **این نقص را تست گرفت، نه بازبینی:** `test_voiding_a_refunded_income_row_is_rejected` سبز
  بود و `test_manual_income_without_a_refund_is_still_voidable` قرمز شد (`0 > -250000` ⇒ ۴۰۰ کاذب).
- **نقص F3 — `IntegrityError` → ۵۰۰ (ثبت شد، رفع نشد).** `idempotency_key` هم در مدل
  (`app/models/transaction.py:92`) و هم در DB (`migrations/versions/f6l006finance.py:76`) unique
  است. دو درخواست هم‌زمانِ یکی‌ان (دابل‌تپ روی «ثبت») یکی را ۵۰۰ می‌کند. رفعِ درست = retry روی
  IntegrityError با بازیابی ردیف موجود، و آن تغییرِ مسیرِ نوشتنِ پول است؛ در راندی که هیچ تست
  هم‌زمانی روی prod نداریم انجام نشد تا «رفع»ِ بدون شاهد نباشد. رفتار فعلی **بی‌خطر** است:
  ردیف دوم نوشته نمی‌شود و دادهٔ دوتایی تولید نمی‌شود — فقط پیام به کاربر خام است.
- **C7.4 — آزمونِ ساعت‌بسته.** `test_is_past_slot_rule` می‌گفت
  `is_past_slot(date.today(), (now-1h).time()) is True`؛ بین ۰۰:۰۰ تا ۰۰:۵۹ که «یک ساعت پیش» دیروز
  است، ساعتِ ۲۳:xx با `today` جفت می‌شود و تابع درست می‌گوید «آینده». **تابع درست بود و آزمون
  فرضِ تقویمی داشت** ⇒ آزمون از یک اینستانت واقعی استفاده می‌کند:
  `is_past_slot(an_hour_ago.date(), an_hour_ago.time())`. شاهد: `date` روی این ماشین
  `Sat Oct 17 00:52:26 IST 2026` و پیش از رفع، exactly یک failure از ۶۳۲.
- **معیار (شاهد، ۲۰۲۶-۱۰-۱۷ — همگی سطح unit، نه prod):**
  | گیت | نتیجه |
  |---|---|
  | `pytest tests/test_finance_refund_void_consistency.py` | **۷ passed** (۶ قانون + ۱ پوششِ چندردیفه) |
  | `pytest` (رگرسیون کامل بک‌اند) | **۶۳۳ passed** در 166.62s (۶۲۶ راند قبل + ۷) |
  | `ruff check app/ tests/ migrations/ --select E9,F82` | `All checks passed!` |
  | `app.openapi()['paths']` | **۲۳۸** (بدون تغییر — endpoint جدید ندارد) |
  | CI (`lint-and-build`, `Backend Tests`, `Flutter iOS IPA`) روی `476551a` | **completed/success** |
  | CI روی `476551a` (کل checks) | قرمز فقط `e2e-tests` (از پیش) و `Workers Builds: salon-app` (خارجی، #28) |
- **نکتۀ صداقت:** هر چهار عدد از یک مسیرِ نوشتنِ پول می‌آید و هیچ‌کدام روی SQLite ثابت نمی‌کند
  که پرود هم همین‌قدر ردیفِ یتیم ندارد؛ راستی‌آزمایی زنده همچنان منتظر X6 است.

---

### C8 صف انتظار در مسیر لغو (بازبینی #4) — راند ۱۲ ✅ دیسپچ جلوی commit بود

- [x] C8.1 `notify_waitlist_on_cancellation.delay()` از بالای `DELETE /bookings/{id}` به **بعد از
  `uow.commit()`** منتقل شد (`backend/app/api/v1/bookings.py:366,403`)
- [x] C8.2 یک کوئری مُرده در همان تابع حذف شد (`paid_tx` خوانده می‌شد و هرگز استفاده نمی‌شد)
- [x] C8.3 ⚠️ ثبت شد، رفع نشد: `_send_waitlist_notification_sync` داخل event loop نمی‌تواند
  `run_until_complete` کند و خطای تسک با `task_eager_propagates=False` بلعیده می‌شود

- **چرا این نقص واقعی است:** تسک سلری `Session(engine)` **خودش** را باز می‌کند
  (`app/tasks/reminder_tasks.py:139`). وقتی دیسپچ پیش از commit بود، درخواست هنوز
  تراکنشِ نوشتنِ باز داشت ⇒ لغو برای تسک committed نشده بود.
- **شاهدِ قبل‑و‑بعد (این دور، برعکسِ بیشتر دورها، با rollback عمدی اندازه‌گیری شد):**
  ترتیبِ رفع‌شده موقتاً به حالت اول برگردانده و همان دو تست اجرا شد ⇒ **۲ failed**، و هر
  کدام دقیقاً یکی از دو چهرۀ باگ را نشان داد:
  - تستِ ترتیب: probe در لحظهٔ دیسپچ `{'slot_status': 'BOOKED', 'booking_status': 'CONFIRMED'}`
    خواند — یعنی تسک در prod (worker با سشن خودش) لغو را **نبیند** و پنجرهٔ ۲ ساعته را برای
    سانسِ هنوز-اشغال‌شده می‌سوزاند؛ اگر request بعدتر rollback می‌کرد، اعلان بی‌محل می‌شد.
  - تستِ تسکِ واقعی: `sqlite3.OperationalError: database is locked` داخل
    `reminder_tasks.py:197` — نوشتنِ `status=notified` اصلاً انجام نمی‌شد، خطا با
    `task_eager_propagates=False` بلعیده می‌شد و API همان **۲۰۰** را برمی‌گرداند.
  بعد از بازگرداندنِ رفع: **۱۳ passed** (۲ تست جدید + ۱۱ تست `test_waitlist.py` که دست‌نخورده
  سبز ماندند).
- **تست‌ها (`backend/tests/test_booking_cancel_notify_order.py`):**
  - اولی `.delay()` را با یک probe جایگزین می‌کند که در **همان لحظه** وضعیت را می‌خواند:
    باید `AVAILABLE/CANCELLED` ببیند؛ یعنی دیسپچ بعد از commit است. خواندن با SQLite **خام**
    انجام می‌شود، چون `test_engine` برای هر تراکنش `BEGIN IMMEDIATE` می‌فرستد
    (`tests/conftest.py:104`) و یک سشنِ SQLAlchemy حتی برای *خواندن* قفل نوشتن می‌گیرد؛ آن
    نسخهٔ اولِ همین تست به‌جای «دادهٔ قدیمی» با `database is locked` می‌ترکید و چیزی را ثابت
    نمی‌کرد. توجه: ستون Enum در دیتابیس **نام** عضو را نگه می‌دارد (`'AVAILABLE'`)، پس
    مقایسه‌ها با `.name`اند.
  - دومی فقط **ارسال** اعلان (FCM/WebSocket) را mock می‌کند و بقیهٔ مسیر واقعی است: بدنهٔ تسک
    اجرا می‌شود، `entry.status == "notified"` و `expires_at` نوشته می‌شود.
- **F بعدی (ثبت‌شدنی):** در محیطِ eager (تست/دیباغ)، بدنهٔ تسک داخل event loopِ request اجرا
  می‌شود و `run_until_complete` با `RuntimeError: Cannot run the event loop while another loop
  is running` می‌ترکد. در prod این مسیر در worker (بدون loop) است، پس رفتار درستی دارد؛
  رفعِ آن یعنی تغییرِ هم‌زمانیِ ارسالِ اعلان، بدون تست هم‌زمانیِ موجود انجام نشد.
- **معیار (شاهد، ۲۰۲۶-۱۰-۱۷ — سطح unit/SQLite):**
  | گیت | نتیجه |
  |---|---|
  | `pytest tests/test_booking_cancel_notify_order.py` (پس از رفع) | **۲ passed** |
  | همان تست‌ها با rollback عمدیِ رفع | **۲ failed** (`database is locked` روی `BEGIN IMMEDIATE`) |
  | `pytest tests/test_waitlist.py` هم‌اجرا | **۱۱ passed** (رگرسیون صف انتظار نشکست) |
  | `pytest` (رگرسیون کامل بک‌اند) | **۶۳۵ passed** (۶۳۳ راند قبل + ۲) |
  | `ruff check app/ tests/ migrations/ --select E9,F82` | `All checks passed!` |
  | `app.openapi()['paths']` | **۲۳۸** (بدون تغییر) |
- **نکتۀ صداقت:** ترتیبِ دیسپچ روی SQLite اثبات شد، ولی «اعلان واقعاً روی دستگاه کاربر می‌نشیند»
  همچنان به X1/X2 (FCM) و deployِ prod (X6) نیاز دارد.

### C9 چرخۀ قرارداد و تأیید مدیر نرم‌افزار (بازبینی #5) — راند ۱۳ ✅ سه نقص رفع شد

**الف) سانسِ جابه‌جا‌شده هرگز COMPLETED نمی‌شد**

- [x] C9.1 `ContractRepository.get_past_scheduled()` روی `rescheduled_date` **کوچ‌می‌زد**؛
  یعنی (۱) سانسِ جابه‌جا‌شده‌ای که تاریخ *جدیدش* گذشته است هیچ‌وقت تکمیل نمی‌شد و (۲) فیلتر
  فقط `SCHEDULED` را می‌دید پس ردیف `RESCHEDULED` اصلاً وارد حلقه نمی‌شد
  (`backend/app/repositories/contract_repository.py`).
- رفع: `effective = coalesce(rescheduled_date, session_date)` + `status IN (SCHEDULED, RESCHEDULED)`.
  سانسِ جابه‌جا‌شده به *آینده* (session_date قدیمی، rescheduled_date جدید) باید دست‌نخورده بماند —
  تستِ نگهبان برای همین نوشته شد.
- **شاهدِ قبل‑و‑بعد:** فیلتر قدیمی موقتاً برگردانده شد ⇒ `1 failed, 17 passed`
  (`assert 0 >= 1` در `completed_sessions`؛ تسک صفر سانس تکمیل می‌کرد). بعد از بازگرداندن رفع:
  **۱۹ passed** در `tests/test_contracts_lifecycle.py`.

**ب) ممیزی انقضا خود را «تأیید» جا می‌زد**

- [x] C9.2 `check_expired_contracts` رویداد انقضا را با این عبارت ثبت می‌کرد:
  `CANCELLED if False else RENEWED if False else APPROVED` — همواره **approved**.
  تاریخچۀ ممیزی که مدیر/کاربر می‌بیند بعد از انقضا قراردادِ تأییدشده **دو«تأیید»** نشان می‌داد
  و ردپای واقعیِ انقضا وجود نداشت (`backend/app/tasks/contract_tasks.py:71`).
- رفع: عضو جدید `ContractAuditAction.EXPIRED = "expired"` + ثبت همان مقدار.
  ستون `contract_audit_events.action` ساده `VARCHAR` است (مدل ۲۶ / مهاجرت ۴۰) ⇒ **بدون مهاجرت**.
  برچسب و آیکون فارسی هم اضافه شد: `AUDIT_ACTION_LABELS.expired = «انقضای دوره‌ی قرارداد»`،
  `AUDIT_ACTION_ICONS.expired = mdi:calendar-end` (`frontend/src/components/contract/shared.tsx:148,166`).
- **شاهدِ قبل‑و‑بعد:** پیش از رفع، assertion جدید این تاریخچه را دید
  `[created, approved, approved]` ⇒ `AssertionError: EXPIRED in [...]`. پس از رفع:
  `[created, approved, expired]` و تست سبز.

**پ) صف تأیید مدیر نرم‌افزار بی‌بازخورد بود (Critical path ۲)**

- [x] C9.3 `POST /admin/users/{id}/approve|reject` و `POST /admin/verify-venue/{id}` فقط یک
  message در بدنهٔ پاسخ HTTP برمی‌گرداندند که در UI نمایش داده نمی‌شد؛ کاربر هرگز خبردار
  نمی‌شد حسابش تأیید/رد شده یا سالنش فعال شده. تأیید/رد حساب در `security_audit_events`
  ثبت هم نمی‌شد (برعکس `set_user_role`).
- رفع: سه اعلان دامنهٔ جدید (`account_approved`, `account_rejected`, `venue_verified`) در
  `notification_service` + فراخوانی آن‌ها **بعد از `uow.commit()`** (همان قاعدۀ راند ۱۲) +
  ممیزی امنیتی `admin.user_approved` / `admin.user_rejected` با `actor_id` مدیر + سه آیکون
  هم‌نام در `typeIcons` پنل اعلان (`frontend/src/components/layout/NotificationPanel.tsx:27-29`).
- [x] C9.4 دست‌انداز تستی که در این دور کشف شد: هر helperِ نوشتنی روی fixture `db` باید
  `db.close()` کند، وگرنه `BEGIN IMMEDIATE` (`tests/conftest.py:104`) قفل را نگه می‌دارد و
  اولین درخواست API با `database is locked` می‌ترکد (نخستین اجرای `test_admin_approval_flow.py`
  دقیقاً همین را داد، نه یک نقص تولیدی).
- [x] C9.5 ⚠️ ثبت شد، رفع نشد: `set_user_role` کاربرِ تازه‌تنزل‌یافته را باخبر نمی‌کند و
  `GET /admin/users` هنوز بدون صفحه‌بندی است (`get_all()` سراسری).
- **تست‌ها (`backend/tests/test_admin_approval_flow.py` — ۶ تست، پوشش قبلی این مسیر صفر بود):**
  صف مدیران در انتظار → تأیید + اعلان + ممیزی؛ رد ⇒ `is_active=False` + اعلان؛ کاربر معمولی ⇒ ۴۰۳
  و **بدون** اعلان و بدون تغییر؛ کاربر ناموجود ⇒ ۴۰۴؛ تأیید سالن ⇒ `is_verified=True`،
  آمار `verified/pending` و اعلان با `venue_name`.
  شاهد: سه خط اعلان/ممیزی حذف شد ⇒ **۳ failed، ۳ passed** (تست‌های ۴۰۳/۴۰۴ که نباید چیزی
  بفرستند سبز ماندند).
- **معیار (شاهد، ۲۰۲۶-۱۰-۱۷ — سطح unit/SQLite):**
  | گیت | نتیجه |
  |---|---|
  | `pytest tests/test_contracts_lifecycle.py` (پس از رفع) | **۱۹ passed** |
  | همان فایل با rollback عمدیِ الف) | **۱ failed، ۱۷ passed** |
  | `pytest tests/test_admin_approval_flow.py` (پس از رفع) | **۶ passed** |
  | همان فایل با حذف اعلان/ممیزی | **۳ failed، ۳ passed** |
  | رگرسیون قرارددها (۶ فایل) | **۵۸ passed** پیش از افزودن تست‌های این دور |
  | `pytest` (رگرسیون کامل بک‌اند) | **۶۴۴ passed** (۶۳۵ راند ۱۲ + ۹) |
  | `ruff check app/ tests/ migrations/ --select E9,F82` | `All checks passed!` |
  | `app.openapi()['paths']` | **۲۳۸** (بدون تغییر — endpoint جدید اضافه نشد) |
  | `tsc --noEmit` + `eslint` روی `shared.tsx` و `NotificationPanel.tsx` | خطا **۰** (۲۰ warning از پیش موجودِ `react-refresh` در shared.tsx) |
- **نکتۀ صداقت:** این اعلان‌ها مسیر *درون‌برنامگی* (ذخیره در DB + WebSocket) را می‌سازند؛ رسیدن
  پوش/FCM به دستگاه کاربر همچنان به X1/X2 و deploy prod (X6) وابسته است.

### C10 پرداخت دربارۀ وضعیتِ به‌روزِ رزرو (بازبینی #4) — راند ۱۴ ✅ سه نقص: دو رفع، یک ثبت

- [x] C10.1 `POST /payments/{id}/pay` فقط `payment.status == PAID` را می‌پرسید و **هیچ‌وقت
  رزرو را بازبینی نمی‌کرد**؛ بعد از گرفتن پول، `booking.status = CONFIRMED` می‌نوشت ⇒ رزروِ
  **لغوشده** زنده می‌شد، در حالی که همان لغو سانس را `AVAILABLE` کرده و صف انتظار را بیدار کرده
  بود. نتیجه: یک سانس دو صاحب (یا صاحب + پول بی‌سانس) و ردیف درآمدی بی‌مخاطب در دفتر کل
  (`backend/app/api/v1/payments.py:104-117`).
- [x] C10.2 همان نقص در **webhook درگاه** (`POST /payments/{id}/callback`): اگر کاربر بین
  «در صفحۀ درگاه» و «لغو رزرو» پول را می‌داد، callback رزرو را CONFIRMED می‌کرد. رفع: رزرو از
  این مسیر **هرگز زنده نمی‌شود**؛ چون پول واقعاً در درگاه گرفته شده، فاکتور `paid` و درآمدش ثبت
  می‌ماند، ولی مدیر اعلان «⚠️ پرداخت برای رزروِ غیرفعال — بازگشت وجه را ثبت کنید» می‌گیرد و
  یک `logger.warning` ثبت می‌شود.
- [x] C10.3 فاکتورِ **REFUNDED** دوباره قابل پرداخت بود ⇒ بارِ دومِ گرفتن پول با
  `idempotency_key`
  تکراری: `FinanceService.record_tx` ردیف موجود را برمی‌گرداند (`finance_service.py:121-124`)، پس
  درآمد تازه‌ای ثبت نمی‌شد ولی ردیف برگشت سر جایش می‌ماند ⇒ فاکتور paid، دفتر کل بدهکار. حالا
  `/pay` با ۴۰۰ فارسی بسته می‌شود.
- [x] C10.4 **سر‌شاخه‌ای که اصلاً کار نمی‌کرد:** شاخۀ درگاه واقعی همین‌جا
  `return {**_to_response(payment), "payment_url": ...}` بود — `**` روی یک مدل Pydantic
  `TypeError: 'PaymentResponse' object is not a mapping` می‌دهد (اثبات مستقیم با همان مدل:
  خروجیِ اجرای `python -c`). حتی اگر نمی‌ترکید، `response_model=PaymentResponse` کلید
  `payment_url` را می‌انداخت چون فیلد در schema نبود ⇒ کاربر هرگز به درگاه ریدایرکت نمی‌شد.
  رفع: فیلد `payment_url` به schema اضافه شد و پاسخ از سازندهٔ مدل ساخته می‌شود.
- [x] C10.5 ⚠️ ثبت شد، رفع نشد: `/pay` هیچ بدنه‌ای نمی‌خواند (`PaymentPayRequest` import شده و
  بی‌استفاده)؛ اعتبارسنجی شماره کارت/CVV **فقط در UI** است (`PaymentDialog.tsx:89-101`) و
  سرور هر body‌ای را می‌پذیرد. تا وقتی درگاه واقعی (X4) وصل نشده، «پرداخت» شبیه‌سازی است و این
  را عمداً تغییر ندادیم — رفعش یعنی قراردادِ input برای کل کلاینت‌ها (web + Flutter).
- [x] C10.6 ⚠️ ثبت شد، رفع نشد: فاکتورِ `PENDING` بی‌صاحب می‌ماند — نه TTL دارد نه job ابطال؛
  `create_payment` همانِ معوق را برمی‌گرداند، پس رزروهای رهاشده فاکتور باز نگه می‌دارند.
- **شاهدِ قبل‑و‑بعد:** `tests/test_payment_booking_state_guard.py` پیش از رفع ⇒
  **۳ failed، ۱ passed**؛ تستِ webhook دقیقاً نفسِ نقص را نشان داد
  (`assert <BookingStatus.confirmed> == <BookingStatus.cancelled>`). پس از رفع ⇒ **۵ passed**
  و رگرسیون کامل ⇒ **۶۴۹ passed** (۶۴۴ راند ۱۳ + ۵).
  تستِ C10.4 با بازگرداندنِ خطِ `return {**...}` ⇒ **۱ failed** (`TypeError` در
  `payments.py:177`) — یعنی این تست فقط «قشنگ‌نویسی» نیست، یک ۵۰۰ قطعی را می‌گیرد.
- **تست‌ها:** لغو سپس پرداخت ⇒ ۴۰۰ با «لغو» در پیام، رزرو `CANCELLED` و سانس `AVAILABLE`
  می‌مانند و **هیچ** ردیف `booking-payment:{pid}` ساخته نمی‌شود؛ مسیر عادی (رزروِ تأییدشده)
  همچنان ۲۰۰ و درآمد ثبت‌شده (نگهبانِ ضد-تنگیِ قاعده)؛ پرداختِ دوبارۀ فاکتورِ بازگشت‌وجه‌شده
  ⇒ ۴۰۰ و خالصِ دفتر کل همان صفر (جمع درآمد = جمع برگشت)؛ callback با درگاه ساختگی ⇒ فاکتور
  paid، رزرو CANCELLED و **یک** اعلان هشدار برای مدیر؛ حالت درگاه واقعی ⇒ `payment_url` و
  `authority` در پاسخ و `status: pending` و بدون درآمد (پول هنوز نگرفته نشده).
- **معیار (شاهد، ۲۰۲۶-۱۰-۱۷ — سطح unit/SQLite):**
  | گیت | نتیجه |
  |---|---|
  | `pytest tests/test_payment_booking_state_guard.py` (پس از رفع) | **۵ passed** |
  | همان فایل پیش از رفعِ C10.1-C10.3 | **۳ failed، ۱ passed** |
  | `-k redirect_url` با بازگرداندنِ خطِ پاسخ قدیمی | **۱ failed** (`TypeError` در payments.py:177) |
  | `pytest` (رگرسیون کامل بک‌اند) | **۶۴۹ passed** |
  | `ruff check app/ tests/ migrations/ --select E9,F82` | `All checks passed!` |
  | `app.openapi()['paths']` | **۲۳۸** (بدون تغییر؛ schema یک فیلد گرفت، مسیر نه) |
- **نکتۀ صداقت:** C10.4 روی مسیر واقعیِ درگاه فقط با درگاه *ساختگی* اثبات شد؛ تا X4 (قرارداد
  درگاه و رازها) وصل نشود، هیچ شاهدی روی ZarinPal/Mellat زنده نداریم — و این همان جایی است که
  قبلاً «پیاده‌سازی‌شده» گزارش شده بود (`API_AUDIT.md` می‌گفت webhook کار می‌کند).

### C11 تسویهٔ پرداخت اشتراکی تیم (بازبینی #4، P003) — راند ۱۵ ✅ چهار نقص: سه رفع، یک ثبت

> `FINAL_REVIEW.md` برای P003 نوشته بود «باقی‌ماندهٔ کار: آزمون end-to-end و تست همزمانی سهم‌ها».
> ممیزیِ خودِ همین مسیر چهار نقص کاربرمحور بیرون آورد که هیچ‌کدام در آن نسخه ثبت نبود؛ دو تای آن‌ها
> در UI بود و تا این راند **هیچ تستی روی `SplitPaymentsPanel` وجود نداشت**.

- [x] C11.1 `POST /split-payments/` در روش PERCENTAGE هر سهم را `int(amount * pct / 100)`
  می‌ساخت ⇒ کسرِ **همهٔ** سهم‌ها دور ریخته می‌شد و مبلغ گم می‌شد. اعداد اندازه‌گیری‌شده (پیش از رفع):
  سه سهم ۳۳٫۳۳۳۳٪ از ۱۰۰ ریال ⇒ `[33, 33, 33]` (جمع ۹۹)؛ از ۱٬۰۰۰٬۰۰۱ ⇒ جمع ۹۹۹٬۹۹۹؛ هفت سهم
  ۱۲٫۵٪ از ۹۹۹٬۹۹۹ ⇒ جمع ۹۹۹٬۹۹۲. چون `paid_amount` جمعِ همین سهم‌هاست، بعد از پرداختِ **همهٔ**
  اعضا هم `remaining` صفر نمی‌شد در حالی که وضعیت `COMPLETED` خوانده می‌شد ⇒ یک ریالِ بی‌صاحب در
  هر تقسیمِ درصدی. رفع: `_allocate_by_weight()` همان باقیمانده را بین بزرگ‌ترین کسرها پخش می‌کند
  (قاعده‌ای که EQUAL از قبل با `divmod` داشت) ⇒ جمعِ سهم‌ها **دقیقاً** `amount`.
- [x] C11.2 **کرش ۵۰۰ در ساخت پرداخت:** اگر مبلغ کل به هر عضو یک ریال نمی‌رسید، سهمِ صفری با
  `CheckConstraint("amount > 0")` در `split_payment_shares` می‌جنگید و endpoint `IntegrityError`
  می‌داد (شاهد خطای خام: `parameters: (1, 1, 0, 33.333333333333336, 'PENDING', …)`). حالا ۴۲۲ فارسی
  می‌شود: «مبلغ کل آن‌قدر کم است که به هر یک از N عضو یک ریال نمی‌رسد» — برای هر سه روش.
- [x] C11.3 **بن‌بستِ مسیر پول در وب:** `POST /split-payments/{id}/shares/{share_id}/pay` و
  `splitPaymentService.payShare` هر دو وجود داشتند، ولی **هیچ کامپوننتی صدایشان نمی‌زد**
  (`grep payShare` در کل مخزن فقط سرویس + تست‌های بک‌اند را می‌داد؛ در برابر آن `PaymentSection.tsx:176`
  برای سهمِ بازی دکمه دارد). یعنی کاپیتان پرداخت اشتراکی می‌ساخت و عضو **هیچ‌جا** نمی‌توانست سهمش را
  پرداخت کند ⇒ ادعای «P003 ساخته شده» در UI نصفه بود. رفع: دکمهٔ «پرداخت سهم من (… ریال)» در
  دیالوگ جزئیات، فقط برای سهمِ پرداخت‌نشدهٔ خودِ کاربر، با `loading` و پیام خطای فارسیِ سرور و
  تازه‌سازی جزئیات + فهرست بعد از موفقیت.
- [x] C11.4 **چیپ خالی:** `STATUS_LABELS`/`STATUS_COLORS` (`SplitPaymentsPanel.tsx:22-34`) کلیدهای
  `PARTIAL` و `EXPIRED` را نداشتند، در حالی که `PARTIAL` وضعیتِ **همیشگیِ** صفحه به‌محض پرداختِ اولین
  سهم است ⇒ `Chip label=undefined` (چیپ بی‌متن) و `bgcolor: "undefined15"` (رنگ بی‌معنا). رفع:
  `PARTIAL: نیمه‌پرداخت (#4f46e5)` و `EXPIRED: مهلت گذشته (#64748b)` — هر دو روی زمینهٔ ۱۵٪ انتخاب
  شدند تا کنتراست متنِ ردیفِ Track D نشکند؛ union نوع در `splitPayment.ts` هم با enum بک‌اند
  هم‌خط شد (`ACTIVE` مرده بود).
- [x] C11.5 `GET /split-payments/{id}` دو فیلد `total_paid` و `remaining` را می‌فرستد و **هیچ‌جا**
  نمایش داده نمی‌شد؛ حالا «۳۳٬۴۰۰ پرداخت‌شده از ۱۰۰٬۰۰۰ ریال» + «باقی‌مانده: …» + نوار پیشرفت
  (`LinearProgress`) در همان دیالوگ است — الگو از `PaymentSection.tsx:148-189` گرفته شد تا دو مسیرِ
  پرداختِ تیمی یک شکل داشته باشند.
- [x] C11.6 ⚠️ ثبت شد، رفع نشد (سه گره واقعی):
  1. سهمِ پرداختی **هیچ ردیفی در دفتر کل نمی‌سازد**: `SplitPaymentShare.payment_id` هیچ‌جا نوشته
     نمی‌شود و `pay_share` فقط وضعیت را flip می‌کند؛ `PayShareIn.payment_method` و
     `transaction_ref` هم خوانده نمی‌شوند (فقط `note`). یعنی «پرداخت‌شده» در این مسیر یک
     تأییدِ ادعایی است نه جابه‌جایی پول — وصل کردنش به درآمدِ واقعی، همان X4 (درگاه) را می‌خواهد.
  2. `CANCELLED` هنوز هیچ مسیرِ رسیدنی ندارد (نه endpoint ابطال، نه job انقضا) ⇒ `EXPIRED` هم
     برچسب گرفت ولی سرور هنوز هیچ‌گاه تولیدش نمی‌کند. ابطالِ پرداختِ اشتراکی تصمیمِ محصولی دارد:
     وقتی یک عضو پرداخته، «لغو» یعنی تکلیفِ پولِ او چه شود — و بازگشت وجه بدون درگاه (X4) معنا ندارد.
  3. ~~`sp.paid_amount += share.amount` read-modify-write است و هیچ قفل ردیفی ندارد؛ روی PostgreSQL
     واقعیِ prod می‌تواند پرداختِ همزمانِ دو عضو یکی را گم کند. **روی این ماشین قابل falsify کردن
     نیست** (`tests/conftest.py:104` هر تراکنش را `BEGIN IMMEDIATE` می‌کند و SQLite serialize می‌شود)؛
     پس فقط به‌عنوان ریسک ثبت شده، نه باگ اثبات‌شده — تست همزمانی واقعی جایش در CI با PG است.~~
     ⇒ **رفع شد در راند ۲۳ (C20):** تبدیلِ سهم با `UPDATE … WHERE status != 'PAID'` و جلوبردنِ
     شمارندۀ کل با `SET paid_amount = paid_amount + ?` در همان statement؛ ادعای «روی این ماشین
     falsify نمی‌شود» هم با pgserver باطل شد — دو پرداختِ همزمانِ ۱۰۰٬۰۰۰ریالی روی PG دقیقاً
     **۱۰۰٬۰۰۰** جا گذاشت (باید ۲۰۰٬۰۰۰ می‌شد).
- **شاهدِ قبل‑و‑بعد:** بک‌اند `tests/test_split_payment_settlement.py` (۷ تست) پیش از رفع ⇒
  **۶ failed، ۱ passed** (تستِ مرجع EQUAL سبز بود و همین تفاوت، منشأ نقص را تأیید می‌کرد)؛ فرانت
  `SplitPaymentsPanel.test.tsx` (۶ تست) پیش از رفع ⇒ **۶ failed** و پیام‌های شکست دقیقاً همان
  نقص‌ها بودند (`Unable to find: نیمه‌پرداخت` / `مهلت گذشته` / `۳۳٬۴۰۰` /
  `Unable to find role="button" name=/پرداخت سهم من/`)، نه ایراد هارنس.
- **تست‌ها (سطح unit/SQLite و jsdom):** جمعِ سهم‌ها == مبلغ کل برای سه حالت (۱/۳، ۱/۳ با ۱٬۰۰۰٬۰۰۱،
  ۱/۷ با ۹۹۹٬۹۹۹)؛ فاصلۀ سهم‌های با درصد یکسان ≤ ۱ ریال؛ پرداختِ همهٔ سهم‌ها ⇒ `COMPLETED` و
  `remaining == 0`؛ قاعدۀ EQUAL به‌عنوان مرجع؛ ۲ ریال برای ۳ عضو ⇒ ۴۲۲ با «ریال» در پیام (نه ۵۰۰)؛
  در UI: چیپ‌های PARTIAL/EXPIRED، نبودِ رشتهٔ `undefined` در DOM، نمایش پیشرفت، فراخوانی
  `payShare(41, 502, …)` با کلیکِ «پرداخت سهم من» و دو بار `getById` (تازه‌سازی)، نبودِ دکمه وقتی
  سهم من پرداخته، و انتقالِ `detail` فارسیِ سرور به toast.
- **معیار (شاهد، ۲۰۲۶-۱۰-۱۷):**
  | گیت | نتیجه |
  |---|---|
  | `pytest tests/test_split_payment_settlement.py tests/test_split_payments.py` | **۲۲ passed** (۷ جدید + ۱۵ تستِ از پیش موجودِ همان مسیر) |
  | همان دو فایل روی **استک pinned** (`sqlmodel 0.0.42`) | **۲۲ passed در 5.70s** |
  | `pytest` (رگرسیون کامل بک‌اند) | **۶۵۶ passed در 78.73s** |
  | `vitest run` (سوئیت فرانت) | **۱۶۴ passed در ۱۹ فایل** |
  | `ruff check app/ tests/ migrations/ --select E9,F82` | `All checks passed!` |
  | `app.openapi()['paths']` | **۲۳۸** (بدون تغییر؛ endpoint تازه‌ای اضافه نشد) |
  | `tsc --noEmit -p tsconfig.app.json` / `eslint --quiet` | exit **0** / exit **0** |
- **نکتۀ صداقت:** C11.3/C11.4/C11.5 در jsdom اثبات شدند؛ دیدنِ واقعیِ دکمه روی مرورگر/دستگاه همان
  مثل بقیۀ راندها به X1 (حساب تست) و X6 (deploy بک‌اند روی prod) وابسته است — روی prodِ فعلی،
  `pay_share` همان کدِ قبل از رفع است و سهم‌های درصدی هنوز یک ریال کم می‌آورند.

### C13 کوپن تخفیف: عمرِ ردیف مصرف و نگهبان ویرایش (بازبینی #4، P008) — راند ۱۶ ✅ دو نقص، هر دو رفع

> راند ۱۵ تمام شد و هنوز سه فایل پولِ ممیزی‌نشده روی میز بود (`coupons`، `reconciliation`,
> `slots` با شمارِ نامِ فایل در ۳۴ ماژول `app/api/v1/*.py`). `coupons.py` در هیچ راندی نامش
> نرفته بود؛ در UI اما کامل ساخته شده (`CouponsTab.tsx`, `CouponDialog.tsx` و شمارندهٔ
> `uses_count` در `CouponsTab.tsx:129-157`). همین تفاوت، جای دقیقِ نقص بود: **UI نگهبان داشت،
> API نه.**

- [x] C13.1 **چرخۀ «رزرو ← پرداخت ← لغو» یک کوپنِ یک‌بارمصرف را بی‌نهایت بار برمی‌گرداند:**
  `BookingService.cancel_booking()` بدون پرسیدنِ وضعیتِ پرداخت، `release_for_booking()` را صدا
  می‌زد؛ `release_by_id()` ردیف `coupon_redemptions` را **حذف** می‌کند و `uses_count` را کم می‌کند
  (`coupon_service.py:105-113`). با `per_user_limit=1` یعنی همان کاربر بعد از لغو (که روی رزروِ
  پرداخت‌شده **بازگشت وجه هم می‌زند**: `bookings.py:370-384`) دوباره کد را مجاز دارد — و چون ردیف
  ممیزی پاک شده، مدیر هیچ‌وقت نمی‌بیند چند بار. شاهدِ قبل از رفع: `test_cancel_of_paid_booking_keeps_coupon_burned`
  ⇒ **۴۰۰ انتظار، ۲۰۰ گرفت** («کد دوباره مصرف شد»).
  رفع: آزادسازی کوپن مشروط به «هیچ `BookingPayment` با وضعیت PAID روی این رزرو نیست» شد
  (`booking_service.py:216-221`). حالتِ **پرداخت‌نشده دست‌نخورده ماند** (پول جابه‌جا نشده ⇒ کد
  نباید بسوزد) و با تست جداگانه قفل شد؛ تست‌های از پیش موجودِ همین رفتار
  (`test_cancel_pending_releases_coupon`, `test_cancel_confirmed_booking_releases_coupon`،
  `test_expiry_task_releases_coupon`) سبز ماندند چون هیچ‌کدام پرداخت نمی‌کنند.
- [x] C13.2 **`PUT /coupons/{id}` نگهبانِ «درصد ≤ ۱۰۰٪» را نمی‌خواند:** بررسی فقط در
  `create_coupon` بود (`coupons.py:66-67` در نسخۀ قبل). `value` در دیتا `percent×100` است، پس
  percent=۱۰۰٬۰۰۰ یعنی ۱٬۰۰۰٪؛ `compute_discount()` آن را با `min(amount, …)` clamp می‌کند ⇒
  تخفیف = کل مبلغ. اندازه‌گیریِ پیامد (با درجِ همان وضعیت در دیتابیس، سطح unit):
  **`payment_amount=0`، `discount=250000`** ⇒ رزروِ رایگان. حالت دومِ همان سوراخ: تبدیل یک کوپن
  `fixed` ۵۰٬۰۰۰ ریالی به `percent` با همان `value` ⇒ ۵۰۰٪ (شاهد خام: پاسخ **۲۰۰** با
  `{"discount_type":"percent","value":50000}`). رفع: `_ensure_value_valid()` مشترک برای ساخت و
  ویرایش، و در ویرایش روی **جفتِ نهایی** (نوع و مقدارِ ارسال‌شده با جایگزینیِ مقدارِ فعلی) نه فقط
  فیلدهای ارسالی. UI از قبل `val > 100` را رد می‌کرد (`CouponDialog.tsx:93`) — حالا سرور هم رد
  می‌کند، همان درسی که راند ۱۴ از اعتبارسنجی کارتِ فقط-UI گرفت.
- [x] C13.3 ⚠️ ثبت شد، رفع نشد (دو گره):
  1. ~~**ظرفیت‌ها قفل ندارند:** `validate_and_compute()` می‌خواند `uses_count` و `per_user_limit` را،
     بعد `reserve()` دوباره همان `coupon`ِ در-حافظه را چک و `bump_uses()` می‌کند
     (`coupon_repository.py:42-51` read-modify-write). دو رزروِ موازیِ یک کدِ `max_uses=1` می‌توانند
     هر دو از validate رد شوند. **روی این ماشین falsify نمی‌شود** (`tests/conftest.py:104` ⇒
     `BEGIN IMMEDIATE`؛ همان دلیلِ C11.6.3) ⇒ جایش تست همزمانی روی PostgreSQL در CI است.~~
     ⇒ **رفع شد در راند ۲۳ (C20)** برای `max_uses` (نگهبان داخل WHERE خودِ UPDATE، با شاهدِ PG:
     دو رزروِ همزمان ⇒ یک ردیف مصرف و `uses_count = 1`). ~~**`per_user_limit` هنوز قفل ندارد** —
     چکِ آن در Python است (`coupon_service.py:59-64`) و گره‌اش باز ثبت می‌شود.~~
     ⇒ **رفع شد در راند ۲۴ (C21)**: نگهبان داخل خودِ INSERTِ ردیفِ مصرف، و شمارش بعد از
     قفلِ ردیفِ کوپن (شاهدِ PG: یک کاربر با سقفِ ۱ ⇒ یک ردیف؛ با سقفِ ۲ و سه درخواست ⇒ دو ردیف).
  2. **ردیف مصرف هیچ‌جا فهرست نمی‌شود:** نه endpoint `GET /coupons/{id}/redemptions`، نه در
     `CouponResponse`؛ مدیر فقط `uses_count` را می‌بیند. با C13.1 هم‌چنین یعنی «چه کسی و چقدر
     تخفیف گرفت» عملاً قابل ممیزی نیست — یک فیچر است نه باگ، و چون تصمیم UI دارد اینجا ثبت شد.
  3. (کوچک) `BookingRepository.cancel_booking()` (`booking_repository.py:113-120`) یک مسیرِ لغویِ
     دومی است که **هیچ callers** ندارد (`grep -rn ".cancel_booking(" app/ tests/` فقط
     `BookingService` را می‌دهد) ولی اگر کسی صدا بزندش، بازگشت وجه، کوپن و امتیاز را رد می‌کند.
     نامِ یکسان با سرویس، تله است؛ چون مرده است حذفش را به یک برشِ پاکسازی واگذار کردیم.
- **تست‌ها (سطح unit/SQLite):** ۵ تست در `tests/test_coupon_burn_and_edit_guard.py` — لغوِ
  پرداخت‌شده ⇒ ردیف redemption با `amount_discounted=50000` می‌ماند، `uses_count == 1`، و مصرفِ
  دوباره **۴۰۰ با «سقف»**؛ لغوِ پرداخت‌نشده ⇒ هنوز آزاد می‌شود و مصرفِ دوباره **۲۰۰**؛
  PUT با `value=100000` ⇒ ۴۰۰ و مقدارِ دیتابیس دست‌نخورده (۲۰۰۰)؛ PUT با تبدیل نوع به percent ⇒
  ۴۰۰ و کوپن `fixed` می‌ماند؛ PUT قانونی (۱۰۰۰ و بعد ۱۰۰۰۰ = دقیقاً ۱۰۰٪) ⇒ ۲۰۰.
- **معیار (شاهد، ۲۰۲۶-۱۰-۱۷):**
  | گیت | نتیجه |
  |---|---|
  | `pytest tests/test_coupon_burn_and_edit_guard.py tests/test_coupons.py` | **۱۵ passed** (۵ جدید + ۱۰ از پیش موجود) |
  | همان دو فایل روی **استک pinned** (`sqlmodel 0.0.42`) | **۱۵ passed در 5.29s** |
  | شاهدِ پیش از رفع (همان فایل جدید) | **۳ failed، ۲ passed** (۲ تستِ دفاعی سبز بودند) |
  | `pytest` (رگرسیون کامل بک‌اند) | **۶۶۱ passed در 65.71s** |
  | `ruff check app/ tests/ migrations/ --select E9,F82` | `All checks passed!` |
  | `app.openapi()['paths']` | **۲۳۸** (endpoint تازه‌ای اضافه نشد) |
- **فرانت این راند تغییر نکرد** (صادقانه): نگهبانِ درصد و نمایش `uses_count` در UI از قبل بود؛
  رفع‌ها سمتِ سرورند و سوئیت فرانت بی‌تغییر **۱۶۴ passed** ماند (E6).
- **نکتۀ صداقت:** C13.1 روی `mock` gateway اثبات شد (ساخت فاکتور + `/pay` با کارتِ تستی در همان
  هارنس). روی درگاه واقعی، توالی «webhook → PAID → لغو» همان شرط را می‌زند، ولی شاهدِ زنده‌اش تا
  X4/X6 نداریم.

---

### C14 مغایرگیری دفتر کل ↔ درگاه: جدولِ گزارشِ غایب، کلیدِ مقایسه و دروازۀ دسترسی (بازبینی #4، مالی) — راند ۱۷ ✅ پنج نقص، هر پنج رفع + چهار گره ثبت‌شده

> بعد از راند ۱۶ فقط دو فایلِ پولیِ «هیچ‌وقت با نامشان ممیزی نشده» مانده بود:
> `app/api/v1/reconciliation.py` و `app/api/v1/slots.py` (از ۳۴ ماژول `app/api/v1/*.py`).
> اولی بدترین نوع توهم بود: **سه endpoint در OpenAPI زنده بود، ولی جدولی که گزارش در آن
> نوشته شود هرگز ساخته نشده بود** — یعنی پاسخِ «صفر مغایرت» نه از مقایسه، از نبودِ جدول می‌آمد.

- [x] C14.1 **جدولِ گزارش وجود نداشت ⇒ همۀ «همه‌چیز درست است» کاذب:** `app/models/reconciliation_report.py`
  غایب بود و در زنجیرۀ alembic (`m0s021`…`m0s026`) هیچ مهاجرتی برای `reconciliation_reports` نبود.
  هر دو خواندنی `try: from app.models.reconciliation_report import ReconciliationReport` را با
  `except ImportError: return {"total": 0, …, "items": []}` می‌پوشاندند (سطح unit، شاهد: پیش از رفع
  `GET /reconciliation/reports` **۲۰۰ با صفر ردیف** روی دیتابیسی که پرداخت و ردیف دفتر کل داشت).
  بدتر: همان کد ستون‌های `ReconciliationReport.date` و `.data` را می‌خواند که روی هیچ مدلی وجود
  نداشتند — اگر فقط فایل مدل ساخته می‌شد، `AttributeError` می‌آمد و `except ImportError` آن را
  نمی‌گرفت ⇒ **۵۰۰**. خودِ task هم در docstring‌اش نوشته بود «Results stored in
  reconciliation_report table (to be created)» و نوشتن را در `try/except Exception` پیچیده بود.
  رفع: مدلِ واقعی + مهاجرت `m0s027reconreports` (جدول، چهار ایندکس، `uq_reconciliation_period`،
  FK به `users.id`، enum بومی `reconciliationstatus`) + `ReconciliationService.save/run` با
  upsert-per-period.
- [x] C14.2 **کلیدِ مقایسه غلط بود: `source_id` با `booking_id`:** ردیف درآمدِ دفتر کل با
  `source_type=booking_payment` و `source_id=payment.id` نوشته می‌شود (`payments.py:137` مسیر mock،
  `payments.py:246` webhook، `contract_service.py:522`، `game_service.py:1129`)، ولی کارِ قبلی
  `ledger_by_booking[txn.source_id]` را با `gateway_by_booking[payment.booking_id]` می‌ساخت.
  **شاهدِ اندازه‌گیری‌شده روی داده‌ای که ۱۰۰٪ سالم ساخته شده بود** (دو رزرو؛ رزرو ۱ سه سهم
  ۵۰٬۰۰۰/۷۰٬۰۰۰/۸۰٬۰۰۰ و رزرو ۲ یک پرداخت ۲۰۰٬۰۰۰ ریالی، هر چهار ردیف دفتر کل دقیقاً هم‌مبلغ خودِ پرداخت):
  الگوریتم قدیمی **۴ مغایرت** گزارش کرد — `amount_mismatch` با «دفتر کل ۵۰٬۰۰۰ / درگاه ۸۰٬۰۰۰»
  (اختلاف −۳۰٬۰۰۰)، `amount_mismatch` با «دفتر کل ۷۰٬۰۰۰ / درگاه ۲۰۰٬۰۰۰» (اختلاف −۱۳۰٬۰۰۰:
  ردیفِ پرداخت ۲ با رزرو ۲ مقایسه شد، چون شمارۀ پرداخت با شمارۀ رزروِ دیگر تصادفاً برابر بود)، و دو
  `ledger_without_gateway` برای دو ردیفِ کاملاً سالم. الگوریتم جدید روی همان داده:
  `payments_checked=4، mismatch_count=0`. متنِ کاملِ شاهد: `~/.qoder-tmp/c14_old_algorithm_witness.txt`
  (اسکریپت بازتولید: `~/.qoder-tmp/c14_witness_probe.py`، سطح unit/SQLite).
- [x] C14.3 **بازه روی `created_at` (زمانِ نوشتنِ ردیف) بود، نه `occurred_at` (مبنای همۀ گزارش‌های
  مالی):** همان اسکریپت شاهد، با فیلترِ `created_at` دقیقاً مثل نسخۀ ship‌شده، **هر چهار ردیف دفتر کل
  را بیرونِ بازه انداخت** (`ledger=0`) ⇒ خروجی تبدیل شد به دو `gateway_without_ledger` جعلی («پرداخت
  موفق ولی در دفتر کل ثبت نشده») روی داده‌ای که هر چهار ردیفش وجود داشت. رفع: بردِ روز با
  `date(…) >= 'YYYY-MM-DD'` روی `BookingPayment.paid_at` و `FinancialTransaction.occurred_at`
  (الگوی `transaction_repository._range`) — همان کلاسِ باگی که راند ۲۷ از naive/aware ردیف کرد.
- [x] C14.4 **ردیفِ بازگشت وجه «درآمد» شمرده می‌شد و نقشه overwrite می‌کرد:** فیلتر قبلی فقط
  `source_type == "booking_payment"` بود بدون `direction`/`type`، درحالی‌که برگشتِ وجه با **همان**
  جفت `(source_type, source_id)` و `direction=EXPENSE/type=REFUND` نوشته می‌شود؛ ضمن اینکه
  `ledger_by_booking[k] = txn` برای چند ردیفِ هم‌کلید فقط آخرین را نگه می‌داشت (پرداختِ چندسهمیِ
  P003). رفع: aggregationِ خالص (`_sums()` با `GROUP BY source_id` و حذف `VOIDED`) per-payment،
  به‌علاوه دو قاعده‌ای که قبلاً اصلاً وجود نداشتند: `refund_without_ledger` (وضعیت REFUNDED ولی
  برگشتِ کمتری در دفتر) و `refunded_while_paid` (برگشت ثبت شده ولی پرداخت هنوز paid).
- [x] C14.5 **دروازۀ خواندن و `total` جعلی:** `GET /reports` و `GET /reports/{id}` با
  `get_current_manager` بودند (docstring: «managers only») درحالی‌که هر گزارش **کلِ دفتر کل** را
  می‌دهد (شمارۀ پرداخت و رزروِ همۀ سالن‌ها) ⇒ هر مدیرِ سالن می‌توانست مغایرت‌های سالن دیگر را
  ببیند؛ `/run` درست روی SUPER_ADMIN بود. رفع: `_require_super_admin()` روی هر سه (تست: مدیر ⇒ ۴۰۳،
  سرپرست ⇒ ۲۰۰). `total` هم `len(reports)` بود یعنی طولِ صفحه، نه شمارِ کل ⇒ `select(func.count())`.
- [x] C14.6 ⚠️ ثبت شد، رفع نشد (چهار گره):
  1. **گزارش سراسری است، نه per-venue:** جدول `venue_id` ندارد. تا وقتی ندارد، «مغایرتِ سالن من»
     قابل نمایش نیست — و این دقیقاً همان چیزی است که یک مدیر مصرف می‌کند. تصمیم UI/محصول.
  2. **مصرف‌کنندۀ UI ندارد:** `reconciliation` در `frontend/src` صفر بار ذکر شده (grep)؛ یعنی کل
     فیچر — حتی در حالت درستِ جدید — هیچ‌جا دیده نمی‌شود. هم‌خانوادۀ C13.3.2 (ردیفِ مصرفِ کوپن).
  3. **«دیروز» بر مبنای UTC:** task بازۀ `[دیروزِ UTC]` را می‌گیرد و روی PG مرزِ روزِ `date(timestamptz)`
     به TimeZone سشن وابسته است (شاهدِ همین راند: `SERVER TZ: GMT` روی pgserver). تا تصمیمِ واحدِ
     «روزِ مالیِ تهران» گرفته نشود، گزارشِ نیمه‌شب می‌تواند یک پرداختِ ۲۳:۳۰ را با ردیفِ
     دفترکلی‌اش در دو روزِ متفاوت ببیند — کد این حالت را با «پرداختِ paid/refunded ⇒ مغایرت نیست»
     خنثی می‌کند، ولی **یک روز جابه‌جایی** در شمارشِ `payments_checked` باقی می‌ماند.
  4. **`slots.py` (دومین فایلِ ممیزی‌شدۀ این راند):** نقصِ commitِ جاافتاده نداشت (UoW در مسیر موفق
     commit می‌کند)، ولی `POST /slots/generate/{venue_id}؟slot_date=گذشته` هیچ نگهبانی ندارد
     (`slot_repository.py:194-216` تاریخ را نمی‌پرسد) و `GET /slots/range` (`slots.py:48-56`) نه
     طولِ بازه را می‌سنجد نه `start > end` را؛ در مقابل `block/unblock` نگهبان `is_past_slot` دارند
     (`slots.py:86,106`) ⇒ ناسازگاریِ صریح در یک فایل. رفعش یک فیچر-تصمیم است (تاریخِ گذشته برای
     ثبتِ مالیِ رزروهای قدیمی لازم است) پس فقط ثبت شد.
- **تست‌ها (سطح unit/SQLite):** ۱۳ تست در `tests/test_reconciliation_reports.py` — جفتِ سالم ⇒ صفر؛
  ردیفِ دفتر کلِ مفقود ⇒ `payment_without_ledger`؛ مبلغِ نابرابر ⇒ `amount_mismatch` با
  `difference=20000` و واحدِ «ریال» (نه تومان)؛ برخوردِ idِ دو جدول ⇒ پرچمِ درست؛ پرداختِ سه‌سهمه ⇒
  فقط سهمِ بی‌ردیف علامت می‌خورد؛ جفتِ بازگشت‌خورده ⇒ صفر؛ برگشتِ بی‌ردیف ⇒ `refund_without_ledger`؛
  برگشت روی paid ⇒ `refunded_while_paid`؛ ردیفِ درآمد برای پرداخت FAILED ⇒
  `ledger_without_paid_payment` با `payment_status == "failed"` (این تست نقضِ خودِ سرویس را گرفت:
  `str(member)` مقدارِ enum نمی‌دهد، نامِ عضو — `getattr(st, "value", …)` لازم است)؛ `run` و اجرای
  دوباره ⇒ یک ردیف با وضعیتِ flip؛ فهرست ⇒ ۴۰۳ برای مدیر و ۲۰۰ + `total` واقعی برای سرپرست؛
  جزئیات ⇒ ۴۰۰ نه، **۴۰۴** با «گزارش یافت نشد»؛ `/run` زیر Celery eager ⇒ ردیف می‌نویسد.
- **معیار (شاهد، ۲۰۲۶-۱۰-۱۷):**
  | گیت | نتیجه |
  |---|---|
  | `pytest tests/test_reconciliation_reports.py` | **۱۳ passed** (بعد از هر ویرایش دوباره: ۱۳ passed در 4.29s) |
  | همان فایل روی **استک pinned** (`sqlmodel 0.0.42`) | **۱۳ passed در 2.11s** |
  | شاهدِ پیش از رفع (دبارِ C14.2/C14.3) | **۴ مغایرت جعلی** / **۲ مغایرت جعلی** ⇒ جدید **۰** |
  | `pytest` (رگرسیون کامل بک‌اند، روی درختِ نهایی) | **۶۷۴ passed در 77.59s** (= ۶۶۱ راند ۱۶ + ۱۳) |
  | `ruff check app/ tests/ migrations/ --select E9,F82` + ruff روی پنج فایل جدید/تغییریافته | `All checks passed!` |
  | `app.openapi()['paths']` | **۲۳۸** (سه endpoint موجود، هیچ مسیر تازه‌ای نه) |
  | `pnpm test` (فرانت، دست‌نخورده) | **۱۶۴ passed در ۱۹ فایل، 19.06s** |
  | **PostgreSQL واقعی** (`~/.qoder-tmp/pg_recon17.py` با pgserver) | up→down −1→up پاک · `status = USER-DEFINED/reconciliationstatus` با برچسب‌های `COMPLETED, ISSUES_FOUND` · `uq_reconciliation_period:u` + `fk_reconciliation_reports_triggered_by:f` + چهار ایندکس · `generated_at = timestamptz` · داده‌های کاشته‌شده: `payments_checked=3` و دقیقاً دو مغایرت درست (`payment_without_ledger #2`، `amount_mismatch #3 با difference 10000`) · اجرای دوباره ⇒ **یک** ردیف · `count(*) WHERE date(paid_at)` ⇒ ۳ |
- **نکتۀ صداقت:** این مغایرگیریِ **دفتر کل ↔ رکوردِ پرداخت داخل همان دیتابیس** است، نه دفتر کل ↔
  صورت‌حسابِ خودِ درگاه؛ «gateway_amount» در پیاده‌سازیِ فعلی همان `BookingPayment.amount` است که
  webhook نوشته. تا X4 (قرارداد درگاه) و دریافتِ settlement file، هیچ کد نمی‌تواند ادعا کند
  «پول واقعاً در درگاه نشسته» — و این دقیقاً همان چیزی است که نامِ فیچر وعده می‌دهد.

---

### C15 اشتراک باشگاه: واحدِ پول، حقِ جلسه و فاکتورِ پرداختِ ناموفق (بازبینی #4، مالی) — راند ۱۸ ✅ سه نقص رفع + یک تستِ ناپایدار رفع

> `memberships.py` هفتمین فایلِ پولیِ ممیزی‌شده بود و در همۀ راندهای قبل **یک بار هم نامش در
> این سند نیامده بود** (`grep -c` روی `FINAL_REVIEW_TASKS.md` ⇒ صفر). سوئیت بک‌اند هم **هیچ تستی
> برای اشتراک نداشت** (`ls tests/ | grep -i member` ⇒ خالی) — یعنی مسیرِ صدور فاکتور، پرداخت،
> ثبتِ درآمد و کسرِ جلسه بی‌پوشش بود.

- [x] C15.1 **واحدِ پولِ اشتراک با واحدِ همۀ مصرف‌کننده‌هایش یکی نبود:** `MembershipPlan.price`
  و `MembershipPurchase.amount` در مودل و اسکیم «به **تومان**» توضیح داده شده بودند
  (`models/membership.py:33,51`، `schemas/membership.py:11`)، درحالی‌که
  `FinancialTransaction.amount` «مثبت به **ریال**» است (`transaction.py:96`)، `formatPrice` عدد را
  «ریال» چاپ می‌کند (`frontend/src/lib/utils.ts:10`) و تایپِ فرانت هم `// ریال` است
  (`src/types/membership.ts:12`). و سیدِرِ واقعیِ باشگاه‌ها همان قیمتِ منبع را **تقسیم بر ۱۰**
  می‌کرد: `_seed_session_plan(..., price_rial)` با `price_toman = price_rial // 10`
  (بایتِ `seed_gyms_poolticket.py:521-525` در نسخۀ قبل) — درحالی‌که هفت خط بالاتر، همان اسکریپت
  قیمت منبع را در توضیحِ سالن «قیمت جلسه (**ریال**): ۱۴۰۰۰۰۰» می‌نویسد (`:558`).
  **پیامدِ اندازه‌گیری‌شده (سطح unit):** یک جلسه روی صفحۀ سالن ۱٬۴۰۰٬۰۰۰ و روی کارتِ پلن
  **۱۴۰٬۰۰۰** دیده می‌شد، فاکتور به همان ۱۴۰٬۰۰۰ صادر و در دفتر کل هم *به‌عنوان ریال* ثبت می‌شد ⇒
  درآمدِ اشتراک در کنسول مالی **۱۰× کمتر** از مبلغِ واقعی. رفع: سیدر دیگر تقسیم نمی‌کند و
  توضیحِ هر سه ستون/فیلد «ریال» شد (تک‌واحد، همان درسی که راند ۱۷ از «ریال نه تومان» گرفت).
- [x] C15.2 **نگهبانِ «نوع، مقدار» فقط در `POST` بود و `pay_purchase` مقدارِ خالی را بی‌صدا
  جایگزین می‌کرد:** `PUT /memberships/plans/{id}` هر چیزی را بدون بررسی می‌نشاند
  (`for k, v in updates.items(): setattr(...)`) و پرداخت دو fallback داشت —
  `plan.sessions_count or 1` و `plan.duration_days or 30`. ترکیب‌شان یعنی
  `{"sessions_count": null}` روی پکِ ۱۰جلسه‌ای ⇒ خریدار پولِ ۱۰ جلسه می‌دهد و
  **۱ جلسه** می‌گیرد (و ماهانۀ ۴۵روزه به ۳۰ روز برمی‌گشت). رفع: `_ensure_plan_shape_valid()`
  مشترک برای ساخت **و ویرایش روی جفتِ نهایی** و در مسیرِ پرداخت، با ۴۰۰ِ صریح به‌جای
  fallback — همان الگوی `_ensure_value_valid()` راند ۱۶، این بار روی entitlement.
  شواهدِ پیش از رفع (با برگرداندنِ `memberships.py` و سیدر): `PUT` با null ⇒ **۲۰۰** و
  `sessions_count` تهی‌شدن؛ پرداختِ همان پلن ⇒ **۲۰۰ با `sessions_remaining=1`**؛
  سید ⇒ **۱۴۰٬۰۰۰**.
- [x] C15.3 **کارتِ بی‌اعتبار، فاکتور را لغو و commit می‌کرد:** `pay_purchase` قبل از
  `raise HTTPException(400)` مقدار `purchase.status = CANCELLED` را ذخیره می‌کرد
  (`memberships.py:218-222` نسخۀ قبل) — یعنی اشتباهِ تایپیِ یک رقم، فاکتور را «لغو» نشان می‌داد؛
  و چون شرطِ تکرارِ پرداخت فقط `PAID` بود، همان فاکتورِ لغو‌شده بعداً قابل پرداخت بود ⇒ **لغو هیچ
  معنایی نداشت** و وضعیتِ ماندگار توسط یک خطایِ اعتبارسنجی عوض می‌شد. رفع: اعتبارسنجی، حالتی
  نمی‌نویسد. شاهدِ پیش از رفع: `status == "cancelled"` پس از پاسخِ ۴۰۰.
- [x] C15.4 **تستِ ناپایدارِ زمان‌محور که گیت را می‌شکست:** `tests/test_coach.py::
  test_dashboard_upcoming_excludes_past` با `_today_at(1)` («امروز ساعت ۰۱:۰۰ UTC») ردیفِ
  «گذشته» می‌ساخت؛ در بازۀ **۰۰:۰۰ تا ۰۱:۰۰ UTC** آن زمان به‌آینده می‌افتد و تست می‌بازد — و
  رانرهای GitHub Actions دقیقاً UTC‌اند. شاهد: سوئیت کامل روی `2026-10-17T00:22Z` ⇒
  **۲ failed، 682 passed**; از آن دو، `test_admin_approval_flow` از تداخلِ اجرای موازیِ SQLite
  بود و تنها باز اجرا شد ⇒ سبز (سطح local، نه CI)، ولی این یکی واقعاً باگِ تست بود. رفع:
  «دیروزِ ساعت ۱» جانشین شد و همان سوئیت ⇒ **۶۸۴ passed**. (خانوادۀ `_today_at(هزارِ ۸ تا ۲۰)`
  در این فایل باقی است؛ هیچ‌کدام از آن‌ها «گذشته/آینده» را ادعا نمی‌کنند — فقط می‌شمارند — پس
  دست‌نخورده ماند.)
- [x] C15.5 ⚠️ ثبت شد، رفع نشد (هشت گره؛ همۀ عدد‌ها از کد/اندازۀ همین راند) ⇒ **وضعیتِ ۲۰۲۶-۱۰-۱۷
  بعد از راند ۲۲: شش تا رفع/تصحیح شد (۱ → C18، ۳ → C19 و ۲، ۵، ۷، ۸ → C17) و دو تا باقی است
  (۴ = دادهٔ سیدر، ۶ = قراردادِ درگاه/X4):**
  1. ~~**بازگشتِ وجه برای اشتراک وجود ندارد:** `PurchaseStatus` فقط `PENDING/PAID/CANCELLED` است و
     هیچ مسیری از `PAID` به بیرون نیست ⇒ ردیفِ درآمدِ دفتر کل تا ابد می‌ماند. (همان اصلِ C7 که
     برای رزرو رعایت شده.)~~ ⇒ **رفع شد در راند ۲۱ (C18):** `PurchaseStatus.REFUNDED` +
     `POST /memberships/purchases/{id}/refund` که ردیفِ `refund/expense` می‌نویسد و اعتبار را صفر می‌کند.
  2. ~~**درآمدِ اشتراک هیچ‌جا خوانده نمی‌شود**~~ ⇒ **ادعای غلط؛ در راند ۲۰ تصحیح و با تست قفل شد
     (C17.4):** `TransactionRepository.revenue_by_source` عمومی است و روی `source_type` گروه‌بندی
     می‌کند، پس `membership_purchase` در `GET /finance/revenue/by-source` شمرده می‌شود. آنچه درست
     بود: **مغایرگیریِ درگاه** اشتراک را نمی‌بیند، چون آن مسیر روی `BookingPayment.id` join
     می‌کند و اشتراک ردیفِ درگاهی ندارد (C14) — طراحی، نه نقصِ خواندن.
  3. ~~**`consume_session` هم race است هم بی‌ممیزی:** `sessions_remaining -= 1` read-modify-write و
     هیچ رویدادِ audit («چه کسی، کِی») ثبت نمی‌شود؛ روی این ماشین falsify نمی‌شود
     (`tests/conftest.py:104` ⇒ `BEGIN IMMEDIATE`) — هم‌خانوادۀ C13.3.1.~~ ⇒ **رفع شد در راند ۲۲
     (C19):** `MembershipSessionEvent` + مهاجرتِ `m0s028memberevents` و `UPDATE` شرطیِ
     تنها-کوئری؛ ادعای «روی این ماشین falsify نمی‌شود» هم با pgserver (PostgreSQL واقعی) باطل شد —
     race روی MVCC بازتولید و بسته شد.
  4. **داده‌ای که سیدر ساخته تصحیح نمی‌شود:** `_seed_session_plan` idempotent است
     (`if existing: return`) ⇒ ردیف‌هایِ از قبل کاشته‌شده همان ۱۰×ِ کم می‌مانند. قبل از X6 باید
     بررسی شود که سیدر روی prod اجرا شده باشد یا نه (اصلاحِ داده ×۱۰ لازم است).
  5. ~~**پرداختِ فاکتورِ پلنِ غیرفعال مجاز است**~~ ⇒ **رفع شد در راند ۲۰ (C17.1):**
     `pay_purchase` هم نگهبانِ `is_active` گرفت، مثلِ `create_purchase`.
  6. **`cvv/month/year` خوانده نمی‌شوند و `transaction_id` ساختگی است**
     (`secrets.token_hex(8).upper()`) ⇒ رسیدِ پرداخت، mock است (همان نکتۀ صداقتِ راند ۱۶؛ تا X4).
  7. ~~**`GET /plans` عمومی است و `include_inactive=true`** پلن‌های غیرفعال و قیمت‌هایشان را هم
     می‌دهد~~ ⇒ **رفع شد در راند ۲۰ (C17.2):** نگهبانِ نقش‌محور (مدیرِ همان سالن یا super_admin)
     با احراز هویتِ اختیاری؛ مهمان و مدیرِ سالنِ دیگر و مشتری ⇒ ۴۰۳.
  8. ~~**`GET /memberships/venue/{id}/purchases` و `/my` N+1‌اند**~~ ⇒ **رفع شد در راند ۲۰
     (C17.3):** `joinedload` روی رابطۀ `plan`/`venue`؛ شیبِ ۲ کوئری به‌ازای هر ردیف صفر شد
     (اندازۀ قبل و بعد در C17).
- **تست‌ها (سطح unit/SQLite):** ۱۰ تست در `tests/test_membership_units_and_entitlement.py` —
  سیدر price=1_400_000 را می‌گذارد نه ۱۴۰٬۰۰۰؛ فاکتور/پرداخت/دفتر کل هر سه یک عددِ ریالی؛
  `PUT` با null ⇒ ۴۰۰ و دیتابیس دست‌نخورده (جلسه و duration_days)؛ پلنِ بی‌جلسه ⇒ پرداخت ۴۰۰ و
  فاکتور `pending` می‌ماند؛ ۴۵ روز ⇒ ۴۵ روز اعتبار؛ پلنِ «جلسه‌ای» ⇒ ۱ جلسه (رفتارِ درست حفظ شد)؛
  کارتِ ۱۵رقمی ⇒ ۴۰۰ و فاکتور `pending`، و بعد با کارتِ درست پرداخت می‌شود؛ پرداختِ دوباره ⇒ ۴۰۰ و
  **یک** ردیف درآمد؛ `/consume` تا صفر و بعد از آن ۴۰۰ (بی‌عددِ منفی).
- **معیار (شاهد، ۲۰۲۶-۱۰-۱۷):**
  | گیت | نتیجه |
  |---|---|
  | `pytest tests/test_membership_units_and_entitlement.py` | **۱۰ passed** |
  | همان فایل + `tests/test_coach.py` روی **استک pinned** (`sqlmodel 0.0.42`) | **۳۷ passed در 18.02s** |
  | شاهدِ پیش از رفع (فقط با برگرداندن `memberships.py` و `seed_gyms_poolticket.py`) | **۵ failed، ۵ passed** |
  | `pytest` (رگرسیون کامل بک‌اند) | **۶۸۴ passed در 175.02s** (= ۶۷۴ راند ۱۷ + ۱۰) |
  | اجرای کاملِ قبلِ رفعِ تستِ زمان‌محور | **۲ failed، 682 passed** روی `2026-10-17T00:22Z` |
  | `ruff --select E9,F82` + ruff قواعدِ پیش‌فرض روی فایل‌های این راند | `All checks passed!` |
  | `app.openapi()['paths']` | **۲۳۸** (همان هفت مسیر `/memberships/*`) |
- **فرانت این راند تغییر نکرد** (صادقانه): `formatPrice` از قبل ریال می‌گفت و `types/membership.ts`
  هم ریال؛ نقص در قراردادِ سمتِ سرور و در سیدر بود، پس سوئیت فرانت دست‌نخورده می‌ماند (E6/E7:
  **۱۶۴ passed**).

---

### C16 دروازۀ E2E: از «قرمزِ بی‌صدا» تا گیتِ خوانا (بازبینی #4، UI/تست) — راند ۱۹ ✅ دو باگِ واقعیِ محصول + شش ادعای کهنه + کانالِ خواندن

**چرا این راند باز شد:** شغلِ `e2e-tests` در `web-tests.yml` با `continue-on-error: true` بود، پس
workflow سبز خوانده می‌شد در حالی که خودِ job قرمز است. متنِ لاگ و zipِ artifact با توکنِ این ماشین
خواندنی نیستند (۴۰۳ با Authorization، ۴۰۱ بی‌آن) ⇒ دلیلِ شکست هیچ‌جا دیده نمی‌شد و فقط «exit code 1»
می‌ماند. با `GET /actions/jobs` شمارش شد: از `0598992` تا `5dca91a` **۱۲ اجرای متوالی** قرمز (بیش از
۱۱ ساعت) بدونِ هیچ سرنخِ قابل‌خواندن.

- **C16.1 کانالِ خواندن (زیرساختِ تشخیص، نه فیچر):** `reporter` به `['html'], ['list'], ['json']`
  نشست و `scripts/e2e-annotations.mjs` همان `results.json` را به annotation تبدیل می‌کند (یک `::error::`
  با `file`/`line`/پیام برای هر شکست + یک `::notice::` خلاصه). اعتبارسنجی پیش از push: اجرای اولِ لوکال
  دقیقاً همان **۷ spec** شکست‌خورده را با پیامِ کامل بيرون داد — یعنی کانال کار می‌کند حتی وقتی لاگ بسته است.
- **C16.2 باگ‌های واقعیِ محصول که همین in‌ست‌ها لو دادند** (رفع در کد، نه در تست):

  | # | نقص | شاهد | رفع |
  |---|---|---|---|
  | C16.2.1 | شش فیلدِ فقط‌با-placeholder نامِ قابل‌دسترس نداشتند: `aria-label` روی **ریشۀ** `TextField`/`InputBase` روی `div`والد می‌نشیند | probe روی مرورگر واقعی: `{"name":"phone","type":"text","id":":rb:","ariaLabel":null,"labelledby":null,"closestLabel":null,"placeholder":"09xxxxxxxxx"}` | `slotProps.htmlInput` (Login.tsx:203 و :223، TeamDiscover.tsx:168، CustomerDetailDialog.tsx:183، TransactionEntryDialog.tsx:288، ManagerDashboard.tsx:2629) و `slotProps.input` برای `InputBase` (admin/Users.tsx:151) |
  | C16.2.2 | صفحه هیچ landmark ناوبری‌ای نداشت: ردیفِ دکمه‌های هدر یک `Box` بی‌نقش بود | `nav[aria-label]` در DOMِ صفحۀ اصلی فقط نوارِ پایینِ موبایل بود؛ در ۱۲۸۰px هیچ nav | `Navbar.tsx:185` → `component="nav"` با `aria-label="ناوبری بخش‌ها"`؛ نوارِ پایین «ناوبری اصلی» را نگه داشت تا دو ناوبری هم‌نام در DOM نماند |
  | C16.2.3 | `inputMode="tel"` هم روی ریشه بود ⇒ کیبوردِ شماره روی موبایل فعال نمی‌شد | همان probe (attribute روی input نبود) | کنارِ نام، روی `htmlInput` نشست (Login.tsx:203) و e2e آن را می‌سنجد |

- **C16.3 بدهیِ specها** (چیزی که می‌باخت یا هیچ‌چیز نمی‌سنجید):

  | ادعای قبلی | چرا باخت/بی‌ادعا بود | ادعای جدید |
  |---|---|---|
  | `input[type=email]` در `/login` | ورودِ این سامانه تلفن+رمز است؛ `email` هرگز در DOM نبود | `getByLabel('شماره تلفن همراه')` + `inputmode=tel` + `getByLabel('رمز عبور')` با `type=password` |
  | `text=همین حالا سانس رزرو کن` در ۱۴۴۰px | آن نص فقط برای کاربرِ لاگین‌شده است؛ CI همیشه مهمان است | regex هر دو حالت: `همین حالا (سانس رزرو کن|رایگان شروع کن)` |
  | `[style*="grid"]` در ۷۶۸px | MUI گرید را **کلاسی** می‌سازد، نه inline؛ سلکتور هرگز نمی‌خورد | هندسۀ واقعی: چند `left` متمایز در شش کارت اول ≥ ۲ |
  | `.count()` بلافاصله بعد از `goto('/venues')` برای skeleton | در آن لحظه نه skeleton نشسته بود نه کارت ⇒ جمع صفر | `expect.poll` تا ۱۵s روی «یکی از دو حالت» |
  | `text=رزرویی یافت نشد` یا `text=وارد شوید` در `/bookings` | `ProtectedRoute` مهمان را به `/login` می‌فرستد و آن دو نص هیچ‌جا در آن صفحه نیست | `toHaveURL(/\/login/)` + دیدنی‌بودنِ فیلدِ تلفن |
  | «هر input یا `aria-label` دارد یا `id`» | MUI همیشه `id` می‌گذارد ⇒ شرط همیشه سبز و نامِ قابل‌دسترسِ خالی را نمی‌گرفت | هیچ `input`ی نباید بی‌نام بماند (`evaluateAll` روی aria-label/labelledby/label) و آرایه باید خالی باشد |
  | دو `test.skip()` با «needs mocking» | هیچ‌چیز نمی‌سنجید و عددِ skipped را بالا می‌برد | با `page.route` روی `**/api/v1/venues**`: حالتِ خطا دیدنی است و «تلاش مجدد» واقعاً دوباره درخواست می‌زند و کارت‌ها می‌آیند |

- **C16.4 گیت‌ها:** `continue-on-error: true → false` (ادامه‌اش همان دروازۀ ساعت‌ها-قرمز-بی‌صدا بود)؛
  `timeout: 60_000` — شاهد: نخستین `goto` روی vite تازه‌ساز **30.3s** خورد و retry آن را در **9.6s** رد کرد،
  یعنی سرد-شدنِ build تست را flaky می‌کرد؛ CI فقط `--project=chromium` و `edge` فقط لوکال (دانلودِ Chromium
  روی این ماشین مسدود: `playwright install chromium` → «Download failure, code=1»)؛
  `playwright-report/` و `test-results/` به `.gitignore` رفتند تا خروجیِ تولیدی commit نشود.
- **C16.5 گره‌های باقی‌مانده (بدونِ عدد):**
  1. پنج `Select` با `label` (CampaignsTab.tsx:129، CustomersTab.tsx:150، StaffTab.tsx:196 و :440،
     admin/Users.tsx:221) سنجیده **نشدند** — صفحه‌های CRM/کمپین/کارکن/ادمین پشت `ProtectedRoute`اند و
     حساب تست نداریم (X1). اگر همان الگوی `aria-label` را داشته باشند، نقصشان از این نوع است.
  2. رفعِ چهار فیلدِ صفحه‌های ادمین/مدیر/CRM/مالی فقط **در سطح واحد** قفل شد
     (`src/lib/fieldAccessibleName.test.tsx`: الگوی درست → `getByLabelText` همان `INPUT` را می‌دهد؛
     الگوی شکسته → همان تابع **DIV** را برمی‌گرداند و `input[aria-label]` وجود ندارد)، نه روی صفحه.
  3. هر ۲۰ spec مهمان‌محور است؛ هیچflowِ احراز-هویتی (رزرو، پرداخت، کنسول مدیر) در e2e پوشش ندارد — تا X1.
  4. چهار spec به داده‌های واقعیِ `/api/v1/venues` وابسته‌اند؛ اگر runner گیتب به `2.189.255.225` نرسد
     می‌بازند و این با X9/X4 قاطی می‌شود — دقیقاً برای همین annotation گذاشته شد تا از روی پیام قضاوت شود.
     **این گره با شاهدِ CI باز شد**: روی `06429e47` همان سوئیت سبز شد ⇒ runner به آن IP می‌رسد.
     نکتۀ صداقت: سبز شدن با بک‌اندِ prod یعنی این تست‌ها با داده‌های واقعیِ در حال تغییر می‌خورند؛
     اگر someday دیتای prod خالی/کند شود، این gate هم می‌شکند و باید به fixture محلی برگردند.
  5. `trace: on-first-retry` و `workers: CI?1` بی‌تغییر ماند؛ یعنی ردیابیِ شکستِ CI همچنان فقط در
     artifact است که با این توکن خوانده نمی‌شود.
- **معیار (شاهد، ۲۰۲۶-۱۰-۱۷، سطح local):**
  | گیت | نتیجه |
  |---|---|
  | Playwright `--project=edge` با `CI=true` (workers=1، retries=2) | **۲۰ passed، ۰ failed، ۰ skipped، ۰ flaky در 44.2s** |
  | اجرای میانی (specهای بازنویسی‌شده، قبل از رفعِ کد) | **۱۴ passed، ۳ failed، ۱ flaky، ۲ skipped** — آن سه شکست همان C16.2.1 بود، پس رفع در محصول لازم بود نه تغییر سلکتور |
  | اجرای نخست (پیش از بازنویسی specها) | **۷ spec شکست** — همه از C16.3 |
  | `pnpm exec tsc --noEmit` (همان دستور CI) | **صفر خطا** |
  | سوئیت واحد فرانت (۴ دسته × ۵ فایل) | **۱۶۷ passed / ۰ failed** در ۲۰ فایل (= ۱۶۴ راند ۱۸ + ۳ نگهبانِ جدید) |
  | `pnpm run lint` + eslint روی `e2e/` و تستِ جدید | پاک |
  | خروجیِ emitter | `::notice title=E2E summary::20 spec؛ expected=20 unexpected=0 flaky=0 skipped=0` |
  | **شاهدِ CI** روی `06429e47` (run 38991027403، workflow «Web Tests») | job `e2e-tests` ⇒ **completed / success**؛ هر ۱۳ step سبز، از جمله «Run E2E tests» و «Report E2E failures as annotations» — و این بار `continue-on-error: false` بود، پس سبز واقعاً سبز است |
  | دسترسیِ runner به بک‌اند prod | ثابت شد: همان سوئیتِ وابسته به `/api/v1/venues` روی runner سبز شد ⇒ نگرانیِ گرهٔ ۴ از این راند رفع است (runner به `2.189.255.225` می‌رسد) |
  | خواندنِ annotationها با این توکن | **۴۰۴** — `/repos/…/check-runs/{id}/annotations` باز نشد؛ یعنی کانالِ annotation برای آدمِ UI هست و این agent همچنان فقط stepهای job را می‌بیند |
- **E2 این راند (اجرا نشد):** `vite build` (هیچ ورودیِ build عوض نشد، فقط یک `slotProps` و دو spec)،
  بک‌اند و Flutter (دست‌نخورده)؛ و آزمون روی دستگاه Android.

---

### C17 چهار گرهٔ اشتراک که بی‌دسترسیِ بیرونی رفع می‌شدند (بک‌اند تنها) — راند ۲۰ ✅ سه نقص + یک ادعای غلط

پس از راند ۱۸، از هشت گرهٔ C15.5 چهار تا فقط «کد + تست» می‌خواستند (نه_migration_، نه حساب تست، نه
درگاه). همان‌ها بسته شد؛ چهار تای دیگر (بازگشتِ وجه، race/ممیزیِ `consume_session`، اصلاحِ دادهٔ سیدر،
رسیدِ mock) در C15.5 باقی‌اند چون یا فیچر/اسکیما می‌خواهند یا دسترسیِ بیرونی.

- **C17.1 — پرداختِ پلنِ غیرفعال (باگِ محصول):** `create_purchase` `is_active` را می‌سنجد و
  `pay_purchase` نه. فاکتوری که `PENDING` مانده بود و مدیر در این فاصله پلن را «حذفِ نرم» کرده بود،
  **قابل پرداخت** بود ⇒ فروشِ پلنی که دیگر روی صفحه نیست، با ردیفِ درآمدِ دفتر کل.
  نگهبانِ هم‌سطح به `pay_purchase` اضافه شد (`memberships.py:271-274`) و ردیفِ دفتر کل هم نمی‌خورد.
  شاهدِ پیش از رفع: تستِ جدید ⇒ **۴۰۰ انتظار، ۲۰۰ گرفت** (فایل C17.4).
- **C17.2 — `include_inactive` بی‌نگهبان (نقصِ دسترسی):** `GET /plans` عمومی است و پارامترِ
  `include_inactive=true` پلن‌های باطل‌شده + قیمت‌هایشان را برای **هر مهمانی** برمی‌گرداند؛ این
  عملاً رازِ قیمتِ استراتژیکِ سالن‌هاست. رفع: احراز هویتِ **اختیاری** (`get_optional_user`) و
  نگهبانِ `_ensure_inactive_visible` ⇒ مجاز فقط مدیرِ همان سالن یا super_admin؛
  مهمان/مشتری/مدیرِ سالنِ دیگر ⇒ ۴۰۳؛ `include_inactive` بی‌`venue_id` هم ۴۰۳ (جز super_admin)،
  تا لیستِ سراسریِ پلن‌های باطل‌شده ساخته نشود. رفتارِ مهمانِ معمولی (فقط فعال‌ها) دست‌نخورده ماند.
  - **نکتۀ زیرساختی که ناگزیر refactor شد:** `get_optional_user` داخل `api/v1/games.py` تعریف شده
    بود و `tests/conftest.py:247` **همان آبجکت** را override می‌کند؛ اگر memberships نسخهٔ دومِ خودش
    را import می‌کرد، override به آن نمی‌رسید و endpoint در تست‌ها ۴۰۳ می‌داد. تابع به
    `app/utils/auth.py` منتقل شد و `games.py` آن را import می‌کند (یک تابع، یک identity).
    Import‌های بی‌مصرفِ همان‌جا (`jose`, `HTTPBearer`, `settings`, `sqlmodel.Session/select`) هم
    پاک شد — و چون آن‌ها از قبل بی‌مصرف بودند، تعداد `F401`های ruff تغییر نکرد (۲ در games، ۱ در auth).
- **C17.3 — N+1 فهرست خریدها (عملکرد):** قبل ⇒ **۱ ردیف ۷ statement / ۴ ردیف ۱۳** (شیبِ ۲ کوئری
  به‌ازای هر ردیف؛ با `limit=500` یعنی ~۱٬۰۰۰ کوئری). بعد ⇒ **۱/۴/۶ ردیف هر سه ۵ statement** و
  `/my` ۴ (سطح unit/SQLite، شمارنده روی `before_cursor_execute`).
  - **ریشۀ مشکل آن چیزی نبود که در C15.5.8 نوشته شده بود:** `s.get(Model, pk)` برای کلیدِ تکراری
    باید از identity map بخورد. اندازه‌گیریِ جدا نشان داد وقتی نتیجه **دور ریخته شود** (که در
    `_purchase_response` می‌شد، چون فقط `plan.title` خوانده می‌شد و به نام متغیر زنده وصل نبود)،
    identity map که weak reference است ردیف را می‌اندازد و ردیفِ بعدی دوباره SELECT می‌زند؛ در همان
    سشن، `s.get` با نگهداشت نتیجه ⇒ ۰ کوئری اضافه، و رابطۀ lazy ⇒ برای ۳ ردیف فقط ۲ کوئری (چون
    خودِ آبجکتِ purchase نتیجه را نگه می‌دارد). رفع: خواندن از `p.plan`/`p.venue` + `joinedload`
    در دو endpoint لیستی ⇒ صفر کوئریِ اضافه، مستقل از تعداد ردیف.
- **C17.4 — تصحیحِ ادعای راند ۱۸ (نه کد، یک ادعا):** «درآمدِ اشتراک هیچ‌جا خوانده نمی‌شود» **غلط**
  بود. `revenue_by_source` روی `source_type` گروه‌بندی می‌کند و `membership_purchase` را می‌شمارد؛
  تستِ جدید نشان می‌دهد `GET /finance/revenue/by-source?venue_id=…` دقیقاً `PRICE_RIAL` و `count=1`
  می‌دهد — و **این تست روی کدِ قبلِ رفع هم پاس شد**، چون نقصی در کد نبود و ادعا غلط بود.
  آنچه درست است: مغایرگیریِ درگاه (`C14`) اشتراک را پوشش نمی‌دهد، چون روی `BookingPayment.id`
  join می‌کند و اشتراک ردیفِ درگاهی ندارد — طراحی، نه باگ.
- **تست‌ها (سطح unit/SQLite):** ۷ تست در `tests/test_membership_access_and_queries.py` —
  پرداختِ بعد از غیرفعال‌سازی ⇒ ۴۰۰ و فاکتور `PENDING`/بی‌`paid_at`/بی‌`transaction_id` و **بی‌ردیفِ
  دفتر کل**؛ خریدِ جدیدِ پلنِ غیرفعال ⇒ ۴۰۰؛ نگهبانِ `include_inactive` (مهمان ۴۰۳، مدیرِ دیگر ۴۰۳،
  مشتری ۴۰۳، بی‌`venue_id` ۴۰۳، مالک ۲۰۰ و `is_active: false` در پاسخ)؛ super_admin بی‌`venue_id` ⇒
  ۲۰۰؛ لیستِ عمومی همچنان فقط فعال‌ها و بی‌توکن؛ شمارشِ statement با `limit`های ۱ و ۴؛
  درآمدِ اشتراک در `by-source`.
- **معیار (شاهد، ۲۰۲۶-۱۰-۱۷، سطح unit/SQLite روی استک pinned `sqlmodel 0.0.42`):**
  | گیت | نتیجه |
  |---|---|
  | `pytest tests/test_membership_access_and_queries.py` بعد از رفع | **۷ passed** |
  | همان تست‌ها روی کدِ برگردانده‌شده (فقط `app/`، تست ثابت) | **۳ failed، ۴ passed** (C17.1/C17.2/C17.3)؛ تستِ C17.4 پاس ⇒ ادعا غلط بود نه کد |
  | دو فایل اشتراک با هم | **۱۷ passed در 11.48s** |
  | رگرسیون کامل بک‌اند | **۶۹۱ passed در 57.66s** (= ۶۸۴ راند ۱۸ + ۷) |
  | `ruff --select E9,F82` (دروازۀ CI) | `All checks passed!` |
  | ruff قواعد پیش‌فرض روی ۴ فایل این راند | ۳ × `F401` — **همه از قبل در HEAD بودند** (۲ در `games.py`، ۱ در `auth.py`)؛ این راند هیچ F401 تازه اضافه نکرد |
  | `app.openapi()['paths']` | **۲۳۸** (بی‌تغییر؛ هیچ مسیرِ تازه‌ای ساخته نشد، ۲۸۰ operation) |
  | N+1 | قبل **۷ / ۱۳** ⇒ بعد **۵ / ۵ / ۵** برای ۱/۴/۶ ردیف؛ `/my` ⇒ ۴ |
- **فرانت این راند:** صفر خطا — تنها مصرف‌کنندۀ `include_inactive=true` در وب `ManagerDashboard.tsx:462`
  است و از `apiClient` با هدر Bearer استفاده می‌کند؛ در Flutter هم تنها فراخوانیِ `getPlans`
  (`venue_detail_page.dart:71`) مقدارِ پیش‌فرض `false` را می‌فرستد، پس مسیرِ مهمان بسته نمی‌شود.
- **E2 این راند (اجرا نشد):** `vite build` و Playwright (فرانت دست‌نخورده)، آزمون روی دستگاه، و
  PostgreSQL واقعی — همان محدودیتِ همزمانیِ `tests/conftest.py:104` (`BEGIN IMMEDIATE`) که race را
  در C15.5.3 باقی می‌گذارد. **(بعد از راند ۲۲: با pgserver شکسته شد و آن گره در C19 بسته شد.)**
- **گره‌های بازِ این راند (صادقانه):**
  1. نگهبانِ `include_inactive` روی **سطح unit/SQLite** سنجیده شد؛ روی prod با `APP_ENV=production`
     همان کد است ولی هیچ‌کدام از این پاسخ‌ها روی بک‌اندِ واقعیِ deployed دیده نشده (X6).
  2. ۴۰۳ برای «مدیرِ سالنِ دیگر» پیامِ عمومی دارد؛ جزئیاتِ دسترسی را لو نمی‌دهد ولی هنوز
     «وجودِ پلنِ غیرفعال در آن venue» را از طریقِ زمانِ پاسخ نمی‌پوشاند.
  3. `pay_purchase` هنوز `cvv/expiry` را نمی‌خواند و `transaction_id` ساختگی است (C15.5.6، تا X4).
  4. ~~بازگشتِ وجهِ اشتراک و ممیزیِ `consume_session` (C15.5.1/.3) فیچر/اسکیما می‌خواهند، نه فقط کد~~
     ⇒ بسته شد: بازگشت وجه در راند ۲۱ (**C18**)، ممیزی + اتمی‌بودن در راند ۲۲ (**C19**).
  5. دادهٔ کاشته‌شدهٔ سیدر هنوز ×۱۰ اصلاح نشده (C15.5.4) — کد درست شد، ردیف‌ها نه.

---

### C18 بازگشت وجه اشتراک: راهِ خروج از `PAID` (بازبینی #4، مالی) — راند ۲۱ ✅ یک فیچر + یک فرضیهٔ باطل

گرهٔ C15.5.1 (ثبت‌شده در راند ۱۸): «`PurchaseStatus` فقط `PENDING/PAID/CANCELLED` است و هیچ مسیری از
`PAID` به بیرون نیست ⇒ ردیفِ درآمدِ دفتر کل تا ابد می‌ماند.» مدیر فقط می‌توانست فاکتورِ **پرداخت‌نشده**
را لغو کند؛ اشتراکِ پرداخت‌شده‌ای که مشتری منصرف شده بود، در کنسول مالی به‌عنوان درآمد باقی می‌ماند و
اعتبارش هم پابرجا می‌ماند.

- **قرارداد (همان C7 که برای رزرو رعایت شده):** ردیفِ درآمد **append-only** است و پاک نمی‌شود؛
  در کنارش یک ردیف `TransactionType.REFUND` / `direction=EXPENSE` با `idempotency_key` می‌نشیند.
  `POST /memberships/purchases/{purchase_id}/refund` (`backend/app/api/v1/memberships.py:316-368`)
  ⇒ فقط `PAID` (غیره ۴۰۰ با ذکرِ وضعیتِ فعلی)، فقط مدیرِ **همان** سالن (`_ensure_venue_manager`،
  مشتری ⇒ ۴۰۳)، `sessions_remaining` صفر (برای پلنِ ماهانه که `None` است دست‌نخورده می‌ماند)،
  و کلیدِ `membership-refund:{purchase.id}` ⇒ دو ردیفِ برگشت برای یک فاکتور ساخته نمی‌شود.
- **بدونِ migration (چرا):** ستونِ `status` در `migrations/versions/c3i003membership.py:69`
  `sa.VARCHAR(length=20)` است نه enumِ Postgres ⇒ `REFUNDED = "refunded"` (۸ کاراکتر) در همان
  عرض جا می‌شود؛ تست روی SQLite هم همین مسیرِ رشته‌ای را می‌رود. پس این فیچر روی prod بی‌`upgrade`
  قابل نصب است (برخلاف C14 که جدول خواست).
- **فرضیه‌ای که قبل از نوشتن کد باطل شد:** اگر `ReconciliationService` ردیفِ دفتر کلِ اشتراک را با
  `BookingPayment.id` اشتباه می‌گرفت، `source_id`های هم‌پوشان مغایرتِ جعلی می‌ساختند. کد خوانده شد:
  `backend/app/services/reconciliation_service.py:52` و ۷۸ هر دو
  `source_type == BOOKING_PAYMENT` را فیلتر می‌کنند ⇒ **تعارضی نیست**؛ اشتراک عمداً در مغایرگیریِ
  درگاه نیست (ردیفِ درگاهی ندارد). هیچ کدی این‌سر تغییر نکرد.
- **فرانت (قابل‌کشف شدنِ فیچر، نه فقط endpoint):**
  - `membershipService.refundPurchase(id, reason?)` (`frontend/src/services/membership.ts:68`) —
    `reason` پاک‌سازی و در صورتِ خالی `null` فرستاده می‌شود (ستونِ سرور `max_length=200`).
  - `PurchaseStatus` ⇒ `'refunded'` اضافه شد (`frontend/src/types/membership.ts:5`).
  - جدول «خریدهای کاربران»: دکمۀ **بازگشت وجه** فقط برای ردیفِ `paid`، با `ConfirmModal`
    `variant="destructive"` که مبلغ + «اعتبار صفر می‌شود» + «ردیفِ درآمد پاک نمی‌شود» را می‌گوید
    (`frontend/src/pages/dashboard/ManagerDashboard.tsx:2538-2553`)، و چیپِ وضعیتِ
    چهارشاخه (`statusMeta`، همان‌جا خط ۲۳۹۷) — رنگِ خاکستریِ `#475569` روی پس‌زمینهٔ روشن، متن‌دار
    (نه رنگ‌تنها).
  - **باگِ نمایشی که همین‌جا رفع شد:** داشبوردِ مشتری (`purchaseStatusChip`) هر وضعیتِ غیرِ
    `paid/pending` را «لغو شده» می‌خواند ⇒ فاکتورِ بازگشت‌وجه‌شده به مشتری «لغو شده» نشان داده
    می‌شد، درحالی‌که پولش برگشته. حالا `refunded` برچسبِ «بازگشت وجه شده» دارد
    (`frontend/src/pages/dashboard/Dashboard.tsx:69`).
- **تست‌ها:** ۷ تست در `tests/test_membership_refund.py` (سطح unit/SQLite) — ردیفِ برگشت به همان
  ریالِ درآمد و ردیفِ درآمد دست‌نخورده + `sessions_remaining=0` + `idempotency_key` + متنِ دلیل در
  توضیح؛ برگشتِ دوم ⇒ ۴۰۰ و **یک** ردیفِ refund؛ فاکتور `PENDING` ⇒ ۴۰۰ و **صفر** ردیفِ مالی؛
  مدیرِ سالنِ دیگر ⇒ ۴۰۳ و دیتابیس دست‌نخورده؛ مشتری ⇒ ۴۰۳؛ `consume` بعد از refund ⇒ ۴۰۰؛
  ردیفِ برگشت در `GET /finance/transactions?type=refund&source_type=membership_purchase` دیده می‌شود
  و `revenue/by-source` همچنان `income=1٬۴۰۰٬۰۰۰` و `count=1` می‌دهد (برگشت، درآمدِ ناخالص را تخریب
  نمی‌کند). ۴ تست در `src/services/membership.test.ts` (قراردادِ مسیر/بدنه + `reason` خالی ⇒ `null`
  + مسیرِ `consume` دست‌نخورده).
- **معیار (شاهد، ۲۰۲۶-۱۰-۱۷، استک pinned `sqlmodel 0.0.42`):**
  | گیت | نتیجه |
  |---|---|
  | `pytest tests/test_membership_refund.py` بعد از رفع | **۷ passed در 0.80s** |
  | شاهدِ پیش از رفع (`app/` برگردانده‌شده، تست‌ها ثابت) | **۷ failed** — همه `404 Not Found` روی `post(…/refund)` ⇒ مسیر اصلاً وجود نداشت |
  | رگرسیون کامل بک‌اند | **۶۹۸ passed در 63.49s** (= ۶۹۱ راند ۲۰ + ۷) |
  | `ruff --select E9,F82` | `All checks passed!` |
  | `app.openapi()['paths']` | **۲۳۹ / ۲۸۱ operation** (از ۲۳۸/۲۸۰ ⇒ دقیقاً یک مسیر و یک عملیات: همان refund) |
  | `pnpm exec tsc --noEmit` (دروازۀ CI) | **صفر خطا** |
  | eslint روی ۴ فایل تغییرکرده | **۰ error، ۲۱ warning** — همه `no-explicit-any` و همۀ‌شان در HEAD از قبل بودند (الگوی فایل) |
  | سوئیت واحد فرانت (۵ دسته × ۵ فایل) | **۱۷۱ passed / ۰ failed** در ۲۱ فایل (= ۱۶۷ راند ۲۰ + ۴) |
  | `pnpm run build` (vite، با heap 3072) | **exit 0، built in 38.87s**؛ chunkِ `ManagerDashboard` ⇒ **78.18 kB / 19.71 kB gzip** (رشدِ این راند در همان chunk) |
  | سه فایل تستِ اشتراک با هم | **۲۴ passed در 1.66s** (۷ refund + ۷ راند ۲۰ + ۱۰ راند ۱۸) |
  | اسکنِ CJK/توکِنِ سرگردان در دو سندِ فارسی | پاک — `grep -P` با رنجِ U+4E00–U+9FFF ⇒ صفر خطوط (تنها تطبیق، خودِ همین سطرِ توضیحی بود که رنج را نقل می‌کند، و آن هم به شکلِ نامنظر نوشته شد) |
  | **شاهدِ CI راند ۲۰** (`60c59dc`) | ۲۰ check: **e2e-tests، unit-tests، Backend/Frontend/Mobile Tests، lint، Build Verification، Security Scan، Flutter iOS، Tauri iOS/macOS/Windows/Linux، Tauri Android (Signed)** ⇒ completed/success؛ Flutter Android Release ⇒ skipped (tag-gated)؛ تنها قرمز: «Workers Builds: salon-app» (X9) |
- **این راند اجرا نشد (E2):** Playwright (نه حساب تستِ آماده X1 ⇒ دکمهٔ جدیدِ «بازگشت وجه» در E2E پوشش
  داده نشده)، آزمون روی دستگاه، و PostgreSQL واقعی. `vite build` **اجرا شد و سبز بود** (بالا).
- **گره‌های بازِ این راند (صادقانه):**
  1. **این «بازگشت وجه» دفتری است، نه درگاهی:** هیچ فراخوانیِ `ZarinPal/NextPay refund` انجام نمی‌شود؛
     پول از حسابِ درگاه بیرون نمی‌رود تا قراردادِ درگاه در دست باشد (X4 — همان گرهٔ C15.5.6).
     تا آن زمانِ ردیفِ ledger فقط سندِ حسابداری است.
  2. پاسخ‌ها روی **unit/SQLite** سنجیده شده‌اند؛ بک‌اندِ deployed این مسیر را ندارد تا X6 انجام شود.
  3. Flutter هیچ رابطۀ بازگشت وجه‌ای ندارد (هم‌خانوادۀ فیچر ۲۱/waitlist) — این راند فقط وب.
  4. ~~ممیزیِ «چه کسی، کِی» برای `consume_session` هنوز نیست (C15.5.3؛ مدلِ audit وجود ندارد ⇒
     migration)~~ ⇒ بسته شد در راند ۲۲ (**C19**): `membership_session_events` + `m0s028memberevents`.
  5. اگر faksal/اشتراک **ساخته‌شده پیش از این مسیر** بازگشت بخواهد، باید دستی زده شود؛ هیچ داده‌ای
     در این راند تغییر نکرد.

### C19 ممیزیِ «چه کسی، کِی» روی اشتراک + اتمی‌کردنِ کسر جلسه (بازبینی #4، مالی) — راند ۲۲ ✅ یک اسکیما + یک ادعای باطل

گرهٔ C15.5.3 (ثبت‌شده در راند ۱۸): «`consume_session` هم race است هم بی‌ممیزی: `sessions_remaining -= 1`
read-modify-write و هیچ رویدادِ audit ثبت نمی‌شود؛ روی این ماشین falsify نمی‌شود
(`tests/conftest.py:104` ⇒ `BEGIN IMMEDIATE`).»

- **ادعای دومِ گره باطل شد (قبل از رفع، نه بعد از آن):** «falsify نمی‌شود» فقط برای **SQLite** درست بود.
  با pgserver یک PostgreSQL واقعی بالا آمد و race با دو نخ + `threading.Barrier` + `sleep(0.6)` بین
  «خواندن» و «نوشتن» بازتولید شد (`~/.qoder-tmp/pg_consume22.py`، لاگ `pg_consume22_out.txt`):
  پلنِ **پاکتِ ۱جلسه‌ای** با کدِ قدیم (`SELECT` سپس `UPDATE … SET sessions_remaining = :v`) ⇒
  **هر دو نخ ۱ را خواندند** و هر دو موفق شدند، شمارنده صفر شد، **یک جلسهٔ رایگان هدیه داده شد**
  (lost update). با `UPDATE … WHERE status='PAID' AND sessions_remaining > 0` ⇒
  rowcountهای `{'A': 1, 'B': 0}`، دقیقاً یک بُرد و شمارندهٔ صفر. یعنی نقصِ واقعی روی MVCC اثبات شد،
  نه فقط روی کاغذ.
- **رفعِ شمارنده (بدونِ `SELECT … FOR UPDATE`):** یک `UPDATE` شرطیِ تنها-کوئری روی
  `MembershipPurchase.__table__` (`backend/app/api/v1/memberships.py:428-440`) + `result.rowcount == 0`
  ⇒ ۴۰۰ «جلسات این اشتراک تمام شده است». سپس `session.refresh()`، چون identity map بعد از Core update
  همگام نیست. نگهبان داخل **SQL** است نه Python، پس مستقل از dialect کار می‌کند؛ شاهدِ شکلِ
  statement روی SQLite: `WHERE … sessions_remaining > ?` با پارامترِ `0` داخل همان UPDATE.
- **رفعِ ممیزی (اسکیما):** `SessionEventType` (`backend/app/models/membership.py:30`) با
  `CONSUMED`/`REFUNDED` و جدولِ append-only `membership_session_events` (`:77`): `purchase_id`،
  `venue_id`، `actor_id` (nullable، FK به `users`)، `event_type`، `sessions_remaining_after`،
  `amount` (فقط برای بازگشت وجه)، `detail` (دلیلِ بازگشت) و `created_at`. هر اقدامِ موفق یک ردیف
  می‌گذارد (`:444-450` برای کسر، `:370-378` داخل همان نگهبانِ `idempotency_key` برای بازگشت وجه)؛
  اقدامِ **مسدودشده** (۴۰۰/۴۰۳) هیچ ردیفی نمی‌گذارد — تاریخچه پُر از تلاش‌های بی‌نتیجه نمی‌شود.
- **مهاجرت:** `backend/migrations/versions/m0s028_membership_session_audit.py`
  (`m0s028memberevents` ← `m0s027reconreports`). روی PG یک enumِ native `sessioneventtype` می‌سازد،
  چهار `INDEXED` و سه FK با نام؛ downgrade فقط در همان تراکنشِ خودش: `DROP INDEX`ها، `DROP TABLE`،
  و `DROP TYPE IF EXISTS sessioneventtype`. واگراییِ ثبت‌شدۀ dialect: مدل روی SQLite
  `event_type VARCHAR(8)` می‌سازد (نامِ enum)، روی PG enumِ native — همان شکلی که C14 هم داشت، پس
  تستِ SQLite جای migration را نمی‌گیرد و **prod نیازمند `alembic upgrade head` است (X6)**.
  شاهدِ PG: `upgrade head` → `downgrade -1` → `upgrade head` هر سه `exit 0`،
  enum = `['CONSUMED','REFUNDED']`، ایندکس‌ها = `actor_id`/`event_type`/`purchase_id`/`venue_id` + pkey.
- **خواندنِ تاریخچه:** `GET /memberships/purchases/{purchase_id}/events`
  (`backend/app/api/v1/memberships.py:456-483`) — فقط مدیرِ **همان** سالن (`_ensure_venue_manager`؛
  مدیرِ سالنِ دیگر ۴۰۳، مشتری ۴۰۳، بی‌توکن ۴۰۱)، `limit` ۱..۵۰۰ (پیش‌فرض ۱۰۰)، تازه‌ترین اول.
  `actor_name` در پاسخ هست تا UI عددِ خامِ FK را نشان ندهد، و با **یک** `SELECT users.id, full_name
  WHERE id IN (…)` پر می‌شود، نه به‌ازای هر ردیف: شاهد = دو ردیف و چهار ردیف هر دو **یک** کوئریِ نام.
- **فرانت (قابل‌کشف شدن، نه فقط endpoint):** `MembershipSessionEvent` (`frontend/src/types/membership.ts:61`)،
  `membershipService.getPurchaseEvents` (`frontend/src/services/membership.ts:81`)، و در جدول
  «خریدهای کاربران» دکمۀ **تاریخچه** روی هر ردیف (`frontend/src/pages/dashboard/ManagerDashboard.tsx:2486-2500`)
  که دیالوگِ `aria-label="تاریخچۀ اشتراک"` (`:2585` به بعد) را باز می‌کند: چیپِ «کسر جلسه»/«بازگشت وجه»،
  تاریخ و ساعتِ فارسی، «عامل: …»، «باقی‌مانده: …»، مبلغ و دلیل. **شاخۀ `—` (بدونِ اقدام) حذف شد**،
  چون حالا هر ردیفی یک کنشِ خواندنی دارد؛ حالتِ خالی صریح می‌گوید «هنوز اقدامی ثبت نشده است».
- **تست‌ها:** ۸ تست در `tests/test_membership_session_audit.py` (سطح unit/SQLite): سه کسر ⇒ ردیف‌های
  `[۲،۱،۰]` با یک عامل؛ ترتیبِ تازه‌ترین-اول + `actor_name`؛ بازگشت وجه با `amount=900000` و دلیل؛
  اقدامِ مسدودشده ⇒ **صفر** ردیف؛ شاهدِ شکلِ statement (دو UPDATE، نگهبانِ `> 0`، یک ردیفِ ممیزی برای
  بُردِ اول و هیچ‌کدام برای ۴۰۰ دوم)؛ پنج تلاش روی پاکتِ ۲جلسه‌ای ⇒ **۲** بُرد، **۲** ردیف، شمارندهٔ صفر
  (هرگز منفی نمی‌شود)؛ دسترسی به تاریخچه (۴۰۳/۴۰۳/۴۰۱/۴۰۴)؛ و نگهبانِ N+1 برای نامِ عامل.
  **شاهدِ قبل‌و‌بعد:** با `app/api/v1/memberships.py` برگردانده‌شده به HEAD ⇒ **۷ failed، ۱ passed**
  (آن یک پاسِ باقی‌مانده تستِ *منفی* «اقدامِ مسدودشده ردیف نمی‌گذارد» است، که بی‌کد هم درست است) ⇒
  بعد از رفع **۸ passed**.
- **حقایقی که «رفع شد» ادعا نمی‌شوند:** ردیف‌هایِ قبل از `m0s028` قابل backfill نیستند (هیچ‌جا ثبت
  نمی‌شدند)؛ موبایل (Flutter) این endpoint را صدا نمی‌زند و تاریخچه ندارد؛ و پولِ بازگشت‌وجه هنوز
  درگاهی نیست (X4 — همان C15.5.6).

---

### C20 دو شمارندۀ «بخوان-و-بنویس» پولی: ظرفیت کوپن و مجموعِ پرداخت اشتراکی (بازبینی #4، مالی) — راند ۲۳ ✅ دو ادعای باطل + یک باگِ فقط-PG که همین شاهد گرفت

دو گره از راندهای ۱۵ و ۱۶ با یک شکلِ خرابی و یک بهانه:
**C11.6.3** — `pay_share` مبلغ کل را با `sp.paid_amount += share.amount` (روی آبجکتِ در حافظه) جلو
می‌برد و وضعیت را از `list`ِ Python می‌ساخت؛ **C13.3.1** — `CouponService.reserve` همان
`coupon.uses_count`ِ در-حافظه را چک و `bump_uses()` با نوشتنِ مقدارِ literal زیاد می‌کرد.
هر دو نوشته بودند: **«روی این ماشین falsify نمی‌شود»**، چون `tests/conftest.py:104` تراکنش SQLite را
`BEGIN IMMEDIATE` می‌کند.

- **هر دو ادعا باطل شد (قبل از رفع، با کدِ HEAD):** pgserver یک PostgreSQL واقعی با MVCCِ prod داد
  (`~/.qoder-tmp/pg_race23.py`، لاگ `pg_race23_before.txt`، exit 0؛ اسکیما با `alembic upgrade head`
  نه `create_all`). تنها تزریق، یک `threading.Barrier` + `sleep(0.5)` روی `SELECT … FROM coupons /
  team_split_payments WHERE id = …` بود تا فاصلۀ «خواندیم و هنوز ننوشتیم» باز بماند — خودِ کدِ مسیر
  صدا زده شد (`CouponService.reserve`, `await pay_share(...)` با Session و User واقعی):

  | صحنه (روی PG، کدِ HEAD) | نتیجه |
  |---|---|
  | کوپن `max_uses=1`، دو `reserve` همزمان | **`{'A': 'OK', 'B': 'OK'}`** ⇒ ۲ ردیف مصرف برای ظرفیتِ ۱ و `uses_count = 1` (یکی هیچ‌وقت شمرده نشد): هم **فروش‌بیش‌ازظرفیت** هم **شمارندهٔ کم‌شمارده** |
  | سه سهمِ ۱۰۰٬۰۰۰ریالی، دو سهمِ متفاوت همزمان | هر دو ۲۰۰، دو سهم `PAID`، دو ردیف ممیزی، ولی **`paid_amount = 100٬۰۰۰`** (باید ۲۰۰٬۰۰۰) ⇒ یک پرداختِ ۱۰۰٬۰۰۰ریالی گم شد |
  | یک سهم، دو درخواستِ همزمان | **هر دو ۲۰۰ گرفتند** و **۲ ردیف ممیزی** برای یک سهم ثبت شد (دربارۀ پولی که یک‌بار جابه‌جا شد) |

- **رفع (CAS داخل SQL، همان اصطلاح راند ۲۲):**
  - `CouponRepository.try_consume_capacity()` (`backend/app/repositories/coupon_repository.py:42`) و
    `release_capacity()` (`:69`) — `UPDATE coupons SET uses_count = uses_count ± 1 WHERE id = :id`
    به‌همراه نگهبانِ `(max_uses IS NULL OR uses_count < max_uses)` / `uses_count > 0` در همان
    statement، و `rowcount` ملاک است. `bump_uses()` حذف شد (بعد از این بازنویسی caller نداشت) —
    کفِ صفر هم دیگر در Python (`max(0, …)`) نیست، در SQL است.
  - `CouponService.reserve()` (`backend/app/services/coupon_service.py:91`) اول ظرفیت را می‌گیرد و
    اگر نگهبان رد کرد همان ۴۰۰ همیشگی («ظرفیت استفاده از این کد تخفیف تکمیل شده است») را می‌دهد؛
    `release_by_id()` (`:113`) از `release_capacity` استفاده می‌کند. چکِ `validate_and_compute:57`
    نگه داشته شد (پیامِ زودهنگام)، ولی دیگر تنها نگهبان نیست.
  - `pay_share` (`backend/app/api/v1/split_payments.py:337-376`): تبدیلِ سهم با
    `UPDATE split_payment_shares SET status='PAID' … WHERE id = :sid AND split_payment_id = :pid AND
    status != 'PAID'` (باخت ⇒ ۴۰۰ «این سهم قبلاً پرداخت شده است»؛ پیام و معنای قبلی حفظ شد، و سهم
    `REFUNDED`/`OVERDUE` مثلِ قبل قابل پرداخت است)، سپس **یک** `UPDATE team_split_payments SET
    paid_amount = paid_amount + :amt, status = CASE WHEN (زیرکوئریِ شمارشِ پرداختی‌نشده) = 0 THEN
    COMPLETED ELSE PARTIAL END`. جمعِ کل و وضعیت دیگر از خوانشِ قبلی نمی‌آیند.
- **چرا CAS و نه `SELECT … FOR UPDATE`:** قراردادِ خودِ انبار (`base.py:37 with_for_update`) روی PG
  کار می‌کند — و همین دلیلِ سومِ انتخاب است: شمارندۀ سومِ همین خانواده، `via_token.uses_count += 1`
  در `game_service.py:411`، **از قبل** داخل `get_by_token(…, with_lock=True)`
  (`game_repository.py:252-256`) قفل ردیف دارد، پس در همین راند بررسی و بی‌نیاز ثبت شد. اما
  `FOR UPDATE` روی SQLite که تست‌ها روی آن می‌دوند **هیچ کاری نیست** ⇒ نگهبانِ انتخابی باید روی هر
  دو dialect معنا داشته باشد؛ `rowcount` دارد.
- **باگِ فقط-PG که همین شاهد گرفت (رفعِ اولِ من ناقص بود):** نسخه‌ِ اولِ `pay_share` مقدارِ `CASE` را
  بدونِ cast می‌نوشت. ۷۱۳ تست SQLite سبز بودند، ولی روی PG هر دو پرداخت با
  `psycopg2.errors.DatatypeMismatch: column "status" is of type splitpaymentstatus but expression is
  of type text` مردند (ستون `status` روی PG enum بومی است، نه VARCHAR؛ راند ۲۲ همین واگرایی را برای
  `event_type` ثبت کرده بود). رفع: `.cast(sp_table.c.status.type)`
  (`split_payments.py:370-374`) و یک نگهبانِ **شکلِ statement** در تستِ SQLite
  (`assert "cast(case" in st`) تا این باگِ فقط-PG حداقل در diff دیدنی بماند.
- **بعد از رفع، همان سه صحنه روی همان PG (لاگ `pg_race23_after.txt`):** کوپن ⇒
  `{'B': 'OK', 'A': '400: ظرفیت …'}`، ۱ ردیف مصرف، `uses_count = 1`؛ دو سهمِ متفاوت ⇒ هر دو ۲۰۰،
  **`paid_amount = 200٬۰۰۰`**، `status = PARTIAL` (سومِ پرداخت‌نشده)؛ یک سهمِ دوبار ⇒
  `{'A': 'OK', 'B': '400: این سهم قبلاً پرداخت شده است'}`، ۱ ردیف ممیزی، `paid_amount = 100٬۰۰۰`.
  هر سه صحنه: «ممیزی با سهم‌های پرداخت‌شده» و «`paid_amount = ۱۰۰٬۰۰۰ × سهمِ PAID`» ⇒ True.
- **تست‌ها (سطح unit/SQLite):** ۷ تست در `tests/test_counter_race_guards.py` — نگهبانِ `max_uses`
  داخل WHERE خودِ UPDATE (شکلِ statement، یک UPDATE روی `coupons`)؛ دو رزرو روی `max_uses=1` ⇒ دومی
  ۴۰۰ «ظرفیت» و شمارنده ۱ با یک ردیف مصرف؛ کوپنِ بی‌سقف (`max_uses IS NULL`) مثلِ قبل می‌سوزد
  (`uses_count = 2`)؛ `release_capacity` هفت بار ⇒ یک True و شش False و شمارنده هرگز زیر صفر نمی‌رود؛
  شکلِ UPDATEهای `pay_share` (یک UPDATE روی `team_split_payments` با `paid_amount + ?` و
  `cast(case`، یک UPDATE روی سهم با `status != ?`)؛ پرداختِ دوبارِ یک سهم ⇒ ۴۰۰ و ۱۰۰٬۰۰۰ نه ۲۰۰٬۰۰۰؛
  و پرداختِ پلکانیِ هر سه سهم ⇒ `PARTIAL، PARTIAL، COMPLETED` با جمعِ `۱۰۰/۲۰۰/۳۰۰ هزار`.
  **شاهدِ قبل‌و‌بعد:** سه فایلِ رفع‌شده برگردانده‌شده به HEAD ⇒ **۳ failed، ۴ passed**
  (`set uses_count=?, …` بدون نگهبان؛ `AttributeError: no try_consume_capacity`؛ دو UPDATE با
  `SET paid_amount=?`) و چهار تستِ رفتاری **سبز ماندند** — دقیقاً همان چیزی که ادعای
  «falsify نمی‌شود» را توضیح می‌داد؛ بعد از رفع **۷ passed**.
- **حقایقی که «رفع شد» ادعا نمی‌شوند:**
  1. ~~**`per_user_limit` هنوز قفل ندارد:** چکِ آن در Python است (`coupon_service.py:59-64`،
     شمارشِ ردیف‌های redemption) ⇒ دو رزروِ همزمانِ **یک کاربر** روی سقفِ فردی هنوز می‌تواند هر دو
     رد کند. نگهبانِ SQLی این یکی `INSERT … WHERE (SELECT count(*) …) < limit` می‌خواهد و در همین
     راند انجام نشد (گرهٔ بازِ C13.3.1 باقی می‌ماند).~~
     ⇒ **رفع شد در راند ۲۴ (C21)** — و همان‌جا روی PG واقعی falsify شد.
  2. `pay_share` همچنان هیچ ردیفی در دفتر کل نمی‌سازد (C11.6.1؛ `payment_id` نوشته نمی‌شود) و
     `CANCELLED`/`EXPIRED` هنوز مسیرِ تولیدی ندارند (C11.6.2) — این راند فقط «شمارنده درست شمرده
     شود» را رفع می‌کند، نه «آن شمارنده چه معنایی دارد» را.
  3. هیچ‌کدام روی `api.salon.absadeghi.ir` دیده نشده (X6)؛ prod هنوز کدِ قدیم را دارد، پس
     فروش‌بیش‌ازظرفیتِ کوپن و گم‌شدنِ پرداختِ همزمان **امروز روی prod فعال است**.
  4. صحنه‌های PG با دو نخِ واقعی و یک sleep تزریقی ساخته شدند؛ مدتِ sleep عددِ همین ماشین است، نه
     تضمینِ نرخِ وقوعِ race در prod.

---

### C21 سقفِ فردیِ کوپن هم داخل SQL شد (`INSERT … WHERE count < limit`) (بازبینی #4، مالی) — راند ۲۴ ✅ نیمۀ بازِ راند ۲۳ بسته شد + یک ادعای باطل‌شده و یک گرهٔ تازه

- **چی باز بود:** راند ۲۳ (`C20`) `max_uses` را داخل خودِ UPDATE بست، ولی `per_user_limit`
  همچنان فقط در Python چک می‌شد (`validate_and_compute` ردیف‌های `coupon_redemptions` را
  می‌شمرد) و `reserve` هیچ نگهبانی برای آن نداشت ⇒ دو رزروِ همزمانِ **یک کاربر** روی
  `per_user_limit=1` می‌توانستند هر دو ردیف بسازند (نصفۀ دومِ C13.3.1).
- **شاهدِ قبل از رفع روی PostgreSQL واقعی (`~/.qoder-tmp/pg_race24.py`، لاگ
  `pg_race24_before.txt`، exit 0):** در هر سه صحنه **خودِ مسیرِ واقعی** صدا زده شد
  (`validate_and_compute` و بعد `reserve`، همان ترتیبِ `booking_service.py:79-100`) و تنها
  تزریق، `Barrier` + `sleep(0.6)` روی `SELECT count(*) … coupon_redemptions` بود — یعنی
  همان «خواندم و هنوز ننوشتم»:
  | صحنه | HEAD (راند ۲۳) | بعد از رفع (`pg_race24_after.txt`) |
  |---|---|---|
  | یک کاربر، دو رزرو، `per_user_limit=1` | `{'A': OK, 'B': OK}`، ۲ ردیف مصرفِ همان کاربر | `{'B': OK, 'A': 400 «سقف …»}`، ردیف‌ها **۱**، `uses_count` **۱** |
  | یک کاربر، سه رزرو، `per_user_limit=2` | هر سه `OK` ⇒ ۳ ردیف برای سقفِ ۲ | دو `OK` و یک ۴۰۰، ردیف‌ها **۲**، `uses_count` **۲** |
  | کنترل: دو کاربرِ متفاوت، `per_user_limit=1` | هر دو `OK` | هر دو `OK` (نگهبان بین‌فردی عمل نمی‌کند) |
  در هر سه صحنه «شمارنده با ردیف‌ها می‌خواند» (`uses_count = count(redemptions)`) True است —
  یعنی جبرانِ ظرفیت هم درست کار می‌کند.
- **رفع (سه قطعه، دو فایل):**
  1. `insert_within_user_limit` (`coupon_repository.py:104-141`): `INSERT … SELECT … WHERE
     (SELECT count(*) FROM coupon_redemptions WHERE coupon_id = ? AND user_id = ?) < ?` ⇒
     وقتی سهمِ فردی پر است rowcount صفر و هیچ ردیفی نوشته نمی‌شود؛ «خواندنِ شمارش» و
     «نوشتنِ ردیف» دیگر دو statement جدا نیستند. این شکلِ INSERT همچنین `lastrowid` را
     برنمی‌گرداند، پس idِ ردیفِ تازه با `max(id)` خوانده می‌شود (`coupon_repository.py:136-141`).
  2. ترتیب در `reserve` (`coupon_service.py:84-113`): **اول** `try_consume_capacity` و **بعد**
     شمارش/درج. دلیلش ادعای اصلیِ این راند است، در بندِ بعد.
  3. جبران: اگر INSERT رد شد، `release_capacity` صدا زده می‌شود (`coupon_service.py:108`) تا
     صندلی‌ای که همین‌جا گرفته شد بی‌مصرف نسوزد (در مسیرِ UnitOfWork رول‌بک هم همین کار را
     می‌کند؛ جبران برای فراخوانیِ بیرون از UoW لازم است).
- **چرا «نگهبان داخل INSERT» به‌تنهایی کافی نبود (و ادعای باطل‌شدهٔ این راند):** روی PG با
  READ COMMITTED، دو INSERTِ همزمان *حتی با* `WHERE count < limit` هر دو `count = 0` می‌بینند،
  چون ردیفِ طرفِ مقابل هنوز commit نشده ⇒ نگهبانِ تنها-در-INSERT سریال‌ساز نیست. چیزی که
  سریال‌سازی می‌کند همان `UPDATE coupons` است: ردیفِ کوپن تا commitِ تراکنش قفل می‌ماند، پس
  رزروِ دوم روی همان UPDATE می‌ایستد و وقتی آزاد می‌شود شمارشش ردیفِ commit‌شدهٔ اول را می‌بیند.
  روایتِ قبلیِ همین سند («روی این ماشین falsify نمی‌شود»، بندِ E6 ردیف «تست همزمانی کوپن») فقط
  برای SQLite درست بود؛ روی PG با کدِ قدیمی **تکرارِ مصرفِ یک کاربر** در هر دو صحنۀ اول
  رخ داد. با این حال نگهبانِ داخل INSERT را نگه داشتم، چون پنجرۀ «دو statement» را هم می‌بندد
  و روی هر دو dialect یکسان معنا دارد.
- **تست‌ها (سطح unit/SQLite، ۵ تستِ تازه ⇒ فایل ۱۲ تست):** `test_counter_race_guards.py:246`
  شکلِ statement (INSERTِ مشروط، و **بعد از** `UPDATE coupons` — ترتیب در همان تست قفل شده)،
  `:270` خودِ `reserve` بدونِ validate هم رد می‌کند و `uses_count` روی ۱ می‌ماند، `:291`
  سقفِ ۲ روی ۲ می‌ایستد، `:307` کاربرِ دوم Blocked نمی‌شود، `:320` ردیفِ بی‌سقف مثلِ قبل
  دو مصرف می‌سوزد. **شاهدِ قبل‌و‌بعد:** دو فایلِ رفع‌شده برگردانده‌شده به HEAD ⇒
  **۳ failed، ۹ passed** (`DID NOT RAISE HTTPException` در دو رفتاری و نبودِ `INSERT … SELECT`
  در تستِ شکل) و هفت تستِ راند ۲۳ سبز ماندند؛ بعد از رفع **۱۲ passed**.
- **گرهٔ تازه‌ای که همین راند دید (C21.2 — ثبت شد، رفع نشد):** «بی‌سقف بودنِ فردی» از API
  اصلاً قابل نوشتن نیست: (الف) INSERT با `per_user_limit=None` مقدارِ **۱** را می‌نویسد، چون
  ستون در مدل `default=1` دارد و SQLAlchemy مقدار None را «بدون مقدار» می‌شمارد
  (`h8n008pricingloyalty.py:117` هم `server_default="1"` دارد)؛ (ب) `BaseRepository.update:71`
  مقدار None را رد می‌کند، پس PUT هم نمی‌تواند آن را تهی کند. نتیجه: هر کوپنِ API-ساخته
  سقفِ فردی ≥ ۱ دارد و شاخۀ «بی‌سقف» در `reserve` از endpoint نساختنی است (تستِ `:320` آن را
  با Core UPDATE صفر می‌کند تا همان شاخه سنجیده شود). commentِ `tests/test_coupons.py:195`
  عددِ ۴۰۰ را به «بی‌سقف» بودن می‌چسباند در حالی که مقدارِ ذخیره‌شده ۱ است.
  چرا در این راند رفع نشد: `BaseRepository.update` مشترکِ همهٔ repositoryها است و تغییرِ
  «None یعنی پاک کن» به کل CRUD اثر می‌گذارد؛ باید با قراردادِ صریحِ خودِ endpoint‌ها انجام شود.
- **حقایقی که «رفع شد» ادعا نمی‌شوند:**
  1. نگهبانِ فردی به **قفلِ ردیفِ کوپن** تکیه دارد؛ اگر روزی مسیرِ دیگری ردیفِ
     `coupon_redemptions` بدونِ `UPDATE coupons` بنویسد (مثلاً import دسته‌ای یا tooling)،
     همان شمارشِ کهنه برمی‌گردد. امروز تنها نویسندۀ این ردیف‌ها `CouponService.reserve` است
     (به‌جز `seed_data.py:227`).
  2. `per_user_limit=0` هم «بی‌سقف» رفتار می‌کند (`if coupon.per_user_limit:`) ولی از API
     ساختنی نیست (`ge=1`)؛ معناهای تهی/صفر هنوز در مدل روشن نشده‌اند (بخشی از C21.2).
  3. پیام‌های ۴۰۰ و ترتیبِ رزرو برای کاربر تغییرِ محسوس‌ی نکرده (همان «سقف استفاده از این کد
     تخفیف برای شما پر شده است»); فقط دیگر از شمارشِ Pythonِ پیشِ قفل آمدنِ آن نتیجه نمی‌دهد.
  4. هیچ‌کدام روی `api.salon.absadeghi.ir` دیده نشده (X6)؛ prod هنوز کدِ قدیم را دارد، پس
     «یک کاربر دو بار با سقفِ یک» **امروز روی prod ممکن است**.
  5. مدتِ sleep و سه-نخِ همزمان عددِ همین ماشین است، نه نرخِ وقوعِ race در prod.

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
- **شاهد:** اسکن صحیح تگ‌ها (با دقتِ شمارشِ عمقِ `{}` — نسخهٔ اولِ اسکریپت من به‌خاطر `=>` داخل `onClose` برچیدگی می‌داد و ۶ مورد **مثبت کاذب** نشان می‌داد): **۰ `<Dialog>` بدون `title=`/`aria-label`**.
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
`Page.bringToFront` قبل از axe (ورودی Frumer در غیر این صورت `opacity:0`) · ۱۲s انتظار برای روت lazy (با ۹s فقط ۷ pass گرفته شد و نتیجه باطل بود: `landmark-one-main` نادرست گزارش شد) · نرمال‌سازی کنتراست با `c/255` قبل از تابع انتقال sRGB · آستانهٔ luminance برای عبور ۴.۵:۱ در برابر سفید ≤ ۰.۱۸۳۳ · لایه‌های گرادیانی و تصویر در axe «incomplete»اند نه fail ⇒ نمونه‌برداری پیکسل · لنگر برش با `data-a11y` · کنتراست نمی‌تواند overlay خواهر را ببیند · پایپ‌لاین Node را با `pnpm exec` محلی بسنج (این‌جا `eslint` با `pnpm exec` exit 127 می‌دهد؛ `pnpm run lint` درست است) · ذخیرهٔ `html`/`failureSummary` در خروجی axe وگرنه تشخیص نود غیرممکن است.

---

### گیت‌های این راند (شاهد زنده، ۲۰۲۶-۱۰-۱۶)
| گیت | نتیجه |
|---|---|
| `pnpm exec tsc --noEmit` | exit **0** |
| `pnpm run lint` (`eslint src --ext ts,tsx --quiet`) | exit **0**، بدون خروجی |
| `pnpm test` (vitest v2.1.9) | **37 passed** در ۵ فایل (l10n 6 · venueMedia 9 · calendar 14 · notification 4 · VenueCard 4) — 8.83s |
| `pnpm run build` | `✓ built in 53.06s`؛ `dist/assets/*.map` **وجود ندارد** (A2)؛ بزرگ‌ترین chunk: `vendor-mui 406.81 kB` (gzip 119.97) |

### قرمزی CI: چه چیزی واقعاً خراب بود و چه تغییر کرد (۲۰۲۶-۱۰-۱۶)
CI روی هر SHA اخیر قرمز بود (نه فقط تغییرات من). علت‌ها جدا و اندازه‌گیری‌شده:
1. **Web Tests → Accessibility guardrails:** `::error::3 جدول بدون aria-label`
   (`pages/coach/CoachDashboard.tsx:377`, `pages/tournaments/TournamentDetail.tsx:341`, `:424`).
   رفع: سه `aria-label` (جدول لیگ بعداً برچسب پویا گرفت) ⇒ بازنشینی محلی: **۰ خطا / ۲۴ جدول**.
2. **`backend-tests.yml`:** URL سرویس Postgres غلط بود (`fursal` → `futsal`)؛ رفع شد. نکته:
   `tests/conftest.py:18` همان اول `DATABASE_URL` را به SQLite موقت می‌چسباند، پس خودِ pytest هرگز
   به Postgres وصل نمی‌شود — ارزش این job اجرای `alembic upgrade head` روی PG است.
3. **چرایی بی‌رسید بودن علت شکست:** استپ «Surface test failures» در `quality-gates.yml` با
   `grep -inE "FAILED|ERROR|assert"` و `tail -20` نوشته شده بود؛ warningهای Pydantic V2 پر از
   «deprecated/assert» همان `tail` را پُر می‌کردند و ۲۰ annotation آخر فقط warning بودند.
   رفع در هر دو workflow: لنگر شروع خط `^(FAILED|ERROR) ` (خلاصهٔ کوتاه pytest)، fallback به
   `tail -15` وقتی خلاصه‌ای نیست (کرش/خطای collection) و در `backend-tests.yml` هم `tee pytest.log`
   + استپ annotation اضافه شد. بدنهٔ لاگ از این ماشین خوانده نمی‌شود (401 روی Azure Blob با
   توکن `/logs`؛ 404 وقتی شناسۀ job با run اشتباه می‌شود)، پس annotation تنها مسیر دیدن است.
4. **Flutter iOS build:** **سبز شد (۲۰۲۶-۱۰-۱۶، راند ۱۰)** — سه گام لازم بود:
   - *قابل دیدن کردن:* استپ `Surface iOS build errors` خط‌های `error:` را one-per-annotation می‌کند
     و build از `-v` خارج شد؛ run `38917244529` بلافاصله **۱۳ annotation** داد (قبلاً فقط
     `Process completed with exit code 1`). علت واقعی: `builtin-precompileModule` با
     `-Werror=non-modular-include-in-framework-module` روی `firebase_messaging.FLTFirebaseMessagingPlugin`.
   - *اولین تلاش (کافی نبود):* `ios/Podfile` تازه با `use_modular_headers!` و `post_install` روی
     همهٔ pod targetها ⇒ run `38918346666` **همون خطا** را دوباره داد. شاهد از لاگ: دستور شکست‌خورده
     `-D COCOAPODS=1` و defineهای nanopb داشت که از `Pods-Runner.release.xcconfig` می‌آیند ⇒
     آن precompile job مال **هدف Runner** است، نه pod؛ پس تنظیمِ pod هرگز به آن نمی‌رسد.
   - *رفع:* `CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES = YES` در
     `ios/Flutter/Release.xcconfig` و `Debug.xcconfig` (همان‌جا که Flutter آن را include می‌کند)،
     + استپ شاهد `Show iOS build settings` که `xcodebuild -showBuildSettings` هدف Runner را grep می‌کند
     و `::notice::IOS-SET ...` یا `::error::IOS-SET-MISSING` می‌زند تا راند بعد **جعلی‌ناپذیر** باشد.
   - نتیجهٔ اندازه‌گیری‌شده برای SHA `2d28ebd`: run `38920184082` ⇒ `IOS JOB: completed / success`،
     annotationها: `IOS-SET  CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES = YES`،
     `IPHONEOS_DEPLOYMENT_TARGET = 15.0`. (تذکر: سقف annotationها وجود دارد؛ لاگ کامل ۱۹٬۴۳۲ خط بود
     و فقط با دانلود مستقیم blob خوانده شد.)
5. **`Workers Builds: salon-app`:** **بیرونی است، نه خرابی این ریپو** — ممیزی: در
   `.github/workflows/` هیچ workflow ای با این نام (و هیچ ارجاعی به `workers`) نیست و پوشهٔ
   `workers/` هم در ریشه وجود ندارد. این check از GitHub App حساب است، پس از این ریپو قابل رفع نیست؛
   قبلاً «۰ annotation ⇒ دیدنی ندارد» ثبت شده بود و حالا علتش قطعی شد.

### دو شکست واقعی بک‌اند که annotationهای تازه بیرون دادند (۲۰۲۶-۱۰-۱۶)
استپ لنگاردار که در بالا اضافه شد، دقیقاً دو خط را نشان داد (قبلاً فقط warningهای Pydantic دیده
می‌شد):
- `tests/test_waitlist.py::test_join_waitlist_returns_201_and_position` → `assert None is not None`
  روی `.tzinfo`
- `tests/test_matchmaking.py::test_create_challenge_returns_row_and_notifies_target` →
  `TypeError: can't compare offset-naive and offset-aware datetimes`

علت ریشه‌ای (با بازتولید، نه حدس): `backend/requirements.txt` خط ۳ `sqlmodel==0.0.42` را pin
می‌کند، ولی محیط توسعهٔ این ماشین **0.0.47** دارد. در یک venv تازه از همان pins، هر دو تست
**درست مثل CI** شکستند (`2 failed in 0.98s`). روی SQLiteِ استک pinned مقدار `datetime` به‌صورت
**naive** برمی‌گردد؛ با 0.0.47 آگاه. ⇒ تست‌های CI با ستونِ naive مقایسهٔ aware انجام می‌دادند و
محیط توسعه این را می‌پوشاند.
- این **باگ پرود نیست**: روی PostgreSQL مهاجرت‌شده شمارش شد — **۱۸۴ از ۱۸۴** ستون زمانی
  `timestamp with time zone` و صفر ستون naive؛ پس prod مقدار آگاه می‌دهد. (اثبات: خواندن
  `membership_purchases.expires_at` بعد از `alembic upgrade head` روی pgserver ⇒
  `2026-10-21 13:24:55.524723+00:00`, `tzinfo: UTC`.)
- رفع: `app/utils/utc.py::as_utc()` (naive ⇒ UTC-aware، روی PG بی‌اثر) و استفادهٔ آن در مقایسه‌ها؛
  `app/api/v1/competitions.py` تعریف localsِ همان تابع را داشت که به util مشترک وصل شد. تست
  waitlist دیگر awarenessِ درایور را نمی‌سنجد، بلکه خودِ قاعده را: `created_at` باید «اکنونِ UTC»
  باشد (پنجرهٔ ۲ ساعتهٔ `convert_expired` به همین عدد تکیه دارد).
- گیت‌ها بعد از رفع: استک pinned → `49 passed in 2.83s` برای دو فایل درگیر و
  **۵۵۲ passed در 104.70s** رگرسیون کامل؛ محیط توسعه (0.0.47) → هر دو تست هم رد می‌شوند؛
  `ruff --select E9,F82 app tests migrations` ⇒ All checks passed.
- **درس هارنس (به حافظه هم نوشته شد):** «سبز بودن سوئیت محلی» دلیل بر سالم بودن CI نیست؛ برای
  هر تغییر زمانی/مدلی، استک pinned را در venv جدا (`E:/venvs/salon-pinned`) اجرا کن.

---

## Track E — گیت رجرسیون خودکار (بازبینی #10) — راند ۱۴ ✅ بیانِ وضعیت، بدون کد تازه

> این بخش به جای «یک تست دیگر نوشتن»، **مرزهای ادعای سبز بودن** را ثبت می‌کند: چه چیزی، روی چه
> محیطی، و چه چیزی که *انجام نشده* است. اعداد همه در این راند دوباره اندازه‌گیری شدند.

### E1 آنچه هر راند باید اجرا کند (و شد)

| گیت | دستور | نتیجه (۲۰۲۶-۱۰-۱۷، سطح local) |
|---|---|---|
| سوئیت کامل بک‌اند | `python -m pytest -q -p no:warnings` | **۶۴۹ passed** (۶۲ فایل `tests/test_*.py`، SQLite) |
| همان سوئیت روی **استک pinned** (`sqlmodel 0.0.42` = `requirements.txt`) | `E:/venvs/salon-pinned/Scripts/python.exe -m pytest` | **۶۴۹ passed در 61.59s** (بدون واگرایی از محیط توسعه) |
| گیتِ دو فایل پول/دفتر کل روی استک pinned (`sqlmodel 0.0.42`) | `-m pytest tests/test_payment_booking_state_guard.py tests/test_finance_refund_void_consistency.py` | **۱۲ passed در 1.41s** |
| دروازهٔ lint بک‌اند | `ruff check app/ tests/ migrations/ --select E9,F82` | `All checks passed!` |
| قرارداد OpenAPI | `len(app.openapi()['paths'])` | **۲۳۸** (بی‌تغییر از راند ۱۲) |
| سوئیت واحد فرانت | `pnpm test` | **۱۵۸ passed در ۱۸ فایل، 18.85s** |
| type-check | `pnpm exec tsc --noEmit -p tsconfig.app.json` | exit **0** |
| lint فرانت | `pnpm run lint` (`--quiet`) | exit **0**، بدون خروجی |

### E2 چه چیزی عمداً اجرا **نشد** (صادقانه)

- **`vite build`** در این راند محلی اجرا نشد (ریزِ RAM روی این ماشین؛ گیت‌های build حجم‌دار
  همان‌جا می‌شکند). کارِ job ساخت در CI است.
- **E2E/Playwright** محلی اجرا نشد: `ms-playwright` روی این ماشین browser نصب‌شده ندارد و config
  خودش `vite --port 3001 --strictPort` را بالا می‌آورد. **۲۰ تست** در دو spec وجود دارد
  (`e2e/smoke.spec.ts` ۶، `e2e/ui-ux-audit.spec.ts` ۱۴ که **۲ تای آن `test.skip()`** است:
  `شبیه‌سازی خطای شبکه` و `دکمهٔ تلاش دوباره`) ⇒ **۱۸ تست مؤثر**؛ همه مسیرهای عمومی بدون login.
  اجرای واقعی‌شان فقط در job ابرِ CI (`web-tests.yml` → Playwright + `--with-deps chromium`).
- **Flutter:** نه `flutter test` و نه `flutter analyze` در این راند اجرا نشد؛ گیت‌های موبایل
  در `quality-gates.yml` (analyze) و workflow ساخت/APK جدا زندگی می‌کنند.

### E3 چرا «سبز بودنِ محلی» ادعای کافی نیست (سه واگرایی ثبت‌شده)

1. **موتور دیتابیس:** هارنس محلی SQLite است (`tests/conftest.py`)، ولی `backend-tests.yml` با
   **PostgreSQL 15** سرویس می‌کند و مهاجرت alembic را واقعاً اجرا می‌کند. راند ۹ دقیقاً از همین
   واگرایی سه باگ مقایسۀ timezone بیرون آورد (تست #27) ⇒ ادعاهای این سند همه «سطح unit/SQLite»
   برچسب خورده‌اند.
2. **استک پین‌شده vs محیط توسعه:** `requirements.txt` روی `sqlmodel 0.0.42` قفل است، در حالی که
   محیط کاربر 0.0.47 دارد؛ تست‌های زمانی/مدلی می‌توانند محلی سبز و CI قرمز باشند. راه‌حلِ ثبت‌شده:
   venv جدا در `E:/venvs/salon-pinned` (این راند: گیت‌های E1 ردیف ۲ و ۳ روی همان اجرا شد).
3. **CI به‌عنوان شاهد نهایی:** هیچ عددی در این سند جای run را نمی‌گیرد؛ وضعیت checks روی SHA
   با `~/.qoder-tmp/watch_sha_checks.py` خوانده می‌شود و نتیجه‌اش در پایین همین بخش ثبت می‌شود
   (قطعیِ شبکه‌ای github.com در راند ۱۳ باعث شد checksِ `6fb6f40` بی‌شاهد بماند).

### E4 تست‌هایی که واقعاً «می‌گازند» (شاهدِ قبل‑و‑بعد، نه فقط سبز بودن)

هر یک از این شماره‌ها با **برگرداندن کد معیوب** تولید شده، نه با حذف assertion:

| نقص رفع‌شده | فایل تست | پیش از رفع | پس از رفع |
|---|---|---|---|
| C8 اعلان صفِ انتظار قبل از commit | `test_waitlist_cancellation_dispatch.py` | قرعه‌آزمایی ترتیب/rollback | سبز |
| C9.1 سانسِ reschedule‌شده هرگز تکمیل نمی‌شد | `test_contracts_lifecycle.py` | **۱ failed / ۱۷ passed** | **۱۹ passed** |
| C9.3–C9.5 بی‌بازخوردی صف تأیید | `test_admin_approval_flow.py` | **۳ failed / ۳ passed** | **۶ passed** |
| C10.1-C10.3 پرداختِ رزروِ لغو/بازگشت‌وجه‌شده | `test_payment_booking_state_guard.py` | **۳ failed / ۱ passed** | **۵ passed** |
| C10.4 `return {**PaymentResponse}` ⇒ ۵۰۰ قطعی | همان فایل (`-k redirect_url`) | **۱ failed** (`TypeError` در `payments.py:177`) | سبز |
| C7 ابطالِ درآمدِ برگشت‌خورده | `test_finance_refund_void_consistency.py` | نقص دوفروشِ دفتری | سبز |
| C11.1/C11.2 گم‌شدنِ کسرِ سهم و کرش ۵۰۰ | `test_split_payment_settlement.py` | **۶ failed / ۱ passed** | **۷ passed** |
| C11.3-C11.5 مسیرِ پرداختِ سهم و چیپ‌های خالی | `SplitPaymentsPanel.test.tsx` | **۶ failed** | **۶ passed** |
| C13.1 لغوِ رزروِ پرداخت‌شده کوپن را آزاد می‌کرد | `test_coupon_burn_and_edit_guard.py` | **۱ failed** (مصرفِ دوباره ۲۰۰ داد) | سبز |
| C13.2 PUT بدون نگهبان٪ ⇒ رزروِ رایگان | همان فایل (دو تستِ نوع/مقدار) | **۲ failed** (هر دو ۲۰۰) | سبز |
| C14.1 جدولِ غایب ⇒ «صفر مغایرت» کاذب | `test_reconciliation_reports.py` (run/rerun + فهرست) | **۲۰۰ با صفر ردیف** (بدون هیچ جدول) | ۲۰۰ با ردیفِ واقعی و `total` درست |
| C14.2 کلیدِ `payment.id` ↔ `booking_id` | همان فایل (دو تستِ برخورد id و سه‌سهمه) + اسکریپت شاهد | **۴ مغایرت جعلی** روی دادهِ سالم | **۰ مغایرت** روی همان داده |
| C14.3 بردِ بازه روی `created_at` | اسکریپت شاهد (`~/.qoder-tmp/c14_witness_probe.py`) | `ledger=0` ⇒ **۲ مغایرت جعلی** | هر ۴ ردیف دیده می‌شوند |
| C14.4 شمارشِ برگشت وجه به‌عنوان درآمد | همان فایل (`refund_without_ledger`, `refunded_while_paid`) | ردیف EXPENSE در جمعِ درآمد می‌نشست | جمعِ per-payment با فیلترِ direction/type |
| C14.5 خواندنِ سراسری با نگهبانِ manager | همان فایل (فهرست: مدیر/سرپرست) | مدیر ⇒ **۲۰۰** با مغایرت‌های بقیۀ سالن‌ها | مدیر ⇒ **۴۰۳** |
| C15.1 واحدِ پولِ اشتراک (تومان ↔ ریال) + سیدرِ ۱۰× | `test_membership_units_and_entitlement.py` (تستِ سید + تستِ سه‌عددِ همسان) | سید ⇒ **۱۴۰٬۰۰۰** و فاکتور/دفتر کل همان عدد | سید، فاکتور و دفتر کل هر سه **۱٬۴۰۰٬۰۰۰** |
| C15.2 تخریبِ حقِ جلسه در `PUT` و fallbackهای `or 1`/`or 30` | همان فایل (چهار تست: nullِ sessions_count/duration_days، پکِ بی‌جلسه، ۴۵ روز) | `PUT` ⇒ **۲۰۰** و `sessions_remaining=1` پولِ ۱۰ جلسه | هر دو ⇒ **۴۰۰** و دیتابیس دست‌نخورده |
| C15.3 کارتِ بی‌اعتبار، فاکتور را لغو و commit می‌کرد | همان فایل (کارتِ ۱۵رقمی، سپس پرداختِ درست) | پس از ۴۰۰ ⇒ `status == "cancelled"` | پس از ۴۰۰ ⇒ `pending` و پرداختِ دوباره موفق |
| C15.4 تستِ زمان‌محورِ شکست‌خور در بازۀ UTC | `test_coach.py::test_dashboard_upcoming_excludes_past` | **۲ failed، 682 passed** روی `00:22Z` | سبز در هر ساعت (دیروزِ ۰۱:۰۰) |
| C15.5.8 N+1 در فهرستِ خریدها (ثبت شد، رفع نشد) | اسکریپت شمارند (`~/.qoder-tmp/membership_n1_probe.py`) | ۱ ردیف ⇒ **۷** statement، ۴ ردیف ⇒ **۱۳** | بدون تغییر؛ با `joinedload` قابل رفع است |

- **جمع‌بندی راند ۱۴ (بازبینی #4 و #10):** سه نقص پرداخت با نگهبان وضعیت رزرو + فیلد `payment_url`
  رفع شد، دو نقص (`بدنه‌خوانی /pay`، TTL فاکتور `PENDING`) با دلیلِ سازنده ثبت شد؛ رگرسیون دو محیط
  (local + pinned) و چهار گیت فرانت/بک‌اند اجرا شد و هیچ ادعای «روی درگاه واقعی کار می‌کند» بدون
  شاهد زنده نوشته نمی‌شود (X4).

### E5 بازسنجی راند ۱۵ (همان گیت‌ها، بعد از تغییرات C11)

جدول E1 عمداً به‌عنوان شاهدِ راند ۱۴ دست‌نخورده ماند؛ این ردیف‌ها همین سوئیت‌ها را بعد از دو کامیت
راند ۱۵ (`48da43a` بک‌اند، `671016e` فرانت) دوباره اندازه می‌گیرند تا «۶۴۹» عددِ کهنه ادعا نشود:

| گیت | نتیجه (۲۰۲۶-۱۰-۱۷، سطح local) | تغییر نسبت به راند ۱۴ |
|---|---|---|
| `python -m pytest -q -p no:warnings` | **۶۵۶ passed در 102.34s** | +۷ (فایل جدید `test_split_payment_settlement.py`) |
| `pnpm test` (سوئیت واحد فرانت) | **۱۶۴ passed در ۱۹ فایل** | +۶ در ۱ فایل جدید (`SplitPaymentsPanel.test.tsx`) |
| `ruff check app/ tests/ migrations/ --select E9,F82` | `All checks passed!` | بی‌تغییر |
| `len(app.openapi()['paths'])` | **۲۳۸** | بی‌تغییر؛ endpoint تازه‌ای اضافه نشد |
| `pnpm exec tsc --noEmit -p tsconfig.app.json` / `pnpm run lint` | exit **0** / exit **0** | بی‌تغییر |

- **مرز همان سه واگرایی E3 است:** SQLite محلی در برابر PostgreSQLِ `backend-tests.yml`، و هیچ‌کدام
  از اعداد بالا جای run را نمی‌گیرند؛ checks روی SHA پایین همین سند ثبت می‌شود.
- **افزودۀ راند ۱۵ به E2 (چه اجرا نشد):** تست **همزمانی** سهم‌ها (`paid_amount += …` بدون قفل ردیف)
  — روی این ماشین falsify نمی‌شود، چون `tests/conftest.py:104` هر تراکنش را `BEGIN IMMEDIATE`
  می‌کند. این تنها موردی است که در `FINAL_REVIEW.md` برای P003 «باقی‌مانده» نوشته شده بود و
  باقی‌مانده ماند (با دلیل، نه با سکوت): جایش یک job روی PostgreSQL با دو درخواست موازی است.

### E6 بازسنجی راند ۱۶ (کوپن‌ها — بک‌اند تنها)

| گیت | نتیجه (۲۰۲۶-۱۰-۱۷، سطح local) | تغییر نسبت به راند ۱۵ |
|---|---|---|
| `python -m pytest -q -p no:warnings` | **۶۶۱ passed در 65.71s** | +۵ (فایل جدید `test_coupon_burn_and_edit_guard.py`) |
| `pnpm test` (سوئیت واحد فرانت) | **۱۶۴ passed در ۱۹ فایل، 18.68s** | صفر؛ کد فرانت دست‌نخورده ماند |
| `ruff check app/ tests/ migrations/ --select E9,F82` | `All checks passed!` | بی‌تغییر |
| `len(app.openapi()['paths'])` | **۲۳۸** | بی‌تغییر؛ endpoint تازه‌ای اضافه نشد |

- دو گیتِ اولِ E5 روی **استک pinned** هم تکرار شد: `tests/test_coupon_burn_and_edit_guard.py` +
  `tests/test_coupons.py` ⇒ **۱۵ passed در 5.29s** (`sqlmodel 0.0.42` = چیزی که CI نصب می‌کند).
- **E2 این راند:** نه `vite build` و نه Playwright و نه Flutter اجرا شد (تغییری در آن‌ها نبود)؛
  تست **همزمانی کوپن** (`max_uses`/`per_user_limit` بی‌قفل) هم به همان دلیلِ SQLite قابل falsify
  نبود و در C13.3.1 ثبت شد. ⇒ این ادعا دو راند بعد باطل شد: `max_uses` در راند ۲۳ (C20) و
  `per_user_limit` در راند ۲۴ (C21)، هر دو با pgserver روی PostgreSQL واقعی.

### E7 بازسنجی راند ۱۷ (مغایرگیری — بک‌اند تنها، + راستی‌آزمایی روی PostgreSQL)

| گیت | نتیجه (۲۰۲۶-۱۰-۱۷، سطح local) | تغییر نسبت به راند ۱۶ |
|---|---|---|
| `python -m pytest -q -p no:warnings` | **۶۷۴ passed در 77.59s** | +۱۳ (فایل جدید `test_reconciliation_reports.py`) |
| `tests/test_reconciliation_reports.py` روی **استک pinned** (`sqlmodel 0.0.42`) | **۱۳ passed در 2.11s** | ردیفِ جدیدِ E1؛ CI همین را نصب می‌کند |
| `pnpm test` (سوئیت واحد فرانت) | **۱۶۴ passed در ۱۹ فایل، 19.06s** | صفر؛ کد فرانت دست‌نخورده |
| `ruff check app/ tests/ migrations/ --select E9,F82` | `All checks passed!` | بی‌تغییر (روی پنج فایل جدید/تغییریافته با قواعدِ پیش‌فرض هم پاک) |
| `len(app.openapi()['paths'])` | **۲۳۸** | بی‌تغییر؛ سه endpointِ `/reconciliation/*` از قبل بودند و حالا واقعاً کار می‌کنند |
| مهاجرت روی **PostgreSQL واقعی** (pgserver) | `upgrade head → downgrade −1 → upgrade head` exit 0 | نخستین بارِ `m0s027`؛ سومین مهاجرتِ اثبات‌شده روی PG بعد از `m0s025`/`m0s026` |
| کاتالوگِ PG | `reconciliationstatus` بومی با `COMPLETED, ISSUES_FOUND` · `uq_reconciliation_period:u` · `fk_reconciliation_reports_triggered_by:f` · ۴ ایندکس · `generated_at timestamptz` | SQLite این چهار مورد را نمی‌بیند (E3) |
| منطقِ مغایرت روی PG | `payments_checked=3` از ۴ پرداخت (بیرونیِ بازه حذف شد) · دو مغایرتِ درست · اجرای دوباره ⇒ یک ردیف | ادعای «idempotent» فقط روی PG قفل شد، نه فقط SQLite |

- **E2 این راند:** نه `vite build`، نه Playwright، نه Flutter (هیچ‌کدام دست‌نخورده)؛ و شاهدِ
  «پیش از رفع» در جدول بالا از **اجرای الگوریتمِ قدیمی روی همان فیکسچر** آمده، نه از حدس
  (اسکریپت: `~/.qoder-tmp/c14_witness_probe.py`، خروجی: `~/.qoder-tmp/c14_old_algorithm_witness.txt`).
- **مرزِ صادقانۀ همین راند:** مغایرگیری، دفتر کل را با رکوردِ پرداختِ **همان دیتابیس** مقایسه
  می‌کند؛ صورت‌حسابِ خودِ درگاه (settlement file) منبع نیست، پس هیچ عددی در این راند ادعای
  «تطبیق با درگاه» ندارد (X4).

### E8 بازسنجی راند ۱۸ (اشتراک باشگاه — بک‌اند تنها)

| گیت | نتیجه (۲۰۲۶-۱۰-۱۷، سطح local) | تغییر نسبت به راند ۱۷ |
|---|---|---|
| `python -m pytest -q -p no:warnings` | **۶۸۴ passed در 175.02s** | +۱۰ (فایل جدید `test_membership_units_and_entitlement.py`)؛ ۶۷۴ + ۱۰ = ۶۸۴ و هیچ تستِ کهنه‌ای نیفتاد |
| `tests/test_membership_units_and_entitlement.py` + `tests/test_coach.py` روی **استک pinned** (`sqlmodel 0.0.42`) | **۳۷ passed در 18.02s** | همان دو فایلی که در این راند دست خوردند، روی چیزی که CI نصب می‌کند |
| شاهدِ «پیش از رفع» (فقط با برگرداندن `memberships.py` و `seed_gyms_poolticket.py`، تست‌ها ثابت) | **۵ failed، ۵ passed** | چهار نقصِ C15.1-C15.3 با returnِ کد معیوب اثبات شد، نه با حذف assertion |
| `ruff check app/ tests/ migrations/ --select E9,F82` | `All checks passed!` | بی‌تغییر؛ قواعدِ پیش‌فرض روی فایل‌های این راند هم پاک |
| `len(app.main.app.openapi()['paths'])` | **۲۳۸** | بی‌تغییر؛ هیچ endpoint تازه‌ای اضافه نشد (نگهبان‌ها داخل همان هفت مسیر `/memberships/*` نشستند) |
| `pnpm test` (سوئیت واحد فرانت) | **۱۶۴ passed در ۱۹ فایل، 19.06s** | صفر؛ `formatPrice` و `types/membership.ts` از قبل «ریال» بودند و کد فرانت دست‌نخورده ماند |

- **E2 این راند (چه اجرا نشد):** `vite build`، Playwright و Flutter (هیچ‌کدام تغییر نکردند)؛ و
  تستِ **همزمانی** کسرِ جلسه (`sessions_remaining -= 1` بی‌قفل ردیف) — به همان دلیلِ
  `tests/conftest.py:104` (`BEGIN IMMEDIATE`) روی این ماشین falsify نمی‌شود و در C15.5.3 ثبت شد.
- **دروسی که از راند ۱۷ تکرار شد:** تک‌واحدِ پول (ریال) فقط با **منبعِ داده** بستگی ندارد —
  سیدرِ مستقل هم می‌تواند آن را بشکند؛ و قبل از X6 باید ردیف‌هایِ از قبل کاشته‌شده بررسی شوند،
  چون `_seed_session_plan` idempotent است و اصلاحِ کد، داده را درست نمی‌کند (C15.5.4).
- **حقایقی که «رفع شد» ادعا نمی‌شوند:** بازگشتِ وجهِ اشتراک، خوانده‌شدنِ درآمدِ اشتراک در
  مغایرگیری، `is_active` در مسیر پرداخت، cvv/expiry و `transaction_id` ساختگی (mock) — همه در
  C15.5 باقی‌مانده‌اند و عددی برایشان نوشته نشده.

---

### E9 بازسنجی راند ۱۹ (دروازۀ E2E — فرانت/CI تنها)

| گیت | نتیجه (۲۰۲۶-۱۰-۱۷، سطح local) | تغییر نسبت به راند ۱۸ |
|---|---|---|
| `pnpm exec playwright test --project=edge` با `CI=true` | **۲۰ passed، ۰ failed، ۰ skipped، ۰ flaky در 44.2s** | از «۷ spec شکست + ۲ skipِ بی‌محتوا» به سبزِ کامل؛ همان سوئیت، ادعاهای درست |
| `pnpm exec tsc --noEmit` (دستورِ CI) | **صفر خطا** | بی‌تغییر (پاک) |
| سوئیت واحد فرانت (۴ دسته × ۵ فایل، `NODE_OPTIONS=--max-old-space-size=3072`) | **۱۶۷ passed / ۰ failed** در ۲۰ فایل | +۳ = فایلِ جدید `src/lib/fieldAccessibleName.test.tsx`؛ ۱۶۴ راند ۱۸ دست‌نخورده ماند |
| `pnpm run lint` (همان `eslint src --ext ts,tsx --quiet`) | پاک | بی‌تغییر؛ `e2e/` و تستِ جدید هم جدا lint شدند |
| `scripts/e2e-annotations.mjs` روی `results.json` | `20 spec؛ expected=20 unexpected=0 flaky=0 skipped=0` | کانالِ تازه — پیش از این هیچ راهِ خواندنی برای دلیلِ شکست نبود |
| **شاهدِ CI** (surface = CI، ۲۰۲۶-۱۰-۱۷): run 38991027403، SHA `06429e47` | job `e2e-tests` ⇒ **completed/success**، هر ۱۳ step سبز (شامل «Run E2E tests» و «Report E2E failures as annotations»)؛ `lint-and-build`، `Frontend Tests`، `Security Scan`، `Backend Tests`، `React Web Build`، `unit-tests`، `Performance Test`، `Mobile Tests` ⇒ سبز؛ تنها قرمز = `Workers Builds: salon-app` (X9، بیرونی) | **اولین سبزِ واقعیِ این gate از `0598992`** — با `continue-on-error: false`؛ و چون سوئیت به بک‌اندِ prod خورد، runner به `2.189.255.225` می‌رسد |

- **E2 این راند (چه اجرا نشد):** `vite build` (نه کانفیگ بیلد دست خورد و نه bundle)، بک‌اند (صفر فایل
  تغییر کرد) و Flutter. شش فایل `src/**` که عوض شدند فقط attribute/slot جابه‌جا کردند؛ رگرسیونشان در
  سوئیت واحد + e2e سنجیده شد، نه با آزمونِ دستگاه.
- **دربارۀ عددِ ۱۶۷ (صادقانه):** اجرای یکجای `pnpm test` روی این ماشین workerها را می‌کشد
  (`FATAL ERROR: Zone Allocation failed - process out of memory`؛ در آخرین تلاش ۱۵/۲۰ فایل نتیجه داد).
  عددِ بالا جمعِ **چهار دستهٔ ۵تایی** است، نه یک اجرای واحد. تلاشِ `--pool=forks --singleFork=true`
  **۵۸ شکستِ نادرست** داد (اشتراکِ وضعیتِ jsdom/RTL بین فایل‌ها) و به‌عنوان اندازه‌گیری دور انداخته شد؛
  همان‌طور که `--no-threads` در vitest 2.1.9 اصلاً flag معتبر نیست.
- **مرورگرِ شاهد با مرورگرِ CI یکی نیست:** سبزیِ بالا روی **Edge** (`channel: msedge`) گرفته شد، چون
  دانلود Chromium روی این ماشین مسدود است؛ CI همان `chromium` را اجرا می‌کند و **شاهدش ثبت شد**
  (run 38991027403 ⇒ job سبز با `continue-on-error: false`)، پس ادعا از «روی Edge سبز است» به
  «روی Chromiumِ CI سبز است» ارتقا پیدا کرد — و اگر روزی runner به بک‌اند نرسد، قرمزِ **خواندنی**
  می‌بینیم نه سبزِ دروغین.
- **حقایقی که «سنجیده شد» ادعا نمی‌شوند:** نامِ قابل‌دسترسِ پنج `Select` و دیدنی‌بودنِ کنسول‌های
  ادمین/مدیر/CRM/مالی (X1: حساب تست نیست)؛ فقط الگویِ رفع در سطح واحد قفل شده است.

---

### E10 بازسنجی راند ۲۰ (اشتراک باشگاه — دسترسی/کوئری/ادعا، بک‌اند تنها)

| گیت | نتیجه (۲۰۲۶-۱۰-۱۷، سطح unit/SQLite روی استک pinned) | تغییر نسبت به راند ۱۸ |
|---|---|---|
| `pytest tests/test_membership_access_and_queries.py` | **۷ passed** | فایلِ جدیدِ این راند |
| همان ۷ تست با `app/` برگردانده‌شده (تست ثابت) | **۳ failed، ۴ passed** | سه نقصِ C17.1/.2/.3 با کدِ معیوب اثبات شد؛ پاس شدنِ تستِ C17.4 = ادعا غلط بود |
| `pytest tests/test_membership_access_and_queries.py tests/test_membership_units_and_entitlement.py` | **۱۷ passed در 11.48s** | ۱۰ راند ۱۸ دست‌نخورده ماند |
| `pytest` (رگرسیون کامل بک‌اند) | **۶۹۱ passed در 57.66s** | = ۶۸۴ + ۷؛ صفر رگرسیون با جابه‌جایی `get_optional_user` |
| `ruff check app/ tests/ migrations/ --select E9,F82` | `All checks passed!` | بی‌تغییر |
| `app.openapi()['paths']` | **۲۳۸** / ۲۸۰ operation | بی‌تغییر؛ نگهبان‌ها داخل همان مسیرهای موجود نشستند |
| شمارشِ statement لیست خریدها | **۱/۴/۶ ردیف ⇒ ۵/۵/۵** (`/my` ⇒ ۴) | پیش از رفع **۱⇒۷، ۴⇒۱۳**؛ شیبِ هر-ردیف صفر شد |

- **E2 این راند (چه اجرا نشد):** `vite build`/Playwright (فرانت صفر خطا تغییر کرد)، PostgreSQL واقعی،
  آزمونِ دستگاه، و CI (commitهای این راند جدا witness می‌خواهند). Flutter لمس نشد و فقط بررسی شد که
  هیچ فراخوانیِ `include_inactive=true` در موبایل نیست (`venue_detail_page.dart:71` ⇒ پیش‌فرض `false`).
- **دربارۀ «۷ = ۵ + ۲»:** عددِ ۵ statement در لیستِ ۵۰۰ردیفی هم ثابت می‌ماند، چون `joinedload`
  دو جدول را داخل همان SELECT می‌آورد؛ یعنی این رفع **شیب** را برداشته نه فقط ثابت را — و به همین
  دلیل در تست، برابریِ `four == one` ادعا شده نه «کمتر از آستانه».
- **حقایقی که «رفع شد» ادعا نمی‌شوند:** بازگشتِ وجهِ اشتراک، race/ممیزیِ `consume_session`،
  اصلاحِ دادهٔ ×۱۰ سیدر، و `cvv/expiry` + `transaction_id` ساختگی (C15.5.1/.3/.4/.6).

---

### E11 بازسنجی راند ۲۱ (بازگشت وجه اشتراک — بک‌اند + فرانت وب)

| گیت | نتیجه (۲۰۲۶-۱۰-۱۷) | تغییر نسبت به راند ۲۰ |
|---|---|---|
| `pytest tests/test_membership_refund.py` | **۷ passed در 0.80s** (pinned) | فایلِ جدیدِ این راند |
| همان ۷ تست با `app/` برگردانده‌شده (تست ثابت) | **۷ failed** — همۀ `post(…/refund)` ⇒ `404` | شاهدِ «قبلِ رفع»: مسیر اصلاً وجود نداشت، نه اینکه رفتارِ غلطی داشت |
| `pytest` (رگرسیون کامل بک‌اند) | **۶۹۸ passed در 63.49s** | = ۶۹۱ + ۷؛ صفر رگرسیون |
| `ruff check app --select E9,F82` | `All checks passed!` | بی‌تغییر |
| `app.openapi()['paths']` | **۲۳۹ / ۲۸۱ operation** | دقیقاً +۱ path و +۱ operation (همان refund) — نخستین باری که این گیت در این برنامه جابه‌جا شد |
| `pnpm exec tsc --noEmit` | **صفر خطا** | ورودیِ جدید: ۴ فایل فرانت |
| `pnpm exec eslint` روی ۴ فایل تغییرکرده | **۰ error، ۲۱ warning** (همه `no-explicit-any`، همه از قبل در HEAD) | بی‌بدهیِ lintِ تازه |
| سوئیت واحد فرانت (۵ دسته × ۵ فایل، heap 3072) | **۱۷۱ passed / ۰ failed** در ۲۱ فایل | = ۱۶۷ + ۴ تستِ جدیدِ `membership.test.ts` |
| `pnpm run build` (vite) | **exit 0 در 38.87s**، `ManagerDashboard` chunk ⇒ 78.18 kB / 19.71 kB gzip | نخستین گیتِ باندلِ این راند؛ سه فایل اشتراکِ بک‌اند با هم ⇒ **۲۴ passed** |
| اسکنِ CJK در دو سند | صفر خطوط | بی‌تغییر |
| شاهدِ CIِ راند ۲۰ (`60c59dc`) | ۱۹ از ۲۰ check سبز (e2e/unit/backend/frontend/mobile/lint/Flutter iOS/Tauri ×۵)، قرمز فقط «Workers Builds»؛ Android Release skipped (tag-gated) | برای نخستین بار سه build تauriِ ویندوز/لینوکس/اندرویدِ signed هم سبز بودند |

- **E2 این راند (چه اجرا نشد):** Playwright (حساب تستِ X1 نیست ⇒ دکمهٔ «بازگشت وجه» در E2E نسنجیده
  شد)، آزمون روی دستگاه، و PostgreSQL واقعی. `vite build` و `tsc` و eslint و سوئیت واحد **همه اجرا و
  سبز شدند** (جدولِ بالا).
- **سطح اعداد:** همه‌چیز **unit** است (TestClient/SQLite برای بک‌اند، vitest/jsdom برای فرانت). هیچ‌کدام
  از ۴۰۳/۴۰۰/۲۰۰های این راند روی `api.salon.absadeghi.ir` دیده نشده (X6) و هیچ پولی از درگاه پس نگرفته
  شده (X4) — ردیفِ `refund` یک سندِ حسابداری است، نه حرکتِ واقعیِ وجه.

---

### E12 بازسنجی راند ۲۲ (ممیزی و اتمی‌بودنِ کسر جلسه — بک‌اند + فرانت وب + PostgreSQL واقعی)

| گیت | نتیجه (۲۰۲۶-۱۰-۱۷) | تغییر نسبت به راند ۲۱ |
|---|---|---|
| `pytest tests/test_membership_session_audit.py` | **۸ passed در 0.87s** (pinned) | فایلِ جدیدِ این راند |
| همان ۸ با `app/api/v1/memberships.py` برگردانده‌شده به HEAD | **۷ failed، ۱ passed** | آن یکِ باقی‌مانده تستِ *منفی* است («اقدامِ مسدودشده ردیف نمی‌گذارد») که بی‌کد هم درست است |
| چهار فایل تستِ اشتراک با هم | **۳۲ passed در 2.09s** | = ۸ این راند + ۷ راند ۲۱ + ۷ راند ۲۰ + ۱۰ راند ۱۸ |
| `pytest` (رگرسیون کامل بک‌اند) | **۷۰۶ passed در 75.39s** | = ۶۹۸ + ۸؛ صفر رگرسیون |
| `ruff check app/ tests/ migrations/ --select E9,F82` | `All checks passed!` | بی‌تغییر |
| `app.openapi()['paths']` | **۲۴۰ / ۲۸۲ operation** | +۱ path و +۱ operation (endpointِ تاریخچه) نسبت به ۲۳۹/۲۸۱ |
| `pnpm exec tsc --noEmit` | **صفر خطا** | ورودیِ جدید: ۴ فایل فرانت |
| `pnpm exec eslint` روی ۴ فایل تغییرکرده | **۰ error، ۲۱ warning** (`no-explicit-any`، الگوی خودِ فایل) | بی‌بدهیِ تازه |
| سوئیت واحد فرانت (۵ دسته × ۵ فایل، heap 3072) | **۱۷۳ passed / ۰ failed** در ۲۱ فایل | = ۱۷۱ + ۲ تستِ جدیدِ `membership.test.ts` |
| `pnpm run build` (vite) | **exit 0 در 27.96s** | بی‌تغییرِ معنادار در آرایشِ chunkها |
| اسکنِ CJK در ده فایلِ لمس‌شده | **صفر فایل** | بی‌تغییر |
| شاهدِ CIِ راند ۲۱ (`d8abd84`) | ۲۳ check ⇒ **۲۰ success، ۲ skipped، ۱ failure** | تنها قرمز `Workers Builds: salon-app` (X9)؛ skippedها tag-gated (Android release + GitHub Release) |

- **شاهدِ PostgreSQL واقعی (`~/.qoder-tmp/pg_consume22.py`، لاگ `pg_consume22_out.txt`، exit 0):**
  `upgrade head` ⇒ `downgrade -1` ⇒ `upgrade head` هر سه `exit 0` · enumِ native =
  `['CONSUMED','REFUNDED']` و `event_type sql type = sessioneventtype` · ایندکس‌ها =
  `purchase_id`/`venue_id`/`actor_id`/`event_type` + pkey · پاکتِ **۱جلسه‌ای** با دو نخِ همزمان:
  کدِ **قدیم** `{'A': 1, 'B': 1}` خواند و هر دو بُرد ⇒ یک جلسه گم شد (lost update)؛ کدِ **جدید**
  rowcount `{'A': 1, 'B': 0}`، شمارنده صفر · `INSERT` ممیزی روی PG با ORM ⇒ ۱ ردیف با
  `event_type = CONSUMED` (نه `1` و نه رشتهٔ فارسی).
- **E2 این راند (چه اجرا نشد):** Playwright (دکمۀ «تاریخچه» و دیالوگ در E2E نسنجیده شد — حسابِ تستِ X1
  نیست)، آزمون روی دستگاه، و Flutter (هیچ رابطی به این endpoint ندارد). CI برای SHA این راند بعد از
  push تماشا می‌شود.
- **سطح اعداد:** بک‌اند **unit/SQLite** + یک شاهدِ **real-PG** همزمانی؛ فرانت **vitest/jsdom** + build.
  هیچ‌کدام از این پاسخ‌ها روی `api.salon.absadeghi.ir` دیده نشده (X6) و `m0s028` هنوز روی prod اجرا
  نشده ⇒ جدولِ تاریخچه روی prod خالی است و از لحظۀ deploy پر می‌شود.
- **دربارۀ «۷ failed، ۱ passed»:** برعکسِ راند ۲۱ (که همه ۴۰۴ می‌گرفتند چون مسیر نبود) اینجا endpoint
  هست ولی ردیفِ ممیزی و نگهبانِ SQL نیستند ⇒ تست‌ها **رفتار** را می‌گیرند، نه وجودِ مسیر را.

---

### E13 بازسنجی راند ۲۳ (دو شمارندۀ پولی — بک‌اند تنها + PostgreSQL واقعی)

| گیت | نتیجه (۲۰۲۶-۱۰-۱۷) | تغییر نسبت به راند ۲۲ |
|---|---|---|
| `pytest tests/test_counter_race_guards.py` | **۷ passed در 1.00s** (pinned) | فایلِ جدیدِ این راند |
| همان ۷ با سه فایلِ رفع‌شده برگردانده‌شده به HEAD | **۳ failed، ۴ passed** | چهارِ باقی‌مانده **رفتاری**‌اند و روی SQLite سبز می‌مانند — همان بهانۀ «falsify نمی‌شود» که این راند باطل شد |
| `pytest tests/test_counter_race_guards.py tests/test_coupons.py tests/test_coupon_burn_and_edit_guard.py tests/test_split_payments.py tests/test_split_payment_settlement.py` | **۴۴ passed در 3.99s** | کوپن + پرداخت اشتراکی، همه با هم |
| `pytest` (رگرسیون کامل بک‌اند) | **۷۱۳ passed در 66.53s** | = ۷۰۶ + ۷؛ صفر رگرسیون |
| `ruff check app/ tests/ migrations/ --select E9,F82` | `All checks passed!` | بی‌تغییر |
| `app.openapi()['paths']` | **۲۴۰ / ۲۸۲ operation** | **بی‌تغییر** — endpoint تازه‌ای اضافه نشد (برعکس راند ۲۲) |
| اسکنِ CJK در چهار فایلِ لمس‌شده | **صفر فایل** | بی‌تغییر |
| فرانت (tsc / eslint / vitest / vite build) | **اجرا نشد** | در این راند هیچ فایل فرانتی تغییر نکرد؛ عددِ مرجع همان E12 است (۱۷۳ passed / ۰ خطا) |

- **شاهدِ PostgreSQL واقعی (`~/.qoder-tmp/pg_race23.py`، لاگ‌های `pg_race23_before.txt` و
  `pg_race23_after.txt`، هر دو exit 0):** اسکیما با `alembic upgrade head` روی pgserver، داده‌های
  واقعیِ `users/venues/coupons/team_split_payments/split_payment_shares`، و **خودِ کدِ مسیر** صدا
  زده شد (`CouponService.reserve`، `await pay_share(...)`)؛ تنها تزریق `Barrier` + `sleep(0.5)` روی
  `SELECT … WHERE id = …` بود.
  | صحنه | HEAD (قبل از رفع) | بعد از رفع |
  |---|---|---|
  | کوپن `max_uses=1`، دو `reserve` | `{'A': OK, 'B': OK}`، مصرف‌ها **۲**، `uses_count` **۱** | `{'B': OK, 'A': 400 «ظرفیت…»}`، مصرف‌ها **۱**، `uses_count` **۱** |
  | دو سهمِ ۱۰۰٬۰۰۰ریالیِ متفاوت، همزمان | هر دو OK، سهم‌های PAID **۲**، ممیزی **۲**، `paid_amount` **۱۰۰٬۰۰۰** | هر دو OK، PAID **۲**، ممیزی **۲**، `paid_amount` **۲۰۰٬۰۰۰** |
  | یک سهم، دو درخواستِ همزمان | هر دو OK، PAID **۱**، ممیزی **۲**، `paid_amount` ۱۰۰٬۰۰۰ | `{'A': OK, 'B': 400 «قبلاً…»}`، PAID **۱**، ممیزی **۱**، `paid_amount` ۱۰۰٬۰۰۰ |
  و همین شاهد، رفعِ اولِ خودم را هم شکست: `CASE` بدونِ `cast` روی PG با `DatatypeMismatch` رد می‌شد
  در حالی که ۷۱۳ تست SQLite سبز بودند (C20).
- **E2 این راند (چه اجرا نشد):** هیچ چیزِ فرانتی (چیزی عوض نشد)، Playwright، آزمون روی دستگاه،
  و Flutter.
- **سطح اعداد:** بک‌اند **unit/SQLite** (رفتار + شکلِ statement) و یک شاهدِ **real-PG** همزمانی.
  هیچ‌کدام روی `api.salon.absadeghi.ir` دیده نشده (X6)؛ روی prodِ فعلی هم کوپنِ `max_uses=1` هنوز
  بیش از ظرفیت فروش می‌رود و دو پرداختِ همزمانِ اشتراکی هنوز یکی را گم می‌کند.
- **CIِ راند ۲۲ (`1b065a9`) — شاهدِ ثبت‌شده برای این جدول:** ۲۳ check ⇒ **۲۰ success، ۲ skipped،
  ۱ failure**. skippedها هر دو tag-gated بودند (Android release و GitHub Release)؛ تنها قرمز
  `Workers Builds: salon-app` است که بیرون از انبار می‌سوزد و همان X9 باقی می‌ماند.
- **CIِ راند ۲۳ (`034576a`) — شاهدِ همین راند:** همان ۲۳ check با همان توزیع ⇒ **۲۰ success،
  ۲ skipped (`Create GitHub Release` و `Flutter Android Release APK/AAB (Signed)`، هر دو tag-gated)،
  ۱ failure (`Workers Builds: salon-app` = X9)**. یعنی نه `unit-tests` و نه `Backend Tests` به
  نگهبان‌های SQLیِ جدید واکنش بد نشان ندادند و ناوکلِ سبزِ راند ۲۲ بی‌تغییر ماند.

### E14 بازسنجی راند ۲۴ (سقفِ فردیِ کوپن — بک‌اند تنها + PostgreSQL واقعی)

| گیت | عددِ این راند | نسبت به راند ۲۳ |
|---|---|---|
| `tests/test_counter_race_guards.py` | **۱۲ passed در 1.21s** (۷ راند ۲۳ + ۵ تازه) | ↑ |
| همان ۱۲ با دو فایلِ رفع‌شده برگردانده‌شده به HEAD | **۳ failed، ۹ passed** (`DID NOT RAISE` ×۲ و نبودِ `INSERT … SELECT` ×۱) | شاهدِ falsify |
| پنج فایل کوپن/پرداختِ اشتراکی (همان مجموعۀ راند ۲۳) | **۴۹ passed** (= ۴۴ + ۵) | ↑ — زمان اجرا قابل مقایسه نیست: این راند ماشین زیر بار بود (۷۲s در برابر 3.99s راند ۲۳) |
| رگرسیون کامل بک‌اند (pinned `sqlmodel 0.0.42`) | **۷۱۸ passed در 97.37s** (= ۷۱۳ + ۵) | ↑ |
| `ruff check app/ tests/ migrations/ --select E9,F82` | `All checks passed!` | بی‌تغییر |
| `app.openapi()['paths']` | **۲۴۰ path / ۲۸۲ operation** | بی‌تغییر — endpoint تازه‌ای اضافه نشد |
| اسکنِ CJK در سه فایلِ لمس‌شده + دو سندِ فارسی | **صفر** | بی‌تغییر |
| فرانت (tsc / eslint / vitest / vite build) | **اجرا نشد** | هیچ فایل فرانتی تغییر نکرد؛ عددِ مرجع همان E12 (۱۷۳ passed / ۰ خطا) |

- **شاهدِ PostgreSQL (`~/.qoder-tmp/pg_race24.py`؛ `pg_race24_before.txt` و
  `pg_race24_after.txt`، هر دو exit 0):** اسکیما با `alembic upgrade head`، سه صحنه، و
  **خودِ `validate_and_compute` + `reserve`** در هر ترد؛ تزریق فقط `Barrier` + `sleep(0.6)` روی
  `SELECT count(*) … coupon_redemptions`. قبل از رفع: `per_user_limit=1` با دو رزرو ⇒ **۲ ردیفِ
  مصرف برای یک کاربر**؛ `per_user_limit=2` با سه رزرو ⇒ **۳ ردیف**. بعد از رفع: ۱ و ۲، با
  `uses_count` برابرِ شمارِ ردیف‌ها (جبرانِ ظرفیت) و صحنۀ کنترلِ دو‌کاربره دست‌نخورده.
- **E2 این راند:** هیچ چیزِ فرانتی، Playwright، آزمون روی دستگاه، Flutter. CI برای SHA این راند
  بعد از push تماشا و اینجا ثبت می‌شود.
- **سطح اعداد:** بک‌اند **unit/SQLite** (شکلِ statement + ترتیبِ statement‌ها + رفتار) و یک
  شاهدِ **real-PG** همزمانی. روی `api.salon.absadeghi.ir` دیده نشده (X6) ⇒ امروز همان «یک کاربر
  دو بار با سقفِ یک» روی prod ممکن است.
- **گره‌های بازِ این راند (صادقانه):** **C21.2** (بی‌سقفِ فردی از API نوشتنی نیست — بالا)، و سه
  موردِ دست‌نخوردهٔ همین خانوادۀ مالی: `pay_share` ردیفِ دفتر کل نمی‌سازد (C11.6.1)،
  `CANCELLED`/`EXPIRED` مسیرِ تولیدی ندارند (C11.6.2)، و ردیف‌های مصرف کوپن هیچ‌جا فهرست
  نمی‌شوند (C13.3.2).

---

## Track F — ریشۀ قطعیِ check قرمزِ «Workers Builds: salon-app» (راند ۱۵ ✅ تشخیص، رفع مسدود)

> این check از GitHub Actions نیست؛ توسط GitHub App «Cloudflare Workers and Pages» ساخته می‌شود،
> پس لاگش در API لاگ‌های Actions نبود و تا این راند فقط «failure» دیده می‌شد. خواندن از
> `GET /accounts/{acc}/builds/builds/{uuid}` و `…/logs`:
> `https://api.github.com/repos/mrabolfazl13/salon-app/commits/{sha}/check-runs` → `summary` → Build ID.

- [x] **C12.1 تشخیص (شاهد خام، build `a2ddbec6-9eaf-41c9-b33a-13a8d9a8d2ee` روی `08a3833`):**
  ```
  Executing user deploy command: npx wrangler deploy
  Detected Project Settings: Worker Name: salon-app · Framework: Static · Output Directory: frontend
  ✘ [ERROR] Asset too large.
    … a file /opt/buildhome/repo/frontend/Salon-v1.1.0-universal.apk with a size of 65.2 MiB.
  Failed: error occurred while running deploy command
  ```
  یعنی **از زمان اولین push تا امروز** این check به یک فایل باینریِ commit‌شده می‌میرد، نه به کد؛
  build زمان کل ۲۱ ثانیه دارد و در مرحلۀ `deploying` رد می‌شود (`status: stopped`,
  `build_outcome: fail`).
- [x] **C12.2 پیکربندی trigger (از همان API):** `build_command: ""` (خالی)،
  `deploy_command: "npx wrangler deploy"`، `root_directory: "/"`، `branch_includes: ["master"]`.
  چون build نمی‌شود، «Output Directory: frontend» به **دایرکتوریِ سورسِ Vite** اشاره دارد، نه
  `frontend/dist`؛ یعنی حتی اگر APK حذف شود، wrangler دایرکتوری‌ای را آپلود می‌کند که
  `index.html`ش به `/src/main.tsx` ارجاع می‌دهد ⇒ یک سورس‌دیپِ شکسته روی prod.
  پس «حذف APK» **رفع نیست** — تنها رفعِ درست، build command + خروجی `frontend/dist` است.
- [x] **C12.3 دامنهٔ خطر (چرا خودسرانه انجام نشد):** prodِ `salon-app` روی
  `salon-app.mrabolfazl1314.workers.dev` زنده است (`/workers/subdomain` = `mrabolfazl1314`)،
  route سفارشی ندارد (`/workers/scripts/salon-app/routes` → `[]`)، و آخرین deployment‌های موفقش
  دو `dash_template` با `triggered_by: upload` در ۲۰۲۶-۱۰-۱۰ هستند (چسبانی، نه از git). یعنی
  سبز کردن این build **نسخۀ جاریِ prod را با یک build تازه جایگزین می‌کند** — و با پیکربندی فعلی،
  جایگزینی با سورس‌دیپِ شکسته. PATCH کردن trigger روی such pipeline خارج از مجوز «push/tag CI» است
  ⇒ به کاربر واگذار شد (X9).
- [x] **C12.4 ثبتِ منشأ: دو APK در `frontend/` commit شده** (`git ls-files`):
  `Salon-v0.2.0-arm64.apk` = ۲۰٬۴۴۱٬۲۱۰ بایت و `Salon-v1.1.0-universal.apk` = ۶۸٬۴۱۴٬۹۰۴ بایت.
  سقف asset در Workers **۲۵ MiB** است ⇒ فقط دومی build را می‌شکند. حذف/جابه‌جایی فایل‌ها در
  HEAD یک commit معمولی و برگشت‌پذیر است، ولی تاریخچه را کوچک نمی‌کند (همان X5).
- [x] **C12.5 دو گزینهٔ پیشِ روی کاربر (هر دو با شاهد همین راند):**
  1. build command = `cd frontend && pnpm install --frozen-lockfile && pnpm build` و
     Output Directory = `frontend/dist` ⇒ prod واقعاً از git build می‌شود؛ قبل از آن باید تأیید شود
     که سورسِ `frontend/` (نه `dist`) الان روی nginxِ `salon.absadeghi.ir` سرو نمی‌شود که قرار است
     بماند (دو مسیر انتشار متفاوت‌اند).
  2. غیرفعال/حذف کردن trigger از Cloudflare ⇒ check از فهرستِ SHAها می‌افتد و دیگر گیتِ شکستهٔ
     دائمی نداریم؛ prodِ موجود دست‌نخورده می‌ماند.

---

## موارد مسدود (تصمیم/دسترسی بیرونی — نباید جلوی بقیه را بگیرد)

| # | مورد | چرا مسدود | چه‌کسی باید بدهد |
|---|---|---|---|
| X1 | حساب تست برای E2E (۴ spec لاگین‌محور) | نبود fixture/رمز تست | کاربر |
| X2 | اعتبارنامه Firebase/FCM با پکیج درست | بیرونی | کاربر |
| X3 | تأیید پر بودن `KEYSTORE_*` در GitHub Secrets | فقط با اجرای tag-release مشخص می‌شود | کاربر/CI |
| X4 | قرارداد درگاه پرداخت و سرویس SMS | اداری | کاربر |
| X5 | حذف APKهای ۸۹MB از تاریخچه git | بازگشت‌ناپذیر | کاربر |
| X6 | مستقر کردن تغییرات بک‌اند روی سرور prod | روی سرویس زنده؛ نیاز به تأیید صریح. مهاجرت‌های منتظر اجرا: `m0s021coachesessions`، `m0s022tournaments`، `m0s023staffshifts`، `m0s024teamchallenges`، `m0s025roundrobin`، `m0s026doubleelim`، `m0s027reconreports` (زنجیرۀ تک‌سر؛ همه روی SQLite با up/down/up راستی‌آزمایی شدند، و `m0s025`، `m0s026` و `m0s027` علاوه بر آن روی PostgreSQL واقعی با up/down/up + خواندن کاتالوگ اثبات شد — برای `m0s027`: enum بومی `reconciliationstatus`، قیدِ `uq_reconciliation_period`، FK و `generated_at timestamptz`) | کاربر |
| X7 | دادهٔ تاریخی ۱۲ ماهه برای ML قیمت | ذاتاً زمان‌بر | — |
| X8 | عدد‌های بازاریابی صفحهٔ اصلی (`HeroSection.tsx:15-20`: +۱۲٬۰۰۰ بازیکن، +۵۰ زمین، +۳۰۰ مسابقه، ۴.۸) و شمارنده‌های `StatsSection` ساختگی‌اند؛ endpoint واقعی وجود ندارد | یا از سرور باید بیاید یا از صفحه برود — تصمیم محصول | کاربر |
| X9 | تصمیم راجع به trigger ابرِ «Workers Builds: salon-app» (دو گزینه در C12.5): build+dist، یا غیرفعال کردن | PATCH روی pipeline زنده؛ با پیکربندی فعلی سبز شدنش یعنی جایگزینی prodِ `salon-app.mrabolfazl1314.workers.dev` با سورس‌دیپِ شکسته. خارج از مجوز push/tag | کاربر |
