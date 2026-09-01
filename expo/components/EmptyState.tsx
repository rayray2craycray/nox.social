/**
 * EmptyState
 *
 * A polished, on-brand empty state for first-run / no-data screens. An icon in
 * a soft accent halo, a balanced title, a supporting line, and an optional
 * gradient CTA that actually moves the user forward (e.g. "Explore venues").
 * Empty screens are a new user's first impression — they should invite action,
 * not dead-end.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { LucideIcon } from 'lucide-react-native';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  style?: ViewStyle;
}

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  style,
}: EmptyStateProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAction?.();
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.halo}>
        <Icon size={34} color="#ff2d78" />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.85} style={styles.ctaWrap}>
          <LinearGradient
            colors={['#ff2d78', '#a855f7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cta}
          >
            {ActionIcon ? <ActionIcon size={18} color="#000" /> : null}
            <Text style={styles.ctaText}>{actionLabel}</Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 36,
  },
  halo: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,45,120,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,45,120,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: '#9a9aab',
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 10,
    maxWidth: 300,
  },
  ctaWrap: { marginTop: 24 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
  },
  ctaText: { color: '#000000', fontSize: 15, fontWeight: '800' },
});
