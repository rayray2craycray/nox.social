import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Event,
  Ticket,
  TicketTier,
  TicketTransfer,
  GuestListEntry,
  CheckInRecord,
} from '@/types';
import { eventsApi } from '@/services/api';
import { useAuth } from './AuthContext';

// Storage Keys
const STORAGE_KEYS = {
  EVENTS: '@nox/events',
  TICKETS: '@nox/tickets',
  TICKET_TIERS: '@nox/ticketTiers',
  TICKET_TRANSFERS: '@nox/ticketTransfers',
  GUEST_LIST: '@nox/guestList',
  CHECK_IN_RECORDS: '@nox/checkInRecords',
};

interface EventsContextValue {
  // Events
  events: Event[];
  upcomingEvents: Event[];
  getEventById: (eventId: string) => Event | undefined;
  getEventsByVenueId: (venueId: string) => Event[];

  // Tickets
  userTickets: Ticket[];
  ticketTiers: TicketTier[];
  ticketTransfers: TicketTransfer[];
  purchaseTicket: (tierId: string, userId: string) => Promise<Ticket>;
  transferTicket: (ticketId: string, toUserId: string) => Promise<Ticket>;
  acceptTicketTransfer: (transferId: string) => Promise<void>;
  declineTicketTransfer: (transferId: string) => Promise<void>;
  getTicketTiersForEvent: (eventId: string) => TicketTier[];

  // Guest List
  guestListEntries: GuestListEntry[];
  addToGuestList: (entry: Omit<GuestListEntry, 'id' | 'createdAt'>) => Promise<GuestListEntry>;
  updateGuestListStatus: (entryId: string, status: GuestListEntry['status']) => Promise<void>;
  removeFromGuestList: (entryId: string) => Promise<void>;
  getGuestListForVenue: (venueId: string, eventId?: string, date?: string) => GuestListEntry[];

  // Check-In
  checkInRecords: CheckInRecord[];
  checkInWithQR: (qrCode: string, checkedInBy: string) => Promise<CheckInRecord>;
  checkInFromGuestList: (guestListEntryId: string, checkedInBy: string) => Promise<CheckInRecord>;
  manualCheckIn: (params: { venueId: string; eventId?: string; guestName: string; checkedInBy: string }) => Promise<CheckInRecord>;

  // QR Code
  generateTicketQR: (ticketId: string) => string;
  validateQRCode: (qrCode: string) => Promise<{ valid: boolean; ticket?: Ticket; error?: string }>;

  // Loading states
  isLoading: boolean;
}

const EventsContext = createContext<EventsContextValue | undefined>(undefined);

export function EventsProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  // ===== QUERIES =====

  // Events Query
  const eventsQuery = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      try {
        const response = await eventsApi.getUpcomingEvents();
        // Map MongoDB _id to id for frontend compatibility
        const events = (response.data || []).map((event: any) => ({
          ...event,
          id: event._id || event.id,
          venueId: event.venueId?._id || event.venueId,
        }));
        return events;
      } catch (error) {
        // Silently handle missing endpoint
        if (__DEV__) console.log('[Events] Endpoint not implemented: events', error);
        return [];
      }
    },
  });

  // Tickets Query
  const ticketsQuery = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
      if (!userId) return [];
      try {
        // Use userId from auth context
        const response = await eventsApi.getUserTickets(userId);
        // Map MongoDB _id to id for frontend compatibility. The backend
        // populates eventId + tierId with the FULL documents — keep those as
        // `event`/`tier` so a ticket is self-contained and renders even when
        // its event isn't in the current "upcoming" list (past events, or
        // events beyond the list limit). Without this the tickets tab silently
        // hid such tickets.
        const tickets = (response.data || []).map((ticket: any) => {
          const populatedEvent =
            ticket.eventId && typeof ticket.eventId === 'object' ? ticket.eventId : null;
          const populatedTier =
            ticket.tierId && typeof ticket.tierId === 'object' ? ticket.tierId : null;
          return {
            ...ticket,
            id: ticket._id || ticket.id,
            eventId: populatedEvent?._id || ticket.eventId,
            tierId: populatedTier?._id || ticket.tierId,
            userId: ticket.userId?._id || ticket.userId,
            // Self-contained fallbacks (normalize _id → id for the UI)
            event: populatedEvent
              ? { ...populatedEvent, id: populatedEvent._id || populatedEvent.id }
              : undefined,
            tier: populatedTier
              ? { ...populatedTier, id: populatedTier._id || populatedTier.id }
              : undefined,
          };
        });
        return tickets;
      } catch (error) {
        // Silently handle missing endpoint
        if (__DEV__) console.log('[Events] Endpoint not implemented: tickets', error);
        return [];
      }
    },
  });

  // Ticket Tiers Query
  const ticketTiersQuery = useQuery({
    queryKey: ['ticketTiers'],
    queryFn: async () => {
      try {
        // Ticket tiers come embedded in event data
        const response = await eventsApi.getUpcomingEvents();
        const events = response.data || [];
        const tiers = events.flatMap((event: any) =>
          (event.ticketTiers || []).map((tier: any) => ({
            ...tier,
            id: tier._id || tier.id,
            eventId: event._id || event.id,
          }))
        );
        if (tiers.length > 0) {
          await AsyncStorage.setItem(STORAGE_KEYS.TICKET_TIERS, JSON.stringify(tiers));
        }
        return tiers;
      } catch (error) {
        if (__DEV__) console.log('[Events] API unavailable for ticket tiers, using cache');
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.TICKET_TIERS);
        return stored ? JSON.parse(stored) : [];
      }
    },
  });

  // Ticket Transfers Query
  const ticketTransfersQuery = useQuery({
    queryKey: ['ticketTransfers', userId],
    queryFn: async () => {
      // Transfers are tracked locally after API mutations complete
      // The actual transfer is done via eventsApi.transferTicket()
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.TICKET_TRANSFERS);
      return stored ? JSON.parse(stored) : [];
    },
  });

  // Guest List Query
  const guestListQuery = useQuery({
    queryKey: ['guestList'],
    queryFn: async (): Promise<GuestListEntry[]> => {
      try {
        // Fetch guest lists for all upcoming events
        const eventsData = eventsQuery.data || [];
        const allEntries: GuestListEntry[] = [];

        for (const event of eventsData.slice(0, 10)) {
          try {
            const response = await eventsApi.getEventGuestList(event.id);
            if (response.data) {
              const entries = response.data.map((entry: any) => ({
                ...entry,
                id: entry._id || entry.id,
              }));
              allEntries.push(...entries);
            }
          } catch {
            // Skip events without guest list data
          }
        }

        if (allEntries.length > 0) {
          await AsyncStorage.setItem(STORAGE_KEYS.GUEST_LIST, JSON.stringify(allEntries));
        }
        return allEntries;
      } catch (error) {
        if (__DEV__) console.log('[Events] API unavailable for guest list, using cache');
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.GUEST_LIST);
        return stored ? JSON.parse(stored) : [];
      }
    },
    enabled: (eventsQuery.data || []).length > 0,
  });

  // Check-In Records Query
  const checkInRecordsQuery = useQuery({
    queryKey: ['checkInRecords'],
    queryFn: async () => {
      // Check-in records are stored locally after API check-in mutations
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CHECK_IN_RECORDS);
      return stored ? JSON.parse(stored) : [];
    },
  });

  // ===== MUTATIONS =====

  // Purchase Ticket
  const purchaseTicketMutation = useMutation({
    mutationFn: async ({ tierId, userId }: { tierId: string; userId: string }) => {
      try {
        // Get the event ID from the tier
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

  // Transfer Ticket
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
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to transfer ticket');
    },
  });

  // Accept Ticket Transfer
  const acceptTransferMutation = useMutation({
    mutationFn: async (transferId: string) => {
      const transfers = ticketTransfersQuery.data || [];
      const transfer = transfers.find((t: TicketTransfer) => t.id === transferId);

      if (!transfer) throw new Error('Transfer not found');
      if (transfer.status !== 'PENDING') throw new Error('Transfer already processed');

      // Update transfer status
      const updatedTransfers = transfers.map((t: TicketTransfer) =>
        t.id === transferId
          ? { ...t, status: 'ACCEPTED' as const, acceptedAt: new Date().toISOString() }
          : t
      );

      // Update ticket ownership
      const tickets = ticketsQuery.data || [];
      const updatedTickets = tickets.map((t: Ticket) =>
        t.id === transfer.ticketId
          ? {
              ...t,
              userId: transfer.toUserId,
              status: 'TRANSFERRED' as const,
              transferredTo: transfer.toUserId,
              transferredAt: new Date().toISOString(),
            }
          : t
      );

      await AsyncStorage.setItem(STORAGE_KEYS.TICKET_TRANSFERS, JSON.stringify(updatedTransfers));
      await AsyncStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(updatedTickets));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticketTransfers'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  // Decline Ticket Transfer
  const declineTransferMutation = useMutation({
    mutationFn: async (transferId: string) => {
      const transfers = ticketTransfersQuery.data || [];
      const transfer = transfers.find((t: TicketTransfer) => t.id === transferId);

      if (!transfer) throw new Error('Transfer not found');
      if (transfer.status !== 'PENDING') throw new Error('Transfer already processed');

      const updatedTransfers = transfers.map((t: TicketTransfer) =>
        t.id === transferId ? { ...t, status: 'DECLINED' as const } : t
      );

      await AsyncStorage.setItem(STORAGE_KEYS.TICKET_TRANSFERS, JSON.stringify(updatedTransfers));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticketTransfers'] });
    },
  });

  // Add to Guest List
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success!', 'Added to guest list!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to add to guest list');
    },
  });

  // Update Guest List Status
  const updateGuestListStatusMutation = useMutation({
    mutationFn: async ({ entryId, status }: { entryId: string; status: GuestListEntry['status'] }) => {
      const entries = guestListQuery.data || [];
      const updatedEntries = entries.map((e: GuestListEntry) => {
        if (e.id === entryId) {
          const updated = { ...e, status };
          if (status === 'CHECKED_IN') {
            updated.checkedInAt = new Date().toISOString();
          }
          return updated;
        }
        return e;
      });

      await AsyncStorage.setItem(STORAGE_KEYS.GUEST_LIST, JSON.stringify(updatedEntries));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guestList'] });
    },
  });

  // Remove from Guest List
  const removeFromGuestListMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const entries = guestListQuery.data || [];
      const updated = entries.filter((e: GuestListEntry) => e.id !== entryId);

      await AsyncStorage.setItem(STORAGE_KEYS.GUEST_LIST, JSON.stringify(updated));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guestList'] });
    },
  });

  // Check-In with QR Code
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
        const checkInResponse = await eventsApi.checkInTicket(ticket.id);

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
      queryClient.invalidateQueries({ queryKey: ['checkInRecords'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success!', 'Check-in successful!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to check in');
    },
  });

  // Check-In from Guest List
  const checkInFromGuestListMutation = useMutation({
    mutationFn: async ({ guestListEntryId, checkedInBy }: { guestListEntryId: string; checkedInBy: string }) => {
      try {
        const entries = guestListQuery.data || [];
        const entry = entries.find((e: GuestListEntry) => e.id === guestListEntryId);

        if (!entry) throw new Error('Guest list entry not found');
        if (entry.status === 'CHECKED_IN') throw new Error('Guest already checked in');
        if (entry.status === 'CANCELLED') throw new Error('Guest list entry cancelled');

        // Check in the guest via API
        const response = await eventsApi.checkInGuest(guestListEntryId);

        // Create check-in record for local tracking
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
      queryClient.invalidateQueries({ queryKey: ['checkInRecords'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success!', 'Guest checked in!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to check in guest');
    },
  });

  // Manual Check-In
  const manualCheckInMutation = useMutation({
    mutationFn: async (params: { venueId: string; eventId?: string; guestName: string; checkedInBy: string }) => {
      const newRecord: CheckInRecord = {
        id: `checkin-${Date.now()}`,
        venueId: params.venueId,
        eventId: params.eventId,
        guestName: params.guestName,
        checkedInBy: params.checkedInBy,
        checkedInAt: new Date().toISOString(),
        method: 'MANUAL',
      };

      const existingRecords = checkInRecordsQuery.data || [];
      const updatedRecords = [...existingRecords, newRecord];

      await AsyncStorage.setItem(STORAGE_KEYS.CHECK_IN_RECORDS, JSON.stringify(updatedRecords));

      return newRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkInRecords'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  // ===== HELPER FUNCTIONS =====

  const generateTicketQR = (ticketId: string): string => {
    const ticket = (ticketsQuery.data || []).find((t: Ticket) => t.id === ticketId);
    return ticket?.qrCode || '';
  };

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

  // ===== COMPUTED VALUES =====

  const events = eventsQuery.data || [];
  const upcomingEvents = events.filter((e: Event) => {
    const now = new Date();
    return new Date(e.date) >= now && e.status === 'UPCOMING';
  }).sort((a: Event, b: Event) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const userTickets = (ticketsQuery.data || []).filter((t: Ticket) => t.userId === userId && t.status !== 'CANCELLED');
  const ticketTiers = ticketTiersQuery.data || [];
  const ticketTransfers = ticketTransfersQuery.data || [];
  const guestListEntries = guestListQuery.data || [];
  const checkInRecords = checkInRecordsQuery.data || [];

  // ===== CONTEXT VALUE =====

  const value: EventsContextValue = {
    // Events
    events,
    upcomingEvents,
    getEventById: (eventId) => events.find((e: Event) => e.id === eventId),
    getEventsByVenueId: (venueId) => events.filter((e: Event) => e.venueId === venueId),

    // Tickets
    userTickets,
    ticketTiers,
    ticketTransfers,
    purchaseTicket: async (tierId, userId) => purchaseTicketMutation.mutateAsync({ tierId, userId }),
    transferTicket: async (ticketId, toUserId) => transferTicketMutation.mutateAsync({ ticketId, toUserId }),
    acceptTicketTransfer: async (transferId) => acceptTransferMutation.mutateAsync(transferId),
    declineTicketTransfer: async (transferId) => declineTransferMutation.mutateAsync(transferId),
    getTicketTiersForEvent: (eventId) => ticketTiers.filter((t: TicketTier) => t.eventId === eventId),

    // Guest List
    guestListEntries,
    addToGuestList: async (entry) => addToGuestListMutation.mutateAsync(entry),
    updateGuestListStatus: async (entryId, status) => updateGuestListStatusMutation.mutateAsync({ entryId, status }),
    removeFromGuestList: async (entryId) => removeFromGuestListMutation.mutateAsync(entryId),
    getGuestListForVenue: (venueId, eventId, date) => {
      return guestListEntries.filter((g: GuestListEntry) => {
        if (g.venueId !== venueId) return false;
        if (eventId && g.eventId !== eventId) return false;
        if (date && g.date !== date) return false;
        return true;
      });
    },

    // Check-In
    checkInRecords,
    checkInWithQR: async (qrCode, checkedInBy) => checkInWithQRMutation.mutateAsync({ qrCode, checkedInBy }),
    checkInFromGuestList: async (guestListEntryId, checkedInBy) =>
      checkInFromGuestListMutation.mutateAsync({ guestListEntryId, checkedInBy }),
    manualCheckIn: async (params) => manualCheckInMutation.mutateAsync(params),

    // QR Code
    generateTicketQR,
    validateQRCode,

    // Loading
    isLoading: eventsQuery.isLoading || ticketsQuery.isLoading || ticketTiersQuery.isLoading,
  };

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
}
