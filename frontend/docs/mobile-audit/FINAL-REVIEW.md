# مرور نهایی ممیزی موبایل (Final Review)

**تاریخ:** ۲۰۲۶-۱۰-۱۹ | **نقش‌های بررسی‌کننده:** A (Lead), B (UI/UX Audit), C (Frontend Eng), D (QA), E (Backend Security), F (Performance), G (Design System & a11y), H (Build/Regression)

---

## A. Lead — نمای کلی و تصمیمات کلیدی

### دامنهٔ کار
ممیزی خودکار تمام Routeهای اپلیکیشن Salon در اندازه‌های موبایل (۳۲۰×۵۶۸ تا ۴۳۰×۹۳۲ + landscape)، با Backend واقعی، بدون mock data. هدف: شناسایی و رفع مشکلات دسترس‌پذیری، لمسی، عملکرد، و امنیت دسترسی نقش‌ها.

### تصمیمات معماری مهم
1. **ابزار contrast سراسری** (`src/utils/contrast.ts`): به‌جای patch تک‌تک کامپوننت‌ها، یک ماژول dependency-free ساخته شد که `composite()`, `readableText()`, `chipInk()` را ارائه می‌دهد.
2. **Heading semantic separation**: تایپوگرافی بصری از سطح معنایی جدا شد (`component="h2"` روی `variant="subtitle1"`).
3. **Focus ring دو لایه**: قانون سراسری CSS (`globals.css`) + override تم MUI (`MuiButtonBase`) برای پوشش حداکثری.
4. **Harness opt-in**: تست‌های mobile-audit با `MOBILE_AUDIT=1` فعال می‌شوند تا CI را درگیر نکنند.

### ریسک‌های باقی‌مانده
- **F-28 (MUI Button-as-link focus ring)**: محدودیت فریم‌ورک — نیاز به patch سطح پایین یا جایگزینی کامپوننت.
- **اعداد عملکرد localhost**: TTFB و LCP در production واقعی کندتر خواهند بود.
- **بدون تأیید دستگاه فیزیکی**: Touch targets و screen reader behavior فقط شبیه‌سازی شده‌اند.

---

## B. UI/UX Audit — یافته‌های بصری و ساختاری

### axe-core violations: ۴۰ → ۰ ✓

| قاعده | قبل | بعد | روش اصلاح |
|-------|-----|-----|-----------|
| color-contrast | ۱۹ / ۴۲ گره | ۰ / ۰ | `chipInk()` سراسری |
| heading-order | ۷ / ۱۴ | ۰ / ۰ | `component="h2/h3"` |
| scrollable-region-focusable | ۵ / ۸ | ۰ / ۰ | `role+tabIndex` |
| aria-input-field-name | ۱ / ۱ | ۰ / ۰ | `InputLabel+labelId` |
| page-has-heading-one | ۲ / ۲ | ۰ / ۰ | h1 یکتا per breakpoint |
| aria-progressbar-name | ۶ / ۶ | ۰ / ۰ | `aria-label+valuetext` |

### توقف‌های تکراری کیبورد: FIXED ✓

framer-motion's `whileTap` → `tabIndex={-1}` روی ۳ wrapper div.

### اهداف لمسی PersianDatePicker: FIXED ✓

سلول‌ها ۳۸→۴۴px، ناوبری ۴۴×۴۴، TextField minHeight 44 (تم).

---

## C. Frontend Engineering — تغییرات کد

### فایل‌های جدید
- `src/utils/contrast.ts` (+۵۰ خط): توابع WCAG luminance/contrast
- `src/utils/contrast.test.ts` (+۸۰ خط): ۶ تست vitest
- `e2e/mobile-audit.spec.ts` (~+۱۲۰ خط): تست‌های کیبورد + layer behavior

### فایل‌های اصلاح‌شده (سیستمی)
| فایل | تغییر | دلیل |
|------|-------|------|
| `src/styles/globals.css` | `:focus-visible, .Mui-focusVisible` rule | حلقه تمرکز سراسری |
| `src/theme/index.ts` | `MuiButtonBase`, `MuiTextField`, `MuiSelect` overrides | touch target 44px, focus ring |
| `src/components/ui/PersianDatePicker.tsx` | cellBase 44px, nav buttons 44px, input minHeight 44 | اهداف لمسی ≥۴۴ |
| `src/pages/Home.tsx` | `tabIndex={-1}` روی motion.div ×2 | حذف توقف تکراری |
| `src/components/layout/NotificationPanel.tsx` | `tabIndex={-1}` روی motion.div | حذف توقف تکراری |
| `src/components/finance/shared.tsx` | `chipInk()` روی KpiCard/StatusChip | کنتراست چیپ‌ها |
| `src/components/game/shared.tsx` | `chipInk()` روی GameStatusChip | کنتراست چیپ‌ها |
| `src/components/team/shared.tsx` | `chipInk()` روی VisibilityChip/DueStatusChip | کنتراست چیپ‌ها |
| `src/components/game/PaymentSection.tsx` | `chipInk()` روی PaymentRow | کنتراست چیپ پرداخت |
| `src/components/mobile/DateSelector.tsx` | حذف `opacity` از weekday/month | کنتراست متن ماه |

### خطوط کد تغییر یافته
- جدید: ~۲۵۰ خط (contrast utils + tests + harness extensions)
- اصلاح‌شده: ~۳۰ فایل، ~۸۰ خط تغییر خالص

---

## D. QA / Browser Automation — شواهد آزمایش

### Harness نتایج
- **Login UI**: ۵ نقش (user, staff, coach, manager, super_admin) — همه ✅
- **Route sweep**: ۴۲ مسیر × ۳ viewport = ۱۲۶ ترکیب — همه اسکرین‌شات گرفته شد
- **Viewport matrix**: ۹ اندازه برای صفحات کلیدی — overflow ۰، touch-target ۰ (بعد از اصلاح DatePicker)

### کنسول و شبکه
- **request-failed**: ۳۳ مورد — همگی `images.unsplash.com` (unreachable از این ماشین)
- **console-error**: ۳۵ مورد — همان تصاویر unsplash
- **expected-http-error**: ۲ مورد — `/tournaments/999` (۴۰۴ عمدی برای تست)

### Focus ring probe
- ۵ مسیر × ۱۶ توقف = ۸۰ ایستگاه بررسی‌شده
- no-ring: ۷ مورد (همه MUI Button-as-link variants)
- duplicate stops: ۰ ✓

---

## E. Backend & Role Security — ماتریس دسترسی

### تأیید شده (از فاز قبلی)
- **API role matrix**: هر مسیر غیرمجاز → ۴۰۳ از backend
- **UI guard**: مسیرهای محافظت‌شده redirect به login
- **Cache isolation**: logout → localStorage پاک می‌شود

### نکات امنیتی رعایت‌شده
- هیچ token/password در لاگ یا اسکرین‌شات ثبت نشده
- CORS restrictions حفظ شده (backend allowlist unchanged)
- Tauri permissions گسترش نیافته

---

## F. Performance — اعداد کلیدی

| معیار | Cold | Warm | هدف | وضعیت |
|-------|------|------|-----|--------|
| FCP | ۴۴–۱۰۰ms | ۴۴–۷۲ms | ≤۲s | ✅ عالی |
| LCP | ۲۳۶–۱۰۸۸ms | ۱۳۶–۹۶۸ms | ≤۲.۵s | ✅ خوب |
| منابع | ۲۵–۶۰ | ۲۵–۶۰ | — | — |
| JS انتقالی | ۲۹۳–۳۵۷KB | ۲–۶KB | — | lazy مؤثر |
| API calls | ۵–۱۰ | ۵–۱۰ | — | N+1 کنترل‌شده |

**هشدار:** اعداد localhost هستند؛ production کندتر خواهد بود.

---

## G. Design System & Accessibility — انطباق WCAG 2.1 AA

### چک‌لیست WCAG

| معیار | وضعیت | توضیح |
|-------|--------|-------|
| ۱.۴.۳ Contrast (AA) | ✅ PASS | `readableText()` تضمین ≥۴.۵:۱ |
| ۱.۴.۱۱ Non-text Contrast | ✅ PASS | `chipInk()` برای border/chip |
| ۲.۴.۳ Focus Order | ✅ PASS | ترتیب منطقی RTL |
| ۲.۴.۷ Focus Visible | ⚠️ PARTIAL | حلقه سراسری فعال؛ MUI Button-as-link استثنا |
| ۲.۴.۱ Bypass Blocks | ✅ PASS | skip-to-content link |
| ۴.۱.۲ Name, Role, Value | ✅ PASS | aria-label روی progressbar/region |
| ۱.۱.۱ Non-text Content | ✅ PASS | alt روی تصاویر seed |
| ۱.۳.۱ Info and Relationships | ✅ PASS | heading hierarchy درست |

### NATIVE-ONLY / BLOCKED

| مورد | دلیل |
|------|------|
| Touch target واقعی روی صفحه لمسی | شبیه‌سازی offsetWidth دقیق نیست |
| Safe-area insets (notch) | فقط در WebView اعمال می‌شود |
| VoiceOver/TalkBack | نیاز به دستگاه واقعی |
| Tauri Android WebView | CORS/proxy متفاوت از مرورگر دسکتاپ |

---

## جمع‌بندی نهایی

### دستاوردها
- ✅ ۴۰ axe-core violation → ۰ (تأییدشده در ۲۲ ترکیب مسیر×نقش)
- ✅ توقف‌های تکراری کیبورد حذف شد (۳ wrapper fixed)
- ✅ حلقه تمرکز سراسری فعال (IconButtons, inputs, comboboxes, plain links)
- ✅ اهداف لمسی PersianDatePicker به ۴۴px رسید
- ✅ کنتراست چیپ‌ها و کارت‌ها سیستمی اصلاح شد
- ✅ تمام گیت‌های رگرسیون سبز (tsc, eslint, vitest, build, Playwright)

### موارد باز
- 📝 F-28: MUI Button-as-link focus ring (چارچوب — مستند شد)
- 📝 F-16..F-19: یافته‌های بصری (در انتظار VERIFIED با شات‌های جدید)
- 📝 تأیید دستگاه فیزیکی (NATIVE-ONLY)

### توصیه برای فاز بعدی
1. جایگزینی تصاویر unsplash با placeholder محلی یا CDN ایرانی
2. اضافه کردن Service Worker برای caching assets
3. بررسی parity Tauri Android (config/permission review بدون دستگاه)
4. اجرای backend pytest در محیط sandbox
