# Rork Nightlife Backend API v2.0

Complete backend infrastructure with growth features for events, ticketing, social interactions, content, and retention.

## 🚀 Features

### Core Features
- **Authentication & Users**: JWT-based auth, user management
- **Venues & Vibe Checks**: Venue data and real-time vibe tracking
- **Contact & Instagram Sync**: Social graph building

### Growth Features (New!)
- **Group Purchases**: Split ticket costs with friends
- **Referrals**: Viral referral system with rewards
- **Events & Ticketing**: Full event management with QR codes
- **Guest Lists**: VIP and guest list management
- **Crews**: User groups/squads for nightlife
- **Challenges**: Gamified venue challenges
- **Performers**: DJ/artist profiles with content feeds
- **Highlight Videos**: 15-second ephemeral highlights
- **Dynamic Pricing**: Smart pricing based on demand/time
- **Price Alerts**: User notifications for price drops
- **Streaks**: Engagement tracking with milestones
- **Memories**: User timeline and memory creation

## 📋 Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 6.0
- npm or yarn

## 🛠️ Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy and configure the environment file:

```bash
cp .env.example .env
```

**Critical variables to update:**

- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `INSTAGRAM_CLIENT_ID` - Get from Facebook Developers
- `INSTAGRAM_CLIENT_SECRET` - Get from Facebook Developers

See `.env` for full configuration options.

### 3. Start MongoDB

```bash
# Using Homebrew (macOS)
brew services start mongodb-community

# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Verify connection
mongosh
```

### 4. Start Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server will start at: **http://localhost:3000**

Visit http://localhost:3000 to see all available endpoints.

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   └── database.js
│   ├── models/              # Mongoose models (13 models)
│   │   ├── GroupPurchase.js
│   │   ├── Referral.js
│   │   ├── Event.js
│   │   ├── Ticket.js
│   │   ├── GuestList.js
│   │   ├── Crew.js
│   │   ├── Challenge.js
│   │   ├── Performer.js
│   │   ├── HighlightVideo.js
│   │   ├── DynamicPricing.js
│   │   ├── PriceAlert.js
│   │   ├── Streak.js
│   │   └── Memory.js
│   ├── routes/              # API routes
│   │   ├── auth.routes.js
│   │   ├── users.routes.js
│   │   ├── venues.routes.js
│   │   ├── social.routes.js       # Contact/Instagram sync + Crews & Challenges
│   │   ├── growth.routes.js       # Group purchases & referrals
│   │   ├── events.routes.js       # Events, tickets, guest lists
│   │   ├── content.routes.js      # Performers & highlights
│   │   ├── pricing.routes.js      # Dynamic pricing & alerts
│   │   └── retention.routes.js    # Streaks & memories
│   └── server.js            # Express app
├── .env                     # Environment variables
└── package.json
```

## 🛣️ API Routes Overview

| Route Base | Description |
|------------|-------------|
| `/api/v1/users` | User management |
| `/api/v1/venues` | Venues & vibe checks |
| `/api/auth` | Authentication |
| `/api/social` | Contact/Instagram sync, crews, challenges |
| `/api/growth` | Group purchases & referrals |
| `/api/events` | Events, tickets, guest lists |
| `/api/content` | Performers & highlight videos |
| `/api/pricing` | Dynamic pricing & price alerts |
| `/api/retention` | Streaks & memories |
| `/health` | Health check |

## 📡 Key API Endpoints

### Phase 1: Group Purchases & Referrals (`/api/growth`)

**Create Group Purchase**
```bash
POST /api/growth/group-purchases
{
  "initiatorId": "507f1f77bcf86cd799439011",
  "venueId": "venue-123",
  "ticketType": "ENTRY",
  "totalAmount": 100.00,
  "maxParticipants": 5,
  "expiresAt": "2024-01-20T23:59:59Z"
}
```

**Apply Referral Code**
```bash
POST /api/growth/referrals/apply
{
  "referralCode": "ABC123",
  "userId": "507f1f77bcf86cd799439011"
}
```

### Phase 2: Events & Ticketing (`/api/events`)

**Purchase Ticket**
```bash
POST /api/events/tickets/purchase
{
  "eventId": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012",
  "tierId": "tier-123"
}
```

**Validate QR Code**
```bash
POST /api/events/tickets/validate
{
  "qrCode": "ABCD1234EFGH5678"
}
```

**Add to Guest List**
```bash
POST /api/events/guest-list
{
  "venueId": "venue-123",
  "guestName": "John Doe",
  "addedBy": "507f1f77bcf86cd799439011",
  "plusOnes": 2,
  "listType": "VIP"
}
```

### Phase 3: Crews & Challenges (`/api/social`)

**Create Crew**
```bash
POST /api/social/crews
{
  "name": "Weekend Warriors",
  "ownerId": "507f1f77bcf86cd799439011",
  "description": "Best squad in town"
}
```

**Join Challenge**
```bash
POST /api/social/challenges/:id/join
{
  "userId": "507f1f77bcf86cd799439011"
}
```

### Phase 4: Content (`/api/content`)

**Upload Highlight Video**
```bash
POST /api/content/highlights
{
  "videoUrl": "https://...",
  "thumbnailUrl": "https://...",
  "venueId": "venue-123",
  "userId": "507f1f77bcf86cd799439011",
  "duration": 15
}
```

**Follow Performer**
```bash
POST /api/content/performers/:id/follow
{
  "userId": "507f1f77bcf86cd799439011"
}
```

### Phase 5: Dynamic Pricing (`/api/pricing`)

**Get Current Pricing**
```bash
GET /api/pricing/dynamic/:venueId
```

**Create Price Alert**
```bash
POST /api/pricing/alerts
{
  "userId": "507f1f77bcf86cd799439011",
  "venueId": "venue-123",
  "targetDiscount": 20
}
```

### Phase 6: Retention (`/api/retention`)

**Increment Streak**
```bash
POST /api/retention/streaks/:id/increment
{
  "activityType": "CHECK_IN"
}
```

**Create Memory**
```bash
POST /api/retention/memories
{
  "userId": "507f1f77bcf86cd799439011",
  "venueId": "venue-123",
  "date": "2024-01-20T22:00:00Z",
  "type": "CHECK_IN",
  "content": {
    "caption": "Great night!"
  }
}
```

## 🔒 Security

- **Input Validation**: All endpoints use `express-validator`
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configured for allowed origins
- **Helmet.js**: Security headers
- **JWT Authentication**: Token-based auth
- **MongoDB Injection Protection**: Via Mongoose
- **Environment Variables**: Never commit secrets

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 📈 Database

### MongoDB Indexes

All models have optimized indexes:
- Compound indexes for common queries
- Text indexes for search
- TTL indexes for auto-expiration

### Models Summary

- **13 Mongoose models**
- **50+ API endpoints**
- **Full CRUD operations**
- **Complex queries with population**
- **Business logic in model methods**

## 🔄 Maintenance

Scheduled tasks (set up cron jobs):

```bash
# Expire old group purchases
POST /api/growth/maintenance/expire-purchases

# Mark event no-shows
POST /api/events/guest-list/mark-no-shows/:eventId

# Deactivate expired challenges
POST /api/social/challenges/maintenance/deactivate-expired

# Expire old highlights (24 hours)
POST /api/content/highlights/maintenance/expire-old

# Deactivate expired pricing
POST /api/pricing/maintenance/deactivate-expired-pricing

# Break expired streaks
POST /api/retention/maintenance/break-expired-streaks
```

## 🚢 Deployment

### Pre-Deployment Checklist

- [ ] Update all `.env` placeholder values
- [ ] Set `NODE_ENV=production`
- [ ] Generate secure `JWT_SECRET` (64+ characters)
- [ ] Configure production MongoDB URI
- [ ] Set up SSL/TLS certificate
- [ ] Configure firewall rules
- [ ] Set up monitoring (health checks)
- [ ] Configure backup strategy
- [ ] Test all endpoints

### Deployment Options

**Option 1: Railway**
```bash
railway login
railway init
railway add mongodb
railway up
```

**Option 2: Docker**
```bash
docker build -t rork-backend .
docker run -d -p 3000:3000 --env-file .env rork-backend
```

**Option 3: VPS (DigitalOcean, AWS)**
```bash
# Use PM2 for process management
npm install -g pm2
pm2 start src/server.js --name rork-api
pm2 startup
pm2 save
```

## 📊 Monitoring

### Health Endpoint

```bash
curl http://localhost:3000/health
```

Returns:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-18T12:00:00.000Z",
  "uptime": 123.45,
  "environment": "production"
}
```

### Logging

- **Development**: Pretty console logs
- **Production**: JSON logs (parseable)

### Recommended Monitoring

- Uptime monitoring (UptimeRobot, Pingdom)
- Error tracking (Sentry)
- Performance monitoring (New Relic, DataDog)
- Log aggregation (Loggly, Papertrail)

## 🔧 Troubleshooting

### MongoDB Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution**: Start MongoDB
```bash
brew services start mongodb-community
```

### JWT Secret Not Set

```
Error: JWT_SECRET is required
```

**Solution**: Generate and set in `.env`
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Rate Limit Exceeded

```
Too many requests from this IP
```

**Solution**: Adjust in `.env`
```env
RATE_LIMIT_MAX_REQUESTS=200
```

## 📚 Additional Documentation

- Full API documentation at root endpoint: `GET http://localhost:3000/`
- Model schemas: See `src/models/` directory
- Route definitions: See `src/routes/` directory

## 🤝 Support

For issues or questions:
- Check existing GitHub Issues
- Review API documentation at root endpoint
- Contact development team

## 📄 License

Proprietary - Rork Nightlife

---

**🎉 Backend v2.0 - Complete growth features implemented!**

Built with Express.js, MongoDB, and ❤️
