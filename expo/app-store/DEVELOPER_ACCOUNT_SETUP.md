# Developer Account Setup Guide

**Priority:** 🔴 BLOCKING - Cannot submit apps without these accounts
**Timeline:** 1-2 weeks (Apple requires D-U-N-S number which takes time)
**Cost:** Apple $99/year + Google $25 one-time = **$124**

---

## Quick Overview

| Platform | Cost | Approval Time | Renewable |
|----------|------|---------------|-----------|
| **Apple Developer Program** | $99/year | 1-2 weeks (D-U-N-S) + 24-48 hours | Annual |
| **Google Play Console** | $25 one-time | Instant | Lifetime |

**Start with Apple first** (takes longer due to D-U-N-S requirement)

---

## Part 1: Apple Developer Program

### Prerequisites

- [ ] Apple ID (if you don't have one, create at appleid.apple.com)
- [ ] Credit/debit card for payment
- [ ] Legal business entity OR personal enrollment
- [ ] D-U-N-S Number (we'll get this)

### Step 1: Get D-U-N-S Number (1-2 weeks)

**What is D-U-N-S?** A unique 9-digit number that identifies your business entity (required by Apple)

**Option A: Enroll as Organization** (if you have an LLC/company)

```
1. Go to: https://developer.apple.com/enroll/duns-lookup/

2. Search for your organization:
   - Legal Entity Name: [Your Business Name]
   - Country: United States
   - Address: [Your Business Address]

3. Two outcomes:

   a) D-U-N-S found ✅
      - Copy your D-U-N-S number
      - Proceed to Step 2

   b) D-U-N-S not found ❌
      - Click "Request a D-U-N-S Number"
      - Fill out form with business details
      - Submit request
      - Wait 1-2 weeks for Dun & Bradstreet to process
      - Check email for D-U-N-S number
```

**Option B: Enroll as Individual** (faster, but apps published under personal name)

```
If you don't have a business entity:
- Skip D-U-N-S requirement
- Enroll as individual (your name will be public)
- Can switch to organization later
- Proceed directly to Step 2
```

**My Recommendation:** If you plan to grow, enroll as organization. If you want to launch ASAP, enroll as individual first.

### Step 2: Start Apple Developer Enrollment (30 minutes)

```
1. Go to: https://developer.apple.com/programs/enroll/

2. Click "Start Your Enrollment"

3. Sign in with your Apple ID

4. Choose Account Type:
   - Individual (faster, uses your personal info)
   - Organization (requires D-U-N-S, business info)

5. Fill out personal/business information:
   - Legal Name
   - Address
   - Phone Number
   - Email
   - D-U-N-S Number (if organization)

6. Review Apple Developer Agreement
   - Read terms
   - Agree to terms
   - Submit
```

### Step 3: Identity Verification (24-48 hours)

Apple will verify your identity:

**For Individuals:**
- Apple may call your phone number to verify
- Answer call and confirm identity
- Verification usually within 24 hours

**For Organizations:**
- Apple verifies D-U-N-S number with Dun & Bradstreet
- May call primary contact
- May request additional documentation
- Verification takes 24-48 hours (or longer)

**What to expect:**
- Check email frequently
- Answer phone calls from (800) 275-2273 (Apple)
- Respond to any Apple emails immediately

### Step 4: Complete Purchase (5 minutes)

Once verified:

```
1. Apple will send email: "Complete Your Purchase"

2. Go to: https://developer.apple.com/account/

3. Click "Complete Purchase"

4. Payment:
   - Cost: $99 USD
   - Recurring: Annually (auto-renews)
   - Payment methods: Credit/debit card, Apple Pay

5. Enter payment details

6. Confirm purchase

7. Receive confirmation email
```

### Step 5: Access App Store Connect (immediate)

```
1. Go to: https://appstoreconnect.apple.com

2. Sign in with your Apple ID

3. Agree to agreements:
   - Paid Applications Agreement (if selling apps/IAP)
   - Click "Agreements, Tax, and Banking"
   - Complete all required agreements

4. You're ready to create your app!
```

### Apple Developer Program - Troubleshooting

**Issue: D-U-N-S taking too long**
- Contact Apple Developer Support: 1-800-633-2152
- They can expedite if needed
- Or enroll as individual first, switch to organization later

**Issue: Identity verification failed**
- Check that all info matches government ID exactly
- Ensure phone number is correct and reachable
- Contact Apple Developer Support for help

**Issue: Payment declined**
- Try different credit card
- Ensure card allows international transactions
- Contact your bank to authorize Apple charge

---

## Part 2: Google Play Console

Much simpler and faster than Apple!

### Prerequisites

- [ ] Google Account (Gmail)
- [ ] Credit/debit card for $25 one-time fee
- [ ] Developer profile information

### Step 1: Create Developer Account (15 minutes)

```
1. Go to: https://play.google.com/console/signup

2. Sign in with Google Account

3. Accept Developer Distribution Agreement
   - Read agreement
   - Check "I have read and agree"
   - Continue

4. Pay Registration Fee:
   - Cost: $25 USD (one-time, lifetime)
   - Payment methods: Credit/debit card, Google Pay
   - Enter payment details
   - Complete payment

5. Complete Account Details:

   Developer Name:
   - Enter: "Nox Social" (or your name/business)
   - This will be visible to users

   Email Address:
   - Use: support@nox.social (or your email)
   - Users will see this for support

   Website:
   - Enter: https://nox.social
   - Optional but recommended

   Phone Number:
   - Your contact number
   - For Google to reach you if needed

6. Developer Type:
   - Individual: If you're solo founder
   - Organization: If you have a business entity

7. Submit

8. Account Created! ✅
```

### Step 2: Verify Your Identity (may be required)

Google may ask for identity verification:

```
1. If prompted, prepare:
   - Government-issued ID (driver's license, passport)
   - Take clear photo
   - Upload to Google

2. Verification usually instant or within 24 hours

3. Check email for confirmation
```

### Step 3: Set Up Payment Profile (if selling apps/IAP)

```
1. In Play Console, go to:
   Settings → Developer Account → Payments Profile

2. Add payment profile:
   - Business/Individual name
   - Address
   - Tax information (if applicable)

3. Link payment method for receiving payments
   - Bank account details
   - Or use Google Pay

4. Submit for verification (1-2 days)
```

**Note:** Only needed if you plan to sell apps or in-app purchases. Free apps don't require this.

### Step 4: Create Your First App

```
1. In Play Console, click "Create App"

2. Fill out initial details:
   - App name: Nox
   - Default language: English (United States)
   - App or game: App
   - Free or paid: Free (or Paid if charging)

3. Declarations:
   - Check boxes confirming policies
   - Agree to Google Play's Developer Program Policies
   - Agree to US export laws

4. Create App

5. You're ready to fill out store listing!
```

### Google Play - Troubleshooting

**Issue: Payment not going through**
- Use different credit card
- Try Google Pay if available
- Check card has international transactions enabled

**Issue: Account suspended**
- Rare for new accounts
- Usually policy violation (check spam/promotions)
- Appeal via Play Console if happens

**Issue: Identity verification stuck**
- Upload clear, valid government ID
- Ensure name matches exactly
- Contact Google Play Support if delayed >48 hours

---

## Cost Breakdown

### Apple Developer Program

```
Year 1:    $99 (enrollment)
Year 2:    $99 (renewal)
Year 3:    $99 (renewal)
...
Total:     $99/year recurring
```

**Auto-renews:** Yes (can disable in account settings)
**Refundable:** No
**Can cancel:** Yes, but lose access immediately

### Google Play Console

```
One-time:  $25 (lifetime access)
Total:     $25 forever
```

**Recurring:** No
**Refundable:** No
**Lifetime access:** Yes

### Total First Year: $124

---

## Timeline

### Realistic Timeline:

**Apple Developer:**
```
Week 1-2: Get D-U-N-S number (if organization)
Day 1: Submit enrollment application (30 min)
Day 1-2: Identity verification
Day 2-3: Complete purchase
Day 3: Access App Store Connect
Total: 2-14 days (depends on D-U-N-S)
```

**Google Play:**
```
Day 1: Create account (15 min)
Day 1: Identity verification (if required, instant to 24 hours)
Day 1: Start building app listing
Total: 1 day (sometimes instant!)
```

### Parallel Timeline (Do Both Simultaneously):

```
Day 1:
  Morning: Request D-U-N-S number for Apple ✅
  Afternoon: Create Google Play account ✅ DONE

Day 2-14:
  Wait for D-U-N-S (Apple) ⏳
  Build app listing on Google Play ✅

Day 14-15:
  D-U-N-S received ✅
  Enroll in Apple Developer Program ✅

Day 15-16:
  Apple verification complete ✅
  Ready to submit to both stores! ✅
```

---

## After Account Setup

### Apple App Store Connect

**Next steps:**
1. Create app record
2. Fill out app information
3. Add screenshots
4. Add app icon
5. Submit privacy policy URL
6. Add App Store description
7. Upload build via Xcode or Transporter
8. Submit for review

**Full guide:** See `APP_STORE_SUBMISSION.md` (to be created)

### Google Play Console

**Next steps:**
1. Complete store listing (already in progress)
2. Set up content rating questionnaire
3. Complete data safety form
4. Add screenshots
5. Add app icon
6. Upload APK or AAB file
7. Submit for review

**Full guide:** See `PLAY_STORE_SUBMISSION.md` (to be created)

---

## Important Notes

### Apple

- **Name on public profile:** Will show "Published by [Your Name/Business]"
- **Can't delete account:** Once created, can't be deleted (can stop renewing)
- **Multiple apps:** One account = unlimited apps
- **Team members:** Can add team members (different roles/permissions)
- **TestFlight:** Included free (beta testing)

### Google

- **Name on public profile:** Developer name you entered
- **Account suspension:** Google strict on policies, read carefully
- **Multiple apps:** One account = unlimited apps
- **User reviews:** Can respond to reviews directly
- **Beta testing:** Built-in internal/closed/open testing tracks

---

## Common Questions

**Q: Can I use same business entity for both?**
A: Yes! Use same business name, address, etc.

**Q: What if I don't have a business?**
A: Enroll as individual. Can create business later and switch.

**Q: Can I transfer apps later?**
A: Yes, both Apple and Google allow app transfer (requires coordination)

**Q: What if I can't afford $99 right now?**
A: Start with Google Play ($25), launch there first, get revenue, then Apple.

**Q: Can I get refund if app rejected?**
A: No, fees are non-refundable even if app rejected.

**Q: Do I need business bank account?**
A: Not required for free apps. Required if selling apps/IAP.

**Q: What if my D-U-N-S application is denied?**
A: Rare. Usually means business info doesn't match records. Contact D&B support.

---

## Support Contacts

### Apple Developer Support

**Phone (US):** 1-800-633-2152
**Email:** Through developer.apple.com/contact
**Hours:** Mon-Fri 9am-5pm PST
**Response time:** Usually 24-48 hours

**Common reasons to call:**
- D-U-N-S expedite request
- Identity verification issues
- Payment problems
- Technical app submission issues

### Google Play Support

**Help Center:** https://support.google.com/googleplay/android-developer
**Email:** Through Play Console support form
**Response time:** 24-72 hours

**Common reasons to contact:**
- Account suspension appeal
- Payment issues
- Policy clarification
- Technical issues

---

## Quick Start Checklist

### Before Starting:

- [ ] Have Apple ID ready
- [ ] Have Google Account ready
- [ ] Have credit/debit card for payments ($124 total)
- [ ] Have business information (name, address, phone)
- [ ] Decide: Individual vs Organization enrollment

### Apple (Start immediately):

- [ ] Request D-U-N-S number (if organization) - DO THIS FIRST
- [ ] Or start enrollment as individual
- [ ] Wait for verification email/call
- [ ] Complete purchase ($99)
- [ ] Access App Store Connect
- [ ] Agree to agreements

### Google (Can complete in 1 day):

- [ ] Go to play.google.com/console/signup
- [ ] Pay $25 fee
- [ ] Complete developer profile
- [ ] Identity verification (if required)
- [ ] Create first app

### After Both Setup:

- [ ] Save login credentials securely
- [ ] Add calendar reminder for Apple renewal (Year 2)
- [ ] Bookmark both console URLs
- [ ] Proceed to app submission process

---

## Next Steps

Once both accounts are set up:

1. **Complete app build:**
   - Run: `eas build --platform ios --profile production`
   - Run: `eas build --platform android --profile production`

2. **Prepare store assets:**
   - Screenshots ✅ (already have plan)
   - App icon ✅ (already have brief)
   - Privacy policy ✅ (already created)
   - App description ✅ (already written)

3. **Submit apps:**
   - Apple: Upload build + metadata
   - Google: Upload AAB + metadata

4. **Wait for review:**
   - Apple: 1-3 days average
   - Google: 1-7 days average

5. **Launch! 🚀**

---

**Ready to start?** Begin with Apple D-U-N-S request NOW (takes longest). While waiting, complete Google Play setup.

**Questions?** Contact support numbers above or email support@nox.social
