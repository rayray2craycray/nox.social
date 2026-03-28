/**
 * Instagram API Service
 * Handles Instagram OAuth and friend matching
 */

import apiClient from './config';

/**
 * Request/Response Types
 */
export interface ExchangeInstagramCodeRequest {
  authorizationCode: string;
}

export interface ExchangeInstagramCodeResponse {
  accessToken: string;
  userId: string;
  username: string;
  expiresIn: number;
}

export interface SyncInstagramRequest {
  accessToken: string;
  userId: string;
}

export interface InstagramMatch {
  instagramId: string;
  instagramUsername: string;
  userId: string; // App user ID
  displayName: string;
  avatarUrl?: string;
  mutualFriends: number;
}

export interface SyncInstagramResponse {
  matches: InstagramMatch[];
  syncedAt: string;
  totalFollowing: number;
  matchedCount: number;
}

export interface GetInstagramStatusResponse {
  isConnected: boolean;
  username?: string;
  connectedAt?: string;
  lastSyncAt?: string;
  matchedCount?: number;
}

/**
 * Exchange Instagram authorization code for access token
 * POST /integrations/instagram/exchange
 *
 * The backend handles this to keep client_secret secure
 */
export async function exchangeInstagramCode(
  authorizationCode: string
): Promise<ExchangeInstagramCodeResponse> {
  const response = await apiClient.post<ExchangeInstagramCodeResponse>(
    '/integrations/instagram/exchange',
    { authorizationCode }
  );
  return response.data;
}

/**
 * Sync Instagram following with app to find matches
 * POST /integrations/instagram/sync
 *
 * Backend will:
 * 1. Fetch user's Instagram following list using provided token
 * 2. Match Instagram accounts with app user accounts
 * 3. Return list of matches for friend suggestions
 */
export async function syncInstagram(data: SyncInstagramRequest): Promise<SyncInstagramResponse> {
  const response = await apiClient.post<SyncInstagramResponse>(
    '/integrations/instagram/sync',
    data
  );
  return response.data;
}

/**
 * Get Instagram integration status
 * GET /integrations/instagram/status
 */
export async function getInstagramStatus(): Promise<GetInstagramStatusResponse> {
  const response = await apiClient.get<GetInstagramStatusResponse>(
    '/integrations/instagram/status'
  );
  return response.data;
}

/**
 * Disconnect Instagram account
 * POST /integrations/instagram/disconnect
 */
export async function disconnectInstagram(): Promise<void> {
  await apiClient.post('/integrations/instagram/disconnect');
}

/**
 * Get Instagram matches (friends on the app)
 * GET /integrations/instagram/matches
 */
export async function getInstagramMatches(): Promise<{ matches: InstagramMatch[] }> {
  const response = await apiClient.get<{ matches: InstagramMatch[] }>(
    '/integrations/instagram/matches'
  );
  return response.data;
}

/**
 * Refresh Instagram token
 * POST /integrations/instagram/refresh
 *
 * Instagram tokens expire after 60 days
 * This endpoint refreshes the token to extend its validity
 */
export async function refreshInstagramToken(): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const response = await apiClient.post('/integrations/instagram/refresh');
  return response.data;
}
