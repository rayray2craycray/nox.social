/**
 * Suggestions Service
 * Combines contacts, Instagram, and mutual friends to create personalized friend suggestions
 */

import { SuggestedPerson, FriendProfile } from '@/types';
import { getContactSuggestions, ContactMatch } from './contacts.service';
import { getInstagramSuggestions, InstagramFollowing } from './instagram.service';

const ENABLE_CONTACT_SYNC = process.env.EXPO_PUBLIC_ENABLE_CONTACT_SYNC === 'true';
const ENABLE_INSTAGRAM_SYNC = process.env.EXPO_PUBLIC_ENABLE_INSTAGRAM_SYNC === 'true';

export interface SuggestionConfig {
  includeContacts: boolean;
  includeInstagram: boolean;
  includeMutualFriends: boolean;
  includeVenueBased: boolean;
  maxSuggestions: number;
  useCache: boolean; // Enable caching of suggestions
  cacheDuration: number; // Cache duration in milliseconds
}

const DEFAULT_CONFIG: SuggestionConfig = {
  includeContacts: ENABLE_CONTACT_SYNC,
  includeInstagram: ENABLE_INSTAGRAM_SYNC,
  includeMutualFriends: true,
  includeVenueBased: true,
  maxSuggestions: 20,
  useCache: true,
  cacheDuration: 5 * 60 * 1000, // 5 minutes
};

// In-memory cache for suggestions (could be moved to AsyncStorage for persistence)
let suggestionsCache: {
  data: SuggestedPerson[];
  timestamp: number;
} | null = null;

// Priority weights for different suggestion sources
const PRIORITY_WEIGHTS = {
  CONTACT: 100, // Highest priority - people in your phone contacts
  INSTAGRAM: 80, // High priority - people you follow on Instagram
  MUTUAL_FRIENDS: 60, // Medium priority - mutual friends
  VENUE: 40, // Lower priority - people at same venues
  ALGORITHM: 20, // Lowest priority - algorithmic suggestions
};

/**
 * Convert ContactMatch to SuggestedPerson
 */
function contactMatchToSuggestion(contact: ContactMatch): SuggestedPerson {
  return {
    id: contact.userId || contact.contactId,
    displayName: contact.name,
    avatarUrl: contact.avatarUrl || `https://i.pravatar.cc/150?u=${contact.contactId}`,
    bio: undefined,
    isOnline: false,
    mutualFriends: 0,
    source: {
      type: 'CONTACT',
      phoneNumber: contact.phoneNumber,
    },
    priority: PRIORITY_WEIGHTS.CONTACT,
  };
}

/**
 * Convert InstagramFollowing to SuggestedPerson
 */
function instagramFollowingToSuggestion(following: InstagramFollowing): SuggestedPerson {
  return {
    id: following.userId || following.id,
    displayName: following.fullName || following.username,
    avatarUrl: following.profilePicture || `https://i.pravatar.cc/150?u=${following.id}`,
    bio: undefined,
    isOnline: false,
    mutualFriends: 0,
    source: {
      type: 'INSTAGRAM',
      instagramUsername: following.username,
    },
    priority: PRIORITY_WEIGHTS.INSTAGRAM,
  };
}

/**
 * Convert FriendProfile (mutual friend) to SuggestedPerson
 */
function mutualFriendToSuggestion(friend: FriendProfile): SuggestedPerson {
  return {
    ...friend,
    source: {
      type: 'MUTUAL_FRIENDS',
      count: friend.mutualFriends,
    },
    priority: PRIORITY_WEIGHTS.MUTUAL_FRIENDS + (friend.mutualFriends * 2), // Boost by mutual count
  };
}

/**
 * Deduplicate suggestions by user ID, keeping highest priority version
 */
function deduplicateSuggestions(suggestions: SuggestedPerson[]): SuggestedPerson[] {
  const seen = new Map<string, SuggestedPerson>();

  for (const suggestion of suggestions) {
    const existing = seen.get(suggestion.id);

    if (!existing || suggestion.priority > existing.priority) {
      seen.set(suggestion.id, suggestion);
    }
  }

  return Array.from(seen.values());
}

/**
 * Filter out users that are already being followed
 */
function filterExistingFollows(
  suggestions: SuggestedPerson[],
  followingIds: string[]
): SuggestedPerson[] {
  return suggestions.filter(suggestion => !followingIds.includes(suggestion.id));
}

/**
 * Sort suggestions by priority (highest first)
 */
function sortByPriority(suggestions: SuggestedPerson[]): SuggestedPerson[] {
  return suggestions.sort((a, b) => b.priority - a.priority);
}

/**
 * Clear the suggestions cache
 */
export function clearSuggestionsCache(): void {
  suggestionsCache = null;
}

/**
 * Check if cached suggestions are still valid
 */
function isCacheValid(cacheDuration: number): boolean {
  if (!suggestionsCache) return false;

  const now = Date.now();
  const age = now - suggestionsCache.timestamp;

  return age < cacheDuration;
}

/**
 * Get personalized friend suggestions
 * Combines data from contacts, Instagram, mutual friends, and venue-based suggestions
 */
export async function getPersonalizedSuggestions(
  followingIds: string[],
  mutualFriendSuggestions: FriendProfile[] = [],
  config: Partial<SuggestionConfig> = {}
): Promise<SuggestedPerson[]> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Check cache if enabled
  if (finalConfig.useCache && isCacheValid(finalConfig.cacheDuration)) {
    return suggestionsCache!.data;
  }

  const allSuggestions: SuggestedPerson[] = [];

  try {
    // 1. Get contact-based suggestions (highest priority)
    if (finalConfig.includeContacts) {
      try {
        const contactMatches = await getContactSuggestions();
        const contactSuggestions = contactMatches
          .filter(match => match.userId) // Only include matches with app user IDs
          .map(contactMatchToSuggestion);
        allSuggestions.push(...contactSuggestions);
      } catch (error) {
        console.error('Error fetching contact suggestions:', error);
      }
    }

    // 2. Get Instagram-based suggestions (high priority)
    if (finalConfig.includeInstagram) {
      try {
        const instagramFollowing = await getInstagramSuggestions();
        const instagramSuggestions = instagramFollowing
          .filter(follow => follow.userId) // Only include those on the app
          .map(instagramFollowingToSuggestion);
        allSuggestions.push(...instagramSuggestions);
      } catch (error) {
        console.error('Error fetching Instagram suggestions:', error);
      }
    }

    // 3. Add mutual friend suggestions (medium priority)
    if (finalConfig.includeMutualFriends && mutualFriendSuggestions.length > 0) {
      const mutualSuggestions = mutualFriendSuggestions.map(mutualFriendToSuggestion);
      allSuggestions.push(...mutualSuggestions);
    }

    // 4. TODO: Add venue-based suggestions (lower priority)
    // Users who frequently visit the same venues
    // if (finalConfig.includeVenueBased) {
    //   const venueSuggestions = await getVenueBasedSuggestions();
    //   allSuggestions.push(...venueSuggestions);
    // }

    // 5. Deduplicate (keep highest priority version of each user)
    let uniqueSuggestions = deduplicateSuggestions(allSuggestions);

    // 6. Filter out users already being followed
    uniqueSuggestions = filterExistingFollows(uniqueSuggestions, followingIds);

    // 7. Sort by priority
    uniqueSuggestions = sortByPriority(uniqueSuggestions);

    // 8. Limit to max suggestions
    const finalSuggestions = uniqueSuggestions.slice(0, finalConfig.maxSuggestions);

    // 9. Cache the results if enabled
    if (finalConfig.useCache) {
      suggestionsCache = {
        data: finalSuggestions,
        timestamp: Date.now(),
      };
    }

    return finalSuggestions;
  } catch (error) {
    console.error('Error generating personalized suggestions:', error);

    // Return cached data if available, even if expired
    if (suggestionsCache) {
      return suggestionsCache.data;
    }

    return [];
  }
}

/**
 * Get a user-friendly label for the suggestion source
 */
export function getSuggestionSourceLabel(suggestion: SuggestedPerson): string {
  switch (suggestion.source.type) {
    case 'CONTACT':
      return 'In your contacts';
    case 'INSTAGRAM':
      return `You follow @${suggestion.source.instagramUsername}`;
    case 'MUTUAL_FRIENDS':
      const count = suggestion.source.count;
      return count === 1 ? '1 mutual friend' : `${count} mutual friends`;
    case 'VENUE':
      return `Frequents ${suggestion.source.venueName}`;
    case 'ALGORITHM':
      return 'Suggested for you';
    default:
      return 'Suggested for you';
  }
}

/**
 * Get a badge color for the suggestion source
 */
export function getSuggestionSourceColor(suggestion: SuggestedPerson): string {
  switch (suggestion.source.type) {
    case 'CONTACT':
      return '#10B981'; // Green - high confidence
    case 'INSTAGRAM':
      return '#8B5CF6'; // Purple - Instagram brand-ish
    case 'MUTUAL_FRIENDS':
      return '#3B82F6'; // Blue - social connection
    case 'VENUE':
      return '#F59E0B'; // Amber - location-based
    case 'ALGORITHM':
      return '#6B7280'; // Gray - lower confidence
    default:
      return '#6B7280';
  }
}
