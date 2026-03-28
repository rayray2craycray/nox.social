#!/bin/bash

# ============================================
# Rork Nightlife App - Production Build Script
# ============================================
# Builds both iOS and Android apps for production
# Usage: ./scripts/build-production.sh [ios|android|all]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    print_error "EAS CLI not found. Installing..."
    npm install -g eas-cli
fi

# Check if logged in to EAS
if ! eas whoami &> /dev/null; then
    print_error "Not logged in to EAS. Please login:"
    eas login
fi

# Determine build target
BUILD_TARGET=${1:-all}

print_info "Starting production build for: $BUILD_TARGET"
print_info "Environment: production"
print_info "API URL: https://api.rork.app"

# Build iOS
if [ "$BUILD_TARGET" = "ios" ] || [ "$BUILD_TARGET" = "all" ]; then
    print_info "Building iOS app for App Store..."

    eas build --platform ios --profile production --non-interactive

    if [ $? -eq 0 ]; then
        print_success "iOS build completed successfully!"
        print_info "Download with: eas build:download --platform ios --profile production"
    else
        print_error "iOS build failed"
        exit 1
    fi
fi

# Build Android
if [ "$BUILD_TARGET" = "android" ] || [ "$BUILD_TARGET" = "all" ]; then
    print_info "Building Android app for Play Store..."

    eas build --platform android --profile production --non-interactive

    if [ $? -eq 0 ]; then
        print_success "Android build completed successfully!"
        print_info "Download with: eas build:download --platform android --profile production"
    else
        print_error "Android build failed"
        exit 1
    fi
fi

print_success "Production build completed!"
print_info "Next steps:"
echo "  1. Download builds: eas build:download --profile production"
echo "  2. Submit to stores: eas submit --platform [ios|android] --profile production"
echo "  3. Monitor builds: eas build:list"
