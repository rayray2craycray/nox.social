# Cloudinary Setup Guide

## Overview

Cloudinary is a cloud-based media management service for uploading, storing, transforming, and delivering images and videos. Perfect for the Rork Nightlife app's highlight videos, memory photos, venue images, and user profile pictures.

---

## Step 1: Create Cloudinary Account

1. **Visit Cloudinary**
   - Go to: https://cloudinary.com/users/register/free
   - Or: https://cloudinary.com → Click "Sign Up"

2. **Sign Up**
   - Email & password OR Sign up with Google/GitHub
   - Verify your email address

3. **Complete Setup**
   - Company/Project Name: "Rork Nightlife"
   - Use case: "Mobile App"
   - Primary media: "Videos and Images"

---

## Step 2: Get API Credentials

### Dashboard Overview

After logging in, you'll see your dashboard with:

1. **Cloud Name**: `your-cloud-name`
   - Example: `rork-nightlife` or `dx3kl5abc`
   - This is unique to your account

2. **API Key**: `123456789012345`
   - Public identifier

3. **API Secret**: `abcd1234EFGH5678` ⚠️ KEEP SECRET
   - Never expose in frontend code!

4. **Copy All Three**
   - You'll need all three values for backend integration

---

## Step 3: Configure Upload Presets

Upload presets define default settings for uploads.

### Create Unsigned Preset (Mobile App Direct Uploads)

1. **Navigate to Settings**
   - Click ⚙️ icon (Settings) in top right
   - Select "Upload" tab from left sidebar

2. **Scroll to Upload Presets**
   - Click "Add upload preset"

3. **Configure Preset**
   - **Preset name**: `rork-mobile`
   - **Signing Mode**: "Unsigned" (allows direct uploads from mobile)
   - **Folder**: `rork-app/` (organizes all app uploads)
   - **Access Mode**: "Public" (users can view without authentication)

4. **Additional Settings**

   **For Images** (profile pictures, memory photos):
   - **Format**: Auto
   - **Quality**: Auto
   - **Transformation**: Eager transformations:
     - Thumbnail: `w_200,h_200,c_fill,g_face`
     - Medium: `w_800,h_800,c_limit,q_auto`
     - Large: `w_1920,h_1920,c_limit,q_auto`

   **For Videos** (highlights):
   - **Resource Type**: Video
   - **Format**: mp4
   - **Quality**: auto
   - **Video Codec**: h264
   - **Transformation**: Eager transformations:
     - Thumbnail: `w_400,h_400,c_fill,g_center,f_jpg`
     - Compressed: `w_720,h_1280,c_fit,q_auto,vc_h264`

5. **Click "Save"**

---

## Step 4: Create Folders for Organization

### Folder Structure (Recommended)

```
rork-app/
├── users/
│   ├── profiles/
│   └── covers/
├── venues/
│   ├── photos/
│   └── logos/
├── highlights/
│   └── 2026/
│       ├── 01/
│       ├── 02/
│       └── ...
├── memories/
│   ├── photos/
│   └── videos/
├── events/
│   └── posters/
└── performers/
    └── photos/
```

Folders are created automatically on first upload to that path.

---

## Step 5: Backend Integration

### 1. Install Cloudinary SDK

```bash
cd backend
npm install cloudinary
```

### 2. Update `.env`

Add to `/backend/.env`:

```bash
# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcd1234EFGH5678
CLOUDINARY_UPLOAD_PRESET=rork-mobile
```

### 3. Create Cloudinary Config

Create `/backend/config/cloudinary.ts`:

```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

// Helper functions
export const uploadImage = async (
  fileBuffer: Buffer,
  options: {
    folder?: string;
    publicId?: string;
    transformation?: any[];
  } = {}
) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'rork-app',
        public_id: options.publicId,
        transformation: options.transformation,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export const uploadVideo = async (
  fileBuffer: Buffer,
  options: {
    folder?: string;
    publicId?: string;
    transformation?: any[];
  } = {}
) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'rork-app/highlights',
        public_id: options.publicId,
        transformation: options.transformation,
        resource_type: 'video',
        eager: [
          { width: 720, height: 1280, crop: 'fit', quality: 'auto', video_codec: 'h264' },
          { width: 400, height: 400, crop: 'fill', gravity: 'center', format: 'jpg' },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export const deleteAsset = async (publicId: string, resourceType: 'image' | 'video' = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

export const generateTransformationUrl = (
  publicId: string,
  transformation: any[],
  resourceType: 'image' | 'video' = 'image'
) => {
  return cloudinary.url(publicId, {
    transformation,
    resource_type: resourceType,
    secure: true,
  });
};
```

### 4. Create Upload API Endpoint

Create `/backend/routes/upload.routes.ts`:

```typescript
import express from 'express';
import multer from 'multer';
import { uploadImage, uploadVideo } from '../config/cloudinary';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Upload profile picture
router.post('/profile-picture', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const result = await uploadImage(req.file.buffer, {
      folder: 'rork-app/users/profiles',
      publicId: `user-${req.user.id}`,
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'face' },
      ],
    });

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        thumbnail: result.eager[0]?.secure_url,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: 'Upload failed' });
  }
});

// Upload highlight video
router.post('/highlight', authMiddleware, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Check file size (max 50MB for highlights)
    if (req.file.size > 50 * 1024 * 1024) {
      return res.status(400).json({ success: false, error: 'Video too large (max 50MB)' });
    }

    const result = await uploadVideo(req.file.buffer, {
      folder: `rork-app/highlights/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      publicId: `highlight-${Date.now()}-${req.user.id}`,
    });

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        thumbnail: result.eager[1]?.secure_url, // Second eager transformation is thumbnail
        duration: result.duration,
        format: result.format,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: 'Upload failed' });
  }
});

// Upload memory photo
router.post('/memory', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const result = await uploadImage(req.file.buffer, {
      folder: 'rork-app/memories/photos',
      transformation: [
        { width: 1920, height: 1920, crop: 'limit', quality: 'auto' },
      ],
    });

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: 'Upload failed' });
  }
});

export default router;
```

### 5. Add Multer Dependency

```bash
npm install multer @types/multer
```

### 6. Register Route in Server

In `/backend/server.ts`:

```typescript
import uploadRoutes from './routes/upload.routes';

app.use('/api/upload', uploadRoutes);
```

---

## Step 6: Frontend Integration

### 1. Install Dependencies

```bash
cd /Users/rayan/rork-nightlife-app
npm install expo-image-picker react-native-compressor
```

### 2. Create Upload Service

Create `/services/upload.service.ts`:

```typescript
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native-compressor';
import { Video } from 'react-native-compressor';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = __DEV__
  ? Platform.OS === 'android'
    ? 'http://10.0.2.2:3000'
    : 'http://localhost:3000'
  : 'https://api.rork.app';

export const pickImage = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status !== 'granted') {
    alert('Sorry, we need camera roll permissions to upload photos!');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled && result.assets[0]) {
    return result.assets[0].uri;
  }

  return null;
};

export const pickVideo = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status !== 'granted') {
    alert('Sorry, we need camera roll permissions to upload videos!');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    allowsEditing: true,
    quality: 0.8,
    videoMaxDuration: 15, // 15 seconds for highlights
  });

  if (!result.canceled && result.assets[0]) {
    return result.assets[0].uri;
  }

  return null;
};

export const uploadProfilePicture = async (uri: string, accessToken: string) => {
  try {
    // Compress image
    const compressedUri = await Image.compress(uri, {
      compressionMethod: 'auto',
      maxWidth: 1000,
      maxHeight: 1000,
      quality: 0.8,
    });

    // Create form data
    const formData = new FormData();
    formData.append('image', {
      uri: compressedUri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    } as any);

    const response = await fetch(`${API_BASE_URL}/api/upload/profile-picture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    return result.data;
  } catch (error) {
    console.error('Profile picture upload error:', error);
    throw error;
  }
};

export const uploadHighlightVideo = async (uri: string, accessToken: string) => {
  try {
    // Compress video
    const compressedUri = await Video.compress(uri, {
      compressionMethod: 'auto',
      maxSize: 720,
      minimumFileSizeForCompress: 0,
    });

    // Create form data
    const formData = new FormData();
    formData.append('video', {
      uri: compressedUri,
      type: 'video/mp4',
      name: 'highlight.mp4',
    } as any);

    const response = await fetch(`${API_BASE_URL}/api/upload/highlight`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    return result.data;
  } catch (error) {
    console.error('Highlight upload error:', error);
    throw error;
  }
};

export const uploadMemoryPhoto = async (uri: string, accessToken: string) => {
  try {
    // Compress image
    const compressedUri = await Image.compress(uri, {
      compressionMethod: 'auto',
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.9,
    });

    // Create form data
    const formData = new FormData();
    formData.append('image', {
      uri: compressedUri,
      type: 'image/jpeg',
      name: 'memory.jpg',
    } as any);

    const response = await fetch(`${API_BASE_URL}/api/upload/memory`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    return result.data;
  } catch (error) {
    console.error('Memory photo upload error:', error);
    throw error;
  }
};
```

### 3. Example Usage in Component

```typescript
import { uploadProfilePicture, pickImage } from '@/services/upload.service';
import { useAuth } from '@/contexts/AuthContext';

function ProfileScreen() {
  const { accessToken } = useAuth();

  const handleUploadProfilePicture = async () => {
    try {
      const imageUri = await pickImage();
      if (!imageUri) return;

      const result = await uploadProfilePicture(imageUri, accessToken!);

      console.log('Uploaded successfully:', result.url);
      // Update user profile with result.url
    } catch (error) {
      alert('Upload failed. Please try again.');
    }
  };

  return (
    <TouchableOpacity onPress={handleUploadProfilePicture}>
      <Text>Upload Profile Picture</Text>
    </TouchableOpacity>
  );
}
```

---

## Step 7: Free Tier Limits

### What's Included (Forever Free)

- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Transformations**: 25 credits/month (1 credit = 1,000 transformations)
- **Videos**: Unlimited (up to 10 seconds each)

### When to Upgrade

Upgrade when you hit any limit:
- **Plus Plan**: $89/month
  - 99 GB storage
  - 99 GB bandwidth
  - 100,000 transformations

### Cost Optimization Tips

1. **Use Eager Transformations**: Pre-generate common sizes
2. **Enable Auto Format**: Serves WebP/AVIF to supported browsers
3. **Lazy Loading**: Only load images when needed
4. **Compress Before Upload**: Use client-side compression
5. **Delete Unused Assets**: Clean up old files regularly

---

## Step 8: Security Best Practices

### 1. Never Expose API Secret in Frontend

✅ **Correct** (Backend only):
```typescript
// backend/config/cloudinary.ts
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // ✅ Safe in backend
});
```

❌ **Wrong** (Never do this):
```typescript
// frontend - NEVER DO THIS!
const cloudinary = {
  apiSecret: 'abcd1234EFGH5678', // ❌ Exposed to users!
};
```

### 2. Use Upload Presets for Mobile

- Create unsigned presets for direct uploads
- Configure limits (max file size, allowed formats)
- Set default transformations

### 3. Validate Uploads on Backend

```typescript
router.post('/upload', async (req, res) => {
  // Check file size
  if (req.file.size > 10 * 1024 * 1024) {
    return res.status(400).json({ error: 'File too large' });
  }

  // Check file type
  if (!req.file.mimetype.startsWith('image/')) {
    return res.status(400).json({ error: 'Invalid file type' });
  }

  // Continue with upload...
});
```

### 4. Implement Rate Limiting

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 uploads per window
  message: 'Too many uploads, please try again later',
});

app.use('/api/upload', uploadLimiter, uploadRoutes);
```

---

## Step 9: Monitor Usage

### Dashboard Metrics

1. **Navigate to Dashboard**
   - Check current usage vs limits
   - Monitor bandwidth consumption
   - Track transformation credits

2. **Set Up Alerts** (Paid plans)
   - Alert when approaching limits
   - Email notifications
   - Slack/webhook integration

3. **Analyze Reports**
   - Most accessed assets
   - Popular transformations
   - Storage breakdown by folder

---

## Troubleshooting

### Upload Fails with 401 Unauthorized

**Problem**: Invalid credentials

**Solutions**:
1. Verify `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET`
2. Check `.env` is loaded (`dotenv.config()`)
3. Restart server after changing `.env`

### Upload Fails with 413 Payload Too Large

**Problem**: File size exceeds server limit

**Solutions**:
1. Compress image/video before upload
2. Increase server body limit:
   ```typescript
   app.use(express.json({ limit: '50mb' }));
   app.use(express.urlencoded({ limit: '50mb', extended: true }));
   ```

### Transformations Not Applied

**Problem**: Image shows original, not transformed

**Solutions**:
1. Check transformation syntax
2. Use eager transformations for immediate processing
3. Verify transformation is valid in Cloudinary docs

---

## Next Steps

✅ Cloudinary is now set up!

Continue to:
1. [Environment Variables](./ENVIRONMENT_VARIABLES.md) - Complete all config
2. [Backend Auth API](./BACKEND_AUTH_SETUP.md) - Implement auth endpoints
3. [Replace 'user-me'](./REPLACE_USER_ME.md) - Use real auth everywhere

---

**Resources**:
- Cloudinary Docs: https://cloudinary.com/documentation
- Node.js SDK: https://cloudinary.com/documentation/node_integration
- React Native Guide: https://cloudinary.com/documentation/react_native_integration

---

**Last Updated**: 2026-01-18
