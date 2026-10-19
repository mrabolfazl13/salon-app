# ROUTE INVENTORY — فهرست کامل Routeها (استخراج‌شده از کد)

**منبع:** `frontend/src/App.tsx` (خوانده‌شده در 2026-10-18)
**تعداد Routeهای واقعی:** ۴۱ + یک مسیر catch-all (`*`) = **۴۲ ورودی**
**منطق نگهبانی:** `frontend/src/components/auth/ProtectedRoute.tsx`

نمادها:
- `PUBLIC` = بدون نگهبان
- `AUTH` = نیازمند ورود (هر نقش)
- `ROLE:x` = `requiredRole` مشخص
- `STAFF+` = `allowStaff` (نقش `user` هم اگر کارمند سالن باشد مجاز است)
- وضعیت: `NOT_STARTED` → `IN_PROGRESS` → `AUDITED` → `FIXED` → `RETEST_PASSED`

| # | Route | کامپوننت (فایل) | نگهبان | وضعیت |
|---|---|---|---|---|
| 1 | `/` | `pages/Home.tsx` | PUBLIC | NOT_STARTED |
| 2 | `/search` | `pages/Search.tsx` | PUBLIC | NOT_STARTED |
| 3 | `/favorites` | `pages/Favorites.tsx` | PUBLIC | NOT_STARTED |
| 4 | `/venues` | `pages/venues/Venues.tsx` | PUBLIC | NOT_STARTED |
| 5 | `/venues/:id` | `pages/venues/VenueDetail.tsx` | PUBLIC | NOT_STARTED |
| 6 | `/login` | `pages/auth/Login.tsx` | PUBLIC (PublicRoute) | NOT_STARTED |
| 7 | `/register` | `pages/auth/Register.tsx` | PUBLIC (PublicRoute) | NOT_STARTED |
| 8 | `/forgot-password` | `pages/auth/ForgotPassword.tsx` | PUBLIC (PublicRoute) | NOT_STARTED |
| 9 | `/verify` | `pages/auth/VerifyEmail.tsx` | PUBLIC (PublicRoute) | NOT_STARTED |
| 10 | `/dashboard` | `pages/dashboard/Dashboard.tsx` | AUTH | NOT_STARTED |
| 11 | `/manager-dashboard` | `pages/dashboard/ManagerDashboard.tsx` | ROLE:venue_manager | NOT_STARTED |
| 12 | `/finance` | `pages/finance/FinanceConsole.tsx` | ROLE:venue_manager + STAFF+ | NOT_STARTED |
| 13 | `/manager/pricing` | `pages/manager/pricing/ManagerPricing.tsx` | ROLE:venue_manager + STAFF+ | NOT_STARTED |
| 14 | `/deals` | `pages/deals/Deals.tsx` | AUTH | NOT_STARTED |
| 15 | `/quiz` | `pages/quiz/Quiz.tsx` | AUTH | NOT_STARTED |
| 16 | `/bookings` | `pages/bookings/Bookings.tsx` | AUTH | NOT_STARTED |
| 17 | `/bookings/:id` | `pages/bookings/BookingDetail.tsx` | AUTH | NOT_STARTED |
| 18 | `/competitions` | `pages/competitions/Competitions.tsx` | AUTH | NOT_STARTED |
| 19 | `/tournaments` | `pages/tournaments/Tournaments.tsx` | AUTH | NOT_STARTED |
| 20 | `/tournaments/:id` | `pages/tournaments/TournamentDetail.tsx` | AUTH | NOT_STARTED |
| 21 | `/contracts` | `pages/contracts/Contracts.tsx` | AUTH | NOT_STARTED |
| 22 | `/contracts/:id` | `pages/contracts/ContractDetail.tsx` | AUTH | NOT_STARTED |
| 23 | `/join/g/:token` | `pages/games/JoinByToken.tsx` | AUTH | NOT_STARTED |
| 24 | `/games` | `pages/games/GamesExplore.tsx` | PUBLIC | NOT_STARTED |
| 25 | `/games/new` | `pages/games/GameCreate.tsx` | AUTH | NOT_STARTED |
| 26 | `/games/:id` | `pages/games/GameDetail.tsx` | PUBLIC | NOT_STARTED |
| 27 | `/teams` | `pages/teams/Teams.tsx` | AUTH | NOT_STARTED |
| 28 | `/teams/discover` | `pages/teams/TeamDiscover.tsx` | AUTH | NOT_STARTED |
| 29 | `/teams/:id` | `pages/teams/TeamDetail.tsx` | AUTH | NOT_STARTED |
| 30 | `/manager/contracts` | `pages/manager/contracts/ManagerContracts.tsx` | ROLE:venue_manager + STAFF+ | NOT_STARTED |
| 31 | `/manager/contracts/:id` | `pages/manager/contracts/ManagerContractDetail.tsx` | ROLE:venue_manager + STAFF+ | NOT_STARTED |
| 32 | `/manager/teams` | `pages/manager/teams/ManagerTeams.tsx` | ROLE:venue_manager | NOT_STARTED |
| 33 | `/manager/crm` | `pages/manager/crm/ManagerCrm.tsx` | AUTH (کل کارمندان سالن) | NOT_STARTED |
| 34 | `/manager/checkin` | `pages/manager/ManagerCheckin.tsx` | ROLE:venue_manager | NOT_STARTED |
| 35 | `/manager/shifts` | `pages/manager/shifts/ManagerShifts.tsx` | ROLE:venue_manager + STAFF+ | NOT_STARTED |
| 36 | `/coach` | `pages/coach/CoachDashboard.tsx` | ROLE:coach | NOT_STARTED |
| 37 | `/manager/finance` | → `Navigate to /finance` | ریدایرکت | NOT_STARTED |
| 38 | `/profile` | `pages/profile/Profile.tsx` | AUTH | NOT_STARTED |
| 39 | `/admin` | `pages/admin/AdminDashboard.tsx` | ROLE:super_admin | NOT_STARTED |
| 40 | `/admin/users` | `pages/admin/Users.tsx` | ROLE:super_admin | NOT_STARTED |
| 41 | `/admin/venues` | `pages/admin/Venues.tsx` | ROLE:super_admin | NOT_STARTED |
| 42 | `*` | inline `NotFound` داخل `App.tsx` | PUBLIC | NOT_STARTED |

## نکات مهم استخراج‌شده از کد (قابل‌استناد)

1. `ProtectedRoute` وقتی نقش ناسازگار است، کاربر را با toast به `/venues` **ریدایرکت** می‌کند (نه صفحهٔ 403). یعنی «دسترسی غیرمجاز» از دید کاربر = پرت‌شدن به `/venues`. این باید در تست‌ها بررسی شود که اطلاعات نقش قبلی نشت نکند.
2. `super_admin` در همهٔ مسیرهای نقش‌محور مجاز است (`user?.role === 'super_admin'`).
3. `club_admin` برای مسیرهای `venue_manager` مجاز است.
4. `allowStaff` یعنی شرط نقش نادیده گرفته می‌شود و **هر کاربر واردشده** می‌تواند صفحه را باز کند؛ کنترل واقعی باید در Backend باشد → این مورد یکی از محورهای الزامی بررسی امنیتی (Agent E) است.
5. `NotFound` به‌صورت inline در `App.tsx` تعریف شده (بدون فایل جدا).
