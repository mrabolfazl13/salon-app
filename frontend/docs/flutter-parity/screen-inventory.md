# Screen Inventory - Tauri Application

## Public Screens (No Authentication Required)

| Screen | Route | Purpose | Status |
|--------|-------|---------|--------|
| Home | `/` | Landing page with features, hero section | ✅ Implemented |
| Search | `/search` | Search venues and services | 🔄 Placeholder |
| Favorites | `/favorites` | User's favorite venues | 🔄 Placeholder |
| Venues List | `/venues` | Browse all venues | 🔄 Placeholder |
| Venue Detail | `/venues/:id` | View venue details, book slots | 🔄 Placeholder |
| Login | `/login` | User authentication | 🔄 Scaffold only |
| Register | `/register` | New user registration | 🔄 Scaffold only |
| Forgot Password | `/forgot-password` | Password recovery | 🔄 Scaffold only |
| Verify Email | `/verify` | Email verification | 🔄 Scaffold only |

## Protected User Screens (Authentication Required)

| Screen | Route | Purpose | Status |
|--------|-------|---------|--------|
| Dashboard | `/dashboard` | User dashboard with bookings | 🔄 Placeholder |
| Bookings | `/bookings` | List of user bookings | 🔄 Placeholder |
| Booking Detail | `/bookings/:id` | View booking details | ❌ Not started |
| Profile | `/profile` | User profile management | 🔄 Placeholder |
| Competitions | `/competitions` | Browse competitions | ❌ Not started |
| Games Explore | `/games` | Browse games | ❌ Not started |
| Game Detail | `/games/:id` | View game details | ❌ Not started |
| Game Create | `/games/new` | Create new game | ❌ Not started |
| Join By Token | `/join/g/:token` | Join game via token | ❌ Not started |
| Contracts | `/contracts` | User contracts list | ❌ Not started |
| Contract Detail | `/contracts/:id` | View contract details | ❌ Not started |
| Teams | `/teams` | User teams | ❌ Not started |
| Team Discover | `/teams/discover` | Find teams | ❌ Not started |
| Team Detail | `/teams/:id` | View team details | ❌ Not started |
| Deals | `/deals` | Special offers | ❌ Not started |
| Quiz | `/quiz` | Quiz feature | ❌ Not started |

## Manager Screens (venue_manager role required)

| Screen | Route | Purpose | Status |
|--------|-------|---------|--------|
| Manager Dashboard | `/manager-dashboard` | Manager overview | ❌ Not started |
| Finance Console | `/finance` | Financial management | ❌ Not started |
| Manager Pricing | `/manager/pricing` | Pricing rules | ❌ Not started |
| Manager Contracts | `/manager/contracts` | Manage contracts | ❌ Not started |
| Manager Contract Detail | `/manager/contracts/:id` | Contract details | ❌ Not started |
| Manager Teams | `/manager/teams` | Manage teams | ❌ Not started |
| Manager CRM | `/manager/crm` | Customer management | ❌ Not started |
| Manager Checkin | `/manager/checkin` | Check-in management | ❌ Not started |
| Manager Finance | `/manager/finance` | Finance console | ❌ Not started |

## Admin Screens (super_admin role required)

| Screen | Route | Purpose | Status |
|--------|-------|---------|--------|
| Admin Dashboard | `/admin` | Admin overview | ❌ Not started |
| Admin Users | `/admin/users` | User management | ❌ Not started |
| Admin Venues | `/admin/venues` | Venue management | ❌ Not started |

## Summary

- **Total Screens**: 36
- **Implemented**: 1 (Home with basic structure)
- **Placeholder**: 9 (Basic scaffold)
- **Not Started**: 26

---
*Last updated: 2026-10-06*
