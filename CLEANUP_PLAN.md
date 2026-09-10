# CLEANUP_PLAN.md — فاز ۲۲

> اصل: کد کمتر + اتصال بهتر + معماری شفاف. هیچ حذفی بدون اثبات import=0 انجام نمی‌شود.

## 🔴 CRITICAL (اصلاح فوری — فاز ۲۳)

| # | مورد | فایل | اصلاح | ریسک |
|---|---|---|---|---|
| C1 | بازنویسی beat_schedule → تسک آزادسازی pending منقضی هرگز اجرا نمی‌شود؛ سانس‌ها روی BOOKED قفل می‌مانند | `backend/app/tasks/competition_tasks.py` | `beat_schedule = {...}` ← `.update({...})` | ناچیز |
| C2 | JWT_SECRET پیش‌فرض در کانتینر داکر (نه env در compose، نه COPY .env) | `docker-compose.yml` + `Dockerfile` | افزودن `JWT_SECRET: ${JWT_SECRET}` به env سرویس backend/celery (مقدار از فایل env میزبان — بدون commit) | ناچیز (نیازمند restart توسط کاربر) |

## 🟠 HIGH

| # | مورد | فایل | اقدام |
|---|---|---|---|
| H1 | WS `/ws/user/{id}` بدون احراز هویت | `main.py` | گزارش + توصیه (تغییر protocol نیازمند هماهنگی FE — خارج از دامنه refactor امن؛ در گزارش نهایی) |
| H2 | dev_code در پاسخ API | `verification_service.py` | رفتار عمدی dev؛ مستند+هشدار در README/grep — تغییر نده (شکستن flow) |
| H3 | صفر تست برای auth/booking/payment | — | در گزارش نهایی به‌عنوان بدهی اصلی؛ افزودن pytest خارج از فاز ۲۳ (بدون فیچر جدید) است |
| H4 | `PUT /venues/{id}` پاسخ stale | `venues.py` | بازگرداندن آبجکت به‌روز پس از update — اصلاح امن و محلی |

## 🟡 MEDIUM

| # | مورد | فایل | اقدام |
|---|---|---|---|
| M1 | `print("Slots", slots)` دیباگ | `slots.py:52` | حذف خط |
| M2 | `get_venue_min_price` فقط امروز → 0 گمراه‌کننده | `venues.py` | اصلاح به «نزدیک‌ترین سانس آینده» (کوئری ساده، بدون تغییر قرارداد) |
| M3 | `except:` برهنه | `schemas/venue.py` | `except (json.JSONDecodeError, TypeError):` |
| M4 | echo=True لاگ کامل SQL | `database.py` | گزارش (تغییر بدهی عملکردی نیست — فعلاً مستند) |
| M5 | password min_length=4 | `schemas/user.py` | گزارش امنیتی — تغییر policy نیازمند تأیید کاربر |
| M6 | بدون rate-limit روی login/OTP | — | گزارش (نیازمند middleware جدید = فیچر؛ خارج از دامنه) |
| M7 | `--reload` در Dockerfile prod | `Dockerfile` | گزارش |
| M8 | detail انگلیسی/فارسی مخلوط API | چند router | گزارش (تغییر یکدست ممکن است UIهای لاگین‌نشده را بشکند) |

## 🟢 LOW — حذف کد مرده اثبات‌شده (فاز ۲۴)

**Frontend (صفر importer — اثبات با grep کامل src/):**
- hooks: `useAuth.ts` `useBooking.ts` `useVenue.ts` `useCompetition.ts` `useContract.ts` `useMediaQuery.ts`
- store: `bookingStore.ts` `venueStore.ts` `uiStore.ts`
- components: `layout/Sidebar.tsx`، `booking/*`، `competition/*`، `dashboard/Chart|RecentBookings|StatCard`، `forms/*`، `modals/BookingModal|CompetitionModal|ContractModal|EditProfileModal` (⚠️ ConfirmModal زنده است — بررسی مسیر قبل از حذف)، `venue/VenueFilter.tsx`، `ui/Toast|Alert|Empty|Progress|Select|Table|Tabs|Badge`
- css: `src/index.css` `src/App.css`
- تأیید: `npx tsc --noEmit` + `npm run build` قبل و بعد

**Dependencies (پس از حذف فایل‌ها، import=0):**
@radix-ui/* (۱۴)، @mui/x-data-grid، @mui/x-date-pickers، react-day-picker، react-loader-spinner، recharts، notistack — **uninstall در package.json فقط با تأیید کاربر** (lockfile churn)؛ فعلاً گزارش.

**Backend (فقط گزارش — حذف نکن):**
- `POST /venues/{id}/verify` موازی admin (API عمومی‌تر — حذف ممکن است client قدیمی را بشکند)
- متدهای بی‌مصرف repo (get_nearby_venues، check_slot_conflict، …) — ابزار محتمل آینده
- `Club` model — entity یتیم؛ حذف = مهاجرت DB (ممنوع طبق قوانین)
- `backend/app.zip` artifact — حذف امن

**ممنوع (طبق قوانین spec):** حذف migration، ریست DB، تغییر معماری، بازنویری auth/payment/booking.
