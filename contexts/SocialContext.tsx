import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Follow,
  FriendLocation,
  LocationSettings,
  FriendProfile,
  SuggestedPerson,
  Crew,
  CrewInvite,
  CrewNightPlan,
  Challenge,
  ChallengeProgress,
  ChallengeReward,
  VenueSocialProof,
} from '@/types';
// Mock data imports removed - using empty defaults when API unavailable
import {
  getPersonalizedSuggestions,
  getSuggestionSourceLabel,
  getSuggestionSourceColor,
  clearSuggestionsCache,
} from '@/services/suggestions.service';
import { socialApi } from '@/services/api';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';

const STORAGE_KEYS = {
  FOLLOWS: 'vibelink_follows',
  LOCATION_SETTINGS: 'vibelink_location_settings',
  CREWS: 'vibelink_crews',
  CREW_INVITES: 'vibelink_crew_invites',
  CREW_PLANS: 'vibelink_crew_plans',
  CHALLENGE_PROGRESS: 'vibelink_challenge_progress',
  CHALLENGE_REWARDS: 'vibelink_challenge_rewards',
};

const defaultLocationSettings: LocationSettings = {
  ghostMode: false,
  precision: 'VENUE_ONLY',
  autoExpireEnabled: false,
  autoExpireTime: '04:00',
  onlyShowToMutual: false,
};

export const [SocialProvider, useSocial] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  console.log('[SocialContext] userId from auth:', userId);
  const [follows, setFollows] = useState<Follow[]>([]);
  const [locationSettings, setLocationSettings] = useState<LocationSettings>(defaultLocationSettings);
  const [friendLocations, setFriendLocations] = useState<FriendLocation[]>([]);

  const followsQuery = useQuery({
    queryKey: ['follows'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.FOLLOWS);
      if (stored) {
        return JSON.parse(stored) as Follow[];
      }
      return [];
    },
  });

  const locationSettingsQuery = useQuery({
    queryKey: ['location-settings'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.LOCATION_SETTINGS);
      if (stored) {
        return JSON.parse(stored) as LocationSettings;
      }
      return defaultLocationSettings;
    },
  });

  useEffect(() => {
    if (followsQuery.data) {
      setFollows(followsQuery.data);
    }
  }, [followsQuery.data]);

  useEffect(() => {
    if (locationSettingsQuery.data) {
      setLocationSettings(locationSettingsQuery.data);
    }
  }, [locationSettingsQuery.data]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFriendLocations(prev => 
        prev.map(friend => {
          const randomOffset = 0.0002;
          const latOffset = (Math.random() - 0.5) * randomOffset;
          const lngOffset = (Math.random() - 0.5) * randomOffset;
          
          return {
            ...friend,
            location: {
              latitude: friend.location.latitude + latOffset,
              longitude: friend.location.longitude + lngOffset,
            },
            lastUpdated: new Date().toISOString(),
          };
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const updateFollowsMutation = useMutation({
    mutationFn: async (newFollows: Follow[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.FOLLOWS, JSON.stringify(newFollows));
      return newFollows;
    },
    onSuccess: (data) => {
      setFollows(data);
    },
  });

  const updateLocationSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<LocationSettings>) => {
      const updated = { ...locationSettings, ...updates };
      await AsyncStorage.setItem(STORAGE_KEYS.LOCATION_SETTINGS, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => {
      setLocationSettings(data);
    },
  });

  const { mutate: updateFollows } = updateFollowsMutation;
  const { mutate: updateLocationSettings } = updateLocationSettingsMutation;

  useEffect(() => {
    const checkAutoExpire = () => {
      if (!locationSettings.autoExpireEnabled) return;

      const now = new Date();
      const [hours, minutes] = locationSettings.autoExpireTime.split(':').map(Number);
      const expireTime = new Date();
      expireTime.setHours(hours, minutes, 0, 0);

      if (now >= expireTime && !locationSettings.ghostMode) {
        updateLocationSettings({ ghostMode: true });
      }
    };

    const interval = setInterval(checkAutoExpire, 60000);
    checkAutoExpire();

    return () => clearInterval(interval);
  }, [locationSettings.autoExpireEnabled, locationSettings.autoExpireTime, locationSettings.ghostMode, updateLocationSettings]);

  const acceptedFollows = useMemo(() => {
    return follows.filter(f => f.status === 'ACCEPTED');
  }, [follows]);

  const following = useMemo(() => {
    return acceptedFollows
      .filter(f => f.followerId === userId)
      .map(f => f.followingId);
  }, [acceptedFollows]);

  const followers = useMemo(() => {
    return acceptedFollows
      .filter(f => f.followingId === userId)
      .map(f => f.followerId);
  }, [acceptedFollows]);

  const mutualFollows = useMemo(() => {
    return following.filter(userId => followers.includes(userId));
  }, [following, followers]);

  const isFollowing = useCallback((userId: string) => {
    return following.includes(userId);
  }, [following]);

  const isMutual = useCallback((userId: string) => {
    return mutualFollows.includes(userId);
  }, [mutualFollows]);

  // Query for personalized friend suggestions based on contacts, Instagram, and mutual friends
  const suggestionsQuery = useQuery({
    queryKey: ['friend-suggestions', following, follows],
    queryFn: async () => {
      // TODO: Fetch mutual friend suggestions from API when available
      const mutualFriendSuggestions: FriendProfile[] = [];

      // Include both accepted and pending follows to filter them out from suggestions
      const allFollowingIds = follows
        .filter(f => f.followerId === userId)
        .map(f => f.followingId);

      // Get personalized suggestions from contacts, Instagram, and mutuals
      const personalized = await getPersonalizedSuggestions(
        allFollowingIds,
        mutualFriendSuggestions
      );

      return personalized;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: following.length >= 0, // Always enabled
  });

  // ===== CREW QUERIES =====
  const crewsQuery = useQuery({
    queryKey: ['crews', userId],
    queryFn: async () => {
      if (!userId) return [];
      try {
        // Use userId from auth context
        const response = await socialApi.getUserCrews(userId);
        // Map MongoDB _id to id for frontend compatibility
        const crews = (response.data || []).map((crew: any) => ({
          ...crew,
          id: crew._id || crew.id,
        }));
        return crews;
      } catch (error) {
        // Silently handle missing endpoint
        if (__DEV__) console.log('[Social] Endpoint not implemented: crews');
        return [];
      }
    },
    enabled: !!userId, // Only fetch when userId is available
  });

  const crewInvitesQuery = useQuery({
    queryKey: ['crew-invites'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CREW_INVITES);
      if (stored) {
        return JSON.parse(stored) as CrewInvite[];
      }
      return [];
    },
  });

  const crewPlansQuery = useQuery({
    queryKey: ['crew-plans'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CREW_PLANS);
      if (stored) {
        return JSON.parse(stored) as CrewNightPlan[];
      }
      return [];
    },
  });

  // ===== CHALLENGE QUERIES =====
  const challengeProgressQuery = useQuery({
    queryKey: ['challenge-progress', userId],
    queryFn: async () => {
      if (!userId) return [];
      try {
        console.log('[Social] Fetching challenge progress for userId:', userId);
        // Use userId from auth context
        const response = await socialApi.getUserChallenges(userId);
        console.log('[Social] Challenge progress response:', response);

        // Backend returns challenges with participants nested inside
        // We need to extract the current user's participant data
        const progress = (response.data || []).flatMap((challenge: any) => {
          // Find the current user's participant entry in this challenge
          const userParticipant = challenge.participants?.find(
            (p: any) => (p.userId === userId || p.userId?._id === userId || p.userId === userId)
          );

          if (!userParticipant) return [];

          // Return a progress object for this challenge
          return [{
            id: userParticipant._id || userParticipant.id,
            challengeId: challenge._id || challenge.id,
            userId: userParticipant.userId || userId,
            currentProgress: userParticipant.currentProgress || 0,
            status: userParticipant.status || 'IN_PROGRESS',
            startedAt: userParticipant.startedAt,
          }];
        });

        console.log('[Social] Mapped challenge progress:', progress);
        return progress;
      } catch (error) {
        // Silently handle missing endpoint
        console.error('[Social] Error fetching challenge progress:', error);
        return [];
      }
    },
    enabled: !!userId, // Only fetch when userId is available
  });

  const challengeRewardsQuery = useQuery({
    queryKey: ['challenge-rewards'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CHALLENGE_REWARDS);
      if (stored) {
        return JSON.parse(stored) as ChallengeReward[];
      }
      return [];
    },
  });

  const activeChallengesQuery = useQuery({
    queryKey: ['active-challenges'],
    queryFn: async () => {
      try {
        const response = await socialApi.getActiveChallenges();
        console.log('[Social] Active challenges response:', response);
        // Map MongoDB _id to id for frontend compatibility
        const challenges = (response.data || []).map((challenge: any) => ({
          ...challenge,
          id: challenge._id || challenge.id,
        }));
        console.log('[Social] Mapped challenges:', challenges);
        return challenges;
      } catch (error) {
        // Log the actual error for debugging
        console.error('[Social] Error fetching active challenges:', error);
        return [];
      }
    },
  });

  // ===== CREW MUTATIONS =====
  const updateCrewsMutation = useMutation({
    mutationFn: async (newCrews: Crew[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.CREWS, JSON.stringify(newCrews));
      return newCrews;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crews'] });
    },
  });

  const updateCrewInvitesMutation = useMutation({
    mutationFn: async (newInvites: CrewInvite[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.CREW_INVITES, JSON.stringify(newInvites));
      return newInvites;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crew-invites'] });
    },
  });

  const updateCrewPlansMutation = useMutation({
    mutationFn: async (newPlans: CrewNightPlan[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.CREW_PLANS, JSON.stringify(newPlans));
      return newPlans;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crew-plans'] });
    },
  });

  // ===== CHALLENGE MUTATIONS =====
  const updateChallengeProgressMutation = useMutation({
    mutationFn: async (newProgress: ChallengeProgress[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.CHALLENGE_PROGRESS, JSON.stringify(newProgress));
      return newProgress;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenge-progress'] });
    },
  });

  const updateChallengeRewardsMutation = useMutation({
    mutationFn: async (newRewards: ChallengeReward[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.CHALLENGE_REWARDS, JSON.stringify(newRewards));
      return newRewards;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenge-rewards'] });
    },
  });

  const followUser = useCallback((userId: string, shareLocation = true) => {
    const newFollow: Follow = {
      followerId: userId,
      followingId: userId,
      shareLocation,
      status: 'ACCEPTED', // Auto-accept follows (like Instagram/Twitter)
      createdAt: new Date().toISOString(),
    };
    updateFollows([...follows, newFollow]);

    // Clear suggestions cache and refetch to immediately update the list
    clearSuggestionsCache();
    suggestionsQuery.refetch();
  }, [follows, updateFollows, suggestionsQuery]);

  const unfollowUser = useCallback((userId: string) => {
    const updated = follows.filter(f => 
      !(f.followerId === userId && f.followingId === userId)
    );
    updateFollows(updated);
  }, [follows, updateFollows]);

  const acceptFollowRequest = useCallback((followerId: string) => {
    const updated = follows.map(f => 
      f.followerId === followerId && f.followingId === userId && f.status === 'PENDING'
        ? { ...f, status: 'ACCEPTED' as const }
        : f
    );
    updateFollows(updated);
  }, [follows, updateFollows]);

  const rejectFollowRequest = useCallback((followerId: string) => {
    const updated = follows.filter(f => 
      !(f.followerId === followerId && f.followingId === userId && f.status === 'PENDING')
    );
    updateFollows(updated);
  }, [follows, updateFollows]);

  const toggleShareLocation = useCallback((userId: string) => {
    const updated = follows.map(f => 
      f.followerId === userId && f.followingId === userId
        ? { ...f, shareLocation: !f.shareLocation }
        : f
    );
    updateFollows(updated);
  }, [follows, updateFollows]);

  const toggleGhostMode = useCallback(() => {
    updateLocationSettings({ ghostMode: !locationSettings.ghostMode });
  }, [locationSettings.ghostMode, updateLocationSettings]);

  const visibleFriendLocations = useMemo(() => {
    return friendLocations.filter(loc => {
      const follow = acceptedFollows.find(
        f => f.followerId === userId && f.followingId === loc.userId && f.shareLocation
      );
      
      if (!follow) return false;

      if (locationSettings.onlyShowToMutual && !mutualFollows.includes(loc.userId)) {
        return false;
      }

      if (loc.precision === 'HIDDEN') return false;

      return loc.isActive;
    });
  }, [friendLocations, locationSettings.onlyShowToMutual, acceptedFollows, mutualFollows]);

  const getFriendsByVenue = useCallback((venueId: string) => {
    return visibleFriendLocations.filter(loc => loc.venueId === venueId);
  }, [visibleFriendLocations]);

  const getLargestFriendCluster = useCallback(() => {
    const venueGroups = visibleFriendLocations.reduce((acc, loc) => {
      if (!loc.venueId) return acc;
      if (!acc[loc.venueId]) {
        acc[loc.venueId] = [];
      }
      acc[loc.venueId].push(loc);
      return acc;
    }, {} as Record<string, FriendLocation[]>);

    let largestVenueId: string | null = null;
    let largestCount = 0;

    Object.entries(venueGroups).forEach(([venueId, locs]) => {
      if (locs.length > largestCount) {
        largestCount = locs.length;
        largestVenueId = venueId;
      }
    });

    if (!largestVenueId) return null;

    const clusterLocations = venueGroups[largestVenueId];
    const avgLat = clusterLocations.reduce((sum, loc) => sum + loc.location.latitude, 0) / clusterLocations.length;
    const avgLng = clusterLocations.reduce((sum, loc) => sum + loc.location.longitude, 0) / clusterLocations.length;

    return {
      venueId: largestVenueId,
      venueName: clusterLocations[0].venueName,
      count: clusterLocations.length,
      location: {
        latitude: avgLat,
        longitude: avgLng,
      },
      friends: clusterLocations,
    };
  }, [visibleFriendLocations]);

  const searchFriends = useCallback((query: string) => {
    // TODO: Implement friend search via API when available
    return [];
  }, []);

  const getFriendProfile = useCallback((userId: string): FriendProfile | undefined => {
    // TODO: Fetch friend profile from API when available
    return undefined;
  }, []);

  const suggestedPeople = useMemo(() => {
    return suggestionsQuery.data || [];
  }, [suggestionsQuery.data]);

  const pendingRequests = useMemo(() => {
    return follows
      .filter(f => f.followingId === userId && f.status === 'PENDING')
      .map(f => f.followerId);
  }, [follows]);

  // ===== CREW COMPUTED VALUES =====
  const crews = useMemo(() => crewsQuery.data || [], [crewsQuery.data]);
  const crewInvites = useMemo(() => crewInvitesQuery.data || [], [crewInvitesQuery.data]);
  const crewPlans = useMemo(() => crewPlansQuery.data || [], [crewPlansQuery.data]);

  const userCrews = useMemo(() => {
    if (!userId) return [];
    return crews.filter(crew => crew.memberIds.includes(userId));
  }, [crews, userId]);

  const pendingCrewInvites = useMemo(() => {
    return crewInvites.filter(invite =>
      invite.inviteeId === userId && invite.status === 'PENDING'
    );
  }, [crewInvites]);

  // ===== CHALLENGE COMPUTED VALUES =====
  const challengeProgress = useMemo(() => challengeProgressQuery.data || [], [challengeProgressQuery.data]);
  const challengeRewards = useMemo(() => challengeRewardsQuery.data || [], [challengeRewardsQuery.data]);

  const activeChallenges = useMemo(() => {
    return activeChallengesQuery.data || [];
  }, [activeChallengesQuery.data]);

  const userChallengeProgress = useMemo(() => {
    return challengeProgress.filter(progress => progress.userId === userId);
  }, [challengeProgress]);

  const availableRewards = useMemo(() => {
    return challengeRewards.filter(reward => reward.userId === userId && !reward.isUsed);
  }, [challengeRewards]);

  // ===== CREW HELPER FUNCTIONS =====
  const createCrewMutation = useMutation({
    mutationFn: async (crewData: Omit<Crew, 'id' | 'createdAt'>) => {
      try {
        const response = await socialApi.createCrew({
          name: crewData.name,
          ownerId: crewData.ownerId,
          description: crewData.description,
          isPrivate: crewData.isPrivate,
        });
        return response.data!;
      } catch (error) {
        console.error('Failed to create crew:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crews'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success!', 'Crew created successfully!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to create crew');
    },
  });

  const createCrew = useCallback((crewData: Omit<Crew, 'id' | 'createdAt'>) => {
    createCrewMutation.mutate(crewData);
  }, [createCrewMutation]);

  const inviteToCrewMutation = useMutation({
    mutationFn: async ({ crewId, inviteeId }: { crewId: string; inviteeId: string }) => {
      try {
        const response = await socialApi.addCrewMember(crewId, inviteeId);
        return response.data!;
      } catch (error) {
        console.error('Failed to invite to crew:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crews'] });
      queryClient.invalidateQueries({ queryKey: ['crew-invites'] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Success!', 'Invite sent successfully!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to invite to crew');
    },
  });

  const inviteToCrew = useCallback((crewId: string, inviteeId: string) => {
    inviteToCrewMutation.mutate({ crewId, inviteeId });
  }, [inviteToCrewMutation]);

  const respondToCrewInvite = useCallback((inviteId: string, accept: boolean) => {
    const invite = crewInvites.find(inv => inv.id === inviteId);
    if (!invite || !userId) return;

    if (accept) {
      // Update invite status
      const updatedInvites = crewInvites.map(inv =>
        inv.id === inviteId
          ? { ...inv, status: 'ACCEPTED' as const, respondedAt: new Date().toISOString() }
          : inv
      );
      updateCrewInvitesMutation.mutate(updatedInvites);

      // Add user to crew
      const updatedCrews = crews.map(crew =>
        crew.id === invite.crewId && !crew.memberIds.includes(userId)
          ? { ...crew, memberIds: [...crew.memberIds, userId] }
          : crew
      );
      updateCrewsMutation.mutate(updatedCrews);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      // Reject invite
      const updatedInvites = crewInvites.map(inv =>
        inv.id === inviteId
          ? { ...inv, status: 'DECLINED' as const, respondedAt: new Date().toISOString() }
          : inv
      );
      updateCrewInvitesMutation.mutate(updatedInvites);
    }
  }, [crewInvites, crews, updateCrewInvitesMutation, updateCrewsMutation]);

  const leaveCrewMutation = useMutation({
    mutationFn: async (crewId: string) => {
      if (!userId) throw new Error('User not authenticated');
      try {
        // Use userId from auth context
        const response = await socialApi.removeCrewMember(crewId, userId);
        return response.data!;
      } catch (error) {
        console.error('Failed to leave crew:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crews'] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Success!', 'You have left the crew.');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to leave crew');
    },
  });

  const leaveCrew = useCallback((crewId: string) => {
    leaveCrewMutation.mutate(crewId);
  }, [leaveCrewMutation]);

  const planCrewNight = useCallback((planData: Omit<CrewNightPlan, 'id' | 'createdAt'>) => {
    const newPlan: CrewNightPlan = {
      ...planData,
      id: `plan-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    updateCrewPlansMutation.mutate([...crewPlans, newPlan]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [crewPlans, updateCrewPlansMutation]);

  const updateCrewPlanAttendance = useCallback((planId: string, attending: boolean) => {
    if (!userId) return;
    const updatedPlans = crewPlans.map(plan => {
      if (plan.id !== planId) return plan;

      const attendingMemberIds = attending
        ? [...plan.attendingMemberIds, userId]
        : plan.attendingMemberIds.filter(id => id !== userId);

      return { ...plan, attendingMemberIds };
    });
    updateCrewPlansMutation.mutate(updatedPlans);
  }, [crewPlans, updateCrewPlansMutation, userId]);

  // ===== CHALLENGE HELPER FUNCTIONS =====
  const joinChallengeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      try {
        // Use userId from auth context
        console.log('[Social] Joining challenge:', challengeId, 'with userId:', userId);
        if (!userId) {
          throw new Error('User ID is not available. Please log in again.');
        }
        const response = await socialApi.joinChallenge(challengeId, userId);
        console.log('[Social] Join challenge response:', response);
        return response.data!;
      } catch (error) {
        console.error('Failed to join challenge:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenge-progress'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success!', 'Challenge joined!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to join challenge');
    },
  });

  const joinChallenge = useCallback((challengeId: string) => {
    joinChallengeMutation.mutate(challengeId);
  }, [joinChallengeMutation]);

  const updateChallengeProgressApiMutation = useMutation({
    mutationFn: async ({ challengeId, incrementBy }: { challengeId: string; incrementBy: number }) => {
      if (!userId) throw new Error('User not authenticated');
      try {
        // Use userId from auth context
        const response = await socialApi.updateChallengeProgress(challengeId, userId, incrementBy);
        return response.data!;
      } catch (error) {
        console.error('Failed to update challenge progress:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['challenge-progress'] });
      queryClient.invalidateQueries({ queryKey: ['challenge-rewards'] });

      // Check if challenge was completed and show success alert
      if (data?.status === 'COMPLETED') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Challenge Complete!', 'You earned a reward!');
      }
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update challenge progress');
    },
  });

  const updateChallengeProgress = useCallback((challengeId: string, incrementBy: number) => {
    updateChallengeProgressApiMutation.mutate({ challengeId, incrementBy });
  }, [updateChallengeProgressApiMutation]);

  const claimChallengeReward = useCallback((rewardId: string) => {
    const updatedRewards = challengeRewards.map(reward =>
      reward.id === rewardId ? { ...reward, isUsed: true } : reward
    );
    updateChallengeRewardsMutation.mutate(updatedRewards);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [challengeRewards, updateChallengeRewardsMutation]);

  const getChallengeProgressForChallenge = useCallback((challengeId: string): ChallengeProgress | undefined => {
    return challengeProgress.find(
      progress => progress.challengeId === challengeId && progress.userId === userId
    );
  }, [challengeProgress]);

  const getChallengesForVenue = useCallback((venueId: string): Challenge[] => {
    return activeChallenges.filter(challenge => challenge.venueId === venueId);
  }, [activeChallenges]);

  const getVenueSocialProof = useCallback((venueId: string): Omit<VenueSocialProof, 'friendsPresent'> | undefined => {
    // Calculate social proof data for a venue
    const friendsHere = getFriendsByVenue(venueId);
    const venueChallenges = getChallengesForVenue(venueId);

    // Build hype factors based on available data
    const hypeFactors: VenueSocialProof['hypeFactors'] = [];

    if (friendsHere.length > 0) {
      hypeFactors.push({
        type: 'FRIENDS_HERE',
        label: `${friendsHere.length} friend${friendsHere.length > 1 ? 's' : ''} here`,
      });
    }

    if (venueChallenges.length > 0) {
      hypeFactors.push({
        type: 'CHALLENGE_ACTIVE',
        label: `${venueChallenges.length} active challenge${venueChallenges.length > 1 ? 's' : ''}`,
      });
    }

    // Calculate trending score (simplified - based on friends present)
    const trendingScore = Math.min(100, friendsHere.length * 20);

    return {
      venueId,
      trendingScore,
      recentCheckIns: friendsHere.length, // Simplified
      hypeFactors,
    };
  }, [getFriendsByVenue, getChallengesForVenue]);

  const getVenueSocialProofData = useCallback((venueId: string): VenueSocialProof | undefined => {
    const socialProof = getVenueSocialProof(venueId);
    if (!socialProof) return undefined;

    // Populate with actual friends present at this venue
    const friendsHere = getFriendsByVenue(venueId);

    return {
      ...socialProof,
      friendsPresent: friendsHere,
    };
  }, [getVenueSocialProof, getFriendsByVenue]);

  return {
    // Original social features
    follows,
    following,
    followers,
    mutualFollows,
    pendingRequests,
    isFollowing,
    isMutual,
    followUser,
    unfollowUser,
    acceptFollowRequest,
    rejectFollowRequest,
    toggleShareLocation,
    locationSettings,
    updateLocationSettings,
    toggleGhostMode,
    friendLocations: visibleFriendLocations,
    getFriendsByVenue,
    getLargestFriendCluster,
    searchFriends,
    getFriendProfile,
    suggestedPeople,
    getSuggestionSourceLabel,
    getSuggestionSourceColor,
    isLoading: followsQuery.isLoading || locationSettingsQuery.isLoading,
    isSuggestionsLoading: suggestionsQuery.isLoading,
    refreshSuggestions: suggestionsQuery.refetch,
    // Crew features
    crews,
    userCrews,
    crewInvites,
    pendingCrewInvites,
    crewPlans,
    createCrew,
    inviteToCrew,
    respondToCrewInvite,
    leaveCrew,
    planCrewNight,
    updateCrewPlanAttendance,
    // Challenge features
    activeChallenges,
    userChallengeProgress,
    isChallengesLoading: activeChallengesQuery.isLoading,
    availableRewards,
    joinChallenge,
    updateChallengeProgress,
    claimChallengeReward,
    getChallengeProgressForChallenge,
    getChallengesForVenue,
    // Social proof
    getVenueSocialProofData,
  };
});
