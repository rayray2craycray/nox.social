# Environment Variables Configuration Guide

## Overview

This guide shows how to properly configure environment variables for both development and production environments.

---

## Backend Environment Variables

### 1. Create `.env` File

Create `/backend/.env` in the backend directory:

```bash
# =================================
# SERVER CONFIGURATION
# =================================
PORT=3000
NODE_ENV=development

# =================================
# DATABASE
# =================================
# Development (Local MongoDB)
MONGODB_URI=mongodb://localhost:27017/rork

# Production (MongoDB Atlas)
# MONGODB_URI=mongodb+srv://rork-admin:YOUR_PASSWORD@rork-cluster.xxxxx.mongodb.net/rork?retryWrites=true&w=majority

# =================================
# JWT AUTHENTICATION
# =================================
JWT_SECRET=your-super-secret-key-CHANGE-THIS-IN-PRODUCTION-use-at-least-64-random-characters
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# =================================
# CLOUDINARY
# =================================
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcd1234EFGH5678ijkl
CLOUDINARY_UPLOAD_PRESET=rork-mobile

# =================================
# CORS (Frontend URLs)
# =================================
# Development
CORS_ORIGIN=http://localhost:8081,exp://192.168.1.100:8081

# Production
# CORS_ORIGIN=https://rork.app,https://www.rork.app

# =================================
# EMAIL (Optional - for password reset)
# =================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=Rork Nightlife <noreply@rork.app>

# =================================
# PUSH NOTIFICATIONS (Future)
# =================================
EXPO_PUSH_TOKEN=ExponentPushToken[your-token-here]

# =================================
# RATE LIMITING
# =================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# =================================
# FILE UPLOAD LIMITS
# =================================
MAX_IMAGE_SIZE_MB=10
MAX_VIDEO_SIZE_MB=50

# =================================
# LOGGING
# =================================
LOG_LEVEL=debug
LOG_FILE_PATH=./logs/app.log

# =================================
# STRIPE (Optional - for payments)
# =================================
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# =================================
# SENTRY (Optional - for error tracking)
# =================================
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# =================================
# REDIS (Optional - for caching)
# =================================
REDIS_URL=redis://localhost:6379
```

### 2. Create `.env.example`

Create `/backend/.env.example` (commit this to Git):

```bash
# =================================
# SERVER CONFIGURATION
# =================================
PORT=3000
NODE_ENV=development

# =================================
# DATABASE
# =================================
MONGODB_URI=mongodb://localhost:27017/rork

# =================================
# JWT AUTHENTICATION
# =================================
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# =================================
# CLOUDINARY
# =================================
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_UPLOAD_PRESET=

# =================================
# CORS
# =================================
CORS_ORIGIN=

# =================================
# EMAIL
# =================================
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=
```

### 3. Load Environment Variables

In `/backend/server.ts`:

```typescript
import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

// Then import other modules
import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/database';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS
const corsOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:8081'];
app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));

// Connect database
connectDatabase();

// ... rest of your server code
```

---

## Frontend Environment Variables

### 1. Create `.env` File

Create `/Users/rayan/rork-nightlife-app/.env`:

```bash
# =================================
# API CONFIGURATION
# =================================
# Development
API_URL_IOS=http://localhost:3000
API_URL_ANDROID=http://10.0.2.2:3000

# Production
API_URL_PRODUCTION=https://api.rork.app

# =================================
# CLOUDINARY (For direct uploads)
# =================================
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=rork-mobile

# =================================
# FEATURES FLAGS
# =================================
EXPO_PUBLIC_ENABLE_ANALYTICS=false
EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=false
EXPO_PUBLIC_ENABLE_SOCIAL_SHARING=true

# =================================
# SENTRY (Optional)
# =================================
EXPO_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# =================================
# APP CONFIGURATION
# =================================
EXPO_PUBLIC_APP_NAME=Rork Nightlife
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_API_TIMEOUT=30000

# =================================
# EXTERNAL SERVICES
# =================================
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXX
```

### 2. Create `.env.example`

Create `/Users/rayan/rork-nightlife-app/.env.example`:

```bash
# API URLs
API_URL_IOS=http://localhost:3000
API_URL_ANDROID=http://10.0.2.2:3000
API_URL_PRODUCTION=

# Cloudinary
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=

# Feature flags
EXPO_PUBLIC_ENABLE_ANALYTICS=false
EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=false
EXPO_PUBLIC_ENABLE_SOCIAL_SHARING=true

# App config
EXPO_PUBLIC_APP_NAME=Rork Nightlife
EXPO_PUBLIC_APP_VERSION=1.0.0
```

### 3. Access Environment Variables

In React Native with Expo:

```typescript
// Using Expo's environment variables
const API_URL = __DEV__
  ? Platform.OS === 'android'
    ? process.env.API_URL_ANDROID
    : process.env.API_URL_IOS
  : process.env.API_URL_PRODUCTION;

// Accessing public variables (EXPO_PUBLIC_* prefix)
const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
```

### 4. Update `app.config.ts`

Modify `/Users/rayan/rork-nightlife-app/app.config.ts`:

```typescript
export default {
  expo: {
    name: process.env.EXPO_PUBLIC_APP_NAME || 'Rork Nightlife',
    slug: 'rork-nightlife',
    version: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
    // ... other config

    extra: {
      apiUrl: process.env.API_URL_PRODUCTION,
      cloudinaryCloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME,
      enableAnalytics: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
    },
  },
};
```

---

## Production Environment Setup

### 1. Generate Secure JWT Secret

Use a cryptographically secure random string:

```bash
# On Mac/Linux
openssl rand -base64 64

# Or in Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

Output example:
```
xK8Pq2vN9mR7sT3wY6zA5bC8dE1fG4hI7jK0lM3nO6pQ9rS2tU5vW8xY1zA4bC7dE0fG3hI6jK9lM2nO5pQ8r
```

Use this as your `JWT_SECRET` in production.

### 2. Production `.env` (Backend)

Create `/backend/.env.production`:

```bash
PORT=3000
NODE_ENV=production

# MongoDB Atlas
MONGODB_URI=mongodb+srv://rork-admin:ACTUAL_PASSWORD@rork-cluster.xxxxx.mongodb.net/rork?retryWrites=true&w=majority

# Strong JWT secret
JWT_SECRET=xK8Pq2vN9mR7sT3wY6zA5bC8dE1fG4hI7jK0lM3nO6pQ9rS2tU5vW8xY1zA4bC7dE0fG3hI6jK9lM2nO5pQ8r
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Cloudinary production
CLOUDINARY_CLOUD_NAME=rork-nightlife-prod
CLOUDINARY_API_KEY=987654321098765
CLOUDINARY_API_SECRET=zyxw9876VUTS5432ponm
CLOUDINARY_UPLOAD_PRESET=rork-mobile

# Production frontend URL
CORS_ORIGIN=https://rork.app,https://www.rork.app,https://admin.rork.app

# Production email
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.actual-sendgrid-api-key
EMAIL_FROM=Rork Nightlife <noreply@rork.app>

# Sentry for error tracking
SENTRY_DSN=https://actual-sentry-dsn@xxxxx.ingest.sentry.io/12345

# Rate limiting (more restrictive)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=/var/log/rork/app.log
```

### 3. Deploy with Environment Variables

Different platforms have different methods:

#### Railway
1. Go to project settings
2. Navigate to "Variables" tab
3. Add each variable manually or import from `.env.production`

#### Render
1. Go to service settings
2. Click "Environment"
3. Add "Secret Files" → Upload `.env.production`

#### Heroku
```bash
heroku config:set JWT_SECRET=your-secret
heroku config:set MONGODB_URI=your-mongo-uri
# ... repeat for all variables
```

#### AWS/DigitalOcean
- Use .env file on server
- Or use AWS Parameter Store / Secrets Manager

---

## Security Best Practices

### 1. Never Commit Secrets to Git

Add to `.gitignore`:

```
# Environment variables
.env
.env.local
.env.development
.env.production
.env*.local

# Logs
logs
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db
```

### 2. Use Different Secrets for Each Environment

❌ **Wrong** (Same secret everywhere):
```
Development JWT_SECRET: "secret123"
Production JWT_SECRET: "secret123"
```

✅ **Correct** (Different secrets):
```
Development JWT_SECRET: "dev-secret-abc123"
Production JWT_SECRET: "xK8Pq2vN9mR7sT3wY6zA..."
```

### 3. Rotate Secrets Regularly

- JWT secrets: Every 90 days
- API keys: Every 180 days
- Database passwords: Every 180 days

### 4. Use Environment-Specific Values

```bash
# Development
CORS_ORIGIN=http://localhost:8081
LOG_LEVEL=debug

# Production
CORS_ORIGIN=https://rork.app
LOG_LEVEL=error
```

### 5. Validate Required Variables on Startup

Create `/backend/config/validate-env.ts`:

```typescript
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

export const validateEnv = () => {
  const missing = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((varName) => console.error(`   - ${varName}`));
    process.exit(1);
  }

  console.log('✅ All required environment variables present');
};
```

Use in `/backend/server.ts`:

```typescript
import { validateEnv } from './config/validate-env';

dotenv.config();
validateEnv(); // Fail fast if missing variables

// Continue with server setup...
```

---

## Environment Variable Templates

### Quick Setup Script

Create `/backend/setup-env.sh`:

```bash
#!/bin/bash

echo "🔧 Setting up environment variables..."

# Check if .env exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists. Backing up to .env.backup"
    cp .env .env.backup
fi

# Copy example
cp .env.example .env

echo "✅ Created .env file from .env.example"
echo ""
echo "📝 Please edit .env and add your actual values:"
echo "   - MongoDB connection string"
echo "   - JWT secret"
echo "   - Cloudinary credentials"
echo ""
echo "Run: nano .env"
```

Make executable:
```bash
chmod +x setup-env.sh
./setup-env.sh
```

---

## Testing Environment Variables

### 1. Create Test Script

Create `/backend/test-env.ts`:

```typescript
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Testing Environment Variables\n');

const testVars = [
  { name: 'PORT', value: process.env.PORT, required: false },
  { name: 'NODE_ENV', value: process.env.NODE_ENV, required: false },
  { name: 'MONGODB_URI', value: process.env.MONGODB_URI, required: true },
  { name: 'JWT_SECRET', value: process.env.JWT_SECRET, required: true },
  { name: 'CLOUDINARY_CLOUD_NAME', value: process.env.CLOUDINARY_CLOUD_NAME, required: true },
];

let hasErrors = false;

testVars.forEach((v) => {
  const exists = !!v.value;
  const status = exists ? '✅' : v.required ? '❌' : '⚠️ ';

  if (v.required && !exists) {
    hasErrors = true;
  }

  // Mask sensitive values
  let displayValue = v.value || 'NOT SET';
  if (exists && v.name.includes('SECRET') || v.name.includes('PASSWORD')) {
    displayValue = v.value!.substring(0, 10) + '...[MASKED]';
  }

  console.log(`${status} ${v.name.padEnd(25)} ${displayValue}`);
});

console.log('');

if (hasErrors) {
  console.log('❌ Some required variables are missing!');
  process.exit(1);
} else {
  console.log('✅ All environment variables configured correctly!');
}
```

Run it:
```bash
npx ts-node backend/test-env.ts
```

---

## Common Issues

### Issue: Variables Not Loading

**Solutions**:
1. Ensure `dotenv.config()` is called FIRST
2. Check `.env` file exists in correct location
3. Verify no syntax errors in `.env` (no spaces around `=`)
4. Restart server after changing `.env`

### Issue: Expo Not Reading Variables

**Problem**: Variables with `EXPO_PUBLIC_` prefix not accessible

**Solutions**:
1. Restart Expo with `npx expo start -c` (clear cache)
2. Ensure prefix is `EXPO_PUBLIC_` not just `PUBLIC_`
3. Check `app.config.ts` is properly configured

### Issue: Production Variables Not Working

**Solutions**:
1. Verify environment file is uploaded to server
2. Check platform-specific variable management (Railway, Heroku, etc.)
3. Ensure server reads correct `.env` file
4. Test with: `NODE_ENV=production node server.js`

---

## Next Steps

✅ Environment variables are now configured!

Continue to:
1. [Backend Auth Setup](./BACKEND_AUTH_SETUP.md) - Implement auth endpoints
2. [Replace 'user-me'](./REPLACE_USER_ME.md) - Use real auth everywhere
3. [Production Deployment](./PRODUCTION_DEPLOYMENT.md) - Deploy to production

---

**Last Updated**: 2026-01-18
