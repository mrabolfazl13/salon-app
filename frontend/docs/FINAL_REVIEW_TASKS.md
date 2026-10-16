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
  - راستی‌آزمایی روی **PostgreSQL واقعی** (نه فقط SQLite): با `pgserver` (پستgres ۱۸ محلی) چرخۀ
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
- **شاهدِ قبل‑و‑بعد:** پیش از رفع، آserterِ جدید این تاریخچه را دید
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
  3. `sp.paid_amount += share.amount` read-modify-write است و هیچ قفل ردیفی ندارد؛ روی PostgreSQL
     واقعیِ prod می‌تواند پرداختِ همزمانِ دو عضو یکی را گم کند. **روی این ماشین قابل falsify کردن
     نیست** (`tests/conftest.py:104` هر تراکنش را `BEGIN IMMEDIATE` می‌کند و SQLite serialize می‌شود)؛
     پس فقط به‌عنوان ریسک ثبت شده، نه باگ اثبات‌شده — تست همزمانی واقعی جایش در CI با PG است.
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
  1. **ظرفیت‌ها قفل ندارند:** `validate_and_compute()` می‌خواند `uses_count` و `per_user_limit` را،
     بعد `reserve()` دوباره همان `coupon`ِ در-حافظه را چک و `bump_uses()` می‌کند
     (`coupon_repository.py:42-51` read-modify-write). دو رزروِ موازیِ یک کدِ `max_uses=1` می‌توانند
     هر دو از validate رد شوند. **روی این ماشین falsify نمی‌شود** (`tests/conftest.py:104` ⇒
     `BEGIN IMMEDIATE`؛ همان دلیلِ C11.6.3) ⇒ جایش تست همزمانی روی PostgreSQL در CI است.
  2. **ردیف مصرف هیچ‌جا فهرست نمی‌شود:** نه endpoint `GET /coupons/{id}/redemptions`، نه در
     `CouponResponse`؛ مدیر فقط `uses_count` را می‌بیند. با C13.1 together یعنی «چه کسی و چقدر
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
  نبود و در C13.3.1 ثبت شد.

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
| X6 | مستقر کردن تغییرات بک‌اند روی سرور prod | روی سرویس زنده؛ نیاز به تأیید صریح. مهاجرت‌های منتظر اجرا: `m0s021coachesessions`، `m0s022tournaments`، `m0s023staffshifts`، `m0s024teamchallenges`، `m0s025roundrobin`، `m0s026doubleelim` (زنجیرۀ تک‌سر؛ همه روی SQLite با up/down/up راستی‌آزمایی شدند، و `m0s025` و `m0s026` علاوه بر آن روی PostgreSQL واقعی با up/down/up + خواندن برچسب‌های enum و نوع بومی `tournamentbracket` اثبات شد) | کاربر |
| X7 | دادهٔ تاریخی ۱۲ ماهه برای ML قیمت | ذاتاً زمان‌بر | — |
| X8 | عدد‌های بازاریابی صفحهٔ اصلی (`HeroSection.tsx:15-20`: +۱۲٬۰۰۰ بازیکن، +۵۰ زمین، +۳۰۰ مسابقه، ۴.۸) و شمارنده‌های `StatsSection` ساختگی‌اند؛ endpoint واقعی وجود ندارد | یا از سرور باید بیاید یا از صفحه برود — تصمیم محصول | کاربر |
| X9 | تصمیم راجع به trigger ابرِ «Workers Builds: salon-app» (دو گزینه در C12.5): build+dist، یا غیرفعال کردن | PATCH روی pipeline زنده؛ با پیکربندی فعلی سبز شدنش یعنی جایگزینی prodِ `salon-app.mrabolfazl1314.workers.dev` با سورس‌دیپِ شکسته. خارج از مجوز push/tag | کاربر |
