/**
 * LinkedCardItem Component
 * Displays a linked payment card with options
 *
 * Performance: Memoized with useMemo for gradient colors
 */

import React, { memo, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CreditCard, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LinkedCard, COLORS } from './types';

interface LinkedCardItemProps {
  card: LinkedCard;
  onRemove: (cardId: string) => void;
}

const LinkedCardItemComponent = ({ card, onRemove }: LinkedCardItemProps) => {
  // Memoize gradient colors to avoid recalculation
  const gradientColors = useMemo((): [string, string] => {
    switch (card.brand.toLowerCase()) {
      case 'visa':
        return ['#1434CB', '#1A1F71'];
      case 'mastercard':
        return ['#EB001B', '#F79E1B'];
      case 'amex':
        return ['#006FCF', '#00A3E0'];
      default:
        return [COLORS.purple, COLORS.accent];
    }
  }, [card.brand]);

  // Memoize remove handler
  const handleRemove = useCallback(() => {
    onRemove(card.id);
  }, [card.id, onRemove]);

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={gradientColors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <CreditCard size={24} color={COLORS.text} />
            <View style={styles.cardDetails}>
              <Text style={styles.cardBrand}>{card.brand}</Text>
              <Text style={styles.cardNumber}>•••• {card.last4}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleRemove}
            style={styles.removeButton}
          >
            <X size={18} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        {card.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>Default</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};
LinkedCardItemComponent.displayName = 'LinkedCardItem';
export const LinkedCardItem = memo(LinkedCardItemComponent);

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardDetails: {
    gap: 4,
  },
  cardBrand: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  cardNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 12,
  },
  defaultText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
});
