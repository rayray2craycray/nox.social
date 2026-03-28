/**
 * useNearbyVenues Hook
 * Fetches and caches nearby nightlife venues using Google Places API
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DiscoveredVenue,
  fetchNearbyVenues,
  getCurrentLocation,
  searchVenues,
} from '@/services/places.service';

interface UseNearbyVenuesOptions {
  radiusMiles?: number;
  maxResults?: number;
  autoFetch?: boolean;
  cacheKey?: string;
  cacheDuration?: number; // Duration in milliseconds
}

interface UseNearbyVenuesResult {
  venues: DiscoveredVenue[];
  isLoading: boolean;
  error: string | null;
  userLocation: { latitude: number; longitude: number } | null;
  fetchVenues: () => Promise<void>;
  refreshVenues: () => Promise<void>;
  searchVenuesByQuery: (query: string) => Promise<void>;
  clearCache: () => Promise<void>;
}

const DEFAULT_CACHE_DURATION = 1000 * 60 * 60; // 1 hour
const DEFAULT_CACHE_KEY = 'nearby_venues_cache';

/**
 * Hook to fetch and manage nearby venues
 */
export const useNearbyVenues = (
  options: UseNearbyVenuesOptions = {}
): UseNearbyVenuesResult => {
  const {
    radiusMiles = 50,
    maxResults = 100,
    autoFetch = true,
    cacheKey = DEFAULT_CACHE_KEY,
    cacheDuration = DEFAULT_CACHE_DURATION,
  } = options;

  const [venues, setVenues] = useState<DiscoveredVenue[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const isFetching = useRef(false);

  /**
   * Load cached venues
   */
  const loadCachedVenues = useCallback(async (): Promise<boolean> => {
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (!cached) return false;

      const {
        data,
        timestamp,
        location,
      }: {
        data: DiscoveredVenue[];
        timestamp: number;
        location: { latitude: number; longitude: number };
      } = JSON.parse(cached);

      // Check if cache is still valid
      const now = Date.now();
      if (now - timestamp < cacheDuration) {
        setVenues(data);
        setUserLocation(location);
        return true;
      }

      // Cache expired
      await AsyncStorage.removeItem(cacheKey);
      return false;
    } catch (error) {
      console.error('Error loading cached venues:', error);
      return false;
    }
  }, [cacheKey, cacheDuration]);

  /**
   * Save venues to cache
   */
  const saveToCache = useCallback(
    async (
      data: DiscoveredVenue[],
      location: { latitude: number; longitude: number }
    ) => {
      try {
        const cacheData = {
          data,
          timestamp: Date.now(),
          location,
        };
        await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (error) {
        console.error('Error saving venues to cache:', error);
      }
    },
    [cacheKey]
  );

  /**
   * Clear cache
   */
  const clearCache = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(cacheKey);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }, [cacheKey]);

  /**
   * Fetch venues from API
   */
  const fetchVenues = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (isFetching.current) {
      console.log('Fetch already in progress, skipping...');
      return;
    }

    try {
      isFetching.current = true;
      setIsLoading(true);
      setError(null);

      // Get user location
      const location = await getCurrentLocation();
      if (!location) {
        throw new Error('Unable to get your location. Please enable location services.');
      }

      setUserLocation(location);

      // Fetch nearby venues
      const fetchedVenues = await fetchNearbyVenues(
        location.latitude,
        location.longitude,
        radiusMiles,
        maxResults
      );

      setVenues(fetchedVenues);

      // Save to cache
      await saveToCache(fetchedVenues, location);
    } catch (err: any) {
      console.error('Error fetching venues:', err);
      setError(err.message || 'Failed to fetch nearby venues');
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  }, [radiusMiles, maxResults, saveToCache]);

  /**
   * Refresh venues (bypass cache)
   */
  const refreshVenues = useCallback(async () => {
    await clearCache();
    await fetchVenues();
  }, [clearCache, fetchVenues]);

  /**
   * Search venues by query
   */
  const searchVenuesByQuery = useCallback(
    async (query: string) => {
      if (!userLocation) {
        console.error('User location not available');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const searchResults = await searchVenues(
          query,
          userLocation.latitude,
          userLocation.longitude,
          radiusMiles
        );

        setVenues(searchResults);
      } catch (err: any) {
        console.error('Error searching venues:', err);
        setError(err.message || 'Failed to search venues');
      } finally {
        setIsLoading(false);
      }
    },
    [userLocation, radiusMiles]
  );

  /**
   * Auto-fetch on mount
   */
  useEffect(() => {
    if (autoFetch) {
      const initialize = async () => {
        // Try to load from cache first
        const hasCached = await loadCachedVenues();

        // If no cache or cache expired, fetch from API
        if (!hasCached) {
          await fetchVenues();
        }
      };

      initialize();
    }
  }, [autoFetch]); // Only run on mount

  return {
    venues,
    isLoading,
    error,
    userLocation,
    fetchVenues,
    refreshVenues,
    searchVenuesByQuery,
    clearCache,
  };
};

export default useNearbyVenues;
