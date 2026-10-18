# وضعیت پروژه (AGENT_BUILD_STATE)

**به‌روز شده:** 2026-10-18 | **شاخه:** `flutter-free-web-tauri` (از `master@ed750df`)

معماری نهایی و محدودشده: **Web + Tauri Windows + Tauri Android** — فقط همین سه خروجی.
Flutter به‌طور کامل از محصول، توسعه، تست، CI/CD و انتشار حذف شده است.

---

## فاز جاری: فاز ۲ (یکپارچگی کلاینت‌ها) — حذف Flutter انجام شد

### ✅ تکمیل‌شده در این چرخه (حذف Flutter — مأموریت بخش ۴)

| مورد | جزئیات |
|---|---|
| `build-all-platforms.yml` | بازنویسی شد: فقط `tauri-android`، `tauri-windows`، `react-web` + `create-release` (فقط روی tag). دروازهٔ release از `flutter-android-release` به «موفقیت هم‌زمان `tauri-android` و `tauri-windows`» تغییر کرد. سه job Flutter (`flutter-android-debug/release`, `flutter-ios`) و سه job Tauri iOS/Linux/macOS حذف شدند |
| `quality-gates.yml` | job `mobile-tests` (flutter analyze) حذف؛ بخش Flutter در `build-verify` حذف؛ `quality-report` به‌روز شد |
| workflowهای Flutter-محور | `android-emulator-test.yml`، `test-build.yml`، `.github/scripts/run-emulator-tests.sh` حذف شدند |
| کد Flutter | `android_flutter/`، `lib/`، `ios/`، `web/`، `android/`، `build/` (خروجی‌های tracked)، `test/` ریشه، `pubspec.yaml`، `pubspec.lock`، `.metadata`، `.flutter-plugins-dependencies`، `futsal_booking_flutter.iml`، `analysis_options.yaml` ریشه — با `git rm` حذف شدند (تاریخچه در git محفوظ است، ~۶۷۰ فایل) |
| APKهای بزرگ | `frontend/Salon-v0.2.0-arm64.apk` و `frontend/Salon-v1.1.0-universal.apk` از ایندکس git خارج شدند (فایل روی دیسک باقی است؛ `.gitignore` برای `frontend/*.apk` اضافه شد). همین دو فایل deploy روی Cloudflare Workers را با «Asset too large» می‌شکستند (مورد C12.4/X5 در `frontend/docs/FINAL_REVIEW_TASKS.md`) |
| اسکریپت‌ها | `scripts/setup-github-secrets.ps1/.sh` → مسیر keystore به `frontend/src-tauri/gen/android/app/` تغییر کرد و پسوردها دیگر هاردکد نیستند (از محیط خوانده می‌شوند) |
| `.gitignore` | `frontend/*.apk` و `frontend/*.aab` اضافه شد |
| مستندات | `ANDROID_BUILD.md` بازنویسی شد به راهنمای مرجع Tauri Android + Tauri Windows؛ `DEPLOYMENT_GUIDE.md` (بخش‌های Firebase/Keystore/به‌روزرسانی اپ/عیب‌یابی) به Tauri منتقل شد؛ `.github/workflows/README.md` بازنویسی شد؛ `docs/current-state.md` سند تاریخی نشانه‌گذاری شد؛ `CHANGELOG.md` ورودی v1.7.0 گرفت |
| `AGENT_BUILD_STATE.md` | همین فایل — از سند قدیمیِ «بازیابی بیلد Flutter» به وضعیت فعلی تبدیل شد |

### ✅ راستی‌آزمایی اجراشده در این چرخه (شواهد واقعی، محلی)

| گیت | نتیجه |
|---|---|
| YAML همهٔ workflowها (`python yaml.safe_load`) | هر چهار فایل parse شد؛ jobها: `build-all-platforms` → `tauri-android, tauri-windows, react-web, create-release`؛ `quality-gates` → بدون `mobile-tests` |
| `rg -i "flutter|android_flutter|pubspec"` روی `.github`، `scripts`، `docker-compose.yml` | فقط تکرار متن «Flutter is fully removed» در مستندات — هیچ ارجاع اجرایی |
| backend: `python -m pytest tests -q` | **792 passed, 54 warnings در 132.10s** (تنها DeprecationWarningهای sqlmodel `session.query`) |
| frontend: `tsc --noEmit -p tsconfig.app.json` | exit 0 |
| frontend: `vitest run` | **193 passed / 22 فایل** در ~70s |
| frontend: `pnpm tauri build` (ویندوز، همین دستگاه) | ✅ موفق — `Salon_1.2.0_x64_en-US.msi` (6,676,480 B، SHA-256 `79FF9FA8…A693`) + `Salon_1.2.0_x64-setup.exe` NSIS (4,962,027 B، SHA-256 `88A1A0C6…2ED`) + `tauri-app.exe` (16,456,704 B) در `frontend/src-tauri/target/release/bundle/` |
| Tauri Android release build (arm64) | ✅ **موفق — APK نصب و اجرا شد**. جزئیات کامل در بخش «بیلد اندروید arm64» پایین |
| `pnpm tauri android dev` (گوشی `AYAV6R3C11007538`) | ❌ رها شد (به درخواست کاربر) — سه ران: دیسک پر (`os error 112`)، فلاش ناپایدار (`os error 3`)، و ران سوم روی `CARGO_TARGET_DIR=G:` کامپایل کامل شد (`Finished dev profile in 18m 40s`) اما CLI در «Opening Android Studio» خطا داد (`os error -2147024894` — Android Studio نصب نیست). درس‌ها: `--device` در CLI وجود ندارد (positional است)؛ انتخاب تعاملی دستگاه در شل غیرتعاملی حلقه می‌زند |

### ✅ بیلد اندروید arm64 (شواهد کامل)

| مورد | مقدار |
|---|---|
| فرمان | `pnpm tauri android build --target aarch64 --apk` (release، فقط arm64) |
| APK | `frontend/src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk` |
| اندازه | **20,733,370 B (~20.7MB)** |
| SHA-256 | `D913317D844BA21D85302012447D3C5C6F89B8A0063D11FBB49618122148A260` |
| ABI داخل APK | فقط `lib/arm64-v8a/libtauri_app_lib.so` (تأیید با `tar -tf`) |
| بسته/نسخه | `com.alex.tauri_app`، versionName `1.2.0`، versionCode `1002000`، minSdk 24 / targetSdk 36 |
| امضا | `apksigner verify --print-certs` → exit 0؛ `CN=Salon App, OU=Dev, O=Salon, L=Qom, ST=Qom, C=IR` (signing این ریپو؛ keystore عرضهٔ GitHub هنوز تنظیم نیست) |
| زمان بیلد | Rust release: `5m 35s` (سپس `2m 07s` در بازخوانی gradle بیلد) + vite build ~52s |
| نصب روی گوشی | `adb install -r …` → **Success** |
| اجرا | `monkey -p com.alex.tauri_app -c LAUNCHER 1` → `topResumedActivity=com.alex.tauri_app/.MainActivity` (visible, fullscreen) |
| تأیید بصری | اسکرین‌شات واقعی از گوشی: صفحهٔ فرود فارسی/RTL + نویگیشن پایین (`C:\Users\Alex\AppData\Local\Temp\opencode\salon_device.png`) |
| خطاهای مسیر (غیرمهلک، ثبت‌شده) | (۱) Kotlin daemon cross-drive: `C:\Users\Alex\.cargo\…\Plugin.kt` vs `F:\…\gen\android` → gradle خودش «Compile without Kotlin daemon» را اجرا کرد و بیلد به پایان رسید (۲ بار). (۲) `os error 1117` I/O گذرا روی G: (۳) سیملینک شکستهٔ `jniLibs/x86_64` از بیلدهای قبلی — خود CLI پاکش کرد |

راه‌حل‌های به‌کاررفته: بیلد روی F (به درخواست کاربر)، پراکسی `127.0.0.1:1080` برای cargo و gradle، پاکسازی فضای دیسک (آرتیفکت‌های release قدیمی Android و `target/debug` دسکتاپ).

### ⏳ در حال اجرا

- هیچ بیلدی. آخرین وضعیت: APK arm64 روی گوشی `AYAV6R3C11007538` نصب و در حال اجراست.

### 📋 باقی‌مانده (گام بعدی مشخص)

1. ✅ ثبت نتیجهٔ بیلد Windows + مسیر artifactها (MSI/EXE) و اندازهٔ فایل‌ها — انجام شد (ردیف مربوطه بالا).
2. ✅ بیلد Tauri Android محلی (arm64 release APK) + راستی‌آزمایی `apksigner` + ثبت ABI واقعی خروجی + نصب و اجرا روی گوشی — انجام شد. باقی‌مانده: AAB (فقط APK گرفته شد؛ AAB برای Play Store است و ناشناس/unsigned ارزش عملی ندارد).
3. `pnpm build` وب به‌عنوان شاهد مستقل (بخشی از `tauri build` اجرا می‌شود؛ خروجی `frontend/dist` بررسی شود).
4. Push شاخه و دیدن اجرای واقعی GitHub Actions (بدون دسترسی push محدود است — ثبت می‌شود).
5. ممیزی‌های بخش ۳ مأموریت (ARCHITECTURE/FEATURE_MATRIX/…) که در `frontend/docs/FINAL_REVIEW*.md` و ریشهٔ ریپو به‌صورت پراکنده وجودند — یکپارچه‌سازی در `docs/audit/` در صورت نیاز.
6. تصمیم‌های بازِ ثبت‌شده در `frontend/docs/FINAL_REVIEW_TASKS.md`: X1–X9 (اکانت تست E2E، FCM، keystore عرضه، درگاه واقعی، deploy prod و …) — همه بیرون از محیط این دستگاه.

### 🚧 موانع محیطی (ثبت‌شده، نه انکارشده)

- این دستگاه به `api.salon.absadeghi.ir` و prod دسترسی ندارد (resolve نمی‌شود) — راستی‌آزمایی زندهٔ E2E مثل راندهای قبل مسدود است؛ شواهد در سطح تست/بیلد محلی است.
- بدون keystore عرضه: خروجی Android این دستگاه و CI بدون secretها **unsigned** است؛ MSI/NSIS بدون certificate کد-امضا نیستند. ادعای «امضاشده» زده نمی‌شود.
- دسترسی push به origin از این جلسه هنوز آزموده نشده؛ commit روی شاخهٔ محلی است.

---

## وضعیت میراث Flutter (پایان‌یافته)

سند قبلیِ این فایل (بازیابی بیلد Flutter، ران 37191904535، release v1.0.0 ده-asset) مربوط به
معماری حذف‌شده است و در تاریخچهٔ git (`git show master:AGENT_BUILD_STATE.md`) محفوظ است.
هیچ مسیر اجرایی، pipeline یا artifact تولیدکنندهٔ Flutter باقی نمانده است.
