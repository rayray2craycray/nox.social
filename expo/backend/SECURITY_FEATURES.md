# Security Features Documentation

This document outlines all security features implemented in the Rork Nightlife backend API.

**Last Updated:** January 28, 2026
**Backend Version:** 2.0.0

---

## Table of Contents

1. [NoSQL Injection Prevention](#nosql-injection-prevention)
2. [CSRF Protection](#csrf-protection)
3. [Database Connection Pooling](#database-connection-pooling)
4. [API Versioning](#api-versioning)
5. [Rate Limiting](#rate-limiting)
6. [CORS Configuration](#cors-configuration)
7. [Security Headers (Helmet)](#security-headers)
8. [JWT Authentication](#jwt-authentication)
9. [Password Security](#password-security)
10. [Input Validation](#input-validation)
11. [File Upload Security](#file-upload-security)
12. [Error Monitoring (Sentry)](#error-monitoring)

---

## 1. NoSQL Injection Prevention

### Overview
Prevents NoSQL injection attacks where malicious users try to inject MongoDB operators like `$ne`, `$gt`, `$where`, etc.

### Implementation
- **Package:** `express-mongo-sanitize` v2.2.0
- **Location:** `src/server.js` (lines 111-121)

### How It Works
```javascript
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logger.warn('Potential NoSQL injection attempt detected', {
      ip: req.ip,
      key,
      path: req.path,
    });
  },
}));
```

- Strips out keys that start with `$` or contain `.`
- Replaces with underscore `_` instead
- Logs all sanitization attempts for security monitoring

### Example Attack Prevention
```javascript
// Malicious request:
POST /api/auth/login
{ "email": { "$ne": null }, "password": "anything" }

// After sanitization:
{ "email": { "_ne": null }, "password": "anything" }
// This won't match MongoDB operators, attack prevented
```

---

## 2. CSRF Protection

### Overview
Modern CSRF protection using double-submit cookie pattern, suitable for JWT-based APIs.

### Implementation
- **Custom middleware:** `src/middleware/csrf.middleware.js`
- **Pattern:** Double-submit cookie
- **Location:** Applied globally in `src/server.js`

### How It Works

1. **Token Generation (GET requests)**
   - Server generates random 64-character token
   - Sets HTTP-only cookie: `csrfToken`
   - Returns token in header: `X-CSRF-Token`

2. **Token Validation (POST/PUT/PATCH/DELETE)**
   - Client must send token in `X-CSRF-Token` header
   - Server validates cookie token matches header token
   - Both must be present and identical

### Usage for Clients

**Step 1: Get CSRF Token**
```bash
curl -X GET http://localhost:3000/api/csrf-token \
  -c cookies.txt

# Response:
{
  "success": true,
  "csrfToken": "fa7336d2eacd12cc878acac5a4de5462..."
}
```

**Step 2: Include Token in Requests**
```bash
curl -X POST http://localhost:3000/api/business/register \
  -b cookies.txt \
  -H "X-CSRF-Token: fa7336d2eacd12cc878acac5a4de5462..." \
  -H "Content-Type: application/json" \
  -d '{"venueName": "..."}'
```

### When to Use
CSRF protection is **optional** for:
- JWT-based authentication (tokens in headers/localStorage)
- APIs consumed by mobile apps

CSRF protection is **required** for:
- Cookie-based sessions
- Browser-based applications with credentials
- State-changing operations from web forms

### Exempting Routes
```javascript
const { csrfExempt } = require('./middleware/csrf.middleware');

// Exempt webhooks from CSRF
app.use('/api/webhooks', csrfExempt(['/api/webhooks']));
```

---

## 3. Database Connection Pooling

### Overview
Efficient MongoDB connection management with configurable pool sizes for optimal performance under load.

### Implementation
- **Location:** `src/config/database.js`
- **Driver:** Mongoose 8.0.3

### Configuration
```javascript
mongoose.connect(process.env.MONGODB_URI, {
  // Connection pooling
  maxPoolSize: parseInt(process.env.DB_POOL_SIZE) || 10,
  minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE) || 5,

  // Timeouts
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,

  // Retry settings
  retryWrites: true,
  retryReads: true,
});
```

### Environment Variables
```bash
# .env
DB_POOL_SIZE=10          # Maximum connections
DB_MIN_POOL_SIZE=5       # Minimum connections to maintain
```

### Production Recommendations
- **Small app** (< 1000 concurrent users): `DB_POOL_SIZE=10`
- **Medium app** (1000-10000 users): `DB_POOL_SIZE=20`
- **Large app** (> 10000 users): `DB_POOL_SIZE=50`

### Benefits
- ✅ Reduces connection overhead
- ✅ Maintains minimum connections for fast response
- ✅ Prevents connection exhaustion
- ✅ Automatic connection recycling

---

## 4. API Versioning

### Overview
Documented versioning strategy for API stability and backward compatibility.

### Implementation Strategy
- **Legacy routes:** Use `/v1` prefix
- **New routes:** Unversioned `/api` prefix
- **Documentation:** Included in root endpoint

### Current Structure
```javascript
// Legacy versioned routes
app.use('/api/v1', usersRoutes);      // /api/v1/users/...
app.use('/api/v1', venuesRoutes);     // /api/v1/venues/...

// Modern unversioned routes
app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/admin', adminRoutes);
```

### Versioning Information
```bash
GET http://localhost:3000/

{
  "name": "Rork Nightlife API",
  "version": "2.0.0",
  "versioning": "Legacy routes use /v1 prefix, newer features are unversioned",
  "endpoints": {
    "users": "/api/v1/users",
    "venues": "/api/v1/venues",
    "auth": "/api/auth",
    "business": "/api/business"
  }
}
```

### Future Versioning
When breaking changes are needed:
1. Create new versioned routes (e.g., `/api/v2/users`)
2. Maintain v1 routes for backward compatibility
3. Add deprecation warnings to v1 endpoints
4. Set sunset date for v1 (6-12 months)

---

## 5. Rate Limiting

### Overview
Prevents abuse by limiting request frequency per IP address.

### Implementation
- **Package:** `express-rate-limit` v7.5.1
- **Location:** `src/server.js`

### Default Limits
```javascript
// General API rate limit
windowMs: 15 * 60 * 1000,  // 15 minutes
max: 100,                   // 100 requests per window

// Stricter limits for specific routes
Upload routes:     10 requests / 15 minutes
Business reg:      3 requests / 1 hour
```

### Configuration
```bash
# .env
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100      # Max requests per window
```

### Response When Rate Limited
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```
HTTP Status: `429 Too Many Requests`

---

## 6. CORS Configuration

### Overview
Controls which domains can make cross-origin requests to the API.

### Implementation
```javascript
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
```

### Configuration
```bash
# .env
ALLOWED_ORIGINS=http://localhost:19006,https://rork.app,https://api.rork.app
```

### Production Setup
```bash
# .env.production
ALLOWED_ORIGINS=https://rork.app,https://www.rork.app,https://admin.rork.app
```

---

## 7. Security Headers (Helmet)

### Overview
Sets various HTTP security headers to protect against common vulnerabilities.

### Implementation
```javascript
app.use(helmet());
```

### Headers Applied
- **X-DNS-Prefetch-Control:** Controls DNS prefetching
- **X-Frame-Options:** Prevents clickjacking (SAMEORIGIN)
- **X-Content-Type-Options:** Prevents MIME sniffing (nosniff)
- **X-XSS-Protection:** Enables XSS filter (1; mode=block)
- **Strict-Transport-Security:** Enforces HTTPS
- **Content-Security-Policy:** Prevents XSS/injection attacks

### Custom CSP (Optional)
Add to `.env.production`:
```bash
CSP_DIRECTIVES="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
```

---

## 8. JWT Authentication

### Overview
Secure token-based authentication with access and refresh tokens.

### Implementation
- **Location:** `src/utils/jwt.utils.js`
- **Package:** `jsonwebtoken` v9.0.2

### Configuration
```bash
# .env
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d              # Access token expiry
JWT_REFRESH_EXPIRES_IN=30d     # Refresh token expiry
```

### Token Types

**Access Token (JWT)**
- Short-lived (7 days default)
- Signed with `JWT_SECRET`
- Contains: `userId`, `email`, `role`
- Sent in Authorization header: `Bearer <token>`

**Refresh Token**
- Long-lived (30 days default)
- Random 64-byte hex string
- Stored in database
- Used to obtain new access tokens

### Security Features
- ✅ Tokens are stateless (no server-side sessions)
- ✅ Secret key from environment (never hardcoded)
- ✅ Automatic expiration
- ✅ Refresh token rotation
- ✅ Token revocation support (via database)

---

## 9. Password Security

### Overview
Secure password hashing using industry-standard bcrypt algorithm.

### Implementation
- **Package:** `bcryptjs` v2.4.3
- **Location:** `src/models/User.js`

### Configuration
```bash
# .env
BCRYPT_SALT_ROUNDS=10      # Development (faster)

# .env.production
BCRYPT_SALT_ROUNDS=12      # Production (more secure)
```

### How It Works
```javascript
// Pre-save hook hashes password
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Comparison method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
```

### Password Requirements
Enforced in `src/routes/auth.routes.js`:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

---

## 10. Input Validation

### Overview
Comprehensive input validation and sanitization to prevent injection attacks.

### Implementation
- **Package:** `express-validator` v7.3.1
- **Sanitization:** `validator` v13.15.26

### Validation Examples

**User Registration:**
```javascript
router.post('/signup', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('displayName').trim().escape(),
], userController.signup);
```

**Business Registration:**
```javascript
router.post('/register', [
  body('venueName').trim().notEmpty(),
  body('businessEmail').isEmail(),
  body('phone').matches(/^\+?[1-9]\d{1,14}$/),
], businessController.register);
```

### XSS Prevention
```javascript
const validator = require('validator');

// Escape HTML in user input
const safeName = validator.escape(businessProfile.venueName);
```

---

## 11. File Upload Security

### Overview
Secure file upload handling with size limits, type validation, and malware prevention.

### Implementation
- **Package:** `multer` v1.4.5-lts.1
- **Storage:** Cloudinary (cloud storage)
- **Location:** `src/routes/upload.routes.js`

### File Size Limits
```javascript
// General uploads
const generalUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Specific limits
Documents:       10MB
Profile pics:    10MB
Videos:          50MB
```

### File Type Validation
```javascript
// Only allow images and videos
const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'video/mp4'];

if (!allowedTypes.includes(file.mimetype)) {
  return res.status(400).json({
    error: 'Invalid file type'
  });
}
```

### Security Features
- ✅ Memory storage (no disk writes)
- ✅ MIME type validation
- ✅ File size limits per route
- ✅ Automatic virus scanning (via Cloudinary)
- ✅ Secure random filenames
- ✅ Cloud storage (isolated from server)

---

## 12. Error Monitoring (Sentry)

### Overview
Real-time error tracking and performance monitoring in production.

### Implementation
- **Package:** `@sentry/node` v10.37.0
- **Location:** `src/config/sentry.js`

### Configuration
```bash
# .env.production
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_RELEASE=nox-social@2.0.0
NODE_ENV=production
```

### Features
- ✅ Automatic error capture
- ✅ Performance monitoring (10% sampling in production)
- ✅ Request context tracking
- ✅ User information attachment
- ✅ Source maps for stack traces
- ✅ Release tracking
- ✅ Environment-aware

### Error Filtering
```javascript
beforeSend(event, hint) {
  // Don't send health check errors
  if (event.request?.url?.includes('/health')) {
    return null;
  }
  return event;
}
```

---

## Security Checklist for Production

### Before Deployment
- [ ] Set strong `JWT_SECRET` (min 32 chars)
- [ ] Configure `ALLOWED_ORIGINS` for production domains
- [ ] Set `BCRYPT_SALT_ROUNDS=12`
- [ ] Configure `DB_POOL_SIZE` based on load
- [ ] Set up Sentry with production DSN
- [ ] Enable HTTPS (set `NODE_ENV=production`)
- [ ] Configure rate limits for production traffic
- [ ] Review and update CORS origins
- [ ] Set secure cookie options (httpOnly, secure, sameSite)
- [ ] Configure CSP headers via Helmet
- [ ] Set up database backups (automated)
- [ ] Enable request logging to files
- [ ] Configure firewall rules (allow only necessary ports)

### After Deployment
- [ ] Monitor Sentry for errors
- [ ] Review rate limit logs
- [ ] Check CSRF protection is working
- [ ] Verify NoSQL injection prevention
- [ ] Test file upload limits
- [ ] Validate JWT token expiration
- [ ] Test database connection pooling under load
- [ ] Review security headers in responses
- [ ] Verify CORS is blocking unauthorized domains

---

## Security Contact

For security vulnerabilities or concerns, please contact:
- **Email:** security@rork.app
- **Report:** https://github.com/rork-nightlife/backend/security/advisories

---

**Document Version:** 1.0
**Last Review:** January 28, 2026
**Next Review:** April 28, 2026 (quarterly)
