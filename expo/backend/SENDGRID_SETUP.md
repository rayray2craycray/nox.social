# SendGrid Email Setup Guide

## Step 1: Create SendGrid Account

1. Go to https://signup.sendgrid.com/
2. Sign up for a free account
3. Verify your email address
4. Complete the signup process

**Free Tier**: 100 emails/day permanently free

---

## Step 2: Create API Key

1. Log in to SendGrid dashboard
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. Name it: "Rork Nightlife Production"
5. Select **Full Access** (or at minimum: Mail Send permissions)
6. Click **Create & View**
7. **COPY THE API KEY NOW** - you won't see it again!

The API key will look like:
```
SG.xxxxxxxxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

---

## Step 3: Verify Sender Email

SendGrid requires you to verify the email address you'll send from.

### Option A: Single Sender Verification (Recommended for quick start)
1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Enter your details:
   - From Name: "Rork Nightlife"
   - From Email: noreply@rork.app (or your domain)
   - Reply To: support@rork.app
   - Company Address: (your business address)
4. Click **Create**
5. Check your email and click the verification link

### Option B: Domain Authentication (Better for production)
1. Go to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Enter your domain: rork.app
4. Follow DNS setup instructions (add CNAME records to your domain)
5. Wait for DNS propagation (up to 48 hours)

**Note**: If you don't own a domain yet, use Option A with Gmail:
- From Email: your-email@gmail.com
- This will work but may have lower deliverability

---

## Step 4: Add Credentials to .env

Once you have your API key, add to `/backend/.env`:

```env
# SendGrid SMTP Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-actual-api-key-here
SMTP_FROM=noreply@rork.app
```

**Important**:
- `SMTP_USER` is literally the word "apikey" (don't change this)
- `SMTP_PASS` is your actual SendGrid API key
- `SMTP_FROM` must match the verified sender email

---

## Step 5: Test Email Sending

After configuration, restart your backend and test:

```bash
# In backend directory
npm run dev
```

Then test registration to trigger verification email.

---

## Troubleshooting

### "Username and Password not accepted"
- Make sure `SMTP_USER=apikey` (exactly)
- Make sure `SMTP_PASS` is your full API key starting with `SG.`

### "Sender not verified"
- Go to SendGrid → Settings → Sender Authentication
- Make sure your sender email is verified
- `SMTP_FROM` must exactly match verified email

### Emails not arriving
- Check spam folder
- Check SendGrid Activity dashboard for delivery status
- Verify recipient email is valid
- Check SendGrid account isn't suspended

---

## Monitoring

After setup, monitor your emails:
1. Go to SendGrid Dashboard
2. Click **Activity** to see email delivery status
3. Track:
   - Delivered
   - Bounced
   - Opened
   - Clicked

---

## Rate Limits

**Free Tier**:
- 100 emails/day
- Perfect for initial launch
- No credit card required

**Paid Plans** (if you outgrow free tier):
- Essentials: $19.95/mo for 50,000 emails/mo
- Pro: $89.95/mo for 100,000 emails/mo

---

## Next Steps

After configuring SendGrid:
1. Update `.env` with your API key
2. Restart backend server
3. Test business registration flow
4. Verify email arrives and verification link works
