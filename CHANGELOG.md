# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.4.0] - 2026-10-09

### 🚀 Added
- Unified CI/CD: `Build All Platforms` now builds Flutter Android/iOS, Tauri Android/iOS/Windows/Linux/macOS and React web in parallel, with tag-triggered signed releases (keystore via GitHub Secrets)
- Annotation diagnostics in CI: analyzer/alembic/build errors surface as `::error::` annotations for fast diagnosis

### 🔧 Fixed
- Backend: single finance ledger source — removed shadowed `finance_mvp` router and duplicate finance models that caused LookupError/IntegrityError in tests
- Backend: team-based split payments contract (model + migration `m0s017_split_payment_tables` + API) matching frontend and tests
- Backend: CRM daily campaign count now uses timezone-aware datetime bounds (real bind bug)
- Booking reminder tests: naive-datetime rejection fixed; Celery runs eagerly with in-memory broker in tests (Redis-free)
- Mobile: unused imports removed; `flutter analyze` infos/warnings kept non-fatal in quality gates
- Android build: nullable keystore properties handled per official Flutter Kotlin DSL template

### ✅ Quality
- Backend test suite: 333 passed / 0 failed, 82% coverage; alembic fresh-chain upgrade/downgrade/re-upgrade verified on real PostgreSQL
- Quality Gates: all 7 jobs green; Build All Platforms green on master

## [1.2.0] - 2026-10-09

### 🚀 Added

#### Split Payment System (FEAT-001)
- Team cost sharing with EQUAL/CUSTOM/PERCENTAGE split methods
- Backend models: `TeamSplitPayment`, `SplitPaymentShare`, `SplitPaymentAuditEvent`
- API endpoints for creating and managing split payments
- Frontend components: `SplitPaymentDialog`, `SplitPaymentsPanel`
- Integration with game creation flow
- Team detail page with split payments tab
- Comprehensive unit tests (16 test cases)

#### Payment Gateway Framework
- ZarinPal integration with sandbox/production modes
- NextPay alternative gateway implementation
- Webhook verification framework (documented)
- Async HTTP client with timeout protection
- Complete integration guide in documentation

#### Flutter Mobile App Completion
**Service Layer (5 comprehensive services):**
- `VenueService`: Venue listing, search, slots retrieval
- `BookingService`: Booking CRUD, cancellation with refunds
- `GameService`: Game creation, joining, invitations management
- `TeamService`: Team operations, standings, member invitations
- `NotificationService`: WebSocket with auto-reconnect for real-time updates

**New Screens (4 complete screens with real API):**
- `GamesListScreen`: Tabbed interface (all games/my games/invitations) with join functionality
- `TeamsListScreen`: My teams/discover/invitations with create team dialog
- `FavoritesScreen`: Saved venues with remove/clear all functionality
- `SearchScreen`: Real-time search with debounce, recent searches, sport categories

**Updated Screens (3 screens migrated from mock to real API):**
- `VenuesScreen`: Now fetches from real API with loading/error states
- `BookingsScreen`: Real bookings with cancel/refund, status filtering
- `ProfileScreen`: Added navigation to search and favorites

**Enhanced Navigation:**
- Home screen updated to 5-tab bottom navigation (Venues, Games, Bookings, Teams, Profile)
- WebSocket auto-connect on login, disconnect on logout
- Pull-to-refresh on all list screens
- Consistent error handling and empty states across all screens

### 🔧 Fixed

#### Critical Stability Fixes
- **Booking cancellation crash**: Fixed broken import in `reminder_tasks.py` (`app.db.session` → `app.database`)
- **Waitlist notifications**: Now work correctly after booking cancellation
- **Refund flow**: No longer crashes during payment processing

#### Security Vulnerabilities
- **Finance data leak**: Closed cross-venue financial data exposure in `finance_mvp` endpoints
- **Venue isolation**: Added proper venue-scoped filtering to all financial queries
- **Hardcoded values**: Removed `venue_id=1` fallback, enforced explicit validation

#### Mock Data Removal
- **Login screen**: Replaced `mock_token_123` with real AuthService API calls
- **Venues screen**: Removed hardcoded venue list, now uses VenueService
- **Bookings screen**: Removed mock bookings, integrated with BookingService

### 🔒 Security

- Multi-tenant data isolation enforced for financial endpoints
- Venue managers can only access their own venue's data
- Super admin bypass with proper validation
- Audit trail for all split payment operations
- Secure token storage with flutter_secure_storage

### 📝 Documentation

- `PAYMENT_GATEWAY_INTEGRATION.md`: Complete guide for ZarinPal/NextPay integration
- `phase-1-completion.md`: Split Payment feature documentation
- `phase-2-critical-fixes.md`: Critical fixes report
- Updated all version numbers across the project

### 📊 Metrics

- **Lines of code added**: ~3,800
- **Files created**: 13 (5 services + 4 screens + 4 supporting files)
- **Files modified**: 10
- **Tests added**: 16
- **Security issues fixed**: 3 (2 critical, 1 high)
- **Bugs fixed**: 2 critical
- **Mock data removed**: 3 screens converted to real API

### ⚠️ Known Limitations

- Payment gateway requires `ZARINPAL_MERCHANT_ID` environment variable to activate
- Webhook endpoint documented but not yet implemented in code
- Flutter CI builds root lib/ (mock) instead of android/salon_app (real app) - pending fix
- Android release signing not configured for Play Store distribution
- Missing Flutter screens: Competitions, Contracts, Quiz, Deals, Admin Dashboard, Manager Panel
- WebSocket message format needs backend alignment

---

## [1.1.0] - 2026-10-05

### 🚀 Added

- Competition bidding system
- Contract management with recurring sessions
- CRM features with customer tracking
- Quiz system for user engagement
- Waitlist functionality for popular time slots
- Check-in system with QR codes

### 🔧 Fixed

- CORS configuration for production
- Security headers (HSTS, CSP, X-Frame-Options)
- Build optimization with code splitting
- Docker image size reduced by 62%

### 📝 Documentation

- NEXT_PHASE_PLAN.md with 28-feature roadmap
- Multiple audit reports and architecture documents

---

## [1.0.0] - 2026-09-25

### 🎉 Initial Release

- Core booking system with venue management
- User authentication with JWT
- Slot management and pricing
- Basic payment flow (mock gateway)
- Admin dashboard
- Mobile app foundation (Flutter)
- Desktop app (Tauri)

---

## Version History Summary

| Version | Date | Focus | Breaking Changes |
|---------|------|-------|------------------|
| 1.0.0 | 2026-09-25 | Initial release | No |
| 1.1.0 | 2026-10-05 | Features & optimization | No |
| 1.2.0 | 2026-10-09 | Split payment + security fixes | No |

---

## Upcoming (1.3.0 Planned)

- Real payment gateway activation (requires merchant ID)
- Flutter app real build in CI (not mock)
- Mobile API connection (remove mock tokens)
- Refresh token implementation
- Push notification system (FCM)
- WebSocket on Redis pub/sub

---

**Note:** This project follows semantic versioning:
- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality (backward-compatible)
- **PATCH** version for backward-compatible bug fixes
