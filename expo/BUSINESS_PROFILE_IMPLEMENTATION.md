# Business Profile & Venue Management Implementation

## Overview
Complete implementation of business profile registration, email verification, and venue management system with role-based permissions.

---

## ✅ What Was Implemented

### 1. Backend Infrastructure

#### **Database Models** (`/backend/src/models/`)
- ✅ **BusinessProfile.js** - Stores business registration data
  - User info, venue details, verification status
  - Geospatial coordinates for location
  - Business type categorization
  - TTL indexes for expired profiles

- ✅ **VenueRole.js** - Manages user permissions for venues
  - 4 role types: HEAD_MODERATOR, MODERATOR, STAFF, VIEWER
  - 11 granular permissions (EDIT_VENUE_INFO, MANAGE_EVENTS, etc.)
  - Default permissions per role
  - Compound unique index (one role per user per venue)

- ✅ **EmailVerificationToken.js** - Tracks verification tokens
  - Crypto-generated tokens
  - 24-hour expiry
  - Automatic cleanup via TTL index

- ✅ **Venue.js** - Venue data model
  - Location with geospatial indexing
  - Hours, tags, cover charge
  - Links to business profile

#### **Controllers** (`/backend/src/controllers/`)
- ✅ **business.controller.js** - 5 functions
  - `registerBusiness()` - Create profile + send verification email
  - `verifyEmail()` - Verify token + create HEAD_MODERATOR role + link venue
  - `resendVerificationEmail()` - Resend verification
  - `getBusinessProfile()` - Get user's business profile
  - `updateBusinessProfile()` - Update profile details

- ✅ **venue.controller.js** - 7 functions
  - `getUserVenueRoles()` - Get all user's venue roles
  - `getVenueDetails()` - Get venue info + user's role
  - `updateVenueInfo()` - Update basic venue info (permission-protected)
  - `updateVenueDisplay()` - Update images/tags (permission-protected)
  - `assignVenueRole()` - Assign role to user (HEAD_MODERATOR only)
  - `removeVenueRole()` - Remove role from user
  - `getVenueStaff()` - List all staff for venue

#### **Services** (`/backend/src/services/`)
- ✅ **email.service.js**
  - Professional HTML email template
  - Dev mode (logs to console if SMTP not configured)
  - Production mode (sends via nodemailer)
  - Functions: `sendVerificationEmail()`, `sendPasswordResetEmail()`, `sendWelcomeEmail()`

#### **Middleware** (`/backend/src/middleware/`)
- ✅ **venuePermissions.js** - 3 middleware functions
  - `checkVenuePermission(permission)` - Checks specific permission
  - `hasVenueAccess()` - Checks any access to venue
  - `isHeadModerator()` - Checks HEAD_MODERATOR role

#### **Routes** (`/backend/src/routes/`)
- ✅ **business.routes.js**
  ```
  POST   /api/business/register              - Register business
  GET    /api/business/verify-email/:token   - Verify email
  POST   /api/business/resend-verification   - Resend email
  GET    /api/business/profile                - Get profile
  PATCH  /api/business/profile                - Update profile
  ```

- ✅ **venue.routes.js**
  ```
  GET    /api/venues/roles                    - Get user's roles
  GET    /api/venues/:venueId                 - Get venue details
  PATCH  /api/venues/:venueId/info            - Update venue info
  PATCH  /api/venues/:venueId/display         - Update venue display
  POST   /api/venues/:venueId/roles           - Assign role
  DELETE /api/venues/:venueId/roles/:roleId   - Remove role
  GET    /api/venues/:venueId/staff           - Get staff list
  ```

### 2. Frontend Implementation

#### **Types** (`/types/index.ts`)
- ✅ Added 116 lines of TypeScript interfaces
  - BusinessProfile
  - VenueRole
  - VenuePermission (11 permission types)
  - EmailVerificationToken
  - BusinessRegistrationData

#### **API Integration** (`/services/`)
- ✅ **config.ts** - Added business and venue management endpoints
- ✅ **api.ts** - Added businessApi and venueManagementApi with 12 functions

#### **Context** (`/contexts/VenueManagementContext.tsx`)
- ✅ Complete state management with React Query
- ✅ Permission checking functions (canEditVenue, canEditDisplay, etc.)
- ✅ Mutations for all operations (register, update, etc.)
- ✅ Integrated with real API endpoints

#### **Screens** (`/app/`)
- ✅ **business/register.tsx** (573 lines) - 2-step registration form
  - Step 1: Business info + location
  - Step 2: Business type + review
  - Form validation
  - Success navigation to verification pending

- ✅ **business/verification-pending.tsx** (174 lines)
  - Shows verification status
  - Resend email button
  - Step-by-step instructions

- ✅ **venue/edit/[id].tsx** (850 lines)
  - Permission-based access control
  - Cover image upload (Cloudinary)
  - Basic info editing (name, location, hours)
  - Tag management
  - Genre chips
  - Hours editor with day-by-day configuration

---

## 🔧 Configuration

### Backend Configuration

1. **Install Dependencies**
   ```bash
   cd backend
   npm install nodemailer
   ```

2. **Environment Variables**
   Create or update `backend/.env` with:
   ```env
   # Email Configuration (SMTP)
   # Leave blank to use dev mode (emails logged to console)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   SMTP_FROM=noreply@rork.app

   # Application URL (for verification links)
   APP_URL=http://localhost:19006
   FRONTEND_URL=http://localhost:19006
   ```

   **For Gmail:**
   - Enable 2FA on your Google account
   - Generate an "App Password" at https://myaccount.google.com/apppasswords
   - Use the app password as `SMTP_PASS`

3. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```

   You should see:
   ```
   🚀 Rork Nightlife API Server v2.0
   Environment: development
   Port:        3000
   Database:    MongoDB Connected

   ✅ Business Profile Management: /api/business
   ✅ Venue Management:            /api/venues
   ```

### Frontend Configuration

No additional configuration needed - API endpoints are already integrated!

---

## 🧪 Testing Guide

### Test Flow: Complete Business Registration

#### 1. **Register a Business Profile**
   - Open the app
   - Navigate to Profile tab
   - Tap "Register Business" button
   - Fill out form:
     - Venue Name: "Test Club"
     - Business Email: "yourtest@example.com"
     - Address: "123 Main St"
     - City: "Los Angeles"
     - State: "CA"
     - ZIP: "90001"
     - Business Type: "CLUB"
   - Submit form

   **Expected Result:**
   - Success alert shown
   - Redirected to "Verification Pending" screen
   - Console shows verification email (dev mode) OR email sent (production)

#### 2. **Check Verification Email (Dev Mode)**
   - Look at backend console
   - You should see:
     ```
     ===========================================
     📧 EMAIL VERIFICATION (DEV MODE)
     ===========================================
     To: yourtest@example.com
     Venue: Test Club
     Verification URL: http://localhost:19006/business/verify?token=abc123...
     ===========================================
     ```

#### 3. **Verify Email**
   - Copy the verification URL from console
   - Open in browser OR click the link (if using production SMTP)

   **Expected Result:**
   - Business profile status changes to "VERIFIED"
   - User automatically assigned "HEAD_MODERATOR" role
   - Venue created and linked to business profile
   - User has FULL_ACCESS permissions

#### 4. **Test Venue Editing**
   - Navigate to Discovery tab
   - Find your new venue on the map
   - Tap on the venue
   - Tap "Edit Venue" button

   **Expected Result:**
   - Edit screen opens (permission check passed)
   - Can upload cover image via Cloudinary
   - Can edit venue name, description
   - Can add/remove tags
   - Can update hours

   **Make some changes and save:**
   - Upload a cover image
   - Change venue name
   - Add tags: "electronic", "rooftop", "21+"
   - Save changes

   **Expected Result:**
   - Success alert shown
   - Changes reflected immediately on venue card

#### 5. **Test Permission System**
   - Log out
   - Create a second user account
   - Try to edit the same venue

   **Expected Result:**
   - Edit button is hidden (permission check failed)
   - Cannot access edit screen
   - Returns 403 error if API is called directly

---

## 📊 Database Verification

After completing the test flow, check MongoDB:

```bash
# Connect to MongoDB
mongosh

# Check business profiles
db.businessprofiles.find().pretty()

# Check venue roles
db.venueroles.find().pretty()

# Check venues
db.venues.find().pretty()

# Check verification tokens (should be empty after verification)
db.emailverificationtokens.find().pretty()
```

**Expected Data:**
1. One `businessprofiles` document with:
   - emailVerified: true
   - status: "VERIFIED"
   - venueId pointing to created venue

2. One `venueroles` document with:
   - role: "HEAD_MODERATOR"
   - permissions: ["FULL_ACCESS"]
   - isActive: true

3. One `venues` document with:
   - businessProfileId pointing to business profile
   - Updated name, tags, imageUrl from editing

4. Zero `emailverificationtokens` (auto-deleted after verification)

---

## 🐛 Troubleshooting

### "Network request failed" errors
- **Cause:** Backend server not running
- **Fix:** Start backend with `cd backend && npm run dev`

### Email not sending
- **Cause:** SMTP not configured
- **Fix:** This is expected! Dev mode logs emails to console. To send real emails, configure SMTP in `.env`

### "Permission denied" when editing venue
- **Cause:** User doesn't have the required role
- **Fix:** Verify email first to become HEAD_MODERATOR

### Token expired
- **Cause:** Verification link older than 24 hours
- **Fix:** Use "Resend Verification Email" button on verification pending screen

### Venue not appearing on map
- **Cause:** Location coordinates not set correctly
- **Fix:** Business registration should auto-geocode address. Check `venue.location.coordinates` in database.

---

## 🎯 Next Steps

### Recommended Enhancements:
1. **Add staff management UI** - Allow HEAD_MODERATOR to invite staff via email
2. **Implement role dashboard** - Show all venues user manages
3. **Add audit log** - Track who made what changes to venue
4. **Email templates** - Add welcome email, staff invitation, etc.
5. **Profile completion** - Add phone number, website, social links

### Current Limitations:
- No staff invitation system (can manually create roles in database)
- No role transfer (cannot change HEAD_MODERATOR)
- No venue deletion (must be done via database)
- No bulk operations (must update one field at a time)

---

## 📝 Summary

**Lines of Code Added:**
- Backend: ~1,200 lines (models, controllers, routes, middleware, services)
- Frontend: ~1,800 lines (types, API, context, screens, components)
- Total: **~3,000 lines**

**Features Implemented:**
- ✅ Business profile registration
- ✅ Email verification with crypto tokens
- ✅ Automatic role assignment
- ✅ Permission-based access control
- ✅ Venue editing interface
- ✅ Complete frontend-backend integration

**Ready for Testing!** 🚀
