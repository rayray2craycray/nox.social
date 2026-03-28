/**
 * Google Places API Service
 * Fetches real venues (bars, clubs, lounges) near user location
 */

import * as Location from 'expo-location';
import { GOOGLE_MAPS_API_KEY } from './config';

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

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

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
  const nameLower = place.name.toLowerCase();
  const typesLower = place.types.map(t => t.toLowerCase());

  // Check if name contains nightlife keywords
  const hasNightlifeKeyword = NIGHTLIFE_KEYWORDS.some(keyword =>
    nameLower.includes(keyword)
  );

  // Check if types include nightlife types
  const hasNightlifeType = typesLower.some(type =>
    ['night_club', 'bar'].includes(type)
  );

  // Exclude certain types that aren't nightlife
  const excludedTypes = ['hospital', 'school', 'bank', 'store', 'supermarket'];
  const hasExcludedType = typesLower.some(type =>
    excludedTypes.includes(type)
  );

  return (hasNightlifeKeyword || hasNightlifeType) && !hasExcludedType;
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
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key not configured');
      throw new Error('Google Maps API key not configured. Please add GOOGLE_MAPS_API_KEY to app.config.js');
    }

    const radiusMeters = milesToMeters(radiusMiles);
    const allVenues: DiscoveredVenue[] = [];

    // Search for each venue type
    // Note: Google Places API has a max radius of 50,000 meters (~31 miles)
    // For 50 miles, we'll use 50km and filter client-side
    const searchRadius = Math.min(radiusMeters, 50000);

    // Search with different keywords to get comprehensive results
    const keywords = ['nightclub', 'bar', 'lounge', 'club'];

    for (const keyword of keywords) {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${searchRadius}&keyword=${keyword}&key=${GOOGLE_MAPS_API_KEY}`;

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

            // Extract city and state from address
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
          });

        allVenues.push(...venues);
      } else if (data.status === 'REQUEST_DENIED') {
        console.error('Google Places API request denied:', data.error_message);
        throw new Error(`Google Places API error: ${data.error_message}`);
      }
    }

    // Remove duplicates (same place_id)
    const uniqueVenues = Array.from(
      new Map(allVenues.map(venue => [venue.id, venue])).values()
    );

    // Filter by 50-mile radius (client-side for accurate distance)
    const filteredVenues = uniqueVenues.filter(venue => venue.distance <= radiusMiles);

    // Sort by distance
    filteredVenues.sort((a, b) => a.distance - b.distance);

    // Limit results
    return filteredVenues.slice(0, maxResults);
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
