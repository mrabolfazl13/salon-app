# Setup GitHub Actions Secrets for Android Signing (PowerShell)
# Usage: .\scripts\setup-github-secrets.ps1

Write-Host "🔐 Setting up GitHub Actions Secrets for Android Signing" -ForegroundColor Cyan
Write-Host ""

# Check if gh CLI is installed
try {
    $null = Get-Command gh -ErrorAction Stop
} catch {
    Write-Host "❌ GitHub CLI (gh) not found. Please install it first:" -ForegroundColor Red
    Write-Host "   https://cli.github.com/" -ForegroundColor Yellow
    exit 1
}

# Check if authenticated
try {
    $null = gh auth status 2>&1 | Where-Object { $_ -match "Logged in" }
} catch {
    Write-Host "❌ Not authenticated with GitHub CLI. Please run:" -ForegroundColor Red
    Write-Host "   gh auth login" -ForegroundColor Yellow
    exit 1
}

# Get repository info
$repoInfo = gh repo view --json nameWithOwner | ConvertFrom-Json
$repo = $repoInfo.nameWithOwner
Write-Host "📦 Repository: $repo" -ForegroundColor Green
Write-Host ""

# Read keystore base64 content
$keystoreB64File = "android_flutter/keystore-base64.txt"

if (-not (Test-Path $keystoreB64File)) {
    Write-Host "⚠️  Generating base64 encoding from keystore..." -ForegroundColor Yellow
    $keystoreBytes = [System.IO.File]::ReadAllBytes("android_flutter/release-keystore.jks")
    $base64String = [Convert]::ToBase64String($keystoreBytes)
    $base64String | Set-Content -Path $keystoreB64File -Encoding UTF8
}

$keystoreBase64 = Get-Content $keystoreB64File -Raw

# Set secrets
Write-Host "🔑 Adding KEYSTORE_BASE64 secret..." -ForegroundColor Cyan
$keystoreBase64 | gh secret set KEYSTORE_BASE64

Write-Host "🔑 Adding KEYSTORE_PASSWORD secret..." -ForegroundColor Cyan
"SalonApp2026!" | gh secret set KEYSTORE_PASSWORD

Write-Host "🔑 Adding KEY_PASSWORD secret..." -ForegroundColor Cyan
"SalonApp2026!" | gh secret set KEY_PASSWORD

Write-Host "🔑 Adding KEY_ALIAS secret..." -ForegroundColor Cyan
"salon-app-key" | gh secret set KEY_ALIAS

Write-Host ""
Write-Host "✅ All secrets added successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Added secrets:" -ForegroundColor Cyan
Write-Host "   • KEYSTORE_BASE64 ($((Get-Item $keystoreB64File).Length) bytes)"
Write-Host "   • KEYSTORE_PASSWORD"
Write-Host "   • KEY_PASSWORD"
Write-Host "   • KEY_ALIAS"
Write-Host ""
Write-Host "🚀 Test your setup with:" -ForegroundColor Yellow
Write-Host "   git tag v1.3.0-test"
Write-Host "   git push origin v1.3.0-test"
Write-Host ""
Write-Host "Then check: https://github.com/$repo/actions" -ForegroundColor Cyan
