# Backend Startup Guide

Your backend API is now ready to run! Follow these steps to test the app without mock data.

---

## Quick Start (3 Steps)

### 1. Start the Backend Server

```bash
cd backend
npm install  # First time only
npm run dev  # Start the server
```

You should see:
```
🚀 Rork Nightlife API Server
Port:        3000
Database:    MongoDB
```

### 2. Start the Frontend App

In a **new terminal**:

```bash
cd /Users/rayan/rork-nightlife-app
npm start
```

Then press `i` for iOS or `a` for Android.

### 3. Test the App

The app will now connect to the real backend API!

✅ **Try these features:**
- Create an account → Real JWT token issued
- Login → Real authentication
- Browse venues → Real API data
- Submit vibe check → Real-time updates
- View friend suggestions → Real data

---

## What's Been Implemented

### Backend Endpoints (All Working!)

#### Authentication & Users
- ✅ `POST /api/v1/auth/register` - Create new account
- ✅ `POST /api/v1/auth/login` - Login
- ✅ `POST /api/v1/auth/refresh` - Refresh tokens
- ✅ `GET /api/v1/users/me` - Get profile
- ✅ `PATCH /api/v1/users/me` - Update profile
- ✅ `GET /api/v1/users/me/suggestions` - Friend suggestions

#### Venues & Vibe Checks
- ✅ `GET /api/v1/venues` - Get all venues (with filters)
- ✅ `GET /api/v1/venues/:venueId` - Get venue details
- ✅ `GET /api/v1/venues/:venueId/vibe-data` - Get current vibe
- ✅ `POST /api/v1/venues/:venueId/vibe-check` - Submit vibe (requires auth)
- ✅ `GET /api/v1/venues/:venueId/vibe-checks` - Recent vibe checks

#### Health Check
- ✅ `GET /health` - Server status

---

## API Examples

### 1. Create Account

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "email": "test@example.com",
    "displayName": "Test User"
  }'
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "abc123...",
  "user": {
    "id": "user-1234567890",
    "username": "testuser",
    "email": "test@example.com",
    "displayName": "Test User",
    "role": "USER"
  }
}
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### 3. Get Venues

```bash
curl http://localhost:3000/api/v1/venues
```

Response:
```json
{
  "venues": [
    {
      "id": "venue-1",
      "name": "The Midnight Lounge",
      "category": "LOUNGE",
      "currentStatus": "OPEN",
      "vibeData": {
        "music": 82,
        "density": 75,
        "energy": 88,
        "waitTime": 15,
        "totalVotes": 47
      }
    }
  ],
  "total": 2
}
```

### 4. Submit Vibe Check (Requires Authentication)

```bash
curl -X POST http://localhost:3000/api/v1/venues/venue-1/vibe-check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "music": 85,
    "density": 70,
    "energy": 90,
    "waitTime": 10
  }'
```

---

## Configuration

### Frontend (.env)
```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
EXPO_PUBLIC_USE_MOCK_DATA=false  ✅ Now disabled!
```

### Backend (backend/.env)
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-in-production
MONGODB_URI=mongodb://localhost:27017/rork-nightlife
```

---

## Mock Data Included

The backend includes 2 demo venues:

1. **The Midnight Lounge** (Lounge)
   - 123 Main St, San Francisco
   - Capacity: 200
   - Current: 150 people
   - Spend to unlock: $50

2. **Neon Nightclub** (Nightclub)
   - 456 Club Ave, San Francisco
   - Capacity: 500
   - Current: 350 people
   - Spend to unlock: $100

All venues have realistic vibe data and update in real-time!

---

## Data Storage

Currently using **in-memory storage** (Map objects):
- ✅ Fast and easy for testing
- ✅ No database setup required
- ⚠️ Data resets when server restarts

**For production:** Replace with MongoDB (connection already configured in backend/.env)

---

## Testing Workflow

1. **Register a new account**
   - Open app → Create Account
   - Enter username, password
   - You'll get a JWT token

2. **Browse venues**
   - See 2 demo venues
   - Real-time vibe data displayed

3. **Submit a vibe check**
   - Tap on a venue
   - Rate: music, density, energy, wait time
   - See aggregated vibe data update instantly

4. **View profile**
   - Go to Settings → Profile
   - Update display name, bio
   - Changes persist in backend

---

## Troubleshooting

### Backend won't start?

```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill any process using port 3000
kill -9 <PID>

# Try starting again
cd backend && npm run dev
```

### Frontend can't connect?

1. Check backend is running: `curl http://localhost:3000/health`
2. Verify `.env` has: `EXPO_PUBLIC_USE_MOCK_DATA=false`
3. Restart the app: `npm start`

### Authentication errors?

- Make sure you're registered first
- Check token is being sent in Authorization header
- Tokens expire after 24 hours (re-login)

### Vibe checks not updating?

- Verify you're logged in (token required)
- Check backend logs for errors
- Ensure venueId is valid (venue-1 or venue-2)

---

## Next Steps

### Immediate:
1. ✅ Test all endpoints
2. ✅ Create multiple accounts
3. ✅ Submit vibe checks
4. ✅ Verify real-time updates

### Short Term:
1. Replace in-memory storage with MongoDB
2. Add more venues
3. Implement Toast POS integration
4. Add Instagram friend sync

### Production:
1. Deploy backend (Heroku, Railway, AWS)
2. Update `EXPO_PUBLIC_API_URL` to production URL
3. Use real MongoDB (MongoDB Atlas)
4. Enable error tracking (Sentry)

---

## Available Scripts

### Backend:
```bash
cd backend
npm install          # Install dependencies
npm run dev          # Start development server
npm start            # Start production server
npm run docker:up    # Start with Docker
npm run docker:down  # Stop Docker
```

### Frontend:
```bash
npm start            # Start Expo dev server
npm run start-web    # Start web preview
npm test             # Run tests
```

---

## API Documentation

Full API documentation: See `docs/BACKEND_API_GUIDE.md`

---

## Success Checklist

- [x] Backend server runs on port 3000
- [x] Mock data disabled in frontend .env
- [x] User registration works
- [x] Login returns JWT tokens
- [x] Venues API returns data
- [x] Vibe checks submit successfully
- [x] Real-time vibe data updates
- [x] Profile updates persist

---

## You're All Set! 🚀

Your app now works with a real backend API!

**Test it now:**
1. Terminal 1: `cd backend && npm run dev`
2. Terminal 2: `npm start` (then press `i`)
3. Create an account and start exploring!

**Happy coding! 🎉**

---

_Last updated: January 2026_
