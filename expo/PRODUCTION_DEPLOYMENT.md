# Production Deployment Guide - Contact & Instagram Sync

This guide explains how to deploy the contact and Instagram sync features to production.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Instagram API Setup](#instagram-api-setup)
4. [Backend API Requirements](#backend-api-requirements)
5. [Security Considerations](#security-considerations)
6. [Testing](#testing)
7. [Monitoring](#monitoring)

---

## Prerequisites

### Required Packages
```bash
# Already installed in the project
expo-contacts  # For phone contacts access
expo-crypto    # For SHA-256 hashing of phone numbers
expo-web-browser  # For OAuth flow
expo-auth-session  # For handling OAuth redirects
```

### App Store Requirements
- **iOS**: Add `NSContactsUsageDescription` to `info.plist`
- **Android**: Add `READ_CONTACTS` permission to `AndroidManifest.xml`

---

## Environment Configuration

### 1. Update `.env` File

```env
# Instagram Integration (Production)
INSTAGRAM_CLIENT_ID=your_production_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_production_instagram_client_secret

# API Configuration
API_BASE_URL=https://api.rork.app
API_TIMEOUT=30000

# Environment
NODE_ENV=production

# Feature Flags
ENABLE_CONTACT_SYNC=true
ENABLE_INSTAGRAM_SYNC=true
```

### 2. Update `app.json` / `app.config.js`

Add the deep linking scheme for Instagram OAuth callback:

```json
{
  "expo": {
    "scheme": "nox",
    "ios": {
      "infoPlist": {
        "NSContactsUsageDescription": "We use your contacts to help you find friends who are also using the app.",
        "LSApplicationQueriesSchemes": ["instagram"]
      }
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": {
            "scheme": "nox",
            "host": "instagram-callback"
          },
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ],
      "permissions": [
        "READ_CONTACTS"
      ]
    }
  }
}
```

---

## Instagram API Setup

### Option 1: Instagram Graph API (Recommended)
Best for business/creator accounts with full access to following list.

**Steps:**
1. Go to https://developers.facebook.com/apps/
2. Create a new app or use existing one
3. Add "Instagram Graph API" product
4. Configure OAuth redirect URI: `nox://instagram-callback`
5. Request permissions:
   - `instagram_basic`
   - `instagram_manage_insights`
   - `pages_read_engagement`
6. Copy Client ID and Client Secret to `.env`

**Limitations:**
- Requires Instagram Business or Creator account
- Requires Facebook Page connection
- More complex setup but full feature access

### Option 2: Instagram Basic Display API
Simpler setup but limited features (no following list access).

**Steps:**
1. Go to https://developers.facebook.com/apps/
2. Create a new app
3. Add "Instagram Basic Display" product
4. Add OAuth Redirect URI: `nox://instagram-callback`
5. Copy Client ID and Secret to `.env`

**Limitations:**
- ⚠️ Cannot access following list
- Only provides basic profile data
- Not recommended for friend suggestions feature

**Recommendation:** Use Instagram Graph API for production.

---

## Backend API Requirements

Your backend must implement these endpoints:

### 1. Contact Sync Endpoint

**POST `/social/sync/contacts`**

Request:
```json
{
  "phoneNumbers": ["hashed_phone_1", "hashed_phone_2", ...],
  "userId": "current_user_id"
}
```

Response:
```json
{
  "matches": [
    {
      "hashedPhone": "hashed_phone_1",
      "userId": "matched_user_id",
      "displayName": "John Doe",
      "avatarUrl": "https://..."
    }
  ],
  "totalMatches": 1
}
```

**Backend Implementation:**
```python
# Example: Python/Flask
@app.route('/social/sync/contacts', methods=['POST'])
def sync_contacts():
    data = request.json
    hashed_phones = data['phoneNumbers']
    user_id = data['userId']

    # Find users with matching hashed phone numbers
    matches = []
    for hashed_phone in hashed_phones:
        user = db.users.find_one({
            'phoneHash': hashed_phone,
            '_id': {'$ne': user_id}  # Exclude current user
        })

        if user:
            matches.append({
                'hashedPhone': hashed_phone,
                'userId': str(user['_id']),
                'displayName': user['displayName'],
                'avatarUrl': user['avatarUrl']
            })

    return jsonify({
        'matches': matches,
        'totalMatches': len(matches)
    })
```

**Important:** Backend must store hashed phone numbers during user registration:
```python
import hashlib

def hash_phone_number(phone):
    return hashlib.sha256(phone.encode()).hexdigest()

# On user signup
user_phone = normalize_phone(request.json['phone'])
user.phoneHash = hash_phone_number(user_phone)
```

### 2. Instagram Sync Endpoint

**POST `/social/sync/instagram`**

Request:
```json
{
  "accessToken": "instagram_access_token",
  "userId": "current_user_id"
}
```

Response:
```json
{
  "matches": [
    {
      "instagramId": "instagram_user_id",
      "instagramUsername": "johndoe",
      "userId": "matched_user_id",
      "displayName": "John Doe",
      "avatarUrl": "https://..."
    }
  ],
  "totalMatches": 1
}
```

**Backend Implementation:**
```python
@app.route('/social/sync/instagram', methods=['POST'])
def sync_instagram():
    data = request.json
    access_token = data['accessToken']
    user_id = data['userId']

    # Fetch following list from Instagram Graph API
    following = fetch_instagram_following(access_token)

    # Match with app users
    matches = []
    for ig_user in following:
        user = db.users.find_one({
            'instagramId': ig_user['id'],
            '_id': {'$ne': user_id}
        })

        if user:
            matches.append({
                'instagramId': ig_user['id'],
                'instagramUsername': ig_user['username'],
                'userId': str(user['_id']),
                'displayName': user['displayName'],
                'avatarUrl': user['avatarUrl']
            })

    return jsonify({
        'matches': matches,
        'totalMatches': len(matches)
    })

def fetch_instagram_following(access_token):
    """Fetch following list from Instagram Graph API"""
    # Note: Requires Instagram Business/Creator account
    url = f'https://graph.instagram.com/me?fields=following&access_token={access_token}'
    response = requests.get(url)
    return response.json().get('following', {}).get('data', [])
```

### 3. Instagram OAuth Token Exchange

**POST `/auth/instagram/token`**

Request:
```json
{
  "code": "instagram_auth_code"
}
```

Response:
```json
{
  "accessToken": "long_lived_token",
  "userId": "instagram_user_id",
  "username": "johndoe"
}
```

**Backend Implementation:**
```python
@app.route('/auth/instagram/token', methods=['POST'])
def exchange_instagram_token():
    code = request.json['code']

    # Exchange code for short-lived token
    token_url = 'https://api.instagram.com/oauth/access_token'
    response = requests.post(token_url, data={
        'client_id': os.getenv('INSTAGRAM_CLIENT_ID'),
        'client_secret': os.getenv('INSTAGRAM_CLIENT_SECRET'),
        'grant_type': 'authorization_code',
        'redirect_uri': 'nox://instagram-callback',
        'code': code
    })

    short_token = response.json()['access_token']

    # Exchange for long-lived token (60 days)
    long_token_url = f'https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret={os.getenv("INSTAGRAM_CLIENT_SECRET")}&access_token={short_token}'
    long_response = requests.get(long_token_url)
    long_token_data = long_response.json()

    # Get user info
    user_url = f'https://graph.instagram.com/me?fields=id,username&access_token={long_token_data["access_token"]}'
    user_response = requests.get(user_url)
    user_data = user_response.json()

    return jsonify({
        'accessToken': long_token_data['access_token'],
        'userId': user_data['id'],
        'username': user_data['username']
    })
```

---

## Security Considerations

### 1. Phone Number Hashing
- ✅ Phone numbers are hashed client-side using SHA-256
- ✅ Only hashes are sent to backend
- ✅ Backend stores hashes, never plain phone numbers

### 2. Instagram Token Security
- ✅ Token exchange happens server-side
- ✅ Client secret never exposed to client
- ✅ Tokens stored securely in AsyncStorage
- ✅ Token expiration checking implemented

### 3. API Rate Limiting
Implement rate limiting on backend:
```python
from flask_limiter import Limiter

limiter = Limiter(app, key_func=lambda: request.headers.get('X-User-ID'))

@app.route('/social/sync/contacts', methods=['POST'])
@limiter.limit("10 per hour")  # Limit to 10 sync requests per hour
def sync_contacts():
    # ...
```

### 4. Input Validation
Validate all inputs on backend:
```python
from marshmallow import Schema, fields, validate

class ContactSyncSchema(Schema):
    phoneNumbers = fields.List(fields.Str(validate=validate.Length(equal=64)), required=True)  # SHA-256 is 64 chars
    userId = fields.Str(required=True)

@app.route('/social/sync/contacts', methods=['POST'])
def sync_contacts():
    schema = ContactSyncSchema()
    errors = schema.validate(request.json)
    if errors:
        return jsonify(errors), 400
    # ...
```

### 5. HTTPS Only
- ✅ Ensure `API_BASE_URL` uses HTTPS
- ✅ Validate SSL certificates
- ✅ No mixed content warnings

---

## Testing

### Development Mode Testing

The app automatically uses mock data when `NODE_ENV=development`:

```bash
# Test with mock data (no backend needed)
NODE_ENV=development expo start
```

**Mock Data Behavior:**
- Contacts: Returns 5 mock matches
- Instagram: Returns 5 mock following
- No API calls made
- Simulated delays for realistic testing

### Production Mode Testing

```bash
# Test with real API
NODE_ENV=production expo start
```

**Test Checklist:**
- [ ] Contacts permission request works
- [ ] Phone numbers are hashed correctly
- [ ] Backend receives and matches contacts
- [ ] Instagram OAuth flow completes
- [ ] Token is stored and reused
- [ ] Suggestions appear in profile
- [ ] Source badges display correctly
- [ ] Cache works (check console logs)

### Load Testing

Test backend endpoints with realistic load:

```bash
# Install artillery
npm install -g artillery

# Create test config (artillery.yml)
config:
  target: 'https://api.rork.app'
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: "Contact Sync"
    flow:
      - post:
          url: "/social/sync/contacts"
          json:
            phoneNumbers: ["hash1", "hash2", "hash3"]
            userId: "test-user-123"

# Run test
artillery run artillery.yml
```

---

## Monitoring

### 1. Logging

Add structured logging:

```typescript
// services/logger.ts
export function logSyncEvent(type: 'contacts' | 'instagram', event: string, data?: any) {
  if (process.env.NODE_ENV === 'production') {
    // Send to logging service (e.g., Sentry, LogRocket)
    console.log(JSON.stringify({
      type,
      event,
      data,
      timestamp: new Date().toISOString(),
    }));
  }
}

// Usage in contacts.service.ts
logSyncEvent('contacts', 'sync_started', { contactCount: contacts.length });
logSyncEvent('contacts', 'sync_completed', { matchCount: matches.length });
```

### 2. Analytics

Track feature usage:

```typescript
import * as Analytics from 'expo-firebase-analytics';

// Track contact sync
await Analytics.logEvent('contact_sync', {
  matches_found: matches.length,
  total_contacts: contacts.length,
});

// Track Instagram connection
await Analytics.logEvent('instagram_connected', {
  username: user.username,
});
```

### 3. Error Tracking

Use Sentry for error monitoring:

```bash
npm install @sentry/react-native
```

```typescript
// App.tsx
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// In services
try {
  await syncContacts(request);
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: 'contact_sync' },
  });
  throw error;
}
```

### 4. Metrics to Monitor

- **Contact Sync:**
  - Average sync duration
  - Match rate (matches / total contacts)
  - Error rate
  - Permission denial rate

- **Instagram:**
  - OAuth completion rate
  - Token expiration incidents
  - Following list size
  - API call failures

- **Suggestions:**
  - Cache hit rate
  - Average suggestions per user
  - Source distribution (contacts vs Instagram vs mutuals)

---

## Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured in production `.env`
- [ ] Instagram app configured with production redirect URI
- [ ] Backend endpoints tested and deployed
- [ ] SSL certificates valid
- [ ] Rate limiting enabled on backend
- [ ] Error tracking (Sentry) configured
- [ ] Analytics tracking implemented

### Post-Deployment
- [ ] Test full contact sync flow in production
- [ ] Test Instagram OAuth flow in production
- [ ] Verify suggestions appear correctly
- [ ] Monitor error rates in Sentry
- [ ] Check backend logs for issues
- [ ] Monitor API rate limits
- [ ] Test on both iOS and Android

### Rollback Plan
If issues occur:
1. Set feature flags to `false` in `.env`
2. Push updated `.env` or use remote config
3. App will fall back to mock data (no errors)
4. Fix issues and re-enable

```env
# Disable features temporarily
ENABLE_CONTACT_SYNC=false
ENABLE_INSTAGRAM_SYNC=false
```

---

## Troubleshooting

### Issue: "Instagram sync is disabled"
**Solution:** Check `ENABLE_INSTAGRAM_SYNC` in `.env` and ensure it's set to `true`.

### Issue: "Configuration Error" when connecting Instagram
**Solution:** Verify `INSTAGRAM_CLIENT_ID` and `INSTAGRAM_CLIENT_SECRET` are set in `.env`.

### Issue: No contacts matches found
**Solution:**
1. Check backend logs for errors
2. Verify phone numbers are being hashed consistently
3. Ensure users have phone hashes in database

### Issue: Instagram token expired immediately
**Solution:**
1. Ensure using long-lived token exchange
2. Check token expiration date in storage
3. Implement token refresh mechanism

### Issue: App crashes when requesting contacts
**Solution:**
1. Verify `NSContactsUsageDescription` in iOS info.plist
2. Check `READ_CONTACTS` permission in Android manifest
3. Ensure contacts permission is requested before access

---

## Performance Optimization

### 1. Batch Processing
Process contacts in batches to avoid overwhelming backend:

```typescript
const BATCH_SIZE = 100;
for (let i = 0; i < phoneNumbers.length; i += BATCH_SIZE) {
  const batch = phoneNumbers.slice(i, i + BATCH_SIZE);
  const batchResults = await syncContactsBatch(batch);
  matches.push(...batchResults);
}
```

### 2. Background Sync
Sync contacts in background when app opens:

```typescript
// App.tsx
useEffect(() => {
  const backgroundSync = async () => {
    // Only sync once per day
    const lastSync = await AsyncStorage.getItem('last_sync');
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    if (!lastSync || parseInt(lastSync) < oneDayAgo) {
      await syncContactsWithBackend(contacts);
      await AsyncStorage.setItem('last_sync', Date.now().toString());
    }
  };

  backgroundSync();
}, []);
```

### 3. Caching Strategy
- Contacts cache: 24 hours
- Instagram cache: 6 hours
- Suggestions cache: 5 minutes

---

## Support

For issues or questions:
- Check console logs for error messages
- Review backend API logs
- Test with mock data first (`NODE_ENV=development`)
- Verify all environment variables are set

## Additional Resources

- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api)
- [Expo Contacts Documentation](https://docs.expo.dev/versions/latest/sdk/contacts/)
- [Expo Crypto Documentation](https://docs.expo.dev/versions/latest/sdk/crypto/)
- [React Native Security Best Practices](https://reactnative.dev/docs/security)
