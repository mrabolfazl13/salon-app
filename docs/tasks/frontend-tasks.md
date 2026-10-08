# سند وظایف فرانت‌اند — فاز ۲۷

> **تاریخ:** ۲۰۲۶-۱۰-۰۸ | **دامنه:** `frontend/` (React 18 + Vite + TypeScript + Tauri)  
> **هدف:** تبدیل اپ از «می‌سازد» به «کار می‌کند، قابل اعتماد است، دیده می‌شود»  
> **معیار موفقیت:** صفر خطای CORS، پوشش ۵ جریان طلایی با تست، Refresh Token فعال، درگاه پرداخت واقعی، صف انتظار و QR چک‌این زنده

---

## فهرست وظایف بر اساس فاز

### فاز ۱: حقیقی‌سازی و اتصال واقعی (P0)

#### FE-001: حذف داده‌های جعلی و شبیه‌سازی API
- **عنوان:** پاکسازی کدهای Mock و شبیه‌سازی فراخوانی API
- **شرح:** تمام رشته‌های `mock_token_123`، `Simulate API call` و داده‌های ساختگی را از مسیر build حذف کن. سرویس‌های HTTP باید واقعاً به بک‌اند متصل شوند.
- **شناسه ویژگی مرتبط:** فیچر ۲ (حقیقی‌سازی موبایل)
- **اولویت:** P0
- **وابستگی:** BE-005 (احراز هویت JWT واقعی)، BE-006 (Refresh Token)
- **معیار پذیرش:** 
  - `grep -rn "mock_token\|Simulate API" frontend/src/` خالی باشد
  - پنج جریان اصلی (ورود، لیست سالن، جزئیات+اسلات، ساخت رزرو، لیست رزروها) با API زنده کار کنند
  - ردپای درخواست‌ها در لاگ بک‌اند دیده شود
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `src/services/api.ts`, `src/pages/auth/Login.tsx`, `src/pages/bookings/BookingCreate.tsx`
- **قابل موازی‌سازی؟** بله

#### FE-002: پیاده‌سازی Refresh Token و مدیریت نشست
- **عنوان:** چرخه کامل نشست با Access و Refresh Token
- **شرح:** interceptor axios را طوری تغییر بده که روی ۴۰۱ ابتدا `/auth/refresh` را صدا بزند، سپس درخواست اصلی را تکرار کند. توکن‌ها را در HttpOnly cookie یا secure storage ذخیره کن.
- **شناسه ویژگی مرتبط:** فیچر ۱۰ (امنیت نشست)
- **اولویت:** P0
- **وابستگی:** BE-006 (endpoint refresh token)
- **معیار پذیرش:**
  - درخواستی که در دقیقه ۲۰ باز می‌شود بدون دیدن صفحه لاگین بازیابی شود
  - `/auth/logout` همه توکن‌ها را ابطال کند
  - هر تغییر رمز، refresh‌های قبلی را باطل کند
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `src/services/api.ts`, `src/store/authStore.ts`, `src/hooks/useAuth.ts`
- **قابل موازی‌سازی؟** خیر (باید بعد از BE-006 انجام شود)

#### FE-003: همگام‌سازی قرارداد API با بک‌اند (snake_case ↔ camelCase)
- **عنوان:** نرمال‌سازی یکدست پاسخ‌های بک‌اند
- **شرح:** تابع `normalizeUser` موجود را گسترش بده تا تمام پاسخ‌های API را به صورت خودکار از snake_case به camelCase تبدیل کند. این شامل bookings, venues, slots, payments و ... می‌شود.
- **شناسه ویژگی مرتبط:** فیچر ۲ (اتصال واقعی)
- **اولویت:** P0
- **وابستگی:** —
- **معیار پذیرش:**
  - هیچ فیلد snake_case در UI نمایش داده نشود
  - payload‌های ارسالی به بک‌اند snake_case باشند
  - تست با حداقل ۳ endpoint مختلف (venues, bookings, payments)
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `src/services/api.ts`, `src/utils/normalizeResponse.ts` (جدید)
- **قابل موازی‌سازی؟** بله

#### FE-004: رفع خطاهای CORS برای پروداکشن
- **عنوان:** پیکربندی CORS برای دامنه رسمی
- **شرح:** مطمئن شو که درخواست‌ها از `https://salon-app.ir` (یا دامنه نهایی) به بک‌اند بدون خطای CORS ارسال می‌شوند. origin پروداکشن را به allowlist اضافه کن.
- **شناسه ویژگی مرتبط:** فیچر ۱۳ (CORS و HTTPS)
- **اولویت:** P0
- **وابستگی:** BE-007 (پیکربندی CORS سرور)
- **معیار پذیرش:**
  - از اپ Tauri و مرورگر dev روی localhost:3001 هیچ خطای CORS نباشد
  - درخواست‌های OPTIONS قبل از POST/PUT/PATCH موفق باشند
  - WebSocket connection بدون خطای CORS برقرار شود
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `vite.config.ts`, `tauri.conf.json`
- **قابل موازی‌سازی؟** بله

#### FE-005: پیاده‌سازی درگاه پرداخت واقعی
- **عنوان:** ادغام درگاه پرداخت (زرین‌پال/آیدی‌پی) در جریان رزرو
- **شرح:** PaymentDialog را طوری تغییر بده که کاربر را به درگاه واقعی هدایت کند، webhook را دریافت کند و وضعیت پرداخت را به PAID تغییر دهد. نمایش فیش پرداخت با QR code.
- **شناسه ویژگی مرتبط:** فیچر ۳ (درگاه پرداخت واقعی)
- **اولویت:** P0
- **وابستگی:** BE-008 (endpoint پرداخت واقعی), BE-009 (webhook درگاه)
- **معیار پذیرش:**
  - پرداخت واقعی از اپ وب تا پایان: درخواست → درگاه → بازگشت → webhook → PAID
  - مبلغ نهایی با کارمزد درگاه درست محاسبه شود
  - فیش پرداخت با شماره تراکنش و QR code نمایش داده شود
  - پرداخت ناتمام ۲۰ دقیقه بعد auto-cancel شود
- **تلاش تخمینی:** L
- **فایل‌های تحت تأثیر:** `src/components/bookings/PaymentDialog.tsx`, `src/pages/bookings/BookingDetail.tsx`, `src/services/paymentService.ts`
- **قابل موازی‌سازی؟** خیر (باید بعد از BE-008 و BE-009 انجام شود)

#### FE-006: افزودن ورودی استبدال کد تخفیف در جریان رزرو
- **عنوان:** اعمال کوپن تخفیف در مرحله تأیید رزرو
- **شرح:** در PaymentDialog یا صفحه تأیید رزرو، یک input field برای وارد کردن کد تخفیف اضافه کن. با کلیک «اعمال»، قیمت نهایی را با تخفیف به‌روز کن.
- **شناسه ویژگی مرتبط:** فیچر ۹ (کد تخفیف و پیشنهاد ویژه)
- **اولویت:** P1
- **وابستگی:** BE-010 (endpoint validate coupon)
- **معیار پذیرش:**
  - کاربر کد را وارد و «اعمال» کند
  - قیمت نهایی با تخفیف محاسبه و نمایش داده شود
  - اگر کوپن منقضی یا تمام شده، پیام فارسی دقیق نشان دهد
  - رزرو نهایی coupon_code و مبلغ کاهش‌یافته را در دیتابیس داشته باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `src/components/bookings/PaymentDialog.tsx`, `src/services/couponService.ts` (جدید)
- **قابل موازی‌سازی؟** بله

#### FE-007: پیاده‌سازی صف انتظار در VenueDetail
- **عنوان:** ثبت‌نام در صف انتظار سالن شلوغ
- **شرح:** در صفحه VenueDetail، اگر اسلات‌ها پر هستند، دکمه «ثبت‌نام در صف انتظار» نمایش بده. کاربر تاریخ و ساعت دلخواه را انتخاب و ثبت‌نام می‌کند.
- **شناسه ویژگی مرتبط:** فیچر ۲۱ (صف انتظار در موبایل)
- **اولویت:** P1
- **وابستگی:** BE-011 (endpoint waitlist)
- **معیار پذیرش:**
  - دکمه صف انتظار فقط وقتی اسلات‌ها پر هستند نمایش داده شود
  - کاربر تاریخ و بازه زمانی انتخاب کند
  - پس از ثبت‌نام، پیام تأیید و شماره نوبت نشان داده شود
  - در پنل کاربر، وضعیت صف انتظار نمایش داده شود
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `src/pages/venues/VenueDetail.tsx`, `src/services/waitlistService.ts` (جدید)
- **قابل موازی‌سازی؟** بله

#### FE-008: بهبود مدیریت خطا و نمایش پیام‌های فارسی
- **عنوان:** یکسان‌سازی نمایش خطاها و پیام‌های بازیابی
- **شرح:** interceptor axios را طوری تغییر بده که خطاهای ۴۰۱/۴۰۳/۵۰۰ را با پیام فارسی مناسب نمایش دهد. از react-hot-toast استفاده کن. spinner بی‌پایان را حذف کن.
- **شناسه ویژگی مرتبط:** فیچر ۲ (اتصال واقعی)
- **اولویت:** P0
- **وابستگی:** —
- **معیار پذیرش:**
  - خطای ۴۰۱: «نشست شما منقضی شده، لطفاً دوباره وارد شوید»
  - خطای ۴۰۳: «شما مجوز دسترسی به این بخش را ندارید»
  - خطای ۵۰۰: «خطای سرور، لطفاً دوباره تلاش کنید»
  - خطای شبکه: «ارتباط با سرور برقرار نشد، اینترنت خود را بررسی کنید»
  - هیچ spinner بی‌پایانی وجود نداشته باشد
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `src/services/api.ts`, `src/utils/errorHandler.ts` (جدید)
- **قابل موازی‌سازی؟** بله

---

### فاز ۲: بهبود تجربه کاربری و ناوبری (P1)

#### FE-009: افزودن تب تیم/بازی/رقابت به ناوبری اصلی
- **عنوان:** کشف‌پذیری فیچرهای تیم، بازی و رقابت
- **شرح:** در Navbar یا Sidebar اصلی، لینک‌های مستقیم به صفحات Teams، Games و Competitions اضافه کن. این فیچرها الان وجود دارند اما پیدا نمی‌شوند.
- **شناسه ویژگی مرتبط:** فیچر ۲۰ (کشف‌پذیری تیم/بازی/رقابت)
- **اولویت:** P0
- **وابستگی:** —
- **معیار پذیرش:**
  - در Navbar موبایل و دسکتاپ، آیکون‌های Teams، Games و Competitions دیده شود
  - کلیک روی هر کدام مستقیماً به صفحه مربوطه برود
  - Badge تعداد بازی‌های فعال یا رقابت‌های جاری نمایش داده شود
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `src/components/layout/Navbar.tsx`, `src/components/layout/Sidebar.tsx`, `src/App.tsx`
- **قابل موازی‌سازی؟** بله

#### FE-010: پیاده‌سازی اسکن QR چک‌این
- **عنوان:** چک‌این رزرو با اسکن QR code
- **شرح:** در ManagerDashboard، دکمه «اسکن QR» اضافه کن که دوربین را باز کند و QR code رزرو را بخواند. پس از اسکن، رزرو را چک‌این کند.
- **شناسه ویژگی مرتبط:** فیچر ۲۲ (اسکن QR چک‌این)
- **اولویت:** P2
- **وابستگی:** BE-012 (endpoint checkin با QR)
- **معیار پذیرش:**
  - دوربین باز شود و QR code را تشخیص دهد
  - پس از اسکن، اطلاعات رزرو نمایش داده شود
  - مدیر تأیید کند و رزرو چک‌این شود
  - اگر رزرو متعلق به سالن دیگری باشد، خطای ۴۰۳ نمایش داده شود
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `src/pages/manager/ManagerCheckin.tsx`, `src/components/qr/QRScanner.tsx` (جدید)
- **قابل موازی‌سازی؟** خیر (باید بعد از BE-012 انجام شود)

#### FE-011: نمایش تاریخ شمسی سرتاسری
- **عنوان:** تبدیل تمام تاریخ‌ها به شمسی در UI
- **شرح:** از کتابخانه jalaali-js یا dayjs-jalali استفاده کن تا تمام تاریخ‌های نمایشی (رزروها، اسلات‌ها، قراردادها) به شمسی تبدیل شوند.
- **شناسه ویژگی مرتبط:** فیچر ۲۳ (تاریخ شمسی)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - تمام تاریخ‌ها در UI به فرمت شمسی (۱۴۰۳/۰۷/۱۵) نمایش داده شوند
  - تقویم انتخاب تاریخ در BookingForm شمسی باشد
  - در گزارش‌های مالی، تاریخ‌ها شمسی باشند
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `src/utils/dateFormatter.ts`, `src/components/ui/DatePicker.tsx`, تمام صفحات دارای تاریخ
- **قابل موازی‌سازی؟** بله

#### FE-012: بهبود تایپوگرافی فارسی و فونت Vazirmatn
- **عنوان:** بارگذاری صحیح فونت فارسی و تنظیمات تایپوگرافی
- **شرح:** فونت Vazirmatn را از assets لود کن و در globals.css تعریف کن. line-height، letter-spacing و font-weight را برای خوانایی بهتر تنظیم کن.
- **شناسه ویژگی مرتبط:** فیچر ۲۴ (تایپوگرافی فارسی)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - فونت Vazirmatn در تمام عناصر متنی اعمال شود
  - متن فارسی راست‌چین باشد
  - اعداد فارسی نمایش داده شوند (با font-feature-settings)
  - سایز فونت‌ها بر اساس مقیاس تایپوگرافی (۱۲، ۱۴، ۱۶، ۱۸، ۲۰، ۲۴، ۳۲) باشد
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `src/styles/globals.css`, `src/theme/typography.ts`
- **قابل موازی‌سازی؟** بله

#### FE-013: پیاده‌سازی حالت تاریک (Dark Mode)
- **عنوان:** پشتیبانی از تم تاریک با سوئیچ دستی
- **شرح:** با استفاده از MUI ThemeProvider و zustand store، امکان سوئیچ بین تم روشن و تاریک را اضافه کن. ترجیح کاربر را در localStorage ذخیره کن.
- **شناسه ویژگی مرتبط:** فیچر ۲۴ (دسترسی‌پذیری)
- **اولویت:** P2
- **وابستگی:** —
- **معیار پذیرش:**
  - دکمه سوئیچ تم در Navbar باشد
  - تمام کامپوننت‌ها در تم تاریک خوانا باشند
  - رنگ‌های contrast ratio حداقل ۴.۵:۱ داشته باشند
  - ترجیح کاربر در localStorage ذخیره و در بازدید بعدی اعمال شود
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `src/theme/darkTheme.ts` (جدید), `src/store/uiStore.ts`, `src/components/layout/Navbar.tsx`
- **قابل موازی‌سازی؟** بله

#### FE-014: بهبود دسترسی‌پذیری (Accessibility)
- **عنوان:** رعایت استانداردهای WCAG 2.1 سطح AA
- **شرح:** برای تمام دکمه‌ها aria-label اضافه کن، focus-visible state را استایل بده، keyboard navigation را تست کن و color contrast را اصلاح کن.
- **شناسه ویژگی مرتبط:** فیچر ۲۴ (دسترسی‌پذیری)
- **اولویت:** P1
- **وابستگی:** QA-015 (تست دسترسی‌پذیری)
- **معیار پذیرش:**
  - تمام interactive elements با کیبورد قابل دسترسی باشند
  - focus-visible outline واضح باشد
  - color contrast ratio حداقل ۴.۵:۱ برای متن معمولی
  - تصاویر alt text داشته باشند
  - فرم‌ها label مرتبط داشته باشند
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** تمام کامپوننت‌های interactive، `src/styles/globals.css`
- **قابل موازی‌سازی؟** بله

#### FE-015: پیاده‌سازی Infinite Scroll برای لیست‌های طولانی
- **عنوان:** بارگذاری تدریجی لیست‌ها با pagination
- **شرح:** در Venues، Bookings و Notifications، به جای load all، از infinite scroll با limit/offset استفاده کن. envelope API را مصرف کن.
- **شناسه ویژگی مرتبط:** فیچر ۱۷ (صفحه‌بندی یکدست)
- **اولویت:** P1
- **وابستگی:** BE-013 (pagination envelope در API)
- **معیار پذیرش:**
  - لیست‌ها با ۲۰ آیتم اول شروع شوند
  - با اسکرول به پایین، ۲۰ آیتم بعدی لود شوند
  - loading indicator نمایش داده شود
  - وقتی داده تمام شد، پیام «پایان لیست» نشان داده شود
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `src/pages/venues/Venues.tsx`, `src/pages/bookings/Bookings.tsx`, `src/hooks/useInfiniteScroll.ts` (جدید)
- **قابل موازی‌سازی؟** بله

---

### فاز ۳: بهینه‌سازی عملکرد و کیفیت (P1-P2)

#### FE-016: مهاجرت به React Query برای data fetching
- **عنوان:** جایگزینی service calls مستقیم با useQuery/useMutation
- **شرح:** به جای فراخوانی مستقیم service در صفحات، از @tanstack/react-query استفاده کن. caching، retry و background refetch را فعال کن.
- **شناسه ویژگی مرتبط:** فیچر ۲۵ (کیفیت کد)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - حداقل ۵ query اصلی (venues, bookings, notifications, profile, stats) با useQuery پیاده‌سازی شوند
  - mutation‌ها (create booking, cancel booking, update profile) با useMutation باشند
  - staleTime و cacheTime مناسب تنظیم شوند
  - error handling یکدست باشد
- **تلاش تخمینی:** L
- **فایل‌های تحت تأثیر:** `src/hooks/useVenues.ts` (جدید), `src/hooks/useBookings.ts` (جدید), تمام pages
- **قابل موازی‌سازی؟** بله (هر hook مستقل است)

#### FE-017: Code splitting و Lazy Loading صفحات
- **عنوان:** کاهش bundle size با بارگذاری تنبل صفحات
- **شرح:** از React.lazy و Suspense برای بارگذاری تنبل صفحات سنگین استفاده کن. route-based code splitting را پیاده‌سازی کن.
- **شناسه ویژگی مرتبط:** فیچر ۲۵ (عملکرد)
- **اولویت:** P2
- **وابستگی:** —
- **معیار پذیرش:**
  - initial bundle size زیر ۲۰۰KB باشد
  - صفحات Admin، ManagerDashboard و Finance lazy load شوند
  - loading skeleton نمایش داده شود
  - LCP زیر ۲.۵ ثانیه باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `src/App.tsx`, `src/components/ui/LoadingSkeleton.tsx` (جدید)
- **قابل موازی‌سازی؟** بله

#### FE-018: پیاده‌سازی Service Worker برای کش آفلاین
- **عنوان:** پشتیبانی از حالت آفلاین/شبکه ضعیف
- **شرح:** با Workbox یا hand-written SW، پاسخ‌های API مهم (venues list, user profile) را کش کن. fallback page برای حالت آفلاین بساز.
- **شناسه ویژگی مرتبط:** فیچر ۲۸ (رفتار آفلاین)
- **اولویت:** P2
- **وابستگی:** —
- **معیار پذیرش:**
  - لیست سالن‌ها و پروفایل کاربر در حالت آفلاین قابل مشاهده باشد
  - پیام «شما آفلاین هستید» نمایش داده شود
  - درخواست‌های queued هنگام بازگشت آنلاین ارسال شوند
  - fallback page با طراحی مناسب نمایش داده شود
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `src/service-worker.js` (جدید), `vite.config.ts`, `src/pages/OfflineFallback.tsx` (جدید)
- **قابل موازی‌سازی؟** بله

#### FE-019: افزودن Deep Linking برای نوتیفیکیشن‌ها
- **عنوان:** باز شدن صفحه مربوطه از نوتیفیکیشن
- **شرح:** وقتی کاربر روی نوتیفیکیشن کلیک می‌کند، مستقیماً به صفحه مربوطه (BookingDetail، VenueDetail، Competition) برود. از URL params استفاده کن.
- **شناسه ویژگی مرتبط:** فیچر ۱۸ (پوش نوتیفیکیشن)
- **اولویت:** P1
- **وابستگی:** BE-014 (payload نوتیفیکیشن با deep link)
- **معیار پذیرش:**
  - کلیک روی نوتیفیکیشن رزرو → BookingDetail باز شود
  - کلیک روی نوتیفیکیشن صف انتظار → WaitlistPage باز شود
  - اگر کاربر لاگین نیست، ابتدا به Login برود سپس redirect شود
  - در Tauri، deep link از OS دریافت و پردازش شود
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `src/App.tsx`, `src/pages/notifications/NotificationHandler.tsx` (جدید), `tauri.conf.json`
- **قابل موازی‌سازی؟** خیر (باید بعد از BE-014 انجام شود)

#### FE-020: پیاده‌سازی Error Boundary سراسری
- **عنوان:** جلوگیری از crash کامل اپ با خطاهای غیرمنتظره
- **شرح:** یک Error Boundary component بساز که خطاهای React را بگیرد، لاگ کند و UI fallback نمایش دهد. از Sentry یا logging service استفاده کن.
- **شناسه ویژگی مرتبط:** فیچر ۱۹ (Observability)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - خطاهای uncaught در کامپوننت‌ها گرفته شوند
  - صفحه fallback با پیام «مشکلی پیش آمده» نمایش داده شود
  - خطا با correlation-id لاگ شود
  - دکمه «گزارش خطا» برای ارسال voluntary report باشد
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `src/components/ErrorBoundary.tsx` (جدید), `src/App.tsx`, `src/utils/errorLogger.ts` (جدید)
- **قابل موازی‌سازی؟** بله

#### FE-021: بهبود فرم‌ها با React Hook Form + Zod
- **عنوان:** اعتبارسنجی قوی فرم‌ها با schema validation
- **شرح:** فرم‌های Register، BookingForm و ProfileEdit را با React Hook Form و Zod refactor کن. خطاهای validation real-time نمایش داده شوند.
- **شناسه ویژگی مرتبط:** فیچر ۱۲ (استحکام رمز)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - تمام فیلدها validation rule داشته باشند
  - خطاها inline و real-time نمایش داده شوند
  - password strength meter باشد
  - فرم submit نشده تا validation pass نکند
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `src/pages/auth/Register.tsx`, `src/components/forms/BookingForm.tsx`, `src/schemas/validationSchemas.ts` (جدید)
- **قابل موازی‌سازی؟** بله

#### FE-022: پیاده‌سازی Skeleton Loading برای UX بهتر
- **عنوان:** نمایش placeholder هنگام لود داده
- **شرح:** به جای spinner ساده، skeleton screens برای cards، lists و tables پیاده‌سازی کن. از framer-motion برای animation استفاده کن.
- **شناسه ویژگی مرتبط:** فیچر ۲۴ (تجربه کاربری)
- **اولویت:** P2
- **وابستگی:** —
- **معیار پذیرش:**
  - skeleton برای venue cards، booking rows و notification items باشد
  - animation smooth باشد (fade-in/out)
  - skeleton همان layout نهایی را تقلید کند
  - CLS (Cumulative Layout Shift) نزدیک صفر باشد
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `src/components/ui/Skeleton.tsx` (جدید), تمام pages با data fetching
- **قابل موازی‌سازی؟** بله

#### FE-023: افزودن Analytics و Event Tracking
- **عنوان:** ردیابی رفتار کاربر برای بهبود محصول
- **شرح:** event tracking برای actions مهم (click book, payment success, search) پیاده‌سازی کن. داده‌ها را به analytics service ارسال کن.
- **شناسه ویژگی مرتبط:** فیچر ۱۹ (Observability)
- **اولویت:** P2
- **وابستگی:** —
- **معیار پذیرش:**
  - events مهم track شوند (page_view, button_click, payment_complete)
  - user_id anonymized باشد
  - consent banner قبل از tracking نمایش داده شود
  - dashboard برای مشاهده metrics باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `src/utils/analytics.ts` (جدید), `src/components/analytics/ConsentBanner.tsx` (جدید)
- **قابل موازی‌سازی؟** بله

#### FE-024: پیاده‌سازی Responsive Design برای موبایل
- **عنوان:** بهینه‌سازی UI برای صفحات کوچک
- **شرح:** با Media Queries و Mobile-first approach، تمام صفحات را برای موبایل بهینه کن. touch targets حداقل ۴۴px باشند.
- **شناسه ویژگی مرتبط:** فیچر ۲۴ (تجربه کاربری)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - تمام صفحات در breakpoint‌های ۳۲۰px، ۷۶۸px و ۱۰۲۴px درست نمایش داده شوند
  - touch targets حداقل ۴۴×۴۴px باشند
  - horizontal scrolling نباشد
  - font sizes readable باشند (حداقل ۱۶px برای body)
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** تمام pages، `src/styles/responsive.css` (جدید)
- **قابل موازی‌سازی؟** بله

#### FE-025: بهبود Performance با Memoization
- **عنوان:** جلوگیری از re-render‌های غیرضروری
- **شرح:** از React.memo، useMemo و useCallback برای کامپوننت‌ها و توابع سنگین استفاده کن. React DevTools Profiler برای شناسایی bottlenecks استفاده کن.
- **شناسه ویژگی مرتبط:** فیچر ۲۵ (عملکرد)
- **اولویت:** P2
- **وابستگی:** —
- **معیار پذیرش:**
  - re-render‌های غیرضروری حذف شوند
  - TTI (Time to Interactive) زیر ۳ ثانیه باشد
  - FPS بالای ۵۰ در انیمیشن‌ها باشد
  - memory leaks نباشند
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** کامپوننت‌های سنگین (VenueCard، BookingList، DataTable)
- **قابل موازی‌سازی؟** بله

---

### فاز ۴: تست و کیفیت (P0-P1)

#### FE-026: نوشتن Unit Tests برای utility functions
- **عنوان:** پوشش تست برای توابع کمکی
- **شرح:** برای normalizeResponse، dateFormatter، errorHandler و validation schemas unit test بنویس. از Vitest استفاده کن.
- **شناسه ویژگی مرتبط:** فیچر ۲۶ (تست خودکار)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - حداقل ۸۰٪ پوشش برای utils/
  - edge cases تست شوند (null, undefined, empty string)
  - تست‌ها در CI اجرا شوند
  - false positives نباشند
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `src/utils/*.test.ts` (جدید), `vitest.config.ts` (جدید)
- **قابل موازی‌سازی؟** بله

#### FE-027: نوشتن Integration Tests برای جریان‌های کلیدی
- **عنوان:** تست端到端 ۵ جریان طلایی
- **شرح:** با Playwright یا Testing Library، جریان‌های ورود، جستجوی سالن، ساخت رزرو، پرداخت و لغو رزرو را تست کن.
- **شناسه ویژگی مرتبط:** فیچر ۲۶ (تست خودکار)
- **اولویت:** P0
- **وابستگی:** BE-015 (test database seeding)
- **معیار پذیرش:**
  - ۵ جریان طلایی تست شوند
  - تست‌ها در headless mode اجرا شوند
  - screenshots برای visual regression گرفته شوند
  - تست‌ها در CI gate باشند
- **تلاش تخمینی:** L
- **فایل‌های تحت تأثیر:** `tests/e2e/*.spec.ts` (جدید), `playwright.config.ts` (جدید)
- **قابل موازی‌سازی؟** خیر (باید بعد از BE-015 انجام شود)

#### FE-028: پیاده‌سازی Visual Regression Testing
- **عنوان:** مقایسه screenshot‌ها برای تشخیص تغییرات ناخواسته
- **شرح:** با Percy یا Chromatic، screenshot‌های baseline بگیر و در هر PR مقایسه کن. تغییرات ناخواسته UI را تشخیص بده.
- **شناسه ویژگی مرتبط:** فیچر ۲۶ (کیفیت UI)
- **اولویت:** P2
- **وابستگی:** —
- **معیار پذیرش:**
  - baseline برای صفحات کلیدی (Home، Venues، BookingDetail) گرفته شود
  - در هر PR، diff نمایش داده شود
  - threshold برای false positives تنظیم شود
  - approval workflow برای تغییرات عمدی باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `tests/visual/*.spec.ts` (جدید), `.github/workflows/visual-regression.yml` (جدید)
- **قابل موازی‌سازی؟** بله

#### FE-029: افزودن Linting و Static Analysis به CI
- **عنوان:** gate کیفیت کد در پایپ‌لاین CI
- **شرح:** ESLint با قوانین strict، Prettier برای formatting و TypeScript strict mode را به CI اضافه کن. PR با lint error merge نشود.
- **شناسه ویژگی مرتبط:** فیچر ۲۶ (کیفیت کد)
- **اولویت:** P0
- **وابستگی:** —
- **معیار پذیرش:**
  - `npm run lint` در CI اجرا شود
  - صفر lint error و warning باشد
  - TypeScript noImplicitAny فعال باشد
  - pre-commit hook با Husky setup شود
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `.eslintrc.json` (جدید), `.prettierrc` (جدید), `.github/workflows/ci.yml`
- **قابل موازی‌سازی؟** بله

#### FE-030: نوشتن Component Stories با Storybook
- **عنوان:** مستندسازی تعاملی کامپوننت‌ها
- **شرح:** برای کامپوننت‌های UI (Button، Card، Modal، Input) Storybook stories بنویس. props variants و states را نمایش بده.
- **شناسه ویژگی مرتبط:** فیچر ۲۶ (مستندسازی)
- **اولویت:** P2
- **وابستگی:** —
- **معیار پذیرش:**
  - حداقل ۱۰ کامپوننت story داشته باشند
  - variants (primary, secondary, disabled) نمایش داده شوند
  - accessibility addons فعال باشند
  - stories در CI deploy شوند
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `src/stories/*.stories.tsx` (جدید), `.storybook/` (جدید)
- **قابل موازی‌سازی؟** بله

---

### فاز ۵: Tauri-specific و Deployment (P1-P2)

#### FE-031: پیکربندی Tauri برای build production
- **عنوان:** آماده‌سازی اپ دسکتاپ برای انتشار
- **شرح:** tauri.conf.json را برای production configure کن. icon، splash screen و permissions را تنظیم کن. signing برای Windows/macOS setup کن.
- **شناسه ویژگی مرتبط:** فیچر ۱ (حقیقی‌سازی اپ)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - `tauri build` بدون خطا اجرا شود
  - binary برای Windows، macOS و Linux ساخته شود
  - icon و splash screen سفارشی باشد
  - auto-update channel configured باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `tauri.conf.json`, `src-tauri/tauri.conf.json`, `src-tauri/icons/`
- **قابل موازی‌سازی؟** بله

#### FE-032: پیاده‌سازی Auto-update برای Tauri
- **عنوان:** به‌روزرسانی خودکار اپ دسکتاپ
- **شرح:** با Tauri updater، نسخه جدید را چک کن، دانلود و نصب کن. release notes نمایش بده و از کاربر اجازه بگیر.
- **شناسه ویژگی مرتبط:** فیچر ۱ (تحویل)
- **اولویت:** P2
- **وابستگی:** FE-031
- **معیار پذیرش:**
  - در startup، نسخه جدید چک شود
  - اگر نسخه جدید باشد، dialog با release notes نمایش داده شود
  - دانلود در background انجام شود
  - نصب پس از restart انجام شود
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `src-tauri/src/main.rs`, `src/hooks/useAutoUpdate.ts` (جدید)
- **قابل موازی‌سازی؟** خیر (باید بعد از FE-031 انجام شود)

#### FE-033: بهینه‌سازی Bundle Size برای Tauri
- **عنوان:** کاهش حجم binary نهایی
- **شرح:** با tree-shaking، code splitting و حذف dependencies غیرضروری، حجم binary را کاهش بده. از vite-plugin-tauri استفاده کن.
- **شناسه ویژگی مرتبط:** فیچر ۲۵ (عملکرد)
- **اولویت:** P2
- **وابستگی:** FE-031
- **معیار پذیرش:**
  - binary size زیر ۱۰MB باشد
  - unused dependencies حذف شوند
  - assets optimize شوند (images compress شوند)
  - startup time زیر ۲ ثانیه باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `package.json`, `vite.config.ts`, `src-tauri/Cargo.toml`
- **قابل موازی‌سازی؟** بله

#### FE-034: پیاده‌سازی System Tray Icon برای Tauri
- **عنوان:** آیکون در system tray با منوی سریع
- **شرح:** آیکون app را در system tray نمایش بده. منوی context با گزینه‌های Open، Settings و Exit اضافه کن.
- **شناسه ویژگی مرتبط:** فیچر ۲۴ (تجربه کاربری دسکتاپ)
- **اولویت:** P2
- **وابستگی:** FE-031
- **معیار پذیرش:**
  - آیکون در tray نمایش داده شود
  - کلیک راست منوی context باز کند
  - double-click پنجره را باز/بسته کند
  - notification badge در tray باشد
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `src-tauri/src/main.rs`, `src-tauri/tray.rs` (جدید)
- **قابل موازی‌سازی؟** بله

#### FE-035: پیاده‌سازی Native Notifications در Tauri
- **عنوان:** اعلان‌های سیستم‌عامل برای رویدادها
- **شرح:** از Tauri notification API برای نمایش native notifications استفاده کن. وقتی رزرو تأیید می‌شود یا نوبت صف انتظار می‌رسد، notification نمایش بده.
- **شناسه ویژگی مرتبط:** فیچر ۱۸ (پوش نوتیفیکیشن)
- **اولویت:** P1
- **وابستگی:** BE-014 (websocket notifications)
- **معیار پذیرش:**
  - notification native OS نمایش داده شود
  - کلیک روی notification اپ را باز کند
  - permission request در اولین استفاده باشد
  - sound/vibration optional باشد
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `src-tauri/src/main.rs`, `src/services/notificationService.ts`
- **قابل موازی‌سازی؟** بله

---

### فاز ۶: امنیت و Hardening (P0)

#### FE-036: پیاده‌سازی Content Security Policy (CSP)
- **عنوان:** جلوگیری از XSS با CSP headers
- **شرح:** CSP headers را در vite config و Tauri setup کن. فقط منابع مجاز (self، CDN‌های trusted) لود شوند. inline scripts ممنوع باشند.
- **شناسه ویژگی مرتبط:** فیچر ۱۱ (گارد اسرار)
- **اولویت:** P0
- **وابستگی:** —
- **معیار پذیرش:**
  - CSP header در response باشد
  - inline scripts کار نکنند
  - فقط domains مجاز لود شوند
  - report-only mode برای تست باشد
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `vite.config.ts`, `index.html`, `src-tauri/tauri.conf.json`
- **قابل موازی‌سازی؟** بله

#### FE-037: Sanitization ورودی‌های کاربر
- **عنوان:** جلوگیری از Injection attacks
- **شرح:** تمام ورودی‌های کاربر (search, forms, URL params) را sanitize کن. از DOMPurify برای HTML content استفاده کن. SQL injection prevention در client-side validation.
- **شناسه ویژگی مرتبط:** فیچر ۱۲ (امنیت)
- **اولویت:** P0
- **وابستگی:** —
- **معیار پذیرش:**
  - XSS payloads neutralize شوند
  - HTML content sanitize شود
  - URL params validate شوند
  - error messages leak نکنند
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `src/utils/sanitize.ts` (جدید), تمام form components
- **قابل موازی‌سازی؟** بله

#### FE-038: Secure Storage برای توکن‌ها در Tauri
- **عنوان:** ذخیره امن توکن‌ها با encryption
- **شرح:** به جای localStorage، از Tauri secure storage یا encrypted file برای ذخیره توکن‌ها استفاده کن. keys را در OS keychain ذخیره کن.
- **شناسه ویژگی مرتبط:** فیچر ۱۰ (امنیت نشست)
- **اولویت:** P0
- **وابستگی:** FE-002 (Refresh Token)
- **معیار پذیرش:**
  - توکن‌ها encrypt شوند
  - keys در OS keychain باشند
  - token rotation secure باشد
  - logout tokens را پاک کند
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `src-tauri/src/secure_storage.rs` (جدید), `src/store/authStore.ts`
- **قابل موازی‌سازی؟** خیر (باید بعد از FE-002 انجام شود)

#### FE-039: پیاده‌سازی Rate Limiting در Client
- **عنوان:** جلوگیری از spam requests
- **شرح:** برای actions حساس (login attempts, booking creation, payment) rate limiting در client پیاده‌سازی کن. با exponential backoff retry کن.
- **شناسه ویژگی مرتبط:** فیچر ۱۲ (استحکام)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - login attempts محدود شوند (۵ بار در دقیقه)
  - booking creation debounce شود
  - payment retry با backoff باشد
  - پیام مناسب به کاربر نمایش داده شود
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `src/utils/rateLimiter.ts` (جدید), `src/services/api.ts`
- **قابل موازی‌سازی؟** بله

#### FE-040: Audit Logging برای Actions حساس
- **عنوان:** ثبت لاگ اقدامات کاربر برای امنیت
- **شرح:** actions حساس (login, payment, profile change, password reset) را لاگ کن. timestamp، IP و user agent را ثبت کن.
- **شناسه ویژگی مرتبط:** فیچر ۱۹ (Observability)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - actions حساس لاگ شوند
  - لاگ‌ها immutable باشند
  - admin بتواند لاگ‌ها را ببیند
  - GDPR compliance (user can request deletion)
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `src/utils/auditLogger.ts` (جدید), `src/pages/admin/AuditLogs.tsx` (جدید)
- **قابل موازی‌سازی؟** بله

---

### فاز ۷: Features تکمیلی (P1-P2)

#### FE-041: پیاده‌سازی Favorites با Backend Sync
- **عنوان:** همگام‌سازی علاقه‌مندی‌ها با سرور
- **شرح:** favoritesStore فعلی فقط localStorage است. endpoint بک‌اند را مصرف کن تا favorites بین دستگاه‌ها sync شوند.
- **شناسه ویژگی مرتبط:** فیچر ۲ (اتصال واقعی)
- **اولویت:** P1
- **وابستگی:** BE-016 (favorites backend endpoint)
- **معیار پذیرش:**
  - add/remove favorite با API sync شود
  - offline changes queue شوند
  - conflicts resolve شوند
  - performance impact minimal باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `src/store/favoritesStore.ts`, `src/services/favoriteService.ts` (جدید)
- **قابل موازی‌سازی؟** خیر (باید بعد از BE-016 انجام شود)

#### FE-042: پیاده‌سازی Search History با Persist
- **عنوان:** ذخیره و نمایش تاریخچه جستجو
- **شرح:** جستجوهای اخیر کاربر را ذخیره کن و در dropdown search نمایش بده. قابلیت clear history و pin searches باشد.
- **شناسه ویژگی مرتبط:** فیچر ۲۴ (تجربه کاربری)
- **اولویت:** P2
- **وابستگی:** —
- **معیار پذیرش:**
  - آخرین ۱۰ جستجو ذخیره شود
  - در search input suggestions نمایش داده شود
  - کاربر بتواند history را پاک کند
  - searches pin شوند
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `src/store/searchHistoryStore.ts`, `src/components/search/SearchInput.tsx`
- **قابل موازی‌سازی؟** بله

#### FE-043: پیاده‌سازی Recently Viewed Venues
- **عنوان:** نمایش سالن‌های اخیراً مشاهده‌شده
- **شرح:** وقتی کاربر venue detail را باز می‌کند، آن را به recently viewed اضافه کن. در پروفایل یا home صفحه نمایش بده.
- **شناسه ویژگی مرتبط:** فیچر ۲۴ (تجربه کاربری)
- **اولویت:** P2
- **وابستگی:** —
- **معیار پذیرش:**
  - آخرین ۵ venue ذخیره شود
  - duplicates حذف شوند
  - در UI نمایش داده شود
  - click-through rate track شود
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `src/store/recentlyViewedStore.ts`, `src/pages/profile/Profile.tsx`
- **قابل موازی‌سازی؟** بله

#### FE-044: پیاده‌سازی Referral System UI
- **عنوان:** رابط کاربری سیستم معرفی دوستان
- **شرح:** در پروفایل، بخش «معرفی به دوستان» اضافه کن. referral code تولید کن، لینک share و reward tracking نمایش بده.
- **شناسه ویژگی مرتبط:** فیچر ۹ (پیشنهاد ویژه)
- **اولویت:** P2
- **وابستگی:** BE-017 (referral backend)
- **معیار پذیرش:**
  - referral code منحصر به فرد تولید شود
  - لینک share با social media باشد
  - rewards tracking نمایش داده شود
  - invitees list باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `src/pages/profile/Referral.tsx` (جدید), `src/services/referralService.ts` (جدید)
- **قابل موازی‌سازی؟** خیر (باید بعد از BE-017 انجام شود)

#### FE-045: پیاده‌سازی Help Center و FAQ
- **عنوان:** مرکز راهنمایی و سوالات متداول
- **شرح:** صفحه FAQ با دسته‌بندی (رزرو، پرداخت، حساب کاربری) بساز. search در FAQs و contact support form باشد.
- **شناسه ویژگی مرتبط:** فیچر ۲۴ (تجربه کاربری)
- **اولویت:** P2
- **وابستگی:** —
- **معیار پذیرش:**
  - FAQs دسته‌بندی شوند
  - search در FAQs کار کند
  - contact form submission باشد
  - articles view count track شود
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `src/pages/help/HelpCenter.tsx` (جدید), `src/components/faq/FAQAccordion.tsx` (جدید)
- **قابل موازی‌سازی؟** بله

#### FE-046: پیاده‌سازی Feedback Widget
- **عنوان:** ویجت بازخورد کاربر در گوشه صفحه
- **شرح:** دکمه floating feedback در گوشه صفحه اضافه کن. فرم بازخورد با rating، comment و screenshot upload باشد.
- **شناسه ویژگی مرتبط:** فیچر ۱۹ (Observability)
- **اولویت:** P2
- **وابستگی:** BE-018 (feedback endpoint)
- **معیار پذیرش:**
  - widget همیشه accessible باشد
  - فرم با validation باشد
  - screenshot attach شود
  - thank you message نمایش داده شود
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `src/components/feedback/FeedbackWidget.tsx` (جدید), `src/services/feedbackService.ts` (جدید)
- **قابل موازی‌سازی؟** خیر (باید بعد از BE-018 انجام شود)

#### FE-047: پیاده‌سازی Multi-language Support (i18n)
- **عنوان:** پشتیبانی از چند زبان (فارسی/انگلیسی)
- **شرح:** با react-i18next، سیستم چندزبانه پیاده‌سازی کن. language switcher در navbar باشد. RTL/LTR auto-detect شود.
- **شناسه ویژگی مرتبط:** فیچر ۲۴ (دسترسی‌پذیری)
- **اولویت:** P2
- **وابستگی:** —
- **معیار پذیرش:**
  - تمام متون ترجمه شوند
  - language switcher کار کند
  - RTL/LTR auto-apply شود
  - locale در URL یا preference ذخیره شود
- **تلاش تخمینی:** L
- **فایل‌های تحت تأثیر:** `src/i18n/` (جدید), تمام components با text
- **قابل موازی‌سازی؟** بله

#### FE-048: پیاده‌سازی Onboarding Tour برای کاربران جدید
- **عنوان:** تور راهنمای اولیه برای آشنایی با اپ
- **شرح:** با react-joyride یا similar، tour تعاملی برای کاربران جدید بساز. مراحل اصلی (جستجو، رزرو، پرداخت) را آموزش بده.
- **شناسه ویژگی مرتبط:** فیچر ۲۴ (تجربه کاربری)
- **اولویت:** P2
- **وابستگی:** —
- **معیار پذیرش:**
  - tour در اولین ورود نمایش داده شود
  - skip option باشد
  - progress save شود
  - completion rate track شود
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `src/components/onboarding/OnboardingTour.tsx` (جدید), `src/store/onboardingStore.ts` (جدید)
- **قابل موازی‌سازی؟** بله

#### FE-049: پیاده‌سازی Gamification Elements
- **عنوان:** المان‌های بازی‌وارسازی برای engagement
- **شرح:** badges برای achievements (اولین رزرو، ۱۰ رزرو، refer friend)، points system و leaderboard اضافه کن.
- **شناسه ویژگی مرتبط:** فیچر ۹ (پیشنهاد ویژه)
- **اولویت:** P2
- **وابستگی:** BE-019 (gamification backend)
- **معیار پذیرش:**
  - badges earned شوند
  - points accumulate شوند
  - leaderboard نمایش داده شود
  - rewards redeem شوند
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `src/pages/profile/Gamification.tsx` (جدید), `src/components/badges/BadgeDisplay.tsx` (جدید)
- **قابل موازی‌سازی؟** خیر (باید بعد از BE-019 انجام شود)

#### FE-050: پیاده‌سازی Accessibility Audit Fixes
- **عنوان:** رفع مشکلات دسترسی‌پذیری شناسایی‌شده
- **شرح:** نتایج audit دسترسی‌پذیری (QA-015) را بررسی و رفع کن. screen reader compatibility، keyboard traps و ARIA labels را اصلاح کن.
- **شناسه ویژگی مرتبط:** فیچر ۲۴ (دسترسی‌پذیری)
- **اولویت:** P1
- **وابستگی:** QA-015 (تست دسترسی‌پذیری)
- **معیار پذیرش:**
  - صفر critical accessibility issues باشد
  - WCAG 2.1 Level AA compliance باشد
  - screen reader tests pass شوند
  - keyboard navigation کامل باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** تمام components با accessibility issues
- **قابل موازی‌سازی؟** خیر (باید بعد از QA-015 انجام شود)

---

## خلاصه وابستگی‌ها بین ترک‌ها

| Task ID | Depends On Backend Tasks | Notes |
|---------|-------------------------|-------|
| FE-002 | BE-006 | Refresh Token endpoint |
| FE-004 | BE-007 | CORS configuration |
| FE-005 | BE-008, BE-009 | Payment gateway integration |
| FE-006 | BE-010 | Coupon validation |
| FE-007 | BE-011 | Waitlist endpoints |
| FE-010 | BE-012 | QR checkin endpoint |
| FE-015 | BE-013 | Pagination envelope |
| FE-019 | BE-014 | Notification deep link payload |
| FE-027 | BE-015 | Test database seeding |
| FE-038 | FE-002 | Secure storage after refresh token |
| FE-041 | BE-016 | Favorites backend sync |
| FE-044 | BE-017 | Referral system |
| FE-046 | BE-018 | Feedback endpoint |
| FE-049 | BE-019 | Gamification backend |
| FE-050 | QA-015 | Accessibility audit results |

---

## ماتریس اولویت‌ها

| اولویت | تعداد وظایف | درصد کل | توضیح |
|--------|-------------|---------|-------|
| P0 | ۱۲ | ۲۴٪ | حیاتی برای launch |
| P1 | ۲۲ | ۴۴٪ | مهم برای UX و کیفیت |
| P2 | ۱۶ | ۳۲٪ | بهبودهای تکمیلی |

## تخمین تلاش کلی

| اندازه | تعداد وظایف | مجموع تخمینی |
|--------|-------------|---------------|
| S | ۱۴ | ~۱۴ نفر-روز |
| M | ۲۴ | ~۴۸ نفر-روز |
| L | ۱۲ | ~۶۰ نفر-روز |
| **کل** | **۵۰** | **~۱۲۲ نفر-روز** |

---

**تهیه‌شده توسط:** تیم توسعه فرانت‌اند  
**تاریخ بازبینی بعدی:** ۲۰۲۶-۱۰-۱۵  
**وضعیت:** در حال اجرا
