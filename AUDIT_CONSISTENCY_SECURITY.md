# AUDIT — فازهای ۷ تا ۱۹ (ثبات DB/API/Contract/Auth/Booking + State/Error/UI/Responsive/Security/Deps/Quality/Tests)

---

## فاز ۷ — ثبات دیتابیس

| بررسی | نتیجه |
|---|---|
| Entity↔Table | ✅ هر ۱۰ مدل SQLModel با `__tablename__` مشخص (users, venues, clubs, slots, bookings, booking_payments, price_competitions, contracts, contract_slots, contract_payments, reviews, notifications) |
| FK | ✅ در مدل‌ها `foreign_key=` اعلام شده (slot→venue, booking→slot/user, payment→booking, review→venue/user, contract→venue/user) |
| Schema management | ❌ **دوگانه**: `create_all` در lifespan + Alembic نصب — ولی `migrations/versions/` **خالی** و حتی `migrations/env.py` هم نیست → عملاً create_all تنها منبع اسکیما. مهاجرت = حذف+ساخت یا دستی. |
| JSON-as-string | ⚠️ `Venue.amenities` و `Venue.images` رشته JSON در ستون TEXT؛ parse با `from_orm_with_json` و `except:` برهنه → داده خراب بی‌صدا [] می‌شود |
| DTO↔API | ✅ هر جدول schema Response متناظر دارد؛ `club_id` در VenueResponse ولی Club بدون API |
| Enum‌ها | ⚠️ `Booking.status` در مدل enum ولی در `slot_repository.get_upcoming_slots` مقایسه رشته‌ای `"confirmed"`؛ `contract_tasks` هم رشته `"expired"` — کار می‌کند (str enum) ولی شکننده |
| محدودیت BaseRepository | ⚠️ فیلترها `value is not None` → نمی‌توان `is_verified=False` فیلتر کرد (admin/pending-venues دور می‌زند با select دستی) |
| ریسک | ❌ بدون FK index مطمئن، بدون unique روی (venue_id, slot_date, start_time) برای slots — تداخل سانس فقط در `check_slot_conflict` (که جایی صدا زده نمی‌شود!) و `/slots/generate` |

## فاز ۸ — ثبات API

| موضوع | یافته |
|---|---|
| متد/مسیر | عمدتاً RESTful؛ استثنا: `POST /venues/{id}/verify` + `POST /admin/verify-venue/{id}` (تکراری)؛ `PUT /notifications/read-all` (action با PUT ok) |
| Auth | یکنواخت: get_current_user/admin/manager؛ GET /venues و /slots عمومی (عمدی)؛ WS ❌ بدون auth |
| Validation | pydantic در body (phone pattern، rating 1-5، password 4-70)؛ Query params با `Query(ge/le)` در payments/notifications ✅ ولی venues limit/offset بدون bound |
| Pagination | ❌ هیچ envelope استاندارد نیست: آرایه خام + limit/offset؛ `total` برمی‌گردد هیچ‌جا (علت شکست bookingStore/venueStore) |
| Errors | `HTTPException` با detail فارسی در payments/bookings، انگلیسی در venues/contracts/reviews — **ناهمگون** |
| Status codes | 201 در payments/reviews ✅؛ venues POST بدون status_code (200)؛ لغو pending 200 |
| پاسخ به‌روز | ❗ `PUT /venues/{id}` آبجکت **قدیمی** (قبل از update) برمی‌گرداند |

## فاز ۹ — قرارداد FE↔BE

- **سراسر snake_case** در بک‌اند (بدون alias)؛ فرانت در مرزها normalize می‌کند (`normalizeUser` + mapping دستی در payloadها مثل `{slot_id: data.slotId}`, `{old_password}`). ✅ الگوی آگاهانه و سازگار — باگ نیست.
- تاریخ: `YYYY-MM-DD` (ISO date)، زمان `HH:MM`؛ قیمت: int تومان؛ enum‌ها: lowercase string. ✅ متناظر با تایپ‌های `services/*.ts`.
- تنها ناهمخوانی واقعی: `bookingStore/venueStore` انتظار `items/total` (مرده — در فاز ۲۴ حذف).
- `Token.user` در پاسخ login ولی register فقط User برمی‌گرداند → FE register لاگین نمی‌کند (سازگار).

## فاز ۱۰ — Auth/AuthZ عمیق

| بررسی | نتیجه |
|---|---|
| JWT | HS256، sub=phone، exp 24h، بدون refresh/blacklist — logout فقط کلاینتی |
| Secret | ⚠️ پیش‌فرض placeholder در config؛ `backend/.env` وجود دارد (override در اجرای لوکال) ولی **docker-compose env ندارد و Dockerfile هم .env را COPY نمی‌کند** → کانتینر داکر با secret پیش‌فرض! |
| Roles | user/venue_manager/club_admin/super_admin؛ `get_current_admin` فقط super_admin؛ `get_current_manager` فقط venue_manager (club_admin ❌ نمی‌تواند از /venues/my-venues استفاده کند؟ — router خودش role check می‌کند: manager یا super_admin) |
| IDOR — bookings/{id} | ✅ مالک یا مدیر سالن یا super_admin |
| IDOR — payments | ✅ مالک بررسی می‌شود (create: booking.user_id؛ pay: payment.user_id) |
| IDOR — contracts/{id} | ✅ 404 اگر مالک نباشد |
| IDOR — reviews PUT/DELETE | ✅ مالک |
| IDOR — venues PUT | ✅ `venue.manager_id != current_user.id` → 403 |
| pending confirm/reject | ✅ `_check_venue_manager` |
| OTP | sha256 در Redis، TTL 600 — ولی ❗ **بدون محدودیت تعداد درخواست** (brute-force 4 رقمی با ۶۰۰s پنجره شدنی) |
| dev_code | ❗ وقتی SMTP تنظیم نیست، کد OTP **در پاسخ API** برمی‌گردد — در production لو رفتن کد |
| ADMIN | admin123 پیش‌فرض + seed ادمین با ADMIN_PHONE |

## فاز ۱۱ — ممیزی رزرو

- **قیمت از سرور**: `payment_amount = slot.current_price` در `create_booking` ✅ (فرانت قیمت نمی‌فرستد)
- **Double-booking**: `get_by_id_with_lock` (SELECT FOR UPDATE) + `has_pending_for_slot` (Redis) + slot→BOOKED فوری ✅
- **تأیید**: confirm → Booking(CONFIRMED) در DB + slot همان BOOKED می‌ماند ✅
- **رد/انقضا**: reject → `remove` Redis + slot→AVAILABLE ✅
- ❗ **انقضا بدون پاسخ مدیر**: Redis TTL می‌سوزد، slot روی BOOKED می‌ماند چون `cleanup_expired_pending_bookings` به‌دلیل **بازنویسی beat_schedule در competition_tasks.py** هرگز schedule نمی‌شود → **سرنوشت سانس معلق نامعلوم = باگ داده‌ای بحرانی**
- **لغو رزرو confirmed**: `cancel_booking` (مالک+CONFIRMED) → slot آزاد + status CANCELLED + refund فاکتور paid → refunded ✅ (sync payment↔booking سالم)
- **CANCELLED slot**: آزاد می‌شود ✅؛ ولی `get_by_slot` چند رزرو cancelled برای یک slot مجاز است (تاریخچه) — ok.

## فاز ۱۲ — State Management

- زنده‌ها: authStore(persist)، notificationStore(optimistic markAsRead + rollback ندارد ⚠️)، favoritesStore(persist)، recentlyViewed/searchHistory(persist)
- stale: `auth-storage` و `auth-token` دو جا توکن (api.ts همگام‌سازی می‌کند ⚠️ دوباره‌نویسی منبع)
- race: fetchMyVenues/fetchSlots در Competitions با useCallback — بدون abort؛ به‌خاطر حجم کم مشکلی گزارش نشده
- react-query: Provider بدون مصرف → یا حذف یا مهاجرت (تصمیم فاز ۲۲: فعلاً Provider حذف نشود؟ —低风险: حذف Provider هم با tsc قابل اثبات است)

## فاز ۱۳ — Error Handling سرتاسری

- FE: try/catch در صفحات + `toast.error(err.response?.data?.detail || پیام فارسی)` — الگوی غالب ✅؛ 401 interceptor → redirect /login
- BE: HTTPException detail مخلوط fa/en؛ خطای unhandled → 500 بدون لاگ ساختارمند (logging config ندارد)
- Gap: `StorageError` در upload → 400 با پیام فارسی ✅

## فاز ۱۴ — Loading/Empty/Error

- Skeleton: Dashboard، Venues، Competitions، Home ✅
- Empty: EmptyState (mobile) در Home/Competitions ✅
- Error: Alert خطا در Dashboard/Venues ✅
- نتیجه: متصل و واقعی (داده از API، نه mock)

## فاز ۱۵ — Responsive (گزارش)

- الگوی غالب MUI `Grid size={{xs,sm,md}}` + sx breakpoints ✅
- ⚠️ ناهمخوانی شناخته‌شده: breakpoints Tailwind (md=768) vs MUI (md=900) در صفحاتی که هر دو استفاده می‌شوند (Venues/Home) — عملی قابل تحمل ولی مستند شود
- safe-area-inset برای موبایل در FilterBottomSheet ✅

## فاز ۱۶ — Security

| # | مورد | شدت |
|---|---|---|
| S1 | JWT placeholder در کانتینر داکر (بدون env/.env) | CRITICAL |
| S2 | WS `/ws/user/{id}` بدون احراز هویت — هر کسی اعلان‌های هر کاربری را دریافت می‌کند | HIGH |
| S3 | dev_code در پاسخ API (OTP) | HIGH (اگر SMTP در prod تنظیم نباشد) |
| S4 | بدون rate limiting (login/OTP/register) | HIGH |
| S5 | ADMIN_PASSWORD=admin123 پیش‌فرض | MEDIUM (env override دارد) |
| S6 | password min_length=4 | MEDIUM |
| S7 | echo=True (لاگ SQL کامل شامل داده حساس) | MEDIUM |
| S8 | MinIO bucket read-public (عمدی برای تصاویر) | LOW |
| S9 | upload: type+size+count چک ✅؛ filename uuid ✅ | OK |
| S10 | payment mock — بدون PCI؛ فقط ۴ رقم آخر ذخیره ✅ | OK |
| S11 | CORS از env ✅ | OK |
| S12 | `--reload` در Dockerfile production | LOW |

## فاز ۱۷ — Dependencies (بدون حذف تا اثبات مصرف)

**حذف‌شدنی (import=0 در src/):** ۱۴×@radix-ui/*، @mui/x-data-grid، @mui/x-date-pickers، react-day-picker، react-loader-spinner
**مشروط:** recharts و notistack (فقط در کامپوننت‌های مرده — با حذف آن‌ها آزاد می‌شوند)، @tanstack/react-query (Provider — با حذف Provider آزاد می‌شود)، zod+react-hook-form (در صفحات auth زنده ✅ **نگه‌دار**)
**backend:** همه مصرف دارند (alembic عملاً غیرفعال — نگه‌دار برای آینده)

## فاز ۱۸ — Code Quality

- `print("Slots", slots)` در slots.py:52 (debug در production path)
- `except:` برهنه در schemas/venue.py و venue_repository.get_amenities_stats
- مخلوط get_session/get_unit_of_work در یک router (venues.py)
- `PUT /venues/{id}` پاسخ stale
- `get_venue_min_price` فقط امروز → price=0 برای سالن‌های بدون سانس امروز (نمایش گمراه‌کننده)
- تکرار منطق enrich در bookings.py (قابل تحمل)
- seed scriptها داخل `app/` (seed_qom/seed_reviews/…) — جای درست `scripts/` یا `app/seeds/` (低风险: جابه‌جایی نکنیم، فقط علامت)

## فاز ۱۹ — Tests

- ❌ **صفر تست خودکار** (grep `def test_|pytest` = 0؛ pytest در requirements نیست)
- موجود: اسکریپت‌های shell در `scripts/` (admin-smoke.sh، pending-flow-test.sh، verify-flow-test.sh، verify-stack.sh) — دودتست دستی با curl
- الزام spec: auth/booking/payment باید تست داشته باشند → در CLEANUP_PLAN به‌عنوان HIGH ثبت می‌شود (نوشتن تست خارج از دامنه «بدون فیچر جدید» است؟ — تست فیچر نیست؛ حداقل یک pytest smoke اضافه می‌تواند در فاز ۲۳ انجام شود اگر زمان بخواهد؛ فعلاً گزارش)
