# Cloudinary Setup - Quick Checklist

Use this checklist to track your Cloudinary setup progress.

---

## ✅ What You Get (Free Forever)

- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Transformations**: 25,000/month
- **Videos**: Unlimited processing
- **No credit card required**

---

## 📋 Setup Steps (10 Minutes)

### Step 1: Create Cloudinary Account
- [ ] Go to https://cloudinary.com/users/register/free
- [ ] Sign up with email or OAuth (Google/GitHub)
- [ ] Verify email address
- [ ] Complete company profile: "Rork Nightlife"

**Time**: 2 minutes

---

### Step 2: Get API Credentials
- [ ] Log into Cloudinary Dashboard
- [ ] Find credentials at top of dashboard:
  - [ ] **Cloud Name**: `xxxxxx`
  - [ ] **API Key**: `123456789012345`
  - [ ] **API Secret**: `abcDEF123ghi456` ⚠️ Keep secret!
- [ ] Copy all three values to clipboard/notepad

**Where to find**:
```
Dashboard → Top section with "Account Details"
```

**Time**: 1 minute

---

### Step 3: Create Upload Preset
- [ ] Click ⚙️ (Settings) in top right
- [ ] Select "Upload" tab from left sidebar
- [ ] Scroll to "Upload presets" section
- [ ] Click "Add upload preset"

**Configure Preset**:
- [ ] **Preset name**: `rork-mobile`
- [ ] **Signing Mode**: `Unsigned` (important!)
- [ ] **Folder**: `rork-app/`
- [ ] **Access Mode**: `Public`
- [ ] Click "Save"

**Why Unsigned?**: Allows mobile app to upload directly without backend signatures

**Time**: 2 minutes

---

### Step 4: Configure Backend Environment
- [ ] Open `backend/.env` file
- [ ] Update Cloudinary variables:
  ```bash
  CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
  CLOUDINARY_API_KEY=your_actual_api_key
  CLOUDINARY_API_SECRET=your_actual_api_secret
  CLOUDINARY_UPLOAD_PRESET=rork-mobile
  ```
- [ ] Save file

**Time**: 1 minute

---

### Step 5: Test Backend Integration
- [ ] Restart backend server:
  ```bash
  cd backend
  npm start
  ```
- [ ] Verify server starts without errors
- [ ] Check console shows "File Uploads /api/upload"

**Time**: 1 minute

---

### Step 6: Test Upload Endpoint
- [ ] Create test image file or download one
- [ ] Test upload with curl:
  ```bash
  # First, get an access token by signing in
  curl -X POST http://localhost:3000/api/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"email":"your-test-email@example.com","password":"your-password"}'

  # Copy the accessToken from response

  # Then test upload (replace YOUR_TOKEN and path/to/image.jpg)
  curl -X POST http://localhost:3000/api/upload/profile-picture \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -F "image=@path/to/image.jpg"
  ```
- [ ] Should return success with Cloudinary URL

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/your-cloud/image/upload/...",
    "publicId": "rork-app/users/profiles/user-xxx",
    "width": 500,
    "height": 500,
    "format": "jpg"
  }
}
```

**Time**: 2 minutes

---

### Step 7: Verify Upload in Cloudinary Dashboard
- [ ] Go to Cloudinary Dashboard
- [ ] Click "Media Library" in left sidebar
- [ ] Navigate to folder: `rork-app/users/profiles/`
- [ ] Verify your test image appears
- [ ] Click on image to see transformations

**Time**: 1 minute

---

## ✅ Success Criteria

You'll know setup is complete when:

- [ ] Backend starts with no Cloudinary errors
- [ ] `/api/upload/profile-picture` endpoint responds
- [ ] Uploaded files appear in Cloudinary dashboard
- [ ] Image URLs work in browser
- [ ] Transformations are applied (500x500 for profile pics)

---

## 📁 Folder Structure (Auto-Created)

Cloudinary will automatically create these folders on first upload:

```
rork-app/
├── users/
│   └── profiles/          ← Profile pictures
├── venues/
│   └── photos/            ← Venue photos
├── highlights/
│   ├── 2026/
│   │   ├── 01/           ← Highlight videos by month
│   │   └── 02/
└── memories/
    └── photos/            ← Memory photos
```

---

## 🔧 Available Upload Endpoints

### 1. Profile Picture
```bash
POST /api/upload/profile-picture
Content-Type: multipart/form-data
Authorization: Bearer {token}
Body: image (file)

Max Size: 10MB
Transformation: 500x500 crop to face
```

### 2. Highlight Video
```bash
POST /api/upload/highlight
Content-Type: multipart/form-data
Authorization: Bearer {token}
Body: video (file)

Max Size: 50MB
Max Duration: 15 seconds
Transformation: 720x1280 compressed
```

### 3. Memory Photo
```bash
POST /api/upload/memory
Content-Type: multipart/form-data
Authorization: Bearer {token}
Body: image (file)

Max Size: 15MB
Transformation: Max 1920x1920
```

### 4. Venue Photo
```bash
POST /api/upload/venue
Content-Type: multipart/form-data
Authorization: Bearer {token}
Body: image (file), venueId (string)

Max Size: 10MB
Transformation: 1920x1080
```

### 5. Delete Asset
```bash
DELETE /api/upload/:publicId?resourceType=image
Authorization: Bearer {token}

Example: DELETE /api/upload/rork-app/users/profiles/user-123?resourceType=image
```

---

## 🛡️ Security Features

✅ **Implemented**:
- Authentication required for all uploads
- Rate limiting (10 uploads per 15 minutes)
- File type validation (images/videos only)
- File size limits
- API secret never exposed to frontend

---

## 📊 Monitor Usage

### Check Current Usage:
1. Go to: https://cloudinary.com/console
2. View "Dashboard" tab
3. See usage statistics:
   - Storage used / 25 GB
   - Bandwidth used / 25 GB
   - Transformations used / 25,000

### Set Up Alerts:
- [ ] Click your name (top right)
- [ ] Go to "Settings" → "Notifications"
- [ ] Enable "Usage limit alerts"
- [ ] Set threshold at 80%

---

## 🐛 Troubleshooting

### "Upload failed: Invalid credentials"
**Solution**:
1. Verify credentials in `.env` match Cloudinary dashboard
2. Restart backend server after changing `.env`
3. Check no extra spaces in credential values

### "File too large"
**Solution**:
1. Profile pictures: Max 10MB
2. Videos: Max 50MB
3. Compress files before uploading
4. Check `Content-Length` header

### "Transformation not applied"
**Solution**:
1. Check transformation syntax in controller
2. Use eager transformations for immediate processing
3. Transformations may take a few seconds to generate

### "Authentication required"
**Solution**:
1. Include `Authorization: Bearer {token}` header
2. Get fresh token from `/api/auth/signin`
3. Token expires after 7 days

---

## 📈 Next Steps

Once Cloudinary is working:

### 1. Frontend Integration (30 min)
- [ ] Install `expo-image-picker`
- [ ] Install `react-native-compressor`
- [ ] Create upload service in frontend
- [ ] Test uploads from mobile app

### 2. Additional Features (Optional)
- [ ] Video thumbnails
- [ ] Image filters/effects
- [ ] Auto-tagging with AI
- [ ] Face detection for profile crops
- [ ] Background removal

### 3. Production Optimization
- [ ] Set up CDN caching
- [ ] Enable auto-format (WebP/AVIF)
- [ ] Configure lazy loading
- [ ] Set up backup policies

---

## 🎉 Completion Status

**Overall**: Setup takes ~10 minutes

### Checklist Summary:
- [ ] Step 1: Create account (2 min)
- [ ] Step 2: Get credentials (1 min)
- [ ] Step 3: Create upload preset (2 min)
- [ ] Step 4: Configure backend (1 min)
- [ ] Step 5: Test backend (1 min)
- [ ] Step 6: Test upload (2 min)
- [ ] Step 7: Verify in dashboard (1 min)

---

## 📚 Resources

- **Dashboard**: https://cloudinary.com/console
- **Documentation**: https://cloudinary.com/documentation
- **Node.js SDK**: https://cloudinary.com/documentation/node_integration
- **React Native**: https://cloudinary.com/documentation/react_native_integration
- **Support**: https://support.cloudinary.com

---

**Ready?** Start with Step 1! 🚀

You can complete this while waiting for MongoDB Atlas deployment (they're independent).
