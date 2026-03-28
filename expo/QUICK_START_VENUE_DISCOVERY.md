# Quick Start - Test Venue Discovery

## ✅ Google Maps API Key Configured!

Your API key has been added to `app.config.js` and is ready to use.

---

## 🚀 Start Testing (5 Minutes)

### Step 1: Restart Expo Dev Server

```bash
# Stop current server (Ctrl+C if running)

# Clear cache and restart
npx expo start --clear
```

**Why?** - App config changes require a restart to take effect.

---

### Step 2: Open App on Device

**iOS Simulator**:
```bash
# Press 'i' in terminal
# or scan QR code with Camera app
```

**Android Emulator**:
```bash
# Press 'a' in terminal
# or scan QR code with Expo Go app
```

**Physical Device** (Recommended for GPS accuracy):
- Scan QR code with Camera (iOS) or Expo Go (Android)

---

### Step 3: Test Venue Discovery

1. **Open the app**
2. **Navigate to Discovery tab** (map icon at bottom)
3. **Grant location permission** when prompted
   - iOS: "Allow While Using App"
   - Android: "Allow"
4. **Wait 5-10 seconds** for venues to load
5. **Look for real venues!**

---

## ✅ What You Should See

### Loading State (5-10 seconds):
```
🔵 Loading spinner
"Finding nearby venues..."
"Searching within 50 miles"
```

### Success State:
```
Map with markers showing real venues:
🎵 - Venue markers
📍 - Your location (blue dot)

Header:
"Discover Venues"
"12 open now • 47 within 50 miles"
```

### Venue Information:
- Real venue names (e.g., "The Blue Note", "Webster Hall")
- Accurate distances (e.g., "2.3 miles away")
- Google ratings (⭐ 4.5)
- Price levels ($$ or $$$)
- Venue photos

---

## 🧪 Test Checklist

- [ ] App restarts successfully
- [ ] Discovery tab opens
- [ ] Location permission granted
- [ ] Loading indicator appears
- [ ] Real venues load (not "Mock Venue #1")
- [ ] Markers appear on map
- [ ] Distances shown in miles
- [ ] Tap marker to see venue details
- [ ] Header shows "X within 50 miles"
- [ ] Refresh button works (🔄 icon)

---

## 🎯 Features to Test

### 1. Initial Load
- Should fetch venues from Google Maps
- Takes 5-10 seconds first time
- Caches results for 1 hour

### 2. Subsequent Loads
- Close and reopen app
- Should load instantly from cache
- No API calls made

### 3. Refresh Button
- Tap 🔄 refresh icon (top right)
- Should fetch new venues
- Updates map with latest data

### 4. Venue Details
- Tap any venue marker
- Should show venue information:
  - Name
  - Distance
  - Rating
  - Price level
  - Photo (if available)

### 5. 50-Mile Radius
- Zoom out on map
- Should only show venues within 50 miles
- Header shows "X within 50 miles"

---

## 🐛 Troubleshooting

### Issue: No venues appear

**Check**:
1. Console logs for errors
   ```bash
   # Look for:
   "Google Maps API key not configured"
   "REQUEST_DENIED"
   "Unable to get location"
   ```

2. Location permission granted
   - iOS: Settings → Rork App → Location → While Using App
   - Android: Settings → Apps → Rork → Permissions → Location

3. Internet connection active

4. Google Cloud Console:
   - Places API enabled
   - Billing enabled
   - API key valid

**Solution**: Try toggling to mock data mode if API fails

---

### Issue: "REQUEST_DENIED" error

**Causes**:
- Billing not enabled in Google Cloud
- Places API not enabled
- API key restrictions too strict

**Solution**:
1. Go to https://console.cloud.google.com/billing
2. Enable billing (free $200/month credit)
3. Go to APIs & Services → Library
4. Enable "Places API"

---

### Issue: Slow loading

**Expected**:
- First load: 5-10 seconds (GPS + API calls)
- Cached load: Instant
- Refresh: 3-5 seconds

**If slower**:
- Check internet speed
- Try on different network
- GPS lock takes longer indoors

---

### Issue: Venues too far away

**Expected**: Shows venues within 50 miles

**If outside radius**:
- Check your location (blue dot on map)
- Zoom out to see full 50-mile radius
- Some areas may have fewer venues

---

## 📊 Verify API Calls

### Check Console Logs:

**Successful fetch**:
```
✓ Fetched 47 venues within 50 miles
✓ Cached venues for 1 hour
```

**Using cache**:
```
✓ Loaded 47 venues from cache
```

**API error**:
```
✗ Google Places API error: REQUEST_DENIED
✗ Falling back to mock data
```

---

## 🎨 Expected User Experience

### First Time User:
1. Opens Discovery tab
2. Prompted for location permission
3. Grants permission
4. Loading spinner: "Finding nearby venues..."
5. Wait 5-10 seconds
6. Map populates with real venues
7. Can tap markers to see details
8. Venues cached for next time

### Returning User:
1. Opens Discovery tab
2. Venues load instantly (from cache)
3. No loading spinner
4. Can tap refresh to update

---

## 💡 Tips

### Best Results:
- **Use physical device** - More accurate GPS
- **Go outside** - Faster GPS lock
- **Urban areas** - More venues available
- **Wait for GPS lock** - Be patient on first load

### Development:
- **Clear cache** - Delete and reinstall app
- **Mock data toggle** - Set `useMockData = true` in discovery.tsx
- **Console logs** - Watch for API responses

---

## 🔒 Security Note

**⚠️ Important**: Your API key is now in the code!

**For Development**: This is fine
**For Production**: Consider these options:

1. **API Key Restrictions** (Recommended):
   - Go to Google Cloud Console → Credentials
   - Edit API key
   - Add Application restrictions:
     - iOS: Bundle ID `app.rork.nightlife`
     - Android: Package name + SHA-1 certificate

2. **Environment Variables**:
   ```bash
   # Set in terminal before running
   export GOOGLE_MAPS_API_KEY="your-key"
   ```

3. **Git Ignore**:
   - Never commit API keys to public repos
   - Add `app.config.js` to `.gitignore` (or use .env)

4. **Budget Alerts**:
   - Set in Google Cloud Console
   - Alert at $50/month to avoid surprises

---

## 📈 Monitor Usage

### Google Cloud Console:
1. Go to https://console.cloud.google.com/
2. Select project: "rork-nightlife-app"
3. Navigate to: **APIs & Services** → **Dashboard**
4. View: Places API usage
5. Check: Requests per day, errors, quota

### Expected Usage:
- **Per user**: 4-8 API calls per day
- **100 users**: 400-800 calls/day
- **Cost**: $0-15/month (with caching)

---

## ✅ Success Criteria

You'll know it's working when:

✅ Real venue names appear (not mock data)
✅ Distances are accurate
✅ Venues have Google ratings
✅ Photos load for most venues
✅ Header shows "X within 50 miles"
✅ Only shows nightlife venues (bars, clubs, lounges)
✅ Second load is instant (from cache)
✅ Refresh button updates venues

---

## 🎉 Next Steps

Once venue discovery is working:

1. **Test on different locations**
   - Move around and refresh
   - Verify venues update

2. **Test caching**
   - Close and reopen app
   - Should load instantly

3. **Test refresh**
   - Tap refresh button
   - Should fetch new venues

4. **Explore venues**
   - Tap markers
   - View venue details
   - Check distances

5. **Share feedback**
   - Note any issues
   - Suggest improvements
   - Test edge cases

---

## 📚 Documentation

- **Setup Guide**: `/GOOGLE_MAPS_SETUP.md`
- **Implementation Details**: `/GOOGLE_MAPS_VENUE_DISCOVERY_COMPLETE.md`
- **Quick Reference**: This file

---

## 🆘 Need Help?

**Check**:
1. Console logs for errors
2. Google Cloud Console for API status
3. Location permissions in device settings
4. Internet connection

**Common Issues**:
- API key not configured → Check app.config.js
- No venues loading → Enable billing in Google Cloud
- REQUEST_DENIED → Enable Places API
- Slow loading → Normal on first load, should cache after

---

**Ready to test!** 🚀

Run: `npx expo start --clear` and open the Discovery tab.

Real venues should appear within 50 miles of your location! 🎉
