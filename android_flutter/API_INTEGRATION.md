# API Integration Guide

This document explains how to connect the Flutter app to the backend API.

## Configuration

### Set API URL

The API base URL is configured in `lib/core/network/api_client.dart`:

```dart
final baseUrl = const String.fromEnvironment(
  'API_URL',
  defaultValue: 'http://localhost:8000/api/v1',
);
```

You can override it at build time:

```bash
flutter run --dart-define=API_URL=https://api.yourserver.com/api/v1
```

Or in release builds:

```bash
flutter build apk --release --dart-define=API_URL=https://api.yourserver.com/api/v1
```

## Available Services

All services are ready to use and follow the same pattern:

### 1. Auth Service
```dart
import 'package:salon_app/core/network/index.dart';

// Login
final response = await AuthService.login(phone, password);
await TokenStorage.saveToken(response.accessToken);

// Register
await AuthService.register(
  fullName: fullName,
  phone: phone,
  password: password,
);

// Get current user
final user = await AuthService.getMe();
```

### 2. Venue Service
```dart
// Get all venues
final venues = await VenueService.getVenues(
  search: 'فوتسال',
  sportType: 'futsal',
  page: 1,
  limit: 20,
);

// Get venue details
final venue = await VenueService.getVenue(venueId);

// Get available slots
final slots = await VenueService.getVenueSlots(
  venueId,
  date: '2026-10-07',
);
```

### 3. Booking Service
```dart
// Create booking
final booking = await BookingService.createBooking(
  venueId: venueId,
  slotId: slotId,
  date: '2026-10-07',
  couponCode: 'DISCOUNT10',
);

// Get user bookings
final bookings = await BookingService.getBookings(
  status: 'confirmed',
  page: 1,
);

// Cancel booking
await BookingService.cancelBooking(bookingId);
```

### 4. Competition Service
```dart
// Get competitions
final competitions = await CompetitionService.getCompetitions(
  status: 'active',
);

// Register for competition
await CompetitionService.register(competitionId);
```

### 5. Game Service
```dart
// Get games
final games = await GameService.getGames(
  sportType: 'futsal',
  level: 'intermediate',
);

// Create game
final game = await GameService.createGame(
  title: 'بازی دوستانه',
  venueId: venueId,
  date: '2026-10-07',
  time: '18:00',
  maxPlayers: 10,
);

// Join game
await GameService.joinGame(gameId);
```

### 6. Team Service
```dart
// Get my teams
final teams = await TeamService.getMyTeams();

// Discover teams
final discoverTeams = await TeamService.discoverTeams(
  search: 'فوتسال',
);

// Request to join team
await TeamService.requestJoin(teamId);
```

### 7. Contract Service
```dart
// Get contracts
final contracts = await ContractService.getContracts(
  status: 'active',
);

// Pay installment
await ContractService.payInstallment(contractId, installmentNumber);
```

### 8. Deal Service
```dart
// Get deals
final deals = await DealService.getDeals(
  category: 'discount',
);

// Claim deal
await DealService.claimDeal(dealId);
```

### 9. Quiz Service
```dart
// Get current quiz
final quiz = await QuizService.getCurrentQuiz();

// Submit answers
final result = await QuizService.submitQuiz(
  quizId: quizId,
  answers: [1, 3, 2, 4],
);
```

### 10. Manager Service
```dart
// Get dashboard stats
final stats = await ManagerService.getDashboard();

// Get pricing rules
final rules = await ManagerService.getPricingRules();

// Create pricing rule
await ManagerService.createPricingRule({
  'day_of_week': 'friday',
  'multiplier': 1.5,
});

// Verify check-in code
final result = await ManagerService.verifyCheckin('ABC123');
```

### 11. Admin Service
```dart
// Get admin dashboard
final stats = await AdminService.getDashboard();

// Get users
final users = await AdminService.getUsers(
  role: 'user',
  page: 1,
);

// Update user role
await AdminService.updateUserRole(userId, 'venue_manager');

// Block user
await AdminService.toggleUserStatus(userId, false);

// Approve venue
await AdminService.updateVenueStatus(venueId, 'approved');
```

## Error Handling

All services throw exceptions with Persian error messages:

```dart
try {
  final venues = await VenueService.getVenues();
} catch (e) {
  // Show error to user
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(e.toString())),
  );
}
```

## Authentication

The API client automatically adds the auth token to all requests:

```dart
// Token is retrieved from storage
final token = await TokenStorage.getToken();

// Added to headers
headers['Authorization'] = 'Bearer $token';
```

When a 401 error occurs, the token is automatically cleared and the user is redirected to login.

## Offline Support

Currently, the app requires an internet connection. To add offline support:

1. Cache responses using Hive or SQLite
2. Check connectivity before requests
3. Queue mutations for when connection returns

## Testing API Connection

Run this to test:

```bash
flutter run --dart-define=API_URL=http://your-server:8000/api/v1
```

Then try logging in with valid credentials.

## Backend Requirements

The backend must support:

- CORS for development
- JWT authentication
- Standard REST endpoints
- Persian error messages (optional but recommended)
- Pagination support (page/limit parameters)

## Next Steps

1. Configure API URL for your environment
2. Test each service with real backend
3. Add loading states to all screens
4. Implement proper error handling UI
5. Add offline caching if needed
