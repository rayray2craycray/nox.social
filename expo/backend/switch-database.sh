#!/bin/bash

# MongoDB Database Switcher
# Switch between local MongoDB and MongoDB Atlas

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║   MongoDB Database Switcher            ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# Backup current .env
if [ -f .env ]; then
  cp .env .env.backup
  echo -e "${GREEN}✓${NC} Backed up current .env to .env.backup"
fi

echo ""
echo "Select database to use:"
echo ""
echo "  1) Local MongoDB (Docker)"
echo "  2) MongoDB Atlas (Production)"
echo "  3) Restore from backup"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
  1)
    echo ""
    echo -e "${YELLOW}Switching to Local MongoDB...${NC}"
    cat > .env.tmp << 'EOF'
# Local MongoDB (Docker)
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://admin:password123@localhost:27017/rork-nightlife?authSource=admin
MONGODB_TEST_URI=mongodb://admin:password123@localhost:27017/rork-nightlife-test?authSource=admin

# Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production-minimum-32-characters
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# API Security
API_KEY=your-api-key-for-client-authentication-change-this

# CORS
ALLOWED_ORIGINS=http://localhost:19006,exp://localhost:19000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

    # Preserve Instagram credentials if they exist
    if [ -f .env ]; then
      INSTAGRAM_CLIENT_ID=$(grep INSTAGRAM_CLIENT_ID .env | cut -d '=' -f2)
      INSTAGRAM_CLIENT_SECRET=$(grep INSTAGRAM_CLIENT_SECRET .env | cut -d '=' -f2)

      if [ ! -z "$INSTAGRAM_CLIENT_ID" ]; then
        echo "" >> .env.tmp
        echo "# Instagram API" >> .env.tmp
        echo "INSTAGRAM_CLIENT_ID=$INSTAGRAM_CLIENT_ID" >> .env.tmp
        echo "INSTAGRAM_CLIENT_SECRET=$INSTAGRAM_CLIENT_SECRET" >> .env.tmp
        echo "INSTAGRAM_REDIRECT_URI=nox://instagram-callback" >> .env.tmp
      fi
    fi

    mv .env.tmp .env
    echo -e "${GREEN}✓${NC} Switched to Local MongoDB"
    echo ""
    echo "Connection: mongodb://localhost:27017/rork-nightlife"
    echo ""
    echo "To start local MongoDB:"
    echo "  docker-compose up -d"
    ;;

  2)
    echo ""
    echo -e "${YELLOW}Switching to MongoDB Atlas...${NC}"
    echo ""
    read -p "Enter Atlas connection string: " atlas_uri

    if [ -z "$atlas_uri" ]; then
      echo -e "${RED}✗${NC} Connection string cannot be empty"
      exit 1
    fi

    cat > .env.tmp << EOF
# MongoDB Atlas (Production)
PORT=3000
NODE_ENV=production

# Database
MONGODB_URI=$atlas_uri

# Security - GENERATE NEW SECRETS FOR PRODUCTION!
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# API Security
API_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# CORS - UPDATE WITH YOUR PRODUCTION URLS
ALLOWED_ORIGINS=https://yourapp.com,https://www.yourapp.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

    # Preserve Instagram credentials if they exist
    if [ -f .env ]; then
      INSTAGRAM_CLIENT_ID=$(grep INSTAGRAM_CLIENT_ID .env | cut -d '=' -f2)
      INSTAGRAM_CLIENT_SECRET=$(grep INSTAGRAM_CLIENT_SECRET .env | cut -d '=' -f2)

      if [ ! -z "$INSTAGRAM_CLIENT_ID" ]; then
        echo "" >> .env.tmp
        echo "# Instagram API" >> .env.tmp
        echo "INSTAGRAM_CLIENT_ID=$INSTAGRAM_CLIENT_ID" >> .env.tmp
        echo "INSTAGRAM_CLIENT_SECRET=$INSTAGRAM_CLIENT_SECRET" >> .env.tmp
        echo "INSTAGRAM_REDIRECT_URI=your-production-redirect-uri" >> .env.tmp
      fi
    fi

    mv .env.tmp .env
    echo -e "${GREEN}✓${NC} Switched to MongoDB Atlas"
    echo ""
    echo "Connection: $(echo $atlas_uri | sed 's/:\/\/[^:]*:[^@]*@/:\/\/***:***@/')"
    echo ""
    echo -e "${YELLOW}Important:${NC}"
    echo "  • New JWT_SECRET and API_KEY generated"
    echo "  • Update ALLOWED_ORIGINS with your production URLs"
    echo "  • Update Instagram redirect URI for production"
    ;;

  3)
    if [ -f .env.backup ]; then
      cp .env.backup .env
      echo -e "${GREEN}✓${NC} Restored .env from backup"
    else
      echo -e "${RED}✗${NC} No backup file found"
      exit 1
    fi
    ;;

  *)
    echo -e "${RED}✗${NC} Invalid choice"
    exit 1
    ;;
esac

echo ""
echo -e "${BLUE}Testing connection...${NC}"
node test-atlas-connection.js

echo ""
echo -e "${GREEN}✓${NC} Database switch complete!"
echo ""
