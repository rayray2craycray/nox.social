import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  POSIntegration,
  POSCredentials,
  POSLocation,
  POSProviderType,
  SpendRule,
  POSTransaction,
  SyncResult,
  RevenueStats,
} from '@/types';
// Mock data imports removed - context now works with real API only
// import { mockPOSIntegration, mockPOSLocations, mockSpendRules } from '@/mocks/pos';
import { POS_CONFIG } from '@/constants/app';
import { api } from '@/services/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

const STORAGE_KEYS = {
  POS_INTEGRATION: 'vibelink_pos_integration',
  POS_SPEND_RULES: 'vibelink_pos_spend_rules',
  POS_TRANSACTIONS: 'vibelink_pos_transactions',
};

export const [POSProvider, usePOS] = createContextHook(() => {
  const [integration, setIntegration] = useState<POSIntegration | null>(null);
  const [spendRules, setSpendRules] = useState<SpendRule[]>([]);
  const [transactions, setTransactions] = useState<POSTransaction[]>([]);
  const [availableLocations, setAvailableLocations] = useState<POSLocation[]>([]);

  // Load integration from AsyncStorage
  const integrationQuery = useQuery({
    queryKey: ['pos-integration'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.POS_INTEGRATION);
      if (stored) {
        return JSON.parse(stored) as POSIntegration;
      }
      // No mock data - start with null state
      return null;
    },
  });

  // Load spend rules from AsyncStorage
  const spendRulesQuery = useQuery({
    queryKey: ['pos-spend-rules'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.POS_SPEND_RULES);
      if (stored) {
        return JSON.parse(stored) as SpendRule[];
      }
      // No mock data - start with empty array
      return [];
    },
  });

  // Load transactions from AsyncStorage
  const transactionsQuery = useQuery({
    queryKey: ['pos-transactions'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.POS_TRANSACTIONS);
      if (stored) {
        return JSON.parse(stored) as POSTransaction[];
      }
      return [];
    },
  });

  // Update state when queries complete
  useEffect(() => {
    if (integrationQuery.data !== undefined) {
      setIntegration(integrationQuery.data);
    }
  }, [integrationQuery.data]);

  useEffect(() => {
    if (spendRulesQuery.data) {
      setSpendRules(spendRulesQuery.data);
    }
  }, [spendRulesQuery.data]);

  useEffect(() => {
    if (transactionsQuery.data) {
      setTransactions(transactionsQuery.data);
    }
  }, [transactionsQuery.data]);

  /**
   * Connect POS system with API key
   * Replaces OAuth flow with simpler API key-based authentication
   */
  const connectPOS = useMutation({
    mutationFn: async ({
      venueId,
      provider,
      credentials,
    }: {
      venueId: string;
      provider: POSProviderType;
      credentials: POSCredentials;
    }) => {
      // Update UI to show connecting state
      const connectingIntegration: POSIntegration = {
        id: 'temp-' + Date.now(),
        venueId,
        provider,
        status: 'VALIDATING',
        metadata: {},
        syncConfig: {
          enabled: false,
          interval: 300000, // 5 minutes
        },
      };
      setIntegration(connectingIntegration);

      // Call backend API to validate and store credentials
      const response = await api.post<ApiResponse<POSIntegration>>('/pos/connect', {
        venueId,
        provider,
        credentials,
      });

      const connectedIntegration = response.data as POSIntegration;

      // Store integration locally
      await AsyncStorage.setItem(
        STORAGE_KEYS.POS_INTEGRATION,
        JSON.stringify(connectedIntegration)
      );

      return connectedIntegration;
    },
    onSuccess: (data) => {
      setIntegration(data);
    },
    onError: (error: any) => {
      console.error('[POS] Connection failed:', error);
      setIntegration(prev => prev ? { ...prev, status: 'ERROR' } : null);
    },
  });

  /**
   * Validate POS credentials before connecting
   * Allows users to test credentials before saving
   */
  const validateCredentials = useMutation({
    mutationFn: async ({
      provider,
      credentials,
    }: {
      provider: POSProviderType;
      credentials: POSCredentials;
    }) => {
      // Call backend validation endpoint
      const response = await api.post<ApiResponse<unknown>>('/pos/validate', {
        provider,
        credentials,
      });

      return response.data;
    },
  });

  /**
   * Disconnect POS system
   * Removes credentials from backend and local storage
   */
  const disconnectPOS = useMutation({
    mutationFn: async (venueId: string) => {
      if (!integration) {
        throw new Error('No POS integration to disconnect');
      }

      // Call backend to delete integration
      await api.post(`/pos/disconnect/${venueId}`);

      // Clear local storage
      await AsyncStorage.removeItem(STORAGE_KEYS.POS_INTEGRATION);
      await AsyncStorage.removeItem(STORAGE_KEYS.POS_TRANSACTIONS);

      return null;
    },
    onSuccess: () => {
      setIntegration(null);
      setTransactions([]);
      setAvailableLocations([]);
    },
  });

  /**
   * Sync transactions from POS system
   * Fetches new transactions and processes spend rules
   */
  const syncTransactions = useMutation({
    mutationFn: async ({
      venueId,
      fromDate,
      toDate,
    }: {
      venueId: string;
      fromDate?: string;
      toDate?: string;
    }) => {
      if (!integration) {
        throw new Error('No POS integration connected');
      }

      // Call backend sync endpoint
      const response = await api.post<ApiResponse<SyncResult>>(`/pos/sync/${venueId}`, {
        fromDate,
        toDate,
      });

      const syncResult = response.data as SyncResult;

      // Refresh transactions
      transactionsQuery.refetch();

      return syncResult;
    },
  });

  /**
   * Get POS status and statistics
   */
  const getStatus = useMutation({
    mutationFn: async (venueId: string) => {
      // Fetch latest status from backend
      const response = await api.get<ApiResponse<POSIntegration>>(`/pos/status/${venueId}`);
      const updatedIntegration = response.data as POSIntegration;

      // Update local storage
      await AsyncStorage.setItem(
        STORAGE_KEYS.POS_INTEGRATION,
        JSON.stringify(updatedIntegration)
      );

      return updatedIntegration;
    },
    onSuccess: (data) => {
      if (data) {
        setIntegration(data);
      }
    },
  });

  /**
   * Create a new spend rule
   */
  const createSpendRule = useMutation({
    mutationFn: async (rule: Omit<SpendRule, 'id'>) => {
      // Call backend API
      const response = await api.post<ApiResponse<SpendRule[]>>(`/pos/rules/${rule.venueId}`, rule);
      return response.data as SpendRule[];
    },
    onSuccess: (data) => {
      setSpendRules(data);
    },
  });

  /**
   * Update existing spend rule
   */
  const updateSpendRule = useMutation({
    mutationFn: async (rule: SpendRule) => {
      // Call backend API
      const response = await api.patch<ApiResponse<SpendRule[]>>(`/pos/rules/${rule.venueId}/${rule.id}`, rule);
      return response.data as SpendRule[];
    },
    onSuccess: (data) => {
      setSpendRules(data);
    },
  });

  /**
   * Delete spend rule
   */
  const deleteSpendRule = useMutation({
    mutationFn: async ({ venueId, ruleId }: { venueId: string; ruleId: string }) => {
      // Call backend API
      const response = await api.delete<ApiResponse<SpendRule[]>>(`/pos/rules/${venueId}/${ruleId}`);
      return response.data as SpendRule[];
    },
    onSuccess: (data) => {
      setSpendRules(data);
    },
  });

  /**
   * Toggle spend rule on/off
   */
  const toggleSpendRule = useMutation({
    mutationFn: async ({ venueId, ruleId }: { venueId: string; ruleId: string }) => {
      // Call backend API
      const response = await api.post<ApiResponse<SpendRule[]>>(`/pos/rules/${venueId}/${ruleId}/toggle`);
      return response.data as SpendRule[];
    },
    onSuccess: (data) => {
      setSpendRules(data);
    },
  });

  /**
   * Get revenue statistics for a venue
   */
  const getRevenue = useMutation({
    mutationFn: async ({
      venueId,
      period,
    }: {
      venueId: string;
      period: 'day' | 'week' | 'month' | 'year' | 'all';
    }) => {
      // Call backend API
      const response = await api.get<ApiResponse<RevenueStats>>(`/pos/revenue/${venueId}?period=${period}`);

      return response.data as RevenueStats;
    },
  });

  // Helper methods
  const getVenueTransactions = useCallback(
    (venueId: string) => {
      return transactions.filter(t => t.venueId === venueId);
    },
    [transactions]
  );

  const getVenueRevenue = useCallback(
    (venueId: string) => {
      return transactions
        .filter(t => t.venueId === venueId)
        .reduce((sum, t) => sum + t.amount.total, 0);
    },
    [transactions]
  );

  const getActiveRules = useCallback(() => {
    return spendRules.filter(r => r.isActive);
  }, [spendRules]);

  const getUserLifetimeSpend = useCallback(
    (userId: string, venueId: string) => {
      return transactions
        .filter(t => t.userId === userId && t.venueId === venueId)
        .reduce((sum, t) => sum + t.amount.total, 0);
    },
    [transactions]
  );

  // Status helpers
  const isConnected = integration?.status === 'CONNECTED';
  const isConnecting = integration?.status === 'CONNECTING' || integration?.status === 'VALIDATING';
  const hasError = integration?.status === 'ERROR';

  return {
    // State
    integration,
    spendRules,
    transactions,
    availableLocations,

    // Status flags
    isConnected,
    isConnecting,
    hasError,
    isLoading: integrationQuery.isLoading || spendRulesQuery.isLoading,

    // Connection methods
    connectPOS,
    validateCredentials,
    disconnectPOS,
    getStatus,

    // Transaction methods
    syncTransactions,
    getRevenue,
    getVenueTransactions,
    getVenueRevenue,
    getUserLifetimeSpend,

    // Spend rule methods
    createSpendRule,
    updateSpendRule,
    deleteSpendRule,
    toggleSpendRule,
    getActiveRules,
  };
});
