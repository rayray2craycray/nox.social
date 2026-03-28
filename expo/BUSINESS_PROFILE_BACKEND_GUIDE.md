# Business Profile & Venue Management - Backend Implementation Guide

## Overview

Complete backend implementation for:
1. Business profile registration
2. Email verification system
3. Role-based venue permissions
4. Venue editing with authorization

---

## Database Schema

### MongoDB Collections

#### 1. **business_profiles**

```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Reference to users collection
  venueName: String,
  venueId: ObjectId, // Reference to venues collection (null until approved)
  businessEmail: String,
  location: {
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: {
      type: "Point",
      coordinates: [longitude, latitude]
    }
  },
  phone: String,
  website: String,
  businessType: String, // 'BAR' | 'CLUB' | 'LOUNGE' | 'RESTAURANT' | 'OTHER'
  status: String, // 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED'
  verificationToken: String,
  verificationTokenExpiry: Date,
  emailVerified: Boolean,
  emailVerifiedAt: Date,
  documentsSubmitted: Boolean,
  documentsApproved: Boolean,
  rejectionReason: String,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.business_profiles.createIndex({ userId: 1 });
db.business_profiles.createIndex({ businessEmail: 1 }, { unique: true });
db.business_profiles.createIndex({ verificationToken: 1 });
db.business_profiles.createIndex({ venueId: 1 });
db.business_profiles.createIndex({ status: 1 });
```

#### 2. **venue_roles**

```javascript
{
  _id: ObjectId,
  venueId: ObjectId, // Reference to venues collection
  userId: ObjectId, // Reference to users collection
  role: String, // 'HEAD_MODERATOR' | 'MODERATOR' | 'STAFF' | 'VIEWER'
  permissions: [String], // Array of permission strings
  assignedBy: ObjectId, // User ID who assigned this role
  assignedAt: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.venue_roles.createIndex({ venueId: 1, userId: 1 }, { unique: true });
db.venue_roles.createIndex({ userId: 1 });
db.venue_roles.createIndex({ venueId: 1, isActive: 1 });
```

#### 3. **email_verification_tokens**

```javascript
{
  _id: ObjectId,
  businessProfileId: ObjectId,
  email: String,
  token: String,
  expiresAt: Date,
  verifiedAt: Date,
  createdAt: Date
}

// Indexes
db.email_verification_tokens.createIndex({ token: 1 }, { unique: true });
db.email_verification_tokens.createIndex({ businessProfileId: 1 });
db.email_verification_tokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
```

#### 4. **venue_edit_history**

```javascript
{
  _id: ObjectId,
  venueId: ObjectId,
  userId: ObjectId,
  changes: [{
    field: String,
    oldValue: Mixed,
    newValue: Mixed,
    timestamp: Date
  }],
  status: String, // 'APPROVED' (auto for HEAD_MODERATOR)
  createdAt: Date
}

// Indexes
db.venue_edit_history.createIndex({ venueId: 1, createdAt: -1 });
db.venue_edit_history.createIndex({ userId: 1 });
```

---

## API Endpoints

### Business Registration

#### POST `/api/business/register`

Register a new business profile and send verification email.

**Request Body**:
```json
{
  "venueName": "The Blue Note",
  "businessEmail": "owner@bluenote.com",
  "location": {
    "address": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "phone": "+1 (555) 123-4567",
  "website": "https://bluenote.com",
  "businessType": "CLUB"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "businessProfile": {
      "id": "507f1f77bcf86cd799439011",
      "venueName": "The Blue Note",
      "businessEmail": "owner@bluenote.com",
      "status": "PENDING_VERIFICATION",
      "emailVerified": false
    }
  },
  "message": "Verification email sent to owner@bluenote.com"
}
```

**Implementation**:
```javascript
// backend/routes/business.routes.js
const express = require('express');
const router = express.Router();
const { registerBusiness } = require('../controllers/business.controller');
const { authenticate } = require('../middleware/auth');

router.post('/register', authenticate, registerBusiness);

module.exports = router;

// backend/controllers/business.controller.js
const BusinessProfile = require('../models/BusinessProfile');
const EmailVerificationToken = require('../models/EmailVerificationToken');
const { sendVerificationEmail } = require('../services/email.service');
const crypto = require('crypto');

exports.registerBusiness = async (req, res) => {
  try {
    const { venueName, businessEmail, location, phone, website, businessType } = req.body;
    const userId = req.user.id;

    // Check if user already has a business profile
    const existing = await BusinessProfile.findOne({ userId });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'User already has a business profile'
      });
    }

    // Check if email already registered
    const existingEmail = await BusinessProfile.findOne({ businessEmail });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        error: 'Business email already registered'
      });
    }

    // Create business profile
    const businessProfile = await BusinessProfile.create({
      userId,
      venueName,
      businessEmail,
      location,
      phone,
      website,
      businessType,
      status: 'PENDING_VERIFICATION',
      emailVerified: false,
      documentsSubmitted: false,
      documentsApproved: false
    });

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await EmailVerificationToken.create({
      businessProfileId: businessProfile._id,
      email: businessEmail,
      token,
      expiresAt
    });

    // Send verification email
    const verificationUrl = `${process.env.APP_URL}/verify-email/${token}`;
    await sendVerificationEmail(businessEmail, venueName, verificationUrl);

    res.status(201).json({
      success: true,
      data: {
        businessProfile: {
          id: businessProfile._id,
          venueName: businessProfile.venueName,
          businessEmail: businessProfile.businessEmail,
          status: businessProfile.status,
          emailVerified: businessProfile.emailVerified
        }
      },
      message: `Verification email sent to ${businessEmail}`
    });
  } catch (error) {
    console.error('Business registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
```

---

### Email Verification

#### GET `/api/business/verify-email/:token`

Verify business email using token from email link.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "businessProfile": {
      "id": "507f1f77bcf86cd799439011",
      "emailVerified": true,
      "emailVerifiedAt": "2026-01-21T17:30:00.000Z",
      "status": "VERIFIED"
    },
    "venueRole": {
      "id": "507f191e810c19729de860ea",
      "role": "HEAD_MODERATOR",
      "permissions": ["FULL_ACCESS"]
    }
  },
  "message": "Email verified successfully. You are now the Head Moderator."
}
```

**Implementation**:
```javascript
// backend/controllers/business.controller.js
const VenueRole = require('../models/VenueRole');

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Find verification token
    const verificationToken = await EmailVerificationToken.findOne({
      token,
      verifiedAt: null,
      expiresAt: { $gt: new Date() }
    });

    if (!verificationToken) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token'
      });
    }

    // Get business profile
    const businessProfile = await BusinessProfile.findById(
      verificationToken.businessProfileId
    );

    if (!businessProfile) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found'
      });
    }

    // Mark email as verified
    businessProfile.emailVerified = true;
    businessProfile.emailVerifiedAt = new Date();
    businessProfile.status = 'VERIFIED';
    await businessProfile.save();

    // Mark token as used
    verificationToken.verifiedAt = new Date();
    await verificationToken.save();

    // Create or link to venue
    let venueId = businessProfile.venueId;

    if (!venueId) {
      // Create new venue or match to existing
      // This would involve geocoding the address and matching to existing venues
      // For now, we'll assume venue creation happens separately
      // venueId = await createVenueFromBusinessProfile(businessProfile);
    }

    // Create HEAD_MODERATOR role
    const venueRole = await VenueRole.create({
      venueId: businessProfile.venueId || null, // Set when venue is assigned
      userId: businessProfile.userId,
      role: 'HEAD_MODERATOR',
      permissions: ['FULL_ACCESS'],
      assignedBy: businessProfile.userId, // Self-assigned via verification
      assignedAt: new Date(),
      isActive: true
    });

    res.json({
      success: true,
      data: {
        businessProfile: {
          id: businessProfile._id,
          emailVerified: businessProfile.emailVerified,
          emailVerifiedAt: businessProfile.emailVerifiedAt,
          status: businessProfile.status
        },
        venueRole: {
          id: venueRole._id,
          role: venueRole.role,
          permissions: venueRole.permissions
        }
      },
      message: 'Email verified successfully. You are now the Head Moderator.'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
```

---

### Resend Verification Email

#### POST `/api/business/resend-verification`

Resend verification email to business owner.

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Verification email resent"
}
```

---

### Get Business Profile

#### GET `/api/business/profile`

Get current user's business profile.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "businessProfile": {
      "id": "507f1f77bcf86cd799439011",
      "venueName": "The Blue Note",
      "businessEmail": "owner@bluenote.com",
      "status": "VERIFIED",
      "emailVerified": true,
      "venueId": "507f191e810c19729de860ea"
    }
  }
}
```

---

### Get Venue Roles

#### GET `/api/venues/roles`

Get all venue roles for current user.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "id": "507f191e810c19729de860ea",
        "venueId": "507f1f77bcf86cd799439011",
        "venueName": "The Blue Note",
        "role": "HEAD_MODERATOR",
        "permissions": ["FULL_ACCESS"],
        "isActive": true
      }
    ]
  }
}
```

---

### Update Venue Information

#### PATCH `/api/venues/:venueId/info`

Update venue basic information (requires EDIT_VENUE_INFO permission).

**Request Body**:
```json
{
  "name": "The Blue Note Jazz Club",
  "location": {
    "address": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "country": "USA"
  },
  "coverCharge": 25,
  "hours": {
    "monday": "6:00 PM - 2:00 AM",
    "tuesday": "6:00 PM - 2:00 AM"
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "venue": { /* updated venue */ }
  },
  "message": "Venue information updated successfully"
}
```

**Implementation**:
```javascript
// backend/controllers/venue.controller.js
const Venue = require('../models/Venue');
const VenueRole = require('../models/VenueRole');
const VenueEditHistory = require('../models/VenueEditHistory');

exports.updateVenueInfo = async (req, res) => {
  try {
    const { venueId } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    // Check permissions
    const role = await VenueRole.findOne({
      venueId,
      userId,
      isActive: true
    });

    if (!role) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this venue'
      });
    }

    const hasPermission =
      role.role === 'HEAD_MODERATOR' ||
      role.permissions.includes('FULL_ACCESS') ||
      role.permissions.includes('EDIT_VENUE_INFO');

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to edit venue information'
      });
    }

    // Get current venue
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({
        success: false,
        error: 'Venue not found'
      });
    }

    // Track changes
    const changes = [];
    Object.keys(updates).forEach(field => {
      if (JSON.stringify(venue[field]) !== JSON.stringify(updates[field])) {
        changes.push({
          field,
          oldValue: venue[field],
          newValue: updates[field],
          timestamp: new Date()
        });
      }
    });

    // Update venue
    Object.assign(venue, updates);
    await venue.save();

    // Log edit history
    if (changes.length > 0) {
      await VenueEditHistory.create({
        venueId,
        userId,
        changes,
        status: 'APPROVED' // Auto-approved for authorized users
      });
    }

    res.json({
      success: true,
      data: { venue },
      message: 'Venue information updated successfully'
    });
  } catch (error) {
    console.error('Update venue error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
```

---

### Update Venue Display

#### PATCH `/api/venues/:venueId/display`

Update venue display settings (requires EDIT_VENUE_DISPLAY permission).

**Request Body**:
```json
{
  "imageUrl": "https://cloudinary.com/...",
  "description": "Premier jazz club in downtown Manhattan",
  "tags": ["Jazz", "Live Music", "Cocktails"]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "venue": { /* updated venue */ }
  },
  "message": "Venue display updated successfully"
}
```

---

## Email Service

### Email Templates

#### Verification Email Template

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 30px 0;
      background: linear-gradient(135deg, #ff0080 0%, #cc0066 100%);
      color: white;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .button {
      display: inline-block;
      padding: 15px 30px;
      background: #ff0080;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      color: #999;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Verify Your Business Email</h1>
  </div>
  <div class="content">
    <h2>Welcome to Rork Nightlife, {{venueName}}!</h2>

    <p>Thank you for registering your business. To complete your registration and become the Head Moderator of your venue's profile, please verify your email address.</p>

    <p style="text-align: center;">
      <a href="{{verificationUrl}}" class="button">Verify Email Address</a>
    </p>

    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #666;">{{verificationUrl}}</p>

    <p><strong>What happens next?</strong></p>
    <ul>
      <li>You'll become the Head Moderator of {{venueName}}</li>
      <li>Full access to edit venue information and display</li>
      <li>Ability to manage events, tickets, and staff</li>
      <li>Access to venue analytics and insights</li>
    </ul>

    <p><strong>This link expires in 24 hours.</strong></p>

    <p>If you didn't request this verification, please ignore this email.</p>
  </div>
  <div class="footer">
    <p>&copy; 2026 Rork Nightlife. All rights reserved.</p>
    <p>Questions? Contact us at support@rork.app</p>
  </div>
</body>
</html>
```

### Email Service Implementation

```javascript
// backend/services/email.service.js
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

// Configure email transporter
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

exports.sendVerificationEmail = async (email, venueName, verificationUrl) => {
  try {
    // Load template
    const templatePath = path.join(__dirname, '../templates/verify-email.html');
    const templateSource = await fs.readFile(templatePath, 'utf-8');
    const template = handlebars.compile(templateSource);

    // Render template
    const html = template({
      venueName,
      verificationUrl
    });

    // Send email
    await transporter.sendMail({
      from: '"Rork Nightlife" <noreply@rork.app>',
      to: email,
      subject: `Verify your business email for ${venueName}`,
      html
    });

    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error('Failed to send verification email');
  }
};
```

---

## Environment Variables

Add to `backend/.env.production`:

```bash
# Email Service
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=465
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key

# App URLs
APP_URL=https://rork.app
API_URL=https://api.rork.app

# Email Verification
EMAIL_VERIFICATION_EXPIRY_HOURS=24
```

---

## Permission System Reference

### Permission Levels

| Role | Permissions |
|------|-------------|
| **HEAD_MODERATOR** | FULL_ACCESS (all permissions) |
| **MODERATOR** | EDIT_VENUE_DISPLAY, MANAGE_EVENTS, MANAGE_GUEST_LIST, MANAGE_CONTENT |
| **STAFF** | MANAGE_GUEST_LIST, VIEW_ANALYTICS |
| **VIEWER** | VIEW_ANALYTICS |

### Permission Checks

```javascript
// Middleware to check venue permission
const checkVenuePermission = (permission) => {
  return async (req, res, next) => {
    const { venueId } = req.params;
    const userId = req.user.id;

    const role = await VenueRole.findOne({
      venueId,
      userId,
      isActive: true
    });

    if (!role) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const hasPermission =
      role.role === 'HEAD_MODERATOR' ||
      role.permissions.includes('FULL_ACCESS') ||
      role.permissions.includes(permission);

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: `Permission '${permission}' required`
      });
    }

    req.venueRole = role;
    next();
  };
};

// Usage
router.patch(
  '/venues/:venueId/info',
  authenticate,
  checkVenuePermission('EDIT_VENUE_INFO'),
  updateVenueInfo
);
```

---

## Testing

### Test Email Verification Flow

```bash
# 1. Register business
curl -X POST http://localhost:5000/api/business/register \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "venueName": "Test Club",
    "businessEmail": "test@example.com",
    "location": {
      "address": "123 Test St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    },
    "businessType": "CLUB"
  }'

# 2. Get verification token from database
mongo
> use rork_nightlife
> db.email_verification_tokens.find().pretty()

# 3. Verify email
curl -X GET http://localhost:5000/api/business/verify-email/${TOKEN}

# 4. Check venue role created
> db.venue_roles.find({ userId: ObjectId("...") }).pretty()
```

---

## Security Considerations

1. **Rate Limiting**: Limit verification email requests to prevent abuse
2. **Token Expiry**: Verification tokens expire after 24 hours
3. **Email Validation**: Validate email format and check against disposable email domains
4. **Permission Hierarchy**: HEAD_MODERATOR cannot be removed except by themselves
5. **Audit Logging**: Log all venue edits with user ID and timestamp
6. **Email Verification Required**: User must verify email before becoming moderator

---

## Deployment Checklist

- [ ] Set up MongoDB indexes
- [ ] Configure SMTP service (SendGrid/Mailgun)
- [ ] Set environment variables
- [ ] Deploy email templates
- [ ] Test email delivery
- [ ] Set up email monitoring (bounce rate, delivery rate)
- [ ] Configure rate limiting
- [ ] Set up audit logging
- [ ] Test permission system
- [ ] Create admin dashboard for approval workflow

---

**Backend implementation complete!** 🎉

Next steps: Deploy backend and test end-to-end flow.
