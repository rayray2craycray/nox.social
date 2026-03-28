/**
 * Payments API Service
 * Handles payment cards, transactions, and spend rules
 */

import apiClient from './config';
import { LinkedCard } from '@/contexts/AppStateContext';

/**
 * Request/Response Types
 */
export interface AddCardRequest {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
  billingZip?: string;
}

export interface AddCardResponse {
  card: LinkedCard;
}

export interface ProcessPaymentRequest {
  cardId: string;
  amount: number;
  currency: string;
  venueId: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface ProcessPaymentResponse {
  transactionId: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  amount: number;
  currency: string;
  timestamp: string;
}

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
 * Get user's linked cards
 * GET /payments/cards
 */
export async function getLinkedCards(): Promise<{ cards: LinkedCard[] }> {
  const response = await apiClient.get<{ cards: LinkedCard[] }>('/payments/cards');
  return response.data;
}

/**
 * Add a new payment card
 * POST /payments/cards
 *
 * IMPORTANT: In production, never send raw card data to your backend.
 * Use a PCI-compliant payment processor like Stripe, Square, or Toast.
 *
 * Implementation should:
 * 1. Use payment processor's SDK to tokenize card data on client
 * 2. Send only the token to your backend
 * 3. Backend stores the token reference, never raw card data
 */
export async function addCard(data: AddCardRequest): Promise<AddCardResponse> {
  // TODO: Replace with payment processor tokenization
  // Example for Stripe:
  // const token = await stripe.createToken({ card: data });
  // const response = await apiClient.post('/payments/cards', { token: token.id });

  const response = await apiClient.post<AddCardResponse>('/payments/cards', {
    // In production, send token instead of raw card data
    token: 'card_token_from_payment_processor',
    cardholderName: data.cardholderName,
    billingZip: data.billingZip,
  });

  return response.data;
}

/**
 * Remove a payment card
 * DELETE /payments/cards/:cardId
 */
export async function removeCard(cardId: string): Promise<void> {
  await apiClient.delete(`/payments/cards/${cardId}`);
}

/**
 * Set default payment card
 * POST /payments/cards/:cardId/default
 */
export async function setDefaultCard(cardId: string): Promise<void> {
  await apiClient.post(`/payments/cards/${cardId}/default`);
}

/**
 * Process a payment
 * POST /payments/process
 */
export async function processPayment(data: ProcessPaymentRequest): Promise<ProcessPaymentResponse> {
  const response = await apiClient.post<ProcessPaymentResponse>('/payments/process', data);
  return response.data;
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
