# Known Issues - Salon Futsal Booking System

**Date**: 2026-10-13 | **Version**: 1.2.0

## Critical Issues (P0)

### 1. Favorites Server Error - PARTIALLY FIXED ✅
**Status**: Improved error handling, needs backend verification

**Symptom**: When viewing favorites page, if `/venues` endpoint fails, user sees error state

**Root Cause**: 
- `venueService.getAll()` may return unexpected response format
- Backend may not support large `limit` parameter
- Network issues or CORS problems in production

**Fix Applied**:
- Enhanced response parsing to handle both array and paginated responses
- Added console logging for debugging
- Increased limit calculation based on favorites count

**File**: `src/pages/Favorites.tsx`

**Next Steps**:
- Test `/venues?limit=100` endpoint directly on backend
- Verify response format matches frontend expectations
- Check if pagination metadata is returned correctly

---

### 2. Admin Pending Managers Endpoint - IMPROVED ✅
**Status**: Graceful degradation implemented

**Symptom**: Admin dashboard may fail to load if `/admin/pending-managers` doesn't exist

**Root Cause**:
- Backend endpoint may not be implemented
- User may lack permission to view pending managers
- API route mismatch between frontend and backend

**Fix Applied**:
- Separated pending managers fetch from main data loading
- Added try-catch with silent failure
- Console warning logged for debugging
- Empty array fallback prevents UI crash

**File**: `src/pages/admin/AdminDashboard.tsx`, `src/services/admin.ts`

**Next Steps**:
- Verify backend has `/admin/pending-managers` endpoint
- Check if it requires special permissions
- Consider alternative approach if endpoint doesn't exist

---

## High Priority Issues (P1)

### 3. Manager Hall Details Missing
**Status**: Not yet addressed

**Symptom**: Managers can see list of venues but no detailed view per venue

**Expected**: Page showing slots, bookings, pricing for each managed venue

**Current State**:
- `ManagerDashboard` exists with overview
- No dedicated venue detail page for managers
- Customers have `/venues/:id` but managers need different view

**Impact**: Medium - Managers cannot drill down into specific venue metrics

**Proposed Solution**:
Create `src/pages/manager/VenueDetail.tsx` with:
- Slot schedule management
- Booking history
- Revenue charts
- Pricing controls link
- Staff assignments

---

### 4. Role-Based Navigation Incomplete
**Status**: Partially working

**Symptom**: Menu items shown based on role but may not reflect staff assignments correctly

**Current Implementation**:
- Basic role checks in Navbar (lines 51-56)
- `useStaffMe` hook for staff detection
- `canConsoleNav` flag combines manager + staff

**Issues**:
- Staff users see same menu as managers but may have limited permissions
- No granular permission system
- Hard-coded menu items don't scale

**Impact**: Low-Medium - UX confusion when clicking leads to 403 errors

---

### 5. Team/Competition Discoverability
**Status**: Routes exist, visibility unclear

**Current State**:
- `/teams` and `/competitions` routes registered in App.tsx
- Present in Navbar navItems (lines 77-78)
- Also in avatar menuItems (lines 91-93)

**Potential Issue**:
- Competitions page designed for managers only
- Regular users may see empty state
- No public competitions listing

**Investigation Needed**:
- Test with regular user account
- Verify competitions are visible to non-managers
- Check if separate "public competitions" page needed

---

## Medium Priority Issues (P2)

### 6. Refund Flow Incomplete
**Status**: Backend exists, frontend partial

**Current State**:
- Payment service has refund capability
- Invoice page shows refund option
- No dedicated refund request form
- Status tracking missing

**Impact**: Users cannot easily request refunds for cancelled bookings

---

### 7. SMS Notifications Partial
**Status**: Infrastructure exists, implementation incomplete

**Current State**:
- Notification store supports SMS type
- Backend likely has SMS provider integration
- Frontend shows SMS toggle in profile
- Actual sending mechanism unclear

**Impact**: Users may not receive booking confirmations via SMS

---

### 8. Split Payment Not Implemented
**Status**: Missing feature

**Requirement**: Allow team members to split booking cost

**Current Workaround**: One person pays full amount, collects from others manually

**Impact**: Reduces adoption for team bookings

---

### 9. Recurring Bookings Missing
**Status**: Not implemented

**Use Case**: Teams want to book same slot every week

**Complexity**: High - requires conflict detection, capacity management

**Impact**: Manual re-booking each week is tedious

---

## Low Priority Issues (P3)

### 10. Coach Role Missing
**Status**: Not in role system

**Current Roles**: user, venue_manager, club_admin, super_admin

**Need**: Special role for coaches with team management permissions

**Impact**: Coaches use regular user accounts, less discoverable

---

### 11. Tournament Management Basic
**Status**: Competitions page exists but limited

**Missing Features**:
- Bracket generation
- Match scheduling
- Score tracking
- Prize management

**Impact**: Cannot host full tournaments on platform

---

### 12. Dynamic Pricing Not Implemented
**Status**: Static pricing only

**Current**: Managers set fixed prices per slot

**Desired**: Time-based, demand-based, event-based pricing

**Impact**: Less revenue optimization for managers

---

## Build & Deployment Issues

### 13. Unsigned APK Builds
**Status**: Previous builds (v0.2.0, v1.1.0) are unsigned

**Risk**: Huawei warns "corrupted", Play Store rejection

**Current**: `keystore.properties` exists but not verified

**Action Needed**:
- Verify keystore configuration
- Generate signed debug APK
- Set up release signing workflow

---

### 14. No Emulator Testing Done
**Status**: Never tested on Android emulator

**Risk**: Unknown runtime issues on actual device

**Required Tests**:
- Login/logout flow
- Venue browsing
- Booking creation
- Manager operations
- Admin functions
- Navigation smoothness

---

### 15. Production API URL Hardcoded
**Status**: `.env` has IP address `http://2.189.255.225/api/v1`

**Risk**: 
- IP may change
- No DNS name for easy migration
- HTTP not HTTPS (security concern)

**Recommendation**: Use domain name with SSL certificate

---

## Documentation Gaps

### 16. Missing Documentation Files
**Created Today**:
- ✅ AGENTS.md
- ✅ CURRENT_STATE.md
- ✅ SALON_MASTER_PLAN.md
- ✅ FEATURE_COMPLETION_MATRIX.md
- ✅ KNOWN_ISSUES.md

**Still Needed**:
- API_AUDIT.md
- MOBILE_UI_UX_AUDIT.md
- BOOKING_FLOW_AUDIT.md
- FINANCE_AUDIT.md
- ROLE_PERMISSION_MATRIX.md
- EMULATOR_TEST_REPORT.md
- BUILD_AND_RELEASE_STATUS.md

---

## Resolved Issues

### ✅ Amazing Tab Visibility
**Previous Concern**: Thought to be hidden

**Finding**: Working as designed - only visible to logged-in users via ProtectedRoute

**Location**: `App.tsx` line 220, `Navbar.tsx` line 81

**Decision**: Intentional UX choice, not a bug

---

## Notes

- All fixes should maintain backward compatibility
- No mock data should be introduced
- Real API integration must be preserved
- Mobile-first design principles apply
- RTL Persian language support required
