# Launch Prep Action Plan - Nox Social

**Created:** February 13, 2026
**Target Launch:** March 15, 2026
**Days Remaining:** 30 days
**Status:** Legal docs deployed ✅ - Ready for next phase

---

## 🎯 Critical Path (What's Blocking Launch)

### **BLOCKER 1: Developer Accounts** ⏰ **START TODAY**
**Why Critical:** Apple takes 1-2 weeks for D-U-N-S number approval
**Without This:** Cannot submit apps to App Store or Google Play

**Action Items:**
1. ✅ Legal docs deployed (nox.social)
2. ⏳ **Start Apple D-U-N-S request** (TAKES 1-2 WEEKS!)
3. ⏳ Create Google Play account ($25, instant)

**Timeline:** Start today, complete in 1-2 weeks

---

### **BLOCKER 2: App Icon** 🎨
**Why Critical:** Required for both App Store and Google Play submission
**Without This:** Cannot complete app listing or submit builds

**Action Items:**
1. ⏳ Post designer job on Fiverr/Upwork
2. ⏳ Provide design brief (already created)
3. ⏳ Review and approve design
4. ⏳ Export all required sizes

**Timeline:** 1-3 days (budget: $50-200)

---

### **BLOCKER 3: Screenshots** 📸
**Why Critical:** Required for both stores (minimum 3 for iOS, 2 for Android)
**Without This:** Cannot complete app listing

**Action Items:**
1. ⏳ Capture 7 key screens on simulator
2. ⏳ Clean up status bars and content
3. ⏳ Export all required sizes
4. Optional: Add text overlays

**Timeline:** 2 hours to 2 days

---

## 📅 Week-by-Week Plan

### **Week 1 (Feb 13-19): Developer Accounts + Design**

#### Day 1-2 (TODAY - Feb 13-14):
- [ ] **Apple Developer Enrollment**
  - Go to: https://developer.apple.com/programs/enroll/
  - Decide: Individual or Organization?
  - If Organization: Request D-U-N-S number (TAKES 1-2 WEEKS)
  - If Individual: Complete enrollment immediately
  - Pay $99 fee

- [ ] **Google Play Account**
  - Go to: https://play.google.com/console/signup
  - Pay $25 one-time fee
  - Complete developer profile
  - ✅ Ready same day!

- [ ] **Hire App Icon Designer**
  - Post job on Fiverr: https://www.fiverr.com/categories/graphics-design/creative-logo-design
  - Use brief: `/app-store/ICON_DESIGN_BRIEF.md`
  - Budget: $50-200
  - Delivery: 1-3 days

#### Day 3-7 (Feb 15-19):
- [ ] **Wait for D-U-N-S** (if organization)
- [ ] **Capture Screenshots**
  - Follow guide: `/app-store/SCREENSHOT_ACTION_PLAN.md`
  - Capture on simulator (2 hours)
  - Export all sizes

- [ ] **Configure Custom Domain**
  - Add nox.social to Vercel dashboard
  - Configure DNS in domain registrar
  - Wait for propagation (5-60 minutes)

- [ ] **Review App Icon Drafts**
  - Provide feedback to designer
  - Request revisions if needed
  - Approve final design

---

### **Week 2 (Feb 20-26): App Store Setup**

- [ ] **Apple Developer Account Active**
  - Access App Store Connect
  - Sign all required agreements
  - Set up banking/tax info (if selling IAP)

- [ ] **Receive Final App Icon**
  - Verify all sizes exported correctly
  - Test on device (looks good at small size?)
  - Add to project

- [ ] **Create App Store Connect Record**
  - Name: Nox
  - Bundle ID: social.nox
  - Category: Social Networking
  - Age Rating: 17+

- [ ] **Create Google Play App**
  - Name: Nox
  - Package: social.nox
  - Category: Social
  - Content Rating: Mature 17+

- [ ] **Complete Store Listings**
  - Upload screenshots
  - Upload app icon
  - Add descriptions (already written)
  - Add privacy policy URL: https://nox.social/privacy

---

### **Week 3 (Feb 27 - Mar 5): Build & Test**

- [ ] **Generate Production Builds**
  ```bash
  # iOS
  eas build --platform ios --profile production

  # Android
  eas build --platform android --profile production
  ```

- [ ] **Test Builds on Physical Devices**
  - iPhone (iOS 16+)
  - Android phone (Android 12+)
  - All core features work
  - No crashes

- [ ] **Create Demo Account for Reviewers**
  - Email: reviewer@nox.social
  - Password: ReviewAccess2026!
  - Profile completed with data
  - Works in all major cities

- [ ] **Final Checklist Review**
  - Go through: `/app-store/FINAL_PRE_SUBMISSION_CHECKLIST.md`
  - Check all boxes
  - Fix any issues found

---

### **Week 4 (Mar 6-12): Submit & Launch**

- [ ] **Upload iOS Build to App Store Connect**
  - Via Transporter or `eas submit`
  - Wait for processing
  - Add build to version

- [ ] **Upload Android AAB to Google Play**
  - Via Play Console or `eas submit`
  - Complete release form

- [ ] **Submit for Review**
  - Apple: Submit for review
  - Google: Submit for review
  - Monitor email for questions

- [ ] **Review Period** (Mar 6-12)
  - Apple: 1-3 days typical
  - Google: 1-7 days typical
  - Respond immediately to any questions

- [ ] **Launch Day** (Mar 13-15)
  - Apps approved and live!
  - Post launch announcement
  - Share on social media
  - Monitor for crashes/issues

---

## 🚨 Critical Actions to Take TODAY

### 1. **Start Apple Developer Enrollment** (1-2 weeks lead time)

**If you have an LLC/company:**
```
1. Go to: https://developer.apple.com/enroll/duns-lookup/
2. Search for your company
3. If found: Copy D-U-N-S number
4. If not found: Request new D-U-N-S (takes 1-2 weeks)
5. Once you have D-U-N-S: Complete enrollment
6. Pay $99 fee
```

**If enrolling as individual (FASTER):**
```
1. Go to: https://developer.apple.com/programs/enroll/
2. Sign in with Apple ID
3. Choose "Individual"
4. Fill out personal info
5. Pay $99 fee
6. Wait 24-48 hours for verification
```

**Recommendation:** If you want to launch by March 15 and don't have D-U-N-S yet, enroll as Individual first. You can switch to Organization later.

---

### 2. **Create Google Play Account** (15 minutes)

```
1. Go to: https://play.google.com/console/signup
2. Sign in with Google account
3. Accept Developer Agreement
4. Pay $25 one-time fee
5. Complete developer profile:
   - Developer name: Nox Social
   - Email: support@nox.social
   - Website: https://nox.social
6. ✅ Done! Ready to create app immediately
```

---

### 3. **Hire App Icon Designer** (Post today, get results in 1-3 days)

**Option A: Fiverr (Recommended)**

Go to: https://www.fiverr.com/search/gigs?query=app%20icon%20design

**Filter by:**
- Price: $50-200
- Delivery: 1-3 days
- Rating: 4.9+ stars

**Message to send:**
```
Hi! I need an app icon for my nightlife social app "Nox".

Design Brief:
- App Name: Nox
- Industry: Nightlife / Social Networking
- Target Audience: Young adults 21-35
- Style: Modern, bold, energetic
- Colors: Hot pink (#ff0080), Purple (#a855f7), Black
- Concept: Minimal "N" lettermark or neon light aesthetic

Deliverables:
- iOS sizes: 1024px, 180px, 120px, 87px, 60px, 40px (PNG, no transparency on 1024px)
- Android sizes: 512px, 192px, 144px, 96px, 72px, 48px (PNG)
- Source files (AI/Figma)

Timeline: 1-3 days
Budget: $[your budget]

Full design brief attached: [Upload ICON_DESIGN_BRIEF.md]

Can you deliver this? Please share your portfolio of app icons.
```

**Option B: Upwork**

Similar process, post as a fixed-price job.

---

### 4. **Capture Screenshots** (Can do today in 2 hours)

**Quick Start:**
```bash
# 1. Open iOS Simulator
open -a Simulator

# 2. Select: iPhone 15 Pro Max (6.7")

# 3. Launch your app
cd /Users/rayan/rork-nightlife-app
npm start
# Press 'i' for iOS

# 4. Navigate to each screen and press: Cmd+S (saves to Desktop)

# Required screens (7):
- Discovery Map with venues
- Live video feed
- Challenges with rewards
- Venue details page
- Ticket purchase screen
- Social/Friends screen
- User profile
```

**Full guide:** `/app-store/SCREENSHOT_ACTION_PLAN.md`

---

## 📊 Progress Tracker

**What's Done:**
- ✅ App rebranded to Nox
- ✅ Legal docs created (privacy, terms)
- ✅ Legal docs deployed to Vercel
- ✅ Design brief for app icon created
- ✅ Screenshot guide created
- ✅ Store listing copy written
- ✅ Developer account setup guide created
- ✅ All configuration files updated

**What's Blocking:**
- ⏰ Developer accounts (need to pay fees and enroll)
- 🎨 App icon (need to hire designer)
- 📸 Screenshots (need to capture on simulator)

**Once Unblocked:**
- Can generate production builds
- Can complete store listings
- Can submit for review
- Can launch by March 15!

---

## 💰 Budget Summary

| Item | Cost | Timeline |
|------|------|----------|
| Apple Developer | $99/year | 1-2 weeks (D-U-N-S) or 1-2 days (Individual) |
| Google Play | $25 one-time | Instant |
| App Icon | $50-200 | 1-3 days |
| Screenshots | $0 (DIY) | 2 hours |
| **TOTAL** | **$174-324** | **1-2 weeks** |

---

## 🎯 Success Criteria

**By End of Week 1:**
- ✅ Developer accounts enrolled (both)
- ✅ App icon designer hired
- ✅ Screenshots captured

**By End of Week 2:**
- ✅ Developer accounts active
- ✅ App icon received and approved
- ✅ Store listings created

**By End of Week 3:**
- ✅ Production builds generated
- ✅ Builds tested on devices
- ✅ Final checklist complete

**By End of Week 4:**
- ✅ Apps submitted to both stores
- ✅ Apps approved
- ✅ Launch day! 🚀

---

## 📞 Support Resources

**Apple Developer Support:**
- Phone: 1-800-633-2152
- Hours: Mon-Fri 9am-5pm PST
- For: D-U-N-S expedite, verification issues

**Google Play Support:**
- Help: https://support.google.com/googleplay/android-developer
- Form: In Play Console
- Response: 24-72 hours

**Fiverr Support:**
- Chat: https://www.fiverr.com/support
- 24/7 available

---

## 🚀 Next Actions (In Order)

1. **RIGHT NOW:** Start Apple Developer enrollment
2. **RIGHT NOW:** Create Google Play account ($25)
3. **TODAY:** Post app icon design job on Fiverr
4. **TODAY:** Capture app screenshots on simulator
5. **THIS WEEK:** Wait for D-U-N-S approval (if organization)
6. **THIS WEEK:** Review and approve app icon
7. **NEXT WEEK:** Complete store listings
8. **NEXT WEEK:** Generate production builds
9. **WEEK 3:** Test builds and submit for review
10. **WEEK 4:** Launch! 🎉

---

**Status:** Ready to start developer accounts and design work NOW

**Bottleneck:** Apple D-U-N-S (1-2 weeks) - START TODAY!

**Target:** March 15, 2026 launch - **30 days away**
