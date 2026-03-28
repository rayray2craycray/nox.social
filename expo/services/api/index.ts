/**
 * API Services Index
 * Central export point for all API services
 */

// Configuration
export { default as apiClient, API_BASE_URL, getErrorMessage } from './config';
export type { ApiErrorResponse } from './config';

// Authentication
export * from './auth.service';

// Users
export * from './users.service';

// Venues
export * from './venues.service';

// Payments
export * from './payments.service';

// Toast POS Integration
export * from './toast.service';

// Instagram Integration
export * from './instagram.service';

// Contacts
export * from './contacts.service';
