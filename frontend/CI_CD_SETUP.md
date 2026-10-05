# CI/CD Setup - Flutter Android Builds

## Overview

This project uses GitHub Actions for automated Flutter Android builds. Every push to the `master` branch that modifies files in the `android_flutter/` directory will automatically trigger a build.

## Workflow Configuration

**File**: `.github/workflows/flutter-build.yml`

### Trigger Conditions
- Push to `master` branch
- Changes in `android_flutter/**` path

### Build Jobs

1. **build-apk** - Debug APK build
   - Runs flutter analyze
   - Builds debug APK
   - Uploads artifact for 30 days

2. **build-release** - Release APK and AAB build
   - Builds release APK (unsigned)
   - Builds release AAB (unsigned)
   - Uploads both artifacts for 30 days

3. **build-summary** - Generate build summary
   - Creates a summary of all build artifacts
   - Shows download links

### Artifacts Generated

After successful build, you'll find:
- `salon-app-debug-apk/app-debug.apk` - Debug build for testing
- `salon-app-release-unsigned/app-release.apk` - Release build (needs signing)
- `salon-app-release-aab/app-release.aab` - Android App Bundle (needs signing)

## API Configuration

**Production API URL**: `https://salon.absadeghi.ir/api/v1`

This is configured in:
- `lib/core/network/api_client.dart` - Default API URL
- Can be overridden via `--dart-define=API_URL=<url>` during build

## Signing Configuration

For production releases, you need to set up signing keys:

### Local Development
Currently uses debug signing config for simplicity.

### Production Release
Set these environment variables or GitHub secrets:
- `KEYSTORE_PATH` - Path to keystore file
- `KEYSTORE_PASSWORD` - Keystore password
- `KEY_ALIAS` - Key alias name
- `KEY_PASSWORD` - Key password

## Application Details

- **Application ID**: `ir.absadeghi.salon`
- **App Name**: Salon Futsal
- **Flutter Version**: 3.24.0
- **Java Version**: 17
- **Android SDK**: Configured by Flutter

## Manual Build Commands

### Debug Build
```bash
cd android_flutter
flutter pub get
flutter build apk --debug
```

### Release Build
```bash
cd android_flutter
flutter pub get
flutter build apk --release
flutter build appbundle --release
```

### Custom API URL
```bash
flutter build apk --release --dart-define=API_URL=https://your-api.com/api/v1
```

## Troubleshooting

### Build Fails on GitHub Actions
1. Check the Actions tab in GitHub repository
2. Look for error messages in the workflow logs
3. Common issues:
   - Dependency resolution failures
   - Gradle version mismatches
   - Missing environment variables

### APK Not Generated
- Check if `android_flutter` path was modified in the commit
- Verify workflow file exists at `.github/workflows/flutter-build.yml`
- Ensure Flutter and Java versions are compatible

### Signing Errors
- For CI/CD, unsigned builds are generated
- To sign locally, configure signingConfigs in `android/app/build.gradle.kts`

## Next Steps for Production

1. Generate a signing key using `keytool`
2. Add keystore as GitHub secret or upload to secure storage
3. Configure GitHub Actions workflow to use production signing
4. Set up automatic deployment to Google Play Store (optional)
5. Enable ProGuard/R8 for code shrinking and obfuscation

---

**Last Updated**: 2026-10-06  
**Status**: ✅ Automated builds configured and triggered
