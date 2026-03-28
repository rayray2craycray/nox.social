/**
 * Secure Storage Utility
 * Wraps Expo SecureStore for storing sensitive data like tokens and passwords
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Securely store a value
 * @param key Storage key
 * @param value Value to store
 */
export async function setSecureItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      // Fallback to localStorage for web (less secure, but SecureStore not available)
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch (error) {
    console.error(`Error storing secure item ${key}:`, error);
    throw error;
  }
}

/**
 * Retrieve a securely stored value
 * @param key Storage key
 * @returns Stored value or null
 */
export async function getSecureItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  } catch (error) {
    console.error(`Error retrieving secure item ${key}:`, error);
    return null;
  }
}

/**
 * Delete a securely stored value
 * @param key Storage key
 */
export async function deleteSecureItem(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (error) {
    console.error(`Error deleting secure item ${key}:`, error);
    throw error;
  }
}

/**
 * Secure storage keys for the app
 */
export const SECURE_KEYS = {
  // Authentication
  AUTH_TOKEN: 'vibelink_auth_token',
  REFRESH_TOKEN: 'vibelink_refresh_token',
  USER_PASSWORD: 'vibelink_user_password',

  // OAuth Tokens
  TOAST_ACCESS_TOKEN: 'vibelink_toast_access_token',
  TOAST_REFRESH_TOKEN: 'vibelink_toast_refresh_token',
  INSTAGRAM_TOKEN: 'vibelink_instagram_token',

  // User Credentials
  USER_CREDENTIALS: 'vibelink_credentials',

  // Payment Information
  LINKED_CARDS: 'vibelink_linked_cards',
} as const;

/**
 * Migrate data from AsyncStorage to SecureStore
 * Call this on app startup to migrate existing sensitive data
 */
export async function migrateToSecureStorage(
  asyncStorageKey: string,
  secureStoreKey: string
): Promise<void> {
  try {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    const value = await AsyncStorage.default.getItem(asyncStorageKey);

    if (value) {
      await setSecureItem(secureStoreKey, value);
      await AsyncStorage.default.removeItem(asyncStorageKey);
    }
  } catch (error) {
    console.error(`Error migrating ${asyncStorageKey} to SecureStore:`, error);
  }
}
