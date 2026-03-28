# iOS Simulator Setup - Complete! ✅

Your iOS simulator is now set up and ready. Here's what was done:

## ✅ What's Already Working

1. **iOS Runtime Installed** (8.39 GB)
2. **iPhone 15 Pro Max Created** (Device ID: CEF95F24-F309-4B72-B89A-41E0780D4145)
3. **Simulator.app is Open** (should be visible on your screen)

---

## 📸 How to Capture Screenshots

### Option 1: Run in Terminal (Recommended for Screenshots)

Since you just need screenshots, you can run the app directly:

```bash
cd /Users/rayan/rork-nightlife-app

# Start the development server
npm start

# When it shows the menu, press 'i' to open on iOS
# The app will open in the simulator
```

**Note:** First launch takes 1-2 minutes to build. Be patient!

---

### Option 2: Build Development Client (Better for Testing)

If you want a more stable experience:

```bash
cd /Users/rayan/rork-nightlife-app

# Build a development client (one-time, takes 10-15 minutes)
npx expo run:ios

# This builds the app natively
# Future launches will be much faster
```

---

## 📱 Taking Screenshots

Once your app is running in the simulator:

### Take Screenshots (Cmd+S)

Navigate to each screen and press **Cmd+S**:

1. **Discovery Map** - Main map with venue pins
2. **Live Feed** - Video scroll
3. **Challenges** - Rewards page
4. **Venue Details** - Full venue info
5. **Tickets** - Purchase or wallet
6. **Social/Friends** - Friends list
7. **Profile** - User stats

### Screenshots save to: `~/Desktop/`

Look for files like: `Simulator Screen Shot - iPhone 15 Pro Max - 2026-02-13 at 10.23.45.png`

---

## 🛠️ Simulator Tips

**Navigate:**
- Click = Tap on device
- Scroll = Mouse wheel or trackpad
- Home button = Cmd+Shift+H

**Rotate:**
- Cmd+Left Arrow = Rotate left
- Cmd+Right Arrow = Rotate right

**Screenshot:**
- Cmd+S = Save screenshot to Desktop

**Status Bar (for clean screenshots):**
- The simulator automatically shows "9:41 AM" and full battery
- This is the standard time Apple uses in all screenshots
- Your screenshots will look professional automatically!

---

## ✨ Tips for Great Screenshots

**Before capturing:**
1. Use realistic data (not "Test User" or "Lorem ipsum")
2. Make sure app is fully loaded
3. No loading spinners or errors visible
4. Good content diversity (different venues, profiles, etc.)

**After capturing:**
```bash
# Organize screenshots
mkdir -p ~/Desktop/Nox-Screenshots
mv ~/Desktop/Simulator\ Screen\ Shot*.png ~/Desktop/Nox-Screenshots/

# Rename for clarity
cd ~/Desktop/Nox-Screenshots
# Example: rename to 01-discovery-map.png, 02-live-feed.png, etc.
```

---

## 🚨 If Something Goes Wrong

**Simulator won't open the app:**
```bash
# Make sure simulator is booted
xcrun simctl list devices | grep Booted

# If not booted, boot it:
xcrun simctl boot CEF95F24-F309-4B72-B89A-41E0780D4145
open -a Simulator
```

**Metro bundler errors:**
```bash
# Clear cache and restart
npx expo start --clear
```

**Simulator is slow:**
- Close other apps to free up RAM
- Simulator needs at least 4GB RAM to run smoothly
- First build is always slowest (2-3 minutes)

---

## 🎯 Next Steps After Screenshots

Once you have your 7 screenshots:

1. ✅ Organize them in a folder
2. ✅ Rename them descriptively
3. ✅ Review for quality (no errors, good content)
4. ✅ Ready to upload to App Store Connect!

---

## 📋 Current Status

- ✅ iOS Simulator Runtime: Installed
- ✅ iPhone 15 Pro Max: Created and Booted
- ✅ Simulator.app: Open and Ready
- ⏳ App: Ready to launch (run `npm start` and press 'i')
- ⏳ Screenshots: Ready to capture (Cmd+S)

---

**You're all set! Just run `npm start` in Terminal and press 'i' when prompted.**
