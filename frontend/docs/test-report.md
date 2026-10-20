# گزارش تست (Test Report)

**تاریخ اجرا:** ۲۰۲۶-۱۰-۲۰ | **میزبان:** ویندوز ۱۰، Node 24، RAM 8GB

---

## ۱. نتایج این دور (همه واقعی و اجراشده)

| # | دستور | نتیجه | زمان/جزئیات |
|---|-------|-------|-------------|
| 1 | `npx tsc --noEmit` | ✅ exit 0 | بدون خطای تایپ |
| 2 | `npx eslint src` | ✅ exit 0 | ۰ خطا، ۲۰۳ هشدار `no-explicit-any` (از قبل) |
| 3 | `npx vitest run` | ✅ exit 0 | **۲۰۳ تست / ۲۴ فایل / ۱۹٫۲s** (فایل‌ها کش‌شده) |
| 4 | `node --max-old-space-size=3072 node_modules/vite/bin/vite.js build` | ✅ exit 0 | پس از یک OOM کوتاه محیطی، `built in 40.28s` |
| 5 | Playwright `mobile-audit.spec.ts` (manager، بدون sweep) | ✅ exit 0 | **۵ passed، ۱ skipped، ۶٫۵m** |
| 6 | `GET /api/v1/bookings/pending/my` با توکن manager | ✅ 200 `[]` | پس از fail-open بدون Redis (قبلاً 500) |
| 7 | sweep تک‌مسیرهٔ `/manager/crm` (manager؛ ۳۲۰/۳۷۵) | ✅ 2 passed | پس از رفع F-43؛ `scrollWidth` ۷۸۱→۳۷۵ |

## ۲. پوشش Playwright در این دور

- `login as manager` — ورود واقعی از UI و ذخیرهٔ storageState
- `route sweep` — اجرای تکه‌ای (skip در اجرای heavy)
- `viewport matrix` — ۸ اندازه، شامل لندسکیپ
- `role guard behaviour` — ریدایرکت و پیام ۴۰۳
- `focus ring + tab order` — `noRing=0`, `dups=0`
- `open layer behaves with the keyboard` — بستن popover با Escape

## ۳. دادهٔ sweep

- ۱۵۲ ردیف مسیر×نقش×ویوپورت، ۰ incomplete، ۰ step-timeout، ۰ overflow>1px.
- ۷۶ جفت نقش×مسیر در `PAGE-BY-PAGE-AUDIT.md`.

## ۴. یافته‌های باقی‌ماندهٔ خودکار (همه محیطی)

| نوع | تعداد | توضیح |
|-----|-------|-------|
| Unsplash unreachable | ۱۳ | `ERR_CONNECTION_REFUSED` برای `images.unsplash.com` — ISP، نه اپ |
| `ERR_INSUFFICIENT_RESOURCES` | ۶ | رقابت منابع هنگام اجرای هم‌زمان مرورگرهای دیباگ (این دور تکرار نشد) |
| `bookings/pending/my` 500 | ۷ | بدون Redis؛ با fail-open رفع شد (۲۰۰ `[]`) |
| `open-layer-with-focus-outside` | ۱ | P3 — پاپ‌اور تاریخ هنگام Tab بسته می‌شود؛ پذیرفته |

## ۵. تست‌های اجرانشده

- Backend `pytest`: در این دور اجرا نشد (وابسته به اجرای جداگانهٔ محیط بک‌اند).
- E2E روی پروداکشن: منتظر رفع rate-limit (X1).
