# App Store Approval Requirements

Complete checklist for iOS App Store and Google Play Store submission.

---

## Table of Contents

1. [iOS App Store Requirements](#ios-app-store-requirements)
2. [Google Play Store Requirements](#google-play-store-requirements)
3. [Technical Requirements](#technical-requirements)
4. [Legal Requirements](#legal-requirements)
5. [Privacy & Data Requirements](#privacy--data-requirements)
6. [Content Requirements](#content-requirements)
7. [Testing Checklist](#testing-checklist)
8. [Submission Process](#submission-process)
9. [Common Rejection Reasons](#common-rejection-reasons)

---

## iOS App Store Requirements

### 1. Apple Developer Account
- [ ] **Enrolled in Apple Developer Program** ($99/year)
- [ ] **Two-Factor Authentication** enabled
- [ ] **App Store Connect** access configured
- [ ] **Certificates & Provisioning Profiles** set up

**URL**: https://developer.apple.com/programs/enroll/

### 2. App Information
- [ ] **App Name**: "Rork Nightlife" or similar (max 30 characters)
- [ ] **Bundle ID**: `com.rork.nightlife` or similar (must be unique)
- [ ] **Primary Language**: English (add more as needed)
- [ ] **Category**: Social Networking or Entertainment
- [ ] **Content Rating**: 17+ (nightlife/alcohol content)
- [ ] **App Version**: 1.0.0 (semantic versioning)
- [ ] **Copyright**: © 2025 Rork Inc. (or your company)

### 3. App Store Listing (Marketing)
- [ ] **App Icon**: 1024x1024px PNG (no transparency, no rounded corners)
- [ ] **Screenshots**: Required for all device sizes
  - iPhone 6.7" (1290 x 2796px) - 3-10 screenshots
  - iPhone 6.5" (1242 x 2688px) - 3-10 screenshots
  - iPhone 5.5" (1242 x 2208px) - Optional
  - iPad Pro 12.9" (2048 x 2732px) - If supporting iPad
- [ ] **App Preview Videos**: Optional but recommended (15-30 seconds)
- [ ] **Description**: Clear, concise (max 4,000 characters)
- [ ] **Keywords**: Comma-separated (max 100 characters)
- [ ] **Promotional Text**: Optional (max 170 characters)
- [ ] **Support URL**: Working website with support info
- [ ] **Marketing URL**: Optional company website
- [ ] **Privacy Policy URL**: Required - must be accessible

**Description Example**:
```
Rork Nightlife - Discover the Best Night Out

Find trending nightclubs, connect with friends, and unlock exclusive VIP access based on your spending. Record and share vibe check videos, see who's out tonight, and never miss the best events.

Features:
• Real-time venue discovery with live vibe scores
• Friend location sharing (opt-in)
• 15-second vibe check videos
• Instagram contact sync
• POS integration for automatic VIP upgrades
• Event tickets and guest list management
• Discord server integration
• Streaks and rewards

Join thousands experiencing the best nightlife!
```

### 4. Age Rating (Important for Nightlife App)
- [ ] **Alcohol, Tobacco, or Drug Use**: Frequent/Intense
- [ ] **Sexual Content**: Infrequent/Mild (if any)
- [ ] **Profanity**: Infrequent/Mild (user-generated content)
- [ ] **Violence**: None
- [ ] **Mature/Suggestive Themes**: Frequent/Intense (nightlife)
- [ ] **Horror/Fear Themes**: None
- [ ] **Gambling**: None
- [ ] **Contests**: None (unless you add challenges with prizes)

**Expected Rating**: 17+ (Alcohol content requires this minimum)

### 5. App Privacy Details (Required)
You must disclose all data collection. Based on your app:

**Data Collected:**
- [ ] **Contact Info**: Email, phone (for auth)
- [ ] **Contacts**: Phone contacts (for friend matching)
- [ ] **User Content**: Videos, photos (vibe checks)
- [ ] **Identifiers**: User ID, device ID
- [ ] **Location**: Precise location (venue check-ins)
- [ ] **Usage Data**: Product interaction, advertising data
- [ ] **Financial Info**: Purchase history (POS integration)
- [ ] **Social Info**: Instagram profile (if synced)

**Data Linked to User**:
- Contact info, contacts, location, user content, identifiers, usage data, financial info

**Data Not Linked to User**:
- Crash logs, diagnostics (if anonymized)

**Data Used for Tracking**:
- Declare if you use data for advertising/analytics across apps

### 6. Technical Requirements
- [ ] **Built with Latest Xcode** (currently Xcode 15+)
- [ ] **iOS Deployment Target**: iOS 14.0 minimum (recommend iOS 15.0+)
- [ ] **Architecture**: arm64 (Apple Silicon) + x86_64 (Intel simulators)
- [ ] **Bitcode**: Deprecated (not needed for iOS 14+)
- [ ] **IPv6 Compatible**: Required
- [ ] **No Crashes**: Zero crash rate during review
- [ ] **No Memory Leaks**: Test with Instruments
- [ ] **Fast Launch Time**: < 400ms to first screen
- [ ] **Background Modes Declared**:
  - Location updates (for venue tracking)
  - Background fetch (for notifications)
  - Remote notifications
- [ ] **Entitlements**:
  - Push Notifications
  - Location Services
  - Camera (for vibe videos)
  - Photo Library
  - Contacts (if syncing)

### 7. App Functionality Requirements
- [ ] **No Broken Links**: All links must work
- [ ] **No Placeholder Content**: No "Coming Soon" features
- [ ] **Account Required**: Must provide demo account if sign-up required
- [ ] **Clear Value Proposition**: App must be useful without sign-in
- [ ] **No Duplicate Apps**: Can't submit multiple similar apps
- [ ] **Complete Features**: All advertised features must work
- [ ] **Offline Functionality**: Must handle offline gracefully
- [ ] **Error Handling**: Clear error messages for users

### 8. Permissions & User Consent
- [ ] **Location Permission**: Clear purpose string
  - "VibeLink needs your location to show nearby venues and connect you with friends."
- [ ] **Camera Permission**: Clear purpose string
  - "VibeLink needs camera access to record vibe check videos."
- [ ] **Photo Library Permission**: Clear purpose string
  - "VibeLink needs photo library access to save and share videos."
- [ ] **Contacts Permission**: Clear purpose string
  - "VibeLink matches your contacts with friends on the app (phone numbers are hashed)."
- [ ] **Notifications Permission**: Clear purpose string
  - "Stay updated on friend activity, events, and rewards."

### 9. Specific Apple Guidelines to Follow

**Guideline 1.1 - Objectionable Content**
- [ ] No defamatory, discriminatory, or mean-spirited content
- [ ] Moderation system for user-generated content
- [ ] Report/block functionality for inappropriate content

**Guideline 2.1 - App Completeness**
- [ ] No beta, demo, trial versions in screenshots
- [ ] All features functional and accessible
- [ ] No "under construction" messages

**Guideline 2.3 - Accurate Metadata**
- [ ] Screenshots match actual app experience
- [ ] Description accurately reflects features
- [ ] No false claims or misleading information

**Guideline 3.1 - In-App Purchase**
- [ ] If selling tickets/VIP access, must use In-App Purchase
- [ ] Physical goods/services can use external payment
- [ ] Reader apps (content consumption) exempt

**Guideline 4.1 - Copycats**
- [ ] Original app, not copying competitors
- [ ] Unique value proposition

**Guideline 5.1 - Privacy**
- [ ] Privacy Policy URL required
- [ ] Clear data usage disclosure
- [ ] User consent for data collection
- [ ] No sale of user data without consent

---

## Google Play Store Requirements

### 1. Google Play Developer Account
- [ ] **Google Play Console** account ($25 one-time fee)
- [ ] **Two-Factor Authentication** enabled
- [ ] **Payment Profile** set up
- [ ] **Identity Verification** completed

**URL**: https://play.google.com/console/signup

### 2. App Information
- [ ] **App Name**: "Rork Nightlife" (max 50 characters)
- [ ] **Package Name**: `com.rork.nightlife` (must match build)
- [ ] **Default Language**: English (US)
- [ ] **Category**: Social or Entertainment
- [ ] **Content Rating**: Questionnaire required (likely Teen or Mature 17+)
- [ ] **Target Audience**: 18+ (alcohol content)
- [ ] **Version Code**: 1
- [ ] **Version Name**: 1.0.0

### 3. Store Listing
- [ ] **App Icon**: 512x512px PNG (32-bit with transparency)
- [ ] **Feature Graphic**: 1024x500px JPG/PNG (required)
- [ ] **Screenshots**: At least 2, max 8
  - Phone: 16:9 or 9:16 aspect ratio (minimum 320px)
  - 7" Tablet: Optional
  - 10" Tablet: Optional
- [ ] **Promo Video**: Optional YouTube video
- [ ] **Short Description**: Max 80 characters
- [ ] **Full Description**: Max 4,000 characters
- [ ] **App Category**: Social or Entertainment
- [ ] **Tags**: Up to 5 relevant tags
- [ ] **Contact Email**: Working support email
- [ ] **Website**: Optional but recommended
- [ ] **Privacy Policy URL**: Required

### 4. Content Rating (IARC)
Complete the content rating questionnaire:
- [ ] **Violence**: Reference to illegal drugs (nightlife context)
- [ ] **Sex**: May contain sexual themes (nightlife context)
- [ ] **Language**: Moderate profanity (user-generated)
- [ ] **Controlled Substances**: Alcohol reference (nightlife venues)
- [ ] **Gambling**: None
- [ ] **User Interaction**: Users can interact, share info, location
- [ ] **User-Generated Content**: Yes (videos, messages)
- [ ] **Personal Info**: Collected and shared
- [ ] **Location Sharing**: Yes

**Expected Rating**: Teen (13+) or Mature 17+

### 5. Data Safety Section
Declare all data collection and sharing:

**Location**:
- [ ] Precise location collected
- [ ] Used for app functionality
- [ ] Shared with third parties (if analytics)
- [ ] User can request deletion

**Personal Info**:
- [ ] Name, email, phone number
- [ ] Used for account creation
- [ ] Optional deletion

**Photos and Videos**:
- [ ] User-generated content collected
- [ ] Shared publicly or with friends
- [ ] User can request deletion

**Files and Docs**:
- [ ] None (unless you add file sharing)

**App Activity**:
- [ ] App interactions, in-app search
- [ ] Used for analytics

**App Info and Performance**:
- [ ] Crash logs, diagnostics
- [ ] Optional, anonymized

**Device or Other IDs**:
- [ ] Device ID for analytics
- [ ] Optional

### 6. Technical Requirements
- [ ] **Minimum SDK**: API 21 (Android 5.0) or higher
- [ ] **Target SDK**: API 34 (Android 14) - required as of August 2024
- [ ] **64-bit Support**: Required (arm64-v8a, x86_64)
- [ ] **APK/AAB Size**: < 150MB (recommended)
- [ ] **Android App Bundle**: AAB format required (no APK)
- [ ] **Permissions**: Declare in manifest with clear usage
- [ ] **Foreground Services**: Declare type (location, camera)
- [ ] **Background Location**: Requires additional approval

### 7. Permissions & Declarations
- [ ] **ACCESS_FINE_LOCATION**: For venue discovery
- [ ] **ACCESS_COARSE_LOCATION**: Fallback
- [ ] **CAMERA**: For vibe videos
- [ ] **RECORD_AUDIO**: For video recording
- [ ] **READ_EXTERNAL_STORAGE**: For photo access (API < 33)
- [ ] **WRITE_EXTERNAL_STORAGE**: For saving videos (API < 29)
- [ ] **READ_MEDIA_IMAGES**: For photos (API 33+)
- [ ] **READ_MEDIA_VIDEO**: For videos (API 33+)
- [ ] **READ_CONTACTS**: For friend sync
- [ ] **INTERNET**: For API calls
- [ ] **ACCESS_NETWORK_STATE**: For offline detection
- [ ] **POST_NOTIFICATIONS**: For push notifications (API 33+)

### 8. Google Play Policies

**User Data**:
- [ ] Prominent disclosure before collection
- [ ] Secure transmission (HTTPS only)
- [ ] Data deletion upon request
- [ ] Clear privacy policy

**User-Generated Content**:
- [ ] Moderation system in place
- [ ] Report/block functionality
- [ ] Content filtering for illegal/harmful content
- [ ] Clear community guidelines

**Ads & Monetization**:
- [ ] Disclose if showing ads
- [ ] Age-appropriate ads only
- [ ] Clear distinction between ads and content

**Permissions**:
- [ ] Request at runtime (Android 6.0+)
- [ ] Clear explanation before request
- [ ] App must function without optional permissions

### 9. Pre-Launch Report
Google provides automated testing:
- [ ] Review security issues
- [ ] Review accessibility issues
- [ ] Review performance issues
- [ ] Fix all critical issues before launch

---

## Technical Requirements (Both Platforms)

### 1. Performance
- [ ] **App Size**: < 100MB uncompressed (optimize assets)
- [ ] **Launch Time**: < 3 seconds to usable screen
- [ ] **Crash-Free Rate**: > 99.5%
- [ ] **ANR Rate** (Android): < 0.5%
- [ ] **Network Efficiency**: Minimize data usage
- [ ] **Battery Efficiency**: Background tasks optimized

### 2. Security
- [ ] **HTTPS Only**: All API calls use TLS 1.2+
- [ ] **Certificate Pinning**: Recommended for sensitive data
- [ ] **Secure Storage**: Keychain (iOS) / Keystore (Android)
- [ ] **No Hardcoded Secrets**: API keys in environment variables
- [ ] **Input Validation**: Sanitize all user input
- [ ] **SQL Injection Prevention**: Use parameterized queries
- [ ] **XSS Prevention**: Escape user-generated content
- [ ] **Authentication**: Secure token storage and refresh

### 3. Accessibility
- [ ] **VoiceOver/TalkBack**: Screen reader support
- [ ] **Dynamic Type**: Text scales with user settings
- [ ] **Color Contrast**: WCAG AA compliant (4.5:1 ratio)
- [ ] **Tap Targets**: Minimum 44x44pt (iOS) / 48x48dp (Android)
- [ ] **Keyboard Navigation**: Support for external keyboards
- [ ] **Closed Captions**: For any videos with audio

### 4. Localization (if supporting multiple languages)
- [ ] **Strings Externalized**: No hardcoded text
- [ ] **Date/Time Formatting**: Locale-aware
- [ ] **Currency Formatting**: Locale-aware
- [ ] **RTL Support**: For Arabic, Hebrew, etc.
- [ ] **Translated Metadata**: Screenshots, descriptions

---

## Legal Requirements

### 1. Privacy Policy (Required)
Must include:
- [ ] What data you collect
- [ ] Why you collect it
- [ ] How you use it
- [ ] Who you share it with
- [ ] How long you retain it
- [ ] How users can delete their data
- [ ] Contact information for privacy questions
- [ ] GDPR compliance (if serving EU users)
- [ ] CCPA compliance (if serving California users)
- [ ] COPPA compliance (no users under 13)

**Template**: Use https://www.privacypolicygenerator.info/

### 2. Terms of Service (Recommended)
Must include:
- [ ] Acceptable use policy
- [ ] User conduct rules
- [ ] Intellectual property rights
- [ ] Limitation of liability
- [ ] Termination policy
- [ ] Dispute resolution
- [ ] Governing law
- [ ] Contact information

### 3. Age Restrictions
- [ ] **Minimum Age**: 17+ (iOS) / 18+ (Android) for alcohol content
- [ ] **Age Gate**: Verify user age on sign-up
- [ ] **Parental Consent**: Not applicable (17+)
- [ ] **COPPA Compliance**: Must not allow users under 13

### 4. Content Moderation
- [ ] **Community Guidelines**: Clear rules for behavior
- [ ] **Moderation System**: Review user-generated content
- [ ] **Report/Block**: Users can report inappropriate content
- [ ] **Appeals Process**: Users can contest moderation decisions

### 5. Compliance
- [ ] **GDPR** (EU): Right to access, delete, portability
- [ ] **CCPA** (California): Do Not Sell disclosure
- [ ] **SOC 2** (if handling sensitive data): Audit compliance
- [ ] **PCI DSS** (if handling payments): Compliance required

---

## Privacy & Data Requirements

### 1. Data Collection Transparency
- [ ] **In-App Disclosure**: Before collecting any data
- [ ] **Privacy Policy Link**: Easily accessible in app
- [ ] **Data Usage**: Clear explanation of why data is needed
- [ ] **Opt-In**: For location, contacts, notifications
- [ ] **Opt-Out**: Easy way to disable data collection

### 2. User Data Rights
- [ ] **Account Deletion**: Users can delete account in-app
- [ ] **Data Download**: Users can export their data (GDPR)
- [ ] **Data Portability**: Data in machine-readable format
- [ ] **Access Request**: Users can request data summary
- [ ] **Data Correction**: Users can update their information

### 3. Third-Party Services
Declare all third-party SDKs/APIs:
- [ ] **Analytics**: Google Analytics, Mixpanel, etc.
- [ ] **Crash Reporting**: Sentry, Firebase Crashlytics
- [ ] **Authentication**: Firebase Auth, Auth0
- [ ] **Push Notifications**: Firebase Cloud Messaging, OneSignal
- [ ] **Social Login**: Instagram, Google, Facebook
- [ ] **Payment Processing**: Stripe, Square, Toast
- [ ] **Cloud Storage**: AWS S3, Cloudinary
- [ ] **Maps**: Google Maps, Mapbox

### 4. Children's Privacy (COPPA)
- [ ] **No Children Under 13**: App must prevent sign-up
- [ ] **Age Verification**: Collect date of birth on sign-up
- [ ] **No Targeted Ads**: For users under 18
- [ ] **Parental Consent**: Not required (app is 17+)

---

## Content Requirements

### 1. User-Generated Content
- [ ] **Content Moderation**: Review flagged content within 24 hours
- [ ] **Illegal Content**: Zero tolerance for illegal content
- [ ] **Hate Speech**: Zero tolerance for discriminatory content
- [ ] **Violence/Gore**: Remove graphic violence
- [ ] **Sexual Content**: Remove explicit sexual content
- [ ] **Spam**: Remove spam and misleading content
- [ ] **Impersonation**: Verify authenticity

### 2. Intellectual Property
- [ ] **Music Licensing**: Users can't upload copyrighted music
- [ ] **Video Content**: Users must own rights to videos
- [ ] **Trademarks**: Don't use others' trademarks without permission
- [ ] **DMCA Compliance**: Respond to takedown notices

### 3. Safety Features
- [ ] **Block Users**: Users can block others
- [ ] **Report Content**: Easy reporting mechanism
- [ ] **Mute Users**: Users can mute without blocking
- [ ] **Privacy Settings**: Control who sees content
- [ ] **Location Privacy**: Option to hide exact location

---

## Testing Checklist

### 1. Functional Testing
- [ ] **All Features Work**: Test every button, screen, flow
- [ ] **Sign-Up Flow**: Complete new user registration
- [ ] **Login Flow**: Test with correct and incorrect credentials
- [ ] **Password Reset**: Test forgot password flow
- [ ] **Social Login**: Test Instagram, Google, etc.
- [ ] **Venue Discovery**: Test map, filters, search
- [ ] **Vibe Check**: Record and upload video
- [ ] **Friend Features**: Add friends, see locations
- [ ] **POS Integration**: Connect Toast/Square
- [ ] **Notifications**: Test push notifications
- [ ] **Deep Links**: Test links from emails, notifications
- [ ] **Offline Mode**: Test with no internet connection

### 2. Device Testing
- [ ] **iPhone 12/13/14/15**: All models
- [ ] **iPhone SE**: Small screen support
- [ ] **iPhone 15 Pro Max**: Large screen support
- [ ] **iPad**: If supporting tablets
- [ ] **Android Phones**: Samsung, Google Pixel, OnePlus
- [ ] **Android Tablets**: If supporting tablets
- [ ] **Different OS Versions**: iOS 14-17, Android 11-14

### 3. Network Testing
- [ ] **Wi-Fi**: Fast connection
- [ ] **4G/LTE**: Moderate connection
- [ ] **3G**: Slow connection
- [ ] **Airplane Mode**: Offline behavior
- [ ] **VPN**: Test with VPN enabled
- [ ] **Proxy**: Test with proxy server

### 4. Permission Testing
- [ ] **Location**: Allow/Deny/Allow Once
- [ ] **Camera**: Allow/Deny
- [ ] **Microphone**: Allow/Deny
- [ ] **Photos**: Allow/Deny/Limited (iOS 14+)
- [ ] **Contacts**: Allow/Deny
- [ ] **Notifications**: Allow/Deny

### 5. Edge Cases
- [ ] **No Friends**: App works with empty friend list
- [ ] **No Venues Nearby**: Clear message when no venues
- [ ] **No Internet**: Graceful offline handling
- [ ] **Expired Token**: Auto-refresh or clear logout
- [ ] **Server Error**: Clear error message
- [ ] **Low Storage**: Handle storage full error
- [ ] **Low Battery**: Reduce background activity

### 6. Performance Testing
- [ ] **Launch Time**: < 3 seconds
- [ ] **Memory Usage**: < 200MB typical
- [ ] **Battery Drain**: < 5% per hour foreground
- [ ] **Network Usage**: < 10MB per hour typical
- [ ] **Frame Rate**: 60fps animations
- [ ] **No Memory Leaks**: Test with Instruments

### 7. Security Testing
- [ ] **HTTPS Only**: No HTTP requests
- [ ] **Token Security**: Tokens stored securely
- [ ] **SQL Injection**: Input sanitization
- [ ] **XSS**: Output escaping
- [ ] **Man-in-the-Middle**: Certificate pinning
- [ ] **Jailbreak/Root Detection**: Optional security measure

---

## Submission Process

### iOS App Store

1. **Prepare Build**
   ```bash
   cd /Users/rayan/rork-nightlife-app
   eas build --platform ios --profile production
   ```

2. **Upload to App Store Connect**
   - Use Transporter app or `eas submit`
   - Upload .ipa file
   - Wait for processing (~15 minutes)

3. **Complete App Information**
   - Add screenshots, description, keywords
   - Set pricing (free)
   - Configure in-app purchases (if any)
   - Add privacy details
   - Set age rating

4. **Submit for Review**
   - Add release notes
   - Add demo account credentials
   - Add contact information
   - Submit

5. **Review Time**
   - Typically 24-48 hours
   - May request additional info

6. **Approval/Rejection**
   - If approved: Release immediately or schedule
   - If rejected: Address issues and resubmit

### Google Play Store

1. **Prepare Build**
   ```bash
   cd /Users/rayan/rork-nightlife-app
   eas build --platform android --profile production
   ```

2. **Create Release**
   - Sign in to Google Play Console
   - Create app
   - Upload .aab file
   - Set track (Internal → Alpha → Beta → Production)

3. **Complete Store Listing**
   - Add screenshots, description, graphics
   - Set category and tags
   - Add contact email
   - Add privacy policy URL

4. **Content Rating**
   - Complete IARC questionnaire
   - Receive rating (Teen or Mature 17+)

5. **Data Safety**
   - Declare all data collection
   - Add privacy policy

6. **Submit for Review**
   - Select countries
   - Set pricing
   - Submit

7. **Review Time**
   - Typically 7 days (can be longer)
   - Pre-launch report available

8. **Approval/Rejection**
   - If approved: Available in store
   - If rejected: Address policy violations

---

## Common Rejection Reasons

### iOS App Store

1. **Guideline 2.1 - App Completeness**
   - ❌ Broken links or buttons
   - ✅ Test all features thoroughly

2. **Guideline 2.3.1 - Hidden Features**
   - ❌ Features not disclosed in review notes
   - ✅ Provide demo account, explain all features

3. **Guideline 4.2 - Minimum Functionality**
   - ❌ App too simple or not useful
   - ✅ Ensure clear value proposition

4. **Guideline 5.1.1 - Data Collection and Storage**
   - ❌ Privacy policy missing or unclear
   - ✅ Add comprehensive privacy policy

5. **Guideline 5.1.2 - Data Use and Sharing**
   - ❌ Undeclared data collection
   - ✅ Declare all data in App Privacy section

### Google Play Store

1. **Deceptive Behavior**
   - ❌ Misleading app name or icon
   - ✅ Accurately represent app

2. **User-Generated Content**
   - ❌ No content moderation
   - ✅ Implement reporting and blocking

3. **Permissions**
   - ❌ Requesting unnecessary permissions
   - ✅ Only request needed permissions with clear explanation

4. **Target SDK**
   - ❌ Not targeting latest Android API
   - ✅ Update to API 34 (Android 14)

5. **Data Safety**
   - ❌ Incomplete data safety declarations
   - ✅ Declare all data collection accurately

---

## Final Pre-Submission Checklist

### iOS

- [ ] App builds without errors in Xcode
- [ ] All features tested on real device
- [ ] Privacy policy URL accessible
- [ ] Demo account credentials provided
- [ ] Screenshots show actual app (no mockups)
- [ ] Age rating set to 17+
- [ ] All permissions have purpose strings
- [ ] App doesn't crash on launch
- [ ] No placeholder content
- [ ] Contact info updated

### Android

- [ ] App builds as .aab (not .apk)
- [ ] Target SDK is 34 (Android 14)
- [ ] 64-bit support included
- [ ] Privacy policy URL accessible
- [ ] Data safety declarations complete
- [ ] Content rating questionnaire complete
- [ ] Screenshots show actual app
- [ ] App doesn't crash on launch
- [ ] All permissions declared in manifest
- [ ] Pre-launch report reviewed

---

## Post-Submission

### 1. Monitor Review Status
- Check App Store Connect / Play Console daily
- Respond to any reviewer questions within 24 hours
- Be ready to provide additional information

### 2. After Approval
- [ ] Test app in production
- [ ] Monitor crash reports
- [ ] Monitor user reviews
- [ ] Respond to negative reviews
- [ ] Prepare update pipeline

### 3. Ongoing Compliance
- [ ] Update privacy policy if features change
- [ ] Maintain content moderation
- [ ] Respond to DMCA takedowns
- [ ] Handle user data requests
- [ ] Update for new OS versions

---

## Resources

### Apple

- **App Store Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **App Store Connect**: https://appstoreconnect.apple.com/
- **Human Interface Guidelines**: https://developer.apple.com/design/human-interface-guidelines/
- **Privacy Requirements**: https://developer.apple.com/app-store/user-privacy-and-data-use/

### Google

- **Play Console**: https://play.google.com/console/
- **Developer Policies**: https://play.google.com/about/developer-content-policy/
- **Data Safety**: https://support.google.com/googleplay/android-developer/answer/10787469
- **Material Design**: https://material.io/design

### Privacy

- **GDPR Information**: https://gdpr.eu/
- **CCPA Information**: https://oag.ca.gov/privacy/ccpa
- **Privacy Policy Generator**: https://www.privacypolicygenerator.info/

### Testing

- **TestFlight** (iOS): https://developer.apple.com/testflight/
- **Internal Testing** (Android): Play Console → Testing → Internal testing
- **Firebase App Distribution**: https://firebase.google.com/products/app-distribution

---

**Last Updated**: February 2025
**App Version**: 1.0.0
**Platform Requirements**: iOS 14+ / Android 5.0+ (API 21+)
