# POS Integration Setup Guide

Complete guide for venue owners to connect Toast or Square POS systems to VibeLink.

---

## Table of Contents

1. [Overview](#overview)
2. [Toast POS Setup](#toast-pos-setup)
3. [Square POS Setup](#square-pos-setup)
4. [Connecting to VibeLink](#connecting-to-vibelink)
5. [Configuring Spend Rules](#configuring-spend-rules)
6. [Transaction Syncing](#transaction-syncing)
7. [Troubleshooting](#troubleshooting)
8. [FAQs](#faqs)

---

## Overview

The POS integration allows your venue to automatically reward customers based on their spending. When a customer makes a purchase through your POS system, VibeLink matches their payment method to their account and unlocks tiers or server access based on your configured spend thresholds.

### Supported POS Systems

- **Toast POS** - Transaction polling (5-minute sync intervals)
- **Square POS** - Real-time webhooks + transaction polling

### What You'll Need

- Admin access to your Toast or Square account
- API credentials from your POS provider
- 10-15 minutes for initial setup

### Security

- All API keys are encrypted using AES-256-CBC encryption
- Card data is tokenized - we never see actual card numbers
- Credentials are never exposed in API responses
- You can disconnect at any time

---

## Toast POS Setup

### Step 1: Get Your Toast API Key

1. **Log in to Toast**
   - Go to [https://pos.toasttab.com](https://pos.toasttab.com)
   - Sign in with your Toast account credentials

2. **Navigate to API Access**
   - Click **Settings** in the left sidebar
   - Select **API Access** from the menu
   - If you don't see this option, contact Toast support to enable API access for your account

3. **Generate API Key**
   - Click **+ Create New API Key**
   - Name it: `VibeLink Integration`
   - Select permissions:
     - ✅ **Orders** (required for transaction access)
     - ✅ **Payments** (required for payment method matching)
   - Choose environment:
     - **Production** for live transactions
     - **Sandbox** for testing (recommended for initial setup)
   - Click **Generate Key**
   - **IMPORTANT:** Copy and save your API key immediately - you won't be able to see it again!

### Step 2: Get Your Restaurant GUID

1. **Navigate to General Settings**
   - Click **Settings** in the left sidebar
   - Select **General** from the menu

2. **Find Restaurant GUID**
   - Scroll down to **Restaurant Information**
   - Look for **Restaurant GUID** or **Location ID**
   - It looks like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
   - Copy this value

### Step 3: Test in Sandbox (Recommended)

Before connecting to production:

1. Set up a Toast Sandbox account at [https://developers.toasttab.com](https://developers.toasttab.com)
2. Generate sandbox API credentials
3. Test the integration with sandbox data
4. Once verified, switch to production credentials

### Toast API Documentation

- [Toast API Overview](https://doc.toasttab.com/doc/devguide/apiOverview.html)
- [Orders API](https://doc.toasttab.com/doc/devguide/apiOrders.html)
- [Authentication Guide](https://doc.toasttab.com/doc/devguide/apiAuthentication.html)

---

## Square POS Setup

### Step 1: Create Square Developer Account

1. **Go to Square Developer Dashboard**
   - Visit [https://developer.squareup.com](https://developer.squareup.com)
   - Sign in with your Square account
   - If you don't have a Square account, create one at [https://squareup.com/signup](https://squareup.com/signup)

2. **Create an Application**
   - Click **+ Create App** in the dashboard
   - Name it: `VibeLink POS Integration`
   - Choose application type: **Server**
   - Click **Create Application**

### Step 2: Get Your Access Token

1. **Navigate to Credentials**
   - Open your newly created application
   - Click **Credentials** in the left sidebar

2. **Choose Environment**
   - **Sandbox** tab for testing (recommended first)
   - **Production** tab for live transactions

3. **Copy Access Token**
   - Under **Access Token**, click **Show** or **Copy**
   - Format: `EAAAExxxxxxxxxxxxxxxxxxxxxxxx`
   - **IMPORTANT:** Keep this secret! Anyone with this token can access your Square account

### Step 3: Get Your Location ID

1. **Navigate to Locations**
   - Click **Locations** in the Square Developer Dashboard
   - Or visit [https://squareup.com/dashboard/locations](https://squareup.com/dashboard/locations)

2. **Find Location ID**
   - Click on your venue location
   - Look for **Location ID** in the details
   - Format: `L1234567890ABCDEF`
   - If you have multiple locations, copy the ID for each venue

### Step 4: Set Up Webhooks (Optional - Recommended)

Webhooks provide real-time transaction updates instead of waiting for 5-minute polling.

1. **Navigate to Webhooks**
   - In your Square application, click **Webhooks** in the left sidebar

2. **Add Webhook Endpoint**
   - Click **+ Add Endpoint**
   - URL: `https://api.yourapp.com/api/pos/webhooks/square` (your backend will provide this)
   - Event types to subscribe:
     - ✅ `payment.created`
     - ✅ `payment.updated`
     - ✅ `order.created`
   - Click **Save**

3. **Verify Webhook**
   - Square will send a test event
   - Check that your backend receives it
   - Webhook signature is automatically verified by VibeLink

### Step 5: Test in Sandbox (Recommended)

1. Use sandbox credentials first
2. Create test transactions in Square Sandbox
3. Verify they appear in VibeLink within 5 minutes (or instantly with webhooks)
4. Once verified, switch to production credentials

### Square API Documentation

- [Square API Overview](https://developer.squareup.com/docs/api)
- [Orders API](https://developer.squareup.com/docs/orders-api/what-it-does)
- [Payments API](https://developer.squareup.com/docs/payments-api/overview)
- [Webhooks Guide](https://developer.squareup.com/docs/webhooks/overview)

---

## Connecting to VibeLink

### Step 1: Open POS Integration Screen

1. Open the VibeLink app
2. Navigate to **Management** tab
3. Tap **POS Integration** card

### Step 2: Select Your Provider

1. Tap the **POS Provider** dropdown
2. Select either:
   - **Toast POS**
   - **Square POS**

### Step 3: Enter Credentials

**For Toast:**
- **API Key:** Paste your Toast API key
- **Restaurant GUID:** Paste your restaurant GUID
- **Environment:** Select Production or Sandbox

**For Square:**
- **Access Token:** Paste your Square access token
- **Location ID:** Paste your location ID
- **Environment:** Select Production or Sandbox

### Step 4: Connect

1. Tap **Connect to [Provider]**
2. VibeLink will validate your credentials (takes 2-5 seconds)
3. If validation succeeds, you'll see:
   - ✅ **Connected** status
   - Connection timestamp
   - Location name
   - Transaction statistics

### Step 5: Verify Connection

1. Make a test transaction at your venue
2. Wait 5 minutes (or instant with Square webhooks)
3. Check that the transaction appears in the dashboard
4. Verify the transaction amount is correct

---

## Configuring Spend Rules

Spend rules automatically unlock tiers and server access based on customer lifetime spending.

### How Spend Rules Work

1. Customer makes a purchase at your venue
2. VibeLink matches their card token to their account
3. System calculates their lifetime spend at your venue
4. If spending meets a threshold, tier/access is unlocked automatically
5. Customer receives notification of upgrade

### Creating a Spend Rule

Example spend rules:

```
$50+ → REGULAR tier → Public Lobby access
$200+ → PLATINUM tier → Inner Circle access (live hours only)
$500+ → WHALE tier → Inner Circle access (always)
```

### Rule Configuration Options

**Threshold:** Lifetime spending amount (in dollars)
- Example: `50` means $50 total spent

**Tier Unlocked:**
- `GUEST` - Default tier for all users
- `REGULAR` - First upgrade tier
- `PLATINUM` - VIP tier
- `WHALE` - Top spender tier

**Server Access Level:**
- `PUBLIC_LOBBY` - Standard Discord channels
- `INNER_CIRCLE` - VIP-only Discord channels

**Live Only (Optional):**
- Enable to only apply rule during venue operating hours
- Set time window: `22:00` to `02:00` (10pm to 2am)
- Useful for "spend $X tonight" promotions

### Example Rules

**1. Welcome Regular Rule**
```
Threshold: $50
Tier: REGULAR
Access: PUBLIC_LOBBY
Live Only: No
Description: "Welcome regulars who've spent $50+"
```

**2. VIP Night Rule**
```
Threshold: $200
Tier: PLATINUM
Access: INNER_CIRCLE
Live Only: Yes (22:00 - 02:00)
Description: "Spend $200 tonight for VIP access"
```

**3. Whale Status**
```
Threshold: $500
Tier: WHALE
Access: INNER_CIRCLE
Live Only: No
Description: "Elite status for top spenders"
```

### Managing Rules

- **Toggle On/Off:** Use switch to enable/disable rules without deleting
- **Edit:** Tap rule to modify threshold or settings
- **Delete:** Swipe left on rule to remove
- **Priority:** Higher thresholds override lower ones

### Best Practices

1. **Start Conservative:** Begin with higher thresholds, lower them based on data
2. **Test First:** Create rules in sandbox before production
3. **Monitor Stats:** Check rule trigger counts to optimize thresholds
4. **Clear Communication:** Tell customers about rewards program
5. **Seasonal Adjustments:** Modify thresholds for holidays/special events

---

## Transaction Syncing

### How Syncing Works

**Toast:**
- Transactions sync every 5 minutes via polling
- VibeLink fetches new orders from Toast API
- Duplicates are automatically prevented

**Square:**
- **With Webhooks:** Real-time updates (instant)
- **Without Webhooks:** 5-minute polling intervals
- Webhook setup is recommended for best experience

### Sync Status

Check sync status in the POS Integration screen:

- **Last Sync:** Timestamp of most recent sync
- **Status:** SUCCESS, FAILED, or PENDING
- **Transaction Count:** Total transactions synced
- **Total Revenue:** Sum of all transactions

### Manual Sync

To force a sync immediately:

1. Open POS Integration screen
2. Pull down to refresh
3. Transactions will sync within 30 seconds

### Sync Errors

If syncing fails, check:

1. **API Credentials:** Are they still valid?
2. **API Permissions:** Does key have Orders/Payments access?
3. **Network Connection:** Is venue connected to internet?
4. **POS System Status:** Is your POS system online?

---

## Troubleshooting

### Connection Issues

**"Invalid credentials" error:**
- Double-check API key is correct (no extra spaces)
- Verify location ID matches your venue
- Ensure API key has correct permissions
- Try regenerating API key

**"Connection timeout" error:**
- Check your internet connection
- Verify POS system is online
- Try again in a few minutes
- Contact support if persists

**"Authentication failed" error:**
- API key may have been revoked
- Check if key is for correct environment (production vs sandbox)
- Regenerate key and try again

### Transaction Matching Issues

**Transactions not appearing:**
- Wait at least 5 minutes after purchase
- Check if transaction completed successfully in POS
- Verify sync status shows SUCCESS
- Force a manual sync by pulling to refresh

**Customer not getting upgraded:**
- Verify customer has linked their card to VibeLink account
- Check if spend threshold is met
- Ensure spend rule is enabled (toggle switch is on)
- Check if rule is "Live Only" but outside time window

**Wrong transaction amount:**
- Transaction amounts include tax and tip
- Currency conversion may apply
- Refunds reduce lifetime spend
- Contact support if amount clearly incorrect

### Webhook Issues (Square Only)

**Webhooks not receiving events:**
- Verify webhook URL is correct
- Check webhook is subscribed to correct events
- Test webhook with Square test tool
- Check backend logs for signature verification errors

---

## FAQs

### General Questions

**Q: How much does POS integration cost?**
A: POS integration is included in your VibeLink venue subscription at no additional cost.

**Q: Can I connect multiple locations?**
A: Yes! Connect each location separately with its own location ID. Each venue has independent spend rules.

**Q: What if I switch POS systems?**
A: Simply disconnect the old system and connect the new one. Transaction history is preserved.

**Q: Is my data secure?**
A: Yes. API keys are encrypted (AES-256-CBC), card data is tokenized, and we never see actual card numbers.

### Transaction Questions

**Q: How long until transactions appear?**
A: Toast: 5 minutes (polling). Square with webhooks: instant. Square without webhooks: 5 minutes.

**Q: Do refunds affect customer spending?**
A: Yes, refunded amounts are subtracted from lifetime spend. This may cause tier downgrades.

**Q: What about cash payments?**
A: Only card payments can be matched to VibeLink accounts. Cash payments are not tracked.

**Q: Can I see individual customer transaction history?**
A: Yes, in the Management dashboard under Analytics → Customer Details.

### Spend Rule Questions

**Q: Can I have multiple rules for the same tier?**
A: Yes, but the highest threshold rule will apply. Useful for "live only" vs permanent upgrades.

**Q: Do spend rules work retroactively?**
A: Yes! When you create a rule, existing customers who meet the threshold are upgraded immediately.

**Q: Can I change a rule threshold after creating it?**
A: Yes, edit the rule at any time. Changes apply to future transactions immediately.

**Q: What happens if I disable a rule?**
A: Customers keep their current tier, but new customers won't be upgraded by that rule until re-enabled.

### Technical Questions

**Q: What API permissions do I need?**
A: Toast: Orders + Payments. Square: Orders + Payments + (optional) Webhooks.

**Q: Can I use the same API key for multiple venues?**
A: Not recommended. Use separate API keys per venue for better security and tracking.

**Q: What if my API key expires?**
A: You'll receive an error notification. Simply disconnect and reconnect with a new key.

**Q: How do I know if webhooks are working?**
A: Check the POS Integration screen. If "Last Sync" updates instantly after transactions, webhooks are working.

---

## Support

### Need Help?

- **Email:** support@vibelink.app
- **Discord:** Join our support server at discord.gg/vibelink
- **Phone:** 1-800-VIBELINK (business hours: M-F 9am-6pm PST)

### Reporting Issues

When contacting support, please include:

1. POS provider (Toast or Square)
2. Environment (Production or Sandbox)
3. Error message (screenshot if possible)
4. Steps to reproduce the issue
5. Your venue name and location

### Feature Requests

Have ideas for improving POS integration? We'd love to hear them!

- Submit at: feedback.vibelink.app
- Vote on existing requests
- Track implementation status

---

## Appendix

### Toast API Rate Limits

- 200 requests per minute per API key
- 10,000 requests per hour per API key
- VibeLink syncs respect these limits automatically

### Square API Rate Limits

- 1,000 requests per minute per access token
- 50,000 requests per hour per access token
- VibeLink syncs respect these limits automatically

### Supported Transaction Types

**Toast:**
- Dine-in orders
- Takeout orders
- Delivery orders (must be paid in-app)
- Bar tabs

**Square:**
- In-person payments
- Online orders
- Invoices (if paid online)
- Recurring payments

### Unsupported Features

Currently not supported (coming soon):

- Split payments (only primary card is matched)
- Gift card payments (can't be matched to customer)
- Third-party delivery (Uber Eats, DoorDash, etc.)
- Cash app payments (Square Cash App)

---

**Last Updated:** February 2025
**Version:** 2.0
**Compatible with:** Toast POS v1.0+, Square API v2.0+
