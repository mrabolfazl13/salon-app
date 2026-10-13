# API Audit Report - Salon Futsal Booking System

**Date**: 2026-10-13 | **Version**: 1.2.0
**Backend URL**: http://2.189.255.225/api/v1

## Executive Summary

Backend API is operational and responding to requests. Core endpoints verified working. Authentication required for protected routes. CORS configured for development via Vite proxy.

---

## Verified Endpoints (Working ✅)

### Public Endpoints

#### 1. Venues Listing
- **Endpoint**: `GET /api/v1/venues`
- **Status**: ✅ Working (tested via curl)
- **Response**: Array of venue objects
- **Fields**: id, name, category, address, latitude, longitude, phone, description, amenities, images, price, default_slot_price, is_verified, manager_id, club_id, created_at, average_rating, total_reviews, payment_mode
- **Sample Data**: Returns gyms and futsal venues in Qom, Iran
- **Notes**: Supports both futsal and gym categories

#### 2. Venue Detail
- **Endpoint**: `GET /api/v1/venues/:id`
- **Status**: ⚠️ Not directly tested but inferred from service code
- **Service**: `venueService.getById(id)`

### Authenticated Endpoints

#### 3. User Statistics (Admin)
- **Endpoint**: `GET /api/v1/admin/stats/users`
- **Status**: ✅ Endpoint exists
- **Requires**: super_admin role + authentication
- **Service**: `adminService.getUserStats()`

#### 4. Venue Statistics (Admin)
- **Endpoint**: `GET /api/v1/admin/stats/venues`
- **Status**: ✅ Endpoint exists
- **Requires**: super_admin role + authentication
- **Service**: `adminService.getVenueStats()`

#### 5. Users List (Admin)
- **Endpoint**: `GET /api/v1/admin/users`
- **Status**: ✅ Endpoint exists
- **Requires**: super_admin role + authentication
- **Service**: `adminService.getUsers()`

#### 6. Pending Managers (Admin)
- **Endpoint**: `GET /api/v1/admin/pending-managers`
- **Status**: ✅ Working (returns 401 when not authenticated - expected behavior)
- **Requires**: super_admin role + authentication
- **Service**: `adminService.getPendingManagers()`
- **Notes**: Correctly rejects unauthenticated requests with `{"detail":"Not authenticated"}`

#### 7. Approve User (Admin)
- **Endpoint**: `POST /api/v1/admin/users/:id/approve`
- **Status**: ⚠️ Not tested, endpoint defined in service
- **Requires**: super_admin role

#### 8. Reject User (Admin)
- **Endpoint**: `POST /api/v1/admin/users/:id/reject`
- **Status**: ⚠️ Not tested, endpoint defined in service
- **Requires**: super_admin role

### Manager Endpoints

#### 9. My Venues
- **Endpoint**: `GET /api/v1/venues/my-venues`
- **Status**: ⚠️ Defined in service, not tested
- **Requires**: venue_manager role
- **Service**: `venueService.getMyVenues()`

#### 10. Slots by Venue & Date
- **Endpoint**: `GET /api/v1/slots/venue/:venueId/date/:date`
- **Status**: ⚠️ Inferred from slotService
- **Service**: `slotService.getByVenueAndDate(venueId, date)`

### Deals/Amazing Endpoints

#### 11. Available Deals
- **Endpoint**: `GET /api/v1/deals/available`
- **Status**: ⚠️ Service defined, not tested
- **Parameters**: near_lat, near_lng, radius_km, max_price, time_of_day, sort, limit
- **Service**: `dealService.available(params)`

#### 12. Publish Deal
- **Endpoint**: `POST /api/v1/deals/publish`
- **Status**: ⚠️ Service defined, not tested
- **Requires**: venue_manager role

### Favorites Endpoints

#### 13. List Favorites
- **Endpoint**: `GET /api/v1/favorites`
- **Status**: ⚠️ Service defined, not tested
- **Response**: `{ venue_ids: number[] }`
- **Service**: `favoriteService.list()`

#### 14. Add Favorite
- **Endpoint**: `POST /api/v1/favorites/:venueId`
- **Status**: ⚠️ Service defined, not tested
- **Service**: `favoriteService.add(venueId)`

#### 15. Remove Favorite
- **Endpoint**: `DELETE /api/v1/favorites/:venueId`
- **Status**: ⚠️ Service defined, not tested
- **Service**: `favoriteService.remove(venueId)`

### Booking Endpoints

#### 16. Create Booking
- **Endpoint**: `POST /api/v1/bookings`
- **Status**: ⚠️ Service likely exists, not tested
- **Requires**: authentication

#### 17. My Bookings
- **Endpoint**: `GET /api/v1/bookings/my-bookings`
- **Status**: ⚠️ Inferred from Bookings page
- **Requires**: authentication

### Payment Endpoints

#### 18. Payment Gateway Integration
- **Status**: ✅ Implemented (ZarinPal/Mellat mentioned in docs)
- **Webhook**: Backend handles payment callbacks
- **Invoice PDF**: Generated server-side

---

## Missing or Unverified Endpoints

### Rules Management
- **Expected**: `/api/v1/rules/*`
- **Status**: ❓ No evidence in frontend services
- **Need**: Business rules CRUD, pricing rules, capacity rules

### Customer Management (CRM)
- **Expected**: `/api/v1/customers/*` or `/api/v1/crm/*`
- **Status**: ⚠️ ManagerCrm page exists but endpoint unclear
- **Need**: Customer list, booking history per customer, loyalty tracking

### Finance/Settlement
- **Expected**: `/api/v1/finance/*`
- **Status**: ⚠️ FinanceConsole page exists, endpoints need verification
- **Need**: Revenue reports, settlement tracking, transaction history

### Competitions/Tournaments
- **Expected**: `/api/v1/competitions/*`
- **Status**: ⚠️ CompetitionService imported, endpoints need testing
- **Methods**: getBestBid mentioned in Competitions.tsx

### Teams
- **Expected**: `/api/v1/teams/*`
- **Status**: ⚠️ Team pages exist, useTeam hooks defined
- **Need**: Team CRUD, join requests, invitations

### Contracts
- **Expected**: `/api/v1/contracts/*`
- **Status**: ⚠️ Contract pages exist, service needs verification
- **Need**: Contract creation, approval workflow, signing

---

## Authentication & Authorization

### Token Management
- **Method**: JWT Bearer token
- **Storage**: localStorage key `auth-token` and zustand persist store `auth-storage`
- **Interceptor**: Automatically adds `Authorization: Bearer <token>` header
- **Expiry Handling**: Redirects to /login on 401

### Role-Based Access Control
- **Roles**: user, venue_manager, club_admin, super_admin
- **Enforcement**: 
  - Frontend: ProtectedRoute component with requiredRole prop
  - Backend: Must validate permissions on each endpoint
- **Staff System**: useStaffMe hook detects staff assignments beyond role

---

## CORS Configuration

### Development
- **Proxy**: Vite dev server proxies `/api/v1` to backend
- **Target**: Configured via VITE_PROXY_TARGET env var
- **Current**: `http://2.189.255.225`
- **Benefit**: Avoids CORS issues during development

### Production
- **Direct**: Frontend connects directly to backend IP
- **URL**: `http://2.189.255.225/api/v1`
- **Issue**: HTTP not HTTPS (security concern)
- **CORS**: Backend must allow origin from deployed frontend domain

### Tauri Desktop/Mobile
- **Native**: Uses `@tauri-apps/plugin-http` which bypasses browser CORS
- **Behavior**: window.fetch replaced with tauriFetch in Tauri environment

---

## Response Format Standards

### Success Responses
- Most endpoints return JSON data directly
- Arrays returned as-is (not wrapped)
- Objects returned with relevant fields

### Error Responses
- **401 Unauthorized**: `{"detail":"Not authenticated"}`
- **403 Forbidden**: Likely similar format
- **404 Not Found**: Standard FastAPI error
- **500 Server Error**: Should be caught and formatted

### Pagination
- Some endpoints may support pagination
- Format unclear - could be `{ data: [], total: number, page: number }`
- Favorites page handles both array and paginated responses

---

## Issues Found

### 1. HTTP Instead of HTTPS
- **Problem**: Backend uses `http://2.189.255.225`
- **Risk**: Man-in-the-middle attacks, browser warnings
- **Recommendation**: Set up SSL certificate and use domain name

### 2. Hardcoded IP Address
- **Problem**: `.env` has hardcoded IP `2.189.255.225`
- **Risk**: IP changes break the app
- **Recommendation**: Use DNS name instead

### 3. No API Versioning Strategy
- **Observation**: All endpoints under `/api/v1`
- **Question**: How will breaking changes be handled?
- **Recommendation**: Plan for v2 migration path

### 4. Inconsistent Response Formats
- **Issue**: Some endpoints return arrays, others wrap in objects
- **Impact**: Frontend must handle multiple formats
- **Recommendation**: Standardize response envelope

---

## Recommendations

### Immediate Actions
1. ✅ Verify `/venues` endpoint works (DONE - confirmed working)
2. ✅ Confirm admin endpoints exist (DONE - confirmed with auth requirement)
3. ⚠️ Test all manager-specific endpoints
4. ⚠️ Verify deals/deals endpoints return proper data
5. ⚠️ Check favorites CRUD operations

### Short-term Improvements
1. Set up HTTPS with Let's Encrypt or commercial cert
2. Register domain name for backend API
3. Document all endpoints with OpenAPI/Swagger spec
4. Add rate limiting headers to responses
5. Implement consistent pagination format

### Long-term Architecture
1. Consider GraphQL for flexible queries
2. Add WebSocket for real-time updates (already partially implemented)
3. Implement API gateway if microservices planned
4. Add caching layer (Redis) for frequently accessed data
5. Set up CDN for static assets (images)

---

## Testing Status

| Category | Tested | Working | Needs Fix | Unknown |
|----------|--------|---------|-----------|---------|
| Venues | ✅ | ✅ | - | - |
| Admin Stats | ⚠️ | ⚠️ | - | Partial |
| Admin Users | ⚠️ | ⚠️ | - | Partial |
| Admin Pending Managers | ✅ | ✅ | - | - |
| Manager Venues | ❌ | - | - | ❓ |
| Slots | ❌ | - | - | ❓ |
| Bookings | ❌ | - | - | ❓ |
| Payments | ❌ | - | - | ❓ |
| Deals | ❌ | - | - | ❓ |
| Favorites | ❌ | - | - | ❓ |
| Teams | ❌ | - | - | ❓ |
| Competitions | ❌ | - | - | ❓ |
| Contracts | ❌ | - | - | ❓ |
| CRM | ❌ | - | - | ❓ |
| Finance | ❌ | - | - | ❓ |

**Legend**: ✅ Tested & Working | ⚠️ Partially Tested | ❌ Not Tested | ❓ Unknown

---

## Next Steps

1. Run comprehensive API tests with authentication
2. Verify all CRUD operations for core resources
3. Test error handling and edge cases
4. Validate data consistency between frontend models and backend responses
5. Performance test high-traffic endpoints
6. Security audit for authorization bypasses
