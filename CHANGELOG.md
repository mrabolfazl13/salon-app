# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

### 🔧 Fixed

#### Critical Stability Fixes
- **Booking cancellation crash**: Fixed broken import in `reminder_tasks.py` (`app.db.session` → `app.database`)
- **Waitlist notifications**: Now work correctly after booking cancellation
- **Refund flow**: No longer crashes during payment processing

#### Security Vulnerabilities
- **Finance data leak**: Closed cross-venue financial data exposure in `finance_mvp` endpoints
- **Venue isolation**: Added proper venue-scoped filtering to all financial queries
- **Hardcoded values**: Removed `venue_id=1` fallback, enforced explicit validation

### 🔒 Security

- Multi-tenant data isolation enforced for financial endpoints
- Venue managers can only access their own venue's data
- Super admin bypass with proper validation
- Audit trail for all split payment operations

### 📝 Documentation

- `PAYMENT_GATEWAY_INTEGRATION.md`: Complete guide for ZarinPal/NextPay integration
- `phase-1-completion.md`: Split Payment feature documentation
- `phase-2-critical-fixes.md`: Critical fixes report
- Updated all version numbers across the project

### 📊 Metrics

- **Lines of code added**: ~2,029
- **Files created**: 9
- **Files modified**: 7
- **Tests added**: 16
- **Security issues fixed**: 3 (2 critical, 1 high)
- **Bugs fixed**: 2 critical

### ⚠️ Known Limitations

- Payment gateway requires `ZARINPAL_MERCHANT_ID` environment variable to activate
- Webhook endpoint documented but not yet implemented in code
- Flutter mobile app still uses mock data (real app not built in CI)
- Celery tasks use SQLite directly instead of UnitOfWork pattern

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
