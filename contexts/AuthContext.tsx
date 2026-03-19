import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { apiClient } from '@/services/api';

interface User {
  id: string;
  email: string;
  displayName: string;
  profileImageUrl?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  createdAt: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
}

interface SignUpData {
  email: string;
  password: string;
  displayName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
}

interface SignInData {
  email: string;
  password: string;
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'vibelink_access_token',
  REFRESH_TOKEN: 'vibelink_refresh_token',
  TOKEN_EXPIRY: 'vibelink_token_expiry',
  USER_DATA: 'vibelink_user_data',
};

// Get API URL from environment variable or fall back to localhost
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL
  ? process.env.EXPO_PUBLIC_API_URL.replace('/api', '') // Remove /api suffix if present
  : (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');

console.log('========================================');
console.log('[AuthContext] MODULE LOADED');
console.log('[AuthContext] API_BASE_URL:', API_BASE_URL);
console.log('[AuthContext] EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
console.log('========================================')

export const [AuthProvider, useAuth] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Initialize auth state from AsyncStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Wrap AsyncStorage reads in a 5-second timeout so the app doesn't
        // freeze if the TurboModule Promise never resolves (iOS 26 edge case).
        const storageTimeout = new Promise<null[]>((_, reject) =>
          setTimeout(() => reject(new Error('AsyncStorage timeout')), 5000)
        );
        const [token, expiryStr, userData] = await Promise.race([
          Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
            AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY),
            AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
          ]),
          storageTimeout,
        ]);

        if (token && expiryStr && userData) {
          const expiry = parseInt(expiryStr, 10);
          const now = Date.now();

          if (now < expiry) {
            // Token still valid
            const parsedUser = JSON.parse(userData);
            console.log('[Auth] Loaded user from storage:', parsedUser);
            // Map MongoDB _id to id for frontend compatibility
            const mappedUser = {
              ...parsedUser,
              id: parsedUser._id || parsedUser.id,
            };
            console.log('[Auth] Mapped user:', mappedUser);
            console.log('[Auth] User ID:', mappedUser.id);

            // Update stored data if it was missing id
            if (parsedUser._id && !parsedUser.id) {
              console.log('[Auth] Updating stored user data with mapped ID');
              await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(mappedUser));
            }

            // Set auth token in API client (timeout guards against iOS 26 AsyncStorage hang)
            await Promise.race([
              apiClient.setAuthToken(token),
              new Promise<void>((resolve) => setTimeout(resolve, 3000)),
            ]);

            setAccessToken(token);
            setUser(mappedUser);
            setIsAuthenticated(true);
          } else {
            // Token expired, try to refresh
            await attemptTokenRefresh();
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Hard deadline: no matter what hangs inside initializeAuth, setIsLoading(false)
    // fires within 10 seconds so the app never stays on the black loading screen.
    let isActive = true;
    const safetyTimer = setTimeout(() => {
      if (isActive) {
        console.warn('[Auth] initializeAuth safety timeout: forcing isLoading=false');
        setIsLoading(false);
      }
    }, 10000);

    initializeAuth().finally(() => {
      isActive = false;
      clearTimeout(safetyTimer);
    });

    return () => {
      isActive = false;
      clearTimeout(safetyTimer);
    };
  }, []);

  // Auto refresh token 5 minutes before expiry
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const checkTokenExpiry = async () => {
      try {
        const expiryStr = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
        if (!expiryStr) return;

        const expiry = parseInt(expiryStr, 10);
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        // If token expires in less than 5 minutes, refresh it
        if (expiry - now < fiveMinutes) {
          await attemptTokenRefresh();
        }
      } catch (error) {
        console.error('Failed to check token expiry:', error);
      }
    };

    // Check every minute
    const interval = setInterval(checkTokenExpiry, 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, accessToken]);

  const attemptTokenRefresh = async () => {
    try {
      const refreshToken = await Promise.race([
        AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
      ]);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const controller = new AbortController();
      const refreshTimeout = setTimeout(() => controller.abort(), 15000);
      let response: Response;
      try {
        response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(refreshTimeout);
      }

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      if (data.success && data.data) {
        const { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresIn } = data.data;
        const expiresAt = Date.now() + expiresIn * 1000;

        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken),
          AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken),
          AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiresAt.toString()),
        ]);

        // Set auth token in API client
        await apiClient.setAuthToken(newAccessToken);

        setAccessToken(newAccessToken);
        setIsAuthenticated(true);
        return true;
      } else {
        throw new Error('Invalid refresh response');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear auth state and redirect to sign in
      await signOut();
      return false;
    }
  };

  const signUpMutation = useMutation({
    mutationFn: async (data: SignUpData) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || 'Sign up failed');
      }

      return result.data;
    },
    onSuccess: async (data) => {
      const { user: userData, accessToken: token, refreshToken, expiresIn } = data;
      const expiresAt = Date.now() + expiresIn * 1000;

      // Map MongoDB _id to id for frontend compatibility
      const mappedUser = {
        ...userData,
        id: userData._id || userData.id,
      };

      // Save to AsyncStorage
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiresAt.toString()),
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(mappedUser)),
      ]);

      // Set auth token in API client
      await apiClient.setAuthToken(token);

      setAccessToken(token);
      setUser(mappedUser);
      setIsAuthenticated(true);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Welcome!', 'Your account has been created successfully.');

      // Navigate to main app
      router.replace('/(tabs)/discovery');
    },
    onError: (error: any) => {
      console.error('[Auth] Sign up error:', error);
      const message = error.message || 'Could not create your account. Please try again.';
      Alert.alert('Sign Up Failed', message);
    },
  });

  const signInMutation = useMutation({
    mutationFn: async (data: SignInData) => {
      console.log('[Auth] Sign in attempt with:', data.email);
      const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('[Auth] Sign in response status:', response.status);
      const result = await response.json();
      console.log('[Auth] Sign in response data:', result);

      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || 'Sign in failed');
      }

      console.log('[Auth] Sign in successful, user data:', result.data);
      return result.data;
    },
    onSuccess: async (data) => {
      console.log('[Auth] onSuccess called with data:', data);
      const { user: userData, accessToken: token, refreshToken, expiresIn } = data;
      console.log('[Auth] Extracted - user:', userData, 'token:', token);
      const expiresAt = Date.now() + expiresIn * 1000;

      // Map MongoDB _id to id for frontend compatibility
      const mappedUser = {
        ...userData,
        id: userData._id || userData.id,
      };
      console.log('[Auth] Mapped user:', mappedUser);

      // Save to AsyncStorage
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiresAt.toString()),
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(mappedUser)),
      ]);
      console.log('[Auth] Saved to AsyncStorage');

      // Set auth token in API client
      await apiClient.setAuthToken(token);
      console.log('[Auth] Set auth token in API client');

      setAccessToken(token);
      setUser(mappedUser);
      setIsAuthenticated(true);
      console.log('[Auth] State updated - authenticated:', true);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate to main app
      router.replace('/(tabs)/discovery');
    },
    onError: (error: any) => {
      console.error('[Auth] Sign in error:', error);
      Alert.alert('Sign In Failed', error.message || 'Invalid email or password.');
    },
  });

  const signOut = useCallback(async () => {
    try {
      // Call backend to invalidate refresh token
      if (accessToken) {
        await fetch(`${API_BASE_URL}/api/auth/signout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        });
      }
    } catch (error) {
      console.error('Sign out API call failed:', error);
      // Continue with local sign out even if API fails
    }

    // Clear AsyncStorage with a timeout to prevent hanging (iOS 26 TurboModule edge case).
    const clearStorageTimeout = new Promise<void>((resolve) => setTimeout(resolve, 5000));
    await Promise.race([
      Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
      ]),
      clearStorageTimeout,
    ]);

    // Clear React Query cache
    queryClient.clear();

    // Clear auth token from API client (timeout guards against iOS 26 AsyncStorage hang)
    await Promise.race([
      apiClient.clearAuthToken(),
      new Promise<void>((resolve) => setTimeout(resolve, 3000)),
    ]);

    // Update state
    setAccessToken(null);
    setUser(null);
    setIsAuthenticated(false);

    // Navigate to sign in
    router.replace('/auth/sign-in');

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [accessToken, queryClient]);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user || !accessToken) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || 'Update failed');
      }

      const updatedUser = { ...user, ...result.data };
      setUser(updatedUser);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (error: any) {
      Alert.alert('Update Failed', error.message || 'Could not update profile.');
      throw error;
    }
  }, [user, accessToken]);

  const getAuthHeader = useCallback(() => {
    return accessToken ? `Bearer ${accessToken}` : '';
  }, [accessToken]);

  // Debug logging for return values - runs on EVERY render
  const userId = user?.id || null;
  console.log('[AuthContext] RENDER - user:', user);
  console.log('[AuthContext] RENDER - userId:', userId);
  console.log('[AuthContext] RENDER - isAuthenticated:', isAuthenticated);
  console.log('[AuthContext] RENDER - accessToken exists:', !!accessToken);

  return {
    // State
    isAuthenticated,
    isLoading,
    user,
    userId,
    accessToken,

    // Methods
    signUp: signUpMutation.mutate,
    signIn: signInMutation.mutate,
    signOut,
    updateProfile,
    getAuthHeader,

    // Loading states
    isSigningUp: signUpMutation.isPending,
    isSigningIn: signInMutation.isPending,
  };
});
