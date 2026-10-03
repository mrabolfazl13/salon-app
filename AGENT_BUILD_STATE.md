# Android Build Recovery State

Status: RELEASE-PUBLISHED (CI builds/verifies/uploads green; `v1.0.0` live with five assets)

## Current stage

`.github/workflows/flutter-build.yml` builds, verifies, uploads and **publishes** the
Android release artifacts. Run **37157491455** on commit `1ce87b5` completed **success** —
every step green, including the ones that failed in the previous 13 runs:

| Step | Outcome |
| --- | --- |
| Install Android SDK components | success |
| Analyze project | success |
| Run tests | success |
| Build universal release APK | success |
| Build per-ABI release APKs | success |
| Build release AAB | success |
| Verify artifacts | success |
| Upload artifacts | success (`android-release-1ce87b5…`, 127,828,905 bytes) |

Then the Release itself was found to be empty (Experiment #13) and fixed in `30937ce`;
runs **37158884915** (master) and **37158902775** (tag `v1.0.0`) are in flight to prove the
fix publishes five real assets.

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
- Per-ABI APKs built locally and verified: arm64-v8a 24,787,404 B `versionCode 2001`,
  armeabi-v7a 20,716,932 B `versionCode 1001`, x86_64 27,458,854 B `versionCode 4001`; each
  declares exactly one `native-code:` ABI, `versionName 1.0.0`, `targetSdk 36`, and all three
  verify with `apksigner`.
- AAB built locally: `build/app/outputs/bundle/release/app-release.aab`, 60,073,220 bytes;
  contains `base/manifest/AndroidManifest.xml`, `base/dex/classes.dex`, 18 `.so` across all
  three ABIs, and `BUNDLE-METADATA` — i.e. a real bundle, not an intermediate artifact.
- CI: run 37157491455 (master) and 37158902775 (tag `v1.0.0` @ `30937ce`) both fully green —
  SDK install, analyze, test, three builds, verify, upload, publish. The tag run's artifact
  `android-release-30937ce…` is 127,828,910 bytes. `GET /actions/runs/{id}/jobs` step
  conclusions are the readable channel from this machine (log bodies 302 to a blocked host).
- GitHub Release `v1.0.0` (id 402715649) is published with all five binaries attached:
  universal 67,305,502 B, arm64-v8a 24,787,212 B, armeabi-v7a 20,700,356 B,
  x86_64 27,442,278 B, `app-release.aab` 60,030,083 B, all `state=uploaded` under
  `https://github.com/mrabolfazl13/salon-app/releases/download/v1.0.0/…`.
  It had been built by CI but left as a **draft** by the tag deletion; see Experiment #15.
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
| 8 | Move 8 GB host's Gradle memory caps out of the repo | FAILED first (caps written to `C:\Users\Alex\.gradle`, which Gradle ignores — `GRADLE_USER_HOME` is `G:\gradle-home`), then fixed; daemon `-Xmx8G` crashed with `hs_err_pid*.log` |
| 9 | Install platform 36 / build-tools 36.0.0 / NDK 27.0.12077973 in CI | SUCCESS — CI step green |
| 10 | Stub SharedPreferences in the widget test | SUCCESS — `flutter test` green |
| 11 | Declare `INTERNET` in the main manifest | APPLIED — was only inherited from a library |
| 12 | Write caps to the real `GRADLE_USER_HOME` | SUCCESS — split APKs + AAB built locally with the committed `-Xmx8G` repo setting |
| 13 | Publish release with the artifact paths as positional args | APPLIED — first green run published a zero-asset release |
| 14 | Verify each per-ABI APK and the AAB, not just the universal one | APPLIED |
| 15 | Master CI run 37157491455 after all fixes | **SUCCESS** — all build, verify and upload steps green |
| 16 | Tag run 37158902775 publish step | FALSE SUCCESS — five assets uploaded onto a draft release, so `/releases` stayed empty |
| 17 | Draft-aware publish branch + `draft=false` gate | APPLIED — release `v1.0.0` now published with five downloadable assets |

## Current strategy

The pipeline is green end to end and the release is public. Remaining work is proof of
reproducibility: push the publish-step fix to `master` and re-trigger the tag workflow on
`v1.0.0` (`POST /actions/workflows/{file}/dispatches` with `ref=v1.0.0`, which keeps
`github.ref` a tag ref and therefore still runs the publish step). That rebuilds every
binary from a clean runner and takes the "published release already exists" branch, so the
release must end the run published with five fresh assets. A red run files its own
`ci-build-failure` issue carrying the log tails, and the verify/publish steps emit
`::notice::` annotations, which is how CI evidence is read from this machine.

## Remaining blockers

- None for producing the artifacts. The publish step's new draft gate has not yet been
  exercised by a real CI run (only by a stubbed-`gh` dry run covering all four release
  states).
- No Play-store-grade upload keystore exists; release artifacts are debug-signed until
  `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD` secrets are added.
- Launcher label is still the template `futsal_booking_flutter` rather than the Persian
  app name — product polish, deliberately out of build scope.

## Next action

Push `master`, dispatch the workflow on `v1.0.0`, then confirm from the check-run
annotations and `GET /releases/tags/v1.0.0` that the run rebuilt, re-published and left
five assets attached.
