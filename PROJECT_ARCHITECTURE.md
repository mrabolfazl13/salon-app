# PROJECT_ARCHITECTURE.md

> فاز ۱ ممیزی پروژه — فقط بر اساس کدهای **واقعی** مخزن (بدون حدس). تاریخ: ۲۰۲۶-09-04
> مسیرها نسبی به `futsal-booking-system/`.

---

## ۱. پشته فناوری (Stack)

| لایه | فناوری | شواهد |
|---|---|---|
| Frontend | React 18 + Vite 5.4.21 + TypeScript | `frontend/package.json` |
| UI | MUI v9 (`Grid size={{}}`) + Tailwind v3.4 + framer-motion + react-hot-toast | `App.tsx`, `styles/globals.css` |
| State | zustand + persist (بدون استفاده واقعی از @tanstack/react-query — فقط Provider) | `store/*.ts`, `App.tsx` |
| Routing | react-router-dom **^7.18.1** | `package.json` |
| HTTP | axios با interceptor | `services/api.ts` |
| Backend | FastAPI 0.141.1 + SQLModel + PostgreSQL | `backend/requirements.txt`, `main.py` |
| ORM/Schema | SQLModel + `create_all` (Alembic نصب ولی **versions/ خالی**) | `database.py`, `migrations/` |
| Cache/Queue | Redis + Celery(--beat) | `worker.py`, `docker-compose.yml` |
| Auth | python-jose JWT HS256 (sub=phone, 24h) + argon2-cffi | `utils/auth.py` |
| Storage | MinIO (S3-compatible) | `services/storage_service.py` |
| Realtime | websockets (FastAPI native) | `main.py`, `utils/websocket.py` |
| External | Varzesh3 API (اخبار/مسابقات ورزشی) از طریق Vite proxy | `vite.config.ts`, `services/sportsApi.ts` |

---

## ۲. معماری بک‌اند

### ۲.1 لایه‌ها (جریان واقعی)

```
HTTP → main.py (CORS, lifespan=create_all, 11 router زیر /api/v1)
     → api/v1/<domain>.py        (controller: اعتبارسنجی + احراز هویت + HTTPException)
     → services/<domain>_service.py  (منطق کسب‌وکار، استاتیک یا نیمه‌استاتیک)
     → unit_of_work.py           (UnitOfWork: commit/rollback خودکار در __exit__)
     → repositories/*.py         (BaseRepository + ۹ ریپو تخصصی، SQLModel select)
     → models/*.py               (SQLModel table)
     → PostgreSQL
```

- **دو الگوی دسترسی به DB به‌صورت مخلوط وجود دارد**:
  - `get_unit_of_work()` — auth, bookings, payments, competitions, contracts, admin, upload, slots(generate)
  - `get_session()` مستقیم — venues (list/detail/prices)، reviews (GET)، notifications، slots (read)
- `BaseRepository` (`repositories/base.py`): create/bulk_create/get_by_id/**get_by_id_with_lock (SELECT FOR UPDATE)**/get_one/get_all/update/delete(soft)/count/exists. فیلترها فقط `==` و `value is not None` (امکان فیلتر `False` وجود ندارد — محدودیت شناخته‌شده).

### ۲.2 مدل‌های داده و جدول‌ها

| Model | جدول | کلیدهای مهم / نکات |
|---|---|---|
| User | users | phone (unique, login)، role: user/venue_manager/club_admin/super_admin، is_verified، is_active |
| Venue | venues | manager_id FK، amenities/images **JSON-as-string**، is_verified، club_id |
| Club | clubs | owner_id — عملاً فقط مدل، بدون router |
| Slot | slots | venue_id، slot_date+start_time، duration=90، base_price/current_price، status: available/booked/blocked/in_competition، contract_id، is_contract_slot، competition_winner_id |
| Booking | bookings | slot_id، user_id، status: pending/confirmed/cancelled/completed، payment_amount |
| BookingPayment | booking_payments | booking_id، status: pending/paid/refunded/failed، gateway mock، card_pan |
| PriceCompetition | price_competitions | slot_id، manager_id، offered_price، status، expires_at |
| Contract + ContractSlot + ContractPayment | contracts/contract_slots/contract_payments | روز هفته + تکرار weekly/biweekly/monthly؛ قرارداد اسلات واقعی می‌سازد |
| Review | reviews | venue_id+user_id (یک نظر به ازای کاربر+سالن) |
| Notification | notifications | user_id، title/message/type/is_read |

### ۲.3 روترها (همه زیر `/api/v1`)

| Router | Prefix | Endpoint‌ها | Auth |
|---|---|---|---|
| auth | /auth | register, login, me(PUT profile), change-password, forgot/reset-password, verify/email/request+confirm | login/register عمومی، بقیه get_current_user |
| venues | /venues | GET /، GET /my-venues، GET/{id}، POST / (یک سالن به ازای مدیر!)، PUT/{id}، POST/{id}/verify، POST+GET /{id}/prices | GET عمومی؛ PUT مالک؛ verify ادمین |
| slots | /slots | GET /venue/{id}، /available، /range، POST /venue/{id}/generate | generate: manager/super_admin |
| bookings | /bookings | POST / (ساخت pending)، GET /، /upcoming، /past، /venue/{id}، /{id}، DELETE /{id} (لغو+refund) + ۵ pending (my/venue/confirm/reject/cancel) | کاربر؛ pendingها مالک/مدیر |
| payments | /payments | POST / (ساخت فاکتور)، POST /{id}/pay (mock با نرمال‌سازی ارقام فارسی)، GET /my | کاربر |
| competitions | /competitions | POST /start، POST /{slot_id}/bid، GET /slot/{id}/best | manager برای start |
| contracts | /contracts | POST /، GET /، GET /{id} (مالک) | کاربر |
| reviews | /reviews | GET /venue/{id}، /summary، /my، POST /، PUT/{id}، DELETE/{id} | POST: هر کاربر لاگین‌شده (**بدون بررسی رزرو**) |
| notifications | /notifications | GET /، /unread-count، PUT /read-all، PUT /{id}/read | کاربر |
| admin | /admin | users، stats/users، stats/venues، pending-venues، verify-venue/{id}، pending-managers، users/{id}/approve، /reject | get_current_admin |
| upload | /upload | POST /images (≤۱۰ فایل، jpg/png/webp/gif، ≤۵MB → MinIO) | manager/super_admin |
| WS | /ws/{role}، /ws/user/{user_id} | اتصال بدون هیچ احراز هویتی | ❗ |

### ۲.4 سرویس‌ها

| Service | نقش | نکته کلیدی |
|---|---|---|
| AuthService | authenticate/create_user/change_password | argon2 |
| BookingService | create_booking (Redis pending + slot→BOOKED)، confirm_pending (DB Booking)، cancel_booking (refund) | قیمت از `slot.current_price` سمت سرور ✅ |
| PendingBookingService | Redis: `pending:booking:{pid}` + ایندکس‌های slot/venue/user با TTL=4h؛ `has_pending_for_slot` | قفل نرم Redis + قفل سخت `SELECT FOR UPDATE` روی slot |
| CompetitionService | start (مالک+AVAILABLE→IN_COMPETITION)، bid (کمتر از قیمت فعلی، نه مالک)، resolve_expired | تسک celery هر ۳۰ دقیقه |
| ContractService | create_contract: محاسبه تعداد جلسات، ساخت Slotهای واقعی + ContractSlot، بررسی تداخل | `duration=90` هاردکد؛ `original_price` از **نمونه اولین اسلات سالن** (fallback 300000) |
| NotificationService | `_persist` با **Session مستقل (خارج از UoW)** + ارسال WS | اگر WS قطع باشد اعلان در DB می‌ماند |
| VerificationService | OTP sha256 در Redis (TTL 600)؛ اگر SMTP_HOST خالی → **dev_code در پاسخ API** | |
| StorageService | MinIO، bucket policy read-public | |

### ۲.5 Celery Beat — ⚠️ باگ بحرانی کشف‌شده

- `tasks/worker.py`: `beat_schedule = {"cleanup-expired-pending-bookings": ...}` (هر ۱۰ دقیقه آزادسازی pending منقضی)
- `tasks/competition_tasks.py`: `celery_app.conf.beat_schedule = {...}` ← **بازنویسی کامل dict** → تسک cleanup **هرگز زمان‌بندی نمی‌شود**
- `tasks/contract_tasks.py`: درست با `.update()` — ساعت ۲ بامداد قرارداد منقضی → expired
- **پیامد**: اگر مدیر پاسخ ندهد، سانس روی BOOKED قفل می‌ماند (فقط Redis TTL می‌سوزد).

### ۲.6 پیکربندی و محیط

- `config.py` مقادیر پیش‌فرض placeholder: `JWT_SECRET="your-super-secret..."`, `ADMIN_PASSWORD="admin123"`, MinIO `minioadmin/futsal-minio-secret`.
- `backend/.env` **وجود دارد** و JWT_SECRET/ADMIN_PASSWORD/MinIO را override می‌کند (کلیدها دیده شدند، مقادیر بررسی نشد).
- `docker-compose.yml` برای backend **هیچ JWT_SECRET/ADMIN_PASSWORD ست نمی‌کند** و `.env` هم به image کپی نمی‌شود (Dockerfile فقط app/، alembic.ini، migrations/) → **کانتینر داکر با placeholder JWT کار می‌کند** مگر bind-mount شدن فایل.
- `database.py`: `echo=True` (لاگ کامل SQL) + `create_all` در lifespan.
- `Dockerfile`: `uvicorn --reload` در production.

---

## ۳. معماری فرانت‌اند

### ۳.1 جریان واقعی (لایه زنده)

```
Page (src/pages/**.tsx)
  → service (src/services/*.ts — axios apiClient، snake_case در payload)
  → api.ts (interceptor: token از 'auth-token' یا 'auth-storage'؛ 401 → logout+redirect)
  → Backend /api/v1
```

- **هیچ hook میانی‌ای در مسیر زنده نیست**؛ صفحات مستقیم از service استفاده می‌کنند.
- `@tanstack/react-query` فقط Provider در `App.tsx` — صفر `useQuery/useMutation`.
- State زنده: `authStore` (normalizeUser snake→camel)، `notificationStore` (optimistic)، `favoritesStore` (**فقط localStorage — بک‌اند ندارد**)، `recentlyViewedStore`، `searchHistoryStore`.
- `useWebSocket` (زنده، در `AuthInitializer`): اتصال `/ws/user/{userId}` بدون احراز هویت، backoff تا ۶۰s، فیلتر `type==='user_notification'`.
- `ProtectedRoute`: نقش‌محور (super_admin همه‌چیز؛ club_admin مثل venue_manager). `PublicRoute` redirect به `/venues`.

### ۳.2 نقشه صفحات → endpointها (لایه زنده)

| صفحه | Endpointهای مصرفی |
|---|---|
| Home | venues GET (nearby/search)، sportsApi (varzesh3 proxy) |
| Venues | venues GET با فیلتر/جستجو |
| VenueDetail | venues/{id}، slots available، bookings POST، reviews، upload |
| Bookings / BookingDetail | bookings (upcoming/past/{id})، payments |
| Dashboard | bookings، payments |
| ManagerDashboard | my-venues، slots، bookings pending confirm/reject، competitions start |
| Competitions | slots، competitions start/bid/best |
| Contracts / ContractDetail | contracts |
| Profile | auth me/profile/change-password، reviews/my، favorites |
| admin/* | admin endpoints |
| auth/* (Login/Register/Forgot/Verify) | auth endpoints (dev_code نمایش داده می‌شود) |
| Search / Favorites | venues + storeهای کلاینت |

### ۳.3 لایه مرده (اثبات با grep — صفر import)

- **Hooks mock**: `useAuth`, `useBooking`, `useVenue`, `useCompetition`, `useContract`, `useMediaQuery` (setTimeout + داده ساختگی)
- **Storeها**: `bookingStore` و `venueStore` (قرارداد **شکسته**: `response.items/total` در حالی که بک‌اند آرایه ساده برمی‌گرداند)، `uiStore`
- **Components**: `Sidebar`, `booking/BookingForm|BookingList`, `competition/*`, `dashboard/Chart|RecentBookings|StatCard`, `forms/*`, `modals/BookingModal|CompetitionModal|ContractModal|EditProfileModal`, `venue/VenueFilter`, `ui/Toast|Alert|Empty|Progress|Select|Table|Tabs|Badge`
- **CSS**: `src/index.css`, `src/App.css` (main.tsx فقط globals.css + leaflet.css)
- **Dependencies بدون import**: ۱۴×@radix-ui/*, @mui/x-data-grid, @mui/x-date-pickers, react-day-picker, react-loader-spinner؛ recharts و notistack فقط در کامپوننت‌های مرده

---

## ۴. زیرساخت

```
docker-compose: postgres | redis | minio | backend(uvicorn:8000) | celery(worker+beat) | nginx(:80)
frontend: vite dev :3000، proxy /api/varzesh3* → varzesh3.com
nginx/nginx.conf: reverse proxy /api → backend
```

- Volume mount: `./backend/app:/app/app` (کد در دسترس کانتینر) — ولی `.env` بک‌اند داخل کانتینر **نیست**.
- CORS: `ALLOWED_ORIGINS` پیش‌فرض localhost:3000/3001/5173 + tauri.

---

## ۵. خلاصه وضعیت اتصال‌ها (پیش‌نمایش فازهای بعد)

| حوزه | وضعیت |
|---|---|
| Auth سرتاسری | ✅ متصل (snake_case با normalize در فرانت) |
| Booking pending→confirm | ✅ متصل ولی ⚠️ تسک cleanup در beat ثبت نمی‌شود |
| Notifications | ✅ متصل (DB+WS) ولی WS بدون احراز هویت |
| Reviews | ✅ متصل ولی بدون بررسی «آیا کاربر رزرو دارد» |
| Favorites | ⚠️ فقط کلاینت — بک‌اند ندارد |
| Competitions | ✅ متصل |
| Contracts | ✅ متصل (سرویس + UI) |
| Payments | ✅ mock متصل |
| Admin | ✅ متصل |
| Alembic | ❌ versions خالی — مهاجرت واقعی وجود ندارد |
| Tests | ❌ صفر تست خودکار |
| React Query | ❌ Provider بدون مصرف |
