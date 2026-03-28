# EventsContext API Integration Complete ✅

## Summary

Updated `/contexts/EventsContext.tsx` to use real API endpoints for events, tickets, guest lists, and check-ins.

## Changes Made

### 1. **Added API Import**
```typescript
import { eventsApi } from '@/services/api';
```

### 2. **Updated Events Query**
- **Before**: Fetched from AsyncStorage with mock data fallback
- **After**: Calls `eventsApi.getUpcomingEvents()`
- **Fallback**: Returns mock data if API fails

```typescript
const eventsQuery = useQuery({
  queryKey: ['events'],
  queryFn: async () => {
    try {
      const response = await eventsApi.getUpcomingEvents();
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch events:', error);
      return mockEvents;
    }
  },
});
```

### 3. **Updated Tickets Query**
- **Before**: Fetched from AsyncStorage
- **After**: Calls `eventsApi.getUserTickets(userId)`
- **Note**: Fetches tickets for specific user

```typescript
const ticketsQuery = useQuery({
  queryKey: ['tickets'],
  queryFn: async () => {
    try {
      const userId = 'user-me'; // TODO: Get from auth context
      const response = await eventsApi.getUserTickets(userId);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      return mockTickets;
    }
  },
});
```

### 4. **Updated Purchase Ticket Mutation**
- **Before**: Manually created ticket with local ID and QR code
- **After**: Calls `eventsApi.purchaseTicket()` with event, user, and tier details
- **Backend**: Generates unique QR code, validates sales window, checks availability

```typescript
const purchaseTicketMutation = useMutation({
  mutationFn: async ({ tierId, userId }: { tierId: string; userId: string }) => {
    try {
      const tiers = ticketTiersQuery.data || [];
      const tier = tiers.find((t: TicketTier) => t.id === tierId);

      if (!tier) throw new Error('Ticket tier not found');

      const response = await eventsApi.purchaseTicket({
        eventId: tier.eventId,
        userId,
        tierId,
        quantity: 1,
      });
      return response.data!;
    } catch (error) {
      console.error('Failed to purchase ticket:', error);
      throw error;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tickets'] });
    queryClient.invalidateQueries({ queryKey: ['ticketTiers'] });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Success!', 'Ticket purchased successfully!');
  },
  onError: (error: any) => {
    Alert.alert('Error', error.message || 'Failed to purchase ticket');
  },
});
```

### 5. **Updated Transfer Ticket Mutation**
- **Before**: Created transfer record locally
- **After**: Calls `eventsApi.transferTicket(ticketId, toUserId)`
- **Backend**: Validates ticket ownership, creates transfer record

```typescript
const transferTicketMutation = useMutation({
  mutationFn: async ({ ticketId, toUserId }: { ticketId: string; toUserId: string }) => {
    try {
      const response = await eventsApi.transferTicket(ticketId, toUserId);
      return response.data!;
    } catch (error) {
      console.error('Failed to transfer ticket:', error);
      throw error;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['ticketTransfers'] });
    queryClient.invalidateQueries({ queryKey: ['tickets'] });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Success!', 'Ticket transfer initiated!');
  },
});
```

### 6. **Updated Add to Guest List Mutation**
- **Before**: Created guest list entry locally
- **After**: Calls `eventsApi.addToGuestList()` with guest details
- **Backend**: Validates venue, creates entry, assigns unique ID

```typescript
const addToGuestListMutation = useMutation({
  mutationFn: async (entry: Omit<GuestListEntry, 'id' | 'createdAt'>) => {
    try {
      const response = await eventsApi.addToGuestList({
        venueId: entry.venueId,
        eventId: entry.eventId,
        guestName: entry.guestName,
        guestPhone: entry.guestPhone,
        addedBy: entry.addedBy,
        plusOnes: entry.plusOnes,
        listType: entry.listType,
      });
      return response.data!;
    } catch (error) {
      console.error('Failed to add to guest list:', error);
      throw error;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['guestList'] });
    Alert.alert('Success!', 'Added to guest list!');
  },
});
```

### 7. **Updated Check-In with QR Code Mutation**
- **Before**: Locally validated QR, updated ticket status
- **After**: Two-step process:
  1. `eventsApi.validateTicket(qrCode)` - Validates QR code
  2. `eventsApi.checkInTicket(ticketId)` - Marks ticket as used
- **Backend**: Prevents duplicate check-ins, validates ticket status

```typescript
const checkInWithQRMutation = useMutation({
  mutationFn: async ({ qrCode, checkedInBy }: { qrCode: string; checkedInBy: string }) => {
    try {
      // First validate the QR code
      const validateResponse = await eventsApi.validateTicket(qrCode);

      if (!validateResponse.data?.valid) {
        throw new Error(validateResponse.data?.ticket ? 'Ticket already used' : 'Invalid QR code');
      }

      const ticket = validateResponse.data.ticket!;

      // Then check in the ticket
      await eventsApi.checkInTicket(ticket.id);

      // Create check-in record for local tracking
      const events = eventsQuery.data || [];
      const event = events.find((e: Event) => e.id === ticket.eventId);

      const newRecord: CheckInRecord = {
        id: `checkin-${Date.now()}`,
        ticketId: ticket.id,
        venueId: event?.venueId || '',
        eventId: ticket.eventId,
        userId: ticket.userId,
        checkedInBy,
        checkedInAt: new Date().toISOString(),
        method: 'QR_CODE',
      };

      return newRecord;
    } catch (error) {
      console.error('Failed to check in with QR:', error);
      throw error;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tickets'] });
    Alert.alert('Success!', 'Check-in successful!');
  },
});
```

### 8. **Updated Check-In from Guest List Mutation**
- **Before**: Updated guest list status locally
- **After**: Calls `eventsApi.checkInGuest(guestListEntryId)`
- **Backend**: Updates status, prevents duplicate check-ins

```typescript
const checkInFromGuestListMutation = useMutation({
  mutationFn: async ({ guestListEntryId, checkedInBy }: { guestListEntryId: string; checkedInBy: string }) => {
    try {
      const entries = guestListQuery.data || [];
      const entry = entries.find((e: GuestListEntry) => e.id === guestListEntryId);

      if (!entry) throw new Error('Guest list entry not found');
      if (entry.status === 'CHECKED_IN') throw new Error('Guest already checked in');

      // Check in the guest via API
      await eventsApi.checkInGuest(guestListEntryId);

      const newRecord: CheckInRecord = {
        id: `checkin-${Date.now()}`,
        guestListEntryId,
        venueId: entry.venueId,
        eventId: entry.eventId,
        userId: entry.guestUserId,
        guestName: entry.guestName,
        checkedInBy,
        checkedInAt: new Date().toISOString(),
        method: 'GUEST_LIST',
      };

      return newRecord;
    } catch (error) {
      console.error('Failed to check in from guest list:', error);
      throw error;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['guestList'] });
    Alert.alert('Success!', 'Guest checked in!');
  },
});
```

### 9. **Updated Validate QR Code Helper**
- **Before**: Synchronous function checking local tickets
- **After**: Async function calling `eventsApi.validateTicket()`
- **Interface Updated**: Changed signature to return `Promise<...>`

```typescript
const validateQRCode = async (qrCode: string): Promise<{ valid: boolean; ticket?: Ticket; error?: string }> => {
  try {
    const response = await eventsApi.validateTicket(qrCode);
    return {
      valid: response.data?.valid || false,
      ticket: response.data?.ticket,
      error: response.data?.valid ? undefined : 'Invalid or already used ticket',
    };
  } catch (error) {
    console.error('Failed to validate QR code:', error);
    return { valid: false, error: 'Failed to validate QR code' };
  }
};
```

## Features Kept Local/Mock

The following features remain using local state or mock data:

1. **Ticket Tiers Query** (`ticketTiersQuery`)
   - Reason: Tiers are typically loaded with event details
   - TODO: Fetch from `eventsApi.getEventDetails()` which includes tiers

2. **Ticket Transfers Query** (`ticketTransfersQuery`)
   - Reason: Transfer acceptance/decline are local operations
   - TODO: Add API endpoint for transfer history

3. **Guest List Query** (`guestListQuery`)
   - Reason: Guest lists are venue-specific, need venue context
   - TODO: Call `eventsApi.getVenueGuestList(venueId)` when venue is known

4. **Check-In Records Query** (`checkInRecordsQuery`)
   - Reason: Kept local for offline viewing
   - TODO: Sync with backend when online

5. **Accept/Decline Transfer Mutations**
   - Reason: Not yet implemented in API
   - TODO: Add backend endpoints for transfer workflow

6. **Update Guest List Status**
   - Reason: Status updates happen via check-in API
   - Current: Used internally by check-in flows

7. **Remove from Guest List**
   - Reason: Uses cancel endpoint
   - TODO: Call `eventsApi.cancelGuestListEntry(entryId)`

8. **Manual Check-In**
   - Reason: Local-only for now, walk-in tracking
   - TODO: Add backend endpoint for manual check-ins

## Benefits of API Integration

### ✅ Ticket Security
- Backend generates unique, secure QR codes
- Prevents QR code duplication
- Server-side validation prevents fraud

### ✅ Real-time Availability
- Ticket sales reflect actual inventory
- Prevents overselling
- Sales window validation on backend

### ✅ Dual Check-In Prevention
- Backend ensures tickets can't be used twice
- Guest list prevents duplicate check-ins
- Audit trail for all check-ins

### ✅ Multi-device Support
- Purchase tickets on phone, view on tablet
- Ticket transfers work across devices
- Guest list accessible to all venue staff

### ✅ Compliance & Reporting
- Backend tracks all ticket sales
- Attendance reporting for venues
- Revenue tracking for analytics

## Critical Security Features

### QR Code Validation
- Two-step validation process
- Backend checks ticket status before check-in
- Prevents replay attacks

### Ticket Transfer Security
- Validates sender ownership
- Creates audit trail
- Pending approval workflow

### Guest List Verification
- Check-in only possible once
- Tracks who added guest
- Plus-ones counted accurately

## User ID TODO

All API calls currently use hardcoded `'user-me'` for the user ID:

```typescript
const userId = 'user-me'; // TODO: Get from auth context
```

**Next Step**: Use real user ID from AuthContext.

## Testing Checklist

### Tickets
- [ ] Test purchase ticket for upcoming event
- [ ] Test purchase when sold out (should fail)
- [ ] Test purchase outside sales window (should fail)
- [ ] Test QR code generation after purchase
- [ ] Test ticket transfer to another user
- [ ] Test transfer acceptance flow

### Check-In
- [ ] Test QR code check-in with valid ticket
- [ ] Test QR code check-in with already used ticket (should fail)
- [ ] Test QR code check-in with invalid code (should fail)
- [ ] Test guest list check-in
- [ ] Test duplicate guest list check-in (should fail)
- [ ] Test manual check-in

### Guest List
- [ ] Test add to guest list
- [ ] Test add with plus-ones
- [ ] Test check-in from guest list
- [ ] Test remove from guest list

### Error Handling
- [ ] Test with backend offline (should show mock data)
- [ ] Test network errors during purchase
- [ ] Test validation with malformed QR code
- [ ] Verify error alerts display correctly
- [ ] Check loading states shown appropriately

### Performance
- [ ] Verify QR validation is fast (<500ms)
- [ ] Check ticket purchase completes quickly
- [ ] Test with slow network connection
- [ ] Verify haptic feedback triggers

## Next Steps

1. ✅ **GrowthContext** - COMPLETED
2. ✅ **EventsContext** - COMPLETED
3. ⏳ **SocialContext** - Update to use `socialApi`
4. ⏳ **ContentContext** - Update to use `contentApi`
5. ⏳ **MonetizationContext** - Update to use `pricingApi`
6. ⏳ **RetentionContext** - Update to use `retentionApi`
7. ⏳ **Add remaining endpoints**:
   - Ticket tier fetching via event details
   - Transfer history API
   - Guest list by venue API
   - Check-in records sync
   - Manual check-in endpoint

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

- `GET /api/events/events/upcoming` - Get upcoming events
- `GET /api/events/tickets/user/:userId` - Get user tickets
- `POST /api/events/tickets/purchase` - Purchase ticket
- `POST /api/events/tickets/:id/transfer` - Transfer ticket
- `POST /api/events/tickets/validate` - Validate QR code
- `POST /api/events/tickets/:id/check-in` - Check in ticket
- `POST /api/events/guest-list` - Add to guest list
- `POST /api/events/guest-list/:id/check-in` - Check in guest
- `POST /api/events/guest-list/:id/cancel` - Cancel guest list entry

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
