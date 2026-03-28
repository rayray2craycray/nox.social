import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useAuth } from './AuthContext';
import { apiClient } from '@/services/api';
import { API_ENDPOINTS } from '@/services/config';
import type { UploadResult, UploadProgress, UploadType } from '@/types';

export const [UploadProvider, useUpload] = createContextHook(() => {
  const { accessToken } = useAuth();
  const [uploadProgress, setUploadProgress] = useState<Map<string, UploadProgress>>(new Map());

  /**
   * Request permissions for camera and media library
   */
  const requestPermissions = useCallback(async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Please grant camera and photo library permissions to upload media.',
        [{ text: 'OK' }]
      );
      return false;
    }

    return true;
  }, []);

  /**
   * Pick an image from the library
   */
  const pickImage = useCallback(async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return null;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0];
      }

      return null;
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
      return null;
    }
  }, [requestPermissions]);

  /**
   * Take a photo with the camera
   */
  const takePhoto = useCallback(async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return null;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0];
      }

      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
      return null;
    }
  }, [requestPermissions]);

  /**
   * Pick a video from the library
   */
  const pickVideo = useCallback(async (maxDuration: number = 60) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return null;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: maxDuration,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0];
      }

      return null;
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video');
      return null;
    }
  }, [requestPermissions]);

  /**
   * Record a video with the camera
   */
  const recordVideo = useCallback(async (maxDuration: number = 60) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return null;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: maxDuration,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0];
      }

      return null;
    } catch (error) {
      console.error('Error recording video:', error);
      Alert.alert('Error', 'Failed to record video');
      return null;
    }
  }, [requestPermissions]);

  /**
   * Upload a file to the server
   */
  const uploadFile = useCallback(async (
    uri: string,
    uploadType: UploadType,
    additionalData?: Record<string, any>
  ): Promise<UploadResult> => {
    if (!accessToken) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const uploadId = Math.random().toString(36).substring(7);

      // Set initial progress
      setUploadProgress(prev => new Map(prev).set(uploadId, {
        uploadId,
        progress: 0,
        status: 'uploading',
      }));

      // Create FormData
      const formData = new FormData();

      // Extract filename from URI
      const filename = uri.split('/').pop() || 'file';
      const fileExtension = filename.split('.').pop()?.toLowerCase();

      // Determine MIME type
      let mimeType = 'application/octet-stream';
      if (uploadType === 'highlight') {
        mimeType = `video/${fileExtension || 'mp4'}`;
      } else if (['profile-picture', 'memory', 'venue'].includes(uploadType)) {
        mimeType = `image/${fileExtension || 'jpeg'}`;
      } else if (uploadType === 'business-document') {
        mimeType = 'application/pdf';
      }

      // Add file to FormData
      formData.append(
        uploadType === 'highlight' ? 'video' : uploadType === 'business-document' ? 'document' : 'image',
        {
          uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
          type: mimeType,
          name: filename,
        } as any
      );

      // Add additional data
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      // Get upload endpoint
      const endpoint = API_ENDPOINTS.UPLOAD[
        uploadType.toUpperCase().replace(/-/g, '_') as keyof typeof API_ENDPOINTS.UPLOAD
      ];

      // Upload file
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000'}/api${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const result = await response.json();

      // Update progress
      setUploadProgress(prev => new Map(prev).set(uploadId, {
        uploadId,
        progress: 100,
        status: result.success ? 'completed' : 'error',
      }));

      // Remove from progress after 2 seconds
      setTimeout(() => {
        setUploadProgress(prev => {
          const newMap = new Map(prev);
          newMap.delete(uploadId);
          return newMap;
        });
      }, 2000);

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return {
          success: true,
          url: result.data.url,
          thumbnailUrl: result.data.thumbnailUrl,
        };
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return {
        success: false,
        error: error.message || 'Failed to upload file',
      };
    }
  }, [accessToken]);

  /**
   * Upload profile picture
   */
  const uploadProfilePicture = useCallback(async (uri: string) => {
    return uploadFile(uri, 'profile-picture');
  }, [uploadFile]);

  /**
   * Upload highlight video
   */
  const uploadHighlight = useCallback(async (uri: string, venueId: string, caption?: string) => {
    return uploadFile(uri, 'highlight', { venueId, caption });
  }, [uploadFile]);

  /**
   * Upload memory photo
   */
  const uploadMemory = useCallback(async (uri: string, venueId: string, caption?: string, isPrivate: boolean = false) => {
    return uploadFile(uri, 'memory', { venueId, caption, isPrivate });
  }, [uploadFile]);

  /**
   * Upload venue photo
   */
  const uploadVenuePhoto = useCallback(async (uri: string, venueId: string, description?: string) => {
    return uploadFile(uri, 'venue', { venueId, description });
  }, [uploadFile]);

  /**
   * Upload business document
   */
  const uploadBusinessDocument = useCallback(async (uri: string, documentType: string) => {
    return uploadFile(uri, 'business-document', { documentType });
  }, [uploadFile]);

  /**
   * Show image picker options
   */
  const showImagePickerOptions = useCallback(async (): Promise<ImagePicker.ImagePickerAsset | null> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Choose Photo',
        'How would you like to add a photo?',
        [
          {
            text: 'Take Photo',
            onPress: async () => {
              const result = await takePhoto();
              resolve(result);
            },
          },
          {
            text: 'Choose from Library',
            onPress: async () => {
              const result = await pickImage();
              resolve(result);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ]
      );
    });
  }, [takePhoto, pickImage]);

  /**
   * Show video picker options
   */
  const showVideoPickerOptions = useCallback(async (maxDuration: number = 60): Promise<ImagePicker.ImagePickerAsset | null> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Choose Video',
        'How would you like to add a video?',
        [
          {
            text: 'Record Video',
            onPress: async () => {
              const result = await recordVideo(maxDuration);
              resolve(result);
            },
          },
          {
            text: 'Choose from Library',
            onPress: async () => {
              const result = await pickVideo(maxDuration);
              resolve(result);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ]
      );
    });
  }, [recordVideo, pickVideo]);

  return {
    // Picker functions
    pickImage,
    takePhoto,
    pickVideo,
    recordVideo,
    showImagePickerOptions,
    showVideoPickerOptions,

    // Upload functions
    uploadFile,
    uploadProfilePicture,
    uploadHighlight,
    uploadMemory,
    uploadVenuePhoto,
    uploadBusinessDocument,

    // Progress tracking
    uploadProgress: Array.from(uploadProgress.values()),
  };
});
