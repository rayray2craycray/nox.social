/**
 * StatsCard Component
 * Displays analytics statistics in a card format
 *
 * Performance: Memoized to prevent unnecessary re-renders
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from './types';

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
}

const StatsCardComponent = ({ icon, label, value, subtitle }: StatsCardProps) => {
  return (
    <View style={styles.statsCard}>
      <LinearGradient
        colors={[COLORS.purple, COLORS.accent] as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statsIconContainer}
      >
        {icon}
      </LinearGradient>
      <View style={styles.statsContent}>
        <Text style={styles.statsLabel}>{label}</Text>
        <Text style={styles.statsValue}>{value}</Text>
        {subtitle && <Text style={styles.statsSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
};
StatsCardComponent.displayName = 'StatsCard';
export const StatsCard = memo(StatsCardComponent);

const styles = StyleSheet.create({
  statsCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  statsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContent: {
    flex: 1,
  },
  statsLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  statsSubtitle: {
    fontSize: 12,
    color: COLORS.success,
    marginTop: 2,
  },
});
