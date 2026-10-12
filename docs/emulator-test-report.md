# گزارش تست امولاتور — مسیر رزرو و تور صفحه‌ها

تاریخ: 2026-10-12 | محیط: GitHub Actions ubuntu-latest، امولاتور API-30 google_apis x86_64 (pixel_5)، API پروداکشن http://2.189.255.225/api/v1

## چرا امولاتور محلی؟
SDK Manager محلی به دلیل تحریم/mirrorها دانلود system-image را کامل نمی‌کند؛ در عوض مسیر «امولاتور واقعی» = job اختصاصی CI (`.github/workflows/android-emulator-test.yml`) با KVM فعال. دستگاه فیزیکی متصل (AYAV6R3C11007538) در جلسه‌های قبل همین مسیر رزرو را end-to-end تأیید کرده بود (v1.6.1).

## تاریخچه رن‌ها
| رن | Commit | نتیجه | ریشه |
|---|---|---|---|
| 1 | 26f0507 | شکست | بدون KVM — بوت TCG ۳۶۷ ثانیه، اسکریپت اجرا نشد (udev rule اضافه شد) |
| 2 | fe93639 | شکست | ۶× RenderFlex overflow در home_screen:331 (فیکس: aspect 1.3) + قطع اتصال |
| 3 | efdfb13 | شکست واقعی تست | متن دکمه اشتباه در تست (`مشاهده سالن‌ها` → دکمه واقعی `رزرو جدید`)؛ register+login هر دو ۲۰۰ |
| 4 | efdfb13 | شکست | دکمه «ورود» زیر کیبورد نرم — tap با warnIfMissed:false بی‌صدا خورد؛ فیکس: unfocus + ensureVisible |
| 5 | 1bb493e | شکست | پیشرفت: register ۲۰۰ → **login ۲۰۰** → GET /bookings ✓؛ سپس race در حلقه retry خودم: tap روی دکمه‌ای که در transition ناوبری از درخت خارج شده بود |
| 6 | eb616a6 | شکست | `flutter test --no-pub` داخل emulator runner نتوانست flutter_test را پیدا کند (محیط ایزوله) — خطا: "Error: cannot run without a dependency on either package:flutter_test or package:test" |
| 7 | bd87fe8 | در جریان | فیکس: حذف `--no-pub` و افزودن `flutter pub get` داخل اسکریپت emulator runner قبل از هر دو تست |

## الگوهای پایدار برای تست فلاتر روی امولاتور (درس‌های این جلسه)
1. `warnIfMissed: false` شکست‌های خاموش می‌سازد — همیشه قبل از tap: `FocusManager.instance.primaryFocus?.unfocus()` + `ensureVisible` + re-check finder.
2. `AppButton` در حالت isLoading متن را با اسپینر عوض می‌کند → finder متنِ دکمه در حین لود ۰ نتیجه می‌دهد.
3. API پرود از رانرهای آمریکا کند است — receiveTimeout کلاینت ۳۰s→**۶۰s** (api_client.dart)؛ دو رن روی /venues تایم‌اوت خورد.
4. تسک‌های با `flutter test integration_test` نتیجه می‌دهند؛ «No tests were found» یعنی اتصال قبل از گزارش قطع شده.

## لاگ‌ها
`C:/Users/Alex/.qoder-tmp/emu/emu_log.txt` (رن1) … `emu_log5.txt` (رن5) — آرتیفکت logcat در هر رن آپلود می‌شود.

## تور صفحه‌ها (رن ۶ به بعد)
`integration_test/screens_tour_test.dart` + درایور `test_driver/integration_test.dart`:
- مهمان: خانه، جستجو، علاقه‌مندی، لاگین، ثبت‌نام، فراموشی رمز
- گارد نقش: کاربر عادی به /admin می‌رود → باید به داشبورد برگردد (assert)
- کاربر (09351234501): داشبورد، سالن‌ها، جزئیات سالن ۸، رزروها، تیم‌ها، کشف تیم، رقابت‌ها، شگفت‌انگیز، کوئیز، قراردادها، بازی‌ها، پروفایل
- super_admin (09123456789 — فقط‌خواندنی): خروج از UI، ورود مجدد، /admin، /admin/users، /admin/venues، /manager
- ~۲۵ اسکرین‌شات PNG → آرتیفکت `tour-screenshots`
