# App Store Screenshots Guide for Nox

**Date:** February 13, 2026
**Priority:** 🔴 CRITICAL - Required for App Store submission
**Timeline:** 2-3 days
**Budget:** $0 (DIY) or $50-200 (designer)

---

## Required Screenshot Sizes

### Apple App Store (3-10 screenshots per size)

| Device | Size (pixels) | Required? | Quantity |
|--------|---------------|-----------|----------|
| 6.7" iPhone (Pro Max) | 1290 x 2796 | ✅ REQUIRED | 4-8 screenshots |
| 6.5" iPhone (Plus) | 1284 x 2778 | ✅ REQUIRED | 4-8 screenshots |
| 5.5" iPhone | 1242 x 2208 | ✅ REQUIRED | 4-8 screenshots |
| 12.9" iPad Pro | 2048 x 2732 | Optional | 3-5 screenshots |

**Note:** You must provide at least ONE set. Providing all 3 iPhone sizes ensures your app looks good on all devices.

### Google Play Store (2-8 screenshots)

| Device | Size (pixels) | Required? | Quantity |
|--------|---------------|-----------|----------|
| Phone | 1080 x 1920 (min) | ✅ REQUIRED | 4-8 screenshots |
| 7" Tablet | 1200 x 1920 | Optional | 3-5 screenshots |
| 10" Tablet | 1920 x 1200 | Optional | 3-5 screenshots |

---

## Screenshot Strategy

### Option 1: Clean In-App Screenshots (Fast, Free)
**Best for:** MVP, testing, quick launch
**Time:** 1-2 hours
**Cost:** Free
**Quality:** ⭐⭐⭐ (Good)

**Process:**
1. Capture raw screenshots from app
2. Minimal editing (crop, adjust brightness)
3. No text overlays or marketing copy
4. **Pros:** Fast, authentic, shows real UI
5. **Cons:** Less polished, harder to convey features

### Option 2: Marketing Screenshots with Text Overlays (Recommended)
**Best for:** Professional launch, better conversion
**Time:** 1-2 days
**Cost:** $0-50 (DIY with Canva/Figma)
**Quality:** ⭐⭐⭐⭐ (Great)

**Process:**
1. Capture clean screenshots
2. Add text overlays explaining features
3. Add device frames (iPhone/Android mockups)
4. Consistent design across all screenshots
5. **Pros:** Professional, explains features clearly, higher conversion
6. **Cons:** More time-consuming

### Option 3: Custom Designed Screenshots (Premium)
**Best for:** High-budget launch, maximum impact
**Time:** 3-5 days
**Cost:** $200-500 (hire designer)
**Quality:** ⭐⭐⭐⭐⭐ (Excellent)

**Process:**
1. Hire designer with App Store experience
2. Provide app screenshots + brand guidelines
3. Designer creates marketing materials
4. **Pros:** Highest quality, best conversion rates
5. **Cons:** Expensive, time-consuming

---

## Which Screens to Capture

### Must-Have Screens (Priority Order)

**Screenshot 1: Discovery Map (Hero Shot)**
- Map view with nearby venues
- Venue pins with vibe indicators
- Shows core value proposition: "Find nightlife"
- **Text Overlay:** "Discover Nightlife in Real-Time"
- **Why first:** Most important feature, visually impressive

**Screenshot 2: Live Feed**
- Vertical video feed with venue highlights
- Shows social/content aspect
- User engagement (likes, comments)
- **Text Overlay:** "Watch Live Highlights"
- **Why:** Shows app is active, social, engaging

**Screenshot 3: Challenges**
- Challenge cards with progress bars
- Rewards and milestones
- **Text Overlay:** "Earn Rewards at Your Favorite Venues"
- **Why:** Unique feature, gamification angle

**Screenshot 4: Venue Details**
- Venue profile with live vibe check
- Event listings
- Photos/videos carousel
- **Text Overlay:** "Know Before You Go"
- **Why:** Shows depth of information

**Screenshot 5: Tickets**
- Event ticketing with QR code
- Purchase flow or ticket wallet
- **Text Overlay:** "Buy Tickets, Skip the Line"
- **Why:** Shows transaction capability

**Screenshot 6: Social/Friends**
- Friends map or crew view
- Shows where friends are
- **Text Overlay:** "Connect with Your Crew"
- **Why:** Social aspect, FOMO driver

**Screenshot 7: Profile/Rewards**
- User profile with badges, streaks
- Accumulated rewards
- **Text Overlay:** "Track Your Nightlife Journey"
- **Why:** Shows progression, retention

### Optional Screens (If space allows)
- Onboarding flow (for clarity)
- Group ticket purchase
- Memory timeline
- Crew creation
- Chat/messaging

---

## How to Capture Screenshots

### Method 1: Use Simulator/Emulator (Recommended)

**iOS (Xcode Simulator):**
```bash
# 1. Open Xcode Simulator
open -a Simulator

# 2. Select device (iPhone 15 Pro Max for 6.7")
# Hardware → Device → iPhone 15 Pro Max

# 3. Run your app
npx expo start
# Press 'i' to open in iOS simulator

# 4. Navigate to desired screen

# 5. Capture screenshot
# Cmd + S (saves to Desktop)
# Or: Edit → Copy Screen
```

**Android (Android Studio Emulator):**
```bash
# 1. Open Android Emulator
emulator -avd Pixel_7_Pro_API_34

# 2. Run your app
npx expo start
# Press 'a' to open in Android emulator

# 3. Navigate to desired screen

# 4. Capture screenshot
# Click camera icon in emulator toolbar
# Or: Cmd/Ctrl + S
```

### Method 2: Use Real Device (Best Quality)

**iOS Device:**
```
1. Connect iPhone to Mac
2. Open Xcode → Window → Devices and Simulators
3. Select your device
4. Click "Take Screenshot" button
5. Or on device: Power + Volume Up
```

**Android Device:**
```
1. Enable Developer Mode
2. Settings → About Phone → Tap "Build Number" 7 times
3. Settings → Developer Options → USB Debugging ON
4. Connect to computer
5. Use Android Studio Device File Explorer
6. Or on device: Power + Volume Down
```

### Method 3: Use App Mockup Tools

**Screely:** https://www.screely.com
- Free, adds gradient backgrounds
- Upload screenshot → Download with frame

**Mockuphone:** https://mockuphone.com
- Free device frames
- Upload screenshot → Select device → Download

**Previewed:** https://previewed.app
- Free and premium templates
- Device mockups with scenes

---

## Screenshot Editing Workflow

### DIY with Figma (Free)

**Step 1: Create Figma File**
```
1. Sign up at figma.com (free)
2. Create new file: "Nox App Screenshots"
3. Create frames for each device size:
   - iPhone 6.7": 1290 x 2796
   - iPhone 6.5": 1284 x 2778
   - Android: 1080 x 1920
```

**Step 2: Import Screenshots**
```
1. Drag and drop screenshots into Figma
2. Resize to fit frame
3. Ensure screenshots are sharp (not blurry)
```

**Step 3: Add Device Frames**
```
1. Search Figma Community: "iPhone mockup"
2. Duplicate template to your file
3. Place your screenshot inside device frame
```

**Step 4: Add Text Overlays**
```
1. Add text above or below screenshot
2. Font: San Francisco (iOS), Roboto (Android), or Inter/Poppins
3. Font size: 48-72px for headline
4. Font size: 24-36px for subtext
5. Colors: White text on dark gradient background
6. Or: Dark text on light/colorful background
```

**Step 5: Add Brand Elements**
```
1. Add gradient background (#ff0080 to #a855f7)
2. Add logo in corner (small, subtle)
3. Add decorative elements (stars, sparkles for nightlife theme)
```

**Step 6: Export**
```
1. Select frame
2. Export settings:
   - Format: PNG
   - Scale: 1x (exact pixels)
   - Quality: Best
3. Export all frames
```

### DIY with Canva (Easier, Free)

```
1. Sign up at canva.com (free)
2. Search templates: "app store screenshots"
3. Customize template with your screenshots
4. Change colors to match brand (#ff0080, #a855f7)
5. Update text with your features
6. Download as PNG (1290x2796, 1284x2778, etc.)
```

---

## Text Overlay Best Practices

### Do's ✅
- **Keep it short** - 3-8 words max
- **Benefit-focused** - "Earn Rewards" not "Rewards Feature"
- **Action-oriented** - Use verbs ("Discover", "Connect", "Earn")
- **High contrast** - White on dark, or dark on light
- **Readable font** - Sans-serif, 48px+ size
- **Consistent style** - Same font/colors across all screenshots

### Don'ts ❌
- **Don't overcrowd** - Too much text distracts
- **Don't use jargon** - Speak plainly
- **Don't make promises** - Only show real features
- **Don't use all caps** - Looks spammy (except headings)
- **Don't block UI** - Text should enhance, not hide the app

### Example Text Overlays

**Screenshot 1 (Map):**
- Headline: "Discover Nightlife in Real-Time"
- Subtext: "See live vibes, crowds, and wait times"

**Screenshot 2 (Feed):**
- Headline: "Watch What's Happening Right Now"
- Subtext: "Real videos from real venues"

**Screenshot 3 (Challenges):**
- Headline: "Earn Rewards at Your Favorite Spots"
- Subtext: "Free drinks, skip lines, VIP access"

**Screenshot 4 (Venue):**
- Headline: "Know Before You Go"
- Subtext: "See events, photos, and live updates"

**Screenshot 5 (Tickets):**
- Headline: "Buy Tickets in Seconds"
- Subtext: "Instant QR codes, easy transfers"

**Screenshot 6 (Social):**
- Headline: "Find Your Friends"
- Subtext: "See where your crew is in real-time"

**Screenshot 7 (Profile):**
- Headline: "Track Your Nightlife Journey"
- Subtext: "Badges, streaks, and memories"

---

## Screenshot Order Strategy

### Strategy 1: Feature-Led (Recommended)
**Best for:** Apps with unique features

```
1. Discovery Map (core feature)
2. Live Feed (engagement)
3. Challenges/Rewards (differentiation)
4. Venue Details (depth)
5. Tickets (transaction)
6. Social (FOMO)
7. Profile (retention)
```

### Strategy 2: Problem-Solution
**Best for:** Apps solving a clear pain point

```
1. Problem statement (before using app)
2. Discovery Map (solution)
3. Live Feed (how it works)
4. Challenges (added value)
5. Social proof (testimonials or stats)
6. Call to action
```

### Strategy 3: User Journey
**Best for:** Apps with clear user flow

```
1. Onboarding welcome
2. Browse venues (map)
3. Find an event (details)
4. Buy ticket (purchase)
5. Check in (QR code)
6. Share moment (feed post)
7. Earn reward (challenge complete)
```

---

## Tools & Resources

### Screenshot Capture
- **iOS Simulator:** Built into Xcode (Mac only)
- **Android Emulator:** Built into Android Studio
- **BrowserStack:** https://browserstack.com (test on real devices remotely)

### Design & Editing
- **Figma:** https://figma.com (free, professional)
- **Canva:** https://canva.com (free, easier)
- **Sketch:** https://sketch.com (Mac, $99)
- **Photoshop:** Adobe Creative Cloud ($20/month)

### Device Frames/Mockups
- **Screely:** https://screely.com (free)
- **Mockuphone:** https://mockuphone.com (free)
- **Previewed:** https://previewed.app (freemium)
- **Rotato:** https://rotato.app (Mac, $49, 3D mockups)

### Templates
- **Figma Community:** Search "app store screenshots template"
- **Canva Templates:** Search "app screenshots"
- **Envato Elements:** https://elements.envato.com ($16/month, thousands of templates)

---

## File Naming Convention

```
rork-ios-6.7-01-discovery.png
rork-ios-6.7-02-feed.png
rork-ios-6.7-03-challenges.png
rork-ios-6.7-04-venue.png
rork-ios-6.7-05-tickets.png

rork-ios-6.5-01-discovery.png
rork-ios-6.5-02-feed.png
...

rork-android-phone-01-discovery.png
rork-android-phone-02-feed.png
...
```

---

## Quality Checklist

Before submitting, verify:

### Technical
- [ ] Correct dimensions (exact pixels)
- [ ] PNG format
- [ ] RGB color mode (not CMYK)
- [ ] No compression artifacts
- [ ] Sharp, not blurry

### Content
- [ ] Shows real app UI (not mockups/prototypes)
- [ ] No placeholder content (Lorem Ipsum)
- [ ] No test data visible
- [ ] No debug overlays or developer tools
- [ ] Status bar clean (full signal, battery)

### Design
- [ ] Consistent style across all screenshots
- [ ] Text is readable at thumbnail size
- [ ] High contrast for visibility
- [ ] Brand colors used correctly
- [ ] No spelling/grammar errors

### Compliance
- [ ] No prices (unless accurate)
- [ ] No competitor mentions
- [ ] No false claims
- [ ] Age-appropriate content
- [ ] No copyrighted content without permission

---

## Common Mistakes to Avoid

1. **Wrong dimensions** - App Store rejects incorrect sizes
2. **Blurry screenshots** - Use high-res originals
3. **Too much text** - Violates App Store guidelines (max 40% of image)
4. **Inconsistent design** - Looks unprofessional
5. **Fake UI** - Must show actual app, not mockups
6. **Outdated screenshots** - Update with each major version
7. **Poor cropping** - Cut off important UI elements
8. **Wrong device frames** - Don't use Samsung frame for iOS, vice versa

---

## Timeline

**Day 1: Capture Raw Screenshots (2-3 hours)**
- Set up simulator/emulator
- Navigate to each screen
- Capture 8-10 different screens
- Review for quality

**Day 2: Design & Edit (3-5 hours)**
- Choose design style
- Add device frames
- Add text overlays
- Ensure consistency
- Export all sizes

**Day 3: Review & Finalize (1-2 hours)**
- Get feedback from team
- Make revisions
- Export final versions
- Organize files for upload

**Total: 6-10 hours over 2-3 days**

---

## Hiring a Designer (Alternative)

If you don't have design skills:

**Where to Hire:**
- Fiverr: $30-100 for screenshot design
- Upwork: $50-200 for professional package
- 99designs: $200-500 for premium quality

**What to Provide:**
- Raw screenshots (captured from your app)
- Brand colors (#ff0080, #a855f7)
- Text for each screenshot (headlines + subtext)
- Example screenshots you like (from other apps)
- Device sizes needed

**Deliverables:**
- All required sizes (iOS + Android)
- Editable source files (Figma/PSD)
- Export-ready PNG files

---

## Testing Your Screenshots

**Before submission:**

1. **View at thumbnail size** (App Store search results)
2. **Test on actual device** (how does it look in store?)
3. **Get feedback:**
   - Ask friends: "What does this app do?" (from screenshots alone)
   - Post in design communities
   - A/B test after launch
4. **Check competitors** - How do yours compare?

---

## After Launch: Optimization

**Week 2-4 after launch:**

1. **Monitor conversion rate** (store impressions → installs)
2. **A/B test variations:**
   - Different screenshot order
   - Different text overlays
   - With/without device frames
3. **Use App Store Optimization:**
   - Apple: "Product Page Optimization" in App Store Connect
   - Google: "Store Listing Experiments" in Play Console

---

## Next Steps

**This Week:**
1. ✅ Review this guide
2. ⏳ Choose Option 1, 2, or 3 (DIY, Enhanced, or Hire)
3. ⏳ Capture raw screenshots (1-2 hours)
4. ⏳ Edit/design screenshots (3-5 hours or hire designer)
5. ⏳ Review and finalize
6. ⏳ Export all required sizes
7. ⏳ Ready for App Store submission!

**Timeline:** 2-3 days
**Cost:** $0-200
**Priority:** 🔴 BLOCKING - Cannot submit without screenshots

---

**Questions? Email support@nox.social**

**Your screenshots are your first impression - make them count! 📸**
