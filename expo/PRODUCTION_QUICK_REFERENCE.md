# Production Quick Reference

Quick reference for common production tasks.

---

## Backend Deployment

### Deploy to Production
```bash
# Option 1: Using script
./scripts/deploy-backend.sh

# Option 2: Manual PM2
cd backend
pm2 start src/server.js --name rork-api --env production
pm2 save

# Option 3: Railway (auto-deploy on git push)
git push origin main
```

### Check Backend Status
```bash
# PM2 status
pm2 status

# View logs
pm2 logs rork-api

# Restart
pm2 restart rork-api

# Stop
pm2 stop rork-api
```

### Environment Variables
```bash
# Backend production variables
backend/.env.production

# Required:
- MONGODB_URI
- JWT_SECRET
- CLOUDINARY_*
- ALLOWED_ORIGINS
```

---

## Mobile App Deployment

### Build for App Stores
```bash
# Build both iOS and Android
./scripts/build-production.sh all

# Build iOS only
./scripts/build-production.sh ios

# Build Android only
./scripts/build-production.sh android
```

### Submit to App Stores
```bash
# Submit to iOS App Store
eas submit --platform ios --profile production

# Submit to Google Play Store
eas submit --platform android --profile production
```

### OTA Updates (No App Store Review)
```bash
# Publish update to production
eas update --branch production --message "Bug fix"

# View update history
eas update:list --branch production

# Rollback update
eas update:republish --branch production --group <previous-group-id>
```

### Check Build Status
```bash
# List recent builds
eas build:list

# View build details
eas build:view <build-id>

# Download build
eas build:download --platform ios --profile production
```

---

## Monitoring & Logs

### Backend Health Check
```bash
# Check if API is running
curl https://api.rork.app/health

# Expected: {"status":"ok","timestamp":"..."}
```

### View Logs
```bash
# PM2 logs
pm2 logs rork-api

# Last 100 lines
pm2 logs rork-api --lines 100

# Real-time logs
pm2 logs rork-api --raw
```

### Monitor Performance
```bash
# PM2 monitoring
pm2 monit

# Or use PM2 Plus (web dashboard)
pm2 plus
```

---

## Database Management

### Backup Database
```bash
# MongoDB Atlas has automatic backups ✅

# Manual backup
mongodump --uri="<MONGODB_URI>" --out=./backup-$(date +%Y%m%d)

# Restore backup
mongorestore --uri="<MONGODB_URI>" ./backup-20240120
```

### Database Connection Test
```bash
# Connect to MongoDB Atlas
mongosh "<MONGODB_URI>"

# Show databases
show dbs

# Use production database
use rork-nightlife-prod

# Show collections
show collections
```

---

## Cloudinary Management

### Check Upload Stats
1. Go to https://cloudinary.com/console
2. View usage: Media Library → Overview
3. Check folders:
   - `rork-app/profiles/` - Profile pictures
   - `rork-app/highlights/` - Videos
   - `rork-app/memories/` - Memory photos

### Clear Old Assets (Optional)
```bash
# Delete assets older than 90 days (via Cloudinary admin)
# Or use Cloudinary API
```

---

## Security

### Rotate Secrets
```bash
# Generate new JWT secret
openssl rand -base64 32

# Update backend/.env.production
JWT_SECRET=<new-secret>

# Restart backend
pm2 restart rork-api
```

### Check SSL Certificate
```bash
# Check SSL expiry
openssl s_client -connect api.rork.app:443 -servername api.rork.app | openssl x509 -noout -dates

# Auto-renew with Certbot (if using Let's Encrypt)
sudo certbot renew
```

### Review Access Logs
```bash
# Check for suspicious activity
pm2 logs rork-api | grep "401\|403\|500"
```

---

## Troubleshooting

### API Not Responding
```bash
# 1. Check if backend is running
pm2 status

# 2. Check logs for errors
pm2 logs rork-api --err

# 3. Restart backend
pm2 restart rork-api

# 4. Check DNS
dig api.rork.app

# 5. Check SSL
curl -I https://api.rork.app
```

### Database Connection Failed
```bash
# 1. Check MongoDB Atlas status
# Go to https://cloud.mongodb.com

# 2. Verify connection string
echo $MONGODB_URI

# 3. Test connection
mongosh "<MONGODB_URI>" --eval "db.adminCommand('ping')"

# 4. Check IP whitelist in Atlas
# Add server IP to Network Access
```

### Uploads Failing
```bash
# 1. Check Cloudinary credentials
env | grep CLOUDINARY

# 2. Test upload endpoint
curl -X POST https://api.rork.app/api/upload/profile-picture \
  -H "Authorization: Bearer <token>" \
  -F "image=@test.jpg"

# 3. Check Cloudinary dashboard for errors
```

### Mobile App Issues
```bash
# 1. Check API URL in app
# Should be: https://api.rork.app

# 2. Rebuild app
eas build --platform ios --profile production --clear-cache

# 3. Check build logs
eas build:view <build-id>

# 4. Test on device before submitting
```

---

## Common Commands Cheat Sheet

### EAS Build
```bash
eas login                                    # Login to Expo
eas build:configure                          # Configure EAS
eas build --platform ios                     # Build iOS
eas build --platform android                 # Build Android
eas build:list                               # List builds
eas build:download --platform ios            # Download iOS build
eas submit --platform ios                    # Submit to App Store
eas update --branch production               # OTA update
```

### PM2
```bash
pm2 start app.js                             # Start app
pm2 list                                     # List processes
pm2 logs                                     # View logs
pm2 restart app                              # Restart app
pm2 stop app                                 # Stop app
pm2 delete app                               # Delete app
pm2 save                                     # Save process list
pm2 startup                                  # Auto-start on reboot
```

### Git
```bash
git status                                   # Check status
git add .                                    # Stage all changes
git commit -m "message"                      # Commit changes
git push origin main                         # Push to GitHub
git pull origin main                         # Pull latest
git checkout -b feature-name                 # Create branch
```

### npm
```bash
npm install                                  # Install dependencies
npm ci                                       # Clean install
npm run dev                                  # Run dev server
npm start                                    # Run production
npm test                                     # Run tests
npm run build                                # Build for production
```

---

## Environment Setup

### Backend Production Environment
```bash
# Location: backend/.env.production
# Template: backend/.env.production.example

# Must configure:
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<strong-random-secret>
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
ALLOWED_ORIGINS=https://rork.app
```

### Frontend Production Environment
```bash
# Set via eas.json:
APP_ENV=production
API_URL=https://api.rork.app
CLOUDINARY_CLOUD_NAME=...
```

---

## Monitoring URLs

- **API Health**: https://api.rork.app/health
- **MongoDB Atlas**: https://cloud.mongodb.com
- **Cloudinary**: https://cloudinary.com/console
- **Expo Dashboard**: https://expo.dev
- **Apple App Store Connect**: https://appstoreconnect.apple.com
- **Google Play Console**: https://play.google.com/console

---

## Support Contacts

- **Backend Issues**: Check PM2 logs
- **Database Issues**: MongoDB Atlas support
- **Upload Issues**: Cloudinary support
- **Build Issues**: Expo forums
- **App Store Issues**: Apple/Google support

---

## Release Checklist

### Before Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database backup created
- [ ] Secrets rotated (if needed)
- [ ] Change log updated

### Backend Deployment
- [ ] Code pushed to main branch
- [ ] Backend deployed successfully
- [ ] Health check returns 200 OK
- [ ] All endpoints tested
- [ ] Logs show no errors

### Mobile App Deployment
- [ ] Production builds created
- [ ] Builds tested on real devices
- [ ] Screenshots updated
- [ ] Store listings reviewed
- [ ] Submitted to app stores

### Post-Deployment
- [ ] Monitor error rates
- [ ] Check user feedback
- [ ] Verify analytics tracking
- [ ] Update documentation
- [ ] Notify team

---

**Last Updated**: Production configuration
**Version**: 1.0.0
**Status**: Ready for Production Deployment
