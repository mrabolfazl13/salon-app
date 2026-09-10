# INTEGRATION_MATRIX.md — فاز ۲۱

> ماتریس اتصال هر قابلیت: UI → Service → Endpoint → Service Layer → Repo → Table. «✅» = کد متصل و زنده؛ «⚠️» = متصل با نقص؛ «❌» = قطع.

| قابلیت | UI (Page/Component) | Frontend Service | Endpoint | Backend Service | Repository | Table | اتصال |
|---|---|---|---|---|---|---|---|
| Register | auth/Register.tsx | authStore→authService | POST /auth/register | AuthService | users | users | ✅ |
| Login | auth/Login.tsx | authStore→authService | POST /auth/login | AuthService+JWT | users | users | ✅ |
| Logout | Navbar/authStore | (کلاینتی) | — | — | — | — | ⚠️ بدون سرور (stateless) |
| Session restore | AuthInitializer | authStore.initialize→getMe | GET /auth/me | — | users | users | ✅ |
| Venues list | pages/venues/Venues.tsx | venueService.getAll | GET /venues | (router+get_session) | venues | venues | ✅ |
| Venue detail | pages/venues/VenueDetail.tsx | venueService.getById | GET /venues/{id} | (get_session) | venues | venues | ✅ |
| Min price badge | VenueCard | (در پاسخ GET /venues) | — | get_venue_min_price | slots | slots | ⚠️ فقط سانس امروز → 0 گمراه‌کننده |
| Search | SearchBar/Search.tsx | venueService.getAll(search) | GET /venues?search | router | venues | venues | ✅ |
| Geo filter | FilterBottomSheet | venueService.getAll(lat/lng/radius) | GET /venues | router haversine | venues | venues | ✅ |
| Sport/amenity filter | FilterBottomSheet | client-side فقط | — | — | — | — | ⚠️ سرور پشتیبانی نمی‌کند |
| Slots | TimeSlotPicker | slotService | GET /slots/venue/{id}/available | (get_session) | slots | slots | ✅ |
| Generate slots | ManagerDashboard | slotService.generateForDate | POST /slots/venue/{id}/generate | create_daily_slots | slots | slots | ✅ |
| Create booking | VenueDetail | bookingService.create | POST /bookings | BookingService+PendingBookingService(Redis) | slots(lock) | slots+redis | ⚠️ slot رهاشده آزاد نمی‌شود (باگ beat) |
| Pending list/confirm/reject | ManagerDashboard | bookingService.*Pending | /bookings/pending/* | BookingService | bookings | bookings | ✅ |
| Booking history | Bookings.tsx | bookingService.getUpcoming/getPast | GET /bookings/upcoming|past | — | bookings(+slots join) | bookings | ✅ |
| Booking detail | BookingDetail.tsx | bookingService.getById | GET /bookings/{id} | — | bookings+payments | bookings | ✅ (IDOR check ✅) |
| Cancel+refund | Bookings/BookingDetail | bookingService.cancel | DELETE /bookings/{id} | BookingService | bookings/payments/slots | ✅ | ✅ |
| Payment create/pay | BookingDetail | paymentService | POST /payments، /{id}/pay | (router) | payments | booking_payments | ⚠️ درگاه mock |
| Payments history | Dashboard | paymentService.getMy | GET /payments/my | — | payments | booking_payments | ✅ |
| Reviews | ReviewSection | reviewService | /reviews/* | (get_session) | reviews | reviews | ⚠️ بدون بررسی رزرو قبلی |
| Favorites | VenueCard heart | favoritesStore | ❌ | ❌ | ❌ | ❌ | ❌ client-only |
| Notifications REST | NotificationPanel | notificationService→notificationStore | /notifications/* | — | notifications | notifications | ✅ |
| Notifications realtime | useWebSocket (App) | — | WS /ws/user/{id} | NotificationService | — | — | ⚠️ بدون auth |
| Competitions | Competitions.tsx/ManagerDashboard | competitionService | /competitions/* | CompetitionService | competitions/slots | price_competitions | ✅ |
| Competition resolve | (خودکار) | — | — | celery resolve_expired | slots | slots | ✅ هر ۳۰ دقیقه |
| Contracts | Contracts/ContractDetail + ContractForm | contractService | /contracts/* | ContractService | contracts/slots | contracts | ✅ |
| Contract expire | (خودکار) | — | — | celery check_expired | contracts | contracts | ✅ ساعت ۲ |
| Profile edit | Profile.tsx | authService.updateProfile | PUT /auth/profile | — | users | users | ✅ |
| Change password | Profile.tsx | authService.changePassword | POST /auth/change-password | AuthService | users | users | ✅ |
| Email verify OTP | VerifyEmail.tsx | authService | /auth/verify/email/* | VerificationService(Redis) | — | redis | ⚠️ dev_code |
| Password reset | ForgotPassword.tsx | authService | /auth/forgot+reset | VerificationService | users | redis+users | ⚠️ dev_code |
| My venues (manager) | ManagerDashboard | venueService.getMyVenues | GET /venues/my-venues | (uow) | venues | venues | ✅ |
| Create/update venue | ManagerDashboard | venueService.create/update | POST/PUT /venues | (uow) | venues | venues | ⚠️ PUT پاسخ stale |
| Venue prices | ManagerDashboard | venueService.setPrices/getPrices | /venues/{id}/prices | (get_session) | venues | venues | ✅ |
| Image upload | VenueDetail/Manager | uploadService | POST /upload/images | StorageService | — | MinIO | ✅ |
| Admin users/venues | admin/* | adminService | /admin/* | (uow) | users/venues | ✅ | ✅ |
| Venue verify | admin/Venues.tsx | adminService.verifyVenue | POST /admin/verify-venue/{id} | — | venues | venues | ✅ (نسخه /venues/{id}/verify موازی و بی‌مصرف) |
| Sports news | Home.tsx | sportsApi (varzesh3 proxy) | external | — | — | — | ✅ خارجی |
| Club | ❌ | ❌ | ❌ | ❌ | clubs (repo) | clubs | ❌ entity یتیم |
| React Query | ❌ Provider فقط | — | — | — | — | — | ❌ UNUSED |
| Alembic | — | — | — | — | — | — | ❌ versions خالی |
| Tests | — | — | — | — | — | — | ❌ صفر |
