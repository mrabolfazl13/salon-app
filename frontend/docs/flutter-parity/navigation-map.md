# Navigation Map

## Navigation Structure

```
/ (Home)
├── /login
├── /register
├── /forgot-password
├── /verify
├── /search
├── /favorites
├── /venues
│   └── /venues/:id
├── /bookings
│   └── /bookings/:id
├── /dashboard
├── /profile
├── /competitions
├── /games
│   ├── /games/new
│   └── /games/:id
├── /join/g/:token
├── /contracts
│   └── /contracts/:id
├── /teams
│   ├── /teams/discover
│   └── /teams/:id
├── /deals
├── /quiz
├── /manager-dashboard
├── /finance
├── /manager/pricing
├── /manager/contracts
│   └── /manager/contracts/:id
├── /manager/teams
├── /manager/crm
├── /manager/checkin
├── /manager/finance
└── /admin
    ├── /admin/users
    └── /admin/venues
```

## Navigation Methods

- **Push**: Navigate forward to new screens
- **Pop**: Return to previous screen (Android back button)
- **Replace**: Replace current route (after login/register)
- **Guarded Routes**: Require authentication or specific roles

## Deep Links

- `/join/g/:token` - Join game via invitation token
- `/venues/:id` - Direct venue access
- `/games/:id` - Direct game access

---
*Last updated: 2026-10-06*
