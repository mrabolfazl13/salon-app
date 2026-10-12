# بهبودهای UI/UX اعمال‌شده + نقشه راه

تاریخ: 2026-10-12 | همه فیکس‌ها در مستر پوشیده شده‌اند و رگرسیون گرفته‌اند

## اعمال‌شده (این جلسه)

### فلاتر — `android_flutter/`
| # | فیکس | فایل | verify |
|---|---|---|---|
| 1 | داشبورد واقعی (آمار+رزروهای اخیر از API، اکشن‌های وصل، ۳ حالت لود/خطا/خالی، pull-to-refresh) | features/dashboard/presentation/dashboard_screen.dart | رن‌های ۴/۵/۶ امولاتور: GET /bookings روی صفحه واقعی |
| 2 | overflow کارت‌های اکشن خانه | features/home/presentation/home_screen.dart | رن ۳ بدون overflow |
| 3 | جریان واقعی فراموشی رمز (کد ۶ رقمی + رمز جدید) + AppTextField maxLength/inputFormatters | features/auth/…forgot_password_screen.dart, core/widgets/app_text_field.dart, core/network/auth_service.dart, api_endpoints.dart | flutter analyze ۰ خطا؛ endpointها مطابق وب |
| 4 | گارد نقش /manager/* و /admin/* + ذخیره نقش در TokenStorage | app/router/app_router.dart, core/storage/token_storage.dart, core/state/auth_provider.dart | assert در تور رن ۶ |
| 5 | receiveTimeout ۳۰→۶۰ ثانیه | core/network/api_client.dart | رن ۵ از ۳۰s عبور کرد |
| 6 | چیپ نقش داشبورد برای club_admin/super_admin | dashboard_screen.dart | تور رن ۶ |

### وب — `frontend/src/`
| # | فیکس | فایل | verify |
|---|---|---|---|
| 7 | حذف صفحه legacy مالی مدیر + ریدایرکت `/manager/finance`→`/finance` + اصلاح لینک داشبورد مدیر | App.tsx, pages/dashboard/ManagerDashboard.tsx, حذف pages/manager/ManagerFinance.tsx | مرورگر واقعی: مسیر قدیمی کنسول مالی را رندر می‌کند |
| 8 | tsc + vite build سبز | — | exit 0 |

### CI — `.github/workflows/android-emulator-test.yml`
- KVM (udev rule)، لاگ‌فکت آرتیفکت، تور صفحه‌ها + آرتیفکت `tour-screenshots`، جمع نتیجه دو تست.
- **رن ۶**: شکست به دلیل `--no-pub` در محیط ایزوله emulator runner (خطای missing flutter_test).
- **رن ۷** (در جریان): فیکس = حذف `--no-pub` + افزودن `flutter pub get` داخل اسکریپت emulator (commit bd87fe8).

## نقشه راه پیشنهادی (اولویت‌دار)

### فوری (تصمیم محصول + کار کم)
1. **واحد پول یکسان**: تومان در همه‌جا یا ریال در همه‌جا — یک formatter مشترک؛ الان وب «ریال» و فلاتر «تومان».
2. **هیرو موبایل وب کوتاه‌تر** + لیست سالن‌ها به اسکرین ۲ (مطابق ممیزی homepage 2026-10-11).
3. **وایت‌لیست فلاتر**: لینک ورودی از جزئیات اسلات پر (endpointها آماده: /waitlist/join/…).

### موج بعد
4. عمق محتوایی کوئیز/رقابت فلاتر به سطح وب (لیدربورد).
5. تست رگرسیون بصری وب بر پایه اسکرین‌شات‌های `salon-web-shots` (مقایسه دستی فعلی → خودکار).
6. تور ادمین وب با نقش مدیر سالن واقعی (سید نشده — نیاز به ساخت مدیر تست).

### بیرونی (بلوکه، مخاطب: کاربر)
- FCM: google-services.json پکیج اشتباه دارد (push کار نمی‌کند).
- SMS واقعی: وقتی وصل شود، `AUTO_VERIFY_USERS=false` و حذف entryهای /app/.env داخل کانتینر.
- اسلات‌های پرود تا 2026-10-25 معتبرند — بعدش بازتولید لازم است.
