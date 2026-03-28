import {
  Event,
  TicketTier,
  Ticket,
  TicketTransfer,
  GuestListEntry,
  CheckInRecord,
} from '@/types';

// Mock Events
export const mockEvents: Event[] = [
  {
    id: 'event-1',
    venueId: 'venue-1',
    title: 'Friday Night House Party',
    description: 'Join us for an unforgettable night of house music with resident DJs and special guests. Early bird tickets available now!',
    performerIds: ['performer-1', 'performer-2'],
    date: '2026-01-10',
    startTime: '22:00',
    endTime: '04:00',
    ticketTiers: [], // Will be populated from mockTicketTiers
    imageUrl: 'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=800',
    genres: ['House', 'Tech House', 'Deep House'],
    totalCapacity: 500,
    createdAt: '2025-12-01T10:00:00Z',
    status: 'UPCOMING',
  },
  {
    id: 'event-2',
    venueId: 'venue-2',
    title: 'Underground Techno Night',
    description: 'Experience the cutting edge of techno with international headliners. Limited VIP tables available.',
    performerIds: ['performer-3'],
    date: '2026-01-11',
    startTime: '23:00',
    endTime: '06:00',
    ticketTiers: [],
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
    genres: ['Techno', 'Industrial Techno'],
    totalCapacity: 800,
    createdAt: '2025-12-05T12:00:00Z',
    status: 'UPCOMING',
  },
  {
    id: 'event-3',
    venueId: 'venue-3',
    title: 'Latin Night Fiesta',
    description: 'The hottest Latin beats with live performers and DJ sets. Salsa, reggaeton, and more!',
    performerIds: ['performer-4'],
    date: '2026-01-12',
    startTime: '21:00',
    endTime: '03:00',
    ticketTiers: [],
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800',
    genres: ['Reggaeton', 'Salsa', 'Latin'],
    totalCapacity: 300,
    createdAt: '2025-12-10T14:00:00Z',
    status: 'UPCOMING',
  },
  {
    id: 'event-4',
    venueId: 'venue-1',
    title: 'New Years Eve Countdown',
    description: 'Ring in 2026 with the biggest party of the year! 4 rooms, 12 DJs, champagne at midnight.',
    performerIds: ['performer-1', 'performer-2', 'performer-3', 'performer-5'],
    date: '2025-12-31',
    startTime: '21:00',
    endTime: '06:00',
    ticketTiers: [],
    imageUrl: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=800',
    genres: ['House', 'Techno', 'EDM', 'Hip-Hop'],
    totalCapacity: 1200,
    createdAt: '2025-11-01T10:00:00Z',
    status: 'UPCOMING',
  },
  {
    id: 'event-5',
    venueId: 'venue-4',
    title: 'R&B Saturdays',
    description: 'Smooth R&B vibes every Saturday. Premium bottle service and VIP sections available.',
    performerIds: ['performer-6'],
    date: '2026-01-13',
    startTime: '22:00',
    endTime: '03:00',
    ticketTiers: [],
    imageUrl: 'https://images.unsplash.com/photo-1571974599782-87624638275e?w=800',
    genres: ['R&B', 'Neo-Soul'],
    totalCapacity: 200,
    createdAt: '2025-12-15T16:00:00Z',
    status: 'UPCOMING',
  },
];

// Mock Ticket Tiers
export const mockTicketTiers: TicketTier[] = [
  // Event 1 Tiers
  {
    id: 'tier-1-1',
    eventId: 'event-1',
    name: 'Early Bird',
    price: 20,
    quantity: 100,
    sold: 87,
    tier: 'EARLY_BIRD',
    salesWindow: {
      start: '2025-12-01T10:00:00Z',
      end: '2026-01-03T23:59:59Z',
    },
    isAppExclusive: true,
    perks: ['$5 drink voucher', 'Express entry'],
  },
  {
    id: 'tier-1-2',
    eventId: 'event-1',
    name: 'General Admission',
    price: 30,
    quantity: 300,
    sold: 142,
    tier: 'GENERAL',
    salesWindow: {
      start: '2025-12-01T10:00:00Z',
      end: '2026-01-10T22:00:00Z',
    },
    isAppExclusive: false,
  },
  {
    id: 'tier-1-3',
    eventId: 'event-1',
    name: 'VIP',
    price: 75,
    quantity: 100,
    sold: 58,
    tier: 'VIP',
    salesWindow: {
      start: '2025-12-01T10:00:00Z',
      end: '2026-01-10T22:00:00Z',
    },
    isAppExclusive: false,
    perks: ['VIP area access', 'Complimentary coat check', '2 drink tickets', 'Meet & greet with DJs'],
  },
  // Event 2 Tiers
  {
    id: 'tier-2-1',
    eventId: 'event-2',
    name: 'Early Access',
    price: 25,
    quantity: 150,
    sold: 142,
    tier: 'EARLY_BIRD',
    salesWindow: {
      start: '2025-12-05T12:00:00Z',
      end: '2026-01-04T23:59:59Z',
    },
    isAppExclusive: true,
    perks: ['Skip the line', 'App-exclusive discount'],
  },
  {
    id: 'tier-2-2',
    eventId: 'event-2',
    name: 'Standard Entry',
    price: 35,
    quantity: 500,
    sold: 234,
    tier: 'GENERAL',
    salesWindow: {
      start: '2025-12-05T12:00:00Z',
      end: '2026-01-11T23:00:00Z',
    },
    isAppExclusive: false,
  },
  {
    id: 'tier-2-3',
    eventId: 'event-2',
    name: 'VIP Table (4 people)',
    price: 300,
    quantity: 20,
    sold: 12,
    tier: 'TABLE',
    salesWindow: {
      start: '2025-12-05T12:00:00Z',
      end: '2026-01-11T23:00:00Z',
    },
    isAppExclusive: false,
    perks: ['Reserved table', 'Bottle service included', 'Dedicated server', 'VIP entrance'],
  },
  // Event 3 Tiers
  {
    id: 'tier-3-1',
    eventId: 'event-3',
    name: 'General Admission',
    price: 15,
    quantity: 200,
    sold: 89,
    tier: 'GENERAL',
    salesWindow: {
      start: '2025-12-10T14:00:00Z',
      end: '2026-01-12T21:00:00Z',
    },
    isAppExclusive: false,
  },
  {
    id: 'tier-3-2',
    eventId: 'event-3',
    name: 'VIP',
    price: 40,
    quantity: 100,
    sold: 34,
    tier: 'VIP',
    salesWindow: {
      start: '2025-12-10T14:00:00Z',
      end: '2026-01-12T21:00:00Z',
    },
    isAppExclusive: true,
    perks: ['VIP section', 'Complimentary appetizers', '1 drink ticket'],
  },
  // Event 4 Tiers (NYE)
  {
    id: 'tier-4-1',
    eventId: 'event-4',
    name: 'Super Early Bird',
    price: 75,
    quantity: 200,
    sold: 200,
    tier: 'EARLY_BIRD',
    salesWindow: {
      start: '2025-11-01T10:00:00Z',
      end: '2025-11-30T23:59:59Z',
    },
    isAppExclusive: true,
    perks: ['Lowest price guarantee', 'Champagne toast at midnight'],
  },
  {
    id: 'tier-4-2',
    eventId: 'event-4',
    name: 'General Admission',
    price: 125,
    quantity: 800,
    sold: 456,
    tier: 'GENERAL',
    salesWindow: {
      start: '2025-11-01T10:00:00Z',
      end: '2025-12-31T21:00:00Z',
    },
    isAppExclusive: false,
    perks: ['Champagne toast at midnight', 'Access to all 4 rooms'],
  },
  {
    id: 'tier-4-3',
    eventId: 'event-4',
    name: 'VIP Package',
    price: 250,
    quantity: 200,
    sold: 167,
    tier: 'VIP',
    salesWindow: {
      start: '2025-11-01T10:00:00Z',
      end: '2025-12-31T21:00:00Z',
    },
    isAppExclusive: false,
    perks: [
      'VIP lounge access',
      'Premium open bar 9pm-12am',
      'Reserved seating area',
      'Champagne bottle per person at midnight',
      'NYE party favors',
    ],
  },
  // Event 5 Tiers
  {
    id: 'tier-5-1',
    eventId: 'event-5',
    name: 'General Entry',
    price: 25,
    quantity: 120,
    sold: 45,
    tier: 'GENERAL',
    salesWindow: {
      start: '2025-12-15T16:00:00Z',
      end: '2026-01-13T22:00:00Z',
    },
    isAppExclusive: false,
  },
  {
    id: 'tier-5-2',
    eventId: 'event-5',
    name: 'Bottle Service Table',
    price: 400,
    quantity: 15,
    sold: 8,
    tier: 'TABLE',
    salesWindow: {
      start: '2025-12-15T16:00:00Z',
      end: '2026-01-13T22:00:00Z',
    },
    isAppExclusive: true,
    perks: ['Reserved table for up to 6', '2 bottles of premium spirits', 'Dedicated server'],
  },
];

// Mock Tickets (User's purchased tickets)
export const mockTickets: Ticket[] = [
  {
    id: 'ticket-1',
    eventId: 'event-1',
    userId: 'user-me',
    tierId: 'tier-1-1',
    qrCode: 'RORK-FNH-USER1-EARLY-2026',
    status: 'ACTIVE',
    purchasedAt: '2025-12-15T14:30:00Z',
  },
  {
    id: 'ticket-2',
    eventId: 'event-4',
    userId: 'user-me',
    tierId: 'tier-4-2',
    qrCode: 'RORK-NYE-USER1-GEN-2025',
    status: 'ACTIVE',
    purchasedAt: '2025-11-20T18:00:00Z',
  },
  {
    id: 'ticket-3',
    eventId: 'event-2',
    userId: 'user-me',
    tierId: 'tier-2-1',
    qrCode: 'RORK-UTN-USER1-EARLY-2026',
    status: 'ACTIVE',
    purchasedAt: '2025-12-28T09:15:00Z',
  },
];

// Mock Ticket Transfers
export const mockTicketTransfers: TicketTransfer[] = [
  {
    id: 'transfer-1',
    ticketId: 'ticket-old-1',
    fromUserId: 'user-friend1',
    toUserId: 'user-me',
    status: 'PENDING',
    createdAt: '2026-01-02T16:00:00Z',
  },
];

// Mock Guest List Entries
export const mockGuestListEntries: GuestListEntry[] = [
  {
    id: 'guest-1',
    venueId: 'venue-1',
    eventId: 'event-1',
    date: '2026-01-10',
    guestUserId: 'user-friend1',
    guestName: 'Alex Rivera',
    guestPhone: '+1-555-0101',
    guestEmail: 'alex@example.com',
    plusOnes: 2,
    status: 'CONFIRMED',
    addedBy: 'venue-manager-1',
    notes: 'VIP friend of owner',
    createdAt: '2026-01-05T10:00:00Z',
  },
  {
    id: 'guest-2',
    venueId: 'venue-1',
    eventId: 'event-1',
    date: '2026-01-10',
    guestName: 'Sarah Chen',
    guestPhone: '+1-555-0102',
    plusOnes: 1,
    status: 'CONFIRMED',
    addedBy: 'venue-manager-1',
    createdAt: '2026-01-06T14:30:00Z',
  },
  {
    id: 'guest-3',
    venueId: 'venue-2',
    eventId: 'event-2',
    date: '2026-01-11',
    guestName: 'Marcus Johnson',
    guestEmail: 'marcus.j@example.com',
    plusOnes: 0,
    status: 'PENDING',
    addedBy: 'venue-manager-2',
    notes: 'Industry professional - awaiting confirmation',
    createdAt: '2026-01-07T11:00:00Z',
  },
  {
    id: 'guest-4',
    venueId: 'venue-3',
    date: '2026-01-12',
    guestUserId: 'user-friend2',
    guestName: 'Isabella Martinez',
    guestPhone: '+1-555-0103',
    plusOnes: 3,
    status: 'CONFIRMED',
    addedBy: 'venue-manager-3',
    notes: 'Birthday celebration',
    createdAt: '2026-01-08T16:45:00Z',
  },
  {
    id: 'guest-5',
    venueId: 'venue-1',
    eventId: 'event-4',
    date: '2025-12-31',
    guestName: 'David Kim',
    guestPhone: '+1-555-0104',
    guestEmail: 'dkim@example.com',
    plusOnes: 1,
    status: 'CHECKED_IN',
    addedBy: 'venue-manager-1',
    checkedInAt: '2025-12-31T21:15:00Z',
    createdAt: '2025-12-20T09:00:00Z',
  },
  {
    id: 'guest-6',
    venueId: 'venue-1',
    eventId: 'event-1',
    date: '2026-01-10',
    guestName: 'Emma Wilson',
    plusOnes: 0,
    status: 'NO_SHOW',
    addedBy: 'venue-manager-1',
    notes: 'Did not show up to previous event',
    createdAt: '2026-01-04T12:00:00Z',
  },
];

// Mock Check-In Records
export const mockCheckInRecords: CheckInRecord[] = [
  {
    id: 'checkin-1',
    ticketId: 'ticket-old-2',
    venueId: 'venue-1',
    eventId: 'event-old-1',
    userId: 'user-friend3',
    checkedInBy: 'venue-staff-1',
    checkedInAt: '2025-12-28T22:15:00Z',
    method: 'QR_CODE',
  },
  {
    id: 'checkin-2',
    guestListEntryId: 'guest-5',
    venueId: 'venue-1',
    eventId: 'event-4',
    guestName: 'David Kim',
    checkedInBy: 'venue-staff-2',
    checkedInAt: '2025-12-31T21:15:00Z',
    method: 'GUEST_LIST',
  },
  {
    id: 'checkin-3',
    ticketId: 'ticket-old-3',
    venueId: 'venue-2',
    eventId: 'event-old-2',
    userId: 'user-me',
    checkedInBy: 'venue-staff-3',
    checkedInAt: '2025-12-29T23:00:00Z',
    method: 'QR_CODE',
  },
  {
    id: 'checkin-4',
    venueId: 'venue-3',
    guestName: 'Walk-in Customer',
    checkedInBy: 'venue-staff-4',
    checkedInAt: '2026-01-01T22:30:00Z',
    method: 'MANUAL',
  },
];

// Helper function to get event by ID
export function getEventById(eventId: string): Event | undefined {
  return mockEvents.find((e) => e.id === eventId);
}

// Helper function to get tickets tiers for an event
export function getTicketTiersForEvent(eventId: string): TicketTier[] {
  return mockTicketTiers.filter((t) => t.eventId === eventId);
}

// Helper function to get user's tickets
export function getUserTickets(userId: string): Ticket[] {
  return mockTickets.filter((t) => t.userId === userId && t.status !== 'CANCELLED');
}

// Helper function to get guest list for venue/event
export function getGuestList(venueId: string, eventId?: string, date?: string): GuestListEntry[] {
  return mockGuestListEntries.filter((g) => {
    if (g.venueId !== venueId) return false;
    if (eventId && g.eventId !== eventId) return false;
    if (date && g.date !== date) return false;
    return true;
  });
}

// Helper function to get upcoming events
export function getUpcomingEvents(): Event[] {
  const now = new Date();
  return mockEvents
    .filter((e) => new Date(e.date) >= now && e.status === 'UPCOMING')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Helper function to get events by venue
export function getEventsByVenue(venueId: string): Event[] {
  return mockEvents.filter((e) => e.venueId === venueId);
}
