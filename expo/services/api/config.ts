/**
 * API Configuration
 * Centralized configuration for all API calls
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getSecureItem, SECURE_KEYS } from '@/utils/secureStorage';

// API Base URL - should be set via environment variable
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.nox.app/v1';

// API Timeout
export const API_TIMEOUT = 30000; // 30 seconds

/**
 * Create axios instance with default configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * Request interceptor - Add authentication token to all requests
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Get auth token from secure storage
      const token = await getSecureItem(SECURE_KEYS.AUTH_TOKEN);

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // TODO: Send to error tracking service (Sentry/Bugsnag)
      console.error('Error adding auth token to request:', error);
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle common errors
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401) {
      // TODO: Implement token refresh logic
      // 1. Get refresh token from secure storage
      // 2. Call refresh token endpoint
      // 3. Update auth token in secure storage
      // 4. Retry original request

      // For now, just log the error
      // TODO: Send to error tracking service (Sentry/Bugsnag)
      console.error('Unauthorized request - token may be expired');
    }

    // Handle 403 Forbidden - User doesn't have permission
    if (error.response?.status === 403) {
      // TODO: Send to error tracking service (Sentry/Bugsnag)
      console.error('Forbidden - insufficient permissions');
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      // TODO: Send to error tracking service (Sentry/Bugsnag)
      console.error('Resource not found:', error.config?.url);
    }

    // Handle 500 Internal Server Error
    if (error.response?.status === 500) {
      // TODO: Send to error tracking service (Sentry/Bugsnag)
      console.error('Server error:', error.response.data);
    }

    // Handle network errors
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      // TODO: Send to error tracking service (Sentry/Bugsnag)
      console.error('Network error - check internet connection');
    }

    return Promise.reject(error);
  }
);

/**
 * API Error Response Types
 */
export interface ApiErrorResponse {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

/**
 * Extract error message from API error
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse;

    if (data?.message) {
      return data.message;
    }

    if (data?.errors) {
      // Return first error message
      const firstError = Object.values(data.errors)[0];
      if (firstError && firstError.length > 0) {
        return firstError[0];
      }
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

export default apiClient;
