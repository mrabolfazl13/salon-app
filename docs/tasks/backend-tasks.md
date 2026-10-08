# سند وظایف بک‌اند (FastAPI) — فاز ۲۷

> **تاریخ:** ۲۰۲۶-۱۰-۰۸ | **دامنه:** `backend/` (FastAPI + SQLModel + PostgreSQL + Celery + Redis)  
> **هدف:** رفع باگ‌های بحرانی، پیاده‌سازی درگاه پرداخت واقعی، سخت‌گیری امنیتی و بهبود مقیاس‌پذیری  
> **معیار موفقیت:** صفر endpoint با نشت داده، ۱۰۰٪ refund موفق، درگاه پرداخت واقعی با webhook، تمام تسک‌های Celery سیم‌کشی‌شده

---

## فهرست وظایف بر اساس فاز

### فاز ۱: رفع باگ‌های بحرانی (P0)

#### BE-001: رفع crash لغو رزرو و بازگشت وجه واقعی
- **عنوان:** اصلاح import شکسته در reminder_tasks و فعال‌سازی refund
- **شرح:** فایل `reminder_tasks.py` خط ۶ از `app.db.session` استفاده می‌کند که وجود ندارد. این باعث crash شدن مسیر لغو رزرو قبل از بلوک refund می‌شود. import را اصلاح کن و تست کامل refund بنویس.
- **شناسه ویژگی مرتبط:** فیچر ۶ (رفع ۵۰۰ لغو رزرو)
- **اولویت:** P0
- **وابستگی:** —
- **معیار پذیرش:**
  - `python -c "import app.tasks.reminder_tasks"` بدون خطا اجرا شود
  - رزرو پرداخت‌شده لغو شود: وضعیت REFUNDED، ردیف بازگشت وجه در financial_transactions
  - اسلات آزاد شود
  - کاربر پیام «بازگشت وجه ثبت شد» ببیند
  - تست رقابتی با دو درخواست لغوی هم‌زمان
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `backend/app/tasks/reminder_tasks.py`, `backend/app/api/v1/bookings.py:364-390`, `backend/tests/test_booking_cancellation.py` (جدید)
- **قابل موازی‌سازی؟** خیر (این اولین کار باید باشد)

#### BE-002: ادغام finance_mvp در finance و بستن نشت مالی بین‌سالنی
- **عنوان:** حذف روتر موازی و اعمال venue-scoping به تمام endpoint‌های مالی
- **شرح:** دو روتر `/finance` هم‌زمان mount شده‌اند. finance_mvp نسخه سایه است ولی endpoint‌های categories و summary/monthly آن بدون فیلتر venue زنده‌اند و داده همه سالن‌ها را به هر کاربر لاگین‌شده می‌دهند. finance_mvp را حذف یا ادغام کن و venue-scoping را اعمال کن.
- **شناسه ویژگی مرتبط:** فیچر ۷ (ادغام finance_mvp)
- **اولویت:** P0
- **وابستگی:** —
- **معیار پذیرش:**
  - دقیقاً یک روتر `/finance` در main.py
  - کاربر A (venue ۳) هیچ ردیفی از venue دیگر نبیند
  - نقش‌های پایین‌تر ۴۰۳ بگیرند
  - venue_id از نشست مدیر بیاید، نه مقدار پیش‌فرض
  - POST تکراری با idempotency key یک ردیف بسازد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `backend/app/api/v1/finance_mvp.py` (حذف/ادغام), `backend/app/api/v1/finance.py`, `backend/app/main.py:191-192`
- **قابل موازی‌سازی؟** خیر (باید قبل از سایر کارهای مالی انجام شود)

#### BE-003: رفع باگ مقایسه نقش در waitlist و جلوگیری از نشت هویت
- **عنوان:** اصلاح enum comparison و محدود کردن payload صف انتظار
- **شرح:** waitlist.py خط ۱۸۳ نقش را با `["SUPER_ADMIN","CLUB_ADMIN"]` مقایسه می‌کند در حالی که مقادیر enum کوچک هستند (`super_admin`). همچنین خط ۱۹۷ نام/شناسه بقیه کاربران را برمی‌گرداند. مقایسه را اصلاح و payload را محدود کن.
- **شناسه ویژگی مرتبط:** فیچر ۱۴ (ماتریس مجوزها)
- **اولویت:** P0
- **وابستگی:** —
- **معیار پذیرش:**
  - سوپرادمین بتواند صف انتظار را ببیند (۴۰۳ نگیرد)
  - payload فقط شامل شماره ماسک‌شده و نام اول باشد
  - تست برای هر چهار نقش نوشته شود
  - هویت کامل کاربران فاش نشود
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `backend/app/api/v1/waitlist.py:175-200`, `backend/app/models/user.py:7-11`, `backend/tests/test_waitlist_permissions.py` (جدید)
- **قابل موازی‌سازی؟** بله

#### BE-004: اعمال venue-scoping به چک‌این
- **عنوان:** بررسی تعلق رزرو به سالن مدیر قبل از چک‌این
- **شرح:** checkin.py فقط نقش را بررسی می‌کند و هر مدیری می‌تواند کد چک‌این رزروی از سالن دیگر را تأیید کند. venue_id رزرو را با venue تحت مدیریت چک کن.
- **شناسه ویژگی مرتبط:** فیچر ۱۴ (ماتریس مجوزها)
- **اولویت:** P0
- **وابستگی:** —
- **معیار پذیرش:**
  - چک‌این فقط برای رزروهای venue تحت مدیریت موفق شود
  - تلاش بین‌سالنی ۴۰۳ و لاگ امنیتی بدهد
  - تست با دو مدیر از دو سالن متفاوت
  - لاگ audit برای تلاش‌های ناموفق
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `backend/app/api/v1/checkin.py:41-56`, `backend/tests/test_checkin_permissions.py` (جدید)
- **قابل موازی‌سازی؟** بله

#### BE-005: بررسی رزرو تکمیل‌شده قبل از ثبت نظر
- **عنوان:** جلوگیری از ثبت نظر بدون رزرو و سقف امتیاز وفاداری
- **شرح:** reviews.py بدون بررسی «آیا کاربر رزرو تکمیل‌شده دارد» نظر ثبت می‌کند و امتیاز وفاداری می‌دهد. شرط رزرو COMPLETED و سقف امتیاز اضافه کن.
- **شناسه ویژگی مرتبط:** فیچر ۱۴ (ماتریس مجوزها)
- **اولویت:** P0
- **وابستگی:** —
- **معیار پذیرش:**
  - ثبت نظر فقط پس از رزرو COMPLETED
  - یک نظر برای هر رزرو
  - امتیاز وفاداری سقف داشته باشد
  - تست با کاربر بدون رزرو
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `backend/app/api/v1/reviews.py:80-110`, `backend/app/services/loyalty_service.py`, `backend/tests/test_review_validation.py` (جدید)
- **قابل موازی‌سازی؟** بله

---

### فاز ۲: امنیت و احراز هویت (P0)

#### BE-006: پیاده‌سازی Refresh Token و ابطال نشست
- **عنوان:** چرخه کامل نشست با Access Token کوتاه‌عمر و Refresh Token بلند‌عمر
- **شرح:** endpoint‌های `/auth/refresh` و `/auth/logout` اضافه کن. refresh token در DB ذخیره شود، با هر استفاده بچرخد و نسخه قدیمی باطل شود. logout همه refresh‌ها را باطل کند.
- **شناسه ویژگی مرتبط:** فیچر ۱۰ (Refresh token)
- **اولویت:** P0
- **وابستگی:** —
- **معیار پذیرش:**
  - `/auth/refresh` access جدید بدهد و refresh قدیمی را باطل کند
  - refresh در هر استفاده بچرخد
  - `/auth/logout` همه نشست‌ها را ابطال کند
  - توکن ابطال‌شده ۴۰۱ بگیرد
  - تغییر رمز همه refresh‌ها را باطل کند
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `backend/app/api/v1/auth.py`, `backend/app/services/auth_service.py`, `backend/app/models/session.py` (جدید), `backend/migrations/versions/m0s017session.py` (جدید)
- **قابل موازی‌سازی؟** بله

#### BE-007: گارد اسرار در بوت پروداکشن
- **عنوان:** توقف بوت با Secret‌های پیش‌فرض و حذف --reload از production
- **شرح:** در startup، چک کن اگر JWT_SECRET، ADMIN_PASSWORD یا MINIO_SECRET_KEY مقادیر پیش‌فرض باشند، اپ بوت نکند. --reload را از Dockerfile production حذف کن.
- **شناسه ویژگی مرتبط:** فیچر ۱۱ (گارد اسرار)
- **اولویت:** P0
- **وابستگی:** —
- **معیار پذیرش:**
  - با APP_ENV=production و Secret پیش‌فرض، بوت fail شود
  - خطای مشخص نمایش داده شود
  - تست خودکار دو حالت (پیش‌فرض → fail، صحیح → OK)
  - --reload از Dockerfile حذف شود
  - اگر رمز ادمین پیش‌فرض باشد، اولین ورود اجباراً به تغییر رمز ختم شود
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `backend/app/config.py`, `backend/app/main.py` (lifespan), `backend/Dockerfile:26`, `backend/tests/test_security_guards.py` (جدید)
- **قابل موازی‌سازی؟** بله

#### BE-008: افزایش استحکام رمز و بهبود Argon2
- **عنوان:** سیاست رمز قوی، پارامترهای Argon2 ایمن و OTP با secrets
- **شرح:** min_length رمز را از ۴ به ۸ افزایش بده. پارامترهای Argon2 را به memory_cost=65536, hash_len=32 تغییر بده. OTP را با secrets module تولید کن. rate limiter را fail-closed کن.
- **شناسه ویژگی مرتبط:** فیچر ۱۲ (استحکام رمز)
- **اولویت:** P0
- **وابستگی:** BE-007
- **معیار پذیرش:**
  - کف طول رمز ۸ کاراکتر
  - rehash شفاف هنگام لاگین برای هش‌های قدیمی
  - OTP از secrets و ذخیره hash‌شده با TTL
  - DEBUG_ALLOW_DEV_CODE در پروداکشن False باشد
  - قطع Redis → fail-closed با ۵۰۳ فارسی
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `backend/app/schemas/user.py:19`, `backend/app/utils/auth.py:16-22`, `backend/app/services/verification_service.py:49,58`, `backend/app/utils/rate_limit.py:53`
- **قابل موازی‌سازی؟** خیر (باید بعد از BE-007 انجام شود)

#### BE-009: پیکربندی CORS، MINIO_PUBLIC_URL و HTTPS
- **عنوان:** allowlist origin پروداکشن، URL عمومی MinIO و redirect HTTP به HTTPS
- **شرح:** origin دامنه رسمی را به CORS allowlist اضافه کن. MINIO_PUBLIC_URL را به آدرس nginx proxy تغییر بده. در nginx، HTTP را به HTTPS redirect کن.
- **شناسه ویژگی مرتبط:** فیچر ۱۳ (CORS و HTTPS)
- **اولویت:** P0
- **وابستگی:** —
- **معیار پذیرش:**
  - از اپ Tauri و localhost:3001 هیچ خطای CORS نباشد
  - تصاویر آپلودشده از آدرس عمومی بارگذاری شوند
  - کل ترافیک API/WS فقط HTTPS/WSS باشد
  - پاسخ HTTP → redirect 301 به HTTPS
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `backend/app/config.py:45-49`, `docker-compose.yml:69/75`, `nginx/nginx.conf`, `backend/.env:26`
- **قابل موازی‌سازی؟** بله

#### BE-010: Content Security Policy و Sanitization
- **عنوان:** جلوگیری از XSS و Injection attacks
- **شرح:** CSP headers در response اضافه کن. ورودی‌های کاربر را sanitize کن. HTML content را با bleach پاکسازی کن.
- **شناسه ویژگی مرتبط:** فیچر ۱۲ (امنیت)
- **اولویت:** P0
- **وابستگی:** —
- **معیار پذیرش:**
  - CSP header در response باشد
  - inline scripts ممنوع باشند
  - XSS payloads neutralize شوند
  - SQL injection prevention در queries
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `backend/app/main.py` (middleware), `backend/app/utils/sanitization.py` (جدید), `backend/app/api/v1/*.py` (input validation)
- **قابل موازی‌سازی؟** بله

---

### فاز ۳: پرداخت و دفتر کل (P0-P1)

#### BE-011: پیاده‌سازی درگاه پرداخت واقعی
- **عنوان:** ادغام درگاه (زرین‌پال/آیدی‌پی) با webhook و تسویه
- **شرح:** ماژول پرداخت واقعی بساز. درخواست به درگاه، بازگشت کاربر، webhook امضاشده، تطبیق با idempotency_key و ثبت در دفتر کل. کارمزد درگاه را محاسبه کن.
- **شناسه ویژگی مرتبط:** فیچر ۳ (درگاه پرداخت واقعی)
- **اولویت:** P0
- **وابستگی:** BE-009 (HTTPS)
- **معیار پذیرش:**
  - پرداخت واقعی از درخواست تا webhook کار کند
  - webhook سه‌بار با همان رویداد ارسال شود و سیستم یک ردیف مالی تولید کند
  - idempotency_key duplicate prevention باشد
  - مبلغ نهایی با کارمزد درست محاسبه شود
  - پرداخت ناتمام ۲۰ دقیقه بعد auto-cancel شود
- **تلاش تخمینی:** L
- **فایل‌های تحت تأثیر:** `backend/app/services/payment_gateway_service.py` (جدید), `backend/app/api/v1/payments.py:73`, `backend/app/models/transaction.py`, `backend/migrations/versions/m0s018gateway.py` (جدید)
- **قابل موازی‌سازی؟** خیر (باید بعد از BE-009 انجام شود)

#### BE-012: مغایرگیری دفتر کل با درگاه
- **عنوان:** تسک روزانه برای تطبیق ردیف‌های مالی با پرداخت‌های درگاه
- **شرح:** تسک Celery روزانه بنویس که مجموع ردیف‌های دفتر کل را با پرداخت‌های موفق درگاه مقایسه کند. اختلاف‌ها را گزارش دهد.
- **شناسه ویژگی مرتبط:** فیچر ۸ (مغایرگیری)
- **اولویت:** P1
- **وابستگی:** BE-011
- **معیار پذیرش:**
  - تسک روزانه اجرا شود
  - اختلاف میان «موفقِ درگاه»، «PAID در دیتابیس» و «ردیف دفتر کل» گزارش شود
  - شماره رزروهای ناهم‌خوان نمایش داده شود
  - سه حالت ساختگی (missing، double، refund بدون پرداخت) تشخیص داده شوند
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `backend/app/tasks/reconciliation_tasks.py` (جدید), `backend/app/api/v1/finance.py` (endpoint گزارش), `backend/tests/test_reconciliation.py` (جدید)
- **قابل موازی‌سازی؟** خیر (باید بعد از BE-011 انجام شود)

#### BE-013: پیاده‌سازی کوپن تخفیف در جریان رزرو
- **عنوان:** اعتبارسنجی کوپن، محاسبه تخفیف و محدودیت مصرف
- **شرح:** endpoint validate coupon اضافه کن. در ساخت رزرو، کوپن را اعتبارسنجی، تخفیف را محاسبه و محدودیت مصرف را چک کن. concurrency control برای کوپن تک‌مصرفی.
- **شناسه ویژگی مرتبط:** فیچر ۹ (کد تخفیف)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - کاربر کد را وارد و اعتبارسنجی شود
  - قیمت نهایی با تخفیف محاسبه شود
  - اگر کوپن منقضی یا تمام شده، پیام دقیق داده شود
  - دو کاربر هم‌زمان یک کوپن تک‌مصرفی را نسوزانند (SELECT FOR UPDATE)
  - رزرو coupon_code و مبلغ کاهش‌یافته داشته باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `backend/app/api/v1/coupons.py`, `backend/app/api/v1/bookings.py` (apply coupon), `backend/app/services/coupon_service.py` (جدید), `backend/tests/test_coupon_concurrency.py` (جدید)
- **قابل موازی‌سازی؟** بله

#### BE-014: پیاده‌سازی پیشنهادات ویژه (Deals)
- **عنوان:** سیستم deals با شرایط و محدودیت‌ها
- **شرح:** endpoint‌های deals را کامل کن. شرایط اعمال (اولین رزرو، minimum spend)، محدودیت زمانی و سقف استفاده باشد.
- **شناسه ویژگی مرتبط:** فیچر ۹ (پیشنهاد ویژه)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - deals با شرایط مختلف ایجاد شوند
  - eligibility check باشد
  - usage tracking باشد
  - expiry auto-disable باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `backend/app/api/v1/deals.py`, `backend/app/services/deal_service.py` (جدید)
- **قابل موازی‌سازی؟** بله

---

### فاز ۴: بلادرنگ و Background Jobs (P0-P1)

#### BE-015: سیم‌کشی کامل Celery Beat و رفع import شکسته
- **عنوان:** ثبت تمام ۸ تسک در beat_schedule و اصلاح autodiscover
- **شرح:** worker.py را طوری تغییر بده که تمام تسک‌ها در beat_schedule باشند. autodiscover_tasks را اصلاح کن تا ماژول‌های تسک import شوند. جدول زمان‌بندی مستند کن.
- **شناسه ویژگی مرتبط:** فیچر ۱۶ (سیم‌کشی Celery)
- **اولویت:** P0
- **وابستگی:** BE-001 (رفع import شکسته)
- **معیار پذیرش:**
  - هر ۸ تسک در `celery inspect registered` دیده شوند
  - جدول زمان‌بندی مستند (دوره، lock، پیام‌رسانی)
  - اجرای هر تسک اثر قابل مشاهده بدهد
  - خطای داخل تسک با retry و لاگ ساختاریافته دیده شود
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `backend/app/tasks/worker.py:16-30`, `backend/app/tasks/__init__.py` (autodiscover), `docker-compose.yml:113`
- **قابل موازی‌سازی؟** خیر (باید بعد از BE-001 انجام شود)

#### BE-016: WebSocket روی Redis pub/sub و حذف --reload
- **عنوان:** معماری WebSocket مقیاس‌پذیر با Redis
- **شرح:** اتاق‌های WS را از dict درون‌پروسه به Redis pub/sub منتقل کن. با چند worker، پیام به اتصال درست برسد. توکن WS را از query string به هدر منتقل کن.
- **شناسه ویژگی مرتبط:** فیچر ۱۵ (WebSocket مقیاس‌پذیر)
- **اولویت:** P1
- **وابستگی:** BE-006 (Auth tokens)
- **معیار پذیرش:**
  - با دو پروسه uvicorn، پیام از A به B برسد
  - قطع و وصل مجدد با پیام‌های خوانده‌نشده sync شود
  - توکن WS از هدر خوانده شود، نه query string
  - در لاگ nginx توکن ثبت نگردد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `backend/app/utils/websocket.py:16`, `backend/app/main.py:31-34,109-166`, `backend/app/services/notification_service.py:64,78,92`, `backend/Dockerfile:26`
- **قابل موازی‌سازی؟** خیر (باید بعد از BE-006 انجام شود)

#### BE-017: پیاده‌سازی پوش نوتیفیکیشن FCM
- **عنوان:** ارسال push notification به دستگاه‌های موبایل
- **شرح:** ماژول FCM بساز. token registration، ارسال notification و cleanup token‌های منقضی باشد. یادآوری رزرو و نوبت صف انتظار را push کن.
- **شناسه ویژگی مرتبط:** فیچر ۱۸ (پوش نوتیفیکیشن)
- **اولویت:** P1
- **وابستگی:** BE-006 (Auth), BE-015 (Celery)
- **معیار پذیرش:**
  - ثبت token در دستگاه و پاک‌سازی هنگام logout
  - دو رویداد واقعی (یادآوری رزرو، نوبت صف) روی دستگاه دریافت شوند
  - کلیک روی notification به صفحه مربوطه برود (deep link payload)
  - نرخ شکست ارسال و انقضا token در dashboard دیده شود
- **تلاش تخمینی:** L
- **فایل‌های تحت تأثیر:** `backend/app/services/fcm_service.py` (جدید), `backend/app/models/device_token.py` (جدید), `backend/app/tasks/notification_tasks.py` (جدید), `backend/migrations/versions/m0s019fcm.py` (جدید)
- **قابل موازی‌سازی؟** خیر (باید بعد از BE-006 و BE-015 انجام شود)

#### BE-018: پیاده‌سازی یادآوری رزرو و صف انتظار
- **عنوان:** تسک‌های Celery برای reminder‌ها
- **شرح:** تسک یادآوری رزرو (۲ ساعت قبل) و اطلاع‌رسانی نوبت صف انتظار را پیاده‌سازی کن. در beat_schedule ثبت شوند.
- **شناسه ویژگی مرتبط:** فیچر ۱۶ (سیم‌کشی Celery)
- **اولویت:** P1
- **وابستگی:** BE-015, BE-017
- **معیار پذیرش:**
  - یادآوری رزرو ۲ ساعت قبل ارسال شود
  - نوبت صف انتظار با window ۲ ساعته اطلاع داده شود
  - تسک‌ها در beat_schedule باشند
  - retry در صورت شکست باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `backend/app/tasks/reminder_tasks.py`, `backend/app/tasks/waitlist_tasks.py` (جدید), `backend/app/tasks/worker.py` (beat_schedule)
- **قابل موازی‌سازی؟** خیر (باید بعد از BE-015 و BE-017 انجام شود)

---

### فاز ۵: مقیاس‌پذیری و Performance (P1)

#### BE-019: صفحه‌بندی یکدست و رفع N+1
- **عنوان:** اعمال pagination envelope به تمام endpoint‌های لیست‌ساز
- **شرح:** پارامتر limit/offset به تمام روترهای لیست‌ساز اضافه کن. envelope `{items, next_cursor, total}` برگردان. کوئری‌های N+1 را با joinedload رفع کن.
- **شناسه ویژگی مرتبط:** فیچر ۱۷ (صفحه‌بندی یکدست)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - envelope مشترک روی endpoint‌های لیست‌ساز
  - سقف سخت پیش‌فرض (مثلاً ۵۰)
  - بدون query تکراری برای هر row
  - latency per-page زیر ۲۰۰ms باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `backend/app/api/v1/games.py:101`, `backend/app/api/v1/teams.py`, `backend/app/api/v1/competitions.py:28`, `backend/app/api/v1/admin.py`, `backend/app/api/v1/finance.py`, `backend/app/api/v1/bookings.py:267-272`, `backend/app/api/v1/waitlist.py:149-151,197`
- **قابل موازی‌سازی؟** بله (هر router مستقل است)

#### BE-020: Redis Caching برای Query‌های پرتکرار
- **عنوان:** کش کردن پاسخ‌های API با TTL
- **شرح:** با redis-cache، query‌های پرتکرار (venues list, slot availability, user profile) را کش کن. invalidation strategy باشد.
- **شناسه ویژگی مرتبط:** فیچر ۱۷ (مقیاس)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - cache hit rate بالای ۷۰٪ باشد
  - TTL مناسب برای هر نوع داده
  - invalidation هنگام update باشد
  - memory usage monitor شود
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `backend/app/utils/cache.py` (جدید), `backend/app/api/v1/venues.py`, `backend/app/api/v1/slots.py`
- **قابل موازی‌سازی؟** بله

#### BE-021: Database Indexing و Query Optimization
- **عنوان:** افزودن index‌های ضروری و بهینه‌سازی کوئری‌ها
- **شرح:** با EXPLAIN ANALYZE، کوئری‌های کند را شناسایی کن. index‌های composite برای filter‌های رایج اضافه کن.
- **شناسه ویژگی مرتبط:** فیچر ۱۷ (مقیاس)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - query time زیر ۱۰۰ms برای queries رایج
  - index coverage برای WHERE clauses رایج
  - migration برای index‌ها نوشته شود
  - monitoring برای slow queries باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `backend/migrations/versions/m0s020indexes.py` (جدید), `backend/app/repositories/*.py`
- **قابل موازی‌سازی؟** بله

#### BE-022: Rate Limiting پیشرفته
- **عنوان:** محدودیت نرخ درخواست بر اساس IP و کاربر
- **شرح:** rate limiting granular برای endpoint‌های حساس (login, booking creation, payment). sliding window algorithm استفاده کن.
- **شناسه ویژگی مرتبط:** فیچر ۱۲ (استحکام)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - login attempts محدود شوند (۵ بار در دقیقه)
  - booking creation debounce شود
  - payment retry با backoff باشد
  - rate limit headers در response باشند
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `backend/app/utils/rate_limit.py`, `backend/app/api/v1/auth.py`, `backend/app/api/v1/bookings.py`, `backend/app/api/v1/payments.py`
- **قابل موازی‌سازی؟** بله

---

### فاز ۶: Features تکمیلی (P1-P2)

#### BE-023: پیاده‌سازی Favorites Backend Sync
- **عنوان:** endpoint برای همگام‌سازی علاقه‌مندی‌ها
- **شرح:** endpoint‌های add/remove/list favorites بساز. بین دستگاه‌ها sync شود.
- **شناسه ویژگی مرتبط:** فیچر ۲ (اتصال واقعی)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - add/remove favorite با user_id sync شود
  - list favorites paginated باشد
  - duplicates handled شوند
  - performance impact minimal باشد
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `backend/app/api/v1/favorites.py` (جدید), `backend/app/models/favorite.py` (جدید), `backend/migrations/versions/m0s021favorites.py` (جدید)
- **قابل موازی‌سازی؟** بله

#### BE-024: پیاده‌سازی Referral System
- **عنوان:** سیستم معرفی دوستان با reward tracking
- **شرح:** referral code تولید کن، لینک share و reward tracking باشد. وقتی invitee اولین رزرو را کرد، referrer reward بگیرد.
- **شناسه ویژگی مرتبط:** فیچر ۹ (پیشنهاد ویژه)
- **اولویت:** P2
- **وابستگی:** —
- **معیار پذیرش:**
  - referral code منحصر به فرد تولید شود
  - rewards tracking باشد
  - invitees list باشد
  - fraud detection باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `backend/app/api/v1/referrals.py` (جدید), `backend/app/models/referral.py` (جدید), `backend/app/services/referral_service.py` (جدید)
- **قابل موازی‌سازی؟** بله

#### BE-025: پیاده‌سازی Feedback Endpoint
- **عنوان:** دریافت بازخورد کاربر با screenshot
- **شرح:** endpoint برای submit feedback با rating، comment و screenshot upload باشد. admin بتواند feedback‌ها را ببیند.
- **شناسه ویژگی مرتبط:** فیچر ۱۹ (Observability)
- **اولویت:** P2
- **وابستگی:** —
- **معیار پذیرش:**
  - feedback submission با validation باشد
  - screenshot upload به MinIO باشد
  - admin dashboard برای viewing باشد
  - analytics برای trends باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `backend/app/api/v1/feedback.py` (جدید), `backend/app/models/feedback.py` (جدید)
- **قابل موازی‌سازی؟** بله

#### BE-026: پیاده‌سازی Gamification Backend
- **عنوان:** سیستم badges، points و leaderboard
- **شرح:** achievements tracking، points accumulation و leaderboard endpoint‌ها بساز. badges برای milestones باشد.
- **شناسه ویژگی مرتبط:** فیچر ۹ (پیشنهاد ویژه)
- **اولویت:** P2
- **وابستگی:** —
- **معیار پذیرش:**
  - badges earned شوند
  - points accumulate شوند
  - leaderboard paginated باشد
  - rewards redeem شوند
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `backend/app/api/v1/gamification.py` (جدید), `backend/app/models/achievement.py` (جدید), `backend/app/services/gamification_service.py` (جدید)
- **قابل موازی‌سازی؟** بله

#### BE-027: پیاده‌سازی Audit Logging
- **عنوان:** ثبت لاگ اقدامات حساس کاربر
- **شرح:** actions حساس (login, payment, profile change, password reset) را لاگ کن. timestamp، IP و user agent ثبت شود.
- **شناسه ویژگی مرتبط:** فیچر ۱۹ (Observability)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - actions حساس لاگ شوند
  - لاگ‌ها immutable باشند
  - admin بتواند لاگ‌ها را ببیند
  - GDPR compliance (user can request deletion)
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `backend/app/utils/audit_logger.py` (جدید), `backend/app/models/audit_log.py` (جدید), `backend/app/api/v1/admin.py` (view logs)
- **قابل موازی‌سازی؟** بله

#### BE-028: پیاده‌سازی Multi-language Support Backend
- **عنوان:** پشتیبانی از چند زبان در API responses
- **شرح:** error messages، notification titles و content را multi-language کن. Accept-Language header را respect کن.
- **شناسه ویژگی مرتبط:** فیچر ۲۴ (دسترسی‌پذیری)
- **اولویت:** P2
- **وابستگی:** —
- **معیار پذیرش:**
  - error messages ترجمه شوند
  - Accept-Language header respected باشد
  - fallback به فارسی باشد
  - translations manageable باشند
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `backend/app/utils/i18n.py` (جدید), `backend/app/locales/` (جدید), تمام endpoints با error messages
- **قابل موازی‌سازی؟** بله

---

### فاز ۷: Observability و پایداری (P1)

#### BE-029: پیاده‌سازی Metrics Endpoint برای Prometheus
- **عنوان:** exposing metrics برای monitoring
- **شرح:** با prometheus-fastapi-instrumentator، metrics endpoint بساز. latency per-route، rate-limit rejection، تسک‌های Celery و اتصال فعال WS expose کن.
- **شناسه ویژگی مرتبط:** فیچر ۱۹ (Observability)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - `/metrics` endpoint با format Prometheus باشد
  - latency per-route track شود
  - rate-limit rejections count شوند
  - Celery task metrics باشند
  - active WS connections count شود
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `backend/app/main.py` (instrumentation), `backend/app/utils/metrics.py` (جدید), `monitoring/prometheus/prometheus.yml`
- **قابل موازی‌سازی؟** بله

#### BE-030: پیاده‌سازی Error Tracking با Sentry
- **عنوان:** ردیابی خطاهای production
- **شرح:** sentry-sdk را integrate کن. exceptions، performance issues و breadcrumbs را track کن.
- **شناسه ویژگی مرتبط:** فیچر ۱۹ (Observability)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - exceptions自动 report شوند
  - performance issues track شوند
  - breadcrumbs برای debugging باشند
  - release tracking باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `backend/app/main.py` (Sentry init), `backend/requirements.txt` (sentry-sdk)
- **قابل موازی‌سازی؟** بله

#### BE-031: پیاده‌سازی Backup و Restore Scripts
- **عنوان:** اسکریپت‌های پشتیبان‌گیری و بازیابی
- **شرح:** اسکریپت backup روزانه از PostgreSQL بنویس. restore script برای testing بنویس. retention policy باشد.
- **شناسه ویژگی مرتبط:** فیچر ۱۹ (پایداری)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - backup روزانه automated باشد
  - restore script tested باشد
  - retention policy (مثلاً ۳۰ روز) باشد
  - alert برای backup failures باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `scripts/backup.sh` (جدید), `scripts/restore.sh` (جدید), `docker-compose.yml` (volumes)
- **قابل موازی‌سازی؟** بله

#### BE-032: Alerting Rules برای Prometheus
- **عنوان:** تعریف alert‌ها برای شرایط بحرانی
- **شرح:** با Alertmanager، rules برای نرخ 5xx API، down بودن Redis/Celery و backup failures تعریف کن.
- **شناسه ویژگی مرتبط:** فیچر ۱۹ (پایداری)
- **اولویت:** P1
- **وابستگی:** BE-029
- **معیار پذیرش:**
  - alert برای نرخ 5xx بالای ۵٪
  - alert برای down بودن Redis/Celery
  - alert برای backup failures
  - notifications به email/Slack باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `monitoring/prometheus/alerts.yml` (جدید), `monitoring/alertmanager/alertmanager.yml` (جدید)
- **قابل موازی‌سازی؟** خیر (باید بعد از BE-029 انجام شود)

---

### فاز ۸: تست و کیفیت (P0-P1)

#### BE-033: نوشتن Unit Tests برای Services
- **عنوان:** پوشش تست برای business logic
- **شرح:** برای AuthService, BookingService, PaymentService, CompetitionService unit test بنویس. edge cases و error handling تست شوند.
- **شناسه ویژگی مرتبط:** فیچر ۲۵ (کیفیت کد)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - حداقل ۸۰٪ پوشش برای services/
  - edge cases تست شوند
  - mocking برای external dependencies باشد
  - tests سریع اجرا شوند
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `backend/tests/unit/test_auth_service.py` (جدید), `backend/tests/unit/test_booking_service.py` (جدید), `backend/tests/unit/test_payment_service.py` (جدید)
- **قابل موازی‌سازی؟** بله

#### BE-034: نوشتن Integration Tests برای API Endpoints
- **عنوان:** تست端到端 endpoint‌ها
- **شرح:** با pytest و TestClient، endpoint‌های کلیدی را تست کن. authentication، authorization و business logic验证 شوند.
- **شناسه ویژگی مرتبط:** فیچر ۲۵ (کیفیت کد)
- **اولویت:** P0
- **وابستگی:** —
- **معیار پذیرش:**
  - تمام endpoint‌های CRUD تست شوند
  - permission checks验证 شوند
  - error responses correct باشند
  - tests در CI اجرا شوند
- **تلاش تخمینی:** L
- **فایل‌های تحت تأثیر:** `backend/tests/integration/test_auth_endpoints.py` (جدید), `backend/tests/integration/test_booking_endpoints.py` (جدید), `backend/tests/integration/test_payment_endpoints.py` (جدید)
- **قابل موازی‌سازی؟** بله

#### BE-035: نوشتن Tests برای Permissions Matrix
- **عنوان:** تست دسترسی برای هر نقش روی هر endpoint
- **شرح:** برای waitlist، checkin و reviews، تست‌های comprehensive برای هر چهار نقش بنویس.
- **شناسه ویژگی مرتبط:** فیچر ۱۴ (ماتریس مجوزها)
- **اولویت:** P0
- **وابستگی:** BE-003, BE-004, BE-005
- **معیار پذیرش:**
  - هر چهار نقش روی هر سه endpoint تست شوند
  - دسترسی درست，نه بیشتر نه کمتر
  - ۴۰۳ برای unauthorized باشد
  - لاگ امنیتی برای تلاش‌های ناموفق
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `backend/tests/integration/test_waitlist_permissions.py`, `backend/tests/integration/test_checkin_permissions.py`, `backend/tests/integration/test_review_permissions.py`
- **قابل موازی‌سازی؟** خیر (باید بعد از BE-003, BE-004, BE-005 انجام شود)

#### BE-036: نوشتن Tests برای Concurrency Scenarios
- **عنوان:** تست رقابتی برای booking، coupon و payment
- **شرح:** با asyncio و concurrent requests، scenarios رقابتی تست کن. race conditions و deadlocks شناسایی شوند.
- **شناسه ویژگی مرتبط:** فیچر ۶ (رفع crash لغو رزرو)
- **اولویت:** P1
- **وابستگی:** BE-001
- **معیار پذیرش:**
  - concurrent booking creation تست شود
  - concurrent coupon redemption تست شود
  - concurrent payment processing تست شود
  - no race conditions یا deadlocks
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `backend/tests/integration/test_concurrency.py` (جدید)
- **قابل موازی‌سازی؟** خیر (باید بعد از BE-001 انجام شود)

#### BE-037: Load Testing با Locust
- **عنوان:** تست بار برای شناسایی bottlenecks
- **شرح:** با Locust، load tests برای endpoint‌های پرتکرار بنویس. response time، throughput و error rate تحت بار اندازه‌گیری شود.
- **شناسه ویژگی مرتبط:** فیچر ۱۷ (مقیاس)
- **اولویت:** P2
- **وابستگی:** —
- **معیار پذیرش:**
  - ۱۰۰ concurrent users بدون degradation
  - response time زیر ۵۰۰ms تحت بار
  - error rate زیر ۱٪
  - bottlenecks شناسایی و مستند شوند
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `backend/tests/load/locustfile.py` (جدید), `backend/tests/load/scenarios.py` (جدید)
- **قابل موازی‌سازی؟** بله

---

### فاز ۹: Database Migrations و Schema Changes (P0-P1)

#### BE-038: Migration برای Session Model
- **عنوان:** جدول sessions برای refresh tokens
- **شرح:** migration برای جدول sessions با فیلدهای user_id, refresh_token_hash, expires_at, revoked_at بساز.
- **شناسه ویژگی مرتبط:** فیچر ۱۰ (Refresh token)
- **اولویت:** P0
- **وابستگی:** BE-006
- **معیار پذیرش:**
  - migration reversible باشد
  - index روی user_id و refresh_token_hash باشد
  - foreign key به users باشد
  - test migration up/down
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `backend/migrations/versions/m0s017session.py`, `backend/app/models/session.py`
- **قابل موازی‌سازی؟** خیر (باید بعد از BE-006 انجام شود)

#### BE-039: Migration برای Device Tokens
- **عنوان:** جدول device_tokens برای FCM
- **شرح:** migration برای جدول device_tokens با فیلدهای user_id, token, platform, created_at, revoked_at بساز.
- **شناسه ویژگی مرتبط:** فیچر ۱۸ (پوش نوتیفیکیشن)
- **اولویت:** P1
- **وابستگی:** BE-017
- **معیار پذیرش:**
  - migration reversible باشد
  - unique constraint روی (user_id, token) باشد
  - index روی user_id باشد
  - test migration up/down
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `backend/migrations/versions/m0s019fcm.py`, `backend/app/models/device_token.py`
- **قابل موازی‌سازی؟** خیر (باید بعد از BE-017 انجام شود)

#### BE-040: Migration برای Index‌های Performance
- **عنوان:** افزودن index‌های composite برای query optimization
- **شرح:** migration برای index‌های composite روی (venue_id, slot_date)، (user_id, created_at) و فیلدهای frequently filtered بساز.
- **شناسه ویژگی مرتبط:** فیچر ۱۷ (مقیاس)
- **اولویت:** P1
- **وابستگی:** BE-021
- **معیار پذیرش:**
  - index‌ها query time را کاهش دهند
  - migration reversible باشد
  - EXPLAIN ANALYZE improvement نشان دهد
  - disk usage acceptable باشد
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `backend/migrations/versions/m0s020indexes.py`
- **قابل موازی‌سازی؟** خیر (باید بعد از BE-021 انجام شود)

#### BE-041: Migration برای Favorites Model
- **عنوان:** جدول favorites برای sync بین دستگاه‌ها
- **شرح:** migration برای جدول favorites با فیلدهای user_id, venue_id, created_at بساز.
- **شناسه ویژگی مرتبط:** فیچر ۲ (اتصال واقعی)
- **اولویت:** P1
- **وابستگی:** BE-023
- **معیار پذیرش:**
  - migration reversible باشد
  - unique constraint روی (user_id, venue_id) باشد
  - foreign keys به users و venues باشد
  - test migration up/down
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `backend/migrations/versions/m0s021favorites.py`, `backend/app/models/favorite.py`
- **قابل موازی‌سازی؟** خیر (باید بعد از BE-023 انجام شود)

#### BE-042: Migration برای Audit Logs
- **عنوان:** جدول audit_logs برای ردیابی actions حساس
- **شرح:** migration برای جدول audit_logs با فیلدهای user_id, action, resource_type, resource_id, ip_address, user_agent, timestamp بساز.
- **شناسه ویژگی مرتبط:** فیچر ۱۹ (Observability)
- **اولویت:** P1
- **وابستگی:** BE-027
- **معیار پذیرش:**
  - migration reversible باشد
  - index روی user_id و timestamp باشد
  - partitioning برای performance باشد
  - retention policy باشد
- **تلاش تخمینی:** S
- **فایل‌های تحت تأثیر:** `backend/migrations/versions/m0s022audit.py`, `backend/app/models/audit_log.py`
- **قابل موازی‌سازی؟** خیر (باید بعد از BE-027 انجام شود)

#### BE-043: پیاده‌سازی Rate Limiting پیشرفته
- **عنوان:** محدود کردن درخواست‌ها بر اساس IP و user
- **شرح:** rate limiter را با Redis پیاده‌سازی کن. limits مختلف برای auth endpoints (5/min), booking (10/min), general API (100/min). headers X-RateLimit-* برگردان.
- **شناسه ویژگی مرتبط:** فیچر ۱۶ (امنیت)
- **اولویت:** P1
- **وابستگی:** BE-007 (security hardening)
- **معیار پذیرش:**
  - rate limits اعمال شوند
  - 429 status code با Retry-After header
  - Redis failure → fail-closed یا graceful degradation
  - admin bypass capability باشد
  - logs برای violations
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `backend/app/utils/rate_limit.py`, `backend/app/main.py` (middleware), `backend/tests/test_rate_limiting.py`
- **قابل موازی‌سازی؟** بله

#### BE-044: پیاده‌سازی Request Validation Middleware
- **عنوان:** validation مرکزی برای تمام incoming requests
- **شرح:** middleware بنویس که content-type, payload size, sanitization را چک کند. SQL injection و XSS attempts را بلاک کند.
- **شناسه ویژگی مرتبط:** فیچر ۱۶ (امنیت)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - invalid content-type → 415
  - oversized payload → 413
  - XSS patterns → 400
  - SQL injection patterns → 400
  - request logging باشد
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `backend/app/middleware/request_validation.py`, `backend/app/main.py`
- **قابل موازی‌سازی؟** بله

#### BE-045: پیاده‌سازی Caching Layer با Redis
- **عنوان:** caching برای venue list, slot availability, pricing
- **شرح:** Redis cache layer اضافه کن. TTL-based invalidation، cache warming on startup، cache busting on updates.
- **شناسه ویژگی مرتبط:** فیچر ۱۸ (مقیاس‌پذیری)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - cache hit rate > 80%
  - stale data نباشد
  - cache invalidation درست کار کند
  - fallback به DB اگر Redis down باشد
  - metrics برای cache performance
- **تلاش تخمینی:** L
- **فایل‌های تحت تأثیر:** `backend/app/services/cache_service.py`, `backend/app/api/v1/venues.py`, `backend/app/api/v1/slots.py`
- **قابل موازی‌سازی؟** بله

#### BE-046: پیاده‌سازی Background Job Queue با Celery
- **عنوان:** offload کردن tasks سنگین به background workers
- **شرح:** email sending, notification dispatch, report generation, data export را به Celery منتقل کن. retry logic و dead letter queue اضافه کن.
- **شناسه ویژگی مرتبط:** فیچر ۱۸ (مقیاس‌پذیری)
- **اولویت:** P1
- **وابستگی:** —
- **معیار پذیرش:**
  - jobs در queue قرار گیرند
  - workers پردازش کنند
  - retry on failure (3 attempts)
  - dead letter queue برای failed jobs
  - monitoring dashboard
- **تلاش تخمینی:** L
- **فایل‌های تحت تأثیر:** `backend/app/tasks/email_tasks.py`, `backend/app/tasks/notification_tasks.py`, `backend/app/tasks/report_tasks.py`, `backend/celery_app.py`
- **قابل موازی‌سازی؟** بله

#### BE-047: پیاده‌سازی API Versioning
- **عنوان:** versioning برای backward compatibility
- **شرح:** API versioning با URL prefix (/api/v1/, /api/v2/) پیاده‌سازی کن. deprecated endpoints را علامت بزن. sunset headers اضافه کن.
- **شناسه ویژگی مرتبط:** فیچر ۲۰ (maintainability)
- **اولویت:** P2
- **وابستگی:** —
- **معیار پذیرش:**
  - multiple versions coexist کنند
  - deprecation warnings در response headers
  - documentation per version باشد
  - migration guide برای breaking changes
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `backend/app/api/v1/__init__.py`, `backend/app/api/v2/__init__.py` (جدید), `backend/app/main.py`
- **قابل موازی‌سازی؟** بله

#### BE-048: پیاده‌سازی GraphQL Endpoint (اختیاری)
- **عنوان:** GraphQL API برای flexible queries
- **شرح:** Strawberry GraphQL اضافه کن. schema برای venues, bookings, users تعریف کن. DataLoader برای N+1 problem.
- **شناسه ویژگی مرتبط:** فیچر ۲۰ (flexibility)
- **اولویت:** P2
- **وابستگی:** —
- **معیار پذیرش:**
  - schema introspection کار کند
  - queries با nested relations درست work کنند
  - N+1 problem حل شود
  - mutations برای create/update/delete
  - subscriptions برای real-time updates
- **تلاش تخمینی:** XL
- **فایل‌های تحت تأثیر:** `backend/app/graphql/schema.py` (جدید), `backend/app/graphql/resolvers.py` (جدید), `backend/app/main.py`
- **قابل موازی‌سازی؟** بله

#### BE-049: پیاده‌سازی Webhook System
- **عنوان:** webhook delivery برای third-party integrations
- **شرح:** سیستم webhook با retry logic, signature verification, event filtering پیاده‌سازی کن. admin UI برای manage webhooks.
- **شناسه ویژگی مرتبط:** فیچر ۲۰ (integrations)
- **اولویت:** P2
- **وابستگی:** BE-046 (Celery)
- **معیار پذیرش:**
  - webhooks قابل ثبت/unregister باشند
  - HMAC signature verification
  - retry with exponential backoff
  - delivery logs و status tracking
  - test webhook endpoint
- **تلاش تخمینی:** L
- **فایل‌های تحت تأثیر:** `backend/app/models/webhook.py`, `backend/app/services/webhook_service.py`, `backend/app/api/v1/webhooks.py`
- **قابل موازی‌سازی؟** خیر (باید بعد از BE-046 انجام شود)

#### BE-050: پیاده‌سازی Feature Flags System
- **عنوان:** feature toggles برای gradual rollout
- **شرح:** سیستم feature flags با database backend پیاده‌سازی کن. per-user, per-role, percentage-based rollouts پشتیبانی کند.
- **شناسه ویژگی مرتبط:** فیچر ۲۰ (deploy strategy)
- **اولویت:** P2
- **وابستگی:** —
- **معیار پذیرش:**
  - flags قابل toggle از admin panel باشند
  - targeting rules (user, role, %) support شوند
  - cache برای performance باشد
  - audit log برای flag changes
  - SDK برای frontend/mobile
- **تلاش تخمینی:** M
- **فایل‌های تحت تأثیر:** `backend/app/models/feature_flag.py`, `backend/app/services/feature_flag_service.py`, `backend/app/api/v1/feature_flags.py`
- **قابل موازی‌سازی؟** بله

---

## خلاصه وابستگی‌ها بین ترک‌ها

| Task ID | Depends On Frontend/Android Tasks | Notes |
|---------|----------------------------------|-------|
| BE-006 | FE-002, AND-007 | Refresh token consumption |
| BE-011 | FE-005, AND-013 | Payment gateway integration |
| BE-013 | FE-006 | Coupon validation |
| BE-017 | FE-019, AND-026 | FCM push notifications |
| BE-023 | FE-041 | Favorites sync |
| BE-024 | FE-046 | Feedback endpoint |
| BE-026 | FE-049 | Gamification |
| BE-029 | QA-019 | Monitoring setup |

## ماتریس اولویت‌ها

| اولویت | تعداد وظایف | درصد کل | توضیح |
|--------|-------------|---------|-------|
| P0 | ۱۵ | ۳۰٪ | حیاتی برای security و stability |
| P1 | ۲۵ | ۵۰٪ | مهم برای features و quality |
| P2 | ۱۰ | ۲۰٪ | بهبودهای تکمیلی |

## تخمین تلاش کلی

| اندازه | تعداد وظایف | مجموع تخمینی |
|--------|-------------|---------------|
| S | ۱۴ | ~۱۴ نفر-روز |
| M | ۲۶ | ~۵۲ نفر-روز |
| L | ۸ | ~۴۰ نفر-روز |
| XL | ۲ | ~۲۰ نفر-روز |
| **کل** | **۵۰** | **~۱۲۶ نفر-روز** |

---

**تهیه‌شده توسط:** تیم توسعه بک‌اند  
**تاریخ بازبینی بعدی:** ۲۰۲۶-۱۰-۱۵  
**وضعیت:** در حال اجرا
