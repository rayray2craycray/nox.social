import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('@/services/api', () => ({
  api: {
    get: jest.fn().mockResolvedValue({ data: null }),
    post: jest.fn().mockResolvedValue({ data: null }),
    patch: jest.fn().mockResolvedValue({ data: null }),
    delete: jest.fn().mockResolvedValue({ data: null }),
  },
}));

jest.mock('@/constants/app', () => ({
  POS_CONFIG: {
    syncInterval: 300000,
  },
}));

import { api } from '@/services/api';
const mockApi = api as jest.Mocked<typeof api>;

import { POSProvider, usePOS } from '../POSContext';

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

const STORAGE_KEYS = {
  POS_INTEGRATION: 'vibelink_pos_integration',
  POS_SPEND_RULES: 'vibelink_pos_spend_rules',
  POS_TRANSACTIONS: 'vibelink_pos_transactions',
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <POSProvider>{children}</POSProvider>
    </QueryClientProvider>
  );
}

const mockIntegration = {
  id: 'int-1',
  venueId: 'venue-1',
  provider: 'TOAST' as const,
  status: 'CONNECTED' as const,
  metadata: { locationName: 'Test Location' },
  syncConfig: { enabled: true, interval: 300000 },
};

const mockSpendRule = {
  id: 'rule-1',
  venueId: 'venue-1',
  threshold: 50,
  tierUnlocked: 'REGULAR' as const,
  serverAccessLevel: 'PUBLIC_LOBBY' as const,
  isLiveOnly: false,
  isActive: true,
};

const mockSpendRuleInactive = {
  id: 'rule-2',
  venueId: 'venue-1',
  threshold: 200,
  tierUnlocked: 'WHALE' as const,
  serverAccessLevel: 'INNER_CIRCLE' as const,
  isLiveOnly: true,
  isActive: false,
};

const mockTransaction = {
  id: 'txn-1',
  posIntegrationId: 'int-1',
  venueId: 'venue-1',
  provider: 'TOAST' as const,
  externalIds: { transactionId: 'ext-1' },
  amount: { total: 5000 },
  currency: 'USD',
  paymentMethod: { type: 'CARD' },
  userId: 'user-1',
  status: 'COMPLETED' as const,
  timestamp: '2026-01-01T00:00:00Z',
};

const mockTransaction2 = {
  id: 'txn-2',
  posIntegrationId: 'int-1',
  venueId: 'venue-2',
  provider: 'SQUARE' as const,
  externalIds: { transactionId: 'ext-2' },
  amount: { total: 3000 },
  currency: 'USD',
  paymentMethod: { type: 'CASH' },
  userId: 'user-2',
  status: 'COMPLETED' as const,
  timestamp: '2026-01-02T00:00:00Z',
};

const mockTransaction3 = {
  id: 'txn-3',
  posIntegrationId: 'int-1',
  venueId: 'venue-1',
  provider: 'TOAST' as const,
  externalIds: { transactionId: 'ext-3' },
  amount: { total: 7500 },
  currency: 'USD',
  paymentMethod: { type: 'CARD' },
  userId: 'user-1',
  status: 'COMPLETED' as const,
  timestamp: '2026-01-03T00:00:00Z',
};

describe('POSContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
  });

  // -------------------------------------------------------
  // 1. Default / initial state
  // -------------------------------------------------------
  it('should provide default state values', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => usePOS(), { wrapper });

    expect(result.current.integration).toBeNull();
    expect(result.current.spendRules).toEqual([]);
    expect(result.current.transactions).toEqual([]);
    expect(result.current.availableLocations).toEqual([]);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.hasError).toBe(false);
  });

  // -------------------------------------------------------
  // 2. All expected properties and methods are exposed
  // -------------------------------------------------------
  it('should expose all expected properties and methods', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => usePOS(), { wrapper });

    // State
    expect(result.current).toHaveProperty('integration');
    expect(result.current).toHaveProperty('spendRules');
    expect(result.current).toHaveProperty('transactions');
    expect(result.current).toHaveProperty('availableLocations');

    // Status flags
    expect(typeof result.current.isConnected).toBe('boolean');
    expect(typeof result.current.isConnecting).toBe('boolean');
    expect(typeof result.current.hasError).toBe('boolean');
    expect(typeof result.current.isLoading).toBe('boolean');

    // Connection mutations
    expect(result.current.connectPOS).toBeDefined();
    expect(result.current.validateCredentials).toBeDefined();
    expect(result.current.disconnectPOS).toBeDefined();
    expect(result.current.getStatus).toBeDefined();

    // Transaction mutations & helpers
    expect(result.current.syncTransactions).toBeDefined();
    expect(result.current.getRevenue).toBeDefined();
    expect(typeof result.current.getVenueTransactions).toBe('function');
    expect(typeof result.current.getVenueRevenue).toBe('function');
    expect(typeof result.current.getUserLifetimeSpend).toBe('function');

    // Spend rule mutations & helpers
    expect(result.current.createSpendRule).toBeDefined();
    expect(result.current.updateSpendRule).toBeDefined();
    expect(result.current.deleteSpendRule).toBeDefined();
    expect(result.current.toggleSpendRule).toBeDefined();
    expect(typeof result.current.getActiveRules).toBe('function');
  });

  // -------------------------------------------------------
  // 3. Integration query loads cached data from AsyncStorage
  // -------------------------------------------------------
  it('should load cached integration from AsyncStorage when API is unavailable', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.POS_INTEGRATION,
      JSON.stringify(mockIntegration)
    );

    // API call fails so falls back to cache
    (mockApi.get as jest.Mock).mockRejectedValueOnce(new Error('network error'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => usePOS(), { wrapper });

    await waitFor(() => {
      expect(result.current.integration).not.toBeNull();
    });

    expect(result.current.integration?.venueId).toBe('venue-1');
    expect(result.current.isConnected).toBe(true);
  });

  // -------------------------------------------------------
  // 4. connectPOS mutation calls API and stores result
  // -------------------------------------------------------
  it('should connect POS via API and persist integration', async () => {
    const connectedIntegration = { ...mockIntegration, status: 'CONNECTED' as const };
    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: connectedIntegration });

    const wrapper = createWrapper();
    const { result } = renderHook(() => usePOS(), { wrapper });

    await act(async () => {
      await result.current.connectPOS.mutateAsync({
        venueId: 'venue-1',
        provider: 'TOAST',
        credentials: {
          apiKey: 'test-key',
          locationId: 'loc-1',
          environment: 'SANDBOX' as const,
        },
      });
    });

    expect(mockApi.post).toHaveBeenCalledWith('/pos/connect', {
      venueId: 'venue-1',
      provider: 'TOAST',
      credentials: {
        apiKey: 'test-key',
        locationId: 'loc-1',
        environment: 'SANDBOX',
      },
    });

    // Should persist to AsyncStorage
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.POS_INTEGRATION);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!).venueId).toBe('venue-1');
  });

  // -------------------------------------------------------
  // 5. connectPOS sets ERROR status on failure
  // -------------------------------------------------------
  it('should set integration status to ERROR when connectPOS fails', async () => {
    (mockApi.post as jest.Mock).mockRejectedValueOnce(new Error('connection refused'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => usePOS(), { wrapper });

    try {
      await act(async () => {
        await result.current.connectPOS.mutateAsync({
          venueId: 'venue-1',
          provider: 'TOAST',
          credentials: {
            apiKey: 'bad-key',
            locationId: 'loc-1',
            environment: 'SANDBOX' as const,
          },
        });
      });
    } catch {
      // expected
    }

    await waitFor(() => {
      expect(result.current.hasError).toBe(true);
    });
  });

  // -------------------------------------------------------
  // 6. validateCredentials mutation calls correct endpoint
  // -------------------------------------------------------
  it('should validate credentials via API', async () => {
    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: { valid: true } });

    const wrapper = createWrapper();
    const { result } = renderHook(() => usePOS(), { wrapper });

    await act(async () => {
      await result.current.validateCredentials.mutateAsync({
        provider: 'SQUARE',
        credentials: {
          apiKey: 'sq-key',
          locationId: 'sq-loc',
          environment: 'SANDBOX' as const,
        },
      });
    });

    expect(mockApi.post).toHaveBeenCalledWith('/pos/validate', {
      provider: 'SQUARE',
      credentials: {
        apiKey: 'sq-key',
        locationId: 'sq-loc',
        environment: 'SANDBOX',
      },
    });
  });

  // -------------------------------------------------------
  // 7. disconnectPOS clears state and storage
  // -------------------------------------------------------
  it('should disconnect POS and clear state and storage', async () => {
    // Pre-populate storage and hook state via cached integration
    await AsyncStorage.setItem(
      STORAGE_KEYS.POS_INTEGRATION,
      JSON.stringify(mockIntegration)
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.POS_TRANSACTIONS,
      JSON.stringify([mockTransaction])
    );

    (mockApi.get as jest.Mock).mockRejectedValue(new Error('offline'));
    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: null });

    const wrapper = createWrapper();
    const { result } = renderHook(() => usePOS(), { wrapper });

    // Wait for integration to load from cache
    await waitFor(() => {
      expect(result.current.integration).not.toBeNull();
    });

    await act(async () => {
      await result.current.disconnectPOS.mutateAsync('venue-1');
    });

    expect(mockApi.post).toHaveBeenCalledWith('/pos/disconnect/venue-1');
    expect(result.current.integration).toBeNull();
    expect(result.current.transactions).toEqual([]);

    // Storage should be cleared
    const storedIntegration = await AsyncStorage.getItem(STORAGE_KEYS.POS_INTEGRATION);
    const storedTxns = await AsyncStorage.getItem(STORAGE_KEYS.POS_TRANSACTIONS);
    expect(storedIntegration).toBeNull();
    expect(storedTxns).toBeNull();
  });

  // -------------------------------------------------------
  // 8. disconnectPOS throws when no integration exists
  // -------------------------------------------------------
  it('should throw when disconnecting with no integration', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => usePOS(), { wrapper });

    await expect(
      act(async () => {
        await result.current.disconnectPOS.mutateAsync('venue-1');
      })
    ).rejects.toThrow('No POS integration to disconnect');
  });

  // -------------------------------------------------------
  // 9. getVenueTransactions filters by venueId
  // -------------------------------------------------------
  it('should filter transactions by venue ID', async () => {
    const allTransactions = [mockTransaction, mockTransaction2, mockTransaction3];
    await AsyncStorage.setItem(
      STORAGE_KEYS.POS_TRANSACTIONS,
      JSON.stringify(allTransactions)
    );

    // Make integration query return null (no venueId), and transactions fall back to cache
    (mockApi.get as jest.Mock).mockRejectedValue(new Error('offline'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => usePOS(), { wrapper });

    await waitFor(() => {
      expect(result.current.transactions.length).toBe(3);
    });

    const venue1Txns = result.current.getVenueTransactions('venue-1');
    expect(venue1Txns).toHaveLength(2);
    expect(venue1Txns.every((t: any) => t.venueId === 'venue-1')).toBe(true);

    const venue2Txns = result.current.getVenueTransactions('venue-2');
    expect(venue2Txns).toHaveLength(1);
    expect(venue2Txns[0].id).toBe('txn-2');
  });

  // -------------------------------------------------------
  // 10. getVenueRevenue sums totals for a venue
  // -------------------------------------------------------
  it('should calculate venue revenue by summing transaction totals', async () => {
    const allTransactions = [mockTransaction, mockTransaction2, mockTransaction3];
    await AsyncStorage.setItem(
      STORAGE_KEYS.POS_TRANSACTIONS,
      JSON.stringify(allTransactions)
    );

    (mockApi.get as jest.Mock).mockRejectedValue(new Error('offline'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => usePOS(), { wrapper });

    await waitFor(() => {
      expect(result.current.transactions.length).toBe(3);
    });

    // venue-1 has txn-1 (5000) + txn-3 (7500) = 12500
    expect(result.current.getVenueRevenue('venue-1')).toBe(12500);
    // venue-2 has txn-2 (3000)
    expect(result.current.getVenueRevenue('venue-2')).toBe(3000);
    // unknown venue returns 0
    expect(result.current.getVenueRevenue('venue-999')).toBe(0);
  });

  // -------------------------------------------------------
  // 11. getActiveRules filters active rules
  // -------------------------------------------------------
  it('should return only active spend rules', async () => {
    const rules = [mockSpendRule, mockSpendRuleInactive];
    await AsyncStorage.setItem(
      STORAGE_KEYS.POS_SPEND_RULES,
      JSON.stringify(rules)
    );

    (mockApi.get as jest.Mock).mockRejectedValue(new Error('offline'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => usePOS(), { wrapper });

    await waitFor(() => {
      expect(result.current.spendRules.length).toBe(2);
    });

    const activeRules = result.current.getActiveRules();
    expect(activeRules).toHaveLength(1);
    expect(activeRules[0].id).toBe('rule-1');
    expect(activeRules[0].isActive).toBe(true);
  });

  // -------------------------------------------------------
  // 12. getUserLifetimeSpend calculates per-user per-venue
  // -------------------------------------------------------
  it('should calculate user lifetime spend for a specific venue', async () => {
    const allTransactions = [mockTransaction, mockTransaction2, mockTransaction3];
    await AsyncStorage.setItem(
      STORAGE_KEYS.POS_TRANSACTIONS,
      JSON.stringify(allTransactions)
    );

    (mockApi.get as jest.Mock).mockRejectedValue(new Error('offline'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => usePOS(), { wrapper });

    await waitFor(() => {
      expect(result.current.transactions.length).toBe(3);
    });

    // user-1 at venue-1: txn-1 (5000) + txn-3 (7500) = 12500
    expect(result.current.getUserLifetimeSpend('user-1', 'venue-1')).toBe(12500);
    // user-1 at venue-2: 0 (no transactions)
    expect(result.current.getUserLifetimeSpend('user-1', 'venue-2')).toBe(0);
    // user-2 at venue-2: txn-2 (3000)
    expect(result.current.getUserLifetimeSpend('user-2', 'venue-2')).toBe(3000);
  });

  // -------------------------------------------------------
  // 13. createSpendRule mutation calls API and updates state
  // -------------------------------------------------------
  it('should create a spend rule and update state on success', async () => {
    const newRules = [mockSpendRule, { ...mockSpendRuleInactive, id: 'rule-new' }];
    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: newRules });
    (mockApi.get as jest.Mock).mockRejectedValue(new Error('offline'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => usePOS(), { wrapper });

    let mutationResult: any;
    await act(async () => {
      mutationResult = await result.current.createSpendRule.mutateAsync({
        venueId: 'venue-1',
        threshold: 200,
        tierUnlocked: 'WHALE',
        serverAccessLevel: 'INNER_CIRCLE',
        isLiveOnly: true,
        isActive: false,
      });
    });

    expect(mockApi.post).toHaveBeenCalledWith(
      '/pos/rules/venue-1',
      expect.objectContaining({ venueId: 'venue-1', threshold: 200 })
    );

    // Verify the mutation returned the updated rules from the API
    expect(mutationResult).toHaveLength(2);
  });

  // -------------------------------------------------------
  // 14. deleteSpendRule mutation calls correct endpoint
  // -------------------------------------------------------
  it('should delete a spend rule and update state on success', async () => {
    const remainingRules = [mockSpendRuleInactive];
    (mockApi.delete as jest.Mock).mockResolvedValueOnce({ data: remainingRules });
    (mockApi.get as jest.Mock).mockRejectedValue(new Error('offline'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => usePOS(), { wrapper });

    let mutationResult: any;
    await act(async () => {
      mutationResult = await result.current.deleteSpendRule.mutateAsync({
        venueId: 'venue-1',
        ruleId: 'rule-1',
      });
    });

    expect(mockApi.delete).toHaveBeenCalledWith('/pos/rules/venue-1/rule-1');

    // Verify the mutation returned the remaining rules from the API
    expect(mutationResult).toHaveLength(1);
    expect(mutationResult[0].id).toBe('rule-2');
  });

  // -------------------------------------------------------
  // 15. toggleSpendRule mutation calls toggle endpoint
  // -------------------------------------------------------
  it('should toggle a spend rule via API', async () => {
    const toggledRules = [{ ...mockSpendRule, isActive: false }];
    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: toggledRules });
    (mockApi.get as jest.Mock).mockRejectedValue(new Error('offline'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => usePOS(), { wrapper });

    let mutationResult: any;
    await act(async () => {
      mutationResult = await result.current.toggleSpendRule.mutateAsync({
        venueId: 'venue-1',
        ruleId: 'rule-1',
      });
    });

    expect(mockApi.post).toHaveBeenCalledWith('/pos/rules/venue-1/rule-1/toggle');

    // Verify the mutation returned the toggled rules from the API
    expect(mutationResult[0].isActive).toBe(false);
  });

  // -------------------------------------------------------
  // 16. getStatus mutation fetches and updates integration
  // -------------------------------------------------------
  it('should fetch POS status and update integration state', async () => {
    const updatedIntegration = {
      ...mockIntegration,
      stats: { transactionCount: 42, totalRevenue: 10000, averageTransaction: 238 },
    };
    // When AsyncStorage is empty, no queries call api.get (integration query skips
    // the API call when there is no cached venueId, and spend rules/transactions
    // queries skip when integration is null)
    (mockApi.get as jest.Mock)
      .mockResolvedValueOnce({ data: updatedIntegration }); // getStatus mutation

    const wrapper = createWrapper();
    const { result } = renderHook(() => usePOS(), { wrapper });

    await act(async () => {
      const statusResult = await result.current.getStatus.mutateAsync('venue-1');
      expect(statusResult.stats?.transactionCount).toBe(42);
    });

    expect(mockApi.get).toHaveBeenCalledWith('/pos/status/venue-1');

    // Should persist updated integration
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.POS_INTEGRATION);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!).stats.transactionCount).toBe(42);
  });

  // -------------------------------------------------------
  // 17. Status flags reflect integration status
  // -------------------------------------------------------
  it('should set isConnecting when integration status is VALIDATING', async () => {
    const validatingIntegration = { ...mockIntegration, status: 'VALIDATING' as const };
    await AsyncStorage.setItem(
      STORAGE_KEYS.POS_INTEGRATION,
      JSON.stringify(validatingIntegration)
    );

    (mockApi.get as jest.Mock).mockRejectedValue(new Error('offline'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => usePOS(), { wrapper });

    await waitFor(() => {
      expect(result.current.isConnecting).toBe(true);
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.hasError).toBe(false);
  });

  // -------------------------------------------------------
  // 18. getRevenue mutation calls correct endpoint
  // -------------------------------------------------------
  it('should fetch revenue stats via API', async () => {
    const revenueStats = {
      period: 'month' as const,
      totalRevenue: 50000,
      totalTransactions: 150,
      averageTransaction: 333,
    };
    // When AsyncStorage is empty, no queries call api.get (integration query skips
    // the API call when there is no cached venueId, and spend rules/transactions
    // queries skip when integration is null)
    (mockApi.get as jest.Mock)
      .mockResolvedValueOnce({ data: revenueStats }); // getRevenue mutation

    const wrapper = createWrapper();
    const { result } = renderHook(() => usePOS(), { wrapper });

    let revenueResult: any;
    await act(async () => {
      revenueResult = await result.current.getRevenue.mutateAsync({
        venueId: 'venue-1',
        period: 'month',
      });
    });

    expect(mockApi.get).toHaveBeenCalledWith('/pos/revenue/venue-1?period=month');
    expect(revenueResult.totalRevenue).toBe(50000);
    expect(revenueResult.totalTransactions).toBe(150);
  });

  // -------------------------------------------------------
  // 19. updateSpendRule mutation calls patch endpoint
  // -------------------------------------------------------
  it('should update a spend rule via PATCH and update state', async () => {
    const updatedRules = [{ ...mockSpendRule, threshold: 100 }];
    (mockApi.patch as jest.Mock).mockResolvedValueOnce({ data: updatedRules });
    (mockApi.get as jest.Mock).mockRejectedValue(new Error('offline'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => usePOS(), { wrapper });

    const ruleToUpdate = { ...mockSpendRule, threshold: 100 };
    let mutationResult: any;
    await act(async () => {
      mutationResult = await result.current.updateSpendRule.mutateAsync(ruleToUpdate);
    });

    expect(mockApi.patch).toHaveBeenCalledWith(
      '/pos/rules/venue-1/rule-1',
      expect.objectContaining({ threshold: 100 })
    );

    // Verify the mutation returned the updated rules from the API
    expect(mutationResult[0].threshold).toBe(100);
  });

  // -------------------------------------------------------
  // 20. syncTransactions throws when not connected
  // -------------------------------------------------------
  it('should throw when syncing transactions with no integration', async () => {
    (mockApi.get as jest.Mock).mockRejectedValue(new Error('offline'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => usePOS(), { wrapper });

    await expect(
      act(async () => {
        await result.current.syncTransactions.mutateAsync({
          venueId: 'venue-1',
        });
      })
    ).rejects.toThrow('No POS integration connected');
  });
});
