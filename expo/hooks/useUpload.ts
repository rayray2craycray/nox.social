/**
 * useUpload Hook
 * Custom hook for handling file uploads with state management
 */

import { useState } from 'react';
import {
  pickImage,
  takePhoto,
  pickVideo,
  recordVideo,
  uploadProfilePicture,
  uploadHighlightVideo,
  uploadMemoryPhoto,
  uploadVenuePhoto,
  UploadResult,
} from '@/services/upload.service';
import { useAuth } from '@/contexts/AuthContext';
import { Alert } from 'react-native';

export interface UseUploadOptions {
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

export const useUpload = (options?: UseUploadOptions) => {
  const { accessToken } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadError, setUploadError] = useState<Error | null>(null);

  /**
   * Reset upload state
   */
  const reset = () => {
    setIsUploading(false);
    setUploadProgress(0);
    setUploadResult(null);
    setUploadError(null);
  };

  /**
   * Upload profile picture from gallery
   */
  const uploadProfileFromGallery = async () => {
    try {
      reset();
      setIsUploading(true);

      // Pick image
      const imageUri = await pickImage({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!imageUri) {
        setIsUploading(false);
        return null;
      }

      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      // Upload
      setUploadProgress(50);
      const result = await uploadProfilePicture(imageUri, accessToken);

      setUploadProgress(100);
      setUploadResult(result);
      setIsUploading(false);

      if (options?.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (error) {
      const err = error as Error;
      setUploadError(err);
      setIsUploading(false);

      if (options?.onError) {
        options.onError(err);
      } else {
        Alert.alert('Upload Failed', err.message);
      }

      return null;
    }
  };

  /**
   * Upload profile picture from camera
   */
  const uploadProfileFromCamera = async () => {
    try {
      reset();
      setIsUploading(true);

      // Take photo
      const imageUri = await takePhoto({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!imageUri) {
        setIsUploading(false);
        return null;
      }

      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      // Upload
      setUploadProgress(50);
      const result = await uploadProfilePicture(imageUri, accessToken);

      setUploadProgress(100);
      setUploadResult(result);
      setIsUploading(false);

      if (options?.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (error) {
      const err = error as Error;
      setUploadError(err);
      setIsUploading(false);

      if (options?.onError) {
        options.onError(err);
      } else {
        Alert.alert('Upload Failed', err.message);
      }

      return null;
    }
  };

  /**
   * Upload highlight video from gallery
   */
  const uploadHighlightFromGallery = async () => {
    try {
      reset();
      setIsUploading(true);

      // Pick video
      const videoUri = await pickVideo({
        allowsEditing: true,
        quality: 0.8,
        maxDuration: 15,
      });

      if (!videoUri) {
        setIsUploading(false);
        return null;
      }

      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      // Upload
      setUploadProgress(50);
      const result = await uploadHighlightVideo(videoUri, accessToken);

      setUploadProgress(100);
      setUploadResult(result);
      setIsUploading(false);

      if (options?.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (error) {
      const err = error as Error;
      setUploadError(err);
      setIsUploading(false);

      if (options?.onError) {
        options.onError(err);
      } else {
        Alert.alert('Upload Failed', err.message);
      }

      return null;
    }
  };

  /**
   * Record and upload highlight video
   */
  const recordAndUploadHighlight = async () => {
    try {
      reset();
      setIsUploading(true);

      // Record video
      const videoUri = await recordVideo({
        allowsEditing: true,
        quality: 0.8,
        maxDuration: 15,
      });

      if (!videoUri) {
        setIsUploading(false);
        return null;
      }

      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      // Upload
      setUploadProgress(50);
      const result = await uploadHighlightVideo(videoUri, accessToken);

      setUploadProgress(100);
      setUploadResult(result);
      setIsUploading(false);

      if (options?.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (error) {
      const err = error as Error;
      setUploadError(err);
      setIsUploading(false);

      if (options?.onError) {
        options.onError(err);
      } else {
        Alert.alert('Upload Failed', err.message);
      }

      return null;
    }
  };

  /**
   * Upload memory photo from gallery
   */
  const uploadMemoryFromGallery = async () => {
    try {
      reset();
      setIsUploading(true);

      // Pick image
      const imageUri = await pickImage({
        allowsEditing: false,
        quality: 0.9,
      });

      if (!imageUri) {
        setIsUploading(false);
        return null;
      }

      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      // Upload
      setUploadProgress(50);
      const result = await uploadMemoryPhoto(imageUri, accessToken);

      setUploadProgress(100);
      setUploadResult(result);
      setIsUploading(false);

      if (options?.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (error) {
      const err = error as Error;
      setUploadError(err);
      setIsUploading(false);

      if (options?.onError) {
        options.onError(err);
      } else {
        Alert.alert('Upload Failed', err.message);
      }

      return null;
    }
  };

  /**
   * Upload venue photo from gallery
   */
  const uploadVenueFromGallery = async (venueId: string) => {
    try {
      reset();
      setIsUploading(true);

      // Pick image
      const imageUri = await pickImage({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.9,
      });

      if (!imageUri) {
        setIsUploading(false);
        return null;
      }

      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      // Upload
      setUploadProgress(50);
      const result = await uploadVenuePhoto(imageUri, venueId, accessToken);

      setUploadProgress(100);
      setUploadResult(result);
      setIsUploading(false);

      if (options?.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (error) {
      const err = error as Error;
      setUploadError(err);
      setIsUploading(false);

      if (options?.onError) {
        options.onError(err);
      } else {
        Alert.alert('Upload Failed', err.message);
      }

      return null;
    }
  };

  /**
   * Upload highlight video from existing URI (for already recorded/selected videos)
   */
  const uploadHighlightFromUri = async (videoUri: string) => {
    try {
      reset();
      setIsUploading(true);

      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      // Upload
      setUploadProgress(30);
      const result = await uploadHighlightVideo(videoUri, accessToken);

      setUploadProgress(100);
      setUploadResult(result);
      setIsUploading(false);

      if (options?.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (error) {
      const err = error as Error;
      setUploadError(err);
      setIsUploading(false);

      if (options?.onError) {
        options.onError(err);
      } else {
        Alert.alert('Upload Failed', err.message);
      }

      return null;
    }
  };

  return {
    // State
    isUploading,
    uploadProgress,
    uploadResult,
    uploadError,

    // Methods
    uploadProfileFromGallery,
    uploadProfileFromCamera,
    uploadHighlightFromGallery,
    recordAndUploadHighlight,
    uploadMemoryFromGallery,
    uploadVenueFromGallery,
    uploadHighlightFromUri,
    reset,
  };
};
