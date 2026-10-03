# Build Experiments Log

Chronological record of every build configuration attempted for the Flutter Android
release. Do not repeat a FAILED experiment without new evidence.

Legend: `Category` follows the failure taxonomy in the recovery brief
(A environment, B dependency resolution, C Gradle/AGP, D Kotlin/Java, E Flutter, F resources, G native, H signing, I app code).

---

## Experiment #01 — Iranian Maven mirrors

- Hypothesis: `myket.ir/maven` or `devneeds.com` mirror Google Maven, so pointing Gradle
  there fixes blocked downloads from Iran.
- Change: `android/settings.gradle.kts` + `android/build.gradle.kts` repositories.
- Result: **FAILED** (Category B)
- Error: `Could not find com.android.tools.build:gradle:8.1.2` — searched only the
  official repos; probe showed myket `404` and devneeds `429` for the AGP marker.
- Conclusion: Iranian mirrors do not carry AGP. Do not repeat.

## Experiment #02 — Flutter template defaults (AGP 9.1.0 / Kotlin 2.4.0) + Huawei/Aliyun mirrors

- Hypothesis: keep Flutter 3.47.2's own template versions; the mirrors make them resolvable.
- Change: mirrors in `pluginManagement.repositories` and `allprojects.repositories`.
- Result: **FAILED** (Category C)
- Error: `:connectivity_plus` buildscript asks for AGP `8.1.2` from
  `dl.google.com` (uniform `404` here) → `Failed to apply plugin 'com.android.library'`,
  then `kotlin-android plugin requires one of the Android Gradle plugins`.
  Flutter also emitted: *Starting AGP 9+, only the new DSL interface will be read.*
- Conclusion: resolution alone is not enough — the plugins' own pinned AGP/Kotlin
  versions must be normalised, and AGP 9 cannot host their old DSL.

## Experiment #03 — One forced AGP across every project's buildscript

- Hypothesis: forcing `com.android.tools.build:gradle` to a single AGP-8.x release in
  `allprojects.buildscript` makes every legacy plugin buildable under Gradle 9.3.1.
- Change: `android/build.gradle.kts` gains
  `allprojects { buildscript { repositories { … } configurations.all { resolutionStrategy { force(AGP 8.12.0), force(KGP 2.2.0) } } } }`;
  `settings.gradle.kts` plugins block set to AGP 8.12.0 / Kotlin 2.2.0;
  `org.jetbrains.kotlin.android` added to `android/app/build.gradle.kts`
  (AGP 8 has no built-in Kotlin).
- Result: **FAILED** (Category E)
- Error: `Your project's Kotlin version (2.2.0) is lower than Flutter's minimum supported
  version of 2.2.20`.
- Conclusion: the approach works (dependency layer cleared); only the Kotlin floor was wrong.

## Experiment #04 — Kotlin 2.2.20

- Change: `unifiedKotlinVersion = "2.2.20"` in both files (verified `200` on both mirrors).
- Result: **FAILED** (Category A/B boundary — configuration)
- Error: `:app:mergeReleaseNativeLibs` →
  `Configuration :app:releaseRuntimeClasspath contains AndroidX dependencies, but the
  'android.useAndroidX' property is not enabled`.
- Conclusion: all artifacts resolved from the mirrors; the project was missing the
  AndroidX switch that Flutter normally writes into `android/gradle.properties`.

## Experiment #05 — enable AndroidX, keep every dependency

- Change: `android.useAndroidX=true` in `android/gradle.properties`.
- Result: **FAILED** (Category D)
- Error: `flutter_local_notifications-16.3.3/.../FlutterLocalNotificationsPlugin.java:1033:
  error: reference to bigLargeIcon is ambiguous` (`bigLargeIcon(Bitmap)` vs
  `bigLargeIcon(Icon)`), i.e. the plugin's Java cannot compile against API 35+.
- Conclusion: upgrading a pub package is the only real fix; patching the cached plugin
  source is not reproducible in CI.

## Experiment #06 — remove the unused notifications dependency

- Evidence: `grep -rn "flutter_local_notifications\|FlutterLocalNotificationsPlugin\|notification" lib/ test/`
  returned nothing → the dependency was never referenced by application code.
- Change: deleted `flutter_local_notifications: ^16.3.0` from `pubspec.yaml`, `flutter pub get`
  (4 packages dropped).
- Result: **SUCCESS** (local)
- Artifact: `build/app/outputs/flutter-apk/app-release.apk`, 67,338,458 bytes;
  `aapt2 dump badging` shows the expected package/version and all three ABIs;
  `apksigner verify` exits 0.
- Note: the `flutter` process was reaped before printing its own summary line, so the
  success is established from the artifact itself, not the tool's exit code.

## Experiment #07 — `flutter build apk --release -- --continue`

- Hypothesis: arguments after `--` are forwarded to Gradle.
- Result: **FAILED** (Category I — tool usage)
- Error: `Target file "--continue" not found.`
- Conclusion: `flutter build` treats post-`--` args as the Dart entry point. Use
  `org.gradle.continue=true` in `android/gradle.properties` instead — and remove it again,
  because it masks real failures.

## Experiment #08 — keep host-specific Gradle memory caps out of the repo

- Hypothesis: `android/gradle.properties` had been lowered to `-Xmx3g`,
  `org.gradle.workers.max=2` and `kotlin.daemon.jvmargs=-Xmx1g`. Those are caps for an
  8 GB laptop, not build correctness, and they would throttle CI's parallelism.
- Change: restored the Flutter template line (`-Xmx8G -XX:MaxMetaspaceSize=4G ...`) in the
  repo and moved the caps to `~/.gradle/gradle.properties`, which Gradle reads before the
  project file for build-environment properties.
- Result: **SUCCESS** — `android.useAndroidX=true` is now the only functional addition in
  the committed file, and the local build still completes on this host.

## Experiment #09 — pin the Android SDK components in CI

- Hypothesis: `compileSdk = 36` and `ndkVersion = "27.0.12077973"` are pinned in
  `android/app/build.gradle.kts`, but the runner is not guaranteed to carry that exact NDK,
  which would fail the build in CI only.
- Change: added an `Install Android SDK components` step running `sdkmanager --licenses`
  then `--install platforms;android-36 build-tools;36.0.0 ndk;27.0.12077973`, asserted
  afterwards with `--list_installed`.
- Result: **APPLIED** — CI builds against the same SDK/NDK pair the Gradle files ask for,
  instead of whatever the runner image happens to ship.

## Experiment #10 — widget test failing on MissingPluginException

- Hypothesis: `AuthProvider()` and `ThemeProvider()` both `await
  SharedPreferences.getInstance()` from their constructors, and `flutter test` has no plugin
  binding.
- Change: `SharedPreferences.setMockInitialValues({})` before pumping the widget tree, plus
  one bounded `pump()` instead of `pumpAndSettle()` (a running UI animation would make the
  latter time out).
- Result: **SUCCESS** — `All tests passed!`. Keeps the CI gate meaningful rather than
  deleting the test.

## Experiment #11 — INTERNET permission only inherited

- Evidence: `android/app/src/main/AndroidManifest.xml` declared no permissions, yet
  `aapt2 dump badging` of the release APK listed `android.permission.INTERNET` — it came from
  a merged library manifest, so a future dependency change could silently strip network
  access from the release build.
- Change: declared `<uses-permission android:name="android.permission.INTERNET"/>` in the
  main manifest.
- Result: **APPLIED** — no behavioural change today, no reliance on transitive manifests.

## Local-only environment fixes (not experiments)

- `build-tools 36.0.0` installed from
  `https://mirrors.cloud.tencent.com/AndroidSDK/build-tools_r36_windows.zip`
  into `G:\SDK\build-tools\36.0.0` (Google's SDK repository is `404`-blocked here).
  The archive's root folder is historically named `android-16`; its
  `source.properties` says `Pkg.Revision=36.0.0`.
- Gradle memory caps for this 8 GB host now live in `~/.gradle/gradle.properties`
  (see Experiment #08). Without them the Kotlin daemon dies mid-build and Gradle falls
  back to in-process compilation (`e: Daemon compilation failed: null`); the build still
  finishes, but that noise hides real errors. Never commit those caps.
- Gradle wrapper switched to `gradle-9.3.1-all.zip`, the version Flutter 3.47.2 itself
  templates and the only distribution already in `~/.gradle/wrapper/dists`.
