# Salon — اپ اندروید نیتیو (Kotlin + Jetpack Compose + Material 3)

خروجی چهارم پروژه در کنار Web/Tauri — **هیچ فایلی از Tauri/web حذف یا تغییر نکرده است.**

## قواعد بیلد (مهم)

**بیلد فقط در GitHub Actions** (`../../.github/workflows/kotlin-android.yml`) — بیلد محلی نداریم.
- هر push روی `android-app/**` → job `build`: `assembleDebug` + unit tests + lint → artifact `Salon-Android-debug`
- هر tag → job `release`: APK/AAB امضاشده (keystore از Secret `ANDROID_KEYSTORE_BASE64`) → GitHub Release
- فونت‌های Vazirmatn در CI به `app/src/main/res/font/` دانلود و باندل می‌شوند

راستی‌آزمایی خروجی: دانلود APK از artifact → `adb install -r app-debug.apk` → اجرا روی دستگاه.

## ساختار (Clean Architecture)

```
android-app/
├─ app/      # شل: ناوبری، DI، MainActivity، فونت، featureها
│  └─ feature/<x>/ui → ViewModel؛ data/api → data/repository (Interface + Impl)
└─ core/     # مشترک: designsystem (تم M3/کامپوننت‌ها)، network (Retrofit+JWT refresh)،
             # common (جلالی/ارقام فارسی/برچسب‌ها/AppError)، datastore (SessionStore)، model
```

وابستگی جهت‌دارد: `app → core`؛ هرگز برعکس. در فازهای بعد featureها به ماژول مستقل استخراج می‌شوند.

## استک
- Kotlin 2.0 · Compose BOM 2024.09 · Material 3 · minSdk 26 / target 35
- Hilt · Retrofit + kotlinx-serialization · OkHttp WebSocket (M3) · DataStore · Coil · Navigation Compose
- RTL کامل، ارقام فارسی، تاریخ Jalali فقط در UI (ISO در لایهٔ داده)

## قواعد UI/UX اجباری
- Touch target ≥ 44dp (`MinTouchTarget`)
- کنتراست ink چیپ‌ها تنظیم‌شده برای هر دو تم
- contentDescription فارسی + `heading()` semantics — TalkBack-friendly
- Skeleton / EmptyState / ErrorState سراسری؛ پیام خطا از `detail` فارسی سرور
- Motion ملایم؛ تم روشن/تیره/سیستمی

## تست
- `core/src/test`: JalaliUtil (تطبیق با jalaali-js)، PersianText (formatPrice)
- CI گیت: `:app:assembleDebug :core:testDebugUnitTest :app:testDebugUnitTest :app:lintDebug`

## نقشهٔ فازها
- **M1** زیرساخت + ورود/ثبت‌نام + سالن‌ها و جزئیات (تماس با سالن) ✅ این repo
- **M2** جریان رزرو کامل (سانس‌ها/کوپن/PricingBreakdown/رزروهای من)
- **M3** پروفایل/نوتیفیکیشن/WebSocket/دیل‌ها
- **M4** فضای مدیر سالن (تأیید رزرو، قرارداد، شیفت، QR، CRM، پرسنل)
- **M5** بازی‌ها/تیم‌ها/تورنمنت/مالی/ادمین

## پیکربندی سرور
`core/src/main/java/ir/salon/core/network/CoreBuildConfig.kt` — `API_BASE_URL` و `WS_BASE_URL`.
