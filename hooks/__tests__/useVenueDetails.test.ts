import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock the places service
jest.mock('@/services/places.service', () => ({
  getVenueDetails: jest.fn(),
}));

import { getVenueDetails } from '@/services/places.service';
import { useVenueDetails } from '../useVenueDetails';

const mockGetVenueDetails = getVenueDetails as jest.MockedFunction<typeof getVenueDetails>;

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

const mockDetails = {
  placeId: 'place-123',
  name: 'Test Nightclub',
  address: '123 Club St, San Francisco, CA',
  formattedAddress: '123 Club St, San Francisco, CA 94103',
  rating: 4.5,
  totalRatings: 300,
  type: 'CLUB' as const,
  openingHours: {
    openNow: true,
    weekdayText: ['Monday: 9:00 PM - 2:00 AM'],
    periods: [],
  },
  photos: [],
  reviews: [],
  phoneNumber: '+14155551234',
  website: 'https://testclub.com',
};

describe('useVenueDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
    mockGetVenueDetails.mockResolvedValue(mockDetails);
  });

  // ========================================================================
  // Initial state
  // ========================================================================

  it('should start with correct initial state when autoFetch is false', () => {
    const { result } = renderHook(() =>
      useVenueDetails({ placeId: 'place-123', autoFetch: false })
    );

    expect(result.current.details).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should expose all expected return values', () => {
    const { result } = renderHook(() =>
      useVenueDetails({ placeId: 'place-123', autoFetch: false })
    );

    expect(typeof result.current.fetchDetails).toBe('function');
    expect(typeof result.current.refreshDetails).toBe('function');
    expect(typeof result.current.clearCache).toBe('function');
  });

  // ========================================================================
  // fetchDetails
  // ========================================================================

  it('should fetch venue details on demand', async () => {
    const { result } = renderHook(() =>
      useVenueDetails({ placeId: 'place-123', autoFetch: false })
    );

    await act(async () => {
      await result.current.fetchDetails();
    });

    expect(mockGetVenueDetails).toHaveBeenCalledWith('place-123');
    expect(result.current.details).toEqual(mockDetails);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should set error when placeId is null', async () => {
    const { result } = renderHook(() =>
      useVenueDetails({ placeId: null, autoFetch: false })
    );

    await act(async () => {
      await result.current.fetchDetails();
    });

    expect(result.current.error).toBe('No place ID provided');
    expect(mockGetVenueDetails).not.toHaveBeenCalled();
  });

  it('should set error when fetch returns null', async () => {
    mockGetVenueDetails.mockResolvedValueOnce(null as any);

    const { result } = renderHook(() =>
      useVenueDetails({ placeId: 'place-123', autoFetch: false })
    );

    await act(async () => {
      await result.current.fetchDetails();
    });

    expect(result.current.error).toBe('Failed to fetch venue details');
    expect(result.current.details).toBeNull();
  });

  it('should handle fetch errors gracefully', async () => {
    mockGetVenueDetails.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() =>
      useVenueDetails({ placeId: 'place-123', autoFetch: false })
    );

    await act(async () => {
      await result.current.fetchDetails();
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.isLoading).toBe(false);
  });

  // ========================================================================
  // Caching
  // ========================================================================

  it('should save fetched details to cache', async () => {
    const { result } = renderHook(() =>
      useVenueDetails({ placeId: 'place-123', autoFetch: false })
    );

    await act(async () => {
      await result.current.fetchDetails();
    });

    const cached = await AsyncStorage.getItem('venue_details_place-123');
    expect(cached).not.toBeNull();
    const parsed = JSON.parse(cached!);
    expect(parsed.data).toEqual(mockDetails);
    expect(typeof parsed.timestamp).toBe('number');
  });

  it('should load from cache when data is fresh', async () => {
    // Pre-populate cache with fresh data
    const cacheData = {
      data: mockDetails,
      timestamp: Date.now(), // Fresh cache
    };
    await AsyncStorage.setItem('venue_details_place-123', JSON.stringify(cacheData));

    const { result } = renderHook(() =>
      useVenueDetails({ placeId: 'place-123', autoFetch: true })
    );

    await waitFor(() => {
      expect(result.current.details).toEqual(mockDetails);
    });

    // Should NOT have called the API since cache is valid
    expect(mockGetVenueDetails).not.toHaveBeenCalled();
  });

  it('should fetch from API when cache is expired', async () => {
    // Pre-populate cache with expired data
    const cacheData = {
      data: { ...mockDetails, name: 'Old Name' },
      timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago (expired)
    };
    await AsyncStorage.setItem('venue_details_place-123', JSON.stringify(cacheData));

    const { result } = renderHook(() =>
      useVenueDetails({ placeId: 'place-123', autoFetch: true })
    );

    await waitFor(() => {
      expect(result.current.details).toEqual(mockDetails);
    });

    // Should have called the API since cache is expired
    expect(mockGetVenueDetails).toHaveBeenCalledWith('place-123');
  });

  it('should respect custom cacheDuration', async () => {
    // Pre-populate cache that's 5 seconds old
    const cacheData = {
      data: mockDetails,
      timestamp: Date.now() - 5000, // 5 seconds ago
    };
    await AsyncStorage.setItem('venue_details_place-123', JSON.stringify(cacheData));

    // Use a very short cache duration (1 second) so the 5-second-old cache is expired
    const { result } = renderHook(() =>
      useVenueDetails({ placeId: 'place-123', autoFetch: true, cacheDuration: 1000 })
    );

    await waitFor(() => {
      expect(result.current.details).toEqual(mockDetails);
    });

    // Should have called API because cache is older than 1 second
    expect(mockGetVenueDetails).toHaveBeenCalledWith('place-123');
  });

  // ========================================================================
  // clearCache
  // ========================================================================

  it('should clear cache for the venue', async () => {
    await AsyncStorage.setItem('venue_details_place-123', JSON.stringify({ data: mockDetails, timestamp: Date.now() }));

    const { result } = renderHook(() =>
      useVenueDetails({ placeId: 'place-123', autoFetch: false })
    );

    await act(async () => {
      await result.current.clearCache();
    });

    const cached = await AsyncStorage.getItem('venue_details_place-123');
    expect(cached).toBeNull();
  });

  it('should not throw when clearing cache with null placeId', async () => {
    const { result } = renderHook(() =>
      useVenueDetails({ placeId: null, autoFetch: false })
    );

    await act(async () => {
      await result.current.clearCache();
    });

    // Should complete without error
    expect(result.current.error).toBeNull();
  });

  // ========================================================================
  // refreshDetails
  // ========================================================================

  it('should clear cache and re-fetch when refreshing', async () => {
    // Pre-populate cache
    await AsyncStorage.setItem(
      'venue_details_place-123',
      JSON.stringify({ data: mockDetails, timestamp: Date.now() })
    );

    const { result } = renderHook(() =>
      useVenueDetails({ placeId: 'place-123', autoFetch: false })
    );

    await act(async () => {
      await result.current.refreshDetails();
    });

    // Cache should be cleared and API should be called
    expect(mockGetVenueDetails).toHaveBeenCalledWith('place-123');
    expect(result.current.details).toEqual(mockDetails);
  });

  // ========================================================================
  // autoFetch
  // ========================================================================

  it('should auto-fetch when autoFetch is true and placeId is provided', async () => {
    const { result } = renderHook(() =>
      useVenueDetails({ placeId: 'place-456', autoFetch: true })
    );

    await waitFor(() => {
      expect(result.current.details).toEqual(mockDetails);
    });

    expect(mockGetVenueDetails).toHaveBeenCalledWith('place-456');
  });

  it('should not auto-fetch when autoFetch is true but placeId is null', async () => {
    renderHook(() =>
      useVenueDetails({ placeId: null, autoFetch: true })
    );

    // Give it a moment to potentially trigger
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(mockGetVenueDetails).not.toHaveBeenCalled();
  });
});
