# PAGE-BY-PAGE AUDIT

**مالک:** Agent B (ممیزی) + Agent C (اصلاح)
**وضعیت‌ها:** `NOT_STARTED` → `IN_PROGRESS` → `AUDITED` (فقط مشاهده‌شده) → `FIXED` (اصلاح‌شده) → `RETEST_PASSED` (تست مجدد با Backend واقعی) → `BLOCKED` / `REGRESSION_FAILED`

> قاعده: صفحه‌ای که فقط مشاهده شده، `RETEST_PASSED` نمی‌شود. صفحه‌ای که با Mock باز شده، «عملیات موفق با Backend واقعی» ثبت نمی‌شود.

## قالب ثبت هر صفحه

```
### <#>. <Route>  —  <نام صفحه>
- نقش(های) تست‌شده:
- Viewportها: 320/360/375/390/430/600 (+ Landscape اگر لازم)
- دادهٔ تست: (sandbox seed / ساخته‌شده در dev)
- Screenshot: before=<path> after=<path>
- مشکلات یافت‌شده: <IDهای BUG-TRACKER>
- فایل‌های تغییرکرده: <path>
- نتیجهٔ تست مجدد: <شاهد>
- وضعیت: <STATUS>
```

---

## جدول وضعیت کلی (۴۱ Route)

| # | Route | نقش تست‌شده | وضعیت | ایرادها |
|---|---|---|---|---|
| 1 | `/` | — | NOT_STARTED | — |
| 2 | `/search` | — | NOT_STARTED | — |
| 3 | `/favorites` | — | NOT_STARTED | — |
| 4 | `/venues` | — | NOT_STARTED | — |
| 5 | `/venues/:id` | — | NOT_STARTED | — |
| 6 | `/login` | — | NOT_STARTED | — |
| 7 | `/register` | — | NOT_STARTED | — |
| 8 | `/forgot-password` | — | NOT_STARTED | — |
| 9 | `/verify` | — | NOT_STARTED | — |
| 10 | `/dashboard` | — | NOT_STARTED | — |
| 11 | `/manager-dashboard` | — | NOT_STARTED | — |
| 12 | `/finance` | — | NOT_STARTED | — |
| 13 | `/manager/pricing` | — | NOT_STARTED | — |
| 14 | `/deals` | — | NOT_STARTED | — |
| 15 | `/quiz` | — | NOT_STARTED | — |
| 16 | `/bookings` | — | NOT_STARTED | — |
| 17 | `/bookings/:id` | — | NOT_STARTED | — |
| 18 | `/competitions` | — | NOT_STARTED | — |
| 19 | `/tournaments` | — | NOT_STARTED | — |
| 20 | `/tournaments/:id` | — | NOT_STARTED | — |
| 21 | `/contracts` | — | NOT_STARTED | — |
| 22 | `/contracts/:id` | — | NOT_STARTED | — |
| 23 | `/join/g/:token` | — | NOT_STARTED | — |
| 24 | `/games` | — | NOT_STARTED | — |
| 25 | `/games/new` | — | NOT_STARTED | — |
| 26 | `/games/:id` | — | NOT_STARTED | — |
| 27 | `/teams` | — | NOT_STARTED | — |
| 28 | `/teams/discover` | — | NOT_STARTED | — |
| 29 | `/teams/:id` | — | NOT_STARTED | — |
| 30 | `/manager/contracts` | — | NOT_STARTED | — |
| 31 | `/manager/contracts/:id` | — | NOT_STARTED | — |
| 32 | `/manager/teams` | — | NOT_STARTED | — |
| 33 | `/manager/crm` | — | NOT_STARTED | — |
| 34 | `/manager/checkin` | — | NOT_STARTED | — |
| 35 | `/manager/shifts` | — | NOT_STARTED | — |
| 36 | `/coach` | — | NOT_STARTED | — |
| 37 | `/manager/finance` (redirect) | — | NOT_STARTED | — |
| 38 | `/profile` | — | NOT_STARTED | — |
| 39 | `/admin` | — | NOT_STARTED | — |
| 40 | `/admin/users` | — | NOT_STARTED | — |
| 41 | `/admin/venues` | — | NOT_STARTED | — |
| 42 | `*` (NotFound) | — | NOT_STARTED | — |
