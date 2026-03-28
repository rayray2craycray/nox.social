# POS Integration Design: API Key-Based Architecture

**Date**: February 7, 2026
**Status**: ✅ DESIGNED
**Providers**: Toast POS + Square POS

---

## Overview

Multi-provider POS integration system allowing venue owners to connect their Toast or Square POS systems using API keys instead of OAuth. This enables automatic transaction tracking, spend-based tier unlocks, and revenue analytics.

---

## Architecture Changes

### From: OAuth-based (Current)
- User clicks "Connect Toast"
- OAuth redirect flow
- Backend stores access/refresh tokens
- Token rotation required

### To: API Key-based (New)
- Venue owner enters API key + location ID in settings
- Backend validates credentials with POS provider
- Backend stores encrypted API key
- Direct API calls for transactions/data

---

## Supported Providers

### 1. Toast POS
**API Documentation**: https://doc.toasttab.com/doc/devguide/apiGetStarted.html

**Required Credentials**:
- `apiKey`: Toast Management API Key (from Toast Web Dashboard)
- `locationGuid`: Toast Restaurant GUID
- `environment`: `PRODUCTION` or `SANDBOX`

**API Endpoints Used**:
```
GET  /restaurants/{restaurantGuid}/checks          - Get recent checks/orders
GET  /restaurants/{restaurantGuid}/orders          - Get order history
GET  /restaurants/{restaurantGuid}/payments        - Get payment transactions
GET  /restaurants/{restaurantGuid}/employees       - Get staff list
POST /restaurants/{restaurantGuid}/orders          - Create order (if needed)
```

**Authentication**:
```http
Authorization: Bearer {apiKey}
Toast-Restaurant-External-ID: {locationGuid}
Content-Type: application/json
```

**Data Refresh**: Poll every 5 minutes for new transactions

---

### 2. Square POS
**API Documentation**: https://developer.squareup.com/docs/api

**Required Credentials**:
- `accessToken`: Square Access Token (from Square Developer Dashboard)
- `locationId`: Square Location ID
- `environment`: `PRODUCTION` or `SANDBOX`

**API Endpoints Used**:
```
GET  /v2/locations/{locationId}                    - Validate location
GET  /v2/payments                                  - Get payment transactions
GET  /v2/orders/search                             - Search orders
GET  /v2/customers                                 - Get customer data
GET  /v2/merchants                                 - Get merchant info
```

**Authentication**:
```http
Authorization: Bearer {accessToken}
Square-Version: 2024-12-18
Content-Type: application/json
```

**Data Refresh**: Webhook-based (real-time) + 5-minute polling fallback

---

## Database Schema

### POSIntegration Model

```javascript
const POSIntegrationSchema = new mongoose.Schema({
  venueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true,
  },

  provider: {
    type: String,
    enum: ['TOAST', 'SQUARE'],
    required: true,
  },

  status: {
    type: String,
    enum: ['DISCONNECTED', 'CONNECTED', 'ERROR', 'VALIDATING'],
    default: 'DISCONNECTED',
  },

  // Encrypted credentials
  credentials: {
    apiKey: String,        // Encrypted Toast API key or Square access token
    locationId: String,    // Toast locationGuid or Square locationId
    environment: {
      type: String,
      enum: ['PRODUCTION', 'SANDBOX'],
      default: 'PRODUCTION',
    },
  },

  // Provider-specific metadata
  metadata: {
    locationName: String,
    merchantName: String,
    currency: String,
    timezone: String,
    webhookUrl: String,    // For Square webhooks
  },

  // Sync configuration
  syncConfig: {
    enabled: Boolean,
    interval: {
      type: Number,
      default: 300,        // 5 minutes in seconds
    },
    lastSyncAt: Date,
    lastSyncStatus: String,
    syncErrors: [String],
  },

  // Webhook configuration (Square only)
  webhooks: {
    enabled: Boolean,
    subscriptionId: String,
    secret: String,
    events: [String],      // ['payment.created', 'order.created']
  },

  connectedAt: Date,
  disconnectedAt: Date,

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
POSIntegrationSchema.index({ venueId: 1 });
POSIntegrationSchema.index({ provider: 1 });
POSIntegrationSchema.index({ status: 1 });
```

---

### POSTransaction Model

```javascript
const POSTransactionSchema = new mongoose.Schema({
  posIntegrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'POSIntegration',
    required: true,
  },

  venueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true,
  },

  provider: {
    type: String,
    enum: ['TOAST', 'SQUARE'],
    required: true,
  },

  // External IDs from POS system
  externalIds: {
    transactionId: String,     // Toast checkGuid or Square payment_id
    orderId: String,           // Toast orderGuid or Square order_id
    customerId: String,        // Customer ID if available
  },

  // Transaction details
  amount: {
    total: Number,             // Total in cents
    subtotal: Number,
    tax: Number,
    tip: Number,
    discount: Number,
  },

  currency: {
    type: String,
    default: 'USD',
  },

  // Payment method
  paymentMethod: {
    type: String,              // CARD, CASH, MOBILE_PAYMENT, etc.
    cardBrand: String,         // VISA, MASTERCARD, AMEX
    lastFour: String,          // Last 4 digits
    cardToken: String,         // Tokenized card (for user matching)
  },

  // User matching (if card token matches a user)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  matchedAt: Date,
  matchConfidence: Number,     // 0-100 confidence score

  // Transaction metadata
  status: {
    type: String,
    enum: ['COMPLETED', 'PENDING', 'FAILED', 'REFUNDED'],
    default: 'COMPLETED',
  },

  timestamp: {
    type: Date,
    required: true,
  },

  items: [{
    name: String,
    quantity: Number,
    price: Number,
  }],

  // Rule processing
  rulesProcessed: [{
    ruleId: mongoose.Schema.Types.ObjectId,
    triggered: Boolean,
    tierUnlocked: String,
    accessGranted: String,
    processedAt: Date,
  }],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
POSTransactionSchema.index({ venueId: 1, timestamp: -1 });
POSTransactionSchema.index({ userId: 1, timestamp: -1 });
POSTransactionSchema.index({ 'externalIds.transactionId': 1 });
POSTransactionSchema.index({ 'paymentMethod.cardToken': 1 });
```

---

## Backend API Endpoints

### Integration Management

```
POST   /api/pos/connect
GET    /api/pos/status/:venueId
POST   /api/pos/disconnect/:venueId
POST   /api/pos/validate
GET    /api/pos/providers
```

### Transaction Sync

```
POST   /api/pos/sync/:venueId
GET    /api/pos/transactions/:venueId
GET    /api/pos/revenue/:venueId
POST   /api/pos/webhooks/square
```

### Spend Rules

```
GET    /api/pos/rules/:venueId
POST   /api/pos/rules/:venueId
PATCH  /api/pos/rules/:venueId/:ruleId
DELETE /api/pos/rules/:venueId/:ruleId
```

---

## API Request/Response Examples

### 1. Connect POS System

**Request**: `POST /api/pos/connect`

```json
{
  "venueId": "venue-123",
  "provider": "TOAST",
  "credentials": {
    "apiKey": "sk_live_xxxxxxxxxxxxx",
    "locationId": "restaurant-guid-xxxxx",
    "environment": "PRODUCTION"
  }
}
```

**Response** (Success):
```json
{
  "success": true,
  "data": {
    "integrationId": "pos-int-123",
    "provider": "TOAST",
    "status": "CONNECTED",
    "metadata": {
      "locationName": "The Midnight Lounge - Main Bar",
      "merchantName": "Midnight Hospitality LLC",
      "currency": "USD",
      "timezone": "America/Los_Angeles"
    },
    "connectedAt": "2026-02-07T20:30:00Z"
  }
}
```

**Response** (Error):
```json
{
  "success": false,
  "error": "Invalid API key or location ID",
  "details": {
    "provider": "TOAST",
    "errorCode": "INVALID_CREDENTIALS"
  }
}
```

---

### 2. Get Integration Status

**Request**: `GET /api/pos/status/venue-123`

**Response**:
```json
{
  "success": true,
  "data": {
    "provider": "TOAST",
    "status": "CONNECTED",
    "lastSyncAt": "2026-02-07T20:25:00Z",
    "syncInterval": 300,
    "transactionCount": 1247,
    "totalRevenue": 45678.50,
    "metadata": {
      "locationName": "The Midnight Lounge - Main Bar",
      "merchantName": "Midnight Hospitality LLC"
    }
  }
}
```

---

### 3. Sync Transactions

**Request**: `POST /api/pos/sync/venue-123`

```json
{
  "fromDate": "2026-02-01T00:00:00Z",
  "toDate": "2026-02-07T23:59:59Z",
  "processRules": true
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "transactionsSynced": 42,
    "newTransactions": 38,
    "duplicatesSkipped": 4,
    "rulesProcessed": 38,
    "tiersUnlocked": {
      "REGULAR": 15,
      "PLATINUM": 3,
      "WHALE": 1
    },
    "syncDuration": 2.3
  }
}
```

---

## Frontend Integration

### New POSContext (replaces ToastContext)

```typescript
interface POSContextValue {
  // Integration state
  integration: POSIntegration | null;
  isConnected: boolean;
  isConnecting: boolean;

  // Actions
  connectPOS: (provider: 'TOAST' | 'SQUARE', credentials: POSCredentials) => Promise<void>;
  disconnectPOS: () => Promise<void>;
  validateCredentials: (provider: 'TOAST' | 'SQUARE', credentials: POSCredentials) => Promise<boolean>;

  // Sync
  syncTransactions: (dateRange?: { from: Date; to: Date }) => Promise<SyncResult>;
  getLastSyncStatus: () => SyncStatus;

  // Rules
  spendRules: SpendRule[];
  createSpendRule: (rule: CreateSpendRuleInput) => Promise<SpendRule>;
  updateSpendRule: (ruleId: string, updates: Partial<SpendRule>) => Promise<void>;
  deleteSpendRule: (ruleId: string) => Promise<void>;

  // Analytics
  getVenueRevenue: (venueId: string, period: 'day' | 'week' | 'month') => Promise<Revenue>;
  getTransactionHistory: (venueId: string, filters?: TransactionFilters) => Promise<Transaction[]>;
}
```

---

### UI Components Needed

#### 1. POS Setup Screen (`/app/management/pos-setup.tsx`)
- Provider selection (Toast vs Square)
- API key input form
- Validation and connection
- Error handling

#### 2. POS Dashboard (`/app/management/pos-dashboard.tsx`)
- Connection status
- Last sync time
- Transaction count
- Revenue metrics
- Manual sync button

#### 3. Spend Rules Manager (`/app/management/spend-rules.tsx`)
- List of spend rules
- Create/Edit/Delete rules
- Rule preview
- Enable/Disable toggle

#### 4. Transaction Log (`/app/management/transactions.tsx`)
- Recent transactions
- Filter by date/amount
- User matching status
- Tier unlocks triggered

---

## Security Considerations

### API Key Storage
- **Backend**: Encrypt using AES-256 before storing in MongoDB
- **Frontend**: Never store API keys in AsyncStorage or state
- **Transit**: Always use HTTPS for API key transmission

### Encryption Implementation

```javascript
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.POS_ENCRYPTION_KEY; // 32 bytes
const IV_LENGTH = 16; // For AES

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
```

### Permission Checks
- Only `HEAD_MODERATOR` role can connect/disconnect POS
- Only venue owners can view transactions
- API keys never returned in API responses

---

## Transaction Matching Logic

### Matching Users to Transactions

**Strategy**: Match card tokens from POS transactions to user payment cards

1. **User adds card** → Card tokenized → Token stored with userId
2. **POS transaction** → Card token received from POS
3. **Matching service** → Compare POS card token with stored user tokens
4. **Match found** → Link transaction to userId
5. **Process rules** → Check spend rules for that user/venue
6. **Unlock tier** → Grant user new tier/access if threshold met

**Match Confidence Scoring**:
- 100%: Exact token match
- 90%: Last 4 digits + exp date match
- 80%: Last 4 digits + card brand match
- <80%: No match, transaction remains unlinked

---

## Spend Rules Processing

### Rule Evaluation Flow

```javascript
async function processTransaction(transaction) {
  // 1. Get active spend rules for venue
  const rules = await SpendRule.find({
    venueId: transaction.venueId,
    isActive: true
  });

  // 2. Calculate user's lifetime spend at venue
  const userSpend = await POSTransaction.aggregate([
    {
      $match: {
        venueId: transaction.venueId,
        userId: transaction.userId,
        status: 'COMPLETED'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount.total' }
      }
    }
  ]);

  const lifetimeSpend = userSpend[0]?.total || 0;

  // 3. Check each rule
  for (const rule of rules) {
    if (lifetimeSpend >= rule.threshold) {
      // 4. Unlock tier for user
      await unlockTier(transaction.userId, transaction.venueId, rule);

      // 5. Log rule processing
      transaction.rulesProcessed.push({
        ruleId: rule._id,
        triggered: true,
        tierUnlocked: rule.tierUnlocked,
        accessGranted: rule.serverAccessLevel,
        processedAt: new Date()
      });
    }
  }

  await transaction.save();
}
```

---

## Webhook Handling (Square Only)

Square supports webhooks for real-time updates. Toast requires polling.

### Square Webhook Setup

1. **Register webhook** when POS connected:
```javascript
POST https://connect.squareup.com/v2/webhooks/subscriptions
Authorization: Bearer {accessToken}

{
  "subscription": {
    "name": "Rork Nightlife - Payment Events",
    "event_types": [
      "payment.created",
      "payment.updated",
      "order.created"
    ],
    "notification_url": "https://api.rork.app/api/pos/webhooks/square"
  }
}
```

2. **Verify webhook signature** on receive:
```javascript
const crypto = require('crypto');

function verifySquareWebhook(body, signature, url) {
  const hmac = crypto.createHmac('sha256', webhookSignatureKey);
  hmac.update(url + body);
  const hash = hmac.digest('base64');
  return hash === signature;
}
```

3. **Process webhook event**:
```javascript
app.post('/api/pos/webhooks/square', async (req, res) => {
  const signature = req.headers['x-square-signature'];
  const body = JSON.stringify(req.body);

  if (!verifySquareWebhook(body, signature, req.originalUrl)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.body;

  if (event.type === 'payment.created') {
    await processSquarePayment(event.data);
  }

  res.status(200).json({ received: true });
});
```

---

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `INVALID_CREDENTIALS` | Wrong API key or location ID | Re-enter credentials |
| `LOCATION_NOT_FOUND` | Location ID doesn't exist | Verify location ID |
| `PERMISSION_DENIED` | API key lacks required permissions | Generate new key with correct permissions |
| `RATE_LIMIT_EXCEEDED` | Too many API calls | Wait and retry (exponential backoff) |
| `SYNC_FAILED` | Network or POS system error | Retry sync manually |
| `WEBHOOK_VALIDATION_FAILED` | Invalid webhook signature | Check webhook secret |

### Retry Logic

```javascript
async function callPOSAPI(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);

      if (response.ok) {
        return await response.json();
      }

      if (response.status === 429) {
        // Rate limited - wait and retry
        await delay(Math.pow(2, i) * 1000);
        continue;
      }

      throw new Error(`API call failed: ${response.statusText}`);
    } catch (error) {
      if (i === retries - 1) throw error;
      await delay(Math.pow(2, i) * 1000);
    }
  }
}
```

---

## Testing Strategy

### 1. Sandbox Testing

**Toast Sandbox**:
- Environment: `SANDBOX`
- API Endpoint: `https://ws-sandbox-api.eng.toasttab.com`
- Test cards: Provided by Toast

**Square Sandbox**:
- Environment: `SANDBOX`
- API Endpoint: `https://connect.squareupsandbox.com`
- Test cards: `4111 1111 1111 1111` (Visa)

### 2. Integration Tests

```javascript
describe('POS Integration', () => {
  it('should validate Toast credentials', async () => {
    const result = await validateToastCredentials(testCredentials);
    expect(result.valid).toBe(true);
    expect(result.locationName).toBeDefined();
  });

  it('should sync Toast transactions', async () => {
    const result = await syncToastTransactions(venueId, dateRange);
    expect(result.transactionsSynced).toBeGreaterThan(0);
  });

  it('should process spend rules', async () => {
    const transaction = createTestTransaction(100.00);
    await processTransaction(transaction);
    expect(transaction.rulesProcessed.length).toBeGreaterThan(0);
  });
});
```

---

## Migration from OAuth to API Keys

### For Existing Toast Integrations

1. **Notify users**: "We're upgrading POS integration for better reliability"
2. **Provide instructions**: How to get Toast API key from dashboard
3. **Grace period**: Keep OAuth working for 30 days
4. **Disconnect old integrations**: After grace period
5. **Re-connect with API keys**: Users follow new setup flow

### Database Migration

```javascript
async function migrateToastIntegrations() {
  const oldIntegrations = await ToastIntegration.find({ accessToken: { $exists: true } });

  for (const integration of oldIntegrations) {
    console.log(`Migrating ${integration.venueId} - requires manual reconnection`);

    // Mark as disconnected
    integration.status = 'DISCONNECTED';
    integration.disconnectedAt = new Date();
    await integration.save();

    // Notify venue owner
    await sendEmail(integration.venueId, 'POS_RECONNECTION_REQUIRED', {
      provider: 'Toast',
      instructions: 'Please reconnect your Toast POS using API keys'
    });
  }
}
```

---

## Documentation for Venue Owners

### Toast Setup Guide

**Step 1: Get Your Toast API Key**
1. Log in to Toast Web Dashboard
2. Go to **Settings** → **API**
3. Click **Generate API Key**
4. Select permissions: `Read Orders`, `Read Payments`, `Read Checks`
5. Copy the API key (starts with `sk_live_`)

**Step 2: Find Your Location GUID**
1. In Toast Dashboard, go to **Locations**
2. Select your location
3. Copy the **Restaurant GUID** from the URL or settings

**Step 3: Connect in Rork App**
1. Go to **Management** → **POS Integration**
2. Select **Toast POS**
3. Paste API key
4. Paste Location GUID
5. Select **Production** environment
6. Click **Connect**

---

### Square Setup Guide

**Step 1: Get Your Square Access Token**
1. Log in to Square Developer Dashboard (developer.squareup.com)
2. Go to **Applications** → **Your App**
3. Go to **Credentials** tab
4. Copy the **Access Token** (Production)

**Step 2: Find Your Location ID**
1. In Square Dashboard, go to **Locations**
2. Select your location
3. Copy the **Location ID** from settings

**Step 3: Connect in Rork App**
1. Go to **Management** → **POS Integration**
2. Select **Square POS**
3. Paste Access Token
4. Paste Location ID
5. Select **Production** environment
6. Click **Connect**

---

## Performance Optimization

### Transaction Sync Optimization

1. **Incremental sync**: Only fetch transactions since last sync
2. **Batch processing**: Process 100 transactions at a time
3. **Background jobs**: Use queue (Bull/Agenda) for sync jobs
4. **Caching**: Cache venue revenue aggregations (5-minute TTL)
5. **Database indexes**: Index on venueId, userId, timestamp

### API Rate Limiting

**Toast**: 200 requests/minute per API key
**Square**: 100 requests/10 seconds per access token

**Strategy**:
- Track requests in Redis
- Queue requests if approaching limit
- Exponential backoff on 429 errors

---

## Monitoring & Alerts

### Metrics to Track

1. **Connection health**: % of connected integrations
2. **Sync success rate**: % of successful syncs
3. **Transaction volume**: Transactions per hour
4. **Rule trigger rate**: % of transactions triggering rules
5. **API error rate**: % of failed API calls

### Alerts

- Alert if sync fails for > 30 minutes
- Alert if API error rate > 10%
- Alert if no transactions synced in 24 hours (for active venues)
- Alert if webhook validation fails repeatedly

---

## Cost Estimation

### API Usage

**Toast**: Free (no usage fees)
**Square**: Free (no additional fees beyond transaction fees)

### Infrastructure

- Database: Minimal additional storage (~1KB per transaction)
- Background jobs: Minimal compute (5-minute interval syncs)
- Webhooks: Free (Square provides free webhook subscriptions)

**Estimated monthly cost**: $0-5 for additional database storage at scale

---

## Summary

This design document outlines a complete API key-based POS integration system supporting both Toast and Square. Key advantages over OAuth:

✅ **Simpler setup**: No OAuth redirect flow
✅ **Better reliability**: API keys don't expire like OAuth tokens
✅ **Easier debugging**: Direct API calls without token refresh logic
✅ **Multi-provider**: Easy to add more POS systems (Clover, Shopify, etc.)
✅ **Better security**: Encrypted storage + never exposed to frontend

**Next Steps**: Implement backend endpoints, update frontend components, add comprehensive tests.

---

**Document Version**: 1.0
**Last Updated**: February 7, 2026
**Ready for Implementation**: ✅ YES
