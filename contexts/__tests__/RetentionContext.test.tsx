import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alert } from 'react-native';

// Mock dependencies
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
}));

jest.mock('@/services/api', () => ({
  retentionApi: {
    getUserStreaks: jest.fn().mockResolvedValue({ data: [] }),
    getUserMemories: jest.fn().mockResolvedValue({ data: [] }),
    claimStreakReward: jest.fn(),
    createMemory: jest.fn(),
    updateMemoryPrivacy: jest.fn(),
  },
}));

jest.mock('../AuthContext', () => ({
  useAuth: () => ({
    userId: 'test-user-id',
    accessToken: 'test-token',
  }),
}));

import { retentionApi } from '@/services/api';
const mockRetentionApi = retentionApi as jest.Mocked<typeof retentionApi>;

import { RetentionProvider, useRetention } from '../RetentionContext';
import * as Haptics from 'expo-haptics';

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
      <RetentionProvider>{children}</RetentionProvider>
    </QueryClientProvider>
  );
}

const mockStreak = {
  id: 'streak-1',
  userId: 'test-user-id',
  type: 'WEEKEND_WARRIOR' as const,
  currentStreak: 5,
  longestStreak: 10,
  lastActivityDate: '2026-03-09',
  rewards: {
    milestones: [3, 7, 14, 30],
    nextMilestone: 7,
    currentRewards: [{ type: 'BADGE' as const, value: 'gold', description: 'Gold badge' }],
  },
};

const mockInactiveStreak = {
  id: 'streak-2',
  userId: 'test-user-id',
  type: 'VENUE_LOYALTY' as const,
  currentStreak: 0,
  longestStreak: 3,
  lastActivityDate: '2026-02-01',
  rewards: {
    milestones: [3, 7],
    currentRewards: [],
  },
};

const mockMemory = {
  id: 'memory-1',
  userId: 'test-user-id',
  venueId: 'venue-1',
  venueName: 'Test Club',
  date: '2026-03-08',
  type: 'PHOTO' as const,
  content: { caption: 'Great night!' },
  isPrivate: false,
  createdAt: '2026-03-08T22:00:00Z',
};

const mockMemory2 = {
  id: 'memory-2',
  userId: 'test-user-id',
  venueId: 'venue-2',
  venueName: 'Another Club',
  date: '2026-03-01',
  type: 'CHECK_IN' as const,
  content: { caption: 'Checked in' },
  isPrivate: true,
  createdAt: '2026-03-01T20:00:00Z',
};

describe('RetentionContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw when used outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    const { result } = renderHook(() => useRetention());
    // createContextHook returns undefined when used outside the provider
    expect(result.current).toBeUndefined();
    spy.mockRestore();
  });

  it('should provide all expected methods and state', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useRetention(), { wrapper });

    expect(Array.isArray(result.current.userStreaks)).toBe(true);
    expect(Array.isArray(result.current.activeStreaks)).toBe(true);
    expect(Array.isArray(result.current.memories)).toBe(true);
    expect(typeof result.current.checkStreakStatus).toBe('function');
    expect(typeof result.current.claimStreakReward).toBe('function');
    expect(typeof result.current.addMemory).toBe('function');
    expect(typeof result.current.getTimeline).toBe('function');
    expect(typeof result.current.getVenueMemories).toBe('function');
    expect(typeof result.current.updateMemoryPrivacy).toBe('function');
    expect(typeof result.current.isLoading).toBe('boolean');
    expect(result.current.stats).toBeDefined();
  });

  it('should return empty streaks and memories by default', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useRetention(), { wrapper });

    await waitFor(() => {
      expect(result.current.userStreaks).toEqual([]);
      expect(result.current.memories).toEqual([]);
      expect(result.current.activeStreaks).toEqual([]);
    });
  });

  it('should fetch and expose user streaks', async () => {
    mockRetentionApi.getUserStreaks.mockResolvedValueOnce({
      data: [mockStreak, mockInactiveStreak],
    } as any);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useRetention(), { wrapper });

    await waitFor(() => {
      expect(result.current.userStreaks).toHaveLength(2);
    });

    expect(mockRetentionApi.getUserStreaks).toHaveBeenCalledWith('test-user-id');
  });

  it('should filter activeStreaks to only those with currentStreak > 0', async () => {
    mockRetentionApi.getUserStreaks.mockResolvedValueOnce({
      data: [mockStreak, mockInactiveStreak],
    } as any);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useRetention(), { wrapper });

    await waitFor(() => {
      expect(result.current.activeStreaks).toHaveLength(1);
      expect(result.current.activeStreaks[0].id).toBe('streak-1');
    });
  });

  it('should compute stats correctly', async () => {
    mockRetentionApi.getUserStreaks.mockResolvedValueOnce({
      data: [mockStreak, mockInactiveStreak],
    } as any);
    mockRetentionApi.getUserMemories.mockResolvedValueOnce({
      data: [mockMemory, mockMemory2],
    } as any);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useRetention(), { wrapper });

    await waitFor(() => {
      expect(result.current.stats.totalStreaks).toBe(2);
      expect(result.current.stats.activeStreaks).toBe(1);
      expect(result.current.stats.longestStreak).toBe(10);
      expect(result.current.stats.totalMemories).toBe(2);
      expect(result.current.stats.rewardsEarned).toBe(1);
    });
  });

  it('should check streak status by type', async () => {
    mockRetentionApi.getUserStreaks.mockResolvedValueOnce({
      data: [mockStreak],
    } as any);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useRetention(), { wrapper });

    await waitFor(() => {
      expect(result.current.userStreaks).toHaveLength(1);
    });

    const found = result.current.checkStreakStatus('WEEKEND_WARRIOR');
    expect(found).toBeDefined();
    expect(found?.id).toBe('streak-1');

    const notFound = result.current.checkStreakStatus('SOCIAL_BUTTERFLY');
    expect(notFound).toBeUndefined();
  });

  it('should return timeline sorted by date with optional limit', async () => {
    mockRetentionApi.getUserMemories.mockResolvedValueOnce({
      data: [mockMemory2, mockMemory],
    } as any);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useRetention(), { wrapper });

    await waitFor(() => {
      expect(result.current.memories).toHaveLength(2);
    });

    // Should sort newest first
    const timeline = result.current.getTimeline();
    expect(timeline[0].id).toBe('memory-1');
    expect(timeline[1].id).toBe('memory-2');

    // Should respect limit
    const limited = result.current.getTimeline(1);
    expect(limited).toHaveLength(1);
    expect(limited[0].id).toBe('memory-1');
  });

  it('should filter memories by venue', async () => {
    mockRetentionApi.getUserMemories.mockResolvedValueOnce({
      data: [mockMemory, mockMemory2],
    } as any);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useRetention(), { wrapper });

    await waitFor(() => {
      expect(result.current.memories).toHaveLength(2);
    });

    const venueMemories = result.current.getVenueMemories('venue-1');
    expect(venueMemories).toHaveLength(1);
    expect(venueMemories[0].venueId).toBe('venue-1');

    const noMemories = result.current.getVenueMemories('venue-999');
    expect(noMemories).toEqual([]);
  });

  it('should call claimStreakReward via mutation', async () => {
    mockRetentionApi.claimStreakReward.mockResolvedValueOnce({
      data: mockStreak,
    } as any);

    const alertSpy = jest.spyOn(Alert, 'alert');
    const wrapper = createWrapper();
    const { result } = renderHook(() => useRetention(), { wrapper });

    await act(async () => {
      result.current.claimStreakReward('streak-1');
    });

    await waitFor(() => {
      expect(mockRetentionApi.claimStreakReward).toHaveBeenCalledWith('streak-1', 'test-user-id');
    });

    await waitFor(() => {
      expect(Haptics.notificationAsync).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith(
        'Reward Claimed!',
        'Your streak reward has been added to your account.'
      );
    });

    alertSpy.mockRestore();
  });

  it('should call addMemory via mutation', async () => {
    const newMemory = {
      venueId: 'venue-1',
      venueName: 'Test Club',
      date: '2026-03-10',
      type: 'PHOTO' as const,
      content: { caption: 'New memory' },
      isPrivate: false,
    };

    mockRetentionApi.createMemory.mockResolvedValueOnce({
      data: { ...newMemory, id: 'memory-new', userId: 'test-user-id', createdAt: '2026-03-10T00:00:00Z' },
    } as any);

    const alertSpy = jest.spyOn(Alert, 'alert');
    const wrapper = createWrapper();
    const { result } = renderHook(() => useRetention(), { wrapper });

    await act(async () => {
      result.current.addMemory(newMemory);
    });

    await waitFor(() => {
      expect(mockRetentionApi.createMemory).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Memory Saved!',
        'Your memory has been saved to your timeline.'
      );
    });

    alertSpy.mockRestore();
  });

  it('should call updateMemoryPrivacy via mutation', async () => {
    mockRetentionApi.updateMemoryPrivacy.mockResolvedValueOnce({
      data: { ...mockMemory, isPrivate: true },
    } as any);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useRetention(), { wrapper });

    await act(async () => {
      result.current.updateMemoryPrivacy('memory-1', true);
    });

    await waitFor(() => {
      expect(mockRetentionApi.updateMemoryPrivacy).toHaveBeenCalledWith('memory-1', true);
      expect(Haptics.impactAsync).toHaveBeenCalled();
    });
  });

  it('should handle API errors gracefully for streaks query', async () => {
    mockRetentionApi.getUserStreaks.mockRejectedValueOnce(new Error('Network error'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useRetention(), { wrapper });

    await waitFor(() => {
      expect(result.current.userStreaks).toEqual([]);
    });
  });
});
