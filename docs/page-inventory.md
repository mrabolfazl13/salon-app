# صفحه‌نامه کامل صفحات — وب و فلاتر

تاریخ: 2026-10-12 | ابزار: جستجوی کد + اجرای واقعی (مرورگر headless + امولاتور CI)

## وب (React + MUI — `frontend/src`)

### عمومی (بدون لاگین)
| مسیر | صفحه | وضعیت ممیزی |
|---|---|---|
| `/` | Home (۱۶ سکشن: هیرو، سالن‌ها، محبوب‌ترین اسلات‌ها، باشگاه، رقابت، کوئیز، شگفت‌انگیز، وفاداری، …) | ✅ اسکرین‌شات + صفر خطا |
| `/login` | Login | ✅ (سلکتور واقعی: `input[name=phone]`) |
| `/register` | Register | ✅ |
| `/forgot-password` | ForgotPassword (۲ مرحله‌ای: کد ۶ رقمی + رمز جدید) | ✅ |
| `/verify` | VerifyEmail | ⚠️ مسیر موجود، تست دستی نشد (جریان ایمیل) |
| `/search` | Search | ✅ |
| `/venues` | Venues | ✅ (۳۰۷ trailing-slash بک‌اند با curl -L) |
| `/venues/:id` | VenueDetail | ✅ (سالن ۸ = فاتحی قم) |
| `/favorites` | Favorites | ✅ عمومی است (بدون گیت) |
| `/games`, `/games/:id` | Games | ✅ |
| هر مسیر ناشناخته | 404 سفارشی | ✅ |

### کاربر لاگین‌کرده
| مسیر | صفحه | وضعیت |
|---|---|---|
| `/dashboard` | Dashboard (آمار واقعی از GET /bookings) | ✅ |
| `/bookings` | Bookings (تب‌های همه/تأیید/انتظار/لغو/انجام) | ✅ |
| `/bookings/:id` | BookingDetail | ⚠️ موجود؛ در تور اسکرین‌شات نگرفت |
| `/teams`, `/teams/discover`, `/teams/:id` | Teams | ✅ |
| `/competitions` | Competitions | ✅ |
| `/deals` | Deals | ✅ |
| `/quiz` | Quiz | ✅ |
| `/contracts`, `/contracts/:id` | Contracts | ✅ |
| `/profile` | Profile (۴ تب) | ✅ |
| `/finance` | FinanceConsole (گیت venue_manager + allowStaff) | ✅ |
| `/manager-dashboard` | ManagerDashboard (۳۲ سالن، آمار واقعی) | ✅ |
| `/manager/pricing` | ManagerPricing (قیمت‌گذاری + قوانین) | ✅ |
| `/manager/contracts` | ManagerContracts | ✅ |
| `/manager/teams` | ManagerTeams | ✅ |
| `/manager/crm` | ManagerCrm | ✅ |
| `/manager/checkin` | ManagerCheckin | ✅ (تست رندر نشد در تور وب — تور ادمین انجام شد) |
| `/manager/finance` | ~~legacy~~ → **حذف شد؛ ریدایرکت به `/finance`** (تأییدشده در مرورگر) | ✅ فیکس شد |
| `/admin`, `/admin/users`, `/admin/venues` | پنل ادمین (گیت super_admin) | ✅ |

### ناوبری موبایل وب (`BottomNavigation.tsx`)
- مهمان: خانه/جستجو/علاقه‌مندی/پروفایل
- کاربر: خانه/جستجو/تیم‌ها/رزروها/پروفایل
- مدیر: خانه/داشبورد(/manager-dashboard)/رقابت‌ها/مالی(/finance)/پروفایل
- ادمین: خانه/داشبورد(/admin)/رقابت‌ها/کاربران(/admin/users)/پروفایل

## فلاتر (`android_flutter/lib` — GoRouter: `app/router/app_router.dart`)

### عمومی
`/` HomeScreen · `/login` · `/register` · `/forgot-password` (فیکس شد: جریان واقعی کد ۶ رقمی) · `/verify` · `/search` · `/favorites` · `/venues` · `/venues/:id`

### کاربر
`/dashboard` (فیکس شد: داده واقعی) · `/bookings` · `/bookings/:id` · `/profile` · `/teams` · `/teams/discover` · `/teams/:id` · `/competitions` · `/deals` · `/quiz` · `/contracts` · `/contracts/:id` · `/games` · `/games/create` · `/games/:id` · `/waitlist`

### مدیر (گارد نقش اضافه شد)
`/manager` · `/manager/pricing` · `/manager/contracts` · `/manager/teams` · `/manager/crm` · `/manager/checkin` · `/manager/finance` — فقط `venue_manager` / `club_admin` / `super_admin`

### ادمین (گارد نقش اضافه شد)
`/admin` · `/admin/users` · `/admin/venues` — فقط `super_admin`

### ناوبری پایین (`core/widgets/bottom_nav_bar.dart`)
- مهمان: خانه/جستجو/علاقه‌مندی/پروفایل
- کاربر: خانه/جستجو/تیم‌ها/رزروها/پروفایل
- مدیر: خانه/مدیریت(/manager)/رقابت‌ها/مالی(/manager/finance)/پروفایل
- ادمین: خانه/ادمین(/admin)/رقابت‌ها/کاربران/پروفایل

### یتیم‌های ناوبری (مسیر موجود، لینک ورودی ندارد)
`/favorites` (فقط از ناوبار مهمان) · `/contracts` (فقط اکشن سریع داشبورد) · `/waitlist` (بدون لینک — تصمیم محصول لازم است)
