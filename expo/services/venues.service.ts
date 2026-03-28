/**
 * Venues Service
 * Handles all venue-related API calls
 */

import { api } from './api';
import type { Venue } from '@/types';

export const venuesService = {
  async getVenues(): Promise<Venue[]> {
    return api.get<Venue[]>('/venues');
  },

  async getVenueById(venueId: string): Promise<Venue | null> {
    return api.get<Venue>(`/venues/${venueId}`);
  },

  async getNearbyVenues(latitude: number, longitude: number, radiusKm: number = 50): Promise<Venue[]> {
    return api.get<Venue[]>(`/venues/nearby?lat=${latitude}&lng=${longitude}&radius=${radiusKm}`);
  },

  async searchVenues(query: string): Promise<Venue[]> {
    return api.get<Venue[]>(`/venues/search?q=${encodeURIComponent(query)}`);
  },
};
