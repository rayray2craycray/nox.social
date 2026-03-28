# Today's Launch Prep Checklist

**Date:** February 13, 2026
**Goal:** Unblock critical path items
**Time Required:** 2-3 hours

---

## ✅ What's Already Done

- ✅ App rebranded from Rork to Nox
- ✅ Legal documents created (privacy, terms)
- ✅ Legal docs deployed to Vercel
- ✅ All configuration files updated
- ✅ Changes pushed to GitHub

---

## 🚨 Critical Tasks for TODAY

### 1. Start Apple Developer Enrollment (30 minutes)

**Decision First:** Individual or Organization?

**Individual (FASTER - Recommended for March 15 launch):**
- ✅ No D-U-N-S needed
- ✅ Ready in 1-2 days
- ⚠️ Apps published under your personal name
- Can switch to organization later

**Organization:**
- ⏰ Requires D-U-N-S number (1-2 weeks!)
- ✅ Apps published under company name
- May not be ready by March 15

**Action:**
```
1. Go to: https://developer.apple.com/programs/enroll/
2. Sign in with your Apple ID
3. Choose account type
4. Fill out information
5. Pay $99 fee
6. DONE - Wait for verification
```

**Status:** [ ] Not Started [ ] In Progress [ ] Complete

---

### 2. Create Google Play Developer Account (15 minutes)

**Much simpler than Apple!**

**Action:**
```
1. Go to: https://play.google.com/console/signup
2. Sign in with Google account
3. Accept Developer Agreement
4. Pay $25 one-time fee
5. Complete profile:
   - Name: Nox Social
   - Email: support@nox.social
   - Website: https://nox.social
6. DONE - Instant access!
```

**Status:** [ ] Not Started [ ] In Progress [ ] Complete

---

### 3. Post App Icon Design Job (20 minutes)

**Platform:** Fiverr (recommended) or Upwork

**Action:**
```
1. Go to: https://www.fiverr.com/search/gigs?query=app%20icon%20design
2. Filter by: $50-200, 1-3 day delivery, 4.9+ rating
3. Find 3-5 designers you like
4. Message them with design brief (see below)
5. Choose best response
6. Place order
```

**Message Template:**
```
Hi! I need an app icon for "Nox" - a nightlife social app.

Style: Modern, bold, energetic (think Instagram meets nightlife)
Colors: Hot pink (#ff0080), Purple (#a855f7), Black
Concept: Minimal "N" lettermark or neon aesthetic

Deliverables:
- iOS: 1024px, 180px, 120px, 87px, 60px, 40px (PNG)
- Android: 512px, 192px, 144px, 96px, 72px, 48px (PNG)
- Source files (AI or Figma)

Timeline: 1-3 days
Budget: $[your budget]

Full brief: [Attach /app-store/ICON_DESIGN_BRIEF.md]

Can you deliver this? Please share app icon portfolio.
```

**Status:** [ ] Not Started [ ] In Progress [ ] Complete

---

### 4. Capture App Screenshots (1-2 hours)

**Quick Method (Clean Screenshots):**

```bash
# Step 1: Open iOS Simulator
open -a Simulator

# Step 2: Select device
# In Simulator menu: Device → iPhone 15 Pro Max

# Step 3: Start your app
cd /Users/rayan/rork-nightlife-app
npm start
# Press 'i' for iOS

# Step 4: Clean up
# - Remove test data
# - Use realistic content
# - Clear status bar notifications

# Step 5: Capture (Cmd+S for each screen)
```

**7 Screens to Capture:**
1. [ ] Discovery Map (showing venues with pins)
2. [ ] Live Feed (video scroll)
3. [ ] Challenges (showing rewards)
4. [ ] Venue Details (full info page)
5. [ ] Tickets (purchase screen or wallet)
6. [ ] Social/Friends (friends list or map)
7. [ ] Profile (your stats and achievements)

**Where Screenshots Save:** Desktop (Simulator Screen Shot...)

**Full Guide:** `/app-store/SCREENSHOT_ACTION_PLAN.md`

**Status:** [ ] Not Started [ ] In Progress [ ] Complete

---

## 🎯 Optional (If Time Permits)

### 5. Configure Custom Domain on Vercel (10 minutes)

**Action:**
```
1. Go to: https://vercel.com/rayan-taimurs-projects/nox-legal
2. Click "Settings" → "Domains"
3. Add domain: nox.social
4. Copy DNS records shown
5. Go to your domain registrar
6. Add A record: @ → 76.76.21.21
7. Add CNAME: www → cname.vercel-dns.com
8. Wait 5-60 minutes for propagation
```

**Result:** Legal docs at https://nox.social/privacy and /terms

**Status:** [ ] Not Started [ ] In Progress [ ] Complete

---

### 6. Organize Screenshots (15 minutes)

After capturing:

```bash
# Create organized folder
mkdir -p ~/Desktop/Nox-Screenshots/iPhone-6.7

# Move screenshots there
mv ~/Desktop/Simulator\ Screen\ Shot*.png ~/Desktop/Nox-Screenshots/iPhone-6.7/

# Rename to meaningful names
cd ~/Desktop/Nox-Screenshots/iPhone-6.7
mv [file1] 01-discovery-map.png
mv [file2] 02-live-feed.png
# ... etc
```

**Status:** [ ] Not Started [ ] In Progress [ ] Complete

---

## 📊 End of Day Success

By end of today, you should have:

- ✅ Apple Developer enrollment started ($99 paid)
- ✅ Google Play account created ($25 paid)
- ✅ App icon designer hired (order placed)
- ✅ 7 screenshots captured and organized

**Total Spend Today:** $124-324 (depending on icon designer)
**Total Time:** 2-3 hours

**What This Unblocks:**
- Designer can start working on icon (1-3 days)
- Apple can process your enrollment (1-2 days individual, 1-2 weeks organization)
- Google account ready immediately
- Screenshots ready for store listings

---

## 🚀 Tomorrow's Tasks

Once today's tasks are complete:

**If chose Individual enrollment:**
- Wait for Apple verification call/email (24-48 hours)
- Answer any verification questions

**If chose Organization enrollment:**
- Check email for D-U-N-S updates
- May need to provide additional documentation

**For everyone:**
- Check Fiverr messages from designers
- Review icon design drafts (if designer is fast!)
- Start planning store listing setup

---

## ❓ Questions & Decisions

**Before starting, decide:**

1. **Apple Developer Account Type?**
   - [ ] Individual (faster, personal name)
   - [ ] Organization (slower, company name)

2. **App Icon Budget?**
   - [ ] $50-75 (basic)
   - [ ] $100-150 (mid-range)
   - [ ] $200+ (premium)

3. **Screenshots Style?**
   - [ ] Clean (just app screens, 2 hours)
   - [ ] With text overlays (marketing style, 1-2 days)
   - [ ] Hire designer (2-3 days, $100-200)

---

## 💡 Tips

**Apple Developer:**
- Have credit card ready
- Enable 2FA on Apple ID before starting
- Keep phone nearby (may call for verification)
- If stuck, call: 1-800-633-2152

**Google Play:**
- Very straightforward process
- Account active immediately after payment
- No verification calls needed

**App Icon:**
- Look at designer's portfolio first
- Check recent reviews
- Ask for 1 revision round included
- Provide feedback quickly when they send drafts

**Screenshots:**
- Use realistic data, not "Lorem ipsum"
- Make sure status bar is clean
- Capture in good lighting/time of day
- Can retake later if needed

---

## 📞 Need Help?

**Apple Developer Support:** 1-800-633-2152 (Mon-Fri 9am-5pm PST)
**Google Play Support:** https://support.google.com/googleplay/android-developer
**Fiverr Support:** https://www.fiverr.com/support (24/7 chat)

---

**Ready? Let's start with Task #1: Apple Developer Enrollment!**

**URL:** https://developer.apple.com/programs/enroll/
