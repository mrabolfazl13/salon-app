# Salon Futsal Booking System - Flutter Android

Native Android implementation of the Salon Futsal Booking System, providing 1:1 feature parity with the existing Tauri desktop application.

## Overview

This is a production-quality Flutter application that replicates the Tauri-based web application for Android devices. The app provides venue booking, competition management, team coordination, and financial tracking for futsal facilities.

## Tech Stack

- **Framework**: Flutter 3.x (Dart)
- **State Management**: Riverpod
- **Navigation**: go_router
- **HTTP Client**: Dio with interceptors
- **Local Storage**: SharedPreferences, Hive
- **UI Components**: Material Design 3 with custom theming
- **Fonts**: Vazirmatn (Persian/Arabic support)
- **RTL**: Full right-to-left layout support

## Project Structure

```
lib/
├── app/                    # App-level configuration
│   ├── router/            # Navigation routes (go_router)
│   ├── theme/             # Design system (colors, typography, themes)
│   └── config/            # App configuration
│
├── core/                   # Core infrastructure
│   ├── network/           # API client (Dio)
│   ├── storage/           # Local storage utilities
│   ├── errors/            # Error handling
│   ├── utils/             # Utility functions
│   ├── extensions/        # Dart extensions
│   └── widgets/           # Shared reusable widgets
│
└── features/              # Feature modules
    ├── auth/              # Authentication (login, register)
    ├── home/              # Home screen
    ├── search/            # Search functionality
    ├── favorites/         # Favorite venues
    ├── venues/            # Venue listing and details
    ├── bookings/          # Booking management
    ├── profile/           # User profile
    ├── dashboard/         # User dashboard
    ├── competitions/      # Competitions
    ├── games/             # Game management
    ├── contracts/         # Contract management
    ├── teams/             # Team management
    ├── deals/             # Special offers
    ├── quiz/              # Quiz feature
    ├── manager/           # Manager-specific features
    └── admin/             # Admin-specific features
```

## Getting Started

### Prerequisites

- Flutter SDK >= 3.13.2
- Android Studio or VS Code with Flutter extension
- Android SDK (for building APK/AAB)
- JDK 17 or higher

### Installation

1. Clone the repository
2. Navigate to the Flutter project:
   ```bash
   cd android_flutter
   ```

3. Install dependencies:
   ```bash
   flutter pub get
   ```

4. Run the app:
   ```bash
   flutter run
   ```

### Building for Release

#### Debug APK
```bash
flutter build apk --debug
```

#### Release APK
```bash
flutter build apk --release
```

#### Split APKs per ABI
```bash
flutter build apk --split-per-abi
```

#### Android App Bundle (AAB)
```bash
flutter build appbundle --release
```

The built files will be in `build/app/outputs/`.

## Configuration

### API URL

Set the API base URL via environment variable during build:

```bash
flutter run --dart-define=API_URL=https://api.yourserver.com/api/v1
```

Or modify the default in `lib/core/network/api_client.dart`.

### Theme

The app supports light and dark themes, automatically switching based on system settings. Themes are defined in `lib/app/theme/app_theme.dart`.

## Features

### Implemented ✅

- [x] App architecture and routing
- [x] Design system (colors, typography, spacing)
- [x] Light and dark themes
- [x] RTL support for Persian language
- [x] Login screen UI
- [x] Reusable components (buttons, text fields)
- [x] Network layer with authentication

### In Progress 🔄

- [ ] Authentication flow integration
- [ ] Protected route guards
- [ ] Venue listing with API

### Planned 📋

- [ ] All user-facing screens (36 total)
- [ ] Manager dashboard
- [ ] Admin panel
- [ ] Offline support
- [ ] Push notifications
- [ ] Image upload
- [ ] Payment integration

See `../docs/flutter-parity/current-state.md` for detailed status.

## Testing

### Run all tests
```bash
flutter test
```

### Run with coverage
```bash
flutter test --coverage
```

### Integration tests
```bash
flutter test integration_test/
```

## Code Quality

### Analyze code
```bash
flutter analyze
```

### Format code
```bash
dart format .
```

## Documentation

- [Screen Inventory](../docs/flutter-parity/screen-inventory.md)
- [Navigation Map](../docs/flutter-parity/navigation-map.md)
- [Current State](../docs/flutter-parity/current-state.md)
- [Parity Matrix](../docs/flutter-parity/parity-matrix.md)

## Design System

The app uses a comprehensive design system extracted from the Tauri application:

- **Colors**: Brand colors (amber, blue, navy), semantic colors (success, error, warning)
- **Typography**: Vazirmatn font family with weights 100-900
- **Spacing**: Consistent spacing scale (4, 8, 16, 24, 32, 48, 64)
- **Radius**: Card (20), Button (14), Chip (10), Image (16)
- **Shadows**: Custom shadows for cards, buttons, navigation

See `lib/app/theme/` for implementation details.

## Contributing

This is a production application. Follow these guidelines:

1. Maintain design system consistency
2. Write tests for new features
3. Follow Flutter best practices
4. Ensure RTL compatibility
5. Test on both light and dark themes

## License

Private - Salon Futsal Booking System

---

**Version**: 1.1.0  
**Build**: 2  
**Last Updated**: 2026-10-06
# CI/CD Test
