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
  const response = await apiClient.get<SearchUsersResponse>('/users/search', {
    params: {
      q: params.query,
      limit: params.limit || 20,
      offset: params.offset || 0,
    },
  });
  return response.data;
}

/**
 * Get user's friends list
 * GET /users/me/friends
 */
export async function getFriends(params?: GetFriendsRequest): Promise<GetFriendsResponse> {
  const response = await apiClient.get<GetFriendsResponse>('/users/me/friends', {
    params: {
      limit: params?.limit || 50,
      offset: params?.offset || 0,
    },
  });
  return response.data;
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
 * Send friend request
 * POST /users/:userId/follow
 */
export async function followUser(userId: string): Promise<void> {
  await apiClient.post(`/users/${userId}/follow`);
}

/**
 * Unfollow user
 * DELETE /users/:userId/follow
 */
export async function unfollowUser(userId: string): Promise<void> {
  await apiClient.delete(`/users/${userId}/follow`);
}

/**
 * Block user
 * POST /users/:userId/block
 */
export async function blockUser(userId: string): Promise<void> {
  await apiClient.post(`/users/${userId}/block`);
}

/**
 * Unblock user
 * DELETE /users/:userId/block
 */
export async function unblockUser(userId: string): Promise<void> {
  await apiClient.delete(`/users/${userId}/block`);
}

/**
 * Get blocked users list
 * GET /users/me/blocked
 */
export async function getBlockedUsers(): Promise<FriendProfile[]> {
  const response = await apiClient.get<{ users: FriendProfile[] }>('/users/me/blocked');
  return response.data.users;
}

/**
 * Upload user avatar
 * POST /users/me/avatar
 */
export async function uploadAvatar(imageUri: string): Promise<{ avatarUrl: string }> {
  // Create FormData for file upload
  const formData = new FormData();
  formData.append('avatar', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'avatar.jpg',
  } as any);

  const response = await apiClient.post<{ avatarUrl: string }>('/users/me/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

/**
 * Delete user avatar
 * DELETE /users/me/avatar
 */
export async function deleteAvatar(): Promise<void> {
  await apiClient.delete('/users/me/avatar');
}
