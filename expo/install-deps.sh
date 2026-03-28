#!/bin/bash

# Nox Nightlife App - Dependency Installation Script
# This script installs the required production dependencies

echo "🚀 Installing Nox Nightlife App dependencies..."
echo ""

# Check if bun is available
if command -v bun &> /dev/null; then
    echo "✅ Using bun package manager"
    bun install
elif command -v npm &> /dev/null; then
    echo "✅ Using npm package manager"
    npm install
elif command -v yarn &> /dev/null; then
    echo "✅ Using yarn package manager"
    yarn install
else
    echo "❌ Error: No package manager found!"
    echo "Please install one of: bun, npm, or yarn"
    exit 1
fi

echo ""
echo "✅ Dependencies installed successfully!"
echo ""
echo "📦 New packages installed:"
echo "  - axios (v1.6.5) - HTTP client for API requests"
echo "  - expo-secure-store (v13.0.2) - Secure storage for sensitive data"
echo "  - zod (v3.22.4) - Runtime type validation"
echo ""
echo "🎉 You're ready to start!"
echo "Run: npm start (or bun start)"
echo ""
