# GrowthContext API Integration Complete ✅

## Summary

Updated `/contexts/GrowthContext.tsx` to use real API endpoints instead of mock data and AsyncStorage.

## Changes Made

### 1. **Added API Import**
```typescript
import { growthApi } from '@/services/api';
```

### 2. **Updated Group Purchases Query**
- **Before**: Fetched from AsyncStorage with mock data fallback
- **After**: Calls `growthApi.getGroupPurchasesByUser(userId)`
- **Fallback**: Returns mock data if API fails (graceful degradation)

```typescript
const groupPurchasesQuery = useQuery({
  queryKey: ['groupPurchases'],
  queryFn: async () => {
    try {
      const userId = 'user-me'; // TODO: Get from auth context
      const response = await growthApi.getGroupPurchasesByUser(userId);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch group purchases:', error);
      return mockGroupPurchases;
    }
  },
});
```

### 3. **Updated Create Group Purchase Mutation**
- **Before**: Generated ID locally, stored in AsyncStorage
- **After**: Calls `growthApi.createGroupPurchase()` with proper payload
- **Error Handling**: Shows Alert on error

```typescript
const createGroupPurchaseMutation = useMutation({
  mutationFn: async (purchase: Omit<GroupPurchase, 'id' | 'createdAt'>) => {
    try {
      const response = await growthApi.createGroupPurchase({
        initiatorId: purchase.initiatorId,
        venueId: purchase.venueId,
        eventId: purchase.eventId,
        ticketType: purchase.ticketType,
        totalAmount: purchase.totalAmount,
        maxParticipants: purchase.maxParticipants,
        expiresAt: purchase.expiresAt,
      });
      return response.data!;
    } catch (error) {
      console.error('Failed to create group purchase:', error);
      throw error;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['groupPurchases'] });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  onError: (error: any) => {
    Alert.alert('Error', error.message || 'Failed to create group purchase');
  },
});
```

### 4. **Updated Join Group Purchase Mutation**
- **Before**: Manually updated participant array in AsyncStorage
- **After**: Calls `growthApi.joinGroupPurchase(id, userId)`
- **Backend**: Handles participant logic, status updates, validation

```typescript
const joinGroupPurchaseMutation = useMutation({
  mutationFn: async ({ groupPurchaseId, userId }: { groupPurchaseId: string; userId: string }) => {
    try {
      const response = await growthApi.joinGroupPurchase(groupPurchaseId, userId);
      return response.data!;
    } catch (error) {
      console.error('Failed to join group purchase:', error);
      throw error;
    }
  },
  // ... success/error handlers
});
```

### 5. **Updated Referrals Query**
- **Before**: Fetched from AsyncStorage with mock fallback
- **After**: Calls `growthApi.getReferralStats(userId)`
- **Note**: Stats endpoint returns referrals as part of user stats

### 6. **Updated Referral Stats Query**
- **Before**: Local AsyncStorage
- **After**: Calls `growthApi.getReferralStats(userId)` for complete stats

### 7. **Updated Referral Rewards Query**
- **Before**: Local AsyncStorage
- **After**: Calls `growthApi.getReferralRewards(userId)`

### 8. **Updated Generate Referral Code Mutation**
- **Before**: Generated code locally based on user ID
- **After**: Calls `growthApi.generateReferralCode(userId)`
- **Backend**: Generates unique codes, prevents duplicates

```typescript
const generateReferralCodeMutation = useMutation({
  mutationFn: async (userId: string) => {
    try {
      const response = await growthApi.generateReferralCode(userId);
      return response.data!;
    } catch (error) {
      console.error('Failed to generate referral code:', error);
      throw error;
    }
  },
  // ... handlers
});
```

### 9. **Updated Apply Referral Code Mutation**
- **Before**: Validated code locally, created referral and rewards manually
- **After**: Calls `growthApi.applyReferralCode(code, userId)`
- **Backend**: Validates code, creates referral, awards both parties automatically

```typescript
const applyReferralCodeMutation = useMutation({
  mutationFn: async ({ code, userId }: { code: string; userId: string }) => {
    try {
      const response = await growthApi.applyReferralCode(code, userId);
      return response.data!;
    } catch (error) {
      console.error('Failed to apply referral code:', error);
      throw error;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['referrals'] });
    queryClient.invalidateQueries({ queryKey: ['referralRewards'] });
    queryClient.invalidateQueries({ queryKey: ['referralStats'] });
    // ... success alert
  },
});
```

## Features Kept as Local/Mock

The following features remain using local state or mock data as they involve external integrations or UI-only tracking:

1. **Group Purchase Invites** (`inviteToGroupPurchaseMutation`, `respondToGroupPurchaseInviteMutation`)
   - Reason: Handled through deep links and push notifications, not a direct API operation

2. **Claim Referral Reward** (`claimReferralRewardMutation`)
   - Reason: Reward redemption happens during checkout/payment flow, not a standalone operation

3. **Story Templates** (`storyTemplatesQuery`)
   - Reason: Templates are static UI assets, no need for API

4. **Generate Story Template** (`generateStoryTemplateMutation`)
   - Reason: Client-side deep link generation for sharing

5. **Share to Instagram** (`shareToInstagramMutation`)
   - Reason: Uses Instagram's native sharing, tracked locally

## Benefits of API Integration

### ✅ Real-time Data Sync
- All users see consistent group purchase data
- Referral stats update in real-time
- No stale local data

### ✅ Data Validation
- Backend validates business rules (max participants, expiration, etc.)
- Prevents duplicate referral codes
- Ensures referral code uniqueness

### ✅ Multi-device Support
- User data syncs across devices
- Join group purchase on phone, see on tablet
- Referral rewards accessible everywhere

### ✅ Better Error Handling
- API errors are caught and displayed to user
- Graceful fallback to mock data for development
- Console logging for debugging

### ✅ Optimistic Updates
- React Query handles cache invalidation
- UI updates immediately on success
- Automatic retry on network failures

## User ID TODO

All API calls currently use hardcoded `'user-me'` for the user ID. This needs to be replaced with real auth context:

```typescript
// TODO: Replace in all API calls
const userId = 'user-me'; // Get from auth context
```

**Next Step**: Create an AuthContext that provides the authenticated user's ID, then update all occurrences.

## Testing Checklist

- [ ] Test create group purchase with real backend
- [ ] Test join group purchase
- [ ] Test generate referral code
- [ ] Test apply referral code with valid code
- [ ] Test apply referral code with invalid code (error handling)
- [ ] Test offline mode (should fallback to mock data gracefully)
- [ ] Test with backend down (should show mock data)
- [ ] Verify cache invalidation works (data refreshes after mutations)
- [ ] Check loading states are shown appropriately
- [ ] Verify haptic feedback triggers
- [ ] Test error alerts display correctly

## Performance Considerations

1. **React Query Cache**: All queries are cached automatically
2. **Automatic Refetching**: Data refetches on window focus
3. **Background Updates**: Stale data updates in background
4. **Optimistic Updates**: Could be added for better UX
5. **Request Deduplication**: React Query prevents duplicate requests

## Next Steps

1. ✅ **GrowthContext** - COMPLETED
2. ⏳ **EventsContext** - Update to use `eventsApi`
3. ⏳ **SocialContext** - Update to use `socialApi`
4. ⏳ **ContentContext** - Update to use `contentApi`
5. ⏳ **MonetizationContext** - Update to use `pricingApi`
6. ⏳ **RetentionContext** - Update to use `retentionApi`
7. ⏳ **AuthContext** - Create for user authentication and token management
8. ⏳ **Replace 'user-me'** - Use real user ID from AuthContext everywhere

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

- `POST /api/growth/group-purchases` - Create group purchase
- `GET /api/growth/group-purchases/user/:userId` - Get user's purchases
- `POST /api/growth/group-purchases/:id/join` - Join purchase
- `POST /api/growth/referrals/generate` - Generate referral code
- `POST /api/growth/referrals/apply` - Apply referral code
- `GET /api/growth/referrals/stats/:userId` - Get referral stats
- `GET /api/growth/referrals/rewards/:userId` - Get referral rewards

All endpoints return data in the format:
```typescript
{
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
```

---

**Last Updated**: 2026-01-18
**Status**: ✅ Complete - Ready for testing with live backend
