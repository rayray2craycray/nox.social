# Security Audit — Nox Nightlife App

**Date:** 2026-03-09
**Scope:** Full-stack (React Native frontend + Node.js backend)

---

## Critical Findings

### 1. Hardcoded Google Maps API Keys — FIXED
**File:** `app.config.js` (lines 64, 91, 149)
**Severity:** HIGH
**Status:** FIXED — removed hardcoded fallbacks, now requires env vars.
**Action needed:** Rotate the exposed key `AIzaSyBTR8B7HNcmI58gqKP23Pr0Bb0uO4ymJhI` in Google Cloud Console. Restrict new key to app bundle IDs only.

### 2. Default JWT Secret Fallback — FIXED
**File:** `backend/utils/jwt.utils.ts:4`
**Severity:** HIGH
**Status:** FIXED — now throws if `JWT_SECRET` env var is missing. No fallback.

### 3. Production Credentials in `backend/.env`
**File:** `backend/.env`
**Severity:** CRITICAL
**Status:** OPEN — file is gitignored but contains live Cloudinary, Resend, and POS encryption credentials.
**Action needed:**
- Rotate Cloudinary API key/secret at cloudinary.com
- Rotate Resend email API key at resend.com
- Rotate POS encryption key
- Move all secrets to Heroku config vars (not `.env` files)

### 4. `backend/PRODUCTION_SECRETS.txt` Contains All Credentials
**File:** `backend/PRODUCTION_SECRETS.txt`
**Severity:** CRITICAL
**Status:** OPEN — gitignored but contains MongoDB password, JWT secret, all API keys in plaintext.
**Action needed:**
- Delete this file after migrating secrets to Heroku config vars
- Run `git filter-branch` or `bfg-repo-cleaner` if it was ever committed to git history
- Change MongoDB Atlas password immediately

---

## Security Strengths

| Area | Status | Details |
|------|--------|---------|
| Input validation (frontend) | EXCELLENT | Zod schemas for all forms |
| Input sanitization | EXCELLENT | Comprehensive `sanitization.ts` with XSS/injection prevention |
| NoSQL injection prevention | EXCELLENT | `express-mongo-sanitize` middleware |
| CSRF protection | EXCELLENT | Double-submit cookie pattern |
| Rate limiting | GOOD | Global + per-route limits via `express-rate-limit` |
| Password hashing | GOOD | bcrypt with salt |
| Security headers | GOOD | Helmet middleware enabled |
| Token storage | GOOD | `expo-secure-store` on mobile |
| CORS | GOOD | Environment-configured allowed origins |
| Error disclosure | GOOD | Stack traces only in development |
| Request size limits | GOOD | 1MB general, 50MB uploads |
| Auth middleware | GOOD | JWT verification + user existence check |
| HTTPS | GOOD | Enforced in production |
| XSS | GOOD | No `dangerouslySetInnerHTML`, no `eval()` |

---

## Recommendations

### Immediate
1. Rotate ALL exposed credentials (Google Maps, Cloudinary, Resend, MongoDB, JWT secret)
2. Delete `PRODUCTION_SECRETS.txt` and use Heroku config vars exclusively
3. Enable GitHub secret scanning on the repository
4. Add `detect-secrets` pre-commit hook

### Short-term
1. Add Joi/Zod validation to backend controllers (currently basic string checks)
2. Implement per-user rate limiting (current is per-IP only)
3. Shorten JWT access token expiry (currently 7d, recommend 15m with refresh)

### Long-term
1. Set up automated dependency vulnerability scanning (Snyk or `npm audit` in CI)
2. Implement WAF for the Heroku deployment
3. Regular penetration testing schedule
