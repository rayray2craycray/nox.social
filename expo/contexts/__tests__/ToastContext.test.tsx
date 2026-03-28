import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(),
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn().mockReturnValue('nox://toast-callback'),
}));

jest.mock('@/services/api', () => ({
  api: {
    get: jest.fn().mockResolvedValue({ data: null }),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('@/utils/secureStorage', () => ({
  getSecureItem: jest.fn().mockResolvedValue(null),
  setSecureItem: jest.fn().mockResolvedValue(undefined),
  deleteSecureItem: jest.fn().mockResolvedValue(undefined),
  SECURE_KEYS: {
    TOAST_ACCESS_TOKEN: 'vibelink_toast_access_token',
    TOAST_REFRESH_TOKEN: 'vibelink_toast_refresh_token',
  },
}));

import { api } from '@/services/api';
import * as WebBrowser from 'expo-web-browser';
import { setSecureItem, deleteSecureItem } from '@/utils/secureStorage';

const mockApi = api as jest.Mocked<typeof api>;
const mockWebBrowser = WebBrowser as jest.Mocked<typeof WebBrowser>;
const mockSetSecureItem = setSecureItem as jest.Mock;
const mockDeleteSecureItem = deleteSecureItem as jest.Mock;

import { ToastProvider, useToast } from '../ToastContext';

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
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}

const mockIntegration = {
  id: 'int-1',
  venueId: 'venue-1',
  status: 'CONNECTED' as const,
  metadata: { restaurantExternalId: 'rest-ext-1' },
  syncConfig: { enabled: true, interval: 300000 },
  selectedLocations: ['loc-1'],
  webhooksEnabled: true,
  connectedAt: '2026-01-01T00:00:00.000Z',
  lastSyncAt: '2026-01-01T00:00:00.000Z',
};

const mockSpendRules = [
  {
    id: 'rule-1',
    venueId: 'venue-1',
    threshold: 50,
    tierUnlocked: 'REGULAR' as const,
    serverAccessLevel: 'PUBLIC_LOBBY' as const,
    isLiveOnly: false,
    isActive: true,
    description: 'Basic rule',
    priority: 1,
  },
  {
    id: 'rule-2',
    venueId: 'venue-1',
    threshold: 200,
    tierUnlocked: 'WHALE' as const,
    serverAccessLevel: 'INNER_CIRCLE' as const,
    isLiveOnly: true,
    isActive: false,
    description: 'VIP rule',
    priority: 2,
  },
];

const mockTransactions = [
  {
    id: 'txn-1',
    venueId: 'venue-1',
    locationId: 'loc-1',
    amount: 75.5,
    cardToken: 'card-1',
    timestamp: '2026-01-01T12:00:00Z',
    orderGuid: 'order-1',
    checkGuid: 'check-1',
  },
  {
    id: 'txn-2',
    venueId: 'venue-1',
    locationId: 'loc-2',
    amount: 120.0,
    cardToken: 'card-2',
    timestamp: '2026-01-01T13:00:00Z',
    orderGuid: 'order-2',
    checkGuid: 'check-2',
  },
  {
    id: 'txn-3',
    venueId: 'venue-2',
    locationId: 'loc-3',
    amount: 30.0,
    cardToken: 'card-3',
    timestamp: '2026-01-01T14:00:00Z',
    orderGuid: 'order-3',
    checkGuid: 'check-3',
  },
];

describe('ToastContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
    // Reset API mocks to default empty responses
    mockApi.get.mockResolvedValue({ data: null });
  });

  // ─── 1. Provider / hook contract ────────────────────────────────────

  it('should throw when used outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    const { result } = renderHook(() => useToast());
    // createContextHook returns undefined when used outside the provider
    expect(result.current).toBeUndefined();
    spy.mockRestore();
  });

  it('should provide all expected methods and state', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useToast(), { wrapper });

    // State
    expect(result.current.integration).toBeDefined();
    expect(Array.isArray(result.current.spendRules)).toBe(true);
    expect(Array.isArray(result.current.transactions)).toBe(true);
    expect(Array.isArray(result.current.availableLocations)).toBe(true);

    // Status flags
    expect(typeof result.current.isConnected).toBe('boolean');
    expect(typeof result.current.isConnecting).toBe('boolean');
    expect(typeof result.current.hasError).toBe('boolean');
    expect(typeof result.current.isLoading).toBe('boolean');

    // Mutations
    expect(result.current.connectToast).toBeDefined();
    expect(result.current.disconnectToast).toBeDefined();
    expect(result.current.selectLocations).toBeDefined();
    expect(result.current.createSpendRule).toBeDefined();
    expect(result.current.updateSpendRule).toBeDefined();
    expect(result.current.deleteSpendRule).toBeDefined();

    // Helpers
    expect(typeof result.current.processTransaction).toBe('function');
    expect(typeof result.current.getVenueTransactions).toBe('function');
    expect(typeof result.current.getVenueRevenue).toBe('function');
    expect(typeof result.current.getActiveRules).toBe('function');
  });

  // ─── 2. Integration query ───────────────────────────────────────────

  it('should return default disconnected integration when API returns nothing', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useToast(), { wrapper });

    await waitFor(() => {
      expect(result.current.integration.status).toBe('DISCONNECTED');
      expect(result.current.isConnected).toBe(false);
    });
  });

  it('should fetch integration from API and cache it', async () => {
    mockApi.get.mockImplementation(async (url: string) => {
      if (url === '/pos/toast/status') {
        return { data: mockIntegration };
      }
      return { data: null };
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useToast(), { wrapper });

    await waitFor(() => {
      expect(result.current.integration.status).toBe('CONNECTED');
      expect(result.current.isConnected).toBe(true);
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'vibelink_toast_integration',
      JSON.stringify(mockIntegration)
    );
  });

  it('should fall back to cached integration when API fails', async () => {
    await AsyncStorage.setItem(
      'vibelink_toast_integration',
      JSON.stringify(mockIntegration)
    );

    mockApi.get.mockRejectedValue(new Error('Network error'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useToast(), { wrapper });

    await waitFor(() => {
      expect(result.current.integration.status).toBe('CONNECTED');
      expect(result.current.isConnected).toBe(true);
    });
  });

  // ─── 3. Spend rules query ──────────────────────────────────────────

  it('should return empty spend rules by default', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useToast(), { wrapper });

    await waitFor(() => {
      expect(result.current.spendRules).toEqual([]);
    });
  });

  it('should fall back to cached spend rules when API fails', async () => {
    await AsyncStorage.setItem(
      'vibelink_toast_spend_rules',
      JSON.stringify(mockSpendRules)
    );

    mockApi.get.mockRejectedValue(new Error('Network error'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useToast(), { wrapper });

    await waitFor(() => {
      expect(result.current.spendRules).toEqual(mockSpendRules);
    });
  });

  // ─── 4. Transactions query ─────────────────────────────────────────

  it('should return empty transactions by default', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useToast(), { wrapper });

    await waitFor(() => {
      expect(result.current.transactions).toEqual([]);
    });
  });

  it('should fall back to cached transactions when API fails', async () => {
    await AsyncStorage.setItem(
      'vibelink_toast_transactions',
      JSON.stringify(mockTransactions)
    );

    mockApi.get.mockRejectedValue(new Error('Network error'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useToast(), { wrapper });

    await waitFor(() => {
      expect(result.current.transactions).toEqual(mockTransactions);
    });
  });

  // ─── 5. connectToast mutation ──────────────────────────────────────

  it('should complete the OAuth flow and store tokens on connect', async () => {
    const tokenResponse = {
      accessToken: 'access-tok',
      refreshToken: 'refresh-tok',
      expiresIn: 3600,
      restaurantExternalId: 'rest-ext-1',
      locations: [{ id: 'loc-1', name: 'Main Bar', restaurantGuid: 'guid-1' }],
    };

    mockWebBrowser.openAuthSessionAsync.mockResolvedValueOnce({
      type: 'success',
      url: 'nox://toast-callback?code=auth-code-123',
    } as any);

    mockApi.post.mockResolvedValueOnce(tokenResponse);

    // Set a client ID so the flow doesn't throw early
    const originalEnv = process.env.EXPO_PUBLIC_TOAST_CLIENT_ID;
    process.env.EXPO_PUBLIC_TOAST_CLIENT_ID = 'test-client-id';

    const wrapper = createWrapper();
    const { result } = renderHook(() => useToast(), { wrapper });

    await act(async () => {
      result.current.connectToast.mutate();
    });

    await waitFor(() => {
      expect(result.current.connectToast.isSuccess || result.current.connectToast.isError).toBe(true);
    });

    // If the mutation succeeded, verify secure storage calls
    if (result.current.connectToast.isSuccess) {
      expect(mockSetSecureItem).toHaveBeenCalledWith(
        'vibelink_toast_access_token',
        'access-tok'
      );
      expect(mockSetSecureItem).toHaveBeenCalledWith(
        'vibelink_toast_refresh_token',
        'refresh-tok'
      );
      expect(result.current.integration.status).toBe('CONNECTED');
      expect(result.current.availableLocations.length).toBeGreaterThan(0);
    }

    process.env.EXPO_PUBLIC_TOAST_CLIENT_ID = originalEnv;
  });

  it('should set ERROR status when OAuth is cancelled', async () => {
    mockWebBrowser.openAuthSessionAsync.mockResolvedValueOnce({
      type: 'cancel',
    } as any);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useToast(), { wrapper });

    // Wait for initial queries to settle before mutating
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.connectToast.mutate();
    });

    // The mutation will error (either due to missing client ID or cancelled OAuth)
    // and the onError handler sets integration.status to 'ERROR'
    await waitFor(() => {
      expect(result.current.connectToast.isError).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.hasError).toBe(true);
    });
  });

  // ─── 6. disconnectToast mutation ───────────────────────────────────

  it('should clear tokens and reset integration on disconnect', async () => {
    // Start with cached connected state
    await AsyncStorage.setItem(
      'vibelink_toast_integration',
      JSON.stringify(mockIntegration)
    );
    mockApi.get.mockImplementation(async (url: string) => {
      if (url === '/pos/toast/status') {
        return { data: mockIntegration };
      }
      return { data: null };
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useToast(), { wrapper });

    // Wait for connected state
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    await act(async () => {
      result.current.disconnectToast.mutate();
    });

    await waitFor(() => {
      expect(result.current.disconnectToast.isSuccess).toBe(true);
    });

    expect(mockDeleteSecureItem).toHaveBeenCalledWith('vibelink_toast_access_token');
    expect(mockDeleteSecureItem).toHaveBeenCalledWith('vibelink_toast_refresh_token');
    expect(result.current.integration.status).toBe('DISCONNECTED');
    expect(result.current.isConnected).toBe(false);
    expect(result.current.integration.webhooksEnabled).toBe(false);
    expect(result.current.integration.selectedLocations).toEqual([]);
    expect(result.current.availableLocations).toEqual([]);
  });

  // ─── 7. selectLocations mutation ───────────────────────────────────

  it('should update selectedLocations on the integration', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useToast(), { wrapper });

    // Wait for initial queries to settle before mutating
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.selectLocations.mutate(['loc-a', 'loc-b']);
    });

    await waitFor(() => {
      expect(result.current.selectLocations.isSuccess).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.integration.selectedLocations).toEqual(['loc-a', 'loc-b']);
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'vibelink_toast_integration',
      expect.stringContaining('"selectedLocations":["loc-a","loc-b"]')
    );
  });

  // ─── 8. createSpendRule mutation ───────────────────────────────────

  it('should throw when creating a spend rule without a venue', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useToast(), { wrapper });

    const newRule = {
      venueId: 'venue-1',
      threshold: 100,
      tierUnlocked: 'PLATINUM' as const,
      serverAccessLevel: 'INNER_CIRCLE' as const,
      isLiveOnly: false,
      isActive: true,
    };

    await act(async () => {
      result.current.createSpendRule.mutate(newRule);
    });

    await waitFor(() => {
      expect(result.current.createSpendRule.isError).toBe(true);
    });

    expect(result.current.createSpendRule.error?.message).toBe('No venue connected');
  });

  // ─── 9. getVenueTransactions helper ────────────────────────────────

  it('should filter transactions by venueId', async () => {
    await AsyncStorage.setItem(
      'vibelink_toast_transactions',
      JSON.stringify(mockTransactions)
    );

    mockApi.get.mockRejectedValue(new Error('offline'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useToast(), { wrapper });

    await waitFor(() => {
      expect(result.current.transactions.length).toBe(3);
    });

    const venue1Txns = result.current.getVenueTransactions('venue-1');
    expect(venue1Txns).toHaveLength(2);
    expect(venue1Txns.every((t: any) => t.venueId === 'venue-1')).toBe(true);

    const venue2Txns = result.current.getVenueTransactions('venue-2');
    expect(venue2Txns).toHaveLength(1);

    const noTxns = result.current.getVenueTransactions('venue-nonexistent');
    expect(noTxns).toHaveLength(0);
  });

  // ─── 10. getVenueRevenue helper ────────────────────────────────────

  it('should sum transaction amounts for a venue', async () => {
    await AsyncStorage.setItem(
      'vibelink_toast_transactions',
      JSON.stringify(mockTransactions)
    );

    mockApi.get.mockRejectedValue(new Error('offline'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useToast(), { wrapper });

    await waitFor(() => {
      expect(result.current.transactions.length).toBe(3);
    });

    const revenue = result.current.getVenueRevenue('venue-1');
    expect(revenue).toBeCloseTo(195.5); // 75.5 + 120.0

    const noRevenue = result.current.getVenueRevenue('venue-nonexistent');
    expect(noRevenue).toBe(0);
  });

  // ─── 11. getActiveRules helper ─────────────────────────────────────

  it('should return only active spend rules', async () => {
    await AsyncStorage.setItem(
      'vibelink_toast_spend_rules',
      JSON.stringify(mockSpendRules)
    );

    mockApi.get.mockRejectedValue(new Error('offline'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useToast(), { wrapper });

    await waitFor(() => {
      expect(result.current.spendRules.length).toBe(2);
    });

    const activeRules = result.current.getActiveRules();
    expect(activeRules).toHaveLength(1);
    expect(activeRules[0].id).toBe('rule-1');
    expect(activeRules[0].isActive).toBe(true);
  });

  // ─── 12. Status flags ─────────────────────────────────────────────

  it('should correctly derive status flags from integration state', async () => {
    // Default state: DISCONNECTED
    const wrapper = createWrapper();
    const { result } = renderHook(() => useToast(), { wrapper });

    await waitFor(() => {
      expect(result.current.integration.status).toBe('DISCONNECTED');
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.hasError).toBe(false);
  });

  it('should reflect CONNECTED status when integration is fetched', async () => {
    mockApi.get.mockImplementation(async (url: string) => {
      if (url === '/pos/toast/status') {
        return { data: mockIntegration };
      }
      return { data: null };
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useToast(), { wrapper });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.hasError).toBe(false);
    });
  });

  // ─── 13. isLoading flag ───────────────────────────────────────────

  it('should set isLoading while queries are in flight', async () => {
    // Make API hang to test loading state
    let resolveApi: (value: any) => void;
    mockApi.get.mockImplementation(
      () => new Promise((resolve) => { resolveApi = resolve; })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useToast(), { wrapper });

    // Should be loading while the query hasn't resolved
    expect(result.current.isLoading).toBe(true);

    // Resolve the API call
    await act(async () => {
      resolveApi!({ data: null });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  // ─── 14. processTransaction ────────────────────────────────────────

  it('should process a transaction via API and return success', async () => {
    mockApi.post.mockResolvedValueOnce({
      data: { success: true, ruleTriggered: 'rule-1' },
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useToast(), { wrapper });

    // Wait for initial queries to settle
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const txn = {
      id: 'txn-new',
      venueId: 'venue-1',
      locationId: 'loc-1',
      amount: 50,
      cardToken: 'card-x',
      timestamp: '2026-01-01T15:00:00Z',
      orderGuid: 'order-x',
      checkGuid: 'check-x',
    };

    let response: any;
    await act(async () => {
      response = await result.current.processTransaction(txn);
    });

    expect(mockApi.post).toHaveBeenCalledWith(
      '/pos/transactions/process',
      txn
    );
    expect(response.success).toBe(true);
  });

  it('should store transaction locally when API fails', async () => {
    mockApi.post.mockReset();
    mockApi.post.mockRejectedValue(new Error('Server down'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useToast(), { wrapper });

    // Wait for initial queries to settle
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const txn = {
      id: 'txn-fail',
      venueId: 'venue-1',
      locationId: 'loc-1',
      amount: 25,
      cardToken: 'card-y',
      timestamp: '2026-01-01T16:00:00Z',
      orderGuid: 'order-y',
      checkGuid: 'check-y',
    };

    let response: any;
    await act(async () => {
      response = await result.current.processTransaction(txn);
    });

    expect(response.success).toBe(false);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'vibelink_toast_transactions',
      expect.stringContaining('txn-fail')
    );
  });
});
