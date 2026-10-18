# Build Guide — Tauri Android + Tauri Windows (Flutter-free)

The product ships from **one React core** (`frontend/`) and three outputs only:

1. **Web** — `frontend/dist` (Vite build)
2. **Tauri Android** — APK/AAB from `frontend/src-tauri`
3. **Tauri Windows** — MSI/NSIS from `frontend/src-tauri`

Flutter was fully removed from the product, tests and CI. Any guide that mentions
`flutter build` or `android_flutter/` is outdated — this file is authoritative.

## Prerequisites

| Tool | Version | Check |
|---|---|---|
| Node.js | 20+ | `node -v` |
| pnpm | 10+ | `pnpm -v` |
| Rust (stable) | 1.80+ | `cargo --version` |
| JDK | Temurin 17 | Android only |
| Android SDK + NDK | API 34+, any recent NDK | Android only, `NDK_HOME` must resolve |

One-time Rust targets for Android:

```bash
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

## Web (the shared core)

```bash
cd frontend
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit -p tsconfig.app.json   # type gate
pnpm run lint                                 # eslint gate
pnpm test                                     # vitest gate
pnpm build                                    # -> frontend/dist
```

`VITE_API_URL` / `VITE_DOMAIN` / `VITE_APP_NAME` / `VITE_APP_VERSION` come from
`frontend/.env` (see `frontend/.env.example`); never commit real secrets.

## Tauri Android

```bash
cd frontend
pnpm tauri android init        # regenerates src-tauri/gen/android (gitignored)
pnpm tauri android build --apk --aab
```

Outputs:

```
frontend/src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk
frontend/src-tauri/gen/android/app/build/outputs/apk/arm64/release/app-arm64-release.apk
frontend/src-tauri/gen/android/app/build/outputs/apk/arm/release/app-arm-release.apk
frontend/src-tauri/gen/android/app/build/outputs/apk/x86_64/release/app-x86_64-release.apk
frontend/src-tauri/gen/android/app/build/outputs/bundle/universalRelease/app-universal-release.aab
```

### Signing

`gen/android` is regenerated from a template by `tauri android init` and carries **no
signing wiring**. CI therefore writes `app/key.properties` and injects a gradle init
script (`tauri-signing.gradle`) that attaches the release `signingConfig` — see
`.github/workflows/build-all-platforms.yml` (job `tauri-android`, step *Setup signing*).
Locally, produce the same layout:

```bash
cd frontend/src-tauri/gen/android/app
# create key.properties with storeFile/storePassword/keyAlias/keyPassword
# put release-keystore.jks next to it
```

Secrets expected by CI: `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`,
`KEY_PASSWORD`. Missing secrets → the job builds **unsigned** artifacts with a warning.

Verification of a built APK (what CI's evidence bar is):

```bash
apksigner verify --print-certs app-universal-release.apk
aapt2 dump badging app-universal-release.apk | head -3
```

## Tauri Windows

```bash
cd frontend
pnpm install --frozen-lockfile
pnpm tauri build
```

Outputs:

```
frontend/src-tauri/target/release/bundle/msi/Salon_<ver>_x64_en-US.msi
frontend/src-tauri/target/release/bundle/nsis/Salon_<ver>_x64-setup.exe
```

No code-signing certificate is configured: MSI/NSIS are unsigned. Do not claim a signed
Windows release until a certificate exists.

## CI/CD

`.github/workflows/build-all-platforms.yml` builds exactly the three paths on every
push/PR, and on `v*` tags requires **both** `tauri-android` and `tauri-windows` to
succeed before creating the GitHub Release and attaching:

- `tauri-android.apk/` + `tauri-android.aab/`
- `tauri-windows/` (msi + nsis)
- `react-web-dist/`

Artifact names carry the platform and the technology that produced them
(`tauri-*`, `react-web-dist`) — no generator ambiguity is allowed in release assets.
