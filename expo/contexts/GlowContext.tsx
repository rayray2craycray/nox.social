import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

type GlowColor = 'pink' | 'purple' | 'gold' | 'white';

interface GlowTriggerOptions {
  color?: GlowColor;
  intensity?: number;
  duration?: number;
}

export const [GlowProvider, useGlow] = createContextHook(() => {
  const [glowActive, setGlowActive] = useState(false);
  const [glowColor, setGlowColor] = useState<GlowColor>('pink');
  const [opacity] = useState(new Animated.Value(0));

  const triggerGlow = useCallback((options: GlowTriggerOptions = {}) => {
    const {
      color = 'pink',
      intensity = 0.5,
      duration = 800,
    } = options;

    setGlowColor(color);
    setGlowActive(true);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Animated.sequence([
      Animated.timing(opacity, {
        toValue: intensity,
        duration: duration * 0.3,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: duration * 0.7,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setGlowActive(false);
    });
  }, [opacity]);

  return {
    triggerGlow,
    GlowOverlay: () => {
      if (!glowActive) return null;

      const colors: Record<GlowColor, readonly [string, string, string]> = {
        pink: ['rgba(236, 72, 153, 0)', 'rgba(236, 72, 153, 0.8)', 'rgba(236, 72, 153, 0)'] as const,
        purple: ['rgba(168, 85, 247, 0)', 'rgba(168, 85, 247, 0.8)', 'rgba(168, 85, 247, 0)'] as const,
        gold: ['rgba(251, 191, 36, 0)', 'rgba(251, 191, 36, 0.8)', 'rgba(251, 191, 36, 0)'] as const,
        white: ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0)'] as const,
      };

      return (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { opacity, pointerEvents: 'none' },
          ]}
        >
          <LinearGradient
            colors={colors[glowColor]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </Animated.View>
      );
    },
  };
});
