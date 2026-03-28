import React, { useState } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUpload } from '@/contexts/UploadContext';
import { useAuth } from '@/contexts/AuthContext';

interface ProfilePictureUploadProps {
  currentImageUrl?: string;
  onUploadComplete?: (url: string) => void;
  size?: number;
}

export default function ProfilePictureUpload({
  currentImageUrl,
  onUploadComplete,
  size = 100,
}: ProfilePictureUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { showImagePickerOptions, uploadProfilePicture } = useUpload();
  const { user, updateProfile } = useAuth();

  const handleUpload = async () => {
    try {
      // Show picker options
      const asset = await showImagePickerOptions();
      if (!asset) return;

      setIsUploading(true);

      // Upload image
      const result = await uploadProfilePicture(asset.uri);

      if (result.success && result.url) {
        // Update user profile with new image URL
        await updateProfile({ profileImageUrl: result.url });

        // Call callback if provided
        if (onUploadComplete) {
          onUploadComplete(result.url);
        }
      }
    } catch (error) {
      console.error('Profile picture upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleUpload}
        disabled={isUploading}
        style={[styles.imageContainer, { width: size, height: size }]}
      >
        {currentImageUrl || user?.profileImageUrl ? (
          <Image
            source={{ uri: currentImageUrl || user?.profileImageUrl }}
            style={[styles.image, { width: size, height: size }]}
          />
        ) : (
          <View style={[styles.placeholder, { width: size, height: size }]}>
            <Ionicons name="person" size={size * 0.5} color="#666" />
          </View>
        )}

        {isUploading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#ff0080" />
          </View>
        ) : (
          <View style={styles.editButton}>
            <Ionicons name="camera" size={20} color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      {isUploading && (
        <Text style={styles.uploadingText}>Uploading...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  imageContainer: {
    borderRadius: 100,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    borderRadius: 100,
  },
  placeholder: {
    backgroundColor: '#1a1a1a',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#ff0080',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
  },
  uploadingText: {
    marginTop: 8,
    color: '#ff0080',
    fontSize: 14,
    fontWeight: '600',
  },
});
