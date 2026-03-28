/**
 * Toast POS API Service
 * Handles Toast POS integration, locations, and spend rules
 */

import apiClient from './config';
import { ToastLocation, ToastSpendRule, ToastTransactionData } from '@/types';

/**
 * Request/Response Types
 */
export interface ConnectToastRequest {
  authorizationCode: string;
}

export interface ConnectToastResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  restaurantGuid: string;
}

export interface GetLocationsResponse {
  locations: ToastLocation[];
  total: number;
}

export interface SelectLocationsRequest {
  locationIds: string[];
}

export interface CreateSpendRuleRequest {
  venueId: string;
  threshold: number;
  tierUnlocked: string;
  serverAccessLevel: string;
  isActive: boolean;
}

export interface UpdateSpendRuleRequest {
  threshold?: number;
  tierUnlocked?: string;
  serverAccessLevel?: string;
  isActive?: boolean;
}

export interface ProcessToastTransactionRequest {
  transactionId: string;
  locationId: string;
  amount: number;
  cardToken: string;
  timestamp: string;
}

/**
 * Connect Toast POS account
 * POST /integrations/toast/connect
 *
 * This exchanges the OAuth authorization code for access/refresh tokens
 */
export async function connectToast(data: ConnectToastRequest): Promise<ConnectToastResponse> {
  const response = await apiClient.post<ConnectToastResponse>(
    '/integrations/toast/connect',
    data
  );
  return response.data;
}

/**
 * Disconnect Toast POS account
 * POST /integrations/toast/disconnect
 */
export async function disconnectToast(): Promise<void> {
  await apiClient.post('/integrations/toast/disconnect');
}

/**
 * Get Toast POS integration status
 * GET /integrations/toast/status
 */
export async function getToastStatus(): Promise<{
  isConnected: boolean;
  restaurantGuid?: string;
  connectedAt?: string;
  lastSyncAt?: string;
}> {
  const response = await apiClient.get('/integrations/toast/status');
  return response.data;
}

/**
 * Get available Toast locations
 * GET /integrations/toast/locations
 */
export async function getToastLocations(): Promise<GetLocationsResponse> {
  const response = await apiClient.get<GetLocationsResponse>('/integrations/toast/locations');
  return response.data;
}

/**
 * Select Toast locations to sync
 * POST /integrations/toast/locations/select
 */
export async function selectToastLocations(data: SelectLocationsRequest): Promise<void> {
  await apiClient.post('/integrations/toast/locations/select', data);
}

/**
 * Get selected locations
 * GET /integrations/toast/locations/selected
 */
export async function getSelectedLocations(): Promise<{ locationIds: string[] }> {
  const response = await apiClient.get<{ locationIds: string[] }>(
    '/integrations/toast/locations/selected'
  );
  return response.data;
}

/**
 * Get spend rules for a venue
 * GET /integrations/toast/rules
 */
export async function getSpendRules(venueId?: string): Promise<{ rules: ToastSpendRule[] }> {
  const response = await apiClient.get<{ rules: ToastSpendRule[] }>(
    '/integrations/toast/rules',
    {
      params: { venueId },
    }
  );
  return response.data;
}

/**
 * Create a new spend rule
 * POST /integrations/toast/rules
 */
export async function createSpendRule(data: CreateSpendRuleRequest): Promise<ToastSpendRule> {
  const response = await apiClient.post<ToastSpendRule>('/integrations/toast/rules', data);
  return response.data;
}

/**
 * Update a spend rule
 * PATCH /integrations/toast/rules/:ruleId
 */
export async function updateSpendRule(
  ruleId: string,
  data: UpdateSpendRuleRequest
): Promise<ToastSpendRule> {
  const response = await apiClient.patch<ToastSpendRule>(
    `/integrations/toast/rules/${ruleId}`,
    data
  );
  return response.data;
}

/**
 * Delete a spend rule
 * DELETE /integrations/toast/rules/:ruleId
 */
export async function deleteSpendRule(ruleId: string): Promise<void> {
  await apiClient.delete(`/integrations/toast/rules/${ruleId}`);
}

/**
 * Process a Toast transaction (webhook endpoint called by backend)
 * POST /integrations/toast/transactions
 */
export async function processToastTransaction(
  data: ProcessToastTransactionRequest
): Promise<{
  success: boolean;
  ruleTriggered?: ToastSpendRule;
  notification?: string;
}> {
  const response = await apiClient.post('/integrations/toast/transactions', data);
  return response.data;
}

/**
 * Get transaction history from Toast
 * GET /integrations/toast/transactions
 */
export async function getToastTransactions(params?: {
  venueId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  transactions: ToastTransactionData[];
  total: number;
  hasMore: boolean;
}> {
  const response = await apiClient.get('/integrations/toast/transactions', { params });
  return response.data;
}

/**
 * Get venue revenue from Toast transactions
 * GET /integrations/toast/revenue
 */
export async function getVenueRevenue(venueId: string): Promise<{
  totalRevenue: number;
  transactionCount: number;
  averageTransaction: number;
}> {
  const response = await apiClient.get('/integrations/toast/revenue', {
    params: { venueId },
  });
  return response.data;
}

/**
 * Sync Toast data manually
 * POST /integrations/toast/sync
 */
export async function syncToastData(): Promise<{
  synced: boolean;
  lastSyncAt: string;
}> {
  const response = await apiClient.post('/integrations/toast/sync');
  return response.data;
}
