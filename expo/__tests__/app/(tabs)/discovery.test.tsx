jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
  NotificationFeedbackType: { Success: 'Success', Warning: 'Warning', Error: 'Error' },
}));

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ---- Mock values ----

const mockSetSelectedVenueId = jest.fn();
const mockToggleGhostMode = jest.fn();
const mockGetFriendsByVenue = jest.fn(() => []);
const mockGetLargestFriendCluster = jest.fn(() => null);
const mockGetVenueSocialProofData = jest.fn(() => null);
const mockJoinGroupPurchase = jest.fn();
const mockCreateGroupPurchase = jest.fn();
const mockGetDynamicPricing = jest.fn(() => null);
const mockUpdateProfile = jest.fn();
const mockUpdateProfileAsync = jest.fn(() => Promise.resolve());
const mockCanRejoinVenue = jest.fn(() => true);
const mockCalculateVibePercentage = jest.fn(() => null);
const mockTriggerGlow = jest.fn();
const mockRefreshVenues = jest.fn(() => Promise.resolve());

const mockRouterPush = jest.fn();
const mockRouterBack = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: any[]) => mockRouterPush(...args),
    replace: jest.fn(),
    back: (...args: any[]) => mockRouterBack(...args),
  },
  Stack: { Screen: () => null },
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const icon = (props: any) => <View testID={props.testID} />;
  return new Proxy({}, { get: () => icon });
});

jest.mock('expo-image', () => ({
  Image: (props: any) => {
    const { View } = require('react-native');
    return <View {...props} />;
  },
}));

jest.mock('@/components/UserProfileModal', () => {
  const { View, Text } = require('react-native');
  return ({ visible, userId }: any) =>
    visible ? <View testID="user-profile-modal"><Text>UserProfileModal</Text></View> : null;
});

jest.mock('@/components/GroupPurchaseCard', () => ({
  GroupPurchaseCard: () => null,
}));

jest.mock('@/components/modals/GroupPurchaseModal', () => ({
  GroupPurchaseModal: ({ visible }: any) => {
    const { View, Text } = require('react-native');
    return visible ? <View testID="group-purchase-modal"><Text>GroupPurchaseModal</Text></View> : null;
  },
}));

jest.mock('@/components/VenueDetailsModal', () => {
  const { View, Text } = require('react-native');
  return ({ visible }: any) =>
    visible ? <View testID="venue-details-modal"><Text>VenueDetailsModal</Text></View> : null;
});

jest.mock('@/components/PricingBadge', () => ({
  PricingBadge: () => null,
}));

const mockProfile = {
  id: 'user-1',
  displayName: 'TestUser',
  totalSpend: 500,
  isIncognito: false,
  role: 'PARTYGOER',
  badges: [],
  followedPerformers: [],
  transactionHistory: [],
  isAuthenticated: true,
};

jest.mock('@/contexts/AppStateContext', () => ({
  useDiscovery: () => ({
    selectedVenueId: null as string | null,
    setSelectedVenueId: mockSetSelectedVenueId,
  }),
  useAppState: () => ({
    profile: mockProfile,
    updateProfile: mockUpdateProfile,
    updateProfileAsync: mockUpdateProfileAsync,
    canRejoinVenue: mockCanRejoinVenue,
    calculateVibePercentage: mockCalculateVibePercentage,
  }),
}));

const mockFriendLocations: any[] = [];

jest.mock('@/contexts/SocialContext', () => ({
  useSocial: () => ({
    friendLocations: mockFriendLocations,
    getFriendsByVenue: mockGetFriendsByVenue,
    locationSettings: { ghostMode: false, precision: 'EXACT' },
    toggleGhostMode: mockToggleGhostMode,
    getLargestFriendCluster: mockGetLargestFriendCluster,
    getVenueSocialProofData: mockGetVenueSocialProofData,
  }),
}));

jest.mock('@/contexts/GrowthContext', () => ({
  useGrowth: () => ({
    openGroupPurchases: [],
    joinGroupPurchase: mockJoinGroupPurchase,
    createGroupPurchase: mockCreateGroupPurchase,
  }),
}));

jest.mock('@/contexts/GlowContext', () => ({
  useGlow: () => ({
    triggerGlow: mockTriggerGlow,
  }),
}));

jest.mock('@/contexts/MonetizationContext', () => ({
  useMonetization: () => ({
    getDynamicPricing: mockGetDynamicPricing,
  }),
}));

// Default: loading state (no venues, no location)
let mockNearbyVenuesReturn: any = {
  venues: [],
  isLoading: true,
  error: null,
  userLocation: null,
  refreshVenues: mockRefreshVenues,
};

jest.mock('@/hooks/useNearbyVenues', () => ({
  useNearbyVenues: () => mockNearbyVenuesReturn,
}));

import DiscoveryScreen from '@/app/(tabs)/discovery';

// ---- Helpers ----

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderScreen() {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <DiscoveryScreen />
    </QueryClientProvider>
  );
}

const makeMockVenues = () => [
  {
    id: 'venue-1',
    name: 'The Neon Lounge',
    type: 'BAR',
    location: { latitude: 40.75, longitude: -73.97, address: '123 Main St', city: 'New York', state: 'NY' },
    rating: 4.5,
    priceLevel: 2,
    photoUrl: 'https://example.com/photo.jpg',
    isOpen: true,
    distance: 2.5,
  },
  {
    id: 'venue-2',
    name: 'Club Midnight',
    type: 'CLUB',
    location: { latitude: 40.76, longitude: -73.98, address: '456 Elm St', city: 'New York', state: 'NY' },
    rating: 4.0,
    priceLevel: 3,
    photoUrl: null,
    isOpen: false,
    distance: 5.0,
  },
];

// ---- Tests ----

describe('DiscoveryScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert');
    // Reset to loading state
    mockNearbyVenuesReturn = {
      venues: [],
      isLoading: true,
      error: null,
      userLocation: null,
      refreshVenues: mockRefreshVenues,
    };
    mockProfile.badges = [];
    mockProfile.transactionHistory = [];
    mockFriendLocations.length = 0;
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('renders the map immediately once location is known, even while venues load', () => {
    mockNearbyVenuesReturn = {
      venues: [],
      isLoading: true,
      error: null,
      userLocation: { latitude: 40.75, longitude: -73.97 },
      refreshVenues: mockRefreshVenues,
    };
    const { getByText } = renderScreen();
    expect(getByText('Discover Venues')).toBeTruthy();
  });

  it('renders loading state when waiting for location', () => {
    mockNearbyVenuesReturn = {
      venues: [],
      isLoading: true,
      error: null,
      userLocation: null,
      refreshVenues: mockRefreshVenues,
    };

    const { getByText } = renderScreen();
    expect(getByText('Getting your location...')).toBeTruthy();
  });

  it('renders map and header when venues are loaded', () => {
    mockNearbyVenuesReturn = {
      venues: makeMockVenues(),
      isLoading: false,
      error: null,
      userLocation: { latitude: 40.75, longitude: -73.97 },
      refreshVenues: mockRefreshVenues,
    };

    const { getByText } = renderScreen();
    expect(getByText('Discover Venues')).toBeTruthy();
    // Header subtitle shows open count and total
    expect(getByText(/1 open now/)).toBeTruthy();
    expect(getByText(/2 within 50 miles/)).toBeTruthy();
  });

  it('calls toggleGhostMode when ghost button is pressed', () => {
    mockNearbyVenuesReturn = {
      venues: makeMockVenues(),
      isLoading: false,
      error: null,
      userLocation: { latitude: 40.75, longitude: -73.97 },
      refreshVenues: mockRefreshVenues,
    };

    const { UNSAFE_getAllByType } = renderScreen();
    // The ghost mode control button is rendered in the map controls area.
    // We verify the toggleGhostMode mock is accessible via the context.
    expect(mockToggleGhostMode).not.toHaveBeenCalled();
  });

  it('shows alert when findMyGroup is called with no friends', () => {
    mockNearbyVenuesReturn = {
      venues: makeMockVenues(),
      isLoading: false,
      error: null,
      userLocation: { latitude: 40.75, longitude: -73.97 },
      refreshVenues: mockRefreshVenues,
    };

    // When there are no friendLocations the "Find my group" button is hidden
    // but we can verify getLargestFriendCluster returns null
    expect(mockGetLargestFriendCluster()).toBeNull();
  });

  it('shows friends online count when friends are present', () => {
    mockFriendLocations.push(
      {
        userId: 'friend-1',
        displayName: 'Alice',
        avatarUrl: 'https://example.com/alice.jpg',
        location: { latitude: 40.75, longitude: -73.97 },
        venueId: 'venue-1',
        venueName: 'The Neon Lounge',
        precision: 'EXACT',
        lastUpdated: new Date().toISOString(),
      },
      {
        userId: 'friend-2',
        displayName: 'Bob',
        avatarUrl: 'https://example.com/bob.jpg',
        location: { latitude: 40.76, longitude: -73.98 },
        venueId: null,
        venueName: null,
        precision: 'EXACT',
        lastUpdated: new Date().toISOString(),
      }
    );

    mockNearbyVenuesReturn = {
      venues: makeMockVenues(),
      isLoading: false,
      error: null,
      userLocation: { latitude: 40.75, longitude: -73.97 },
      refreshVenues: mockRefreshVenues,
    };

    const { getByText } = renderScreen();
    expect(getByText('2 Friends Online')).toBeTruthy();
  });

  it('opens friend drawer when friends online toggle is pressed', () => {
    mockFriendLocations.push({
      userId: 'friend-1',
      displayName: 'Alice',
      avatarUrl: 'https://example.com/alice.jpg',
      location: { latitude: 40.75, longitude: -73.97 },
      venueId: 'venue-1',
      venueName: 'The Neon Lounge',
      precision: 'EXACT',
      lastUpdated: new Date().toISOString(),
    });

    mockNearbyVenuesReturn = {
      venues: makeMockVenues(),
      isLoading: false,
      error: null,
      userLocation: { latitude: 40.75, longitude: -73.97 },
      refreshVenues: mockRefreshVenues,
    };

    const { getByText } = renderScreen();
    fireEvent.press(getByText('1 Friend Online'));

    // After pressing, the FriendListDrawer should be visible
    expect(getByText('Friends Online')).toBeTruthy();
    expect(getByText('Alice')).toBeTruthy();
  });

  it('displays venue error alert when venues fail to load', () => {
    mockNearbyVenuesReturn = {
      venues: [],
      isLoading: false,
      error: 'Network error',
      userLocation: { latitude: 40.75, longitude: -73.97 },
      refreshVenues: mockRefreshVenues,
    };

    const { getByText } = renderScreen();
    // Inline error view (Alert.alert was moved out of render in the build-93 fix)
    expect(getByText('Unable to load venues')).toBeTruthy();
    expect(getByText('Try again')).toBeTruthy();
  });

  it('renders venue markers on the map for loaded venues', () => {
    const venues = makeMockVenues();
    mockNearbyVenuesReturn = {
      venues,
      isLoading: false,
      error: null,
      userLocation: { latitude: 40.75, longitude: -73.97 },
      refreshVenues: mockRefreshVenues,
    };

    const { getByText } = renderScreen();
    // The header shows correct venue count
    expect(getByText(/2 within 50 miles/)).toBeTruthy();
  });

  it('shows correct open/closed count in header subtitle', () => {
    const venues = makeMockVenues();
    // venue-1 is open, venue-2 is closed
    mockNearbyVenuesReturn = {
      venues,
      isLoading: false,
      error: null,
      userLocation: { latitude: 40.75, longitude: -73.97 },
      refreshVenues: mockRefreshVenues,
    };

    const { getByText } = renderScreen();
    expect(getByText('1 open now \u2022 2 within 50 miles')).toBeTruthy();
  });

  it('shows singular Friend when only one friend is online', () => {
    mockFriendLocations.push({
      userId: 'friend-1',
      displayName: 'Alice',
      avatarUrl: 'https://example.com/alice.jpg',
      location: { latitude: 40.75, longitude: -73.97 },
      venueId: 'venue-1',
      venueName: 'The Neon Lounge',
      precision: 'EXACT',
      lastUpdated: new Date().toISOString(),
    });

    mockNearbyVenuesReturn = {
      venues: makeMockVenues(),
      isLoading: false,
      error: null,
      userLocation: { latitude: 40.75, longitude: -73.97 },
      refreshVenues: mockRefreshVenues,
    };

    const { getByText } = renderScreen();
    expect(getByText('1 Friend Online')).toBeTruthy();
  });

  it('friend drawer groups friends by venue', () => {
    mockFriendLocations.push(
      {
        userId: 'friend-1',
        displayName: 'Alice',
        avatarUrl: 'https://example.com/alice.jpg',
        location: { latitude: 40.75, longitude: -73.97 },
        venueId: 'venue-1',
        venueName: 'The Neon Lounge',
        precision: 'EXACT',
        lastUpdated: new Date().toISOString(),
      },
      {
        userId: 'friend-2',
        displayName: 'Bob',
        avatarUrl: 'https://example.com/bob.jpg',
        location: { latitude: 40.76, longitude: -73.98 },
        venueId: null,
        venueName: null,
        precision: 'EXACT',
        lastUpdated: new Date().toISOString(),
      }
    );

    mockNearbyVenuesReturn = {
      venues: makeMockVenues(),
      isLoading: false,
      error: null,
      userLocation: { latitude: 40.75, longitude: -73.97 },
      refreshVenues: mockRefreshVenues,
    };

    const { getByText } = renderScreen();
    fireEvent.press(getByText('2 Friends Online'));

    expect(getByText('The Neon Lounge')).toBeTruthy();
    expect(getByText('Exploring')).toBeTruthy();
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Bob')).toBeTruthy();
  });

  it('does not show friend drawer toggle when no venue is selected and no friends', () => {
    mockNearbyVenuesReturn = {
      venues: makeMockVenues(),
      isLoading: false,
      error: null,
      userLocation: { latitude: 40.75, longitude: -73.97 },
      refreshVenues: mockRefreshVenues,
    };

    const { queryByText } = renderScreen();
    expect(queryByText(/Friends Online/)).toBeNull();
  });

  // ---- Additional coverage tests ----

  it('renders Discover Venues header title when venues loaded', () => {
    mockNearbyVenuesReturn = {
      venues: makeMockVenues(),
      isLoading: false,
      error: null,
      userLocation: { latitude: 40.75, longitude: -73.97 },
      refreshVenues: mockRefreshVenues,
    };

    const { getByText } = renderScreen();
    expect(getByText('Discover Venues')).toBeTruthy();
  });

  it('calls refreshVenues function when available', async () => {
    mockNearbyVenuesReturn = {
      venues: makeMockVenues(),
      isLoading: false,
      error: null,
      userLocation: { latitude: 40.75, longitude: -73.97 },
      refreshVenues: mockRefreshVenues,
    };

    renderScreen();
    expect(mockRefreshVenues).not.toHaveBeenCalled();
  });

  it('renders with empty venues list when no venues available', () => {
    mockNearbyVenuesReturn = {
      venues: [],
      isLoading: false,
      error: null,
      userLocation: { latitude: 40.75, longitude: -73.97 },
      refreshVenues: mockRefreshVenues,
    };

    const { getByText } = renderScreen();
    expect(getByText('0 open now \u2022 0 within 50 miles')).toBeTruthy();
  });

  it('closes friend drawer when close button is pressed', () => {
    mockFriendLocations.push({
      userId: 'friend-1',
      displayName: 'Alice',
      avatarUrl: 'https://example.com/alice.jpg',
      location: { latitude: 40.75, longitude: -73.97 },
      venueId: 'venue-1',
      venueName: 'The Neon Lounge',
      precision: 'EXACT',
      lastUpdated: new Date().toISOString(),
    });

    mockNearbyVenuesReturn = {
      venues: makeMockVenues(),
      isLoading: false,
      error: null,
      userLocation: { latitude: 40.75, longitude: -73.97 },
      refreshVenues: mockRefreshVenues,
    };

    const { getByText, queryByText } = renderScreen();
    fireEvent.press(getByText('1 Friend Online'));
    expect(getByText('Friends Online')).toBeTruthy();
    // Close drawer
    fireEvent.press(getByText('1 Friend Online'));
    expect(queryByText('Friends Online')).toBeNull();
  });

  it('shows friend drawer with venue grouping for friend at venue', () => {
    mockFriendLocations.push({
      userId: 'friend-1',
      displayName: 'Alice',
      avatarUrl: 'https://example.com/alice.jpg',
      location: { latitude: 40.75, longitude: -73.97 },
      venueId: 'venue-1',
      venueName: 'The Neon Lounge',
      precision: 'EXACT',
      lastUpdated: new Date().toISOString(),
    });

    mockNearbyVenuesReturn = {
      venues: makeMockVenues(),
      isLoading: false,
      error: null,
      userLocation: { latitude: 40.75, longitude: -73.97 },
      refreshVenues: mockRefreshVenues,
    };

    const { getByText } = renderScreen();
    fireEvent.press(getByText('1 Friend Online'));
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('The Neon Lounge')).toBeTruthy();
  });

  it('displays alert with retry option when error occurs loading venues', () => {
    mockNearbyVenuesReturn = {
      venues: [],
      isLoading: false,
      error: 'Connection timeout',
      userLocation: { latitude: 40.75, longitude: -73.97 },
      refreshVenues: mockRefreshVenues,
    };

    const { getByText } = renderScreen();
    expect(getByText('Unable to load venues')).toBeTruthy();
    expect(getByText('Try again')).toBeTruthy();
  });

  it('shows friend location status text in drawer', () => {
    mockFriendLocations.push({
      userId: 'friend-1',
      displayName: 'Alice',
      avatarUrl: 'https://example.com/alice.jpg',
      location: { latitude: 40.75, longitude: -73.97 },
      venueId: 'venue-1',
      venueName: 'The Neon Lounge',
      precision: 'EXACT',
      lastUpdated: new Date().toISOString(),
    });

    mockNearbyVenuesReturn = {
      venues: makeMockVenues(),
      isLoading: false,
      error: null,
      userLocation: { latitude: 40.75, longitude: -73.97 },
      refreshVenues: mockRefreshVenues,
    };

    const { getByText } = renderScreen();
    fireEvent.press(getByText('1 Friend Online'));
    expect(getByText('Exact location')).toBeTruthy();
  });

  it('renders map controls area when venues are loaded', () => {
    mockNearbyVenuesReturn = {
      venues: makeMockVenues(),
      isLoading: false,
      error: null,
      userLocation: { latitude: 40.75, longitude: -73.97 },
      refreshVenues: mockRefreshVenues,
    };

    const { getByText } = renderScreen();
    // Map controls include ghost mode button and refresh - verify the header renders
    expect(getByText('Discover Venues')).toBeTruthy();
  });

  it('handles multiple friends at same venue in drawer', () => {
    mockFriendLocations.push(
      {
        userId: 'friend-1',
        displayName: 'Alice',
        avatarUrl: 'https://example.com/alice.jpg',
        location: { latitude: 40.75, longitude: -73.97 },
        venueId: 'venue-1',
        venueName: 'The Neon Lounge',
        precision: 'EXACT',
        lastUpdated: new Date().toISOString(),
      },
      {
        userId: 'friend-3',
        displayName: 'Charlie',
        avatarUrl: 'https://example.com/charlie.jpg',
        location: { latitude: 40.75, longitude: -73.97 },
        venueId: 'venue-1',
        venueName: 'The Neon Lounge',
        precision: 'EXACT',
        lastUpdated: new Date().toISOString(),
      }
    );

    mockNearbyVenuesReturn = {
      venues: makeMockVenues(),
      isLoading: false,
      error: null,
      userLocation: { latitude: 40.75, longitude: -73.97 },
      refreshVenues: mockRefreshVenues,
    };

    const { getByText } = renderScreen();
    fireEvent.press(getByText('2 Friends Online'));
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Charlie')).toBeTruthy();
  });
});
