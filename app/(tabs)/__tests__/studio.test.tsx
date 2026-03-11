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

const mockCreatePromoVideo = jest.fn();
const mockUploadVideoMutateAsync = jest.fn();

const mockUpcomingGigs = [
  {
    id: 'gig-1',
    venueId: 'venue-1',
    venueName: 'The Midnight Lounge',
    date: '2026-03-15',
    startTime: '22:00',
    endTime: '02:00',
    fee: 500,
    status: 'UPCOMING',
  },
];

const mockCompletedGigs = [
  {
    id: 'gig-2',
    venueId: 'venue-2',
    venueName: 'Neon Pulse',
    date: '2026-03-01',
    startTime: '21:00',
    endTime: '01:00',
    fee: 350,
    status: 'COMPLETED',
  },
];

const mockAnalytics = {
  totalRevenue: 5000,
  totalGigs: 12,
  totalBarSalesGenerated: 15000,
  averageTicketClicks: 245,
};

// Profile mock - TALENT role by default
let mockProfileRole = 'TALENT';

jest.mock('@/contexts/AppStateContext', () => ({
  useAppState: () => ({
    profile: {
      id: 'user-1',
      displayName: 'DJ TestUser',
      totalSpend: 500,
      isIncognito: false,
      role: mockProfileRole,
      badges: [],
      followedPerformers: [],
      transactionHistory: [],
      isAuthenticated: true,
    },
  }),
}));

jest.mock('@/contexts/PerformerContext', () => ({
  usePerformer: () => ({
    upcomingGigs: mockUpcomingGigs,
    completedGigs: mockCompletedGigs,
    analytics: mockAnalytics,
    createPromoVideo: mockCreatePromoVideo,
  }),
}));

jest.mock('@/contexts/FeedContext', () => ({
  useFeed: () => ({
    uploadVideo: {
      mutateAsync: mockUploadVideoMutateAsync,
      isPending: false,
    },
  }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    accessToken: 'mock-token',
    user: null,
  }),
}));

jest.mock('@/hooks/useUpload', () => ({
  useUpload: () => ({
    isUploading: false,
    uploadProgress: 0,
    uploadProfileFromCamera: jest.fn(),
    uploadProfileFromGallery: jest.fn(),
    uploadHighlightFromUri: jest.fn(() => Promise.resolve({ url: 'https://cloudinary.com/video.mp4' })),
  }),
}));

jest.mock('@/hooks/useNearbyVenues', () => ({
  useNearbyVenues: () => ({
    venues: [],
    isLoading: false,
    searchVenuesByQuery: jest.fn(),
    userLocation: null,
  }),
  __esModule: true,
  default: () => ({
    venues: [],
    isLoading: false,
    searchVenuesByQuery: jest.fn(),
    userLocation: null,
  }),
}));

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  MediaTypeOptions: { Videos: 'Videos' },
}));

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const icon = (props: any) => <View testID={props.testID} />;
  return new Proxy({}, { get: () => icon });
});

// Mock studio-components
jest.mock('../studio-components/StatsCard', () => ({
  StatsCard: ({ label, value, subtitle }: any) => {
    const { View, Text } = require('react-native');
    return (
      <View>
        <Text>{label}</Text>
        <Text>{value}</Text>
        {subtitle && <Text>{subtitle}</Text>}
      </View>
    );
  },
}));

jest.mock('../studio-components/GigCard', () => ({
  GigCard: ({ gig, onPress, formatDate, formatCurrency }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress}>
        <Text>{gig.venueName}</Text>
        <Text>{gig.status}</Text>
        <Text>{formatCurrency(gig.fee)}</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock('../studio-components/FilterSelector', () => ({
  FilterSelector: () => {
    const { View, Text } = require('react-native');
    return <View><Text>FilterSelector</Text></View>;
  },
}));

jest.mock('../studio-components/StickerSelector', () => ({
  StickerSelector: () => {
    const { View, Text } = require('react-native');
    return <View><Text>StickerSelector</Text></View>;
  },
}));

jest.mock('../studio-components/VideoTrimmer', () => ({
  VideoTrimmer: () => {
    const { View, Text } = require('react-native');
    return <View><Text>VideoTrimmer</Text></View>;
  },
}));

import StudioScreen from '../studio';

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
      <StudioScreen />
    </QueryClientProvider>
  );
}

// ---- Tests ----

describe('StudioScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProfileRole = 'TALENT';
  });

  it('renders the studio header', () => {
    const { getByText } = renderScreen();
    expect(getByText('Studio')).toBeTruthy();
    expect(getByText('Manage your gigs & content')).toBeTruthy();
  });

  it('renders analytics stats cards', () => {
    const { getByText } = renderScreen();
    expect(getByText('Total Earnings')).toBeTruthy();
    expect(getByText('$5,000')).toBeTruthy();
    expect(getByText('Bar Sales Generated')).toBeTruthy();
    expect(getByText('$15,000')).toBeTruthy();
    expect(getByText('Avg Ticket Clicks')).toBeTruthy();
    expect(getByText('245')).toBeTruthy();
  });

  it('renders the three tabs: Upcoming, Completed, Create Video', () => {
    const { getByText } = renderScreen();
    expect(getByText('Upcoming (1)')).toBeTruthy();
    expect(getByText('Completed (1)')).toBeTruthy();
    expect(getByText('Create Video')).toBeTruthy();
  });

  it('shows upcoming gigs by default', () => {
    const { getByText } = renderScreen();
    expect(getByText('The Midnight Lounge')).toBeTruthy();
    expect(getByText('UPCOMING')).toBeTruthy();
    expect(getByText('$500')).toBeTruthy();
  });

  it('switches to completed gigs tab', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Completed (1)'));
    expect(getByText('Neon Pulse')).toBeTruthy();
    expect(getByText('COMPLETED')).toBeTruthy();
    expect(getByText('$350')).toBeTruthy();
  });

  it('switches to create video tab and shows promo studio', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Create Video'));
    expect(getByText('Promo Video Studio')).toBeTruthy();
    expect(getByText('Record Video')).toBeTruthy();
    expect(getByText('Upload Existing')).toBeTruthy();
  });

  it('shows feature descriptions in create video tab', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Create Video'));
    expect(getByText('9:16 Vertical Recording')).toBeTruthy();
    expect(getByText('Smart Clip Trimmer')).toBeTruthy();
    expect(getByText('Vibe Filters')).toBeTruthy();
    expect(getByText('Call-to-Action Stickers')).toBeTruthy();
  });

  it('shows access denied screen for non-talent users', () => {
    mockProfileRole = 'PARTYGOER';
    const { getByText } = renderScreen();
    expect(getByText('Talent Access Only')).toBeTruthy();
    expect(getByText(/Promo Studio is exclusively for performers/)).toBeTruthy();
  });

  it('shows gig details with formatted currency', () => {
    const { getByText } = renderScreen();
    expect(getByText('12 completed gigs')).toBeTruthy();
    expect(getByText('Venue revenue')).toBeTruthy();
    expect(getByText('Per promo video')).toBeTruthy();
  });

  it('navigates to recording screen when Record Video is pressed', () => {
    const { getByText, queryByText } = renderScreen();
    fireEvent.press(getByText('Create Video'));
    fireEvent.press(getByText('Record Video'));
    // Should now be in recording mode - the main dashboard text should be gone
    expect(queryByText('Manage your gigs & content')).toBeNull();
  });

  it('calls createPromoVideo when an upcoming gig card is pressed', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('The Midnight Lounge'));
    expect(mockCreatePromoVideo).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'gig-1', status: 'UPCOMING' })
    );
  });

  // ---- Additional coverage tests ----

  it('does not call createPromoVideo when a completed gig is pressed', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Completed (1)'));
    fireEvent.press(getByText('Neon Pulse'));
    // createPromoVideo should not be called for completed gigs (status !== UPCOMING)
    expect(mockCreatePromoVideo).not.toHaveBeenCalled();
  });

  it('renders formatted currency in analytics stats', () => {
    const { getByText } = renderScreen();
    expect(getByText('$5,000')).toBeTruthy();
    expect(getByText('$15,000')).toBeTruthy();
  });

  it('renders Upload Existing option in create video tab', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Create Video'));
    expect(getByText('Upload Existing')).toBeTruthy();
  });

  it('switches back to Upcoming tab from Create Video tab', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Create Video'));
    expect(getByText('Promo Video Studio')).toBeTruthy();
    fireEvent.press(getByText('Upcoming (1)'));
    expect(getByText('The Midnight Lounge')).toBeTruthy();
  });

  it('switches back to Upcoming tab from Completed tab', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Completed (1)'));
    expect(getByText('Neon Pulse')).toBeTruthy();
    fireEvent.press(getByText('Upcoming (1)'));
    expect(getByText('The Midnight Lounge')).toBeTruthy();
  });

  it('shows access denied with upgrade message for non-talent users', () => {
    mockProfileRole = 'PARTYGOER';
    const { getByText } = renderScreen();
    expect(getByText('Talent Access Only')).toBeTruthy();
    expect(getByText(/Switch to a Talent account/)).toBeTruthy();
  });

  it('renders correct gig count in tab labels', () => {
    const { getByText } = renderScreen();
    expect(getByText('Upcoming (1)')).toBeTruthy();
    expect(getByText('Completed (1)')).toBeTruthy();
  });

  it('renders completed gig with formatted currency', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Completed (1)'));
    expect(getByText('$350')).toBeTruthy();
  });

  it('renders analytics subtitle texts', () => {
    const { getByText } = renderScreen();
    expect(getByText('12 completed gigs')).toBeTruthy();
    expect(getByText('Venue revenue')).toBeTruthy();
    expect(getByText('Per promo video')).toBeTruthy();
  });

  it('renders feature list items in Create Video tab', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Create Video'));
    expect(getByText('9:16 Vertical Recording')).toBeTruthy();
    expect(getByText('Smart Clip Trimmer')).toBeTruthy();
    expect(getByText('Vibe Filters')).toBeTruthy();
    expect(getByText('Call-to-Action Stickers')).toBeTruthy();
  });

  it('enters recording mode from create video tab and shows camera UI', () => {
    const { getByText, queryByText } = renderScreen();
    fireEvent.press(getByText('Create Video'));
    fireEvent.press(getByText('Record Video'));
    // Dashboard header should be gone
    expect(queryByText('Manage your gigs & content')).toBeNull();
    // Promo studio text should be gone too
    expect(queryByText('Promo Video Studio')).toBeNull();
  });
});
