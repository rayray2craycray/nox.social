import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Streak } from '@/types';
import { Flame, Trophy, Users, Calendar, Award } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface StreakBadgeProps {
  streak: Streak;
  onPress?: () => void;
  size?: 'small' | 'large';
}

const StreakBadgeComponent = ({ streak, onPress, size = 'large' }: StreakBadgeProps) => {
  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };
  const getStreakIcon = () => {
    const iconSize = size === 'small' ? 20 : 28;
    const iconMap = {
      'WEEKEND_WARRIOR': Calendar,
      'VENUE_LOYALTY': Flame,
      'SOCIAL_BUTTERFLY': Users,
      'EVENT_ENTHUSIAST': Trophy,
    };
    const IconComponent = iconMap[streak.type] || Flame;
    return <IconComponent size={iconSize} color="#fff" />;
  };

  const getStreakTitle = () => {
    return {
      'WEEKEND_WARRIOR': 'Weekend Warrior',
      'VENUE_LOYALTY': 'Venue Loyalty',
      'SOCIAL_BUTTERFLY': 'Social Butterfly',
      'EVENT_ENTHUSIAST': 'Event Enthusiast',
    }[streak.type] || 'Streak';
  };

  const getGradientColors = (): [string, string] => {
    const map: Record<string, [string, string]> = {
      'WEEKEND_WARRIOR': ['#F59E0B', '#EF4444'],
      'VENUE_LOYALTY': ['#8B5CF6', '#EC4899'],
      'SOCIAL_BUTTERFLY': ['#3B82F6', '#8B5CF6'],
      'EVENT_ENTHUSIAST': ['#10B981', '#06B6D4'],
    };
    return map[streak.type] || ['#F59E0B', '#EF4444'];
  };

  const progressToNextMilestone = () => {
    if (!streak.rewards.nextMilestone) return 100;
    return (streak.currentStreak / streak.rewards.nextMilestone) * 100;
  };

  const daysUntilExpiry = () => {
    const lastActivity = new Date(streak.lastActivityDate);
    const now = new Date();
    const diffTime = now.getTime() - lastActivity.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Streak expires after 2 days of inactivity
    const daysLeft = 2 - diffDays;
    return Math.max(0, daysLeft);
  };

  const isExpiringSoon = daysUntilExpiry() === 0;

  if (size === 'small') {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.smallBadge}
        >
          {getStreakIcon()}
          <View style={styles.smallContent}>
            <Text style={styles.smallStreakCount}>{streak.currentStreak}</Text>
            <Text style={styles.smallLabel}>day streak</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.largeBadge}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            {getStreakIcon()}
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>{getStreakTitle()}</Text>
            <Text style={styles.subtitle}>
              {isExpiringSoon ? '⚠️ Expires today!' : `${daysUntilExpiry()} days to keep it`}
            </Text>
          </View>
        </View>

        <View style={styles.streakInfo}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{streak.currentStreak}</Text>
            <Text style={styles.statLabel}>Current</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{streak.longestStreak}</Text>
            <Text style={styles.statLabel}>Best</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {streak.rewards.nextMilestone || '∞'}
            </Text>
            <Text style={styles.statLabel}>Next Goal</Text>
          </View>
        </View>

        {streak.rewards.nextMilestone && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, progressToNextMilestone())}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {streak.currentStreak} / {streak.rewards.nextMilestone}
            </Text>
          </View>
        )}

        {streak.rewards.currentRewards.length > 0 && (
          <View style={styles.rewardsContainer}>
            <Award size={14} color="#FCD34D" />
            <Text style={styles.rewardsText}>
              {streak.rewards.currentRewards.length} reward{streak.rewards.currentRewards.length > 1 ? 's' : ''} available
            </Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

export const StreakBadge = React.memo(StreakBadgeComponent);

const styles = StyleSheet.create({
  smallBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  smallContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  smallStreakCount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  smallLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  largeBadge: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  streakInfo: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressContainer: {
    gap: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  rewardsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(252,211,77,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rewardsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FCD34D',
  },
});
