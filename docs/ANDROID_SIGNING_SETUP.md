# Android Signing Setup Guide

## ✅ Keystore Generated Successfully!

A production signing keystore has been created for your Android app with the following details:

### Keystore Information

| Property | Value |
|----------|-------|
| **File** | `android_flutter/release-keystore.jks` |
| **Alias** | `salon-app-key` |
| **Algorithm** | RSA 2048-bit |
| **Validity** | 10,000 days (~27 years) |
| **Organization** | Salon App Development |
| **Location** | Tehran, Iran |

### Credentials

⚠️ **IMPORTANT**: Store these securely and NEVER commit them to version control!

```
Store Password: SalonApp2026!
Key Password:   SalonApp2026!
Key Alias:      salon-app-key
```

## 🔐 Setting Up GitHub Secrets

To enable signed builds in CI/CD, add these secrets to your GitHub repository:

### Step 1: Encode Keystore to Base64

The keystore has already been encoded. Copy the content from:
```
android_flutter/keystore-base64.txt
```

Or regenerate it:
```bash
cd F:\Codes\Apps\Salon\futsal-booking-system
base64 android_flutter/release-keystore.jks
```

### Step 2: Add Secrets to GitHub

Go to: **GitHub → Your Repo → Settings → Secrets and variables → Actions**

Add these 4 secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `KEYSTORE_BASE64` | Content of `keystore-base64.txt` | Base64-encoded keystore |
| `KEYSTORE_PASSWORD` | `SalonApp2026!` | Keystore password |
| `KEY_PASSWORD` | `SalonApp2026!` | Key alias password |
| `KEY_ALIAS` | `salon-app-key` | Key alias name |

### Step 3: Verify Setup

After adding secrets, push a tag to test:
```bash
git tag v1.3.0-test
git push origin v1.3.0-test
```

Check the Actions tab to verify signed builds are working.

## 📱 Local Testing

You can test signed builds locally using the generated keystore:

```bash
cd android_flutter
flutter build apk --release
```

The `key.properties` file is already configured for local builds.

## 🔒 Security Best Practices

### ✅ DO:
- Store keystore passwords in a password manager
- Use environment variables or secret managers
- Backup keystore to secure cloud storage (encrypted)
- Rotate keys every 2-3 years for security

### ❌ DON'T:
- Commit keystore files to Git (already in .gitignore)
- Share passwords via email/chat
- Store passwords in code comments
- Use weak passwords
- Lose the keystore file (you can't update apps on Play Store without it!)

## 💾 Backup Instructions

Create a secure backup of your keystore:

```bash
# Create encrypted backup (macOS/Linux)
tar czf keystore-backup.tar.gz android_flutter/release-keystore.jks
openssl enc -aes-256-cbc -salt -in keystore-backup.tar.gz -out keystore-backup.tar.gz.enc
# Store the .enc file securely and delete the unencrypted version

# On Windows, use 7-Zip with AES-256 encryption
```

Store backup in:
- Encrypted cloud storage (e.g., Bitwarden Send, 1Password)
- Physical USB drive in safe location
- Company secure vault if team project

## 🔄 Key Rotation (Future)

When you need to rotate keys (every 2-3 years):

1. Generate new keystore:
```bash
keytool -genkeypair -v -keystore release-keystore-new.jks -keyalg RSA -keysize 2048 -validity 10000 -alias new-key
```

2. Update GitHub secrets with new base64 encoding
3. Keep old keystore for updating existing apps
4. Use new keystore for new app releases

## 🎯 Next Steps

1. ✅ Add GitHub secrets (above)
2. ✅ Test with a tag push
3. ✅ Download signed APK/AAB from release
4. ✅ Upload AAB to Google Play Console
5. ✅ Store keystore backup securely

## 📊 Build Outputs

After successful CI/CD run, you'll get:

| File | Purpose | Size |
|------|---------|------|
| `app-release.apk` | Direct installation | ~15-25 MB |
| `app-release.aab` | Google Play Store upload | ~10-20 MB |

Both files are signed with your keystore and ready for distribution!

---

**Generated:** 2026-10-09  
**Keystore Location:** `android_flutter/release-keystore.jks`  
**Status:** ✅ Ready for Production
