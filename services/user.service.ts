/**
 * User Service
 * Handles all user-related API calls
 */

import { api } from './api';
import type { UserProfile } from '@/types';

export const userService = {
  async getProfile(): Promise<UserProfile> {
    return api.get<UserProfile>('/user/profile');
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    return api.put<UserProfile>('/user/profile', updates);
  },

  async createAccount(username: string, password: string): Promise<{ userId: string; token: string }> {
    return api.post<{ userId: string; token: string }>('/auth/signup', { username, password });
  },

  async login(username: string, password: string): Promise<{ userId: string; token: string }> {
    return api.post<{ userId: string; token: string }>('/auth/login', { username, password });
  },

  async logout(): Promise<{ success: boolean }> {
    return api.post<{ success: boolean }>('/auth/logout');
  },
};
