# CURRENT STATE — وضعیت پایه پیش از شروع اصلاحات

**تاریخ شروع:** 2026-10-18
**شاخه:** `flutter-free-web-tauri`
**مبنای کد:** آخرین commit پیش از شروع این مأموریت (`docs(state): record Tauri Android arm64 release build...`)
**مالک سند:** Agent A (Lead)

---

## 1. وضعیت Build و Test در لحظه شروع (اندازه‌گیری‌شده، نه ادعا)

| گیت | فرمان | نتیجه | تاریخ اجرا |
|---|---|---|---|
| Backend tests | `python -m pytest tests -q` (از `backend/`) | **792 passed, 54 warnings** در 132.10s | 2026-10-18 |
| Frontend typecheck | `tsc --noEmit -p tsconfig.app.json` | exit 0 | 2026-10-18 |
| Frontend unit tests | `vitest run` | **193 passed / 22 فایل** | 2026-10-18 |
| Web build | `vite build` (داخل `tauri android build`) | موفق — 13158 ماژول، `dist/` تولید شد | 2026-10-18 |
| Tauri Windows release | `pnpm tauri build` | موفق — MSI + NSIS + exe | 2026-10-18 |
| Tauri Android release (arm64) | `pnpm tauri android build --target aarch64 --apk` | موفق — 20,733,370 B، SHA-256 `D913317D…A260`، نصب و اجرا روی دستگاه واقعی | 2026-10-18 |
| Tauri Android universal | `pnpm tauri android build --apk` | در جریان در لحظهٔ شروع این مأموریت (هدف: پشتیبانی همهٔ ABIها) | 2026-10-18 |

## 2. مشخصات Runtime پروژه

| مورد | مقدار |
|---|---|
| Frontend | React 18 + TypeScript + Vite 5 + MUI + TanStack Query (طبق `frontend/package.json`) |
| Dev server | `vite` روی پورت **3001** (strictPort در config پلی‌رایت) |
| Backend | FastAPI + SQLModel + Alembic (`backend/`) |
| DB در dev/test | SQLite (تست‌ها با `sqlite:///…` و engine اختصاصی) |
| مسیر API در dev | `/api/v1` (same-origin از طریق Vite proxy) |
| مقصد پروکسی پیش‌فرض dev | `VITE_PROXY_TARGET` در `.env.development` → `http://2.189.255.225` |
| دسترسی شبکه به مقصد prod | `2.189.255.225:80` از این دستگاه **REACHABLE** (تست TCP، 2026-10-18) |
| ابزار E2E | Playwright `1.64.0` نصب — مرورگرها در `%LOCALAPPDATA%\ms-playwright` موجود |
| تست‌های E2E موجود | `frontend/e2e/smoke.spec.ts`، `frontend/e2e/ui-ux-audit.spec.ts` |
| Playwright config | `frontend/playwright.config.ts` — `webServer` خودش vite با `--strictPort` بالا می‌آورد، `reuseExistingServer: true` |

## 3. نقش‌ها و حساب‌های آزمایشی موجود در مخزن

طبق `backend/app/models/user.py` (`UserRole`) و `backend/scripts/seed_full_demo.py`:

| نقش | حساب‌های demo | رمز |
|---|---|---|
| `super_admin` | `09120000001` | `admin123` |
| `venue_manager` | `09121000001`, `09121000002` | `manager123` |
| staff (role=`user` + کارمند سالن) | `09122000001` … `09122000004` | `staff123` |
| `user` | `09123000001` … `09123000012` (دو مورد آخر phone-verified نیستند) | `user123` |
| `coach` | **در seed یافت نشد** → در sandbox ساخته می‌شود (فقط محیط dev) |
| `club_admin` | در seed یافت نشد → رفتار آن با `venue_manager` یکسان است (`ProtectedRoute`) |

Seed sandbox: `python scripts/seed_full_demo.py --reset --sqlite <PATH>` (DB یک‌بارمصرف، بدون لمس دادهٔ واقعی).

## 4. محدودیت‌های محیطی ثبت‌شده (صادقانه)

1. **گوشی فیزیکی در این مأموریت استفاده نمی‌شود** (طبق محدودیت قطعی مأموریت). تست UI موبایل = نسخهٔ Web در Playwright با viewportهای موبایل. تست‌های Native/WebView در ستون جدا (`NATIVE-ONLY`) ثبت می‌شوند.
2. Backend مقصد prod (`2.189.255.225`) قابل‌دسترس است، ولی **همهٔ عملیات نوشتن فقط روی sandbox محلی SQLite** انجام می‌شود تا دادهٔ واقعی کاربران تغییر نکند. مسیر prod فقط برای بررسی خواندنی/سازگاری.
3. حساب `coach` در seed نیست → در sandbox ساخته می‌شود.
4. دستگاه build با دیسک محدود (F: ~7GB) مواجه است؛ بیلدهای سنگین باید با پاکسازی فضایی یا `CARGO_TARGET_DIR` مدیریت شوند.
5. ابزارهای analytics/FCM/SMS/MinIO در sandbox محلی ممکن است در دسترس نباشند → وابستگی‌ها به‌صورت `BLOCKED` ثبت می‌شوند، نه «تست‌شده».

## 5. فایل‌های ورودی کلیدی برای این مأموریت

| فایل | نقش در مأموریت |
|---|---|
| `frontend/src/App.tsx` | منبع حقیقت Routeها |
| `frontend/src/components/auth/ProtectedRoute.tsx` | منطق نگهبانی نقش‌ها + `allowStaff` |
| `frontend/src/pages/**` | ۴۱ صفحهٔ قابل‌بررسی |
| `frontend/src/services/**` | لایهٔ API Client |
| `frontend/src/theme/**` | Design tokens موجود |
| `frontend/src/styles/**` | CSS سراسری |
| `frontend/e2e/**` | زیرساخت تست موجود |
| `backend/app/**` | Endpointها، مجوزها، مدل‌ها |
