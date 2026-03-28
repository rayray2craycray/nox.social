import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { ModerationProvider, useModeration } from '../ModerationContext';

// Mock dependencies
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
}));

jest.mock('@/services/api', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

// Import the mocked apiClient after mock setup
import { apiClient } from '@/services/api';
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

jest.mock('@/services/config', () => ({
  API_ENDPOINTS: {
    MODERATION: {
      REPORTS: { CREATE: '/moderation/reports' },
      BLOCKING: {
        BLOCK: '/moderation/blocking/block',
        UNBLOCK: (id: string) => `/moderation/blocking/unblock/${id}`,
        BLOCKED_USERS: '/moderation/blocking/blocked',
        IS_BLOCKED: (id: string) => `/moderation/blocking/is-blocked/${id}`,
      },
    },
  },
}));

jest.mock('../AuthContext', () => ({
  useAuth: () => ({
    userId: 'test-user-id',
    accessToken: 'test-token',
  }),
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
      <ModerationProvider>{children}</ModerationProvider>
    </QueryClientProvider>
  );
}

describe('ModerationContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiClient.get.mockResolvedValue({ data: [] });
  });

  it('should throw when used outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    expect(() => {
      renderHook(() => useModeration());
    }).toThrow('useModeration must be used within a ModerationProvider');
    spy.mockRestore();
  });

  it('should provide all moderation methods and state', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useModeration(), { wrapper });

    expect(typeof result.current.submitReport).toBe('function');
    expect(typeof result.current.blockUser).toBe('function');
    expect(typeof result.current.unblockUser).toBe('function');
    expect(typeof result.current.checkIfBlocked).toBe('function');
    expect(typeof result.current.refetchBlockedUsers).toBe('function');
    expect(result.current.isSubmittingReport).toBe(false);
    expect(result.current.isBlocking).toBe(false);
    expect(result.current.isUnblocking).toBe(false);
    expect(Array.isArray(result.current.blockedUsers)).toBe(true);
  });

  it('should submit a report successfully', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    mockApiClient.post.mockResolvedValueOnce({ data: { id: 'report-1' } });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useModeration(), { wrapper });

    await act(async () => {
      await result.current.submitReport({
        contentType: 'video',
        contentId: 'vid-123',
        reason: 'spam',
        details: 'This is spam',
      });
    });

    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/moderation/reports',
      expect.objectContaining({
        contentType: 'video',
        contentId: 'vid-123',
        reason: 'spam',
      })
    );
    expect(alertSpy).toHaveBeenCalledWith(
      'Report Submitted',
      expect.any(String)
    );
  });

  it('should handle report submission failure', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    mockApiClient.post.mockRejectedValueOnce(new Error('Network error'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useModeration(), { wrapper });

    await act(async () => {
      try {
        await result.current.submitReport({
          contentType: 'user',
          contentId: 'user-bad',
          reason: 'harassment',
          details: 'Harassing me',
        });
      } catch {
        // Expected to throw
      }
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Report Failed',
        expect.any(String)
      );
    });
  });

  it('should block a user via confirmation dialog', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    mockApiClient.post.mockResolvedValueOnce({ data: { success: true } });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useModeration(), { wrapper });

    act(() => {
      result.current.blockUser('bad-user-id', 'Bad User');
    });

    // Should show confirmation dialog
    expect(alertSpy).toHaveBeenCalledWith(
      'Block User',
      expect.stringContaining('Bad User'),
      expect.any(Array)
    );

    // Simulate pressing "Block" button (last non-cancel button)
    const buttons = alertSpy.mock.calls[0][2] as any[];
    const blockButton = buttons.find((b: any) => b.text === 'Block');
    expect(blockButton).toBeDefined();

    await act(async () => {
      blockButton.onPress();
    });

    await waitFor(() => {
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/moderation/blocking/block',
        { userIdToBlock: 'bad-user-id' }
      );
    });
  });

  it('should unblock a user successfully', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    mockApiClient.post.mockResolvedValueOnce({ data: { success: true } });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useModeration(), { wrapper });

    await act(async () => {
      await result.current.unblockUser('blocked-user-id');
    });

    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/moderation/blocking/unblock/blocked-user-id',
      {}
    );

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'User Unblocked',
        expect.any(String)
      );
    });
  });

  it('should check if a user is blocked', async () => {
    // The blocked users query also uses get, so we need to handle both calls
    mockApiClient.get.mockImplementation((url: string) => {
      if (url.includes('is-blocked')) {
        return Promise.resolve({ data: { isBlocked: true } });
      }
      return Promise.resolve({ data: [] });
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useModeration(), { wrapper });

    let isBlocked: boolean;
    await act(async () => {
      isBlocked = await result.current.checkIfBlocked('some-user-id');
    });

    expect(isBlocked!).toBe(true);
  });

  it('should return false for checkIfBlocked when API fails', async () => {
    mockApiClient.get.mockRejectedValueOnce(new Error('Network error'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useModeration(), { wrapper });

    let isBlocked: boolean;
    await act(async () => {
      isBlocked = await result.current.checkIfBlocked('some-user-id');
    });

    expect(isBlocked!).toBe(false);
  });

  it('should fetch and display blocked users list', async () => {
    mockApiClient.get.mockResolvedValue({
      data: [
        {
          _id: 'block-1',
          blockedUserId: {
            _id: 'user-blocked-1',
            displayName: 'Blocked Guy',
          },
          createdAt: '2024-01-01',
        },
      ],
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useModeration(), { wrapper });

    await waitFor(() => {
      expect(result.current.blockedUsers.length).toBe(1);
    });

    expect(result.current.blockedUsers[0].blockedUserId._id).toBe('user-blocked-1');
  });
});
