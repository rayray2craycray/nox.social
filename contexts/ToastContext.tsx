import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import {
  ToastIntegration,
  ToastLocation,
  ToastSpendRule,
  ToastTransactionData,
} from '@/types';
import { api } from '@/services/api';

// IMPORTANT: Do NOT call WebBrowser.maybeCompleteAuthSession() at module scope.
// Native module methods called during import trigger TurboModule void-method ObjC
// exceptions on iOS New Arch, causing EXC_CRASH (SIGABRT) at startup.
// This was the root cause of the Build 76 crash.

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

// Toast OAuth configuration — redirectUri is computed lazily to avoid native module
// calls at import time (AuthSession.makeRedirectUri is a native call).
const TOAST_OAUTH_CONFIG = {
  clientId: process.env.EXPO_PUBLIC_TOAST_CLIENT_ID || '',
  authorizationEndpoint: 'https://ws-api.toasttab.com/usermgmt/v1/oauth/authorize',
  scopes: ['orders.read', 'menu.read'],
  getRedirectUri: () => AuthSession.makeRedirectUri({
    scheme: 'nox',
    path: 'toast-callback',
  }),
};

interface ToastTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  restaurantExternalId?: string;
  locations?: ToastLocation[];
}

const STORAGE_KEYS = {
  TOAST_INTEGRATION: 'vibelink_toast_integration',
  TOAST_SPEND_RULES: 'vibelink_toast_spend_rules',
  TOAST_TRANSACTIONS: 'vibelink_toast_transactions',
  TOAST_TOKEN_EXPIRES: 'vibelink_toast_token_expires',
};

export const [ToastProvider, useToast] = createContextHook(() => {
  const [integration, setIntegration] = useState<ToastIntegration>(defaultToastIntegration);
  const [spendRules, setSpendRules] = useState<ToastSpendRule[]>([]);
  const [transactions, setTransactions] = useState<ToastTransactionData[]>([]);
  const [availableLocations, setAvailableLocations] = useState<ToastLocation[]>([]);

  const integrationQuery = useQuery({
    queryKey: ['toast-integration'],
    queryFn: async () => {
      try {
        const response = await api.get<any>('/pos/toast/status');
        if (response?.data) {
          await AsyncStorage.setItem(STORAGE_KEYS.TOAST_INTEGRATION, JSON.stringify(response.data));
          return response.data as ToastIntegration;
        }
      } catch (error) {
        if (__DEV__) console.log('[Toast] API unavailable, using cache');
      }
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.TOAST_INTEGRATION);
      if (stored) return JSON.parse(stored) as ToastIntegration;
      return defaultToastIntegration;
    },
  });

  const spendRulesQuery = useQuery({
    queryKey: ['toast-spend-rules'],
    queryFn: async () => {
      try {
        const venueId = integration?.venueId;
        if (venueId) {
          const response = await api.get<any>(`/pos/rules/${venueId}`);
          if (response?.data) {
            await AsyncStorage.setItem(STORAGE_KEYS.TOAST_SPEND_RULES, JSON.stringify(response.data));
            return response.data as ToastSpendRule[];
          }
        }
      } catch (error) {
        if (__DEV__) console.log('[Toast] API unavailable for spend rules, using cache');
      }
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.TOAST_SPEND_RULES);
      if (stored) return JSON.parse(stored) as ToastSpendRule[];
      return [];
    },
  });

  const transactionsQuery = useQuery({
    queryKey: ['toast-transactions'],
    queryFn: async () => {
      try {
        const venueId = integration?.venueId;
        if (venueId) {
          const response = await api.get<any>(`/pos/transactions/${venueId}`);
          if (response?.data) {
            await AsyncStorage.setItem(STORAGE_KEYS.TOAST_TRANSACTIONS, JSON.stringify(response.data));
            return response.data as ToastTransactionData[];
          }
        }
      } catch (error) {
        if (__DEV__) console.log('[Toast] API unavailable for transactions, using cache');
      }
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.TOAST_TRANSACTIONS);
      if (stored) return JSON.parse(stored) as ToastTransactionData[];
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

      // Complete any pending auth session (deferred from module scope to avoid
      // TurboModule crash — see Build 76 crash notes)
      WebBrowser.maybeCompleteAuthSession();

      if (!TOAST_OAUTH_CONFIG.clientId) {
        console.error('[Toast] OAuth client ID not configured');
        throw new Error('Toast POS integration is not configured. Please contact support.');
      }

      // Step 1: Build OAuth authorization URL
      const scopeString = TOAST_OAUTH_CONFIG.scopes.join('+');
      const authUrl =
        `${TOAST_OAUTH_CONFIG.authorizationEndpoint}` +
        `?response_type=code` +
        `&client_id=${encodeURIComponent(TOAST_OAUTH_CONFIG.clientId)}` +
        `&redirect_uri=${encodeURIComponent(TOAST_OAUTH_CONFIG.getRedirectUri())}` +
        `&scope=${scopeString}`;

      // Step 2: Open browser for OAuth authorization
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        TOAST_OAUTH_CONFIG.getRedirectUri()
      );

      if (result.type !== 'success' || !result.url) {
        // User cancelled or flow was dismissed
        throw new Error('Toast POS authorization was cancelled.');
      }

      // Step 3: Extract authorization code from redirect URL
      const callbackUrl = new URL(result.url);
      const code = callbackUrl.searchParams.get('code');
      const error = callbackUrl.searchParams.get('error');

      if (error) {
        const errorDescription = callbackUrl.searchParams.get('error_description') || error;
        console.error('[Toast] OAuth error:', errorDescription);
        throw new Error(`Toast authorization failed: ${errorDescription}`);
      }

      if (!code) {
        console.error('[Toast] No authorization code received');
        throw new Error('No authorization code received from Toast.');
      }

      // Step 4: Exchange authorization code for tokens via backend
      const tokenData = await api.post<ToastTokenResponse>('/pos/connect', {
        code,
        redirectUri: TOAST_OAUTH_CONFIG.getRedirectUri(),
        provider: 'toast',
      });

      if (!tokenData.accessToken) {
        console.error('[Toast] No access token in backend response');
        throw new Error('Failed to obtain access token from Toast.');
      }

      // Step 5: Store tokens securely using expo-secure-store
      await setSecureItem(SECURE_KEYS.TOAST_ACCESS_TOKEN, tokenData.accessToken);
      await setSecureItem(SECURE_KEYS.TOAST_REFRESH_TOKEN, tokenData.refreshToken);

      // Store token expiry in AsyncStorage (not sensitive)
      if (tokenData.expiresIn) {
        const expiresAt = new Date(Date.now() + tokenData.expiresIn * 1000);
        await AsyncStorage.setItem(STORAGE_KEYS.TOAST_TOKEN_EXPIRES, expiresAt.toISOString());
      }

      // Step 6: Build connected integration metadata (no tokens stored here)
      const connectedIntegration: ToastIntegration = {
        ...updatedIntegration,
        status: 'CONNECTED',
        accessToken: undefined, // Tokens stored in SecureStore, not in state
        refreshToken: undefined,
        connectedAt: new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
        webhooksEnabled: true,
        metadata: {
          ...updatedIntegration.metadata,
          restaurantExternalId: tokenData.restaurantExternalId,
        },
      };

      // Step 7: Persist integration metadata in AsyncStorage
      await AsyncStorage.setItem(
        STORAGE_KEYS.TOAST_INTEGRATION,
        JSON.stringify(connectedIntegration)
      );

      // Step 8: Set available locations if returned from backend
      if (tokenData.locations && tokenData.locations.length > 0) {
        setAvailableLocations(tokenData.locations);
      }

      return connectedIntegration;
    },
    onSuccess: (data) => {
      setIntegration(data);
    },
    onError: (error) => {
      console.error('[Toast] Connection failed:', error);
      setIntegration(prev => ({ ...prev, status: 'ERROR' }));
    },
  });

  const disconnectToast = useMutation({
    mutationFn: async () => {
      // Delete securely stored tokens
      await deleteSecureItem(SECURE_KEYS.TOAST_ACCESS_TOKEN);
      await deleteSecureItem(SECURE_KEYS.TOAST_REFRESH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.TOAST_TOKEN_EXPIRES);

      const disconnectedIntegration: ToastIntegration = {
        ...integration,
        status: 'DISCONNECTED',
        accessToken: undefined,
        refreshToken: undefined,
        selectedLocations: [],
        connectedAt: undefined,
        lastSyncAt: undefined,
        webhooksEnabled: false,
        metadata: {},
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
      const venueId = integration?.venueId;
      if (!venueId) throw new Error('No venue connected');
      const response = await api.post<any>(`/pos/rules/${venueId}`, rule);
      return response.data as ToastSpendRule[];
    },
    onSuccess: (data) => {
      if (Array.isArray(data)) {
        setSpendRules(data);
      }
    },
  });

  const updateSpendRule = useMutation({
    mutationFn: async (rule: ToastSpendRule) => {
      const venueId = integration?.venueId;
      if (!venueId) throw new Error('No venue connected');
      const response = await api.patch<any>(`/pos/rules/${venueId}/${rule.id}`, rule);
      return response.data as ToastSpendRule[];
    },
    onSuccess: (data) => {
      if (Array.isArray(data)) {
        setSpendRules(data);
      }
    },
  });

  const deleteSpendRule = useMutation({
    mutationFn: async (ruleId: string) => {
      const venueId = integration?.venueId;
      if (!venueId) throw new Error('No venue connected');
      const response = await api.delete<any>(`/pos/rules/${venueId}/${ruleId}`);
      return response.data as ToastSpendRule[];
    },
    onSuccess: (data) => {
      if (Array.isArray(data)) {
        setSpendRules(data);
      }
    },
  });

  const processTransaction = useCallback(
    async (transaction: ToastTransactionData) => {
      try {
        const response = await api.post<any>('/pos/transactions/process', transaction);
        // Refresh transactions from API
        transactionsQuery.refetch();
        return response.data || { success: true, ruleTriggered: null };
      } catch (error) {
        if (__DEV__) console.log('[Toast] Transaction processing failed:', error);
        // Still store locally as fallback
        const updatedTransactions = [...transactions, transaction];
        await AsyncStorage.setItem(STORAGE_KEYS.TOAST_TRANSACTIONS, JSON.stringify(updatedTransactions));
        setTransactions(updatedTransactions);
        return { success: false, ruleTriggered: null };
      }
    },
    [transactions, transactionsQuery]
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
