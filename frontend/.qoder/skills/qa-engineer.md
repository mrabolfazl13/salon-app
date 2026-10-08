---
name: qa-engineer
description: Quality assurance skill for futsal booking system. Handles unit testing, integration testing, E2E testing, performance testing, security testing, and accessibility audits across all platforms.
metadata:
  type: project
  version: "1.0"
  phase: all
---

# QA Engineer Skill - Futsal Booking System

## Responsibilities
- Write unit tests for all components
- Create integration tests for APIs
- Build E2E test scenarios
- Perform performance testing
- Conduct security audits
- Run accessibility checks
- Manage test automation
- Track test coverage and quality metrics

## Tech Stack

### Backend Testing
- **Unit Tests**: pytest
- **Integration Tests**: pytest + httpx
- **Load Testing**: Locust
- **Security Scanning**: OWASP ZAP, bandit
- **API Testing**: Postman/Newman, requests

### Frontend Testing
- **Unit Tests**: Vitest + React Testing Library
- **Component Tests**: Storybook + Chromatic
- **E2E Tests**: Playwright
- **Visual Regression**: Percy or Chromatic
- **Accessibility**: axe-core, pa11y

### Mobile Testing
- **Unit Tests**: flutter test
- **Widget Tests**: flutter_test
- **Integration Tests**: flutter_driver
- **E2E Tests**: integration_test package
- **Performance**: Flutter DevTools

## Testing Strategy

### Test Pyramid
```
        /\
       /E2E\      ~10% (critical paths only)
      /------\
     /Integration\   ~30% (API + component integration)
    /------------\
   /    Unit       \  ~60% (fast, isolated tests)
  /------------------\
```

### Coverage Targets
- **Backend**: ≥80% line coverage, ≥90% on critical paths
- **Frontend**: ≥70% line coverage
- **Mobile**: ≥75% line coverage
- **Critical Flows**: 100% E2E coverage

## Backend Testing

### Unit Test Pattern
```python
import pytest
from src.services.booking_service import BookingService

@pytest.mark.asyncio
async def test_create_booking_success():
    service = BookingService()
    booking = await service.create(
        user_id="user_123",
        slot_id="slot_456",
        date="2026-10-15"
    )
    
    assert booking.status == "confirmed"
    assert booking.user_id == "user_123"

@pytest.mark.asyncio
async def test_create_booking_conflict():
    service = BookingService()
    
    # First booking
    await service.create(
        user_id="user_123",
        slot_id="slot_456",
        date="2026-10-15"
    )
    
    # Second booking should fail
    with pytest.raises(BookingConflictError):
        await service.create(
            user_id="user_789",
            slot_id="slot_456",
            date="2026-10-15"
        )
```

### Integration Test Pattern
```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_venues_endpoint(async_client: AsyncClient):
    response = await async_client.get("/api/v1/venues")
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) > 0

@pytest.mark.asyncio
async def test_create_venue_requires_auth(async_client: AsyncClient):
    response = await async_client.post("/api/v1/venues", json={})
    
    assert response.status_code == 401
```

### Load Testing with Locust
```python
from locust import HttpUser, task, between

class BookingUser(HttpUser):
    wait_time = between(1, 3)
    
    @task(3)
    def view_venues(self):
        self.client.get("/api/v1/venues?page=1&limit=20")
    
    @task(2)
    def view_slots(self):
        self.client.get("/api/v1/slots?venue_id=1&date=2026-10-15")
    
    @task(1)
    def create_booking(self):
        self.client.post("/api/v1/bookings", json={
            "slot_id": 123,
            "date": "2026-10-15"
        })
```

## Frontend Testing

### Component Unit Test
```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { VenueCard } from './VenueCard';

describe('VenueCard', () => {
  it('displays venue name and location', () => {
    const venue = {
      id: '1',
      name: 'Test Venue',
      location: 'Tehran',
    };
    
    render(<VenueCard venue={venue} />);
    
    expect(screen.getByText('Test Venue')).toBeInTheDocument();
    expect(screen.getByText('Tehran')).toBeInTheDocument();
  });
  
  it('shows booking button', () => {
    const venue = { id: '1', name: 'Test', location: 'Loc' };
    render(<VenueCard venue={venue} />);
    
    expect(screen.getByRole('button', { name: /رزرو/ })).toBeInTheDocument();
  });
});
```

### E2E Test with Playwright
```typescript
import { test, expect } from '@playwright/test';

test('complete booking flow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="phone"]', '09123456789');
  await page.click('button[type="submit"]');
  
  // Search venues
  await page.goto('/venues');
  await page.fill('[placeholder="جستجو..."]', 'فوتسال');
  await page.click('.venue-card:first-child');
  
  // Select slot
  await page.click('.slot-button:first-child');
  
  // Confirm booking
  await page.click('button:has-text("تأیید رزرو")');
  
  // Verify success
  await expect(page.locator('.success-message')).toBeVisible();
});
```

### Accessibility Test
```typescript
import { AxeBuilder } from '@axe-core/playwright';

test('homepage has no accessibility violations', async ({ page }) => {
  await page.goto('/');
  
  const results = await new AxeBuilder({ page }).analyze();
  
  expect(results.violations).toHaveLength(0);
});
```

## Mobile Testing

### Flutter Unit Test
```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:futsal_booking/services/api_service.dart';

void main() {
  group('ApiService', () {
    test('fetches venues successfully', () async {
      final service = ApiService(MockDio());
      final venues = await service.fetchVenues(page: 1, limit: 10);
      
      expect(venues.length, greaterThan(0));
      expect(venues.first.name, isNotEmpty);
    });
  });
}
```

### Widget Test
```dart
testWidgets('VenueCard displays venue info', (tester) async {
  final venue = Venue(id: '1', name: 'Test Venue', location: 'Tehran');
  
  await tester.pumpWidget(
    MaterialApp(
      home: VenueCard(venue: venue),
    ),
  );
  
  expect(find.text('Test Venue'), findsOneWidget);
  expect(find.text('Tehran'), findsOneWidget);
});
```

### Integration Test
```dart
import 'package:integration_test/integration_test.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  
  testWidgets('Login and view venues', (tester) async {
    await tester.pumpWidget(const MyApp());
    
    // Tap login
    await tester.tap(find.text('ورود'));
    await tester.pumpAndSettle();
    
    // Enter credentials
    await tester.enterText(find.byType(TextField), '09123456789');
    await tester.tap(find.text('ادامه'));
    await tester.pumpAndSettle();
    
    // Verify venues loaded
    expect(find.byType(VenueCard), findsWidgets);
  });
}
```

## Security Testing

### Automated Security Scans
```bash
# Python dependency vulnerabilities
pip-audit

# Static analysis
bandit -r src/

# OWASP ZAP scan
zap-cli quick-scan --self-contained --start-options '-config api.disableapikey=true' http://localhost:8000
```

### Manual Security Checklist
- [ ] JWT tokens properly validated
- [ ] SQL injection prevented (using ORM)
- [ ] XSS prevented (React escapes by default)
- [ ] CSRF protection enabled
- [ ] Rate limiting on public endpoints
- [ ] Input validation on all forms
- [ ] Sensitive data encrypted at rest
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] File upload validation (type, size)

## Performance Testing

### Backend Performance
```bash
# Locust load test
locust -f locustfile.py --users 100 --spawn-rate 10 --run-time 5m

# Target metrics:
# - Response time p95 < 500ms
# - Error rate < 0.1%
# - Throughput > 100 req/s
```

### Frontend Performance
```bash
# Lighthouse CI
lighthouse-ci run --url=http://localhost:3000

# Target metrics:
# - LCP < 2.5s
# - FID < 100ms
# - CLS < 0.1
# - Performance score > 90
```

### Mobile Performance
```bash
# Flutter DevTools profiling
flutter run --profile

# Monitor:
# - Frame rendering time < 16ms (60fps)
# - Memory usage < 100MB
# - App startup time < 3s
```

## Test Automation

### CI Integration
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pip install -r requirements.txt
      - run: pytest --cov=src --cov-report=xml
      
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test
      - run: npx playwright test
      
  mobile-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
      - run: flutter test
```

## Code Review Checklist

### For Backend PRs
- [ ] Unit tests for new services
- [ ] Integration tests for new endpoints
- [ ] Error cases covered
- [ ] Edge cases considered
- [ ] Performance implications documented

### For Frontend PRs
- [ ] Component tests written
- [ ] User flows tested manually
- [ ] Responsive on mobile/tablet/desktop
- [ ] Accessible (keyboard, screen reader)
- [ ] No console.log in production

### For Mobile PRs
- [ ] Widget tests added
- [ ] Tested on both Android and iOS
- [ ] Offline behavior verified
- [ ] Battery impact considered
- [ ] Memory leaks checked

## Test Reporting

### Coverage Report
```bash
# Backend
pytest --cov=src --cov-report=html

# Frontend
npm test -- --coverage

# Mobile
flutter test --coverage
genhtml coverage/lcov.info --output-directory=coverage/html
```

### Quality Gates
Block merge if:
- Coverage drops below threshold
- Any E2E test fails
- Performance regression > 10%
- Security vulnerabilities found
- Accessibility violations exist

## Phase-Specific Priorities

### Phase 0 (Critical Fixes)
- Ensure all existing tests pass
- Fix any broken CI pipelines
- Add tests for recently fixed bugs

### Phase 1 (Core Completion)
- Write tests for all new features
- Set up E2E test suite for critical flows
- Implement performance monitoring
- Run security audit

See `docs/tasks/qa-tasks.md` for detailed task list.
