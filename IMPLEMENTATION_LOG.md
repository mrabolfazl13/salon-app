# IMPLEMENTATION_LOG - Futsal Booking System

FINAL verification/repair pass (post wave-11). Date: 2026-09-15.
No fixes were required - all gates green; integration spot-checks FE<->BE all OK.

## Waves 1-11 - what shipped

| Wave | Phase | Shipped | Key files |
|---|---|---|---|
| 1 | Games subsystem | Persistent games, invitations, join-by-token, waitlist; nullable phone fix | app/api/v1/games.py, migrations a1g001/b2h002 |
| 2 | Memberships | Plans/subscriptions layer + payment hooks | app/api/v1/memberships.py, c3i003membership |
| 3 | Finance core | Ledger accounts, transactions, void, expense categories, CSV export | app/api/v1/finance.py, repositories/transaction_repository.py, f6l006finance |
| 4 | Contracts lifecycle | Approve-with-changes, session exclude/reschedule/cancel-request, audit trail | app/api/v1/contracts.py, services/contract_service.py, g7m007contractlifecycle |
| 5 | Pricing + loyalty + deals + holidays + coupons + favorites | Rule resolver, preview API, open-slot last-minute deals, holidays, coupon redeem, favorites | app/api/v1/{pricing,loyalty,deals,holidays,coupons,favorites}.py, h8n008pricingloyalty |
| 6 | Teams | Roster, invitations, join-requests, dues, ledger link | app/api/v1/teams.py, services/team_service.py, i9o009teams |
| 7 | Staff RBAC + CRM | Permission codes (slot.block, finance.record_payment), assignments, security audit events, venue customers, campaigns, consent, /staff/me | app/api/v1/{staff,crm}.py, utils/permissions.py, j0p010staffcrm |
| 8 | Contract request parity | desired_installments + note at request time; installment plan at approval | schemas/contract.py, k1q011contractrequest |
| 9 | Multi-day contracts | additional_days (max 3 days total), derived days[] response, extra_days JSON column | l2r012contractdays, FE contract forms |
| 10 | FE consoles | FinanceConsole, ManagerPricing, ManagerContracts/Crm, deals pages, useStaffMe/useManagedVenues, allowStaff route gates, WS notifications | pages/finance, hooks/useStaffMe.ts, hooks/useWebSocket.ts |
| 11 | Cash-ops + polish | Contract installment cash-mark (/payments/:id/mark-paid, idempotent), game payment reminders (/payments/remind), typed slot block/unblock responses, demo seed dataset | contracts.py:401, games.py:440, slots.py:68, scripts/seed_full_demo.py |

## Verification results (this pass)

- pytest tests -q -> 290 passed, zero failures (~6 min).
- python -m compileall app -q -> OK. alembic heads -> single head l2r012contractdays.
- Fresh-SQLite alembic upgrade head -> OK (a..l applied); temp DB deleted.
- seed_full_demo.py --reset --sqlite backend/tmp_seed_check.db -> OK; temp DB deleted.
- FE: npx tsc --noEmit clean; npm run build OK (~14s, chunk-size warning only).
- Greps: no console.log of tokens/PII; dev_code rendered only under import.meta.env.DEV;
  no stale TODOs (single XXX match is a phone-regex comment in schemas/venue.py, not a TODO;
  old cash-mark TODO is gone).
- Public (auth-less) routes, all intentional: auth register/login/verify/forgot/reset,
  venues list+detail, slots/venue reads, games explore/detail/participants/join-preview,
  reviews/venue reads, competitions best-bid, memberships/plans, /health, /.
  No unauthenticated mutating endpoint found.

## Integration spot-checks (FE <-> BE)

- (a) contracts additional_days/days/desired_installments/mark-paid payload+response: OK (mirror of ContractCreate/ContractResponse/ContractPaymentResponse)
- (b) /slots/:id/block + /unblock returning SlotBlockResponse{slot_id,venue_id,status}: OK
- (c) /games/:id/payments/remind -> {sent}: OK
- (d) finance dashboard new fields prev_month_revenue / prev_month_expenses / active_teams: OK
- (e) crm customers loyalty_balance (list rows + detail): OK
- (f) /staff/me (List[StaffMeRow]) vs useStaffMe/useManagedVenues fields: OK
- (g) /deals/available venue_id param: OK (BE supports it; FE type omits it only since no caller uses it)
- (h) WS token query name ?token= on /ws/user/:id and /ws/:role: OK
- (i) ProtectedRoute allowStaff gates /finance, /manager/pricing, /manager/contracts; role=user lands on ForbiddenPanel (empty managed-venues), backend stays authority: OK
- (j) /favorites GET/POST/DELETE + /deals/subscription GET/PUT: OK
- (k) booking create {slot_id, discount_code, use_loyalty_points} vs BookingCreate schema: OK
- (l) POST /pricing/preview + PUT /pricing/venue/:id/default-price paths+keys: OK

## How to run

1. docker-compose up -d   (postgres, redis, backend :8000, celery worker, frontend)
2. alembic upgrade head   (or DATABASE_URL=sqlite:///./dev.db for local)
3. python scripts/seed_full_demo.py --reset   (full demo dataset into configured DB)
4. pytest: cd backend && python -m pytest tests -q
5. FE: cd frontend && npm install && npm run dev  (VITE_API_URL defaults to localhost:8000); npm run build for prod bundle

## Demo credentials (seed_full_demo.py)

- super_admin: 09120000001 / admin123
- managers: 09121000001, 09121000002 / manager123
- staff/cashiers: 09122000001..09122000004 / staff123
- users: 09123000001..09123000012 / user123 (09123000011 and ..012 are NOT phone-verified)

## Known limitations / next backlog (deferred by audit)

- Organization (multi-seat) accounts
- Leagues / higher-level competitions
- QR check-in at venue
- Buffet / F&B POS
- Real payment gateway integration (card flows are simulated; cash-mark is manual)
- Jalali month arithmetic for contract installment due dates (currently Gregorian-day math)
- Booking-to-booking transfer flow (today: exclude session + rebook)
- PDF exports (only CSV finance export exists)
- Booking-slot waitlist (game waitlist only)
- Rate-limit cooldowns are in-process; Redis-backed cooldown needed for multi-worker deploy

## Wave 12 — post-review fixes

Date: 2026-09-17. Post-review wave: venue payment modes, loyalty expansion, team official/chat.

- Venue payment modes: `gateway` | `bank_receipt` (default) | `pay_in_place` — venue-level
  setting, snapshotted onto each booking at reserve time. Bank-receipt flow: user uploads receipt
  (`POST /bookings/:id/receipt` + `POST /upload/receipt`) → manager approve/reject
  (`/receipt/approve`, `/receipt/reject`); in-place collection by manager
  (`POST /bookings/:id/collect-in-person`, cash/card). Cancellation refunds now cover bank-receipt
  and in-place ledger entries (idempotent `booking-refund:<tx_id>`).
- Loyalty expansion: game-result winners auto-credit `game_win` points
  (`POST /games/:id/result`, one-time `result_set`); reviews credit `review` points on create.
  New `LoyaltyReason` values `game_win` / `review`; tunable via
  `LOYALTY_POINTS_PER_GAME_WIN` / `LOYALTY_POINTS_PER_REVIEW`.
- Teams: quorum/official status (`min_members`, `is_official`, `official_since`; audit
  `team_became_official`) and team chat (messages, unread count, `last_seen_message_at` read
  markers, `team_message` notifications).
- Migrations: m0s013paymentmodes → m0s014pointsgamewin → m0s015teamofficialchat (single head).
- Tests: 315 passed.
- Frontend: payment-mode UI (venue setting, receipt upload/review, in-place collect), game-result
  dialog, loyalty labels, team chat panel + quorum badges, and account menu available on all
  breakpoints with profile quick links/logout.
