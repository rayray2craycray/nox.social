/**
 * Users API Service
 * Handles user profile, friends, and social features
 */

import apiClient from './config';
import { UserProfile, FriendProfile } from '@/types';

/**
 * Request/Response Types
 */
export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  isIncognito?: boolean;
}

export interface SearchUsersRequest {
  query: string;
  limit?: number;
  offset?: number;
}

export interface SearchUsersResponse {
  users: FriendProfile[];
  total: number;
  hasMore: boolean;
}

export interface GetFriendsRequest {
  limit?: number;
  offset?: number;
}

export interface GetFriendsResponse {
  friends: FriendProfile[];
  total: number;
  hasMore: boolean;
}

export interface GetSuggestionsRequest {
  includeContacts?: boolean;
  includeInstagram?: boolean;
  includeMutualFriends?: boolean;
  limit?: number;
}

export interface GetSuggestionsResponse {
  suggestions: FriendProfile[];
  total: number;
}

/**
 * Get current user profile
 * GET /users/me
 */
export async function getCurrentUser(): Promise<UserProfile> {
  const response = await apiClient.get<UserProfile>('/users/me');
  return response.data;
}

/**
 * Update current user profile
 * PATCH /users/me
 */
export async function updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
  const response = await apiClient.patch<UserProfile>('/users/me', data);
  return response.data;
}

/**
 * Get user profile by ID
 * GET /users/:userId
 */
export async function getUserById(userId: string): Promise<UserProfile> {
  const response = await apiClient.get<UserProfile>(`/users/${userId}`);
  return response.data;
}

/**
 * Search users by username or display name
 * GET /users/search
 */
export async function searchUsers(params: SearchUsersRequest): Promise<SearchUsersResponse> {
  const response = await apiClient.get<{ success: boolean; data?: FriendProfile[]; users?: FriendProfile[] }>(
    '/social/users/search',
    {
      params: {
        q: params.query,
        limit: params.limit || 20,
      },
    }
  );
  const users = response.data?.users || response.data?.data || [];
  return { users } as SearchUsersResponse;
}

/**
 * Get user's friends list
 * GET /social/friends  (the /users/* routes were removed in v1.0 prep)
 * Backend returns { success, data: FriendProfile[], friends: FriendProfile[] }.
 */
export async function getFriends(params?: GetFriendsRequest): Promise<GetFriendsResponse> {
  const response = await apiClient.get<{ success: boolean; data?: FriendProfile[]; friends?: FriendProfile[] }>(
    '/social/friends',
    {
      params: {
        limit: params?.limit || 50,
        offset: params?.offset || 0,
      },
    }
  );
  const friends = response.data?.friends || response.data?.data || [];
  return { friends } as GetFriendsResponse;
}

/**
 * Get friend suggestions
 * GET /users/me/suggestions
 */
export async function getSuggestions(
  params?: GetSuggestionsRequest
): Promise<GetSuggestionsResponse> {
  const response = await apiClient.get<GetSuggestionsResponse>('/users/me/suggestions', {
    params: {
      contacts: params?.includeContacts ?? true,
      instagram: params?.includeInstagram ?? true,
      mutualFriends: params?.includeMutualFriends ?? true,
      limit: params?.limit || 20,
    },
  });
  return response.data;
}

/**
 * Follow a user (one-tap; backend models it as an accepted friendship).
 * POST /social/follow/:userId
 */
export async function followUser(userId: string): Promise<void> {
  await apiClient.post(`/social/follow/${userId}`);
}

/**
 * Unfollow user.
 * DELETE /social/follow/:userId
 */
export async function unfollowUser(userId: string): Promise<void> {
  await apiClient.delete(`/social/follow/${userId}`);
}

/**
 * Block user.
 * POST /moderation/block  { userId }
 */
export async function blockUser(userId: string): Promise<void> {
  await apiClient.post('/moderation/block', { userId });
}

/**
 * Unblock user.
 * DELETE /moderation/block/:userId
 */
export async function unblockUser(userId: string): Promise<void> {
  await apiClient.delete(`/moderation/block/${userId}`);
}

/**
 * Get blocked users list.
 * GET /moderation/blocked
 */
export async function getBlockedUsers(): Promise<FriendProfile[]> {
  const response = await apiClient.get<{ success: boolean; data?: FriendProfile[]; users?: FriendProfile[] }>(
    '/moderation/blocked'
  );
  return response.data?.data || response.data?.users || [];
}

/**
 * Upload user avatar
 * POST /users/me/avatar
 */
export async function uploadAvatar(imageUri: string): Promise<{ avatarUrl: string }> {
  // Backend: POST /upload/profile-picture, field 'image', returns { data: { url } }.
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'avatar.jpg',
  } as any);

  const response = await apiClient.post<{ success: boolean; data?: { url: string } }>(
    '/upload/profile-picture',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );

  return { avatarUrl: response.data?.data?.url || '' };
}

/**
 * Delete user avatar
 * DELETE /users/me/avatar
 */
export async function deleteAvatar(): Promise<void> {
  await apiClient.delete('/users/me/avatar');
}
