# Backend API Integration Guide

This document provides comprehensive documentation for implementing the backend API that powers the Nox nightlife app.

## Table of Contents

- [Overview](#overview)
- [Base Configuration](#base-configuration)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Auth Endpoints](#auth-endpoints)
  - [User Endpoints](#user-endpoints)
  - [Venue Endpoints](#venue-endpoints)
  - [Payment Endpoints](#payment-endpoints)
  - [Toast POS Integration](#toast-pos-integration)
  - [Instagram Integration](#instagram-integration)
  - [Contacts Integration](#contacts-integration)
- [Error Handling](#error-handling)
- [Webhooks](#webhooks)
- [Security Considerations](#security-considerations)

---

## Overview

The Nox app requires a RESTful API backend with the following capabilities:
- User authentication and authorization (JWT-based)
- User profile and social features (friends, suggestions)
- Venue discovery and management
- Vibe check voting system
- Payment processing integration
- Third-party integrations (Toast POS, Instagram)
- Real-time features (WebSocket for chat, live updates)

**Base URL**: `https://api.nox.app/v1`

---

## Base Configuration

### Required Environment Variables

Backend should support these configuration values:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/nox

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRY=3600  # 1 hour in seconds
REFRESH_TOKEN_EXPIRY=2592000  # 30 days

# Toast POS
TOAST_CLIENT_ID=xxx
TOAST_CLIENT_SECRET=xxx
TOAST_WEBHOOK_SECRET=xxx

# Instagram
INSTAGRAM_CLIENT_ID=xxx
INSTAGRAM_CLIENT_SECRET=xxx

# Stripe
STRIPE_SECRET_KEY=sk_xxx

# AWS S3 (for media storage)
AWS_S3_BUCKET=nox-media
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx

# SendGrid (for emails)
SENDGRID_API_KEY=xxx
SENDGRID_FROM_EMAIL=noreply@nox.app

# Rate Limiting
RATE_LIMIT_MAX=100  # requests per window
RATE_LIMIT_WINDOW=900000  # 15 minutes in ms

# CORS
CORS_ORIGINS=exp://localhost:8081,nox://
```

---

## Authentication

### JWT Token Structure

The app expects JWT tokens with the following payload:

```json
{
  "sub": "user-uuid",
  "username": "john_doe",
  "role": "USER",
  "iat": 1234567890,
  "exp": 1234571490
}
```

### Authorization Header

All authenticated requests include:

```
Authorization: Bearer <access_token>
```

### Token Refresh Flow

1. Client sends refresh token to `/auth/refresh`
2. Backend validates refresh token
3. Backend issues new access + refresh tokens
4. Client stores new tokens securely (Expo SecureStore)

---

## API Endpoints

### Auth Endpoints

#### POST `/auth/register`

Register a new user account.

**Request:**
```json
{
  "username": "john_doe",
  "password": "SecurePass123",
  "email": "john@example.com",
  "displayName": "John Doe"
}
```

**Response (201):**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "user-uuid",
    "username": "john_doe",
    "displayName": "John Doe",
    "email": "john@example.com",
    "avatarUrl": null,
    "role": "USER",
    "isVerified": false
  }
}
```

**Errors:**
- `400`: Invalid input (username taken, weak password)
- `422`: Validation errors

---

#### POST `/auth/login`

Login with username/password.

**Request:**
```json
{
  "username": "john_doe",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "user-uuid",
    "username": "john_doe",
    "displayName": "John Doe",
    "email": "john@example.com",
    "avatarUrl": "https://cdn.nox.app/avatars/xxx.jpg",
    "role": "USER",
    "isVerified": true
  }
}
```

**Errors:**
- `401`: Invalid credentials
- `403`: Account locked (too many failed attempts)

---

#### POST `/auth/logout`

Invalidate current tokens.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (204):** No content

---

#### POST `/auth/refresh`

Refresh access token.

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

**Errors:**
- `401`: Invalid or expired refresh token

---

#### POST `/auth/change-password`

Change password (requires current password).

**Request:**
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewPass456"
}
```

**Response (204):** No content

---

#### DELETE `/auth/account`

Delete user account.

**Request:**
```json
{
  "password": "ConfirmPassword123"
}
```

**Response (204):** No content

---

### User Endpoints

#### GET `/users/me`

Get current user profile.

**Response (200):**
```json
{
  "id": "user-uuid",
  "username": "john_doe",
  "displayName": "John Doe",
  "bio": "Love nightlife!",
  "avatarUrl": "https://cdn.nox.app/avatars/xxx.jpg",
  "totalSpend": 15000,
  "badges": [
    {
      "venueId": "venue-1",
      "badgeType": "PLATINUM",
      "earnedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "isIncognito": false,
  "followedPerformers": ["performer-1", "performer-2"],
  "isVenueManager": false,
  "managedVenues": [],
  "role": "USER",
  "isAuthenticated": true,
  "isVerified": true,
  "verifiedCategory": null,
  "transactionHistory": []
}
```

---

#### PATCH `/users/me`

Update current user profile.

**Request:**
```json
{
  "displayName": "John Smith",
  "bio": "Updated bio",
  "isIncognito": true
}
```

**Response (200):** Returns updated user object

---

#### GET `/users/:userId`

Get user profile by ID.

**Response (200):** Returns user object

---

#### GET `/users/search?q=john&limit=20&offset=0`

Search users by username or display name.

**Response (200):**
```json
{
  "users": [
    {
      "id": "user-uuid",
      "displayName": "John Doe",
      "avatarUrl": "...",
      "bio": "...",
      "isOnline": true,
      "mutualFriends": 5
    }
  ],
  "total": 42,
  "hasMore": true
}
```

---

#### GET `/users/me/friends?limit=50&offset=0`

Get user's friends list.

**Response (200):**
```json
{
  "friends": [
    {
      "id": "user-uuid",
      "displayName": "Jane Doe",
      "avatarUrl": "...",
      "bio": "...",
      "isOnline": false,
      "mutualFriends": 12
    }
  ],
  "total": 150,
  "hasMore": true
}
```

---

#### GET `/users/me/suggestions`

Get personalized friend suggestions.

**Query Params:**
- `contacts=true` - Include contact matches
- `instagram=true` - Include Instagram matches
- `mutualFriends=true` - Include mutual friends
- `limit=20` - Max suggestions to return

**Response (200):**
```json
{
  "suggestions": [
    {
      "id": "user-uuid",
      "displayName": "Sarah Chen",
      "avatarUrl": "...",
      "bio": "...",
      "isOnline": true,
      "mutualFriends": 8,
      "source": "CONTACT | INSTAGRAM | MUTUAL_FRIENDS"
    }
  ],
  "total": 50
}
```

---

#### POST `/users/:userId/follow`

Follow a user.

**Response (204):** No content

---

#### DELETE `/users/:userId/follow`

Unfollow a user.

**Response (204):** No content

---

#### POST `/users/me/avatar`

Upload user avatar.

**Content-Type:** `multipart/form-data`

**Request:**
```
POST /users/me/avatar
Content-Type: multipart/form-data

avatar: <binary image data>
```

**Response (200):**
```json
{
  "avatarUrl": "https://cdn.nox.app/avatars/xxx.jpg"
}
```

**Constraints:**
- Max file size: 10MB
- Allowed formats: JPG, PNG, WebP
- Image will be resized to 512x512

---

### Venue Endpoints

#### GET `/venues`

Get venues near a location.

**Query Params:**
- `lat` - Latitude (required)
- `lng` - Longitude (required)
- `radius` - Search radius in km (default: 5)
- `q` - Search query
- `category` - Filter by category
- `limit` - Max results (default: 20)
- `offset` - Pagination offset

**Response (200):**
```json
{
  "venues": [
    {
      "id": "venue-uuid",
      "name": "The Nox Room",
      "address": "123 Main St",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "category": "NIGHTCLUB",
      "logoUrl": "...",
      "coverUrl": "...",
      "description": "...",
      "hasPublicLobby": true,
      "vipThreshold": 20000,
      "distance": 1.2
    }
  ],
  "total": 50,
  "hasMore": true
}
```

---

#### GET `/venues/:venueId`

Get venue details.

**Response (200):** Returns venue object

---

#### GET `/venues/:venueId/server`

Get venue server/chat details.

**Response (200):**
```json
{
  "id": "server-uuid",
  "venueId": "venue-uuid",
  "name": "The Nox Room",
  "channels": [
    {
      "id": "channel-uuid",
      "name": "General Chat",
      "type": "TEXT"
    },
    {
      "id": "channel-uuid-2",
      "name": "VIP Lounge",
      "type": "TEXT",
      "requiredTier": "PLATINUM"
    }
  ]
}
```

---

#### POST `/venues/:venueId/join`

Join a venue server.

**Request:**
```json
{
  "accessCode": "ABC123"  // optional, for private servers
}
```

**Response (200):**
```json
{
  "server": { /* server object */ },
  "channels": [/* channels array */]
}
```

---

#### POST `/venues/:venueId/leave`

Leave a venue server.

**Response (204):** No content

---

#### POST `/venues/:venueId/vibe-check`

Submit a vibe check vote.

**Request:**
```json
{
  "music": 4,  // 1-5
  "density": 3,  // 1-5
  "energy": "HIGH",  // LOW | MEDIUM | HIGH
  "waitTime": "UNDER_5"  // UNDER_5 | 5_TO_15 | 15_TO_30 | OVER_30
}
```

**Response (200):**
```json
{
  "userId": "user-uuid",
  "venueId": "venue-uuid",
  "music": 4,
  "density": 3,
  "energy": "HIGH",
  "waitTime": "UNDER_5",
  "weight": 1.0,
  "timestamp": "2024-01-15T22:30:00Z"
}
```

**Errors:**
- `429`: User in cooldown period (include `Retry-After` header)

---

#### GET `/venues/:venueId/vibe-data`

Get current vibe data for a venue.

**Response (200):**
```json
{
  "venueId": "venue-uuid",
  "musicScore": 4.2,
  "densityScore": 3.8,
  "energyLevel": "HIGH",
  "waitTime": "5_TO_15",
  "lastUpdated": "2024-01-15T22:30:00Z",
  "totalVotes": 45,
  "vibePercentage": 82
}
```

---

#### GET `/venues/:venueId/can-vote`

Check if user can vote for vibe check.

**Response (200):**
```json
{
  "canVote": false,
  "cooldownRemaining": 2700000  // milliseconds
}
```

---

### Payment Endpoints

#### GET `/payments/cards`

Get user's linked payment cards.

**Response (200):**
```json
{
  "cards": [
    {
      "id": "card-uuid",
      "last4": "4242",
      "brand": "Visa",
      "cardholderName": "John Doe",
      "isDefault": true
    }
  ]
}
```

---

#### POST `/payments/cards`

Add a new payment card.

**IMPORTANT:** Never send raw card data. Use Stripe/Square tokenization.

**Request:**
```json
{
  "token": "tok_visa",  // Token from Stripe.js
  "cardholderName": "John Doe",
  "billingZip": "94102"
}
```

**Response (200):**
```json
{
  "card": {
    "id": "card-uuid",
    "last4": "4242",
    "brand": "Visa",
    "cardholderName": "John Doe",
    "isDefault": false
  }
}
```

---

#### DELETE `/payments/cards/:cardId`

Remove a payment card.

**Response (204):** No content

---

#### POST `/payments/process`

Process a payment.

**Request:**
```json
{
  "cardId": "card-uuid",
  "amount": 5000,  // cents
  "currency": "USD",
  "venueId": "venue-uuid",
  "description": "Tab payment",
  "metadata": {
    "tabId": "tab-123"
  }
}
```

**Response (200):**
```json
{
  "transactionId": "txn-uuid",
  "status": "SUCCESS",
  "amount": 5000,
  "currency": "USD",
  "timestamp": "2024-01-15T23:00:00Z"
}
```

---

#### GET `/payments/transactions`

Get transaction history.

**Response (200):**
```json
{
  "transactions": [
    {
      "id": "txn-uuid",
      "amount": 5000,
      "currency": "USD",
      "venueId": "venue-uuid",
      "venueName": "The Nox Room",
      "status": "SUCCESS",
      "timestamp": "2024-01-15T23:00:00Z",
      "cardLast4": "4242"
    }
  ],
  "total": 50,
  "hasMore": true
}
```

---

### Toast POS Integration

#### POST `/integrations/toast/connect`

Exchange authorization code for access token.

**Request:**
```json
{
  "authorizationCode": "AUTH_CODE_FROM_TOAST"
}
```

**Response (200):**
```json
{
  "accessToken": "toast_access_token",
  "refreshToken": "toast_refresh_token",
  "expiresIn": 3600,
  "restaurantGuid": "rest-uuid"
}
```

**Backend Implementation:**
1. Exchange code for token with Toast API
2. Store tokens securely in database
3. Return tokens to client (client stores in SecureStore)

---

#### GET `/integrations/toast/locations`

Get available Toast locations.

**Response (200):**
```json
{
  "locations": [
    {
      "id": "loc-uuid",
      "name": "Downtown Location",
      "address": "123 Main St"
    }
  ],
  "total": 5
}
```

---

#### POST `/integrations/toast/locations/select`

Select Toast locations to sync.

**Request:**
```json
{
  "locationIds": ["loc-1", "loc-2"]
}
```

**Response (204):** No content

---

#### GET `/integrations/toast/rules`

Get spend rules.

**Response (200):**
```json
{
  "rules": [
    {
      "id": "rule-uuid",
      "venueId": "venue-uuid",
      "threshold": 5000,
      "tierUnlocked": "PLATINUM",
      "serverAccessLevel": "INNER_CIRCLE",
      "isActive": true
    }
  ]
}
```

---

#### POST `/integrations/toast/rules`

Create a spend rule.

**Request:**
```json
{
  "venueId": "venue-uuid",
  "threshold": 5000,
  "tierUnlocked": "PLATINUM",
  "serverAccessLevel": "INNER_CIRCLE",
  "isActive": true
}
```

**Response (200):** Returns created rule

---

### Instagram Integration

#### POST `/integrations/instagram/exchange`

Exchange Instagram authorization code.

**Request:**
```json
{
  "authorizationCode": "IG_AUTH_CODE"
}
```

**Response (200):**
```json
{
  "accessToken": "ig_access_token",
  "userId": "ig-user-id",
  "username": "john_doe",
  "expiresIn": 5184000  // 60 days
}
```

---

#### POST `/integrations/instagram/sync`

Sync Instagram following with app.

**Request:**
```json
{
  "accessToken": "ig_access_token",
  "userId": "user-uuid"
}
```

**Response (200):**
```json
{
  "matches": [
    {
      "instagramId": "ig-123",
      "instagramUsername": "jane_doe",
      "userId": "user-uuid",
      "displayName": "Jane Doe",
      "avatarUrl": "...",
      "mutualFriends": 5
    }
  ],
  "syncedAt": "2024-01-15T10:00:00Z",
  "totalFollowing": 500,
  "matchedCount": 25
}
```

**Backend Implementation:**
1. Use Instagram Graph API to fetch following list
2. Match Instagram users with app users by phone/email
3. Return matches for friend suggestions

---

### Contacts Integration

#### POST `/contacts/sync`

Sync phone contacts with backend.

**Privacy Notes:**
- Hash phone numbers before storage
- Don't store raw contact data
- Allow users to opt out

**Request:**
```json
{
  "contacts": [
    {
      "name": "Jane Doe",
      "phoneNumbers": ["+14155551234"]
    }
  ]
}
```

**Response (200):**
```json
{
  "matches": [
    {
      "contactId": "contact-hash",
      "name": "Jane Doe",
      "phoneNumber": "+14155551234",
      "userId": "user-uuid",
      "displayName": "Jane Smith",
      "avatarUrl": "...",
      "mutualFriends": 3
    }
  ],
  "syncedAt": "2024-01-15T10:00:00Z",
  "totalContacts": 250,
  "matchedCount": 30
}
```

---

## Error Handling

All errors follow this format:

```json
{
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "errors": {
    "field1": ["Error message 1", "Error message 2"],
    "field2": ["Error message"]
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `204` - No Content (success with no response body)
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., username taken)
- `422` - Unprocessable Entity (validation errors)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Webhooks

### Toast POS Webhook

**Endpoint:** `POST /webhooks/toast/transaction`

**Headers:**
```
X-Toast-Signature: <hmac_signature>
```

**Payload:**
```json
{
  "transactionId": "toast-txn-123",
  "locationId": "loc-uuid",
  "amount": 5000,
  "cardToken": "card_token",
  "customerId": "user-uuid",
  "timestamp": "2024-01-15T23:00:00Z"
}
```

**Backend Implementation:**
1. Verify webhook signature using TOAST_WEBHOOK_SECRET
2. Process transaction and check spend rules
3. Unlock tiers/badges if thresholds met
4. Send push notification to user

---

## Security Considerations

### 1. Authentication
- Use bcrypt (cost factor 12) for password hashing
- Implement rate limiting on login attempts
- Lock accounts after 5 failed attempts for 15 minutes
- Require strong passwords (min 8 chars, uppercase, lowercase, number)

### 2. Authorization
- Verify JWT on every authenticated request
- Check user permissions for protected resources
- Implement role-based access control (RBAC)

### 3. Data Protection
- Never store raw payment card data
- Use Stripe/Square for PCI compliance
- Hash phone numbers before storage
- Encrypt sensitive data at rest

### 4. API Security
- Implement rate limiting (100 requests per 15 min per user)
- Use CORS to restrict origins
- Validate and sanitize all inputs
- Use parameterized queries to prevent SQL injection
- Implement CSRF protection for state-changing operations

### 5. Third-Party Integrations
- Never expose client secrets to frontend
- Validate webhook signatures
- Store OAuth tokens encrypted
- Implement token refresh logic

---

## Implementation Checklist

- [ ] Set up PostgreSQL database
- [ ] Implement JWT authentication
- [ ] Create user management endpoints
- [ ] Implement venue discovery endpoints
- [ ] Set up vibe check voting system
- [ ] Integrate payment processor (Stripe)
- [ ] Implement Toast POS OAuth & webhooks
- [ ] Implement Instagram OAuth & matching
- [ ] Implement contacts sync & matching
- [ ] Set up WebSocket server for real-time features
- [ ] Configure S3 for media uploads
- [ ] Set up SendGrid for transactional emails
- [ ] Implement rate limiting & security measures
- [ ] Create database indexes for performance
- [ ] Set up logging & error tracking (Sentry)
- [ ] Write API tests
- [ ] Deploy to production environment

---

## Need Help?

For questions or clarifications about the API implementation, contact:
- **Email:** dev@nox.app
- **Documentation:** https://docs.nox.app
