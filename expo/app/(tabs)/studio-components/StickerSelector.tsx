/**
 * StickerSelector Component
 * Allows users to add call-to-action stickers to videos
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Sticker } from 'lucide-react-native';
import { COLORS, StickerType } from './types';

interface StickerSelectorProps {
  selectedSticker: StickerType;
  onSelectSticker: (sticker: StickerType) => void;
}

const STICKERS: { value: StickerType; label: string; emoji: string }[] = [
  { value: 'none', label: 'None', emoji: '' },
  { value: 'get-tickets', label: 'Get Tickets', emoji: '🎟️' },
  { value: 'join-lobby', label: 'Join Lobby', emoji: '🎪' },
  { value: 'live-tonight', label: 'Live Tonight', emoji: '🔥' },
  { value: 'swipe-up', label: 'Swipe Up', emoji: '⬆️' },
];

export const StickerSelector: React.FC<StickerSelectorProps> = ({
  selectedSticker,
  onSelectSticker
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Sticker size={20} color={COLORS.accent} />
        <Text style={styles.title}>Call-to-Action Stickers</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stickersScroll}>
        {STICKERS.map((sticker) => (
          <TouchableOpacity
            key={sticker.value}
            onPress={() => onSelectSticker(sticker.value)}
            style={[
              styles.stickerOption,
              selectedSticker === sticker.value && styles.stickerOptionSelected,
            ]}
          >
            {sticker.emoji && <Text style={styles.stickerEmoji}>{sticker.emoji}</Text>}
            <Text
              style={[
                styles.stickerLabel,
                selectedSticker === sticker.value && styles.stickerLabelSelected,
              ]}
            >
              {sticker.label}
            </Text>
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
  stickersScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  stickerOption: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    minWidth: 100,
  },
  stickerOptionSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent + '20',
  },
  stickerEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  stickerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  stickerLabelSelected: {
    color: COLORS.accent,
  },
});
