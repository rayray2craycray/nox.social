import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ToastIntegration,
  ToastLocation,
  ToastSpendRule,
  ToastTransactionData,
} from '@/types';
import { TOAST_POS } from '@/constants/app';

// TODO: Implement Toast POS API integration
// For now, use default disconnected state

const defaultToastIntegration: ToastIntegration = {
  id: '',
  venueId: '',
  status: 'DISCONNECTED',
  metadata: {},
  syncConfig: {
    enabled: false,
    interval: 300000,
  },
  selectedLocations: [],
  webhooksEnabled: false,
};
import { getSecureItem, setSecureItem, deleteSecureItem, SECURE_KEYS } from '@/utils/secureStorage';

const STORAGE_KEYS = {
  TOAST_INTEGRATION: 'vibelink_toast_integration',
  TOAST_SPEND_RULES: 'vibelink_toast_spend_rules',
  TOAST_TRANSACTIONS: 'vibelink_toast_transactions',
};

export const [ToastProvider, useToast] = createContextHook(() => {
  const [integration, setIntegration] = useState<ToastIntegration>(defaultToastIntegration);
  const [spendRules, setSpendRules] = useState<ToastSpendRule[]>([]);
  const [transactions, setTransactions] = useState<ToastTransactionData[]>([]);
  const [availableLocations, setAvailableLocations] = useState<ToastLocation[]>([]);

  const integrationQuery = useQuery({
    queryKey: ['toast-integration'],
    queryFn: async () => {
      // TODO: Fetch Toast POS integration status from API
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.TOAST_INTEGRATION);
      if (stored) {
        return JSON.parse(stored) as ToastIntegration;
      }
      return defaultToastIntegration;
    },
  });

  const spendRulesQuery = useQuery({
    queryKey: ['toast-spend-rules'],
    queryFn: async () => {
      // TODO: Fetch Toast POS spend rules from API
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.TOAST_SPEND_RULES);
      if (stored) {
        return JSON.parse(stored) as ToastSpendRule[];
      }
      return [];
    },
  });

  const transactionsQuery = useQuery({
    queryKey: ['toast-transactions'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.TOAST_TRANSACTIONS);
      if (stored) {
        return JSON.parse(stored) as ToastTransactionData[];
      }
      return [];
    },
  });

  useEffect(() => {
    if (integrationQuery.data) {
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

  const connectToast = useMutation({
    mutationFn: async () => {
      const updatedIntegration: ToastIntegration = {
        ...integration,
        status: 'CONNECTING',
      };
      setIntegration(updatedIntegration);

      // TODO: Implement real Toast POS OAuth flow
      // 1. Open WebBrowser to Toast OAuth endpoint with client_id from env
      // 2. Handle redirect callback with authorization code
      // 3. Exchange code for access_token and refresh_token
      // 4. Store tokens securely using SecureStore:
      //    await setSecureItem(SECURE_KEYS.TOAST_ACCESS_TOKEN, accessToken);
      //    await setSecureItem(SECURE_KEYS.TOAST_REFRESH_TOKEN, refreshToken);
      // 5. Store integration metadata (without tokens) in AsyncStorage
      // Reference: https://doc.toasttab.com/doc/devguide/apiAuthentication.html

      // DEVELOPMENT ONLY: Simulating OAuth flow with mock data
      // This should be removed when implementing real OAuth
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, TOAST_POS.MOCK_CONNECTION_DELAY_MS));

        const connectedIntegration: ToastIntegration = {
          ...updatedIntegration,
          status: 'CONNECTED',
          accessToken: undefined, // In dev mode, no real token needed
          refreshToken: undefined, // In dev mode, no real token needed
          connectedAt: new Date().toISOString(),
          lastSyncAt: new Date().toISOString(),
          webhooksEnabled: true,
        };

        await AsyncStorage.setItem(
          STORAGE_KEYS.TOAST_INTEGRATION,
          JSON.stringify(connectedIntegration)
        );

        // TODO: Fetch available locations from Toast POS API
        setAvailableLocations([]);
        return connectedIntegration;
      }

      // Production OAuth flow would go here
      throw new Error('Toast OAuth not implemented for production');
    },
    onSuccess: (data) => {
      setIntegration(data);
    },
    onError: (error) => {
      // TODO: Send to error tracking service (Sentry/Bugsnag)
      console.error('[Toast] Connection failed:', error);
      setIntegration(prev => ({ ...prev, status: 'ERROR' }));
    },
  });

  const disconnectToast = useMutation({
    mutationFn: async () => {
      // TODO: When real OAuth is implemented, delete secure tokens:
      // await deleteSecureItem(SECURE_KEYS.TOAST_ACCESS_TOKEN);
      // await deleteSecureItem(SECURE_KEYS.TOAST_REFRESH_TOKEN);

      const disconnectedIntegration: ToastIntegration = {
        ...integration,
        status: 'DISCONNECTED',
        accessToken: undefined,
        refreshToken: undefined,
        selectedLocations: [],
        connectedAt: undefined,
        lastSyncAt: undefined,
        webhooksEnabled: false,
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.TOAST_INTEGRATION,
        JSON.stringify(disconnectedIntegration)
      );

      setAvailableLocations([]);
      return disconnectedIntegration;
    },
    onSuccess: (data) => {
      setIntegration(data);
    },
  });

  const selectLocations = useMutation({
    mutationFn: async (locationIds: string[]) => {
      const updatedIntegration: ToastIntegration = {
        ...integration,
        selectedLocations: locationIds,
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.TOAST_INTEGRATION,
        JSON.stringify(updatedIntegration)
      );

      return updatedIntegration;
    },
    onSuccess: (data) => {
      setIntegration(data);
    },
  });

  const createSpendRule = useMutation({
    mutationFn: async (rule: Omit<ToastSpendRule, 'id'>) => {
      // TODO: Replace with backend API call to /api/toast/rules/create
      const newRule: ToastSpendRule = {
        ...rule,
        id: 'toast-rule-' + Date.now(),
      };

      const updatedRules = [...spendRules, newRule];
      await AsyncStorage.setItem(
        STORAGE_KEYS.TOAST_SPEND_RULES,
        JSON.stringify(updatedRules)
      );

      return updatedRules;
    },
    onSuccess: (data) => {
      setSpendRules(data);
    },
  });

  const updateSpendRule = useMutation({
    mutationFn: async (rule: ToastSpendRule) => {
      // TODO: Replace with backend API call to /api/toast/rules/update
      const updatedRules = spendRules.map(r => (r.id === rule.id ? rule : r));

      await AsyncStorage.setItem(
        STORAGE_KEYS.TOAST_SPEND_RULES,
        JSON.stringify(updatedRules)
      );

      return updatedRules;
    },
    onSuccess: (data) => {
      setSpendRules(data);
    },
  });

  const deleteSpendRule = useMutation({
    mutationFn: async (ruleId: string) => {
      // TODO: Replace with backend API call to /api/toast/rules/delete
      const updatedRules = spendRules.filter(r => r.id !== ruleId);

      await AsyncStorage.setItem(
        STORAGE_KEYS.TOAST_SPEND_RULES,
        JSON.stringify(updatedRules)
      );

      return updatedRules;
    },
    onSuccess: (data) => {
      setSpendRules(data);
    },
  });

  const processTransaction = useCallback(
    async (transaction: ToastTransactionData) => {
      // TODO: Replace with backend API call to /api/toast/transactions/process
      const updatedTransactions = [...transactions, transaction];
      await AsyncStorage.setItem(
        STORAGE_KEYS.TOAST_TRANSACTIONS,
        JSON.stringify(updatedTransactions)
      );
      setTransactions(updatedTransactions);

      const matchingRules = spendRules
        .filter(rule => rule.isActive && rule.venueId === transaction.venueId)
        .filter(rule => transaction.amount >= rule.threshold);

      if (matchingRules.length > 0) {
        const highestRule = matchingRules.sort((a, b) => b.threshold - a.threshold)[0];

        return {
          success: true,
          ruleTriggered: highestRule,
          notification: `Unlocked ${highestRule.tierUnlocked} tier!`,
        };
      }

      return { success: true, ruleTriggered: null };
    },
    [transactions, spendRules]
  );

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
        .reduce((sum, t) => sum + t.amount, 0);
    },
    [transactions]
  );

  const getActiveRules = useCallback(() => {
    return spendRules.filter(r => r.isActive);
  }, [spendRules]);

  const isConnected = integration.status === 'CONNECTED';
  const isConnecting = integration.status === 'CONNECTING';
  const hasError = integration.status === 'ERROR';

  return {
    integration,
    spendRules,
    transactions,
    availableLocations,
    isConnected,
    isConnecting,
    hasError,
    isLoading: integrationQuery.isLoading || spendRulesQuery.isLoading,
    connectToast,
    disconnectToast,
    selectLocations,
    createSpendRule,
    updateSpendRule,
    deleteSpendRule,
    processTransaction,
    getVenueTransactions,
    getVenueRevenue,
    getActiveRules,
  };
});
