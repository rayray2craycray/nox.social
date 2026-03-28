import createContextHook from '@nkzw/create-context-hook';
import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DynamicPricing, PriceAlert } from '@/types';
import { pricingApi } from '@/services/api';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';

export const [MonetizationProvider, useMonetization] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  // ===== QUERIES =====
  const activePricingQuery = useQuery({
    queryKey: ['active-pricing'],
    queryFn: async () => {
      try {
        const response = await pricingApi.getAllActivePricing();
        return response.data || [];
      } catch (error) {
        // Silently handle missing endpoint
        if (__DEV__) console.log('[Monetization] Endpoint not implemented: active pricing');
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - pricing changes frequently
  });

  const userPriceAlertsQuery = useQuery({
    queryKey: ['price-alerts'],
    queryFn: async () => {
      if (!userId) return [];
      try {
        // Use userId from auth context
        const response = await pricingApi.getUserPriceAlerts(userId);
        return response.data || [];
      } catch (error) {
        // Silently handle missing endpoint
        if (__DEV__) console.log('[Monetization] Endpoint not implemented: price alerts');
        return [];
      }
    },
  });

  const activePricing = useMemo(() => activePricingQuery.data || [], [activePricingQuery.data]);
  const userPriceAlerts = useMemo(() => userPriceAlertsQuery.data || [], [userPriceAlertsQuery.data]);

  // ===== MUTATIONS =====
  const setPriceAlertMutation = useMutation({
    mutationFn: async ({ venueId, targetDiscount }: { venueId: string; targetDiscount: number }) => {
      if (!userId) throw new Error('User not authenticated');
      try {
        // Use userId from auth context
        const response = await pricingApi.createPriceAlert({ userId, venueId, targetDiscount });
        return response.data!;
      } catch (error) {
        console.error('Failed to set price alert:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-alerts'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Price Alert Set!', 'We\'ll notify you when the price drops.');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to set price alert');
    },
  });

  const removePriceAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      try {
        const response = await pricingApi.deletePriceAlert(alertId);
        return response.data!;
      } catch (error) {
        console.error('Failed to remove price alert:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-alerts'] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to remove price alert');
    },
  });

  const getDynamicPricing = useCallback((venueId: string): DynamicPricing | undefined => {
    return activePricing.find(p => p.venueId === venueId && new Date(p.validUntil) > new Date());
  }, [activePricing]);

  const setPriceAlert = useCallback((venueId: string, targetDiscount: number) => {
    setPriceAlertMutation.mutate({ venueId, targetDiscount });
  }, [setPriceAlertMutation]);

  const removePriceAlert = useCallback((alertId: string) => {
    removePriceAlertMutation.mutate(alertId);
  }, [removePriceAlertMutation]);

  const applyDiscount = useCallback((venueId: string) => {
    const pricing = getDynamicPricing(venueId);
    if (pricing) {
      console.log(`Applied ${pricing.discountPercentage}% discount at venue ${venueId}`);
      return pricing;
    }
    return null;
  }, [getDynamicPricing]);

  return {
    activePricing,
    userPriceAlerts,
    getDynamicPricing,
    setPriceAlert,
    removePriceAlert,
    applyDiscount,
    isLoading: activePricingQuery.isLoading || userPriceAlertsQuery.isLoading,
  };
});
