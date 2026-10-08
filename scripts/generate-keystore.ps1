# Generate Android release keystore for production signing (Windows PowerShell)
# This script should be run locally and the keystore file should NEVER be committed to git

$ErrorActionPreference = "Stop"

$KEYSTORE_FILE = "release-keystore.jks"
$KEY_ALIAS = "futsal-booking-key"

Write-Host "🔐 Generating Android production keystore..." -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANT SECURITY NOTES:" -ForegroundColor Yellow
Write-Host "   1. Keep this keystore file SAFE and PRIVATE"
Write-Host "   2. NEVER commit it to version control"
Write-Host "   3. Back it up in a secure location (password manager, encrypted storage)"
Write-Host "   4. If lost, you CANNOT update your app on Play Store"
Write-Host ""

# Check if keystore already exists
if (Test-Path $KEYSTORE_FILE) {
    Write-Host "❌ Keystore already exists: $KEYSTORE_FILE" -ForegroundColor Red
    Write-Host "   If you want to generate a new one, delete the existing file first."
    exit 1
}

# Prompt for keystore password
$securePassword = Read-Host "Enter keystore password (min 6 chars)" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$KEYSTORE_PASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

if ($KEYSTORE_PASSWORD.Length -lt 6) {
    Write-Host "❌ Password too short (minimum 6 characters)" -ForegroundColor Red
    exit 1
}

$secureConfirm = Read-Host "Confirm keystore password" -AsSecureString
$BSTR2 = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureConfirm)
$KEYSTORE_PASSWORD_CONFIRM = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR2)

if ($KEYSTORE_PASSWORD -ne $KEYSTORE_PASSWORD_CONFIRM) {
    Write-Host "❌ Passwords do not match" -ForegroundColor Red
    exit 1
}

# Key password
Write-Host ""
Write-Host "Key password (press Enter to use same as keystore password):"
$secureKeyPass = Read-Host "Enter key password" -AsSecureString
$BSTR3 = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKeyPass)
$KEY_PASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR3)

if ([string]::IsNullOrEmpty($KEY_PASSWORD)) {
    $KEY_PASSWORD = $KEYSTORE_PASSWORD
}

# Certificate information
Write-Host ""
Write-Host "Enter certificate information (press Enter for defaults):"
$CN = Read-Host "Your Name [Futsal Booking]"
if ([string]::IsNullOrEmpty($CN)) { $CN = "Futsal Booking" }

$OU = Read-Host "Organization Unit [Mobile]"
if ([string]::IsNullOrEmpty($OU)) { $OU = "Mobile" }

$O = Read-Host "Organization [Your Company]"
if ([string]::IsNullOrEmpty($O)) { $O = "Your Company" }

$L = Read-Host "City [Tehran]"
if ([string]::IsNullOrEmpty($L)) { $L = "Tehran" }

$ST = Read-Host "State/Province [Tehran]"
if ([string]::IsNullOrEmpty($ST)) { $ST = "Tehran" }

$C = Read-Host "Country Code [IR]"
if ([string]::IsNullOrEmpty($C)) { $C = "IR" }

Write-Host ""
Write-Host "Generating keystore..." -ForegroundColor Yellow

# Build distinguished name
$DN = "CN=$CN, OU=$OU, O=$O, L=$L, ST=$ST, C=$C"

# Generate keystore using keytool
& keytool -genkeypair `
    -v `
    -keystore $KEYSTORE_FILE `
    -alias $KEY_ALIAS `
    -keyalg RSA `
    -keysize 2048 `
    -validity 10000 `
    -storepass $KEYSTORE_PASSWORD `
    -keypass $KEY_PASSWORD `
    -dname $DN

Write-Host ""
Write-Host "✅ Keystore generated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 File: $KEYSTORE_FILE"
Write-Host "🔑 Alias: $KEY_ALIAS"
Write-Host ""
Write-Host "⚠️  NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Convert to base64 for GitHub secret (run in Git Bash or WSL):"
Write-Host "   cat $KEYSTORE_FILE | base64 -w 0"
Write-Host ""
Write-Host "2. Add these secrets to GitHub:"
Write-Host "   - KEYSTORE_BASE64: (output from step 1)"
Write-Host "   - KEYSTORE_PASSWORD: $KEYSTORE_PASSWORD"
Write-Host "   - KEY_ALIAS: $KEY_ALIAS"
Write-Host "   - KEY_PASSWORD: $KEY_PASSWORD"
Write-Host ""
Write-Host "3. Verify the keystore:"
Write-Host "   keytool -list -keystore $KEYSTORE_FILE"
Write-Host ""
Write-Host "4. BACK UP THIS FILE IMMEDIATELY!" -ForegroundColor Red
Write-Host ""
