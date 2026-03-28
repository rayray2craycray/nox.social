# 🚀 Deploy to Heroku - Step by Step Guide

**Deployment Time:** 15-20 minutes
**Cost:** Free tier available (or $7/month for better performance)

---

## Prerequisites

- [ ] Heroku account (sign up at https://heroku.com)
- [ ] Heroku CLI installed
- [ ] Git installed
- [ ] MongoDB Atlas account (for database)

---

## Step 1: Install Heroku CLI (2 minutes)

### macOS
```bash
brew tap heroku/brew && brew install heroku
```

### Windows
Download from: https://devcenter.heroku.com/articles/heroku-cli

### Linux
```bash
curl https://cli-assets.heroku.com/install.sh | sh
```

### Verify Installation
```bash
heroku --version
```

---

## Step 2: Login to Heroku (1 minute)

```bash
heroku login
```

This will open a browser window. Log in with your Heroku credentials.

---

## Step 3: Set Up MongoDB Atlas (5 minutes)

**Why?** Heroku can't connect to your local MongoDB. Atlas is free and easy.

### 3.1 Create Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (or log in)
3. Click "Build a Database"

### 3.2 Create Cluster
1. Choose **M0 FREE** tier
2. Select **AWS** as provider
3. Choose region closest to you (or **us-east-1** for Heroku)
4. Name it: `rork-production`
5. Click "Create"

### 3.3 Configure Security
1. **Database Access**:
   - Click "Database Access" in left menu
   - Click "Add New Database User"
   - Username: `rork-prod-user`
   - Password: Generate secure password (save it!)
   - Database User Privileges: "Atlas Admin"
   - Click "Add User"

2. **Network Access**:
   - Click "Network Access" in left menu
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (or add `0.0.0.0/0`)
   - Click "Confirm"

### 3.4 Get Connection String
1. Click "Database" in left menu
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your password
6. Replace `<dbname>` with `rork-nightlife`

**Example:**
```
mongodb+srv://rork-prod-user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/rork-nightlife?retryWrites=true&w=majority
```

**Save this!** You'll need it in Step 5.

---

## Step 4: Create Heroku App (1 minute)

```bash
# Navigate to backend directory
cd /Users/rayan/rork-nightlife-app/backend

# Create Heroku app (choose a unique name)
heroku create rork-api

# Or let Heroku generate a random name
heroku create

# Note the URL (e.g., https://rork-api-12345.herokuapp.com)
```

---

## Step 5: Configure Environment Variables (3 minutes)

```bash
# Set Node environment
heroku config:set NODE_ENV=production

# Set MongoDB URI (use your Atlas connection string from Step 3)
heroku config:set MONGODB_URI="mongodb+srv://rork-prod-user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/rork-nightlife?retryWrites=true&w=majority"

# Generate and set JWT secret
heroku config:set JWT_SECRET=$(openssl rand -base64 32)

# Set app URL (replace with your Heroku URL)
heroku config:set APP_URL=https://rork-api-12345.herokuapp.com

# Set Cloudinary credentials (already configured)
heroku config:set CLOUDINARY_CLOUD_NAME=dgmqkptkg
heroku config:set CLOUDINARY_API_KEY=178962785582582
heroku config:set CLOUDINARY_API_SECRET=tTjB8WEKwFHuMsGsgfg67CWy_-M

# Set Sentry (already configured)
heroku config:set SENTRY_DSN=https://b198d5a4180a329ad71dc1fa5e213d0f@o4510789682266113.ingest.us.sentry.io/4510789691834368

# Set POS encryption key (already configured)
heroku config:set POS_ENCRYPTION_KEY=70ae1da1308ffea2f4b6797090a1087a3b289dffa83547a09a6f4aac5176882e

# Set CORS origins (update with your frontend URL)
heroku config:set ALLOWED_ORIGINS=https://rork.app,https://www.rork.app,exp://localhost:19000

# Verify all variables are set
heroku config
```

---

## Step 6: Deploy to Heroku (2 minutes)

```bash
# Make sure you're in backend directory
cd /Users/rayan/rork-nightlife-app/backend

# Add Heroku remote (if not already added)
heroku git:remote -a rork-api

# Deploy!
git push heroku main

# If you're on a different branch:
git push heroku your-branch:main
```

**Wait for deployment to complete** (~2 minutes)

You'll see:
```
remote: -----> Build succeeded!
remote: -----> Launching...
remote:        Released v3
remote:        https://rork-api-12345.herokuapp.com/ deployed to Heroku
```

---

## Step 7: Seed the Database (1 minute)

```bash
# Run the seed script
heroku run node src/scripts/seed-production.js

# This will create:
# - Demo users
# - Sample events
# - Challenges
# - Dynamic pricing
```

---

## Step 8: Verify Deployment (2 minutes)

### 8.1 Check Health Endpoint
```bash
# Get your Heroku URL
heroku info -s | grep web_url

# Test health endpoint
curl https://rork-api-12345.herokuapp.com/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "uptime": "...",
  "environment": "production"
}
```

### 8.2 Test Login
```bash
curl -X POST https://rork-api-12345.herokuapp.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@rork.app","password":"Demo123!"}'
```

**Expected:** JWT token returned

### 8.3 Test Growth Features
```bash
# Test challenges
curl https://rork-api-12345.herokuapp.com/api/social/challenges/active

# Test dynamic pricing
curl https://rork-api-12345.herokuapp.com/api/pricing/dynamic/venue-1
```

---

## Step 9: Monitor Logs (ongoing)

```bash
# View real-time logs
heroku logs --tail

# View last 100 lines
heroku logs -n 100

# View specific dyno
heroku logs --dyno web

# Search logs
heroku logs --tail | grep ERROR
```

---

## Step 10: Set Up Custom Domain (Optional)

### 10.1 Add Domain to Heroku
```bash
heroku domains:add api.rork.app
```

### 10.2 Configure DNS
Add a CNAME record:
```
Type: CNAME
Name: api
Value: [DNS target from Heroku]
TTL: 3600
```

### 10.3 Enable SSL
```bash
# Heroku automatically provisions SSL
heroku certs:auto:enable
```

---

## 🎉 Success! Your API is Live

**Your API URL:** https://rork-api-12345.herokuapp.com

**Demo Credentials:**
- Email: demo@rork.app
- Password: Demo123!

---

## 📊 Heroku Dashboard

View your app at: https://dashboard.heroku.com/apps/rork-api

**Useful Commands:**
```bash
# Scale dynos
heroku ps:scale web=1

# Restart app
heroku restart

# Open app in browser
heroku open

# SSH into container
heroku run bash

# Check resource usage
heroku ps

# View environment variables
heroku config

# Set environment variable
heroku config:set KEY=value

# Unset environment variable
heroku config:unset KEY
```

---

## 💰 Pricing

### Free Tier (Hobby)
- **Cost:** $0/month
- **Limitations:**
  - Sleeps after 30 min of inactivity
  - 550-1000 free dyno hours/month
  - Good for development/testing

### Basic ($7/month)
- **Cost:** $7/month per dyno
- **Benefits:**
  - Never sleeps
  - Custom domain SSL included
  - Better for production

### Standard ($25/month)
- More memory and better performance
- Recommended for production with traffic

**Upgrade:**
```bash
heroku ps:type basic
```

---

## 🔧 Troubleshooting

### App Crashed (H10 Error)
```bash
# View logs
heroku logs --tail

# Common issues:
# 1. Port not set correctly (should use process.env.PORT)
# 2. MongoDB connection failed (check MONGODB_URI)
# 3. Missing environment variable
```

### Database Connection Failed
```bash
# Test MongoDB connection
heroku run node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('Connected!')).catch(e => console.error(e))"

# Check Network Access in MongoDB Atlas
# Make sure 0.0.0.0/0 is allowed
```

### Environment Variable Issues
```bash
# List all variables
heroku config

# Check specific variable
heroku config:get MONGODB_URI
```

### App Running Slowly
```bash
# Check dyno metrics
heroku ps

# Scale to more dynos
heroku ps:scale web=2

# Upgrade dyno type
heroku ps:type standard-1x
```

---

## 🔄 Deploy Updates

After making changes:

```bash
# Commit changes
git add .
git commit -m "Update features"

# Deploy
git push heroku main

# Restart if needed
heroku restart
```

---

## 📈 Next Steps

1. ✅ **API is Live** - You're done here!
2. **Update Frontend** - Point your React Native app to Heroku URL
3. **Test Everything** - Test all features with real backend
4. **Monitor** - Watch logs and Sentry for issues
5. **Scale** - Upgrade dyno when you get users

---

## 🆘 Need Help?

**Heroku Documentation:**
- https://devcenter.heroku.com/articles/getting-started-with-nodejs

**Check Your Deployment:**
```bash
heroku info
heroku logs --tail
heroku run bash
```

**MongoDB Atlas Help:**
- https://docs.atlas.mongodb.com/getting-started/

---

## ✅ Deployment Checklist

- [ ] Heroku CLI installed
- [ ] Logged into Heroku
- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] Network access configured (0.0.0.0/0)
- [ ] Connection string obtained
- [ ] Heroku app created
- [ ] Environment variables set (11 required)
- [ ] Code deployed
- [ ] Database seeded
- [ ] Health check passing
- [ ] Login tested
- [ ] Growth features tested
- [ ] Logs monitored
- [ ] Sentry working

---

**Status:** ✅ Ready to deploy in ~15 minutes!

**Questions?** Let me know and I'll help you through each step!
