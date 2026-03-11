jest.mock('../contacts.service', () => ({
  getContactSuggestions: jest.fn().mockResolvedValue([]),
}));

jest.mock('../instagram.service', () => ({
  getInstagramSuggestions: jest.fn().mockResolvedValue([]),
}));

import {
  getPersonalizedSuggestions,
  getSuggestionSourceLabel,
  getSuggestionSourceColor,
  clearSuggestionsCache,
} from '../suggestions.service';
import { getContactSuggestions } from '../contacts.service';
import { getInstagramSuggestions } from '../instagram.service';
import { SuggestedPerson, FriendProfile } from '@/types';

const mockGetContactSuggestions = getContactSuggestions as jest.MockedFunction<typeof getContactSuggestions>;
const mockGetInstagramSuggestions = getInstagramSuggestions as jest.MockedFunction<typeof getInstagramSuggestions>;

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

describe('suggestions.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearSuggestionsCache();
  });

  describe('getPersonalizedSuggestions', () => {
    it('should return empty array when no suggestions are available', async () => {
      const result = await getPersonalizedSuggestions([], [], {
        includeContacts: false,
        includeInstagram: false,
        includeMutualFriends: false,
        useCache: false,
      });
      expect(result).toEqual([]);
    });

    it('should include contact suggestions when enabled', async () => {
      mockGetContactSuggestions.mockResolvedValueOnce([
        {
          contactId: 'contact-1',
          name: 'John Contact',
          phoneNumber: '+1234567890',
          userId: 'user-1',
          matchType: 'exact' as any,
        },
      ]);

      const result = await getPersonalizedSuggestions([], [], {
        includeContacts: true,
        includeInstagram: false,
        includeMutualFriends: false,
        useCache: false,
      });

      expect(result.length).toBe(1);
      expect(result[0].displayName).toBe('John Contact');
      expect(result[0].source.type).toBe('CONTACT');
    });

    it('should include Instagram suggestions when enabled', async () => {
      mockGetInstagramSuggestions.mockResolvedValueOnce([
        {
          id: 'ig-1',
          username: 'djcool',
          fullName: 'DJ Cool',
          profilePicture: 'https://example.com/pic.jpg',
          userId: 'user-ig-1',
        },
      ]);

      const result = await getPersonalizedSuggestions([], [], {
        includeContacts: false,
        includeInstagram: true,
        includeMutualFriends: false,
        useCache: false,
      });

      expect(result.length).toBe(1);
      expect(result[0].displayName).toBe('DJ Cool');
      expect(result[0].source.type).toBe('INSTAGRAM');
    });

    it('should include mutual friend suggestions', async () => {
      const mutualFriends: FriendProfile[] = [
        {
          id: 'mutual-1',
          displayName: 'Mutual Friend',
          avatarUrl: 'https://example.com/pic.jpg',
          isOnline: true,
          mutualFriends: 3,
        } as FriendProfile,
      ];

      const result = await getPersonalizedSuggestions([], mutualFriends, {
        includeContacts: false,
        includeInstagram: false,
        includeMutualFriends: true,
        useCache: false,
      });

      expect(result.length).toBe(1);
      expect(result[0].source.type).toBe('MUTUAL_FRIENDS');
    });

    it('should filter out already followed users', async () => {
      mockGetContactSuggestions.mockResolvedValueOnce([
        {
          contactId: 'contact-1',
          name: 'Already Followed',
          phoneNumber: '+1234567890',
          userId: 'followed-user',
          matchType: 'exact' as any,
        },
      ]);

      const result = await getPersonalizedSuggestions(['followed-user'], [], {
        includeContacts: true,
        includeInstagram: false,
        includeMutualFriends: false,
        useCache: false,
      });

      expect(result.length).toBe(0);
    });

    it('should deduplicate suggestions keeping highest priority', async () => {
      mockGetContactSuggestions.mockResolvedValueOnce([
        {
          contactId: 'c-1',
          name: 'Duplicate User (Contact)',
          phoneNumber: '+1111111111',
          userId: 'dup-user',
          matchType: 'exact' as any,
        },
      ]);

      mockGetInstagramSuggestions.mockResolvedValueOnce([
        {
          id: 'ig-dup',
          username: 'dupuser',
          fullName: 'Duplicate User (IG)',
          profilePicture: 'https://example.com/pic.jpg',
          userId: 'dup-user',
        },
      ]);

      const result = await getPersonalizedSuggestions([], [], {
        includeContacts: true,
        includeInstagram: true,
        includeMutualFriends: false,
        useCache: false,
      });

      // Should only have one entry for dup-user
      const dupEntries = result.filter(s => s.id === 'dup-user');
      expect(dupEntries.length).toBe(1);
      // Contact has higher priority than Instagram
      expect(dupEntries[0].source.type).toBe('CONTACT');
    });

    it('should respect maxSuggestions config', async () => {
      const manyContacts = Array.from({ length: 30 }, (_, i) => ({
        contactId: `contact-${i}`,
        name: `Contact ${i}`,
        phoneNumber: `+1${i.toString().padStart(10, '0')}`,
        userId: `user-${i}`,
        matchType: 'exact' as any,
      }));

      mockGetContactSuggestions.mockResolvedValueOnce(manyContacts);

      const result = await getPersonalizedSuggestions([], [], {
        includeContacts: true,
        includeInstagram: false,
        includeMutualFriends: false,
        maxSuggestions: 5,
        useCache: false,
      });

      expect(result.length).toBe(5);
    });

    it('should use cache on second call', async () => {
      mockGetContactSuggestions.mockResolvedValueOnce([
        {
          contactId: 'c-1',
          name: 'Cached Contact',
          phoneNumber: '+1111111111',
          userId: 'user-cached',
          matchType: 'exact' as any,
        },
      ]);

      // First call - should hit the service
      const result1 = await getPersonalizedSuggestions([], [], {
        includeContacts: true,
        includeInstagram: false,
        includeMutualFriends: false,
        useCache: true,
        cacheDuration: 60000,
      });

      expect(result1.length).toBe(1);

      // Second call - should use cache (mockGetContactSuggestions not called again)
      const result2 = await getPersonalizedSuggestions([], [], {
        includeContacts: true,
        includeInstagram: false,
        includeMutualFriends: false,
        useCache: true,
        cacheDuration: 60000,
      });

      expect(result2).toEqual(result1);
      // getContactSuggestions should only have been called once
      expect(mockGetContactSuggestions).toHaveBeenCalledTimes(1);
    });

    it('should handle contact service errors gracefully', async () => {
      mockGetContactSuggestions.mockRejectedValueOnce(new Error('Contact permission denied'));

      const result = await getPersonalizedSuggestions([], [], {
        includeContacts: true,
        includeInstagram: false,
        includeMutualFriends: false,
        useCache: false,
      });

      // Should not throw, just return empty
      expect(result).toEqual([]);
    });

    it('should handle Instagram service errors gracefully', async () => {
      mockGetInstagramSuggestions.mockRejectedValueOnce(new Error('IG auth failed'));

      const result = await getPersonalizedSuggestions([], [], {
        includeContacts: false,
        includeInstagram: true,
        includeMutualFriends: false,
        useCache: false,
      });

      expect(result).toEqual([]);
    });
  });

  describe('getSuggestionSourceLabel', () => {
    it('should return "In your contacts" for CONTACT source', () => {
      const suggestion = {
        id: '1',
        displayName: 'Test',
        avatarUrl: '',
        isOnline: false,
        mutualFriends: 0,
        source: { type: 'CONTACT' as const, phoneNumber: '+1234567890' },
        priority: 100,
      };
      expect(getSuggestionSourceLabel(suggestion)).toBe('In your contacts');
    });

    it('should return Instagram label for INSTAGRAM source', () => {
      const suggestion = {
        id: '1',
        displayName: 'Test',
        avatarUrl: '',
        isOnline: false,
        mutualFriends: 0,
        source: { type: 'INSTAGRAM' as const, instagramUsername: 'testuser' },
        priority: 80,
      };
      expect(getSuggestionSourceLabel(suggestion)).toBe('You follow @testuser');
    });

    it('should return mutual friends label for MUTUAL_FRIENDS source', () => {
      const suggestion = {
        id: '1',
        displayName: 'Test',
        avatarUrl: '',
        isOnline: false,
        mutualFriends: 0,
        source: { type: 'MUTUAL_FRIENDS' as const, count: 3 },
        priority: 60,
      };
      expect(getSuggestionSourceLabel(suggestion)).toBe('3 mutual friends');
    });

    it('should return singular label for 1 mutual friend', () => {
      const suggestion = {
        id: '1',
        displayName: 'Test',
        avatarUrl: '',
        isOnline: false,
        mutualFriends: 0,
        source: { type: 'MUTUAL_FRIENDS' as const, count: 1 },
        priority: 60,
      };
      expect(getSuggestionSourceLabel(suggestion)).toBe('1 mutual friend');
    });

    it('should return venue label for VENUE source', () => {
      const suggestion = {
        id: '1',
        displayName: 'Test',
        avatarUrl: '',
        isOnline: false,
        mutualFriends: 0,
        source: { type: 'VENUE' as const, venueName: 'Cool Club' },
        priority: 40,
      };
      expect(getSuggestionSourceLabel(suggestion)).toBe('Frequents Cool Club');
    });

    it('should return default label for ALGORITHM source', () => {
      const suggestion = {
        id: '1',
        displayName: 'Test',
        avatarUrl: '',
        isOnline: false,
        mutualFriends: 0,
        source: { type: 'ALGORITHM' as const },
        priority: 20,
      };
      expect(getSuggestionSourceLabel(suggestion)).toBe('Suggested for you');
    });
  });

  describe('getSuggestionSourceColor', () => {
    it('should return green for CONTACT', () => {
      const suggestion = {
        id: '1', displayName: 'T', avatarUrl: '', isOnline: false,
        mutualFriends: 0, source: { type: 'CONTACT' as const }, priority: 100,
      };
      expect(getSuggestionSourceColor(suggestion)).toBe('#10B981');
    });

    it('should return purple for INSTAGRAM', () => {
      const suggestion = {
        id: '1', displayName: 'T', avatarUrl: '', isOnline: false,
        mutualFriends: 0, source: { type: 'INSTAGRAM' as const }, priority: 80,
      };
      expect(getSuggestionSourceColor(suggestion)).toBe('#8B5CF6');
    });

    it('should return blue for MUTUAL_FRIENDS', () => {
      const suggestion = {
        id: '1', displayName: 'T', avatarUrl: '', isOnline: false,
        mutualFriends: 0, source: { type: 'MUTUAL_FRIENDS' as const }, priority: 60,
      };
      expect(getSuggestionSourceColor(suggestion)).toBe('#3B82F6');
    });

    it('should return amber for VENUE', () => {
      const suggestion = {
        id: '1', displayName: 'T', avatarUrl: '', isOnline: false,
        mutualFriends: 0, source: { type: 'VENUE' as const }, priority: 40,
      };
      expect(getSuggestionSourceColor(suggestion)).toBe('#F59E0B');
    });

    it('should return gray for ALGORITHM', () => {
      const suggestion = {
        id: '1', displayName: 'T', avatarUrl: '', isOnline: false,
        mutualFriends: 0, source: { type: 'ALGORITHM' as const }, priority: 20,
      };
      expect(getSuggestionSourceColor(suggestion)).toBe('#6B7280');
    });
  });

  describe('clearSuggestionsCache', () => {
    it('should clear the cache so next call fetches fresh data', async () => {
      mockGetContactSuggestions.mockResolvedValue([
        {
          contactId: 'c-1',
          name: 'Contact',
          phoneNumber: '+111',
          userId: 'u-1',
          matchType: 'exact' as any,
        },
      ]);

      // First call
      await getPersonalizedSuggestions([], [], {
        includeContacts: true,
        includeInstagram: false,
        includeMutualFriends: false,
        useCache: true,
        cacheDuration: 60000,
      });

      expect(mockGetContactSuggestions).toHaveBeenCalledTimes(1);

      // Clear cache
      clearSuggestionsCache();

      // Second call should fetch again
      await getPersonalizedSuggestions([], [], {
        includeContacts: true,
        includeInstagram: false,
        includeMutualFriends: false,
        useCache: true,
        cacheDuration: 60000,
      });

      expect(mockGetContactSuggestions).toHaveBeenCalledTimes(2);
    });
  });
});
