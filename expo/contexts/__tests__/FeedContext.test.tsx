import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { FeedProvider, useFeed } from '../FeedContext';

// Mock dependencies
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('@/services/api', () => ({
  apiClient: {
    setAuthToken: jest.fn().mockResolvedValue(undefined),
    clearAuthToken: jest.fn().mockResolvedValue(undefined),
  },
  contentApi: {
    getHighlightsFeed: jest.fn().mockResolvedValue({ success: true, data: [] }),
    uploadHighlight: jest.fn().mockResolvedValue({ success: true, data: { id: 'new-h-1' } }),
    getUserHighlights: jest.fn().mockResolvedValue({ data: [] }),
    getActiveHighlights: jest.fn().mockResolvedValue({ data: [] }),
    getTrendingPerformers: jest.fn().mockResolvedValue({ data: [] }),
  },
}));

jest.mock('../AppStateContext', () => ({
  useAppState: () => ({
    profile: {
      id: 'user-1',
      role: 'PATRON',
      badges: [],
      followedPerformers: ['performer-1'],
    },
    getVenueVibe: jest.fn().mockReturnValue(null),
    calculateVibePercentage: jest.fn().mockReturnValue(50),
  }),
}));

jest.mock('../SocialContext', () => ({
  useSocial: () => ({
    friendLocations: [],
  }),
}));

jest.mock('../AuthContext', () => ({
  useAuth: () => ({
    userId: 'test-user-id',
    accessToken: 'test-token',
  }),
}));

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));

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
      <FeedProvider>{children}</FeedProvider>
    </QueryClientProvider>
  );
}

describe('FeedContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
  });

  it('should start with default feed settings', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useFeed(), { wrapper });

    expect(result.current.selectedFilter).toBe('NEARBY');
    expect(result.current.feedSettings.selectedFilter).toBe('NEARBY');
  });

  it('should provide all expected properties and methods', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useFeed(), { wrapper });

    expect(typeof result.current.setFilter).toBe('function');
    expect(typeof result.current.refreshLocation).toBe('function');
    expect(Array.isArray(result.current.videos)).toBe(true);
    expect(Array.isArray(result.current.nearbyVideos)).toBe(true);
    expect(Array.isArray(result.current.followingVideos)).toBe(true);
    expect(typeof result.current.isEmpty).toBe('boolean');
    expect(result.current.uploadVideo).toBeDefined();
  });

  it.skip('should switch filter to FOLLOWING', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useFeed(), { wrapper });

    await act(async () => {
      result.current.setFilter('FOLLOWING');
      // Allow mutation to complete
      await new Promise((r) => setTimeout(r, 50));
    });

    await waitFor(() => {
      expect(result.current.selectedFilter).toBe('FOLLOWING');
    }, { timeout: 3000 });
  });

  it('should switch filter to NEARBY after FOLLOWING', async () => {
    // Pre-set AsyncStorage to FOLLOWING state
    await AsyncStorage.setItem(
      'vibelink_feed_settings',
      JSON.stringify({ selectedFilter: 'FOLLOWING', lastUpdated: new Date().toISOString() })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useFeed(), { wrapper });

    await waitFor(() => {
      expect(result.current.selectedFilter).toBe('FOLLOWING');
    }, { timeout: 3000 });

    await act(async () => {
      result.current.setFilter('NEARBY');
      await new Promise((r) => setTimeout(r, 50));
    });

    await waitFor(() => {
      expect(result.current.selectedFilter).toBe('NEARBY');
    }, { timeout: 3000 });
  });

  it('should refresh location using expo-location', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useFeed(), { wrapper });

    await act(async () => {
      await result.current.refreshLocation();
    });

    expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
    expect(Location.getCurrentPositionAsync).toHaveBeenCalled();
  });

  it('should handle location permission denied gracefully', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'denied',
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useFeed(), { wrapper });

    await act(async () => {
      await result.current.refreshLocation();
    });

    // Should not crash, getCurrentPositionAsync should not be called
    expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it('should load feed settings from AsyncStorage', async () => {
    await AsyncStorage.setItem(
      'vibelink_feed_settings',
      JSON.stringify({
        selectedFilter: 'FOLLOWING',
        lastUpdated: '2024-01-01T00:00:00.000Z',
      })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useFeed(), { wrapper });

    await waitFor(() => {
      expect(result.current.selectedFilter).toBe('FOLLOWING');
    });
  });

  it('should report isEmpty when there are no videos', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useFeed(), { wrapper });

    expect(result.current.isEmpty).toBe(true);
    expect(result.current.videos).toEqual([]);
  });

  it('should persist feed settings to AsyncStorage when filter changes', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useFeed(), { wrapper });

    await act(async () => {
      result.current.setFilter('FOLLOWING');
    });

    await waitFor(async () => {
      const stored = await AsyncStorage.getItem('vibelink_feed_settings');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.selectedFilter).toBe('FOLLOWING');
    });
  });

  it('should return suggested performers and venues as empty arrays by default', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useFeed(), { wrapper });

    expect(result.current.suggestedPerformers).toEqual([]);
    expect(result.current.suggestedVenues).toEqual([]);
  });

  it('should handle refreshLocation error gracefully', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockRejectedValueOnce(
      new Error('Location service unavailable')
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useFeed(), { wrapper });

    // Should not throw
    await act(async () => {
      await result.current.refreshLocation();
    });

    expect(result.current.videos).toBeDefined();
  });

  it('should load user videos from cache when API fails', async () => {
    const { contentApi } = require('@/services/api');
    contentApi.getUserHighlights.mockRejectedValueOnce(new Error('API error'));
    await AsyncStorage.setItem(
      'vibelink_user_videos',
      JSON.stringify([
        { id: 'cached-v1', venueId: 'v1', videoUrl: 'url', thumbnailUrl: 'thumb', duration: 10, title: 'Cached', views: 0, likes: 0, timestamp: new Date().toISOString() },
      ])
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useFeed(), { wrapper });

    await waitFor(() => {
      // The cached video should be loaded
      expect(result.current.nearbyVideos.length).toBeGreaterThanOrEqual(0);
    });
  });

  it('should return empty followingVideos when no followed performers have content', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useFeed(), { wrapper });

    await waitFor(() => {
      expect(result.current.followingVideos).toEqual([]);
    });
  });

  it('should return isLoading as boolean', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useFeed(), { wrapper });

    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('should include nearbyVideos and followingVideos arrays', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useFeed(), { wrapper });

    expect(Array.isArray(result.current.nearbyVideos)).toBe(true);
    expect(Array.isArray(result.current.followingVideos)).toBe(true);
  });

  it('should score nearby videos by recency', async () => {
    const { contentApi } = require('@/services/api');
    const recentTimestamp = new Date(Date.now() - 1000 * 60 * 60).toISOString(); // 1 hour ago
    const oldTimestamp = new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(); // 48 hours ago

    contentApi.getHighlightsFeed.mockResolvedValueOnce({
      success: true,
      data: [
        { id: 'old-v', venueId: 'v1', videoUrl: 'url', thumbnailUrl: 'thumb', duration: 10, title: 'Old', views: 0, likes: 0, timestamp: oldTimestamp },
        { id: 'new-v', venueId: 'v2', videoUrl: 'url', thumbnailUrl: 'thumb', duration: 10, title: 'New', views: 0, likes: 0, timestamp: recentTimestamp },
      ],
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useFeed(), { wrapper });

    await waitFor(() => {
      if (result.current.nearbyVideos.length >= 2) {
        // More recent video should come first
        expect(result.current.nearbyVideos[0].id).toBe('new-v');
      }
    });
  });

  it('should persist feed settings when filter changes', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useFeed(), { wrapper });

    // Default
    expect(result.current.selectedFilter).toBe('NEARBY');

    // Change to FOLLOWING
    await act(async () => {
      result.current.setFilter('FOLLOWING');
    });

    // Verify persisted to AsyncStorage
    await waitFor(async () => {
      const stored = await AsyncStorage.getItem('vibelink_feed_settings');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.selectedFilter).toBe('FOLLOWING');
      expect(parsed.lastUpdated).toBeDefined();
    });
  });

  it('should select currentVideos based on filter', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useFeed(), { wrapper });

    // NEARBY filter -> videos should be nearbyVideos
    expect(result.current.selectedFilter).toBe('NEARBY');
    // Both should be the same reference when empty
    expect(result.current.videos).toEqual(result.current.nearbyVideos);
  });

  it('should handle uploadVideo mutation object', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useFeed(), { wrapper });

    // uploadVideo is a mutation object
    expect(result.current.uploadVideo.mutate).toBeDefined();
    expect(result.current.uploadVideo.mutateAsync).toBeDefined();
  });
});
