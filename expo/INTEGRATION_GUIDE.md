# App Store Compliance - Integration Guide

This document provides step-by-step instructions for integrating the App Store compliance components into your app.

## ✅ Already Integrated

The following components have been integrated and are ready to use:

### 1. Age Verification Gate ✅
**Location**: `app/_layout.tsx`

**What it does**: Blocks app access until user verifies they are 18+

**How it works**:
- Shows modal on first app launch
- Stores verification in AsyncStorage (`age_verified`)
- Blocks all navigation until verified
- Cannot be skipped (required for App Store)

**To test**: Clear app data and restart

---

### 2. Community Guidelines ✅
**Location**: `app/community-guidelines.tsx`

**How to access**:
- Settings → Community Guidelines
- Direct route: `router.push('/community-guidelines')`

**What it includes**:
- 6 comprehensive sections with 32 total rules
- Age requirement disclosure
- Report violations guidance
- Enforcement procedures
- Last updated date

---

### 3. Moderation Context ✅
**Location**: `contexts/ModerationContext.tsx`

**Available functions**:
```typescript
const {
  submitReport,        // Submit content/user report
  blockUser,          // Block a user
  unblockUser,        // Unblock a user
  blockedUsers,       // List of blocked users
  checkIfBlocked,     // Check if user is blocked
} = useModeration();
```

**Already wrapped in**: `app/_layout.tsx`

---

### 4. Blocked Users Screen ✅
**Location**: `app/blocked-users.tsx`

**How to access**: Settings → Privacy → Blocked Users

**Features**:
- List all blocked users
- Unblock users
- Shows when user was blocked
- Empty state handling

---

### 5. User Action Menu Component ✅
**Location**: `components/UserActionMenu.tsx`

**Purpose**: Reusable component for report/block actions

**Props**:
```typescript
<UserActionMenu
  visible={boolean}
  onClose={() => void}
  userId={string}
  username={string}
  contentId={string}      // Optional - for content reports
  contentType={'video' | 'comment'}  // Optional
/>
```

**What it does**:
- Shows bottom sheet with Report and Block options
- Handles modal navigation
- Integrates with ModerationContext
- Works for user profiles AND content

---

## 🔧 Still Needs Integration

### 6. Contact Sync Modal (Optional)
**Component**: `components/modals/ContactSyncModal.tsx`

**Where to add**: After successful sign-up

#### Integration Steps:

**Step 1**: Import the modal in `app/auth/sign-up.tsx`:
```typescript
import ContactSyncModal from '@/components/modals/ContactSyncModal';
import { syncContactsWithBackend, getPhoneContacts } from '@/services/contacts.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
```

**Step 2**: Add state to track modal visibility:
```typescript
const [showContactSync, setShowContactSync] = useState(false);
```

**Step 3**: Show modal after successful sign-up:
```typescript
const handleSignUp = async () => {
  // ... existing validation ...

  const result = await signUp({
    displayName,
    email,
    password,
    phoneNumber: phoneNumber || undefined,
  });

  if (result.success) {
    // Show contact sync modal after successful signup
    setShowContactSync(true);
  }
};
```

**Step 4**: Add the modal component:
```typescript
<ContactSyncModal
  visible={showContactSync}
  onAllow={async () => {
    try {
      const contacts = await getPhoneContacts();
      await syncContactsWithBackend(contacts);
      await AsyncStorage.setItem('contacts_sync_prompted', 'true');
      setShowContactSync(false);
      router.replace('/(tabs)'); // Navigate to main app
    } catch (error) {
      console.error('Contact sync error:', error);
      setShowContactSync(false);
      router.replace('/(tabs)');
    }
  }}
  onSkip={() => {
    AsyncStorage.setItem('contacts_sync_prompted', 'true');
    setShowContactSync(false);
    router.replace('/(tabs)'); // Navigate to main app
  }}
/>
```

**Why it's optional**: Only needed if you want contact sync. Can be skipped entirely.

---

### 7. Report/Block Buttons on User Profiles

**Where to add**: Any screen that displays user profiles

#### Example Integration:

**Step 1**: Import the component:
```typescript
import UserActionMenu from '@/components/UserActionMenu';
import { MoreVertical } from 'lucide-react-native';
```

**Step 2**: Add state for menu visibility:
```typescript
const [showUserActions, setShowUserActions] = useState(false);
const [selectedUser, setSelectedUser] = useState<{
  id: string;
  username: string;
}>({id: '', username: ''});
```

**Step 3**: Add a three-dot menu button to user cards:
```typescript
// In your user card/profile header:
<TouchableOpacity
  onPress={() => {
    setSelectedUser({ id: user.id, username: user.username });
    setShowUserActions(true);
  }}
  style={styles.moreButton}
>
  <MoreVertical size={20} color="#999" />
</TouchableOpacity>
```

**Step 4**: Add the UserActionMenu component:
```typescript
<UserActionMenu
  visible={showUserActions}
  onClose={() => setShowUserActions(false)}
  userId={selectedUser.id}
  username={selectedUser.username}
/>
```

**Suggested locations**:
- `app/(tabs)/profile.tsx` - User cards in followers/following lists (lines 520-570)
- `app/(tabs)/servers.tsx` - Server member lists
- Any screen showing user profiles

---

### 8. Report Button on Videos

**Where to add**: Video player controls or video cards

#### Example Integration:

**Step 1**: Import components:
```typescript
import UserActionMenu from '@/components/UserActionMenu';
import { Flag } from 'lucide-react-native';
```

**Step 2**: Add state:
```typescript
const [showVideoActions, setShowVideoActions] = useState(false);
const [selectedVideo, setSelectedVideo] = useState<{
  id: string;
  userId: string;
  username: string;
}>({id: '', userId: '', username: ''});
```

**Step 3**: Add report button to video controls:
```typescript
// In video player controls or video card:
<TouchableOpacity
  onPress={() => {
    setSelectedVideo({
      id: video.id,
      userId: video.userId,
      username: video.username,
    });
    setShowVideoActions(true);
  }}
  style={styles.reportButton}
>
  <Flag size={20} color="#999" />
</TouchableOpacity>
```

**Step 4**: Add the UserActionMenu with video info:
```typescript
<UserActionMenu
  visible={showVideoActions}
  onClose={() => setShowVideoActions(false)}
  userId={selectedVideo.userId}
  username={selectedVideo.username}
  contentId={selectedVideo.id}
  contentType="video"
/>
```

**Suggested locations**:
- `app/(tabs)/feed.tsx` - Video player controls (line 24688)
- `app/(tabs)/studio.tsx` - Video preview/edit screens
- Any component displaying video content

---

## 📝 Integration Checklist

Use this checklist to track your integration progress:

### Core Compliance (Required for App Store)
- [x] Age verification gate implemented
- [x] Community guidelines accessible
- [x] Report system backend connected
- [x] Block system backend connected
- [x] Blocked users management screen
- [x] Clear permission explanations in app.json

### User Interface (Recommended)
- [ ] Contact sync modal added to onboarding
- [ ] Report button on video content
- [ ] Report button on user profiles
- [ ] Three-dot menu on user cards
- [ ] Block button in user profiles
- [ ] Report button on comments (if applicable)

### Testing
- [ ] Test age verification flow
- [ ] Test reporting a video
- [ ] Test reporting a user
- [ ] Test blocking a user
- [ ] Test unblocking a user
- [ ] Test blocked users screen
- [ ] Test community guidelines screen
- [ ] Test contact sync allow/skip

---

## 🎨 UI Component Locations

Quick reference for where to find and use components:

### Modals
```typescript
import AgeVerificationGate from '@/components/AgeVerificationGate';
import ContactSyncModal from '@/components/modals/ContactSyncModal';
import ReportContentModal from '@/components/modals/ReportContentModal';
import BlockUserModal from '@/components/modals/BlockUserModal';
import UserActionMenu from '@/components/UserActionMenu';
```

### Screens
```typescript
// Navigate to these screens:
router.push('/community-guidelines');
router.push('/blocked-users');
```

### Context
```typescript
import { useModeration } from '@/contexts/ModerationContext';

const {
  submitReport,
  blockUser,
  unblockUser,
  blockedUsers,
  checkIfBlocked,
} = useModeration();
```

---

## 🧪 Testing Scenarios

### Test Age Verification
1. Clear app data
2. Launch app
3. Age gate should appear
4. Try entering age under 18 → should show error
5. Enter age 18+ → should allow access
6. Restart app → should not show gate again

### Test Reporting
1. Navigate to a user profile or video
2. Click three-dot menu or report button
3. Select "Report"
4. Choose a reason
5. Optionally add details
6. Submit → should show success message
7. Check backend: `GET /api/moderation/reports/my`

### Test Blocking
1. Navigate to a user profile
2. Click three-dot menu
3. Select "Block User"
4. Confirm → should show success message
5. Go to Settings → Blocked Users
6. Blocked user should appear
7. Click "Unblock" → user should be removed

### Test Community Guidelines
1. Go to Settings
2. Tap "Community Guidelines"
3. Should show comprehensive guidelines
4. Scroll through all sections
5. Back button should work

---

## 🚀 Deployment Notes

Before submitting to App Store:

1. **Remove console.logs**: Search for `console.log` in moderation code
2. **Test on physical device**: Age gate, reports, blocking
3. **Update privacy policy**: Mention content moderation system
4. **Screenshots**: Include Community Guidelines for review notes
5. **Review notes**: Mention moderation system and age verification

**App Store Reviewer Notes Template**:
```
Age Verification:
- Users must verify they are 18+ on first launch
- Required for alcohol/nightlife content

Content Moderation:
- Users can report inappropriate content
- Users can block other users
- Moderation team reviews reports within 24 hours
- Community Guidelines accessible from Settings

Contact Sync:
- Optional feature (can be skipped)
- Phone numbers are hashed using SHA-256
- Never stored or shared in plain text
```

---

## 💡 Tips

1. **Report buttons should be subtle**: Use three-dot menus or small flag icons
2. **Don't spam users**: Only show contact sync once after signup
3. **Test thoroughly**: Block/unblock can affect many features
4. **Monitor reports**: Set up admin dashboard to review reports
5. **Age gate is persistent**: Can only be cleared by clearing app data

---

## 🆘 Troubleshooting

### Age gate not showing
- Check AsyncStorage: `age_verified` key
- Clear app data to test
- Ensure ModerationProvider is wrapped in _layout.tsx

### Report not submitting
- Check network logs
- Verify authentication token
- Test endpoint with curl: `POST /api/moderation/reports`

### Block not working
- Check user ID is correct
- Verify ModerationContext is accessible
- Check backend logs

### Contact sync crashes
- Ensure `@react-native-community/datetimepicker` is installed
- Check permissions in app.json
- Test on physical device (simulator may not work)

---

## 📞 Support

If you encounter issues:

1. Check console logs for errors
2. Verify all dependencies are installed
3. Check backend server is running
4. Review APP_STORE_COMPLIANCE_REVIEW.md for details
5. File an issue on GitHub with error logs

---

## 📚 Related Documentation

- `APP_STORE_REQUIREMENTS.md` - Full requirements list
- `APP_STORE_COMPLIANCE_REVIEW.md` - Code review and quality check
- `backend/src/routes/moderation.routes.js` - API documentation
- `contexts/ModerationContext.tsx` - Context usage examples
