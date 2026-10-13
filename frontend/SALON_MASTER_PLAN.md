# Salon Futsal Booking System - Master Plan

**Date**: 2026-10-13
**Version**: 1.2.0
**Status**: Active Development

## Vision
Create a complete, production-ready futsal venue booking platform with mobile-first design, real-time features, and multi-role support (customers, venue managers, admins).

## Current Phase: Bug Fixes & Completion (Phase 1)
**Goal**: Fix known issues and complete missing features before Android release

### Priority 0 - Critical Bugs (This Week)
1. **Favorites Server Error**
   - Issue: `venueService.getAll()` may fail on backend
   - Action: Verify `/venues` endpoint works, add better error handling
   - File: `src/pages/Favorites.tsx`, `src/services/favorites.ts`

2. **Admin Request List Error**
   - Issue: `/admin/pending-managers` endpoint may not exist or return error
   - Action: Check backend API availability, handle gracefully
   - File: `src/pages/admin/AdminDashboard.tsx`, `src/services/admin.ts`

3. **Amazing Tab Visibility**
   - Issue: Deals tab only visible for logged-in users
   - Status: ✅ Working as designed (ProtectedRoute in App.tsx)
   - Note: Not a bug - intentional UX decision

### Priority 1 - Feature Completeness (Next 2 Weeks)
4. **Team/Competition Discoverability**
   - Current: Pages exist but may lack proper navigation exposure
   - Routes: `/teams`, `/teams/discover`, `/competitions` all registered
   - Navigation: Present in Navbar (lines 77-78)
   - Action: Verify menu items render correctly per role

5. **Manager Hall Details Page**
   - Current: ManagerDashboard exists but detailed venue view may be missing
   - Action: Add "My Venues" detail page with slots, pricing, bookings
   - File: Create `src/pages/manager/VenueDetail.tsx` if needed

6. **Role-Based Navigation**
   - Current: Basic role checks in App.tsx routes
   - Issue: Menu items may not filter properly by user permissions
   - Action: Implement dynamic navbar based on user.role + staff assignments

### Priority 2 - Backend Integration Audit (Week 3)
7. **API Completeness Check**
   - Endpoints to verify:
     - `/rules/*` - Business rules management
     - `/customers/*` - CRM endpoints
     - `/management/*` - Management operations
     - `/finance/*` - Financial reports/settlements
   - Action: Test each endpoint, create missing ones if needed

8. **Real Data Verification**
   - Ensure NO mock data anywhere in frontend
   - All lists must come from API calls
   - All mutations must update server state

### Priority 3 - Mobile Readiness (Week 4)
9. **Android Build Configuration**
   - Current: Gradle setup exists in `src-tauri/gen/android/`
   - Keystore: `keystore.properties` present but needs verification
   - Action: Build debug APK, test on emulator

10. **Mobile UI/UX Polish**
    - RTL Persian fonts (Vazirmatn loaded)
    - Touch targets minimum 48dp
    - Safe area handling
    - Keyboard avoidance for forms
    - Loading/Empty/Error states for all pages

## Next Phase: Enhancement (After Bug Fixes)
- Split payment for teams
- Coach role implementation
- Tournament management completion
- Dynamic pricing engine
- SMS notification completion
- Refund flow frontend

## Success Criteria
✅ All P0 bugs fixed
✅ All core flows work end-to-end with real API
✅ Android APK builds successfully
✅ E2E tests pass on emulator
✅ No console errors in production build
✅ Role-based access control working correctly

## Timeline
- Week 1: P0 bug fixes (Favorites, Admin requests)
- Week 2: Feature completeness (navigation, manager pages)
- Week 3: API audit and integration fixes
- Week 4: Android build and testing
- Week 5: Release candidate preparation

## Dependencies
- Backend API at https://api.salon.absadeghi.ir (must be running)
- Android SDK installed and configured
- Rust toolchain for Tauri builds
- Signing keys for release APK
