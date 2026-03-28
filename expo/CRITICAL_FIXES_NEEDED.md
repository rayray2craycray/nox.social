# Critical Fixes Needed - Quick Reference

## ⚠️ DO NOT DEPLOY TO PRODUCTION WITHOUT THESE FIXES

### Priority 1: CRITICAL SECURITY ISSUES (Fix Today)

#### 1. Add Input Validation Package
```bash
cd backend
npm install validator express-validator
```

#### 2. Fix Authentication Check in Controllers
**File:** `/backend/src/controllers/business.controller.js`
**Line:** 29

Add after line 28:
```javascript
// Validate authentication
if (!req.user || !req.user._id) {
  return res.status(401).json({
    success: false,
    error: 'Authentication required',
  });
}
```

#### 3. Add Email Validation
**File:** `/backend/src/controllers/business.controller.js`
**After line 6:**
```javascript
const validator = require('validator');
```

**Replace lines 31-37 with:**
```javascript
// Validate required fields
if (!venueName || !businessEmail || !location || !businessType) {
  return res.status(400).json({
    success: false,
    error: 'Missing required fields',
  });
}

// Validate email format
if (!validator.isEmail(businessEmail)) {
  return res.status(400).json({
    success: false,
    error: 'Invalid email address format',
  });
}

// Validate and sanitize venue name
if (!venueName || venueName.trim().length < 2 || venueName.length > 100) {
  return res.status(400).json({
    success: false,
    error: 'Venue name must be between 2 and 100 characters',
  });
}

// Sanitize inputs to prevent XSS
const sanitizedVenueName = validator.escape(venueName.trim());
const sanitizedDescription = description ? validator.escape(description.trim()) : '';

// Validate website URL if provided
if (website && !validator.isURL(website, { require_protocol: true })) {
  return res.status(400).json({
    success: false,
    error: 'Invalid website URL format',
  });
}
```

#### 4. Add Rate Limiting
**File:** `/backend/src/routes/business.routes.js`
**After line 5:**
```javascript
const rateLimit = require('express-rate-limit');

// Limit registration attempts
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registration attempts per hour per IP
  message: {
    success: false,
    error: 'Too many registration attempts. Please try again in an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit verification resends
const resendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 resend attempts per 15 minutes
  message: {
    success: false,
    error: 'Too many resend attempts. Please wait 15 minutes.',
  },
});
```

**Update route (line 16):**
```javascript
router.post('/register', registrationLimiter, authMiddleware, businessController.registerBusiness);
```

**Update resend route (line 28):**
```javascript
router.post('/resend-verification', resendLimiter, authMiddleware, businessController.resendVerificationEmail);
```

Install package:
```bash
npm install express-rate-limit
```

#### 5. Add Transaction Support
**File:** `/backend/src/controllers/business.controller.js`
**In verifyEmail function, replace lines 140-176 with:**

```javascript
// Find and validate token
const token = await EmailVerificationToken.findOne({
  token: verificationToken,
  expiresAt: { $gt: new Date() },
});

if (!token) {
  return res.status(400).json({
    success: false,
    error: 'Invalid or expired verification token',
  });
}

// Check if already verified
if (token.verifiedAt) {
  return res.status(400).json({
    success: false,
    error: 'Email already verified',
  });
}

const businessProfile = await BusinessProfile.findById(token.businessProfileId);
if (!businessProfile) {
  return res.status(404).json({
    success: false,
    error: 'Business profile not found',
  });
}

// START TRANSACTION
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Mark token as verified
  token.verifiedAt = new Date();
  await token.save({ session });

  // Update business profile status
  businessProfile.status = 'VERIFIED';
  businessProfile.emailVerified = true;
  await businessProfile.save({ session });

  // Find or create venue
  let venue = await Venue.findOne({
    name: businessProfile.venueName,
    'location.city': businessProfile.location.city,
  }).session(session);

  if (!venue) {
    // Create new venue
    venue = await Venue.create([{
      name: businessProfile.venueName,
      type: businessProfile.businessType,
      location: {
        address: businessProfile.location.address,
        city: businessProfile.location.city,
        state: businessProfile.location.state,
        zipCode: businessProfile.location.zipCode,
        coordinates: businessProfile.location.coordinates,
      },
      businessProfileId: businessProfile._id,
      description: businessProfile.description || '',
      phone: businessProfile.phone,
      website: businessProfile.website,
    }], { session });
    venue = venue[0];
  }

  // Link venue to business profile
  businessProfile.venueId = venue._id;
  await businessProfile.save({ session });

  // Create HEAD_MODERATOR role
  const existingRole = await VenueRole.findOne({
    venueId: venue._id,
    userId: businessProfile.userId,
  }).session(session);

  if (!existingRole) {
    await VenueRole.create([{
      venueId: venue._id,
      userId: businessProfile.userId,
      role: 'HEAD_MODERATOR',
      permissions: ['FULL_ACCESS'],
      assignedBy: businessProfile.userId,
      assignedAt: new Date(),
      isActive: true,
    }], { session });
  }

  // Commit transaction
  await session.commitTransaction();

  res.json({
    success: true,
    data: {
      businessProfile,
      venue,
    },
    message: 'Email verified successfully! You are now the HEAD_MODERATOR of your venue.',
  });

} catch (error) {
  // Rollback on error
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

Add at top of file:
```javascript
const mongoose = require('mongoose');
```

#### 6. Add Environment Variable Validation
**File:** `/backend/src/server.js`
**Add after line 6 (after require('dotenv').config()):**

```javascript
// Validate required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'APP_URL',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(envVar => console.error(`   - ${envVar}`));
  process.exit(1);
}

// Warn about optional but recommended variables
const recommendedEnvVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
const missingRecommended = recommendedEnvVars.filter(envVar => !process.env[envVar]);

if (missingRecommended.length > 0) {
  console.warn('⚠️  Missing recommended environment variables (emails will be logged to console):');
  missingRecommended.forEach(envVar => console.warn(`   - ${envVar}`));
}
```

#### 7. Add Request Size Limits
**File:** `/backend/src/server.js`
**Replace lines 58-59 with:**

```javascript
// Body parsing with size limits
app.use('/api/upload', express.json({ limit: '50mb' }));
app.use('/api', express.json({ limit: '1mb' }));
app.use('/api/upload', express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/api', express.urlencoded({ extended: true, limit: '1mb' }));
```

---

### Priority 2: HIGH PRIORITY FIXES (Fix This Week)

#### 8. Add Frontend Email Validation
**File:** `/app/business/register.tsx`
**Add after line 87:**

```typescript
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\(\)]+$/;
  return phone.length >= 10 && phoneRegex.test(phone);
};

const validateZipCode = (zip: string): boolean => {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zip);
};

const validateURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
```

**Update validateStep1 function:**
```typescript
const validateStep1 = (): boolean => {
  const newErrors: Record<string, string> = {};

  if (!formData.venueName.trim()) {
    newErrors.venueName = 'Venue name is required';
  } else if (formData.venueName.trim().length < 2) {
    newErrors.venueName = 'Venue name must be at least 2 characters';
  }

  if (!formData.businessEmail.trim()) {
    newErrors.businessEmail = 'Business email is required';
  } else if (!validateEmail(formData.businessEmail)) {
    newErrors.businessEmail = 'Please enter a valid email address';
  }

  if (!formData.location.address.trim()) {
    newErrors.address = 'Address is required';
  }

  if (!formData.location.city.trim()) {
    newErrors.city = 'City is required';
  }

  if (!formData.location.state.trim()) {
    newErrors.state = 'State is required';
  }

  if (!formData.location.zipCode.trim()) {
    newErrors.zipCode = 'ZIP code is required';
  } else if (!validateZipCode(formData.location.zipCode)) {
    newErrors.zipCode = 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

#### 9. Add Logging
**Install Winston:**
```bash
cd backend
npm install winston
```

**Create:** `/backend/src/utils/logger.js`
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'rork-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

module.exports = logger;
```

**Use in controllers:**
```javascript
const logger = require('../utils/logger');

// In registerBusiness:
logger.info('Business registration attempt', {
  userId: req.user._id,
  businessEmail,
  venueName,
});

// On success:
logger.info('Business registered successfully', {
  businessProfileId: businessProfile._id,
  userId: req.user._id,
});

// On error:
logger.error('Business registration failed', {
  userId: req.user._id,
  error: error.message,
  stack: error.stack,
});
```

#### 10. Enhance Health Check
**File:** `/backend/src/server.js`
**Replace health check endpoint (around line 81) with:**

```javascript
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    checks: {
      database: 'unknown',
      email: 'unknown',
    },
  };

  // Check MongoDB connection
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      health.checks.database = 'connected';
    } else {
      health.checks.database = 'disconnected';
      health.status = 'degraded';
    }
  } catch (error) {
    health.checks.database = 'error';
    health.status = 'unhealthy';
  }

  // Check SMTP configuration
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    health.checks.email = 'configured';
  } else {
    health.checks.email = 'dev-mode';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

---

## 📝 Quick Setup Commands

### 1. Install All Required Packages
```bash
cd /Users/rayan/rork-nightlife-app/backend

npm install \
  validator \
  express-validator \
  express-rate-limit \
  winston
```

### 2. Create Logs Directory
```bash
mkdir -p logs
echo "logs/" >> .gitignore
```

### 3. Update Environment Variables
```bash
# Add to .env
APP_URL=http://localhost:19006
FRONTEND_URL=http://localhost:19006
LOG_LEVEL=debug
```

### 4. Test After Fixes
```bash
# Start backend
npm run dev

# In another terminal, test health check
curl http://localhost:3000/health

# Test registration with invalid email
curl -X POST http://localhost:3000/api/business/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "venueName": "Test Club",
    "businessEmail": "invalid-email",
    "location": {
      "address": "123 Main St",
      "city": "Los Angeles",
      "state": "CA",
      "zipCode": "90001",
      "country": "USA"
    },
    "businessType": "CLUB"
  }'

# Should return: {"success":false,"error":"Invalid email address format"}
```

---

## ⏰ Estimated Time to Fix

- **Critical Fixes (1-7):** 4-6 hours
- **High Priority (8-10):** 2-3 hours
- **Testing:** 2 hours

**Total:** 1 full day of focused work

---

## ✅ After Fixes Checklist

- [ ] All packages installed
- [ ] Input validation added to all controllers
- [ ] Rate limiting configured
- [ ] Transaction support implemented
- [ ] Logging added
- [ ] Environment variables validated
- [ ] Health check enhanced
- [ ] Frontend validation added
- [ ] Manual testing completed
- [ ] Error scenarios tested
- [ ] Logs directory created
- [ ] Documentation updated

---

## 🚨 REMEMBER

**DO NOT deploy to production until:**
1. All 7 critical fixes are implemented
2. All tests pass
3. Email service is configured (not dev mode)
4. MongoDB is properly secured
5. Environment variables are set correctly
6. SSL certificates are installed
7. Rate limiting is tested
8. Transaction rollback is tested

**Current Status:** These fixes make the system MINIMALLY production-ready. Additional features and improvements are still needed for a complete production deployment.
