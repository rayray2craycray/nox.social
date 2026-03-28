# 🎯 Complete Setup Guide - Rork Nightlife App

End-to-end setup guide for the complete contact and Instagram sync feature.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Testing the Integration](#testing-the-integration)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)

---

## 🌟 Overview

### What We're Building

**Contact & Instagram-Based Friend Suggestions**

Features:
- 📱 Phone contact sync with privacy (SHA-256 hashing)
- 📸 Instagram OAuth integration
- 🤝 Smart friend suggestions based on:
  - Phone contacts (priority: 100)
  - Instagram following (priority: 80)
  - Mutual friends (priority: 60)
- 🎨 Visual source badges showing connection type
- ⚡ Caching for performance
- 🔒 Production-ready security

### Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌──────────────┐
│  React Native   │────────▶│  Express API    │────────▶│   MongoDB    │
│   Mobile App    │         │   (Backend)     │         │   Database   │
└─────────────────┘         └─────────────────┘         └──────────────┘
        │                            │
        │                            ▼
        ▼                   ┌─────────────────┐
┌─────────────────┐        │  Instagram      │
│  Instagram      │        │  Graph API      │
│  OAuth Flow     │        └─────────────────┘
└─────────────────┘
```

---

## ⚙️ Prerequisites

### Required Software

1. **Node.js** (v18.0.0 or higher)
   ```bash
   node --version  # Check version
   ```
   Install: https://nodejs.org/

2. **Bun** (package manager - optional, can use npm)
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

3. **MongoDB** (v5.0 or higher)
   ```bash
   # macOS
   brew tap mongodb/brew
   brew install mongodb-community@7.0

   # Start MongoDB
   brew services start mongodb-community
   ```

4. **Git**
   ```bash
   git --version
   ```

5. **Expo CLI**
   ```bash
   npm install -g expo-cli
   ```

### Optional (Recommended)

- **Docker** (easiest backend setup)
- **MongoDB Compass** (database GUI)
- **Postman** (API testing)
- **ngrok** (for testing on real devices)

---

## 🔧 Backend Setup

### Option A: Docker (Recommended - Easiest)

```bash
# 1. Navigate to backend
cd backend

# 2. Copy environment file
cp .env.example .env

# 3. Start everything (MongoDB + API + Admin UI)
docker-compose up -d

# 4. Seed database with test users
docker-compose exec api npm run seed

# 5. Verify it's running
curl http://localhost:3000/health

# ✅ Backend running at http://localhost:3000
```

### Option B: Local Node.js

```bash
# 1. Navigate to backend
cd backend

# 2. Install dependencies and setup
npm run setup

# 3. Edit .env (if needed)
nano .env

# 4. Start MongoDB
brew services start mongodb-community

# 5. Seed database
npm run seed

# 6. Start server
npm run dev

# ✅ Backend running at http://localhost:3000
```

### Verify Backend

```bash
# Health check
curl http://localhost:3000/health

# Expected output:
# {"status":"healthy","timestamp":"2026-01-02...","uptime":123}

# Check seeded users
curl http://localhost:3000/api/social/sync/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumbers": ["3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d"],
    "userId": "test"
  }'

# Should return 1 match (Sarah Chen)
```

---

## 📱 Frontend Setup

### 1. Install Dependencies

```bash
# From project root
bun install

# Or with npm
npm install
```

### 2. Environment Configuration

Your `.env` is already configured for local development:

```env
# Already set:
API_BASE_URL=http://localhost:3000/api
NODE_ENV=development
ENABLE_CONTACT_SYNC=true
ENABLE_INSTAGRAM_SYNC=true
```

### 3. Start the App

```bash
# Start Metro bundler
bun start

# Or
expo start
```

Choose platform:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code for physical device

---

## 🧪 Testing the Integration

### Test 1: Contact Sync (Mock Data)

**Default behavior in development:**
- Uses mock data (no API calls)
- Returns 5 predefined matches
- No permissions needed

**How to test:**
1. Open app
2. Navigate to Profile tab
3. Scroll to "People You May Know"
4. See 5 suggestions with source badges

### Test 2: Contact Sync (Real API)

To test with real backend API:

1. **Add test phone numbers to your phone contacts:**
   ```
   Sarah Chen: +14155551001
   Marcus Wright: +14155551002
   Emma Rodriguez: +14155551003
   ```

2. **Enable production mode temporarily:**
   ```env
   # In .env
   NODE_ENV=production  # This will use real API
   ```

3. **Restart app and grant contacts permission**

4. **View matches:**
   - Navigate to Profile
   - Scroll to "People You May Know"
   - Should see matches with green "In your contacts" badge

### Test 3: Instagram Integration (Mock Data)

**Default in development:**
- Mock OAuth flow (1.5 second delay)
- Mock following list (5 users)
- No real Instagram account needed

**How to test:**
1. Navigate to Profile/Settings
2. Tap "Connect Instagram"
3. Wait for mock OAuth simulation
4. See "Connected" status
5. View suggestions with purple "You follow @username" badges

### Test 4: Instagram Integration (Real OAuth)

To test real Instagram:

1. **Configure Instagram App:**
   - Go to https://developers.facebook.com/apps/
   - Create app and add Instagram Graph API
   - Add redirect URI: `nox://instagram-callback`
   - Copy credentials to `backend/.env`:
     ```env
     INSTAGRAM_CLIENT_ID=your_id
     INSTAGRAM_CLIENT_SECRET=your_secret
     ```

2. **Enable production mode:**
   ```env
   # In .env
   NODE_ENV=production
   ```

3. **Test flow:**
   - Tap "Connect Instagram" in app
   - Real Instagram login page opens
   - Authorize app
   - Backend exchanges code for token
   - Following list fetched and matched

### Test 5: End-to-End Flow

**Complete integration test:**

1. **Start backend** (Docker or local)
2. **Verify health:** `curl http://localhost:3000/health`
3. **Start mobile app:** `bun start`
4. **Add test contacts** to your phone
5. **Open app** and navigate to Profile
6. **Grant contacts permission** when prompted
7. **View suggestions** - should see:
   - Green badges for contacts
   - Purple badges for Instagram
   - Blue badges for mutuals
8. **Connect Instagram** (mock or real)
9. **Verify new suggestions** appear

---

## 🚀 Production Deployment

### Backend Deployment

#### Option 1: Railway (Recommended)

```bash
cd backend

# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add MongoDB
railway add mongodb

# Deploy
railway up

# Set environment variables in Railway dashboard:
# - INSTAGRAM_CLIENT_ID
# - INSTAGRAM_CLIENT_SECRET
# - NODE_ENV=production
```

#### Option 2: Heroku

```bash
cd backend

# Install Heroku CLI
brew install heroku

# Login
heroku login

# Create app
heroku create rork-nightlife-api

# Add MongoDB Atlas
heroku addons:create mongodbatlas:M0

# Set config
heroku config:set INSTAGRAM_CLIENT_ID=your_id
heroku config:set INSTAGRAM_CLIENT_SECRET=your_secret
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

#### Option 3: Docker on VPS

```bash
# SSH to server
ssh user@your-server

# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone repo
git clone https://github.com/yourusername/rork-nightlife-app.git
cd rork-nightlife-app/backend

# Configure .env
nano .env

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

### Frontend Deployment

#### Update Production API URL

```env
# .env
API_BASE_URL=https://your-backend-url.railway.app/api
NODE_ENV=production
```

#### Build and Submit

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

## 🐛 Troubleshooting

### Backend Issues

#### "Cannot connect to MongoDB"

**Docker:**
```bash
docker-compose logs mongodb
docker-compose restart mongodb
```

**Local:**
```bash
brew services restart mongodb-community
mongosh  # Test connection
```

#### "Port 3000 already in use"

```bash
lsof -i :3000
kill -9 <PID>

# Or change port in backend/.env
PORT=3001
```

#### "Instagram API error"

1. Check `backend/.env` has correct credentials
2. Verify redirect URI in Instagram app settings
3. Check backend logs: `docker-compose logs -f api`

### Frontend Issues

#### "Network request failed"

**Causes:**
- Backend not running
- Wrong API_BASE_URL in `.env`
- CORS issues

**Solutions:**
```bash
# 1. Check backend is running
curl http://localhost:3000/health

# 2. Restart Metro bundler
# Kill and run: bun start --clear

# 3. For iOS Simulator, use localhost
API_BASE_URL=http://localhost:3000/api

# 4. For Android Emulator, use host IP
API_BASE_URL=http://10.0.2.2:3000/api

# 5. For real device, use ngrok
ngrok http 3000
# Then use: API_BASE_URL=https://abc123.ngrok.io/api
```

#### "No suggestions appearing"

**Development mode (mock data):**
1. Check console for errors
2. Verify `NODE_ENV=development` in `.env`
3. Restart app

**Production mode (real API):**
1. Backend running: `curl http://localhost:3000/health`
2. Database seeded: `npm run seed` in backend
3. Check app logs for API errors
4. Verify permissions granted (contacts)

#### "Instagram connection fails"

**Mock mode:**
- Should work automatically
- Check console for errors

**Production mode:**
1. Instagram credentials in `backend/.env`?
2. Redirect URI correct in Instagram app?
3. Backend restarted after env changes?
4. Check backend logs for OAuth errors

---

## 📚 Additional Resources

### Documentation

- [Backend README](./backend/README.md) - Full backend API documentation
- [Backend Quickstart](./backend/QUICKSTART.md) - 5-minute backend setup
- [Production Deployment](./PRODUCTION_DEPLOYMENT.md) - Detailed production guide
- [Getting Started](./GETTING_STARTED.md) - Feature overview

### Test Data (from `npm run seed`)

**Phone Numbers:**
```
+14155551001 - Sarah Chen
+14155551002 - Marcus Wright
+14155551003 - Emma Rodriguez
+14155551004 - Jordan Kim
+14155551005 - Taylor Brooks
+14155551006 - Alex Morgan
+14155551007 - Chris Anderson
+14155551008 - Sam Taylor
+14155551009 - Jamie Lee
+14155551010 - Pat Rivera
```

**Instagram Usernames:**
```
@sarah_vibes
@marcus_nightlife
@emma_techno
@jordan.edm
@taylor_party
@alex_nightowl
@chris_beats
@sam_clubs
@jamie_rave
@pat_underground
```

### API Endpoints

```
Health:              GET  /health
Contact Sync:        POST /api/social/sync/contacts
Instagram Sync:      POST /api/social/sync/instagram
Instagram Token:     POST /api/auth/instagram/token
Token Refresh:       POST /api/auth/instagram/refresh
```

---

## ✅ Completion Checklist

### Development Setup
- [ ] Backend running (Docker or local)
- [ ] MongoDB running and seeded
- [ ] Backend health check passes
- [ ] Mobile app starts without errors
- [ ] Mock suggestions appear in app
- [ ] Backend logs visible (no errors)

### API Integration
- [ ] Test phone numbers in contacts
- [ ] Contact sync returns matches
- [ ] Instagram mock OAuth works
- [ ] Suggestions display with badges
- [ ] Cache working (check logs)

### Production Ready
- [ ] Instagram app configured
- [ ] Backend deployed
- [ ] Environment variables set
- [ ] Real OAuth flow tested
- [ ] HTTPS endpoints
- [ ] Error tracking (Sentry)
- [ ] Monitoring enabled

---

## 🎉 Success!

If all checks pass, your app is fully functional with:

✅ Contact-based friend suggestions
✅ Instagram-based friend suggestions
✅ Secure API communication
✅ Privacy-focused (phone hashing)
✅ Production-ready backend
✅ Beautiful UI with source badges

**Next Steps:**
1. Deploy backend to production
2. Configure Instagram app
3. Test on real devices
4. Submit to App Store / Play Store

---

## 💬 Support

- GitHub Issues: [Report a bug](https://github.com/yourusername/rork-nightlife-app/issues)
- Backend Logs: `docker-compose logs -f api`
- App Logs: Check Expo console
- Database: MongoDB Compass or Mongo Express

**Happy coding! 🚀**
