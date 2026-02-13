# Screenshot Capture Guide - Quick Reference

**Status:** ✅ Simulator Ready | ⏳ Capturing Screenshots

---

## 🎯 Required Screenshots (7 Total)

App Store requires minimum 3 screenshots, but 7 is recommended to showcase all features.

### Checklist

- [ ] **1. Discovery Map** - Main screen with venue markers
- [ ] **2. Live Feed** - Video scroll showing user-generated content
- [ ] **3. Challenges** - Rewards and achievements page
- [ ] **4. Venue Details** - Full venue information screen
- [ ] **5. Tickets** - Ticket purchase or wallet view
- [ ] **6. Social/Friends** - Friends list or crew feature
- [ ] **7. Profile** - User profile with stats

---

## 📸 How to Capture

### Step 1: Ensure App is Running
Your app should already be open in the iPhone 15 Pro Max simulator.

If not:
```bash
cd /Users/rayan/rork-nightlife-app
npm start
# Wait for Metro bundler, then press 'i'
```

### Step 2: Navigate to Each Screen
Use the simulator like a real phone:
- **Tap** - Click with mouse
- **Scroll** - Mouse wheel or trackpad
- **Home** - Cmd+Shift+H
- **Rotate** - Cmd+Left/Right Arrow

### Step 3: Capture Screenshot
When you're on the desired screen:
1. Make sure the screen looks good (no loading spinners, errors, or "Lorem ipsum")
2. **Press Cmd+S** (or File → Save Screen)
3. Screenshot saves to `~/Desktop/`
4. Move to next screen and repeat

---

## ✨ Tips for Professional Screenshots

### Before Capturing:
✅ Use realistic data (not "Test User")
✅ Ensure app is fully loaded
✅ No loading spinners visible
✅ No error messages shown
✅ Good content diversity (different venues, profiles)
✅ Status bar is clean (simulator auto-shows 9:41 AM)

### Screen-Specific Tips:

**Discovery Map:**
- Show multiple venue markers
- Center on active area (downtown, nightlife district)
- Show filter options if visible

**Live Feed:**
- Show engaging video thumbnail
- Include like counts and comments
- Show venue tags

**Challenges:**
- Show mix of active and completed challenges
- Display progress bars
- Show reward badges

**Venue Details:**
- Pick popular venue with good photos
- Show all key info (hours, cover charge, capacity)
- Include "Get In Line" or ticket buttons

**Tickets:**
- Show active ticket with QR code
- Or show ticket purchase screen with pricing tiers

**Social/Friends:**
- Show friend list with avatars
- Or show crew feature if implemented

**Profile:**
- Show stats (nights out, badges)
- Include profile picture and bio
- Show recent activity

---

## 🚀 After Capturing

### Organize Screenshots

Run the organizer script:
```bash
/Users/rayan/rork-nightlife-app/scripts/organize-screenshots.sh
```

This will:
1. Create `~/Desktop/Nox-Screenshots/iPhone-6.7/` folder
2. Move all screenshots there
3. Show you what was captured

### Rename Screenshots

Manually rename each file to:
- `01-discovery-map.png`
- `02-live-feed.png`
- `03-challenges.png`
- `04-venue-details.png`
- `05-tickets.png`
- `06-social.png`
- `07-profile.png`

Or use the auto-rename command shown by the script (after verifying order).

---

## 📱 Screenshot Requirements

### iOS App Store:
- **Minimum:** 3 screenshots
- **Recommended:** 5-7 screenshots
- **Format:** PNG
- **Size:** 1290 x 2796 pixels (iPhone 15 Pro Max)
- **File size:** Under 500 KB each
- **Color space:** RGB

### Your Device:
- ✅ iPhone 15 Pro Max (6.7" display)
- ✅ Resolution: Correct for App Store
- ✅ Simulator auto-generates perfect screenshots

---

## ⚠️ Common Mistakes to Avoid

❌ Test data visible (e.g., "Test User", "test@example.com")
❌ Lorem ipsum placeholder text
❌ Loading spinners or progress bars
❌ Error messages or empty states
❌ Debug overlays or development indicators
❌ Incorrect time/date in status bar (simulator fixes this automatically)
❌ Low battery indicator
❌ Notifications visible

---

## 🔄 If You Need to Retake

No problem! Just:
1. Navigate back to the screen
2. Press Cmd+S again
3. New screenshot will be saved with newer timestamp
4. Delete the old one later when organizing

---

## 📊 Quality Checklist

Before moving on, verify:
- [ ] All 7 screenshots captured
- [ ] Each screenshot is clear and readable
- [ ] No errors or loading states visible
- [ ] Content looks realistic and engaging
- [ ] Files are PNG format
- [ ] Resolution is 1290 x 2796 pixels

---

## ✅ Next Steps After Screenshots

1. ✅ Organize screenshots with script
2. ✅ Rename files descriptively
3. ⏳ Start Apple Developer enrollment
4. ⏳ Create Google Play account
5. ⏳ Hire app icon designer
6. ⏳ Complete store listings

---

**Ready to capture? Open the Nox app in your simulator and press Cmd+S on each key screen!**

**Simulator Device ID:** CEF95F24-F309-4B72-B89A-41E0780D4145
**Status:** ✅ Booted and ready
