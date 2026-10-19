# TEST RESULTS — نتایج واقعی تست‌ها

هر رکورد شامل: فرمان دقیق، محیط، خروجی، تاریخ.

## 1. وضعیت پایه (قبل از اصلاحات) — ثبت‌شده در 2026-10-18

| # | آزمون | فرمان | نتیجه | خروجی خام |
|---|---|---|---|---|
| 1 | Backend unit/integration | `python -m pytest tests -q` (cwd=`backend/`) | ✅ 792 passed | `792 passed, 54 warnings in 132.10s` |
| 2 | TypeScript typecheck | `pnpm exec tsc --noEmit -p tsconfig.app.json` (cwd=`frontend/`) | ✅ exit 0 | بدون خطا |
| 3 | Frontend unit | `pnpm exec vitest run` | ✅ 193 passed / 22 files | — |
| 4 | Web build | داخل `tauri android build` (vite build) | ✅ موفق | 13158 ماژول |
| 5 | Tauri Windows release | `pnpm tauri build` | ✅ موفق | MSI/NSIS/exe |
| 6 | Tauri Android arm64 | `pnpm tauri android build --target aarch64 --apk` | ✅ موفق + نصب روی دستگاه | SHA-256 `D913317D…A248A260` |
| 7 | Tauri Android universal | `pnpm tauri android build --apk` | ⏳ در جریان هنگام شروع مأموریت | — |
| 8 | Playwright موجود | `pnpm exec playwright --version` | ✅ 1.64.0 (مرورگرها موجود) | — |
| 9 | E2E موجود | `frontend/e2e/smoke.spec.ts`, `ui-ux-audit.spec.ts` | ⏳ اجرا در فاز ۱ | — |

## 2. اجرای E2E در این مأموریت

| # | آزمون | فرمان | Viewport/دستگاه | نقش | نتیجه | شاهد |
|---|---|---|---|---|---|---|
| 1 | Route sweep | `MOBILE_AUDIT=1 node node_modules/@playwright/test/cli.js test e2e/mobile-audit.spec.ts` | ۳۲۰×۵۶۸ و ۳۷۵×۸۱۲ | customer / manager / admin (لاگین واقعی) | ✅ ۱۵۴ ردیف، `incomplete=0` | `audit-artifacts/audit-report-routes.json` |
| 2 | Viewport matrix | همان | ۹ اندازه (۶ عمودی + ۳ افقی) | نقش‌های بالا | ✅ ۸۱ ردیف، `smallTap=0`، `maxOverflowX=0`، `imgsNoAlt=0` | `audit-artifacts/audit-report-viewports.json` |
| 3 | Focus ring + tab order | همان | ۳۷۵×۸۱۲ | customer | ✅ `noRing=0`، `dups=0` در ۵ مسیر | `audit-artifacts/audit-report-keyboard.json` |
| 4 | Open layer keyboard | همان | ۳۷۵×۸۱۲ | customer | ✅ popover تاریخ با Tab/Escape رفتار استاندارد دارد | `audit-artifacts/harness-final.log` |

مجموع: `4 passed (7.4m)` در `audit-artifacts/harness-final.log`.

تنها خطاهای شبکهٔ باقی‌مانده: `images.unsplash.com` با `ERR_CONNECTION_REFUSED` (محیطی، F-27).

## 3. تست‌های دستی صفحه‌به‌صفحه

به `PAGE-BY-PAGE-AUDIT.md` ارجاع داده می‌شود؛ هر `RETEST_PASSED` شاهد خود را در `BUG-TRACKER.md` دارد.

## 4. تست مجوز/امنیت (Agent E)

| # | سناریو | نقش | Endpoint | انتظار | نتیجهٔ واقعی | حکم |
|---|---|---|---|---|---|---|
| 1 | دسترسی به مسیرهای مدیریتی | customer | `/admin/users`، `/finance` | ۴۰۳ / ریدایرکت | ریدایرکت به داشبورد نقش | ✅ PASS |
| 2 | تفکیک دادهٔ مالی | manager | `/api/v1/finance/*` | فقط سالن‌های خودش | مطابق ماتریس نقش | ✅ PASS |
| 3 | توکن/رمز در لاگ | همه | — | ثبت نشود | هیچ توکنی در گزارش‌ها نیست | ✅ PASS |

جزئیات: `audit-artifacts/role-api-matrix.json` و `ROLE-MATRIX.md`.

## 5. تست‌های ناتمام/مسدود

| # | آزمون | علت عدم اجرا | اثر | اقدام لازم |
|---|---|---|---|---|
| 1 | Screen reader (NVDA/TalkBack) | بدون دستگاه فیزیکی | اعلام‌ها فقط دستی تأییدشدنی | اجرا روی دستگاه واقعی |
| 2 | Safe-area / keyboard native | فقط در WebView اعمال می‌شود | خروجی مرورگر کافی نیست | آزمون در APK |

## 6. تست‌های `NATIVE-ONLY` (در مرورگر قابل‌تأیید نیستند)

| مورد | چرا در مرورگر قابل‌تست نیست | وضعیت |
|---|---|---|
| اسکن QR در WebView | نیازمند دوربین Native | NATIVE-ONLY |
| اعلان Push / FCM | نیازمند Google Play Services | NATIVE-ONLY |
| رفتار Back سخت‌افزاری اندروید | نیازمند دستگاه | NATIVE-ONLY |
| مجوزهای فایل/ذخیره‌سازی Tauri | نیازمند Runtime Tauri | NATIVE-ONLY |
| Reader صفحه (VoiceOver/TalkBack) | نیازمند دستگاه واقعی | BLOCKED |

## 7. گیت‌های نهایی (۲۰۲۶-۱۰-۱۹)

| گیت | نتیجه | جزئیات |
|---|---|---|
| `tsc --noEmit` | ✅ exit 0 | بدون خطا |
| `eslint src` | ✅ exit 0 | ۰ خطا، ۲۰۱ هشدار از قبل موجود |
| `vitest run` | ✅ ۲۰۰/۲۰۰ | ۲۳ فایل، شامل `contrast.test.ts` |
| `vite build` | ✅ exit 0 | production |
| Playwright mobile-audit | ✅ `4 passed (7.4m)` | ۱۵۴ + ۸۱ ردیف، keyboard صفر خطا |
