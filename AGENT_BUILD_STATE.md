# Android Build Recovery State

Status: COMPLETE. Tag run **37191904535** (`c0e75bb`) built all four platforms, verified every
binary and published `v1.0.0` with **ten** downloadable assets (`draft=false`), each confirmed by an
anonymous `HEAD 200`.

## Current stage

| Job | Runner | Verify annotation |
| --- | --- | --- |
| `build-apk` | ubuntu-24.04 | `verified universal 67305502B + arm64 24787212B + armv7 20700356B + x86_64 27442278B + aab 60030081B, C=US, O=Android, CN=Android Debug` |
| `build-windows` | windows-latest | `verified nsis 4960779B + msi 6656000B` |
| `build-linux` | ubuntu-24.04 | `verified deb 8167076B + appimage 83401208B` |
| `build-ios` | macos-latest | `verified ios device com.salon.futsal.futsalBookingFlutter v1.0.0, arm64, 36556KB` + `packaged out/Salon-1.0.0-ios-device-unsigned.app.zip 14026982B` |
| `release` | ubuntu-24.04 | `release for v1.0.0 exists (id=402746338) -> deleting it (tag kept) before recreating` + `published v1.0.0 with 10 assets (draft=false)` |

The three blockers that had kept the desktop and iOS jobs red are recorded as Experiment #19: the
committed lockfile did not match `package.json`, every dependency tarball in it pointed at a local
Iranian npm mirror, `flutter build ios --release --simulator` is refused by Flutter, the iOS verify
read `build/ios/iphone/` instead of `build/ios/iphoneos/`, and the desktop verifies grepped for a
cargo line whose wording has since changed.

### Android publish history

`.github/workflows/flutter-build.yml` builds, verifies, uploads and **publishes** the Android
release artifacts. Run **37164317457** (tag `v1.0.0` @ `9f41144`) completed **success** with
every step green:

| Step | Outcome |
| --- | --- |
| Install Android SDK components | success |
| Analyze project / Run tests | success |
| Build universal release APK | success |
| Build per-ABI release APKs | success |
| Build release AAB | success |
| Verify artifacts | success — notice: `verified universal 67305502B + arm64 24787212B + armv7 20700356B + x86_64 27442278B + aab 60030085B, C=US, O=Android, CN=Android Debug` |
| Upload artifacts | success (`android-release-9f41144…`, 127,828,880 bytes) |
| Publish GitHub Release | success — notices: `release for v1.0.0 already exists -> deleting it (tag kept) before recreating`, `published v1.0.0 with 5 assets (draft=false)` |

The parallel `master` run **37164312827** on the same commit is green with publish `skipped`,
which is the intended shape: pushes validate the build, tags publish it. Earlier runs in this
sequence are the record of what it took — a zero-asset release (#13), a release stranded as a
draft (#15), and a publish step that failed without saying how (#16).

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

None. Locally the release APK, the three per-ABI APKs and the AAB are built and verified; in CI
both a `master` push and a `v*` tag run green, and the tag run publishes five downloadable
binaries.

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
- GitHub Release `v1.0.0` (id 402946063, built by tag run 37191904535) is published with all ten
  binaries attached: universal 67,305,502 B, arm64-v8a 24,787,212 B, armeabi-v7a 20,700,356 B,
  x86_64 27,442,278 B, `app-release.aab` 60,030,081 B, `Salon_1.1.0_x64-setup.exe` 4,960,779 B,
  `Salon_1.1.0_x64_en-US.msi` 6,656,000 B, `Salon_1.1.0_amd64.deb` 8,167,076 B,
  `Salon_1.1.0_amd64.AppImage` 83,401,208 B, `Salon-1.0.0-ios-device-unsigned.app.zip` 14,026,982 B;
  all `state=uploaded` under
  `https://github.com/mrabolfazl13/salon-app/releases/download/v1.0.0/…`. Each of those URLs
  answers `HEAD 200` with the matching `Content-Length`, checked **without a token**, so the
  proof is what an anonymous visitor gets rather than what the API lets the owner see.
  `GET /releases` anonymously lists exactly one release, `draft=false`.
  Earlier releases of the same tag (ids 402715649, 402738733, 402746338) were superseded by each
  publish run; the first of them had been built by CI but left as a **draft** by a tag deletion —
  see Experiment #15.
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
| 17 | Draft-aware publish branch + `draft=false` gate | APPLIED — release `v1.0.0` published with five downloadable assets |
| 18 | Re-run on tag `v1.0.0` @ `d1f160f` (run 37160580288) | FAILED at step 16 — `gh release edit --draft=false` aborted the step and the reason was unreadable from this machine (Experiment #16) |
| 19 | Publish = delete + single `gh release create`, every `gh` call wrapped so it self-reports | **CONFIRMED** by tag run 37162675207 — steps 1-16 green, `draft=false`, five assets |
| 20 | Anonymous read-back of the published release (`GET /releases`, `HEAD` on each asset URL) | SUCCESS — one release listed, 4 APKs at `application/vnd.android.package-archive` with the exact byte counts, AAB 60,030,090 |
| 21 | `apksigner` output reached the annotation through a `tee` pipe, so its exit status was discarded and a missing certificate printed `signer unknown` | **CONFIRMED FIXED** — redirect + `grep -q "certificate DN:"`; run 37164317457 names `C=US, O=Android, CN=Android Debug` |

| 22 | Four-platform release: Windows/Linux (Tauri) + iOS (Flutter) jobs | **CONFIRMED** on push run 37179422867 — all four build jobs green with measured verify annotations |
| 23 | `release-files/` is nested (`flutter-apk/`, `nsis/`, `deb/`, …), not flat, so the publish step's `-maxdepth 1`/`-s $DIR/file` assertions could never match the desktop binaries | APPLIED — every search is now recursive and the step asserts exactly 10 binaries before calling `gh`; dry-run over the real layout passes 8 scenarios |
| 24 | The `release` job has no checkout, so `gh release delete/create` resolved the repository through git and died with `failed to run git: fatal: not a git repository` (tag runs 37185433089 and 37188849259 built all four platforms and published nothing) | **CONFIRMED FIXED** — `GH_REPO: ${{ github.repository }}` on the release job's `gh` steps; tag run 37191904535 published ten assets and the `gh` stub reproduces the old failure when `GH_REPO` is absent |

## Current strategy

One workflow, five jobs: `build-apk`, `build-windows`, `build-linux`, `build-ios` all run on every
push and every `v*` tag, and `release` (which needs all four) publishes only on a tag. A push is
therefore a full build validation with publish skipped, and a tag is the same four builds plus the
release.

Nothing is trusted from a bundler's exit code. Each job's `Verify artifacts` step measures the
built files — `aapt2`/`apksigner` for Android, file size plus `dpkg-deb -f` for the desktop formats,
`plutil` + `file` + `lipo -archs` for the iOS bundle — and re-reads cargo's release-profile line so
a debug bundle cannot pass a filename check. Every assertion prints the value it measured, because
a step that exits 1 silently is not diagnosable from this machine, where Actions log bodies are
unreachable but artifacts and annotations are.

`Publish GitHub Release` deletes and recreates the release in one `gh release create --verify-tag`,
insists on exactly ten binaries across the four platform groups before uploading, then reads the
release back through raw REST and fails unless `draft=false` with at least ten assets. Any step
whose assertion travels through a pipe runs under `set -o pipefail`, since `cmd | tee log` exits
with *tee's* status.

## Remaining blockers

- None for producing or publishing the artifacts on Android, Windows, Linux or iOS.
- The iOS device bundle is unsigned: publishing it installable needs an Apple Developer
  certificate and profile, which is a signing decision rather than a build failure.
- No Play-store-grade upload keystore exists; release artifacts are debug-signed until
  `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD` secrets are added.
- Launcher label is still the template `futsal_booking_flutter` rather than the Persian
  app name — product polish, deliberately out of build scope.

## Next action

None for the pipeline: tag `v1.0.0` at `c0e75bb` rebuilt all four platforms and published the
release with ten assets, read back anonymously. The remaining work is outside the build — an Apple
Developer identity for the iOS bundle and a Play-grade keystore in the repository secrets listed
above; each is a signing decision, and the workflow already consumes them when present.
