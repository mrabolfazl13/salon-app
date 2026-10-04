# Android Release Build

Authoritative guide for building the Salon Futsal app for Android release distribution, locally and
in CI, and for the Windows/Linux (Tauri) and iOS (Flutter) artifacts published alongside it.

## Final toolchain

| Component | Version | Where it is set |
|---|---|---|
| Flutter | 3.47.2 (stable) | `.github/workflows/flutter-build.yml` (`subosito/flutter-action`) |
| Dart | 3.13.2 | ships with Flutter 3.47.2 |
| JDK | Temurin 17 | `actions/setup-java`, `compileOptions`/`jvmTarget` in `android/app/build.gradle.kts` |
| Gradle | 9.3.1 | `android/gradle/wrapper/gradle-wrapper.properties` |
| Android Gradle Plugin | 8.12.0 | `android/settings.gradle.kts` + forced for every plugin project in `android/build.gradle.kts` |
| Kotlin | 2.2.20 | `android/settings.gradle.kts` + forced for every plugin project |
| compileSdk / targetSdk | 36 | `android/app/build.gradle.kts` |
| minSdk | Flutter default (24) | `flutter.minSdkVersion` |
| build-tools | 36.0.0 | resolved from compileSdk |
| NDK | 27.0.12077973 | `android/app/build.gradle.kts` (`ndkVersion`), installed explicitly in CI |
| applicationId | `com.salon.futsal.futsal_booking_flutter` | `android/app/build.gradle.kts` |

Version pairs are not arbitrary — see "Root cause" below. `flutter analyze` and the Flutter tooling
enforce a minimum Kotlin of 2.2.20, and Gradle 9.x cannot load AGP < 8.x or legacy plugin DSL.

## Local build

```bash
cd <repo root>                  # the Flutter project lives at the repository root
flutter --version               # 3.47.2
flutter pub get
flutter analyze
flutter test
flutter build apk --release                     # universal APK
flutter build apk --release --split-per-abi     # arm64-v8a, armeabi-v7a, x86_64
flutter build appbundle --release               # Play Store AAB
```

Outputs (Flutter redirects the Android build dir to `<repo>/build`):

```
build/app/outputs/flutter-apk/app-release.apk
build/app/outputs/flutter-apk/app-arm64-v8a-release.apk
build/app/outputs/flutter-apk/app-armeabi-v7a-release.apk
build/app/outputs/flutter-apk/app-x86_64-release.apk
build/app/outputs/bundle/release/app-release.aab
```

Requires `android/local.properties` with `flutter.sdk=<path>` (created automatically by any
`flutter` command) and an Android SDK providing platform 36, build-tools 36.0.0 and NDK
27.0.12077973.

`android/gradle.properties` keeps Flutter's own template daemon settings (`-Xmx8G`). A machine
with less RAM must not change that file — Gradle reads `$GRADLE_USER_HOME/gradle.properties`
before the project's for build-environment properties, so the caps belong there instead. Check
where that actually is first (`echo $GRADLE_USER_HOME`; on this machine it is `G:\gradle-home`,
*not* `C:\Users\<user>\.gradle`, and writing the caps to the latter does nothing):

```properties
# $GRADLE_USER_HOME/gradle.properties  (this machine only)
org.gradle.jvmargs=-Xmx3g -XX:MaxMetaspaceSize=768m -XX:+UseG1GC -Dfile.encoding=UTF-8
org.gradle.workers.max=2
kotlin.daemon.jvmargs=-Xmx1g
```

With the template's 8 GB heap and unlimited workers, the JVM is killed on an 8 GB host and the
build dies with `Gradle build daemon disappeared unexpectedly` plus an `hs_err_pid*.log` in
`android/`. The daemon's own log line prints `daemonOpts=... -Xmx8G ...` and
`daemonRegistryDir=...` — read it instead of guessing which properties file won.

### Network-restricted machines (Iran)

`dl.google.com` answers **404** for both Maven and SDK paths from this region, while
`services.gradle.org` works. The Gradle files therefore list the official repositories first and
public mirrors last:

```
google() -> mavenCentral() -> gradlePluginPortal()
  -> https://repo.huaweicloud.com/repository/maven/
  -> https://maven.aliyun.com/repository/google
  -> https://maven.aliyun.com/repository/public
```

Mirrors carry the same artifacts as Google Maven and Maven Central; they are only consulted when the
official repository fails, so CI (which has direct access) resolves from `google()`/`mavenCentral()`.
For the Android SDK on a restricted machine, `https://mirrors.cloud.tencent.com/AndroidSDK/` serves
the platform/build-tools/NDK zips. Pub and Flutter engine artifacts come from
`pub.flutter-io.cn` / `storage.flutter-io.cn` locally — those endpoints are **not** configured in CI,
which uses the official ones.

`flutter_local_notifications` was removed from `pubspec.yaml`: it is referenced nowhere in `lib/` or
`test/`, and its 16.x Android sources no longer compile against API 35+ (`bigLargeIcon` overload
ambiguity).

## CI

`.github/workflows/flutter-build.yml` runs on pushes and `v*` tags to `master`/`main`, on PRs
touching `pubspec.yaml`, `lib/**`, `android/**`, and manually. It is five jobs:

| Job | Runner | Produces | Artifact name |
|---|---|---|---|
| `build-apk` | `ubuntu-24.04` | universal + 3 per-ABI APKs + AAB | `android-release-<sha>` |
| `build-windows` | `windows-latest` | NSIS `-setup.exe` + `.msi` | `windows-release-<sha>` |
| `build-linux` | `ubuntu-24.04` | `.deb` + `.AppImage` | `linux-release-<sha>` |
| `build-ios` | `macos-latest` | unsigned device `Runner.app` zip | `ios-release-<sha>` |
| `release` | `ubuntu-24.04` | the GitHub Release with all 10 binaries | — |

`release` has `needs: [build-apk, build-windows, build-linux, build-ios]` and only runs on a
`v*` tag, so a tag pushes exactly one release containing every platform's output.

### Android job

1. checkout → Temurin 17 → Flutter 3.47.2
2. `sdkmanager --licenses`, then installs `platforms;android-36`, `build-tools;36.0.0`,
   `ndk;27.0.12077973` so CI matches the pinned versions in the Gradle files
3. `flutter pub get`
4. optional release signing from secrets (see below)
5. `flutter analyze`, `flutter test`
6. universal APK, split-per-ABI APKs, AAB
7. artifact verification with `aapt2 dump badging` and `apksigner` — the universal APK must
   report the expected package id and all three ABIs, `apksigner verify --print-certs` must
   both exit `0` and print a certificate `DN:` (the DN is repeated in the annotation, so the
   signature is evidence rather than an unchecked pipeline), each per-ABI APK must declare
   *exactly one* `native-code:` entry matching its filename and its own ABI-offset
   `versionCode` (2001 arm64, 1001 armeabi, 4001 x86_64); the AAB must contain
   `base/manifest/AndroidManifest.xml` and `base/dex/classes.dex`
8. `actions/upload-artifact` → `android-release-${{ github.sha }}` with the five deterministic paths
9. on failure: a `ci-build-failure` issue containing the tail of each build log, plus the raw
   logs as an artifact — `GET /actions/runs/{id}/jobs` gives per-step conclusions, which is what
   localises a failure to a step

### Desktop jobs (Tauri, `frontend/`)

`pnpm install --frozen-lockfile` then `pnpm exec tauri build --bundles …`. CI installs
**pnpm 12**: that is the major which generated `pnpm-lock.yaml` and which understands the
`allowBuilds` and `minimumReleaseAgeExclude` keys in `frontend/pnpm-workspace.yaml`, so an older
major would silently ignore them and skip the build scripts those lists govern.

`--bundles` is a comma-separated list restricted to the formats the host platform supports
(`msi,nsis` on Windows; `deb,rpm,appimage,pacman` on Linux), so each job names exactly the two
formats it wants instead of building `bundle.targets: "all"` and shipping whatever appeared.
The Linux job installs the WebKit/GTK development packages Tauri links against
(`libwebkit2gtk-4.1-dev`, `libxdo-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`,
`patchelf`); without them the Rust link step fails.

Verification is by the built files, not by the bundler's exit code: the NSIS/MSI/deb/AppImage
outputs must exist and exceed 1 MB, `dpkg-deb -f` must read a `Package`/`Version` pair out of the
`.deb`, and the build log must contain cargo's release-profile line, which current cargo writes as
``Finished `release` profile [optimized] target(s) in 10m 21s`` — the bundler also runs against a
debug profile, so a debug bundle would otherwise pass a filename check.

### iOS job (Flutter)

`flutter build ios --release --no-codesign` puts the bundle at
`build/ios/iphoneos/Runner.app`. There is no Apple Developer certificate in this repository, so it
is unsigned by design and has to be re-signed before it installs on a phone. `ios/Podfile` is not
committed — Flutter generates it from its own template during `pod install`, which
`flutter build ios` runs automatically. No simulator bundle is published: Flutter restricts
simulator builds to debug mode (`BuildInfo.supportsSimulator` is `isEmulatorBuildMode`, true only
for debug), so `flutter build ios --release --simulator` exits with *"Release mode is not supported
for simulators."* and shipping the debug app instead would put a non-release binary in the release.

The bundle is checked by reading its `Info.plist` with `plutil` (`CFBundleIdentifier` must be
`com.salon.futsal.futsalBookingFlutter`, `CFBundleShortVersionString` must be the `pubspec.yaml`
version) and the `Runner` binary must be an arm64 Mach-O per `file` and `lipo -archs`
— a simulator slice dropped in its place would match on name and size. It is zipped with its
`Runner.app/` prefix intact and re-read with `unzip -l` before upload.

### Publish gate

The `release` job downloads every `*-release-*` artifact into `release-files/`. Each artifact keeps
the uploader's directory layout — Android arrives as `flutter-apk/*.apk` and `bundle/release/*.aab`,
Windows as `nsis/` + `msi/`, Linux as `deb/` + `appimage/` — so every search in the publish step is
recursive, and all ten filenames are distinct so flattening them cannot collide. It refuses to
publish a subset: the five Android files by name, then one `find` per desktop/iOS pattern, then an
exact count of the binaries it is about to pass to `gh release create` (10), which runs with
`--verify-tag`. It deletes any release that already exists for the tag (`gh release delete --yes`
keeps the tag itself) and creates a fresh published release in one
call, so the release always carries exactly this run's binaries. It then reads the release back
through raw REST (`gh api repos/…/releases/tags/<tag>`) and fails unless `draft=false` **and**
there are at least ten assets. Two false successes this gate replaced: a green run that published
a zero-asset release, and a green run whose `gh release edit --draft=false` left a tag-deletion
*draft* in place — drafts are hidden from `GET /releases`, `/releases/latest` and
`/releases/tags/<tag>`, so the binaries were attached while the Releases page showed nothing.
Every `gh` call reports its own failure as an `::error::` annotation.

Any step that pipes a build command into `tee` runs under `set -o pipefail`: `cmd | tee log` exits
with *tee's* status, which would turn a failing build into a green step.

## Signing

Without secrets the release variant is signed with the **debug** keystore
(`android/app/build.gradle.kts` keeps `signingConfig = signingConfigs.getByName("debug")`). The APK
is a genuine release-variant build (AOT Dart, `flutter build apk --release` task graph) but is
**not** uploadable to Play and cannot be used for upgrade installs over a release-signed app.

To produce a distributable artifact, add these repository secrets — the workflow feeds them to Gradle
through `android.injected.signing.*` properties, so no keystore path or password is ever committed:

| Secret | Meaning |
|---|---|
| `KEYSTORE_BASE64` | base64 of the `.jks`/`.keystore` file |
| `KEYSTORE_PASSWORD` | store password |
| `KEY_ALIAS` | key alias |
| `KEY_PASSWORD` | key password |

```bash
keytool -genkey -v -keystore futsal-release.jks -alias futsal \
  -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 futsal-release.jks    # -> KEYSTORE_BASE64
```

Keep the keystore outside the repository; losing it makes future upgrades uninstall-only.

## Root cause of the build failure (fixed)

The CI job failed for 13 consecutive runs at the Gradle stage. Four independent causes stacked up:

1. **Legacy pub plugins pin their own AGP/Kotlin.** `connectivity_plus`, `flutter_secure_storage`,
   `hive_flutter` and friends declare buildscript classpaths from AGP 7.3.1…8.13.1 and KGP
   1.7.22…2.2.0. Mixed versions across the included plugin projects make Gradle resolve incompatible
   plugin binaries. Fixed by forcing one pair — AGP 8.12.0 / Kotlin 2.2.20 — for every project's
   buildscript in `android/build.gradle.kts`. 8.12.0 was chosen deliberately: new enough to accept the
   Gradle 9.3.1 wrapper and the Flutter 3.47 templates, old enough to still understand the legacy DSL
   (`compileSdkVersion`, `lintOptions`) those plugins use. AGP 9.x reads only the new DSL and breaks
   them outright.
2. **Those plugins only declare `google()`/`mavenCentral()`,** so on a machine where `dl.google.com`
   404s they cannot resolve their own AGP. Fixed by adding the mirror fallbacks to
   `allprojects.buildscript.repositories` as well as `pluginManagement` and `allprojects.repositories`.
3. **`android.useAndroidX=true` was missing** from `gradle.properties`, so `mergeReleaseNativeLibs`
   failed on every AndroidX dependency.
4. **Repo hygiene:** 39 Gradle state files under `android/.gradle/` were committed, pinning the build
   to stale daemon/checksum state, and `.dart_tool/` plus `.flutter-plugins-dependencies` (generated)
   were tracked too. Untracked and ignored.

AGP 8 has no built-in Kotlin compiler, so `org.jetbrains.kotlin.android` is applied explicitly in
`android/app/build.gradle.kts`; `android/gradle.properties` carries `android.builtInKotlin=false`
(the Flutter migrator's marker for the pre-AGP-9 world), which is the consistent pairing.

## Known limitations

- Release artifacts are debug-signed until the four keystore secrets exist.
- The iOS device bundle is unsigned (no Apple Developer certificate in the repository), so it is a
  build artifact for re-signing rather than something that installs on a phone as published. There
  is no simulator artifact at all — release-mode simulator builds are refused by Flutter.
- `frontend/` (Tauri, v1.1.0) and the Flutter app (`pubspec.yaml`, v1.0.0) carry independent
  version numbers, so a release's desktop filenames do not match its tag.
- `flutter analyze`/`flutter test` are gate steps; a lint regression fails the build (by design).
- The workflow has no path filter on `push`, so any push to `master`/`main` triggers a full build
  (~6-10 min, five build targets). Filtering tag pushes silently skipped the Release job, so the
  filter was dropped rather than made smarter.
- Split-per-ABI APKs get `1000 * abi` added to `versionCode` by Flutter (documented in
  `android/app/build.gradle.kts`); the universal APK keeps `versionCode` from `pubspec.yaml`.
- Launcher label is still the template `futsal_booking_flutter` instead of the Persian app name.
- Do not delete a `v*` tag that has a published Release: GitHub demotes that release to a
  **draft**, and drafts are hidden from `GET /releases` and `/releases/tags/<tag>`, so the
  Releases page looks empty even though the assets are attached. The publish step deletes and
  recreates the release on every tag run, which repairs that state, but the page stays empty
  until such a run completes.
- Actions log *bodies* are unreachable from this development machine (they 302 to an Azure blob
  host that refuses connections), so CI evidence is limited to per-step conclusions, check-run
  annotations, and the `ci-build-failure` issue a red run files. The verify and publish steps
  therefore print their measurements as `::notice::` annotations.
