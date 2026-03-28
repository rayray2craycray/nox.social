/**
 * VideoTrimmer Component
 * Allows users to trim video start and end points
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Scissors } from 'lucide-react-native';
import { COLORS } from './types';

interface VideoTrimmerProps {
  trimStart: number;
  trimEnd: number;
  videoDuration: number;
  onTrimStartChange: (value: number) => void;
  onTrimEndChange: (value: number) => void;
}

export const VideoTrimmer: React.FC<VideoTrimmerProps> = ({
  trimStart,
  trimEnd,
  videoDuration,
  onTrimStartChange,
  onTrimEndChange,
}) => {
  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds)}s`;
  };

  const trimmedDuration = trimEnd - trimStart;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Scissors size={20} color={COLORS.accent} />
        <Text style={styles.title}>Trim Video</Text>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatTime(trimmedDuration)}</Text>
        </View>
      </View>

      <View style={styles.sliderContainer}>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Start</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={videoDuration - 1}
            value={trimStart}
            onValueChange={onTrimStartChange}
            minimumTrackTintColor={COLORS.accent}
            maximumTrackTintColor={COLORS.border}
            thumbTintColor={COLORS.accent}
          />
          <Text style={styles.sliderValue}>{formatTime(trimStart)}</Text>
        </View>

        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>End</Text>
          <Slider
            style={styles.slider}
            minimumValue={trimStart + 1}
            maximumValue={videoDuration}
            value={trimEnd}
            onValueChange={onTrimEndChange}
            minimumTrackTintColor={COLORS.accent}
            maximumTrackTintColor={COLORS.border}
            thumbTintColor={COLORS.accent}
          />
          <Text style={styles.sliderValue}>{formatTime(trimEnd)}</Text>
        </View>
      </View>

      {trimmedDuration < 10 && (
        <View style={styles.warning}>
          <Text style={styles.warningText}>⚠️ Video must be at least 10 seconds</Text>
        </View>
      )}
      {trimmedDuration > 15 && (
        <View style={styles.warning}>
          <Text style={styles.warningText}>⚠️ Video must be no longer than 15 seconds</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
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
    flex: 1,
  },
  durationBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  sliderContainer: {
    gap: 16,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    width: 40,
  },
  slider: {
    flex: 1,
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    width: 40,
    textAlign: 'right',
  },
  warning: {
    marginTop: 12,
    padding: 12,
    backgroundColor: COLORS.warning + '20',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  warningText: {
    fontSize: 13,
    color: COLORS.warning,
  },
});
