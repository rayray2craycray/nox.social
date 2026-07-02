/**
 * Payments API Service
 * Transaction history and spending summaries.
 *
 * Card storage/entry was removed in v1.0 launch prep — payment methods are
 * handled at checkout by Stripe PaymentSheet (see hooks/useTicketPurchase.ts),
 * so the app never touches raw card data.
 */

import apiClient from './config';

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  venueId: string;
  venueName: string;
  status: string;
  timestamp: string;
  cardLast4: string;
}

export interface GetTransactionsResponse {
  transactions: Transaction[];
  total: number;
  hasMore: boolean;
}

/**
 * Get transaction history
 * GET /payments/transactions
 */
export async function getTransactions(params?: {
  limit?: number;
  offset?: number;
  venueId?: string;
}): Promise<GetTransactionsResponse> {
  const response = await apiClient.get<GetTransactionsResponse>('/payments/transactions', {
    params: {
      limit: params?.limit || 50,
      offset: params?.offset || 0,
      venueId: params?.venueId,
    },
  });
  return response.data;
}

/**
 * Get transaction by ID
 * GET /payments/transactions/:transactionId
 */
export async function getTransaction(transactionId: string): Promise<Transaction> {
  const response = await apiClient.get<Transaction>(`/payments/transactions/${transactionId}`);
  return response.data;
}

/**
 * Get spending summary
 * GET /payments/summary
 */
export async function getSpendingSummary(params?: {
  startDate?: string;
  endDate?: string;
  venueId?: string;
}): Promise<{
  totalSpent: number;
  transactionCount: number;
  averageTransaction: number;
  topVenues: Array<{
    venueId: string;
    venueName: string;
    totalSpent: number;
  }>;
}> {
  const response = await apiClient.get('/payments/summary', { params });
  return response.data;
}

/**
 * Request refund for a transaction
 * POST /payments/transactions/:transactionId/refund
 */
export async function requestRefund(
  transactionId: string,
  reason: string
): Promise<{ refundId: string; status: string }> {
  const response = await apiClient.post(`/payments/transactions/${transactionId}/refund`, {
    reason,
  });
  return response.data;
}
