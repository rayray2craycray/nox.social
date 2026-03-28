/**
 * useVenueDetails Hook
 * Fetches and caches detailed venue information from Google Places Details API
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVenueDetails, VenueDetails } from '@/services/places.service';

interface UseVenueDetailsOptions {
  placeId: string | null;
  autoFetch?: boolean;
  cacheDuration?: number; // Duration in milliseconds
}

interface UseVenueDetailsResult {
  details: VenueDetails | null;
  isLoading: boolean;
  error: string | null;
  fetchDetails: () => Promise<void>;
  refreshDetails: () => Promise<void>;
  clearCache: () => Promise<void>;
}

const DEFAULT_CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours
const CACHE_KEY_PREFIX = 'venue_details_';

/**
 * Hook to fetch and manage venue details
 */
export const useVenueDetails = (
  options: UseVenueDetailsOptions
): UseVenueDetailsResult => {
  const {
    placeId,
    autoFetch = true,
    cacheDuration = DEFAULT_CACHE_DURATION,
  } = options;

  const [details, setDetails] = useState<VenueDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = placeId ? `${CACHE_KEY_PREFIX}${placeId}` : null;

  /**
   * Load cached venue details
   */
  const loadCachedDetails = useCallback(async (): Promise<boolean> => {
    if (!cacheKey) return false;

    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (!cached) return false;

      const {
        data,
        timestamp,
      }: {
        data: VenueDetails;
        timestamp: number;
      } = JSON.parse(cached);

      // Check if cache is still valid
      const now = Date.now();
      if (now - timestamp < cacheDuration) {
        if (__DEV__) console.log('[VenueDetails] Loaded from cache:', placeId);
        setDetails(data);
        return true;
      }

      // Cache expired
      if (__DEV__) console.log('[VenueDetails] Cache expired for:', placeId);
      await AsyncStorage.removeItem(cacheKey);
      return false;
    } catch (error) {
      console.error('[VenueDetails] Error loading cached details:', error);
      return false;
    }
  }, [cacheKey, cacheDuration, placeId]);

  /**
   * Save details to cache
   */
  const saveToCache = useCallback(
    async (data: VenueDetails) => {
      if (!cacheKey) return;

      try {
        const cacheData = {
          data,
          timestamp: Date.now(),
        };
        await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
        if (__DEV__) console.log('[VenueDetails] Saved to cache:', placeId);
      } catch (error) {
        console.error('[VenueDetails] Error saving to cache:', error);
      }
    },
    [cacheKey, placeId]
  );

  /**
   * Clear cache for this venue
   */
  const clearCache = useCallback(async () => {
    if (!cacheKey) return;

    try {
      await AsyncStorage.removeItem(cacheKey);
      if (__DEV__) console.log('[VenueDetails] Cache cleared for:', placeId);
    } catch (error) {
      console.error('[VenueDetails] Error clearing cache:', error);
    }
  }, [cacheKey, placeId]);

  /**
   * Fetch venue details from API
   */
  const fetchDetails = useCallback(async () => {
    if (!placeId) {
      setError('No place ID provided');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (__DEV__) console.log('[VenueDetails] Fetching details for:', placeId);

      const fetchedDetails = await getVenueDetails(placeId);

      if (fetchedDetails) {
        setDetails(fetchedDetails);
        await saveToCache(fetchedDetails);
      } else {
        setError('Failed to fetch venue details');
      }
    } catch (err: any) {
      console.error('[VenueDetails] Error fetching details:', err);
      setError(err.message || 'Failed to fetch venue details');
    } finally {
      setIsLoading(false);
    }
  }, [placeId, saveToCache]);

  /**
   * Refresh details (bypass cache)
   */
  const refreshDetails = useCallback(async () => {
    await clearCache();
    await fetchDetails();
  }, [clearCache, fetchDetails]);

  /**
   * Auto-fetch on mount or when placeId changes
   */
  useEffect(() => {
    if (autoFetch && placeId) {
      const initialize = async () => {
        // Try to load from cache first
        const hasCached = await loadCachedDetails();

        // If no cache or cache expired, fetch from API
        if (!hasCached) {
          await fetchDetails();
        }
      };

      initialize();
    }
  }, [autoFetch, placeId]); // Re-run when placeId changes

  return {
    details,
    isLoading,
    error,
    fetchDetails,
    refreshDetails,
    clearCache,
  };
};

export default useVenueDetails;
