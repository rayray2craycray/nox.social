// Mock external dependencies before imports
jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(),
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'nox://instagram-callback'),
}));

jest.mock('../api', () => ({
  exchangeInstagramCode: jest.fn(),
  syncInstagram: jest.fn(),
}));

jest.mock('@/utils/secureStorage', () => ({
  getSecureItem: jest.fn(),
  setSecureItem: jest.fn(),
  deleteSecureItem: jest.fn(),
  SECURE_KEYS: {
    INSTAGRAM_TOKEN: 'instagram_token',
    AUTH_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
  },
}));

import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { getSecureItem, setSecureItem, deleteSecureItem, SECURE_KEYS } from '@/utils/secureStorage';
import { exchangeInstagramCode, syncInstagram } from '../api';
import {
  hasInstagramConnected,
  connectInstagram,
  disconnectInstagram,
  getInstagramFollowing,
  syncInstagramFollowing,
  getInstagramSuggestions,
} from '../instagram.service';

const mockGetSecureItem = getSecureItem as jest.MockedFunction<typeof getSecureItem>;
const mockSetSecureItem = setSecureItem as jest.MockedFunction<typeof setSecureItem>;
const mockDeleteSecureItem = deleteSecureItem as jest.MockedFunction<typeof deleteSecureItem>;
const mockExchangeInstagramCode = exchangeInstagramCode as jest.MockedFunction<typeof exchangeInstagramCode>;
const mockSyncInstagram = syncInstagram as jest.MockedFunction<typeof syncInstagram>;
const mockOpenAuthSession = WebBrowser.openAuthSessionAsync as jest.MockedFunction<typeof WebBrowser.openAuthSessionAsync>;

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

describe('instagram.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  // ========================================================================
  // hasInstagramConnected
  // ========================================================================

  describe('hasInstagramConnected', () => {
    it('should return true when token exists', async () => {
      mockGetSecureItem.mockResolvedValue('some-token');

      const result = await hasInstagramConnected();
      expect(result).toBe(true);
      expect(mockGetSecureItem).toHaveBeenCalledWith(SECURE_KEYS.INSTAGRAM_TOKEN);
    });

    it('should return false when no token exists', async () => {
      mockGetSecureItem.mockResolvedValue(null);

      const result = await hasInstagramConnected();
      expect(result).toBe(false);
    });

    it('should return false when getSecureItem throws', async () => {
      mockGetSecureItem.mockRejectedValue(new Error('Keychain error'));

      const result = await hasInstagramConnected();
      expect(result).toBe(false);
    });
  });

  // ========================================================================
  // connectInstagram (mock data path - development mode)
  // ========================================================================

  describe('connectInstagram', () => {
    it('should return null and show alert when instagram sync is disabled', async () => {
      // In test env, EXPO_PUBLIC_ENABLE_INSTAGRAM_SYNC is not set, so sync is disabled
      const result = await connectInstagram();

      expect(result).toBeNull();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Instagram Sync Disabled',
        'Contact sync is currently disabled.'
      );
    });

    it('should not call WebBrowser when sync is disabled', async () => {
      await connectInstagram();
      expect(mockOpenAuthSession).not.toHaveBeenCalled();
    });
  });

  // ========================================================================
  // disconnectInstagram
  // ========================================================================

  describe('disconnectInstagram', () => {
    it('should remove all Instagram data from storage', async () => {
      await AsyncStorage.setItem('nox_instagram_user', JSON.stringify({ id: 'ig-1' }));
      await AsyncStorage.setItem('nox_instagram_following', JSON.stringify([]));
      await AsyncStorage.setItem('nox_instagram_token_expires', '2026-12-31');

      await disconnectInstagram();

      expect(mockDeleteSecureItem).toHaveBeenCalledWith(SECURE_KEYS.INSTAGRAM_TOKEN);
      const user = await AsyncStorage.getItem('nox_instagram_user');
      expect(user).toBeNull();
      const following = await AsyncStorage.getItem('nox_instagram_following');
      expect(following).toBeNull();
      const expires = await AsyncStorage.getItem('nox_instagram_token_expires');
      expect(expires).toBeNull();
    });

    it('should not throw when deleteSecureItem fails', async () => {
      mockDeleteSecureItem.mockRejectedValue(new Error('Keychain error'));

      // Should not throw
      await disconnectInstagram();
    });
  });

  // ========================================================================
  // getInstagramFollowing
  // ========================================================================

  describe('getInstagramFollowing', () => {
    it('should return empty array when ENABLE_INSTAGRAM_SYNC is false', async () => {
      // In test env, ENABLE_INSTAGRAM_SYNC is not set (false)
      const result = await getInstagramFollowing();
      expect(result).toEqual([]);
      // Should not even check for token
      expect(mockGetSecureItem).not.toHaveBeenCalled();
    });
  });

  // ========================================================================
  // syncInstagramFollowing
  // ========================================================================

  describe('syncInstagramFollowing', () => {
    it('should return null when no user data stored', async () => {
      const result = await syncInstagramFollowing();
      expect(result).toBeNull();
    });

    it('should return sync result with user and empty following when sync disabled', async () => {
      const mockUser = { id: 'ig-123', username: 'testuser' };
      await AsyncStorage.setItem('nox_instagram_user', JSON.stringify(mockUser));

      const result = await syncInstagramFollowing();

      expect(result).not.toBeNull();
      expect(result!.user).toEqual(mockUser);
      // Following is [] because ENABLE_INSTAGRAM_SYNC is false in test env
      expect(result!.following).toEqual([]);
      expect(result!.syncedAt).toBeDefined();
      // syncedAt should be a valid ISO date string
      expect(new Date(result!.syncedAt).getTime()).not.toBeNaN();
    });

    it('should return null when an error occurs', async () => {
      // Set invalid JSON to trigger parse error
      await AsyncStorage.setItem('nox_instagram_user', 'invalid-json');

      const result = await syncInstagramFollowing();
      expect(result).toBeNull();
    });
  });

  // ========================================================================
  // getInstagramSuggestions
  // ========================================================================

  describe('getInstagramSuggestions', () => {
    it('should return empty array when Instagram is not connected', async () => {
      mockGetSecureItem.mockResolvedValue(null);

      const result = await getInstagramSuggestions();
      expect(result).toEqual([]);
    });

    it('should return empty when connected but sync is disabled', async () => {
      mockGetSecureItem.mockResolvedValue('token-123');

      const mockUser = { id: 'ig-me', username: 'me' };
      await AsyncStorage.setItem('nox_instagram_user', JSON.stringify(mockUser));

      const result = await getInstagramSuggestions();

      // Returns [] because getInstagramFollowing returns [] when sync is disabled
      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      // hasInstagramConnected will fail
      mockGetSecureItem.mockRejectedValue(new Error('Keychain error'));

      const result = await getInstagramSuggestions();
      expect(result).toEqual([]);
    });
  });

  // ========================================================================
  // Edge cases
  // ========================================================================

  describe('edge cases', () => {
    it('should handle AsyncStorage errors in disconnectInstagram gracefully', async () => {
      mockDeleteSecureItem.mockRejectedValue(new Error('Storage full'));

      // Should not throw
      await expect(disconnectInstagram()).resolves.toBeUndefined();
    });

    it('should handle getSecureItem returning empty string as falsy', async () => {
      mockGetSecureItem.mockResolvedValue('');

      const result = await hasInstagramConnected();
      expect(result).toBe(false);
    });
  });
});
