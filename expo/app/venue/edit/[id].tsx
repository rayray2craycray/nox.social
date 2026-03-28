/**
 * Venue Editing Screen
 * Allows HEAD_MODERATOR and authorized staff to edit venue details and display
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  Save,
  Upload,
  Image as ImageIcon,
  MapPin,
  Clock,
  DollarSign,
  Tag,
  AlertCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useVenueManagement } from '@/contexts/VenueManagementContext';
import { useUpload } from '@/hooks/useUpload';
import type { Venue } from '@/types';

const COLORS = {
  background: '#000000',
  surface: '#1a1a1a',
  surfaceLight: '#2a2a2a',
  text: '#ffffff',
  textSecondary: '#999999',
  accent: '#ff0080',
  accentDark: '#cc0066',
  border: '#333333',
  error: '#ff3b30',
  success: '#34c759',
  warning: '#ff9500',
};

export default function VenueEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const venueId = id!;

  const {
    canEditVenue,
    canEditDisplay,
    getVenueRole,
    updateVenueInfo,
    updateVenueDisplay,
  } = useVenueManagement();

  const { uploadVenueFromGallery, isUploading } = useUpload();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [venue, setVenue] = useState<Venue | null>(null);

  // Editing permissions
  const canEdit = canEditVenue(venueId);
  const canEditImg = canEditDisplay(venueId);
  const role = getVenueRole(venueId);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    imageUrl: '',
    description: '',
    address: '',
    coverCharge: 0,
    tags: [] as string[],
    hours: {
      monday: '',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: '',
      saturday: '',
      sunday: '',
    },
  });

  const [newTag, setNewTag] = useState('');

  // Load venue data
  useEffect(() => {
    loadVenue();
  }, [venueId]);

  const loadVenue = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await venueApi.getDetails(venueId);
      // const venueData = response.data;

      // Mock data for development
      const venueData: Venue = {
        id: venueId,
        name: 'Sample Venue',
        location: {
          latitude: 40.7589,
          longitude: -73.9851,
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          country: 'USA',
        },
        isOpen: true,
        currentVibeLevel: 75,
        coverCharge: 20,
        genres: ['Electronic', 'House'],
        imageUrl: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2',
        hasPublicLobby: true,
        vipThreshold: 90,
        type: 'CLUB',
        rating: 4.5,
        priceLevel: 3,
        hours: {
          monday: '6:00 PM - 2:00 AM',
          tuesday: '6:00 PM - 2:00 AM',
          wednesday: '6:00 PM - 2:00 AM',
          thursday: '6:00 PM - 2:00 AM',
          friday: '6:00 PM - 4:00 AM',
          saturday: '6:00 PM - 4:00 AM',
          sunday: '6:00 PM - 2:00 AM',
        },
        tags: ['EDM', 'DJ', 'Dancing'],
        capacity: 500,
        features: [],
      };

      setVenue(venueData);
      setFormData({
        name: venueData.name,
        imageUrl: venueData.imageUrl || '',
        description: '', // Add to Venue type if needed
        address: venueData.location.address,
        coverCharge: venueData.coverCharge || 0,
        tags: venueData.tags || [],
        hours: {
          monday: venueData.hours?.monday || '',
          tuesday: venueData.hours?.tuesday || '',
          wednesday: venueData.hours?.wednesday || '',
          thursday: venueData.hours?.thursday || '',
          friday: venueData.hours?.friday || '',
          saturday: venueData.hours?.saturday || '',
          sunday: venueData.hours?.sunday || '',
        },
      });
    } catch (error) {
      console.error('Load venue error:', error);
      Alert.alert('Error', 'Unable to load venue details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagePick = async () => {
    if (!canEditImg) {
      Alert.alert(
        'Permission Denied',
        'You do not have permission to edit venue images'
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await uploadVenueFromGallery(venueId);
      if (result?.url) {
        setFormData({ ...formData, imageUrl: result.url });
        Alert.alert('Success', 'Image uploaded successfully');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      Alert.alert('Error', 'Failed to upload image');
    }
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;

    if (formData.tags.includes(newTag.trim())) {
      Alert.alert('Duplicate', 'This tag already exists');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFormData({
      ...formData,
      tags: [...formData.tags, newTag.trim()],
    });
    setNewTag('');
  };

  const handleRemoveTag = (tag: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const handleSave = async () => {
    if (!canEdit) {
      Alert.alert(
        'Permission Denied',
        'You do not have permission to edit this venue'
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaving(true);

    try {
      // Update venue info
      await updateVenueInfo(venueId, {
        name: formData.name,
        location: {
          ...venue!.location,
          address: formData.address,
        },
        coverCharge: formData.coverCharge,
        hours: formData.hours,
        tags: formData.tags,
      });

      // Update display if image changed
      if (formData.imageUrl !== venue?.imageUrl) {
        await updateVenueDisplay(venueId, {
          imageUrl: formData.imageUrl,
          description: formData.description,
          tags: formData.tags,
        });
      }

      Alert.alert('Success', 'Venue updated successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Save venue error:', error);
      // Error alert is handled in context
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading venue...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!canEdit) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionDenied}>
          <AlertCircle size={64} color={COLORS.error} />
          <Text style={styles.permissionTitle}>Access Denied</Text>
          <Text style={styles.permissionText}>
            You do not have permission to edit this venue.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <ChevronLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Edit Venue</Text>
          {role && (
            <Text style={styles.headerSubtitle}>
              {role.role.replace('_', ' ')}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={COLORS.accent} />
          ) : (
            <>
              <Save size={18} color={COLORS.accent} />
              <Text style={styles.saveButtonText}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Image */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cover Image</Text>
          <TouchableOpacity
            style={styles.imageContainer}
            onPress={handleImagePick}
            disabled={!canEditImg || isUploading}
          >
            {formData.imageUrl ? (
              <Image source={{ uri: formData.imageUrl }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <ImageIcon size={48} color={COLORS.textSecondary} />
                <Text style={styles.imagePlaceholderText}>
                  Tap to upload image
                </Text>
              </View>
            )}
            {canEditImg && (
              <View style={styles.imageOverlay}>
                <Upload size={24} color="#fff" />
                <Text style={styles.imageOverlayText}>
                  {isUploading ? 'Uploading...' : 'Change Image'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Venue Name</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Venue name"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <View style={styles.inputWithIcon}>
              <MapPin size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.inputFlex}
                value={formData.address}
                onChangeText={(text) =>
                  setFormData({ ...formData, address: text })
                }
                placeholder="123 Main Street"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cover Charge ($)</Text>
            <View style={styles.inputWithIcon}>
              <DollarSign size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.inputFlex}
                value={formData.coverCharge.toString()}
                onChangeText={(text) =>
                  setFormData({
                    ...formData,
                    coverCharge: parseInt(text) || 0,
                  })
                }
                placeholder="0"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagsContainer}>
            {formData.tags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={styles.tag}
                onPress={() => handleRemoveTag(tag)}
              >
                <Text style={styles.tagText}>{tag}</Text>
                <Text style={styles.tagRemove}>×</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.addTagContainer}>
            <TextInput
              style={styles.addTagInput}
              value={newTag}
              onChangeText={setNewTag}
              placeholder="Add a tag..."
              placeholderTextColor={COLORS.textSecondary}
              onSubmitEditing={handleAddTag}
            />
            <TouchableOpacity style={styles.addTagButton} onPress={handleAddTag}>
              <Tag size={20} color={COLORS.accent} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operating Hours</Text>
          {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map((day) => (
            <View key={day} style={styles.hoursRow}>
              <Text style={styles.dayLabel}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
              <TextInput
                style={styles.hoursInput}
                value={formData.hours[day]}
                onChangeText={(text) =>
                  setFormData({
                    ...formData,
                    hours: { ...formData.hours, [day]: text },
                  })
                }
                placeholder="9:00 PM - 2:00 AM"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
          ))}
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  permissionDenied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 24,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imageOverlayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputFlex: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.accent + '20',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
  },
  tagRemove: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accent,
  },
  addTagContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  addTagInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  addTagButton: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  dayLabel: {
    width: 100,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  hoursInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
});
