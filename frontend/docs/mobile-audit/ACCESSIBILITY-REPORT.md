# گزارش دسترس‌پذیری (Accessibility Report)

**تاریخ:** ۲۰۲۶-۱۰-۱۹ | **ابزار:** axe-core 4.10.3 + Playwright Chromium + پروب کیبورد دستی

---

## روش و محیط

- **بیلد تحویلی:** `vite build --mode development` → `vite preview --mode development` روی `http://localhost:3001`
- **پروکسی:** `/api/v1` → backend واقعی (`http://localhost:8000`)
- **نقش‌ها:** guest, user, manager (storageState از login UI)
- **اندازهٔ viewport:** ۳۷۵×۸۱۲ (iPhone X) برای همهٔ ترکیبات مسیر×نقش
- **axe-core:** تزریق شده via `page.addScriptTag({ content: AXE })`، اجرای `axe.run()` با تگ‌های wcag2a/wcag2aa/best-practice

## نتایج baseline → پس از اصلاح

| قاعده axe | پیش‌پایه (باریابی/گره) | پس از اصلاح | وضعیت |
|-----------|----------------------|-------------|--------|
| color-contrast | ۱۹ / ۴۲ | ۰ / ۰ | VERIFIED ✓ |
| heading-order | ۷ / ۱۴ | ۰ / ۰ | VERIFIED ✓ |
| scrollable-region-focusable | ۵ / ۸ | ۰ / ۰ | VERIFIED ✓ |
| aria-input-field-name | ۱ / ۱ | ۰ / ۰ | VERIFIED ✓ |
| page-has-heading-one | ۲ / ۲ | ۰ / ۰ | VERIFIED ✓ |
| aria-progressbar-name | ۶ / ۶ | ۰ / ۰ | VERIFIED ✓ |
| **جمع** | **۴۰ / ۷۳** | **۰ / ۰** | **همه تأییدشده** |

## اصلاحات سیستمی اعمال‌شده

### ۱. کنتراست رنگ چیپ‌ها و کارت‌ها (`src/utils/contrast.ts`)

تابع‌های `composite()`, `readableText()`, `chipInk()` — محاسبهٔ هگز نهایی متن روی زمینهٔ شفاف و گام‌به‌گام تیره/روشن کردن تا رسیدن به نسبت ۴.۵:۱.

**استفاده:** `PaymentRow`, `GameStatusChip`, `TeamVisibilityChip`, `DueStatusChip`, `KpiCard`.

### ۲. سطح معنایی headingها

Typographyهای بصری (`variant="subtitle1"`, `"h6"`) با `component="h2"` یا `component="h3"` — ظاهر بدون تغییر، ساختار درست.

**فایل‌ها:** `FinanceDashboardTab`, `Game/shared`, `Team/shared`, `Dashboard`, `Bookings`, `VenueDetail`, `TournamentDetail`.

### ۳. نام‌گذاری progressbarها و scroll regions

- `LinearProgress`: `aria-label` + `aria-valuetext` فارسی با ارقام فارسی
- مناطق پیمایشی (`TableContainer`, gallery Box, live-scores): `role="region"` + `aria-label` + `tabIndex={0}` + `&:focus-visible` outline

### ۴. برچسب Selectها

`InputLabel` + `labelId` + `Select.labelId` الگو در `FinanceDashboardTab`.

### ۵. حلقهٔ تمرکز سراسری

- `src/styles/globals.css`: `:focus-visible, .Mui-focusVisible { outline-width: 2px !important; ... }`
- `src/theme/index.ts`: `MuiButtonBase.root['&.Mui-focusVisible']` override برای غلبه بر قوانین emotion

**نتیجه:** IconButtons، ورودی‌ها، comboboxها و لینک‌های ساده حلقه دارند. MUI Button-as-link variants به‌دلیل محدودیت فریم‌ورک همچنان بدون حلقه (F-28).

### ۶. حذف توقف‌های تکراری کیبورد

framer-motion's `whileTap` → `tabIndex={-1}` روی wrapper divها (Home ×2, NotificationPanel ×1).

### ۷. اهداف لمسی PersianDatePicker

سلول‌های تقویم ۳۸→۴۴px، دکمه‌های ناوبری ۴۴×۴۴، TextField input minHeight 44 (تم)، Select minHeight 44 (تم).

## چک‌لیست WCAG 2.1 AA

| مورد | وضعیت | توضیح |
|------|--------|-------|
| ۱.۴.۳ Contrast (AA) | ✅ PASS | `readableText()` تضمین می‌کند ≥۴.۵:۱ |
| ۱.۴.۱۱ Non-text Contrast | ✅ PASS | `chipInk()` برای چیپ‌ها و borderها |
| ۲.۴.۳ Focus Order | ✅ PASS | ترتیب منطقی RTL، بدون پرش |
| ۲.۴.۷ Focus Visible | ⚠️ PARTIAL | حلقه سراسری فعال؛ MUI Button-as-link استثنا (F-28) |
| ۲.۴.۱ Bypass Blocks | ✅ PASS | skip-to-content link در App shell |
| ۴.۱.۲ Name, Role, Value | ✅ PASS | aria-label روی progressbar، combobox، regionها |
| ۱.۱.۱ Non-text Content | ✅ PASS | تمام تصاویر seed alt دارند؛ آیکون‌ها aria-hidden |
| ۱.۳.۱ Info and Relationships | ✅ PASS | heading hierarchy درست (h1→h2→h3) |
| ۴.۱.۳ Status Messages | ✅ PASS | toast notifications با role=status |

## موارد فقط-دست‌رسی (Manual-only)

| مورد | روش بررسی | وضعیت |
|------|-----------|--------|
| پیمایش کامل با Tab | پروب کیبورد خودکار (۱۶ توقف × ۵ مسیر) | ✅ حلقه روی اکثر عناصر؛ F-28 مستند شد |
| trap تمرکز در مودال | باز کردن popover تاریخ + Tab ۱۰ بار | ✅ Popover غیرمدال Tab را می‌بندد (رفتار استاندارد) |
| خوانندهٔ صفحه (NVDA/JAWS) | تست دستی روی دستگاه واقعی | BLOCKED — بدون دستگاه فیزیکی |
| Zoom 200% | تست دستی | NATIVE-ONLY |
| کاهش حرکت (prefers-reduced-motion) | CSS media query موجود | نیاز به تأیید دستی |

## NATIVE-ONLY / BLOCKED

| مورد | دلیل |
|------|------|
| Touch target اندازه واقعی روی دستگاه | شبیه‌سازی مرورگر offsetWidth دقیق نیست |
| Safe-area insets (notch iPhone) | فقط در WebView/اپ بومی اعمال می‌شود |
| Keyboard appearance/dismissal behavior | رفتار native keyboard قابل‌شبیه‌سازی نیست |
| VoiceOver/TalkBack screen reader | نیاز به دستگاه iOS/Android واقعی |
| Tauri Android WebView quirks | CORS, POST body proxy, asset loading متفاوت |

## داده‌های خام

- `audit-artifacts/axe-report.json`: ۲۲ ترکیب مسیر×نقش، همگی ۰ violation
- `audit-artifacts/keyboard-report.json`: ۵ مسیر، ۷ no-ring (همه MUI Button-as-link), ۰ duplicate tab stop
- `audit-artifacts/harness-after-a11y.log`: ۸ تست Playwright، همه passed
