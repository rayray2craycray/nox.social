# 🚀 Quick Start Guide - Backend Setup

Get the Rork Nightlife backend running in 5 minutes!

## Option 1: Docker (Easiest - Recommended)

Perfect if you have Docker installed. Everything runs in containers.

```bash
# 1. Navigate to backend
cd backend

# 2. Copy environment file
cp .env.example .env

# 3. Start everything (MongoDB + API + Admin UI)
docker-compose up -d

# 4. View logs
docker-compose logs -f

# 5. Check health
curl http://localhost:3000/health

# 6. Access MongoDB Admin UI
open http://localhost:8081
# Login: admin / admin

# 7. Seed database (optional)
docker-compose exec api npm run seed

# Done! API running at http://localhost:3000
```

### Docker Commands

```bash
# Stop everything
docker-compose down

# Restart
docker-compose restart

# View logs
docker-compose logs -f api

# Rebuild after code changes
docker-compose up --build
```

---

## Option 2: Local Node.js

Run directly on your machine.

### Prerequisites

1. Install Node.js 18+
   ```bash
   # macOS
   brew install node

   # Check version
   node --version  # Should be 18.0.0 or higher
   ```

2. Install MongoDB
   ```bash
   # macOS
   brew tap mongodb/brew
   brew install mongodb-community@7.0
   brew services start mongodb-community

   # Verify
   mongosh
   ```

### Setup

```bash
# 1. Navigate to backend
cd backend

# 2. Install dependencies & create .env
npm run setup

# 3. Edit .env with your credentials
nano .env  # or use your favorite editor

# 4. Seed database (creates 10 test users)
npm run seed

# 5. Start server
npm run dev

# API running at http://localhost:3000
```

---

## Testing the API

### 1. Health Check

```bash
curl http://localhost:3000/health
```

Expected output:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-02T10:00:00.000Z"
}
```

### 2. Test Contact Sync

The seed command creates users with these phone numbers:
- +14155551001 (Sarah Chen)
- +14155551002 (Marcus Wright)
- +14155551003 (Emma Rodriguez)
- ... and 7 more

Hash a phone number (client does this):
```bash
echo -n "+14155551001" | shasum -a 256
# Output: 3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d
```

Test the endpoint:
```bash
curl -X POST http://localhost:3000/api/social/sync/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumbers": ["3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d"],
    "userId": "test-user-123"
  }'
```

Expected output:
```json
{
  "matches": [
    {
      "hashedPhone": "3e23e...",
      "userId": "670abc...",
      "displayName": "Sarah Chen",
      "avatarUrl": "https://..."
    }
  ],
  "totalMatches": 1
}
```

### 3. View Database

**Using MongoDB Compass:**
1. Download: https://www.mongodb.com/products/compass
2. Connect to: `mongodb://localhost:27017`
3. Database: `rork-nightlife`
4. Collection: `users`

**Using Mongo Express (Docker only):**
1. Open: http://localhost:8081
2. Login: admin / admin
3. Select `rork-nightlife` database

**Using mongosh CLI:**
```bash
mongosh
use rork-nightlife
db.users.find().pretty()
```

---

## Connect Mobile App

Update your mobile app's `.env`:

```env
# If running locally
API_BASE_URL=http://localhost:3000/api

# If using Docker on Mac (from iOS Simulator)
API_BASE_URL=http://host.docker.internal:3000/api

# If using ngrok (for real device)
API_BASE_URL=https://your-ngrok-url.ngrok.io/api
```

### Using ngrok (for real devices)

```bash
# Install ngrok
brew install ngrok

# Start tunnel
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Update mobile app .env with this URL
```

---

## Next Steps

### 1. Configure Instagram OAuth

1. Go to https://developers.facebook.com/apps/
2. Create a new app
3. Add Instagram Graph API product
4. Add redirect URI: `nox://instagram-callback`
5. Copy Client ID and Secret to `.env`:
   ```env
   INSTAGRAM_CLIENT_ID=your_client_id_here
   INSTAGRAM_CLIENT_SECRET=your_client_secret_here
   ```
6. Restart server

### 2. Test Instagram Flow

From mobile app:
1. Tap "Connect Instagram" in settings
2. Complete Instagram login
3. App receives auth code
4. Backend exchanges code for token
5. Backend fetches following list
6. Matches displayed in "People You May Know"

### 3. Monitor Logs

```bash
# Local Node.js
npm run dev  # Logs appear in terminal

# Docker
docker-compose logs -f api
```

---

## Troubleshooting

### "Cannot connect to MongoDB"

**Docker:**
```bash
docker-compose down
docker-compose up -d mongodb
docker-compose logs mongodb
```

**Local:**
```bash
brew services restart mongodb-community
mongosh  # Test connection
```

### "Port 3000 already in use"

```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use a different port in .env
PORT=3001
```

### "Instagram API errors"

1. Verify credentials in `.env`
2. Check redirect URI matches Instagram app settings
3. Ensure using valid authorization code (they expire quickly)
4. Check logs: `docker-compose logs -f api`

### "No matches found" in contact sync

1. Verify database was seeded: `npm run seed`
2. Check phone number was hashed correctly (64-char hex string)
3. View database to confirm users exist
4. Check logs for errors

---

## Production Deployment

See [PRODUCTION_DEPLOYMENT.md](../PRODUCTION_DEPLOYMENT.md) for:
- Railway deployment
- Heroku deployment
- AWS/DigitalOcean deployment
- Environment configuration
- Security best practices

---

## Useful Commands

```bash
# Development
npm run dev          # Start with auto-reload
npm run seed         # Seed database
npm test             # Run tests
npm run lint         # Check code style

# Docker
npm run docker:up    # Start containers
npm run docker:down  # Stop containers
npm run docker:logs  # View logs

# Database
mongosh              # MongoDB shell
npm run seed         # Create test data
```

---

## Support

- Documentation: [README.md](./README.md)
- Production Guide: [PRODUCTION_DEPLOYMENT.md](../PRODUCTION_DEPLOYMENT.md)
- Issues: [GitHub Issues](https://github.com/yourusername/rork-nightlife-app/issues)

---

**🎉 You're all set! The backend is ready to handle contact and Instagram sync.**

Test it by:
1. Starting the mobile app
2. Adding test phone numbers to your contacts
3. Watching matches appear in "People You May Know"
