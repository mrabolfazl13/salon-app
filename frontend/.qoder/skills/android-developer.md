---
name: android-developer
description: Flutter mobile development skill for futsal booking system. Handles cross-platform mobile app development, offline support, push notifications, and platform-specific features.
metadata:
  type: project
  version: "1.0"
  phase: all
---

# Android/Flutter Developer Skill - Futsal Booking System

## Responsibilities
- Build Flutter screens and widgets
- Implement Riverpod state management
- Integrate with backend APIs using Dio
- Add offline support with Hive
- Configure push notifications (FCM)
- Handle platform-specific features (Android/iOS)
- Optimize app performance and size
- Manage build configuration and signing

## Tech Stack
- **Framework**: Flutter 3.x
- **State Management**: Riverpod with annotations
- **Navigation**: go_router
- **Network**: Dio with smart retry
- **Storage**: Hive (local DB) + SharedPreferences
- **UI**: Custom design system with Vazirmatn Persian font
- **Forms**: flutter_form_builder + validators
- **Animations**: Lottie, animations package
- **Notifications**: Firebase Cloud Messaging (FCM)
- **Maps**: flutter_map or google_maps_flutter
- **Charts**: fl_chart

## Project Structure
```
android_flutter/
├── lib/
│   ├── screens/          # Screen widgets
│   │   ├── auth/         # Authentication screens
│   │   ├── home/         # Home and discovery
│   │   ├── bookings/     # Booking management
│   │   ├── games/        # Game features
│   │   ├── teams/        # Team management
│   │   ├── manager/      # Manager features
│   │   └── admin/        # Admin features
│   ├── providers/        # Riverpod providers
│   ├── services/         # API services
│   ├── models/           # Data models
│   ├── widgets/          # Reusable widgets
│   ├── utils/            # Utility functions
│   └── config/           # Configuration
├── android/              # Android-specific files
├── ios/                  # iOS-specific files
└── test/                 # Tests
```

## Development Guidelines

### 1. Screen Architecture
```dart
@Riverpod(keepAlive: true)
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final venues = ref.watch(venuesProvider);
    
    return Scaffold(
      appBar: AppBar(title: const Text('سالن‌ها')),
      body: venues.when(
        data: (data) => VenueList(venues: data),
        loading: () => const LoadingShimmer(),
        error: (error, _) => ErrorWidget(error),
      ),
    );
  }
}
```

### 2. API Service Pattern
```dart
class ApiService {
  final Dio _dio;

  ApiService(this._dio);

  Future<List<Venue>> fetchVenues({
    required int page,
    required int limit,
  }) async {
    try {
      final response = await _dio.get(
        '/api/v1/venues',
        queryParameters: {'page': page, 'limit': limit},
      );
      return (response.data as List)
          .map((json) => Venue.fromJson(json))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
```

### 3. Offline Support with Hive
```dart
@HiveType(typeId: 0)
class Venue extends HiveObject {
  @HiveField(0)
  String id;
  
  @HiveField(1)
  String name;
  
  @HiveField(2)
  String? imageUrl;
  
  // ... other fields
  
  Venue({
    required this.id,
    required this.name,
    this.imageUrl,
  });
}

// Usage
final box = await Hive.openBox<Venue>('venues');
await box.put(venue.id, venue);
final cachedVenue = box.get(venueId);
```

### 4. Push Notifications
```dart
class NotificationService {
  final FirebaseMessaging _messaging;

  Future<void> initialize() async {
    await _messaging.requestPermission();
    
    final token = await _messaging.getToken();
    print('FCM Token: $token');
    
    FirebaseMessaging.onMessage.listen((message) {
      // Handle foreground notification
    });
    
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  }
}
```

### 5. Responsive Design
```dart
class ResponsiveLayout extends StatelessWidget {
  final Widget mobile;
  final Widget tablet;
  final Widget desktop;

  const ResponsiveLayout({
    super.key,
    required this.mobile,
    required this.tablet,
    required this.desktop,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth < 600) {
          return mobile;
        } else if (constraints.maxWidth < 1200) {
          return tablet;
        } else {
          return desktop;
        }
      },
    );
  }
}
```

### 6. Persian Calendar Support
```dart
import 'package:persian_datetime_picker/persian_datetime_picker.dart';

// Use PersianDatePicker for date selection
showPersianDatePicker(
  context: context,
  initialDate: Jalali.now(),
  firstDate: Jalali(1400, 1),
  lastDate: Jalali(1410, 12),
).then((date) {
  if (date != null) {
    setState(() => selectedDate = date);
  }
});
```

## Performance Optimization

### Image Caching
```dart
import 'package:cached_network_image/cached_network_image.dart';

CachedNetworkImage(
  imageUrl: venue.imageUrl,
  placeholder: (context, url) => const ShimmerEffect(),
  errorWidget: (context, url, error) => const Icon(Icons.error),
  fit: BoxFit.cover,
)
```

### Lazy Loading
```dart
ListView.builder(
  itemCount: venues.length,
  itemBuilder: (context, index) {
    return VenueCard(venue: venues[index]);
  },
)
```

### Code Splitting
```dart
// Use deferred imports for heavy screens
final screen = await deferredImport.loadLibrary();
Navigator.push(
  context,
  MaterialPageRoute(builder: (_) => screen.HeavyScreen()),
);
```

## Testing Strategy

### Unit Tests
```dart
test('fetches venues successfully', () async {
  final mockClient = MockDio();
  when(mockClient.get(any)).thenAnswer((_) async => Response(
    requestOptions: RequestOptions(path: ''),
    data: [mockVenueJson],
  ));
  
  final service = ApiService(mockClient);
  final venues = await service.fetchVenues(page: 1, limit: 10);
  
  expect(venues.length, 1);
  expect(venues.first.name, 'Test Venue');
});
```

### Widget Tests
```dart
testWidgets('displays venue name', (tester) async {
  await tester.pumpWidget(
    ProviderScope(
      child: MaterialApp(
        home: VenueCard(venue: mockVenue),
      ),
    ),
  );
  
  expect(find.text(mockVenue.name), findsOneWidget);
});
```

### Integration Tests
```dart
testWidgets('complete booking flow', (tester) async {
  // Login → Search → Select venue → Book → Pay
  await tester.pumpWidget(TestApp());
  
  await tester.tap(find.text('ورود'));
  await tester.pumpAndSettle();
  
  // ... continue flow
});
```

## Build Configuration

### Android Signing
```gradle
// android/app/build.gradle
signingConfigs {
    release {
        storeFile file(System.getenv("KEYSTORE_PATH") ?: "keystore.jks")
        storePassword System.getenv("KEYSTORE_PASSWORD")
        keyAlias System.getenv("KEY_ALIAS")
        keyPassword System.getenv("KEY_PASSWORD")
    }
}
```

### iOS Configuration
```xml
<!-- ios/Runner/Info.plist -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>برای نمایش سالن‌های نزدیک به شما نیاز به دسترسی به موقعیت مکانی داریم</string>
```

## Code Review Checklist
- [ ] All providers properly disposed
- [ ] Error handling for API calls
- [ ] Loading states for async operations
- [ ] Offline support where appropriate
- [ ] RTL layout support
- [ ] Persian text throughout
- [ ] Responsive on different screen sizes
- [ ] No hardcoded strings (use localization)
- [ ] Proper image caching
- [ ] Battery-efficient location usage

## Common Tasks

### Adding New Screen
1. Create widget in `lib/screens/[category]/`
2. Add route in `go_router` configuration
3. Create provider if needed
4. Add API service method
5. Write tests
6. Update navigation if needed

### Implementing Offline Support
1. Define Hive model with annotations
2. Generate Hive adapters
3. Add cache layer in service
4. Implement sync logic
5. Handle conflicts gracefully

### Platform-Specific Features
1. Check platform with `Platform.isAndroid` / `Platform.isIOS`
2. Use method channels for native code
3. Test on both platforms
4. Document platform limitations

## Phase-Specific Priorities

### Phase 0 (Critical Fixes)
- Fix build configuration issues
- Ensure proper environment variable usage
- Resolve any compilation errors
- Set up proper signing for releases

### Phase 1 (Core Completion)
- Implement split payment UI
- Build notification center
- Create waitlist management screens
- Add offline support for critical flows

See `docs/tasks/android-tasks.md` for detailed task list.
