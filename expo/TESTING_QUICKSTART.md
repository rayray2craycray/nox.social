# Upload Features - Quick Start Testing Guide

## ✅ System Status

All upload features are implemented and ready for testing!

**Backend**:
- ✅ Running on port 5000
- ✅ MongoDB Atlas connected
- ✅ Cloudinary credentials configured
- ✅ Upload endpoints active:
  - `/api/upload/profile-picture`
  - `/api/upload/highlight`
  - `/api/upload/memory`

**Frontend**:
- ✅ API URL configured (http://localhost:5000)
- ✅ Upload service created
- ✅ Upload hook implemented
- ✅ Three upload features integrated:
  1. Profile Picture Upload
  2. Studio Video Upload
  3. Location-Based Memories

**Configuration Fix Applied**:
- Fixed API URL mismatch (was 3000, now 5000) ✅

---

## 🚀 Start Testing (5-Minute Quick Test)

### Prerequisites
```bash
# 1. Backend running
cd backend
npm start  # Should already be running on port 5000

# 2. Frontend running (new terminal)
npx expo start

# 3. Device
- Physical device recommended (for GPS/camera)
- OR iOS Simulator / Android Emulator
```

---

## Quick Test Flow (15 minutes)

### Test 1: Profile Picture Upload (3 min)
```bash
1. Open app → Profile tab
2. Tap profile picture circle
3. Choose "Take Photo" or "Choose from Library"
4. Select/take a photo
5. Watch upload progress
✅ Verify: Profile picture updates immediately
```

**Expected**: Upload completes in 2-5 seconds, profile picture visible

---

### Test 2: Studio Video Upload (5 min)
```bash
1. Open app → Studio tab
2. Tap "Create Video"
3. Tap "Record Video" (or "Upload Existing")
4. Record 10-15 second video
5. Trim if needed
6. Tap "Share"
7. Add title: "Test Video"
8. Select venue
9. Tap "Post to Feed"
10. Watch two-stage upload:
    - "Uploading X%" (Cloudinary)
    - "Posting to Feed..." (Backend)
✅ Verify: Success alert, video appears in feed
```

**Expected**:
- Upload takes 10-30 seconds
- Progress shows accurately
- Video plays in feed

---

### Test 3: Location-Based Memories (7 min)

**Option A: At a Real Venue** (Recommended)
```bash
1. Go within 500m of a venue
2. Open app → Profile tab
3. Scroll to "My Memories"
4. Tap "Capture Memory"
5. Grant location permission
6. Wait for GPS lock (2-5 sec)
✅ Verify: Modal opens with detected venue name and distance
7. Camera opens automatically
8. Take a live photo
9. Add caption: "Great night!"
10. Tap "Save Memory"
✅ Verify: Photo appears in grid with venue name
```

**Option B: Testing Without Venue** (Development)
```bash
# Temporarily modify for testing:
# In app/(tabs)/profile.tsx line ~520, change:
if (!nearestVenue || nearestVenue.distance > 5.0) { // Changed from 0.5

# This allows testing from any location
# Remember to change back to 0.5 for production!
```

**Expected**:
- Location detection takes 2-5 seconds
- Nearest venue detected accurately
- Camera opens (NOT gallery)
- Photo uploads and appears in grid

---

## Verification Checklist

After testing, verify in Cloudinary:
```bash
1. Go to https://cloudinary.com/console/media_library
2. Check folders:
   ✅ rork-app/profiles/ - Profile pictures
   ✅ rork-app/highlights/ - Studio videos
   ✅ rork-app/memories/ - Memory photos
3. Verify files uploaded correctly
4. Check transformations applied (sizes, formats)
```

---

## Common Issues & Quick Fixes

### Issue: "Upload Failed"
**Fix**:
- Check backend is running: `lsof -i :5000`
- Verify Cloudinary credentials in `backend/.env`
- Check network connection

### Issue: "Location Permission Required"
**Fix**:
- iOS: Settings → Rork App → Location → Allow While Using App
- Android: Settings → Apps → Rork → Permissions → Location → Allow

### Issue: GPS not acquiring lock
**Fix**:
- Go outside or near window
- Wait up to 10 seconds
- Use mock location for development (see Test 3 Option B)

### Issue: Camera won't open
**Fix**:
- Grant camera permission in device settings
- Restart app

### Issue: Video won't upload
**Fix**:
- Ensure user role is 'TALENT' (Studio is talent-only)
- Check title is entered
- Verify venue selected

---

## Next Steps After Testing

Once all three features work:

1. **Mark testing complete**: Update todo list
2. **Fix any issues found**: Create bug reports if needed
3. **Proceed to production setup**:
   - Configure production environment variables
   - Deploy backend to production server
   - Build production mobile app

---

## Detailed Testing

For comprehensive testing of all edge cases, error handling, and performance:
👉 **See**: `/UPLOAD_FEATURES_TESTING_GUIDE.md`

---

## Documentation Reference

- **Profile Upload**: `/PROFILE_PICTURE_UPLOAD_COMPLETE.md`
- **Studio Upload**: `/STUDIO_VIDEO_UPLOAD_COMPLETE.md`
- **Location Memories**: `/LOCATION_MEMORIES_COMPLETE.md`
- **Backend Setup**: `/backend/README.md`
- **Cloudinary Setup**: `/CLOUDINARY_SETUP.md`

---

## Support

**Issues?**
- Check error logs in terminal
- Verify backend logs: `cd backend && npm start`
- Review Cloudinary dashboard for failed uploads
- Check API responses in network tab

**Need Help?**
- Review detailed testing guide: `/UPLOAD_FEATURES_TESTING_GUIDE.md`
- Check backend logs for detailed errors
- Verify all environment variables are set

---

## Summary

✅ **Backend**: Running on port 5000
✅ **Frontend**: Connected to localhost:5000
✅ **Cloudinary**: Configured with credentials
✅ **Three Upload Features**: Ready to test
✅ **Documentation**: Complete

**Ready to test!** Start with the 5-minute quick test above.

---

**Last Updated**: Testing phase
**App Completion**: ~95-97%
**Current Task**: Test all upload features
**Next Task**: Production deployment
