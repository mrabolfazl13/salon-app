# ✅ GitHub Secrets Setup - Complete Guide

## 🎯 What You Need to Do

Add 4 secrets to your GitHub repository to enable signed Android builds.

---

## ⚡ Method 1: Automated Script (Easiest)

### Prerequisites
Install GitHub CLI: https://cli.github.com/

Then authenticate:
```bash
gh auth login
```

### Run the Script

**On Windows:**
```powershell
cd F:\Codes\Apps\Salon\futsal-booking-system
.\scripts\setup-github-secrets.ps1
```

**On macOS/Linux:**
```bash
cd /path/to/futsal-booking-system
chmod +x scripts/setup-github-secrets.sh
./scripts/setup-github-secrets.sh
```

The script will automatically add all 4 secrets! ✅

---

## 🖱️ Method 2: Manual Web UI (No Installation Required)

### Step-by-Step:

1. **Open Repository Settings**
   ```
   https://github.com/mrabolfazl/futsal-booking-system/settings/secrets/actions
   ```

2. **Click "New repository secret"**

3. **Add these 4 secrets:**

   | Secret Name | Value |
   |-------------|-------|
   | `KEYSTORE_BASE64` | Open `android_flutter/keystore-base64.txt`, copy ALL content |
   | `KEYSTORE_PASSWORD` | `SalonApp2026!` |
   | `KEY_PASSWORD` | `SalonApp2026!` |
   | `KEY_ALIAS` | `salon-app-key` |

4. **Verify all 4 secrets appear in the list**

Done! ✅

---

## 📋 Secret Values Reference

```
KEYSTORE_BASE64    = [Content of android_flutter/keystore-base64.txt]
KEYSTORE_PASSWORD  = SalonApp2026!
KEY_PASSWORD       = SalonApp2026!
KEY_ALIAS          = salon-app-key
```

### How to Get KEYSTORE_BASE64:

**Windows PowerShell:**
```powershell
Get-Content android_flutter\keystore-base64.txt -Raw
```

**macOS/Linux:**
```bash
cat android_flutter/keystore-base64.txt
```

Copy the entire output and paste it as the secret value.

---

## 🧪 Test Your Setup

After adding secrets, test the workflow:

```bash
git tag v1.3.0
git push origin v1.3.0
```

Then monitor:
```
https://github.com/mrabolfazl/futsal-booking-system/actions
```

Expected result after ~10 minutes:
- ✅ All jobs pass
- ✅ Signed APK available
- ✅ Signed AAB available
- ✅ Release created with all artifacts

---

## 📚 Documentation

- **Quick Start:** [`docs/QUICK_START_CI_CD.md`](docs/QUICK_START_CI_CD.md)
- **Full Setup Guide:** [`docs/ANDROID_SIGNING_SETUP.md`](docs/ANDROID_SIGNING_SETUP.md)
- **Manual Instructions:** [`docs/MANUAL_SECRETS_SETUP.md`](docs/MANUAL_SECRETS_SETUP.md)
- **Workflow Docs:** [`.github/workflows/README.md`](.github/workflows/README.md)

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Script says "gh not found" | Install GitHub CLI from https://cli.github.com/ |
| "Not authenticated" error | Run `gh auth login` first |
| Secret value too long | Make sure you're copying the entire base64 file |
| Build still fails | Check secret names are EXACTLY as shown (case-sensitive) |

---

## 🔐 Security Notes

✅ Keystore file is in `.gitignore` (won't be committed)
✅ Secrets are encrypted by GitHub
✅ Secrets are masked in logs
✅ Only repository admins can view/manage secrets

❌ NEVER share keystore passwords
❌ NEVER commit .jks files
❌ NEVER store passwords in code

---

**Status:** Ready to configure ✅  
**Time required:** 2-5 minutes  
**Difficulty:** Easy
