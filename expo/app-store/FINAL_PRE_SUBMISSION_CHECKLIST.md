# Final Pre-Submission Checklist

**Use this checklist before submitting to App Store and Google Play**

**Target Launch:** March 15, 2026
**Days Remaining:** Calculate from today
**Status:** Review each item below

---

## Section 1: Legal & Compliance ⚖️

### Privacy & Terms

- [ ] **Privacy Policy hosted publicly**
  - URL: https://nox.social/privacy
  - Test: Opens in browser without login
  - Test: Works on mobile
  - Uses HTTPS ✅
  - Contains all required disclosures

- [ ] **Terms of Service hosted publicly**
  - URL: https://nox.social/terms
  - Test: Opens in browser without login
  - Test: Works on mobile
  - Uses HTTPS ✅
  - Contains required legal clauses

- [ ] **Privacy policy reviewed by lawyer** (optional but recommended)
  - GDPR compliant (if serving EU users)
  - CCPA compliant (California users)
  - COPPA compliant (age verification)

### Age Verification

- [ ] **21+ age gate implemented**
  - Shows on first app open
  - Requires date of birth input
  - Blocks users under 21
  - Cannot be bypassed

- [ ] **Age verification in Terms**
  - Clearly states 21+ requirement
  - Consequences for lying about age

### Content Moderation

- [ ] **Moderation system active**
  - Report content feature works
  - Block user feature works
  - Content review process in place

- [ ] **Community guidelines visible**
  - Accessible in app settings
  - Clear rules about prohibited content
  - Consequences for violations

---

## Section 2: Developer Accounts 👤

### Apple Developer Program

- [ ] **Account enrolled and active**
  - Account type: [ ] Individual [ ] Organization
  - Status: [ ] Pending [ ] Active
  - Renewal date: __________
  - Cost paid: $99 ✅

- [ ] **Apple ID verified**
  - Two-factor authentication enabled
  - Payment method added
  - Contact info up to date

- [ ] **Agreements signed in App Store Connect**
  - Paid Applications Agreement (if needed)
  - All required legal agreements

### Google Play Console

- [ ] **Account created and verified**
  - Developer name: Nox Social
  - Contact email: support@nox.social
  - Cost paid: $25 ✅

- [ ] **Identity verified** (if required)
  - Government ID submitted
  - Verification approved

- [ ] **Payment profile set up** (if selling apps/IAP)
  - Bank account linked
  - Tax information completed

---

## Section 3: App Assets 🎨

### App Icon

- [ ] **Icon designed and approved**
  - Design matches brand guidelines
  - All required sizes exported:
    - iOS: 1024px, 180px, 120px, 87px, 60px, 40px
    - Android: 512px, 192px, 144px, 96px, 72px, 48px
  - No transparency in iOS 1024px version
  - Source files saved for future use

- [ ] **Icon tested**
  - Looks good at small size (60px)
  - Recognizable in monochrome
  - Stands out among other apps
  - Works on light and dark backgrounds

### Screenshots

- [ ] **Screenshots captured**
  - 7 screens captured per device size
  - Clean status bars
  - No placeholder/test data
  - Realistic user content

- [ ] **Screenshots edited** (if using marketing style)
  - Text overlays added
  - Device frames added
  - Consistent design across all
  - High contrast and readable

- [ ] **All required sizes exported**
  - iOS 6.7": 1290 x 2796 (7 screenshots)
  - iOS 6.5": 1284 x 2778 (7 screenshots)
  - iOS 5.5": 1242 x 2208 (7 screenshots)
  - Android: 1080 x 1920 minimum (4-8 screenshots)

- [ ] **Screenshot quality check**
  - Readable at thumbnail size
  - No spelling errors
  - Accurate representation of app
  - File size under 8 MB each

### App Store Listing Copy

- [ ] **App name decided**
  - Primary: Nox
  - Under 30 characters
  - Not trademarked by others

- [ ] **App subtitle written** (iOS only, 30 chars)
  - "Nightlife. Reimagined." ✅

- [ ] **Short description written** (Android, 80 chars)
  - Compelling, keyword-rich

- [ ] **Full description written**
  - 2 versions prepared ✅
  - Feature-focused (recommended)
  - Story-driven (alternative)
  - Under 4000 characters

- [ ] **Keywords optimized** (iOS, 100 chars)
  - Researched competitor keywords
  - No repeated words
  - High-volume search terms included

- [ ] **Promotional text written** (iOS, 170 chars)
  - Launch announcement ready
  - Update announcements prepared

- [ ] **What's New** (Release notes)
  - Version 1.0.0 notes written ✅
  - Highlights key features

### Demo Account for Reviewers

- [ ] **Demo account created**
  - Email: reviewer@nox.social
  - Password: ReviewAccess2026!
  - Profile completed with data
  - Friends added
  - Challenges joined
  - Location set to major city

- [ ] **Demo account tested**
  - Can log in successfully
  - All features accessible
  - No payment required
  - Works without special permissions

---

## Section 4: Technical Build 🔧

### Production Builds

- [ ] **iOS build generated**
  - Command run: `eas build --platform ios --profile production`
  - Build successful
  - .ipa file downloaded
  - File size under 4 GB

- [ ] **Android build generated**
  - Command run: `eas build --platform android --profile production`
  - Build successful
  - .aab file ready (not .apk)
  - File size under 150 MB

### Configuration Files

- [ ] **app.json updated**
  - App name: "Nox"
  - Bundle ID: social.nox (iOS)
  - Package: social.nox (Android)
  - Version: 1.0.0
  - Build number: 1

- [ ] **eas.json configured**
  - Production profile set
  - Correct API URL: Heroku production
  - Environment variables set
  - Auto-increment enabled

- [ ] **Environment variables**
  - EXPO_PUBLIC_API_URL set correctly
  - USE_MOCK_DATA = false
  - SENTRY_ENVIRONMENT = production
  - No secrets in code

### App Permissions

- [ ] **iOS permissions properly described**
  - Camera: Clear, specific reason
  - Photo Library: Clear, specific reason
  - Location: Clear, specific reason
  - Microphone: Clear, specific reason
  - All using "Nox" brand name (not "Rork")

- [ ] **Android permissions declared**
  - Manifest includes all required permissions
  - Dangerous permissions explained
  - No unnecessary permissions

---

## Section 5: Functionality Testing 🧪

### Core Features

- [ ] **Authentication works**
  - Sign up with email
  - Log in with existing account
  - Password reset flow (if implemented)
  - Log out

- [ ] **Main features functional**
  - Discovery map shows venues
  - Can view venue details
  - Feed displays videos
  - Can upload content
  - Challenges display correctly
  - Ticket purchase works (or disabled)
  - Profile loads properly

- [ ] **No critical bugs**
  - App doesn't crash on launch
  - No infinite loading screens
  - Error messages are user-friendly
  - Back button works correctly
  - Navigation flows smoothly

### Platform-Specific Testing

- [ ] **Tested on iOS physical device**
  - iPhone 12 or newer
  - iOS 16 or newer
  - All features work
  - No crashes

- [ ] **Tested on Android physical device**
  - Pixel or Samsung
  - Android 12 or newer
  - All features work
  - No crashes

- [ ] **Performance acceptable**
  - App launches in under 3 seconds
  - Smooth scrolling
  - No lag or freezing
  - Memory usage reasonable

### Edge Cases

- [ ] **Offline functionality**
  - App doesn't crash without internet
  - Shows appropriate error messages
  - Can retry failed operations

- [ ] **Poor network conditions**
  - Graceful degradation
  - Loading indicators show
  - Timeout errors handled

- [ ] **Empty states**
  - Empty feed shows message
  - No venues shows helpful text
  - No friends shows prompt to invite

---

## Section 6: App Store Specific Requirements

### Apple App Store

- [ ] **App Store Connect app record created**
  - Bundle ID matches: social.nox
  - SKU created
  - Primary language: English (US)

- [ ] **App Information completed**
  - Name: Nox
  - Subtitle: Nightlife. Reimagined.
  - Privacy Policy URL: https://nox.social/privacy
  - Category: Social Networking
  - Secondary category: Lifestyle
  - Age rating: 17+

- [ ] **Pricing and Availability**
  - Price: Free
  - Availability: United States (or worldwide)
  - Pre-order: No (for v1)

- [ ] **App Privacy details filled**
  - Data types collected listed
  - Data use purposes explained
  - Data linking disclosed
  - Tracking practices declared

- [ ] **Build uploaded**
  - Using Transporter or Xcode
  - Processing complete
  - Shows in "Build" section

### Google Play Store

- [ ] **Store listing completed**
  - App name: Nox
  - Short description (80 chars)
  - Full description (4000 chars)
  - Screenshots uploaded (2-8)
  - App icon uploaded (512px)
  - Feature graphic (optional)

- [ ] **Content rating completed**
  - IARC questionnaire filled
  - Rating received: likely Mature 17+
  - Certificate downloaded

- [ ] **Data safety form filled**
  - Data collection disclosed
  - Data sharing disclosed
  - Security practices described
  - Data deletion policy stated

- [ ] **Pricing and distribution**
  - Price: Free
  - Countries: United States (or worldwide)
  - Content rating: Mature 17+

- [ ] **App content declared**
  - Ads: No (unless you have ads)
  - In-app purchases: No/Yes (if applicable)
  - Target audience: Adults

- [ ] **Release details set**
  - Release name: 1.0.0
  - Release notes written
  - AAB uploaded
  - Review and publish

---

## Section 7: Backend & Infrastructure 🖥️

### API & Database

- [ ] **Production API deployed**
  - URL: https://rork-api-prod-3a4b8043e7dd.herokuapp.com/api
  - Responding to requests
  - HTTPS enabled
  - CORS configured for mobile

- [ ] **Database seeded with production data**
  - Venues populated
  - Demo users created
  - Challenges active
  - Events scheduled

- [ ] **API endpoints tested**
  - Authentication working
  - Venue discovery working
  - Social features working
  - Error handling proper

### Monitoring & Logging

- [ ] **Sentry configured**
  - DSN set in environment variables
  - Error tracking active
  - Alerts set up

- [ ] **Analytics set up** (optional)
  - Expo Analytics or similar
  - Event tracking configured
  - User flow tracking

### Backup & Recovery

- [ ] **Database backup configured**
  - Automatic backups enabled
  - Backup frequency: daily minimum
  - Tested restore process

---

## Section 8: Launch Day Prep 🚀

### Communication

- [ ] **Support email active**
  - support@nox.social monitored
  - Auto-reply set up (optional)
  - Response plan ready

- [ ] **Social media ready** (optional)
  - Instagram: @nox.social
  - Twitter/X: @noxsocial
  - TikTok: @noxsocial
  - Launch announcement prepared

### Marketing Materials

- [ ] **Landing page live**
  - https://nox.social functional
  - App Store badges added
  - Play Store badges added
  - Email capture (optional)

- [ ] **Press kit prepared** (optional)
  - App screenshots
  - App icon in multiple sizes
  - Company logo
  - Founder bio
  - Press release

### Monitoring Plan

- [ ] **Launch day monitoring**
  - Who will monitor: __________
  - Hours: First 24 hours
  - Check frequency: Every 2 hours
  - Escalation plan if issues

- [ ] **Crash monitoring**
  - Sentry dashboard access
  - Alert notifications enabled
  - Response team identified

### Rollback Plan

- [ ] **Rollback strategy defined**
  - Previous build available
  - Database rollback tested
  - Communication plan for users

---

## Section 9: Final Checks ✅

### 24 Hours Before Submission

- [ ] **Full app walkthrough**
  - Sign up new account
  - Complete onboarding
  - Use every major feature
  - Log out and log back in

- [ ] **Test with fresh eyes**
  - Ask friend/colleague to test
  - Watch them use app without guidance
  - Note any confusion or issues

- [ ] **Typo check**
  - All in-app text
  - App store listings
  - Screenshots
  - Privacy policy
  - Terms of service

- [ ] **Link verification**
  - All external links work
  - Privacy policy link
  - Terms of service link
  - Support email works
  - Social media links

### Submission Day

- [ ] **Final build test**
  - Download and test the exact build being submitted
  - Not a development build
  - Not a debug build
  - The actual production .ipa/.aab

- [ ] **Team notified**
  - Everyone knows submission happening
  - On standby for urgent issues
  - Celebration planned!

- [ ] **Documentation updated**
  - README reflects current state
  - API documentation current
  - Internal wikis updated

---

## Common Rejection Reasons (Avoid These!)

### Apple

1. ❌ **Incomplete info** - Fill all required fields
2. ❌ **Broken features** - Test everything
3. ❌ **Misleading screenshots** - Show actual app
4. ❌ **No privacy policy** - Must be publicly accessible
5. ❌ **Asks for permissions without explanation** - Update Info.plist
6. ❌ **App crashes** - Fix all critical bugs
7. ❌ **Placeholder content** - Use real data
8. ❌ **Poor performance** - Optimize before submit
9. ❌ **Login required without demo account** - Provide reviewer account
10. ❌ **Requires payment to test** - Provide way to test free

### Google

1. ❌ **Missing privacy policy** - Add and link correctly
2. ❌ **Incomplete data safety** - Fill all sections
3. ❌ **Inappropriate content rating** - Answer IARC honestly
4. ❌ **Dangerous permissions unexplained** - Add descriptions
5. ❌ **Crashes on startup** - Test thoroughly
6. ❌ **Missing required screenshots** - Upload 2-8 screenshots
7. ❌ **Deceptive behavior** - No misleading claims
8. ❌ **Copyright violations** - Use only owned content

---

## Submission Commands

### iOS (via EAS)

```bash
# Generate production build
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --latest

# Or manual: Upload to App Store Connect via Transporter
```

### Android (via EAS)

```bash
# Generate production build
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android --latest

# Or manual: Upload AAB to Play Console
```

---

## After Submission

### Review Timeline

**Apple:**
- Typical: 24-48 hours
- Peak times: Up to 7 days
- Holidays: Longer delays

**Google:**
- Typical: 1-3 days
- First app: Up to 7 days
- Updates: Usually faster

### While Waiting

- [ ] Monitor App Store Connect / Play Console for status updates
- [ ] Respond immediately to any reviewer questions
- [ ] Check email frequently
- [ ] Don't push any updates to backend that break compatibility
- [ ] Prepare launch announcement for social media
- [ ] Test app one more time

### If Approved

- [ ] 🎉 **CELEBRATE!**
- [ ] Post launch announcement
- [ ] Share on social media
- [ ] Email friends/family
- [ ] Monitor for crashes/issues first 24 hours
- [ ] Respond to user reviews
- [ ] Plan first update

### If Rejected

- [ ] Read rejection reason carefully
- [ ] Don't panic - rejections are common
- [ ] Fix the specific issues mentioned
- [ ] Re-submit
- [ ] Most apps approved on 2nd or 3rd try

---

## Final Score

Count your checkmarks:

- **0-50 checked:** Not ready - keep building
- **51-75 checked:** Almost there - focus on critical items
- **76-90 checked:** Ready for submission!
- **91-100 checked:** Excellent! Submit with confidence

---

## Quick Actions If Behind Schedule

**If launch date approaching and not ready:**

1. **Prioritize critical path:**
   - Legal docs (MUST HAVE)
   - App icon (MUST HAVE)
   - Min 3 screenshots (MUST HAVE)
   - Working app build (MUST HAVE)

2. **Ship MVP first:**
   - Launch with basic screenshots (can update later)
   - Use clean screenshots without text overlays
   - Skip optional features
   - Perfect is enemy of done

3. **Parallel work:**
   - Designer works on icon while you prepare legal docs
   - Developer account setup while app build compiles
   - Screenshots while waiting for D-U-N-S number

4. **Start with Google Play:**
   - Faster setup ($25, instant)
   - Faster approval (1-3 days)
   - Get app live, get feedback
   - Use learnings for Apple submission

---

**You're almost there! 🚀 Use this checklist to ensure nothing is missed.**

**Good luck with your launch!**

---

**Last Updated:** February 14, 2026
**Target Launch:** March 15, 2026
**Days Remaining:** ~29 days
