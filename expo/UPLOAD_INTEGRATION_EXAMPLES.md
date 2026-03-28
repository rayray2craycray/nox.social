# Upload Integration Examples

Complete examples for integrating file uploads in your app components.

---

## Quick Start

### 1. Import the Hook

```typescript
import { useUpload } from '@/hooks/useUpload';
import { useAuth } from '@/contexts/AuthContext';
```

### 2. Use in Component

```typescript
const MyComponent = () => {
  const upload = useUpload({
    onSuccess: (result) => {
      console.log('Upload successful:', result.url);
    },
    onError: (error) => {
      console.error('Upload failed:', error);
    },
  });

  return (
    <Button
      onPress={upload.uploadProfileFromGallery}
      disabled={upload.isUploading}
    >
      {upload.isUploading ? 'Uploading...' : 'Upload Photo'}
    </Button>
  );
};
```

---

## Example 1: Profile Picture Upload

### Component: ProfileEditScreen

```typescript
import React, { useState } from 'react';
import { View, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useUpload } from '@/hooks/useUpload';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileEditScreen() {
  const { user, updateProfile } = useAuth();
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profileImageUrl);

  const upload = useUpload({
    onSuccess: async (result) => {
      // Update user profile with new image URL
      setProfileImageUrl(result.url);
      await updateProfile({ profileImageUrl: result.url });
      Alert.alert('Success', 'Profile picture updated!');
    },
    onError: (error) => {
      Alert.alert('Upload Failed', error.message);
    },
  });

  const handleChoosePhoto = () => {
    Alert.alert(
      'Upload Photo',
      'Choose a photo source',
      [
        {
          text: 'Camera',
          onPress: upload.uploadProfileFromCamera,
        },
        {
          text: 'Gallery',
          onPress: upload.uploadProfileFromGallery,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={{ padding: 20 }}>
      <TouchableOpacity onPress={handleChoosePhoto} disabled={upload.isUploading}>
        {profileImageUrl ? (
          <Image
            source={{ uri: profileImageUrl }}
            style={{ width: 120, height: 120, borderRadius: 60 }}
          />
        ) : (
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: '#ddd',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text>Add Photo</Text>
          </View>
        )}

        {upload.isUploading && (
          <View
            style={{
              position: 'absolute',
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ActivityIndicator color="white" />
            <Text style={{ color: 'white', marginTop: 8 }}>
              {upload.uploadProgress}%
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
```

---

## Example 2: Highlight Video Upload (Studio Tab)

### Component: StudioVideoCapture

```typescript
import React from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Camera } from 'expo-camera';
import { useUpload } from '@/hooks/useUpload';
import { useContent } from '@/contexts/ContentContext';

export default function StudioVideoCapture() {
  const { addHighlight } = useContent();
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);

  const upload = useUpload({
    onSuccess: async (result) => {
      // Add highlight to ContentContext
      await addHighlight({
        videoUrl: result.url,
        thumbnailUrl: result.thumbnail,
        duration: result.duration || 0,
      });
    },
  });

  // Request camera permissions on mount
  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  if (hasPermission === null) {
    return <View />;
  }

  if (hasPermission === false) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Camera permission not granted</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Camera style={{ flex: 1 }} type={Camera.Constants.Type.back}>
        <View style={{ flex: 1, justifyContent: 'flex-end', padding: 20 }}>
          <TouchableOpacity
            onPress={upload.recordAndUploadHighlight}
            disabled={upload.isUploading}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'red',
              alignSelf: 'center',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {upload.isUploading ? (
              <>
                <ActivityIndicator color="white" />
                <Text style={{ color: 'white', fontSize: 12, marginTop: 4 }}>
                  {upload.uploadProgress}%
                </Text>
              </>
            ) : (
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: 'white',
                }}
              />
            )}
          </TouchableOpacity>

          <Text style={{ color: 'white', textAlign: 'center', marginTop: 10 }}>
            {upload.isUploading ? 'Uploading...' : 'Hold to record (15s max)'}
          </Text>
        </View>
      </Camera>
    </View>
  );
}
```

---

## Example 3: Memory Photo Upload

### Component: MemoryCreationSheet

```typescript
import React from 'react';
import { View, TouchableOpacity, Text, Image } from 'react-native';
import { useUpload } from '@/hooks/useUpload';
import { useRetention } from '@/contexts/RetentionContext';
import BottomSheet from '@gorhom/bottom-sheet';

export default function MemoryCreationSheet({ venueId }: { venueId: string }) {
  const { addMemory } = useRetention();
  const [memoryUrl, setMemoryUrl] = React.useState<string | null>(null);

  const upload = useUpload({
    onSuccess: (result) => {
      setMemoryUrl(result.url);
      // Auto-save memory with photo
      addMemory({
        venueId,
        type: 'PHOTO',
        content: {
          imageUrl: result.url,
        },
      });
    },
  });

  return (
    <BottomSheet snapPoints={['50%', '90%']}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
          Create Memory
        </Text>

        {memoryUrl ? (
          <Image
            source={{ uri: memoryUrl }}
            style={{ width: '100%', height: 300, borderRadius: 12 }}
          />
        ) : (
          <TouchableOpacity
            onPress={upload.uploadMemoryFromGallery}
            disabled={upload.isUploading}
            style={{
              width: '100%',
              height: 300,
              borderRadius: 12,
              backgroundColor: '#f0f0f0',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {upload.isUploading ? (
              <>
                <ActivityIndicator size="large" />
                <Text style={{ marginTop: 10 }}>
                  Uploading {upload.uploadProgress}%
                </Text>
              </>
            ) : (
              <>
                <Icon name="camera" size={48} color="#999" />
                <Text style={{ marginTop: 10, color: '#666' }}>
                  Add Photo
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </BottomSheet>
  );
}
```

---

## Example 4: Venue Photo Upload (Management)

### Component: VenuePhotoManager

```typescript
import React from 'react';
import { View, TouchableOpacity, Text, Image, FlatList } from 'react-native';
import { useUpload } from '@/hooks/useUpload';

export default function VenuePhotoManager({ venueId }: { venueId: string }) {
  const [photos, setPhotos] = React.useState<string[]>([]);

  const upload = useUpload({
    onSuccess: (result) => {
      // Add new photo to list
      setPhotos([...photos, result.url]);
    },
  });

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
        Venue Photos
      </Text>

      <FlatList
        data={photos}
        numColumns={2}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={{ width: '48%', height: 150, margin: '1%', borderRadius: 8 }}
          />
        )}
        ListFooterComponent={
          <TouchableOpacity
            onPress={() => upload.uploadVenueFromGallery(venueId)}
            disabled={upload.isUploading}
            style={{
              width: '48%',
              height: 150,
              margin: '1%',
              borderRadius: 8,
              backgroundColor: '#f0f0f0',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {upload.isUploading ? (
              <>
                <ActivityIndicator />
                <Text style={{ marginTop: 10 }}>
                  {upload.uploadProgress}%
                </Text>
              </>
            ) : (
              <>
                <Icon name="plus" size={32} color="#999" />
                <Text style={{ marginTop: 10, color: '#666' }}>
                  Add Photo
                </Text>
              </>
            )}
          </TouchableOpacity>
        }
      />
    </View>
  );
}
```

---

## Example 5: Direct Service Usage (Without Hook)

If you prefer not to use the hook:

```typescript
import React, { useState } from 'react';
import { View, Button, Image, Alert } from 'react-native';
import { pickImage, uploadProfilePicture } from '@/services/upload.service';
import { useAuth } from '@/contexts/AuthContext';

export default function DirectUploadExample() {
  const { accessToken } = useAuth();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    try {
      setUploading(true);

      // Pick image
      const uri = await pickImage({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!uri) {
        setUploading(false);
        return;
      }

      // Upload
      const result = await uploadProfilePicture(uri, accessToken!);
      setImageUrl(result.url);

      Alert.alert('Success', 'Upload completed!');
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: 200, height: 200, marginBottom: 20 }}
        />
      )}

      <Button
        title={uploading ? 'Uploading...' : 'Upload Photo'}
        onPress={handleUpload}
        disabled={uploading}
      />
    </View>
  );
}
```

---

## Advanced Usage

### Custom Progress Tracking

```typescript
const upload = useUpload({
  onProgress: (progress) => {
    console.log('Upload progress:', progress);
  },
  onSuccess: (result) => {
    console.log('Upload complete:', result);
  },
});
```

### Error Handling

```typescript
const upload = useUpload({
  onError: (error) => {
    if (error.message.includes('permissions')) {
      Alert.alert(
        'Permissions Required',
        'Please enable camera/photo library access in Settings',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    } else if (error.message.includes('too large')) {
      Alert.alert('File Too Large', 'Please choose a smaller file');
    } else {
      Alert.alert('Upload Failed', error.message);
    }
  },
});
```

### Multiple Uploads

```typescript
const [uploads, setUploads] = useState<UploadResult[]>([]);

const upload = useUpload({
  onSuccess: (result) => {
    setUploads([...uploads, result]);
  },
});

// Upload multiple photos
const uploadMultiple = async () => {
  for (let i = 0; i < 5; i++) {
    await upload.uploadMemoryFromGallery();
  }
};
```

---

## Testing Uploads

### 1. Test with Expo Go

```bash
# Start Expo dev server
npx expo start

# Open in Expo Go app on your phone
# Navigate to a screen with upload functionality
# Try uploading different file types
```

### 2. Test with curl (Backend)

```bash
# Get auth token
TOKEN="your_access_token_here"

# Test profile picture upload
curl -X POST http://localhost:3000/api/upload/profile-picture \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/path/to/test-image.jpg"

# Test video upload
curl -X POST http://localhost:3000/api/upload/highlight \
  -H "Authorization: Bearer $TOKEN" \
  -F "video=@/path/to/test-video.mp4"
```

### 3. Check Cloudinary Dashboard

After uploading:
1. Go to https://cloudinary.com/console
2. Click "Media Library"
3. Verify your uploads in `rork-app/` folder
4. Check transformations are applied

---

## Common Issues

### "Camera roll permissions not granted"

**Solution**: Request permissions before picking

```typescript
import { requestMediaLibraryPermissions } from '@/services/upload.service';

const hasPermission = await requestMediaLibraryPermissions();
if (!hasPermission) {
  Alert.alert('Permissions required');
  return;
}
```

### "Upload failed: Invalid credentials"

**Solution**: Check Cloudinary credentials in `backend/.env`

```bash
# Verify credentials
cat backend/.env | grep CLOUDINARY

# Should have real values, not placeholders
```

### "File too large"

**Solution**: Files are auto-compressed, but you can adjust:

```typescript
// Disable compression
await uploadProfilePicture(uri, accessToken, { compress: false });

// Or adjust compression settings in upload.service.ts
```

### "Not authenticated"

**Solution**: Ensure user is signed in

```typescript
const { accessToken, isAuthenticated } = useAuth();

if (!isAuthenticated) {
  Alert.alert('Please sign in first');
  return;
}
```

---

## Performance Tips

1. **Compress before upload** (enabled by default)
2. **Use appropriate image sizes**:
   - Profile: 500x500
   - Memories: 1920x1920
   - Venue photos: 1920x1080
3. **Show progress indicators** for better UX
4. **Handle errors gracefully** with user-friendly messages
5. **Test on real devices** (iOS + Android)

---

## Next Steps

1. ✅ Hook created: `hooks/useUpload.ts`
2. ✅ Service created: `services/upload.service.ts`
3. 🎯 **Add to your screens**:
   - Profile edit screen
   - Studio tab (video capture)
   - Memory creation
   - Venue management
4. 🧪 **Test thoroughly**:
   - Upload from gallery
   - Take photo/video
   - Error scenarios
   - Different file sizes

---

## Documentation

- Full guide: `CLOUDINARY_SETUP.md`
- Backend integration: `CLOUDINARY_INTEGRATION_COMPLETE.md`
- Quick setup: `CLOUDINARY_SETUP_CHECKLIST.md`

---

**Ready to use!** Copy these examples into your components and customize as needed. 🚀
