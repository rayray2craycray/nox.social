import { venuesService } from '../venues.service';
import { api } from '../api';

jest.mock('../api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('venuesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getVenues', () => {
    it('should return array of venues', async () => {
      const mockVenues = [
        { id: 'v1', name: 'Club A', location: { lat: 0, lng: 0 } },
        { id: 'v2', name: 'Bar B', location: { lat: 1, lng: 1 } },
      ];
      mockApi.get.mockResolvedValueOnce(mockVenues);

      const venues = await venuesService.getVenues();

      expect(Array.isArray(venues)).toBe(true);
      expect(venues.length).toBe(2);
      expect(mockApi.get).toHaveBeenCalledWith('/venues');
    });
  });

  describe('getVenueById', () => {
    it('should return venue by ID', async () => {
      const mockVenue = { id: 'v1', name: 'Club A' };
      mockApi.get.mockResolvedValueOnce(mockVenue);

      const venue = await venuesService.getVenueById('v1');

      expect(venue).toBeDefined();
      expect(venue?.id).toBe('v1');
      expect(mockApi.get).toHaveBeenCalledWith('/venues/v1');
    });

    it('should return null for non-existent venue', async () => {
      mockApi.get.mockResolvedValueOnce(null);

      const venue = await venuesService.getVenueById('non-existent');

      expect(venue).toBeNull();
    });
  });

  describe('getNearbyVenues', () => {
    it('should return venues near location', async () => {
      mockApi.get.mockResolvedValueOnce([]);

      const venues = await venuesService.getNearbyVenues(37.7749, -122.4194, 50);

      expect(Array.isArray(venues)).toBe(true);
      expect(mockApi.get).toHaveBeenCalledWith(
        '/venues/nearby?lat=37.7749&lng=-122.4194&radius=50'
      );
    });
  });

  describe('searchVenues', () => {
    it('should search venues by name', async () => {
      mockApi.get.mockResolvedValueOnce([{ id: 'v1', name: 'Club X' }]);

      const results = await venuesService.searchVenues('club');

      expect(Array.isArray(results)).toBe(true);
      expect(mockApi.get).toHaveBeenCalledWith('/venues/search?q=club');
    });

    it('should encode query parameter', async () => {
      mockApi.get.mockResolvedValueOnce([]);

      await venuesService.searchVenues('foo bar');

      expect(mockApi.get).toHaveBeenCalledWith('/venues/search?q=foo%20bar');
    });
  });
});
