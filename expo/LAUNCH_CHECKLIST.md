# Nox v1.0 Launch Checklist

The single source of truth for flipping from test/beta to public production.
Work top to bottom on launch day. Nothing here is destructive until you
explicitly run it.

---

## A. Stripe live mode (START EARLY — 1-3 day verification)

Test mode works today. Live mode = real money, and needs identity verification
that takes days, so begin this well before launch.

1. **Activate the account:** https://dashboard.stripe.com/account/onboarding
   - Business details, your identity (ID + maybe selfie), and a **bank account**
     for payouts. Submit and wait for Stripe to verify (1-3 business days).
2. **Get live keys** (only after "Payments enabled" shows): toggle OFF Test mode,
   then https://dashboard.stripe.com/apikeys
   - `pk_live_...` (publishable) and `sk_live_...` (secret)
3. **Swap the keys:**
   ```bash
   heroku config:set STRIPE_SECRET_KEY=sk_live_XXXX -a rork-api-prod
   # publishable key goes to EAS (rebuild picks it up):
   npx eas-cli@latest env:update production \
     --variable-name EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY --variable-environment production \
     --value pk_live_XXXX --non-interactive
   ```
   (Never paste the live SECRET key into a chat/AI tool. Set it yourself.)
4. **Create the LIVE webhook** (test webhook does NOT carry over):
   ```bash
   curl -s https://api.stripe.com/v1/webhook_endpoints -u "sk_live_XXXX:" \
     -d url="https://rork-api-prod-3a4b8043e7dd.herokuapp.com/webhooks/stripe" \
     -d "enabled_events[]=payment_intent.succeeded" \
     -d "enabled_events[]=payment_intent.payment_failed" \
     -d "enabled_events[]=charge.refunded"
   # copy the returned "secret" (whsec_...) and:
   heroku config:set STRIPE_WEBHOOK_SECRET=whsec_XXXX -a rork-api-prod
   ```
5. **Apple Pay in live mode:** the merchant ID + payment-processing certificate
   already created carry over. Re-verify a real Apple Pay purchase on device
   after the live keys are set.
6. A new production build is required after the EAS publishable key changes.

---

## B. Email delivery (SendGrid) — password reset + venue verification

Currently these emails log to the server console instead of sending.

1. Sign up: https://signup.sendgrid.com (free tier = 100/day)
2. Verify a sender identity (Settings → Sender Authentication).
3. Create an API key (Settings → API Keys → Full Access).
4. Set on Heroku (exact var names read by `backend/src/services/email.service.js`):
   ```bash
   heroku config:set SMTP_HOST=smtp.sendgrid.net SMTP_PORT=587 \
     SMTP_USER=apikey SMTP_PASS=SG.XXXX EMAIL_FROM=noreply@nox.app -a rork-api-prod
   ```
5. Test: trigger a password reset from the app, confirm the email arrives.

---

## C. Remove the test/dev rig

The chat test bot, "Nox Test Lounge", test event, and test accounts must not be
visible to real users.

1. **Disable the chat auto-reply bot:**
   ```bash
   heroku config:set NOX_TEST_BOT=off -a rork-api-prod
   ```
2. **Dry-run the data cleanup** (shows what it will remove, changes nothing):
   ```bash
   heroku run "node src/scripts/prelaunch-cleanup.js" -a rork-api-prod
   ```
3. **Apply it:**
   ```bash
   heroku run "CONFIRM_CLEANUP=yes node src/scripts/prelaunch-cleanup.js" -a rork-api-prod
   ```
   Removes: the Stripe test event + tiers + tickets, the `nox-test-lounge`
   venue's chat messages, test accounts (`noxtester@nox.test`,
   `nox-chat-bot@example.com`, any `@example.com`), and strips the test-venue
   badge from any real users.

---

## D. App Store Connect metadata (no build — dashboard only)

https://appstoreconnect.apple.com → the Nox app (ASC ID 6759268441)

- [ ] Screenshots (6.7", 6.5", 5.5" — required sizes)
- [ ] App description, subtitle, keywords, promotional text
- [ ] Support URL + marketing URL
- [ ] Privacy policy URL (already have: nox.social/privacy) + **Privacy Nutrition
      Label** (declare: location, contacts, photos, payment info, user content)
- [ ] Age rating (17+ likely — nightlife/alcohol context)
- [ ] `NSUserTrackingUsageDescription` is already in the build if you do any
      cross-app analytics

---

## E. Beta bug bash → final build → submit

1. Push the release-candidate build to TestFlight, invite 5-10 real testers.
2. Fix what they surface (expect 1-2 rounds).
3. Final pre-build gate (CLAUDE.md checklist): bundle export, tsc, patch verify,
   clean commit.
4. Submit for App Store review. Median ~1-2 days; budget for one reject/resubmit.

---

## Deferred to v1.1 (NOT launch blockers)
- Apple Wallet passes (scaffolded; needs Pass Type ID + signing cert + build) —
  decide if v1.0 or v1.1
- Light mode / theme system
- Customizable badges
- Google Sign In (not needed; email-only auth means Sign in with Apple isn't
  required either)
- Google Wallet
