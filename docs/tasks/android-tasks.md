# سند وظایف اندروید (Flutter) — فاز ۲۷

> **تاریخ:** ۲۰۲۶-۱۰-۰۸ | **دامنه:** `android/` (Flutter + GoRouter + Riverpod)  
> **هدف:** تبدیل اپ موبایل از «نیمه‌کاره با داده جعلی» به «اپ واقعی متصل به API با تجربه کاربری عالی»  
> **معیار موفقیت:** APK امضاشده با release keystore، صفر mock data، ۵ جریان طلایی تست‌شده، پوش نوتیفیکیشن فعال، تاریخ شمسی سرتاسری

---

## فهرست وظایف بر اساس فاز

### فاز ۱: حقیقی‌سازی و تک‌پروژه‌سازی (P0)

#### AND-001: ادغام دو پروژه فلاتر و حذف ریشه نیمه‌کاره
- **عنوان:** یکپارچه‌سازی salon_app واقعی و حذف lib/ ریشه
- **شرح:** تصمیم بگیر کدام پروژه نگه داشته شود (پیشنهاد: `android/salon_app`). پروژه ریشه (`lib/` با mock_token) را حذف یا به نمونه آموزشی تبدیل کن. CI را طوری تغییر بده که از پروژه واقعی build بگیرد.
- **شناسه ویژگی مرتبط:** فیچر ۱ (تک‌پروژه‌سازی)
- **اولویت:** P0
- **وابستگی:** —
- **معیار پذیرش:**
  - دقیقاً یک `pubspec.yaml` زنده در مسیر build باشد
  - `flutter analyze` روی پروژه واقعی صفر خطا بدهد
  - CI از مسیر درست build بگیرد
  - applicationId نهایی `com.salon.salon_app` باشد
- **تلاش تخمینی:** L
- **فایل‌های تحت تأثیر:** `pubspec.yaml`, `lib/`, `.github/workflows/flutter-build.yml`, `AGENT_BUILD_STATE.md`
- **قابل موازی‌سازی؟** خیر (این اولین کار باید باشد)

#### AND-002: حذف تمام داده‌های جعلی و شبیه‌سازی API
- **عنوان:** پاکسازی mock data و اتصال واقعی به بک‌اند
- **شرح:** تمام رشته‌های `mock_token_123`، `Simulate API call` و داده‌های ساختگی را از کد حذف کن. ApiService را طوری configure کن که واقعاً به بک‌اند وصل شود.
- **شناسه ویژگی مرتبط:** فیچر ۲ (اتصال واقعی)
- **اولویت:** P0
- **وابستگی:** AND-001, BE-005 (احراز هویت JWT)
- **معیار پذیرش:**
  - `grep -rn "mock_token\|Simulate API" android/lib/` خالی باشد
  - پنج جریان اصلی (ورود، لیست سالن، جزئیات+اسلات، ساخت رزرو، لیست رزروها) با API زنده کار کنند
  - ردپای درخواست‌ها در لاگ بک‌اند دیده شود
  - خطای ۴۰۱/۵۰۰ پیام فارسی مناسب نشان دهد
- **تلاش تخمینی:** L
- **فایل‌های تحت تأثیر:** `lib/screens/auth/login_screen.dart`, `lib/core/services/api_service.dart`, `lib/screens/bookings/booking_create_screen.dart`
- **قابل موازی‌سازی؟** خیر (باید بعد از AND-001 انجام شود)

#### AND-003: پیکربندی Build Flavors برای Dev/Staging/Production
- **عنوان:** جداسازی environment‌ها با flavors
- **شرح:** سه flavor (dev, staging, prod) با baseUrl متفاوت configure کن. dev به localhost، staging به سرور تست و prod به دامنه رسمی وصل شود.
- **شناسه ویژگی مرتبط:** فیچر ۲ (اتصال واقعی)
- **اولویت:** P0
- **وابستگی:** AND-001
- **معیار پذیرش:**
  - `flutter run --flavor dev` به localhost:8000 وصل شود
  - `flutter run --flavor staging` به سرور تست وصل شود
  - `flutter build apk --flavor prod` binary production بسازد
  - آدرس‌ها در build-time inject شوند، نه hardcode
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `android/app/build.gradle.kts`, `lib/core/config/environment.dart` (جدید), `lib/main_dev.dart`, `lib/main_prod.dart`
- **قابل موازی‌سازی؟** بله

#### AND-004: پیاده‌سازی Release Keystore برای امضای APK
- **عنوان:** امضای دیجیتال اپ برای انتشار در Play Store
- **شرح:** keystore تولید کن و در CI secrets ذخیره کن. build.gradle را طوری configure کن که در CI با keystore release امضا شود. هیچ رمز/کلیدی در ریپو نباشد.
- **شناسه ویژگی مرتبط:** فیچر ۴ (امضای انتشار)
- **اولویت:** P0
- **وابستگی:** AND-001
- **معیار پذیرش:**
  - `apksigner verify --print-certs` گواهی release را نشان دهد
  - هیچ کلید/رمز در ریپو یا لاگ ظاهر نشود
  - AAB برای Play ساخته و امضا شود
  - مسیر بازیابی/چرخش کلید مستند شود
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `android/app/build.gradle.kts`, `.github/workflows/flutter-build.yml`, `ANDROID_BUILD.md`
- **قابل موازی‌سازی؟** خیر (باید بعد از AND-001 انجام شود)

#### AND-005: تنظیم هویت بسته (Application ID، نام فارسی، آیکون)
- **عنوان:** برندینگ اپ با نام، آیکون و اسپلش فارسی
- **شرح:** applicationId را به `com.salon.salon_app` تغییر بده. نام فارسی «سالن» را در AndroidManifest تنظیم کن. آیکون adaptive و splash screen سفارشی اضافه کن.
- **شناسه ویژگی مرتبط:** فیچر ۵ (هویت بسته)
- **اولویت:** P1
- **وابستگی:** AND-001, AND-004
- **معیار پذیرش:**
  - `aapt2 dump badging` application-label فارسی نشان دهد
  - package name `com.salon.salon_app` باشد
  - آیکون adaptive icon باشد
  - splash screen با لوگوی برند نمایش داده شود
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `android/app/build.gradle.kts`, `android/app/src/main/AndroidManifest.xml`, `android/app/src/main/res/`, `assets/`
- **قابل موازی‌سازی؟** بله

#### AND-006: بارگذاری فونت Vazirmatn و تنظیم تایپوگرافی
- **عنوان:** پشتیبانی کامل از تایپوگرافی فارسی
- **شرح:** فونت Vazirmatn را در assets قرار بده و در pubspec.yaml تعریف کن. Theme را طوری configure کن که تمام متون فارسی راست‌چین و با فونت صحیح باشند. اعداد فارسی نمایش داده شوند.
- **شناسه ویژگی مرتبط:** فیچر ۲۴ (تایپوگرافی فارسی)
- **اولویت:** P1
- **وابستگی:** AND-001
- **معیار پذیرش:**
  - فونت Vazirmatn در تمام Text widgets اعمال شود
  - متن فارسی RTL باشد
  - اعداد فارسی با font-feature-settings نمایش داده شوند
  - سایز فونت‌ها بر اساس مقیاس تایپوگرافی باشد
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `pubspec.yaml`, `assets/fonts/`, `lib/core/theme/text_theme.dart`
- **قابل موازی‌سازی؟** بله

#### AND-007: پیاده‌سازی Refresh Token و مدیریت نشست
- **عنوان:** چرخه کامل نشست با Access و Refresh Token
- **شرح:** HttpClient interceptor را طوری تغییر بده که روی ۴۰۱ ابتدا `/auth/refresh` را صدا بزند، سپس درخواست اصلی را تکرار کند. توکن‌ها را در flutter_secure_storage ذخیره کن.
- **شناسه ویژگی مرتبط:** فیچر ۱۰ (امنیت نشست)
- **اولویت:** P0
- **وابستگی:** BE-006 (endpoint refresh token)
- **معیار پذیرش:**
  - درخواستی که در دقیقه ۲۰ باز می‌شود بدون دیدن صفحه لاگین بازیابی شود
  - `/auth/logout` همه توکن‌ها را ابطال کند
  - هر تغییر رمز، refresh‌های قبلی را باطل کند
  - توکن‌ها encrypt شوند
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `lib/core/services/http_interceptor.dart`, `lib/core/services/auth_service.dart`, `lib/core/storage/secure_storage.dart`
- **قابل موازی‌سازی؟** خیر (باید بعد از BE-006 انجام شود)

#### AND-008: همگام‌سازی قرارداد API با بک‌اند
- **عنوان:** نرمال‌سازی پاسخ‌های snake_case به camelCase
- **شرح:** مدل‌های Dart را طوری update کن که با پاسخ‌های snake_case بک‌اند سازگار باشند. از json_serializable با field renaming استفاده کن.
- **شناسه ویژگی مرتبط:** فیچر ۲ (اتصال واقعی)
- **اولویت:** P0
- **وابستگی:** —
- **معیار پذیرش:**
  - تمام مدل‌ها (User, Venue, Booking, Payment) با بک‌اند سازگار باشند
  - payload‌های ارسالی snake_case باشند
  - تست با حداقل ۳ endpoint مختلف
  - صفر runtime error در parsing JSON
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `lib/core/models/*.dart`, `lib/core/services/api_service.dart`
- **قابل موازی‌سازی؟** بله

---

### فاز ۲: پیاده‌سازی صفحات و فیچرهای اصلی (P0-P1)

#### AND-009: پیاده‌سازی صفحه ورود و ثبت‌نام واقعی
- **عنوان:** اتصال فرم‌های Auth به API بک‌اند
- **شرح:** LoginScreen و RegisterScreen را طوری تغییر بده که واقعاً به `/api/v1/auth/login` و `/register` وصل شوند. اعتبارسنجی فرم با form_validation پیاده‌سازی کن.
- **شناسه ویژگی مرتبط:** فیچر ۲ (اتصال واقعی)
- **اولویت:** P0
- **وابستگی:** AND-002, AND-007
- **معیار پذیرش:**
  - ورود با شماره موبایل و رمز واقعی کار کند
  - ثبت‌نام با validation (رمز حداقل ۸ کاراکتر، شماره معتبر) باشد
  - OTP verification flow کامل باشد
  - خطاهای API با پیام فارسی نمایش داده شوند
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `lib/features/auth/screens/login_screen.dart`, `lib/features/auth/screens/register_screen.dart`, `lib/features/auth/providers/auth_provider.dart`
- **قابل موازی‌سازی؟** بله

#### AND-010: پیاده‌سازی صفحه لیست سالن‌ها با Infinite Scroll
- **عنوان:** نمایش سالن‌ها با pagination و فیلتر
- **شرح:** VenuesScreen را با infinite scroll پیاده‌سازی کن. فیلترهای location، price range و amenities اضافه کن. از envelope API استفاده کن.
- **شناسه ویژگی مرتبط:** فیچر ۱۷ (صفحه‌بندی یکدست)
- **اولویت:** P1
- **وابستگی:** BE-013 (pagination envelope)
- **معیار پذیرش:**
  - لیست با ۲۰ آیتم اول شروع شود
  - با اسکرول به پایین، ۲۰ آیتم بعدی لود شود
  - loading indicator نمایش داده شود
  - فیلترها اعمال شوند
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `lib/features/venues/screens/venues_screen.dart`, `lib/features/venues/providers/venue_provider.dart`, `lib/core/widgets/infinite_scroll_list.dart` (جدید)
- **قابل موازی‌سازی؟** بله

#### AND-011: پیاده‌سازی صفحه جزئیات سالن و انتخاب اسلات
- **عنوان:** نمایش اطلاعات سالن و رزرو اسلات
- **شرح:** VenueDetailScreen را کامل کن. تصاویر، امکانات، نظرات و اسلات‌های قابل رزرو را نمایش بده. تقویم شمسی برای انتخاب تاریخ باشد.
- **شناسه ویژگی مرتبط:** فیچر ۲ (اتصال واقعی)
- **اولویت:** P0
- **وابستگی:** AND-006 (فونت فارسی), BE-020 (slots endpoint)
- **معیار پذیرش:**
  - تصاویر سالن با carousel نمایش داده شوند
  - اسلات‌های available برجسته شوند
  - تقویم شمسی برای انتخاب تاریخ باشد
  - دکمه رزرو به BookingCreateScreen برود
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `lib/features/venues/screens/venue_detail_screen.dart`, `lib/features/slots/widgets/slot_calendar.dart`
- **قابل موازی‌سازی؟** بله

#### AND-012: پیاده‌سازی جریان ساخت رزرو
- **عنوان:** ایجاد رزرو جدید با تأیید نهایی
- **شرح:** BookingCreateScreen را پیاده‌سازی کن. کاربر سالن، تاریخ، ساعت و مدت را انتخاب کند. قبل از پرداخت، summary نمایش داده شود.
- **شناسه ویژگی مرتبط:** فیچر ۲ (اتصال واقعی)
- **اولویت:** P0
- **وابستگی:** AND-011
- **معیار پذیرش:**
  - انتخاب venue، date و time slot باشد
  - قیمت نهایی محاسبه و نمایش داده شود
  - confirmation dialog قبل از submit باشد
  - پس از موفقیت، به BookingDetail برود
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `lib/features/bookings/screens/booking_create_screen.dart`, `lib/features/bookings/providers/booking_provider.dart`
- **قابل موازی‌سازی؟** بله

#### AND-013: پیاده‌سازی درگاه پرداخت واقعی
- **عنوان:** ادغام درگاه پرداخت در جریان رزرو
- **شرح:** PaymentDialog را طوری تغییر بده که کاربر را به درگاه واقعی هدایت کند. WebView یا deep link به اپ بانک استفاده کن. webhook را دریافت و وضعیت را update کن.
- **شناسه ویژگی مرتبط:** فیچر ۳ (درگاه پرداخت واقعی)
- **اولویت:** P0
- **وابستگی:** BE-008 (endpoint پرداخت), BE-009 (webhook)
- **معیار پذیرش:**
  - پرداخت واقعی از اپ تا پایان کار کند
  - WebView یا app switch به درگاه باشد
  - بازگشت از درگاه handled شود
  - فیش پرداخت با QR code نمایش داده شود
- **تلاش تخمینی:** L
- **فایل‌های تحت تأثیر:** `lib/features/payments/screens/payment_screen.dart`, `lib/features/payments/providers/payment_provider.dart`, `lib/core/widgets/webview_payment.dart` (جدید)
- **قابل موازی‌سازی؟** خیر (باید بعد از BE-008 و BE-009 انجام شود)

#### AND-014: پیاده‌سازی صفحه لیست رزروها
- **عنوان:** نمایش رزروهای upcoming و past
- **شرح:** BookingsScreen را با تب‌های Upcoming و Past پیاده‌سازی کن. هر رزرو status، venue، date و action buttons (cancel, view detail) داشته باشد.
- **شناسه ویژگی مرتبط:** فیچر ۲ (اتصال واقعی)
- **اولویت:** P0
- **وابستگی:** —
- **معیار پذیرش:**
  - تب‌های Upcoming/Past جدا باشند
  - هر رزرو کارت با اطلاعات کامل باشد
  - دکمه لغو برای رزروهای pending باشد
  - infinite scroll برای لیست طولانی باشد
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `lib/features/bookings/screens/bookings_screen.dart`, `lib/features/bookings/widgets/booking_card.dart`
- **قابل موازی‌سازی؟** بله

#### AND-015: پیاده‌سازی صفحه جزئیات رزرو
- **عنوان:** نمایش کامل اطلاعات رزرو و actions
- **شرح:** BookingDetailScreen را پیاده‌سازی کن. تمام اطلاعات رزرو، فیش پرداخت، QR code check-in و action buttons (cancel, share) نمایش داده شود.
- **شناسه ویژگی مرتبط:** فیچر ۲ (اتصال واقعی)
- **اولویت:** P0
- **وابستگی:** AND-014
- **معیار پذیرش:**
  - تمام فیلدهای رزرو نمایش داده شوند
  - QR code برای check-in باشد
  - فیش پرداخت downloadable باشد
  - دکمه لغو با confirmation dialog باشد
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `lib/features/bookings/screens/booking_detail_screen.dart`, `lib/core/widgets/qr_code_display.dart`
- **قابل موازی‌سازی؟** بله

#### AND-016: پیاده‌سازی داشبورد مدیر سالن
- **عنوان:** پنل مدیریت برای venue managers
- **شرح:** ManagerDashboardScreen را پیاده‌سازی کن. آمار رزروها، درآمد، اسلات‌های امروز و pending bookings نمایش داده شود.
- **شناسه ویژگی مرتبط:** فیچر ۲ (اتصال واقعی)
- **اولویت:** P1
- **وابستگی:** BE-021 (manager stats endpoint)
- **معیار پذیرش:**
  - آمار کلی (تعداد رزرو، درآمد ماهانه) نمایش داده شود
  - لیست pending bookings با action buttons باشد
  - اسلات‌های امروز برجسته شوند
  - نمودار درآمد هفتگی باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `lib/features/dashboard/screens/manager_dashboard_screen.dart`, `lib/features/dashboard/providers/stats_provider.dart`
- **قابل موازی‌سازی؟** بله

#### AND-017: پیاده‌سازی صفحه رقابت‌های قیمتی
- **عنوان:** شرکت در bidding برای اسلات‌ها
- **شرح:** CompetitionsScreen را پیاده‌سازی کن. لیست رقابت‌های active، پیشنهاد قیمت و status tracking باشد.
- **شناسه ویژگی مرتبط:** فیچر ۲۰ (کشف‌پذیری رقابت)
- **اولویت:** P1
- **وابستگی:** BE-022 (competitions endpoint)
- **معیار پذیرش:**
  - لیست رقابت‌های active باشد
  - bid placement با validation باشد
  - best offer نمایش داده شود
  - countdown timer برای expiry باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `lib/features/competitions/screens/competitions_screen.dart`, `lib/features/competitions/providers/competition_provider.dart`
- **قابل موازی‌سازی؟** بله

#### AND-018: پیاده‌سازی صفحه تیم‌ها و بازی‌ها
- **عنوان:** مدیریت تیم و شرکت در بازی‌ها
- **شرح:** TeamsScreen و GamesScreen را پیاده‌سازی کن. ایجاد تیم، دعوت اعضا، join game و match history باشد.
- **شناسه ویژگی مرتبط:** فیچر ۲۰ (کشف‌پذیری تیم/بازی)
- **اولویت:** P1
- **وابستگی:** BE-023 (teams/games endpoints)
- **معیار پذیرش:**
  - ایجاد و مدیریت تیم باشد
  - invite members با لینک یا شماره باشد
  - join/open games لیست شوند
  - match history با نتایج باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `lib/features/teams/screens/teams_screen.dart`, `lib/features/games/screens/games_screen.dart`
- **قابل موازی‌سازی؟** بله

#### AND-019: پیاده‌سازی صف انتظار
- **عنوان:** ثبت‌نام در waitlist برای اسلات‌های پر
- **شرح:** WaitlistScreen را پیاده‌سازی کن. وقتی اسلات‌ها پر هستند، کاربر تاریخ و زمان دلخواه را انتخاب و ثبت‌نام کند. شماره نوبت و estimated time نمایش داده شود.
- **شناسه ویژگی مرتبط:** فیچر ۲۱ (صف انتظار در موبایل)
- **اولویت:** P1
- **وابستگی:** BE-011 (waitlist endpoint)
- **معیار پذیرش:**
  - ثبت‌نام در صف با انتخاب بازه زمانی باشد
  - شماره نوبت و position در صف نمایش داده شود
  - notification وقتی نوبت رسید ارسال شود
  - claim window ۲ ساعته باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `lib/features/waitlist/screens/waitlist_screen.dart`, `lib/features/waitlist/providers/waitlist_provider.dart`
- **قابل موازی‌سازی؟** خیر (باید بعد از BE-011 انجام شود)

#### AND-020: پیاده‌سازی اسکن QR برای چک‌این
- **عنوان:** چک‌این رزرو با دوربین موبایل
- **شرح:** CheckinScreen با mobile_scanner پیاده‌سازی کن. دوربین QR code رزرو را بخواند و به بک‌اند ارسال کند. اگر رزرو متعلق به سالن مدیر باشد، چک‌این تأیید شود.
- **شناسه ویژگی مرتبط:** فیچر ۲۲ (اسکن QR چک‌این)
- **اولویت:** P2
- **وابستگی:** BE-012 (checkin endpoint)
- **معیار پذیرش:**
  - دوربین باز شود و QR را تشخیص دهد
  - اطلاعات رزرو پس از اسکن نمایش داده شود
  - تأیید چک‌این با permission check باشد
  - خطای بین‌سالنی ۴۰۳ handled شود
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `lib/features/checkin/screens/checkin_screen.dart`, `lib/core/widgets/qr_scanner.dart` (جدید)
- **قابل موازی‌سازی؟** خیر (باید بعد از BE-012 انجام شود)

---

### فاز ۳: State Management و Riverpod Providers (P1)

#### AND-021: refactor به Riverpod برای state management
- **عنوان:** مهاجرت از Provider/setState به Riverpod
- **شرح:** تمام state management را به Riverpod migrate کن. providers برای auth, venues, bookings, notifications بساز. auto_dispose و ref.watch استفاده کن.
- **شناسه ویژگی مرتبط:** فیچر ۲۵ (کیفیت کد)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - تمام screens از Riverpod providers استفاده کنند
  - state rebuilding بهینه باشد
  - auto_dispose برای unused providers باشد
  - testing با mock providers ممکن باشد
- **تلاش تخمینی:** L
- **فایل‌های تحت تأثیر:** `lib/core/providers/*.dart` (جدید), تمام screens
- **قابل موازی‌سازی؟** بله (هر provider مستقل است)

#### AND-022: پیاده‌سازی AuthProvider با Secure Storage
- **عنوان:** مدیریت نشست کاربر با flutter_secure_storage
- **شرح:** AuthProvider را با Riverpod پیاده‌سازی کن. login, logout, refresh token و user profile management باشد. توکن‌ها در secure storage ذخیره شوند.
- **شناسه ویژگی مرتبط:** فیچر ۱۰ (امنیت نشست)
- **اولویت:** P0
- **وابستگی:** AND-007 (Refresh Token)
- **معیار پذیرش:**
  - login/logout با API sync شود
  - توکن‌ها encrypt شوند
  - auto-refresh قبل از expiry باشد
  - user profile cached باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `lib/core/providers/auth_provider.dart`, `lib/core/storage/secure_storage.dart`
- **قابل موازی‌سازی؟** خیر (باید بعد از AND-007 انجام شود)

#### AND-023: پیاده‌سازی VenueProvider با Caching
- **عنوان:** مدیریت state سالن‌ها با caching
- **شرح:** VenueProvider را با Riverpod پیاده‌سازی کن. لیست سالن‌ها، جزئیات و search results را cache کن. stale-while-revalidate strategy استفاده کن.
- **شناسه ویژگی مرتبط:** فیچر ۲۵ (عملکرد)
- **اولویت:** P1
- **وابستگی:** AND-021
- **معیار پذیرش:**
  - venues list cached باشد
  - background refresh باشد
  - offline fallback باشد
  - memory usage بهینه باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `lib/core/providers/venue_provider.dart`, `lib/core/cache/venue_cache.dart` (جدید)
- **قابل موازی‌سازی؟** بله

#### AND-024: پیاده‌سازی BookingProvider با Optimistic Updates
- **عنوان:** مدیریت state رزروها با به‌روزرسانی خوش‌بینانه
- **شرح:** BookingProvider را پیاده‌سازی کن. create booking, cancel booking با optimistic updates باشد. rollback در صورت خطا باشد.
- **شناسه ویژگی مرتبط:** فیچر ۲۵ (UX بهتر)
- **اولویت:** P1
- **وابستگی:** AND-021
- **معیار پذیرش:**
  - create/cancel booking optimistic باشد
  - rollback در صورت خطا باشد
  - loading states واضح باشند
  - error handling مناسب باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `lib/core/providers/booking_provider.dart`, `lib/core/utils/optimistic_update.dart` (جدید)
- **قابل موازی‌سازی؟** بله

#### AND-025: پیاده‌سازی NotificationProvider با WebSocket
- **عنوان:** دریافت اعلان‌های بلادرنگ
- **شرح:** NotificationProvider را با WebSocket connection پیاده‌سازی کن. اعلان‌های جدید realtime دریافت و display شوند. reconnection logic باشد.
- **شناسه ویژگی مرتبط:** فیچر ۱۵ (WebSocket)
- **اولویت:** P1
- **وابستگی:** BE-024 (WebSocket auth)
- **معیار پذیرش:**
  - WebSocket با auth token connect شود
  - اعلان‌های جدید realtime نمایش داده شوند
  - reconnection با exponential backoff باشد
  - missed notifications sync شوند
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `lib/core/providers/notification_provider.dart`, `lib/core/services/websocket_service.dart`
- **قابل موازی‌سازی؟** خیر (باید بعد از BE-024 انجام شود)

---

### فاز ۴: Push Notifications و Bladerang (P1)

#### AND-026: پیاده‌سازی FCM Push Notifications
- **عنوان:** دریافت پوش نوتیفیکیشن از Firebase
- **شرح:** firebase_messaging را integrate کن. token registration، foreground/background notifications و deep linking پیاده‌سازی کن.
- **شناسه ویژگی مرتبط:** فیچر ۱۸ (پوش نوتیفیکیشن)
- **اولویت:** P1
- **وابستگی:** AND-007 (Auth), BE-025 (FCM backend)
- **معیار پذیرش:**
  - FCM token ثبت و به بک‌اند ارسال شود
  - foreground notifications نمایش داده شوند
  - background notifications device tray بروند
  - کلیک روی notification به صفحه مربوطه برود (deep link)
- **تلاش تخمینی:** L
- **فایل‌های تحت تأثیر:** `lib/core/services/fcm_service.dart` (جدید), `android/app/src/main/AndroidManifest.xml`, `android/app/google-services.json`
- **قابل موازی‌سازی؟** خیر (باید بعد از BE-025 انجام شود)

#### AND-027: پیاده‌سازی Local Notifications برای یادآوری‌ها
- **عنوان:** اعلان‌های محلی برای reminder‌ها
- **شرح:** flutter_local_notifications را integrate کن. یادآوری رزرو (۲ ساعت قبل)، یادآوری صف انتظار و reminder‌های سفارشی schedule کن.
- **شناسه ویژگی مرتبط:** فیچر ۱۸ (پوش نوتیفیکیشن)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - یادآوری رزرو ۲ ساعت قبل schedule شود
  - notification با sound/vibration باشد
  - user بتواند reminders را customize کند
  - cancelled reminders پاک شوند
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `lib/core/services/local_notification_service.dart` (جدید), `lib/features/reminders/providers/reminder_provider.dart`
- **قابل موازی‌سازی؟** بله

#### AND-028: پیاده‌سازی Deep Linking از Notifications
- **عنوان:** باز شدن صفحه مربوطه از notification
- **شرح:** go_router را با deep links configure کن. وقتی کاربر روی notification کلیک می‌کند، مستقیماً به BookingDetail، VenueDetail یا CompetitionScreen برود.
- **شناسه ویژگی مرتبط:** فیچر ۱۸ (پوش نوتیفیکیشن)
- **اولویت:** P1
- **وابستگی:** AND-026
- **معیار پذیرش:**
  - deep link parsing کار کند
  - navigation به صفحه صحیح باشد
  - اگر user لاگین نیست، ابتدا Login سپس redirect شود
  - universal links برای iOS باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `lib/core/router/app_router.dart`, `lib/core/services/deep_link_service.dart` (جدید)
- **قابل موازی‌سازی؟** خیر (باید بعد از AND-026 انجام شود)

---

### فاز ۵: Offline Support و رفتار شبکه ضعیف (P2)

#### AND-029: پیاده‌سازی Offline-first Architecture
- **عنوان:** کش داده‌ها برای حالت آفلاین
- **شرح:** با hive یا isar، داده‌های مهم (venues list, user profile, bookings) را locally cache کن. هنگام آفلاین، از cache خوانده شود.
- **شناسه ویژگی مرتبط:** فیچر ۲۸ (رفتار آفلاین)
- **اولویت:** P2
- **وابستگی:** AND-021 (Riverpod)
- **معیار پذیرش:**
  - venues list و profile آفلاین قابل مشاهده باشند
  - offline changes queue شوند
  - sync هنگام بازگشت آنلاین باشد
  - conflict resolution باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `lib/core/storage/local_db.dart` (جدید), `lib/core/providers/offline_provider.dart` (جدید)
- **قابل موازی‌سازی؟** بله

#### AND-030: پیاده‌سازی Request Queue برای حالت آفلاین
- **عنوان:** صف درخواست‌ها هنگام قطع اینترنت
- **شرح:** درخواست‌های failed به دلیل offline بودن را queue کن. هنگام بازگشت آنلاین، retry کن. user feedback مناسب بده.
- **شناسه ویژگی مرتبط:** فیچر ۲۸ (رفتار آفلاین)
- **اولویت:** P2
- **وابستگی:** AND-029
- **معیار پذیرش:**
  - failed requests queue شوند
  - retry با exponential backoff باشد
  - user از وضعیت مطلع باشد
  - duplicate prevention باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `lib/core/services/request_queue.dart` (جدید), `lib/core/providers/connectivity_provider.dart`
- **قابل موازی‌سازی؟** خیر (باید بعد از AND-029 انجام شود)

#### AND-031: پیاده‌سازی Connectivity Monitoring
- **عنوان:** تشخیص وضعیت اینترنت و نمایش UI مناسب
- **شرح:** connectivity_plus را integrate کن. وضعیت online/offline را monitor کن. banner مناسب نمایش بده و actions را disable کن.
- **شناسه ویژگی مرتبط:** فیچر ۲۸ (رفتار آفلاین)
- **اولویت:** P2
- **وابستگی:** —
- **معیار پذیرش:**
  - online/offline detection real-time باشد
  - banner وضعیت نمایش داده شود
  - actions حساس در حالت offline disable شوند
  - retry button باشد
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `lib/core/providers/connectivity_provider.dart`, `lib/core/widgets/offline_banner.dart` (جدید)
- **قابل موازی‌سازی؟** بله

---

### فاز ۶: بهبود UX و Accessibility (P1-P2)

#### AND-032: پیاده‌سازی Skeleton Loading Screens
- **عنوان:** نمایش placeholder هنگام لود داده
- **شرح:** skeleton loaders برای cards، lists و tables پیاده‌سازی کن. shimmer animation با flutter_shimmer باشد.
- **شناسه ویژگی مرتبط:** فیچر ۲۴ (تجربه کاربری)
- **اولویت:** P2
- **وابستگی:** —
- **معیار پذیرش:**
  - skeleton برای venue cards، booking rows باشد
  - shimmer animation smooth باشد
  - skeleton layout نهایی را تقلید کند
  - CLS نزدیک صفر باشد
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `lib/core/widgets/skeleton_loader.dart` (جدید), تمام screens با data fetching
- **قابل موازی‌سازی؟** بله

#### AND-033: پیاده‌سازی Pull-to-Refresh
- **عنوان:** تازه‌سازی لیست‌ها با کشیدن به پایین
- **شرح:** RefreshIndicator را به تمام لیست‌ها (venues, bookings, notifications) اضافه کن. pull-to-refresh با loading indicator باشد.
- **شناسه ویژگی مرتبط:** فیچر ۲۴ (تجربه کاربری)
- **اولویت:** P2
- **وابستگی:** —
- **معیار پذیرش:**
  - pull-to-refresh در تمام لیست‌ها باشد
  - loading indicator نمایش داده شود
  - data refresh شود
  - haptic feedback باشد
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** تمام screens با ListView/GridView
- **قابل موازی‌سازی؟** بله

#### AND-034: بهبود Accessibility برای Screen Readers
- **عنوان:** پشتیبانی از TalkBack و VoiceOver
- **شرح:** Semantics widgets را به تمام interactive elements اضافه کن. labels، hints و roles مناسب تنظیم کن. contrast ratio را بررسی کن.
- **شناسه ویژگی مرتبط:** فیچر ۲۴ (دسترسی‌پذیری)
- **اولویت:** P1
- **وابستگی:** QA-015 (تست دسترسی‌پذیری)
- **معیار پذیرش:**
  - تمام buttons و inputs label داشته باشند
  - screen reader navigation کامل باشد
  - color contrast ratio حداقل ۴.۵:۱ باشد
  - touch targets حداقل ۴۸×۴۸dp باشند
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** تمام widgets interactive
- **قابل موازی‌سازی؟** بله

#### AND-035: پیاده‌سازی Dark Mode
- **عنوان:** پشتیبانی از تم تاریک
- **شرح:** ThemeData.dark() را customize کن. سوئیچ تم در settings باشد. ترجیح کاربر در shared_preferences ذخیره شود.
- **شناسه ویژگی مرتبط:** فیچر ۲۴ (دسترسی‌پذیری)
- **اولویت:** P2
- **وابستگی:** —
- **معیار پذیرش:**
  - dark theme زیبا و خوانا باشد
  - سوئیچ تم در settings باشد
  - ترجیح کاربر persist شود
  - system theme detection باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `lib/core/theme/dark_theme.dart` (جدید), `lib/features/settings/screens/settings_screen.dart`
- **قابل موازی‌سازی؟** بله

#### AND-036: پیاده‌سازی Animations و Transitions
- **عنوان:** انیمیشن‌های روان برای UX بهتر
- **شرح:** با flutter_animate یا lottie، animations برای page transitions، button presses و loading states اضافه کن. performance را optimize کن.
- **شناسه ویژگی مرتبط:** فیچر ۲۴ (تجربه کاربری)
- **اولویت:** P2
- **وابستگی:** —
- **معیار پذیرش:**
  - page transitions smooth باشند
  - button feedback animations باشد
  - loading animations جذاب باشند
  - FPS بالای ۵۰ باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `lib/core/animations/` (جدید), تمام screens
- **قابل موازی‌سازی؟** بله

---

### فاز ۷: تست و کیفیت (P0-P1)

#### AND-037: نوشتن Unit Tests برای Business Logic
- **عنوان:** پوشش تست برای providers و services
- **شرح:** برای auth_provider, booking_provider, api_service unit test بنویس. از mocktail برای mocking استفاده کن.
- **شناسه ویژگی مرتبط:** فیچر ۲۶ (تست خودکار)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - حداقل ۷۰٪ پوشش برای core/
  - edge cases تست شوند
  - tests در CI اجرا شوند
  - false positives نباشند
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `test/unit/*.dart` (جدید), `pubspec.yaml` (dev dependencies)
- **قابل موازی‌سازی؟** بله

#### AND-038: نوشتن Widget Tests برای UI Components
- **عنوان:** تست کامپوننت‌های UI
- **شرح:** برای VenueCard, BookingCard, SlotSelector widget tests بنویس. rendering و interactions تست شوند.
- **شناسه ویژگی مرتبط:** فیچر ۲۶ (تست خودکار)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - کامپوننت‌های کلیدی تست شوند
  - user interactions simulate شوند
  - golden tests برای visual regression باشد
  - tests سریع اجرا شوند
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `test/widget/*.dart` (جدید)
- **قابل موازی‌سازی؟** بله

#### AND-039: نوشتن Integration Tests برای جریان‌های کلیدی
- **عنوان:** تست端到端 ۵ جریان طلایی
- **شرح:** با integration_test package، جریان‌های ورود، جستجوی سالن، ساخت رزرو، پرداخت و لغو رزرو را تست کن.
- **شناسه ویژگی مرتبط:** فیچر ۲۷ (اسموک E2E)
- **اولویت:** P0
- **وابستگی:** BE-015 (test database seeding)
- **معیار پذیرش:**
  - ۵ جریان طلایی تست شوند
  - tests روی emulator/device اجرا شوند
  - screenshots برای debugging گرفته شوند
  - tests در CI gate باشند
- **تلاش تخمینی:** L
- **فایل‌های تحت تأثیر:** `integration_test/*.dart` (جدید), `.github/workflows/flutter-test.yml`
- **قابل موازی‌سازی؟** خیر (باید بعد از BE-015 انجام شود)

#### AND-040: پیاده‌سازی Error Tracking با Sentry
- **عنوان:** ردیابی خطاهای production
- **شرح:** sentry_flutter را integrate کن. crashes، errors و performance issues را track کن. user feedback collection باشد.
- **شناسه ویژگی مرتبط:** فیچر ۱۹ (Observability)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - crashes自动 report شوند
  - errors با context لاگ شوند
  - performance metrics track شوند
  - user consent برای reporting باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `lib/core/services/error_tracking.dart` (جدید), `main.dart`
- **قابل موازی‌سازی؟** بله

#### AND-041: پیاده‌سازی Analytics و Event Tracking
- **عنوان:** ردیابی رفتار کاربر
- **شرح:** firebase_analytics یا custom analytics service integrate کن. events مهم (screen_view, button_click, payment_complete) track شوند.
- **شناسه ویژگی مرتبط:** فیچر ۱۹ (Observability)
- **اولویت:** P2
- **وابستگی:** —
- **معیار پذیرش:**
  - events مهم track شوند
  - user_id anonymized باشد
  - consent banner باشد
  - dashboard برای metrics باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `lib/core/services/analytics_service.dart` (جدید)
- **قابل موازی‌سازی؟** بله

---

### فاز ۸: Performance Optimization (P1-P2)

#### AND-042: بهینه‌سازی Image Loading و Caching
- **عنوان:** لود بهینه تصاویر با caching
- **شرح:** cached_network_image را integrate کن. images را resize و compress کن. placeholder و error widgets باشد.
- **شناسه ویژگی مرتبط:** فیچر ۲۵ (عملکرد)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - images lazy load شوند
  - disk cache باشد
  - memory usage بهینه باشد
  - placeholder/error states باشد
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** تمام widgets با images, `pubspec.yaml`
- **قابل موازی‌سازی؟** بله

#### AND-043: کاهش Startup Time
- **عنوان:** بهینه‌سازی زمان راه‌اندازی اپ
- **شرح:** با deferred loading، lazy initialization و减少 main.dart work، startup time را کاهش بده. splash screen بهینه باشد.
- **شناسه ویژگی مرتبط:** فیچر ۲۵ (عملکرد)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - cold start زیر ۳ ثانیه باشد
  - warm start زیر ۱ ثانیه باشد
  - splash screen minimal باشد
  - background initialization باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `main.dart`, `lib/core/init.dart` (جدید)
- **قابل موازی‌سازی؟** بله

#### AND-044: بهینه‌سازی Memory Usage
- **عنوان:** جلوگیری از memory leaks و کاهش مصرف حافظه
- **شرح:** با Flutter DevTools، memory leaks را شناسایی و رفع کن. dispose controllers، cancel subscriptions و clear caches.
- **شناسه ویژگی مرتبط:** فیچر ۲۵ (عملکرد)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - memory leaks نباشند
  - GC pressure کم باشد
  - image cache محدود باشد
  - subscription cleanup باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** تمام screens با controllers/subscriptions
- **قابل موازی‌سازی؟** بله

#### AND-045: Tree Shaking و کاهش Bundle Size
- **عنوان:** کاهش حجم APK نهایی
- **شرح:** با --split-per-abi، proguard rules و حذف unused dependencies، APK size را کاهش بده. resources optimize شوند.
- **شناسه ویژگی مرتبط:** فیچر ۲۵ (عملکرد)
- **اولویت:** P2
- **وابستگی:** AND-004 (Release build)
- **معیار پذیرش:**
  - APK size زیر ۲۰MB باشد
  - per-ABI splits باشد
  - unused resources حذف شوند
  - proguard obfuscation فعال باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `android/app/build.gradle.kts`, `proguard-rules.pro` (جدید)
- **قابل موازی‌سازی؟** خیر (باید بعد از AND-004 انجام شود)

---

### فاز ۹: Security Hardening (P0)

#### AND-046: Secure Storage برای Secrets
- **عنوان:** ذخیره امن توکن‌ها و sensitive data
- **شرح:** flutter_secure_storage را برای تمام sensitive data (tokens, API keys, user data) استفاده کن. encryption با OS keychain باشد.
- **شناسه ویژگی مرتبط:** فیچر ۱۱ (گارد اسرار)
- **اولویت:** P0
- **وابستگی:** AND-007 (Refresh Token)
- **معیار پذیرش:**
  - تمام tokens encrypt شوند
  - keys در OS keychain باشند
  - biometric authentication option باشد
  - logout data را پاک کند
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `lib/core/storage/secure_storage.dart`, تمام services با sensitive data
- **قابل موازی‌سازی؟** خیر (باید بعد از AND-007 انجام شود)

#### AND-047: Certificate Pinning
- **عنوان:** جلوگیری از MITM attacks
- **شرح:** با http_certificate_pinning یا custom HttpClient، certificate pinning پیاده‌سازی کن. فقط certificates trusted accept شوند.
- **شناسه ویژگی مرتبط:** فیچر ۱۳ (HTTPS)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - self-signed certificates reject شوند
  - MITM attacks detect شوند
  - certificate rotation supported باشد
  - fallback برای development باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `lib/core/services/http_client.dart`, `android/app/src/main/res/raw/` (certificates)
- **قابل موازی‌سازی؟** بله

#### AND-048: Input Validation و Sanitization
- **عنوان:** جلوگیری از Injection attacks
- **شرح:** تمام user inputs را validate و sanitize کن. SQL injection، XSS و command injection prevention باشد.
- **شناسه ویژگی مرتبط:** فیچر ۱۲ (استحکام)
- **اولویت:** P0
- **وابستگی:** —
- **معیار پذیرش:**
  - XSS payloads neutralize شوند
  - input length limits باشد
  - special characters escape شوند
  - error messages leak نکنند
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** تمام forms و input widgets
- **قابل موازی‌سازی؟** بله

#### AND-049: Biometric Authentication
- **عنوان:** ورود با اثر انگشت/چهره
- **شرح:** local_auth را integrate کن. کاربران بتوانند با fingerprint یا face ID وارد شوند. fallback به PIN باشد.
- **شناسه ویژگی مرتبط:** فیچر ۱۰ (امنیت نشست)
- **اولویت:** P2
- **وابستگی:** AND-007 (Auth)
- **معیار پذیرش:**
  - biometric prompt نمایش داده شود
  - fallback به PIN/password باشد
  - device compatibility check باشد
  - enrollment status track شود
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `lib/features/auth/screens/biometric_login.dart` (جدید), `lib/core/services/biometric_service.dart` (جدید)
- **قابل موازی‌سازی؟** خیر (باید بعد از AND-007 انجام شود)

#### AND-050: Privacy Policy و Consent Management
- **عنوان:** مدیریت رضایت کاربر و حریم خصوصی
- **شرح:** privacy policy screen بساز. consent برای analytics، notifications و location tracking باشد. GDPR compliance باشد.
- **شناسه ویژگی مرتبط:** فیچر ۲۴ (دسترسی‌پذیری)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - privacy policy قابل مشاهده باشد
  - consent granular باشد
  - withdraw consent option باشد
  - data export/delete request باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `lib/features/settings/screens/privacy_screen.dart` (جدید), `lib/core/services/consent_manager.dart` (جدید)
- **قابل موازی‌سازی؟** بله

---

## خلاصه وابستگی‌ها بین ترک‌ها

| Task ID | Depends On Backend Tasks | Notes |
|---------|-------------------------|-------|
| AND-002 | BE-005 | JWT authentication |
| AND-007 | BE-006 | Refresh Token endpoint |
| AND-009 | BE-005, BE-006 | Auth flow |
| AND-010 | BE-013 | Pagination envelope |
| AND-013 | BE-008, BE-009 | Payment gateway |
| AND-016 | BE-021 | Manager stats |
| AND-017 | BE-022 | Competitions |
| AND-018 | BE-023 | Teams/Games |
| AND-019 | BE-011 | Waitlist |
| AND-020 | BE-012 | QR checkin |
| AND-025 | BE-024 | WebSocket auth |
| AND-026 | BE-025 | FCM backend |
| AND-039 | BE-015 | Test database |
| AND-046 | AND-007 | Secure storage after auth |
| AND-049 | AND-007 | Biometric after auth |

## ماتریس اولویت‌ها

| اولویت | تعداد وظایف | درصد کل | توضیح |
|--------|-------------|---------|-------|
| P0 | ۱۴ | ۲۸٪ | حیاتی برای launch |
| P1 | ۲۲ | ۴۴٪ | مهم برای UX و کیفیت |
| P2 | ۱۴ | ۲۸٪ | بهبودهای تکمیلی |

## تخمین تلاش کلی

| اندازه | تعداد وظایف | مجموع تخمینی |
|--------|-------------|---------------|
| S | ۸ | ~۸ نفر-روز |
| M | ۳۰ | ~۶۰ نفر-روز |
| L | ۱۲ | ~۶۰ نفر-روز |
| **کل** | **۵۰** | **~۱۲۸ نفر-روز** |

---

**تهیه‌شده توسط:** تیم توسعه موبایل (Flutter)  
**تاریخ بازبینی بعدی:** ۲۰۲۶-۱۰-۱۵  
**وضعیت:** در حال اجرا
