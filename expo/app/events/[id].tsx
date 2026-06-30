import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Tag,
  Sparkles,
  CheckCircle,
} from 'lucide-react-native';
import { useEvents } from '@/contexts/EventsContext';
import { useTicketPurchase } from '@/hooks/useTicketPurchase';
import * as Haptics from 'expo-haptics';
import { TicketTier, Performer, Venue } from '@/types';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getEventById, getTicketTiersForEvent, isLoading } = useEvents();
  const { purchase: purchaseViaStripe, isPurchasing } = useTicketPurchase();
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);

  const event = getEventById(id || '');
  const venue = null as Venue | null;
  const performers: Performer[] = [];
  const ticketTiers = event ? getTicketTiersForEvent(event.id) : [];

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handlePurchaseTicket = async () => {
    if (!selectedTierId || !event) {
      Alert.alert('No Tier Selected', 'Please select a ticket tier to purchase');
      return;
    }

    const tier = ticketTiers.find(t => t.id === selectedTierId);
    if (!tier) return;

    const result = await purchaseViaStripe(event.id, selectedTierId);

    if (result.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Purchase Successful!',
        `You've purchased ${tier.name} for ${event.title}. Your ticket will appear shortly.`,
        [
          { text: 'View Tickets', onPress: () => router.push('/tickets') },
          { text: 'OK', style: 'cancel' },
        ]
      );
      return;
    }

    // The user dismissing the sheet is not an "error" — don't show an alert
    // for it, just let them try again.
    if (result.reason === 'canceled') return;

    Alert.alert('Purchase Failed', result.message || 'Unable to complete purchase');
  };

  const isTierAvailable = (tier: TicketTier): boolean => {
    const now = new Date();
    const salesStart = new Date(tier.salesWindow.start);
    const salesEnd = new Date(tier.salesWindow.end);

    if (now < salesStart) return false;
    if (now > salesEnd) return false;
    if (tier.sold >= tier.quantity) return false;

    return true;
  };

  const getTierStatus = (tier: TicketTier): string => {
    const now = new Date();
    const salesStart = new Date(tier.salesWindow.start);
    const salesEnd = new Date(tier.salesWindow.end);

    if (tier.sold >= tier.quantity) return 'SOLD OUT';
    if (now < salesStart) return 'NOT YET AVAILABLE';
    if (now > salesEnd) return 'SALES ENDED';

    const remaining = tier.quantity - tier.sold;
    if (remaining <= 10) return `ONLY ${remaining} LEFT`;

    return 'AVAILABLE';
  };

  if (isLoading || !event) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff0080" />
        <Text style={styles.loadingText}>Loading event...</Text>
      </View>
    );
  }

  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: event.imageUrl }} style={styles.heroImage} contentFit="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
            style={styles.heroGradient}
          />
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Event Info */}
        <View style={styles.content}>
          <Text style={styles.title}>{event.title}</Text>

          {venue && (
            <View style={styles.venueTag}>
              <MapPin size={16} color="#ff0080" />
              <Text style={styles.venueText}>{venue.name}</Text>
            </View>
          )}

          {/* Date & Time */}
          <View style={styles.infoRow}>
            <Calendar size={20} color="#00d4ff" />
            <Text style={styles.infoText}>{formattedDate}</Text>
          </View>

          <View style={styles.infoRow}>
            <Clock size={20} color="#00d4ff" />
            <Text style={styles.infoText}>
              {event.startTime} - {event.endTime}
            </Text>
          </View>

          {/* Description */}
          <Text style={styles.descriptionTitle}>About This Event</Text>
          <Text style={styles.description}>{event.description}</Text>

          {/* Genres */}
          <View style={styles.genresContainer}>
            {event.genres.map((genre, index) => (
              <View key={index} style={styles.genreTag}>
                <Text style={styles.genreText}>{genre}</Text>
              </View>
            ))}
          </View>

          {/* Performers */}
          {performers.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Lineup</Text>
              {performers.map((performer) => (
                <View key={performer.id} style={styles.performerCard}>
                  <Image
                    source={{ uri: performer.imageUrl }}
                    style={styles.performerAvatar}
                    contentFit="cover"
                  />
                  <View style={styles.performerInfo}>
                    <Text style={styles.performerName}>{performer.stageName}</Text>
                    <Text style={styles.performerGenre}>{performer.genres.join(', ')}</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Ticket Tiers */}
          <Text style={styles.sectionTitle}>Tickets</Text>

          {ticketTiers.map((tier) => {
            const available = isTierAvailable(tier);
            const status = getTierStatus(tier);
            const isSelected = selectedTierId === tier.id;

            return (
              <TouchableOpacity
                key={tier.id}
                style={[
                  styles.tierCard,
                  !available && styles.tierCardDisabled,
                  isSelected && styles.tierCardSelected,
                ]}
                onPress={() => {
                  if (available) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedTierId(tier.id);
                  }
                }}
                disabled={!available}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={
                    isSelected
                      ? ['#ff0080', '#a855f7']
                      : available
                      ? ['#1a1a2e', '#15151f']
                      : ['#0f0f15', '#0a0a0f']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.tierGradient}
                >
                  {/* Tier Header */}
                  <View style={styles.tierHeader}>
                    <View style={styles.tierTitleContainer}>
                      <Text
                        style={[
                          styles.tierName,
                          !available && styles.tierNameDisabled,
                          isSelected && styles.tierNameSelected,
                        ]}
                      >
                        {tier.name}
                      </Text>
                      {tier.isAppExclusive && (
                        <View style={styles.exclusiveBadge}>
                          <Sparkles size={12} color="#ffa64d" />
                          <Text style={styles.exclusiveText}>App Exclusive</Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.tierPrice,
                        !available && styles.tierPriceDisabled,
                        isSelected && styles.tierPriceSelected,
                      ]}
                    >
                      ${tier.price}
                    </Text>
                  </View>

                  {/* Tier Status */}
                  <View
                    style={[
                      styles.statusBadge,
                      status === 'AVAILABLE' && styles.statusBadgeAvailable,
                      status.includes('ONLY') && styles.statusBadgeLimited,
                      status === 'SOLD OUT' && styles.statusBadgeSoldOut,
                      status === 'NOT YET AVAILABLE' && styles.statusBadgeUpcoming,
                      status === 'SALES ENDED' && styles.statusBadgeEnded,
                    ]}
                  >
                    <Text style={styles.statusText}>{status}</Text>
                  </View>

                  {/* Tier Perks */}
                  {tier.perks && tier.perks.length > 0 && (
                    <View style={styles.perksContainer}>
                      {tier.perks.map((perk, index) => (
                        <View key={index} style={styles.perkRow}>
                          <CheckCircle size={14} color={isSelected ? '#000' : '#00d4ff'} />
                          <Text
                            style={[
                              styles.perkText,
                              !available && styles.perkTextDisabled,
                              isSelected && styles.perkTextSelected,
                            ]}
                          >
                            {perk}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Availability Bar */}
                  <View style={styles.availabilityContainer}>
                    <View style={styles.availabilityBar}>
                      <View
                        style={[
                          styles.availabilityFill,
                          { width: `${(tier.sold / tier.quantity) * 100}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.availabilityText}>
                      {tier.sold} / {tier.quantity} sold
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Purchase Button */}
      {selectedTierId && (
        <View style={styles.purchaseContainer}>
          <TouchableOpacity
            style={styles.purchaseButton}
            onPress={handlePurchaseTicket}
            disabled={isPurchasing}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ff0080', '#a855f7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.purchaseButtonGradient}
            >
              {isPurchasing ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <DollarSign size={22} color="#000" />
                  <Text style={styles.purchaseButtonText}>Purchase Ticket</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    height: 300,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
  },
  venueTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  venueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff0080',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 22,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  genreTag: {
    backgroundColor: 'rgba(255, 0, 128, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  genreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ff0080',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 28,
    marginBottom: 16,
  },
  performerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  performerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  performerGenre: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  tierCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  tierCardDisabled: {
    opacity: 0.5,
  },
  tierCardSelected: {
    borderWidth: 2,
    borderColor: '#ff0080',
  },
  tierGradient: {
    padding: 16,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tierTitleContainer: {
    flex: 1,
  },
  tierName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
  },
  tierNameDisabled: {
    color: '#666',
  },
  tierNameSelected: {
    color: '#000',
  },
  tierPrice: {
    fontSize: 24,
    fontWeight: '900',
    color: '#00d4ff',
  },
  tierPriceDisabled: {
    color: '#444',
  },
  tierPriceSelected: {
    color: '#000',
  },
  exclusiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 166, 77, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  exclusiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffa64d',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  statusBadgeAvailable: {
    backgroundColor: 'rgba(0, 255, 128, 0.2)',
  },
  statusBadgeLimited: {
    backgroundColor: 'rgba(255, 166, 77, 0.2)',
  },
  statusBadgeSoldOut: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
  },
  statusBadgeUpcoming: {
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
  },
  statusBadgeEnded: {
    backgroundColor: 'rgba(100, 100, 100, 0.2)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  perksContainer: {
    gap: 6,
    marginBottom: 12,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  perkText: {
    fontSize: 13,
    color: '#ccc',
    fontWeight: '500',
  },
  perkTextDisabled: {
    color: '#555',
  },
  perkTextSelected: {
    color: '#000',
  },
  availabilityContainer: {
    marginTop: 8,
  },
  availabilityBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  availabilityFill: {
    height: '100%',
    backgroundColor: '#00d4ff',
  },
  availabilityText: {
    marginTop: 4,
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  bottomPadding: {
    height: 100,
  },
  purchaseContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#1f1f2e',
  },
  purchaseButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  purchaseButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
  },
});
