import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Phone,
  Globe,
  Clock,
  Star,
  MapPin,
  DollarSign,
  ExternalLink,
} from 'lucide-react-native';
import { useVenueDetails } from '@/hooks/useVenueDetails';
import * as Haptics from 'expo-haptics';

const COLORS = {
  primary: '#ff0080',
  textSecondary: '#999',
};

interface VenueDetailsModalProps {
  visible: boolean;
  placeId: string | null;
  venueName?: string;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export const VenueDetailsModal: React.FC<VenueDetailsModalProps> = ({
  visible,
  placeId,
  venueName,
  onClose,
}) => {
  const { details, isLoading, error } = useVenueDetails({
    placeId,
    autoFetch: visible && !!placeId,
  });

  const handlePhonePress = () => {
    if (details?.phoneNumber) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Linking.openURL(`tel:${details.phoneNumber}`);
    }
  };

  const handleWebsitePress = () => {
    if (details?.website) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Linking.openURL(details.website);
    }
  };

  const getPriceLevelText = (level?: number): string => {
    if (!level) return 'Not available';
    return '$'.repeat(level);
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
      <View style={styles.starsContainer}>
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            color={i < fullStars ? '#FFD700' : '#666'}
            fill={i < fullStars ? '#FFD700' : 'none'}
          />
        ))}
      </View>
    );
  };

  const renderOpeningHours = () => {
    if (!details?.openingHours?.weekdayText) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Clock size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Hours</Text>
          {details.openingHours.openNow !== undefined && (
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: details.openingHours.openNow ? '#00ff99' : '#ff4444' },
              ]}
            >
              <Text style={styles.statusBadgeText}>
                {details.openingHours.openNow ? 'Open Now' : 'Closed'}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.hoursContainer}>
          {details.openingHours.weekdayText.map((day, index) => (
            <Text key={index} style={styles.hourText}>
              {day}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  const renderPhotos = () => {
    if (!details?.photos || details.photos.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photos</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.photosScroll}
        >
          {details.photos.map((photo, index) => (
            <Image
              key={index}
              source={{ uri: photo.url }}
              style={styles.photo}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderReviews = () => {
    if (!details?.reviews || details.reviews.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reviews</Text>
        {details.reviews.map((review, index) => (
          <View key={index} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewAuthor}>{review.authorName}</Text>
              <View style={styles.reviewRating}>
                {renderStars(review.rating)}
                <Text style={styles.reviewRatingText}>{review.rating}</Text>
              </View>
            </View>
            <Text style={styles.reviewText} numberOfLines={3}>
              {review.text}
            </Text>
            <Text style={styles.reviewTime}>{review.relativeTime}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient colors={['#1a1a1a', '#0a0a0a']} style={styles.modalGradient}>
            {/* Drag Indicator */}
            <View style={styles.dragIndicatorContainer}>
              <View style={styles.dragIndicator} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{venueName || details?.name || 'Venue Details'}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.scrollContentContainer}
            >
              {isLoading && (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading venue details...</Text>
                </View>
              )}

              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>Failed to load venue details</Text>
                </View>
              )}

              {details && !isLoading && (
                <>
                  {/* Photos */}
                  {renderPhotos()}

                  {/* Basic Info */}
                  <View style={styles.section}>
                    <View style={styles.infoRow}>
                      <MapPin size={18} color={COLORS.textSecondary} />
                      <Text style={styles.infoText}>{details.formattedAddress}</Text>
                    </View>

                    {details.rating && (
                      <View style={styles.infoRow}>
                        <Star size={18} color="#FFD700" fill="#FFD700" />
                        <Text style={styles.infoText}>
                          {details.rating} ({details.totalRatings} reviews)
                        </Text>
                        {renderStars(details.rating)}
                      </View>
                    )}

                    {details.priceLevel && (
                      <View style={styles.infoRow}>
                        <DollarSign size={18} color={COLORS.textSecondary} />
                        <Text style={styles.infoText}>{getPriceLevelText(details.priceLevel)}</Text>
                      </View>
                    )}
                  </View>

                  {/* Contact */}
                  {(details.phoneNumber || details.website) && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Contact</Text>
                      {details.phoneNumber && (
                        <TouchableOpacity style={styles.contactButton} onPress={handlePhonePress}>
                          <Phone size={20} color={COLORS.primary} />
                          <Text style={styles.contactText}>{details.phoneNumber}</Text>
                        </TouchableOpacity>
                      )}
                      {details.website && (
                        <TouchableOpacity style={styles.contactButton} onPress={handleWebsitePress}>
                          <Globe size={20} color={COLORS.primary} />
                          <Text style={styles.contactText} numberOfLines={1}>
                            {details.website}
                          </Text>
                          <ExternalLink size={16} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Opening Hours */}
                  {renderOpeningHours()}

                  {/* Reviews */}
                  {renderReviews()}
                </>
              )}
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalGradient: {
    flex: 1,
  },
  dragIndicatorContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 40,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    marginLeft: 8,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    flex: 1,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 128, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  contactText: {
    fontSize: 15,
    color: '#fff',
    flex: 1,
  },
  hoursContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
  },
  hourText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  photosScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  photo: {
    width: width * 0.7,
    height: 200,
    borderRadius: 12,
    marginRight: 12,
  },
  reviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAuthor: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewRatingText: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '600',
  },
  reviewText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  reviewTime: {
    fontSize: 12,
    color: '#666',
  },
});

export default VenueDetailsModal;
