# Integration TODO - Items to Fix for Smooth Operation

## 🔴 CRITICAL (Must Fix Immediately)

### 1. Missing Google Maps API Key
**Impact:** Venue discovery, maps, location features won't work
**Location:** `.env`
**Fix:**
```bash
# Add to .env:
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```
**How to get key:**
1. Go to https://console.cloud.google.com/
2. Create new project or select existing
3. Enable "Maps SDK for iOS", "Maps SDK for Android", "Places API"
4. Create API key under Credentials
5. Add key to `.env` file

---

### 2. Backend Missing Type Definitions
**Impact:** Backend TypeScript compilation fails
**Location:** `backend/` directory
**Fix:**
```bash
cd backend
npm install --save-dev @types/express @types/jsonwebtoken @types/bcrypt @types/node
```

---

### 3. Frontend API URL Mismatch
**Impact:** API calls will fail (using /api/v1 prefix but backend uses /api)
**Location:** `.env` - Line 16
**Current:**
```
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
```
**Fix:**
```
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

---

## 🟠 HIGH PRIORITY (Fix Soon)

### 4. Mock Data Still in Use
**Impact:** Features won't use real backend data
**Locations:**
- `contexts/AppStateContext.tsx` - Uses mockServers
- `contexts/FeedContext.tsx` - Falls back to mockVideos, mockVenues, mockPerformers
- `contexts/PerformerContext.tsx` - Uses mockGigs, mockPromoVideos
- `contexts/ToastContext.tsx` - Uses mockToastIntegration

**Fix:** Update each context to:
1. Remove mock data imports
2. Use real API endpoints
3. Handle loading/error states properly
4. Use new error handling (toast notifications)

**Example for FeedContext:**
```typescript
// REMOVE:
import { mockVideos } from '@/mocks/videos';

// UPDATE getVideos to always use API:
const fetchVideos = async () => {
  try {
    const response = await API.get('/videos/feed');
    return response.data;
  } catch (error) {
    showError('Failed to load videos', error.message);
    throw error; // Don't fall back to mock data
  }
};
```

---

### 5. Missing Context Integrations
**Impact:** New features won't be accessible in screens
**Locations:**

**ChatContext not used in:**
- `app/(tabs)/servers.tsx` - Should show unread message counts
- `app/(tabs)/profile.tsx` - Should show chat option for friends

**NetworkContext not checked in:**
- `contexts/FeedContext.tsx` - Should prevent API calls when offline
- `contexts/SocialContext.tsx` - Should queue actions when offline
- `contexts/EventsContext.tsx` - Should handle offline state

**ToastNotificationContext not used in:**
- Most screens still use Alert.alert() instead of toast
- Should replace all Alert.alert() with useToast()

**Fix:** Import and use contexts where needed:
```typescript
import { useNetwork } from '@/contexts/NetworkContext';
import { useToast } from '@/contexts/ToastNotificationContext';

// In component:
const { isOffline } = useNetwork();
const { showError, showSuccess } = useToast();

// Before API call:
if (isOffline) {
  showWarning('You are offline', 'This action requires internet connection');
  return;
}
```

---

### 6. TypeScript Errors in Screens
**Impact:** Build failures, type safety issues
**Count:** 47 TypeScript errors found

**Major Issues:**
1. **app/business/register.tsx**: Missing 'description' property
2. **app/calendar/index.tsx**: Type 'never' issues with performers
3. **app/challenges/index.tsx**: Missing 'challengeId' property
4. **app/management/check-in.tsx**: Promise type not awaited
5. **app/settings.tsx**: LinkedCard type not defined
6. **app/venue/edit/[id].tsx**: uploadImage method doesn't exist

**Fix:** Update types in `types/index.ts` and fix component code:
```typescript
// Add missing types:
export interface BusinessRegistrationData {
  // ... existing fields
  description?: string; // Add this
}

export interface Challenge {
  // ... existing fields
  challengeId: string; // Add this
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED'; // Add this
}

export interface LinkedCard {
  id: string;
  last4: string;
  brand: string;
  // ... other card fields
}
```

---

## 🟡 MEDIUM PRIORITY (Should Fix)

### 7. Incomplete API Integrations (TODOs)
**Impact:** Features partially implemented
**Count:** 20+ TODO comments found

**Top Priority TODOs:**

**AppStateContext:**
- Line 234: Replace register with backend API call
- Line 287: Replace addPaymentCard with backend API
- Line 313: Replace removePaymentCard with backend API

**ContentContext:**
- Line 95: Fetch performer details from API
- Line 120: Fetch calendar events from API
- Line 143: Fetch venue events from API

**EventsContext:**
- Line 178: Fetch guest list from API

**SocialContext:**
- Line 234: Fetch mutual friend suggestions
- Line 256: Implement friend search via API
- Line 278: Fetch friend profile from API

**Fix:** Implement each TODO one by one, testing after each implementation.

---

### 8. Missing Error Handling in Components
**Impact:** Poor user experience when errors occur
**Locations:**
- Most screens don't use `<RetryableSection>`
- Many API calls don't show toast notifications on error
- No offline state handling in most screens

**Fix:**
```typescript
// Wrap data-dependent sections:
<RetryableSection
  isLoading={isLoadingEvents}
  error={error}
  onRetry={() => refetch()}
  errorTitle="Failed to load events"
>
  {events.map(event => <EventCard key={event.id} event={event} />)}
</RetryableSection>
```

---

### 9. Sentry Not Configured
**Impact:** No production error tracking
**Location:** `.env` - Line 77
**Current:**
```
EXPO_PUBLIC_SENTRY_DSN=
```
**Fix:**
1. Create Sentry account at https://sentry.io
2. Create new project for React Native
3. Copy DSN from project settings
4. Add to `.env`:
```
EXPO_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
```

---

### 10. Instagram/Toast Credentials Missing
**Impact:** Integration features won't work
**Locations:**
- `.env`: EXPO_PUBLIC_INSTAGRAM_CLIENT_ID (empty)
- `backend/.env`: INSTAGRAM_CLIENT_ID, INSTAGRAM_CLIENT_SECRET (placeholder)
- `.env`: EXPO_PUBLIC_TOAST_CLIENT_ID (empty)

**Fix:**
1. Instagram: Get credentials from https://developers.facebook.com/apps/
2. Toast POS: Get credentials from https://pos.toasttab.com/developers

**For now (development):**
- Leave empty and use `EXPO_PUBLIC_USE_MOCK_DATA=true` for testing
- Or disable features: `EXPO_PUBLIC_ENABLE_INSTAGRAM_SYNC=false`

---

## 🟢 LOW PRIORITY (Nice to Have)

### 11. Stripe Key Placeholder
**Location:** `.env` - Line 72
**Current:**
```
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```
**Fix:** Get real test key from https://dashboard.stripe.com/test/apikeys

---

### 12. JWT Secret is Weak
**Location:** `backend/.env` - Line 32
**Current:** Default placeholder text
**Fix:** Generate strong secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Then update backend/.env:
```
JWT_SECRET=<generated-secret-here>
```

---

### 13. Test Dependencies Missing
**Impact:** Can't run tests
**Fix:**
```bash
npm install --save-dev @types/jest @testing-library/react-native
```

---

### 14. Unused Mock Files
**Impact:** Clutters codebase, increases bundle size
**Location:** `/mocks` directory
**Fix:** Once all contexts use real APIs, delete:
- `mocks/videos.ts`
- `mocks/venues.ts`
- `mocks/performers.ts`
- `mocks/gigs.ts`
- `mocks/servers.ts`

---

## 📋 Implementation Checklist

### Phase 1: Critical Fixes (Do First)
- [ ] Add Google Maps API key to .env
- [ ] Install backend type definitions (@types/express, etc.)
- [ ] Fix API URL from /api/v1 to /api in .env
- [ ] Test that backend server starts without errors
- [ ] Test that frontend can connect to backend

### Phase 2: High Priority (Do Next)
- [ ] Remove mock data from FeedContext
- [ ] Remove mock data from PerformerContext
- [ ] Remove mock data from AppStateContext
- [ ] Replace Alert.alert() with useToast() in all screens
- [ ] Add offline checking in all API-calling contexts
- [ ] Fix TypeScript errors in screens (47 errors)
- [ ] Test that feed loads from real API

### Phase 3: Medium Priority
- [ ] Implement TODO: Register user API call
- [ ] Implement TODO: Payment card management
- [ ] Implement TODO: Friend suggestions API
- [ ] Add RetryableSection to main screens
- [ ] Setup Sentry with real DSN
- [ ] Test all error scenarios

### Phase 4: Low Priority
- [ ] Get Instagram credentials (or disable feature)
- [ ] Get Toast POS credentials (or disable feature)
- [ ] Get Stripe test keys
- [ ] Generate strong JWT secret
- [ ] Add test dependencies
- [ ] Clean up unused mock files

---

## 🧪 Testing After Fixes

### Backend Tests
```bash
cd backend
npm start
# Should see: "✅ All tests passed!"
```

### Frontend Tests
```bash
# Start backend first
cd backend && npm start

# Then start frontend
npx expo start
# Test each screen manually:
# 1. Discovery - venues should load from API
# 2. Feed - videos should load from API
# 3. Profile - user data should load from API
# 4. Studio - upload should work
# 5. Servers - chat should work
```

### Error Handling Tests
```bash
# Stop backend server
# Frontend should show offline banner
# Try actions - should show toast notifications
# Restart backend
# Should show "back online" toast
```

---

## 📝 Notes

- All critical fixes are required for basic functionality
- High priority fixes are needed for production readiness
- Medium priority improves user experience significantly
- Low priority is for polish and security hardening

**Estimated Time:**
- Critical: 30 minutes
- High Priority: 3-4 hours
- Medium Priority: 4-6 hours
- Low Priority: 2-3 hours

**Total: ~10-13 hours of work**

---

*Last Updated: February 11, 2026*
