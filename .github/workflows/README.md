# GitHub Actions CI/CD Setup

## Overview

The product ships from **one shared React core** (`frontend/`) and builds **three paths only**:

### 🌐 Web (React + Vite)
- ✅ Type check + production build (on every push/PR)

### 🤖 Tauri Android
- ✅ APK + AAB (on every push/PR; signed when `KEYSTORE_BASE64` secrets exist)

### 💻 Tauri Windows
- ✅ MSI + NSIS installer (on every push/PR)

**Flutter is fully removed** from the product, tests and CI. The Android app is Tauri
Android (`frontend/src-tauri`), not Flutter.

## Workflow Files

| File | Purpose |
|------|---------|
| `build-all-platforms.yml` | Builds Web, Tauri Android, Tauri Windows; creates GitHub Releases on `v*` tags |
| `web-tests.yml` | Frontend lint, type check, unit tests (vitest), build + bundle budget |
| `backend-tests.yml` | Backend pytest suite with PostgreSQL + Redis services |
| `quality-gates.yml` | Cross-cutting gates: backend tests, frontend tests, security scan, build verify |

The old Flutter-era workflows (`android-emulator-test.yml`, `test-build.yml`) were
removed together with the Flutter code.

## Workflow Triggers

- **Push to master / PRs**: Web build, Tauri Android APK/AAB, Tauri Windows installers
- **Git tags (v\*)**: same builds + GitHub Release with all artifacts attached

## Required Secrets (Android signing)

| Secret Name | Description |
|-------------|-------------|
| `KEYSTORE_BASE64` | Base64-encoded JKS keystore file |
| `KEYSTORE_PASSWORD` | Keystore password |
| `KEY_PASSWORD` | Key password |
| `KEY_ALIAS` | Key alias name |

Without these secrets the Tauri Android job builds **unsigned** artifacts and prints a
warning instead of failing.

### How to Generate Keystore Base64

```bash
# On macOS/Linux
base64 -i release-keystore.jks | pbcopy  # macOS
base64 -i release-keystore.jks | xclip   # Linux

# On Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("release-keystore.jks")) | Set-Clipboard
```

## Build Outputs

### Artifacts (available for 90 days)

- `tauri-android.apk` - Tauri Android APKs (universal + per-ABI)
- `tauri-android.aab` - Tauri Android App Bundle (Play Store)
- `tauri-windows/` - Contains .msi and .exe installers
- `react-web-dist/` - Production-ready static files

### GitHub Release (on tags only)

When you create a tag like `v1.2.0`, the workflow will:
1. Build Web, Tauri Android and Tauri Windows
2. Require both Tauri Android **and** Tauri Windows to succeed before releasing
3. Create a GitHub Release with changelog from CHANGELOG.md
4. Attach all binaries as release assets

## Build Matrix Summary

| Platform | Framework | Runner | Trigger | Output |
|----------|-----------|--------|---------|--------|
| Android | Tauri | ubuntu-latest | Push + Tag | APK + AAB (signed when secrets exist) |
| Windows | Tauri | windows-latest | Push + Tag | MSI + EXE |
| Web | React + Vite | ubuntu-latest | Push + Tag | Static files |

## Optimization Features

- **Caching**: Rust dependencies cached across runs
- **Parallel builds**: All platforms build simultaneously
- **Dependency management**: pnpm for faster installs
- **Artifact retention**: 90-day default for downloads

## Troubleshooting

### Tauri build fails
- Install Rust toolchain: `rustup install stable`
- Verify Node.js version >= 18
- Android: make sure `NDK_HOME` resolves (CI installs NDK via ANDROID_HOME)

### Signing fails
- Verify keystore base64 encoding
- Check passwords match keystore setup
- The gradle init script in `build-all-platforms.yml` wires `key.properties` into the
  generated `gen/android` project on CI

### Release not created
- Tag must match pattern: `v*` (e.g., v1.2.0)
- Tauri Android **and** Tauri Windows jobs must both succeed
- GITHUB_TOKEN must have write permissions
