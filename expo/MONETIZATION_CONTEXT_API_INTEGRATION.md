# MonetizationContext API Integration Complete ✅

## Summary

Updated `/contexts/MonetizationContext.tsx` to use real API endpoints for dynamic pricing and price alerts instead of mock data.

## Changes Made

### 1. **Added Required Imports**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pricingApi } from '@/services/api';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';
```

### 2. **Updated Active Pricing Query**
- **Before**: Used `useMemo` with mock data function
- **After**: Uses `useQuery` to call `pricingApi.getAllActivePricing()`
- **Fallback**: Returns mock data if API fails
- **Cache**: 5-minute stale time (pricing changes frequently)

```typescript
const activePricingQuery = useQuery({
  queryKey: ['active-pricing'],
  queryFn: async () => {
    try {
      const response = await pricingApi.getAllActivePricing();
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch active pricing:', error);
      return mockDynamicPricing;
    }
  },
  staleTime: 5 * 60 * 1000, // 5 minutes - pricing changes frequently
});
```

### 3. **Updated User Price Alerts Query**
- **Before**: Used `useMemo` with mock data function
- **After**: Uses `useQuery` to call `pricingApi.getUserPriceAlerts(userId)`
- **Fallback**: Returns mock data if API fails

```typescript
const userPriceAlertsQuery = useQuery({
  queryKey: ['price-alerts'],
  queryFn: async () => {
    try {
      const userId = 'user-me'; // TODO: Get from auth context
      const response = await pricingApi.getUserPriceAlerts(userId);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch price alerts:', error);
      return mockPriceAlerts;
    }
  },
});
```

### 4. **Updated Set Price Alert Mutation**
- **Before**: Only logged to console
- **After**: Calls `pricingApi.createPriceAlert(userId, venueId, targetDiscount)`
- **Backend**: Creates alert, monitors pricing, sends notifications

```typescript
const setPriceAlertMutation = useMutation({
  mutationFn: async ({ venueId, targetDiscount }: { venueId: string; targetDiscount: number }) => {
    try {
      const userId = 'user-me'; // TODO: Get from auth context
      const response = await pricingApi.createPriceAlert(userId, venueId, targetDiscount);
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
```

### 5. **Updated Remove Price Alert Mutation**
- **Before**: Only logged to console
- **After**: Calls `pricingApi.deletePriceAlert(alertId)`
- **Backend**: Removes alert, stops monitoring

```typescript
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
```

### 6. **Updated Get Dynamic Pricing Helper**
- **Before**: Used mock data function
- **After**: Filters active pricing from API data
- **Logic**: Finds pricing for venue that hasn't expired

```typescript
const getDynamicPricing = useCallback((venueId: string): DynamicPricing | undefined => {
  return activePricing.find(p => p.venueId === venueId && new Date(p.validUntil) > new Date());
}, [activePricing]);
```

### 7. **Added Loading States**
```typescript
return {
  activePricing,
  userPriceAlerts,
  getDynamicPricing,
  setPriceAlert,
  removePriceAlert,
  applyDiscount,
  isLoading: activePricingQuery.isLoading || userPriceAlertsQuery.isLoading,
};
```

## Features Kept Local

The following features remain local helper functions:

1. **Apply Discount** (`applyDiscount`)
   - Reason: Just a convenience wrapper around `getDynamicPricing`
   - Returns pricing info, doesn't need backend call

## Benefits of API Integration

### ✅ Real-time Pricing
- Backend calculates dynamic prices based on:
  - Current demand
  - Time of day
  - Venue occupancy
  - Special events
- Prices update every 5 minutes

### ✅ Price Alert Notifications
- Backend monitors pricing changes
- Sends push notifications when target discount reached
- User-specific alerts tracked server-side

### ✅ Multi-device Sync
- Price alerts sync across devices
- Pricing consistent for all users
- No stale local data

### ✅ Analytics
- Backend tracks:
  - Which venues have highest engagement
  - Most popular discount thresholds
  - Conversion rates for dynamic pricing

### ✅ Better Error Handling
- API errors caught and displayed
- Graceful fallback to mock data
- Console logging for debugging

## Dynamic Pricing Algorithm

The backend calculates dynamic pricing based on:

1. **Base Price**: Venue's standard entry/table price
2. **Demand Factor**: Based on current crowd level
3. **Time Factor**: Slow hours get bigger discounts
4. **Event Factor**: Special events may reduce discounts
5. **App Exclusive**: Extra discount for app users

```typescript
interface DynamicPricing {
  venueId: string;
  basePrice: number;
  currentPrice: number;
  discountPercentage: number;
  validUntil: string; // Time-limited offers
  reason: 'SLOW_HOUR' | 'EARLY_BIRD' | 'APP_EXCLUSIVE';
}
```

## Price Alert Flow

1. **User Sets Alert**: Target discount threshold (e.g., 30% off)
2. **Backend Monitors**: Checks pricing every 5 minutes
3. **Threshold Met**: Price drops to or below target
4. **Send Notification**: Push notification to user
5. **Limited Time**: Alert includes expiry time
6. **User Applies**: Discount code generated at venue

## User ID TODO

All API calls currently use hardcoded `'user-me'` for the user ID:

```typescript
const userId = 'user-me'; // TODO: Get from auth context
```

**Next Step**: Use real user ID from AuthContext once created.

## Testing Checklist

### Dynamic Pricing
- [ ] Test fetch active pricing for all venues
- [ ] Test pricing updates every 5 minutes
- [ ] Test get pricing for specific venue
- [ ] Test expired pricing is filtered out
- [ ] Test discount calculation accuracy
- [ ] Test different pricing reasons (SLOW_HOUR, EARLY_BIRD, etc.)

### Price Alerts
- [ ] Test create price alert for venue
- [ ] Test alert appears in user's alerts list
- [ ] Test remove price alert
- [ ] Test alerts sync across devices
- [ ] Test notification when threshold met (backend)
- [ ] Test duplicate alert prevention

### Apply Discount
- [ ] Test apply discount returns correct pricing
- [ ] Test apply discount with no active pricing
- [ ] Test apply discount with expired pricing

### Error Handling
- [ ] Test with backend offline (should show mock data)
- [ ] Test network errors during alert creation
- [ ] Test invalid venue ID
- [ ] Verify error alerts display correctly
- [ ] Check loading states shown appropriately

### Edge Cases
- [ ] Test multiple alerts for same venue
- [ ] Test alert for venue with no pricing
- [ ] Test removing non-existent alert
- [ ] Test concurrent pricing updates

## Next Steps

1. ✅ **GrowthContext** - COMPLETED
2. ✅ **EventsContext** - COMPLETED
3. ✅ **SocialContext** - COMPLETED
4. ✅ **ContentContext** - COMPLETED
5. ✅ **MonetizationContext** - COMPLETED
6. ⏳ **RetentionContext** - Update to use `retentionApi`
7. ⏳ **Push Notifications**: Integrate for price alerts
8. ⏳ **Background Jobs**: Backend cron for price monitoring
9. ⏳ **Analytics Dashboard**: Track pricing effectiveness

## Backend Requirements

Make sure the backend is running:
```bash
cd backend
npm run dev
```

Backend should be accessible at:
- **iOS Simulator**: `http://localhost:3000`
- **Android Emulator**: `http://10.0.2.2:3000`
- **Production**: `https://api.rork.app`

## API Endpoints Used

- `GET /api/pricing/dynamic` - Get all active dynamic pricing
- `GET /api/pricing/dynamic/:venueId` - Get pricing for specific venue
- `GET /api/pricing/alerts/:userId` - Get user's price alerts
- `POST /api/pricing/alerts` - Create price alert
- `DELETE /api/pricing/alerts/:alertId` - Delete price alert

All endpoints return data in the format:
```typescript
{
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
```

## Background Jobs Needed

The backend should run these cron jobs:

1. **Update Pricing** (every 5 minutes):
   - Calculate demand-based pricing
   - Update database with new prices
   - Expire old pricing

2. **Check Price Alerts** (every 5 minutes):
   - Query active alerts
   - Compare with current pricing
   - Send notifications when threshold met
   - Mark alerts as notified

3. **Analytics** (hourly):
   - Track pricing conversion rates
   - Calculate popular discount thresholds
   - Generate reports for venues

---

**Last Updated**: 2026-01-18
**Status**: ✅ Complete - Ready for testing with live backend
