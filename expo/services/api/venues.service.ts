/**
 * Venues API Service
 * Handles venue discovery, vibe checks, and server management
 */

import apiClient from './config';
import {
  Venue,
  VenueServer,
  VibeCheckVote,
  VenueVibeData,
  VibeEnergyLevel,
  WaitTimeRange
} from '@/types';

// Alias for backward compatibility
type Server = VenueServer;

/**
 * Request/Response Types
 */
export interface GetVenuesRequest {
  latitude?: number;
  longitude?: number;
  radius?: number; // in kilometers
  search?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

export interface GetVenuesResponse {
  venues: Venue[];
  total: number;
  hasMore: boolean;
}

export interface SubmitVibeCheckRequest {
  venueId: string;
  music: number; // 1-5
  density: number; // 1-5
  energy: VibeEnergyLevel;
  waitTime: WaitTimeRange;
}

export interface GetVibeDataResponse {
  venueId: string;
  musicScore: number;
  densityScore: number;
  energyLevel: VibeEnergyLevel;
  waitTime: WaitTimeRange;
  lastUpdated: string;
  totalVotes: number;
  vibePercentage: number;
}

export interface JoinServerRequest {
  venueId: string;
  accessCode?: string; // For private servers
}

export interface JoinServerResponse {
  server: Server;
  channels: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

/**
 * Get venues near a location
 * GET /venues
 */
export async function getVenues(params: GetVenuesRequest): Promise<GetVenuesResponse> {
  const response = await apiClient.get<GetVenuesResponse>('/venues', {
    params: {
      lat: params.latitude,
      lng: params.longitude,
      radius: params.radius || 5,
      q: params.search,
      category: params.category,
      limit: params.limit || 20,
      offset: params.offset || 0,
    },
  });
  return response.data;
}

/**
 * Get venue details by ID
 * GET /venues/:venueId
 */
export async function getVenueById(venueId: string): Promise<Venue> {
  const response = await apiClient.get<Venue>(`/venues/${venueId}`);
  return response.data;
}

/**
 * Get venue server details
 * GET /venues/:venueId/server
 */
export async function getVenueServer(venueId: string): Promise<Server> {
  const response = await apiClient.get<Server>(`/venues/${venueId}/server`);
  return response.data;
}

/**
 * Join a venue server
 * POST /venues/:venueId/join
 */
export async function joinVenueServer(
  venueId: string,
  data?: JoinServerRequest
): Promise<JoinServerResponse> {
  const response = await apiClient.post<JoinServerResponse>(
    `/venues/${venueId}/join`,
    data
  );
  return response.data;
}

/**
 * Leave a venue server
 * POST /venues/:venueId/leave
 */
export async function leaveVenueServer(venueId: string): Promise<void> {
  await apiClient.post(`/venues/${venueId}/leave`);
}

/**
 * Submit a vibe check for a venue
 * POST /venues/:venueId/vibe-check
 */
export async function submitVibeCheck(data: SubmitVibeCheckRequest): Promise<VibeCheckVote> {
  const response = await apiClient.post<VibeCheckVote>(
    `/venues/${data.venueId}/vibe-check`,
    {
      music: data.music,
      density: data.density,
      energy: data.energy,
      waitTime: data.waitTime,
    }
  );
  return response.data;
}

/**
 * Get current vibe data for a venue
 * GET /venues/:venueId/vibe-data
 */
export async function getVenueVibeData(venueId: string): Promise<GetVibeDataResponse> {
  const response = await apiClient.get<GetVibeDataResponse>(`/venues/${venueId}/vibe-data`);
  return response.data;
}

/**
 * Check if user can vote vibe check for venue
 * GET /venues/:venueId/can-vote
 */
export async function canVoteVibeCheck(venueId: string): Promise<{
  canVote: boolean;
  cooldownRemaining: number;
}> {
  const response = await apiClient.get<{
    canVote: boolean;
    cooldownRemaining: number;
  }>(`/venues/${venueId}/can-vote`);
  return response.data;
}

/**
 * Get user's joined servers
 * GET /venues/joined
 */
export async function getJoinedServers(): Promise<{ servers: Server[] }> {
  const response = await apiClient.get<{ servers: Server[] }>('/venues/joined');
  return response.data;
}

/**
 * Search venues
 * GET /venues/search
 */
export async function searchVenues(query: string, limit = 20): Promise<Venue[]> {
  const response = await apiClient.get<{ venues: Venue[] }>('/venues/search', {
    params: { q: query, limit },
  });
  return response.data.venues;
}

/**
 * Get featured venues
 * GET /venues/featured
 */
export async function getFeaturedVenues(limit = 10): Promise<Venue[]> {
  const response = await apiClient.get<{ venues: Venue[] }>('/venues/featured', {
    params: { limit },
  });
  return response.data.venues;
}

/**
 * Get trending venues (highest vibe scores)
 * GET /venues/trending
 */
export async function getTrendingVenues(limit = 10): Promise<Venue[]> {
  const response = await apiClient.get<{ venues: Venue[] }>('/venues/trending', {
    params: { limit },
  });
  return response.data.venues;
}
