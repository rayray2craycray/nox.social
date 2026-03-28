/**
 * AccountBadges Component
 * Displays user badges and tier status
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Award, Star } from 'lucide-react-native';
import type { UserBadge } from '@/types';
import { COLORS } from './types';

interface AccountBadgesProps {
  badges: UserBadge[];
  totalSpend: number;
  formatCurrency: (amount: number) => string;
}

export const AccountBadges: React.FC<AccountBadgesProps> = ({ badges, totalSpend, formatCurrency }) => {
  if (badges.length === 0) {
    return null;
  }

  const getTierColor = (tier: string): [string, string] => {
    switch (tier) {
      case 'WHALE':
        return ['#FFD700', '#FFA500'];
      case 'PLATINUM':
        return ['#E5E4E2', '#C0C0C0'];
      case 'REGULAR':
        return [COLORS.purple, COLORS.accent];
      default:
        return [COLORS.cardSecondary, COLORS.card];
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Award size={20} color={COLORS.accent} />
        <Text style={styles.title}>Your Badges</Text>
      </View>

      <View style={styles.spendCard}>
        <Text style={styles.spendLabel}>Total Lifetime Spend</Text>
        <Text style={styles.spendValue}>{formatCurrency(totalSpend)}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesScroll}>
        {badges.map((badge) => (
          <View key={badge.id} style={styles.badgeCard}>
            <LinearGradient
              colors={getTierColor(badge.badgeType) as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.badgeGradient}
            >
              <Star size={24} color={COLORS.text} />
              <Text style={styles.badgeVenue}>{badge.venueName}</Text>
              <Text style={styles.badgeTier}>{badge.badgeType}</Text>
            </LinearGradient>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  spendCard: {
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  spendLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  spendValue: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.accent,
  },
  badgesScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  badgeCard: {
    width: 140,
    height: 160,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  badgeGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  badgeVenue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  badgeTier: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
});
