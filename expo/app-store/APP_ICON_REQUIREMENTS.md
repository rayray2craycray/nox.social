# App Icon Requirements for Nox

**Date:** February 13, 2026
**Budget:** $20-200 (depending on designer vs. DIY)
**Timeline:** 1-3 days
**Priority:** 🔴 CRITICAL - Required for App Store submission

---

## Quick Start Options

### Option 1: Hire a Designer (Recommended) - $50-200, 1-3 days
**Where to hire:**
- Fiverr: https://www.fiverr.com/search/gigs?query=app%20icon
  - Search: "mobile app icon design"
  - Filter: 5-star ratings, English speaking
  - Price: $20-100 for basic, $100-200 for premium
- 99designs: https://99designs.com/mobile-app-design/contests
  - Run a contest ($299+) or 1-to-1 project ($199+)
- Upwork: Find freelance designers
- Dribbble: https://dribbble.com/jobs (higher quality, $200-500)

**What to provide designer:**
- This document
- Brand colors (see below)
- Reference icons you like (screenshots)
- App name: "Nox"
- Concept: Nightlife, social, rewards, discovery

### Option 2: DIY with Figma/Sketch - Free, 2-4 hours
**Tools:**
- Figma (free): https://figma.com
- Sketch (Mac only, $99): https://sketch.com
- Affinity Designer (one-time $69): https://affinity.serif.com

**Resources:**
- iOS App Icon Template: https://www.sketchappsources.com/free-source/4668-ios-app-icon-template-sketch-freebie-resource.html
- Figma Icon Kit: Search "iOS app icon template" in Figma Community

### Option 3: Use Icon Generator Tools - $0-20, 30 minutes
**Tools:**
- Canva: https://www.canva.com (free with templates)
- Icon Kitchen: http://icon.kitchen (free, generates all sizes)
- App Icon Generator: https://appicon.co (free)

**Note:** These produce acceptable but not premium icons. Good for MVP/testing.

---

## Technical Requirements

### iOS (Apple App Store)

| Size | Purpose | Format | Required? |
|------|---------|--------|-----------|
| 1024x1024px | App Store listing | PNG (no alpha) | ✅ REQUIRED |
| 180x180px | iPhone app icon | PNG | ✅ REQUIRED |
| 120x120px | iPhone notifications | PNG | ✅ REQUIRED |
| 87x87px | iPhone settings | PNG | ✅ REQUIRED |
| 167x167px | iPad Pro | PNG | Optional |
| 152x152px | iPad app icon | PNG | Optional |

**Format Requirements:**
- PNG format only
- No transparency (alpha channel)
- sRGB color space
- Square (1:1 aspect ratio)
- No rounded corners (iOS adds automatically)
- No text outside the icon (no "BETA" badges)

### Android (Google Play Store)

| Size | Purpose | Format | Required? |
|------|---------|--------|-----------|
| 512x512px | Play Store listing | PNG | ✅ REQUIRED |
| 192x192px | xxxhdpi launcher | PNG | ✅ REQUIRED |
| 144x144px | xxhdpi launcher | PNG | ✅ REQUIRED |
| 96x96px | xhdpi launcher | PNG | ✅ REQUIRED |
| 72x72px | hdpi launcher | PNG | ✅ REQUIRED |
| 48x48px | mdpi launcher | PNG | ✅ REQUIRED |

**Android Adaptive Icon (Recommended):**
- **Foreground layer:** 108x108dp PNG (main icon, with transparency)
- **Background layer:** 108x108dp PNG or solid color
- **Safe zone:** Keep important elements within center 72x72dp circle

**Format Requirements:**
- PNG format with transparency OK
- RGB or RGBA color mode
- Square (1:1 aspect ratio)
- Can include rounded corners or use adaptive icon

---

## Design Guidelines

### Brand Colors

**Primary Colors:**
- **Neon Pink:** `#ff0080` - Main brand color
- **Electric Purple:** `#a855f7` - Secondary accent
- **Deep Black:** `#000000` - Background/contrast

**Gradient (Signature):**
- Start: `#ff0080` (Neon Pink)
- End: `#a855f7` (Electric Purple)
- Angle: 135° (diagonal)

**Additional Colors:**
- **White:** `#ffffff` - For contrast on dark backgrounds
- **Dark Gray:** `#1a1a1a` - Alternative background

### Design Concepts

**Concept 1: Minimal "R" Letter Mark (Recommended)**
```
┌─────────────────┐
│                 │
│    ╔═══╗        │
│    ║   ║        │
│    ║   ║        │
│    ║   ║        │
│    ║   ╚═══╗    │
│    ║       ║    │
│    ╚═══════╝    │
│                 │
└─────────────────┘
```
- Bold, geometric "R" shape
- Gradient fill (pink to purple)
- Black or dark background
- Modern, minimal, recognizable
- **Similar to:** Robinhood, Reddit, Roblox

**Concept 2: Map Pin with Night Sky**
```
┌─────────────────┐
│   ✦  ★  ✦       │
│      ◢◣         │
│     ◢███◣        │
│    ◢█████◣       │
│   ◢███████◣      │
│     ██████       │
│      ████        │
│       ██         │
│        ▼         │
└─────────────────┘
```
- Location pin with stars/sparkles
- Gradient fill
- Represents "discover nightlife"
- **Similar to:** Foursquare, Yelp, Meetup

**Concept 3: Neon Light/Glow Effect**
```
┌─────────────────┐
│                 │
│     ╭───╮       │
│    │ R ∞│       │
│     ╰───╯       │
│    ╱     ╲      │
│   ╱  ███  ╲     │
│  ╱  █████  ╲    │
│ ╱  ███████  ╲   │
└─────────────────┘
```
- "R" with neon glow effect
- Represents nightlife/neon signs
- Gradient with outer glow
- **Similar to:** Instagram, TikTok (vibrant)

**Concept 4: Social Connection Dots**
```
┌─────────────────┐
│                 │
│   ●───●───●     │
│   │ ╲ │ ╱ │     │
│   │  ╳  │       │
│   │ ╱ ╲ │       │
│   ●───●         │
│                 │
└─────────────────┘
```
- Connected nodes/dots
- Represents social network
- Pink/purple gradient dots
- **Similar to:** Meetup, Bumble

---

## Design Best Practices

### Do's ✅
- **Keep it simple** - Icon will be tiny (60px on home screen)
- **High contrast** - Should work on any background
- **Unique shape** - Stand out among other apps
- **Scalable** - Must look good at all sizes
- **On-brand** - Use Nox's pink/purple colors
- **Test at small size** - View at 60x60px before finalizing
- **Avoid text** - Unless extremely legible

### Don'ts ❌
- **Don't use photos** - Use vector graphics/illustrations
- **Don't use gradients as background** - Hard to read at small sizes
- **Don't include wordmark** - "Nox" text is too small
- **Don't use too many colors** - Stick to 2-3 max
- **Don't copy competitors** - Be original
- **Don't use generic templates** - Customize heavily

---

## Reference Icons (Apps to Study)

**Great Nightlife/Social App Icons:**
- Instagram - Simple, recognizable, on-brand
- TikTok - Neon, music note, vibrant
- Spotify - Simple green circle with wave
- Snapchat - Bold yellow, simple ghost
- Bumble - Clean, simple beehive
- Tinder - Flame with gradient

**What makes them great:**
- Instantly recognizable at small size
- Unique shape/silhouette
- Strong brand colors
- Simple enough to remember
- Works on any background

---

## Deliverables Checklist

When designer delivers, ensure you receive:

### iOS Assets
- [ ] 1024x1024px PNG (App Store)
- [ ] 180x180px PNG (iPhone app)
- [ ] 120x120px PNG (iPhone notifications)
- [ ] 87x87px PNG (iPhone settings)
- [ ] app-icon.png (1024x1024 for Expo/React Native)

### Android Assets
- [ ] 512x512px PNG (Play Store)
- [ ] 192x192px PNG (xxxhdpi)
- [ ] 144x144px PNG (xxhdpi)
- [ ] 96x96px PNG (xhdpi)
- [ ] 72x72px PNG (hdpi)
- [ ] 48x48px PNG (mdpi)
- [ ] Foreground layer PNG (adaptive icon)
- [ ] Background layer PNG or color code

### Source Files
- [ ] Original design file (Figma, Sketch, AI, PSD)
- [ ] Vector format (SVG or AI) for future use
- [ ] Color codes (hex values)
- [ ] Font names (if text is used)

---

## File Naming Convention

```
rork-app-icon-1024.png         (iOS App Store)
rork-app-icon-180.png          (iPhone app)
rork-app-icon-120.png          (iPhone notifications)
rork-app-icon-87.png           (iPhone settings)

rork-playstore-icon-512.png    (Android Play Store)
rork-android-icon-xxxhdpi.png  (192x192)
rork-android-icon-xxhdpi.png   (144x144)
rork-android-icon-xhdpi.png    (96x96)
rork-android-icon-hdpi.png     (72x72)
rork-android-icon-mdpi.png     (48x48)

rork-icon-source.fig           (Figma source)
rork-icon-vector.svg           (Vector export)
```

---

## How to Add Icons to Your App

### For Expo/React Native:

1. **Place the icon in your project:**
```bash
/Users/rayan/rork-nightlife-app/assets/images/icon.png
```
(1024x1024px PNG)

2. **Update app.json or app.config.js:**
```json
{
  "expo": {
    "icon": "./assets/images/icon.png",
    "ios": {
      "icon": "./assets/images/icon.png"
    },
    "android": {
      "icon": "./assets/images/icon.png",
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon-foreground.png",
        "backgroundImage": "./assets/images/adaptive-icon-background.png",
        "backgroundColor": "#000000"
      }
    }
  }
}
```

3. **Expo will auto-generate all sizes** when you build!

### Manual Installation (if not using Expo):

**iOS:** Place in `ios/AppName/Images.xcassets/AppIcon.appiconset/`
**Android:** Place in `android/app/src/main/res/mipmap-*/`

---

## Budget Options

### Free ($0)
- Use Canva templates
- Use Icon Kitchen generator
- DIY with Figma (requires design skills)
- **Quality:** Basic, suitable for testing
- **Time:** 1-2 hours

### Budget ($20-50)
- Fiverr basic package
- Pre-made icon with customization
- **Quality:** Good, professional-looking
- **Time:** 1-2 days

### Mid-Range ($50-150)
- Fiverr premium designer
- Custom icon from Upwork freelancer
- **Quality:** Great, multiple revisions
- **Time:** 2-4 days

### Premium ($200-500)
- 99designs contest
- Dribbble designer
- Full brand package (icon + variations)
- **Quality:** Excellent, highly polished
- **Time:** 5-10 days

---

## Designer Brief Template

**Copy-paste this to send to a designer:**

```
PROJECT: Mobile App Icon for "Nox" - Nightlife Discovery App

ABOUT THE APP:
Nox is a social nightlife discovery app (like Instagram + Yelp for nightclubs/bars).
Users discover venues, connect with friends, earn rewards, and share experiences.

TARGET AUDIENCE:
21-35 year old nightlife enthusiasts, party-goers, social butterflies

DELIVERABLES:
- iOS: 1024x1024px PNG (no transparency)
- Android: 512x512px PNG
- All standard iOS sizes (180px, 120px, 87px)
- All standard Android sizes (192px, 144px, 96px, 72px, 48px)
- Source file (Figma/Sketch/AI)

BRAND COLORS:
- Primary: #ff0080 (Neon Pink)
- Secondary: #a855f7 (Electric Purple)
- Background: #000000 (Black)
- Gradient: Pink to Purple (135°)

DESIGN DIRECTION:
- Modern, minimal, bold
- Must work at small sizes (60x60px)
- Represents nightlife, social connection, discovery
- Should stand out on iOS/Android home screens
- Prefer letter mark "R" or abstract symbol (no photos)

INSPIRATION:
- Instagram (simple, recognizable)
- TikTok (neon, vibrant)
- Spotify (clean, geometric)

TIMELINE: 2-3 days
BUDGET: $[YOUR_BUDGET]
REVISIONS: 2-3 rounds included

AVOID:
- Text (app name)
- Complex gradients
- Photo-realistic elements
- Generic stock icons
```

---

## Testing Your Icon

Before finalizing:

1. **View at actual size** (60x60px on phone)
2. **Test on different backgrounds:**
   - White background
   - Black background
   - Home screen wallpaper
3. **Check in context:**
   - Among other popular apps
   - In App Store search results
   - On notification tray
4. **Ask for feedback:**
   - Friends/colleagues
   - Target audience
   - Design communities (r/design_critiques)

---

## Approval Timeline

**Designer → Review → Revisions → Final → Implementation**

- Designer delivers: Day 1-3
- You review + feedback: Day 3 (same day)
- Designer revisions: Day 4-5
- Final approval: Day 5
- Add to app: Day 5 (30 minutes)
- **Total: 5-7 days**

**Start this ASAP - it's on the critical path!**

---

## Common Mistakes to Avoid

1. **Too much detail** - Won't be visible at small size
2. **Low contrast** - Hard to see on certain backgrounds
3. **Off-brand colors** - Doesn't match app's pink/purple theme
4. **Generic** - Looks like every other app
5. **Wrong file format** - iOS requires PNG without alpha for App Store
6. **Wrong dimensions** - Must be exact sizes listed above
7. **Text included** - Too small to read

---

## Next Steps

**Week 1 Priority:**
1. ✅ Review this document
2. ⏳ Choose option (hire designer vs. DIY)
3. ⏳ If hiring: Post job on Fiverr/Upwork today
4. ⏳ Provide designer brief
5. ⏳ Wait for first draft (2-3 days)
6. ⏳ Review and provide feedback
7. ⏳ Get final files
8. ⏳ Add to app and test

**Timeline:** 5-7 days total
**Cost:** $0-200
**Priority:** 🔴 BLOCKING - Cannot submit without icon

---

**Questions? Email support@nox.social**

**Good luck! Your icon will be the face of your app - make it count! 🎨**
