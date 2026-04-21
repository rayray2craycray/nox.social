/**
 * SettingRow Component
 * Reusable row component for settings options
 *
 * Performance: Memoized with useCallback for handlers
 */

import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from './types';

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  showChevron?: boolean;
  showSwitch?: boolean;
  switchValue?: boolean;
  onPress?: () => void;
  onSwitchChange?: (value: boolean) => void;
  destructive?: boolean;
}

const SettingRowComponent = ({
  icon,
  label,
  value,
  showChevron = true,
  showSwitch = false,
  switchValue = false,
  onPress,
  onSwitchChange,
  destructive = false,
}: SettingRowProps) => {
  // Memoize handlers to prevent child re-renders
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }, [onPress]);

  const handleSwitchChange = useCallback((newValue: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSwitchChange?.(newValue);
  }, [onSwitchChange]);

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={handlePress}
      disabled={!onPress && !onSwitchChange}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>{icon}</View>
      <View style={styles.content}>
        <Text style={[styles.label, destructive && styles.labelDestructive]}>{label}</Text>
        {value && <Text style={styles.value}>{value}</Text>}
      </View>
      {showSwitch && (
        <Switch
          value={switchValue}
          onValueChange={handleSwitchChange}
          trackColor={{ false: COLORS.border, true: COLORS.accent }}
          thumbColor={COLORS.text}
        />
      )}
      {showChevron && !showSwitch && (
        <ChevronRight size={20} color={COLORS.textSecondary} />
      )}
    </TouchableOpacity>
  );
};
SettingRowComponent.displayName = 'SettingRow';
export const SettingRow = memo(SettingRowComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 16,
    marginBottom: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  labelDestructive: {
    color: COLORS.error,
  },
  value: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
