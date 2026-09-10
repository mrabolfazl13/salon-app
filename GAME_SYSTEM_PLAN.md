# گزارش فاز ۲ — معماری فعلی و پلن پیاده‌سازی Group Booking / Open Game

> قانون: Extend, don't rewrite. هیچ abstraction جدیدی بدون نیاز. هیچ dependency جدیدی اضافه نمی‌شود.

---

## CURRENT ARCHITECTURE (بک‌اند)

لایه‌بندی موجود (سطح‌تخت، ماژولار نیست — **همین ساختار حفظ می‌شود**):

```
app/
├── models/        SQLModel table=True (user, venue, slot, booking, payment, notification, ...)
├── schemas/       Pydantic request/response (snake_case خالص)
├── repositories/  BaseRepository + یک ریپو به‌ازای هر موجود (UnitOfWork lazy property)
├── services/      Business logic (BookingService, NotificationService, ...)
├── api/v1/        روترها: prefix="/xxx" + tags + Depends(get_unit_of_work) + Depends(get_current_user)
├── utils/         auth.py (JWT HS256, get_current_user/admin/manager), websocket.py (manager)
└── unit_of_work.py commit/rollback خودکار در get_unit_of_work
```

- DB: PostgreSQL (docker) + `SQLModel.metadata.create_all` در startup. **Alembic عملاً غیرفعال است** (migrations/versions خالی، env.py وجود ندارد، alembic.ini هست).
- Race-safety موجود: `BaseRepository.get_by_id_with_lock` → `SELECT ... FOR UPDATE` (در booking استفاده شده).
- Redis: pending bookings + کدهای تأیید. Celery beat: تسک‌های زمان‌بندی.

## EXISTING BOOKING SYSTEM
`Slot(venue_id, slot_date, start_time, duration, current_price)` → `Booking(slot_id, user_id, payment_amount, status)` با جریان pending(Redis)→confirm(مدیر)→DB. **Game دقیقاً روی Booking تأییدشده سوار می‌شود** (`games.booking_id FK`) — مفهوم Booking و Game جدا می‌مانند.

## EXISTING USER SYSTEM
`User(id, phone, full_name, role[user|venue_manager|club_admin|super_admin], is_active, is_verified)` + JWT (sub=phone). احراز هویت از `Depends(get_current_user)`؛ user_id هرگز از client نمی‌آید. ✅

## EXISTING PAYMENT SYSTEM
`BookingPayment(booking_id, user_id, amount, status[pending|paid|failed|refunded], gateway="mock", authority, transaction_id, card_pan, paid_at)` + روتر payments.py با gateway شبیه‌سازی (اعتبارسنجی کارت ۱۶ رقمی + ارقام فارسی). **GamePayment جدا ساخته می‌شود ولی همان الگو/statusها/روش mock را copy نمی‌کند — از همان helperهای payments.py استفاده می‌کند (تبدیل به تابع مشترک در حد حداقل).**

## EXISTING NOTIFICATION SYSTEM
`Notification(user_id, title, message, data(JSON-str), type)` + `notification_service.send_to_user(...)` (DB persist + WebSocket push همزمان). روتر /notifications + notificationStore + NotificationPanel در FE زنده است. ✅ فقط متدهای دامنه‌ای game_* اضافه می‌شود.

## FRONTEND (موجود)
React 18 + Vite + MUI v9 + Tailwind + react-router v7 + zustand(persist) + **@tanstack/react-query (Provider در App.tsx موجود — فقط هرگز استفاده نشده؛ حالا واقعاً مصرف می‌شود)** + axios (`services/api.ts` با interceptor توکن/401) + react-hot-toast + framer-motion + iconify.
الگوی صفحات: `pages/<domain>/<Page>.tsx` lazy + `Layout` + `services/<domain>.ts` (camelCase در FE ↔ snake_case در مرز). کامپوننت‌های قابل استفاده مجدد: `ui/{Button,Input,Card,Dialog,Loading}`, `modals/ConfirmModal`, `mobile/{Skeletons,EmptyState,ErrorState}`, `booking/TimeSlotPicker`.
مسیر API از `import.meta.env.VITE_API_URL` (hard-code نمی‌شود). Tauri: فقط shell؛ API از همان axios می‌رود — تغییری لازم نیست.

---

## WHAT WILL BE REUSED
| نیاز | راه‌حل موجود |
|---|---|
| قفل ردیف / race | `get_by_id_with_lock` (SELECT FOR UPDATE) |
| Auth/AuthZ | `get_current_user` + بررسی organizer/admin در سرویس |
| Notification | `notification_service.send_to_user` (+ WS) |
| Payment mock | الگوی `payments.py` (gateway=mock, authority=token_hex) |
| UoW/Repo/Schemas | `UnitOfWork` + `BaseRepository` + conventions فعلی |
| UI | MUI theme + Layout + ConfirmModal + Skeleton/Empty/Error + ui/* |
| Server state | TanStack Query (Provider موجود) |
| Pagination | limit/offset (همان سبک /payments/my) |
| Distance filter | `VenueRepository.get_nearby_venues` (haversine موجود) |

## WHAT NEEDS TO BE ADDED (کمترین سطح تمیز)
**بک‌اند (5 فایل جدید + 4 ویرایش):**
- `app/models/game.py` — ۷ مدل: Game, GameParticipant, GameJoinRequest, GameInvitation, GameInviteLink, GameWaitlist, GamePayment (+enums در همان فایل مثل بقیه مدل‌ها)
- `app/schemas/game.py`
- `app/repositories/game_repository.py` — یک ریپو برای همه جداول game (مثل contract_repository که ۳ ریپو دارد)
- `app/services/game_service.py` — تمام business logic (join/leave/waitlist/promote/cancel/invite)
- `app/api/v1/games.py` — روتر RESTful با naming موجود
- ویرایش: `models/__init__.py`, `api/v1/__init__.py`, `main.py`, `unit_of_work.py` (+property games)

**فرانت (الگوی فعلی، بدون features/ چون پروژه این ساختار را ندارد):**
- `services/game.ts` + `hooks/useGames.ts` (TanStack Query: useGames/useGame/useJoinGame/useLeaveGame/...)
- `components/game/`: GameCard, CreateGameForm, ParticipantList, JoinRequestList, InviteLinkManager, WaitlistButton, GamePaymentStatus
- `pages/games/`: Games.tsx (Open Games + فیلتر/سورت), GameDetail.tsx, CreateGame.tsx, JoinByToken.tsx (`/join/g/:token`)
- ویرایش: App.tsx (۴ route), Navbar.tsx (آیتم «بازی‌ها»)، types

## DATABASE CHANGES
جدول‌های جدید (هیچ جدول موجودی تغییر نمی‌کند):
- `games`: id, booking_id FK→bookings (UNIQUE — یک رزرو یک بازی), organizer_id FK→users, name, description, sport(default football), visibility(private|public|public_approval), join_policy(approval|open — از visibility استنتاج/ذخیره), max_players CHECK>0, skill_level(beginner|intermediate|advanced|pro), payment_mode(organizer_pays|split|free), status(draft|open|full|started|completed|cancelled), created/updated + indexها (status, visibility, organizer_id, booking_id, created_at)
- `game_participants`: UNIQUE(game_id,user_id), role(organizer|admin|member), status(invited|pending|accepted|rejected|left|removed|waitlisted→جدای در waitlist), joined_at, left_at
- `game_join_requests`: game_id,user_id,status(pending|approved|rejected), message, reviewed_by/at
- `game_invitations`: game_id, invited_user_id, invited_by, status(pending|accepted|declined|revoked), expires_at — UNIQUE(game_id,invited_user_id)
- `game_invite_links`: token UNIQUE (secrets.token_urlsafe(12) — غیرقابل‌حدس، بدون ID دایرکت), created_by, expires_at, max_uses, uses_count, is_active
- `game_waitlist`: UNIQUE(game_id,user_id), position (ترتیب = id), status(waitlisted|promoted|left)
- `game_payments`: game_id, participant_id FK→game_participants, amount, status(pending|paid|failed|refunded), payment_reference, paid_at — جدا از booking_payments

**Alembic:** از آنجا که `migrations/` عملاً خالی است و schema با create_all ساخته می‌شود: (الف) مدل‌ها در `models/__init__.py` ثبت می‌شوند → create_all در ری‌استارت backend جداول را می‌سازد (مسیر واقعی این پروژه). (ب) برای خواسته Alembic: `migrations/env.py` + یک migration تمیز فقط-برای-جداول-game با `down_revision=None` اضافه می‌شود که قابل اجرا/rollback روی DB خالیِ production باشد. اجرای عملی alembic روی DB داخل داکر WSL از این ترمینال ممکن نیست (docker.sock permission) — در Risks ثبت.

## API CHANGES (همه زیر /api/v1/games، snake_case، RESTful مطابق conventions)
```
POST   /games                      ساخت بازی روی booking کاربر (organizer=creator, participant organizer)
GET    /games                      Explore: فقط public/public_approval با status open/full + فیلترها + sort + limit/offset
GET    /games/my                   بازی‌های من (organize یا participate)
GET    /games/{id}                 جزئیات (private فقط برای members/invited)
PATCH  /games/{id}                 ویرایش (organizer/admin) — max_players، ظرفیت
DELETE /games/{id}                 Cancel (organizer) → notifications + refunds + invalidate links
POST   /games/{id}/join            join اتمیک با FOR UPDATE روی ردیف game
POST   /games/{id}/leave           organizer leave = transfer یا cancel
POST   /games/{id}/waitlist        DELETE /games/{id}/waitlist
GET    /games/{id}/participants    PATCH /games/{id}/participants/{user_id} (role admin/remove — organizer)
POST   /games/{id}/join-requests   GET /games/{id}/join-requests
POST   /games/{id}/join-requests/{rid}/approve | reject
POST   /games/{id}/invite-links    GET | DELETE /games/{id}/invite-links/{link_id} (disable)
GET    /join/{token}               پیش‌نمایش + join با توکن (public route)
POST   /games/{id}/invitations     POST /games/{id}/invitations/{iid}/accept | reject
POST   /games/{id}/payments/{participant_id}/pay   (mock، مثل payments فعلی)
```
Errorهای ساختاریافته: `detail={"code": "GAME_FULL", "message": "..."}` — FE کد را به پیام فارسی نگاشت می‌کند؛ با stringهای فعلی سازگار است (FE هر دو را هندل می‌کند).

## FRONTEND CHANGES
- routes: `/games`, `/games/:id`, `/games/new`, `/join/g/:token` (Protected به‌جز join که login redirect می‌کند)
- Navbar + BottomNavigation: «بازی‌ها»
- Open Games با Card مطابق اسپک (ورزش/نام/سالن/تاریخ/ساعت/ظرفیت/قیمت هر بازیکن/سطح/ارگانایزر/فاصله/Join) + فیلترها (sport,date,venue,skill,price,availability,distance) + sort (nearest/soonest/cheapest/most_available/popular)
- optimistic join/leave با rollback + invalidate روی 409 (ظرفیت از backend، منبع حقیقت DB)
- Loading=Skeletons, Empty=EmptyState, Error=ErrorState+Retry، Confirm برای Cancel/Remove/Regenerate/Leave

## RISKS
1. **DB از Windows قابل‌دسترس نیست** (PG داخل شبکه داکر WSL، پورت expose نشده) → تست‌های pytest روی SQLite in-memory (SQLModel سازگار است؛ `FOR UPDATE` روی SQLite no-op → تست concurrency واقعی نیازمند PG). تست همزمانی با `@pytest.mark.skipif(no PG)` نوشته می‌شود + نسخه SQLite با thread serialization.
2. **create_all vs Alembic**: جداول جدید با ری‌استارت backend خودکار ساخته می‌شوند؛ migration alembic موازی و rollback-پذیر ارائه می‌شود ولی اجرای واقعی آن با مسئولیت کاربر (docker restart + alembic upgrade) است.
3. **uvicorn بدون --reload در compose** → اعمال کد جدید نیازمند ری‌استارت کانتینر توسط کاربر.
4. Booking فعلی نباید رگرسیون بگیرد: هیچ تغییری در models/booking, slot, payment, routers موجود (به‌جز ثبت router جدید در main/__init__/uow).
5. react-query برای اولین بار مصرف می‌شود — Provider از قبل هست؛ ریسک پایین.
6. Rate limiting: infrastructure موجود نیست (middleware ندارد) → طبق اسپک «در صورت وجود» — ثبت به‌عنوان next improvement.
