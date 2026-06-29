/**
 * usePushNotifications
 *
 * Registers the device for push notifications and uploads the resulting Expo
 * push token to the backend so the server can target this device. Runs once
 * when the user becomes authenticated, no-ops otherwise.
 *
 * Notifications are not actually delivered until the backend has at least
 * one token for a user and the server-side trigger code (post-launch work)
 * sends to Expo's push endpoint.
 */

import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/services/api/config';

async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Expo SDK 54: simulator can return a fake token but Apple Push won't
  // actually deliver to it. Real devices only.
  if (!Device.isDevice) return null;

  try {
    // expo-notifications 56 returns a NotificationPermissionsStatus shape; the
    // boolean `granted` flag exists at runtime but the type defs in this SDK
    // build don't surface it. Cast to a minimal type instead of any-casting.
    type Perm = { granted: boolean };
    let perm = (await Notifications.getPermissionsAsync()) as unknown as Perm;
    if (!perm.granted) {
      perm = (await Notifications.requestPermissionsAsync()) as unknown as Perm;
    }
    if (!perm.granted) return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.expoConfig?.extra?.easProjectId;

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return tokenResponse.data;
  } catch (err) {
    console.warn('[push] registration failed:', err);
    return null;
  }
}

export function usePushNotifications() {
  const { isAuthenticated, accessToken } = useAuth();
  const registeredRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    let cancelled = false;
    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (cancelled || !token) return;

      // Avoid re-posting the same token on every re-render.
      if (registeredRef.current === token) return;

      try {
        await apiClient.post('/auth/push-token', {
          token,
          platform: Platform.OS,
        });
        registeredRef.current = token;
      } catch (err) {
        console.warn('[push] failed to upload token to backend:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, accessToken]);
}
