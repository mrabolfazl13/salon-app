# Android Build Recovery State

Status: CI-VALIDATION-RUNNING (local release APK verified; CI run pending)

## Current stage

GitHub Actions must build and publish the Android release artifacts.

## Toolchain (verified on this machine)

| Component | Value | Source of truth |
| --- | --- | --- |
| Flutter | 3.47.2 stable | `C:\flutter-sdk\flutter` |
| Dart | 3.13.2 | `pubspec.yaml` `environment.sdk` |
| JDK | Temurin 17 | `android/app/build.gradle.kts` `VERSION_17` |
| Gradle | 9.3.1 (wrapper) | `android/gradle/wrapper/gradle-wrapper.properties` |
| AGP | 8.12.0 (root + forced for all plugins) | `android/settings.gradle.kts`, `android/build.gradle.kts` |
| Kotlin | 2.2.20 (root + forced) | same |
| compileSdk / targetSdk | 36 | `android/app/build.gradle.kts` |
| build-tools | 36.0.0 (installed manually from Tencent SDK mirror) | `G:\SDK\build-tools\36.0.0` |
| NDK | 27.0.12077973 (pinned to locally installed version) | `android/app/build.gradle.kts` |
| minSdk / ABIs | 24 (Flutter default); universal APK carries arm64-v8a + armeabi-v7a + x86_64 | `gradle_utils.dart` `minSdkVersionInt = 24`, verified with `aapt2 dump badging` |

## Current failing stage

None locally. Locally the release APK is produced and verified. CI has not been
re-run since the AGP/Kotlin/AndroidX fixes landed.

## Root cause (final)

Four independent blockers, each of which alone failed the build:

1. **Maven/Google blocked from Iran.** `dl.google.com` answers `404` for every Maven
   path, so `com.android.tools.build:gradle` and all AndroidX artifacts were
   unresolvable on this machine. `repo.huaweicloud.com/repository/maven/`,
   `maven.aliyun.com/repository/google` and `.../public` do carry them. Iranian
   mirrors (myket, devneeds) do **not** carry AGP at all.
   Android SDK components come from `mirrors.cloud.tencent.com/AndroidSDK/`.
   `services.gradle.org` is reachable, so only the SDK/Maven layer needed mirrors.
   Repositories are ordered `google()` → `mavenCentral()` → mirrors, so CI (unblocked)
   still resolves from the official repos and mirrors only act as local fallback.
2. **Plugin buildscripts pin ancient, mutually incompatible AGP/Kotlin.** Each pub
   plugin declares its own `buildscript { classpath 'com.android.tools.build:gradle:X' }`
   (7.3.1 … 8.13.1) and some pin KGP 1.7.22. Flutter 3.47's own template uses
   AGP 9.1.0 / Kotlin 2.4.0, and AGP 9 only reads the new DSL, so every legacy plugin
   failed to apply. Fixed by forcing one pair (AGP 8.12.0 + Kotlin 2.2.20 — inside
   Flutter's documented compatibility window for Gradle 9.3.1) on every project's
   buildscript.
3. **`android.useAndroidX` was missing** from `android/gradle.properties`, so
   `:app:mergeReleaseNativeLibs` refused the AndroidX-heavy classpath.
4. **`flutter_local_notifications ^16.3.0`** does not compile against API 35+
   (`bigPictureStyle.bigLargeIcon(null)` is ambiguous) and is not referenced anywhere
   in `lib/`, so the dependency was removed rather than patched.

## Evidence

- Local release build output: `build/app/outputs/flutter-apk/app-release.apk`,
  67,338,458 bytes.
- `aapt2 dump badging` →
  `package: name='com.salon.futsal.futsal_booking_flutter' versionCode='1' versionName='1.0.0'`
  `compileSdkVersion='36'`, `targetSdkVersion:'36'`, `native-code: 'arm64-v8a' 'armeabi-v7a' 'x86_64'`.
- `apksigner verify --print-certs` → exit 0, signer `CN=Android Debug`
  (release variant signed with the debug keystore — see Known limitations).
- `flutter analyze` → `No issues found! (ran in 1202.3s)`.
- `flutter test` → `All tests passed!` (after the SharedPreferences stub fix).
- Mirror availability probed with HTTP status: AGP 8.12.0 plugin marker and
  Kotlin 2.2.20 both `200` on Huawei and Aliyun.
- `aapt2 dump badging` on the built APK also listed `android.permission.INTERNET`,
  inherited from a library manifest — now declared explicitly in the app manifest.

## Attempts (full history in BUILD_EXPERIMENTS.md)

| # | Change | Result |
| --- | --- | --- |
| 1 | Iranian mirrors (myket/devneeds) | FAILED — do not host AGP |
| 2 | AGP 9.1.0 + Chinese mirrors | FAILED — legacy plugins cannot apply AGP 9 DSL |
| 3 | AGP 8.12.0 + Kotlin 2.2.0 forced everywhere | FAILED — Flutter requires Kotlin ≥ 2.2.20 |
| 4 | Kotlin 2.2.20 | FAILED — `android.useAndroidX` missing |
| 5 | `useAndroidX=true`, keep `flutter_local_notifications` | FAILED — plugin Java does not compile on API 35+ |
| 6 | Drop unused `flutter_local_notifications` | SUCCESS (universal release APK verified) |
| 7 | Untrack `.gradle`/`.dart_tool`, ignore tool state | SUCCESS |
| 8 | Move 8 GB host's Gradle memory caps out of the repo | SUCCESS — template `org.gradle.jvmargs` committed, caps live in `~/.gradle/gradle.properties` |
| 9 | Install platform 36 / build-tools 36.0.0 / NDK 27.0.12077973 in CI | APPLIED — makes CI match the pinned `ndkVersion`/`compileSdk` instead of hoping the runner has them |
| 10 | Stub SharedPreferences in the widget test | SUCCESS — `flutter test` green |
| 11 | Declare `INTERNET` in the main manifest | APPLIED — was only inherited from a library |

## Current strategy

Push `master`, tag `v1.0.0`, then read the outcome through the commit check runs. A
red run files its own `ci-build-failure` issue carrying the log tails, which is the
only way to see CI diagnostics from this machine. Locally the split-per-ABI APKs and
the AAB are building right now with the committed configuration, so a CI-only failure
can be told apart from a real configuration failure.

## Remaining blockers

- CI run for the new workflow not yet observed (13 previous runs all failed before
  these fixes landed).
- No Play-store-grade upload keystore exists; release artifacts are debug-signed until
  `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD` secrets are added.
- AAB has never been built (CI step is new, local build in flight).
- Launcher label is still the template `futsal_booking_flutter` rather than the Persian
  app name — product polish, deliberately out of build scope.

## Next action

Push `master` + tag `v1.0.0`, poll `GET /repos/mrabolfazl13/salon-app/commits/{sha}/check-runs`,
and iterate on any CI-only failure until the artifact upload and verification steps are green.
