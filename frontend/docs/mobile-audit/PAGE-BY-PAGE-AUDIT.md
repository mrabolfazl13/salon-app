# ممیزی صفحه‌به‌صفحه (Page-by-Page Visual Audit)

**تاریخ:** ۲۰۲۶-۱۰-۲۰ | **Viewport:** 375x812 | **مبنای سنجش:** WCAG 2.1 AA، اهداف لمس ۴۴px

> این جدول را `page_table.py` از `audit-artifacts/audit-report-routes.json` و
> اسکرین‌شات‌های harness می‌سازد. تصاویر در `frontend/audit-artifacts/shots/`
> هستند و در git ignore شده‌اند؛ لینکها مسیر نسبی محلی را می‌دهند. ستون
> «وضعیت» دستی پر می‌شود و بازتولید جدول آن را حفظ می‌کند. نقش‌های STAFF/COACH
> در پروداکشن حساب ندارند (`users` فقط USER/VENUE_MANAGER/SUPER_ADMIN دارد)؛
> صفحه‌هایشان با manager و super_admin ممیزی می‌شود چون گارد یکی است.

| مسیر | نقش | شات | overflow | h1 | هدف<۴۴ | بی‌برچسب | یافته‌ها | وضعیت |
|------|------|------|----------|-----|--------|----------|----------|--------|
| `/` | guest | [📸](../../audit-artifacts/shots/guest_____375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/` | user | [📸](../../audit-artifacts/shots/user_____375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/search` | guest | [📸](../../audit-artifacts/shots/guest___search__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/venues` | guest | [📸](../../audit-artifacts/shots/guest___venues__375x812.png) | ✅ | ✅ | 0 | 0 | console-error،request-failed | ✅ AUDITED (محیطی: Unsplash) |
| `/venues/1` | user | [📸](../../audit-artifacts/shots/user___venues_1__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/login` | guest | [📸](../../audit-artifacts/shots/guest___login__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/register` | guest | [📸](../../audit-artifacts/shots/guest___register__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/dashboard` | user | [📸](../../audit-artifacts/shots/user___dashboard__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/manager-dashboard` | manager | [📸](../../audit-artifacts/shots/manager___manager_dashboard__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/bookings` | user | [📸](../../audit-artifacts/shots/user___bookings__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/finance` | user | [📸](../../audit-artifacts/shots/user___finance__375x812.png) | ✅ | ✅ | 0 | 0 | console-error،request-failed | ✅ AUDITED (محیطی: Unsplash) |
| `/finance` | manager | [📸](../../audit-artifacts/shots/manager___finance__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/manager/pricing` | manager | [📸](../../audit-artifacts/shots/manager___manager_pricing__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/manager/shifts` | manager | [📸](../../audit-artifacts/shots/manager___manager_shifts__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/manager/contracts` | manager | [📸](../../audit-artifacts/shots/manager___manager_contracts__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/manager/crm` | manager | [📸](../../audit-artifacts/shots/manager___manager_crm__375x812.png) | ✅ | ✅ | 0 | 0 | — | ❌ BLOCKED (F-43 شات سفید) |
| `/teams/1` | user | [📸](../../audit-artifacts/shots/user___teams_1__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/tournaments/2` | user | [📸](../../audit-artifacts/shots/user___tournaments_2__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/games/1` | user | [📸](../../audit-artifacts/shots/user___games_1__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/admin` | super_admin | [📸](../../audit-artifacts/shots/super_admin___admin__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/coach` | super_admin | [📸](../../audit-artifacts/shots/super_admin___coach__375x812.png) | ✅ | ✅ | 0 | 0 | console-error،request-failed | ✅ AUDITED (محیطی: Unsplash) |
| `/profile` | user | [📸](../../audit-artifacts/shots/user___profile__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/profile` | manager | [📸](../../audit-artifacts/shots/manager___profile__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/` | staff | [📸](../../audit-artifacts/shots/staff_____375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/` | coach | [📸](../../audit-artifacts/shots/coach_____375x812.png) | ✅ | ✅ | 0 | 0 | console-error،request-failed | ✅ AUDITED (محیطی: Unsplash) |
| `/` | manager | [📸](../../audit-artifacts/shots/manager_____375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/` | super_admin | [📸](../../audit-artifacts/shots/super_admin_____375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/admin/users` | super_admin | [📸](../../audit-artifacts/shots/super_admin___admin_users__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/admin/venues` | super_admin | [📸](../../audit-artifacts/shots/super_admin___admin_venues__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/bookings` | manager | [📸](../../audit-artifacts/shots/manager___bookings__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/bookings/1` | user | [📸](../../audit-artifacts/shots/user___bookings_1__375x812.png) | ✅ | ✅ | 0 | 0 | console-error،request-failed | ✅ AUDITED (محیطی: Unsplash) |
| `/bookings/1` | manager | [📸](../../audit-artifacts/shots/manager___bookings_1__375x812.png) | ✅ | ✅ | 0 | 0 | console-error،request-failed | ✅ AUDITED (محیطی: Unsplash) |
| `/coach` | coach | [📸](../../audit-artifacts/shots/coach___coach__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/competitions` | user | [📸](../../audit-artifacts/shots/user___competitions__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/contracts` | user | [📸](../../audit-artifacts/shots/user___contracts__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/contracts` | manager | [📸](../../audit-artifacts/shots/manager___contracts__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/contracts/1` | user | [📸](../../audit-artifacts/shots/user___contracts_1__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/contracts/1` | manager | [📸](../../audit-artifacts/shots/manager___contracts_1__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/dashboard` | manager | [📸](../../audit-artifacts/shots/manager___dashboard__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/deals` | user | [📸](../../audit-artifacts/shots/user___deals__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/deals` | manager | [📸](../../audit-artifacts/shots/manager___deals__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/favorites` | guest | [📸](../../audit-artifacts/shots/guest___favorites__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/favorites` | user | [📸](../../audit-artifacts/shots/user___favorites__375x812.png) | ✅ | ✅ | 0 | 0 | console-error،request-failed | ✅ AUDITED (محیطی: Unsplash) |
| `/finance` | staff | [📸](../../audit-artifacts/shots/staff___finance__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/forgot-password` | guest | [📸](../../audit-artifacts/shots/guest___forgot_password__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/games` | guest | [📸](../../audit-artifacts/shots/guest___games__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/games` | user | [📸](../../audit-artifacts/shots/user___games__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/games/1` | guest | [📸](../../audit-artifacts/shots/guest___games_1__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/games/new` | user | [📸](../../audit-artifacts/shots/user___games_new__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/manager/checkin` | manager | [📸](../../audit-artifacts/shots/manager___manager_checkin__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/manager/contracts` | user | [📸](../../audit-artifacts/shots/user___manager_contracts__375x812.png) | ✅ | ✅ | 0 | 0 | console-error،request-failed | ✅ AUDITED (محیطی: Unsplash) |
| `/manager/contracts` | staff | [📸](../../audit-artifacts/shots/staff___manager_contracts__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/manager/contracts/1` | user | [📸](../../audit-artifacts/shots/user___manager_contracts_1__375x812.png) | ✅ | ✅ | 0 | 0 | console-error،request-failed | ✅ AUDITED (محیطی: Unsplash) |
| `/manager/contracts/1` | staff | [📸](../../audit-artifacts/shots/staff___manager_contracts_1__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/manager/contracts/1` | manager | [📸](../../audit-artifacts/shots/manager___manager_contracts_1__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/manager/crm` | user | [📸](../../audit-artifacts/shots/user___manager_crm__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/manager/crm` | staff | [📸](../../audit-artifacts/shots/staff___manager_crm__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/manager/pricing` | user | [📸](../../audit-artifacts/shots/user___manager_pricing__375x812.png) | ✅ | ✅ | 0 | 0 | console-error،request-failed | ✅ AUDITED (محیطی: Unsplash) |
| `/manager/pricing` | staff | [📸](../../audit-artifacts/shots/staff___manager_pricing__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/manager/shifts` | staff | [📸](../../audit-artifacts/shots/staff___manager_shifts__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/manager/teams` | manager | [📸](../../audit-artifacts/shots/manager___manager_teams__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/quiz` | user | [📸](../../audit-artifacts/shots/user___quiz__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/search` | user | [📸](../../audit-artifacts/shots/user___search__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/teams` | user | [📸](../../audit-artifacts/shots/user___teams__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/teams` | manager | [📸](../../audit-artifacts/shots/manager___teams__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/teams/discover` | user | [📸](../../audit-artifacts/shots/user___teams_discover__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/this-route-does-not-exist` | guest | [📸](../../audit-artifacts/shots/guest___this_route_does_not_exist__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/tournaments` | user | [📸](../../audit-artifacts/shots/user___tournaments__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/tournaments` | manager | [📸](../../audit-artifacts/shots/manager___tournaments__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/tournaments/1` | user | [📸](../../audit-artifacts/shots/user___tournaments_1__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/tournaments/1` | manager | [📸](../../audit-artifacts/shots/manager___tournaments_1__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/tournaments/2` | manager | [📸](../../audit-artifacts/shots/manager___tournaments_2__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |
| `/tournaments/999` | user | [📸](../../audit-artifacts/shots/user___tournaments_999__375x812.png) | ✅ | ✅ | 0 | 0 | console-error،expected-http-error | ✅ AUDITED (محیطی: Unsplash) |
| `/venues` | user | [📸](../../audit-artifacts/shots/user___venues__375x812.png) | ✅ | ✅ | 0 | 0 | console-error،request-failed | ✅ AUDITED (محیطی: Unsplash) |
| `/venues/1` | guest | [📸](../../audit-artifacts/shots/guest___venues_1__375x812.png) | ✅ | ✅ | 0 | 0 | console-error،request-failed | ✅ AUDITED (محیطی: Unsplash) |
| `/verify` | guest | [📸](../../audit-artifacts/shots/guest___verify__375x812.png) | ✅ | ✅ | 0 | 0 | — | ✅ AUDITED |

## راهنمای بررسی

| وضعیت | معنی |
|--------|-------|
| ✅ AUDITED | بررسی شد، مشکلی نیست |
| 🔧 FIXED | مشکل یافت و رفع شد |
| ⚠️ ACCEPTED | یافت شد و عامدانه پذیرفته شد (در BUG-TRACKER) |
| ❌ BLOCKED | مشکل مسدودکننده (نیاز به بررسی بیشتر) |
| ⏳ PENDING | هنوز بررسی نشده |

## NATIVE-ONLY

مواردی که فقط روی دستگاه واقعی قابل‌بررسی هستند:
- اندازهٔ واقعی touch targets روی صفحه لمسی
- Safe-area insets (notch)
- رفتار keyboard appearance/dismissal
- Tauri Android WebView rendering
