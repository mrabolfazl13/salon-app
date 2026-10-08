# Quick Start: CI/CD Android Signing

## 🚀 5-Minute Setup

### 1. Add GitHub Secrets (2 minutes)

Go to: **GitHub → Repo → Settings → Secrets → Actions**

Add these 4 secrets:

```
KEYSTORE_BASE64 = [Copy content from android_flutter/keystore-base64.txt]
KEYSTORE_PASSWORD = SalonApp2026!
KEY_PASSWORD = SalonApp2026!
KEY_ALIAS = salon-app-key
```

### 2. Test Build (3 minutes)

```bash
git tag v1.3.0
git push origin v1.3.0
```

### 3. Download Signed Builds

After workflow completes (~10 min):
- Go to **Actions** tab
- Click on the workflow run
- Download artifacts or check **Releases**

You'll get:
- ✅ `flutter-android-release.apk` (signed)
- ✅ `flutter-android-release.aab` (for Play Store)

---

## 🔑 Credentials Summary

| Item | Value |
|------|-------|
| Keystore File | `android_flutter/release-keystore.jks` |
| Store Password | `SalonApp2026!` |
| Key Password | `SalonApp2026!` |
| Key Alias | `salon-app-key` |
| Valid Until | ~Year 2053 |

---

## ⚠️ IMPORTANT

1. **NEVER commit keystore files** - Already in .gitignore ✅
2. **Backup keystore securely** - You need it for app updates
3. **Keep passwords safe** - Store in password manager

---

## 📚 Full Documentation

See complete guide: [`docs/ANDROID_SIGNING_SETUP.md`](docs/ANDROID_SIGNING_SETUP.md)
