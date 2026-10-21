# نتایج تست‌ها (Test Results)

**تاریخ:** ۲۰۲۶-۱۰-۲۲

---

## خلاصه

| دسته | نتیجه | جزئیات |
|------|--------|--------|
| TypeScript (`tsc --noEmit`) | ✅ PASS (exit 0) | بدون خطا (دور دوم F-45…F-55) |
| ESLint | ✅ PASS (exit 0) | ۰ خطا |
| Vitest (unit) | ✅ PASS | ۲۰۳ تست در ۲۴ فایل |
| Vite build | ✅ PASS | `built in 1m 8s` با heap ۳۰۷۲MB |
| Playwright E2E (mobile-audit harness) | ✅ PASS | ۴ تست در ۷٫۴m: route sweep + viewport matrix + ۲ تست کیبورد |
| Playwright keyboard tests | ✅ PASS | `noRing=0` و `dups=0` در ۵ مسیر (assertion سخت‌گیرانه) |
| تأیید بصری دور دوم | ✅ PASS | ۹ مسیر ۳۷۵px، `scrollWidth=375`، بدون سرریز |
| Backend pytest | ⏳ PENDING | نیاز به اجرای جداگانه در محیط backend |

## تست‌های جدید اضافه‌شده

### `src/utils/contrast.test.ts` (۶ تست)

| تست | موضوع | وضعیت |
|-----|-------|--------|
| composite light green | ترکیب رنگ شفاف روی سفید | ✅ |
| composite teal | ترکیب رنگ دیگر | ✅ |
| ratio black/white | کنتراست ماکزیمم = ۲۱ | ✅ |
| readableText cyan→black | تیره‌سازی تا ≥۴.۵:۱ | ✅ |
| chipInk paid/unpaid | رنگ چیپ پرداخت | ✅ |
| dark mode lightening | روشن‌سازی روی زمینه تیره | ✅ |

### `e2e/mobile-audit.spec.ts` — تست‌های کیبورد

| تست | موضوع | یافته‌ها | وضعیت |
|-----|-------|----------|--------|
| focus ring + tab order | حلقه تمرکز روی ۵ مسیر | ۰ no-ring، ۰ dup | ✅ |
| open layer behaves | رفتار popover تاریخ با Tab/Escape | Popover غیرمدال Tab را می‌بندد | ✅ |

**تغییر مهم:** تست کیبورد پیش‌تر بلافاصله بعد از Tab مقدار outline را می‌خواند و در میانهٔ `transition: all` صفر می‌دید (۷ no-ring کاذب). اکنون ۶۰ms مکث + assertion `noRing === 0`.

### `TournamentDetail.test.tsx`

تست خطای سرویس با ۴۰۴ به‌روزرسانی شد: ۴۰۴ → حالت خالی «این تورنمنت پیدا نشد»؛ خطای ۵۰۰ → پیام عمومی + تلاش دوباره.

## گیت‌های رگرسیون

| گیت | وضعیت | توضیح |
|-----|--------|-------|
| `npx tsc --noEmit` | ✅ | exit 0 |
| `npx eslint src` | ✅ | 0 errors |
| `npx vitest run` | ✅ | ۲۰۳/۲۰۳ pass در ۲۴ فایل |
| `vite build` | ✅ | production، `built in 1m 8s` |
| Playwright mobile-audit | ✅ | `4 passed (7.4m)` — route sweep ۱۵۴ ردیف + viewport matrix ۸۱ ردیف + keyboard (`noRing=0`, `dups=0`) |
| تأیید دور دوم (Playwright، یک پروسه) | ✅ | `/dashboard`, `/venues/1`, `/tournaments/2`, `/finance` — ۳۷۵px، بدون سرریز |
