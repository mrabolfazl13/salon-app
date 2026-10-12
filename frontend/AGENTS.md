# Salon Futsal Booking System - Agent Guidelines

## Project Overview
React/Vite/Tauri application for futsal venue booking with Android support.

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite 5
- **UI**: Material-UI 9, Tailwind CSS 4, Framer Motion
- **State**: Zustand (auth, theme, update), TanStack Query
- **Routing**: React Router DOM 7
- **Backend API**: FastAPI (external at https://api.salon.absadeghi.ir)
- **Mobile**: Tauri 2.x for Android/Desktop
- **Testing**: Playwright E2E

## Key Commands
```bash
# Development
npm run dev          # Start Vite dev server
npm run tauri:dev    # Start Tauri desktop app

# Build
npm run build        # Frontend production build
npm run tauri:build  # Tauri desktop build
npm run tauri:android # Android APK/AAB build

# Testing
npm run test:e2e     # Run Playwright tests
npm run lint         # ESLint check
```

## Architecture Notes
- Lazy-loaded pages in App.tsx
- Role-based routing: customer, venue_manager, super_admin
- WebSocket integration for real-time notifications
- Auto-update mechanism for Tauri apps
- RTL Persian UI with Vazirmatn font

## Critical Paths
1. Venue browsing → Slot selection → Booking creation → Payment
2. Manager hall request → Admin approval → Access activation
3. Team management → Competition participation
4. Finance console → Revenue tracking → Settlement

## Known Constraints
- Backend on separate domain (CORS configured)
- Iranian payment gateways (ZarinPal, Mellat)
- No mock data - all features must connect to real API
- Android builds require NDK + Rust targets
