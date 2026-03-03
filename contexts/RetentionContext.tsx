import createContextHook from '@nkzw/create-context-hook';
import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Streak, Memory } from '@/types';
// Mock data imports removed - using empty defaults when API unavailable
import { retentionApi } from '@/services/api';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';

export const [RetentionProvider, useRetention] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  // ===== QUERIES =====
  const userStreaksQuery = useQuery({
    queryKey: ['user-streaks'],
    queryFn: async () => {
      if (!userId) return [];
      try {
        // Use userId from auth context
        const response = await retentionApi.getUserStreaks(userId);
        return response.data || [];
      } catch (error) {
        // Silently handle missing endpoint
        if (__DEV__) console.log('[Retention] Endpoint not implemented: user streaks');
        return [];
      }
    },
  });

  const memoriesQuery = useQuery({
    queryKey: ['memories'],
    queryFn: async () => {
      if (!userId) return [];
      try {
        // Use userId from auth context
        const response = await retentionApi.getUserMemories(userId);
        return response.data || [];
      } catch (error) {
        // Silently handle missing endpoint
        if (__DEV__) console.log('[Retention] Endpoint not implemented: memories');
        return [];
      }
    },
  });

  const userStreaks = useMemo(() => userStreaksQuery.data || [], [userStreaksQuery.data]);
  const memories = useMemo(() => memoriesQuery.data || [], [memoriesQuery.data]);
  const activeStreaks = useMemo(() => {
    return userStreaks.filter(s => s.currentStreak > 0);
  }, [userStreaks]);

  // ===== MUTATIONS =====
  const claimStreakRewardMutation = useMutation({
    mutationFn: async (streakId: string) => {
      if (!userId) throw new Error('User not authenticated');
      try {
        // Use userId from auth context
        const response = await retentionApi.claimStreakReward(streakId, userId);
        return response.data!;
      } catch (error) {
        console.error('Failed to claim streak reward:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-streaks'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Reward Claimed!', 'Your streak reward has been added to your account.');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to claim streak reward');
    },
  });

  const addMemoryMutation = useMutation({
    mutationFn: async (memory: Omit<Memory, 'id' | 'userId' | 'createdAt'>) => {
      if (!userId) throw new Error('User not authenticated');
      try {
        // Use userId from auth context
        const response = await retentionApi.createMemory({
          userId,
          venueId: memory.venueId,
          date: memory.date,
          type: memory.type,
          content: memory.content,
          isPrivate: memory.isPrivate,
        });
        return response.data!;
      } catch (error) {
        console.error('Failed to add memory:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Memory Saved!', 'Your memory has been saved to your timeline.');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to save memory');
    },
  });

  const updateMemoryPrivacyMutation = useMutation({
    mutationFn: async ({ memoryId, isPrivate }: { memoryId: string; isPrivate: boolean }) => {
      try {
        const response = await retentionApi.updateMemoryPrivacy(memoryId, isPrivate);
        return response.data!;
      } catch (error) {
        console.error('Failed to update memory privacy:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update memory privacy');
    },
  });

  const checkStreakStatus = useCallback((streakType: Streak['type']) => {
    return userStreaks.find(s => s.type === streakType);
  }, [userStreaks]);

  const claimStreakReward = useCallback((streakId: string) => {
    claimStreakRewardMutation.mutate(streakId);
  }, [claimStreakRewardMutation]);

  const addMemory = useCallback((memory: Omit<Memory, 'id' | 'userId' | 'createdAt'>) => {
    addMemoryMutation.mutate(memory);
  }, [addMemoryMutation]);

  const getTimeline = useCallback((limit?: number) => {
    // Filter and sort memories by date
    return memories
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }, [memories]);

  const getVenueMemories = useCallback((venueId: string) => {
    return memories.filter(m => m.venueId === venueId);
  }, [memories]);

  const updateMemoryPrivacy = useCallback((memoryId: string, isPrivate: boolean) => {
    updateMemoryPrivacyMutation.mutate({ memoryId, isPrivate });
  }, [updateMemoryPrivacyMutation]);

  // Calculate total stats
  const stats = useMemo(() => ({
    totalStreaks: userStreaks.length,
    activeStreaks: activeStreaks.length,
    longestStreak: Math.max(...userStreaks.map(s => s.longestStreak), 0),
    totalMemories: memories.length,
    rewardsEarned: userStreaks.reduce((sum, s) => sum + s.rewards.currentRewards.length, 0),
  }), [userStreaks, activeStreaks, memories]);

  return {
    userStreaks,
    activeStreaks,
    checkStreakStatus,
    claimStreakReward,
    memories,
    addMemory,
    getTimeline,
    getVenueMemories,
    updateMemoryPrivacy,
    stats,
    isLoading: userStreaksQuery.isLoading || memoriesQuery.isLoading,
  };
});
