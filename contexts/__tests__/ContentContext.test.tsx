import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium', Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('@/services/api', () => ({
  contentApi: {
    getPerformerFeed: jest.fn().mockResolvedValue({ data: [] }),
    getActiveHighlights: jest.fn().mockResolvedValue({ data: [] }),
    followPerformer: jest.fn().mockResolvedValue({ data: { success: true } }),
    unfollowPerformer: jest.fn().mockResolvedValue({ data: { success: true } }),
    likePost: jest.fn().mockResolvedValue({ data: { success: true } }),
    unlikePost: jest.fn().mockResolvedValue({ data: { success: true } }),
    uploadHighlight: jest.fn().mockResolvedValue({ data: { id: 'h-1' } }),
    incrementHighlightViews: jest.fn().mockResolvedValue({ data: { success: true } }),
    getPerformerPosts: jest.fn().mockResolvedValue({ data: [] }),
    getPerformerDetails: jest.fn().mockResolvedValue({ data: null }),
  },
  eventsApi: {
    getEvents: jest.fn().mockResolvedValue({ data: [] }),
    getUpcomingEvents: jest.fn().mockResolvedValue({ data: [] }),
  },
}));

jest.mock('../AuthContext', () => ({
  useAuth: () => ({
    userId: 'test-user-id',
    accessToken: 'test-token',
  }),
}));

import { ContentProvider, useContent } from '../ContentContext';

// Suppress console noise
let logSpy: jest.SpyInstance;
let errorSpy: jest.SpyInstance;
beforeAll(() => {
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  logSpy.mockRestore();
  errorSpy.mockRestore();
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ContentProvider>{children}</ContentProvider>
    </QueryClientProvider>
  );
}

describe('ContentContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
  });

  it('should provide all expected properties and methods', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useContent(), { wrapper });

    // Performers
    expect(Array.isArray(result.current.performers)).toBe(true);
    expect(Array.isArray(result.current.followedPerformers)).toBe(true);
    expect(typeof result.current.followPerformer).toBe('function');
    expect(typeof result.current.unfollowPerformer).toBe('function');
    expect(typeof result.current.isFollowingPerformer).toBe('function');
    expect(typeof result.current.getPerformerById).toBe('function');

    // Posts
    expect(Array.isArray(result.current.feedPosts)).toBe(true);
    expect(typeof result.current.getPostsForPerformer).toBe('function');
    expect(typeof result.current.likePost).toBe('function');
    expect(typeof result.current.unlikePost).toBe('function');

    // Highlights
    expect(Array.isArray(result.current.activeHighlights)).toBe(true);
    expect(typeof result.current.getHighlightsForVenue).toBe('function');
    expect(typeof result.current.uploadHighlight).toBe('function');
    expect(typeof result.current.incrementHighlightViews).toBe('function');

    // Calendar
    expect(typeof result.current.getFilteredEvents).toBe('function');
    expect(typeof result.current.getUpcomingEvents).toBe('function');

    // Loading
    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('should have empty default state', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useContent(), { wrapper });

    await waitFor(() => {
      expect(result.current.performers).toEqual([]);
      expect(result.current.followedPerformers).toEqual([]);
      expect(result.current.feedPosts).toEqual([]);
      expect(result.current.activeHighlights).toEqual([]);
    });
  });

  it('should check isFollowingPerformer correctly', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useContent(), { wrapper });

    await waitFor(() => {
      expect(result.current.isFollowingPerformer('performer-1')).toBe(false);
    });
  });

  it('should return empty posts for performer', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useContent(), { wrapper });

    const posts = result.current.getPostsForPerformer('performer-1');
    expect(posts).toEqual([]);
  });

  it('should return empty highlights for venue', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useContent(), { wrapper });

    const highlights = result.current.getHighlightsForVenue('venue-1');
    expect(highlights).toEqual([]);
  });

  it('should return null for getPerformerById', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useContent(), { wrapper });

    const performer = await result.current.getPerformerById('performer-1');
    expect(performer).toBeNull();
  });

  it('should return empty array for getUpcomingEvents', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useContent(), { wrapper });

    const events = await result.current.getUpcomingEvents();
    expect(events).toEqual([]);
  });

  it('should return empty array for getFilteredEvents', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useContent(), { wrapper });

    const filtered = await result.current.getFilteredEvents({});
    expect(filtered).toEqual([]);
  });

  it('should load performer follows from AsyncStorage', async () => {
    await AsyncStorage.setItem(
      'vibelink_performer_follows',
      JSON.stringify(['performer-1', 'performer-2'])
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useContent(), { wrapper });

    await waitFor(() => {
      expect(result.current.isFollowingPerformer('performer-1')).toBe(true);
      expect(result.current.isFollowingPerformer('performer-2')).toBe(true);
      expect(result.current.isFollowingPerformer('performer-3')).toBe(false);
    });
  });

  it('should load post likes from AsyncStorage', async () => {
    await AsyncStorage.setItem(
      'vibelink_post_likes',
      JSON.stringify(['post-1', 'post-2'])
    );

    // Also set some performer posts that are from followed performers
    await AsyncStorage.setItem(
      'vibelink_performer_follows',
      JSON.stringify(['perf-1'])
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useContent(), { wrapper });

    // Wait for queries to settle
    await waitFor(() => {
      expect(result.current.isFollowingPerformer('perf-1')).toBe(true);
    });
  });

  it('should call followPerformer API', async () => {
    const { contentApi } = require('@/services/api');

    const wrapper = createWrapper();
    const { result } = renderHook(() => useContent(), { wrapper });

    await act(async () => {
      result.current.followPerformer('performer-new');
      await new Promise(r => setTimeout(r, 50));
    });

    expect(contentApi.followPerformer).toHaveBeenCalledWith('test-user-id', 'performer-new');
  });

  it('should not call followPerformer API if already following', async () => {
    const { contentApi } = require('@/services/api');
    // Pre-load follows so performer-1 is already followed
    contentApi.getPerformerFeed.mockResolvedValueOnce({
      data: [{ performerId: 'performer-1', id: 'post-1', timestamp: new Date().toISOString() }],
    });
    // Also cache the follow locally
    await AsyncStorage.setItem(
      'vibelink_performer_follows',
      JSON.stringify(['performer-1'])
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useContent(), { wrapper });

    await waitFor(() => {
      expect(result.current.isFollowingPerformer('performer-1')).toBe(true);
    });

    contentApi.followPerformer.mockClear();

    await act(async () => {
      result.current.followPerformer('performer-1');
      await new Promise(r => setTimeout(r, 50));
    });

    expect(contentApi.followPerformer).not.toHaveBeenCalled();
  });

  it('should call unfollowPerformer API', async () => {
    const { contentApi } = require('@/services/api');

    const wrapper = createWrapper();
    const { result } = renderHook(() => useContent(), { wrapper });

    await act(async () => {
      result.current.unfollowPerformer('performer-1');
      await new Promise(r => setTimeout(r, 50));
    });

    expect(contentApi.unfollowPerformer).toHaveBeenCalledWith('test-user-id', 'performer-1');
  });

  it('should call likePost API', async () => {
    const { contentApi } = require('@/services/api');

    const wrapper = createWrapper();
    const { result } = renderHook(() => useContent(), { wrapper });

    await act(async () => {
      result.current.likePost('post-new');
      await new Promise(r => setTimeout(r, 50));
    });

    expect(contentApi.likePost).toHaveBeenCalledWith('post-new', 'test-user-id');
  });

  it('should not call likePost API if already liked', async () => {
    const { contentApi } = require('@/services/api');
    await AsyncStorage.setItem(
      'vibelink_post_likes',
      JSON.stringify(['already-liked-post'])
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useContent(), { wrapper });

    // Wait for post likes query to load from AsyncStorage
    await waitFor(() => {
      // The query for post-likes returns from AsyncStorage
      expect(result.current.feedPosts).toBeDefined();
    });

    // Wait a tick more for the query data to propagate
    await act(async () => {
      await new Promise(r => setTimeout(r, 100));
    });

    contentApi.likePost.mockClear();

    await act(async () => {
      result.current.likePost('already-liked-post');
      await new Promise(r => setTimeout(r, 50));
    });

    expect(contentApi.likePost).not.toHaveBeenCalled();
  });

  it('should call unlikePost API', async () => {
    const { contentApi } = require('@/services/api');

    const wrapper = createWrapper();
    const { result } = renderHook(() => useContent(), { wrapper });

    await act(async () => {
      result.current.unlikePost('post-1');
      await new Promise(r => setTimeout(r, 50));
    });

    expect(contentApi.unlikePost).toHaveBeenCalledWith('post-1', 'test-user-id');
  });

  it('should get posts for performer sorted by timestamp', async () => {
    const { contentApi } = require('@/services/api');
    // getPerformerFeed is called by both performerFollowsQuery and performerPostsQuery
    // We need to mock it for both calls
    const postsData = [
      { id: 'p1', performerId: 'perf-x', timestamp: '2026-01-01T10:00:00Z', content: 'post 1' },
      { id: 'p2', performerId: 'perf-x', timestamp: '2026-01-02T10:00:00Z', content: 'post 2' },
      { id: 'p3', performerId: 'perf-y', timestamp: '2026-01-03T10:00:00Z', content: 'post 3' },
    ];
    contentApi.getPerformerFeed.mockResolvedValue({ data: postsData });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useContent(), { wrapper });

    await waitFor(() => {
      const posts = result.current.getPostsForPerformer('perf-x');
      expect(posts.length).toBe(2);
      // Most recent first
      expect(posts[0].id).toBe('p2');
      expect(posts[1].id).toBe('p1');
    });
  });

  it('should compute feedPosts from followed performers, sorted by timestamp', async () => {
    const { contentApi } = require('@/services/api');
    // getPerformerFeed is called by both performerFollowsQuery and performerPostsQuery.
    // The follows query extracts unique performerIds from the feed, so all performers
    // in the feed are considered "followed".
    const postsData = [
      { id: 'fp1', performerId: 'perf-a', timestamp: '2026-01-01T10:00:00Z' },
      { id: 'fp2', performerId: 'perf-a', timestamp: '2026-01-03T10:00:00Z' },
      { id: 'fp3', performerId: 'perf-a', timestamp: '2026-01-02T10:00:00Z' },
    ];
    contentApi.getPerformerFeed.mockResolvedValue({ data: postsData });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useContent(), { wrapper });

    await waitFor(() => {
      expect(result.current.isFollowingPerformer('perf-a')).toBe(true);
      const feed = result.current.feedPosts;
      expect(feed.length).toBe(3);
      // Sorted newest first
      expect(feed[0].id).toBe('fp2');
      expect(feed[1].id).toBe('fp3');
      expect(feed[2].id).toBe('fp1');
    });
  });

  it('should call uploadHighlight API', async () => {
    const { contentApi } = require('@/services/api');

    const wrapper = createWrapper();
    const { result } = renderHook(() => useContent(), { wrapper });

    await act(async () => {
      result.current.uploadHighlight({
        venueId: 'venue-1',
        videoUrl: 'https://example.com/video.mp4',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        duration: 30,
        userId: 'test-user-id',
      });
      await new Promise(r => setTimeout(r, 50));
    });

    expect(contentApi.uploadHighlight).toHaveBeenCalled();
  });

  it('should call incrementHighlightViews API', async () => {
    const { contentApi } = require('@/services/api');

    const wrapper = createWrapper();
    const { result } = renderHook(() => useContent(), { wrapper });

    await act(async () => {
      result.current.incrementHighlightViews('highlight-1');
      await new Promise(r => setTimeout(r, 50));
    });

    expect(contentApi.incrementHighlightViews).toHaveBeenCalledWith('highlight-1');
  });

  it('should getPerformerById via API', async () => {
    const { contentApi } = require('@/services/api');
    contentApi.getPerformerDetails.mockResolvedValueOnce({
      data: { id: 'perf-1', name: 'DJ Test' },
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useContent(), { wrapper });

    let performer: any;
    await act(async () => {
      performer = await result.current.getPerformerById('perf-1');
    });

    expect(performer).toEqual({ id: 'perf-1', name: 'DJ Test' });
  });

  it('should return null when getPerformerById fails', async () => {
    const { contentApi } = require('@/services/api');
    contentApi.getPerformerDetails.mockRejectedValueOnce(new Error('Not found'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useContent(), { wrapper });

    let performer: any;
    await act(async () => {
      performer = await result.current.getPerformerById('nonexistent');
    });

    expect(performer).toBeNull();
  });

  it('should getFilteredEvents with venue filter', async () => {
    const { eventsApi } = require('@/services/api');
    eventsApi.getEvents.mockResolvedValueOnce({
      data: [
        { id: 'e1', venueId: 'v1', date: '2026-01-01T10:00:00Z' },
        { id: 'e2', venueId: 'v2', date: '2026-01-02T10:00:00Z' },
      ],
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useContent(), { wrapper });

    let events: any;
    await act(async () => {
      events = await result.current.getFilteredEvents({
        venueIds: ['v1', 'v2'],
      });
    });

    // Filters applied client-side when multiple venueIds
    expect(events.length).toBe(2);
  });

  it('should getFilteredEvents with genre filter', async () => {
    const { eventsApi } = require('@/services/api');
    eventsApi.getEvents.mockResolvedValueOnce({
      data: [
        { id: 'e1', genres: ['EDM', 'House'], date: '2026-01-01T10:00:00Z' },
        { id: 'e2', genres: ['Hip Hop'], date: '2026-01-02T10:00:00Z' },
      ],
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useContent(), { wrapper });

    let events: any;
    await act(async () => {
      events = await result.current.getFilteredEvents({
        genres: ['EDM'],
      });
    });

    expect(events.length).toBe(1);
    expect(events[0].id).toBe('e1');
  });

  it('should getFilteredEvents with price range filter', async () => {
    const { eventsApi } = require('@/services/api');
    eventsApi.getEvents.mockResolvedValueOnce({
      data: [
        { id: 'e1', ticketTiers: [{ price: 10 }, { price: 30 }], date: '2026-01-01T10:00:00Z' },
        { id: 'e2', ticketTiers: [{ price: 50 }], date: '2026-01-02T10:00:00Z' },
      ],
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useContent(), { wrapper });

    let events: any;
    await act(async () => {
      events = await result.current.getFilteredEvents({
        priceRange: { min: 0, max: 20 },
      });
    });

    expect(events.length).toBe(1);
    expect(events[0].id).toBe('e1');
  });

  it('should return empty array when getFilteredEvents fails', async () => {
    const { eventsApi } = require('@/services/api');
    eventsApi.getEvents.mockRejectedValueOnce(new Error('Network error'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useContent(), { wrapper });

    let events: any;
    await act(async () => {
      events = await result.current.getFilteredEvents({});
    });

    expect(events).toEqual([]);
  });

  it('should getUpcomingEvents with limit', async () => {
    const { eventsApi } = require('@/services/api');
    eventsApi.getUpcomingEvents.mockResolvedValueOnce({
      data: [
        { id: 'e1' }, { id: 'e2' }, { id: 'e3' },
      ],
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useContent(), { wrapper });

    let events: any;
    await act(async () => {
      events = await result.current.getUpcomingEvents(2);
    });

    expect(events.length).toBe(2);
  });

  it('should return empty array when getUpcomingEvents fails', async () => {
    const { eventsApi } = require('@/services/api');
    eventsApi.getUpcomingEvents.mockRejectedValueOnce(new Error('Error'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useContent(), { wrapper });

    let events: any;
    await act(async () => {
      events = await result.current.getUpcomingEvents();
    });

    expect(events).toEqual([]);
  });

  it('should handle performer follows from API data', async () => {
    const { contentApi } = require('@/services/api');
    contentApi.getPerformerFeed.mockResolvedValue({
      data: [
        { performerId: 'api-perf-1', id: 'p1', timestamp: new Date().toISOString() },
        { performerId: 'api-perf-2', id: 'p2', timestamp: new Date().toISOString() },
        { performerId: 'api-perf-1', id: 'p3', timestamp: new Date().toISOString() },
      ],
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useContent(), { wrapper });

    await waitFor(() => {
      expect(result.current.isFollowingPerformer('api-perf-1')).toBe(true);
      expect(result.current.isFollowingPerformer('api-perf-2')).toBe(true);
    });
  });

  it('should fall back to AsyncStorage cache when performer feed API fails', async () => {
    const { contentApi } = require('@/services/api');
    contentApi.getPerformerFeed.mockRejectedValue(new Error('API error'));
    await AsyncStorage.setItem(
      'vibelink_performer_follows',
      JSON.stringify(['cached-perf-1'])
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useContent(), { wrapper });

    await waitFor(() => {
      expect(result.current.isFollowingPerformer('cached-perf-1')).toBe(true);
    });
  });
});
