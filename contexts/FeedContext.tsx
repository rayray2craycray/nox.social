import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FeedFilter, FeedSettings, VibeVideo } from '@/types';
import { useAppState } from './AppStateContext';
import { useSocial } from './SocialContext';
import { contentApi } from '@/services/api';
import { useAuth } from './AuthContext';
import * as Location from 'expo-location';

const STORAGE_KEYS = {
  FEED_SETTINGS: 'vibelink_feed_settings',
  USER_VIDEOS: 'vibelink_user_videos',
};

const defaultFeedSettings: FeedSettings = {
  selectedFilter: 'NEARBY',
  lastUpdated: new Date().toISOString(),
};

export const [FeedProvider, useFeed] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [feedSettings, setFeedSettings] = useState<FeedSettings>(defaultFeedSettings);
  const [userVideos, setUserVideos] = useState<VibeVideo[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const { profile, getVenueVibe, calculateVibePercentage } = useAppState();
  const { friendLocations } = useSocial();
  const { userId, accessToken } = useAuth();

  // Lazy location getter — called on demand, NOT at mount time.
  // Calling Location.requestForegroundPermissionsAsync() in a useEffect during
  // provider initialization triggers a TurboModule void-method ObjC exception
  // on iOS New Arch, causing an EXC_CRASH (SIGABRT). This was the root cause
  // of the Build 75 crash.
  const refreshLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Failed to get user location:', error);
    }
  }, []);

  const feedSettingsQuery = useQuery({
    queryKey: ['feed-settings'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.FEED_SETTINGS);
      if (stored) {
        return JSON.parse(stored) as FeedSettings;
      }
      return defaultFeedSettings;
    },
  });

  const userVideosQuery = useQuery({
    queryKey: ['user-videos', userId],
    queryFn: async () => {
      if (!userId) return [];
      try {
        const response = await contentApi.getUserHighlights(userId);
        if (response.data) {
          // Cache for offline
          await AsyncStorage.setItem(STORAGE_KEYS.USER_VIDEOS, JSON.stringify(response.data));
          return response.data as unknown as VibeVideo[];
        }
      } catch (error) {
        if (__DEV__) console.log('[Feed] API unavailable for user videos, using cache');
      }
      // Fallback to cache
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_VIDEOS);
      if (stored) return JSON.parse(stored) as VibeVideo[];
      return [];
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (feedSettingsQuery.data) {
      setFeedSettings(feedSettingsQuery.data);
    }
  }, [feedSettingsQuery.data]);

  useEffect(() => {
    if (userVideosQuery.data) {
      setUserVideos(userVideosQuery.data);
    }
  }, [userVideosQuery.data]);

  // Fetch highlights from API
  const highlightsQuery = useQuery({
    queryKey: ['highlights', userId],
    queryFn: async () => {
      if (!userId || !accessToken) {
        if (__DEV__) console.log('[Feed] No userId or token, returning empty array');
        return [];
      }

      try {
        const response = await contentApi.getHighlightsFeed(userId);
        if (response.success && response.data) {
          if (__DEV__) console.log('[Feed] Fetched highlights from API:', response.data.length);
          return response.data as unknown as VibeVideo[];
        }
        if (__DEV__) console.log('[Feed] API returned no data');
        return [];
      } catch (error) {
        console.error('[Feed] Failed to fetch highlights:', error);
        return [];
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const updateFeedSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<FeedSettings>) => {
      const updated = { ...feedSettings, ...updates, lastUpdated: new Date().toISOString() };
      await AsyncStorage.setItem(STORAGE_KEYS.FEED_SETTINGS, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => {
      setFeedSettings(data);
    },
  });

  const { mutate: updateFeedSettings } = updateFeedSettingsMutation;

  const setFilter = useCallback((filter: FeedFilter) => {
    updateFeedSettings({ selectedFilter: filter });
  }, [updateFeedSettings]);

  const uploadVideo = useMutation({
    mutationFn: async (videoData: {
      videoUrl: string;
      venueId: string;
      title: string;
      duration: number;
      filter?: string;
      sticker?: string;
      stickerPosition?: { x: number; y: number };
    }) => {
      if (!userId || !accessToken) {
        throw new Error('Authentication required');
      }

      // Upload to API
      try {
        const response = await contentApi.uploadHighlight({
          videoUrl: videoData.videoUrl,
          thumbnailUrl: videoData.videoUrl, // Use video URL as thumbnail
          venueId: videoData.venueId,
          userId: userId,
          duration: videoData.duration,
        });

        if (response.success && response.data) {
          // Also store locally for immediate display
          const newVideo: VibeVideo = {
            id: response.data.id,
            venueId: videoData.venueId,
            performerId: profile.role === 'TALENT' ? profile.id : undefined,
            videoUrl: videoData.videoUrl,
            thumbnailUrl: videoData.videoUrl,
            duration: videoData.duration,
            title: videoData.title,
            views: 0,
            likes: 0,
            timestamp: new Date().toISOString(),
            filter: videoData.filter as any,
            sticker: videoData.sticker as any,
            stickerPosition: videoData.stickerPosition,
          };

          const updatedVideos = [newVideo, ...userVideos];
          await AsyncStorage.setItem(STORAGE_KEYS.USER_VIDEOS, JSON.stringify(updatedVideos));
          return updatedVideos;
        }
        throw new Error('Upload failed');
      } catch (error) {
        console.error('[Feed] Upload error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      setUserVideos(data);
      // Invalidate highlights query to refetch
      queryClient.invalidateQueries({ queryKey: ['highlights'] });
    },
  });

  const allVideos = useMemo(() => {
    const apiHighlights = highlightsQuery.data || [];
    // Combine user videos with API highlights, avoiding duplicates
    const userVideoIds = new Set(userVideos.map(v => v.id));
    const uniqueApiHighlights = apiHighlights.filter(v => !userVideoIds.has(v.id));
    return [...userVideos, ...uniqueApiHighlights];
  }, [userVideos, highlightsQuery.data]);

  const nearbyVideos = useMemo(() => {
    // TODO: Backend should handle distance filtering and return videos with venue data
    // For now, sort by recency and vibe score only

    const videosWithScores = allVideos.map(video => {
      const ageMs = Date.now() - new Date(video.timestamp).getTime();
      const ageHours = ageMs / (1000 * 60 * 60);
      const isLive = ageHours < 6;
      const recencyScore = isLive ? 100 : Math.max(0, 100 - ageHours * 5);

      // Check if user has badges at this venue for boost
      const venueVibe = getVenueVibe(video.venueId);
      let vibeBoost = 0;
      if (venueVibe) {
        const hasWhales = profile.badges.some(b =>
          b.venueId === video.venueId && (b.badgeType === 'WHALE' || b.badgeType === 'PLATINUM')
        );
        const vibeScore = (venueVibe.musicScore + venueVibe.densityScore) / 2;
        if (vibeScore >= 4 || hasWhales) {
          vibeBoost = 50;
        }
      }

      // Calculate vibe percentage for this venue
      const vibeLevel = calculateVibePercentage(video.venueId) ?? 50; // Default to 50 if unknown

      // Score based on recency and vibe (no distance since we don't have venue locations)
      const totalScore = (recencyScore * 0.7) + (vibeLevel * 0.3) + vibeBoost;

      return {
        video,
        score: totalScore,
      };
    });

    return videosWithScores
      .sort((a, b) => b.score - a.score)
      .map(item => item.video);
  }, [allVideos, profile.badges, getVenueVibe, calculateVibePercentage, userLocation]);

  const followingVideos = useMemo(() => {
    const followedPerformerIds = profile.followedPerformers;

    const videosWithPriority = allVideos.map(video => {
      const isFromFollowedPerformer = video.performerId && followedPerformerIds.includes(video.performerId);
      
      const friendsAtVenue = friendLocations.filter(loc => loc.venueId === video.venueId);
      const hasFriendPresence = friendsAtVenue.length >= 3;

      if (!isFromFollowedPerformer && !hasFriendPresence) return null;

      const timestamp = new Date(video.timestamp).getTime();
      
      let priority = 0;
      if (hasFriendPresence) {
        priority = 1000000 + timestamp;
      } else if (isFromFollowedPerformer) {
        priority = timestamp;
      }

      return {
        video,
        priority,
        friendCount: friendsAtVenue.length,
      };
    }).filter(item => item !== null);

    return videosWithPriority
      .sort((a, b) => b!.priority - a!.priority)
      .map(item => item!.video);
  }, [allVideos, profile.followedPerformers, friendLocations]);

  const currentVideos = useMemo(() => {
    return feedSettings.selectedFilter === 'NEARBY' ? nearbyVideos : followingVideos;
  }, [feedSettings.selectedFilter, nearbyVideos, followingVideos]);

  const isEmpty = currentVideos.length === 0;

  const suggestedPerformersQuery = useQuery({
    queryKey: ['suggested-performers'],
    queryFn: async () => {
      try {
        const response = await contentApi.getTrendingPerformers();
        return response.data || [];
      } catch (error) {
        if (__DEV__) console.log('[Feed] Failed to fetch suggested performers:', error);
        return [];
      }
    },
    enabled: feedSettings.selectedFilter === 'FOLLOWING' && isEmpty,
    staleTime: 5 * 60 * 1000,
  });

  const suggestedPerformers = useMemo(() => {
    if (feedSettings.selectedFilter !== 'FOLLOWING' || !isEmpty) return [];
    return (suggestedPerformersQuery.data || []).filter(
      (p: any) => !profile.followedPerformers.includes(p.id || p._id)
    ).slice(0, 5);
  }, [feedSettings.selectedFilter, isEmpty, suggestedPerformersQuery.data, profile.followedPerformers]);

  const suggestedVenuesQuery = useQuery({
    queryKey: ['suggested-venues'],
    queryFn: async () => {
      try {
        // Use events to extract unique venue IDs and return them
        const response = await contentApi.getActiveHighlights();
        const highlights = response.data || [];
        const venueIds = [...new Set(highlights.map((h: any) => h.venueId).filter(Boolean))];
        return venueIds.slice(0, 5).map(id => ({ id, venueId: id }));
      } catch (error) {
        if (__DEV__) console.log('[Feed] Failed to fetch suggested venues:', error);
        return [];
      }
    },
    enabled: feedSettings.selectedFilter === 'FOLLOWING' && isEmpty,
    staleTime: 5 * 60 * 1000,
  });

  const suggestedVenues = useMemo(() => {
    if (feedSettings.selectedFilter !== 'FOLLOWING' || !isEmpty) return [];
    return suggestedVenuesQuery.data || [];
  }, [feedSettings.selectedFilter, isEmpty, suggestedVenuesQuery.data]);

  return {
    feedSettings,
    selectedFilter: feedSettings.selectedFilter,
    setFilter,
    videos: currentVideos,
    nearbyVideos,
    followingVideos,
    isEmpty,
    suggestedPerformers,
    suggestedVenues,
    uploadVideo,
    refreshLocation,
    isLoading: feedSettingsQuery.isLoading,
  };
});
