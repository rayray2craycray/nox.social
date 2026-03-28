# Authentication System - Test Plan

## Test Environment
- **Backend**: Running on `http://localhost:3000`
- **Frontend**: Expo app on iOS/Android
- **Database**: MongoDB (Docker) on `localhost:27017`

---

## Test 1: Backend API Endpoints

### 1.1 Sign Up
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123",
    "displayName": "Test User"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "<user-id>",
      "email": "testuser@example.com",
      "displayName": "Test User"
    },
    "accessToken": "<jwt-token>",
    "refreshToken": "<refresh-token>",
    "expiresIn": 604800
  },
  "message": "Account created successfully"
}
```

### 1.2 Sign In
```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123"
  }'
```

**Expected**: Same response format as sign up

### 1.3 Get Current User
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <access-token>"
```

**Expected**:
```json
{
  "success": true,
  "data": {
    "id": "<user-id>",
    "email": "testuser@example.com",
    "displayName": "Test User",
    "lastLoginAt": "<timestamp>"
  }
}
```

---

## Test 2: Frontend Authentication Flow

### 2.1 Sign Up Screen
**Steps**:
1. Open app → Navigate to auth/sign-up
2. Fill in:
   - Display Name: "Test User"
   - Email: "newuser@example.com"
   - Password: "password123"
   - Confirm Password: "password123"
3. Tap "Create Account"

**Expected**:
- ✅ Loading state appears
- ✅ Success message shown
- ✅ User redirected to main app
- ✅ User data visible in profile tab

### 2.2 Sign In Screen
**Steps**:
1. Sign out from profile
2. Navigate to auth/sign-in
3. Enter:
   - Email: "newuser@example.com"
   - Password: "password123"
4. Tap "Sign In"

**Expected**:
- ✅ Loading state appears
- ✅ Success message shown
- ✅ User redirected to main app
- ✅ Same user data appears

### 2.3 Token Persistence
**Steps**:
1. Sign in successfully
2. Close app completely
3. Reopen app

**Expected**:
- ✅ User remains signed in
- ✅ No need to sign in again
- ✅ User data loads automatically

---

## Test 3: Context User ID Integration

### 3.1 GrowthContext - Group Purchases
**Steps**:
1. Sign in as User A
2. Create a group purchase
3. Check network tab for API call

**Expected**:
- ✅ API call includes User A's ID
- ✅ Group purchase `initiatorId` = User A's ID
- ✅ User A sees their purchases

**Test Multi-User**:
1. Sign out
2. Sign in as User B
3. View group purchases

**Expected**:
- ✅ User B doesn't see User A's purchases
- ✅ Each user has isolated data

### 3.2 EventsContext - Tickets
**Steps**:
1. Sign in as User A
2. Purchase a ticket
3. Go to "My Tickets"

**Expected**:
- ✅ Ticket `userId` = User A's ID
- ✅ Ticket appears in User A's list
- ✅ API call: `/api/events/tickets?userId=<user-a-id>`

**Test Isolation**:
1. Sign out
2. Sign in as User B
3. View tickets

**Expected**:
- ✅ User B sees only their tickets
- ✅ User A's tickets not visible

### 3.3 SocialContext - Follows
**Steps**:
1. Sign in as User A
2. Follow another user
3. Check network call

**Expected**:
- ✅ Follow `followerId` = User A's ID
- ✅ API: POST `/api/social/follow`
- ✅ Body: `{ followerId: "<user-a-id>", followingId: "<other-user-id>" }`

**Test Bidirectional**:
1. Sign in as User B
2. Follow User A back

**Expected**:
- ✅ User A sees User B in followers
- ✅ User B sees User A in following
- ✅ Both relationships use real IDs

### 3.4 SocialContext - Crews
**Steps**:
1. Sign in as User A
2. Create a crew
3. Invite User B
4. Check crew data

**Expected**:
- ✅ Crew `ownerId` = User A's ID
- ✅ Crew `memberIds` includes User A's ID
- ✅ API: POST `/api/social/crews`

**Test Membership**:
1. Sign in as User B
2. Accept crew invite
3. View crew

**Expected**:
- ✅ User B added to `memberIds`
- ✅ Both users see the crew
- ✅ Real IDs used throughout

### 3.5 RetentionContext - Streaks
**Steps**:
1. Sign in as User A
2. Check in to a venue
3. View streaks

**Expected**:
- ✅ Streak `userId` = User A's ID
- ✅ API: GET `/api/retention/streaks?userId=<user-a-id>`
- ✅ Streak data specific to User A

### 3.6 ContentContext - Performer Follows
**Steps**:
1. Sign in as User A
2. Follow a performer
3. Check API call

**Expected**:
- ✅ API: POST `/api/content/performers/follow`
- ✅ Body: `{ userId: "<user-a-id>", performerId: "..." }`
- ✅ User A sees followed performers

### 3.7 MonetizationContext - Price Alerts
**Steps**:
1. Sign in as User A
2. Set a price alert for a venue
3. Check storage

**Expected**:
- ✅ Alert `userId` = User A's ID
- ✅ API: POST `/api/pricing/alerts`
- ✅ User A sees their alerts only

---

## Test 4: Edge Cases

### 4.1 Unauthenticated Access
**Steps**:
1. Open app without signing in
2. Try to access protected features

**Expected**:
- ✅ Redirected to sign-in screen
- ✅ Or features show "Sign in required"
- ✅ No crashes or errors

### 4.2 Token Expiration
**Steps**:
1. Sign in successfully
2. Wait for token to expire (or manually expire it)
3. Make an API call

**Expected**:
- ✅ AuthContext detects expiration
- ✅ Automatically refreshes token
- ✅ API call succeeds with new token

**If refresh fails**:
- ✅ User redirected to sign-in
- ✅ Clear message: "Session expired"

### 4.3 Invalid Credentials
**Steps**:
1. Try to sign in with wrong password
2. Try to sign in with non-existent email

**Expected**:
- ✅ Error message: "Invalid credentials"
- ✅ No crash
- ✅ User can try again

### 4.4 Network Errors
**Steps**:
1. Turn off backend server
2. Try to sign in

**Expected**:
- ✅ Error message: "Cannot connect to server"
- ✅ Graceful error handling
- ✅ Can retry when back online

---

## Test 5: Security

### 5.1 JWT Token in Requests
**Steps**:
1. Sign in
2. Check network requests
3. Verify Authorization header

**Expected**:
- ✅ All API calls include: `Authorization: Bearer <token>`
- ✅ Token is valid JWT
- ✅ Token contains user ID and email

### 5.2 Password Security
**Steps**:
1. Check database after sign up
2. Look at user record

**Expected**:
- ✅ Password is hashed (bcrypt)
- ✅ Plain password NOT stored
- ✅ Hash starts with `$2b$10$...`

### 5.3 Token Storage
**Steps**:
1. Sign in
2. Check AsyncStorage
3. Verify stored data

**Expected**:
- ✅ Access token stored securely
- ✅ Refresh token stored securely
- ✅ Tokens cleared on sign out

---

## Test 6: Multi-User Scenarios

### 6.1 Two Users, Same Device
**Steps**:
1. Sign in as User A → Create data
2. Sign out
3. Sign in as User B → Create different data
4. Sign out
5. Sign in as User A again

**Expected**:
- ✅ User A sees only their data
- ✅ User B sees only their data
- ✅ No data leakage between users

### 6.2 Social Features Between Users
**Steps**:
1. User A follows User B
2. User B accepts follow
3. User A creates a crew
4. User A invites User B
5. User B accepts invite

**Expected**:
- ✅ Follow relationship uses real IDs
- ✅ Crew membership uses real IDs
- ✅ Both users see correct data

### 6.3 Concurrent Sessions
**Steps**:
1. Sign in as User A on Device 1
2. Sign in as User A on Device 2
3. Create data on Device 1
4. Refresh on Device 2

**Expected**:
- ✅ Data syncs across devices
- ✅ Both sessions remain valid
- ✅ No conflicts

---

## Test Results Template

### Test Date: _______________
### Tester: _______________

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1.1 | Backend Sign Up | ⬜ Pass / ⬜ Fail | |
| 1.2 | Backend Sign In | ⬜ Pass / ⬜ Fail | |
| 1.3 | Backend Get Me | ⬜ Pass / ⬜ Fail | |
| 2.1 | Frontend Sign Up | ⬜ Pass / ⬜ Fail | |
| 2.2 | Frontend Sign In | ⬜ Pass / ⬜ Fail | |
| 2.3 | Token Persistence | ⬜ Pass / ⬜ Fail | |
| 3.1 | GrowthContext | ⬜ Pass / ⬜ Fail | |
| 3.2 | EventsContext | ⬜ Pass / ⬜ Fail | |
| 3.3 | SocialContext - Follows | ⬜ Pass / ⬜ Fail | |
| 3.4 | SocialContext - Crews | ⬜ Pass / ⬜ Fail | |
| 3.5 | RetentionContext | ⬜ Pass / ⬜ Fail | |
| 3.6 | ContentContext | ⬜ Pass / ⬜ Fail | |
| 3.7 | MonetizationContext | ⬜ Pass / ⬜ Fail | |
| 4.1 | Unauthenticated Access | ⬜ Pass / ⬜ Fail | |
| 4.2 | Token Expiration | ⬜ Pass / ⬜ Fail | |
| 4.3 | Invalid Credentials | ⬜ Pass / ⬜ Fail | |
| 4.4 | Network Errors | ⬜ Pass / ⬜ Fail | |
| 5.1 | JWT in Requests | ⬜ Pass / ⬜ Fail | |
| 5.2 | Password Security | ⬜ Pass / ⬜ Fail | |
| 5.3 | Token Storage | ⬜ Pass / ⬜ Fail | |
| 6.1 | Multi-User Isolation | ⬜ Pass / ⬜ Fail | |
| 6.2 | Social Features | ⬜ Pass / ⬜ Fail | |
| 6.3 | Concurrent Sessions | ⬜ Pass / ⬜ Fail | |

---

## Quick Smoke Test (5 minutes)

For rapid verification:

1. ✅ Backend running on :3000
2. ✅ Create account via API
3. ✅ Sign in via API
4. ✅ Get user profile via API
5. ✅ Open mobile app
6. ✅ Sign in on mobile
7. ✅ Check network tab for user ID in requests
8. ✅ Verify no 'user-me' in API calls

---

## Known Issues / Notes

- [ ] Backend TypeScript definitions need @types/express, @types/bcrypt
- [ ] Some pre-existing app errors (not auth-related)
- [ ] Test files need Jest types

---

**Status**: Ready for testing ✅
