# AUDIT — فاز ۲ تا ۶ (فیچرها، فلوها، قطعات قطع‌شده، تکرارها، کد مرده)

> بر اساس کشف فاز ۰. وضعیت‌ها: WORKING / PARTIAL / BROKEN / UNUSED / DUPLICATED / MISSING / UNKNOWN

---

## فاز ۲ — اینونتوری فیچرها

| # | Feature | Frontend | Backend | DB | API | Tests | Status |
|---|---|---|---|---|---|---|---|
| 1 | ثبت‌نام | Register.tsx + authStore.register | /auth/register + AuthService | users | ✅ | ❌ | WORKING (بعد از register لاگین خودکار نیست — عمدی) |
| 2 | ورود | Login.tsx + authStore.login | /auth/login + JWT | users | ✅ | ❌ | WORKING |
| 3 | خروج | authStore.logout (پاک‌سازی localStorage) | — (endpoint ندارد) | — | client-only | ❌ | WORKING (stateless JWT — بدون blacklist) |
| 4 | مشاهده سالن‌ها | Venues.tsx + venueService.getAll | GET /venues | venues | ✅ | ❌ | WORKING (پشت ProtectedRoute — نیاز به لاگین) |
| 5 | جستجو | SearchBar + Search.tsx (search param + searchHistoryStore) | GET /venues?search | venues | ✅ | ❌ | WORKING |
| 6 | فیلتر (ورزش/امکانات/شعاع/قیمت) | FilterBottomSheet + Venues/Home | category/lat/lng/radius/is_verified | venues | ✅ | ❌ | PARTIAL — فیلتر «ورزش» و «امکانات» سمت بک‌اند پیاده نیست (فقط client-side) |
| 7 | جزئیات سالن | VenueDetail.tsx | GET /venues/{id} + slots + reviews | venues/slots/reviews | ✅ | ❌ | WORKING |
| 8 | علاقه‌مندی | favoritesStore (localStorage) | ❌ هیچ | ❌ | ❌ | ❌ | PARTIAL — فقط کلاینت، بدون sync |
| 9 | انتخاب سانس | TimeSlotPicker در VenueDetail | GET /slots/venue/{id}/available | slots | ✅ | ❌ | WORKING |
| 10 | رزرو (pending) | bookings create در VenueDetail | POST /bookings → Redis pending + slot→BOOKED | redis+slots | ✅ | ❌ | PARTIAL — تسک cleanup در beat **ثبت نمی‌شود** (باگ بازنویسی beat_schedule) |
| 11 | تأیید/رد pending (مدیر) | ManagerDashboard | POST /bookings/pending/{id}/confirm|reject | bookings | ✅ | ❌ | WORKING |
| 12 | پرداخت | paymentService + BookingDetail | POST /payments + /{id}/pay (mock) | booking_payments | ✅ | ❌ | PARTIAL — درگاه mock (بدون gateway واقعی) |
| 13 | تاریخچه رزرو | Bookings.tsx (upcoming/past) | GET /bookings/upcoming|past | bookings | ✅ | ❌ | WORKING |
| 14 | لغو رزرو + refund | Bookings/BookingDetail | DELETE /bookings/{id} (+refund paid) | bookings+payments | ✅ | ❌ | WORKING |
| 15 | ثبت نظر/امتیاز | ReviewSection | /reviews CRUD | reviews | ✅ | ❌ | PARTIAL — بدون بررسی «کاربر رزرو confirmed دارد» |
| 16 | ویرایش پروفایل | Profile.tsx | PUT /auth/profile | users | ✅ | ❌ | WORKING |
| 17 | تغییر رمز | Profile.tsx | POST /auth/change-password | users | ✅ | ❌ | WORKING |
| 18 | تأیید ایمیل (OTP) | VerifyEmail.tsx | /auth/verify/email/* | redis | ✅ | ❌ | PARTIAL — بدون SMTP، کد در پاسخ API برمی‌گردد (dev_code) |
| 19 | بازیابی رمز | ForgotPassword.tsx | /auth/forgot+reset-password | redis | ✅ | ❌ | PARTIAL — همان dev_code |
| 20 | رقابت قیمت | Competitions.tsx + ManagerDashboard | /competitions start/bid/best + celery resolve | price_competitions+slots | ✅ | ❌ | WORKING (resolve هر ۳۰ دقیقه اجرا می‌شود) |
| 21 | قرارداد | Contracts/ContractDetail + ContractForm | /contracts + ContractService + celery expire | contracts/slots | ✅ | ❌ | WORKING |
| 22 | اعلان‌ها | NotificationPanel + notificationStore + useWebSocket | /notifications + NotificationService + WS | notifications | ✅ | ❌ | WORKING (⚠️ WS بدون احراز هویت) |
| 23 | مدیریت سالن (my-venues/slots/prices) | ManagerDashboard | /venues/my-venues، /slots/generate، /venues/{id}/prices | venues/slots | ✅ | ❌ | WORKING (محدودیت ۱ سالن به ازای مدیر) |
| 24 | ادمین (کاربران/سالن‌ها/تأیید) | admin/* صفحات | /admin/* ۹ endpoint | users/venues | ✅ | ❌ | WORKING |
| 25 | آپلود تصویر | uploadService (VenueDetail/Manager) | POST /upload/images → MinIO | — | ✅ | ❌ | WORKING |
| 26 | اخبار/مسابقات ورزشی | Home.tsx sportsApi | — (varzesh3 external + vite proxy) | — | external | ❌ | WORKING (وابستگی به سرویس خارجی) |
| 27 | داشبورد کاربر | Dashboard.tsx | /bookings + /payments | bookings | ✅ | ❌ | WORKING |
| 28 | باشگاه (Club) | ❌ | ❌ router ندارد | clubs (model+repo) | ❌ | ❌ | MISSING — entity یتیم |
| 29 | React Query | Provider در App.tsx | — | — | — | — | UNUSED |
| 30 | bookingStore/venueStore/uiStore | ❌ import صفر | — | — | — | — | UNUSED (+قرارداد BROKEN items/total) |
| 31 | هوک‌های mock (useAuth/useBooking/useVenue/…) | ❌ import صفر | — | — | — | — | UNUSED |
| 32 | کامپوننت‌های مرده (~۲۰ فایل) | ❌ import صفر | — | — | — | — | UNUSED |

**خلاصه**: هیچ فیچر زنده‌ای BROKEN کامل نیست؛ بحرانی‌ترین‌ها: باگ beat_schedule (۱۰)، favorites بدون بک‌اند (۸)، reviews بدون eligibility (۱۵)، WS بدون auth (۲۲).

---

## فاز ۳ — Trace فلوهای کاربری (۱۶ فلو)

### 1) Register
`Register.tsx` → `authStore.register` → `authService.register` → **POST /auth/register** (snake_case full_name) → `AuthService.create_user` (argon2 hash) → uow.users.create → users. پاسخ: UserResponse. FE کاربر را normalizeUser کرده ولی **لاگین نمی‌کند** → redirect به login. ✅ سالم.

### 2) Login
`Login.tsx` → `authStore.login` → **POST /auth/login** → `authenticate_user` → `create_access_token(sub=phone)` → `Token{access_token,user}` → FE: localStorage `auth-token` + persist `auth-storage`. ✅

### 3) Logout
`authStore.logout` → پاک‌سازی state + `localStorage.removeItem('auth-token')`. بک‌اند: هیچ (JWT stateless، بدون logout/blacklist). توکن دزدیده‌شده تا ۲۴h معتبر می‌ماند. ⚠️ امنیتی (فاز ۱۶).

### 4) View Venues
`Venues.tsx` → `venueService.getAll(params)` → **GET /venues** (get_session مستقیم) → فیلتر is_verified + category/search/geo → `from_orm_with_json` + `get_venue_min_price`(**فقط سانس‌های امروز!** اگر امروز سانس نباشد price=0). ⚠️ PARTIAL.

### 5) Search
Home/SearchBar → `GET /venues?search=` → ILIKE name/address (repo `search_by_name_or_address` **استفاده نمی‌شود** — logic داخل router است). ✅ + تاریخچه جستجو client-side.

### 6) Filter
FilterBottomSheet (draft state) → Venues.tsx → پارامترهای `category/lat/lng/radius_km/is_verified` به GET /venues. فیلترهای sport/amenities **فقط client-side** روی نتایج اعمال می‌شوند. ⚠️ PARTIAL.

### 7) Venue Details
`VenueDetail` → **GET /venues/{id}** + **GET /slots/venue/{id}/available?date=** + **GET /reviews/venue/{id}** + summary. ✅

### 8) Favorite
`favoritesStore.toggle` → localStorage فقط. هیچ API call. ⚠️ قطع (فاز ۴).

### 9) Select Slot
TimeSlotPicker → `slotService.getAvailableByVenueAndDate` → **GET /slots/venue/{id}/available**. ✅

### 10) Booking
`VenueDetail` → `bookingService.create({slotId})` → **POST /bookings** → `BookingService.create_booking`:
1. `uow.slots.get_by_id_with_lock` (SELECT FOR UPDATE)
2. بررسی status AVAILABLE + `has_pending_for_slot` (Redis)
3. `PendingBookingService.create` → Redis `pending:booking:{pid}` (TTL 4h) + ایندکس‌ها
4. slot.status=BOOKED
→ پاسخ PendingBookingResponse + notify managers (DB+WS).
⚠️ اگر مدیر پاسخ ندهد: Redis می‌سوزد ولی **slot روی BOOKED می‌ماند** چون تسک cleanup هرگز schedule نمی‌شود (باگ beat_schedule).

### 11) Payment
`BookingDetail` → `paymentService.create(bookingId)` → **POST /payments** (فاکتور pending از slot.current_price) → `pay(card,cvv,...)` → **POST /payments/{id}/pay** → mock success → status=paid + transaction_id. ⚠️ درگاه واقعی نیست.

### 12) Booking History
`Bookings.tsx` → **GET /bookings/upcoming?days_ahead=** و **/past?limit=** → `_enrich_bookings` (نام سالن/تاریخ سانس). ✅

### 13) Review
`ReviewSection` → `reviewService.create({venue_id,rating,comment})` → **POST /reviews** → 404 venue / 400 duplicate. ویرایش/حذف فقط مالک. ❗ بدون بررسی رزرو قبلی.

### 14) Profile
`Profile.tsx` → `authService.getMe/updateProfile/changePassword` → **GET/PUT /auth/me|profile، POST /change-password**. ✅

### 15) Venue Owner
`ManagerDashboard` → my-venues / slots generate / pending list / confirm|reject / prices set / competitions start. همه متصل. ✅ (محدودیت ۱ سالن).

### 16) Admin
`AdminDashboard/Users/Venues` → **GET /admin/users|stats/*|pending-*** + **POST approve/reject/verify-venue**. ✅ (verify-venue مکرر با venues/{id}/verify — DUPLICATED).

---

## فاز ۴ — قطعات قطع‌شده (Disconnected)

| نوع | مورد | شواهد |
|---|---|---|
| UI بدون API | favoritesStore | کامنت خود فایل: «بک‌اند endpoint ندارد» |
| UI بدون API | searchHistoryStore / recentlyViewedStore | client-only (طراحی‌شده اینطور است) |
| API بدون UI | GET /venues/{id}/prices | service دارد؛ مصرف UI تأیید نشده |
| API بدون UI | /venues/{id}/verify | موازی با /admin/verify-venue — هیچ‌کدام از UI ادمین؟ (admin/Venues.tsx مصرف می‌کند — یکی اضافه است) |
| Service بدون Router | Club model + uow.clubs | هیچ endpoint/صفحه‌ای |
| Entity بدون Service | Club | فقط model+repo |
| Store با قرارداد شکسته | bookingStore/venueStore | `response.items/total` ولی بک‌اند آرایه ساده → اگر وصل شوند BROKEN |
| Mock جای API واقعی | hooks/useAuth|useBooking|useVenue|useCompetition|useContract | داده ساختگی با setTimeout در حالی که serviceهای واقعی موجودند — **همه مرده (اثبات import=0)** |
| Provider بدون مصرف | QueryClientProvider | صفر useQuery |
| Button بدون action | در کامپوننت‌های مرده (BookingModal و…) | با حذف فایل‌ها رفع می‌شود |
| WS بدون auth | /ws/user/{user_id} | هر کسی با هر user_id می‌تواند وصل شود و اعلان‌ها را ببیند |

---

## فاز ۵ — تکرارها (Duplication) — توصیه بدون حذف

| مورد | نسخه‌ها | توصیه |
|---|---|---|
| تأیید سالن | POST /venues/{id}/verify **و** POST /admin/verify-venue/{id} | **Keep** admin (نقش‌محور)، **Remove** venues یکی (یا Merge) |
| ذخیره توکن | `auth-token` (key مستقل) **و** `auth-storage` (persist zustand) | **Merge** — یک منبع حقیقت؛ api.ts فعلاً هردو را می‌خواند (سازگاری) |
| normalize snake→camel | authStore.normalizeUser **و** mapping دستی در هر service | **Keep** (الگوی مرز مشخص است) — مستندسازی کن |
| منطق min_price | get_venue_min_price در venues.py **و** محاسبه price در slot | **Keep** ولی باگ «فقط امروز» اصلاح شود |
| EmptyState | mobile/EmptyState (زنده) **و** ui/Empty (مرده) | **Remove** ui/Empty |
| Toast | react-hot-toast (زنده) **و** notistack در ui/Toast.tsx (مرده) | **Remove** ui/Toast |
| Booking list | bookingStore (مرده) **و** فراخوانی مستقیم service در صفحات | **Remove** store |
| Venue list | venueStore (مرده) **و** service مستقیم | **Remove** store |
| Sidebar/Navbar | Sidebar (مرده) **و** Navbar (زنده) | **Remove** Sidebar |
| دو فایل CSS مرده | index.css، App.css | **Remove** |
| seed scriptها | seed_data/seed_qom/seed_gym_qom/seed_reviews + scripts/setup_db.py | **Keep** (ابزار dev) — علامت‌گذاری |

---

## فاز ۶ — گزارش کد مرده (حذف نشده — فقط گزارش)

**اثبات**: grep کامل `src/` برای import هر مورد = صفر (به‌جز موارد ذکرشده).

### Frontend — فایل‌های کاملاً مرده (۳۳+)
- hooks: `useAuth.ts` `useBooking.ts` `useVenue.ts` `useCompetition.ts` `useContract.ts` `useMediaQuery.ts`
- store: `bookingStore.ts` `venueStore.ts` `uiStore.ts`
- components: `layout/Sidebar.tsx`، `booking/BookingForm.tsx` `booking/BookingList.tsx`، `competition/CompetitionBid.tsx` `competition/CompetitionCard.tsx`، `dashboard/Chart.tsx` `dashboard/RecentBookings.tsx` `dashboard/StatCard.tsx`، `forms/LoginForm.tsx` `forms/RegisterForm.tsx` `forms/BookingForm.tsx`، `modals/BookingModal.tsx` `modals/CompetitionModal.tsx` `modals/ContractModal.tsx` `modals/EditProfileModal.tsx`، `venue/VenueFilter.tsx`، `ui/Toast.tsx` `ui/Alert.tsx` `ui/Empty.tsx` `ui/Progress.tsx` `ui/Select.tsx` `ui/Table.tsx` `ui/Tabs.tsx` `ui/Badge.tsx`
- css: `src/index.css` `src/App.css`

### Dependencies بدون استفاده (اثبات import=0)
`@radix-ui/*` (۱۴ پکیج)، `@mui/x-data-grid`، `@mui/x-date-pickers`، `react-day-picker`، `react-loader-spinner`، `recharts` (فقط در Chart.tsx مرده)، `notistack` (فقط در Toast.tsx مرده)

### Backend — مرده/غیرفعال
- `repositories/venue_repository.py`: `get_nearby_venues`، `search_by_name_or_address`، `get_amenities_stats`، `unverify_venue` — routerها query خودشان می‌نویسند (کاربرد تأیید نشده)
- `slot_repository.get_slots_in_competition`، `get_daily_report`، `is_slot_available`، `check_slot_conflict` — مصرف در router/service تأیید نشده
- `Club` model + `uow.clubs` — بدون مصرف
- `migrations/` — Alembic نصب ولی versions خالی (env.py هم نیست!)
- فایل `app.zip` در ریشه backend — artifact

### ریسک حذف
همه موارد frontend با `npx tsc --noEmit` قبل/بعد قابل اثبات است. آیتم‌های backend **حذف نشوند** (فقط گزارش) چون مصرف dynamic ممکن است (celery autodiscover).
