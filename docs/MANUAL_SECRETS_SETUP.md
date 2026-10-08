# Add GitHub Secrets - Manual Guide

## Quick Methods to Add Secrets

### Method 1: Using GitHub CLI Script (Recommended) ⚡

#### On macOS/Linux:
```bash
cd F:\Codes\Apps\Salon\futsal-booking-system
chmod +x scripts/setup-github-secrets.sh
./scripts/setup-github-secrets.sh
```

#### On Windows (PowerShell):
```powershell
cd F:\Codes\Apps\Salon\futsal-booking-system
.\scripts\setup-github-secrets.ps1
```

**Note:** Requires GitHub CLI installed: https://cli.github.com/

---

### Method 2: Manual Setup via Web UI 🖱️

#### Step 1: Go to Repository Settings

1. Open your repository on GitHub
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions** in left sidebar

Or directly navigate to:
```
https://github.com/YOUR_USERNAME/futsal-booking-system/settings/secrets/actions
```

#### Step 2: Add Each Secret

Click **"New repository secret"** and add these 4 secrets:

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `KEYSTORE_BASE64` | Content of `android_flutter/keystore-base64.txt` | Open file, copy ALL content |
| `KEYSTORE_PASSWORD` | `SalonApp2026!` | Type exactly as shown |
| `KEY_PASSWORD` | `SalonApp2026!` | Type exactly as shown |
| `KEY_ALIAS` | `salon-app-key` | Type exactly as shown |

#### Step 3: Verify

After adding all 4 secrets, you should see them listed (values hidden):
- ✅ KEYSTORE_BASE64
- ✅ KEYSTORE_PASSWORD
- ✅ KEY_PASSWORD
- ✅ KEY_ALIAS

---

### Method 3: Using GitHub API with curl 🔧

```bash
# First, get your personal access token from:
# https://github.com/settings/tokens

TOKEN="ghp_your_personal_access_token"
OWNER="YOUR_GITHUB_USERNAME"
REPO="futsal-booking-system"

# Add each secret (requires encryption, see docs):
# https://docs.github.com/en/rest/actions/secrets
```

**Note:** This method is complex due to encryption requirements. Use Method 1 or 2 instead.

---

## Getting the KEYSTORE_BASE64 Value

### Option A: Read from File
```bash
cat android_flutter/keystore-base64.txt
# Copy entire output
```

### Option B: Regenerate if Needed
```bash
# On macOS/Linux
base64 -i android_flutter/release-keystore.jks

# On Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("android_flutter\release-keystore.jks"))
```

---

## Testing After Setup

Once secrets are added, test the workflow:

```bash
# Create a test tag
git tag v1.3.0-test
git push origin v1.3.0-test

# Monitor the build
# Go to: https://github.com/YOUR_USERNAME/futsal-booking-system/actions
```

Expected result after ~10 minutes:
- ✅ flutter-android-release job succeeds
- ✅ Signed APK and AAB available in release artifacts

---

## Troubleshooting

### ❌ Build fails with "Keystore not found"
**Solution:** Check that `KEYSTORE_BASE64` secret contains the complete base64 string (no line breaks or spaces)

### ❌ Build fails with "Wrong password"
**Solution:** Verify passwords are exactly `SalonApp2026!` (case-sensitive)

### ❌ Can't see secrets in Actions logs
**Solution:** This is expected! Secrets are masked in logs for security

### ❌ "Secret not found" error
**Solution:** Double-check secret names match exactly (all caps, underscores)

---

## Security Reminders

✅ **DO:**
- Keep secrets secure
- Use strong passwords
- Rotate keys periodically

❌ **DON'T:**
- Share secrets publicly
- Commit keystore files to Git
- Store passwords in code
- Email secrets unencrypted

---

## Need Help?

See full documentation:
- [Android Signing Setup](ANDROID_SIGNING_SETUP.md)
- [CI/CD Quick Start](QUICK_START_CI_CD.md)
- [Workflow Documentation](../.github/workflows/README.md)
