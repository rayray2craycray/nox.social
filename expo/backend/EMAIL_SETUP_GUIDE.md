# Email SMTP Setup Guide

Complete guide for configuring email service for the Rork Nightlife backend.

**Last Updated:** January 28, 2026
**Backend Version:** 2.0.0

---

## Table of Contents

1. [Overview](#overview)
2. [Email Features](#email-features)
3. [SMTP Provider Options](#smtp-provider-options)
4. [SendGrid Setup (Recommended)](#sendgrid-setup-recommended)
5. [Gmail Setup (Development)](#gmail-setup-development)
6. [Mailgun Setup](#mailgun-setup)
7. [AWS SES Setup](#aws-ses-setup)
8. [Testing Email Configuration](#testing-email-configuration)
9. [Troubleshooting](#troubleshooting)
10. [Production Checklist](#production-checklist)

---

## Overview

The backend uses **Nodemailer** for sending transactional emails. Currently implemented email types:

- **Business email verification** - Verify business email before admin review
- **Password reset** - For user password recovery (future)
- **Welcome email** - After successful business verification (future)

---

## Email Features

### Current Implementation

**Email Service:** `src/services/email.service.js`

**Features:**
- ✅ Beautiful HTML email templates
- ✅ Plain text fallbacks
- ✅ Development mode (logs to console)
- ✅ Production mode (sends via SMTP)
- ✅ Error handling and logging
- ✅ Configurable sender address

### Business Verification Email

**Sent when:** Business registers for venue management
**Contains:**
- Verification link (24-hour expiry)
- Welcome message with venue name
- List of Head Moderator benefits
- Support contact information

---

## SMTP Provider Options

### Comparison Table

| Provider | Free Tier | Cost (Monthly) | Reliability | Ease of Setup | Best For |
|----------|-----------|----------------|-------------|---------------|----------|
| **SendGrid** | 100/day | $19.95+ | ⭐⭐⭐⭐⭐ | Easy | Production |
| **Mailgun** | 5,000/month | $35+ | ⭐⭐⭐⭐⭐ | Easy | Production |
| **AWS SES** | 62,000/month* | $0.10/1000 | ⭐⭐⭐⭐⭐ | Medium | High volume |
| **Gmail** | 500/day | Free | ⭐⭐⭐ | Very Easy | Development |
| **Postmark** | None | $15+ | ⭐⭐⭐⭐⭐ | Easy | Transactional |

*AWS SES free tier available for first 12 months within AWS

### Recommendation

**Production:** SendGrid or Mailgun
- Reliable delivery
- Good free tier for early stage
- Easy setup
- Excellent deliverability

**Development:** Gmail
- Free and instant
- No sign-up needed
- Good for testing

**High Volume:** AWS SES
- Most cost-effective at scale
- $0.10 per 1,000 emails
- Requires AWS account

---

## SendGrid Setup (Recommended)

### Step 1: Create SendGrid Account

1. Go to [https://sendgrid.com](https://sendgrid.com)
2. Sign up for free account (100 emails/day)
3. Verify your email address

### Step 2: Create API Key

1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name: `Rork Nightlife Backend`
4. Permission Level: **Full Access** (or **Mail Send** only)
5. Click **Create & View**
6. **Copy the API key** (you won't see it again!)

### Step 3: Verify Sender Identity

**Single Sender Verification (Quick):**
1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Enter your email: `noreply@rork.app`
4. Complete the form
5. Click verification link in email

**Domain Authentication (Recommended for Production):**
1. Go to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Enter domain: `rork.app`
4. Copy DNS records
5. Add DNS records to your domain
6. Wait for verification (can take 24-48 hours)

### Step 4: Configure Backend

Update `.env`:

```bash
# SendGrid SMTP Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key-here
SMTP_FROM=noreply@rork.app
```

### Step 5: Test

```bash
npm run test:email
# Or manually trigger a business registration
```

### SendGrid Dashboard

Monitor emails at: [https://app.sendgrid.com/email_activity](https://app.sendgrid.com/email_activity)

---

## Gmail Setup (Development)

**⚠️ Warning:** Gmail has daily sending limits (500/day). Use for development only.

### Step 1: Enable App Passwords

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** (required for app passwords)
3. Go to **App passwords**
4. Generate new app password for "Mail"
5. Copy the 16-character password

### Step 2: Configure Backend

Update `.env`:

```bash
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=your-email@gmail.com
```

### Troubleshooting Gmail

**"Less secure app access" error:**
- Enable 2-Step Verification
- Use App Password (not your regular password)

**"Daily sending quota exceeded":**
- Gmail limits: 500 emails/day
- Use different provider for production

---

## Mailgun Setup

### Step 1: Create Mailgun Account

1. Go to [https://www.mailgun.com](https://www.mailgun.com)
2. Sign up (5,000 free emails/month for 3 months)
3. Verify email

### Step 2: Add Domain

1. Go to **Sending** → **Domains**
2. Click **Add New Domain**
3. Enter: `mg.rork.app` (subdomain recommended)
4. Copy DNS records
5. Add to your DNS provider
6. Wait for verification

### Step 3: Get SMTP Credentials

1. Go to **Sending** → **Domain Settings**
2. Select your domain
3. Click **SMTP credentials**
4. Create new credentials or use default
5. Copy username and password

### Step 4: Configure Backend

Update `.env`:

```bash
# Mailgun SMTP Configuration
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@mg.rork.app
SMTP_PASS=your-mailgun-password
SMTP_FROM=noreply@rork.app
```

---

## AWS SES Setup

### Step 1: Set Up AWS SES

1. Go to [AWS Console](https://console.aws.amazon.com/ses)
2. Select region (us-east-1, eu-west-1, etc.)
3. Go to **Verified identities**
4. Click **Create identity**
5. Choose **Domain** or **Email address**
6. Follow verification process

### Step 2: Move Out of Sandbox

**In sandbox mode**, you can only send to verified addresses.

To send to any address:
1. Go to **Account dashboard**
2. Request production access
3. Fill out form explaining use case
4. Wait for approval (24-48 hours)

### Step 3: Create SMTP Credentials

1. Go to **Account dashboard**
2. Click **Create SMTP credentials**
3. Enter IAM user name: `rork-smtp-user`
4. Click **Create**
5. **Download credentials** (username and password)

### Step 4: Configure Backend

Update `.env`:

```bash
# AWS SES SMTP Configuration
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-smtp-username
SMTP_PASS=your-aws-smtp-password
SMTP_FROM=noreply@rork.app
```

**Note:** Replace `us-east-1` with your region.

---

## Testing Email Configuration

### Method 1: Test Script

Create `test-email.js`:

```javascript
require('dotenv').config();
const { sendVerificationEmail } = require('./src/services/email.service');

async function testEmail() {
  try {
    console.log('Testing email configuration...\n');

    const result = await sendVerificationEmail(
      'your-test-email@example.com',
      'Test Venue',
      'https://rork.app/verify?token=test123'
    );

    console.log('✅ Email sent successfully!');
    console.log('Result:', result);
  } catch (error) {
    console.error('❌ Email failed:', error.message);
  }
}

testEmail();
```

Run:
```bash
node test-email.js
```

### Method 2: Business Registration Test

1. Start backend: `npm start`
2. Register a business via API:

```bash
curl -X POST http://localhost:3000/api/business/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "venueName": "Test Venue",
    "businessEmail": "test@example.com",
    "businessType": "CLUB",
    "location": {
      "address": "123 Test St",
      "city": "Los Angeles",
      "state": "CA",
      "zipCode": "90001"
    }
  }'
```

3. Check email inbox for verification email

### Method 3: Nodemailer Test

```bash
# Install nodemailer globally
npm install -g nodemailer

# Create test config
cat > email-test.js << 'EOF'
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify(function(error, success) {
  if (error) {
    console.log('❌ SMTP Connection Failed:', error);
  } else {
    console.log('✅ SMTP Server is ready to take our messages');
  }
});
EOF

# Run test
node email-test.js
```

---

## Troubleshooting

### "Connection timeout" Error

**Cause:** Firewall blocking SMTP port
**Solution:**
- Check firewall allows outbound connections on port 587
- Try port 465 (SSL) or 2525 (alternative)
- Update `.env`: `SMTP_PORT=465` and `SMTP_SECURE=true`

### "Authentication failed" Error

**Cause:** Incorrect credentials
**Solution:**
- Verify SMTP_USER and SMTP_PASS are correct
- For SendGrid: User must be `apikey` (literal string)
- For Gmail: Use App Password, not regular password
- Check for extra spaces in credentials

### "Sender address rejected" Error

**Cause:** Sender not verified
**Solution:**
- Verify sender email in your SMTP provider dashboard
- For production: Complete domain authentication
- Ensure `SMTP_FROM` matches verified address

### Emails Going to Spam

**Solutions:**
1. **Complete SPF/DKIM/DMARC setup** in DNS
2. **Warm up IP address** - Start with low volume
3. **Use verified sender domain**
4. **Include unsubscribe link** (for marketing emails)
5. **Monitor bounce rates** and clean list

### "Daily sending quota exceeded"

**Cause:** Hit provider limits
**Solution:**
- Gmail: 500/day limit → Switch provider
- SendGrid free: 100/day → Upgrade plan
- Check provider dashboard for limits

---

## Production Checklist

### Before Launch

- [ ] Choose production SMTP provider (SendGrid/Mailgun/AWS SES)
- [ ] Create account and verify identity
- [ ] Set up domain authentication (SPF/DKIM)
- [ ] Generate SMTP credentials
- [ ] Configure `.env.production` with credentials
- [ ] Test email delivery to various providers (Gmail, Yahoo, Outlook)
- [ ] Check emails not going to spam
- [ ] Set up email monitoring/alerts
- [ ] Configure bounce handling
- [ ] Set appropriate sending limits

### Environment Variables

Production `.env`:

```bash
# Required
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-production-api-key
SMTP_FROM=noreply@rork.app

# Optional but recommended
SMTP_REPLY_TO=support@rork.app
SMTP_TIMEOUT=10000
```

### Email Best Practices

1. **Use transactional email provider** (not Gmail/personal)
2. **Authenticate your domain** (SPF, DKIM, DMARC)
3. **Use consistent sender address** (noreply@rork.app)
4. **Include plain text version** (already implemented)
5. **Handle bounces** - Monitor and remove bad addresses
6. **Rate limit sends** - Don't spam your limits
7. **Log all sends** - Track success/failure
8. **Test regularly** - Ensure delivery working

### Monitoring

**Track these metrics:**
- Delivery rate (should be > 99%)
- Bounce rate (should be < 5%)
- Spam complaint rate (should be < 0.1%)
- Open rate (for marketing emails)

**Set up alerts for:**
- SMTP authentication failures
- Delivery failures > 10/hour
- Bounce rate spikes
- Daily quota warnings

---

## Email Template Customization

### Update Branding

Edit `src/services/email.service.js`:

```javascript
// Change colors
background: linear-gradient(135deg, #YOUR_COLOR1 0%, #YOUR_COLOR2 100%);

// Change logo (if you have one)
<img src="https://rork.app/logo.png" alt="Rork Logo" style="height: 50px;">

// Update company name
<p>&copy; ${new Date().getFullYear()} YOUR_COMPANY. All rights reserved.</p>
```

### Add New Email Types

1. Add function to `src/services/email.service.js`
2. Create HTML template
3. Add text fallback
4. Call from appropriate controller

---

## Cost Estimation

### SendGrid Pricing

- **Free:** 100 emails/day (3,000/month)
- **Essentials:** $19.95/mo - 50,000 emails/month
- **Pro:** $89.95/mo - 100,000 emails/month

### Mailgun Pricing

- **Trial:** 5,000 emails/month (3 months)
- **Foundation:** $35/mo - 50,000 emails/month
- **Growth:** $80/mo - 100,000 emails/month

### AWS SES Pricing

- **First 62,000:** $0/month (when sent from EC2)
- **Additional:** $0.10 per 1,000 emails
- **Example:** 100,000 emails/month = $3.80/month

**Recommendation:** Start with SendGrid free tier, upgrade when needed.

---

## Support

### Provider Support

- **SendGrid:** [https://sendgrid.com/support](https://sendgrid.com/support)
- **Mailgun:** [https://help.mailgun.com](https://help.mailgun.com)
- **AWS SES:** [https://aws.amazon.com/ses/support](https://aws.amazon.com/ses/support)

### Nodemailer Docs

- [https://nodemailer.com/about/](https://nodemailer.com/about/)

### Internal Support

For backend email issues:
- Check logs: `tail -f logs/combined.log | grep email`
- Review error tracking in Sentry
- Test SMTP connection: See [Testing](#testing-email-configuration)

---

**Document Version:** 1.0
**Last Updated:** January 28, 2026
**Next Review:** February 28, 2026
