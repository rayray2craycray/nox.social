import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Trophy, Star } from 'lucide-react-native';
import { ChallengeCard } from '@/components/ChallengeCard';
import { useSocial } from '@/contexts/SocialContext';
import * as Haptics from 'expo-haptics';

export default function ChallengesScreen() {
  const {
    activeChallenges,
    userChallengeProgress,
    joinChallenge,
    getChallengeProgressForChallenge,
    isChallengesLoading,
  } = useSocial();

  const [filter, setFilter] = useState<'all' | 'joined' | 'available'>('all');

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const joinedChallengeIds = useMemo(
    () => userChallengeProgress.map((p) => p.challengeId),
    [userChallengeProgress]
  );

  const filteredChallenges = useMemo(() => {
    return activeChallenges.filter((challenge) => {
      const isJoined = joinedChallengeIds.includes(challenge.id);
      if (filter === 'joined') return isJoined;
      if (filter === 'available') return !isJoined;
      return true;
    });
  }, [activeChallenges, joinedChallengeIds, filter]);

  const handleChallengePress = (challengeId: string) => {
    const progress = getChallengeProgressForChallenge(challengeId);

    if (progress) {
      // Already joined - show details
      Alert.alert(
        'Challenge Progress',
        `You're working on this challenge!\n\nProgress: ${progress.currentProgress} / ${activeChallenges.find((c) => c.id === challengeId)?.requirements.target}`,
        [{ text: 'OK' }]
      );
    } else {
      // Not joined - offer to join
      const challenge = activeChallenges.find((c) => c.id === challengeId);
      if (challenge) {
        Alert.alert(
          'Join Challenge',
          `Do you want to join "${challenge.title}"?\n\nReward: ${challenge.reward.description}`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Join',
              onPress: () => {
                joinChallenge(challengeId);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              },
            },
          ]
        );
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['rgba(10,10,15,0.95)', 'transparent']}
          style={styles.headerGradient}
        />
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Challenges</Text>
            <Text style={styles.headerSubtitle}>
              {activeChallenges.length} active challenges
            </Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.activeFilterChip]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setFilter('all');
          }}
        >
          <Text
            style={[
              styles.filterChipText,
              filter === 'all' && styles.activeFilterChipText,
            ]}
          >
            All ({activeChallenges.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'joined' && styles.activeFilterChip]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setFilter('joined');
          }}
        >
          <Text
            style={[
              styles.filterChipText,
              filter === 'joined' && styles.activeFilterChipText,
            ]}
          >
            Joined ({joinedChallengeIds.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterChip,
            filter === 'available' && styles.activeFilterChip,
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setFilter('available');
          }}
        >
          <Text
            style={[
              styles.filterChipText,
              filter === 'available' && styles.activeFilterChipText,
            ]}
          >
            Available ({activeChallenges.length - joinedChallengeIds.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Trophy size={20} color="#00d4ff" />
          <Text style={styles.statValue}>{joinedChallengeIds.length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Star size={20} color="#a855f7" />
          <Text style={styles.statValue}>
            {
              userChallengeProgress.filter((p) => p.status === 'COMPLETED')
                .length
            }
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>🎁</Text>
          <Text style={styles.statValue}>
            {
              userChallengeProgress.filter((p) => p.status === 'COMPLETED')
                .length
            }
          </Text>
          <Text style={styles.statLabel}>Rewards</Text>
        </View>
      </View>

      {/* Challenges List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {isChallengesLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ff0080" />
            <Text style={styles.loadingText}>Loading challenges...</Text>
          </View>
        ) : filteredChallenges.length === 0 ? (
          <View style={styles.emptyState}>
            <Trophy size={48} color="#666" />
            <Text style={styles.emptyStateText}>No challenges found</Text>
            <Text style={styles.emptyStateSubtext}>
              {filter === 'joined'
                ? 'Join some challenges to get started!'
                : 'Check back later for new challenges'}
            </Text>
          </View>
        ) : (
          filteredChallenges.map((challenge) => {
            const progress = getChallengeProgressForChallenge(challenge.id);
            return (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                progress={progress}
                onPress={() => handleChallengePress(challenge.id)}
              />
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    position: 'relative',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#00d4ff',
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
  },
  activeFilterChip: {
    backgroundColor: '#00d4ff',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#999',
  },
  activeFilterChipText: {
    color: '#000',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginTop: 6,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
});
