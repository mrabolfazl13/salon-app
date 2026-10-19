# ROLE MATRIX — نقش‌ها، مجوزها و حساب‌های تست

**منابع استخراج:** `backend/app/models/user.py` (`UserRole`)، `frontend/src/components/auth/ProtectedRoute.tsx`، `frontend/src/App.tsx`، `backend/scripts/seed_full_demo.py`
**منابع گواه:** `frontend/audit-artifacts/role-api-matrix.json` (سطح API)، `frontend/audit-artifacts/audit-report-access.json` (گیت سمت کلاینت)

## 1. نقش‌های واقعی پروژه

| نقش (Backend) | مقدار رشته‌ای | مسیر اختصاصی | ملاحظات |
|---|---|---|---|
| `user` | `user` | `/dashboard`, `/profile`, رزرو، تیم‌ها، بازی‌ها | نقش پایهٔ همهٔ کاربران؛ مسیرهای کنسول فقط با انتصاب فعال + کد permission از `/staff/me` باز می‌شود |
| `coach` | `coach` | `/coach` | فقط داشبورد مربی؛ در seed موجود نیست |
| `venue_manager` | `venue_manager` | `/manager-dashboard`, `/manager/teams`, `/manager/checkin` + مسیرهای `allowStaff` | صاحب/مدیر سالن |
| `club_admin` | `club_admin` | (مسیر جدا ندارد) | در `ProtectedRoute` معادل `venue_manager` رفتار می‌کند |
| `super_admin` | `super_admin` | `/admin`, `/admin/users`, `/admin/venues` | بایپس سراسری دارد، **به‌جز** مسیرهایی که بک‌اند نقش‌محور گیت می‌کند (`/coach`) — F-04 |

علاوه بر نقش‌ها، مفهوم **staff** (کارمند سالن) با ترکیب «نقش `user` + عضویت کارمند در یک سالن» پیاده شده است.

## 2. نگاشت Route ↔ نقش (خلاصهٔ اجرایی)

| گروه مسیرها | user | staff | coach | venue_manager | club_admin | super_admin |
|---|---|---|---|---|---|---|
| `/` , `/venues` , `/venues/:id` , `/games` , `/games/:id` , `/search` , `/favorites` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/login` , `/register` , `/forgot-password` , `/verify` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/dashboard` , `/profile` , `/deals` , `/quiz` , `/bookings` , `/bookings/:id` , `/competitions` , `/tournaments*` , `/contracts*` , `/teams*` , `/games/new` , `/join/g/:token` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/manager/crm` | ❌ | ✅ (`crm.view`) | ❌ | ✅ | ✅ | ✅ |
| `/finance` , `/manager/pricing` , `/manager/contracts*` , `/manager/shifts` | ❌ | فقط با کد مربوطه | ❌ | ✅ | ✅ | ✅ |
| `/manager-dashboard` , `/manager/teams` , `/manager/checkin` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/coach` | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `/admin*` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

سطرهای بالا **وضعیت فعلی** است (پس از رفع F-01…F-05)، نه وضعیتی که `allowStaff` پیش از اصلاح اجازه می‌داد. دو تغییر نسبت به نسخهٔ قبل از ممیزی:

- `/coach` از «همهٔ نقش‌محورها + super_admin» به **فقط `coach`** جمع شد؛ بک‌اند هم دقیقاً همین را می‌گوید (`role=coach`) و بایپس سراسری `super_admin` در کلاینت فقط درخواست‌های ۴۰۳ تولید می‌کرد (F-04).
- مسیرهای `allowStaff` دیگر «هر کاربر واردشده» را قبول نمی‌کنند؛ گیت بر اساس **انتصاب فعال + کد permission** از `/staff/me` است (F-01، F-05).

### 2.1 گواه سطح API (درخواست مستقیم، نه فقط نبودِ دکمه)

منبع: `frontend/audit-artifacts/role-api-matrix.json` — سندباکس محلی، بک‌اند واقعی، ۱۳ endpoint کلیدی، ۵ نقش.
«۴۰۳» یعنی بک‌اند پاسخ داده است؛ یعنی ریسک «P0 محتمل» نسخهٔ قبل **رد شده است**: مشکل فقط گیت سمت کلاینت بود (حالا رفع شده)، نه نشت دادهٔ واقعی.

| Endpoint | گیت بک‌اند | user | staff | coach | manager | super_admin |
|---|---|---|---|---|---|---|
| `/venues/my-venues` | مالکیت سالن | 403 | 403 | 403 | 200 | 200 |
| `/finance/venue-comparison` | `finance.view` | 403 | 403 | 403 | 200 | 200 |
| `/finance/dashboard` | `finance.view` | 403 | 403 | 403 | 200 | 200 |
| `/finance/transactions` | `finance.view` | 403 | 403 | 403 | 200 | 200 |
| `/finance/accounts` | `finance.view` | 403 | 403 | 403 | 200 | 200 |
| `/pricing/rules` | `pricing.manage` | 403 | 403 | 403 | 200 | 200 |
| `/contracts/manager/pending` | `contract.view` | 403 | **200** | 403 | 200 | 200 |
| `/crm/customers` | `crm.view` | 403 | **200** | 403 | 200 | 200 |
| `/staff/?venue_id=1` | `staff.manage` | 403 | 403 | 403 | 200 | 200 |
| `/shifts?venue_id=1` | `staff.manage` | 403 | 403 | 403 | 200 | 200 |
| `/coach/dashboard` | `role=coach` | 403 | 403 | 200 | 403 | 403 |
| `/admin/stats/users` | `role=super_admin` | 403 | 403 | 403 | 403 | 200 |
| `/admin/pending-venues` | `role=super_admin` | 403 | 403 | 403 | 403 | 200 |

دو «200» برای `staff` عمدی و درست است: حساب کارمندِ سندباکس عمداً با کدهای `contract.view` و `crm.view` ساخته شده (`seed_full_demo.py`)، پس UI هم همان دو لینک را در منو نشان می‌دهد — هم‌خوانی کامل UI↔API.

گیت‌های سمت کلاینت نیز جدا آزموده شدند (`frontend/audit-artifacts/audit-report-access.json`، ۱۰ بررسی):
`guest → /dashboard` برمی‌گردد به `/login`؛ `user → /manager-dashboard`, `/admin`, `/coach`, `/finance` همگی به `/venues` با پنل «دسترسی شما به این صفحه مجاز نیست»؛ `coach → /admin` و `manager → /admin` همان‌طور؛ `super_admin → /coach` هم رد می‌شود؛
`super_admin → /admin` و `staff → /finance` بدون redirect می‌مانند ولی کارمندِ بدون `finance.view` **`ForbiddenPanel`** می‌بیند (نه اسکلتون ماندگار — F-05).

## 3. حساب‌های تست (Sandbox محلی — SQLite یک‌بارمصرف)

منبع: `backend/scripts/seed_full_demo.py`

| نقش | شماره | رمز | وضعیت در seed |
|---|---|---|---|
| `super_admin` | `09120000001` | در `seed_full_demo.py` (اینجا ثبت نمی‌شود) | ✅ موجود |
| `venue_manager` | `09121000001`, `09121000002` | در `seed_full_demo.py` | ✅ موجود |
| staff | `09122000001` … `09122000004` | در `seed_full_demo.py` | ✅ موجود (با کدهای `contract.view`, `crm.view`) |
| `user` | `09123000001` … `09123000012` | در `seed_full_demo.py` | ✅ موجود (دو مورد آخر بدون تأیید شماره) |
| `coach` | ساخته‌شده در sandbox | فقط در `scripts/make_coach.py` | ❌ در seed نیست → در `TEST-RESULTS.md` به‌عنوان «حساب ساختگی محیط dev» علامت می‌خورد |

> رمزها و توکن‌ها در این مجموعه سند ثبت نمی‌شوند (قاعدهٔ ۵ مأموریت). هارنس آن‌ها را در `storageState` محلی نگه می‌دارد و
> در گزارش فقط **شمارهٔ حساب و نتیجه** می‌آید؛ `audit-artifacts/role-api-matrix.json` هم فقط کد وضعیت دارد.


## 4. قواعد امنیتی این مأموریت

1. هیچ عملیات نوشتن روی Backend واقعی (`2.189.255.225` / prod) انجام نمی‌شود.
2. همهٔ ایجاد/ویرایش/حذف روی Sandbox محلی با دادهٔ demo انجام می‌شود.
3. تست هر نقش با پاک‌سازی وضعیت (logout + پاک‌کردن storage) قبل از نقش بعدی.
4. بررسی دوبارهٔ دسترسی از طریق درخواست مستقیم API (نه فقط مخفی‌بودن دکمه) الزامی است.
5. Token/رمز در گزارش و اسکرین‌شات ثبت نمی‌شود.
