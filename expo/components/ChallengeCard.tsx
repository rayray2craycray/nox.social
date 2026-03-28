import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Users, TrendingUp, Zap, Star } from 'lucide-react-native';
import { Challenge, ChallengeProgress } from '@/types';
import * as Haptics from 'expo-haptics';

interface ChallengeCardProps {
  challenge: Challenge;
  progress?: ChallengeProgress;
  onPress: () => void;
}

const ChallengeCardComponent = ({ challenge, progress, onPress }: ChallengeCardProps) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const progressPercentage = progress
    ? Math.min((progress.currentProgress / challenge.requirements.target) * 100, 100)
    : 0;

  const difficultyColors = {
    EASY: '#00ff80',
    MEDIUM: '#00d4ff',
    HARD: '#ffa64d',
    LEGENDARY: '#a855f7',
  };

  const difficultyColor = difficultyColors[challenge.difficulty];

  const rewardIcons = {
    DISCOUNT: '💰',
    FREE_DRINK: '🍹',
    VIP_ACCESS: '👑',
    SKIP_LINE: '⚡',
    BADGE: '🏆',
    POINTS: '⭐',
  };

  const rewardIcon = rewardIcons[challenge.reward.type] || '🎁';

  const completionRate =
    challenge.participantCount > 0
      ? Math.round((challenge.completedCount / challenge.participantCount) * 100)
      : 0;

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{challenge.title}</Text>
            <Text style={styles.description} numberOfLines={2}>
              {challenge.description}
            </Text>
          </View>
          <View style={[styles.difficultyBadge, { backgroundColor: `${difficultyColor}20` }]}>
            <Text style={[styles.difficultyText, { color: difficultyColor }]}>
              {challenge.difficulty}
            </Text>
          </View>
        </View>

        {/* Progress Bar (if user joined) */}
        {progress && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>
                {progress.currentProgress} / {challenge.requirements.target}
              </Text>
              <Text style={styles.progressPercentage}>{Math.round(progressPercentage)}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <LinearGradient
                colors={['#00d4ff', '#a855f7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBar, { width: `${progressPercentage}%` }]}
              />
            </View>
            {progress.status === 'COMPLETED' && (
              <View style={styles.completedBadge}>
                <Trophy size={14} color="#00ff80" />
                <Text style={styles.completedText}>Completed!</Text>
              </View>
            )}
          </View>
        )}

        {/* Reward */}
        <View style={styles.rewardSection}>
          <Text style={styles.rewardEmoji}>{rewardIcon}</Text>
          <Text style={styles.rewardText} numberOfLines={1}>
            {challenge.reward.description}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Users size={14} color="#999" />
            <Text style={styles.statValue}>{challenge.participantCount}</Text>
            <Text style={styles.statLabel}>Joined</Text>
          </View>
          <View style={styles.statItem}>
            <Trophy size={14} color="#999" />
            <Text style={styles.statValue}>{challenge.completedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <TrendingUp size={14} color="#999" />
            <Text style={styles.statValue}>{completionRate}%</Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </View>
        </View>

        {/* Venue-specific badge */}
        {challenge.venueId && (
          <View style={styles.venueBadge}>
            <Text style={styles.venueBadgeText}>Venue Challenge</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

export const ChallengeCard = React.memo(ChallengeCardComponent);

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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#ccc',
    lineHeight: 18,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  progressPercentage: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00d4ff',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(0, 255, 128, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00ff80',
  },
  rewardSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  rewardEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  rewardText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#a855f7',
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
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '600',
  },
  venueBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  venueBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00d4ff',
  },
});
