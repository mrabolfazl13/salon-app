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
| frontend: `pnpm tauri build` (ویندوز، همین دستگاه) | ⏳ در حال اجرا — نتیجه در ادامه ثبت می‌شود |
| Tauri Android build محلی | ⏳ نوبت بعدی (NDK 27 + هر ۴ هدف Rust روی دستگاه نصب است؛ `ANDROID_HOME=G:\SDK`) |

### ⏳ در حال اجرا

- `pnpm tauri build` (Tauri Windows MSI/NSIS) در پس‌زمینه.

### 📋 باقی‌مانده (گام بعدی مشخص)

1. ثبت نتیجهٔ بیلد Windows + مسیر artifactها (MSI/EXE) و اندازهٔ فایل‌ها.
2. بیلد Tauri Android محلی (`pnpm tauri android build --apk --aab`) + راستی‌آزمایی `aapt2`/`apksigner` + ثبت ABIهای واقعی خروجی.
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
