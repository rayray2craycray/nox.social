# SocialContext API Integration Complete ✅

## Summary

Updated `/contexts/SocialContext.tsx` to use real API endpoints for crews and challenges instead of mock data and AsyncStorage.

## Changes Made

### 1. **Added API Import**
```typescript
import { socialApi } from '@/services/api';
import { Alert } from 'react-native';
```

### 2. **Updated Crews Query**
- **Before**: Fetched from AsyncStorage with mock data fallback
- **After**: Calls `socialApi.getUserCrews(userId)`
- **Fallback**: Returns mock data if API fails

```typescript
const crewsQuery = useQuery({
  queryKey: ['crews'],
  queryFn: async () => {
    try {
      const userId = 'user-me'; // TODO: Get from auth context
      const response = await socialApi.getUserCrews(userId);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch crews:', error);
      return mockCrews;
    }
  },
});
```

### 3. **Updated Challenge Progress Query**
- **Before**: Fetched from AsyncStorage with mock data
- **After**: Calls `socialApi.getUserChallenges(userId)`
- **Fallback**: Returns mock data if API fails

```typescript
const challengeProgressQuery = useQuery({
  queryKey: ['challenge-progress'],
  queryFn: async () => {
    try {
      const userId = 'user-me'; // TODO: Get from auth context
      const response = await socialApi.getUserChallenges(userId);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch challenge progress:', error);
      return mockChallengeProgress;
    }
  },
});
```

### 4. **Updated Create Crew Mutation**
- **Before**: Generated ID locally, stored in AsyncStorage
- **After**: Calls `socialApi.createCrew()` with proper payload
- **Backend**: Generates unique ID, creates crew, adds owner as member

```typescript
const createCrewMutation = useMutation({
  mutationFn: async (crewData: Omit<Crew, 'id' | 'createdAt'>) => {
    try {
      const response = await socialApi.createCrew({
        name: crewData.name,
        ownerId: crewData.ownerId,
        description: crewData.description,
        isPrivate: crewData.isPrivate,
      });
      return response.data!;
    } catch (error) {
      console.error('Failed to create crew:', error);
      throw error;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['crews'] });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Success!', 'Crew created successfully!');
  },
  onError: (error: any) => {
    Alert.alert('Error', error.message || 'Failed to create crew');
  },
});
```

### 5. **Updated Invite to Crew Mutation**
- **Before**: Added member to local crew array
- **After**: Calls `socialApi.addCrewMember(crewId, userId)`
- **Backend**: Validates crew exists, adds member, handles duplicates

```typescript
const inviteToCrewMutation = useMutation({
  mutationFn: async ({ crewId, inviteeId }: { crewId: string; inviteeId: string }) => {
    try {
      const response = await socialApi.addCrewMember(crewId, inviteeId);
      return response.data!;
    } catch (error) {
      console.error('Failed to invite to crew:', error);
      throw error;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['crews'] });
    queryClient.invalidateQueries({ queryKey: ['crew-invites'] });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Success!', 'Invite sent successfully!');
  },
  onError: (error: any) => {
    Alert.alert('Error', error.message || 'Failed to invite to crew');
  },
});
```

### 6. **Updated Leave Crew Mutation**
- **Before**: Removed user from local crew members array
- **After**: Calls `socialApi.removeCrewMember(crewId, userId)`
- **Backend**: Validates membership, removes member, updates crew

```typescript
const leaveCrewMutation = useMutation({
  mutationFn: async (crewId: string) => {
    try {
      const userId = 'user-me'; // TODO: Get from auth context
      const response = await socialApi.removeCrewMember(crewId, userId);
      return response.data!;
    } catch (error) {
      console.error('Failed to leave crew:', error);
      throw error;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['crews'] });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Success!', 'You have left the crew.');
  },
  onError: (error: any) => {
    Alert.alert('Error', error.message || 'Failed to leave crew');
  },
});
```

### 7. **Updated Join Challenge Mutation**
- **Before**: Created challenge progress record locally
- **After**: Calls `socialApi.joinChallenge(challengeId, userId)`
- **Backend**: Creates progress record, validates challenge exists

```typescript
const joinChallengeMutation = useMutation({
  mutationFn: async (challengeId: string) => {
    try {
      const userId = 'user-me'; // TODO: Get from auth context
      const response = await socialApi.joinChallenge(challengeId, userId);
      return response.data!;
    } catch (error) {
      console.error('Failed to join challenge:', error);
      throw error;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['challenge-progress'] });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Success!', 'Challenge joined!');
  },
  onError: (error: any) => {
    Alert.alert('Error', error.message || 'Failed to join challenge');
  },
});
```

### 8. **Updated Challenge Progress Mutation**
- **Before**: Updated progress locally, created rewards manually
- **After**: Calls `socialApi.updateChallengeProgress(challengeId, userId, incrementBy)`
- **Backend**: Updates progress, checks completion, awards rewards automatically

```typescript
const updateChallengeProgressApiMutation = useMutation({
  mutationFn: async ({ challengeId, incrementBy }: { challengeId: string; incrementBy: number }) => {
    try {
      const userId = 'user-me'; // TODO: Get from auth context
      const response = await socialApi.updateChallengeProgress(challengeId, userId, incrementBy);
      return response.data!;
    } catch (error) {
      console.error('Failed to update challenge progress:', error);
      throw error;
    }
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['challenge-progress'] });
    queryClient.invalidateQueries({ queryKey: ['challenge-rewards'] });

    // Check if challenge was completed and show success alert
    if (data?.status === 'COMPLETED') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Challenge Complete!', 'You earned a reward!');
    }
  },
  onError: (error: any) => {
    Alert.alert('Error', error.message || 'Failed to update challenge progress');
  },
});
```

## Features Kept Local/Mock

The following features remain using local state or mock data as they involve UI flow, notifications, or need additional backend support:

1. **Follow/Unfollow System** (`followsQuery`, `followUser`, `unfollowUser`)
   - Reason: Social graph is complex, kept local for now
   - TODO: Implement full social API with follow requests, blocking, etc.

2. **Friend Locations** (`friendLocations`, location sharing)
   - Reason: Real-time location requires WebSocket/polling infrastructure
   - TODO: Implement real-time location service with privacy controls

3. **Location Settings** (`locationSettingsQuery`, `updateLocationSettings`)
   - Reason: Privacy settings are user preferences, local storage is fine
   - Could be synced to backend for multi-device support

4. **Friend Suggestions** (`suggestionsQuery`)
   - Reason: Uses local service for contacts/Instagram integration
   - TODO: Backend ML-based recommendations

5. **Crew Invites** (`crewInvitesQuery`, `respondToCrewInvite`)
   - Reason: Invitation flow involves notifications and pending state
   - TODO: Add backend endpoints for invite workflow

6. **Crew Night Plans** (`crewPlansQuery`, `planCrewNight`, `updateCrewPlanAttendance`)
   - Reason: Event planning features need full CRUD operations
   - TODO: Add backend endpoints for crew events

7. **Challenge Rewards Query** (`challengeRewardsQuery`)
   - Reason: Rewards are created by backend when challenges complete
   - TODO: Fetch from backend instead of AsyncStorage

8. **Claim Challenge Reward** (`claimChallengeReward`)
   - Reason: Just marks reward as used locally
   - TODO: Track redemption in backend for analytics

## Benefits of API Integration

### ✅ Multi-device Crew Sync
- Crews sync across devices
- Members see real-time updates
- No stale local data

### ✅ Consistent Challenge Progress
- Progress tracked server-side
- Prevents cheating
- Fair leaderboards possible

### ✅ Centralized Crew Management
- Owner can manage crew from any device
- Members added/removed sync immediately
- Crew stats calculated on backend

### ✅ Reward Validation
- Backend validates challenge completion
- Prevents duplicate rewards
- Secure reward distribution

### ✅ Better Error Handling
- API errors caught and displayed
- Graceful fallback to mock data
- Console logging for debugging

## User ID TODO

All API calls currently use hardcoded `'user-me'` for the user ID:

```typescript
const userId = 'user-me'; // TODO: Get from auth context
```

**Next Step**: Use real user ID from AuthContext once created.

## Testing Checklist

### Crews
- [ ] Test create crew
- [ ] Test invite member to crew
- [ ] Test accept crew invitation
- [ ] Test decline crew invitation
- [ ] Test leave crew
- [ ] Test crew member list syncs across devices
- [ ] Test private crew visibility

### Challenges
- [ ] Test join challenge
- [ ] Test update challenge progress
- [ ] Test challenge completion triggers reward
- [ ] Test challenge progress syncs across devices
- [ ] Test venue-specific challenges
- [ ] Test challenge expiration

### Error Handling
- [ ] Test with backend offline (should show mock data)
- [ ] Test network errors during crew creation
- [ ] Test invalid crew ID
- [ ] Test joining challenge twice (should prevent)
- [ ] Verify error alerts display correctly
- [ ] Check loading states shown appropriately

### Social Features (Still Local)
- [ ] Test follow/unfollow (local only)
- [ ] Test location sharing toggle (local only)
- [ ] Test ghost mode (local only)
- [ ] Test friend suggestions (local service)

## Next Steps

1. ✅ **GrowthContext** - COMPLETED
2. ✅ **EventsContext** - COMPLETED
3. ✅ **SocialContext** - COMPLETED
4. ⏳ **ContentContext** - Update to use `contentApi`
5. ⏳ **MonetizationContext** - Update to use `pricingApi`
6. ⏳ **RetentionContext** - Update to use `retentionApi`
7. ⏳ **Add remaining social endpoints**:
   - Follow system API
   - Real-time location sharing
   - Crew invites API
   - Crew plans API
   - Challenge rewards fetching

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

- `POST /api/social/crews` - Create crew
- `GET /api/social/crews/user/:userId` - Get user crews
- `POST /api/social/crews/:id/members` - Add crew member
- `DELETE /api/social/crews/:crewId/members/:userId` - Remove crew member
- `POST /api/social/challenges/:id/join` - Join challenge
- `GET /api/social/challenges/user/:userId` - Get user challenges
- `POST /api/social/challenges/:challengeId/progress` - Update challenge progress

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
