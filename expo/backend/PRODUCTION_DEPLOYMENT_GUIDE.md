# Production Deployment Guide

## Overview
This guide will help you deploy the Rork Nightlife backend to production using:
- **MongoDB Atlas** (cloud database)
- **Render.com** (hosting platform - recommended for ease of use)

---

## Step 1: Set Up MongoDB Atlas (Cloud Database)

### Create Account
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up for free account
3. Choose **Free Shared Cluster** (M0)

### Create Cluster
1. After signup, click **Build a Database**
2. Choose **FREE** (M0 Sandbox)
3. Select cloud provider: **AWS**
4. Select region: **Closest to your users** (e.g., us-east-1 for US)
5. Cluster name: `rork-cluster`
6. Click **Create**

### Configure Database Access
1. Click **Database Access** in left sidebar
2. Click **Add New Database User**
3. Authentication Method: **Password**
4. Username: `rork-admin`
5. Password: **Click "Autogenerate Secure Password"** (copy this!)
6. Database User Privileges: **Atlas admin**
7. Click **Add User**

### Configure Network Access
1. Click **Network Access** in left sidebar
2. Click **Add IP Address**
3. For production: Click **Allow Access from Anywhere** (0.0.0.0/0)
   - Note: This is safe because you have username/password auth
4. Click **Confirm**

### Get Connection String
1. Click **Database** in left sidebar
2. Click **Connect** on your cluster
3. Choose **Connect your application**
4. Driver: **Node.js**
5. Version: **4.1 or later**
6. Copy the connection string:
   ```
   mongodb+srv://rork-admin:<password>@rork-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. Replace `<password>` with the password you copied earlier
8. Add database name: `rork-nightlife`
   ```
   mongodb+srv://rork-admin:YOUR_PASSWORD@rork-cluster.xxxxx.mongodb.net/rork-nightlife?retryWrites=true&w=majority
   ```

**Save this connection string!** You'll need it for deployment.

---

## Step 2: Generate Production Secrets

Run these commands to generate secure secrets:

```bash
# JWT Secret (64 characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# API Key (32 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Copy these values!** You'll need them for environment variables.

---

## Step 3: Choose Hosting Platform

### Option A: Render.com (Recommended - Easiest)

**Why Render**:
- ✅ Free tier available (750 hours/month)
- ✅ Automatic SSL certificates
- ✅ Auto-deploy from GitHub
- ✅ Easy environment variable management
- ✅ Built-in logging and monitoring

**Limitations**:
- Free tier spins down after 15 minutes of inactivity (cold starts)
- Need paid tier ($7/mo) for always-on service

### Option B: Railway.app

**Why Railway**:
- ✅ $5 free credit monthly
- ✅ Very fast deployments
- ✅ Good developer experience
- ✅ No cold starts on free tier

**Limitations**:
- Free credit limited ($5/month = ~500 hours)

### Option C: Fly.io

**Why Fly**:
- ✅ Free tier includes 3 VMs
- ✅ Global edge deployment
- ✅ No cold starts

**Limitations**:
- More complex setup
- CLI-based deployment

**Recommendation**: Start with **Render** for simplicity.

---

## Step 4: Deploy to Render

### A. Prepare Repository

1. Make sure your code is pushed to GitHub:
   ```bash
   cd /Users/rayan/rork-nightlife-app/backend
   git add .
   git commit -m "Prepare for production deployment"
   git push origin main
   ```

2. Create a `render.yaml` file in backend root (optional but recommended):
   ```yaml
   services:
     - type: web
       name: rork-api
       env: node
       buildCommand: npm install
       startCommand: npm start
       healthCheckPath: /health
       envVars:
         - key: NODE_ENV
           value: production
         - key: PORT
           value: 10000
   ```

### B. Create Render Account

1. Go to https://render.com/
2. Sign up with GitHub (easier for auto-deploy)
3. Authorize Render to access your repositories

### C. Create Web Service

1. Click **New** → **Web Service**
2. Connect your GitHub repository
3. Select `rork-nightlife-app` repository
4. Configure:
   - **Name**: `rork-api`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or Individual $7/mo for always-on)

### D. Add Environment Variables

In Render dashboard, go to **Environment** tab and add:

```env
NODE_ENV=production
PORT=10000

# Database
MONGODB_URI=mongodb+srv://rork-admin:YOUR_PASSWORD@rork-cluster.xxxxx.mongodb.net/rork-nightlife?retryWrites=true&w=majority

# Security (use generated values from Step 2)
JWT_SECRET=<your-64-character-jwt-secret>
API_KEY=<your-32-character-api-key>

# CORS (update with your actual domain)
ALLOWED_ORIGINS=https://app.rork.com,https://www.rork.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# Cloudinary
CLOUDINARY_CLOUD_NAME=dgmqkptkg
CLOUDINARY_API_KEY=178962785582582
CLOUDINARY_API_SECRET=tTjB8WEKwFHuMsGsgfg67CWy_-M
CLOUDINARY_UPLOAD_PRESET=rork-mobile

# Instagram
INSTAGRAM_CLIENT_ID=your_instagram_client_id_here
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret_here
INSTAGRAM_REDIRECT_URI=https://app.rork.com/instagram-callback

# Email (will add SendGrid later)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@rork.app

# Application URLs (update after deployment)
APP_URL=https://rork-api.onrender.com
FRONTEND_URL=https://app.rork.com
```

**Note**: Initially use the Render URL, update `APP_URL` and `FRONTEND_URL` once you have custom domains.

### E. Deploy

1. Click **Create Web Service**
2. Render will automatically:
   - Pull your code from GitHub
   - Install dependencies
   - Start your server
   - Assign a URL: `https://rork-api.onrender.com`

3. Monitor deployment logs in real-time

### F. Verify Deployment

Once deployed, test:

```bash
# Check health endpoint
curl https://rork-api.onrender.com/health

# Expected response:
{
  "status": "healthy",
  "checks": {
    "database": "connected",
    "email": "dev-mode"
  }
}

# Check root endpoint
curl https://rork-api.onrender.com/

# Should see API info
```

---

## Step 5: Configure Auto-Deployment

Render automatically redeploys when you push to GitHub:

1. Make a change to your code
2. Commit and push:
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```
3. Render automatically detects the push and redeploys

---

## Step 6: Set Up Custom Domain (Optional)

If you have a custom domain:

1. In Render dashboard, go to **Settings** → **Custom Domain**
2. Add your domain: `api.rork.com`
3. Render will provide DNS instructions
4. Add CNAME record in your domain registrar:
   ```
   Type: CNAME
   Name: api
   Value: rork-api.onrender.com
   ```
5. Wait for DNS propagation (5-60 minutes)
6. Render auto-provisions SSL certificate

---

## Step 7: Monitor Your Application

### Render Dashboard
- **Logs**: Real-time application logs
- **Metrics**: CPU, Memory, Request count
- **Events**: Deployment history

### Health Check
Set up monitoring service:
1. Go to https://uptimerobot.com/ (free)
2. Add monitor for `https://rork-api.onrender.com/health`
3. Get alerts if API goes down

---

## Step 8: Update Frontend Configuration

Update your mobile app to use production API:

In your frontend `.env` or config:
```env
API_URL=https://rork-api.onrender.com
```

---

## Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Verify `package.json` has all dependencies
- Check Node version compatibility

### Database Connection Fails
- Verify MongoDB Atlas connection string
- Check username/password are correct
- Ensure Network Access allows 0.0.0.0/0
- Check MongoDB cluster is running

### Server Crashes
- Check logs in Render dashboard
- Verify all required env vars are set
- Check for missing dependencies

### Slow Cold Starts (Free Tier)
- Free tier spins down after 15 min inactivity
- First request after idle takes 30-60 seconds
- Solution: Upgrade to paid tier ($7/mo) for always-on

---

## Cost Breakdown

### Free Tier (Good for development/testing)
- **Render**: 750 hours/month free
- **MongoDB Atlas**: Free M0 cluster (512MB)
- **Total**: $0/month

**Limitations**:
- Cold starts after 15 minutes idle
- 512MB MongoDB storage
- No custom domain SSL

### Production Tier (Recommended for launch)
- **Render Individual**: $7/month (always-on, 512MB RAM)
- **MongoDB Atlas M2**: $9/month (2GB storage, backups)
- **SendGrid Essentials**: $19.95/month (50k emails) OR free tier (100/day)
- **Total**: $16-36/month depending on email volume

### Scale Tier (1000+ active users)
- **Render Standard**: $25/month (2GB RAM)
- **MongoDB Atlas M10**: $57/month (10GB, better performance)
- **SendGrid Pro**: $89.95/month (100k emails)
- **Total**: ~$172/month

---

## Security Checklist

Before going live:
- [ ] All environment variables set
- [ ] JWT_SECRET is 64+ character random string
- [ ] MongoDB password is strong (auto-generated)
- [ ] ALLOWED_ORIGINS only includes your domains
- [ ] SSL certificate active (Render does this automatically)
- [ ] Rate limiting configured
- [ ] Logs directory in .gitignore
- [ ] .env file in .gitignore
- [ ] Health check endpoint responding

---

## Next Steps

After deployment:
1. ✅ Backend is live at `https://rork-api.onrender.com`
2. Test all endpoints work
3. Update frontend to use production API
4. Set up SendGrid for emails
5. Configure error monitoring (Sentry)
6. Set up uptime monitoring
7. Document API endpoints
8. Run end-to-end tests

---

## Rollback Procedure

If something goes wrong:

1. In Render dashboard, go to **Events**
2. Find last working deployment
3. Click **Redeploy**
4. Or push a revert commit:
   ```bash
   git revert HEAD
   git push origin main
   ```

---

## Support

- **Render Docs**: https://render.com/docs
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com/
- **Render Community**: https://community.render.com/
