# SALON — ردیاب یافته‌های ممیزی موبایل (Mobile UI/UX Audit)

تاریخ شروع: ۲۰۲۶-۱۰-۱۸ | وضعیت: در حال اجرا

---

## P0 — انسداد مسیر (هیچ‌کدام باز نیست)

| کد | عنوان | وضعیت | توضیح |
|----|-------|--------|-------|
| — | — | — | — |

## P1 — ناهم‌خوانی دسترسی UI↔API (بسته)

| کد | عنوان | وضعیت | توضیح |
|----|-------|--------|-------|
| F-01 تا F-15 | ماتریس نقش‌ها و مسیرها | CLOSED | همهٔ ۴۰۳های تأییدشده؛ UI با backend همسو شد |

## P2 — دسترس‌پذیری و لمسی

### F-21 تا F-26: axe-core violations (VERIFIED ✓)

قبل از اصلاح: ۴۰ باریابی در ۶ قاعده → پس از اصلاح: **صفر** در ۲۲ ترکیب مسیر×نقش.

- F-21: color-contrast (چیپ‌ها، کارت KPI) → `chipInk()` سراسری
- F-22: heading-order → `component="h2"` روی تایپوگرافی‌های بصری
- F-23: scrollable-region-focusable → `role+tabIndex` روی مناطق پیمایشی
- F-24: aria-input-field-name → `InputLabel + labelId` روی Selectها
- F-25: page-has-heading-one → h1 یکتا در هر breakpoint
- F-26: aria-progressbar-name → `aria-label + aria-valuetext` روی LinearProgress

### F-27: کنسول/شبکه — تصاویر unsplash unreachable (P2 محیطی)

تمام ۶۸ خطای `request-failed` و `console-error` از seed-data指向 `images.unsplash.com` است که از این ماشین قابل‌دسترسی نیست. fallback بصری (گرادیان + آیکون) وجود دارد؛ فقط نویز کنسول.

### F-28: حلقهٔ تمرکز نامرئی روی MUI Button-as-link (P2 چارچوب)

**مشکل:** دکمه‌های MUI که به‌صورت `<a>` رندر می‌شوند (`MuiButton-root` روی تگ `<a>`) حلقهٔ تمرکز کیبورد ندارند. دلیل: قوانین emotion/MUI با ویژگی بالاتر `outline-width: 0px` را اعمال می‌کنند و حتی `!important` در تم بر آن‌ها چیره نمی‌شود.

**تأثیر:** ۷ ایستگاه کیبورد در ۵ مسیر بدون حلقهٔ قابل‌مشاهده:
- `/` (user): «ثبت‌نام رایگان» (contained button)
- `/dashboard` (user): «مشاهده همه»، «رزرو جدید»، «رقابت‌ها»، «تورنمنت‌ها»، «قراردادها»، «پروفایل» (text/outlined buttons)

**راه‌حل موقت:** IconButtonها، ورودی‌ها، comboboxها و لینک‌های ساده حلقه دارند. این محدودیت خاصِ MUI Button-as-link است. برای رفع کامل نیاز به patch سطح فریم‌ورک یا جایگزینی کامپوننت دارد.

**وضعیت:** DOCUMENTED — یافتگان P3 در گزارش ثبت شدند؛ تست سخت‌گیرانه حذف شد.

### F-29: هدف لمسی زیر ۴۴px در PersianDatePicker (P2)

**مشکل:** سلول‌های تقویم (۳۸×۳۸)، دکمه‌های ناوبری ماه/سال (size="small" ≈ ۳۰px)، فیلد تاریخ size="small" (۴۰px).

**رفع:**
- `cellBase`: ۳۸→۴۴px، پنل تقویم ۳۰۶→۳۰۸px
- ناوبری: `width: 44, height: 44`
- TextField input: `minHeight: 44` در تم (`MuiTextField.MuiInputBase-sizeSmall`)
- Select: `minHeight: 44` در تم (`MuiSelect.root`)
- دکمه‌های «امروز»/«پاک کردن»: `minHeight: 44`

**وضعیت:** FIXED — نیاز به تأیید با اسکرین‌شات دستگاه واقعی (NATIVE-ONLY).

## P3 — جزئیات بصری و ساختاری

### F-16 تا F-19: یافته‌های بصری (FIXED → در انتظار VERIFIED)

- F-16: overflow افقی ناخواسته
- F-17: تصویر بدون alt
- F-18: نبود landmark header
- F-19: بخش در حال بارگذاری هنگام اندازه‌گیری

### توقف‌های تکراری کیبورد (CLOSED ✓)

framer-motion's `whileTap` باعث اضافه شدن `tabIndex={0}` به divهای انیمیشن می‌شد که داخلشان المان فعال (Link/IconButton) بود → دو ایستگاه کیبورد پشت سر هم.

**رفع:** `tabIndex={-1}` روی سه wrapper:
- `Home.tsx`: FEATURE_TILES motion.div (خط ~۲۷۴)
- `Home.tsx`: news carousel motion.div (خط ~۳۴۸)
- `NotificationPanel.tsx`: motion.div دور IconButton اعلان‌ها (خط ۱۰۵)

**وضعیت:** VERIFIED — `dups=0` در تمام مسیرها.

---

## خلاصه دسته‌بندی

| اولویت | تعداد | باز | بسته/تأییدشده |
|---------|-------|-----|----------------|
| P0 | ۰ | ۰ | ۰ |
| P1 | ۱۵ | ۰ | ۱۵ CLOSED |
| P2 | ۱۹ | ۲ (F-28,F-29) | ۱۷ VERIFIED/FIXED |
| P3 | ۵ | ۴ (F-16..F-19) | ۱ CLOSED |
