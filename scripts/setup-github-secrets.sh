#!/bin/bash
# Setup GitHub Actions Secrets for Android Signing
# Usage: ./scripts/setup-github-secrets.sh

set -e

echo "🔐 Setting up GitHub Actions Secrets for Android Signing"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) not found. Please install it first:"
    echo "   https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI. Please run:"
    echo "   gh auth login"
    exit 1
fi

# Get repository info
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "📦 Repository: $REPO"
echo ""

# Read keystore base64 content
# Tauri Android signing: keystore is NOT stored in git. Keep it next to the
# generated android project (frontend/src-tauri/gen/android/app/) or anywhere
# local — only the base64 of the file goes into GitHub Secrets.
KEYSTORE_FILE="frontend/src-tauri/gen/android/app/release-keystore.jks"
KEYSTORE_B64_FILE="frontend/src-tauri/gen/android/app/keystore-base64.txt"

if [ ! -f "$KEYSTORE_B64_FILE" ]; then
    echo "⚠️  Generating base64 encoding from keystore..."
    base64 -i "$KEYSTORE_FILE" > "$KEYSTORE_B64_FILE"
fi

KEYSTORE_BASE64=$(cat "$KEYSTORE_B64_FILE")

# Read signing credentials from the environment — never hardcode them here.
if [ -z "$KEYSTORE_PASSWORD" ] || [ -z "$KEY_PASSWORD" ] || [ -z "$KEY_ALIAS" ]; then
    echo "❌ Export KEYSTORE_PASSWORD, KEY_PASSWORD and KEY_ALIAS first."
    exit 1
fi

# Set secrets
echo "🔑 Adding KEYSTORE_BASE64 secret..."
echo "$KEYSTORE_BASE64" | gh secret set KEYSTORE_BASE64

echo "🔑 Adding KEYSTORE_PASSWORD secret..."
echo "$KEYSTORE_PASSWORD" | gh secret set KEYSTORE_PASSWORD

echo "🔑 Adding KEY_PASSWORD secret..."
echo "$KEY_PASSWORD" | gh secret set KEY_PASSWORD

echo "🔑 Adding KEY_ALIAS secret..."
echo "$KEY_ALIAS" | gh secret set KEY_ALIAS

echo ""
echo "✅ All secrets added successfully!"
echo ""
echo "📋 Added secrets:"
echo "   • KEYSTORE_BASE64 ($(wc -c < "$KEYSTORE_B64_FILE") bytes)"
echo "   • KEYSTORE_PASSWORD"
echo "   • KEY_PASSWORD"
echo "   • KEY_ALIAS"
echo ""
echo "🚀 Test your setup with:"
echo "   git tag v1.3.0-test"
echo "   git push origin v1.3.0-test"
echo ""
echo "Then check: https://github.com/$REPO/actions"
