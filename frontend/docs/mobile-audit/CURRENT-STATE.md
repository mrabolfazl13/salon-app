# وضعیت فعلی ممیزی موبایل (Current State)

**تاریخ:** ۲۰۲۶-۱۰-۲۲ | **شاخه:** `flutter-free-web-tauri`

خلاصهٔ کامل پروژه در [`docs/current-state.md`](../current-state.md) است؛ این فایل فقط وضعیت خودِ ممیزی را نگه می‌دارد.

---

## فازها

| فاز | موضوع | وضعیت | مستندات |
|-----|-------|--------|----------|
| ۱ | سندباکس + تریاژ | ✅ COMPLETE | BUG-TRACKER F-01…F-15 |
| ۲ | ناهم‌خوانی دسترسی UI↔API | ✅ COMPLETE | ۱۵ یافته CLOSED |
| ۳ | axe-core / WCAG | ✅ COMPLETE | ۴۰→۰ باریابی، ACCESSIBILITY-REPORT |
| ۴ | لمس ≥۴۴px، کنسول/شبکه، focus ring | ✅ COMPLETE | F-16…F-29 |
| ۵ | کیبورد و focus trap | ✅ COMPLETE | `keyboard-report.json` |
| ۶ | عملکرد | ✅ COMPLETE | PERFORMANCE-REPORT |
| ۷ | هارنس مقاوم (تکه‌ای/مهلت‌دار) | ✅ COMPLETE | F-36…F-39 |
| ۸ | مرور بصری شیت‌ها ۰۱–۰۸ | ✅ COMPLETE | F-40…F-44 همه FIXED |
| ۹ | بازبینی دور دوم ۳۷۵px + تأیید مجدد | ✅ COMPLETE | F-45…F-55 همه FIXED |

## شواهد این دور

- **۱۵۲ ردیف** مسیر×نقش×ویوپورت (۳۲۰، ۳۷۵)؛ ۰ ناتمام، ۰ timeout، ۰ سرریز افقی.
- **۷۶ جفت** نقش×مسیر در `PAGE-BY-PAGE-AUDIT.md`؛ همه ✅ AUDITED.
- Playwright سنگین manager: ۵ passed / ۱ skipped در ۶٫۵m.
- اصلاحات محصول این دور: F-40 (آیکون ریال)، F-41 (ارقام/آیکون پنل ادمین)، F-42 (مبلغ بزرگ KPI)، F-43 (سرریز ۷۳۶px کارت‌های CRM و رندر سفید)، F-44 (fail-open رزروهای معلق).
- دور دوم (۲۰۲۶-۱۰-۲۲): F-45 تا F-55 — تاریخ شمسی آمادهٔ API، محتوای سطر رزرو، چیدمان KPI داشبورد/مالی، ارقام امتیاز، هدر تیم، بازهٔ شیفت، هیروی سالن، CTA نقش‌محور، جستجو و توست یکتا. تأیید ۹ مسیر با `scrollWidth=375` و بدون خطای کنسول.
- **APK arm64 ساین‌شده (۲۰۲۶-۱۰-۲۲):** `app-arm64-release.apk`، نسخهٔ ۱٫۲٫۰ (code 1002000)، ۱۹٫۷۸MB، v2 signature، `native-code: arm64-v8a`، شامل باندل تازهٔ Vite؛ نسخهٔ کپی در `audit-artifacts/Salon-1.2.0-arm64.apk` (sha256 `1c12ccfb…b3387`).

## باز

| کد | موضوع | نیاز به |
|----|-------|---------|
| X1…X9 | موارد بیرونی/تصمیم محصول | کاربر |

## NATIVE-ONLY

- اندازهٔ واقعی touch target روی صفحهٔ لمسی
- Safe-area insets (notch)
- VoiceOver/TalkBack
- Tauri Android WebView quirks
