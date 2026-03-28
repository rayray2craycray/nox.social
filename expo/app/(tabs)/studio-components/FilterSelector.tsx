/**
 * FilterSelector Component
 * Allows users to select video filters
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { COLORS, VibeFilter } from './types';

interface FilterSelectorProps {
  selectedFilter: VibeFilter;
  onSelectFilter: (filter: VibeFilter) => void;
}

const FILTERS: { value: VibeFilter; label: string; description: string }[] = [
  { value: 'none', label: 'None', description: 'Original' },
  { value: 'neon-glitch', label: 'Neon Glitch', description: 'Cyberpunk vibes' },
  { value: 'afterhours-noir', label: 'Afterhours Noir', description: 'Dark & moody' },
  { value: 'vhs-retro', label: 'VHS Retro', description: '90s throwback' },
  { value: 'cyber-wave', label: 'Cyber Wave', description: 'Synthwave aesthetic' },
  { value: 'golden-hour', label: 'Golden Hour', description: 'Warm & inviting' },
];

export const FilterSelector: React.FC<FilterSelectorProps> = ({ selectedFilter, onSelectFilter }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Sparkles size={20} color={COLORS.accent} />
        <Text style={styles.title}>Vibe Filters</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            onPress={() => onSelectFilter(filter.value)}
            style={[
              styles.filterOption,
              selectedFilter === filter.value && styles.filterOptionSelected,
            ]}
          >
            <Text
              style={[
                styles.filterLabel,
                selectedFilter === filter.value && styles.filterLabelSelected,
              ]}
            >
              {filter.label}
            </Text>
            <Text style={styles.filterDescription}>{filter.description}</Text>
          </TouchableOpacity>
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
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  filtersScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  filterOption: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 120,
  },
  filterOptionSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent + '20',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  filterLabelSelected: {
    color: COLORS.accent,
  },
  filterDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
