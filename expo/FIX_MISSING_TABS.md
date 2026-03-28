# Fix Missing Tabs (Studio & Profile)

## Problem
Studio and Profile tabs are missing from the tab bar UI.

## Root Cause
Both `studio.tsx` and `profile.tsx` import `useUpload` hook, which depends on `react-native-compressor`. This package was just installed, but the Metro bundler hasn't reloaded the changes yet.

## Solution: Restart Metro Bundler

### Option 1: Full Restart (Recommended)

```bash
# Stop the current Expo dev server (Ctrl+C in the terminal)

# Clear all caches and restart
npx expo start --clear
```

### Option 2: Quick Restart

```bash
# In the Expo dev terminal, press:
# R - to reload app
# or
# Shift+R - to restart Metro bundler
```

### Option 3: Nuclear Option (if issues persist)

```bash
# Stop Expo server (Ctrl+C)

# Clear all caches
rm -rf node_modules/.cache
rm -rf .expo

# Restart
npx expo start --clear
```

---

## What Should Happen

After restart, you should see **all 5 tabs**:

1. 🔥 **Feed** - Vibe videos and social feed
2. 📍 **Discovery** - Map with real venues (Google Maps)
3. 💬 **Servers** - Social connections
4. ✨ **Studio** - Camera and video recording
5. 👤 **Profile** - User profile and settings

---

## Verification

### Check 1: Tab Bar Visible
- Bottom of screen should show all 5 icons
- Tap each tab to verify they load

### Check 2: Studio Tab
- Should show camera interface
- Can record videos
- Upload functionality works

### Check 3: Profile Tab
- Shows user profile
- Displays stats and badges
- Upload profile picture works

---

## If Tabs Still Missing

### Check Console for Errors

Look for:
```
✓ No more "react-native-compressor" errors
✓ No more "missing default export" warnings
✓ Tabs should load without errors
```

### Verify Package Installation

```bash
# Check if package is installed
npm list react-native-compressor

# Should show:
# react-native-compressor@1.x.x
```

### Check File Integrity

```bash
# Verify tab files exist
ls -la app/(tabs)/*.tsx

# Should show:
# feed.tsx
# discovery.tsx
# servers.tsx
# studio.tsx
# profile.tsx
```

---

## Technical Details

### Why This Happened

1. `studio.tsx` and `profile.tsx` both import:
   ```typescript
   import { useUpload } from '@/hooks/useUpload';
   ```

2. `useUpload` hook imports:
   ```typescript
   // In hooks/useUpload.ts
   import { uploadToCloudinary } from '@/services/upload.service';
   ```

3. `upload.service.ts` imports:
   ```typescript
   // In services/upload.service.ts
   import { Image, Video } from 'react-native-compressor';
   ```

4. When this package was missing, the entire import chain failed
5. This caused `studio.tsx` and `profile.tsx` to fail loading
6. Metro bundler marked them as "missing default export"
7. Expo Router excluded them from the tab bar

### Why Restart Fixes It

- Metro bundler caches the module resolution
- Installing the package doesn't invalidate the cache
- Restart forces Metro to re-resolve all imports
- Tabs load successfully with the new package

---

## Files Involved

| File | Purpose |
|------|---------|
| `app/(tabs)/studio.tsx` | Studio/Camera tab (46KB) |
| `app/(tabs)/profile.tsx` | Profile tab (74KB) |
| `hooks/useUpload.ts` | Upload hook |
| `services/upload.service.ts` | Cloudinary upload service |
| `node_modules/react-native-compressor` | Compression package |

---

## Quick Fix Command

```bash
# One command to fix everything:
npx expo start --clear
```

**That's it!** The tabs should reappear after Metro restarts.

---

## Expected Result

### Before Fix:
```
Tab Bar: [Feed] [Discovery] [Servers]
Missing: [Studio] [Profile]
```

### After Fix:
```
Tab Bar: [Feed] [Discovery] [Servers] [Studio] [Profile]
All tabs visible: ✅
```

---

**Restart Expo and the tabs will be back!** 🎉
