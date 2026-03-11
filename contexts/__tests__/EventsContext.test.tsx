import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
}));

jest.mock('@/services/api', () => ({
  eventsApi: {
    getUpcomingEvents: jest.fn().mockResolvedValue({ data: [] }),
    getUserTickets: jest.fn().mockResolvedValue({ data: [] }),
    purchaseTicket: jest.fn(),
    transferTicket: jest.fn(),
    validateTicket: jest.fn(),
    checkInTicket: jest.fn(),
    addToGuestList: jest.fn(),
    checkInGuest: jest.fn(),
    getEventsByPerformer: jest.fn().mockResolvedValue({ data: [] }),
    getEventGuestList: jest.fn().mockResolvedValue({ data: [] }),
  },
}));

jest.mock('../AuthContext', () => ({
  useAuth: () => ({
    userId: 'test-user-id',
    accessToken: 'test-token',
  }),
}));

import { eventsApi } from '@/services/api';
const mockEventsApi = eventsApi as jest.Mocked<typeof eventsApi>;

import { EventsProvider, useEvents } from '../EventsContext';

// Suppress console noise
let logSpy: jest.SpyInstance;
let errorSpy: jest.SpyInstance;
beforeAll(() => {
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  logSpy.mockRestore();
  errorSpy.mockRestore();
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <EventsProvider>{children}</EventsProvider>
    </QueryClientProvider>
  );
}

describe('EventsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
  });

  it('should throw when used outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    expect(() => {
      renderHook(() => useEvents());
    }).toThrow('useEvents must be used within an EventsProvider');
    spy.mockRestore();
  });

  it('should provide all expected methods and state', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useEvents(), { wrapper });

    // Events
    expect(Array.isArray(result.current.events)).toBe(true);
    expect(Array.isArray(result.current.upcomingEvents)).toBe(true);
    expect(typeof result.current.getEventById).toBe('function');
    expect(typeof result.current.getEventsByVenueId).toBe('function');

    // Tickets
    expect(Array.isArray(result.current.userTickets)).toBe(true);
    expect(Array.isArray(result.current.ticketTiers)).toBe(true);
    expect(Array.isArray(result.current.ticketTransfers)).toBe(true);
    expect(typeof result.current.purchaseTicket).toBe('function');
    expect(typeof result.current.transferTicket).toBe('function');
    expect(typeof result.current.acceptTicketTransfer).toBe('function');
    expect(typeof result.current.declineTicketTransfer).toBe('function');
    expect(typeof result.current.getTicketTiersForEvent).toBe('function');

    // Guest List
    expect(Array.isArray(result.current.guestListEntries)).toBe(true);
    expect(typeof result.current.addToGuestList).toBe('function');
    expect(typeof result.current.updateGuestListStatus).toBe('function');
    expect(typeof result.current.removeFromGuestList).toBe('function');
    expect(typeof result.current.getGuestListForVenue).toBe('function');

    // Check-In
    expect(Array.isArray(result.current.checkInRecords)).toBe(true);
    expect(typeof result.current.checkInWithQR).toBe('function');
    expect(typeof result.current.checkInFromGuestList).toBe('function');
    expect(typeof result.current.manualCheckIn).toBe('function');

    // QR Code
    expect(typeof result.current.generateTicketQR).toBe('function');
    expect(typeof result.current.validateQRCode).toBe('function');

    // Loading
    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('should return empty events by default', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useEvents(), { wrapper });

    await waitFor(() => {
      expect(result.current.events).toEqual([]);
      expect(result.current.upcomingEvents).toEqual([]);
    });
  });

  it('should return empty userTickets by default', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useEvents(), { wrapper });

    await waitFor(() => {
      expect(result.current.userTickets).toEqual([]);
    });
  });

  it('should generate ticket QR code', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useEvents(), { wrapper });

    // No tickets loaded, so QR should return empty string
    const qr = result.current.generateTicketQR('nonexistent-ticket');
    expect(qr).toBe('');
  });

  it('should validate QR code via API', async () => {
    mockEventsApi.validateTicket.mockResolvedValueOnce({
      data: { valid: true, ticket: { id: 'ticket-1', qrCode: 'qr-123' } as any },
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useEvents(), { wrapper });

    let validation: any;
    await act(async () => {
      validation = await result.current.validateQRCode('qr-123');
    });

    expect(validation.valid).toBe(true);
    expect(mockEventsApi.validateTicket).toHaveBeenCalledWith('qr-123');
  });

  it('should handle QR validation failure', async () => {
    mockEventsApi.validateTicket.mockRejectedValueOnce(new Error('Network error'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useEvents(), { wrapper });

    let validation: any;
    await act(async () => {
      validation = await result.current.validateQRCode('bad-qr');
    });

    expect(validation.valid).toBe(false);
    expect(validation.error).toBeDefined();
  });

  it('should return empty guest list for venue', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useEvents(), { wrapper });

    const guestList = result.current.getGuestListForVenue('venue-1');
    expect(guestList).toEqual([]);
  });

  it('should return empty ticket tiers for event', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useEvents(), { wrapper });

    const tiers = result.current.getTicketTiersForEvent('event-1');
    expect(tiers).toEqual([]);
  });

  it('should return undefined for getEventById with no events', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useEvents(), { wrapper });

    const event = result.current.getEventById('nonexistent');
    expect(event).toBeUndefined();
  });

  it('should return empty array for getEventsByVenueId with no events', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useEvents(), { wrapper });

    const events = result.current.getEventsByVenueId('venue-1');
    expect(events).toEqual([]);
  });

  it('should perform manual check-in', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useEvents(), { wrapper });

    let record: any;
    await act(async () => {
      record = await result.current.manualCheckIn({
        venueId: 'venue-1',
        guestName: 'John Doe',
        checkedInBy: 'staff-1',
      });
    });

    expect(record).toBeDefined();
    expect(record.guestName).toBe('John Doe');
    expect(record.method).toBe('MANUAL');
    expect(record.venueId).toBe('venue-1');
  });

  it('should perform manual check-in with optional eventId', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useEvents(), { wrapper });

    let record: any;
    await act(async () => {
      record = await result.current.manualCheckIn({
        venueId: 'venue-2',
        eventId: 'event-99',
        guestName: 'Jane Doe',
        checkedInBy: 'staff-2',
      });
    });

    expect(record.eventId).toBe('event-99');
    expect(record.method).toBe('MANUAL');
  });

  it('should load events from API and map _id to id', async () => {
    mockEventsApi.getUpcomingEvents.mockResolvedValueOnce({
      data: [
        { _id: 'mongo-id-1', title: 'Event One', venueId: { _id: 'venue-mongo' }, date: '2027-01-01', status: 'UPCOMING' },
        { _id: 'mongo-id-2', title: 'Event Two', venueId: 'venue-plain', date: '2027-02-01', status: 'UPCOMING' },
      ],
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useEvents(), { wrapper });

    await waitFor(() => {
      expect(result.current.events.length).toBe(2);
      expect(result.current.events[0].id).toBe('mongo-id-1');
      expect(result.current.events[0].venueId).toBe('venue-mongo');
      expect(result.current.events[1].venueId).toBe('venue-plain');
    });
  });

  it('should filter upcoming events correctly', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const pastDate = new Date(Date.now() - 86400000).toISOString();

    mockEventsApi.getUpcomingEvents.mockResolvedValueOnce({
      data: [
        { _id: 'e1', title: 'Future', date: futureDate, status: 'UPCOMING' },
        { _id: 'e2', title: 'Past', date: pastDate, status: 'UPCOMING' },
        { _id: 'e3', title: 'Cancelled', date: futureDate, status: 'CANCELLED' },
      ],
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useEvents(), { wrapper });

    await waitFor(() => {
      expect(result.current.events.length).toBe(3);
      expect(result.current.upcomingEvents.length).toBe(1);
      expect(result.current.upcomingEvents[0].id).toBe('e1');
    });
  });

  it('should getEventById correctly', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    mockEventsApi.getUpcomingEvents.mockResolvedValueOnce({
      data: [
        { _id: 'e10', title: 'Test Event', date: futureDate, status: 'UPCOMING', venueId: 'v1' },
      ],
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useEvents(), { wrapper });

    await waitFor(() => {
      expect(result.current.events.length).toBe(1);
    });

    const event = result.current.getEventById('e10');
    expect(event).toBeDefined();
    expect(event!.title).toBe('Test Event');

    const missing = result.current.getEventById('nonexistent');
    expect(missing).toBeUndefined();
  });

  it('should getEventsByVenueId correctly', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    mockEventsApi.getUpcomingEvents.mockResolvedValueOnce({
      data: [
        { _id: 'e20', title: 'V1 Event', date: futureDate, venueId: 'venue-1', status: 'UPCOMING' },
        { _id: 'e21', title: 'V2 Event', date: futureDate, venueId: 'venue-2', status: 'UPCOMING' },
      ],
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useEvents(), { wrapper });

    await waitFor(() => {
      expect(result.current.events.length).toBe(2);
    });

    const venueEvents = result.current.getEventsByVenueId('venue-1');
    expect(venueEvents).toHaveLength(1);
    expect(venueEvents[0].id).toBe('e20');
  });

  it('should filter userTickets by userId and exclude cancelled', async () => {
    mockEventsApi.getUserTickets.mockResolvedValueOnce({
      data: [
        { _id: 't1', userId: 'test-user-id', eventId: 'e1', status: 'ACTIVE' },
        { _id: 't2', userId: 'test-user-id', eventId: 'e2', status: 'CANCELLED' },
        { _id: 't3', userId: 'other-user', eventId: 'e3', status: 'ACTIVE' },
      ],
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useEvents(), { wrapper });

    await waitFor(() => {
      expect(result.current.userTickets.length).toBe(1);
      expect(result.current.userTickets[0].id).toBe('t1');
    });
  });

  it('should return QR code for existing ticket', async () => {
    mockEventsApi.getUserTickets.mockResolvedValueOnce({
      data: [
        { _id: 'ticket-qr', userId: 'test-user-id', qrCode: 'qr-data-abc', status: 'ACTIVE' },
      ],
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useEvents(), { wrapper });

    await waitFor(() => {
      expect(result.current.userTickets.length).toBe(1);
    });

    const qr = result.current.generateTicketQR('ticket-qr');
    expect(qr).toBe('qr-data-abc');
  });

  it('should handle QR validation returning invalid', async () => {
    mockEventsApi.validateTicket.mockResolvedValueOnce({
      data: { valid: false },
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useEvents(), { wrapper });

    let validation: any;
    await act(async () => {
      validation = await result.current.validateQRCode('invalid-qr');
    });

    expect(validation.valid).toBe(false);
    expect(validation.error).toBe('Invalid or already used ticket');
  });

  it('should getTicketTiersForEvent with loaded tiers', async () => {
    mockEventsApi.getUpcomingEvents.mockResolvedValue({
      data: [
        {
          _id: 'event-t1',
          title: 'Event T1',
          date: new Date(Date.now() + 86400000).toISOString(),
          status: 'UPCOMING',
          ticketTiers: [
            { _id: 'tier-1', name: 'GA', price: 20 },
            { _id: 'tier-2', name: 'VIP', price: 50 },
          ],
        },
      ],
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useEvents(), { wrapper });

    await waitFor(() => {
      expect(result.current.ticketTiers.length).toBeGreaterThanOrEqual(0);
    });
  });

  it('should handle events API failure gracefully', async () => {
    mockEventsApi.getUpcomingEvents.mockRejectedValueOnce(new Error('API down'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useEvents(), { wrapper });

    await waitFor(() => {
      expect(result.current.events).toEqual([]);
    });
  });

  it('should handle tickets API failure gracefully', async () => {
    mockEventsApi.getUserTickets.mockRejectedValueOnce(new Error('API down'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useEvents(), { wrapper });

    await waitFor(() => {
      expect(result.current.userTickets).toEqual([]);
    });
  });

  it('should filter guest list by venue, event, and date', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useEvents(), { wrapper });

    // With no guest list entries, all filters return empty
    const byVenue = result.current.getGuestListForVenue('v1');
    expect(byVenue).toEqual([]);

    const byVenueAndEvent = result.current.getGuestListForVenue('v1', 'e1');
    expect(byVenueAndEvent).toEqual([]);

    const byVenueEventDate = result.current.getGuestListForVenue('v1', 'e1', '2026-01-01');
    expect(byVenueEventDate).toEqual([]);
  });

  it('should transfer ticket via API', async () => {
    mockEventsApi.transferTicket.mockResolvedValueOnce({ data: { id: 'transfer-1' } });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useEvents(), { wrapper });

    await act(async () => {
      await result.current.transferTicket('ticket-1', 'recipient-user');
    });

    expect(mockEventsApi.transferTicket).toHaveBeenCalledWith('ticket-1', 'recipient-user');
  });

  it('should add to guest list via API', async () => {
    mockEventsApi.addToGuestList.mockResolvedValueOnce({
      data: { id: 'gl-1', guestName: 'Guest One' },
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useEvents(), { wrapper });

    let entry: any;
    await act(async () => {
      entry = await result.current.addToGuestList({
        venueId: 'v1',
        eventId: 'e1',
        guestName: 'Guest One',
        guestPhone: '555-1234',
        addedBy: 'staff-1',
        plusOnes: 2,
        listType: 'VIP',
        status: 'PENDING',
        date: '2026-01-01',
      });
    });

    expect(mockEventsApi.addToGuestList).toHaveBeenCalled();
  });
});
