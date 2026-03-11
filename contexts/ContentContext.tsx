import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Performer,
  PerformerPost,
  HighlightVideo,
  Event,
  CalendarFilter,
} from '@/types';
import { contentApi, eventsApi } from '@/services/api';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';

const STORAGE_KEYS = {
  PERFORMER_FOLLOWS: 'vibelink_performer_follows',
  PERFORMER_POSTS: 'vibelink_performer_posts',
  HIGHLIGHT_VIDEOS: 'vibelink_highlight_videos',
  POST_LIKES: 'vibelink_post_likes',
};

export const [ContentProvider, useContent] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  // ===== QUERIES =====
  const performerFollowsQuery = useQuery({
    queryKey: ['performer-follows', userId],
    queryFn: async () => {
      if (!userId) return [];
      try {
        // Fetch performer feed — the performers in the feed are the followed ones
        const response = await contentApi.getPerformerFeed(userId);
        if (response.data && response.data.length > 0) {
          const followedIds = [...new Set(response.data.map((post: any) => post.performerId))];
          // Cache locally
          await AsyncStorage.setItem(STORAGE_KEYS.PERFORMER_FOLLOWS, JSON.stringify(followedIds));
          return followedIds as string[];
        }
      } catch (error) {
        if (__DEV__) console.log('[Content] API unavailable for performer follows, using cache');
      }
      // Fallback to cache
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PERFORMER_FOLLOWS);
      if (stored) return JSON.parse(stored) as string[];
      return [];
    },
    enabled: !!userId,
  });

  const performerPostsQuery = useQuery({
    queryKey: ['performer-posts'],
    queryFn: async () => {
      if (!userId) return [];
      try {
        // Use userId from auth context
        const response = await contentApi.getPerformerFeed(userId);
        return response.data || [];
      } catch (error) {
        // Silently handle missing endpoint
        if (__DEV__) console.log('[Content] Endpoint not implemented: performer posts');
        return [];
      }
    },
  });

  const highlightVideosQuery = useQuery({
    queryKey: ['highlight-videos'],
    queryFn: async () => {
      try {
        const response = await contentApi.getActiveHighlights();
        return response.data || [];
      } catch (error) {
        // Silently handle missing endpoint
        if (__DEV__) console.log('[Content] Endpoint not implemented: highlight videos');
        return [];
      }
    },
  });

  const postLikesQuery = useQuery({
    queryKey: ['post-likes'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.POST_LIKES);
      if (stored) {
        return JSON.parse(stored) as string[]; // Array of liked post IDs
      }
      return [];
    },
  });

  // ===== MUTATIONS =====
  const updatePerformerFollowsMutation = useMutation({
    mutationFn: async (follows: string[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.PERFORMER_FOLLOWS, JSON.stringify(follows));
      return follows;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performer-follows'] });
    },
  });

  const updatePerformerPostsMutation = useMutation({
    mutationFn: async (posts: PerformerPost[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.PERFORMER_POSTS, JSON.stringify(posts));
      return posts;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performer-posts'] });
    },
  });

  const updateHighlightVideosMutation = useMutation({
    mutationFn: async (highlights: HighlightVideo[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.HIGHLIGHT_VIDEOS, JSON.stringify(highlights));
      return highlights;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['highlight-videos'] });
    },
  });

  const updatePostLikesMutation = useMutation({
    mutationFn: async (likes: string[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.POST_LIKES, JSON.stringify(likes));
      return likes;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-likes'] });
    },
  });

  // ===== COMPUTED VALUES =====
  const performerFollows = useMemo(() => performerFollowsQuery.data || [], [performerFollowsQuery.data]);
  const performerPosts = useMemo(() => performerPostsQuery.data || [], [performerPostsQuery.data]);
  const highlightVideos = useMemo(() => highlightVideosQuery.data || [], [highlightVideosQuery.data]);
  const postLikes = useMemo(() => postLikesQuery.data || [], [postLikesQuery.data]);

  const followedPerformers = useMemo(() => {
    // When performer follows are available, return them (populated from API via follow mutations)
    return performerFollows;
  }, [performerFollows]);

  const feedPosts = useMemo(() => {
    // Get posts from followed performers, sorted by timestamp
    return performerPosts
      .filter(post => performerFollows.includes(post.performerId))
      .map(post => ({
        ...post,
        likedByUser: postLikes.includes(post.id),
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [performerPosts, performerFollows, postLikes]);

  const activeHighlights = useMemo(() => {
    const now = new Date();
    return highlightVideos
      .filter(h => {
        const expiresAt = new Date(h.expiresAt);
        return h.isActive && expiresAt > now;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [highlightVideos]);

  // ===== PERFORMER FUNCTIONS =====
  const followPerformerMutation = useMutation({
    mutationFn: async (performerId: string) => {
      if (!userId) throw new Error('User not authenticated');
      try {
        // Use userId from auth context
        const response = await contentApi.followPerformer(userId, performerId);
        return response.data!;
      } catch (error) {
        console.error('Failed to follow performer:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performer-follows'] });
      queryClient.invalidateQueries({ queryKey: ['performer-posts'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success!', 'You are now following this performer!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to follow performer');
    },
  });

  const unfollowPerformerMutation = useMutation({
    mutationFn: async (performerId: string) => {
      if (!userId) throw new Error('User not authenticated');
      try {
        // Use userId from auth context
        const response = await contentApi.unfollowPerformer(userId, performerId);
        return response.data!;
      } catch (error) {
        console.error('Failed to unfollow performer:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performer-follows'] });
      queryClient.invalidateQueries({ queryKey: ['performer-posts'] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to unfollow performer');
    },
  });

  const followPerformer = useCallback((performerId: string) => {
    if (!performerFollows.includes(performerId)) {
      followPerformerMutation.mutate(performerId);
    }
  }, [performerFollows, followPerformerMutation]);

  const unfollowPerformer = useCallback((performerId: string) => {
    unfollowPerformerMutation.mutate(performerId);
  }, [unfollowPerformerMutation]);

  const isFollowingPerformer = useCallback((performerId: string) => {
    return performerFollows.includes(performerId);
  }, [performerFollows]);

  // ===== POST FUNCTIONS =====
  const likePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!userId) throw new Error('User not authenticated');
      try {
        // Use userId from auth context
        const response = await contentApi.likePost(postId, userId);
        return response.data!;
      } catch (error) {
        console.error('Failed to like post:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performer-posts'] });
      queryClient.invalidateQueries({ queryKey: ['post-likes'] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to like post');
    },
  });

  const unlikePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!userId) throw new Error('User not authenticated');
      try {
        // Use userId from auth context
        const response = await contentApi.unlikePost(postId, userId);
        return response.data!;
      } catch (error) {
        console.error('Failed to unlike post:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performer-posts'] });
      queryClient.invalidateQueries({ queryKey: ['post-likes'] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to unlike post');
    },
  });

  const likePost = useCallback((postId: string) => {
    if (!postLikes.includes(postId)) {
      likePostMutation.mutate(postId);
    }
  }, [postLikes, likePostMutation]);

  const unlikePost = useCallback((postId: string) => {
    unlikePostMutation.mutate(postId);
  }, [unlikePostMutation]);

  const getPostsForPerformer = useCallback((performerId: string) => {
    return performerPosts
      .filter(post => post.performerId === performerId)
      .map(post => ({
        ...post,
        likedByUser: postLikes.includes(post.id),
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [performerPosts, postLikes]);

  // ===== HIGHLIGHT FUNCTIONS =====
  const uploadHighlightMutation = useMutation({
    mutationFn: async (highlight: Omit<HighlightVideo, 'id' | 'createdAt' | 'expiresAt' | 'isActive'>) => {
      if (!userId) throw new Error('User not authenticated');
      try {
        // Use userId from auth context
        const response = await contentApi.uploadHighlight({
          userId,
          venueId: highlight.venueId,
          videoUrl: highlight.videoUrl,
          thumbnailUrl: highlight.thumbnailUrl,
          duration: highlight.duration,
        });
        return response.data!;
      } catch (error) {
        console.error('Failed to upload highlight:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['highlight-videos'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success!', 'Highlight uploaded successfully!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to upload highlight');
    },
  });

  const uploadHighlight = useCallback((highlight: Omit<HighlightVideo, 'id' | 'createdAt' | 'expiresAt' | 'isActive'>) => {
    uploadHighlightMutation.mutate(highlight);
  }, [uploadHighlightMutation]);

  const getHighlightsForVenue = useCallback((venueId: string) => {
    return activeHighlights.filter(h => h.venueId === venueId);
  }, [activeHighlights]);

  const incrementHighlightViewsMutation = useMutation({
    mutationFn: async (highlightId: string) => {
      try {
        const response = await contentApi.incrementHighlightViews(highlightId);
        return response.data!;
      } catch (error) {
        console.error('Failed to increment highlight views:', error);
        // Don't throw error - view tracking failure shouldn't disrupt UX
        return null;
      }
    },
    onSuccess: () => {
      // Optionally update local cache
      queryClient.invalidateQueries({ queryKey: ['highlight-videos'] });
    },
  });

  const incrementHighlightViews = useCallback((highlightId: string) => {
    incrementHighlightViewsMutation.mutate(highlightId);
  }, [incrementHighlightViewsMutation]);

  // ===== CALENDAR FUNCTIONS =====
  const getFilteredEvents = useCallback(async (filter: CalendarFilter) => {
    try {
      const response = await eventsApi.getEvents({
        venueId: filter.venueIds?.[0],
        performerId: filter.performerIds?.[0],
        startDate: filter.dateRange?.start,
        endDate: filter.dateRange?.end,
      });
      let filtered = response.data || [];

      if (filter.venueIds && filter.venueIds.length > 1) {
        filtered = filtered.filter((event: any) => filter.venueIds!.includes(event.venueId));
      }
      if (filter.performerIds && filter.performerIds.length > 1) {
        filtered = filtered.filter((event: any) =>
          event.performerIds?.some((pid: string) => filter.performerIds!.includes(pid))
        );
      }
      if (filter.genres && filter.genres.length > 0) {
        filtered = filtered.filter((event: any) =>
          event.genres?.some((genre: string) => filter.genres!.includes(genre))
        );
      }
      if (filter.priceRange) {
        filtered = filtered.filter((event: any) => {
          const minPrice = Math.min(...(event.ticketTiers || []).map((t: any) => t.price));
          return minPrice >= filter.priceRange!.min && minPrice <= filter.priceRange!.max;
        });
      }
      return filtered.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error('Failed to get filtered events:', error);
      return [];
    }
  }, []);

  const getUpcomingEvents = useCallback(async (limit?: number) => {
    try {
      const response = await eventsApi.getUpcomingEvents();
      const events = response.data || [];
      return limit ? events.slice(0, limit) : events;
    } catch (error) {
      console.error('Failed to get upcoming events:', error);
      return [];
    }
  }, []);

  const getPerformerById = useCallback(async (id: string): Promise<Performer | null> => {
    try {
      const response = await contentApi.getPerformerDetails(id);
      return response.data || null;
    } catch (error) {
      console.error('Failed to get performer:', error);
      return null;
    }
  }, []);

  return {
    // Performers
    performers: [] as Performer[], // TODO: Fetch from API when available
    followedPerformers,
    followPerformer,
    unfollowPerformer,
    isFollowingPerformer,
    getPerformerById,
    // Posts
    feedPosts,
    getPostsForPerformer,
    likePost,
    unlikePost,
    // Highlights
    activeHighlights,
    getHighlightsForVenue,
    uploadHighlight,
    incrementHighlightViews,
    // Calendar
    getFilteredEvents,
    getUpcomingEvents,
    // Loading states
    isLoading: performerFollowsQuery.isLoading || performerPostsQuery.isLoading || highlightVideosQuery.isLoading,
  };
});
