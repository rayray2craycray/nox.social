# Production Setup Checklist

## ✅ Completed

- [x] Security fixes implemented
- [x] Input validation added
- [x] Rate limiting configured
- [x] Logging with Winston
- [x] Health check endpoint
- [x] Production configuration files created
- [x] Secrets generated

## 📝 Production Secrets (SAVE THESE SECURELY!)

```env
# Generated on: 2026-01-25
# CRITICAL: Add these to Render/Railway environment variables

JWT_SECRET=a8425e7d426a6aa5ececf4b4e5a501bb108e6e22c6efbbbe64e4adc94edf2c89f4a8fde6a3e28e73cb19a0a0a288b2634b8012a37add44c010a72a73205e2c5b

API_KEY=f3d618b3bc1a4cb1e7c44423aaeb43766581259891ec8f509927d71a992c0a90
```

**⚠️ SECURITY WARNING**:
- Never commit these to Git
- Store in password manager (1Password, LastPass, etc.)
- Add to hosting platform environment variables only

---

## 🔲 Pending Setup Steps

### Step 1: MongoDB Atlas (15 minutes)
- [ ] Create MongoDB Atlas account: https://www.mongodb.com/cloud/atlas/register
- [ ] Create free M0 cluster (name: `rork-cluster`)
- [ ] Create database user: `rork-admin`
- [ ] Auto-generate password (save it!)
- [ ] Allow access from anywhere (0.0.0.0/0)
- [ ] Get connection string
- [ ] Save connection string in password manager

**Connection String Format**:
```
mongodb+srv://rork-admin:YOUR_PASSWORD@rork-cluster.xxxxx.mongodb.net/rork-nightlife?retryWrites=true&w=majority
```

### Step 2: Render.com Deployment (20 minutes)
- [ ] Create Render account: https://render.com/
- [ ] Connect GitHub repository
- [ ] Create new Web Service
- [ ] Configure service:
  - Name: `rork-api`
  - Region: Oregon (or closest to users)
  - Build Command: `npm install`
  - Start Command: `npm start`
  - Root Directory: `backend`
- [ ] Add environment variables (see below)
- [ ] Deploy and wait for build

### Step 3: Environment Variables in Render

Add these in Render Dashboard → Environment tab:

```env
NODE_ENV=production
PORT=10000

# Database (from MongoDB Atlas)
MONGODB_URI=<paste-your-mongodb-connection-string>

# Security (from above)
JWT_SECRET=a8425e7d426a6aa5ececf4b4e5a501bb108e6e22c6efbbbe64e4adc94edf2c89f4a8fde6a3e28e73cb19a0a0a288b2634b8012a37add44c010a72a73205e2c5b
API_KEY=f3d618b3bc1a4cb1e7c44423aaeb43766581259891ec8f509927d71a992c0a90

# CORS (update with your domain)
ALLOWED_ORIGINS=https://app.rork.com,https://www.rork.com

# Email (add after SendGrid setup)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<sendgrid-api-key-when-ready>
SMTP_FROM=noreply@rork.app

# Cloudinary
CLOUDINARY_CLOUD_NAME=dgmqkptkg
CLOUDINARY_API_KEY=178962785582582
CLOUDINARY_API_SECRET=tTjB8WEKwFHuMsGsgfg67CWy_-M
CLOUDINARY_UPLOAD_PRESET=rork-mobile

# Instagram
INSTAGRAM_CLIENT_ID=your_instagram_client_id_here
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret_here
INSTAGRAM_REDIRECT_URI=https://app.rork.com/instagram-callback

# App URLs (update after deployment)
APP_URL=https://rork-api.onrender.com
FRONTEND_URL=https://app.rork.com

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 4: Verify Deployment
- [ ] Check build logs (should complete without errors)
- [ ] Visit health check: `https://rork-api.onrender.com/health`
- [ ] Should return: `{"status":"healthy","checks":{"database":"connected"}}`
- [ ] Check API root: `https://rork-api.onrender.com/`

### Step 5: Update Frontend
- [ ] Update mobile app API URL to: `https://rork-api.onrender.com`
- [ ] Test registration flow end-to-end
- [ ] Verify backend receives requests

---

## 📋 Files Created

1. ✅ `PRODUCTION_DEPLOYMENT_GUIDE.md` - Complete deployment instructions
2. ✅ `.env.production.example` - Production environment template
3. ✅ `render.yaml` - Render.com blueprint configuration
4. ✅ `PRODUCTION_SETUP_CHECKLIST.md` - This file
5. ✅ `SENDGRID_SETUP.md` - Email configuration guide

---

## 🚀 Quick Deploy Commands

When ready to deploy:

```bash
# 1. Make sure all changes are committed
cd /Users/rayan/rork-nightlife-app/backend
git add .
git commit -m "Production deployment configuration"
git push origin main

# 2. Render will auto-deploy on push (if configured)

# 3. Or deploy manually via Render dashboard
```

---

## 🔍 Post-Deployment Testing

```bash
# Health check
curl https://rork-api.onrender.com/health

# API info
curl https://rork-api.onrender.com/

# Test authentication (should fail without token)
curl -X POST https://rork-api.onrender.com/api/business/register \
  -H "Content-Type: application/json" \
  -d '{"venueName":"Test"}'

# Expected: {"success":false,"error":"No token provided"}
```

---

## 📊 Monitoring Setup (After Deployment)

1. **Uptime Monitoring**:
   - Sign up: https://uptimerobot.com/ (free)
   - Add monitor for: `https://rork-api.onrender.com/health`
   - Get email alerts if API goes down

2. **Error Tracking** (Next step):
   - Set up Sentry (free tier)
   - Get notified of crashes and errors

---

## 💰 Cost Estimate

### Development/Testing (Current)
- Render Free Tier: $0/month (with cold starts)
- MongoDB Atlas M0: $0/month (512MB)
- **Total**: $0/month

### Production (Recommended)
- Render Starter: $7/month (always-on, 512MB RAM)
- MongoDB Atlas M2: $9/month (2GB storage, backups)
- SendGrid Free: $0/month (100 emails/day)
- **Total**: $16/month

### Scale (1000+ users)
- Render Standard: $25/month (2GB RAM)
- MongoDB Atlas M10: $57/month (10GB, better performance)
- SendGrid Essentials: $19.95/month (50k emails)
- **Total**: $102/month

---

## ⏭️ Next Steps

After production environment is ready:
1. Item #3: Add frontend validation
2. Item #4: Set up Sentry error monitoring
3. Item #5: Test complete registration flow
4. Item #6: Build document upload system
5. Item #7: Create admin dashboard
6. Item #8: Configure database backups

---

## 🆘 Need Help?

- **Render Support**: https://render.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com/
- **Render Community**: https://community.render.com/

---

## 🔐 Security Reminder

Before going live:
- [ ] All secrets in environment variables (not code)
- [ ] .env files in .gitignore
- [ ] Strong passwords for MongoDB
- [ ] Rate limiting enabled
- [ ] CORS configured for production domains only
- [ ] SSL/TLS enabled (automatic on Render)
