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

## Experiment #12 — machine-local caps in `C:\Users\Alex\.gradle` (Experiment #08 was premature)

- Context: Experiment #08 moved the 8 GB host's memory caps out of
  `android/gradle.properties` into `~/.gradle/gradle.properties` and reported SUCCESS
  because a *previously started* build had finished. Re-running the release build with the
  restored template settings disproved it.
- Symptom: `Gradle build daemon disappeared unexpectedly (it may have been killed or may
  have crashed)`, plus `hs_err_pid13896.log` written into `android/`.
- Evidence: the daemon log line printed its effective options —
  `daemonOpts=..., -Xmx8G, ...` with `daemonRegistryDir=G:\gradle-home\daemon`. So
  `GRADLE_USER_HOME` on this machine is **`G:\gradle-home`**, not `C:\Users\Alex\.gradle`,
  and the caps had been written to a file Gradle never reads. The 8 GB heap the repo now
  asks for does not fit this host, so the JVM crashed.
- Change: wrote the caps to `G:\gradle-home\gradle.properties`, deleted the misplaced file,
  `gradlew --stop` to drop the crashed daemon.
- Result: **SUCCESS** — `assembleRelease` with `--split-per-abi` produced
  arm64-v8a/armeabi-v7a/x86_64 APKs (exit 0) and `bundleRelease` produced
  `app-release.aab` (60,073,220 bytes), still with the repo asking for `-Xmx8G`.
- Lesson: read the daemon's own `daemonOpts`/`daemonRegistryDir` instead of assuming which
  properties file won; and never mark an experiment successful on the strength of a build
  that started before the change.

## Experiment #13 — CI green but the Release had zero assets

- Symptom: run 37158077671 succeeded end to end, `Publish GitHub Release` completed, and
  `GET /releases/latest` returned `tag_name=v1.0.0, draft=false, assets=0`.
- Root cause: `gh release create` was invoked with `--title/--notes` only — the artifact
  paths are *positional arguments*, and omitting them publishes an empty release. Nothing
  in the job asserted the assets existed, so this is the brief's "workflow green but
  artifact missing" false success.
- Change: the step now (a) requires each of the five files to exist and be non-empty before
  publishing, (b) passes them to `gh release create`, (c) re-reads the release afterwards
  and fails if it carries fewer than five assets, and (d) is idempotent — if the release
  already exists it uploads with `--clobber` instead of dying on "already exists", so a
  re-run repairs rather than blocks.
- Local proof: `bash -n` on every `run:` block, then a dry run of the real publish script
  against the locally built artifacts with a stubbed `gh`, which logged
  `release create v1.0.0 ... app-release.apk app-arm64-v8a-release.apk
  app-armeabi-v7a-release.apk app-x86_64-release.apk app-release.aab`.
- Result: **APPLIED** — awaiting the re-tagged run to confirm five live assets.

## Experiment #14 — verifying only the universal APK was not enough

- Hypothesis: `Verify artifacts` inspecting just `app-release.apk` could pass while a
  per-ABI APK was a mislabelled copy of the universal build (upload would then ship four
  near-identical files and nobody would notice).
- Change: the step now dumps badging for each split APK and asserts it declares exactly one
  `native-code:` entry matching its filename, plus the ABI-offset `versionCode` Flutter
  applies (2001 arm64, 1001 armeabi, 4001 x86_64), and verifies the AAB really contains
  `base/manifest/AndroidManifest.xml` and `base/dex/classes.dex`.
- Evidence from the local build: exactly those values — `native-code: 'arm64-v8a'` alone in
  the arm64 APK, versionCodes 2001/1001/4001, `versionName 1.0.0`, `targetSdkVersion 36`,
  and all three ABIs present as 18 `.so` entries inside the AAB.
- Result: **APPLIED**

## Experiment #15 — a "published" Release that nobody could reach

- Hypothesis: run 37158902775 (tag `v1.0.0` @ `30937ce`) was fully green including
  `Publish GitHub Release`, yet `GET /releases` returned `[]` and `releases/tags/v1.0.0`
  404'd — either the step lied again, or the release existed in a state the REST list
  endpoints hide.
- Evidence: the authenticated listing showed release `402715649` with **all five assets
  already uploaded** (`app-release.apk` 67,305,502 B, arm64 24,787,212 B, armeabi 20,700,356 B,
  x86_64 27,442,278 B, `app-release.aab` 60,030,083 B) but `draft: true` and
  `html_url = .../releases/tag/untagged-4ba722adaa25a95eff13`. The `DeleteEvent` at
  22:34:18 is the tag removal that demoted the release published at 22:26:31; drafts are
  invisible to anonymous `GET /releases`, to `releases/latest` and to `releases/tags/<tag>`.
  The rerun then took the "release exists" branch: `gh release upload --clobber` re-attached
  the binaries and `gh release edit --title/--notes` **left `draft` untouched**, so the
  assets were correct while the release stayed unpublished.
- Conclusion: **FALSE SUCCESS (green + unreachable artifacts)**. Two independent gates were
  missing — nothing asserted `draft == false`, and nothing asserted the tag association.
  Fix: the publish step now reads `--json draft` before deciding, deletes-and-recreates when
  it finds a draft (`gh release delete --yes` keeps the tag), passes `--draft=false`
  explicitly on the edit path, and fails the run unless
  `draft=false` **and** `assets >= 5`. `Verify artifacts` additionally emits a `::notice::`
  with the five file sizes and the signer DN, because check-run annotations are readable
  while Actions log bodies are not.
- Result: **APPLIED** — the existing release was republished (`tag_name v1.0.0`,
  `draft false`, asset URLs now `/releases/download/v1.0.0/…`), and a fresh workflow run
  must reproduce the same state from scratch.

## Experiment #16 — the publish step failed and the reason was unreadable

- Hypothesis: run 37160580288 (tag `v1.0.0` @ `d1f160f`, the draft-aware version) failed at
  `Publish GitHub Release` with exit 1 and no `::error::` annotation, so `set -e` aborted on a
  `gh` call whose message only lives in the unreachable log body.
- Evidence: the release on GitHub is exactly right afterwards — `draft=false`, five assets,
  and the AAB is `60,030,088` bytes, matching *this* run's `Verify artifacts` notice (the
  parallel master run produced `60,030,077`). So the branch check and `gh release upload
  --clobber` succeeded and the abort came after them: `gh release edit --draft=false` or one of
  the `gh release view --json` gate calls. The REST equivalents were then probed directly —
  `PATCH /releases/402715649` with `{"draft":false}`, with `name`+`body`+`draft`, and with
  `tag_name` added all returned `200` — so GitHub was not rejecting anything; the failing piece
  was the `gh release edit` invocation itself, and its reason is not observable from here.
- Conclusion: **do not keep a call whose failure cannot be observed.** The step no longer uses
  `gh release edit` or `upload --clobber`: it deletes any existing release for the tag and
  creates a fresh published one in a single `gh release create`, then reads the state back with
  `gh api repos/…/releases/tags/<tag>` (raw REST, the same view an anonymous visitor gets).
  Every `gh` call now runs through a wrapper that prints the failing command line and its
  output as an `::error::` annotation *and* appends to `/tmp/publish.log`, which the
  `ci-build-failure` issue now includes, so a repeat failure names itself.
- Result: **APPLIED** — verified against all four release states with a stubbed `gh`
  (draft+5, published+5, none, delete-refuses), including the two that must exit 1.

## Experiment #17 — the delete-and-recreate publish step run for real

- Hypothesis: after Experiment #16's rewrite, a tag run either publishes in one `gh release
  create` call or says which `gh` command failed.
- Evidence: run **37162675207** (tag `v1.0.0` @ `1dbffeb`) — steps 1-16 all `success`, with the
  annotations `release for v1.0.0 already exists -> deleting it (tag kept) before recreating`
  and `published v1.0.0 with 5 assets (draft=false)`. The parallel master run
  **37162665569** is green too, with publish `skipped` as intended. Anonymous
  `GET /releases` (no token) lists exactly one release: `v1.0.0`, `draft=false`, 5 assets,
  id 402738733 — the tag deletion had in fact demoted the old release (id 402715649) and the
  step replaced it. Each `browser_download_url` answers `HEAD 200` with
  `Content-Length` equal to the asset size: universal 67,305,502, arm64-v8a 24,787,212,
  armeabi-v7a 20,700,356, x86_64 27,442,278 (`application/vnd.android.package-archive`) and
  the AAB 60,030,090.
- Result: **CONFIRMED** — the release is built, published and downloadable by CI alone.

## Experiment #18 — `signer unknown` was a gate swallowed by a pipe

- Hypothesis: the `Verify artifacts` notice ends with `signer unknown`, which could mean the
  grep pattern does not match the runner's `apksigner` output.
- Evidence: on this machine's build-tools 36.0.0 the command prints
  `Signer #1 certificate DN: C=US, O=Android, CN=Android Debug`, so the pattern was fine. The
  step ran `apksigner verify --print-certs … | tee /tmp/signer.txt`; a pipeline's exit status is
  the *last* command's, so `tee` returned 0 whether or not the APK verified, and the missing-DN
  case was then absorbed by `|| echo 'signer unknown'`. The universal APK's signature therefore
  gated nothing and a verification failure would have produced a green step plus an ordinary
  notice. The three per-ABI `apksigner verify` calls are not piped, and were real gates.
- Conclusion: **an assertion whose exit status is consumed by a pipe is not an assertion.**
- Fix: capture with `> /tmp/signer.txt`, `cat` it into the log, and `grep -q "certificate DN:"`
  so an absent certificate fails the step; the annotation reads the DN back with
  `sed -n 's/.*certificate DN: //p'`. Both paths tested against the captured output (passes,
  extracts `C=US, O=Android, CN=Android Debug`) and against an empty file (fails).
- Result: **CONFIRMED** by run **37164317457** (tag `v1.0.0` @ `9f41144`), whose verify notice
  reads `… + aab 60030085B, C=US, O=Android, CN=Android Debug` instead of `signer unknown`, and
  whose publish notices are `release for v1.0.0 already exists -> deleting it (tag kept) before
  recreating` + `published v1.0.0 with 5 assets (draft=false)`. Anonymous `GET /releases` then
  lists one release (id 402746338, `draft=false`, 5 assets) and every asset URL answers
  `HEAD 200` with the matching byte count.

## Experiment #19 — bringing up the Windows/Linux/iOS jobs found three independent blockers

- Context: run **37174826030** (`c2c36a0`, push to `master`) was the first execution of the four
  platform jobs. Android went green unchanged; the other three failed in their first substantive
  step, and the two desktop jobs failed before the Tauri build even started.
- **Blocker 1 — the committed lockfile did not match the manifest.**
  `pnpm install --frozen-lockfile` exited with `ERR_PNPM_OUTDATED_LOCKFILE`, naming
  `@tauri-apps/api (lockfile: ^2.11.1, manifest: ^2.12.0)` and
  `@tauri-apps/plugin-http (lockfile: ^2.6.1, manifest: ^2.6.0)`. `git log -p` puts both range edits
  in commit `4672a27`, which never re-resolved the lockfile, and `node_modules` still held 2.11.1 /
  2.6.1 — so the versions in `package.json` had never been installed, let alone verified.
- **Blocker 2 — every dependency in the lockfile pointed at an Iranian npm mirror.** All 761
  `resolution.tarball` values were `https://repo.hmirror.ir/artifactory/api/npm/mirror-npm/…`,
  i.e. the local development machine's registry had been committed, and CI would have downloaded
  the entire dependency tree of a published release binary from that third party. Re-resolving
  against `https://registry.npmjs.org/` was refused until those URLs matched, so they were rewritten
  prefix-wise after verifying equivalence: 12 randomly sampled packages were fetched from both the
  mirror and the official registry, and each pair was byte-identical *and* hashed to the sha512
  already recorded in the lockfile (`MISMATCHES 0`). pnpm re-checks that integrity for every
  package at install time, so the swap cannot smuggle different bytes. The only version change in
  the resulting diff is the intended `@tauri-apps/api 2.11.1 -> 2.12.1`.
- **Blocker 3 — the Tauri build could never have run.** `tauri-cli`'s
  `check_mismatched_packages` (called from `build.rs` before any compilation) compares the Rust
  `tauri` crate against the npm `@tauri-apps/api` and errors when major/minor differ.
  `frontend/src-tauri/Cargo.lock` has `tauri 2.12.0` while the installed api was `2.11.1`, so the
  desktop jobs would have failed at the bundler's own gate even with a valid lockfile. Resolving
  `^2.12.0` to 2.12.1 satisfies the check; `tauri-plugin-http =2.6.0` (Rust) against
  `@tauri-apps/plugin-http 2.6.1` (npm) shares major/minor and passes. `tauri-plugin-opener` has no
  npm counterpart in `package.json`, so it is skipped by that check.
- **Blocker 4 — `flutter build ios --release --simulator` is not a thing.** The iOS job died with
  `Release mode is not supported for simulators.` In `flutter_tools`,
  `BuildInfo.supportsSimulator => isEmulatorBuildMode(mode)` and `isEmulatorBuildMode` is
  `mode == BuildMode.debug` only, so a *release* simulator bundle cannot be produced at any
  version. The alternatives were to ship a debug iOS app in the release or to ship only the
  unsigned device bundle. A debug artifact published as a release binary is precisely the false
  success this pipeline was rebuilt to prevent, so the simulator step was dropped; the release
  carries the arm64 device `Runner.app` (unsigned, needs an Apple Developer certificate).
- **Blocker 5 — the iOS verify step read a directory Flutter no longer writes.** Run
  **37178477369** built the app fine (`✓ Built build/ios/iphoneos/Runner.app (37.2MB)`) and then
  failed with `ls: build/ios/iphone/Runner.app: No such file or directory`. The path came from the
  pre-3.10 Flutter layout; `flutter build ios` has written to `build/ios/iphoneos/` (and Xcode's
  `build/ios/Release-iphoneos/`) since. The build log proved the artifact existed, so the fix was
  the two paths in the verify and package steps, not the build.
- **Blocker 6 — the desktop verifies grepped for a cargo line that no longer exists.** Both
  Windows and Linux reached `Verify artifacts` after producing every bundle
  (`Finished 2 bundles at: …/deb/Salon_1.1.0_amd64.deb, …/appimage/Salon_1.1.0_amd64.AppImage`),
  and both died on `grep -q "Finished .*release. in"`. Current cargo prints
  ``Finished `release` profile [optimized] target(s) in 10m 21s``: the pattern demanded the word
  `release` be followed by exactly one character and then `" in"`, which the backticked profile
  name and the `[optimized] target(s)` prefix never satisfy. The assertion was rewritten as
  `grep -qE "Finished .*release.* in"`, which still rejects the debug profile line
  (``Finished `dev` profile …``).
- Observability gap found on the way: a failing `pnpm install` produced no annotation at all,
  because the failure-report step only tailed the Tauri log that never got written. The install step
  now tees into a log, the report step tails both, and every build job uploads its step logs as an
  artifact on failure — artifacts *are* reachable through the REST API from this machine even though
  Actions log bodies are not. The same run made the second half of the gap visible: an assertion can
  fail correctly and still be undiagnosable, so each verify step now prints the value it measured
  and names the check that rejected it.
- Result: **CONFIRMED** by run **37179422867** (`433bf92`, push to `master`) — all four platform
  jobs green, with the verify annotations reporting measurements rather than silence: Android
  universal 67,305,502 B + arm64 24,787,212 B + armv7 20,700,356 B + x86_64 27,442,278 B +
  AAB 60,030,080 B signed `C=US, O=Android, CN=Android Debug`; Windows NSIS 4,962,369 B + MSI;
  Linux deb 8,167,084 B + AppImage 83,401,208 B; iOS `com.salon.futsal.futsalBookingFlutter`
  v1.0.0, arm64 Mach-O, 36,556 KB packaged as a 14,026,978 B zip.

## Experiment #20 — the tag run built all four platforms and still published nothing

- Context: tag run **37185433089** (`0e6012a`) had `build-apk`, `build-windows`, `build-linux` and
  `build-ios` all green, `Download every platform binary` green, and then `Publish GitHub Release`
  red. The release page still showed only the five Android assets from `9f41144` at 00:19, which
  proved nothing had been deleted or created.
- The one annotation that should have explained it read
  ``::error::`gh release create v1.0.0 --verify-tag --notes Release build of the Salon app …`failed:``
  and stopped: the wrapper echoed the *whole command line*, notes text included, and GitHub truncates
  an annotation, so `gh`'s actual message was cut off. A second red step (`Report failure to an
  issue`) failed for its own reason and produced nothing but `exit code 1`.
- Diagnosis of the shape of the failure: the publish step decides whether to delete the existing
  release with `gh release view "$TAG" >/dev/null 2>&1`. Its status alone drove the branch, so any
  failure of that check — including a transient one — skipped the delete, and `gh release create`
  then died on a release that already existed. The check that gates the delete was the one call
  whose error was thrown away.
- Fix, in three parts:
  1. every `gh` call goes through `ghrun "<short label>" …`, which puts **gh's message first** in
     the annotation and keeps the full output in `/tmp/publish.log`;
  2. the existence check is a raw `gh api repos/…/releases/tags/<tag> --jq .id`, and when it fails
     its own error text is printed as a notice, so "no release" and "could not tell" are
     distinguishable;
  3. the release job uploads `publish.log` as `ci-failure-logs-publish-<run>-<attempt>` (artifact
     names avoid the word `release` so this run's own `*-release-*` download can never pick it up),
     and the issue reporter can no longer fail the job it is reporting on.
- Offline coverage: `build/logs/dryrun_release.py` plants the exact nested `release-files/` layout
  and runs the real step body against a `gh` stub. It now exercises ten cases, including
  "release exists and the delete fails" (must exit 1 before creating anything) and
  "release exists" → the `.id` lookup, which the stub answers from its state file.
- Third blocker, named by the new instrumentation. Tag run **37188849259** (`d6aff8b`) again built
  all four platforms green and died in `Publish GitHub Release`, this time with a readable
  annotation: `release delete v1.0.0 failed: failed to run git: fatal: not a git repository (or
  any of the parent directories): .git`. The `release` job has no `actions/checkout` step — it only
  downloads artifacts — so its working directory is not a git repository, and `gh release` resolves
  the target repository by asking git for a remote. Every `gh api` call in the step survived because
  it passes an explicit `repos/<owner>/<repo>` path, which is why the existence check found
  `id=402746338` seconds before the delete that could not name the repo. `gh label create` and
  `gh issue create` in the reporter failed the same way (`could not file the failure issue`).
- Fix: `GH_REPO: ${{ github.repository }}` on both steps of the release job — the documented way to
  name the repository for `gh` outside a checkout. No checkout was added; the job's only input is
  the artifact set.
- Offline coverage of the fix: the `gh` stub now refuses any non-`api` group when neither `GH_REPO`
  nor a git repository is present, so the dry run reproduces the CI message verbatim in two new
  scenarios (release already exists → delete; no release → create) and the eight earlier cases still
  behave identically with `GH_REPO` set.
- Result: **CONFIRMED** by tag run **37191904535** (`c0e75bb`) — all four build jobs green, then
  `Publish GitHub Release` green with the notices `release for v1.0.0 exists (id=402746338) ->
  deleting it (tag kept) before recreating` and `published v1.0.0 with 10 assets (draft=false)`.
  Read back **anonymously**: `GET /releases` lists one release (`draft=false`, 10 assets, id
  402946063) and every `browser_download_url` answers `HEAD 200` with its exact byte count —
  universal 67,305,502 B, arm64 24,787,212 B, armv7 20,700,356 B, x86_64 27,442,278 B,
  AAB 60,030,081 B, setup.exe 4,960,779 B, msi 6,656,000 B, deb 8,167,076 B, AppImage 83,401,208 B,
  iOS zip 14,026,982 B.

## Local-only environment fixes (not experiments)

- `build-tools 36.0.0` installed from
  `https://mirrors.cloud.tencent.com/AndroidSDK/build-tools_r36_windows.zip`
  into `G:\SDK\build-tools\36.0.0` (Google's SDK repository is `404`-blocked here).
  The archive's root folder is historically named `android-16`; its
  `source.properties` says `Pkg.Revision=36.0.0`.
- Gradle memory caps for this 8 GB host live in `$GRADLE_USER_HOME/gradle.properties`,
  which on this machine is `G:\gradle-home\gradle.properties`. Without them the Kotlin
  daemon dies mid-build and Gradle falls
  back to in-process compilation (`e: Daemon compilation failed: null`); the build still
  finishes, but that noise hides real errors. Never commit those caps.
- Gradle wrapper switched to `gradle-9.3.1-all.zip`, the version Flutter 3.47.2 itself
  templates and the only distribution already in `~/.gradle/wrapper/dists`.
