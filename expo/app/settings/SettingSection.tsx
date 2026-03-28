/**
 * SettingSection Component
 * Groups related settings with a title and optional footer
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from './types';

interface SettingSectionProps {
  title?: string;
  footer?: string;
  children: React.ReactNode;
}

export const SettingSection: React.FC<SettingSectionProps> = ({ title, footer, children }) => {
  return (
    <View style={styles.section}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.content}>{children}</View>
      {footer && <Text style={styles.footer}>{footer}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 16,
  },
  content: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  footer: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
    marginLeft: 16,
    marginRight: 16,
    lineHeight: 18,
  },
});
