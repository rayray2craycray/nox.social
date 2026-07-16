import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserProfile, UserRole, VibeCheckVote, VenueVibeData, UserVibeCooldown, VibeEnergyLevel, WaitTimeRange } from '@/types';
import { VIBE_CHECK } from '@/constants/app';
import { getSecureItem, setSecureItem, deleteSecureItem, SECURE_KEYS, migrateToSecureStorage } from '@/utils/secureStorage';
import { apiClient } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEYS = {
  PROFILE: 'vibelink_profile',
  VIBE_COOLDOWNS: 'vibelink_vibe_cooldowns',
  CREDENTIALS: 'vibelink_credentials',
  LINKED_CARDS: 'vibelink_linked_cards',
};

const defaultProfile: UserProfile = {
  id: '', // Will be set from auth context
  displayName: 'Alex Rivera',
  bio: '',
  totalSpend: 0,
  badges: [],
  isIncognito: false,
  followedPerformers: [],
  isVenueManager: true,
  managedVenues: ['venue-1'], // The Nox Room
  role: 'VENUE',
  isAuthenticated: true,
  isVerified: true,
  verifiedCategory: 'MANAGER',
  transactionHistory: [],
};

// --------------------------------------------------------------------------
// Helper: fetch profile from GET /api/auth/me, fall back to AsyncStorage
// --------------------------------------------------------------------------
async function fetchProfileFromApi(accessToken: string | null): Promise<UserProfile> {
  if (!accessToken) {
    throw new Error('No access token');
  }

  const response = await apiClient.get<{ success: boolean; data: any }>('/auth/me');

  if (!response?.success || !response.data) {
    throw new Error('Invalid /auth/me response');
  }

  const apiUser = response.data;

  // Read the locally-cached profile so we can merge fields the backend
  // doesn't know about (badges, incognito, followed performers, etc.)
  let localProfile: UserProfile = defaultProfile;
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
    if (stored) {
      localProfile = JSON.parse(stored);
    }
  } catch {
    // ignore parse errors
  }

  // Merge: backend-authoritative fields overwrite, local-only fields preserved.
  // Badges are now server-persisted — prefer the backend list, but fall back to
  // the local cache when the backend omits them (older server / offline).
  const merged: UserProfile = {
    ...localProfile,
    id: apiUser.id || apiUser._id || localProfile.id,
    displayName: apiUser.displayName ?? localProfile.displayName,
    profileImageUrl: apiUser.profileImageUrl,
    bio: apiUser.bio ?? localProfile.bio,
    badges: Array.isArray(apiUser.badges) ? apiUser.badges : localProfile.badges,
    isAuthenticated: true,
  };

  // Persist merge result to AsyncStorage for offline use
  await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(merged));

  return merged;
}

// --------------------------------------------------------------------------
// Helper: fetch vibe data from GET /api/v1/venues/:venueId/vibe-data
// --------------------------------------------------------------------------
async function fetchVenueVibeData(venueId: string): Promise<VenueVibeData | null> {
  try {
    const response = await apiClient.get<any>(`/v1/venues/${venueId}/vibe-data`);

    if (!response) return null;

    // Map backend shape -> frontend VenueVibeData shape
    const vibeData: VenueVibeData = {
      venueId: response.venueId || venueId,
      musicScore: response.music ?? 0,
      densityScore: response.density ?? 0,
      energyLevel: mapEnergyFromBackend(response.energy),
      waitTime: mapWaitTimeFromBackend(response.waitTime),
      lastUpdated: response.lastUpdated || new Date().toISOString(),
      totalVotes: response.totalVotes ?? 0,
    };

    return vibeData;
  } catch (error) {
    if (__DEV__) {
      console.log('[AppState] Failed to fetch vibe data for', venueId, error);
    }
    return null;
  }
}

// Map backend energy int (0-100) to frontend VibeEnergyLevel
function mapEnergyFromBackend(energy: number | string): VibeEnergyLevel {
  if (typeof energy === 'string') return energy as VibeEnergyLevel;
  if (energy <= 33) return 'Chill';
  if (energy <= 66) return 'Social';
  return 'Wild';
}

// Map backend energy level to backend int (0-100)
function mapEnergyToBackend(energy: VibeEnergyLevel): number {
  switch (energy) {
    case 'Chill': return 20;
    case 'Social': return 50;
    case 'Wild': return 85;
    default: return 50;
  }
}

// Map backend waitTime int (minutes) to frontend WaitTimeRange
function mapWaitTimeFromBackend(waitTime: number | string): WaitTimeRange {
  if (typeof waitTime === 'string') return waitTime as WaitTimeRange;
  if (waitTime <= 10) return '0-10m';
  if (waitTime <= 30) return '10-30m';
  return '30m+';
}

// Map frontend WaitTimeRange to backend int (minutes)
function mapWaitTimeToBackend(waitTime: WaitTimeRange): number {
  switch (waitTime) {
    case '0-10m': return 5;
    case '10-30m': return 20;
    case '30m+': return 45;
    default: return 10;
  }
}

// Map frontend music score (1-5) to backend (0-100)
function mapScoreToBackend(score: number): number {
  return Math.round((score / 5) * 100);
}

export const [AppStateProvider, useAppState] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { userId, accessToken, isAuthenticated: authIsAuthenticated } = useAuth();

  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [vibeCooldowns, setVibeCooldowns] = useState<UserVibeCooldown[]>([]);
  const [venueVibeData, setVenueVibeData] = useState<VenueVibeData[]>([]);
  const [broadcastMessages, setBroadcastMessages] = useState<Array<{
    id: string;
    channelId: string;
    message: string;
    timestamp: string;
    venueId: string;
  }>>([]);

  // --------------------------------------------------------------------------
  // Profile query: API-first, AsyncStorage fallback
  // --------------------------------------------------------------------------
  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      try {
        return await fetchProfileFromApi(accessToken);
      } catch (error) {
        if (__DEV__) {
          console.log('[AppState] API profile fetch failed, falling back to cache:', error);
        }
        // Fallback to AsyncStorage
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
        if (stored) {
          return JSON.parse(stored) as UserProfile;
        }
        return defaultProfile;
      }
    },
    enabled: !!userId && !!accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Fallback query when not authenticated — just reads local cache
  const localProfileQuery = useQuery({
    queryKey: ['profile', 'local'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
      if (stored) {
        return JSON.parse(stored) as UserProfile;
      }
      return defaultProfile;
    },
    enabled: !userId || !accessToken,
  });

  const cooldownsQuery = useQuery({
    queryKey: ['vibe-cooldowns'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.VIBE_COOLDOWNS);
      if (stored) {
        return JSON.parse(stored) as UserVibeCooldown[];
      }
      return [];
    },
  });

  // Sync profile query data into state
  useEffect(() => {
    const data = profileQuery.data ?? localProfileQuery.data;
    if (data) {
      setProfile(data);
    }
  }, [profileQuery.data, localProfileQuery.data]);

  useEffect(() => {
    if (cooldownsQuery.data) {
      setVibeCooldowns(cooldownsQuery.data);
    }
  }, [cooldownsQuery.data]);

  // Migrate existing AsyncStorage data to SecureStore on app startup
  useEffect(() => {
    const migrateExistingData = async () => {
      try {
        // Migrate credentials
        await migrateToSecureStorage(STORAGE_KEYS.CREDENTIALS, SECURE_KEYS.USER_CREDENTIALS);

      } catch (error) {
        console.error('Error migrating data to SecureStore:', error);
      }
    };

    migrateExistingData();
  }, []); // Run once on mount

  // --------------------------------------------------------------------------
  // Update profile: write to API + local cache
  // --------------------------------------------------------------------------
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (__DEV__) {
        console.log('[AppState] updateProfile called with:', updates);
      }

      // Always persist locally
      const currentProfile = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
      const profileData = currentProfile ? JSON.parse(currentProfile) : defaultProfile;
      const updated = { ...profileData, ...updates };
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));

      if (__DEV__) {
        console.log('[AppState] Profile updated, badges:', updated.badges.map((b: any) => b.venueId));
      }
      return updated;
    },
    onSuccess: (data) => {
      if (__DEV__) {
        console.log('[AppState] updateProfile onSuccess, setting profile state');
      }
      setProfile(data);
      // Invalidate profile query to ensure React Query cache is updated
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const { mutate: updateProfile, mutateAsync: updateProfileAsync } = updateProfileMutation;

  const toggleIncognito = useCallback(() => {
    const newIncognito = !profile.isIncognito;
    updateProfile({ isIncognito: newIncognito });
  }, [profile.isIncognito, updateProfile]);

  const followPerformer = useCallback((performerId: string) => {
    const newFollowed = profile.followedPerformers.includes(performerId)
      ? profile.followedPerformers.filter(id => id !== performerId)
      : [...profile.followedPerformers, performerId];
    updateProfile({ followedPerformers: newFollowed });
  }, [profile.followedPerformers, updateProfile]);

  const isFollowing = useCallback((performerId: string) => {
    return profile.followedPerformers.includes(performerId);
  }, [profile.followedPerformers]);

  const joinedServers = useMemo(() => {
    // TODO: Fetch server/channel data from API based on badges
    // For now, create dynamic server entries from user badges
    const allServers = profile.badges.map(badge => ({
      venueId: badge.venueId,
      venueName: badge.venueName,
      memberCount: 1, // TODO: Get from API
      lastActivity: badge.unlockedAt,
      channels: [
        {
          id: `${badge.venueId}-general`,
          name: 'general',
          type: 'PUBLIC_LOBBY' as const,
          isLocked: false,
          unreadCount: 0, // TODO: Get from chat API
        }
      ]
    }));

    if (__DEV__) {
      console.log('[AppState] Joined servers calculated:', allServers.length);
      console.log('[AppState] Profile badges:', profile.badges.map(b => b.venueId));
    }
    return allServers;
  }, [profile.badges]);

  const setUserRole = useCallback((role: UserRole) => {
    updateProfile({
      role,
      isAuthenticated: role !== null,
      isVenueManager: role === 'VENUE',
      managedVenues: role === 'VENUE' ? ['venue-1'] : [],
    });
  }, [updateProfile]);

  const updateProfileDetails = useCallback((displayName: string, bio: string) => {
    updateProfile({ displayName, bio });
  }, [updateProfile]);

  // Award a venue badge. Persists to the backend (source of truth), then
  // updates local state + cache from the authoritative list the server
  // returns. Falls back to a local-only add if the network call fails so the
  // UX isn't blocked offline (it'll reconcile on next profile fetch).
  const awardBadge = useCallback(async (badge: {
    venueId: string;
    venueName: string;
    badgeType: 'GUEST' | 'REGULAR' | 'PLATINUM' | 'WHALE';
  }) => {
    try {
      const resp = await apiClient.post<{ success: boolean; data: { badges: any[] } }>(
        '/auth/me/badges',
        badge,
      );
      const serverBadges = resp?.data?.badges;
      if (Array.isArray(serverBadges)) {
        await updateProfileAsync({ badges: serverBadges as any });
        return;
      }
    } catch (err) {
      if (__DEV__) console.log('[AppState] awardBadge API failed, using local fallback:', err);
    }
    // Offline / error fallback: add locally, dedup by venueId.
    const current = profile.badges.filter(b => b.venueId !== badge.venueId);
    const local = {
      id: `badge-${Date.now()}`,
      unlockedAt: new Date().toISOString(),
      ...badge,
    };
    await updateProfileAsync({ badges: [...current, local] as any });
  }, [profile.badges, updateProfileAsync]);

  const removeBadge = useCallback(async (venueId: string) => {
    try {
      const resp = await apiClient.delete<{ success: boolean; data: { badges: any[] } }>(
        `/auth/me/badges/${venueId}`,
      );
      const serverBadges = resp?.data?.badges;
      if (Array.isArray(serverBadges)) {
        await updateProfileAsync({ badges: serverBadges as any });
        return;
      }
    } catch (err) {
      if (__DEV__) console.log('[AppState] removeBadge API failed, using local fallback:', err);
    }
    const remaining = profile.badges.filter(b => b.venueId !== venueId);
    await updateProfileAsync({ badges: remaining as any });
  }, [profile.badges, updateProfileAsync]);

  const leaveServer = useMutation({
    mutationFn: async (venueId: string) => {
      // Remove the venue badge server-side (best-effort), then update local
      // state + cache. removeBadge already handles the offline fallback.
      await removeBadge(venueId);
      const currentProfile = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
      const profileData = currentProfile ? JSON.parse(currentProfile) : defaultProfile;
      return profileData;
    },
    onSuccess: (data) => {
      setProfile(data);
    },
  });

  const canRejoinVenue = useCallback((venueId: string, venue: any) => {
    const hadBadge = profile.badges.some(b => b.venueId === venueId);
    if (!hadBadge) return true;

    if (venue.hasPublicLobby) {
      return true;
    }

    const venueSpend = profile.transactionHistory
      .filter(t => t.venueId === venueId)
      .reduce((sum, t) => sum + t.amount, 0);

    return venueSpend >= venue.vipThreshold;
  }, [profile.badges, profile.transactionHistory]);

  const canVoteVibeCheck = useCallback((venueId: string): boolean => {
    const cooldown = vibeCooldowns.find(c => c.venueId === venueId);
    if (!cooldown) return true;

    const timeSinceVote = Date.now() - new Date(cooldown.lastVoteTimestamp).getTime();
    return timeSinceVote >= VIBE_CHECK.VOTE_COOLDOWN_MS;
  }, [vibeCooldowns]);

  const getVibeCooldownRemaining = useCallback((venueId: string): number => {
    const cooldown = vibeCooldowns.find(c => c.venueId === venueId);
    if (!cooldown) return 0;

    const timeSinceVote = Date.now() - new Date(cooldown.lastVoteTimestamp).getTime();
    const remaining = VIBE_CHECK.VOTE_COOLDOWN_MS - timeSinceVote;
    return Math.max(0, remaining);
  }, [vibeCooldowns]);

  // --------------------------------------------------------------------------
  // Submit vibe check: POST /api/v1/venues/:venueId/vibe-check
  // --------------------------------------------------------------------------
  const submitVibeCheck = useMutation({
    mutationFn: async (vote: {
      venueId: string;
      music: number;
      density: number;
      energy: VibeEnergyLevel;
      waitTime: WaitTimeRange;
    }) => {
      const userBadge = profile.badges.find(b => b.venueId === vote.venueId);
      const isVIP = userBadge?.badgeType === 'WHALE' || userBadge?.badgeType === 'PLATINUM';
      const weight = isVIP ? 2.0 : 1.0;

      // Build the local vote object for return value / local state
      const newVote: VibeCheckVote = {
        userId: userId || profile.id,
        venueId: vote.venueId,
        music: vote.music,
        density: vote.density,
        energy: vote.energy,
        waitTime: vote.waitTime,
        weight,
        timestamp: new Date().toISOString(),
      };

      // Update cooldown locally first (optimistic)
      const newCooldown: UserVibeCooldown = {
        venueId: vote.venueId,
        lastVoteTimestamp: newVote.timestamp,
      };

      const updatedCooldowns = [
        ...vibeCooldowns.filter(c => c.venueId !== vote.venueId),
        newCooldown,
      ];

      await AsyncStorage.setItem(STORAGE_KEYS.VIBE_COOLDOWNS, JSON.stringify(updatedCooldowns));
      setVibeCooldowns(updatedCooldowns);

      // Attempt API call
      if (accessToken) {
        try {
          const apiResponse = await apiClient.post<{
            vibeCheck: any;
            updatedVibeData: any;
          }>(`/v1/venues/${vote.venueId}/vibe-check`, {
            music: mapScoreToBackend(vote.music),
            density: mapScoreToBackend(vote.density),
            energy: mapEnergyToBackend(vote.energy),
            waitTime: mapWaitTimeToBackend(vote.waitTime),
          });

          // If backend returned updated vibe data, use it
          if (apiResponse?.updatedVibeData) {
            const backendVibe = apiResponse.updatedVibeData;
            const updatedVibeData: VenueVibeData = {
              venueId: vote.venueId,
              musicScore: backendVibe.music != null ? backendVibe.music / 20 : vote.music,
              densityScore: backendVibe.density != null ? backendVibe.density / 20 : vote.density,
              energyLevel: mapEnergyFromBackend(backendVibe.energy),
              waitTime: mapWaitTimeFromBackend(backendVibe.waitTime),
              lastUpdated: backendVibe.lastUpdated || newVote.timestamp,
              totalVotes: backendVibe.totalVotes ?? 1,
            };

            setVenueVibeData(prev => [
              ...prev.filter(v => v.venueId !== vote.venueId),
              updatedVibeData,
            ]);

            // Invalidate venue vibe query cache
            queryClient.invalidateQueries({ queryKey: ['venue-vibe', vote.venueId] });

            return newVote;
          }
        } catch (error) {
          if (__DEV__) {
            console.log('[AppState] API vibe-check failed, using local calculation:', error);
          }
          // Fall through to local calculation
        }
      }

      // Fallback: local vibe data calculation (same as before)
      const existingData = venueVibeData.find(v => v.venueId === vote.venueId);
      const updatedVibeData: VenueVibeData = {
        venueId: vote.venueId,
        musicScore: existingData ? (existingData.musicScore * existingData.totalVotes + vote.music * weight) / (existingData.totalVotes + weight) : vote.music,
        densityScore: existingData ? (existingData.densityScore * existingData.totalVotes + vote.density * weight) / (existingData.totalVotes + weight) : vote.density,
        energyLevel: vote.energy,
        waitTime: vote.waitTime,
        lastUpdated: newVote.timestamp,
        totalVotes: existingData ? existingData.totalVotes + weight : weight,
      };

      setVenueVibeData(prev => [
        ...prev.filter(v => v.venueId !== vote.venueId),
        updatedVibeData,
      ]);

      return newVote;
    },
  });

  // --------------------------------------------------------------------------
  // Get venue vibe: API-first, local fallback
  // --------------------------------------------------------------------------
  const getVenueVibe = useCallback((venueId: string): VenueVibeData | null => {
    const vibeData = venueVibeData.find(v => v.venueId === venueId);
    if (!vibeData) return null;

    const timeSinceUpdate = Date.now() - new Date(vibeData.lastUpdated).getTime();
    if (timeSinceUpdate >= VIBE_CHECK.DATA_DECAY_MS) return null;

    return vibeData;
  }, [venueVibeData]);

  // Fetch venue vibe data from API and update local state.
  // Consumers should call this when they need fresh vibe data for a venue.
  const fetchVenueVibe = useCallback(async (venueId: string): Promise<VenueVibeData | null> => {
    try {
      const apiData = await fetchVenueVibeData(venueId);
      if (apiData) {
        setVenueVibeData(prev => [
          ...prev.filter(v => v.venueId !== venueId),
          apiData,
        ]);
        return apiData;
      }
    } catch {
      // ignore, fall through to local
    }

    // Return local data
    return venueVibeData.find(v => v.venueId === venueId) ?? null;
  }, [venueVibeData]);

  const calculateVibePercentage = useCallback((venueId: string): number | null => {
    const vibeData = venueVibeData.find(v => v.venueId === venueId);
    if (!vibeData) return null;

    const timeSinceUpdate = Date.now() - new Date(vibeData.lastUpdated).getTime();
    if (timeSinceUpdate >= VIBE_CHECK.DATA_DECAY_MS) return null;

    // Calculate vibe percentage from music and density scores (both 1-5)
    const averageScore = (vibeData.musicScore + vibeData.densityScore) / 2;
    const percentage = Math.round((averageScore / 5) * 100);

    return percentage;
  }, [venueVibeData]);

  const createAccount = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      try {
        const response = await apiClient.post<{ token?: string; accessToken?: string; user?: any }>('/auth/signup', {
          username,
          password,
          displayName: username,
        });

        if (response?.token || response?.accessToken) {
          await setSecureItem(SECURE_KEYS.AUTH_TOKEN, response.token || response.accessToken || '');
        }
      } catch (error) {
        if (__DEV__) {
          console.log('[AppState] API signup failed, storing locally:', error);
        }
        // Store credentials locally as fallback
        const credentials = {
          username,
          password,
          createdAt: new Date().toISOString(),
        };
        await setSecureItem(SECURE_KEYS.USER_CREDENTIALS, JSON.stringify(credentials));
      }

      const updated = {
        ...profile,
        displayName: username,
        isAuthenticated: true,
      };

      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => {
      setProfile(data);
    },
  });

  const addBroadcastMessage = useCallback((channelId: string, message: string, venueId: string) => {
    const newMessage = {
      id: `broadcast-${Date.now()}`,
      channelId,
      message,
      timestamp: new Date().toISOString(),
      venueId,
    };
    setBroadcastMessages(prev => [...prev, newMessage]);
  }, []);

  const getBroadcastMessagesForChannel = useCallback((channelId: string) => {
    return broadcastMessages.filter(msg => msg.channelId === channelId);
  }, [broadcastMessages]);

  return {
    profile,
    isLoading: profileQuery.isLoading || localProfileQuery.isLoading,
    toggleIncognito,
    followPerformer,
    isFollowing,
    joinedServers,
    setUserRole,
    updateProfileDetails,
    updateProfile,
    awardBadge,
    removeBadge,
    updateProfileAsync,
    leaveServer,
    canRejoinVenue,
    canVoteVibeCheck,
    getVibeCooldownRemaining,
    submitVibeCheck,
    getVenueVibe,
    fetchVenueVibe,
    calculateVibePercentage,
    createAccount,
    addBroadcastMessage,
    getBroadcastMessagesForChannel,
  };
});

export const [DiscoveryProvider, useDiscovery] = createContextHook(() => {
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);

  return {
    selectedVenueId,
    setSelectedVenueId,
  };
});
