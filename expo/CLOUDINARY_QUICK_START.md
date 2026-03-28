# Cloudinary Account Setup - Quick Start

Get your Cloudinary credentials in 10 minutes.

---

## Step 1: Create Account (2 minutes)

1. **Go to Cloudinary**
   ```
   https://cloudinary.com/users/register/free
   ```

2. **Sign up**
   - Use email + password, OR
   - Sign up with Google/GitHub (faster)

3. **Verify email** (if using email signup)
   - Check inbox
   - Click verification link

4. **Complete profile** (optional)
   - Company: "Rork Nightlife"
   - Use case: "Mobile App"
   - Media type: "Videos and Images"

✅ **Done!** You'll be redirected to the dashboard.

---

## Step 2: Get Credentials (1 minute)

After signing in, you'll see your dashboard with a big box at the top showing:

```
╔══════════════════════════════════════════╗
║ Account Details                          ║
║                                          ║
║ Cloud name:    dx3kl5abc                ║  ← Copy this
║ API Key:       123456789012345          ║  ← Copy this
║ API Secret:    abc123DEF456ghi789       ║  ← Copy this
║                                          ║
║ [Show API Secret] ← Click to reveal     ║
╚══════════════════════════════════════════╝
```

**Copy all three values**:
1. Cloud name (example: `dx3kl5abc` or `rork-nightlife`)
2. API Key (numbers: `123456789012345`)
3. API Secret (click "Show API Secret" first)

**Save them somewhere safe** (you'll need them in Step 4).

---

## Step 3: Create Upload Preset (2 minutes)

1. **Click ⚙️ (Settings)** in top right corner

2. **Click "Upload"** tab in left sidebar

3. **Scroll down** to "Upload presets" section

4. **Click "Add upload preset"** button

5. **Configure preset**:
   ```
   Preset name:     rork-mobile
   Signing Mode:    Unsigned        ← IMPORTANT!
   Folder:          rork-app/
   Access mode:     Public
   ```

6. **Click "Save"** at bottom

✅ **Done!** Preset created.

**Why "Unsigned"?** Allows mobile app to upload directly without backend signatures.

---

## Step 4: Update Backend .env (2 minutes)

1. **Open your backend .env file**:
   ```bash
   # On Mac/Linux
   nano backend/.env

   # Or use VS Code
   code backend/.env
   ```

2. **Find the Cloudinary section** (near bottom):
   ```bash
   # Cloudinary (Image/Video Uploads)
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name_here
   CLOUDINARY_API_KEY=your_cloudinary_api_key_here
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here
   CLOUDINARY_UPLOAD_PRESET=rork-mobile
   ```

3. **Replace with your actual values** from Step 2:
   ```bash
   # Example (use YOUR actual values!)
   CLOUDINARY_CLOUD_NAME=dx3kl5abc
   CLOUDINARY_API_KEY=123456789012345
   CLOUDINARY_API_SECRET=abc123DEF456ghi789
   CLOUDINARY_UPLOAD_PRESET=rork-mobile
   ```

4. **Save and close** the file (Ctrl+X, Y, Enter in nano)

✅ **Done!** Backend configured.

---

## Step 5: Restart Backend (1 minute)

```bash
# Stop current backend (Ctrl+C)
# Then restart:
cd backend
npm start
```

**Verify it starts successfully**. Look for:
```
╔════════════════════════════════════════════════╗
║   ✅ Core Features:                           ║
║   - File Uploads              /api/upload     ║  ← Should show this
╚════════════════════════════════════════════════╝
```

✅ **Done!** Backend ready.

---

## Step 6: Test Upload (3 minutes)

### Get Auth Token

```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"smoketest2@example.com","password":"test123456"}'
```

**Copy the `accessToken`** from response.

### Test Upload

```bash
# Replace YOUR_TOKEN with actual token
# Replace /path/to/image.jpg with actual image path

curl -X POST http://localhost:3000/api/upload/profile-picture \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg"
```

**Expected response**:
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/dx3kl5abc/image/upload/v1234567890/rork-app/users/profiles/user-123.jpg",
    "publicId": "rork-app/users/profiles/user-123",
    "width": 500,
    "height": 500,
    "format": "jpg"
  }
}
```

✅ **Success!** Upload works.

---

## Step 7: Verify in Cloudinary (1 minute)

1. **Go back to Cloudinary dashboard**
   ```
   https://cloudinary.com/console
   ```

2. **Click "Media Library"** in left sidebar

3. **Navigate to folder**: `rork-app` → `users` → `profiles`

4. **Verify your image appears**
   - Should show uploaded image
   - Click to see details
   - Copy URL and open in browser to verify

✅ **Done!** Everything working.

---

## ✅ Success Checklist

You're done when ALL are true:

- [ ] Cloudinary account created
- [ ] Three credentials copied (cloud name, API key, secret)
- [ ] Upload preset `rork-mobile` created (unsigned)
- [ ] Backend `.env` updated with real credentials
- [ ] Backend restarts successfully
- [ ] curl upload test returns success
- [ ] Image visible in Cloudinary dashboard
- [ ] Image URL works in browser

---

## 🎉 You're Ready!

**What you have now**:
- ✅ Cloudinary account (free 25 GB)
- ✅ Upload preset configured
- ✅ Backend connected to Cloudinary
- ✅ API tested and working
- ✅ Ready for mobile app integration

**Next step**: Integrate uploads in your mobile app!

See `UPLOAD_INTEGRATION_EXAMPLES.md` for code examples.

---

## 🐛 Quick Troubleshooting

### "Invalid API credentials"
- Check `.env` values match Cloudinary dashboard exactly
- Make sure no extra spaces
- API Secret might need to click "Show" first
- Restart backend after changing `.env`

### Upload returns 401
- Get fresh token (sign in again)
- Token expires after 7 days
- Check Authorization header format: `Bearer {token}`

### Image not in Cloudinary
- Wait 10 seconds (processing time)
- Refresh Media Library page
- Check correct cloud name in `.env`
- Verify curl returned `"success": true`

### Backend won't start
```bash
# Check for typos
cat backend/.env | grep CLOUDINARY

# Check server logs
npm start

# Look for error messages
```

---

## 💡 Pro Tips

### Tip 1: Save Credentials
Save your Cloudinary credentials in a password manager. You'll need them for production deployment.

### Tip 2: Test with Different Files
Try uploading:
- Small image (< 1 MB)
- Large image (5-10 MB)
- Different formats (JPG, PNG)
- Video (if testing video uploads)

### Tip 3: Check Usage
Monitor your usage in Cloudinary dashboard:
- Click your name (top right)
- Select "Usage"
- View storage, bandwidth, transformations

### Tip 4: Bookmark Media Library
```
https://cloudinary.com/console/media_library
```
You'll visit this often to check uploads.

---

## 📊 What's Next?

### Immediate (5-30 min)
1. Add upload button to Profile screen
2. Test on device (Expo Go)
3. Verify uploads work from phone

### Soon (1-2 hours)
1. Add highlight video capture to Studio
2. Add memory photo uploads
3. Test all upload types

### Later (production)
1. Set up MongoDB Atlas (15 min)
2. Configure production env vars (15 min)
3. Deploy backend (30 min)
4. Build mobile app (1 hour)

---

## 📚 Full Documentation

- **This Guide**: Quick start (10 min)
- **Complete Setup**: `CLOUDINARY_SETUP.md` (detailed)
- **Integration**: `UPLOAD_INTEGRATION_EXAMPLES.md` (code)
- **Backend**: `CLOUDINARY_INTEGRATION_COMPLETE.md` (API)
- **Checklist**: `CLOUDINARY_SETUP_CHECKLIST.md` (step-by-step)

---

## 🎯 Summary

**Total time**: ~10 minutes
**What you did**:
1. ✅ Created Cloudinary account
2. ✅ Got credentials
3. ✅ Created upload preset
4. ✅ Updated backend .env
5. ✅ Tested upload
6. ✅ Verified in dashboard

**Ready for**: Mobile app integration! 🚀

Start with: `UPLOAD_INTEGRATION_EXAMPLES.md`
