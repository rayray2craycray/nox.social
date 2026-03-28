import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// We need to import after mocking
import {
  setSecureItem,
  getSecureItem,
  deleteSecureItem,
  SECURE_KEYS,
  migrateToSecureStorage,
} from '../secureStorage';

describe('secureStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default to non-web platform
    (Platform as any).OS = 'ios';
  });

  // ========================================================================
  // setSecureItem
  // ========================================================================

  describe('setSecureItem', () => {
    it('should call SecureStore.setItemAsync on native', async () => {
      await setSecureItem('testKey', 'testValue');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('testKey', 'testValue');
    });

    it('should throw error when SecureStore fails', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Storage full')
      );

      await expect(setSecureItem('key', 'val')).rejects.toThrow('Storage full');
    });
  });

  // ========================================================================
  // getSecureItem
  // ========================================================================

  describe('getSecureItem', () => {
    it('should return value from SecureStore on native', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('storedValue');

      const result = await getSecureItem('testKey');

      expect(result).toBe('storedValue');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('testKey');
    });

    it('should return null when key does not exist', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);

      const result = await getSecureItem('nonExistentKey');

      expect(result).toBeNull();
    });

    it('should return null on error instead of throwing', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Keychain error')
      );

      const result = await getSecureItem('testKey');

      expect(result).toBeNull();
    });
  });

  // ========================================================================
  // deleteSecureItem
  // ========================================================================

  describe('deleteSecureItem', () => {
    it('should call SecureStore.deleteItemAsync on native', async () => {
      await deleteSecureItem('testKey');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('testKey');
    });

    it('should throw error when SecureStore fails', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Delete failed')
      );

      await expect(deleteSecureItem('key')).rejects.toThrow('Delete failed');
    });
  });

  // ========================================================================
  // SECURE_KEYS
  // ========================================================================

  describe('SECURE_KEYS', () => {
    it('should have AUTH_TOKEN key', () => {
      expect(SECURE_KEYS.AUTH_TOKEN).toBe('vibelink_auth_token');
    });

    it('should have REFRESH_TOKEN key', () => {
      expect(SECURE_KEYS.REFRESH_TOKEN).toBe('vibelink_refresh_token');
    });

    it('should have all expected keys', () => {
      const expectedKeys = [
        'AUTH_TOKEN',
        'REFRESH_TOKEN',
        'USER_PASSWORD',
        'TOAST_ACCESS_TOKEN',
        'TOAST_REFRESH_TOKEN',
        'INSTAGRAM_TOKEN',
        'USER_CREDENTIALS',
        'LINKED_CARDS',
      ];
      expectedKeys.forEach((key) => {
        expect(SECURE_KEYS).toHaveProperty(key);
      });
    });
  });

  // ========================================================================
  // migrateToSecureStorage
  // ========================================================================

  describe('migrateToSecureStorage', () => {
    it('should not throw on any error', async () => {
      // migrateToSecureStorage uses dynamic import() internally which is hard to mock.
      // At minimum verify it doesn't throw and completes gracefully.
      await expect(
        migrateToSecureStorage('nonexistent_key', 'new_key')
      ).resolves.toBeUndefined();
    });
  });
});
