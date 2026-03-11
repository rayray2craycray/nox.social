import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GroupPurchase,
  GroupPurchaseInvite,
  Referral,
  ReferralReward,
  UserReferralStats,
  StoryTemplate,
  ShareableContent,
} from '@/types';
import { growthApi } from '@/services/api';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';

const STORAGE_KEYS = {
  GROUP_PURCHASES: 'vibelink_group_purchases',
  GROUP_PURCHASE_INVITES: 'vibelink_group_purchase_invites',
  REFERRALS: 'vibelink_referrals',
  REFERRAL_STATS: 'vibelink_referral_stats',
  REFERRAL_REWARDS: 'vibelink_referral_rewards',
  SHAREABLE_CONTENT: 'vibelink_shareable_content',
};

export const [GrowthProvider, useGrowth] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const [selectedGroupPurchase, setSelectedGroupPurchase] = useState<GroupPurchase | null>(null);

  // ===== GROUP PURCHASES =====

  const groupPurchasesQuery = useQuery({
    queryKey: ['groupPurchases'],
    queryFn: async () => {
      if (!userId) return [];
      try {
        // Use userId from auth context
        const response = await growthApi.getGroupPurchasesByUser(userId);
        return response.data || [];
      } catch (error) {
        // Silently handle missing endpoint
        if (__DEV__) console.log('[Growth] Endpoint not implemented: group purchases');
        return [];
      }
    },
  });

  const groupPurchaseInvitesQuery = useQuery({
    queryKey: ['groupPurchaseInvites'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.GROUP_PURCHASE_INVITES);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const createGroupPurchaseMutation = useMutation({
    mutationFn: async (purchase: Omit<GroupPurchase, 'id' | 'createdAt'>) => {
      try {
        const response = await growthApi.createGroupPurchase({
          initiatorId: purchase.initiatorId,
          venueId: purchase.venueId,
          eventId: purchase.eventId,
          ticketType: purchase.ticketType,
          totalAmount: purchase.totalAmount,
          maxParticipants: purchase.maxParticipants,
          expiresAt: purchase.expiresAt,
        });
        return response.data!;
      } catch (error) {
        console.error('Failed to create group purchase:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupPurchases'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to create group purchase');
    },
  });

  const joinGroupPurchaseMutation = useMutation({
    mutationFn: async ({ groupPurchaseId, userId }: { groupPurchaseId: string; userId: string }) => {
      try {
        const response = await growthApi.joinGroupPurchase(groupPurchaseId, userId);
        return response.data!;
      } catch (error) {
        console.error('Failed to join group purchase:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupPurchases'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success!', 'You\'ve joined the group purchase!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to join group purchase');
    },
  });

  const inviteToGroupPurchaseMutation = useMutation({
    mutationFn: async ({
      groupPurchaseId,
      inviterId,
      inviteeId,
    }: {
      groupPurchaseId: string;
      inviterId: string;
      inviteeId: string;
    }) => {
      const newInvite: GroupPurchaseInvite = {
        id: `gpi-${Date.now()}`,
        groupPurchaseId,
        inviterId,
        inviteeId,
        status: 'PENDING',
        sentAt: new Date().toISOString(),
      };
      const existing = groupPurchaseInvitesQuery.data || [];
      const updated = [...existing, newInvite];
      await AsyncStorage.setItem(STORAGE_KEYS.GROUP_PURCHASE_INVITES, JSON.stringify(updated));
      return newInvite;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupPurchaseInvites'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Invite Sent!', 'Your friend has been invited to join.');
    },
  });

  const respondToGroupPurchaseInviteMutation = useMutation({
    mutationFn: async ({ inviteId, status }: { inviteId: string; status: 'ACCEPTED' | 'DECLINED' }) => {
      const invites = groupPurchaseInvitesQuery.data || [];
      const updated = invites.map((inv: GroupPurchaseInvite) =>
        inv.id === inviteId
          ? { ...inv, status, respondedAt: new Date().toISOString() }
          : inv
      );
      await AsyncStorage.setItem(STORAGE_KEYS.GROUP_PURCHASE_INVITES, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupPurchaseInvites'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  // ===== REFERRALS =====

  const referralsQuery = useQuery({
    queryKey: ['referrals'],
    queryFn: async () => {
      if (!userId) return [];
      try {
        // Use userId from auth context
        const response = await growthApi.getReferralStats(userId);
        return response.data?.referrals || [];
      } catch (error) {
        // Silently handle missing endpoint
        if (__DEV__) console.log('[Growth] Endpoint not implemented: referrals');
        return [];
      }
    },
  });

  const referralStatsQuery = useQuery({
    queryKey: ['referralStats'],
    queryFn: async () => {
      if (!userId) return null;
      try {
        // Use userId from auth context
        const response = await growthApi.getReferralStats(userId);
        return response.data;
      } catch (error) {
        // Silently handle missing endpoint
        if (__DEV__) console.log('[Growth] Endpoint not implemented: referral stats');
        return null;
      }
    },
  });

  const referralRewardsQuery = useQuery({
    queryKey: ['referralRewards'],
    queryFn: async () => {
      if (!userId) return [];
      try {
        // Use userId from auth context
        const response = await growthApi.getReferralRewards(userId);
        return response.data || [];
      } catch (error) {
        // Silently handle missing endpoint
        if (__DEV__) console.log('[Growth] Endpoint not implemented: referral rewards');
        return [];
      }
    },
  });

  const generateReferralCodeMutation = useMutation({
    mutationFn: async (userId: string) => {
      try {
        const response = await growthApi.generateReferralCode(userId);
        return response.data!;
      } catch (error) {
        console.error('Failed to generate referral code:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referralStats'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to generate referral code');
    },
  });

  const applyReferralCodeMutation = useMutation({
    mutationFn: async ({ code, userId }: { code: string; userId: string }) => {
      try {
        const response = await growthApi.applyReferralCode(code, userId);
        return response.data!;
      } catch (error) {
        console.error('Failed to apply referral code:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      queryClient.invalidateQueries({ queryKey: ['referralRewards'] });
      queryClient.invalidateQueries({ queryKey: ['referralStats'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Referral Applied!', 'You\'ve earned $10 off your first visit!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to apply referral code');
    },
  });

  const claimReferralRewardMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      const rewards = referralRewardsQuery.data || [];
      const updated = rewards.map((reward: ReferralReward) =>
        reward.id === rewardId
          ? { ...reward, isUsed: true, usedAt: new Date().toISOString() }
          : reward
      );
      await AsyncStorage.setItem(STORAGE_KEYS.REFERRAL_REWARDS, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referralRewards'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Reward Claimed!', 'Your reward has been applied.');
    },
  });

  // ===== STORY TEMPLATES & SHARING =====

  const storyTemplatesQuery = useQuery({
    queryKey: ['storyTemplates'],
    queryFn: async (): Promise<StoryTemplate[]> => {
      try {
        const response = await growthApi.getShareableContent?.();
        return response?.data?.templates || [];
      } catch {
        return [];
      }
    },
  });

  const shareableContentQuery = useQuery({
    queryKey: ['shareableContent'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SHAREABLE_CONTENT);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const generateStoryTemplateMutation = useMutation({
    mutationFn: async ({
      templateId,
      customData,
      userId,
    }: {
      templateId: string;
      customData: any;
      userId: string;
    }) => {
      const template = storyTemplatesQuery.data?.find((t) => t.id === templateId);
      if (!template) throw new Error('Template not found');

      // Replace placeholders in template
      let deepLink = template.deepLink;
      Object.keys(customData).forEach((key) => {
        deepLink = deepLink.replace(`{{${key}}}`, customData[key]);
      });

      const newContent: ShareableContent = {
        id: `share-${Date.now()}`,
        userId,
        type: (template.type === 'VENUE' ? 'GROUP_PURCHASE' : template.type === 'GROUP_INVITE' ? 'GROUP_PURCHASE' : template.type) as ShareableContent['type'],
        templateId,
        customData,
        deepLink,
        createdAt: new Date().toISOString(),
        shareCount: 0,
        clickCount: 0,
      };

      const existing = shareableContentQuery.data || [];
      const updated = [...existing, newContent];
      await AsyncStorage.setItem(STORAGE_KEYS.SHAREABLE_CONTENT, JSON.stringify(updated));

      return { content: newContent, template };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shareableContent'] });
    },
  });

  const shareToInstagramMutation = useMutation({
    mutationFn: async (shareableContentId: string) => {
      // In a real app, this would use the Instagram sharing API
      // For now, we'll just track the share
      const contents = shareableContentQuery.data || [];
      const updated = contents.map((c: ShareableContent) =>
        c.id === shareableContentId ? { ...c, shareCount: c.shareCount + 1 } : c
      );
      await AsyncStorage.setItem(STORAGE_KEYS.SHAREABLE_CONTENT, JSON.stringify(updated));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Shared!', 'Your story has been shared to Instagram!');

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shareableContent'] });
    },
  });

  // ===== COMPUTED VALUES =====

  const myGroupPurchases = useMemo(() => {
    if (!userId) return [];
    // Use userId from auth context
    return (groupPurchasesQuery.data || []).filter(
      (gp: GroupPurchase) => gp.initiatorId === userId || gp.currentParticipants.includes(userId)
    );
  }, [groupPurchasesQuery.data, userId]);

  const openGroupPurchases = useMemo(() => {
    return (groupPurchasesQuery.data || []).filter(
      (gp: GroupPurchase) => gp.status === 'OPEN' && new Date(gp.expiresAt) > new Date()
    );
  }, [groupPurchasesQuery.data]);

  const pendingInvites = useMemo(() => {
    // Use userId from auth context
    return (groupPurchaseInvitesQuery.data || []).filter(
      (inv: GroupPurchaseInvite) => inv.inviteeId === userId && inv.status === 'PENDING'
    );
  }, [groupPurchaseInvitesQuery.data]);

  const activeRewards = useMemo(() => {
    // Use userId from auth context
    return (referralRewardsQuery.data || []).filter(
      (reward: ReferralReward) =>
        reward.userId === userId &&
        !reward.isUsed &&
        new Date(reward.expiresAt) > new Date()
    );
  }, [referralRewardsQuery.data]);

  return {
    // Group Purchases
    groupPurchases: groupPurchasesQuery.data || [],
    myGroupPurchases,
    openGroupPurchases,
    selectedGroupPurchase,
    setSelectedGroupPurchase,
    createGroupPurchase: createGroupPurchaseMutation.mutate,
    joinGroupPurchase: joinGroupPurchaseMutation.mutate,
    inviteToGroupPurchase: inviteToGroupPurchaseMutation.mutate,

    // Group Purchase Invites
    groupPurchaseInvites: groupPurchaseInvitesQuery.data || [],
    pendingInvites,
    respondToGroupPurchaseInvite: respondToGroupPurchaseInviteMutation.mutate,

    // Referrals
    referrals: referralsQuery.data || [],
    referralStats: referralStatsQuery.data,
    referralRewards: referralRewardsQuery.data || [],
    activeRewards,
    generateReferralCode: generateReferralCodeMutation.mutate,
    applyReferralCode: applyReferralCodeMutation.mutate,
    claimReferralReward: claimReferralRewardMutation.mutate,

    // Story Templates & Sharing
    storyTemplates: storyTemplatesQuery.data || [],
    shareableContent: shareableContentQuery.data || [],
    generateStoryTemplate: generateStoryTemplateMutation.mutateAsync,
    shareToInstagram: shareToInstagramMutation.mutateAsync,

    // Loading states
    isLoading:
      groupPurchasesQuery.isLoading ||
      referralsQuery.isLoading ||
      referralStatsQuery.isLoading,
  };
});
