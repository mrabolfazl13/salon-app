# ممیزی تاریخی تسک‌ها (Historical Task Audit)

**تاریخ:** ۲۰۲۶-۱۰-۲۰ | **شاخه:** `flutter-free-web-tauri`

## روش و منابع

این ماتریس از منابع موجود در مخزن بازسازی شده است: `docs/FINAL_REVIEW_TASKS.md` (منبع اصلی تسک‌های
دور نهایی)، `docs/mobile-audit/BUG-TRACKER.md` (۳۹ یافتهٔ ممیزی)، `docs/roadmap/`، `docs/tasks/`،
`docs/role-audits/`، `docs/flutter-parity/`، تاریخچهٔ git، و راستی‌آزمایی زندهٔ API پروداکشن در ۲۰۲۶-۱۰-۲۰.
پیام‌های چت، تیکت‌های بیرونی و درخواست‌های شفاهیِ خارج از مخزن قابل بازسازی نبودند و در بخش
«ناشناخته‌ها» صریح ثبت شده‌اند.

> **اسناد کهنه:** `docs/tasks/master-task-board.md` (نسخهٔ Draft، ۲۰۲۶-۱۰-۰۸، مبتنی بر Node/TypeORM)
> با پیاده‌سازی واقعی (FastAPI/SQLModel) هم‌خوان نیست و **منبع حقیقت نیست**؛ فقط سابقهٔ برنامه‌ریزی است.
> `docs/mobile-audit/CURRENT-STATE.md` هم وضعیت F-16..F-19 را «در انتظار VERIFIED» نشان می‌دهد که در
> BUG-TRACKER تأیید شده‌اند.

## آمار کلی

- تسک‌های ریز بررسی‌شده در `FINAL_REVIEW_TASKS.md`: **164** (✅ 162 انجام/راستی‌آزمایی‌شده، ⛔ 2 باز) + **25** زیربندِ بدون شناسه (جزئیاتِ اجرای والد، همگی انجام‌شده)
- یافتهٔ ممیزی موبایل: **۳۹** شناسه (F-01..F-39؛ F-20 استفاده نشده) — همه بسته/تأییدشده
- مسدودهای بیرونی: **۹** (X1..X9؛ X6 در ۲۰۲۶-۱۰-۱۹ انجام شد و از فهرست مسدود خارج است)

## Track A — باگ‌ها و بدهی فنی — 38/38

| شناسه | درخواست | وضعیت | شاهد |
|---|---|---|---|
| A1.1 | افزودن `GET /notifications/` (paginated، فیلتر خوانده‌نشده) روی `get_by_user` | ✅ | [FINAL_REVIEW_TASKS.md:L109](FINAL_REVIEW_TASKS.md#L109) |
| A1.2 | افزودن `GET /notifications/unread-count` روی `get_unread_count` | ✅ | [FINAL_REVIEW_TASKS.md:L110](FINAL_REVIEW_TASKS.md#L110) |
| A1.3 | افزودن `PUT /notifications/{id}/read` روی `mark_as_read` (۴۰۴ اگر مال کاربر نبود) | ✅ | [FINAL_REVIEW_TASKS.md:L111](FINAL_REVIEW_TASKS.md#L111) |
| A1.4 | افزودن `PUT /notifications/read-all` روی `mark_all_as_read` | ✅ | [FINAL_REVIEW_TASKS.md:L112](FINAL_REVIEW_TASKS.md#L112) |
| A1.5 | تطبیق شکل پاسخ با چیزی که `frontend/src/components/layout/NotificationPanel.tsx` می‌خواند (نام فیلدها، enve… | ✅ | [FINAL_REVIEW_TASKS.md:L113](FINAL_REVIEW_TASKS.md#L113) |
| A1.6 | تست pytest برای هر ۴ مسیر (شامل «کاربر دیگر نمی‌تواند بخواند») | ✅ | [FINAL_REVIEW_TASKS.md:L114](FINAL_REVIEW_TASKS.md#L114) |
| A2.1 | `frontend/vite.config.ts:35` → `sourcemap: mode !== 'production'` | ✅ | [FINAL_REVIEW_TASKS.md:L119](FINAL_REVIEW_TASKS.md#L119) |
| A2.2 | تأیید اینکه artifact `dist` در `web-tests.yml:50-57` دیگر `.map` ندارد | ✅ | [FINAL_REVIEW_TASKS.md:L120](FINAL_REVIEW_TASKS.md#L120) |
| A3.1 | افزودن سرویس/والیوم برای `frontend/dist` در `docker-compose.yml` (مسیر `/usr/share/nginx/html` الان هیچ bac… | ✅ | [FINAL_REVIEW_TASKS.md:L125](FINAL_REVIEW_TASKS.md#L125) |
| A3.2 | `add_header`های `nginx.conf:27-31` را با `always` و به‌صورت inheritable تنظیم کن (فعلاً در `/assets/` و `/m… | ✅ | [FINAL_REVIEW_TASKS.md:L126](FINAL_REVIEW_TASKS.md#L126) |
| A3.3 | بستن `/docs`، `/redoc`، `/openapi.json` پشت یک flag محیطی (`nginx.conf:86-92`) | ✅ | [FINAL_REVIEW_TASKS.md:L127](FINAL_REVIEW_TASKS.md#L127) |
| A4.1 | middleware سراسری با حد پیش‌فرض برای همهٔ روترها (به‌جز health) | ✅ | [FINAL_REVIEW_TASKS.md:L132](FINAL_REVIEW_TASKS.md#L132) |
| A4.2 | خواندن `RATE_LIMIT_PER_MINUTE` / `AUTH_RATE_LIMIT_PER_HOUR` که الان مرده‌اند (`backend/app/config.py:44-45`) | ✅ | [FINAL_REVIEW_TASKS.md:L133](FINAL_REVIEW_TASKS.md#L133) |
| A4.3 | تصمیم fail-open/fail-closed برای قطعی Redis (`rate_limit.py:53-55,83-85`) + لاگ هشدار | ✅ | [FINAL_REVIEW_TASKS.md:L134](FINAL_REVIEW_TASKS.md#L134) |
| A5.1 | حذف مقدار پیش‌فرض `POSTGRES_PASSWORD`، `MINIO_ROOT_PASSWORD`، `MINIO_SECRET_KEY`، `DATABASE_URL` از `docker… | ✅ | [FINAL_REVIEW_TASKS.md:L139](FINAL_REVIEW_TASKS.md#L139) |
| A5.2 | رفع `extra="ignore"` در `backend/app/config.py:75-79` که باعث می‌شود compose بی‌صدا `.env` را بازنویسی کند | ✅ | [FINAL_REVIEW_TASKS.md:L140](FINAL_REVIEW_TASKS.md#L140) |
| A5.3 | هم‌سازی `backend/.env.example`: حذف `SMS_*` ماورایی، افزودن ~۲۵ فیلد واقعی | ✅ | [FINAL_REVIEW_TASKS.md:L141](FINAL_REVIEW_TASKS.md#L141) |
| A5.4 | ساخت `frontend/.env.example` با ۵ متغیر `VITE_*` | ✅ | [FINAL_REVIEW_TASKS.md:L142](FINAL_REVIEW_TASKS.md#L142) |
| A5.5 | استثنای `.gitignore:13` برای فایل‌های `*.env.*.example` تا `.env.production.example` ترک شود | ✅ | [FINAL_REVIEW_TASKS.md:L143](FINAL_REVIEW_TASKS.md#L143) |
| A6.1 | `notify_overdue_contract_payments` (`backend/app/tasks/contract_tasks.py:84`) را به schedule در `worker.py:… | ✅ | [FINAL_REVIEW_TASKS.md:L148](FINAL_REVIEW_TASKS.md#L148) |
| A6.2 | یک تست که schedule نهایی را با لیست taskهای تعریف‌شده مقایسه می‌کند | ✅ | [FINAL_REVIEW_TASKS.md:L149](FINAL_REVIEW_TASKS.md#L149) |
| A7.1 | افزودن `eslint.config.js` (یا سوییچ CI به `.oxlintrc.json` موجود) | ✅ | [FINAL_REVIEW_TASKS.md:L154](FINAL_REVIEW_TASKS.md#L154) |
| A7.2 | رفع خطاهای ناشی از فعال‌سازی (فقط errorها، warningها نه) | ✅ | [FINAL_REVIEW_TASKS.md:L155](FINAL_REVIEW_TASKS.md#L155) |
| A8.1 | افزودن vitest + jsdom + اسکریپت `test` | ✅ | [FINAL_REVIEW_TASKS.md:L160](FINAL_REVIEW_TASKS.md#L160) |
| A8.2 | ۵ تست اول: `toLatinDigits`، رزولوشن URL تصویر سالن، منطق gap/RTL، `VenueCard` رندر، یک service mock | ✅ | [FINAL_REVIEW_TASKS.md:L161](FINAL_REVIEW_TASKS.md#L161) |
| A8.3 | افزودن job به `web-tests.yml` | ✅ | [FINAL_REVIEW_TASKS.md:L162](FINAL_REVIEW_TASKS.md#L162) |
| A9.1 | ⛔ تصمیم کاربر: دو APK به حجم ~۸۹MB (`frontend/Salon-v0.2.0-arm64.apk`, `Salon-v1.1.0-universal.apk`) از این… | ✅ | [FINAL_REVIEW_TASKS.md:L167](FINAL_REVIEW_TASKS.md#L167) |
| A9.2 | افزودن بودجهٔ حجم chunk به CI (اسکریپت `monitoring/bundle-size-monitor.py` هست ولی هیچ workflow‌ای صدا نمی‌… | ✅ | [FINAL_REVIEW_TASKS.md:L168](FINAL_REVIEW_TASKS.md#L168) |
| A11.1 | بازنویسی `backend/tests/test_permissions.py` روی هارنس واقعی (۲۱ ERROR → ۱۲ تست سبز) | ✅ | [FINAL_REVIEW_TASKS.md:L175](FINAL_REVIEW_TASKS.md#L175) |
| A11.2 | رفع `NameError: UserRole` در `POST /api/v1/reviews` (برای همهٔ کاربران ۵۰۰ بود) | ✅ | [FINAL_REVIEW_TASKS.md:L176](FINAL_REVIEW_TASKS.md#L176) |
| A11.3 | رفع مقایسهٔ رشتهٔ نقش در `GET /api/v1/waitlist/slot/{id}` (ادمین‌ها همیشه ۴۰۳) | ✅ | [FINAL_REVIEW_TASKS.md:L177](FINAL_REVIEW_TASKS.md#L177) |
| A11.4 | رفع `NameError: os` در job پشتیبان‌گیری (بعد از A6 واقعاً اجرا می‌شد) | ✅ | [FINAL_REVIEW_TASKS.md:L178](FINAL_REVIEW_TASKS.md#L178) |
| A11.5 | رفع نشت state بین تست‌ها: سه جدول هرگز truncate نمی‌شد | ✅ | [FINAL_REVIEW_TASKS.md:L179](FINAL_REVIEW_TASKS.md#L179) |
| A10.1 | رفع double-encoding در `src/components/team/TeamDuesPanel.tsx` | ✅ | [FINAL_REVIEW_TASKS.md:L202](FINAL_REVIEW_TASKS.md#L202) |
| A10.2 | اسکن کل `src/` برای فایل خراب دیگر | ✅ | [FINAL_REVIEW_TASKS.md:L203](FINAL_REVIEW_TASKS.md#L203) |
| A11.1 | `tests/test_permissions.py` را روی هارنس واقعی زنده کن (۲۱ ERROR → سبز) | ✅ | [FINAL_REVIEW_TASKS.md:L217](FINAL_REVIEW_TASKS.md#L217) |
| A11.2 | رفع باگ‌های پیدا‌شده در مسیرهای واقعی | ✅ | [FINAL_REVIEW_TASKS.md:L218](FINAL_REVIEW_TASKS.md#L218) |
| A11.3 | نشت state بین تست‌ها در `conftest` (جداول فراموش‌شده در truncate) | ✅ | [FINAL_REVIEW_TASKS.md:L219](FINAL_REVIEW_TASKS.md#L219) |

## Track B — شکاف‌های فیچر کوچک — 16/17

| شناسه | درخواست | وضعیت | شاهد |
|---|---|---|---|
| B1.1 | تولید Blob با `BEGIN:VEVENT` از شیء رزرو در `frontend/src/utils/calendar.ts` | ✅ | [FINAL_REVIEW_TASKS.md:L253](FINAL_REVIEW_TASKS.md#L253) |
| B1.2 | دکمهٔ «افزودن به تقویم» در صفحهٔ جزئیات رزرو + لیست رزروها | ✅ | [FINAL_REVIEW_TASKS.md:L254](FINAL_REVIEW_TASKS.md#L254) |
| B1.3 | تست واحد روی رشتهٔ تولیدی (فرار ویرگول، زمان، TZID) | ✅ | [FINAL_REVIEW_TASKS.md:L255](FINAL_REVIEW_TASKS.md#L255) |
| B2.1 | `frontend/src/components/home/GamificationSection.tsx:226` آرایهٔ هاردکد را با endpoint امتیاز/استندینگ (`b… | ✅ | [FINAL_REVIEW_TASKS.md:L260](FINAL_REVIEW_TASKS.md#L260) |
| B2.2 | حالت خالی/اسکلتون + مدیریت خطا | ✅ | [FINAL_REVIEW_TASKS.md:L261](FINAL_REVIEW_TASKS.md#L261) |
| B3.1 | اتصال `checkin_service.py:99` به `loyalty` (`backend/app/models/loyalty.py:30`) | ✅ | [FINAL_REVIEW_TASKS.md:L266](FINAL_REVIEW_TASKS.md#L266) |
| B3.2 | تست: چک‌این → تراکنش امتیاز، و idempotency (چک‌این دوبار امتیاز دوبار ندهد) | ✅ | [FINAL_REVIEW_TASKS.md:L267](FINAL_REVIEW_TASKS.md#L267) |
| B3.3 | رفع دو باگ تولیدی که مسیر چک‌این را می‌شکستند (در همین حین کشف شد): | ✅ | [FINAL_REVIEW_TASKS.md:L268](FINAL_REVIEW_TASKS.md#L268) |
| B4.1 | job ماهانهٔ تولید installment برای تیم‌ها (منطق فعلی فقط با POST کاپیتان: `team_service.py:918`) | ✅ | [FINAL_REVIEW_TASKS.md:L283](FINAL_REVIEW_TASKS.md#L283) |
| B4.2 | جریمهٔ دیرکرد + اعلان (از همین موتور نوتیفیکیشن A1) | ✅ | [FINAL_REVIEW_TASKS.md:L284](FINAL_REVIEW_TASKS.md#L284) |
| B4.3 | UI وضعیت «خودکار/دستی» در `TeamDuesPanel.tsx` | ✅ | [FINAL_REVIEW_TASKS.md:L285](FINAL_REVIEW_TASKS.md#L285) |
| B5.1 | پس از پنجرهٔ ۲ ساعته، ساخت رزرو قطعی برای نفر اول (`reminder_tasks.py:134`) | ✅ | [FINAL_REVIEW_TASKS.md:L311](FINAL_REVIEW_TASKS.md#L311) |
| B5.2 | رقابت‌پذیری: lock/retry تا دو نفر هم‌زمان slot نگیرند | ✅ | [FINAL_REVIEW_TASKS.md:L312](FINAL_REVIEW_TASKS.md#L312) |
| B6.1 | افزودن فلگ‌های بیننده به پاسخ `TeamDiscover` (`frontend/src/pages/teams/TeamDiscover.tsx:4`) | ✅ | [FINAL_REVIEW_TASKS.md:L341](FINAL_REVIEW_TASKS.md#L341) |
| B6.2 | افزودن شمارش رضایت‌ها به `CampaignsTab` (`frontend/src/components/crm/CampaignsTab.tsx:3-4`) | ✅ | [FINAL_REVIEW_TASKS.md:L342](FINAL_REVIEW_TASKS.md#L342) |
| B7.1 | شمارش بازدید اخبار، تعداد لایک اینستاگرام، تعداد فالوور و `date` ساختگی ('۱۴۰۲') حذف شد | ✅ | [FINAL_REVIEW_TASKS.md:L347](FINAL_REVIEW_TASKS.md#L347) |
| B7.2 | آمار بازاریابی hero/Stats — منتظر تصمیم (X8) | ⛔ باز | [FINAL_REVIEW_TASKS.md:L348](FINAL_REVIEW_TASKS.md#L348) |

## Track C — فیچرهای بزرگ — 75/75

| شناسه | درخواست | وضعیت | شاهد |
|---|---|---|---|
| C1.1 | افزودن `COACH` به `UserRole` (`backend/app/models/user.py:7-11`) + مهاجرت + ماتریس مجوزها | ✅ | [FINAL_REVIEW_TASKS.md:L357](FINAL_REVIEW_TASKS.md#L357) |
| C1.2 | مدل `CoachSession` (مربی، شاگرد، زمان، وضعیت، شهریه) | ✅ | [FINAL_REVIEW_TASKS.md:L358](FINAL_REVIEW_TASKS.md#L358) |
| C1.3 | endpointهای CRUD + ثبت حضور و غیاب | ✅ | [FINAL_REVIEW_TASKS.md:L359](FINAL_REVIEW_TASKS.md#L359) |
| C1.4 | `CoachDashboard` فرانت (لیست جلسات امروز، ثبت حضور سریع) | ✅ | [FINAL_REVIEW_TASKS.md:L360](FINAL_REVIEW_TASKS.md#L360) |
| C1.5 | مسیر روت + ورودی ناوبری + نقش‌محور بودن | ✅ | [FINAL_REVIEW_TASKS.md:L361](FINAL_REVIEW_TASKS.md#L361) |
| C1.6 | بستن حفرهٔ تشدید نقش در `/auth/register` + endpoint تخصیص نقش (`PUT /admin/users/{id}/role`) + UI آن در پنل… | ✅ | [FINAL_REVIEW_TASKS.md:L362](FINAL_REVIEW_TASKS.md#L362) |
| C2.1 | مدل‌های `Tournament`, `TournamentRound`, `TournamentMatch`, `TournamentParticipant` | ✅ | [FINAL_REVIEW_TASKS.md:L370](FINAL_REVIEW_TASKS.md#L370) |
| C2.2 | موتور قرعه‌کشی Single-Elimination (توان دو بعدی + seed + bye) + تست‌های ویژگی (برنده به | ✅ | [FINAL_REVIEW_TASKS.md:L371](FINAL_REVIEW_TASKS.md#L371) |
| C2.3 | API: ساخت، بازکردن ثبت‌نام، ثبت‌نام/حذف تیم، قرعه‌کشی، ثبت نتیجه، لغو، براکت، رده‌بندی | ✅ | [FINAL_REVIEW_TASKS.md:L373](FINAL_REVIEW_TASKS.md#L373) |
| C2.4 | UI براکت بصری (CSS grid، RTL-safe) + جدول رده‌بندی + مسیر روت و ورودی‌های ناوبری | ✅ | [FINAL_REVIEW_TASKS.md:L374](FINAL_REVIEW_TASKS.md#L374) |
| C2.5 | برش‌های بعدی: Round-Robin (لیگ همه‌با‌همه) — پایین را ببین | ✅ | [FINAL_REVIEW_TASKS.md:L375](FINAL_REVIEW_TASKS.md#L375) |
| C2.6 | Double-Elimination (دو-حذفی) — راند ۹، پایین را ببین | ✅ | [FINAL_REVIEW_TASKS.md:L376](FINAL_REVIEW_TASKS.md#L376) |
| C2.5a | موتور: `round_robin_weeks` (روش دایره: `arr[0]` ثابت، بقیه چرخش، `None` = استراحت)، | ✅ | [FINAL_REVIEW_TASKS.md:L408](FINAL_REVIEW_TASKS.md#L408) |
| C2.5b | تست: `tests/test_tournament_round_robin.py` (ویژگی + سرویس + API) | ✅ | [FINAL_REVIEW_TASKS.md:L412](FINAL_REVIEW_TASKS.md#L412) |
| C2.5c | UI: انتخاب فرمت در دیالوگ ساخت، برچسب فرمت روی کارت و هدر، رندر «برنامهٔ هفته‌ها» با | ✅ | [FINAL_REVIEW_TASKS.md:L413](FINAL_REVIEW_TASKS.md#L413) |
| C2.5d | مهاجرت `m0s025_tournament_round_robin.py`: `ALTER TYPE tournamentformat ADD VALUE | ✅ | [FINAL_REVIEW_TASKS.md:L416](FINAL_REVIEW_TASKS.md#L416) |
| C2.6a | موتور: `losers_bracket_plan` (قیفِ بازندگان: survivors×newcomers با `_interleave`، | ✅ | [FINAL_REVIEW_TASKS.md:L455](FINAL_REVIEW_TASKS.md#L455) |
| C2.6b | تست: `tests/test_tournament_double_elim.py` (ویژگی + ساختار + API) | ✅ | [FINAL_REVIEW_TASKS.md:L461](FINAL_REVIEW_TASKS.md#L461) |
| C2.6c | UI: گزینهٔ «دو-حذفی» در دیالوگ ساخت، دو براکت جدا (برندگان+فینالِ بزرگ / بازندگان)، | ✅ | [FINAL_REVIEW_TASKS.md:L462](FINAL_REVIEW_TASKS.md#L462) |
| C2.6d | مهاجرت `migrations/versions/m0s026_double_elimination.py`: سه برچسبِ `tournamentformat` | ✅ | [FINAL_REVIEW_TASKS.md:L465](FINAL_REVIEW_TASKS.md#L465) |
| C3.1 | مدل `StaffShift` + تشخیص تعارض | ✅ | [FINAL_REVIEW_TASKS.md:L537](FINAL_REVIEW_TASKS.md#L537) |
| C3.2 | API + UI هفتگی drag-free (نسخهٔ فرمی) | ✅ | [FINAL_REVIEW_TASKS.md:L538](FINAL_REVIEW_TASKS.md#L538) |
| C4.1 | امتیاز تطبیق بر پایهٔ رتبه/سطح/منطقه/زمان | ✅ | [FINAL_REVIEW_TASKS.md:L586](FINAL_REVIEW_TASKS.md#L586) |
| C4.2 | «چالش بازی» با پذیرش/رد طرفین | ✅ | [FINAL_REVIEW_TASKS.md:L587](FINAL_REVIEW_TASKS.md#L587) |
| C5.1 | جمع‌آوری سیگنال نرخ اشغال per slot-hour (بدون ML) | ✅ | [FINAL_REVIEW_TASKS.md:L657](FINAL_REVIEW_TASKS.md#L657) |
| C5.2 | پیشنهاد قیمت از روی تاریخچه + سقف/کف ایمن | ✅ | [FINAL_REVIEW_TASKS.md:L658](FINAL_REVIEW_TASKS.md#L658) |
| C5.3 | ⛔ ML واقعی: نیاز به دادهٔ ۱۲ ماهه (مسدود ذاتی) — این راند عمداً آمار توصیفی است، نه مدل | ✅ | [FINAL_REVIEW_TASKS.md:L659](FINAL_REVIEW_TASKS.md#L659) |
| C6.1 | endpoint تجمیعی `GET /finance/venue-comparison` (یک ردیف به ازای هر سالنِ دامنه) | ✅ | [FINAL_REVIEW_TASKS.md:L711](FINAL_REVIEW_TASKS.md#L711) |
| C6.2 | پنل فارسی «مقایسهٔ سالن‌ها» در داشبورد مالی (جدول دسکتاپ + کارت موبایل) | ✅ | [FINAL_REVIEW_TASKS.md:L712](FINAL_REVIEW_TASKS.md#L712) |
| C6.3 | ⛔ نه ML و نه forecast — این برش گزارش توصیفی است: رتبه، سهم، دلتای بازهٔ قبل | ✅ | [FINAL_REVIEW_TASKS.md:L713](FINAL_REVIEW_TASKS.md#L713) |
| C7.1 | (F1) جفتِ `(source_type, source_id)` ردیف برگشتِ فیش/در‌محل با ردیف درآمدی‌اش یکی شد | ✅ | [FINAL_REVIEW_TASKS.md:L760](FINAL_REVIEW_TASKS.md#L760) |
| C7.2 | (F2) ابطالِ ردیف درآمدی که برگشتش را بی‌پوشش می‌گذارد، با ۴۰۰ بسته شد | ✅ | [FINAL_REVIEW_TASKS.md:L761](FINAL_REVIEW_TASKS.md#L761) |
| C7.3 | (F3) نوشتنِ هم‌زمان با `idempotency_key` تکراری → ثبت شد، رفع نشد (دلیل پایین) | ✅ | [FINAL_REVIEW_TASKS.md:L762](FINAL_REVIEW_TASKS.md#L762) |
| C7.4 | پایداری ساعتی `tests/test_price_guard.py::test_is_past_slot_rule` | ✅ | [FINAL_REVIEW_TASKS.md:L763](FINAL_REVIEW_TASKS.md#L763) |
| C8.1 | `notify_waitlist_on_cancellation.delay()` از بالای `DELETE /bookings/{id}` به بعد از | ✅ | [FINAL_REVIEW_TASKS.md:L814](FINAL_REVIEW_TASKS.md#L814) |
| C8.2 | یک کوئری مُرده در همان تابع حذف شد (`paid_tx` خوانده می‌شد و هرگز استفاده نمی‌شد) | ✅ | [FINAL_REVIEW_TASKS.md:L816](FINAL_REVIEW_TASKS.md#L816) |
| C8.3 | ⚠️ ثبت شد، رفع نشد: `_send_waitlist_notification_sync` داخل event loop نمی‌تواند | ✅ | [FINAL_REVIEW_TASKS.md:L817](FINAL_REVIEW_TASKS.md#L817) |
| C9.1 | `ContractRepository.get_past_scheduled()` روی `rescheduled_date` کوچ‌می‌زد؛ | ✅ | [FINAL_REVIEW_TASKS.md:L864](FINAL_REVIEW_TASKS.md#L864) |
| C9.2 | `check_expired_contracts` رویداد انقضا را با این عبارت ثبت می‌کرد: | ✅ | [FINAL_REVIEW_TASKS.md:L877](FINAL_REVIEW_TASKS.md#L877) |
| C9.3 | `POST /admin/users/{id}/approve/reject` و `POST /admin/verify-venue/{id}` فقط یک | ✅ | [FINAL_REVIEW_TASKS.md:L891](FINAL_REVIEW_TASKS.md#L891) |
| C9.4 | دست‌انداز تستی که در این دور کشف شد: هر helperِ نوشتنی روی fixture `db` باید | ✅ | [FINAL_REVIEW_TASKS.md:L899](FINAL_REVIEW_TASKS.md#L899) |
| C9.5 | ⚠️ ثبت شد، رفع نشد: `set_user_role` کاربرِ تازه‌تنزل‌یافته را باخبر نمی‌کند و | ✅ | [FINAL_REVIEW_TASKS.md:L903](FINAL_REVIEW_TASKS.md#L903) |
| C10.1 | `POST /payments/{id}/pay` فقط `payment.status == PAID` را می‌پرسید و هیچ‌وقت | ✅ | [FINAL_REVIEW_TASKS.md:L928](FINAL_REVIEW_TASKS.md#L928) |
| C10.2 | همان نقص در webhook درگاه (`POST /payments/{id}/callback`): اگر کاربر بین | ✅ | [FINAL_REVIEW_TASKS.md:L933](FINAL_REVIEW_TASKS.md#L933) |
| C10.3 | فاکتورِ REFUNDED دوباره قابل پرداخت بود ⇒ بارِ دومِ گرفتن پول با | ✅ | [FINAL_REVIEW_TASKS.md:L938](FINAL_REVIEW_TASKS.md#L938) |
| C10.4 | سر‌شاخه‌ای که اصلاً کار نمی‌کرد: شاخۀ درگاه واقعی همین‌جا | ✅ | [FINAL_REVIEW_TASKS.md:L943](FINAL_REVIEW_TASKS.md#L943) |
| C10.5 | ⚠️ ثبت شد، رفع نشد: `/pay` هیچ بدنه‌ای نمی‌خواند (`PaymentPayRequest` import شده و | ✅ | [FINAL_REVIEW_TASKS.md:L949](FINAL_REVIEW_TASKS.md#L949) |
| C10.6 | ⚠️ ثبت شد، رفع نشد: فاکتورِ `PENDING` بی‌صاحب می‌ماند — نه TTL دارد نه job ابطال؛ | ✅ | [FINAL_REVIEW_TASKS.md:L953](FINAL_REVIEW_TASKS.md#L953) |
| C11.1 | `POST /split-payments/` در روش PERCENTAGE هر سهم را `int(amount * pct / 100)` | ✅ | [FINAL_REVIEW_TASKS.md:L986](FINAL_REVIEW_TASKS.md#L986) |
| C11.2 | کرش ۵۰۰ در ساخت پرداخت: اگر مبلغ کل به هر عضو یک ریال نمی‌رسید، سهمِ صفری با | ✅ | [FINAL_REVIEW_TASKS.md:L993](FINAL_REVIEW_TASKS.md#L993) |
| C11.3 | بن‌بستِ مسیر پول در وب: `POST /split-payments/{id}/shares/{share_id}/pay` و | ✅ | [FINAL_REVIEW_TASKS.md:L997](FINAL_REVIEW_TASKS.md#L997) |
| C11.4 | چیپ خالی: `STATUS_LABELS`/`STATUS_COLORS` (`SplitPaymentsPanel.tsx:22-34`) کلیدهای | ✅ | [FINAL_REVIEW_TASKS.md:L1004](FINAL_REVIEW_TASKS.md#L1004) |
| C11.5 | `GET /split-payments/{id}` دو فیلد `total_paid` و `remaining` را می‌فرستد و هیچ‌جا | ✅ | [FINAL_REVIEW_TASKS.md:L1010](FINAL_REVIEW_TASKS.md#L1010) |
| C11.6 | ⚠️ ثبت شد، رفع نشد (سه گره واقعی): | ✅ | [FINAL_REVIEW_TASKS.md:L1014](FINAL_REVIEW_TASKS.md#L1014) |
| C13.1 | چرخۀ «رزرو ← پرداخت ← لغو» یک کوپنِ یک‌بارمصرف را بی‌نهایت بار برمی‌گرداند: | ✅ | [FINAL_REVIEW_TASKS.md:L1069](FINAL_REVIEW_TASKS.md#L1069) |
| C13.2 | `PUT /coupons/{id}` نگهبانِ «درصد ≤ ۱۰۰٪» را نمی‌خواند: بررسی فقط در | ✅ | [FINAL_REVIEW_TASKS.md:L1081](FINAL_REVIEW_TASKS.md#L1081) |
| C13.3 | ⚠️ ثبت شد، رفع نشد (دو گره): | ✅ | [FINAL_REVIEW_TASKS.md:L1091](FINAL_REVIEW_TASKS.md#L1091) |
| C14.1 | جدولِ گزارش وجود نداشت ⇒ همۀ «همه‌چیز درست است» کاذب: `app/models/reconciliation_report.py` | ✅ | [FINAL_REVIEW_TASKS.md:L1141](FINAL_REVIEW_TASKS.md#L1141) |
| C14.2 | کلیدِ مقایسه غلط بود: `source_id` با `booking_id`: ردیف درآمدِ دفتر کل با | ✅ | [FINAL_REVIEW_TASKS.md:L1153](FINAL_REVIEW_TASKS.md#L1153) |
| C14.3 | بازه روی `created_at` (زمانِ نوشتنِ ردیف) بود، نه `occurred_at` (مبنای همۀ گزارش‌های | ✅ | [FINAL_REVIEW_TASKS.md:L1165](FINAL_REVIEW_TASKS.md#L1165) |
| C14.4 | ردیفِ بازگشت وجه «درآمد» شمرده می‌شد و نقشه overwrite می‌کرد: فیلتر قبلی فقط | ✅ | [FINAL_REVIEW_TASKS.md:L1171](FINAL_REVIEW_TASKS.md#L1171) |
| C14.5 | دروازۀ خواندن و `total` جعلی: `GET /reports` و `GET /reports/{id}` با | ✅ | [FINAL_REVIEW_TASKS.md:L1178](FINAL_REVIEW_TASKS.md#L1178) |
| C14.6 | ⚠️ ثبت شد، رفع نشد (چهار گره): | ✅ | [FINAL_REVIEW_TASKS.md:L1183](FINAL_REVIEW_TASKS.md#L1183) |
| C15.1 | واحدِ پولِ اشتراک با واحدِ همۀ مصرف‌کننده‌هایش یکی نبود: `MembershipPlan.price` | ✅ | [FINAL_REVIEW_TASKS.md:L1233](FINAL_REVIEW_TASKS.md#L1233) |
| C15.2 | نگهبانِ «نوع، مقدار» فقط در `POST` بود و `pay_purchase` مقدارِ خالی را بی‌صدا | ✅ | [FINAL_REVIEW_TASKS.md:L1246](FINAL_REVIEW_TASKS.md#L1246) |
| C15.3 | کارتِ بی‌اعتبار، فاکتور را لغو و commit می‌کرد: `pay_purchase` قبل از | ✅ | [FINAL_REVIEW_TASKS.md:L1257](FINAL_REVIEW_TASKS.md#L1257) |
| C15.4 | تستِ ناپایدارِ زمان‌محور که گیت را می‌شکست: `tests/test_coach.py:: | ✅ | [FINAL_REVIEW_TASKS.md:L1263](FINAL_REVIEW_TASKS.md#L1263) |
| C15.5 | ⚠️ ثبت شد، رفع نشد (هشت گره؛ همۀ عدد‌ها از کد/اندازۀ همین راند) ⇒ وضعیتِ ۲۰۲۶-۱۰-۱۷ | ✅ | [FINAL_REVIEW_TASKS.md:L1272](FINAL_REVIEW_TASKS.md#L1272) |
| C13.3.2 | ⇒ رفع: `GET /coupons/{coupon_id}/redemptions` (`api/v1/coupons.py:155`) با | ✅ | [FINAL_REVIEW_TASKS.md:L1760](FINAL_REVIEW_TASKS.md#L1760) |
| C21.2 | ⇒ رفع با قراردادِendpoint، نه با تغییرِ عمومی: `null`ِ *صریح* (کلیدی که در | ✅ | [FINAL_REVIEW_TASKS.md:L1773](FINAL_REVIEW_TASKS.md#L1773) |
| C12.1 | تشخیص (شاهد خام، build `a2ddbec6-9eaf-41c9-b33a-13a8d9a8d2ee` روی `08a3833`): | ✅ | [FINAL_REVIEW_TASKS.md:L2918](FINAL_REVIEW_TASKS.md#L2918) |
| C12.2 | پیکربندی trigger (از همان API): `build_command: ""` (خالی)، | ✅ | [FINAL_REVIEW_TASKS.md:L2929](FINAL_REVIEW_TASKS.md#L2929) |
| C12.3 | دامنهٔ خطر (چرا خودسرانه انجام نشد): prodِ `salon-app` روی | ✅ | [FINAL_REVIEW_TASKS.md:L2935](FINAL_REVIEW_TASKS.md#L2935) |
| C12.4 | ثبتِ منشأ: دو APK در `frontend/` commit شده (`git ls-files`): | ✅ | [FINAL_REVIEW_TASKS.md:L2942](FINAL_REVIEW_TASKS.md#L2942) |
| C12.5 | دو گزینهٔ پیشِ روی کاربر (هر دو با شاهد همین راند): | ✅ | [FINAL_REVIEW_TASKS.md:L2946](FINAL_REVIEW_TASKS.md#L2946) |

## Track D — دسترس‌پذیری و UI — 33/34

| شناسه | درخواست | وضعیت | شاهد |
|---|---|---|---|
| D1.1 | `components/booking/TimeSlotPicker.tsx:276` — `<Paper onClick>` بدون `role`/`tabIndex`/`onKeyDown` → `compo… | ✅ | [FINAL_REVIEW_TASKS.md:L2136](FINAL_REVIEW_TASKS.md#L2136) |
| D1.2 | الگو از `components/mobile/TimeSlot.tsx:56-67` برگردانده شد: `<button aria-pressed disabled>` | ✅ | [FINAL_REVIEW_TASKS.md:L2137](FINAL_REVIEW_TASKS.md#L2137) |
| D2.1 | `components/ui/Dialog.tsx:41` — تولید خودکار `aria-labelledby`/`aria-label` | ✅ | [FINAL_REVIEW_TASKS.md:L2142](FINAL_REVIEW_TASKS.md#L2142) |
| D2.2 | همهٔ فراخوانی‌های `<Dialog>` بدون عنوان تکمیل شد (PaymentDialog، MembershipPurchaseDialog، CouponDialog، Ma… | ✅ | [FINAL_REVIEW_TASKS.md:L2143](FINAL_REVIEW_TASKS.md#L2143) |
| D3.1 | `aria-label` (+ `aria-pressed` برای toggle) به crm/CustomersTab، crm/StaffTab، deals/PricingBreakdown، game… | ✅ | [FINAL_REVIEW_TASKS.md:L2148](FINAL_REVIEW_TASKS.md#L2148) |
| D3.2 | `mobile/MobileHeader.tsx:65-82` — `<IconButton>` داخل `<Link>` → `Link component={Button}` | ✅ | [FINAL_REVIEW_TASKS.md:L2149](FINAL_REVIEW_TASKS.md#L2149) |
| D3.3 | `layout/Navbar.tsx` + `NotificationPanel.tsx` — شمار `<Badge>` داخل `aria-label` رفت (قبلاً با `aria-hidden… | ✅ | [FINAL_REVIEW_TASKS.md:L2150](FINAL_REVIEW_TASKS.md#L2150) |
| D4.1 | هر ۱۸ کنترل فهرست‌شده (`SplitPaymentDialog:214,245`, `CustomersTab:116`, `CampaignsTab:129,137`, `StaffTab:… | ✅ | [FINAL_REVIEW_TASKS.md:L2155](FINAL_REVIEW_TASKS.md#L2155) |
| D4.2 | `<Rating>`ها: موارد MUI (`ReviewSection.tsx:139,174,293`, `VenueDetail.tsx:762`) ⇒ `readOnly` (یا editableِ… | ✅ | [FINAL_REVIEW_TASKS.md:L2156](FINAL_REVIEW_TASKS.md#L2156) |
| D5.1 | `role="status"` در `ui/Loading.tsx` + `aria-busy` روی نواحی async (`NotificationPanel`, `SlotWeekGrid`, …) | ✅ | [FINAL_REVIEW_TASKS.md:L2162](FINAL_REVIEW_TASKS.md#L2162) |
| D5.2 | `role="alert"` برای خطاهای دستی (DealPublishDialog، CouponDialog، PricingRuleDialog، TeamDuesPanel ×2) | ✅ | [FINAL_REVIEW_TASKS.md:L2163](FINAL_REVIEW_TASKS.md#L2163) |
| D5.3 | `hooks/useToast.ts` — آیکون‌های ✅/❌/ℹ️ `aria-hidden` + متن معنادار | ✅ | [FINAL_REVIEW_TASKS.md:L2164](FINAL_REVIEW_TASKS.md#L2164) |
| D6.1 | `theme/index.ts:264` — `text.disabled` در هر دو مود override شد: `#64748b` (روشن) / `#94a3b8` (تیره) ⇒ روی … | ✅ | [FINAL_REVIEW_TASKS.md:L2169](FINAL_REVIEW_TASKS.md#L2169) |
| D6.2 | هگزهای دورزدنِ توکن در نقش رنگ متن از داخل `sx={{…}}` پاک شد؛ آنچه مانده یا آیکون است (`style={{…}}` — گراف… | ✅ | [FINAL_REVIEW_TASKS.md:L2170](FINAL_REVIEW_TASKS.md#L2170) |
| D6.3 | وضعیت فقط-رنگی (نقطهٔ خوانده‌نشده، `crm/shared`، `FilterBottomSheet`، `SlotWeekGrid`) → متن/آیکون اضافه شد. | ✅ | [FINAL_REVIEW_TASKS.md:L2171](FINAL_REVIEW_TASKS.md#L2171) |
| D6.4 | `outline:'none'` → ۰ استفاده در کل src. | ✅ | [FINAL_REVIEW_TASKS.md:L2172](FINAL_REVIEW_TASKS.md#L2172) |
| D7.1 | `manager/SlotWeekGrid.tsx:255-274` — سلول سانس به ≥۴۴px + نقش دکمه‌ای رسید | ✅ | [FINAL_REVIEW_TASKS.md:L2177](FINAL_REVIEW_TASKS.md#L2177) |
| D7.2 | `pages/dashboard/ManagerDashboard.tsx:2149,2160` — دکمه‌های `minHeight:32` → ۴۴ | ✅ | [FINAL_REVIEW_TASKS.md:L2178](FINAL_REVIEW_TASKS.md#L2178) |
| D8.1 | کاهش حرکت سراسری است، نه per-file: `<MotionConfig reducedMotion="user">` در `App.tsx:281` (روی کل درخت Fram… | ✅ | [FINAL_REVIEW_TASKS.md:L2183](FINAL_REVIEW_TASKS.md#L2183) |
| D8.2 | `home/FAQSection.tsx` — ارتفاع انیمیت‌شده → `opacity`/`transform`. | ✅ | [FINAL_REVIEW_TASKS.md:L2184](FINAL_REVIEW_TASKS.md#L2184) |
| D9.1 | `ui/PersianDatePicker.tsx` — جهت شیولرون‌های «ماه/سال قبل و بعد» با convention بصریِ `manager/SlotWeekGrid.… | ✅ | [FINAL_REVIEW_TASKS.md:L2189](FINAL_REVIEW_TASKS.md#L2189) |
| D9.2 | طرف‌های فیزیکی `ml/mr/pl/pr/left:/right:` در چیدمان → `ms/me/ps/pe/insetInline*` | ✅ | [FINAL_REVIEW_TASKS.md:L2190](FINAL_REVIEW_TASKS.md#L2190) |
| D9.3 | `styles/globals.css` — الگوی `overflow-x: clip` (به‌جای پوشاندن با `hidden`)؛ نگاه: [[rtl-offcanvas-overflo… | ✅ | [FINAL_REVIEW_TASKS.md:L2191](FINAL_REVIEW_TASKS.md#L2191) |
| D10.1 | `pages/Home.tsx` یک `<h1>` واقعی + ریشهٔ `<main>` دارد (`HeroSection.tsx:28`؛ `main` در `:21`)؛ صفحات ورود/… | ✅ | [FINAL_REVIEW_TASKS.md:L2196](FINAL_REVIEW_TASKS.md#L2196) |
| D10.2 | ادعای «۴۸ Typography به `<div>` رندر می‌شود» غلط است: `node_modules/@mui/material/Typography/Typography.js:… | ✅ | [FINAL_REVIEW_TASKS.md:L2197](FINAL_REVIEW_TASKS.md#L2197) |
| D10.3 | جداول: `scope="col"` در ۱۸ فایل / ۹۶ استفاده؛ هر ۲۰ `<Table>` در src یا `<caption>` یا `aria-label` دارند (… | ✅ | [FINAL_REVIEW_TASKS.md:L2198](FINAL_REVIEW_TASKS.md#L2198) |
| D11.1 | هدف‌های کلیکی `Box/Paper/Typography` → `component="button"`/`component={Link}` (نمونه: `pages/Home.tsx:770`… | ✅ | [FINAL_REVIEW_TASKS.md:L2202](FINAL_REVIEW_TASKS.md#L2202) |
| D11.2 | disclosureها (`PricingBreakdown`, `TeamBalancePanel`, `ContractAuditTimeline`, `FAQSection`) → `aria-expand… | ✅ | [FINAL_REVIEW_TASKS.md:L2203](FINAL_REVIEW_TASKS.md#L2203) |
| D11.3 | `pages/games/GamesExplore.tsx` — `aria-pressed` روی خود Chip | ✅ | [FINAL_REVIEW_TASKS.md:L2204](FINAL_REVIEW_TASKS.md#L2204) |
| D12.1 | اجرای axe-core ۴.10.3 (تزریق در صفحهٔ زنده) روی ۶ مسیر عمومی: `/` (home)، `/venues`، `/venues/1`، `/login`،… | ✅ | [FINAL_REVIEW_TASKS.md:L2209](FINAL_REVIEW_TASKS.md#L2209) |
| D12.2 | گیت CI در `.github/workflows/web-tests.yml` (step «Accessibility guardrails») — شمارش‌های D5/D6/D10/D11 + م… | ✅ | [FINAL_REVIEW_TASKS.md:L2210](FINAL_REVIEW_TASKS.md#L2210) |
| D14.1 | شمارش بازدید اخبار (`views: Math.floor(Math.random()*20000)+5000`) از `services/sportsApi.ts` و نمایشش از `… | ✅ | [FINAL_REVIEW_TASKS.md:L2231](FINAL_REVIEW_TASKS.md#L2231) |
| D14.2 | «لایک» تصادفی گالری اینستاگرام (`Math.floor(Math.random()*500+100)`) و شمارندهٔ فالوور `followers`/`ink` از… | ✅ | [FINAL_REVIEW_TASKS.md:L2232](FINAL_REVIEW_TASKS.md#L2232) |
| D14.3 | تصمیم کاربر (X8): آمار بازاریابی `components/home/HeroSection.tsx:15-20` (`+۱۲٬۰۰۰ بازیکن فعال`, `+۵۰ زمین`… | ⛔ باز | [FINAL_REVIEW_TASKS.md:L2233](FINAL_REVIEW_TASKS.md#L2233) |

## یافته‌های ممیزی موبایل (F-xx)

| شناسه | موضوع | وضعیت | شاهد |
|---|---|---|---|
| F-01..F-15 | ماتریس دسترسی نقش↔مسیر (۴۰۳های UI) | CLOSED | `BUG-TRACKER.md` §P1 |
| F-16..F-19 | overflow، alt، landmark، loading | VERIFIED | §P3 + sweep ۱۴۱ ردیف |
| F-20 | — | استفاده نشده | شمارهٔ خالی (شکاف شماره‌گذاری) |
| F-21..F-26 | ۴۰ نقض axe → صفر | VERIFIED | §P2 axe-core |
| F-27 | تصاویر unsplash در شبکهٔ ایران | VERIFIED (محیطی) | fallback گرادیان |
| F-28 | حلقهٔ فوکوس MUI Button-as-link | CLOSED | §P2 |
| F-29 | هدف لمسی تقویم < ۴۴px | VERIFIED | §P2 |
| F-30..F-35 | تاریخ بریده، گرید تقویم، Chip در p، لینک ۲۵px، جستجوی ادمین، Switch ۲۴px | FIXED | §P2 |
| F-36..F-39 | خطاهای اندازه‌گیری هارنس (accname، حساب کهنه، نام شات، هنگ) | FIXED | §P2 |

## درخواست‌های تاریخی بیرون از فایل تسک

| درخواست | وضعیت | شاهد |
|---|---|---|
| Phase 27 — ۲۸ فیچر (مالی، مسابقات، مربی، شیفت، آشتی، ML و…) | انجام‌شده؛ بک‌اند روی prod | مسیرهای `shifts`، `coach/sessions`، `tournaments/2`، `reconciliation/reports` روی prod → ۴۰۱ (وجود دارند)، ۲۰۲۶-۱۰-۲۰ |
| فیچرهای تعاملی (کوییز، جدول امتیاز، بنر، سانس محبوب) | روی prod | مستند `engagement-features` + API |
| ورود سریع ۹ حساب دمو | انجام‌شده | `Login` quick access + seed سندباکس (۹ حساب) |
| انتشار آپدیت داخل‌برنامه‌ای (Tauri) | v1.2.0 منتشر شد | `scripts/publish-update.sh` + `/updates/latest.json` → ۲۰۰ |
| امضای APK اندروید در CI | کد آماده؛ تأیید Secrets = X3 | `.github/workflows` + keystore docs |
| seed کاتالوگ شهرها (تهران/قم) | انجام‌شده | ۱۰ سالن/۱۳۲۰۰ سانس در سندباکس؛ prod ۵۰ سالن |
| ماتریس نقش/دسترسی | تأیید شد | `docs/mobile-audit/FINAL-REVIEW.md` |
| اعلان WebSocket | کد کامل؛ Redis محلی نیست (fail-open) | `websocket.py` + لاگ بوت |
| WCAG 2.1 AA / axe | ۰ نقض | `ACCESSIBILITY-REPORT.md` |
| اهداف لمسی ≥۴۴px، RTL فارسی | انجام‌شده | `BUG-TRACKER.md` F-29/F-33..F-35 |
| بدون mock data | تأیید شد | همهٔ صفحه‌ها به API واقعی وصل‌اند |
| CI/CD (وب، بیلد، اندروید) | سبز | آخرین کامیت `dc4ae7e` |

## ناشناخته‌ها (قابل بازسازی نبود)

- درخواست‌های شفاهی/چت که در مخزن یا مستندات ثبت نشده‌اند.
- تیکت‌های سیستم‌های بیرونی (در این مخزن ردی از آن‌ها نیست).
- وضعیت واقعی Secrets گیت‌هاب و کنسول Firebase (X2/X3) بدون اجرای tag-release.

## اقدامات همین دور

- بازسازی سندباکس (PostgreSQL 18 + alembic تا `m0s030` + seed) و رفع بوت‌نشدن بک‌اند بدون Redis (fail-open).
- محدودکردن گام‌های هارنس (`setViewportSize`/`evaluate`/`screenshot`) و اجرای sweep کامل نقش‌به‌نقش.
- اجرای گیت‌ها و به‌روزرسانی `current-state`/`test-report`/`build-report`/`remaining-tasks`/`known-limitations`.
