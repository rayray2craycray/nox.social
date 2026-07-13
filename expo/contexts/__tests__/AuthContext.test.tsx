import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock dependencies
// In-memory SecureStore mock. AuthContext reads tokens via utils/secureStorage
// since the May migration; tests seed legacy AsyncStorage keys and the
// context's migrateLegacyTokens() moves them into this store on init —
// which exercises the real migration path.
const secureStore: Record<string, string> = {};
jest.mock('@/utils/secureStorage', () => ({
  setSecureItem: jest.fn(async (k: string, v: string) => { secureStore[k] = v; }),
  getSecureItem: jest.fn(async (k: string) => secureStore[k] ?? null),
  deleteSecureItem: jest.fn(async (k: string) => { delete secureStore[k]; }),
  SECURE_KEYS: {
    AUTH_TOKEN: 'vibelink_auth_token',
    REFRESH_TOKEN: 'vibelink_refresh_token',
    USER_PASSWORD: 'vibelink_user_password',
    TOAST_ACCESS_TOKEN: 'vibelink_toast_access_token',
    TOAST_REFRESH_TOKEN: 'vibelink_toast_refresh_token',
    INSTAGRAM_TOKEN: 'vibelink_instagram_token',
    USER_CREDENTIALS: 'vibelink_credentials',
    LINKED_CARDS: 'vibelink_linked_cards',
  },
}));

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));

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
}));

// Suppress AuthContext console logging
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  (console.log as jest.Mock).mockRestore();
  (console.warn as jest.Mock).mockRestore();
  (console.error as jest.Mock).mockRestore();
});

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    Object.keys(secureStore).forEach((k) => delete secureStore[k]);
    jest.clearAllMocks();
    AsyncStorage.clear();
    mockFetch.mockReset();
  });

  it('should start with loading state and not authenticated', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should restore auth state from AsyncStorage when token is valid', async () => {
    const futureExpiry = (Date.now() + 3600 * 1000).toString();
    const userData = JSON.stringify({
      id: 'user-1',
      email: 'test@test.com',
      displayName: 'Test User',
      createdAt: '2024-01-01',
    });

    await AsyncStorage.setItem('vibelink_access_token', 'valid-token');
    await AsyncStorage.setItem('vibelink_token_expiry', futureExpiry);
    await AsyncStorage.setItem('vibelink_user_data', userData);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('test@test.com');
    expect(result.current.accessToken).toBe('valid-token');
  });

  it('should map MongoDB _id to id when restoring user from storage', async () => {
    const futureExpiry = (Date.now() + 3600 * 1000).toString();
    const userData = JSON.stringify({
      _id: 'mongo-id-123',
      email: 'test@test.com',
      displayName: 'Mongo User',
      createdAt: '2024-01-01',
    });

    await AsyncStorage.setItem('vibelink_access_token', 'valid-token');
    await AsyncStorage.setItem('vibelink_token_expiry', futureExpiry);
    await AsyncStorage.setItem('vibelink_user_data', userData);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user?.id).toBe('mongo-id-123');
    expect(result.current.userId).toBe('mongo-id-123');
  });

  it('should attempt token refresh when stored token is expired', async () => {
    const pastExpiry = (Date.now() - 1000).toString();
    const userData = JSON.stringify({
      id: 'user-1',
      email: 'test@test.com',
      displayName: 'Test',
      createdAt: '2024-01-01',
    });

    await AsyncStorage.setItem('vibelink_access_token', 'expired-token');
    await AsyncStorage.setItem('vibelink_token_expiry', pastExpiry);
    await AsyncStorage.setItem('vibelink_user_data', userData);
    await AsyncStorage.setItem('vibelink_refresh_token', 'refresh-token-123');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600,
        },
      }),
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have called the refresh endpoint
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/refresh'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('should sign in successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          user: { id: 'user-1', email: 'test@test.com', displayName: 'Test', createdAt: '2024-01-01' },
          accessToken: 'new-token',
          refreshToken: 'new-refresh',
          expiresIn: 3600,
        },
      }),
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.signIn({ email: 'test@test.com', password: 'password123' });
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    expect(result.current.user?.email).toBe('test@test.com');
    expect(result.current.accessToken).toBe('new-token');
  });

  it('should handle sign in failure with alert', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        message: 'Invalid credentials',
      }),
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.signIn({ email: 'bad@test.com', password: 'wrong' });
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Sign In Failed', expect.any(String));
    });

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should sign up successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          user: { id: 'new-user', email: 'new@test.com', displayName: 'New User', createdAt: '2024-01-01' },
          accessToken: 'signup-token',
          refreshToken: 'signup-refresh',
          expiresIn: 3600,
        },
      }),
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.signUp({
        email: 'new@test.com',
        password: 'password123',
        displayName: 'New User',
      });
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    expect(result.current.user?.displayName).toBe('New User');
  });

  it('should route VENUE-role signups to business registration', async () => {
    await AsyncStorage.setItem('nox_pending_signup_role', 'VENUE');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          user: { id: 'venue-user', email: 'venue@test.com', displayName: 'Venue Owner', createdAt: '2024-01-01' },
          accessToken: 'signup-token',
          refreshToken: 'signup-refresh',
          expiresIn: 3600,
        },
      }),
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      result.current.signUp({
        email: 'venue@test.com',
        password: 'password123',
        displayName: 'Venue Owner',
      });
    });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    const { router } = require('expo-router');
    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/business/register');
    });
    // one-shot key consumed
    expect(await AsyncStorage.getItem('nox_pending_signup_role')).toBeNull();
  });

  it('should sign out and clear all stored data', async () => {
    // First set up authenticated state
    const futureExpiry = (Date.now() + 3600 * 1000).toString();
    await AsyncStorage.setItem('vibelink_access_token', 'token');
    await AsyncStorage.setItem('vibelink_token_expiry', futureExpiry);
    await AsyncStorage.setItem('vibelink_user_data', JSON.stringify({
      id: 'user-1', email: 'test@test.com', displayName: 'Test', createdAt: '2024-01-01',
    }));

    // Mock signout API call
    mockFetch.mockResolvedValueOnce({ ok: true });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();

    // Verify AsyncStorage was cleared
    const token = await AsyncStorage.getItem('vibelink_access_token');
    expect(token).toBeNull();
  });

  it('should return correct auth header', async () => {
    const futureExpiry = (Date.now() + 3600 * 1000).toString();
    await AsyncStorage.setItem('vibelink_access_token', 'my-token');
    await AsyncStorage.setItem('vibelink_token_expiry', futureExpiry);
    await AsyncStorage.setItem('vibelink_user_data', JSON.stringify({
      id: 'user-1', email: 'test@test.com', displayName: 'Test', createdAt: '2024-01-01',
    }));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    expect(result.current.getAuthHeader()).toBe('Bearer my-token');
  });

  it('should return empty auth header when not authenticated', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.getAuthHeader()).toBe('');
  });
});
