/**
 * Google Places API Service
 * Fetches real venues (bars, clubs, lounges) near user location
 */

import * as Location from 'expo-location';
import { GOOGLE_MAPS_API_KEY } from './config';
import apiClient from './api/config';

/**
 * Venue types we're interested in
 */
export const NIGHTLIFE_VENUE_TYPES = [
  'night_club',
  'bar',
  'restaurant',  // Many nightlife spots are classified as restaurants
  'cafe',        // Some lounges are classified as cafes
];

/**
 * Keywords to filter for nightlife venues
 */
export const NIGHTLIFE_KEYWORDS = [
  'bar',
  'club',
  'nightclub',
  'lounge',
  'pub',
  'tavern',
  'cocktail',
  'beer',
  'wine',
  'brewery',
  'distillery',
];

/**
 * Place result from Google Places API
 */
export interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  business_status?: string;
  opening_hours?: {
    open_now?: boolean;
  };
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  vicinity?: string;
}

/**
 * Converted venue for our app
 */
export interface DiscoveredVenue {
  id: string;
  name: string;
  type: 'BAR' | 'CLUB' | 'LOUNGE' | 'RESTAURANT';
  location: {
    latitude: number;
    longitude: number;
    address: string;
    city?: string;
    state?: string;
  };
  distance: number; // Distance in miles
  rating?: number;
  totalRatings?: number;
  priceLevel?: number;
  isOpen?: boolean;
  photoUrl?: string;
  placeId: string;
}

/**
 * Detailed venue information from Places Details API
 */
export interface VenueDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  phoneNumber?: string;
  internationalPhoneNumber?: string;
  website?: string;
  rating?: number;
  totalRatings?: number;
  priceLevel?: number;
  openingHours?: {
    openNow?: boolean;
    weekdayText?: string[];
    periods?: Array<{
      open: { day: number; time: string };
      close?: { day: number; time: string };
    }>;
  };
  photos?: Array<{
    photoReference: string;
    url: string;
    width: number;
    height: number;
  }>;
  reviews?: Array<{
    authorName: string;
    rating: number;
    text: string;
    time: number;
    relativeTime: string;
  }>;
  businessStatus?: string;
  types?: string[];
  utcOffset?: number;
}

/**
 * Request location permissions
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
};

/**
 * Get user's current location
 */
export const getCurrentLocation = async (): Promise<{
  latitude: number;
  longitude: number;
} | null> => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      console.error('Location permission denied');
      return null;
    }

    // getCurrentPositionAsync with High accuracy can hang indefinitely on a
    // real device (weak GPS, first launch, indoors) — it has no built-in
    // timeout. Race it against an 8s deadline. Balanced accuracy is plenty for
    // a 50-mile venue search and resolves much faster than High.
    const freshFix = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const timeout = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 8000),
    );

    let location = await Promise.race([freshFix, timeout]);

    // If the fresh fix timed out, fall back to the last cached fix so the map
    // can still render venues rather than spinning on "Getting your location".
    if (!location) {
      console.warn('[Location] fresh fix timed out, trying last known position');
      location = await Location.getLastKnownPositionAsync();
    }

    if (!location) {
      console.error('[Location] no position available (fresh + last-known both failed)');
      return null;
    }

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in miles
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 3958.8; // Radius of Earth in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Convert miles to meters (for Google Places API radius)
 */
export const milesToMeters = (miles: number): number => {
  return miles * 1609.34;
};

/**
 * Determine venue type from Google Place types
 */
const determineVenueType = (types: string[], name: string): 'BAR' | 'CLUB' | 'LOUNGE' | 'RESTAURANT' => {
  const nameLower = name.toLowerCase();

  // Check name for keywords
  if (nameLower.includes('club') || nameLower.includes('nightclub')) {
    return 'CLUB';
  }
  if (nameLower.includes('lounge')) {
    return 'LOUNGE';
  }
  if (nameLower.includes('bar') || nameLower.includes('pub') || nameLower.includes('tavern')) {
    return 'BAR';
  }

  // Check Google types
  if (types.includes('night_club')) {
    return 'CLUB';
  }
  if (types.includes('bar')) {
    return 'BAR';
  }

  // Default to restaurant for others
  return 'RESTAURANT';
};

/**
 * Check if place is likely a nightlife venue
 */
const isNightlifeVenue = (place: GooglePlace): boolean => {
  const nameLower = (place.name || '').toLowerCase();
  const typesLower = (place.types || []).map(t => t.toLowerCase());

  // AUTHORITATIVE: a nightlife venue must be a Google 'bar' or 'night_club'.
  // The name is NOT a standalone positive — that's how "Barber Lounge",
  // "Pilates Club", and "Country Club" leaked in before (name contains a
  // nightlife word but the place is not a bar/club). College bars, dive bars,
  // sports bars, and pubs all carry the 'bar' type, so they're kept.
  const hasNightlifeType = typesLower.some(type => ['night_club', 'bar'].includes(type));
  if (!hasNightlifeType) return false;

  // Drop places Google tags as both a bar and something disqualifying.
  const excludedTypes = [
    'hospital', 'school', 'bank', 'store', 'supermarket', 'gym', 'spa',
    'hair_care', 'beauty_salon', 'lodging', 'gas_station', 'pharmacy',
  ];
  if (typesLower.some(type => excludedTypes.includes(type))) return false;

  // Name denylist for the rare mislabels that still carry a bar type.
  if (/\b(country club|golf|pilates|yoga|barber|nail|fitness|crossfit)\b/.test(nameLower)) return false;

  // Drop "restaurant with a bar" (primary type restaurant, not an actual club).
  if (typesLower[0] === 'restaurant' && !typesLower.includes('night_club')) return false;

  return true;
};

/**
 * Get photo URL from Google Places photo reference
 */
export const getPhotoUrl = (photoReference: string, maxWidth: number = 400): string => {
  if (!GOOGLE_MAPS_API_KEY) {
    return '';
  }
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
};

/**
 * Fetch nearby nightlife venues from Google Places API
 *
 * @param latitude - User's latitude
 * @param longitude - User's longitude
 * @param radiusMiles - Search radius in miles (default: 50)
 * @param maxResults - Maximum number of results to return
 */
export const fetchNearbyVenues = async (
  latitude: number,
  longitude: number,
  radiusMiles: number = 50,
  maxResults: number = 100
): Promise<DiscoveredVenue[]> => {
  try {
    const searchRadius = Math.min(milesToMeters(radiusMiles), 50000);

    const { data } = await apiClient.get<{
      status: string;
      results?: GooglePlace[];
      error_message?: string;
    }>('/v1/venues/nearby', {
      params: { latitude, longitude, radius: searchRadius },
    });

    if (data.status === 'REQUEST_DENIED') {
      throw new Error(`Google Places API error: ${data.error_message || 'request denied'}`);
    }
    if (data.status !== 'OK' || !Array.isArray(data.results)) {
      return [];
    }

    const venues: DiscoveredVenue[] = data.results
      .filter((place) => isNightlifeVenue(place))
      .map((place) => {
        const distance = calculateDistance(
          latitude,
          longitude,
          place.geometry.location.lat,
          place.geometry.location.lng
        );

        const addressParts = place.formatted_address?.split(',') || [];
        const city = addressParts.length > 1 ? addressParts[addressParts.length - 2]?.trim() : undefined;
        const state = addressParts.length > 0 ? addressParts[addressParts.length - 1]?.trim().split(' ')[0] : undefined;

        return {
          id: place.place_id,
          name: place.name,
          type: determineVenueType(place.types, place.name),
          location: {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            address: place.formatted_address || place.vicinity || '',
            city,
            state,
          },
          distance,
          rating: place.rating,
          totalRatings: place.user_ratings_total,
          priceLevel: place.price_level,
          isOpen: place.opening_hours?.open_now,
          photoUrl: place.photos?.[0]?.photo_reference
            ? getPhotoUrl(place.photos[0].photo_reference)
            : undefined,
          placeId: place.place_id,
        };
      })
      .filter((venue) => venue.distance <= radiusMiles)
      .sort((a, b) => a.distance - b.distance);

    return venues.slice(0, maxResults);
  } catch (error) {
    console.error('Error fetching nearby venues:', error);
    throw error;
  }
};

/**
 * Get venue details from Google Places API
 */
export const getVenueDetails = async (placeId: string): Promise<VenueDetails | null> => {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key not configured');
      return null;
    }

    // Request comprehensive venue details
    const fields = [
      'place_id',
      'name',
      'formatted_address',
      'formatted_phone_number',
      'international_phone_number',
      'website',
      'rating',
      'user_ratings_total',
      'price_level',
      'opening_hours',
      'photos',
      'reviews',
      'business_status',
      'types',
      'utc_offset',
    ].join(',');

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_MAPS_API_KEY}`;

    if (__DEV__) console.log('[Places] Fetching venue details for:', placeId);

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.result) {
      const result = data.result;

      // Parse opening hours
      const openingHours = result.opening_hours
        ? {
            openNow: result.opening_hours.open_now,
            weekdayText: result.opening_hours.weekday_text,
            periods: result.opening_hours.periods,
          }
        : undefined;

      // Parse photos
      const photos = result.photos
        ? result.photos.slice(0, 10).map((photo: any) => ({
            photoReference: photo.photo_reference,
            url: getPhotoUrl(photo.photo_reference, 800),
            width: photo.width,
            height: photo.height,
          }))
        : undefined;

      // Parse reviews
      const reviews = result.reviews
        ? result.reviews.slice(0, 5).map((review: any) => ({
            authorName: review.author_name,
            rating: review.rating,
            text: review.text,
            time: review.time,
            relativeTime: review.relative_time_description,
          }))
        : undefined;

      const venueDetails: VenueDetails = {
        placeId: result.place_id,
        name: result.name,
        formattedAddress: result.formatted_address,
        phoneNumber: result.formatted_phone_number,
        internationalPhoneNumber: result.international_phone_number,
        website: result.website,
        rating: result.rating,
        totalRatings: result.user_ratings_total,
        priceLevel: result.price_level,
        openingHours,
        photos,
        reviews,
        businessStatus: result.business_status,
        types: result.types,
        utcOffset: result.utc_offset,
      };

      if (__DEV__) console.log('[Places] Venue details fetched successfully');
      return venueDetails;
    } else if (data.status === 'REQUEST_DENIED') {
      console.error('Google Places API request denied:', data.error_message);
      throw new Error(`Google Places API error: ${data.error_message}`);
    } else {
      console.error('Failed to get venue details:', data.status);
      return null;
    }
  } catch (error) {
    console.error('Error getting venue details:', error);
    return null;
  }
};

/**
 * Search venues by text query
 */
export const searchVenues = async (
  query: string,
  latitude: number,
  longitude: number,
  radiusMiles: number = 50
): Promise<DiscoveredVenue[]> => {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }

    const radiusMeters = Math.min(milesToMeters(radiusMiles), 50000);
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${latitude},${longitude}&radius=${radiusMeters}&type=night_club|bar&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results) {
      const venues = data.results
        .filter((place: GooglePlace) => isNightlifeVenue(place))
        .map((place: GooglePlace) => {
          const distance = calculateDistance(
            latitude,
            longitude,
            place.geometry.location.lat,
            place.geometry.location.lng
          );

          const addressParts = place.formatted_address?.split(',') || [];
          const city = addressParts.length > 1 ? addressParts[addressParts.length - 2]?.trim() : undefined;
          const state = addressParts.length > 0 ? addressParts[addressParts.length - 1]?.trim().split(' ')[0] : undefined;

          const venue: DiscoveredVenue = {
            id: place.place_id,
            name: place.name,
            type: determineVenueType(place.types, place.name),
            location: {
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
              address: place.formatted_address || place.vicinity || '',
              city,
              state,
            },
            distance,
            rating: place.rating,
            totalRatings: place.user_ratings_total,
            priceLevel: place.price_level,
            isOpen: place.opening_hours?.open_now,
            photoUrl: place.photos?.[0]?.photo_reference
              ? getPhotoUrl(place.photos[0].photo_reference)
              : undefined,
            placeId: place.place_id,
          };

          return venue;
        })
        .filter((venue: DiscoveredVenue) => venue.distance <= radiusMiles)
        .sort((a: DiscoveredVenue, b: DiscoveredVenue) => a.distance - b.distance);

      return venues;
    }

    return [];
  } catch (error) {
    console.error('Error searching venues:', error);
    throw error;
  }
};

export default {
  requestLocationPermission,
  getCurrentLocation,
  calculateDistance,
  milesToMeters,
  fetchNearbyVenues,
  getVenueDetails,
  searchVenues,
  getPhotoUrl,
};
