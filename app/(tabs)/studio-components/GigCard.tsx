/**
 * GigCard Component
 * Displays gig information in a card format
 *
 * Performance: Memoized to prevent unnecessary re-renders
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, MapPin, DollarSign, TrendingUp } from 'lucide-react-native';
import type { Gig } from '@/types';
import { COLORS } from './types';

interface GigCardProps {
  gig: Gig;
  onPress: () => void;
  formatDate: (dateString: string) => string;
  formatCurrency: (amount: number) => string;
}

const GigCardComponent = ({ gig, onPress, formatDate, formatCurrency }: GigCardProps) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.gigCard}>
      <LinearGradient
        colors={['#1a1a1a', '#2a2a2a'] as [string, string, ...string[]]}
        style={styles.gigCardGradient}
      >
        <View style={styles.gigHeader}>
          <View>
            <Text style={styles.gigVenue}>{gig.venueName}</Text>
            <View style={styles.gigDetail}>
              <MapPin size={14} color={COLORS.textSecondary} />
              <Text style={styles.gigLocation}>{gig.venueLocation}</Text>
            </View>
          </View>
          <View style={styles.gigStatusBadge}>
            <Text style={styles.gigStatusText}>{gig.status}</Text>
          </View>
        </View>

        <View style={styles.gigInfo}>
          <View style={styles.gigInfoItem}>
            <Calendar size={16} color={COLORS.purple} />
            <Text style={styles.gigInfoText}>{formatDate(gig.date)}</Text>
          </View>
          <View style={styles.gigInfoItem}>
            <DollarSign size={16} color={COLORS.success} />
            <Text style={styles.gigInfoText}>{formatCurrency(gig.fee)}</Text>
          </View>
          {gig.barSalesGenerated !== undefined && (
            <View style={styles.gigInfoItem}>
              <TrendingUp size={16} color={COLORS.accent} />
              <Text style={styles.gigInfoText}>
                {formatCurrency(gig.barSalesGenerated)} sales
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};
GigCardComponent.displayName = 'GigCard';
const gigCardCompare = (prevProps: GigCardProps, nextProps: GigCardProps) =>
  prevProps.gig.id === nextProps.gig.id &&
  prevProps.gig.status === nextProps.gig.status &&
  prevProps.gig.fee === nextProps.gig.fee &&
  prevProps.gig.barSalesGenerated === nextProps.gig.barSalesGenerated;
export const GigCard = memo(GigCardComponent, gigCardCompare);

const styles = StyleSheet.create({
  gigCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gigCardGradient: {
    padding: 16,
  },
  gigHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  gigVenue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  gigDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gigLocation: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  gigStatusBadge: {
    backgroundColor: COLORS.purple,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  gigStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  gigInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gigInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gigInfoText: {
    fontSize: 14,
    color: COLORS.text,
  },
});
