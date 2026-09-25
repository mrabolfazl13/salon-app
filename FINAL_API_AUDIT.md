# گزارش ممیزی نهایی API — فاز ۱ (Steps A–N)

> تاریخ: ۲۰۲۶-09-22 | دامنه: `frontend/src/services/*.ts` ⇄ `backend/app/api/v1/*.py`
> روش: استخراج خودکار همه فراخوانی‌های FE + همه روترهای BE + تطبیق نرمال‌شده (بدون حساسیت به trailing slash و نام پارامتر) + تست زنده روی `http://2.189.255.225`

---

## Step A — Inventory: نتیجه تطبیق ۱۰۰٪ FE ⇄ BE

| معیار | تعداد |
|---|---|
| فراخوانی FE در `services/*.ts` | ۲۰۴ (۱۹۷ یکتا پس از نرمال‌سازی) |
| مسیرهای BE در `api/v1` | ۲۱۳ (نرمال‌شده، proxi-less) |
| FE بدون مسیر BE متناظر | **۰** |
| BE بدون مصرف‌کننده FE (orphans واقعی) | **۳** (همگی عمدی/مدیریتی — نه باگ) |

### Orphans BE (بدون فراخوانی FE)
1. `GET /crm/consent` — فقط PUT مصرف می‌شود (self-service در Profile)؛ GET به‌عنوان variant مدیریتی دست‌نخورده است.
2. `GET /holidays/check/{target_date}` — ابزار بررسی یک‌روزه؛ FE از `GET /holidays/` + لیست کامل استفاده می‌کند.
3. `POST /loyalty/{user_id}/adjust` — تعدیل دستی امتیاز (ابزار ادمین). عمدی رها شده.

> ۱۶ «orphan» ظاهری `/contracts/...` آرتیفکت regex بود: `contract.ts` از الحاق یک‌خطی `'/contracts/' + id` استفاده می‌کند و استخراج‌کننده به `/contracts/` رسید. هر ۱۶ متد در `contract.ts` تأیید شدند.

### خطاهای false-positive تست اولیه (تأیید شدند — باگ نیستند)
- `GET /slots/venue/8` → 422: `slot_date` الزامی است (FE در slot.ts همیشه می‌فرستد).
- `crm/*` `staff/` `pricing/rules` → 422: `venue_id` الزامی manager-scope است (FE همیشه می‌فرستد).
- `GET /venues/{id}/prices` با توکن admin → 403: **authz صحیح** — فقط مدیرِ همان سالن.
- `GET /finance/export` → «-1»: پاسخ CSV است؛ پارسر JSON من تست را خراب کرده بود؛ خام = **200** با `\ufeffid,occurred_at,...`.

---

## Finding واقعی → رفع شد: پروکسی production برای Varzesh3 گم بود

**علائم:** صفحه Home (`pages/Home.tsx`) بخش «نتایج زنده و اخبار Varzesh3» را با `sportsApi.ts` لود می‌کند که به
`/api/varzesh3/v2.0/livescore/today` و `/api/varzesh3/v1.0/news/*` درخواست می‌دهد.
این مسیر فقط در **Vite dev** (پروکسی `vite.config.ts` → `web-api.varzesh3.com`) تعریف شده بود.
در تولید، nginx `/api/` را به backend می‌راند و FastAPI روتر varzesh3 ندارد → **۴۰۴** → بلوک «مسابقه‌ای یافت نشد» همیشه خالی.

**رفع:** `location /api/varzesh3/` به nginx اضافه شد (آینه‌ی دقیق پروکسی Vite: `proxy_pass https://web-api.varzesh3.com/` + هدرهای Origin/Referer) در:
- `/home/ubuntu/nginx/nginx.conf` (اجرا) — reload شده
- `/home/ubuntu/deploy_staging/nginx.conf` (منبع canonical)
- `nginx/nginx.conf` (ریپو)

**تأیید زنده:** `/api/varzesh3/v2.0/livescore/today` → 200، `/api/varzesh3/v1.0/news/latest` → 200،
`/api/varzesh3/v2.0/football/leagues/6/seasons/903038/standing` → 200 — هر سه با JSON واقعی Varzesh3.

---

## تست زنده نهایی (public URL)

| مسیر | نتیجه |
|---|---|
| `/` (SPA، `index-DekgRbQq.js`) | 200 |
| `/assets/index-*.js` | 200 |
| `/api/v1/venues?limit=1` | 200 |
| `/api/varzesh3/v2.0/livescore/today` | 200 |
| `/api/varzesh3/v1.0/news/latest` | 200 |
| `/static/venues/futsal-01.jpg` | 200 (282KB) |
| `/nginx-health` | 200 |

مجموعه کامل GETها با توکن ادمین (login `09123456789`): users/stats/pending-venues/pending-managers، bookings(+upcoming/past/venue/pending)، notifications(+unread-count)، favorites، memberships/my(+purchases)، payments/my، loyalty/me، coupons، contracts(+manager/pending+manager/all)، finance(dashboard/revenue-series/occupancy/transactions/expense-categories/accounts/export/by-source/low-demand)، crm(g Customers/customers/stats/campaigns)، staff(me/audit)، pricing/rules، deals(available/subscription)، holidays، reviews(venue/summary/my)، teams(+discover/invitations/me/manager-partners)، games(+my/invitations/my) → همه **200**.

## تست‌های منفی (Auth / AuthZ / Validation) — همگی PASS

| دسته | نتیجه |
|---|---|
| لوگین با رمز غلط | 401 ✓ |
| توکن نامعتبر / بدون توکن روی endpoints محافظت‌شده (۲۶ نمونه) | 401 ✓ |
| ثبت‌نام phone/پسورد بد (validation) | 422 ✓ |
| کاربر عادی روی admin/manager endpoints (۱۱ نمونه: admin/*، finance/*، crm/*، staff، pricing، venues/my-venues) | 403 ✓ |
| IDOR: کاربر عادی روی منابع دیگران (crm/customers/…، slots generate/block، delete booking) | 403 ✓ |
| بدنه‌های غلط mutation (bookings، reviews rating>5، teams، games، competitions، coupons، holidays، loyalty adjust) | 422 ✓ |
| منابع ناموجود | 404 ✓ |

> توضیحات مواردی که ظاهراً «FAIL» بودند — همگی false-positive سناریوی تست:
> - `GET /games` بدون توکن → 200: **عمدی** (explore عمومی با `get_optional_user`).
> - `GET /slots/venue/8/range` بدون توکن → 200: **عمدی** (مشاهده سانس عمومی؛ بدون dependency auth).
> - `GET /memberships/plans/999999` و مشابه → 405: این روترها **هیچ** `GET /{id}` ندارند؛ رفتار صحیح FastAPI است.
> - POST بدون trailing slash → 307: ریدایرکت بنین FastAPI به ابزار تست مربوط است، نه خطا.
> - register بدون `full_name` → 422: schema درست است (تست ناقص بود).

**نتیجه: هیچ باگ Auth/AuthZ یا validation در فاز ۱ یافت نشد.** (نتیجه مستقل از تصویر Big-Pickle؛ مطابق گزارش FINAL_AUDIT_REPORT.md).

## خلاصه تغییرات
| فایل | تغییر | ریسک |
|---|---|---|
| `nginx/nginx.conf` + `/home/ubuntu/nginx/nginx.conf` + `deploy_staging/nginx.conf` | افزودن `location /api/varzesh3/` (پروکسی Varzesh3)، reload | پایین |

## نتیجه‌گیری فاز ۱ (Steps A–N)
- **تطبیق ۱۰۰٪** FE ⇄ BE (۲۰۴ فراخوانی / ۰ بدون مسیر).
- **۱ باگ واقعی پیداشده و رفع‌شده:** پروکسی تولید Varzesh3 (نتایج زنده/اخبار صفحه Home در production 404 بود) — اکنون 200 با داده واقعی.
- **صفر باگ** در Auth، AuthZ، IDOR، validation (باگ‌های ادعایی تست همگی false-positive یا رفتار عمدی بودند).
- ۳ endpoint بدون مشتری FE — عمدی/مدیریتی، بدون نیاز به تغییر.
- **گام بعدی:** FASE ۲ — ساخت نسخه‌های Android release (ABIها + Universal APK + AAB).