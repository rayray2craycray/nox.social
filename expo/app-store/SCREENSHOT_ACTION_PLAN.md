# Screenshot Capture - Step-by-Step Action Plan

**Priority:** 🔴 CRITICAL - Cannot submit to App Store without screenshots
**Timeline:** 2-3 days (1 day capture, 1-2 days editing)
**Cost:** $0-50 (DIY) or $100-200 (hire designer)

---

## Quick Decision: Which Option?

### Option 1: Clean Screenshots (Fastest - 2 hours)
**Best for:** Quick launch, testing market
**Process:** Raw screenshots → minimal editing → submit
**Cost:** Free
**Go to:** [Section A](#section-a-clean-screenshots)

### Option 2: Marketing Screenshots (Recommended - 1-2 days)
**Best for:** Professional launch, better conversion
**Process:** Raw screenshots → text overlays → device frames → submit
**Cost:** $0-50 (DIY with Canva/Figma)
**Go to:** [Section B](#section-b-marketing-screenshots)

### Option 3: Hire Designer (Premium - 2-4 days)
**Best for:** Maximum impact, no design skills
**Process:** Send screenshots to designer → receive polished versions
**Cost:** $100-200
**Go to:** [Section C](#section-c-hire-designer)

---

## Section A: Clean Screenshots (DIY - 2 Hours)

### Step 1: Setup Simulator (10 minutes)

```bash
# Open Xcode Simulator
open -a Simulator

# Select device: iPhone 15 Pro Max (6.7")
# Hardware → Device → iPhone → iPhone 15 Pro Max

# Or use command:
xcrun simctl boot "iPhone 15 Pro Max"
```

### Step 2: Start Your App (5 minutes)

```bash
cd /Users/rayan/rork-nightlife-app
npm start
# Press 'i' to open in iOS simulator
# Wait for app to load
```

### Step 3: Prepare App for Screenshots (10 minutes)

**Set up realistic data:**
- Log in with demo account
- Ensure profile picture is uploaded
- Check that venues are showing on map
- Make sure feed has videos
- Verify challenges are active

**Clean up UI:**
- Close any debug overlays
- Dismiss any error messages
- Set status bar to show full battery, signal

### Step 4: Capture Required Screens (30 minutes)

Navigate to each screen and press **Cmd + S** to save screenshot:

**Screenshot 1: Discovery Map**
- [ ] Open Discovery tab
- [ ] Zoom to show 5-8 venue pins
- [ ] Ensure your location dot is visible
- [ ] **Cmd + S** → Saves to Desktop as `Simulator Screen Shot...`

**Screenshot 2: Live Feed**
- [ ] Open Feed tab
- [ ] Scroll to show 1-2 full video cards
- [ ] Ensure videos have thumbnails
- [ ] **Cmd + S**

**Screenshot 3: Challenges**
- [ ] Open Profile or Challenges section
- [ ] Show 2-3 challenge cards with progress
- [ ] **Cmd + S**

**Screenshot 4: Venue Details**
- [ ] Tap on a venue from map
- [ ] Show venue name, photos, vibe indicator
- [ ] Scroll to show events if available
- [ ] **Cmd + S**

**Screenshot 5: Tickets**
- [ ] Navigate to an event with tickets
- [ ] Or show ticket wallet with QR code
- [ ] **Cmd + S**

**Screenshot 6: Social/Friends**
- [ ] Show friends list or crew view
- [ ] Or show map with friend locations
- [ ] **Cmd + S**

**Screenshot 7: Profile**
- [ ] Open your profile
- [ ] Show badges, streaks, rewards
- [ ] **Cmd + S**

### Step 5: Rename Files (5 minutes)

Screenshots are saved with long names. Rename them:

```bash
cd ~/Desktop
mv "Simulator Screen Shot - iPhone 15 Pro Max - 2026-02-14 at 10.30.45.png" "01-discovery.png"
mv "Simulator Screen Shot - iPhone 15 Pro Max - 2026-02-14 at 10.31.12.png" "02-feed.png"
mv "Simulator Screen Shot - iPhone 15 Pro Max - 2026-02-14 at 10.31.45.png" "03-challenges.png"
# ... continue for all screenshots
```

### Step 6: Quick Edit (30 minutes)

Optional light editing:
- Crop to remove simulator chrome if needed
- Adjust brightness/contrast slightly
- Remove any sensitive info (if testing with real data)

**Tools:**
- macOS Preview (built-in, free)
- Photoshop (if you have it)
- Pixelmator ($40, Mac App Store)

### Step 7: Export for Other iPhone Sizes (30 minutes)

**You need 3 iPhone sizes:**
- 6.7" (iPhone 15 Pro Max): 1290 x 2796 ✅ Already have
- 6.5" (iPhone 14 Plus): 1284 x 2778
- 5.5" (iPhone 8 Plus): 1242 x 2208

**Quick Method:**
```bash
# Use online tool: https://appscreens.io/
# Or use Simulator:

# For 6.5" - iPhone 14 Plus
xcrun simctl boot "iPhone 14 Plus"
# Repeat screenshot process

# For 5.5" - iPhone 8 Plus
xcrun simctl boot "iPhone 8 Plus"
# Repeat screenshot process
```

**Shortcut:** Some app stores accept just one size and auto-scale. Test submission first.

### Step 8: Submit to App Store

Upload screenshots in App Store Connect:
1. Go to App Store Connect
2. My Apps → Nox → iOS App → Screenshots
3. Upload 3-7 screenshots per device size
4. Arrange in best order

**Done!** ✅

---

## Section B: Marketing Screenshots (DIY - 1-2 Days)

### Day 1: Capture Raw Screenshots

Follow Steps 1-5 from Section A above to get clean screenshots.

### Day 2: Add Marketing Elements

#### Using Canva (Easiest)

**Step 1: Sign Up (5 minutes)**
```
1. Go to canva.com
2. Sign up for free account
3. Search for "App Store Screenshots" templates
```

**Step 2: Create Design (60-90 minutes)**
```
For each screenshot:

1. Create custom size:
   - Width: 1290px
   - Height: 2796px

2. Upload your screenshot

3. Add device frame:
   - Search "iPhone mockup"
   - Drag iPhone frame onto canvas
   - Insert your screenshot inside frame

4. Add text overlay:
   - Click "Text" → "Heading"
   - Type headline (e.g., "Discover Nightlife in Real-Time")
   - Font size: 60-80px
   - Font: Bold sans-serif (Poppins, Montserrat)
   - Color: White or Pink (#ff0080)
   - Position: Top or bottom of image

5. Add background:
   - Add gradient background
   - Colors: #ff0080 to #a855f7
   - Or solid color behind text for readability

6. Repeat for all 7 screenshots
```

**Step 3: Export (10 minutes)**
```
1. Click "Share" → "Download"
2. File type: PNG
3. Quality: Recommended (1x)
4. Download all
```

#### Using Figma (More Control)

**Step 1: Setup (15 minutes)**
```
1. Go to figma.com → Sign up free
2. Create new file: "Nox Screenshots"
3. Create frame: 1290 x 2796 (iPhone 6.7")
4. Name frame: "01-Discovery"
```

**Step 2: Import Screenshots (5 minutes)**
```
1. Drag screenshot PNG into Figma
2. Resize to fit within frame
3. Center on frame
```

**Step 3: Add Device Frame (15 minutes)**
```
1. Search Figma Community: "iPhone 15 Pro Max mockup"
2. Duplicate to your file
3. Insert your screenshot inside device
4. Adjust positioning
```

**Step 4: Add Text & Graphics (30 minutes per screenshot)**
```
Text Overlay:
- Font: SF Pro Display (iOS native) or Inter
- Headline size: 64-72px
- Body size: 28-36px
- Color: White with subtle shadow for readability

Background:
- Add rectangle behind text
- Gradient: #ff0080 to #a855f7, 135° angle
- Opacity: 90% if over screenshot

Icons (optional):
- Add small icons next to text
- Use Feather Icons or Heroicons
- Size: 32-40px
```

**Step 5: Export (10 minutes)**
```
1. Select frame
2. Export settings:
   - Format: PNG
   - Scale: 1x
   - Quality: Best
3. Export
4. Repeat for all screenshots
```

### Text Examples for Each Screenshot

**01-Discovery (Map)**
```
Headline: "Discover Nightlife in Real-Time"
Subtext: "See live crowds, vibes, and wait times"
```

**02-Feed (Videos)**
```
Headline: "Watch What's Happening Now"
Subtext: "Real videos from real venues"
```

**03-Challenges (Rewards)**
```
Headline: "Earn Rewards at Every Venue"
Subtext: "Free drinks, VIP access, skip lines"
```

**04-Venue Details**
```
Headline: "Know Before You Go"
Subtext: "Events, photos, and live updates"
```

**05-Tickets**
```
Headline: "Buy Tickets in Seconds"
Subtext: "Instant QR codes, easy entry"
```

**06-Social/Friends**
```
Headline: "Find Your Crew"
Subtext: "See where friends are in real-time"
```

**07-Profile**
```
Headline: "Track Your Nightlife Journey"
Subtext: "Badges, streaks, and memories"
```

---

## Section C: Hire a Designer (Premium)

### Step 1: Capture Raw Screenshots

Follow Steps 1-5 from Section A to get clean screenshots.

### Step 2: Find a Designer

**Fiverr** (Recommended):
```
1. Go to fiverr.com
2. Search: "app store screenshots"
3. Filter: Sellers in US/UK, English speaking, 5-star reviews
4. Price range: $50-150
5. Check portfolio for similar work
6. Look for "App Store" or "Google Play" experience
```

**Upwork**:
```
1. Go to upwork.com
2. Post job: "App Store Screenshot Design"
3. Budget: $100-200
4. Include this brief in job description
```

### Step 3: Designer Brief (Copy & Paste)

```
PROJECT: App Store Screenshots for "Nox" - Nightlife Social App

DELIVERABLES:
- 7 screenshots per device size
- iPhone 6.7" (1290x2796)
- iPhone 6.5" (1284x2778)
- iPhone 5.5" (1242x2208)
- With text overlays and device frames

BRAND COLORS:
- Pink: #ff0080
- Purple: #a855f7
- Black: #000000

STYLE:
- Modern, bold, energetic
- Similar to: TikTok, Instagram, Spotify screenshot style
- Text overlays with benefits (not features)
- Device frames (iPhone mockups)

INCLUDED:
- Raw screenshots (I will provide)
- Text for each screen (I will provide)

TIMELINE: 2-4 days
BUDGET: $100-200
REVISIONS: 2 rounds included

Please share portfolio of app store screenshots you've designed.
```

### Step 4: Provide Materials to Designer

Send in Fiverr message or Google Drive:
```
1. Raw screenshots (7 PNG files)
2. Text for each screen (see "Text Examples" above)
3. Brand colors (#ff0080, #a855f7, #000000)
4. Example screenshots you like (optional)
```

### Step 5: Review & Approve

Designer will send first draft. Check:
- [ ] Text is readable at thumbnail size
- [ ] Colors match brand
- [ ] All 7 screens included
- [ ] All 3 sizes provided
- [ ] No typos in text
- [ ] Professional looking

### Step 6: Request Changes (1 round)

Common adjustments:
- "Make text bigger/smaller"
- "Change text color to white for better contrast"
- "Adjust device frame position"
- "Use different gradient angle"

### Step 7: Final Delivery

Designer should provide:
- [ ] All screenshots in all sizes (21 PNG files)
- [ ] Source files (Figma or PSD) for future edits
- [ ] Preview mockup (optional)

---

## Quick Checklist Before Upload

- [ ] **Correct dimensions** (exact pixels):
  - 6.7": 1290 x 2796
  - 6.5": 1284 x 2778
  - 5.5": 1242 x 2208

- [ ] **File format:** PNG (not JPEG)

- [ ] **File size:** Under 8 MB each

- [ ] **Color mode:** RGB (not CMYK)

- [ ] **No placeholder content:**
  - No "Lorem Ipsum"
  - No test data visible
  - No debug overlays

- [ ] **Clean status bar:**
  - Full battery
  - Full signal strength
  - Wi-Fi connected
  - Time showing

- [ ] **Text readable:**
  - Test at thumbnail size (100px wide)
  - High contrast
  - No spelling errors

- [ ] **Consistent style:**
  - Same fonts across all screenshots
  - Same colors
  - Same layout

- [ ] **3-7 screenshots per device size:**
  - Minimum: 3 screenshots
  - Maximum: 10 screenshots
  - Recommended: 5-7 screenshots

---

## Upload to App Store Connect

### iOS (Apple):

```
1. Go to: appstoreconnect.apple.com
2. My Apps → Nox → App Store tab
3. Media Manager → Screenshots
4. Select device: 6.7" Display
5. Drag and drop screenshots (or click +)
6. Arrange in order (first screenshot = primary)
7. Repeat for 6.5" and 5.5" displays
8. Click Save
```

### Android (Google Play):

```
1. Go to: play.google.com/console
2. All Applications → Nox
3. Store Presence → Store Listing
4. Screenshots section
5. Upload 2-8 screenshots (1080x1920 minimum)
6. Arrange in order
7. Save
```

---

## Timeline Summary

**Option 1 (Clean):**
- Day 1: 2 hours (capture + minimal editing)
- **Total: 2 hours**

**Option 2 (Marketing DIY):**
- Day 1: 2 hours (capture)
- Day 2: 3-5 hours (design + export)
- **Total: 5-7 hours over 2 days**

**Option 3 (Designer):**
- Day 1: 2 hours (capture + send to designer)
- Day 2-3: Wait for designer
- Day 4: 30 minutes (review + approve)
- **Total: 2.5 hours + 2-3 day wait**

---

## Cost Summary

- **Option 1:** Free
- **Option 2:** Free (or $10/month for Canva Pro - optional)
- **Option 3:** $100-200

---

## My Recommendation

**For Quick Launch:** Option 1 (Clean) - Get app live, improve screenshots later

**For Best Results:** Option 2 (Marketing DIY with Canva) - Professional look, full control, saves money

**If No Design Skills:** Option 3 (Hire Designer) - Worth the investment for better conversion

---

**You can always update screenshots after launch!** Start with Option 1, launch the app, then create better screenshots based on user feedback.

**Next:** After screenshots, proceed to Apple Developer enrollment and app submission.
