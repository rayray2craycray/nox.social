/**
 * Instagram Service
 * Handles Instagram OAuth and fetching following list for friend suggestions
 */

import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { exchangeInstagramCode, syncInstagram } from './api';
import { getSecureItem, setSecureItem, deleteSecureItem, SECURE_KEYS } from '@/utils/secureStorage';

// IMPORTANT: Do NOT call WebBrowser.maybeCompleteAuthSession() at module scope.
// Native module methods called during import trigger TurboModule void-method ObjC
// exceptions on iOS New Arch, causing EXC_CRASH (SIGABRT) at startup (Build 76 crash).

const USE_MOCK_DATA = process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true' || process.env.NODE_ENV === 'development';
const ENABLE_INSTAGRAM_SYNC = process.env.EXPO_PUBLIC_ENABLE_INSTAGRAM_SYNC === 'true';

const STORAGE_KEYS = {
  INSTAGRAM_USER: 'nox_instagram_user',
  INSTAGRAM_FOLLOWING: 'nox_instagram_following',
  INSTAGRAM_TOKEN_EXPIRES: 'nox_instagram_token_expires',
};

export interface InstagramUser {
  id: string;
  username: string;
  name?: string;
  profilePictureUrl?: string;
}

export interface InstagramFollowing {
  id: string;
  username: string;
  fullName?: string;
  profilePicture?: string;
  userId?: string; // Matched user ID in the app (if they're also on the app)
}

export interface InstagramSyncResult {
  user: InstagramUser;
  following: InstagramFollowing[];
  syncedAt: string;
}

/**
 * Instagram OAuth configuration
 * For production: Use Instagram Graph API (not Basic Display API)
 * Graph API provides access to following list and more features
 * https://developers.facebook.com/docs/instagram-api
 */
const INSTAGRAM_CONFIG = {
  clientId: process.env.EXPO_PUBLIC_INSTAGRAM_CLIENT_ID || '',
  clientSecret: '', // Never used in client - backend handles this
  // Lazy getter to avoid native module call at import time
  getRedirectUri: () => process.env.EXPO_PUBLIC_INSTAGRAM_REDIRECT_URI || AuthSession.makeRedirectUri({
    scheme: 'nox',
    path: 'instagram-callback',
  }),
  apiUrl: process.env.EXPO_PUBLIC_INSTAGRAM_API_URL || 'https://graph.instagram.com',
  // Graph API scopes (requires Business/Creator account)
  scopes: ['instagram_basic', 'instagram_manage_insights', 'pages_read_engagement'],
};

/**
 * Check if Instagram token is still valid
 */
async function isTokenValid(): Promise<boolean> {
  try {
    const expiresAt = await AsyncStorage.getItem(STORAGE_KEYS.INSTAGRAM_TOKEN_EXPIRES);
    if (!expiresAt) return false;

    const expires = new Date(expiresAt);
    const now = new Date();

    // Consider token expired if less than 1 day remaining
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return expires > oneDayFromNow;
  } catch {
    return false;
  }
}

/**
 * Check if user has connected Instagram
 */
export async function hasInstagramConnected(): Promise<boolean> {
  try {
    const token = await getSecureItem(SECURE_KEYS.INSTAGRAM_TOKEN);
    return !!token;
  } catch {
    return false;
  }
}

/**
 * Connect Instagram account via OAuth
 * Production-ready implementation using Instagram Graph API
 */
export async function connectInstagram(): Promise<InstagramUser | null> {
  if (!ENABLE_INSTAGRAM_SYNC) {
    Alert.alert('Instagram Sync Disabled', 'Contact sync is currently disabled.');
    return null;
  }

  try {
    // Use mock data in development
    if (USE_MOCK_DATA) {
      // Simulate OAuth delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockUser: InstagramUser = {
        id: 'instagram-123456',
        username: 'user.nightlife',
        name: 'Night Life User',
        profilePictureUrl: 'https://i.pravatar.cc/150?img=50',
      };

      await AsyncStorage.setItem(STORAGE_KEYS.INSTAGRAM_USER, JSON.stringify(mockUser));
      await setSecureItem(SECURE_KEYS.INSTAGRAM_TOKEN, 'mock-token-' + Date.now());

      // Mock token expires in 60 days
      const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
      await AsyncStorage.setItem(STORAGE_KEYS.INSTAGRAM_TOKEN_EXPIRES, expiresAt.toISOString());

      return mockUser;
    }

    // PRODUCTION: Check if we have client ID configured
    if (!INSTAGRAM_CONFIG.clientId) {
      // TODO: Send to error tracking service (Sentry/Bugsnag)
      console.error('Instagram OAuth client ID not configured');
      Alert.alert(
        'Configuration Error',
        'Instagram integration is not configured. Please contact support.'
      );
      return null;
    }

    // Build OAuth authorization URL
    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_CONFIG.clientId}&redirect_uri=${encodeURIComponent(INSTAGRAM_CONFIG.getRedirectUri())}&scope=${INSTAGRAM_CONFIG.scopes.join(',')}&response_type=code`;

    // Open OAuth browser session
    const result = await WebBrowser.openAuthSessionAsync(
      authUrl,
      INSTAGRAM_CONFIG.getRedirectUri()
    );

    if (result.type !== 'success' || !result.url) {
      return null;
    }

    // Extract authorization code from callback URL
    const url = new URL(result.url);
    const code = url.searchParams.get('code');

    if (!code) {
      // TODO: Send to error tracking service (Sentry/Bugsnag)
      console.error('No authorization code received from Instagram');
      Alert.alert('Authentication Error', 'No authorization code received.');
      return null;
    }

    // Exchange code for access token via our backend
    // Backend will securely handle client secret and token exchange
    const tokenData = await exchangeInstagramCode(code);

    if (!tokenData.accessToken) {
      // TODO: Send to error tracking service (Sentry/Bugsnag)
      console.error('Failed to get access token from backend');
      Alert.alert('Authentication Error', 'Failed to authenticate with Instagram.');
      return null;
    }

    const user: InstagramUser = {
      id: tokenData.userId,
      username: tokenData.username,
    };

    // Store token securely
    await setSecureItem(SECURE_KEYS.INSTAGRAM_TOKEN, tokenData.accessToken);
    await AsyncStorage.setItem(STORAGE_KEYS.INSTAGRAM_USER, JSON.stringify(user));

    // Instagram Graph API tokens typically expire in 60 days
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    await AsyncStorage.setItem(STORAGE_KEYS.INSTAGRAM_TOKEN_EXPIRES, expiresAt.toISOString());

    return user;
  } catch (error) {
    // TODO: Send to error tracking service (Sentry/Bugsnag)
    console.error('Instagram connection error:', error);
    Alert.alert('Connection Error', 'Failed to connect Instagram. Please try again.');
    return null;
  }
}

/**
 * Disconnect Instagram account
 */
export async function disconnectInstagram(): Promise<void> {
  try {
    await deleteSecureItem(SECURE_KEYS.INSTAGRAM_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.INSTAGRAM_USER);
    await AsyncStorage.removeItem(STORAGE_KEYS.INSTAGRAM_FOLLOWING);
    await AsyncStorage.removeItem(STORAGE_KEYS.INSTAGRAM_TOKEN_EXPIRES);
  } catch (error) {
    // TODO: Send to error tracking service (Sentry/Bugsnag)
    console.error('Error disconnecting Instagram:', error);
  }
}

/**
 * Get Instagram following list
 * In production, this is fetched from backend which calls Instagram Graph API
 */
export async function getInstagramFollowing(): Promise<InstagramFollowing[]> {
  if (!ENABLE_INSTAGRAM_SYNC) {
    return [];
  }

  try {
    const token = await getSecureItem(SECURE_KEYS.INSTAGRAM_TOKEN);

    if (!token) {
      return [];
    }

    // Check if token is still valid
    const tokenValid = await isTokenValid();
    if (!tokenValid) {
      await disconnectInstagram();
      return [];
    }

    // Use mock data in development
    if (USE_MOCK_DATA) {
      return mockInstagramFollowing;
    }

    // PRODUCTION: Fetch from backend
    // Backend will use the token to fetch following list from Instagram Graph API
    const user = await AsyncStorage.getItem(STORAGE_KEYS.INSTAGRAM_USER);
    if (!user) {
      return [];
    }

    const userData = JSON.parse(user);
    const response = await syncInstagram({
      accessToken: token,
      userId: 'user-me', // TODO: Replace with actual current user ID
    });

    const following: InstagramFollowing[] = response.matches.map(match => ({
      id: match.instagramId,
      username: match.instagramUsername,
      fullName: match.displayName,
      profilePicture: match.avatarUrl,
      userId: match.userId,
    }));

    // Cache the following list
    await AsyncStorage.setItem(
      STORAGE_KEYS.INSTAGRAM_FOLLOWING,
      JSON.stringify(following)
    );

    return following;
  } catch (error) {
    // TODO: Send to error tracking service (Sentry/Bugsnag)
    console.error('Error fetching Instagram following:', error);

    // Fallback to cached data
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.INSTAGRAM_FOLLOWING);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (cacheError) {
      // TODO: Send to error tracking service (Sentry/Bugsnag)
      console.error('Error reading cached Instagram data:', cacheError);
    }

    return [];
  }
}

/**
 * Sync Instagram following with backend to find matches
 * This is a wrapper around getInstagramFollowing for convenience
 */
export async function syncInstagramFollowing(): Promise<InstagramSyncResult | null> {
  try {
    const userJson = await AsyncStorage.getItem(STORAGE_KEYS.INSTAGRAM_USER);

    if (!userJson) {
      return null;
    }

    // Fetch following list (this also syncs with backend in production)
    const following = await getInstagramFollowing();

    const syncResult: InstagramSyncResult = {
      user: JSON.parse(userJson),
      following,
      syncedAt: new Date().toISOString(),
    };

    return syncResult;
  } catch (error) {
    // TODO: Send to error tracking service (Sentry/Bugsnag)
    console.error('Error syncing Instagram following:', error);
    return null;
  }
}

/**
 * Get Instagram-based friend suggestions
 */
export async function getInstagramSuggestions(): Promise<InstagramFollowing[]> {
  try {
    const isConnected = await hasInstagramConnected();

    if (!isConnected) {
      return [];
    }

    const syncResult = await syncInstagramFollowing();
    return syncResult?.following.filter(f => f.userId) || [];
  } catch (error) {
    // TODO: Send to error tracking service (Sentry/Bugsnag)
    console.error('Error getting Instagram suggestions:', error);
    return [];
  }
}

// Mock Instagram following data for development
const mockInstagramFollowing: InstagramFollowing[] = [
  {
    id: 'ig-1',
    username: 'sarah_vibes',
    fullName: 'Sarah Chen',
    profilePicture: 'https://i.pravatar.cc/150?img=1',
    userId: 'suggested-1', // This user is on the app
  },
  {
    id: 'ig-2',
    username: 'marcus_nightlife',
    fullName: 'Marcus Wright',
    profilePicture: 'https://i.pravatar.cc/150?img=12',
    userId: 'suggested-2',
  },
  {
    id: 'ig-3',
    username: 'emma_techno',
    fullName: 'Emma Rodriguez',
    profilePicture: 'https://i.pravatar.cc/150?img=5',
    userId: 'suggested-3',
  },
  {
    id: 'ig-4',
    username: 'jordan.edm',
    fullName: 'Jordan Kim',
    profilePicture: 'https://i.pravatar.cc/150?img=8',
    userId: 'suggested-4',
  },
  {
    id: 'ig-5',
    username: 'taylor_party',
    fullName: 'Taylor Brooks',
    profilePicture: 'https://i.pravatar.cc/150?img=9',
    userId: 'suggested-5',
  },
];
