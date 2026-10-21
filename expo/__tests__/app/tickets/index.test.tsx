jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
  NotificationFeedbackType: { Success: 'Success', Warning: 'Warning', Error: 'Error' },
}));

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ---- Mocks ----

const mockGetEventById = jest.fn();
const mockGetTicketTiersForEvent = jest.fn();
const mockGenerateTicketQR = jest.fn();

let mockUserTickets: any[] = [];
let mockIsLoading = false;

let mockSavedEvents: any[] = [];
let mockUpcomingEvents: any[] = [];
let mockBadges: any[] = [];

jest.mock('@/contexts/EventsContext', () => ({
  useEvents: () => ({
    userTickets: mockUserTickets,
    events: mockUpcomingEvents,
    upcomingEvents: mockUpcomingEvents,
    getEventById: mockGetEventById,
    getTicketTiersForEvent: mockGetTicketTiersForEvent,
    generateTicketQR: mockGenerateTicketQR,
    isLoading: mockIsLoading,
  }),
}));

// My Night reads saved events + badge venues from AppState.
jest.mock('@/contexts/AppStateContext', () => ({
  useAppState: () => ({
    profile: { savedEvents: mockSavedEvents, badges: mockBadges },
    unsaveEvent: jest.fn(),
  }),
}));

const mockRouterBack = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    back: mockRouterBack,
    push: jest.fn(),
  },
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

jest.mock('expo-image', () => ({
  Image: (props: any) => {
    const { View } = require('react-native');
    return <View {...props} />;
  },
}));

jest.mock('react-native-qrcode-svg', () => {
  const { View } = require('react-native');
  return (props: any) => <View testID="qr-code" />;
});

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const icon = (props: any) => <View testID={props.testID} />;
  return new Proxy(
    {},
    {
      get: () => icon,
    }
  );
});

import TicketsScreen from '@/app/tickets/index';

// ---- Helpers ----

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

const mockEvent = {
  id: 'event-1',
  title: 'Neon Nights',
  description: 'An incredible night.',
  date: '2026-04-15T00:00:00.000Z',
  startTime: '10:00 PM',
  endTime: '4:00 AM',
  genres: ['Electronic'],
  imageUrl: 'https://example.com/event.jpg',
  venueId: 'venue-1',
};

const mockTier = {
  id: 'tier-1',
  name: 'General Admission',
  price: 25,
  quantity: 100,
  sold: 40,
};

const mockActiveTicket = {
  id: 'ticket-1',
  eventId: 'event-1',
  tierId: 'tier-1',
  userId: 'user-1',
  status: 'ACTIVE' as const,
  purchasedAt: '2026-03-01T00:00:00.000Z',
};

const mockUsedTicket = {
  id: 'ticket-2',
  eventId: 'event-1',
  tierId: 'tier-1',
  userId: 'user-1',
  status: 'USED' as const,
  purchasedAt: '2026-02-01T00:00:00.000Z',
};

function renderScreen() {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <TicketsScreen />
    </QueryClientProvider>
  );
}

// ---- Tests ----

describe('TicketsScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert');
    mockGetEventById.mockReturnValue(mockEvent);
    mockGetTicketTiersForEvent.mockReturnValue([mockTier]);
    mockGenerateTicketQR.mockReturnValue('qr-data-ticket-1');
    mockUserTickets = [mockActiveTicket];
    mockIsLoading = false;
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  // This screen is now "My Night" (saved events + legacy tickets), not the old
  // "My Tickets". Tests reflect the current screen.
  beforeEach(() => {
    mockSavedEvents = [];
    mockUpcomingEvents = [];
    mockBadges = [];
  });

  it('renders loading state when isLoading is true', () => {
    mockIsLoading = true;
    const { getByText } = renderScreen();
    expect(getByText('Loading your night...')).toBeTruthy();
  });

  it('renders the My Night header title', () => {
    const { getByText } = renderScreen();
    expect(getByText('My Night')).toBeTruthy();
  });

  it('renders the empty state when nothing saved and no tickets', () => {
    mockUserTickets = [];
    mockSavedEvents = [];
    const { getByText } = renderScreen();
    expect(getByText('Your night starts here')).toBeTruthy();
    expect(getByText('Explore events')).toBeTruthy();
  });

  it('still renders legacy tickets under "Your Tickets" when the user holds any', () => {
    // A past in-app ticket (pre-pivot) should still be accessible.
    mockUserTickets = [mockActiveTicket];
    const { getByText } = renderScreen();
    expect(getByText('Your Tickets')).toBeTruthy();
    expect(getByText('Neon Nights')).toBeTruthy();
    expect(getByText('General Admission')).toBeTruthy();
  });

  it('opens the QR modal when a legacy ticket card is pressed', () => {
    mockUserTickets = [mockActiveTicket];
    const { getByText } = renderScreen();

    fireEvent.press(getByText('Neon Nights'));

    expect(getByText('Your Ticket')).toBeTruthy();
    expect(getByText('Ticket Type')).toBeTruthy();
    expect(getByText('ticket-1')).toBeTruthy();
  });
});
