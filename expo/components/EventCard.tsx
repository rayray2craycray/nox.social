import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Event } from '@/types';
import { Calendar, MapPin, Users, DollarSign, Clock, Ticket } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface EventCardProps {
  event: Event;
  onPress?: () => void;
  size?: 'small' | 'large';
}

const EventCardComponent = ({ event, onPress, size = 'large' }: EventCardProps) => {
  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    const dayName = date.toLocaleString('default', { weekday: 'short' });
    return { month, day, dayName };
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getLowestPrice = () => {
    if (!event.ticketTiers || event.ticketTiers.length === 0) return null;
    const prices = event.ticketTiers.map(t => t.price);
    return Math.min(...prices);
  };

  const getTicketsRemaining = () => {
    if (!event.ticketTiers || event.ticketTiers.length === 0) return null;
    const remaining = event.ticketTiers.reduce((sum, tier) => {
      return sum + (tier.quantity - tier.sold);
    }, 0);
    return remaining;
  };

  const isSellingFast = () => {
    const remaining = getTicketsRemaining();
    if (!remaining) return false;
    const total = event.ticketTiers.reduce((sum, tier) => sum + tier.quantity, 0);
    return remaining / total < 0.2; // Less than 20% remaining
  };

  const dateInfo = formatDate(event.date);
  const lowestPrice = getLowestPrice();
  const ticketsRemaining = getTicketsRemaining();

  if (size === 'small') {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7} style={styles.smallCard}>
        <Image
          source={{ uri: event.imageUrl }}
          style={styles.smallImage}
          contentFit="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={styles.smallGradient}
        >
          <View style={styles.smallDateBadge}>
            <Text style={styles.smallDateMonth}>{dateInfo.month}</Text>
            <Text style={styles.smallDateDay}>{dateInfo.day}</Text>
          </View>
          <View style={styles.smallContent}>
            <Text style={styles.smallTitle} numberOfLines={1}>
              {event.title}
            </Text>
            {lowestPrice && (
              <Text style={styles.smallPrice}>From ${lowestPrice}</Text>
            )}
          </View>
        </LinearGradient>
        {isSellingFast() && (
          <View style={styles.sellingFastBadge}>
            <Text style={styles.sellingFastText}>🔥 Selling Fast</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e']}
        style={styles.largeCard}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: event.imageUrl }}
            style={styles.largeImage}
            contentFit="cover"
          />
          <View style={styles.dateBadge}>
            <Text style={styles.dateMonth}>{dateInfo.month}</Text>
            <Text style={styles.dateDay}>{dateInfo.day}</Text>
            <Text style={styles.dateDayName}>{dateInfo.dayName}</Text>
          </View>
          {isSellingFast() && (
            <View style={styles.sellingFastBadgeLarge}>
              <Text style={styles.sellingFastText}>🔥 Selling Fast</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {event.title}
          </Text>

          {event.description && (
            <Text style={styles.description} numberOfLines={2}>
              {event.description}
            </Text>
          )}

          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Clock size={16} color="#ff0080" />
              <Text style={styles.infoText}>
                {formatTime(event.startTime)} - {formatTime(event.endTime)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MapPin size={16} color="#ff0080" />
              <Text style={styles.infoText} numberOfLines={1}>
                {event.venueName || 'Venue'}
              </Text>
            </View>

            {event.genres && event.genres.length > 0 && (
              <View style={styles.genresRow}>
                {event.genres.slice(0, 3).map((genre, index) => (
                  <View key={index} style={styles.genreTag}>
                    <Text style={styles.genreText}>{genre}</Text>
                  </View>
                ))}
                {event.genres.length > 3 && (
                  <Text style={styles.moreGenres}>+{event.genres.length - 3}</Text>
                )}
              </View>
            )}
          </View>

          <View style={styles.footer}>
            {lowestPrice ? (
              <View style={styles.priceContainer}>
                <DollarSign size={18} color="#00ff80" />
                <Text style={styles.price}>From ${lowestPrice}</Text>
              </View>
            ) : (
              <Text style={styles.freeText}>Free Entry</Text>
            )}

            {ticketsRemaining !== null && (
              <View style={styles.ticketsInfo}>
                <Ticket size={14} color="#999" />
                <Text style={styles.ticketsText}>
                  {ticketsRemaining} left
                </Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export const EventCard = React.memo(EventCardComponent);

const styles = StyleSheet.create({
  smallCard: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
  },
  smallImage: {
    width: '100%',
    height: '100%',
  },
  smallGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  smallDateBadge: {
    backgroundColor: '#ff0080',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    minWidth: 50,
  },
  smallDateMonth: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },
  smallDateDay: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  smallContent: {
    flex: 1,
  },
  smallTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  smallPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00ff80',
  },
  largeCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
  },
  largeImage: {
    width: '100%',
    height: 180,
  },
  dateBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#ff0080',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },
  dateDay: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 28,
  },
  dateDayName: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'uppercase',
  },
  sellingFastBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,68,68,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sellingFastBadgeLarge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,68,68,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sellingFastText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 26,
  },
  description: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  infoGrid: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
    flex: 1,
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  genreTag: {
    backgroundColor: 'rgba(255,0,128,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,0,128,0.3)',
  },
  genreText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ff0080',
  },
  moreGenres: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00ff80',
  },
  freeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00ff80',
  },
  ticketsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ticketsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
});
