#!/bin/bash

# ============================================
# Rork Nightlife Backend - Deployment Script
# ============================================
# Deploys backend to production server
# Usage: ./scripts/deploy-backend.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${YELLOW}→ $1${NC}"; }

print_info "Starting backend deployment..."

# Check if .env.production exists
if [ ! -f "backend/.env.production" ]; then
    print_error ".env.production not found!"
    print_info "Copy backend/.env.production.example and configure it"
    exit 1
fi

# Navigate to backend directory
cd backend

# Install production dependencies
print_info "Installing production dependencies..."
npm ci --production

# Run tests (optional)
# print_info "Running tests..."
# npm test

# PM2 deployment (if using PM2)
if command -v pm2 &> /dev/null; then
    print_info "Deploying with PM2..."

    # Stop existing app
    pm2 stop rork-api || true

    # Delete existing app
    pm2 delete rork-api || true

    # Start app
    pm2 start src/server.js \
        --name rork-api \
        --env production \
        --instances 2 \
        --exec-mode cluster

    # Save PM2 configuration
    pm2 save

    print_success "Deployed with PM2!"
else
    print_info "PM2 not found. Starting with Node.js..."
    NODE_ENV=production node src/server.js &
fi

print_success "Backend deployment completed!"
print_info "Check status: pm2 status"
print_info "View logs: pm2 logs rork-api"
