import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Mock dependencies
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium', Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('@/services/api', () => ({
  growthApi: {
    getGroupPurchasesByUser: jest.fn().mockResolvedValue({ data: [] }),
    createGroupPurchase: jest.fn().mockResolvedValue({ data: { id: 'gp-1' } }),
    joinGroupPurchase: jest.fn().mockResolvedValue({ data: { id: 'gp-1' } }),
    getReferralStats: jest.fn().mockResolvedValue({ data: null }),
    getReferralRewards: jest.fn().mockResolvedValue({ data: [] }),
    generateReferralCode: jest.fn().mockResolvedValue({ data: { code: 'REF123' } }),
    applyReferralCode: jest.fn().mockResolvedValue({ data: { success: true } }),
    getShareableContent: jest.fn().mockResolvedValue({ data: { templates: [] } }),
  },
}));

jest.mock('../AuthContext', () => ({
  useAuth: () => ({
    userId: 'test-user-id',
    accessToken: 'test-token',
  }),
}));

import { GrowthProvider, useGrowth } from '../GrowthContext';
import { growthApi } from '@/services/api';
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
      <GrowthProvider>{children}</GrowthProvider>
    </QueryClientProvider>
  );
}

describe('GrowthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
  });

  // ===== 1. Shape test =====
  it('should provide all expected properties and methods', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useGrowth(), { wrapper });

    // Group Purchases
    expect(Array.isArray(result.current.groupPurchases)).toBe(true);
    expect(Array.isArray(result.current.myGroupPurchases)).toBe(true);
    expect(Array.isArray(result.current.openGroupPurchases)).toBe(true);
    expect(result.current.selectedGroupPurchase).toBeNull();
    expect(typeof result.current.setSelectedGroupPurchase).toBe('function');
    expect(typeof result.current.createGroupPurchase).toBe('function');
    expect(typeof result.current.joinGroupPurchase).toBe('function');
    expect(typeof result.current.inviteToGroupPurchase).toBe('function');

    // Invites
    expect(Array.isArray(result.current.groupPurchaseInvites)).toBe(true);
    expect(Array.isArray(result.current.pendingInvites)).toBe(true);
    expect(typeof result.current.respondToGroupPurchaseInvite).toBe('function');

    // Referrals
    expect(Array.isArray(result.current.referrals)).toBe(true);
    expect(Array.isArray(result.current.referralRewards)).toBe(true);
    expect(Array.isArray(result.current.activeRewards)).toBe(true);
    expect(typeof result.current.generateReferralCode).toBe('function');
    expect(typeof result.current.applyReferralCode).toBe('function');
    expect(typeof result.current.claimReferralReward).toBe('function');

    // Story Templates & Sharing
    expect(Array.isArray(result.current.storyTemplates)).toBe(true);
    expect(Array.isArray(result.current.shareableContent)).toBe(true);
    expect(typeof result.current.generateStoryTemplate).toBe('function');
    expect(typeof result.current.shareToInstagram).toBe('function');

    // Loading
    expect(typeof result.current.isLoading).toBe('boolean');
  });

  // ===== 2. Default empty state =====
  it('should have empty default state', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useGrowth(), { wrapper });

    await waitFor(() => {
      expect(result.current.groupPurchases).toEqual([]);
      expect(result.current.myGroupPurchases).toEqual([]);
      expect(result.current.openGroupPurchases).toEqual([]);
      expect(result.current.referrals).toEqual([]);
      expect(result.current.referralRewards).toEqual([]);
      expect(result.current.activeRewards).toEqual([]);
      expect(result.current.storyTemplates).toEqual([]);
      expect(result.current.shareableContent).toEqual([]);
    });
  });

  // ===== 3. Group purchases fetched from API =====
  it('should fetch group purchases from the API', async () => {
    const mockPurchases = [
      {
        id: 'gp-1',
        initiatorId: 'test-user-id',
        venueId: 'v-1',
        ticketType: 'ENTRY',
        totalAmount: 100,
        perPersonAmount: 25,
        maxParticipants: 4,
        currentParticipants: ['test-user-id'],
        status: 'OPEN',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
      },
    ];
    (growthApi.getGroupPurchasesByUser as jest.Mock).mockResolvedValueOnce({
      data: mockPurchases,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGrowth(), { wrapper });

    await waitFor(() => {
      expect(result.current.groupPurchases).toEqual(mockPurchases);
    });
    expect(growthApi.getGroupPurchasesByUser).toHaveBeenCalledWith('test-user-id');
  });

  // ===== 4. myGroupPurchases computed value =====
  it('should compute myGroupPurchases filtered by userId', async () => {
    const mockPurchases = [
      {
        id: 'gp-1',
        initiatorId: 'test-user-id',
        venueId: 'v-1',
        ticketType: 'ENTRY',
        totalAmount: 100,
        perPersonAmount: 25,
        maxParticipants: 4,
        currentParticipants: ['test-user-id'],
        status: 'OPEN',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        id: 'gp-2',
        initiatorId: 'other-user',
        venueId: 'v-2',
        ticketType: 'TABLE',
        totalAmount: 500,
        perPersonAmount: 100,
        maxParticipants: 5,
        currentParticipants: ['other-user'],
        status: 'OPEN',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
      },
    ];
    (growthApi.getGroupPurchasesByUser as jest.Mock).mockResolvedValueOnce({
      data: mockPurchases,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGrowth(), { wrapper });

    await waitFor(() => {
      expect(result.current.myGroupPurchases).toHaveLength(1);
      expect(result.current.myGroupPurchases[0].id).toBe('gp-1');
    });
  });

  // ===== 5. openGroupPurchases computed value =====
  it('should compute openGroupPurchases excluding expired ones', async () => {
    const mockPurchases = [
      {
        id: 'gp-open',
        initiatorId: 'u-1',
        venueId: 'v-1',
        ticketType: 'ENTRY',
        totalAmount: 100,
        perPersonAmount: 25,
        maxParticipants: 4,
        currentParticipants: ['u-1'],
        status: 'OPEN',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        id: 'gp-expired',
        initiatorId: 'u-2',
        venueId: 'v-2',
        ticketType: 'TABLE',
        totalAmount: 500,
        perPersonAmount: 100,
        maxParticipants: 5,
        currentParticipants: ['u-2'],
        status: 'OPEN',
        expiresAt: new Date(Date.now() - 86400000).toISOString(), // expired
        createdAt: new Date().toISOString(),
      },
      {
        id: 'gp-completed',
        initiatorId: 'u-3',
        venueId: 'v-3',
        ticketType: 'ENTRY',
        totalAmount: 200,
        perPersonAmount: 50,
        maxParticipants: 4,
        currentParticipants: ['u-3', 'u-4', 'u-5', 'u-6'],
        status: 'COMPLETED',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
      },
    ];
    (growthApi.getGroupPurchasesByUser as jest.Mock).mockResolvedValueOnce({
      data: mockPurchases,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGrowth(), { wrapper });

    await waitFor(() => {
      expect(result.current.openGroupPurchases).toHaveLength(1);
      expect(result.current.openGroupPurchases[0].id).toBe('gp-open');
    });
  });

  // ===== 6. createGroupPurchase mutation =====
  it('should call growthApi.createGroupPurchase and trigger haptics on success', async () => {
    const newPurchase = {
      id: 'gp-new',
      initiatorId: 'test-user-id',
      venueId: 'v-1',
      ticketType: 'ENTRY' as const,
      totalAmount: 200,
      perPersonAmount: 50,
      maxParticipants: 4,
      currentParticipants: ['test-user-id'],
      status: 'OPEN' as const,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString(),
    };
    (growthApi.createGroupPurchase as jest.Mock).mockResolvedValueOnce({
      data: newPurchase,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGrowth(), { wrapper });

    await act(async () => {
      result.current.createGroupPurchase({
        initiatorId: 'test-user-id',
        venueId: 'v-1',
        ticketType: 'ENTRY',
        totalAmount: 200,
        perPersonAmount: 50,
        maxParticipants: 4,
        currentParticipants: ['test-user-id'],
        status: 'OPEN',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });
    });

    await waitFor(() => {
      expect(growthApi.createGroupPurchase).toHaveBeenCalled();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Success
      );
    });
  });

  // ===== 7. createGroupPurchase error shows alert =====
  it('should show an alert when createGroupPurchase fails', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    (growthApi.createGroupPurchase as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGrowth(), { wrapper });

    await act(async () => {
      result.current.createGroupPurchase({
        initiatorId: 'test-user-id',
        venueId: 'v-1',
        ticketType: 'ENTRY',
        totalAmount: 200,
        perPersonAmount: 50,
        maxParticipants: 4,
        currentParticipants: ['test-user-id'],
        status: 'OPEN',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Network error');
    });
  });

  // ===== 8. joinGroupPurchase mutation =====
  it('should call growthApi.joinGroupPurchase and show success alert', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    (growthApi.joinGroupPurchase as jest.Mock).mockResolvedValueOnce({
      data: { id: 'gp-1' },
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGrowth(), { wrapper });

    await act(async () => {
      result.current.joinGroupPurchase({
        groupPurchaseId: 'gp-1',
        userId: 'test-user-id',
      });
    });

    await waitFor(() => {
      expect(growthApi.joinGroupPurchase).toHaveBeenCalledWith('gp-1', 'test-user-id');
      expect(Haptics.notificationAsync).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith(
        'Success!',
        "You've joined the group purchase!"
      );
    });
  });

  // ===== 9. inviteToGroupPurchase stores invite in AsyncStorage =====
  it('should store group purchase invite in AsyncStorage', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const wrapper = createWrapper();
    const { result } = renderHook(() => useGrowth(), { wrapper });

    await act(async () => {
      result.current.inviteToGroupPurchase({
        groupPurchaseId: 'gp-1',
        inviterId: 'test-user-id',
        inviteeId: 'friend-id',
      });
    });

    await waitFor(() => {
      expect(Haptics.notificationAsync).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith(
        'Invite Sent!',
        'Your friend has been invited to join.'
      );
    });

    const stored = await AsyncStorage.getItem('vibelink_group_purchase_invites');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].groupPurchaseId).toBe('gp-1');
    expect(parsed[0].inviterId).toBe('test-user-id');
    expect(parsed[0].inviteeId).toBe('friend-id');
    expect(parsed[0].status).toBe('PENDING');
  });

  // ===== 10. respondToGroupPurchaseInvite updates invite status =====
  it('should update invite status in AsyncStorage when responding', async () => {
    // Pre-populate an invite
    const existingInvite = {
      id: 'gpi-1',
      groupPurchaseId: 'gp-1',
      inviterId: 'other-user',
      inviteeId: 'test-user-id',
      status: 'PENDING',
      sentAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(
      'vibelink_group_purchase_invites',
      JSON.stringify([existingInvite])
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGrowth(), { wrapper });

    // Wait for query to load
    await waitFor(() => {
      expect(result.current.groupPurchaseInvites).toHaveLength(1);
    });

    await act(async () => {
      result.current.respondToGroupPurchaseInvite({
        inviteId: 'gpi-1',
        status: 'ACCEPTED',
      });
    });

    await waitFor(() => {
      expect(Haptics.notificationAsync).toHaveBeenCalled();
    });

    const stored = await AsyncStorage.getItem('vibelink_group_purchase_invites');
    const parsed = JSON.parse(stored!);
    expect(parsed[0].status).toBe('ACCEPTED');
    expect(parsed[0].respondedAt).toBeDefined();
  });

  // ===== 11. pendingInvites computed value =====
  it('should compute pendingInvites for current user', async () => {
    const invites = [
      {
        id: 'gpi-1',
        groupPurchaseId: 'gp-1',
        inviterId: 'other-user',
        inviteeId: 'test-user-id',
        status: 'PENDING',
        sentAt: new Date().toISOString(),
      },
      {
        id: 'gpi-2',
        groupPurchaseId: 'gp-2',
        inviterId: 'other-user',
        inviteeId: 'test-user-id',
        status: 'ACCEPTED',
        sentAt: new Date().toISOString(),
      },
      {
        id: 'gpi-3',
        groupPurchaseId: 'gp-3',
        inviterId: 'other-user',
        inviteeId: 'someone-else',
        status: 'PENDING',
        sentAt: new Date().toISOString(),
      },
    ];
    await AsyncStorage.setItem(
      'vibelink_group_purchase_invites',
      JSON.stringify(invites)
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGrowth(), { wrapper });

    await waitFor(() => {
      expect(result.current.pendingInvites).toHaveLength(1);
      expect(result.current.pendingInvites[0].id).toBe('gpi-1');
    });
  });

  // ===== 12. generateReferralCode mutation =====
  it('should call growthApi.generateReferralCode and trigger haptics', async () => {
    (growthApi.generateReferralCode as jest.Mock).mockResolvedValueOnce({
      data: { code: 'NEWREF123' },
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGrowth(), { wrapper });

    await act(async () => {
      result.current.generateReferralCode('test-user-id');
    });

    await waitFor(() => {
      expect(growthApi.generateReferralCode).toHaveBeenCalledWith('test-user-id');
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Success
      );
    });
  });

  // ===== 13. applyReferralCode mutation =====
  it('should call growthApi.applyReferralCode and show success alert', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    (growthApi.applyReferralCode as jest.Mock).mockResolvedValueOnce({
      data: { success: true },
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGrowth(), { wrapper });

    await act(async () => {
      result.current.applyReferralCode({
        code: 'REF123',
        userId: 'test-user-id',
      });
    });

    await waitFor(() => {
      expect(growthApi.applyReferralCode).toHaveBeenCalledWith('REF123', 'test-user-id');
      expect(Haptics.notificationAsync).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith(
        'Referral Applied!',
        "You've earned $10 off your first visit!"
      );
    });
  });

  // ===== 14. applyReferralCode error shows alert =====
  it('should show an alert when applyReferralCode fails', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    (growthApi.applyReferralCode as jest.Mock).mockRejectedValueOnce(
      new Error('Invalid code')
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGrowth(), { wrapper });

    await act(async () => {
      result.current.applyReferralCode({
        code: 'BAD_CODE',
        userId: 'test-user-id',
      });
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Invalid code');
    });
  });

  // ===== 15. claimReferralReward updates reward in AsyncStorage =====
  it('should mark reward as used in AsyncStorage when claimed', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    // Mock referralRewardsQuery to return rewards (via API mock)
    (growthApi.getReferralRewards as jest.Mock).mockResolvedValue({
      data: [
        {
          id: 'rr-1',
          userId: 'test-user-id',
          referralId: 'ref-1',
          type: 'REFERRER',
          reward: { type: 'DISCOUNT', value: 10, description: '$10 off' },
          isUsed: false,
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        },
      ],
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGrowth(), { wrapper });

    // Wait for rewards query to load
    await waitFor(() => {
      expect(result.current.referralRewards).toHaveLength(1);
    });

    await act(async () => {
      result.current.claimReferralReward('rr-1');
    });

    await waitFor(() => {
      expect(Haptics.notificationAsync).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith(
        'Reward Claimed!',
        'Your reward has been applied.'
      );
    });

    const stored = await AsyncStorage.getItem('vibelink_referral_rewards');
    const parsed = JSON.parse(stored!);
    expect(parsed[0].isUsed).toBe(true);
    expect(parsed[0].usedAt).toBeDefined();
  });

  // ===== 16. activeRewards computed value =====
  it('should compute activeRewards filtering out used and expired rewards', async () => {
    (growthApi.getReferralRewards as jest.Mock).mockResolvedValue({
      data: [
        {
          id: 'rr-active',
          userId: 'test-user-id',
          referralId: 'ref-1',
          type: 'REFERRER',
          reward: { type: 'DISCOUNT', value: 10, description: '$10 off' },
          isUsed: false,
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        },
        {
          id: 'rr-used',
          userId: 'test-user-id',
          referralId: 'ref-2',
          type: 'REFEREE',
          reward: { type: 'FREE_DRINK', value: 1, description: 'Free drink' },
          isUsed: true,
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          usedAt: new Date().toISOString(),
        },
        {
          id: 'rr-expired',
          userId: 'test-user-id',
          referralId: 'ref-3',
          type: 'REFERRER',
          reward: { type: 'SKIP_LINE', value: 1, description: 'Skip line' },
          isUsed: false,
          expiresAt: new Date(Date.now() - 86400000).toISOString(), // expired
        },
        {
          id: 'rr-other-user',
          userId: 'other-user',
          referralId: 'ref-4',
          type: 'REFERRER',
          reward: { type: 'VIP_ACCESS', value: 1, description: 'VIP' },
          isUsed: false,
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        },
      ],
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGrowth(), { wrapper });

    await waitFor(() => {
      expect(result.current.activeRewards).toHaveLength(1);
      expect(result.current.activeRewards[0].id).toBe('rr-active');
    });
  });

  // ===== 17. shareableContent loaded from AsyncStorage =====
  it('should load shareable content from AsyncStorage', async () => {
    const mockContent = [
      {
        id: 'share-1',
        userId: 'test-user-id',
        type: 'EVENT',
        templateId: 'tpl-1',
        customData: {},
        deepLink: 'https://nox.social/event/1',
        createdAt: new Date().toISOString(),
        shareCount: 0,
        clickCount: 0,
      },
    ];
    await AsyncStorage.setItem(
      'vibelink_shareable_content',
      JSON.stringify(mockContent)
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGrowth(), { wrapper });

    await waitFor(() => {
      expect(result.current.shareableContent).toHaveLength(1);
      expect(result.current.shareableContent[0].id).toBe('share-1');
    });
  });

  // ===== 18. shareToInstagram increments share count =====
  it('should increment shareCount when sharing to Instagram', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const mockContent = [
      {
        id: 'share-1',
        userId: 'test-user-id',
        type: 'EVENT',
        templateId: 'tpl-1',
        customData: {},
        deepLink: 'https://nox.social/event/1',
        createdAt: new Date().toISOString(),
        shareCount: 0,
        clickCount: 0,
      },
    ];
    await AsyncStorage.setItem(
      'vibelink_shareable_content',
      JSON.stringify(mockContent)
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGrowth(), { wrapper });

    // Wait for content to load
    await waitFor(() => {
      expect(result.current.shareableContent).toHaveLength(1);
    });

    await act(async () => {
      await result.current.shareToInstagram('share-1');
    });

    await waitFor(() => {
      expect(Haptics.notificationAsync).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith(
        'Shared!',
        'Your story has been shared to Instagram!'
      );
    });

    const stored = await AsyncStorage.getItem('vibelink_shareable_content');
    const parsed = JSON.parse(stored!);
    expect(parsed[0].shareCount).toBe(1);
  });

  // ===== 19. setSelectedGroupPurchase updates state =====
  it('should update selectedGroupPurchase via setter', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useGrowth(), { wrapper });

    expect(result.current.selectedGroupPurchase).toBeNull();

    const mockGP = {
      id: 'gp-1',
      initiatorId: 'test-user-id',
      venueId: 'v-1',
      ticketType: 'ENTRY' as const,
      totalAmount: 100,
      perPersonAmount: 25,
      maxParticipants: 4,
      currentParticipants: ['test-user-id'],
      status: 'OPEN' as const,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    act(() => {
      result.current.setSelectedGroupPurchase(mockGP);
    });

    expect(result.current.selectedGroupPurchase).toEqual(mockGP);
  });

  // ===== 20. API error in groupPurchasesQuery returns empty array =====
  it('should return empty array when groupPurchases API call fails', async () => {
    (growthApi.getGroupPurchasesByUser as jest.Mock).mockRejectedValueOnce(
      new Error('Server error')
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGrowth(), { wrapper });

    await waitFor(() => {
      expect(result.current.groupPurchases).toEqual([]);
    });
  });

  // ===== 21. referralStats fetched from API =====
  it('should fetch referral stats from the API', async () => {
    const mockStats = {
      userId: 'test-user-id',
      referralCode: 'MYCODE',
      totalReferrals: 5,
      successfulReferrals: 3,
      totalRewardsEarned: 30,
      pendingRewards: [],
      lifetimeValue: 150,
    };
    (growthApi.getReferralStats as jest.Mock).mockResolvedValue({
      data: mockStats,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGrowth(), { wrapper });

    await waitFor(() => {
      expect(result.current.referralStats).toEqual(mockStats);
    });
  });
});
