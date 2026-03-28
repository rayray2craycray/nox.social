# Production Readiness Checklist

**Date:** February 13, 2026
**Current Status:** 🟡 Development Complete, Pre-Production Phase
**Target Launch:** March 15, 2026 (4 weeks)

---

## 📊 Current Progress Overview

| Category | Status | Completion |
|----------|--------|------------|
| Core Features | ✅ | 95% |
| Backend Infrastructure | ✅ | 90% |
| Frontend Implementation | ✅ | 85% |
| Critical Systems | ✅ | 100% |
| App Store Requirements | ❌ | 10% |
| Testing & QA | ⚠️ | 40% |
| Legal & Compliance | ❌ | 20% |
| Marketing Assets | ❌ | 15% |

**Overall Readiness: 65%**

---

## Week 1 (Feb 13-19): Critical Pre-Launch Tasks

### 🔴 HIGH PRIORITY - Must Complete

#### App Store Assets & Requirements

- [ ] **App Icons** (Multiple Sizes Required)
  - [ ] iOS: 1024x1024px (App Store), 180x180px (iPhone), 167x167px (iPad)
  - [ ] Android: 512x512px (Play Store), xxxhdpi (192x192), xxhdpi (144x144), xhdpi (96x96)
  - [ ] Create adaptive icon for Android (foreground + background layers)
  - **Estimate:** 1-2 days with designer

- [ ] **App Screenshots** (Required for Both Stores)
  - [ ] iOS: 6.7" iPhone (1290x2796), 6.5" iPhone (1284x2778), 5.5" iPhone (1242x2208)
  - [ ] iPad: 12.9" (2048x2732), 11" (1668x2388)
  - [ ] Android: Phone (1080x1920), Tablet (1200x1920)
  - [ ] Capture 4-8 key screens: Onboarding, Discovery Map, Feed, Profile, Events, Challenges
  - [ ] Add marketing text overlays explaining features
  - **Estimate:** 2-3 days

- [ ] **App Store Listing Copy**
  - [ ] App Name: "Nox" or "Nox Social" (max 30 chars)
  - [ ] Subtitle/Short Description (max 30 chars): "Nightlife. Reimagined."
  - [ ] Full Description (max 4000 chars): Write compelling copy highlighting:
    - Real-time venue discovery
    - Social challenges and rewards
    - Live event highlights
    - Group ticket purchases
  - [ ] Keywords/Tags (100 chars iOS, 50 chars Android)
  - [ ] Promotional text (170 chars, updateable without review)
  - **Estimate:** 1 day

- [ ] **Privacy Policy** (REQUIRED - App Rejection Without)
  - [ ] Draft comprehensive privacy policy covering:
    - Data collection (location, photos, contacts, camera)
    - Data usage (analytics, personalization)
    - Third-party services (Cloudinary, Sentry, MongoDB Atlas)
    - User rights (access, deletion, portability)
    - GDPR compliance (EU users)
    - CCPA compliance (California users)
    - Children's privacy (COPPA - state app is 21+)
  - [ ] Host at: `https://nox.social/privacy` or `https://nox.social/privacy`
  - [ ] Add link to app settings screen
  - **Template:** Use termly.io or iubenda.com ($0-50/month)
  - **Estimate:** 0.5-1 day

- [ ] **Terms of Service** (REQUIRED)
  - [ ] User conduct rules
  - [ ] Content guidelines
  - [ ] Account termination policy
  - [ ] Limitation of liability
  - [ ] Dispute resolution
  - [ ] Host at: `https://nox.social/terms`
  - **Estimate:** 0.5-1 day

- [ ] **Age Rating & Content Declarations**
  - [ ] Complete Apple's questionnaire (age rating, data collection)
  - [ ] Complete Google's questionnaire (content rating, ads, data safety)
  - [ ] Expected rating: 17+ (due to alcohol/nightlife content)
  - [ ] Declare data collection: Location, Camera, Photos, Contacts (optional)
  - **Estimate:** 1 hour

#### Legal & Compliance

- [ ] **Age Verification**
  - [ ] ✅ Already implemented: AgeVerificationGate component
  - [ ] Add "You must be 21+ to use this app" disclaimer
  - [ ] Store date of birth in user profile
  - [ ] Block users under 21 from creating accounts

- [ ] **Content Moderation Policy**
  - [ ] Document moderation guidelines
  - [ ] Define prohibited content (violence, hate speech, illegal activity)
  - [ ] Moderation response times (24-48 hours)
  - [ ] Appeal process for blocked users
  - **Estimate:** 0.5 day

- [ ] **DMCA Compliance** (Copyright Claims)
  - [ ] Designate DMCA agent
  - [ ] Add copyright infringement reporting form
  - [ ] Host at: `https://nox.social/dmca`
  - **Estimate:** 0.5 day

#### Critical Bug Fixes & Testing

- [ ] **E2E Testing - Core User Flows**
  - [ ] Signup → Email verification → Onboarding
  - [ ] Login → Discover venues → View venue details
  - [ ] Join challenge → Track progress → Claim reward
  - [ ] Upload video highlight → View in feed → Like/comment
  - [ ] Purchase event ticket → Receive QR code → Check-in
  - [ ] Create group purchase → Invite friends → Complete purchase
  - **Estimate:** 2 days

- [ ] **Fix Critical Issues from Audit**
  - [ ] ⚠️ Password reset flow (currently missing)
  - [ ] ⚠️ Email verification flow (backend exists, frontend missing)
  - [ ] ⚠️ Deep linking (for Instagram share, referral codes)
  - **Estimate:** 2 days

- [ ] **Performance Testing**
  - [ ] Test with 1000+ venues on map (check for lag)
  - [ ] Test with 500+ videos in feed (infinite scroll)
  - [ ] Test image upload with 10MB+ files
  - [ ] Test video upload with 100MB files
  - [ ] Monitor memory usage on low-end devices
  - **Estimate:** 1 day

**Week 1 Total Estimate:** 5-7 full working days (or 10-14 with part-time)

---

## Week 2 (Feb 20-26): Testing & Polish

### 🟡 MEDIUM PRIORITY - Recommended Before Launch

#### Apple Developer Account Setup

- [ ] **Enroll in Apple Developer Program** ($99/year)
  - [ ] Visit: https://developer.apple.com/programs/enroll/
  - [ ] Provide D-U-N-S number (free from Dun & Bradstreet, takes 1-2 weeks)
  - [ ] Complete enrollment (1-2 days for approval)
  - **Estimate:** 3-5 days (waiting time)

- [ ] **Certificates & Provisioning Profiles**
  - [ ] Generate Distribution Certificate (for App Store)
  - [ ] Create App ID (com.nox.social or com.nox.social)
  - [ ] Create Provisioning Profile (App Store distribution)
  - [ ] Configure Push Notifications certificate
  - [ ] Configure Associated Domains (for deep links)
  - **Using EAS Build (Expo):** Most of this is automated
  - **Estimate:** 0.5-1 day

- [ ] **App Store Connect Setup**
  - [ ] Create app record
  - [ ] Upload app icon
  - [ ] Add screenshots
  - [ ] Fill out metadata (description, keywords, category)
  - [ ] Set pricing (Free with In-App Purchases if applicable)
  - [ ] Select availability (US only initially, or worldwide)
  - **Estimate:** 1-2 hours

#### Google Play Console Setup

- [ ] **Create Google Play Developer Account** ($25 one-time)
  - [ ] Visit: https://play.google.com/console/signup
  - [ ] Verify identity (government ID required)
  - [ ] Complete account setup (instant approval usually)
  - **Estimate:** 1 hour

- [ ] **Play Console Setup**
  - [ ] Create app record
  - [ ] Upload app icon
  - [ ] Add screenshots
  - [ ] Fill out store listing
  - [ ] Complete content rating questionnaire (IARC)
  - [ ] Set pricing & distribution
  - [ ] Add privacy policy URL
  - **Estimate:** 1-2 hours

#### Build & Deployment Setup

- [ ] **Configure EAS Build** (Expo Application Services)
  - [ ] Install: `npm install -g eas-cli`
  - [ ] Login: `eas login`
  - [ ] Configure: `eas build:configure`
  - [ ] Create eas.json with production profile
  - [ ] Test production build locally first
  - **Estimate:** 1 day

- [ ] **iOS Production Build**
  - [ ] Run: `eas build --platform ios --profile production`
  - [ ] Wait for build to complete (15-30 minutes)
  - [ ] Download .ipa file
  - [ ] Test on TestFlight first (internal testing)
  - **Estimate:** 0.5 day + testing time

- [ ] **Android Production Build**
  - [ ] Run: `eas build --platform android --profile production`
  - [ ] Generate signed AAB (Android App Bundle)
  - [ ] Test on internal track first
  - **Estimate:** 0.5 day + testing time

#### Testing

- [ ] **Beta Testing (TestFlight & Internal Track)**
  - [ ] Upload iOS build to TestFlight
  - [ ] Invite 10-20 beta testers
  - [ ] Collect feedback for 3-5 days
  - [ ] Upload Android to Internal Testing track
  - [ ] Fix critical bugs found by testers
  - **Estimate:** 3-5 days (includes feedback collection)

- [ ] **Security Testing**
  - [ ] Test authentication vulnerabilities (SQL injection, XSS)
  - [ ] Test API rate limiting
  - [ ] Test file upload security (file type validation, size limits)
  - [ ] Review exposed environment variables
  - [ ] Test deep link security (URL injection)
  - **Estimate:** 1 day

- [ ] **Accessibility Testing**
  - [ ] Test with VoiceOver (iOS) and TalkBack (Android)
  - [ ] Add accessibility labels to interactive elements
  - [ ] Test with increased text size
  - [ ] Add color contrast for visually impaired users
  - **Estimate:** 1 day

**Week 2 Total Estimate:** 5-7 days + waiting periods

---

## Week 3 (Feb 27 - Mar 5): Submission & Pre-Launch

### 🟢 RECOMMENDED - Launch Optimization

#### App Store Optimization (ASO)

- [ ] **Keyword Research**
  - [ ] Research competitor keywords (e.g., "nightlife app", "club finder")
  - [ ] Identify high-volume, low-competition keywords
  - [ ] Use tools: Sensor Tower, App Annie, Mobile Action
  - [ ] Optimize title and description for keywords
  - **Estimate:** 1 day

- [ ] **A/B Test Screenshots** (Optional but Recommended)
  - [ ] Test different screenshot orders
  - [ ] Test with/without text overlays
  - [ ] Use App Store Product Page Optimization (Apple)
  - **Estimate:** Ongoing after launch

#### Backend Production Hardening

- [ ] **Heroku Configuration**
  - [ ] ✅ Already deployed
  - [ ] Upgrade to Hobby ($7/month) or Professional ($25-50/month) dyno
  - [ ] Enable automatic SSL certificate
  - [ ] Configure Redis for session storage (if needed)
  - [ ] Set up automated daily backups
  - **Estimate:** 0.5 day

- [ ] **MongoDB Atlas Production Setup**
  - [ ] ✅ Already using Atlas
  - [ ] Verify M10+ cluster for production (currently on free tier?)
  - [ ] Enable automated backups (Point-in-Time Recovery)
  - [ ] Configure IP whitelist (Heroku IPs)
  - [ ] Set up monitoring alerts
  - **Estimate:** 0.5 day

- [ ] **Environment Variables Security**
  - [ ] Rotate all production secrets (JWT_SECRET, API keys)
  - [ ] Use Heroku Config Vars (never commit to git)
  - [ ] Set up separate staging environment
  - **Estimate:** 1 hour

- [ ] **Monitoring & Alerts**
  - [ ] ✅ Sentry already configured
  - [ ] Set up Heroku metrics dashboard
  - [ ] Configure alert thresholds (error rate, response time)
  - [ ] Set up email/Slack notifications
  - [ ] Add UptimeRobot for health check monitoring
  - **Estimate:** 0.5 day

#### Push Notifications Setup

- [ ] **Firebase Cloud Messaging (FCM) Setup**
  - [ ] Create Firebase project
  - [ ] Install expo-notifications
  - [ ] Configure FCM credentials in EAS
  - [ ] Implement notification permissions request
  - [ ] Test notification delivery
  - **Estimate:** 1-2 days

- [ ] **Notification Use Cases**
  - [ ] Friend requests
  - [ ] Challenge milestones
  - [ ] Event reminders
  - [ ] Group purchase invites
  - [ ] Messages in venue lobbies
  - **Estimate:** 1 day (backend + frontend)

#### Analytics Setup

- [ ] **Implement Analytics Events**
  - [ ] User signup/login
  - [ ] Venue views
  - [ ] Challenge joins
  - [ ] Video uploads
  - [ ] Ticket purchases
  - [ ] Use Expo Analytics or Mixpanel
  - **Estimate:** 1 day

#### App Store Submission

- [ ] **iOS Submission to App Store**
  - [ ] Upload final build to App Store Connect
  - [ ] Complete all metadata fields
  - [ ] Add Export Compliance information
  - [ ] Submit for review
  - [ ] **Review time: 1-3 days typically** (can be 24 hours or up to 1 week)
  - **Estimate:** 2-3 hours submission + waiting

- [ ] **Android Submission to Google Play**
  - [ ] Upload AAB to Play Console
  - [ ] Complete all store listing fields
  - [ ] Submit for review
  - [ ] **Review time: Usually faster than iOS, 1-3 days**
  - **Estimate:** 2-3 hours submission + waiting

**Week 3 Total Estimate:** 4-6 days + review waiting time

---

## Week 4 (Mar 6-12): Launch Preparation & Marketing

### 🔵 OPTIONAL - Growth & Marketing

#### Pre-Launch Marketing

- [ ] **Landing Page** (Optional but Recommended)
  - [ ] Create simple landing page at nox.social or nox.social
  - [ ] Email signup for launch notification
  - [ ] App Store badges + links
  - [ ] Highlight key features with screenshots
  - [ ] Use Webflow, Framer, or simple HTML
  - **Estimate:** 1-2 days

- [ ] **Social Media Presence**
  - [ ] Create Instagram account
  - [ ] Create TikTok account
  - [ ] Post teasers of app features
  - [ ] Engage with nightlife influencers
  - [ ] Create launch announcement content
  - **Estimate:** Ongoing

- [ ] **Press Kit**
  - [ ] App icon (high-res PNG)
  - [ ] Screenshots
  - [ ] App description
  - [ ] Founder bio
  - [ ] Press release
  - [ ] Contact information
  - **Estimate:** 0.5-1 day

#### Launch Day Preparation

- [ ] **Customer Support Setup**
  - [ ] Create support email: support@nox.social
  - [ ] Add to App Store listing
  - [ ] Create FAQ document
  - [ ] Prepare canned responses for common issues
  - **Estimate:** 0.5 day

- [ ] **Launch Monitoring**
  - [ ] Monitor Sentry for errors
  - [ ] Monitor server load on Heroku
  - [ ] Watch App Store reviews
  - [ ] Respond to user feedback quickly
  - **Estimate:** Ongoing on launch day

**Week 4 Total Estimate:** 2-4 days

---

## Timeline Summary

| Week | Focus | Critical Tasks | Days Required |
|------|-------|----------------|---------------|
| **Week 1** | App Store Assets & Legal | Icons, Screenshots, Privacy Policy, Terms | 5-7 days |
| **Week 2** | Accounts & Testing | Apple/Google accounts, Builds, Beta testing | 5-7 days + waiting |
| **Week 3** | Submission & Hardening | App Store submission, Backend optimization | 4-6 days + review |
| **Week 4** | Launch & Marketing | Marketing prep, Launch day monitoring | 2-4 days |

**Total Working Days:** 16-24 days
**Total Calendar Time:** 4-5 weeks (including waiting periods)

---

## 🎯 Recommended Launch Timeline

### Conservative Estimate (Recommended)

**Target Launch Date: March 15, 2026**

- **Week 1 (Feb 13-19):** Complete all app store assets, legal documents, critical bug fixes
- **Week 2 (Feb 20-26):** Set up developer accounts, create builds, start beta testing
- **Week 3 (Feb 27 - Mar 5):** Submit to App Store + Play Store, await review
- **Week 4 (Mar 6-12):** Handle rejections/revisions if any, prepare for launch
- **Launch Day (Mar 13-15):** Go live, monitor, respond to feedback

### Aggressive Estimate (Risky)

**Target Launch Date: March 1, 2026**

- Skip beta testing
- Minimal marketing preparation
- Risk of app store rejections delaying launch
- **Not recommended unless absolutely necessary**

---

## 🚨 Common App Store Rejection Reasons (Prepare For)

### Apple App Store

1. **Missing Privacy Policy** (Most common rejection)
   - ✅ Solution: Create and host privacy policy before submission

2. **Incomplete App Information**
   - ✅ Solution: Fill out all metadata fields completely

3. **Bugs/Crashes During Review**
   - ✅ Solution: Thoroughly test before submission, especially onboarding flow

4. **Guideline 4.3 - Spam** (If app is too similar to existing apps)
   - ⚠️ Risk: Low (nightlife apps are common but yours has unique features)
   - Solution: Highlight unique features (challenges, group purchases, live highlights)

5. **Guideline 2.1 - App Completeness**
   - ⚠️ Risk: Medium if using placeholder content
   - Solution: Use real venue data, not lorem ipsum

6. **Guideline 5.1.1 - Data Collection**
   - ⚠️ Risk: Medium if not properly disclosed
   - Solution: Declare all data collection in App Privacy section

### Google Play Store

1. **Missing Privacy Policy**
   - ✅ Solution: Same as Apple

2. **Dangerous Permissions** (Location, Camera, Contacts)
   - ✅ Solution: Explain why each permission is needed in store listing
   - Example: "Location - to find nearby venues"

3. **Content Rating Issues**
   - ⚠️ Risk: Medium (alcohol/nightlife content)
   - Solution: Accurately complete IARC questionnaire (expect 17+ or 18+ rating)

4. **Malware/Security Issues**
   - ⚠️ Risk: Low if following best practices
   - Solution: Don't request unnecessary permissions, use HTTPS

---

## 💰 Launch Costs Summary

### One-Time Costs
- Apple Developer Program: **$99/year**
- Google Play Console: **$25 one-time**
- Privacy Policy Generator: **$0-50** (optional, can write yourself)
- App Icons/Graphics: **$0-500** (DIY or hire designer)

### Monthly Costs
- Heroku Professional Dyno: **$25-50/month**
- MongoDB Atlas M10: **$57/month** (or stay on free tier initially)
- Domain: **$10-15/year**
- Email service: **$0-10/month** (Gmail free tier OK for now)

**Total Initial Investment: $200-800**
**Monthly Costs: $25-100**

---

## 🎬 Launch Day Checklist

**March 15, 2026 (or whenever apps are approved)**

Morning of Launch:
- [ ] Verify both apps are "Ready for Sale"
- [ ] Make final backend deployment (ensure no changes mid-launch)
- [ ] Post launch announcement on social media
- [ ] Send email to waitlist (if you collected emails)
- [ ] Monitor Sentry for errors (watch for spikes)
- [ ] Monitor server performance (Heroku metrics)

During Launch Day:
- [ ] Respond to App Store reviews within 24 hours
- [ ] Fix critical bugs immediately (submit hotfix if needed)
- [ ] Post user testimonials/screenshots to social media
- [ ] Engage with early users on Instagram/TikTok

Week After Launch:
- [ ] Analyze analytics (user retention, most used features)
- [ ] Identify top issues from support emails
- [ ] Plan v1.1 update with fixes and improvements
- [ ] Start ASO optimization based on keyword performance

---

## 🔥 Critical Path (Can't Launch Without)

**BLOCKING ISSUES - Must complete:**

1. ✅ Backend deployed and stable
2. ✅ Frontend connects to production API
3. ✅ Core features working (auth, discovery, feed)
4. ❌ **App icons created**
5. ❌ **Screenshots created**
6. ❌ **Privacy policy published**
7. ❌ **Terms of service published**
8. ❌ **Apple Developer account enrolled**
9. ❌ **Google Play account created**
10. ❌ **Production builds generated**
11. ❌ **Apps submitted for review**

**Current Completion: 3/11 (27%)**

---

## ⚠️ Risk Assessment

### High Risk Issues

1. **Apple Developer Account D-U-N-S Requirement** (1-2 weeks delay)
   - Mitigation: Start enrollment ASAP

2. **App Store Rejection for Missing Privacy Policy**
   - Mitigation: Create privacy policy in Week 1

3. **Backend Performance Under Load**
   - Mitigation: Upgrade Heroku dyno before launch

4. **Beta Testing Reveals Critical Bugs**
   - Mitigation: Allocate 3-5 days for bug fixes

### Medium Risk Issues

1. **App Store Review Takes Longer Than Expected** (7+ days)
   - Mitigation: Submit early, plan for delays

2. **Users Report Upload Failures** (Cloudinary issues)
   - Mitigation: Test with various file sizes beforehand

3. **Poor Initial Reviews** (users find bugs)
   - Mitigation: Thorough testing, quick hotfix response

---

## 📈 Post-Launch Roadmap (v1.1, v1.2)

**Not needed for launch, but plan ahead:**

### v1.1 (1 month after launch)
- Password reset flow
- Email verification reminder
- Push notification preferences
- Friend system implementation
- Bug fixes from user feedback

### v1.2 (2 months after launch)
- In-app purchases (if monetizing)
- Advanced search filters
- Venue owner dashboard improvements
- POS integration beta
- Performance optimizations

---

## 🎯 Absolute Minimum Viable Launch

**If you need to launch ASAP (2 weeks instead of 4):**

**Keep:**
- App icons
- 2-3 screenshots (instead of 8)
- Basic privacy policy (template)
- Basic terms of service (template)
- Core features only (skip nice-to-haves)
- Skip beta testing (risky!)

**Skip (for v1.1):**
- Push notifications
- Advanced analytics
- Marketing materials
- Landing page
- Social media presence
- Press kit

**Risk:** Higher chance of rejection, poor initial reviews, performance issues

---

## 📞 Need Help?

**Common Questions:**

**Q: Can we launch without a designer?**
A: Yes, use Canva or Figma templates for icons/screenshots. Won't be as polished but acceptable.

**Q: What if Apple rejects the app?**
A: Common (30-40% rejection rate for first submission). Fix issues and resubmit (1-2 day review for revisions).

**Q: Do we need a company to publish?**
A: No, can publish as individual. If forming company, consider LLC for liability protection.

**Q: Can we soft launch in one country first?**
A: Yes! Recommend US-only launch initially, then expand after ironing out issues.

**Q: What if we miss the March 15 deadline?**
A: Timeline is flexible. Quality > speed. Better to launch polished than rush and get bad reviews.

---

**Generated by:** Claude Code
**Next Steps:** Start with Week 1 tasks (App Icons + Privacy Policy)
