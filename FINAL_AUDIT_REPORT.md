# گزارش نهایی ممیزی کامل پروژه (فاز ۲۶)

> تاریخ: ۲۰۲۶-09-04 | دامنه: `futsal-booking-system/` (بک‌اند FastAPI + فرانت‌اند React + زیرساخت Docker)
> اصل حاکم: کد کمتر + اتصال بهتر + معماری شفاف + بدون تکرار + بدون کد مرده + فیچرهای پایدار
> اسناد مرتبط: [PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md) · [AUDIT_FEATURES_FLOWS.md](AUDIT_FEATURES_FLOWS.md) · [AUDIT_CONSISTENCY_SECURITY.md](AUDIT_CONSISTENCY_SECURITY.md) · [INTEGRATION_MATRIX.md](INTEGRATION_MATRIX.md) · [CLEANUP_PLAN.md](CLEANUP_PLAN.md)

---

## ۲۰ سؤال پایانی — پاسخ‌های اثبات‌شده

### ۱) معماری واقعی پروژه چیست؟
FastAPI (۱۱ روتر زیر `/api/v1`) → UnitOfWork (ریپازیتوری‌های lazy، commit/rollback خودکار) → BaseRepository (`SELECT FOR UPDATE`، فیلترهای `==`) → SQLModel/PostgreSQL. Redis برای pending bookings + کدهای تأیید. Celery (worker+beat) برای تسک‌های زمان‌بندی. MinIO برای تصاویر. WebSocket برای اعلان‌های بلادرنگ. فرانت: React 18 + Vite + MUI + zustand(persist) + axios؛ داده‌ها از طریق `services/*.ts` (snake_case در مرزها نرمال‌سازی می‌شود). جزئیات کامل در PROJECT_ARCHITECTURE.md.

### ۲) چه فیچرهایی واقعاً end-to-end کار می‌کنند؟
auth (register/login/JWT/me/change-password/forgot-reset با dev_code)، venues CRUD+verify+prices، slots (generate/list/available/range)، bookings (create→pending→confirm/reject→DB)، payments (mock gateway با اعتبارسنجی کارت و ارقام فارسی)، reviews (CRS با مالکیت)، contracts (ساخت + جلسات هفتگی)، competitions (start/bid/resolve)، notifications (persist + WS + read)، upload (MinIO)، admin (users/stats/verify/approve/reject). — جدول ۳۲ ردیفه در AUDIT_FEATURES_FLOWS.md فاز ۲.

### ۳) چه فیچرهایی ناقص/شکسته بودند؟
- **شکسته (رفع شد):** تسک `cleanup_expired_pending_bookings` به‌دلیل assignment در `beat_schedule` کامپتیشن پاک می‌شد → اسلات‌های pending منقضی هرگز آزاد نمی‌شدند.
- **ناقص:** علاقه‌مندی‌ها فقط کلاینت‌ساید (بدون endpoint بک‌اند)؛ reviews شرط «داشتن رزرو تأییدشده» را چک نمی‌کند؛ Club در مدل/ریپو هست ولی UI/endpoint ندارد؛ `get_venue_min_price` فقط امروز را می‌دید (رفع شد).
- **بی‌استفاده (حذف شد):** react-query (فقط Provider)، سه store مرده، هوک‌های mock، ~۲۴ کامپوننت موازی.

### ۴) فلوهای کاربری trace شدند؟
بله — ۱۶ فلو (ثبت‌نام، لاگین، مرور/جستجو، جزئیات+اسلات، رزرو، تأیید مدیر، پرداخت، لغو+refund، قرارداد، مسابقه/bid، نظرات، اعلان‌ها، پروفایل، ادمین، آپلود، رمزفراموشی) با trace کامل FE→API→Service→Repo→DB در فاز ۳. همه به مقصد رسیدند؛ تنها انحراف: فلو انقضای pending (باگ beat).

### ۵) قطعات قطع‌شده (disconnected) کدام‌ها بودند؟
`ui/index.ts` barrel بدون مصرف‌کننده؛ `@tanstack/react-query` Provider بدون حتی یک `useQuery`؛ `bookingStore/venueStore/uiStore` بدون import؛ هوک‌های `useAuth/useBooking/...` موازیِ services زنده؛ `Sidebar.tsx` موازیِ `Layout+BottomNavigation` زنده؛ فرم‌ها/مودال‌های قدیمی موازیِ صفحات زنده. — همه یا حذف شدند یا (مثل useToast) زنده اثبات و نگه داشته شدند.

### ۶) تکرارها چه شدند (Keep/Merge/Remove)؟
- Keep: `services/*` + `store/authStore|notificationStore|favoritesStore|recentlyViewedStore` + `components/ui/{Button,Input,Card,Dialog,Loading}` + `modals/ConfirmModal` + `bookings/PaymentDialog` + `booking/TimeSlotPicker`.
- Remove: تمام جفت‌های موازی مرده (۳۶ فایل، فاز ۲۴).
- Merge: دو endpoint تأیید venue (`/venues/{id}/verify` و `/admin/verify-venue/{id}`) — **گزارش شد، ادغام نشد** (هر دو زنده و مصرف‌شونده؛ ادغام ریسک شکستن ادمین دارد → بدهی ثبت‌شده M).
- تکرار ذخیره توکن (localStorage zustand + key جدا در api.ts) — آگاهانه و سازگار؛ تغییر داده نشد.

### ۷) کد مرده حذف‌شده — اثبات؟
بله. روش: grep کامل `src/` برای import هر فایل قبل و بعد از حذف. نتیجه فاز ۲۴: **۳۶ فایل حذف** (DELETED=36 MISSING=0):
- hooks: useAuth, useBooking, useVenue, useCompetition, useContract, useMediaQuery
- stores: bookingStore, venueStore, uiStore
- components: layout/Sidebar؛ booking/{BookingForm,BookingList}؛ competition/{CompetitionBid,CompetitionCard}؛ dashboard/{Chart,RecentBookings,StatCard}؛ forms/{BookingForm,LoginForm,RegisterForm}؛ modals/{BookingModal,CompetitionModal,ContractModal,EditProfileModal}؛ venue/VenueFilter؛ ui/{Toast,Alert,Empty,Progress,Select,Table,Tabs,Badge,index.ts}
- css: src/index.css, src/App.css (بدون ارجاع در index.html/main.tsx)
**نگه‌داشته‌های کلیدی با اثبات مصرف:** `hooks/useToast.ts` (ForgotPassword/Login/Register)، `Skeletons/ErrorState/EmptyState` (Search/Home/Bookings/Favorites/Profile)، `ConfirmModal` (Bookings/BookingDetail)، `PaymentDialog` (Bookings)، `TimeSlotPicker` (VenueDetail)، `ui/{Button,Input,Card,Dialog,Loading}` (App.tsx + صفحات auth). پس از حذف: grep ارجاعات = **۰**. تعداد فایل‌های src: ۱۳۲ → ۹۶.

### ۸) وضعیت DB؟
`create_all` در startup (database.py)؛ **`migrations/versions/` خالی است** (Alembic عملاً غیرفعال — بدون env.py). هیچ جدول/ستونی حذف یا تغییر داده نشد (ممنوعیت صریح). مشکلات ثبت‌شده به‌عنوان بدهی: نبود unique روی (venue_id,date,start_time) در slots؛ JSON-as-string در venue (amenities/images)؛ نبود pagination envelope.

### ۹) سازگاری API؟
همه روترها `/api/v1/<plural>` با response_model؛ خطاهای HTTPException مخلوط fa/en (گزارش شد). اصلاحات اعمال‌شده فاز ۲۳: (الف) `PUT /venues/{id}` پاسخ stale می‌داد (نتیجه `update()` دور ریخته می‌شد) → حالا `venue = uow.venues.update(...)`؛ (ب) `min_price` فقط بازه «امروز» را می‌دید → `today..today+7`؛ (ج) `print()` دیباگ در slots.py حذف؛ (د) دو `except:` لخت در schemas/venue.py → `except (json.JSONDecodeError, TypeError)`.

### ۱۰) قرارداد FE↔BE؟
بک‌اند خالص snake_case؛ فرانت در مرزها نرمال‌سازی می‌کند (`authStore.normalizeUser` + تبدیل payload در services). این الگو **سازگار و عمدی** است — نه باگ. همه endpointهای مصرفی فرانت با روترهای بک‌اند تطبیق داده شدند (INTEGRATION_MATRIX.md — هیچ endpoint یتیمی از سمت FE یافت نشد؛ یتیم‌های BE: چند endpoint admin/contract که FE مصرف می‌کند یا عمداً رها شده).

### ۱۱) Auth/AuthZ/IDOR؟
JWT HS256 (sub=phone، ۲۴ ساعت) + argon2. ممیزی IDOR روی همه مسیرهای حساس **PASS**: booking detail (مالک | مدیر venue | super_admin)، cancel (مالک)، payments (مالک + 404/403/400)، contracts (مالک، 404 برای غیرمالک)، reviews (مالک نظر)، venues PUT (manager_id)، pending confirm/reject (`_check_venue_manager`). ریسک‌های ثبت‌شده: H1 — endpoint WS بدون احراز هویت (فقط گزارش)؛ H2 — dev_code در محیط بدون SMTP (رفتار مستند، تغییر داده نشد).

### ۱۲) ممیزی عمیق Booking؟
جریان: `POST /bookings` → قفل اسلات (`get_by_id_with_lock`) + `has_pending_for_slot` (Redis) → pending با TTL ۴ ساعت + اسلات BOOKED → تأیید مدیر → Booking در DB → پرداخت → لغو = refund + آزادسازی اسلات. قیمت همیشه سمت سرور (`slot.current_price`) — دست‌کاری کلاینت بی‌اثر. تنها حفره: آزادسازی خودکار در انقضا (باگ beat) که **رفع شد**.

### ۱۳) مدیریت state؟
zustand با persist برای auth/favorites/notifications/recentlyViewed (زنده)؛ local state + useEffect در صفحات (الگوی غالب و سالم). سه store موازی مرده حذف شدند. react-query فقط Provider داشت — Provider **فعلاً نگه داشته شد** (حذف آن نیازمند uninstall پکیج است — به تأیید کاربر موکول، M7).

### ۱۴) مدیریت خطا؟
axios interceptor (401→logout+redirect)؛ try/catch + toast در صفحات زنده؛ بک‌اند HTTPException با جزئیات. شکاف ثبت‌شده: برخی catch‌ها پیام عمومی می‌دهند و خطای سرور را نشان نمی‌دهند (M5 — گزارش، تغییر نکرد).

### ۱۵) حالت‌های loading/empty/error؟
صفحات زنده (Venues/Home/Search/Bookings/Dashboard/Competitions) هر سه حالت را با Skeleton/EmptyState/ErrorState+Retry پوشش می‌دهند — کامپوننت‌های مربوطه زنده اثبات و حفظ شدند.

### ۱۶) ریسپانسیو؟
گزارش فقط (بدون تغییر): MUI Grid `size={{xs,sm,md}}` + دایرکشن RTL + BottomNavigation موبایل. مشکلات جزئی ثبت‌شده در AUDIT_CONSISTENCY_SECURITY.md فاز ۱۵.

### ۱۷) امنیت؟
جدول S1–S12 در AUDIT_CONSISTENCY_SECURITY.md. اعمال‌شده فاز ۲۳: **C2** — `env_file: ./backend/.env` به سرویس‌های backend و celery اضافه شد (کلید JWT_SECRET واقعی از .env محلی بالا می‌آید؛ `environment:` اولویت دارد). باقی‌مانده بدهی مستند: placeholder بودن JWT_SECRET در config.py (باید در prod با secret واقعی جایگزین شود)، admin123 پیش‌فرض، CORS باز `*`، WS بدون auth (H1).

### ۱۸) وابستگی‌ها؟
حذف پکیج **انجام نشد** (قانون: فقط با تأیید). اثبات بی‌مصرفی پس از حذف کد مرده: `recharts` و `notistack` دیگر هیچ importی در src ندارند؛ `@tanstack/react-query` فقط Provider در App.tsx. نامزد uninstall: `recharts notistack` (و در صورت حذف Provider: `@tanstack/react-query`). — منتظر تأیید کاربر.

### ۱۹) تست‌ها؟
**صفر تست خودکار** (grep `def test_|pytest` = ۰ در کل مخزن؛ `test_reviews_flow.py` تب باز ولی روی دیسک موجود نیست). فقط اسکریپت‌های shell در `scripts/` (اسموک). H3 به‌عنوان بزرگ‌ترین بدهی کیفیت ثبت شد؛ نوشتن تست خارج از دامنه این تسک بود (بدون فیچر جدید).

### ۲۰) build و runtime نهایی (پس از همه تغییرات)؟
- `npx tsc --noEmit` → **exit 0** (قبل و بعد از حذف)
- `npm run build` → **موفق** (vite 5.4.21، ۱۲۴۱۱ ماژول، ۳۱.۷ ثانیه؛ هشدار chunk: index 576KB / Venues 210KB — ثبت‌شده M6)
- `python -m compileall backend/app` → **OK**
- grep ارجاع به ۳۶ فایل حذف‌شده → **۰**
- کانتینر WSL (`futsal_backend`) دست‌نخورده باقی ماند (طبق دستور).

---

## خلاصه تغییرات اعمال‌شده (فاز ۲۳–۲۴)

| # | فایل | تغییر | ریسک |
|---|------|-------|------|
| C1 | `backend/app/tasks/competition_tasks.py` | `beat_schedule = {…}` → `beat_schedule.update({…})` (رفع پاک‌شدن تسک cleanup) | پایین |
| C2 | `docker-compose.yml` | `env_file: ./backend/.env` برای backend + celery (رفع placeholder JWT در داکر) | پایین |
| H4 | `backend/app/api/v1/venues.py` | `venue = uow.venues.update(...)` (پاسخ PUT تازه) + بازه min_price به ۷ روز + import timedelta | پایین |
| M | `backend/app/api/v1/slots.py` | حذف `print("Slots", slots)` | ناچیز |
| M | `backend/app/schemas/venue.py` | دو `except:` لخت → `except (json.JSONDecodeError, TypeError)` | پایین |
| — | **۳۶ فایل مرده فرانت** | حذف کامل (فهرست سؤال ۷) — src از ۱۳۲ به ۹۶ فایل | اثبات‌شده با grep |

## اقدامات لازم سمت کاربر (به ترتیب اولویت)
1. **Restart کانتینر celery** تا رفع C1 (beat_schedule) اعمال شود — تا پیش از آن، اسلات‌های pending منقضی‌شده آزاد نمی‌شوند.
2. **`docker compose up -d backend celery`** (recreate) تا env_file جدید C2 بارگذاری شود؛ سپس در prod مقدار `JWT_SECRET` قوی و `ADMIN_PASSWORD` غیرپیش‌فرض تنظیم شود.
3. تأیید uninstall پکیج‌های بی‌مصرف: `npm uninstall recharts notistack` (و اختیاری `@tanstack/react-query` با حذف Provider از App.tsx).
4. بدهی‌های مستند برای اسپرینت بعد: تست‌نویسی (H3)، auth برای WebSocket (H1)، یکتای (venue,date,start_time) در slots، pagination استاندارد، ادغام دو endpoint تأیید venue، شرط «رزرو تأییدشده» برای ثبت review، endpoint بک‌اند برای favorites، کد-اسپلیت chunk 576KB.

## آنچه عمداً انجام نشد
هیچ فیچر جدیدی اضافه نشد؛ هیچ جدول/migrationای حذف یا تغییر نکرد؛ هیچ کانتینر در حال اجرا ری‌استارت نشد؛ هیچ پکیجی بدون تأیید uninstall نشد؛ رفتار mock gateway و dev_code (محیط توسعه) دست‌نخورده ماند.
