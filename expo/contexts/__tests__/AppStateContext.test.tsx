import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('@/services/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    setAuthToken: jest.fn().mockResolvedValue(undefined),
    clearAuthToken: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    userId: 'test-user-id',
    accessToken: 'test-token',
    isAuthenticated: true,
  }),
}));

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));

jest.mock('@/utils/secureStorage', () => ({
  getSecureItem: jest.fn().mockResolvedValue(null),
  setSecureItem: jest.fn().mockResolvedValue(undefined),
  deleteSecureItem: jest.fn().mockResolvedValue(undefined),
  SECURE_KEYS: {
    USER_CREDENTIALS: 'secure_user_credentials',
    LINKED_CARDS: 'secure_linked_cards',
    AUTH_TOKEN: 'secure_auth_token',
  },
  migrateToSecureStorage: jest.fn().mockResolvedValue(undefined),
}));

import { apiClient } from '@/services/api';
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

import { AppStateProvider, useAppState } from '../AppStateContext';

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
      <AppStateProvider>{children}</AppStateProvider>
    </QueryClientProvider>
  );
}

describe('AppStateContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
    // Default: API returns a valid profile
    mockApiClient.get.mockResolvedValue({
      success: true,
      data: {
        id: 'api-user-id',
        displayName: 'API User',
        bio: 'Hello from API',
        profileImageUrl: 'https://example.com/pic.jpg',
      },
    });
  });

  it('should provide default profile values', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAppState(), { wrapper });

    // The default profile should have baseline values
    expect(result.current.profile).toBeDefined();
    expect(result.current.profile.displayName).toBeDefined();
    expect(typeof result.current.profile.isIncognito).toBe('boolean');
    expect(Array.isArray(result.current.profile.badges)).toBe(true);
    expect(Array.isArray(result.current.profile.followedPerformers)).toBe(true);
  });

  it('should provide all expected properties and methods', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAppState(), { wrapper });

    expect(typeof result.current.toggleIncognito).toBe('function');
    expect(typeof result.current.followPerformer).toBe('function');
    expect(typeof result.current.isFollowing).toBe('function');
    expect(typeof result.current.setUserRole).toBe('function');
    expect(typeof result.current.updateProfileDetails).toBe('function');
    expect(typeof result.current.updateProfile).toBe('function');
    expect(typeof result.current.canVoteVibeCheck).toBe('function');
    expect(typeof result.current.getVibeCooldownRemaining).toBe('function');
    expect(typeof result.current.getVenueVibe).toBe('function');
    expect(typeof result.current.fetchVenueVibe).toBe('function');
    expect(typeof result.current.calculateVibePercentage).toBe('function');
    expect(typeof result.current.addBroadcastMessage).toBe('function');
    expect(typeof result.current.getBroadcastMessagesForChannel).toBe('function');
    expect(typeof result.current.addLinkedCard).toBe('function');
    expect(typeof result.current.removeLinkedCard).toBe('function');
    expect(Array.isArray(result.current.joinedServers)).toBe(true);
    expect(Array.isArray(result.current.linkedCards)).toBe(true);
  });

  it('should load profile from API', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAppState(), { wrapper });

    await waitFor(() => {
      expect(result.current.profile.displayName).toBe('API User');
    });

    expect(mockApiClient.get).toHaveBeenCalledWith('/auth/me');
  });

  it('should fall back to AsyncStorage when API fails', async () => {
    mockApiClient.get.mockRejectedValue(new Error('Network error'));

    await AsyncStorage.setItem(
      'vibelink_profile',
      JSON.stringify({
        id: 'cached-user',
        displayName: 'Cached User',
        bio: 'From cache',
        badges: [],
        followedPerformers: [],
        isIncognito: false,
        isAuthenticated: true,
        totalSpend: 0,
        transactionHistory: [],
      })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAppState(), { wrapper });

    await waitFor(() => {
      expect(result.current.profile.displayName).toBe('Cached User');
    });
  });

  it('should submit vibe check via API', async () => {
    mockApiClient.post.mockResolvedValueOnce({
      vibeCheck: { id: 'vc-1' },
      updatedVibeData: {
        music: 80,
        density: 60,
        energy: 70,
        waitTime: 15,
        totalVotes: 5,
        lastUpdated: new Date().toISOString(),
      },
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAppState(), { wrapper });

    await act(async () => {
      await result.current.submitVibeCheck.mutateAsync({
        venueId: 'venue-1',
        music: 4,
        density: 3,
        energy: 'Wild' as const,
        waitTime: '10-30m' as const,
      });
    });

    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/v1/venues/venue-1/vibe-check',
      expect.objectContaining({
        music: expect.any(Number),
        density: expect.any(Number),
      })
    );
  });

  it('should calculate vibe percentage correctly', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAppState(), { wrapper });

    // No vibe data should return null
    const percentage = result.current.calculateVibePercentage('venue-1');
    expect(percentage).toBeNull();
  });

  it('should handle vibe check cooldowns', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAppState(), { wrapper });

    // Should be able to vote (no cooldown)
    expect(result.current.canVoteVibeCheck('venue-1')).toBe(true);
    expect(result.current.getVibeCooldownRemaining('venue-1')).toBe(0);
  });

  it('should toggle incognito mode', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAppState(), { wrapper });

    const initialIncognito = result.current.profile.isIncognito;

    await act(async () => {
      result.current.toggleIncognito();
      await new Promise((r) => setTimeout(r, 50));
    });

    await waitFor(() => {
      expect(result.current.profile.isIncognito).toBe(!initialIncognito);
    });
  });

  it('should add and retrieve broadcast messages', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAppState(), { wrapper });

    act(() => {
      result.current.addBroadcastMessage('channel-1', 'Hello world', 'venue-1');
    });

    const messages = result.current.getBroadcastMessagesForChannel('channel-1');
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toBe('Hello world');
    expect(messages[0].venueId).toBe('venue-1');
  });

  it('should return empty messages for unknown channel', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAppState(), { wrapper });

    const messages = result.current.getBroadcastMessagesForChannel('unknown');
    expect(messages).toEqual([]);
  });

  it('should check isFollowing correctly', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAppState(), { wrapper });

    expect(result.current.isFollowing('performer-that-doesnt-exist')).toBe(false);
  });

  it('should return null for getVenueVibe with no data', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAppState(), { wrapper });

    expect(result.current.getVenueVibe('nonexistent-venue')).toBeNull();
  });

  it('should follow and unfollow a performer (toggle)', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAppState(), { wrapper });

    // Wait for profile to load
    await waitFor(() => {
      expect(result.current.profile).toBeDefined();
    });

    expect(result.current.isFollowing('perf-test')).toBe(false);

    // Follow
    await act(async () => {
      result.current.followPerformer('perf-test');
      await new Promise(r => setTimeout(r, 50));
    });

    await waitFor(() => {
      expect(result.current.isFollowing('perf-test')).toBe(true);
    });

    // Toggle (unfollow)
    await act(async () => {
      result.current.followPerformer('perf-test');
      await new Promise(r => setTimeout(r, 50));
    });

    await waitFor(() => {
      expect(result.current.isFollowing('perf-test')).toBe(false);
    });
  });

  it('should set user role correctly', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAppState(), { wrapper });

    await act(async () => {
      result.current.setUserRole('TALENT');
      await new Promise(r => setTimeout(r, 50));
    });

    await waitFor(() => {
      expect(result.current.profile.role).toBe('TALENT');
      expect(result.current.profile.isVenueManager).toBe(false);
      expect(result.current.profile.managedVenues).toEqual([]);
    });
  });

  it('should set VENUE role with managedVenues', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAppState(), { wrapper });

    await act(async () => {
      result.current.setUserRole('VENUE');
      await new Promise(r => setTimeout(r, 50));
    });

    await waitFor(() => {
      expect(result.current.profile.role).toBe('VENUE');
      expect(result.current.profile.isVenueManager).toBe(true);
      expect(result.current.profile.managedVenues).toEqual(['venue-1']);
    });
  });

  it('should update profile details', async () => {
    // Disable API so profile query doesn't overwrite
    mockApiClient.get.mockRejectedValue(new Error('disabled'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAppState(), { wrapper });

    await waitFor(() => {
      expect(result.current.profile).toBeDefined();
    });

    await act(async () => {
      result.current.updateProfileDetails('New Name', 'New bio text');
      await new Promise(r => setTimeout(r, 100));
    });

    await waitFor(() => {
      expect(result.current.profile.displayName).toBe('New Name');
      expect(result.current.profile.bio).toBe('New bio text');
    });
  });

  it('should compute joinedServers from badges', async () => {
    await AsyncStorage.setItem(
      'vibelink_profile',
      JSON.stringify({
        id: 'user-1',
        displayName: 'Test',
        bio: '',
        totalSpend: 0,
        badges: [
          { venueId: 'v1', venueName: 'Club One', badgeType: 'REGULAR', unlockedAt: '2026-01-01' },
          { venueId: 'v2', venueName: 'Club Two', badgeType: 'WHALE', unlockedAt: '2026-01-02' },
        ],
        isIncognito: false,
        followedPerformers: [],
        isVenueManager: false,
        managedVenues: [],
        role: 'PATRON',
        isAuthenticated: true,
        isVerified: false,
        transactionHistory: [],
      })
    );
    // Make API fail so it uses cache
    mockApiClient.get.mockRejectedValueOnce(new Error('fail'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAppState(), { wrapper });

    await waitFor(() => {
      expect(result.current.joinedServers).toHaveLength(2);
      expect(result.current.joinedServers[0].venueId).toBe('v1');
      expect(result.current.joinedServers[1].venueId).toBe('v2');
      expect(result.current.joinedServers[0].channels).toHaveLength(1);
      expect(result.current.joinedServers[0].channels[0].name).toBe('general');
    });
  });

  it('should canVoteVibeCheck return false after recent vote', async () => {
    // Pre-set a recent cooldown
    await AsyncStorage.setItem(
      'vibelink_vibe_cooldowns',
      JSON.stringify([
        { venueId: 'venue-cool', lastVoteTimestamp: new Date().toISOString() },
      ])
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAppState(), { wrapper });

    await waitFor(() => {
      expect(result.current.canVoteVibeCheck('venue-cool')).toBe(false);
    });
  });

  it('should getVibeCooldownRemaining return positive value for recent vote', async () => {
    await AsyncStorage.setItem(
      'vibelink_vibe_cooldowns',
      JSON.stringify([
        { venueId: 'venue-cd', lastVoteTimestamp: new Date().toISOString() },
      ])
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAppState(), { wrapper });

    await waitFor(() => {
      const remaining = result.current.getVibeCooldownRemaining('venue-cd');
      expect(remaining).toBeGreaterThan(0);
    });
  });

  it('should canVoteVibeCheck return true for expired cooldown', async () => {
    const longAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
    await AsyncStorage.setItem(
      'vibelink_vibe_cooldowns',
      JSON.stringify([
        { venueId: 'venue-expired', lastVoteTimestamp: longAgo },
      ])
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAppState(), { wrapper });

    await waitFor(() => {
      expect(result.current.canVoteVibeCheck('venue-expired')).toBe(true);
      expect(result.current.getVibeCooldownRemaining('venue-expired')).toBe(0);
    });
  });

  it('should submit vibe check with local fallback when API fails', async () => {
    mockApiClient.post.mockRejectedValueOnce(new Error('Network error'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAppState(), { wrapper });

    await act(async () => {
      await result.current.submitVibeCheck.mutateAsync({
        venueId: 'venue-local',
        music: 3,
        density: 2,
        energy: 'Chill' as const,
        waitTime: '0-10m' as const,
      });
    });

    // Vibe data should be set locally
    const vibeData = result.current.getVenueVibe('venue-local');
    expect(vibeData).not.toBeNull();
    expect(vibeData!.venueId).toBe('venue-local');
    expect(vibeData!.musicScore).toBe(3);
    expect(vibeData!.densityScore).toBe(2);
    expect(vibeData!.energyLevel).toBe('Chill');
  });

  it('should calculateVibePercentage from vibe data', async () => {
    mockApiClient.post.mockRejectedValueOnce(new Error('No API'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAppState(), { wrapper });

    // Submit a vibe check to create data
    await act(async () => {
      await result.current.submitVibeCheck.mutateAsync({
        venueId: 'venue-calc',
        music: 5,
        density: 5,
        energy: 'Wild' as const,
        waitTime: '30m+' as const,
      });
    });

    const percentage = result.current.calculateVibePercentage('venue-calc');
    expect(percentage).toBe(100); // (5+5)/2 = 5, (5/5)*100 = 100
  });

  it('should add linked card via setSecureItem', async () => {
    const { setSecureItem } = require('@/utils/secureStorage');
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAppState(), { wrapper });

    // Wait for initial queries to settle
    await waitFor(() => {
      expect(result.current.profile).toBeDefined();
    });

    await act(async () => {
      await result.current.addLinkedCard({
        last4: '1234',
        brand: 'Visa',
        cardholderName: 'Test User',
        isDefault: false,
      });
    });

    // Verify setSecureItem was called with the card data
    expect(setSecureItem).toHaveBeenCalledWith(
      'secure_linked_cards',
      expect.stringContaining('1234')
    );

    // Verify the card data written includes isDefault=true (first card)
    const callArgs = setSecureItem.mock.calls.find(
      (call: any[]) => call[0] === 'secure_linked_cards'
    );
    expect(callArgs).toBeDefined();
    const writtenCards = JSON.parse(callArgs![1]);
    expect(writtenCards).toHaveLength(1);
    expect(writtenCards[0].last4).toBe('1234');
    expect(writtenCards[0].isDefault).toBe(true);
  });

  it('should remove linked card via setSecureItem', async () => {
    const { setSecureItem, getSecureItem } = require('@/utils/secureStorage');
    // Pre-load a linked card
    getSecureItem.mockResolvedValueOnce(
      JSON.stringify([{ id: 'card-1', last4: '5678', brand: 'Mastercard', cardholderName: 'Test', isDefault: true }])
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAppState(), { wrapper });

    await waitFor(() => {
      expect(result.current.linkedCards).toHaveLength(1);
    });

    await act(async () => {
      await result.current.removeLinkedCard('card-1');
    });

    // Verify setSecureItem was called to persist the empty array
    const removeCalls = setSecureItem.mock.calls.filter(
      (call: any[]) => call[0] === 'secure_linked_cards'
    );
    const lastCall = removeCalls[removeCalls.length - 1];
    const writtenCards = JSON.parse(lastCall[1]);
    expect(writtenCards).toHaveLength(0);
  });

  it('should add broadcast messages and filter by channel', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAppState(), { wrapper });

    act(() => {
      result.current.addBroadcastMessage('ch-1', 'Message A', 'venue-1');
      result.current.addBroadcastMessage('ch-2', 'Message B', 'venue-2');
      result.current.addBroadcastMessage('ch-1', 'Message C', 'venue-1');
    });

    const ch1Messages = result.current.getBroadcastMessagesForChannel('ch-1');
    expect(ch1Messages).toHaveLength(2);

    const ch2Messages = result.current.getBroadcastMessagesForChannel('ch-2');
    expect(ch2Messages).toHaveLength(1);
    expect(ch2Messages[0].message).toBe('Message B');
  });

  it('should canRejoinVenue return true when no prior badge', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAppState(), { wrapper });

    const canRejoin = result.current.canRejoinVenue('new-venue', { hasPublicLobby: false, vipThreshold: 100 });
    expect(canRejoin).toBe(true);
  });

  it('should canRejoinVenue return true for public lobby', async () => {
    await AsyncStorage.setItem(
      'vibelink_profile',
      JSON.stringify({
        id: 'user-1',
        displayName: 'Test',
        bio: '',
        totalSpend: 0,
        badges: [{ venueId: 'v-pub', venueName: 'Public Venue', badgeType: 'REGULAR', unlockedAt: '2026-01-01' }],
        isIncognito: false,
        followedPerformers: [],
        isVenueManager: false,
        managedVenues: [],
        role: 'PATRON',
        isAuthenticated: true,
        isVerified: false,
        transactionHistory: [],
      })
    );
    mockApiClient.get.mockRejectedValueOnce(new Error('fail'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAppState(), { wrapper });

    await waitFor(() => {
      expect(result.current.profile.badges.length).toBe(1);
    });

    const canRejoin = result.current.canRejoinVenue('v-pub', { hasPublicLobby: true, vipThreshold: 100 });
    expect(canRejoin).toBe(true);
  });

  it('should canRejoinVenue check spend threshold', async () => {
    await AsyncStorage.setItem(
      'vibelink_profile',
      JSON.stringify({
        id: 'user-1',
        displayName: 'Test',
        bio: '',
        totalSpend: 50,
        badges: [{ venueId: 'v-vip', venueName: 'VIP Venue', badgeType: 'REGULAR', unlockedAt: '2026-01-01' }],
        isIncognito: false,
        followedPerformers: [],
        isVenueManager: false,
        managedVenues: [],
        role: 'PATRON',
        isAuthenticated: true,
        isVerified: false,
        transactionHistory: [
          { venueId: 'v-vip', amount: 30, date: '2026-01-01' },
          { venueId: 'v-vip', amount: 20, date: '2026-01-02' },
        ],
      })
    );
    mockApiClient.get.mockRejectedValueOnce(new Error('fail'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAppState(), { wrapper });

    await waitFor(() => {
      expect(result.current.profile.badges.length).toBe(1);
    });

    // 30 + 20 = 50, threshold is 100 -- should fail
    expect(result.current.canRejoinVenue('v-vip', { hasPublicLobby: false, vipThreshold: 100 })).toBe(false);
    // Threshold is 50 -- should pass
    expect(result.current.canRejoinVenue('v-vip', { hasPublicLobby: false, vipThreshold: 50 })).toBe(true);
  });

  it('should fetchVenueVibe return local data when API fails', async () => {
    mockApiClient.get.mockResolvedValueOnce({
      success: true,
      data: { id: 'user-1', displayName: 'Test' },
    });
    // For vibe data API call, reject
    mockApiClient.get.mockRejectedValueOnce(new Error('fail'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAppState(), { wrapper });

    let vibeData: any;
    await act(async () => {
      vibeData = await result.current.fetchVenueVibe('venue-nowhere');
    });

    expect(vibeData).toBeNull();
  });

  it('should create account via API and update profile', async () => {
    mockApiClient.post.mockResolvedValueOnce({
      token: 'new-token-123',
      user: { id: 'new-user' },
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAppState(), { wrapper });

    await act(async () => {
      await result.current.createAccount.mutateAsync({
        username: 'newuser',
        password: 'password123',
      });
    });

    // Verify the mutation was called and profile was persisted to AsyncStorage
    const stored = await AsyncStorage.getItem('vibelink_profile');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.displayName).toBe('newuser');
    expect(parsed.isAuthenticated).toBe(true);

    // Verify API post was called with signup
    expect(mockApiClient.post).toHaveBeenCalledWith('/auth/signup', expect.objectContaining({
      username: 'newuser',
      password: 'password123',
    }));
  });

  it('should create account locally when API signup fails', async () => {
    mockApiClient.post.mockRejectedValueOnce(new Error('API down'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAppState(), { wrapper });

    await act(async () => {
      await result.current.createAccount.mutateAsync({
        username: 'localuser',
        password: 'pass456',
      });
    });

    // Verify profile was persisted to AsyncStorage with the username
    const stored = await AsyncStorage.getItem('vibelink_profile');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.displayName).toBe('localuser');
    expect(parsed.isAuthenticated).toBe(true);

    const { setSecureItem } = require('@/utils/secureStorage');
    expect(setSecureItem).toHaveBeenCalled();
  });

  it('should leave a server by removing badge', async () => {
    await AsyncStorage.setItem(
      'vibelink_profile',
      JSON.stringify({
        id: 'user-1',
        displayName: 'Test',
        bio: '',
        totalSpend: 0,
        badges: [
          { venueId: 'v1', venueName: 'Club A', badgeType: 'REGULAR', unlockedAt: '2026-01-01' },
          { venueId: 'v2', venueName: 'Club B', badgeType: 'REGULAR', unlockedAt: '2026-01-02' },
        ],
        isIncognito: false,
        followedPerformers: [],
        isVenueManager: false,
        managedVenues: [],
        role: 'PATRON',
        isAuthenticated: true,
        isVerified: false,
        transactionHistory: [],
      })
    );
    mockApiClient.get.mockRejectedValueOnce(new Error('fail'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAppState(), { wrapper });

    await waitFor(() => {
      expect(result.current.joinedServers).toHaveLength(2);
    });

    await act(async () => {
      await result.current.leaveServer.mutateAsync('v1');
    });

    await waitFor(() => {
      expect(result.current.profile.badges).toHaveLength(1);
      expect(result.current.profile.badges[0].venueId).toBe('v2');
    });
  });
});
