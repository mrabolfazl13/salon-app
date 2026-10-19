# ممیزی صفحه‌به‌صفحه (Page-by-Page Visual Audit)

**تاریخ:** ۲۰۲۶-۱۰-۱۹ | **Viewport اصلی:** ۳۷۵×۸۱۲ (iPhone X)

> این جدول توسط `page_table.py` از روی اسکرین‌شات‌های harness تولید شده.
> ستون «وضعیت» باید پس از بررسی بصری پر شود.

| مسیر | نقش | شات اصلی | شات دوم | overflow | h1 | وضعیت |
|------|------|-----------|---------|----------|-----|--------|
| `/` | guest | ❌ | — | ✅ | ✅ | ⏳ PENDING |
| `/search` | user | [📸](shots/user___search__375x812.png) | [📸](shots/user___search__375x812__p2.png) | ✅ | ✅ | ⏳ PENDING |
| `/favorites` | user | [📸](shots/user___favorites__375x812.png) | [📸](shots/user___favorites__375x812__p2.png) | ✅ | ✅ | ⏳ PENDING |
| `/venues` | guest | [📸](shots/guest___venues__375x812.png) | [📸](shots/guest___venues__375x812__p2.png) | ✅ | ✅ | ⏳ PENDING |
| `/venues/1` | user | [📸](shots/user___venues_1__375x812.png) | [📸](shots/user___venues_1__375x812__p2.png) | ✅ | ✅ | ⏳ PENDING |
| `/login` | guest | [📸](shots/guest___login__375x812.png) | [📸](shots/guest___login__375x812__p2.png) | ✅ | ✅ | ⏳ PENDING |
| `/register` | guest | [📸](shots/guest___register__375x812.png) | [📸](shots/guest___register__375x812__p2.png) | ✅ | ✅ | ⏳ PENDING |
| `/bookings` | user | [📸](shots/user___bookings__375x812.png) | [📸](shots/user___bookings__375x812__p2.png) | ✅ | ✅ | ⏳ PENDING |
| `/bookings/1` | user | [📸](shots/user___bookings_1__375x812.png) | [📸](shots/user___bookings_1__375x812__p2.png) | ✅ | ✅ | ⏳ PENDING |
| `/dashboard` | user | [📸](shots/user___dashboard__375x812.png) | [📸](shots/user___dashboard__375x812__p2.png) | ✅ | ✅ | ⏳ PENDING |
| `/manager-dashboard` | manager | ❌ | — | ✅ | ✅ | ⏳ PENDING |
| `/finance` | manager | [📸](shots/manager___finance__375x812.png) | [📸](shots/manager___finance__375x812__p2.png) | ✅ | ✅ | ⏳ PENDING |
| `/manager/shifts` | manager | [📸](shots/manager___manager_shifts__375x812.png) | [📸](shots/manager___manager_shifts__375x812__p2.png) | ✅ | ✅ | ⏳ PENDING |
| `/manager/contracts` | manager | [📸](shots/manager___manager_contracts__375x812.png) | [📸](shots/manager___manager_contracts__375x812__p2.png) | ✅ | ✅ | ⏳ PENDING |
| `/manager/crm` | manager | [📸](shots/manager___manager_crm__375x812.png) | [📸](shots/manager___manager_crm__375x812__p2.png) | ✅ | ✅ | ⏳ PENDING |
| `/teams/1` | user | [📸](shots/user___teams_1__375x812.png) | [📸](shots/user___teams_1__375x812__p2.png) | ✅ | ✅ | ⏳ PENDING |
| `/tournaments/2` | user | [📸](shots/user___tournaments_2__375x812.png) | [📸](shots/user___tournaments_2__375x812__p2.png) | ✅ | ✅ | ⏳ PENDING |
| `/games/1` | user | [📸](shots/user___games_1__375x812.png) | [📸](shots/user___games_1__375x812__p2.png) | ✅ | ✅ | ⏳ PENDING |

## راهنمای بررسی

| وضعیت | معنی |
|--------|-------|
| ✅ AUDITED | بررسی شد، مشکلی نیست |
| 🔧 FIXED | مشکل یافت و رفع شد |
| ❌ BLOCKED | مشکل مسدودکننده (نیاز به بررسی بیشتر) |
| ⏳ PENDING | هنوز بررسی نشده |

## NATIVE-ONLY

مواردی که فقط روی دستگاه واقعی قابل‌بررسی هستند:
- اندازهٔ واقعی touch targets روی صفحه لمسی
- Safe-area insets (notch iPhone)
- رفتار keyboard appearance/dismissal
- Tauri Android WebView rendering