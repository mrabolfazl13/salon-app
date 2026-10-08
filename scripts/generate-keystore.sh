#!/bin/bash
# Generate Android release keystore for production signing
# This script should be run locally and the keystore file should NEVER be committed to git

set -e

KEYSTORE_FILE="release-keystore.jks"
KEY_ALIAS="futsal-booking-key"

echo "🔐 Generating Android production keystore..."
echo ""
echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "   1. Keep this keystore file SAFE and PRIVATE"
echo "   2. NEVER commit it to version control"
echo "   3. Back it up in a secure location (password manager, encrypted storage)"
echo "   4. If lost, you CANNOT update your app on Play Store"
echo ""

# Check if keystore already exists
if [ -f "$KEYSTORE_FILE" ]; then
    echo "❌ Keystore already exists: $KEYSTORE_FILE"
    echo "   If you want to generate a new one, delete the existing file first."
    exit 1
fi

# Prompt for keystore password
read -sp "Enter keystore password (min 6 chars): " KEYSTORE_PASSWORD
echo ""
if [ ${#KEYSTORE_PASSWORD} -lt 6 ]; then
    echo "❌ Password too short (minimum 6 characters)"
    exit 1
fi

read -sp "Confirm keystore password: " KEYSTORE_PASSWORD_CONFIRM
echo ""
if [ "$KEYSTORE_PASSWORD" != "$KEYSTORE_PASSWORD_CONFIRM" ]; then
    echo "❌ Passwords do not match"
    exit 1
fi

# Prompt for key password
echo ""
echo "Key password (press Enter to use same as keystore password):"
read -sp "Enter key password: " KEY_PASSWORD
echo ""
if [ -z "$KEY_PASSWORD" ]; then
    KEY_PASSWORD=$KEYSTORE_PASSWORD
fi

# Key validity (years)
VALIDITY_YEARS=10000

# Distinguished name
echo ""
echo "Enter certificate information (press Enter for defaults):"
read -p "Your Name [Futsal Booking]: " CN
CN=${CN:-"Futsal Booking"}

read -p "Organization Unit [Mobile]:" OU
OU=${OU:-"Mobile"}

read -p "Organization [Your Company]:" O
O=${O:-"Your Company"}

read -p "City [Tehran]:" L
L=${L:-"Tehran"}

read -p "State/Province [Tehran]:" ST
ST=${ST:-"Tehran"}

read -p "Country Code [IR]:" C
C=${C:-"IR"}

echo ""
echo "Generating keystore..."

# Generate keystore
keytool -genkeypair \
    -v \
    -keystore "$KEYSTORE_FILE" \
    -alias "$KEY_ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity $VALIDITY_YEARS \
    -storepass "$KEYSTORE_PASSWORD" \
    -keypass "$KEY_PASSWORD" \
    -dname "CN=$CN, OU=$OU, O=$O, L=$L, ST=$ST, C=$C"

echo ""
echo "✅ Keystore generated successfully!"
echo ""
echo "📁 File: $KEYSTORE_FILE"
echo "🔑 Alias: $KEY_ALIAS"
echo ""
echo "⚠️  NEXT STEPS:"
echo ""
echo "1. Convert to base64 for GitHub secret:"
echo "   cat $KEYSTORE_FILE | base64 -w 0"
echo ""
echo "2. Add these secrets to GitHub:"
echo "   - KEYSTORE_BASE64: (output from step 1)"
echo "   - KEYSTORE_PASSWORD: $KEYSTORE_PASSWORD"
echo "   - KEY_ALIAS: $KEY_ALIAS"
echo "   - KEY_PASSWORD: $KEY_PASSWORD"
echo ""
echo "3. Verify the keystore:"
echo "   keytool -list -keystore $KEYSTORE_FILE"
echo ""
echo "4. BACK UP THIS FILE IMMEDIATELY!"
echo ""
