# ContentContext API Integration Complete ✅

## Summary

Updated `/contexts/ContentContext.tsx` to use real API endpoints for performer feeds, highlights, and post interactions instead of mock data and AsyncStorage.

## Changes Made

### 1. **Added API Import**
```typescript
import { contentApi } from '@/services/api';
import { Alert } from 'react-native';
```

### 2. **Updated Performer Posts Query**
- **Before**: Fetched from AsyncStorage with mock data fallback
- **After**: Calls `contentApi.getPerformerFeed(userId)`
- **Backend**: Returns feed from followed performers
- **Fallback**: Returns mock data if API fails

```typescript
const performerPostsQuery = useQuery({
  queryKey: ['performer-posts'],
  queryFn: async () => {
    try {
      const userId = 'user-me'; // TODO: Get from auth context
      const response = await contentApi.getPerformerFeed(userId);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch performer posts:', error);
      return mockPerformerPosts;
    }
  },
});
```

### 3. **Updated Highlight Videos Query**
- **Before**: Fetched from AsyncStorage with mock data
- **After**: Calls `contentApi.getActiveHighlights()`
- **Backend**: Returns active highlights (not expired)
- **Note**: Highlights expire after 24 hours automatically

```typescript
const highlightVideosQuery = useQuery({
  queryKey: ['highlight-videos'],
  queryFn: async () => {
    try {
      const response = await contentApi.getActiveHighlights();
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch highlight videos:', error);
      return mockHighlightVideos;
    }
  },
});
```

### 4. **Updated Follow Performer Mutation**
- **Before**: Added performer ID to local array
- **After**: Calls `contentApi.followPerformer(userId, performerId)`
- **Backend**: Creates follow relationship, updates feed

```typescript
const followPerformerMutation = useMutation({
  mutationFn: async (performerId: string) => {
    try {
      const userId = 'user-me'; // TODO: Get from auth context
      const response = await contentApi.followPerformer(userId, performerId);
      return response.data!;
    } catch (error) {
      console.error('Failed to follow performer:', error);
      throw error;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['performer-follows'] });
    queryClient.invalidateQueries({ queryKey: ['performer-posts'] });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Success!', 'You are now following this performer!');
  },
  onError: (error: any) => {
    Alert.alert('Error', error.message || 'Failed to follow performer');
  },
});
```

### 5. **Updated Unfollow Performer Mutation**
- **Before**: Removed performer ID from local array
- **After**: Calls `contentApi.unfollowPerformer(userId, performerId)`
- **Backend**: Removes follow relationship, updates feed

```typescript
const unfollowPerformerMutation = useMutation({
  mutationFn: async (performerId: string) => {
    try {
      const userId = 'user-me'; // TODO: Get from auth context
      const response = await contentApi.unfollowPerformer(userId, performerId);
      return response.data!;
    } catch (error) {
      console.error('Failed to unfollow performer:', error);
      throw error;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['performer-follows'] });
    queryClient.invalidateQueries({ queryKey: ['performer-posts'] });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  onError: (error: any) => {
    Alert.alert('Error', error.message || 'Failed to unfollow performer');
  },
});
```

### 6. **Updated Like Post Mutation**
- **Before**: Updated local like count and liked posts array
- **After**: Calls `contentApi.likePost(postId, userId)`
- **Backend**: Increments like count, tracks user likes

```typescript
const likePostMutation = useMutation({
  mutationFn: async (postId: string) => {
    try {
      const userId = 'user-me'; // TODO: Get from auth context
      const response = await contentApi.likePost(postId, userId);
      return response.data!;
    } catch (error) {
      console.error('Failed to like post:', error);
      throw error;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['performer-posts'] });
    queryClient.invalidateQueries({ queryKey: ['post-likes'] });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  onError: (error: any) => {
    Alert.alert('Error', error.message || 'Failed to like post');
  },
});
```

### 7. **Updated Unlike Post Mutation**
- **Before**: Updated local like count and removed from liked posts
- **After**: Calls `contentApi.unlikePost(postId, userId)`
- **Backend**: Decrements like count, removes user like

```typescript
const unlikePostMutation = useMutation({
  mutationFn: async (postId: string) => {
    try {
      const userId = 'user-me'; // TODO: Get from auth context
      const response = await contentApi.unlikePost(postId, userId);
      return response.data!;
    } catch (error) {
      console.error('Failed to unlike post:', error);
      throw error;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['performer-posts'] });
    queryClient.invalidateQueries({ queryKey: ['post-likes'] });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  onError: (error: any) => {
    Alert.alert('Error', error.message || 'Failed to unlike post');
  },
});
```

### 8. **Updated Upload Highlight Mutation**
- **Before**: Generated ID locally, stored in AsyncStorage
- **After**: Calls `contentApi.uploadHighlight()` with video data
- **Backend**: Uploads to Cloudinary, generates thumbnail, sets 24h expiry
- **Note**: Video URL should come from Cloudinary upload first

```typescript
const uploadHighlightMutation = useMutation({
  mutationFn: async (highlight: Omit<HighlightVideo, 'id' | 'createdAt' | 'expiresAt' | 'isActive'>) => {
    try {
      const userId = 'user-me'; // TODO: Get from auth context
      const response = await contentApi.uploadHighlight({
        userId,
        venueId: highlight.venueId,
        videoUrl: highlight.videoUrl,
        thumbnailUrl: highlight.thumbnailUrl,
        duration: highlight.duration,
      });
      return response.data!;
    } catch (error) {
      console.error('Failed to upload highlight:', error);
      throw error;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['highlight-videos'] });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Success!', 'Highlight uploaded successfully!');
  },
  onError: (error: any) => {
    Alert.alert('Error', error.message || 'Failed to upload highlight');
  },
});
```

### 9. **Updated Increment Highlight Views**
- **Before**: Updated view count in local array
- **After**: Calls `contentApi.incrementHighlightViews(highlightId)`
- **Backend**: Increments view count for analytics
- **Note**: Doesn't throw error to avoid disrupting UX

```typescript
const incrementHighlightViewsMutation = useMutation({
  mutationFn: async (highlightId: string) => {
    try {
      const response = await contentApi.incrementHighlightViews(highlightId);
      return response.data!;
    } catch (error) {
      console.error('Failed to increment highlight views:', error);
      // Don't throw error - view tracking failure shouldn't disrupt UX
      return null;
    }
  },
  onSuccess: () => {
    // Optionally update local cache
    queryClient.invalidateQueries({ queryKey: ['highlight-videos'] });
  },
});
```

## Features Kept Local/Mock

The following features remain using local state or mock data:

1. **Performer Follows Query** (`performerFollowsQuery`)
   - Reason: Kept in AsyncStorage for now
   - TODO: Fetch from `contentApi.getFollowedPerformers(userId)` in backend

2. **Post Likes Query** (`postLikesQuery`)
   - Reason: Kept in AsyncStorage for now
   - TODO: Fetch from backend as part of performer posts response

3. **Calendar Functions** (`getFilteredEvents`, `getUpcomingEvents`)
   - Reason: Uses `mockEvents` which should come from EventsContext
   - TODO: Use events from EventsContext query instead of mockEvents

4. **Performer List** (`performers`)
   - Reason: Static list of performers, not user-specific data
   - Could be fetched from backend for dynamic performer discovery

## Benefits of API Integration

### ✅ Personalized Feed
- Backend generates feed from followed performers
- Chronological sorting
- Real-time updates when performers post

### ✅ Like Tracking
- Consistent like counts across devices
- Prevents duplicate likes
- Analytics for popular content

### ✅ Highlight Video Management
- 24-hour expiration handled by backend
- Video storage via Cloudinary
- Automatic thumbnail generation
- View count analytics

### ✅ Performer Discovery
- Follow/unfollow syncs across devices
- Performer stats updated in real-time
- Notifications for new posts (future)

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

### Performer Following
- [ ] Test follow performer
- [ ] Test unfollow performer
- [ ] Test followed performers list
- [ ] Test feed updates after following
- [ ] Test follow status syncs across devices

### Posts
- [ ] Test like post
- [ ] Test unlike post
- [ ] Test like count updates
- [ ] Test post feed from followed performers
- [ ] Test feed chronological ordering

### Highlights
- [ ] Test upload highlight video
- [ ] Test highlight appears in feed
- [ ] Test 24-hour expiration
- [ ] Test view count increment
- [ ] Test venue-specific highlights
- [ ] Test highlight with Cloudinary upload

### Calendar (Local for now)
- [ ] Test filter events by venue
- [ ] Test filter events by performer
- [ ] Test filter events by genre
- [ ] Test filter events by date range
- [ ] Test upcoming events sorted by date

### Error Handling
- [ ] Test with backend offline (should show mock data)
- [ ] Test network errors during follow
- [ ] Test invalid performer ID
- [ ] Test view increment failure (should not disrupt UX)
- [ ] Verify error alerts display correctly
- [ ] Check loading states shown appropriately

## Video Upload Workflow

For highlights to work properly, the full workflow is:

1. **Capture Video**: User records 15-second video in Studio
2. **Upload to Cloudinary**: Use Cloudinary SDK to upload video
3. **Get Video URL**: Cloudinary returns permanent video URL
4. **Call API**: `contentApi.uploadHighlight()` with video URL
5. **Backend Processing**:
   - Generate thumbnail
   - Set 24-hour expiry
   - Save to database
   - Return highlight object

**TODO**: Integrate Cloudinary upload in Studio before calling uploadHighlight.

## Next Steps

1. ✅ **GrowthContext** - COMPLETED
2. ✅ **EventsContext** - COMPLETED
3. ✅ **SocialContext** - COMPLETED
4. ✅ **ContentContext** - COMPLETED
5. ⏳ **MonetizationContext** - Update to use `pricingApi`
6. ⏳ **RetentionContext** - Update to use `retentionApi`
7. ⏳ **Additional improvements**:
   - Fetch performer follows from backend
   - Fetch post likes from backend
   - Use EventsContext for calendar instead of mockEvents
   - Integrate Cloudinary for video uploads
   - Add push notifications for new performer posts

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

- `GET /api/content/feed/:userId` - Get performer feed for user
- `POST /api/content/performers/:performerId/follow` - Follow performer
- `POST /api/content/performers/:performerId/unfollow` - Unfollow performer
- `POST /api/content/posts/:postId/like` - Like post
- `POST /api/content/posts/:postId/unlike` - Unlike post
- `POST /api/content/highlights` - Upload highlight video
- `GET /api/content/highlights/active` - Get active highlights
- `POST /api/content/highlights/:id/view` - Increment view count

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
