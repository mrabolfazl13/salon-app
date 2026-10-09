# GitHub Actions CI/CD Setup

## Overview

This project uses a comprehensive GitHub Actions workflow that builds **all platforms** from three frameworks:

### 📱 Flutter Mobile
- ✅ Android Debug APK (on every push)
- ✅ Android Release APK + AAB (on tags only, signed)
- ✅ iOS IPA (unsigned for distribution)

### 💻 Tauri Desktop
- ✅ Windows MSI + NSIS installer
- ✅ Linux DEB + AppImage
- ✅ macOS DMG

### 🌐 React Web
- ✅ Production build with type checking
- ✅ Optimized bundle output

## Workflow Triggers

The workflow runs on:
- **Push to master**: Builds debug versions and web
- **Git tags (v*)**: Builds all release versions and creates GitHub Release

## Required Secrets

For **signed Android builds**, add these secrets in GitHub Settings → Secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `KEYSTORE_BASE64` | Base64-encoded JKS keystore file | Generate with: `base64 -i release-keystore.jks` |
| `KEYSTORE_PASSWORD` | Keystore password | `your_keystore_password` |
| `KEY_PASSWORD` | Key alias password | `your_key_password` |
| `KEY_ALIAS` | Key alias name | `my-key-alias` |

### How to Generate Keystore Base64

```bash
# On macOS/Linux
base64 -i android_flutter/release-keystore.jks | pbcopy  # macOS
base64 -i android_flutter/release-keystore.jks | xclip   # Linux

# On Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("android_flutter\release-keystore.jks")) | Set-Clipboard
```

## Build Outputs

### Artifacts (available for 90 days)

After each run, you can download:

#### Flutter
- `flutter-android-debug.apk` - Debug APK for testing
- `flutter-android-release.apk` - Signed release APK
- `flutter-android-release.aab` - Google Play Store bundle
- `flutter-ios.ipa` - iOS app package

#### Tauri
- `tauri-windows/` - Contains .msi and .exe files
- `tauri-linux/` - Contains .deb and .AppImage files
- `tauri-macos/` - Contains .dmg file

#### React
- `react-web-dist/` - Production-ready static files

### GitHub Release (on tags only)

When you create a tag like `v1.2.0`, the workflow will:
1. Build all platforms
2. Create a GitHub Release with changelog from CHANGELOG.md
3. Attach all binaries as release assets

## Local Testing

You can test the workflow locally using [act](https://github.com/nektos/act):

```bash
# Test specific job
act -j flutter-android-debug

# Test release creation (simulate tag)
act -j create-release --env GITHUB_REF=refs/tags/v1.2.0
```

## Build Matrix Summary

| Platform | Framework | Runner | Trigger | Output |
|----------|-----------|--------|---------|--------|
| Android Debug | Flutter | ubuntu-latest | Push | APK |
| Android Release | Flutter | ubuntu-latest | Tag | APK + AAB (signed) |
| iOS | Flutter | macos-latest | Tag | IPA |
| Android | Tauri | ubuntu-latest | Push + Tag | APK + AAB (signed) |
| iOS | Tauri | macos-latest | Push + Tag | IPA (unsigned) |
| Windows | Tauri | windows-latest | Push | MSI + EXE |
| Linux | Tauri | ubuntu-latest | Push | DEB + AppImage |
| macOS | Tauri | macos-latest | Push | DMG |
| Web | React | ubuntu-latest | Push | Static files |

## Optimization Features

- **Caching**: Rust dependencies cached across runs
- **Parallel builds**: All platforms build simultaneously
- **Conditional execution**: Release builds only on tags
- **Dependency management**: pnpm for faster installs
- **Artifact retention**: 90-day default for downloads

## Troubleshooting

### Flutter build fails
- Check `pubspec.yaml` syntax
- Ensure all dependencies are available
- Verify Flutter version compatibility

### Tauri build fails
- Install Rust toolchain: `rustup install stable`
- Check system dependencies (Linux): libwebkit2gtk, etc.
- Verify Node.js version >= 18

### Signing fails
- Verify keystore base64 encoding
- Check passwords match keystore setup
- Ensure key.properties format is correct

### Release not created
- Tag must match pattern: `v*` (e.g., v1.2.0)
- All build jobs must succeed
- GITHUB_TOKEN must have write permissions

## Next Steps

1. Add repository secrets for Android signing
2. Create a test tag: `git tag v1.2.1 && git push origin v1.2.1`
3. Monitor Actions tab for build progress
4. Download artifacts or check GitHub Releases

---

**Note:** This workflow replaces the old separate workflows. The old files (`flutter-build.yml`, `test-build.yml`) can be archived or removed.
