/**
 * Authentication API Service
 * Handles user authentication, registration, and token management
 */

import apiClient from './config';
import { setSecureItem, getSecureItem, deleteSecureItem, SECURE_KEYS } from '@/utils/secureStorage';

/**
 * Request/Response Types
 */
export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
  displayName?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    email?: string;
    avatarUrl?: string;
    role: string;
    isVerified: boolean;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * Register a new user account
 * POST /auth/register
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/register', data);

  // Store tokens securely
  await setSecureItem(SECURE_KEYS.AUTH_TOKEN, response.data.accessToken);
  await setSecureItem(SECURE_KEYS.REFRESH_TOKEN, response.data.refreshToken);

  return response.data;
}

/**
 * Login with username and password
 * POST /auth/login
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/login', data);

  // Store tokens securely
  await setSecureItem(SECURE_KEYS.AUTH_TOKEN, response.data.accessToken);
  await setSecureItem(SECURE_KEYS.REFRESH_TOKEN, response.data.refreshToken);

  return response.data;
}

/**
 * Logout - Clear stored tokens
 * POST /auth/logout
 */
export async function logout(): Promise<void> {
  try {
    // Call backend to invalidate tokens (optional)
    await apiClient.post('/auth/logout');
  } catch (error) {
    // Even if API call fails, clear local tokens
    // TODO: Send to error tracking service (Sentry/Bugsnag)
    console.error('Logout API call failed:', error);
  } finally {
    // Clear tokens from secure storage
    await deleteSecureItem(SECURE_KEYS.AUTH_TOKEN);
    await deleteSecureItem(SECURE_KEYS.REFRESH_TOKEN);
  }
}

/**
 * Refresh access token
 * POST /auth/refresh
 */
export async function refreshToken(): Promise<RefreshTokenResponse> {
  const refreshToken = await getSecureItem(SECURE_KEYS.REFRESH_TOKEN);

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh', {
    refreshToken,
  });

  // Update tokens in secure storage
  await setSecureItem(SECURE_KEYS.AUTH_TOKEN, response.data.accessToken);
  await setSecureItem(SECURE_KEYS.REFRESH_TOKEN, response.data.refreshToken);

  return response.data;
}

/**
 * Verify user email
 * POST /auth/verify-email
 */
export async function verifyEmail(token: string): Promise<void> {
  await apiClient.post('/auth/verify-email', { token });
}

/**
 * Request password reset
 * POST /auth/forgot-password
 */
export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post('/auth/forgot-password', { email });
}

/**
 * Reset password with token
 * POST /auth/reset-password
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiClient.post('/auth/reset-password', {
    token,
    newPassword,
  });
}

/**
 * Change password (when logged in)
 * POST /auth/change-password
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await apiClient.post('/auth/change-password', {
    currentPassword,
    newPassword,
  });
}

/**
 * Delete account
 * DELETE /auth/account
 */
export async function deleteAccount(password: string): Promise<void> {
  await apiClient.delete('/auth/account', {
    data: { password },
  });

  // Clear tokens after deletion
  await deleteSecureItem(SECURE_KEYS.AUTH_TOKEN);
  await deleteSecureItem(SECURE_KEYS.REFRESH_TOKEN);
}
