/**
 * Upload Service
 * Handles file uploads to Cloudinary via backend API
 */

import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { API_BASE_URL } from './config';

// Note: react-native-compressor requires native build (not available in Expo Go)
// Compression is disabled for now - will return original URIs
// import { Image } from 'react-native-compressor';
// import { Video } from 'react-native-compressor';

/**
 * Upload result interface
 */
export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  thumbnail?: string;
  duration?: number;
}

/**
 * Request camera permissions
 */
export const requestCameraPermissions = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    return false;
  }
  return true;
};

/**
 * Request media library permissions
 */
export const requestMediaLibraryPermissions = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    return false;
  }
  return true;
};

/**
 * Pick an image from the media library
 */
export const pickImage = async (options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}): Promise<string | null> => {
  // Request permissions
  const hasPermission = await requestMediaLibraryPermissions();
  if (!hasPermission) {
    throw new Error('Camera roll permissions not granted');
  }

  // Launch image picker
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: options?.allowsEditing ?? true,
    aspect: options?.aspect ?? [1, 1],
    quality: options?.quality ?? 0.8,
  });

  if (!result.canceled && result.assets[0]) {
    return result.assets[0].uri;
  }

  return null;
};

/**
 * Take a photo with the camera
 */
export const takePhoto = async (options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}): Promise<string | null> => {
  // Request permissions
  const hasPermission = await requestCameraPermissions();
  if (!hasPermission) {
    throw new Error('Camera permissions not granted');
  }

  // Launch camera
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: options?.allowsEditing ?? true,
    aspect: options?.aspect ?? [1, 1],
    quality: options?.quality ?? 0.8,
  });

  if (!result.canceled && result.assets[0]) {
    return result.assets[0].uri;
  }

  return null;
};

/**
 * Pick a video from the media library
 */
export const pickVideo = async (options?: {
  allowsEditing?: boolean;
  quality?: number;
  maxDuration?: number;
}): Promise<string | null> => {
  // Request permissions
  const hasPermission = await requestMediaLibraryPermissions();
  if (!hasPermission) {
    throw new Error('Camera roll permissions not granted');
  }

  // Launch video picker
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    allowsEditing: options?.allowsEditing ?? true,
    quality: options?.quality ?? 0.8,
    videoMaxDuration: options?.maxDuration ?? 15, // 15 seconds default for highlights
  });

  if (!result.canceled && result.assets[0]) {
    return result.assets[0].uri;
  }

  return null;
};

/**
 * Record a video with the camera
 */
export const recordVideo = async (options?: {
  allowsEditing?: boolean;
  quality?: number;
  maxDuration?: number;
}): Promise<string | null> => {
  // Request permissions
  const hasPermission = await requestCameraPermissions();
  if (!hasPermission) {
    throw new Error('Camera permissions not granted');
  }

  // Launch camera for video
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    allowsEditing: options?.allowsEditing ?? true,
    quality: options?.quality ?? 0.8,
    videoMaxDuration: options?.maxDuration ?? 15,
  });

  if (!result.canceled && result.assets[0]) {
    return result.assets[0].uri;
  }

  return null;
};

/**
 * Compress an image
 */
export const compressImage = async (
  uri: string,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  }
): Promise<string> => {
  // TODO: Re-enable compression when react-native-compressor is properly installed
  // For now, return original URI (compression disabled)
  if (__DEV__) {
    console.log('[Upload] Image compression disabled - returning original URI');
  }
  return uri;

  /* Original compression code - commented out until react-native-compressor is installed
  try {
    const compressedUri = await Image.compress(uri, {
      compressionMethod: 'auto',
      maxWidth: options?.maxWidth ?? 1920,
      maxHeight: options?.maxHeight ?? 1920,
      quality: options?.quality ?? 0.8,
    });
    return compressedUri;
  } catch (error) {
    console.error('Image compression error:', error);
    // Return original URI if compression fails
    return uri;
  }
  */
};

/**
 * Compress a video
 */
export const compressVideo = async (
  uri: string,
  options?: {
    maxSize?: number;
  }
): Promise<string> => {
  // TODO: Re-enable compression when react-native-compressor is properly installed
  // For now, return original URI (compression disabled)
  if (__DEV__) {
    console.log('[Upload] Video compression disabled - returning original URI');
  }
  return uri;

  /* Original compression code - commented out until react-native-compressor is installed
  try {
    const compressedUri = await Video.compress(uri, {
      compressionMethod: 'auto',
      maxSize: options?.maxSize ?? 720,
      minimumFileSizeForCompress: 0,
    });
    return compressedUri;
  } catch (error) {
    console.error('Video compression error:', error);
    // Return original URI if compression fails
    return uri;
  }
  */
};

/**
 * Upload profile picture
 */
export const uploadProfilePicture = async (
  uri: string,
  accessToken: string,
  options?: {
    compress?: boolean;
  }
): Promise<UploadResult> => {
  try {
    // Compress image if requested (default: true)
    let uploadUri = uri;
    if (options?.compress !== false) {
      uploadUri = await compressImage(uri, {
        maxWidth: 1000,
        maxHeight: 1000,
        quality: 0.8,
      });
    }

    // Create form data
    const formData = new FormData();
    formData.append('image', {
      uri: uploadUri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    } as any);

    // Upload to backend
    const response = await fetch(`${API_BASE_URL}/api/upload/profile-picture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
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

/**
 * Upload highlight video (15 seconds max)
 */
export const uploadHighlightVideo = async (
  uri: string,
  accessToken: string,
  options?: {
    compress?: boolean;
  }
): Promise<UploadResult> => {
  try {
    // Compress video if requested (default: true)
    let uploadUri = uri;
    if (options?.compress !== false) {
      uploadUri = await compressVideo(uri, {
        maxSize: 720,
      });
    }

    // Create form data
    const formData = new FormData();
    formData.append('video', {
      uri: uploadUri,
      type: 'video/mp4',
      name: 'highlight.mp4',
    } as any);

    // Upload to backend
    const response = await fetch(`${API_BASE_URL}/api/upload/highlight`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
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

/**
 * Upload memory photo
 */
export const uploadMemoryPhoto = async (
  uri: string,
  accessToken: string,
  options?: {
    compress?: boolean;
  }
): Promise<UploadResult> => {
  try {
    // Compress image if requested (default: true)
    let uploadUri = uri;
    if (options?.compress !== false) {
      uploadUri = await compressImage(uri, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.9,
      });
    }

    // Create form data
    const formData = new FormData();
    formData.append('image', {
      uri: uploadUri,
      type: 'image/jpeg',
      name: 'memory.jpg',
    } as any);

    // Upload to backend
    const response = await fetch(`${API_BASE_URL}/api/upload/memory`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
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

/**
 * Upload venue photo
 */
export const uploadVenuePhoto = async (
  uri: string,
  venueId: string,
  accessToken: string,
  options?: {
    compress?: boolean;
  }
): Promise<UploadResult> => {
  try {
    // Compress image if requested (default: true)
    let uploadUri = uri;
    if (options?.compress !== false) {
      uploadUri = await compressImage(uri, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.9,
      });
    }

    // Create form data
    const formData = new FormData();
    formData.append('image', {
      uri: uploadUri,
      type: 'image/jpeg',
      name: 'venue.jpg',
    } as any);
    formData.append('venueId', venueId);

    // Upload to backend
    const response = await fetch(`${API_BASE_URL}/api/upload/venue`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    return result.data;
  } catch (error) {
    console.error('Venue photo upload error:', error);
    throw error;
  }
};

/**
 * Delete an uploaded asset
 */
export const deleteUpload = async (
  publicId: string,
  accessToken: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<void> => {
  try {
    // URL encode the publicId
    const encodedPublicId = encodeURIComponent(publicId);

    const response = await fetch(
      `${API_BASE_URL}/api/upload/${encodedPublicId}?resourceType=${resourceType}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Delete failed');
    }
  } catch (error) {
    console.error('Delete upload error:', error);
    throw error;
  }
};

/**
 * Upload helper with progress tracking (optional)
 */
export const uploadWithProgress = async (
  uploadFunction: () => Promise<UploadResult>,
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  try {
    // Simulate progress (since fetch doesn't support upload progress on React Native)
    if (onProgress) {
      onProgress(0);
      const progressInterval = setInterval(() => {
        // Increment progress slowly until 90%
        onProgress(Math.min(90, (onProgress as any).current || 0 + 10));
      }, 500);

      const result = await uploadFunction();

      clearInterval(progressInterval);
      onProgress(100);

      return result;
    } else {
      return await uploadFunction();
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Get Cloudinary URL with transformations
 * Useful for generating thumbnail URLs client-side
 */
export const getTransformedUrl = (
  publicId: string,
  transformation: string
): string => {
  // This is a simplified version - in production, you'd want to use the full Cloudinary URL builder
  return `https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/${transformation}/${publicId}`;
};

export default {
  // Permissions
  requestCameraPermissions,
  requestMediaLibraryPermissions,

  // Pickers
  pickImage,
  takePhoto,
  pickVideo,
  recordVideo,

  // Compression
  compressImage,
  compressVideo,

  // Uploads
  uploadProfilePicture,
  uploadHighlightVideo,
  uploadMemoryPhoto,
  uploadVenuePhoto,

  // Delete
  deleteUpload,

  // Helpers
  uploadWithProgress,
  getTransformedUrl,
};
