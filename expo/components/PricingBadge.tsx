import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DynamicPricing } from '@/types';
import { Timer, Zap, Clock, Sparkles } from 'lucide-react-native';

interface PricingBadgeProps {
  pricing: DynamicPricing;
  size?: 'small' | 'medium' | 'large';
}

export function PricingBadge({ pricing, size = 'medium' }: PricingBadgeProps) {
  const getReasonIcon = () => {
    const iconSize = size === 'small' ? 12 : size === 'medium' ? 14 : 16;
    const IconComponent = {
      'SLOW_HOUR': Clock,
      'EARLY_BIRD': Timer,
      'APP_EXCLUSIVE': Sparkles,
      'HAPPY_HOUR': Zap,
      'FLASH_SALE': Zap,
    }[pricing.reason] || Zap;

    return <IconComponent size={iconSize} color="#fff" />;
  };

  const getReasonLabel = () => {
    return {
      'SLOW_HOUR': 'Off-Peak',
      'EARLY_BIRD': 'Early Bird',
      'APP_EXCLUSIVE': 'App Only',
      'HAPPY_HOUR': 'Happy Hour',
      'FLASH_SALE': 'Flash Sale',
    }[pricing.reason] || 'Special';
  };

  const getGradientColors = (): [string, string] => {
    const map: Record<string, [string, string]> = {
      'SLOW_HOUR': ['#8B5CF6', '#6366F1'],
      'EARLY_BIRD': ['#3B82F6', '#2563EB'],
      'APP_EXCLUSIVE': ['#EC4899', '#D946EF'],
      'HAPPY_HOUR': ['#F59E0B', '#EF4444'],
      'FLASH_SALE': ['#EF4444', '#DC2626'],
    };
    return map[pricing.reason] || ['#8B5CF6', '#6366F1'];
  };

  const isExpiringSoon = () => {
    const timeRemaining = new Date(pricing.validUntil).getTime() - Date.now();
    return timeRemaining < 30 * 60 * 1000; // Less than 30 minutes
  };

  const fontSize = size === 'small' ? 11 : size === 'medium' ? 13 : 15;
  const paddingHorizontal = size === 'small' ? 6 : size === 'medium' ? 8 : 10;
  const paddingVertical = size === 'small' ? 3 : size === 'medium' ? 4 : 5;

  return (
    <LinearGradient
      colors={getGradientColors()}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.badge,
        {
          paddingHorizontal,
          paddingVertical,
        },
        isExpiringSoon() && styles.pulsing,
      ]}
    >
      <View style={styles.content}>
        {getReasonIcon()}
        <Text style={[styles.text, { fontSize }]}>
          {pricing.discountPercentage}% OFF
        </Text>
        {size !== 'small' && (
          <Text style={[styles.reason, { fontSize: fontSize - 2 }]}>
            {getReasonLabel()}
          </Text>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  pulsing: {
    // Add animation for expiring offers
    opacity: 0.95,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  reason: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    marginLeft: 2,
  },
});
