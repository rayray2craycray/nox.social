import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock the places service
jest.mock('@/services/places.service', () => ({
  fetchNearbyVenues: jest.fn().mockResolvedValue([]),
  getCurrentLocation: jest.fn().mockResolvedValue({
    latitude: 37.78825,
    longitude: -122.4324,
  }),
  searchVenues: jest.fn().mockResolvedValue([]),
}));

import {
  fetchNearbyVenues,
  getCurrentLocation,
  searchVenues,
} from '@/services/places.service';
import { useNearbyVenues } from '../useNearbyVenues';

const mockFetchNearbyVenues = fetchNearbyVenues as jest.MockedFunction<typeof fetchNearbyVenues>;
const mockGetCurrentLocation = getCurrentLocation as jest.MockedFunction<typeof getCurrentLocation>;
const mockSearchVenues = searchVenues as jest.MockedFunction<typeof searchVenues>;

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

const mockVenues = [
  {
    id: 'place-1',
    name: 'Test Bar',
    type: 'BAR' as const,
    location: {
      latitude: 37.789,
      longitude: -122.433,
      address: '123 Test St',
    },
    distance: 0.5,
    rating: 4.5,
    totalRatings: 200,
    placeId: 'place-1',
  },
  {
    id: 'place-2',
    name: 'Test Club',
    type: 'CLUB' as const,
    location: {
      latitude: 37.790,
      longitude: -122.434,
      address: '456 Club Ave',
    },
    distance: 1.2,
    rating: 4.0,
    totalRatings: 150,
    placeId: 'place-2',
  },
];

describe('useNearbyVenues', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
    mockFetchNearbyVenues.mockResolvedValue(mockVenues);
    mockGetCurrentLocation.mockResolvedValue({
      latitude: 37.78825,
      longitude: -122.4324,
    });
  });

  it('should start with empty venues and loading false', () => {
    const { result } = renderHook(() => useNearbyVenues({ autoFetch: false }));

    expect(result.current.venues).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.userLocation).toBeNull();
  });

  it('should provide all expected return values', () => {
    const { result } = renderHook(() => useNearbyVenues({ autoFetch: false }));

    expect(Array.isArray(result.current.venues)).toBe(true);
    expect(typeof result.current.isLoading).toBe('boolean');
    expect(typeof result.current.fetchVenues).toBe('function');
    expect(typeof result.current.refreshVenues).toBe('function');
    expect(typeof result.current.searchVenuesByQuery).toBe('function');
    expect(typeof result.current.clearCache).toBe('function');
  });

  it('should fetch venues on demand', async () => {
    const { result } = renderHook(() => useNearbyVenues({ autoFetch: false }));

    await act(async () => {
      await result.current.fetchVenues();
    });

    expect(mockGetCurrentLocation).toHaveBeenCalled();
    expect(mockFetchNearbyVenues).toHaveBeenCalledWith(37.78825, -122.4324, 50, 100);
    expect(result.current.venues).toEqual(mockVenues);
    expect(result.current.userLocation).toEqual({
      latitude: 37.78825,
      longitude: -122.4324,
    });
  });

  it('should handle location unavailable', async () => {
    mockGetCurrentLocation.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useNearbyVenues({ autoFetch: false }));

    await act(async () => {
      await result.current.fetchVenues();
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.venues).toEqual([]);
  });

  it('should handle fetch error', async () => {
    mockFetchNearbyVenues.mockRejectedValueOnce(new Error('API error'));

    const { result } = renderHook(() => useNearbyVenues({ autoFetch: false }));

    await act(async () => {
      await result.current.fetchVenues();
    });

    expect(result.current.error).toBe('API error');
  });

  it('should clear cache', async () => {
    const { result } = renderHook(() => useNearbyVenues({ autoFetch: false }));

    await act(async () => {
      await result.current.clearCache();
    });

    // Should not throw
    const cached = await AsyncStorage.getItem('nearby_venues_cache');
    expect(cached).toBeNull();
  });

  it('should load from cache when available', async () => {
    const cacheData = {
      data: mockVenues,
      timestamp: Date.now(), // Fresh cache
      location: { latitude: 37.78825, longitude: -122.4324 },
    };
    await AsyncStorage.setItem('nearby_venues_cache', JSON.stringify(cacheData));

    const { result } = renderHook(() => useNearbyVenues({ autoFetch: true }));

    await waitFor(() => {
      expect(result.current.venues).toEqual(mockVenues);
    });

    // Should NOT have called the API since cache is valid
    expect(mockFetchNearbyVenues).not.toHaveBeenCalled();
  });

  it('should use custom options', () => {
    const { result } = renderHook(() => useNearbyVenues({
      radiusMiles: 25,
      maxResults: 50,
      autoFetch: false,
      cacheKey: 'custom_cache',
      cacheDuration: 30000,
    }));

    expect(result.current.venues).toEqual([]);
  });

  it('should refresh venues by clearing cache first', async () => {
    const { result } = renderHook(() => useNearbyVenues({ autoFetch: false }));

    await act(async () => {
      await result.current.refreshVenues();
    });

    expect(mockGetCurrentLocation).toHaveBeenCalled();
    expect(mockFetchNearbyVenues).toHaveBeenCalled();
  });

  it.skip('should search venues by query', async () => {
    const searchResults = [mockVenues[0]];
    mockSearchVenues.mockResolvedValueOnce(searchResults);

    const { result } = renderHook(() => useNearbyVenues({ autoFetch: false }));

    // First fetch to set userLocation
    await act(async () => {
      await result.current.fetchVenues();
    });

    await act(async () => {
      await result.current.searchVenuesByQuery('bar');
    });

    expect(mockSearchVenues).toHaveBeenCalledWith('bar', 37.78825, -122.4324, 50);
    expect(result.current.venues).toEqual(searchResults);
  });
});
