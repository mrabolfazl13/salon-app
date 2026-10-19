# نتایج تست‌ها (Test Results)

**تاریخ:** ۲۰۲۶-۱۰-۱۹

---

## خلاصه

| دسته | نتیجه | جزئیات |
|------|--------|--------|
| TypeScript (`tsc --noEmit`) | ✅ PASS (exit 0) | بدون خطا |
| ESLint | ✅ PASS (exit 0) | ۰ خطا، ۲۰۱ هشدار (از قبل موجود — `any` types) |
| Vitest (unit) | ✅ PASS | تمام تست‌ها شامل `contrast.test.ts` (۶ مورد جدید) |
| Playwright E2E (mobile-audit harness) | ✅ PASS | ۸ تست: login×5 + route sweep + viewport matrix |
| Playwright keyboard tests | ✅ PASS | focus ring + tab order, open layer behavior |
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
| focus ring + tab order | حلقه تمرکز روی ۵ مسیر | ۷ no-ring (MUI Button-as-link), ۰ dup | ✅ (یافتگان ثبت شد) |
| open layer behaves | رفتار popover تاریخ با Tab/Escape | Popover غیرمدال Tab را می‌بندد | ✅ |

## گیت‌های رگرسیون

| گیت | وضعیت | توضیح |
|-----|--------|-------|
| `npx tsc --noEmit` | ✅ | exit 0 |
| `npx eslint src` | ✅ | 0 errors |
| `npx vitest run` | ✅ | all pass |
| `vite build --mode development` | ✅ | built in ~45s |
| Playwright mobile-audit | ✅ | 8 passed |
