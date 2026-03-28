# Upload Features - Complete Testing Guide

## Overview

This guide covers end-to-end testing of all three upload features in the Rork Nightlife App:

1. **Profile Picture Upload** - Camera/gallery upload for user profile
2. **Studio Video Upload** - Video highlights with Cloudinary storage
3. **Location-Based Memories** - GPS-verified live photos at venues

---

## Prerequisites

### Required Setup

**Backend**:
- ✅ Backend server running (http://localhost:5000)
- ✅ MongoDB Atlas connected
- ✅ Cloudinary credentials configured in backend `.env`:
  ```
  CLOUDINARY_CLOUD_NAME=your_cloud_name
  CLOUDINARY_API_KEY=your_api_key
  CLOUDINARY_API_SECRET=your_api_secret
  ```

**Frontend**:
- ✅ Expo app running (`npx expo start`)
- ✅ User authenticated (signed in)
- ✅ Location services enabled on device
- ✅ Camera permissions granted
- ✅ Photo library permissions granted

**Device**:
- 📱 **Physical device recommended** (simulators have limited GPS/camera)
- ✅ iOS 13+ or Android 10+
- ✅ Active internet connection
- ✅ Location services enabled
- ✅ Camera available

---

## Test Suite 1: Profile Picture Upload

### Test 1.1: Upload from Camera

**Steps**:
```bash
1. Open app and navigate to Profile tab
2. Tap profile picture placeholder or existing picture
3. Select "Take Photo" option
4. Grant camera permission if prompted
5. Take a photo
6. Confirm the photo
7. Watch upload progress indicator
8. Verify success haptic feedback
```

**Expected Results**:
- ✅ Camera opens successfully
- ✅ Photo captured
- ✅ Upload progress shows (0% → 100%)
- ✅ Profile picture updates immediately
- ✅ Vibration feedback on success
- ✅ Image appears in Cloudinary dashboard (rork-app/profiles/)

**Verify in Cloudinary**:
1. Go to https://cloudinary.com/console/media_library
2. Navigate to: `rork-app/profiles/`
3. Find uploaded image with user ID in filename
4. Verify transformations:
   - Circular crop (300x300px)
   - Format: auto (jpg/webp)
   - Quality: auto

---

### Test 1.2: Upload from Gallery

**Steps**:
```bash
1. Open Profile tab
2. Tap profile picture
3. Select "Choose from Library" option
4. Grant photo library permission if prompted
5. Select an existing photo
6. Watch upload progress
7. Verify profile picture updates
```

**Expected Results**:
- ✅ Photo picker opens
- ✅ Can select existing photo
- ✅ Upload completes successfully
- ✅ Profile picture updates
- ✅ Image stored in Cloudinary

---

### Test 1.3: Error Handling

**Test 1.3a: Permission Denied**:
```bash
1. Deny camera/library permission
2. Try to upload
3. Should show permission error alert
```

**Test 1.3b: Network Failure**:
```bash
1. Turn off WiFi/data
2. Try to upload photo
3. Should show "Upload Failed" error
4. Re-enable network
5. Try again - should succeed
```

**Test 1.3c: Large File**:
```bash
1. Select very large image (>10MB)
2. Upload should auto-compress
3. Verify upload succeeds
4. Check Cloudinary - should be optimized
```

---

## Test Suite 2: Studio Video Upload

### Test 2.1: Record New Video

**Steps**:
```bash
1. Ensure user role is 'TALENT' (Studio is talent-only)
2. Open Studio tab
3. Tap "Create Video" tab
4. Tap "Record Video" button
5. Grant camera/microphone permissions if prompted
6. Record 10-15 second video
7. Stop recording
8. Trim video if needed (trim bar at bottom)
9. Apply filter (optional): Neon Glitch, Afterhours Noir, etc.
10. Add sticker (optional): Get Tickets, Join Lobby, etc.
11. Tap "Share" button
12. Add video title (required)
13. Select venue from dropdown
14. Tap "Post to Feed" button
15. Watch two-stage upload process:
    - Stage 1: "Uploading X%" (Cloudinary)
    - Stage 2: "Posting to Feed..." (Backend)
16. Verify success alert appears
17. Tap "View Feed" to see video
```

**Expected Results**:
- ✅ Camera opens with recording UI
- ✅ Video records for max 15 seconds
- ✅ Trim controls work
- ✅ Filters apply correctly
- ✅ Stickers position correctly
- ✅ Upload shows progress: "Uploading 30%" → "Uploading 100%"
- ✅ Posting shows: "Posting to Feed..."
- ✅ Success alert with options
- ✅ Video appears in feed with Cloudinary URL
- ✅ Video plays correctly in feed
- ✅ Haptic feedback on interactions

**Verify in Cloudinary**:
1. Navigate to: `rork-app/highlights/`
2. Find uploaded video
3. Verify transformations:
   - Aspect ratio: 9:16 (720x1280)
   - Format: mp4
   - Codec: H.264
   - Max file size: 50MB
   - Thumbnail auto-generated

---

### Test 2.2: Upload Existing Video

**Steps**:
```bash
1. Open Studio tab
2. Tap "Create Video" tab
3. Tap "Upload Existing" button
4. Select video from gallery (max 15 seconds)
5. Video loads in editor
6. Follow steps 8-17 from Test 2.1
```

**Expected Results**:
- ✅ Gallery opens
- ✅ Can select video
- ✅ Video loads in editor
- ✅ Same customization and upload flow works
- ✅ Video appears in feed

---

### Test 2.3: Validation & Error Handling

**Test 2.3a: No Title**:
```bash
1. Record/upload video
2. Don't add title
3. Tap "Post to Feed"
4. Should show: "Title Required"
```

**Test 2.3b: No Authentication**:
```bash
1. Sign out
2. Try to post video
3. Should show: "Authentication Required"
```

**Test 2.3c: Network Failure**:
```bash
1. Record video
2. Add title and venue
3. Turn off network
4. Tap "Post to Feed"
5. Should show: "Upload Failed"
6. Re-enable network
7. Try again - should succeed
```

**Test 2.3d: Large Video File**:
```bash
1. Upload 4K video (>50MB)
2. Upload should succeed
3. Backend auto-compresses to 720x1280
4. Verify in Cloudinary - should be compressed
```

---

## Test Suite 3: Location-Based Memories

### Test 3.1: Success Flow (At Venue)

**Prerequisites**:
- Must be within 500 meters of a venue
- OR temporarily modify code for testing (see Test 3.4)

**Steps**:
```bash
1. Go to a venue (or within 500m of one)
2. Open Profile tab
3. Scroll to "My Memories" section
4. Tap "Capture Memory" button
5. Grant location permission when prompted:
   - iOS: "Allow While Using App"
   - Android: "Allow"
6. Wait for GPS lock (2-5 seconds)
7. See "Detecting Location..." loading indicator
8. If within 500m:
   ✅ Modal opens with detected venue info
   ✅ Camera opens automatically
9. Take a live photo
10. Watch upload progress
11. Add caption (max 200 characters)
12. Tap "Save Memory"
13. Memory appears in grid with venue name
```

**Expected Results**:
- ✅ Location permission requested
- ✅ GPS lock acquired (high accuracy)
- ✅ Loading indicator shows during detection
- ✅ Nearest venue detected
- ✅ Distance calculated correctly
- ✅ Modal shows detected venue with distance (e.g., "127m away")
- ✅ Camera opens (NOT gallery)
- ✅ Photo uploads to Cloudinary
- ✅ Caption input works (character counter)
- ✅ Memory saved with auto-detected venue
- ✅ Memory appears in 3x2 photo grid
- ✅ Venue name overlay on photo

**Verify in Cloudinary**:
1. Navigate to: `rork-app/memories/`
2. Find uploaded photo
3. Verify stored correctly

---

### Test 3.2: Too Far From Venue

**Steps**:
```bash
1. Be more than 500 meters from any venue
2. Tap "Capture Memory"
3. Grant location permission
4. Wait for GPS lock
5. Alert should appear
```

**Expected Results**:
- ✅ Alert title: "Not at a Venue"
- ✅ Alert message shows:
  - Distance to nearest venue (e.g., "850m away")
  - Venue name
  - Instruction: "Get closer to capture this memory!"
- ✅ No modal opens
- ✅ No camera opens
- ✅ No memory created

---

### Test 3.3: Permission Denied

**Steps**:
```bash
1. Deny location permission
2. Tap "Capture Memory"
3. Alert appears
```

**Expected Results**:
- ✅ Alert title: "Location Permission Required"
- ✅ Alert message: "We need your location to verify you're at a venue to capture this memory."
- ✅ No modal opens
- ✅ Can retry by going to app settings

---

### Test 3.4: Testing with Mock Location (Development)

If you're not near a venue, temporarily modify the code for testing:

**Option A: Increase Distance Threshold**:
```typescript
// In profile.tsx, line ~520
// Change from 0.5km to 5.0km temporarily
if (!nearestVenue || nearestVenue.distance > 5.0) { // Changed from 0.5
  // This allows testing from anywhere
}
```

**Option B: Use Mock Coordinates**:
```typescript
// In profile.tsx, after line ~510
// Replace actual GPS with mock location near a venue
const location = {
  coords: {
    latitude: 40.7589,  // Replace with coordinates near your test venue
    longitude: -73.9851,
  }
};
```

**Remember to revert these changes before production!**

---

### Test 3.5: Camera Permission Handling

**Steps**:
```bash
1. Be at a venue (location verified)
2. Location detected successfully
3. Modal opens
4. Camera tries to open
5. Deny camera permission
```

**Expected Results**:
- ✅ Error shown by upload hook
- ✅ Modal stays open
- ✅ Can retry camera access
- ✅ Can grant permission and retry

---

### Test 3.6: Multiple Memories

**Steps**:
```bash
1. Capture first memory at venue
2. Move to different venue (or wait)
3. Capture second memory
4. Repeat for 3-6 memories
```

**Expected Results**:
- ✅ Each memory saves with correct venue
- ✅ Photo grid shows up to 6 memories
- ✅ Newest memories appear first
- ✅ Each photo has venue name overlay
- ✅ Gradient overlay on photos for readability

---

### Test 3.7: Empty State

**Steps**:
```bash
1. New user with no memories
2. Navigate to Profile → My Memories
```

**Expected Results**:
- ✅ Camera icon (📷) displayed
- ✅ Text: "No memories yet"
- ✅ Subtext: "Visit a venue and capture live moments with your camera"
- ✅ Button: "📷 Capture Memory"
- ✅ Button works same as header "Add" button

---

## Cross-Feature Integration Tests

### Test 4.1: All Uploads in Sequence

**Steps**:
```bash
1. Upload profile picture from camera
2. Record and upload Studio video
3. Capture location-based memory
4. Verify all three uploads succeeded
5. Check Cloudinary for all three files
```

**Expected Results**:
- ✅ All uploads complete successfully
- ✅ No conflicts between upload hooks
- ✅ All images/videos appear in correct locations
- ✅ App performance remains smooth

---

### Test 4.2: Concurrent Upload Handling

**Steps**:
```bash
1. Start profile picture upload
2. While uploading, try to start Studio video upload
3. Verify both handle correctly
```

**Expected Results**:
- ✅ Each upload hook manages its own state
- ✅ No conflicts or crashes
- ✅ Both complete successfully

---

### Test 4.3: Offline → Online Transition

**Steps**:
```bash
1. Start with offline mode
2. Try to upload (should fail gracefully)
3. Enable network
4. Retry upload
5. Verify success
```

**Expected Results**:
- ✅ Offline uploads show error
- ✅ Error messages clear and actionable
- ✅ Retry works when online
- ✅ No data corruption

---

## Performance Tests

### Test 5.1: Upload Speed

**Measure**:
- Profile picture (1-3MB): Should complete in 2-5 seconds
- Studio video (10-50MB): Should complete in 10-30 seconds
- Memory photo (1-3MB): Should complete in 2-5 seconds

---

### Test 5.2: Memory Usage

**Monitor**:
- App should not crash with large files
- Memory should release after upload completes
- No memory leaks from repeated uploads

---

### Test 5.3: Battery Impact

**Monitor**:
- GPS usage should stop after venue detection
- Camera should close after photo taken
- Background processes should not drain battery

---

## Security Tests

### Test 6.1: Authentication

**Verify**:
- ✅ All uploads require valid JWT token
- ✅ Expired tokens show "Authentication Required"
- ✅ Uploads fail gracefully without auth

---

### Test 6.2: Location Privacy

**Verify**:
- ✅ Location only accessed when user taps "Capture Memory"
- ✅ Location permission requested explicitly
- ✅ User can deny without app crash
- ✅ Location not tracked in background

---

### Test 6.3: Upload Security

**Verify**:
- ✅ Files upload to correct Cloudinary folders
- ✅ File URLs are secure (HTTPS)
- ✅ No sensitive data in filenames
- ✅ User can only access own uploads

---

## Checklist Summary

### Profile Picture Upload
- [ ] Upload from camera works
- [ ] Upload from gallery works
- [ ] Progress indicator shows
- [ ] Profile updates immediately
- [ ] Image appears in Cloudinary
- [ ] Error handling works
- [ ] Permissions handled correctly

### Studio Video Upload
- [ ] Record video works
- [ ] Upload existing video works
- [ ] Trim controls work
- [ ] Filters apply
- [ ] Stickers position correctly
- [ ] Two-stage upload shows progress
- [ ] Video appears in feed
- [ ] Video plays correctly
- [ ] Title validation works
- [ ] Auth check works
- [ ] Large files compress

### Location-Based Memories
- [ ] Location permission requested
- [ ] GPS detection works
- [ ] Distance calculated correctly
- [ ] 500m verification works
- [ ] Too far alert shows distance
- [ ] Camera opens (not gallery)
- [ ] Photo uploads
- [ ] Caption input works (200 chars)
- [ ] Venue auto-detected and displayed
- [ ] Memory appears in grid
- [ ] Empty state displays correctly
- [ ] Multiple memories work

### Integration
- [ ] All three uploads work in sequence
- [ ] No conflicts between uploads
- [ ] Offline/online transitions work
- [ ] App performance is smooth
- [ ] Memory usage acceptable
- [ ] Battery usage acceptable
- [ ] All files in Cloudinary

---

## Troubleshooting

### Issue: "Location Permission Required" on iOS
**Fix**: Go to Settings → Rork App → Location → Allow While Using App

### Issue: GPS not acquiring lock
**Fix**:
- Go outside or near window
- Ensure Location Services enabled in device settings
- Wait up to 10 seconds for initial GPS lock

### Issue: "Upload Failed" repeatedly
**Fix**:
- Check backend is running (http://localhost:5000)
- Verify Cloudinary credentials in backend `.env`
- Check network connection
- Verify user is authenticated (sign in again)

### Issue: Video won't upload
**Fix**:
- Verify user role is 'TALENT' (Studio is talent-only)
- Check video file size (<100MB)
- Ensure title is entered
- Verify venue selected

### Issue: Camera won't open
**Fix**:
- Grant camera permission in device settings
- Restart app
- Check device has working camera

### Issue: Mock venues not appearing
**Fix**:
- Verify mockVenues data in profile.tsx
- Check venue coordinates are valid
- Test with mock location (see Test 3.4)

---

## Success Criteria

All upload features are working correctly when:

**Profile Picture**:
✅ Can upload from camera and gallery
✅ Progress shows during upload
✅ Profile updates immediately
✅ Images stored in Cloudinary

**Studio Videos**:
✅ Can record and upload videos
✅ Customization (filters, stickers) works
✅ Two-stage upload with progress
✅ Videos appear in feed and play

**Location Memories**:
✅ GPS detection works accurately
✅ 500m proximity enforced
✅ Camera-only (no gallery)
✅ Venue auto-detected
✅ Photos stored with location data

**Overall**:
✅ No crashes or errors
✅ Good performance
✅ Intuitive user experience
✅ All uploads reach Cloudinary
✅ Backend receives correct metadata

---

## Next Steps After Testing

Once all tests pass:
1. Configure production environment variables
2. Deploy backend to production server
3. Build production mobile app
4. Submit to app stores (iOS App Store, Google Play)

---

## Documentation References

- Profile Picture Upload: See `/PROFILE_PICTURE_UPLOAD_COMPLETE.md`
- Studio Video Upload: See `/STUDIO_VIDEO_UPLOAD_COMPLETE.md`
- Location Memories: See `/LOCATION_MEMORIES_COMPLETE.md`
- Backend Setup: See `/BACKEND_SETUP.md`
- Cloudinary Setup: See `/CLOUDINARY_SETUP.md`

---

**Last Updated**: Session continuation
**Status**: All upload features implemented and ready for testing
**App Completion**: ~95-97%
