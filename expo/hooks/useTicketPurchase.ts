/**
 * useTicketPurchase
 *
 * Stripe-backed ticket purchase flow. Replaces the legacy
 * EventsContext.purchaseTicket which accepted any client-supplied
 * transactionId without payment validation.
 *
 * Flow:
 *   1. POST /api/payments/intent → backend creates Stripe PaymentIntent
 *      + a PENDING Ticket, returns clientSecret + ticketId
 *   2. initPaymentSheet({ paymentIntentClientSecret, applePay })
 *   3. presentPaymentSheet() — user sees the native Stripe sheet with
 *      Apple Pay button (if device supports it)
 *   4. On success, the backend's webhook handler will mark the ticket
 *      PAID asynchronously. Frontend trusts the SDK's success response
 *      and refetches the user's tickets list shortly after.
 */

import { useCallback, useState } from 'react';
import { useStripe } from '@stripe/stripe-react-native';
import apiClient from '@/services/api/config';

export type PurchaseResult =
  | { ok: true; ticketId: string }
  | { ok: false; reason: 'canceled' | 'failed'; message?: string };

interface IntentResponse {
  success: boolean;
  data?: {
    clientSecret: string;
    ticketId: string;
    paymentIntentId: string;
  };
  error?: string;
  message?: string;
}

export function useTicketPurchase() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const purchase = useCallback(
    async (eventId: string, tierId: string): Promise<PurchaseResult> => {
      setIsPurchasing(true);
      try {
        // 1. Get clientSecret + reserved ticket from our backend.
        // apiClient is an Axios instance — .data unwraps the response body.
        const resp = await apiClient.post<IntentResponse>(
          '/payments/intent',
          { eventId, tierId },
        );
        const body = resp.data;
        if (!body?.success || !body.data) {
          return {
            ok: false,
            reason: 'failed',
            message: body?.error || body?.message || 'Could not start checkout',
          };
        }
        const { clientSecret, ticketId } = body.data;

        // 2. Initialize the Stripe PaymentSheet (native UI with Apple Pay)
        const initResult = await initPaymentSheet({
          paymentIntentClientSecret: clientSecret,
          merchantDisplayName: 'Nox Nightlife',
          applePay: { merchantCountryCode: 'US' },
          // googlePay deferred to v1.1 — disabled in app.config.js plugin too
          allowsDelayedPaymentMethods: false,
          returnURL: 'nox://payments/return',
        });
        if (initResult.error) {
          return {
            ok: false,
            reason: 'failed',
            message: initResult.error.message,
          };
        }

        // 3. Present the sheet — user picks Apple Pay or card, confirms
        const presentResult = await presentPaymentSheet();
        if (presentResult.error) {
          const isCancel = presentResult.error.code === 'Canceled';
          return {
            ok: false,
            reason: isCancel ? 'canceled' : 'failed',
            message: presentResult.error.message,
          };
        }

        // 4. Sheet says success. Backend's webhook will mark PAID shortly
        // (usually within seconds). Caller should refetch tickets.
        return { ok: true, ticketId };
      } catch (err: any) {
        return {
          ok: false,
          reason: 'failed',
          message: err?.message || 'Unknown payment error',
        };
      } finally {
        setIsPurchasing(false);
      }
    },
    [initPaymentSheet, presentPaymentSheet],
  );

  return { purchase, isPurchasing };
}
