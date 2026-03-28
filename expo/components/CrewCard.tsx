import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, Crown, TrendingUp } from 'lucide-react-native';
import { Crew } from '@/types';
import * as Haptics from 'expo-haptics';

interface CrewCardProps {
  crew: Crew;
  onPress: () => void;
  isOwner?: boolean;
}

export function CrewCard({ crew, onPress, isOwner = false }: CrewCardProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      <LinearGradient
        colors={isOwner ? ['#a855f7', '#7c3aed'] : ['#1a1a2e', '#16213e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Header with Image */}
        <View style={styles.header}>
          {crew.imageUrl ? (
            <Image
              source={{ uri: crew.imageUrl }}
              style={styles.crewImage}
              contentFit="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Users size={32} color="#fff" />
            </View>
          )}
          <View style={styles.headerInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.crewName} numberOfLines={1}>
                {crew.name}
              </Text>
              {isOwner && (
                <View style={styles.ownerBadge}>
                  <Crown size={14} color="#ffd700" />
                </View>
              )}
            </View>
            {crew.description && (
              <Text style={styles.description} numberOfLines={2}>
                {crew.description}
              </Text>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Users size={16} color="#00d4ff" />
            <Text style={styles.statValue}>{crew.memberIds.length}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.statItem}>
            <TrendingUp size={16} color="#a855f7" />
            <Text style={styles.statValue}>{crew.stats.totalNightsOut}</Text>
            <Text style={styles.statLabel}>Nights Out</Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.streakBadge}>
              <Text style={styles.streakEmoji}>🔥</Text>
            </View>
            <Text style={styles.statValue}>{crew.stats.streakDays}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>

        {/* Privacy Badge */}
        {crew.isPrivate && (
          <View style={styles.privateBadge}>
            <Text style={styles.privateBadgeText}>Private</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    padding: 16,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  crewImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  crewName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    flex: 1,
  },
  ownerBadge: {
    marginLeft: 8,
    padding: 4,
  },
  description: {
    fontSize: 13,
    color: '#ccc',
    lineHeight: 18,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
  },
  streakBadge: {
    backgroundColor: 'rgba(255, 166, 77, 0.2)',
    padding: 2,
    borderRadius: 8,
  },
  streakEmoji: {
    fontSize: 16,
  },
  privateBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  privateBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffa64d',
  },
});
