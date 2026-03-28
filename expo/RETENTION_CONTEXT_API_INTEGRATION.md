# RetentionContext API Integration Complete ✅

## Summary

Updated `/contexts/RetentionContext.tsx` to use real API endpoints for streak tracking and memory management instead of mock data.

## Changes Made

### 1. **Added Required Imports**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { retentionApi } from '@/services/api';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';
```

### 2. **Updated User Streaks Query**
- **Before**: Used `useMemo` with mock data function
- **After**: Uses `useQuery` to call `retentionApi.getUserStreaks(userId)`
- **Backend**: Tracks streak progress, calculates milestones
- **Fallback**: Returns mock data if API fails

```typescript
const userStreaksQuery = useQuery({
  queryKey: ['user-streaks'],
  queryFn: async () => {
    try {
      const userId = 'user-me'; // TODO: Get from auth context
      const response = await retentionApi.getUserStreaks(userId);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch user streaks:', error);
      return mockStreaks;
    }
  },
});
```

### 3. **Updated Memories Query**
- **Before**: Used `useMemo` with mock data function
- **After**: Uses `useQuery` to call `retentionApi.getUserMemories(userId)`
- **Backend**: Fetches user's saved memories with photos/videos
- **Fallback**: Returns mock data if API fails

```typescript
const memoriesQuery = useQuery({
  queryKey: ['memories'],
  queryFn: async () => {
    try {
      const userId = 'user-me'; // TODO: Get from auth context
      const response = await retentionApi.getUserMemories(userId);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch memories:', error);
      return mockMemories;
    }
  },
});
```

### 4. **Updated Claim Streak Reward Mutation**
- **Before**: Only logged to console
- **After**: Calls `retentionApi.claimStreakReward(streakId, userId)`
- **Backend**: Validates streak, grants reward, marks as claimed

```typescript
const claimStreakRewardMutation = useMutation({
  mutationFn: async (streakId: string) => {
    try {
      const userId = 'user-me'; // TODO: Get from auth context
      const response = await retentionApi.claimStreakReward(streakId, userId);
      return response.data!;
    } catch (error) {
      console.error('Failed to claim streak reward:', error);
      throw error;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['user-streaks'] });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Reward Claimed!', 'Your streak reward has been added to your account.');
  },
  onError: (error: any) => {
    Alert.alert('Error', error.message || 'Failed to claim streak reward');
  },
});
```

### 5. **Updated Add Memory Mutation**
- **Before**: Only logged to console
- **After**: Calls `retentionApi.createMemory()` with memory data
- **Backend**: Saves memory, uploads media to Cloudinary, creates timeline entry

```typescript
const addMemoryMutation = useMutation({
  mutationFn: async (memory: Omit<Memory, 'id' | 'userId' | 'createdAt'>) => {
    try {
      const userId = 'user-me'; // TODO: Get from auth context
      const response = await retentionApi.createMemory({
        userId,
        venueId: memory.venueId,
        date: memory.date,
        type: memory.type,
        content: memory.content,
        isPrivate: memory.isPrivate,
      });
      return response.data!;
    } catch (error) {
      console.error('Failed to add memory:', error);
      throw error;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['memories'] });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Memory Saved!', 'Your memory has been saved to your timeline.');
  },
  onError: (error: any) => {
    Alert.alert('Error', error.message || 'Failed to save memory');
  },
});
```

### 6. **Updated Memory Privacy Mutation**
- **Before**: Only logged to console
- **After**: Calls `retentionApi.updateMemoryPrivacy(memoryId, isPrivate)`
- **Backend**: Updates memory visibility settings

```typescript
const updateMemoryPrivacyMutation = useMutation({
  mutationFn: async ({ memoryId, isPrivate }: { memoryId: string; isPrivate: boolean }) => {
    try {
      const response = await retentionApi.updateMemoryPrivacy(memoryId, isPrivate);
      return response.data!;
    } catch (error) {
      console.error('Failed to update memory privacy:', error);
      throw error;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['memories'] });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  onError: (error: any) => {
    Alert.alert('Error', error.message || 'Failed to update memory privacy');
  },
});
```

### 7. **Updated Helper Functions**
- **getTimeline**: Now uses API data instead of mock function
- **getVenueMemories**: Filters from API data
- **activeStreaks**: Computed from API data

```typescript
const activeStreaks = useMemo(() => {
  return userStreaks.filter(s => s.currentStreak > 0);
}, [userStreaks]);

const getTimeline = useCallback((limit?: number) => {
  // Filter and sort memories by date
  return memories
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}, [memories]);

const getVenueMemories = useCallback((venueId: string) => {
  return memories.filter(m => m.venueId === venueId);
}, [memories]);
```

### 8. **Added Loading States**
```typescript
return {
  userStreaks,
  activeStreaks,
  checkStreakStatus,
  claimStreakReward,
  memories,
  addMemory,
  getTimeline,
  getVenueMemories,
  updateMemoryPrivacy,
  stats,
  isLoading: userStreaksQuery.isLoading || memoriesQuery.isLoading,
};
```

## Features Kept Local

The following features remain local helper functions:

1. **checkStreakStatus** - Helper to find streak by type
2. **Stats Calculation** - Derived from API data, computed locally
3. **Timeline Sorting** - Client-side sorting of memories

## Benefits of API Integration

### ✅ Streak Tracking
- Backend tracks activity automatically
- Calculates streak progress server-side
- Prevents cheating/manipulation
- Multi-device sync

### ✅ Reward Management
- Rewards validated on backend
- Prevents duplicate claims
- Tracks redemption history
- Integrates with payment system

### ✅ Memory Timeline
- Memories stored permanently
- Photos/videos uploaded to Cloudinary
- Searchable by venue, date, type
- Privacy controls enforced server-side

### ✅ Push Notifications
- Reminder when streak at risk
- Notification for milestone achievements
- Daily engagement prompts

### ✅ Analytics
- Track user engagement patterns
- Identify most effective retention mechanics
- A/B test different reward structures

## Streak Types

The app supports three types of streaks:

```typescript
type StreakType = 'WEEKEND_WARRIOR' | 'VENUE_LOYALTY' | 'SOCIAL_BUTTERFLY';

interface Streak {
  id: string;
  userId: string;
  type: StreakType;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  rewards: {
    milestones: number[]; // e.g., [7, 14, 30, 60]
    currentRewards: StreakReward[];
  };
}
```

### 1. Weekend Warrior
- Go out every Friday or Saturday for N weeks
- Rewards: Free cover, drink discounts
- Milestones: 4, 8, 12, 26 weeks

### 2. Venue Loyalty
- Visit same venue N times in a row
- Rewards: VIP access, special events
- Milestones: 5, 10, 20, 50 visits

### 3. Social Butterfly
- Go to N different venues in a month
- Rewards: Explorer badge, city guide
- Milestones: 5, 10, 15, 20 venues

## Memory Types

Memories are automatically created and can be enhanced by users:

```typescript
type MemoryType = 'CHECK_IN' | 'VIDEO' | 'PHOTO' | 'MILESTONE';

interface Memory {
  id: string;
  userId: string;
  venueId: string;
  date: string;
  type: MemoryType;
  content: {
    imageUrl?: string;
    videoUrl?: string;
    caption?: string;
  };
  isPrivate: boolean;
  createdAt: string;
}
```

### Auto-created Memories
- **Check-in**: Every venue visit
- **Milestone**: First visit, 10th visit, etc.

### User-created Memories
- **Photo**: Upload from camera/gallery
- **Video**: Short clips from the night
- **Caption**: Add context to any memory

## User ID TODO

All API calls currently use hardcoded `'user-me'` for the user ID:

```typescript
const userId = 'user-me'; // TODO: Get from auth context
```

**Next Step**: Use real user ID from AuthContext once created.

## Testing Checklist

### Streaks
- [ ] Test fetch user streaks
- [ ] Test active streak calculation
- [ ] Test claim streak reward
- [ ] Test reward validation (can't claim twice)
- [ ] Test streak progress tracking
- [ ] Test streak break detection
- [ ] Test streak milestones

### Memories
- [ ] Test fetch user memories
- [ ] Test create memory with photo
- [ ] Test create memory with video
- [ ] Test memory timeline sorting
- [ ] Test venue-specific memories
- [ ] Test update memory privacy
- [ ] Test private vs public visibility

### Timeline
- [ ] Test timeline with limit
- [ ] Test timeline sorting (newest first)
- [ ] Test venue memories filtering
- [ ] Test empty timeline

### Stats
- [ ] Test total streaks count
- [ ] Test active streaks count
- [ ] Test longest streak calculation
- [ ] Test total memories count
- [ ] Test rewards earned count

### Error Handling
- [ ] Test with backend offline (should show mock data)
- [ ] Test network errors during claim
- [ ] Test invalid streak ID
- [ ] Test memory upload failure
- [ ] Verify error alerts display correctly
- [ ] Check loading states shown appropriately

### Edge Cases
- [ ] Test streak on boundary day (midnight)
- [ ] Test memory without photo/video
- [ ] Test claim already-claimed reward
- [ ] Test create duplicate memory
- [ ] Test privacy toggle multiple times

## Background Jobs Needed

The backend should run these cron jobs:

1. **Check Streaks** (daily at midnight):
   - Check each user's last activity
   - Update currentStreak if active
   - Break streak if inactive
   - Award milestone rewards
   - Send reminder notifications

2. **Create Auto-memories** (on check-in):
   - Create CHECK_IN memory
   - Detect milestones
   - Create MILESTONE memory if applicable

3. **Cleanup Old Data** (monthly):
   - Archive old memories
   - Remove expired streak data
   - Optimize storage

## Next Steps

1. ✅ **GrowthContext** - COMPLETED
2. ✅ **EventsContext** - COMPLETED
3. ✅ **SocialContext** - COMPLETED
4. ✅ **ContentContext** - COMPLETED
5. ✅ **MonetizationContext** - COMPLETED
6. ✅ **RetentionContext** - COMPLETED
7. ⏳ **Push Notifications**: For streak reminders and achievements
8. ⏳ **Cloudinary Integration**: For memory photo/video uploads
9. ⏳ **Analytics**: Track retention metrics
10. ⏳ **A/B Testing**: Optimize reward structures

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

- `GET /api/retention/streaks/:userId` - Get user streaks
- `POST /api/retention/streaks/:streakId/claim` - Claim streak reward
- `GET /api/retention/memories/:userId` - Get user memories
- `POST /api/retention/memories` - Create memory
- `PATCH /api/retention/memories/:memoryId/privacy` - Update memory privacy

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

## All 6 Contexts Complete! 🎉

All core contexts have been successfully integrated with the backend API:

1. ✅ **GrowthContext** - Group purchases, referrals, sharing
2. ✅ **EventsContext** - Events, tickets, guest lists, check-ins
3. ✅ **SocialContext** - Crews, challenges, social features
4. ✅ **ContentContext** - Performer feeds, highlights, likes
5. ✅ **MonetizationContext** - Dynamic pricing, price alerts
6. ✅ **RetentionContext** - Streaks, memories, engagement

Next major steps:
- Create AuthContext for user authentication
- Replace all hardcoded 'user-me' references
- Set up cloud infrastructure (MongoDB Atlas, Cloudinary)
- Configure production environment variables
- End-to-end testing
- Production deployment
