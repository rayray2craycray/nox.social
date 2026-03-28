# Production Finalization Plan
**Date**: January 25, 2026
**Current Status**: Backend is secure and minimally production-ready

---

## ✅ COMPLETED - Critical Security Fixes

All critical security vulnerabilities have been fixed:
- ✅ Input validation and sanitization
- ✅ Authentication enforcement
- ✅ Rate limiting (3 attempts/hour for registration)
- ✅ Database transactions for data consistency
- ✅ Environment variable validation
- ✅ Request size limits (1MB API, 50MB uploads)
- ✅ Structured logging with Winston
- ✅ Health monitoring endpoint
- ✅ Secret protection (.env gitignored)

**Backend Health**:
```json
{
  "status": "healthy",
  "database": "connected",
  "email": "dev-mode"
}
```

---

## 🟡 HIGH PRIORITY - Must Do Before Production Launch

### 1. Email Configuration (CRITICAL)
**Status**: ⚠️ Currently in dev mode (emails logged to console)
**Effort**: 30 minutes
**Impact**: Users won't receive verification emails without this

**Tasks**:
- [ ] Set up SMTP service (Gmail, SendGrid, AWS SES, or Mailgun)
- [ ] Add credentials to `.env`:
  ```env
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your-email@gmail.com
  SMTP_PASS=your-app-password
  SMTP_FROM=noreply@rork.app
  ```
- [ ] Test email delivery in production
- [ ] Monitor email bounce rates

**Recommended Service**: SendGrid (free tier: 100 emails/day) or AWS SES (very cheap)

---

### 2. Frontend Input Validation
**Status**: ⚠️ Missing client-side validation
**Effort**: 2-3 hours
**Impact**: Better UX and prevents unnecessary API calls

**Tasks**:
- [ ] Add email format validation in registration form
- [ ] Add phone number format validation (if collecting)
- [ ] Add ZIP code format validation
- [ ] Add real-time validation feedback (red/green borders)
- [ ] Disable submit button until form is valid
- [ ] Add character counters for text fields

**Files to Modify**:
- `/app/business/register.tsx` - Add Zod schema validation
- Use `react-hook-form` with Zod for validation

---

### 3. Admin Dashboard for Business Approvals
**Status**: ⚠️ No way to review/approve registrations
**Effort**: 1 day
**Impact**: Can't manually verify legitimate businesses

**Tasks**:
- [ ] Create admin user role in database
- [ ] Build `/app/admin/business-approvals.tsx` screen
- [ ] Add ability to approve/reject registrations
- [ ] Add ability to view submitted documents
- [ ] Send email notifications on approval/rejection
- [ ] Add admin-only API endpoints:
  - `GET /api/admin/business-profiles` - List pending
  - `PATCH /api/admin/business-profiles/:id/approve`
  - `PATCH /api/admin/business-profiles/:id/reject`

**Optional**: Add notes/comments when rejecting

---

### 4. Document Upload System
**Status**: ⚠️ Required field but no upload UI
**Effort**: 4-6 hours
**Impact**: Can't verify business legitimacy without documents

**Tasks**:
- [ ] Add document upload to registration flow
- [ ] Accept: Business license, Tax ID, Liquor license
- [ ] Use Cloudinary for document storage
- [ ] Add document viewer in admin dashboard
- [ ] Validate file types (PDF, JPG, PNG only)
- [ ] Limit file size (5MB max per document)
- [ ] Mark `documentsSubmitted` field when uploaded

**Files to Modify**:
- `/app/business/register.tsx` - Add Step 3 for documents
- `/contexts/VenueManagementContext.tsx` - Add uploadDocument()

---

### 5. Production Environment Setup
**Status**: ⚠️ Only configured for development
**Effort**: 1-2 hours
**Impact**: App won't work in production without this

**Tasks**:
- [ ] Choose hosting platform (Render, Railway, AWS, Heroku)
- [ ] Set up production MongoDB database (MongoDB Atlas)
- [ ] Configure production environment variables:
  ```env
  NODE_ENV=production
  PORT=443 (or platform default)
  MONGODB_URI=mongodb+srv://...atlas.mongodb.net/...
  JWT_SECRET=<64-character random string>
  APP_URL=https://app.rork.com (your production URL)
  FRONTEND_URL=https://app.rork.com
  ALLOWED_ORIGINS=https://app.rork.com,https://www.rork.com
  ```
- [ ] Enable SSL/TLS certificates (most platforms do this automatically)
- [ ] Set up automatic deployments from Git

**Recommended Platforms**:
- **Render**: Easy, free tier available, auto-SSL
- **Railway**: Similar to Render, good free tier
- **Fly.io**: Good for global deployment

---

### 6. Error Monitoring & Alerting
**Status**: ⚠️ Only logging to files
**Effort**: 1-2 hours
**Impact**: Won't know when things break in production

**Tasks**:
- [ ] Set up error tracking (Sentry, LogRocket, or similar)
- [ ] Add Sentry SDK to backend:
  ```bash
  npm install @sentry/node
  ```
- [ ] Configure Sentry in `src/server.js`
- [ ] Set up alerts for:
  - Server crashes
  - Database connection failures
  - Failed email sends
  - 500 errors
- [ ] Add user context to error reports

**Recommended**: Sentry (free tier: 5,000 errors/month)

---

## 🟢 MEDIUM PRIORITY - Can Launch Without, Add Soon After

### 7. Automated Tests
**Status**: ❌ No tests
**Effort**: 2-3 days
**Impact**: Hard to catch regressions

**Tasks**:
- [ ] Add Jest and Supertest
- [ ] Write integration tests for:
  - Registration flow
  - Email verification flow
  - Authentication
  - Rate limiting
  - Input validation
- [ ] Add to CI/CD pipeline
- [ ] Aim for 70%+ code coverage on critical paths

---

### 8. API Documentation
**Status**: ❌ No documentation
**Effort**: 4-6 hours
**Impact**: Hard for frontend team to use API

**Tasks**:
- [ ] Add Swagger/OpenAPI documentation
- [ ] Install `swagger-jsdoc` and `swagger-ui-express`
- [ ] Document all endpoints with:
  - Request body schemas
  - Response schemas
  - Authentication requirements
  - Rate limits
  - Example requests/responses
- [ ] Serve at `/api/docs`

---

### 9. Database Backups
**Status**: ⚠️ Relying on hosting provider
**Effort**: 1-2 hours
**Impact**: Could lose data

**Tasks**:
- [ ] Enable automated backups on MongoDB Atlas (built-in)
- [ ] Set backup retention to 7 days minimum
- [ ] Test restore process once
- [ ] Document restore procedure
- [ ] Consider point-in-time recovery for critical data

---

### 10. Performance Optimization
**Status**: ⚠️ Not optimized
**Effort**: 1-2 days
**Impact**: Slow response times at scale

**Tasks**:
- [ ] Add database indexes for common queries:
  - `businessEmail` (already indexed)
  - `venueId` queries
  - `userId` lookups
- [ ] Add Redis caching for:
  - Venue data
  - User sessions
  - Rate limiting (move from memory to Redis)
- [ ] Enable compression (already done ✅)
- [ ] Add CDN for static assets
- [ ] Optimize image uploads (resize before upload)

---

### 11. CSRF Protection
**Status**: ❌ Not implemented
**Effort**: 2-3 hours
**Impact**: Vulnerable to CSRF attacks

**Tasks**:
- [ ] Add `csurf` package
- [ ] Generate CSRF tokens for state-changing operations
- [ ] Include token in mobile app requests
- [ ] Validate token on POST/PUT/PATCH/DELETE

**Note**: Less critical for mobile apps, but good practice

---

### 12. Staff Invitation System
**Status**: ❌ Can't add staff to venues
**Effort**: 1 day
**Impact**: Venue owners can't delegate management

**Tasks**:
- [ ] Create invitation flow:
  - Generate invitation token
  - Send invitation email
  - Accept invitation link
  - Create VenueRole on acceptance
- [ ] Add UI for managing staff:
  - `/app/venue/[id]/staff.tsx`
  - Invite staff
  - Remove staff
  - Change permissions
- [ ] API endpoints:
  - `POST /api/venues/:id/invite-staff`
  - `POST /api/venues/accept-invitation/:token`
  - `DELETE /api/venues/:id/staff/:userId`

---

## 🔵 LOW PRIORITY - Nice to Have

### 13. Advanced Monitoring
- [ ] Set up APM (Application Performance Monitoring)
- [ ] Track API response times
- [ ] Monitor database query performance
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Create status page for users

### 14. Advanced Security
- [ ] Add 2FA for business accounts
- [ ] Implement password complexity requirements
- [ ] Add account lockout after failed login attempts
- [ ] Security headers (helmet already added ✅)
- [ ] Regular security audits

### 15. Compliance
- [ ] Add GDPR compliance (data export, deletion)
- [ ] Add Terms of Service acceptance
- [ ] Add Privacy Policy acceptance
- [ ] Cookie consent banner (if using cookies)
- [ ] Data retention policies

---

## Quick Start Checklist (Minimum for Launch)

**Can launch with just these 5 items** (1-2 days work):

1. ✅ Critical security fixes (DONE)
2. [ ] Email configuration (30 min)
3. [ ] Production environment setup (2 hours)
4. [ ] Frontend validation (3 hours)
5. [ ] Error monitoring setup (2 hours)

**Total**: ~8 hours additional work to launch

---

## Recommended Timeline

### Week 1 (Minimum Viable Production)
- Day 1: Email config + Production setup + Error monitoring
- Day 2: Frontend validation + Testing
- Day 3: Document upload system
- Day 4: Admin dashboard
- Day 5: Final testing + Deploy

### Week 2 (Hardening)
- Day 1-2: Automated tests
- Day 3: API documentation
- Day 4: Performance optimization
- Day 5: Staff invitation system

### Week 3+ (Ongoing)
- Monitoring and fixing issues
- Adding nice-to-have features
- User feedback implementation

---

## Environment Variables Needed for Production

```env
# Server
NODE_ENV=production
PORT=443
APP_URL=https://api.rork.com
FRONTEND_URL=https://app.rork.com

# Database
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/rork-nightlife?retryWrites=true&w=majority

# Security
JWT_SECRET=<generate-64-character-random-string>
API_KEY=<generate-api-key-for-client>

# Email (Choose one)
# Option 1: Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Option 2: SendGrid
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<sendgrid-api-key>

# Option 3: AWS SES
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=<aws-smtp-user>
SMTP_PASS=<aws-smtp-pass>

SMTP_FROM=noreply@rork.app

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_UPLOAD_PRESET=rork-mobile

# Instagram
INSTAGRAM_CLIENT_ID=your-instagram-client-id
INSTAGRAM_CLIENT_SECRET=your-instagram-client-secret
INSTAGRAM_REDIRECT_URI=https://app.rork.com/instagram-callback

# CORS
ALLOWED_ORIGINS=https://app.rork.com,https://www.rork.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# Error Tracking (Optional)
SENTRY_DSN=<your-sentry-dsn>
```

---

## How to Generate Secrets

```bash
# JWT Secret (64-character random string)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# API Key (32-character random string)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Deployment Commands

```bash
# Build for production (if needed)
npm run build

# Start production server
NODE_ENV=production npm start

# Or use PM2 for process management
npm install -g pm2
pm2 start src/server.js --name rork-api
pm2 save
pm2 startup
```

---

## Health Check After Deployment

```bash
# Check health endpoint
curl https://api.rork.com/health

# Expected response:
{
  "status": "healthy",
  "checks": {
    "database": "connected",
    "email": "configured"
  }
}
```

---

## Summary

**Current State**: ✅ Backend is secure and ready for development/staging

**Minimum to Launch**: 5 items, ~8 hours work
1. Email configuration
2. Production environment setup
3. Frontend validation
4. Error monitoring
5. Final testing

**Recommended Before Launch**: +3 items, +2 days work
6. Document upload system
7. Admin dashboard
8. Database backups

**Post-Launch Priorities**:
- Automated tests
- API documentation
- Performance optimization
- Staff management

**Total Time to Production**: 1 week (minimum) to 3 weeks (comprehensive)
