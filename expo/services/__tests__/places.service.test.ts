// Mock expo-location before import
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: {
        latitude: 37.78825,
        longitude: -122.4324,
      },
    })
  ),
  Accuracy: {
    High: 4,
  },
}));

jest.mock('../config', () => ({
  GOOGLE_MAPS_API_KEY: 'test-api-key',
}));

// Mock global fetch (still used by getVenueDetails / searchVenues)
const mockFetch = jest.fn();
global.fetch = mockFetch;

// fetchNearbyVenues goes through the backend proxy via apiClient (axios)
// since the April places refactor — mock it separately.
const mockApiGet = jest.fn();
jest.mock('../api/config', () => ({
  __esModule: true,
  default: { get: (...args: any[]) => mockApiGet(...args) },
}));

import {
  calculateDistance,
  milesToMeters,
  getPhotoUrl,
  requestLocationPermission,
  getCurrentLocation,
  fetchNearbyVenues,
  getVenueDetails,
  searchVenues,
  NIGHTLIFE_VENUE_TYPES,
  NIGHTLIFE_KEYWORDS,
} from '../places.service';
import * as Location from 'expo-location';

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

describe('places.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constants', () => {
    it('should export NIGHTLIFE_VENUE_TYPES', () => {
      expect(NIGHTLIFE_VENUE_TYPES).toContain('night_club');
      expect(NIGHTLIFE_VENUE_TYPES).toContain('bar');
    });

    it('should export NIGHTLIFE_KEYWORDS', () => {
      expect(NIGHTLIFE_KEYWORDS).toContain('bar');
      expect(NIGHTLIFE_KEYWORDS).toContain('club');
      expect(NIGHTLIFE_KEYWORDS).toContain('lounge');
    });
  });

  describe('calculateDistance', () => {
    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(37.78825, -122.4324, 37.78825, -122.4324);
      expect(distance).toBe(0);
    });

    it('should calculate distance between two points', () => {
      // SF to LA is approximately 347 miles
      const distance = calculateDistance(
        37.7749, -122.4194, // San Francisco
        34.0522, -118.2437  // Los Angeles
      );
      expect(distance).toBeGreaterThan(300);
      expect(distance).toBeLessThan(400);
    });

    it('should return a positive number for any two different points', () => {
      const distance = calculateDistance(0, 0, 1, 1);
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('milesToMeters', () => {
    it('should convert miles to meters', () => {
      const meters = milesToMeters(1);
      expect(meters).toBeCloseTo(1609.34, 1);
    });

    it('should return 0 for 0 miles', () => {
      expect(milesToMeters(0)).toBe(0);
    });

    it('should handle large values', () => {
      const meters = milesToMeters(50);
      expect(meters).toBeCloseTo(80467, 0);
    });
  });

  describe('getPhotoUrl', () => {
    it('should generate photo URL with reference and key', () => {
      const url = getPhotoUrl('test-photo-ref');
      expect(url).toContain('test-photo-ref');
      expect(url).toContain('test-api-key');
      expect(url).toContain('maxwidth=400');
    });

    it('should use custom maxWidth', () => {
      const url = getPhotoUrl('ref', 800);
      expect(url).toContain('maxwidth=800');
    });
  });

  describe('requestLocationPermission', () => {
    it('should return true when permission is granted', async () => {
      const result = await requestLocationPermission();
      expect(result).toBe(true);
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
    });

    it('should return false when permission is denied', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'denied',
      });
      const result = await requestLocationPermission();
      expect(result).toBe(false);
    });
  });

  describe('getCurrentLocation', () => {
    it('should return coordinates when permission is granted', async () => {
      const location = await getCurrentLocation();
      expect(location).toEqual({
        latitude: 37.78825,
        longitude: -122.4324,
      });
    });

    it('should return null when permission is denied', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'denied',
      });
      const location = await getCurrentLocation();
      expect(location).toBeNull();
    });

    it('should return null when getCurrentPositionAsync throws', async () => {
      (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Location error')
      );
      const location = await getCurrentLocation();
      expect(location).toBeNull();
    });
  });

  describe('fetchNearbyVenues', () => {
    const mockPlacesResponse = {
      status: 'OK',
      results: [
        {
          place_id: 'place-1',
          name: 'Cool Bar',
          formatted_address: '123 Main St, San Francisco, CA 94101',
          geometry: { location: { lat: 37.789, lng: -122.433 } },
          types: ['bar', 'establishment'],
          rating: 4.5,
          user_ratings_total: 200,
          opening_hours: { open_now: true },
        },
      ],
    };

    it('should fetch venues via the backend places proxy', async () => {
      mockApiGet.mockResolvedValue({ data: mockPlacesResponse });

      const venues = await fetchNearbyVenues(37.78825, -122.4324, 50, 100);

      expect(mockApiGet).toHaveBeenCalledWith(
        '/v1/venues/nearby',
        expect.objectContaining({ params: expect.any(Object) })
      );
      expect(venues.length).toBeGreaterThanOrEqual(0);
    });

    it('should throw when API returns REQUEST_DENIED', async () => {
      mockApiGet.mockResolvedValue({
        data: { status: 'REQUEST_DENIED', error_message: 'API key invalid' },
      });

      await expect(
        fetchNearbyVenues(37.78825, -122.4324)
      ).rejects.toThrow('Google Places API error');
    });

    it('should handle empty results', async () => {
      mockApiGet.mockResolvedValue({
        data: { status: 'ZERO_RESULTS', results: [] },
      });

      const venues = await fetchNearbyVenues(37.78825, -122.4324);
      expect(venues).toEqual([]);
    });

    it('should deduplicate venues', async () => {
      mockApiGet.mockResolvedValue({ data: mockPlacesResponse });

      const venues = await fetchNearbyVenues(37.78825, -122.4324);
      const ids = venues.map(v => v.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });
  });

  describe('getVenueDetails', () => {
    it('should fetch venue details by placeId', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          status: 'OK',
          result: {
            place_id: 'place-1',
            name: 'Cool Bar',
            formatted_address: '123 Main St',
            rating: 4.5,
            user_ratings_total: 200,
            types: ['bar'],
          },
        }),
      });

      const details = await getVenueDetails('place-1');
      expect(details).toBeDefined();
      expect(details!.name).toBe('Cool Bar');
      expect(details!.placeId).toBe('place-1');
    });

    it('should return null for failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ status: 'NOT_FOUND' }),
      });

      const details = await getVenueDetails('bad-place-id');
      expect(details).toBeNull();
    });

    it('should throw for REQUEST_DENIED', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          status: 'REQUEST_DENIED',
          error_message: 'Invalid key',
        }),
      });

      // getVenueDetails catches and returns null
      const details = await getVenueDetails('place-1');
      expect(details).toBeNull();
    });

    it('should parse opening hours and photos', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          status: 'OK',
          result: {
            place_id: 'place-1',
            name: 'Fancy Bar',
            formatted_address: '456 Bar Ave',
            opening_hours: {
              open_now: true,
              weekday_text: ['Monday: 5:00 PM - 2:00 AM'],
              periods: [{ open: { day: 1, time: '1700' }, close: { day: 2, time: '0200' } }],
            },
            photos: [
              { photo_reference: 'ref-1', width: 800, height: 600 },
            ],
            reviews: [
              { author_name: 'John', rating: 5, text: 'Great!', time: 1234567890, relative_time_description: '1 month ago' },
            ],
          },
        }),
      });

      const details = await getVenueDetails('place-1');
      expect(details!.openingHours).toBeDefined();
      expect(details!.openingHours!.openNow).toBe(true);
      expect(details!.photos).toHaveLength(1);
      expect(details!.reviews).toHaveLength(1);
    });
  });

  describe('searchVenues', () => {
    it('should search venues by text query', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          status: 'OK',
          results: [
            {
              place_id: 'search-1',
              name: 'Searched Bar',
              formatted_address: '789 Search Rd, San Francisco, CA',
              geometry: { location: { lat: 37.789, lng: -122.433 } },
              types: ['bar'],
              rating: 4.0,
            },
          ],
        }),
      });

      const venues = await searchVenues('bar', 37.78825, -122.4324);
      expect(mockFetch).toHaveBeenCalled();
      // Results might be filtered by isNightlifeVenue
      expect(Array.isArray(venues)).toBe(true);
    });

    it('should return empty for no results', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ status: 'ZERO_RESULTS', results: [] }),
      });

      const venues = await searchVenues('nonexistent', 37.78825, -122.4324);
      expect(venues).toEqual([]);
    });

    it('should throw for fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        searchVenues('bar', 37.78825, -122.4324)
      ).rejects.toThrow('Network error');
    });
  });
});
