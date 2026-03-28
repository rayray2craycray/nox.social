/**
 * Contacts API Service
 * Handles contact syncing and matching with app users
 */

import apiClient from './config';

/**
 * Request/Response Types
 */
export interface SyncContactsRequest {
  contacts: Array<{
    name: string;
    phoneNumbers: string[];
  }>;
}

export interface ContactMatch {
  contactId: string;
  name: string;
  phoneNumber: string;
  userId: string; // App user ID
  displayName: string;
  avatarUrl?: string;
  mutualFriends: number;
}

export interface SyncContactsResponse {
  matches: ContactMatch[];
  syncedAt: string;
  totalContacts: number;
  matchedCount: number;
}

export interface GetContactsStatusResponse {
  isSynced: boolean;
  lastSyncAt?: string;
  totalSynced?: number;
  matchedCount?: number;
}

/**
 * Sync contacts with backend to find app users
 * POST /contacts/sync
 *
 * Privacy considerations:
 * - Backend should hash phone numbers before storage
 * - Backend should not store raw contact data
 * - Users should be able to opt out of contact discovery
 */
export async function syncContacts(data: SyncContactsRequest): Promise<SyncContactsResponse> {
  const response = await apiClient.post<SyncContactsResponse>('/contacts/sync', data);
  return response.data;
}

/**
 * Get contact sync status
 * GET /contacts/status
 */
export async function getContactsStatus(): Promise<GetContactsStatusResponse> {
  const response = await apiClient.get<GetContactsStatusResponse>('/contacts/status');
  return response.data;
}

/**
 * Get contact matches (friends on the app)
 * GET /contacts/matches
 */
export async function getContactMatches(): Promise<{ matches: ContactMatch[] }> {
  const response = await apiClient.get<{ matches: ContactMatch[] }>('/contacts/matches');
  return response.data;
}

/**
 * Delete synced contacts
 * DELETE /contacts/sync
 */
export async function deleteSyncedContacts(): Promise<void> {
  await apiClient.delete('/contacts/sync');
}

/**
 * Update contact sync preferences
 * POST /contacts/preferences
 */
export async function updateContactPreferences(preferences: {
  allowDiscovery: boolean;
  syncEnabled: boolean;
}): Promise<void> {
  await apiClient.post('/contacts/preferences', preferences);
}

/**
 * Get contact sync preferences
 * GET /contacts/preferences
 */
export async function getContactPreferences(): Promise<{
  allowDiscovery: boolean;
  syncEnabled: boolean;
}> {
  const response = await apiClient.get('/contacts/preferences');
  return response.data;
}
