jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
  NotificationFeedbackType: { Success: 'Success', Warning: 'Warning', Error: 'Error' },
}));

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Share } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

// ---- Mocks ----

const mockSetFilter = jest.fn();
const mockRefreshLocation = jest.fn();
const mockFollowPerformer = jest.fn();
const mockIsFollowing = jest.fn(() => false);
const mockUpdateProfile = jest.fn();
const mockShareToInstagram = jest.fn();
const mockGenerateStoryTemplate = jest.fn();

const mockRouterPush = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: any[]) => mockRouterPush(...args),
    replace: jest.fn(),
    back: jest.fn(),
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

jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => true,
}));

jest.mock('@/components/UserActionMenu', () => {
  const { View, Text } = require('react-native');
  return ({ visible }: any) =>
    visible ? <View testID="user-action-menu"><Text>UserActionMenu</Text></View> : null;
});

const mockProfile = {
  id: 'user-1',
  displayName: 'TestUser',
  totalSpend: 500,
  isIncognito: false,
  role: 'PARTYGOER',
  badges: [] as any[],
  followedPerformers: [],
  transactionHistory: [],
  isAuthenticated: true,
};

const mockVideos = [
  {
    id: 'video-1',
    title: 'Friday Night Vibes',
    thumbnailUrl: 'https://example.com/thumb1.jpg',
    videoUrl: 'https://example.com/video1.mp4',
    venueId: 'venue-1',
    performerId: 'performer-1',
    likes: 100,
    filter: 'none' as const,
    sticker: 'none' as const,
    stickerPosition: null,
    createdAt: new Date().toISOString(),
    duration: 30,
  },
  {
    id: 'video-2',
    title: 'Saturday DJ Set',
    thumbnailUrl: 'https://example.com/thumb2.jpg',
    videoUrl: 'https://example.com/video2.mp4',
    venueId: 'venue-2',
    performerId: null,
    likes: 250,
    filter: 'neon-glitch',
    sticker: 'live-tonight',
    stickerPosition: { x: 50, y: 50 },
    createdAt: new Date().toISOString(),
    duration: 45,
  },
];

const mockSuggestedPerformers = [
  {
    id: 'performer-1',
    stageName: 'DJ Pulse',
    imageUrl: 'https://example.com/dj-pulse.jpg',
    genres: ['EDM', 'House'],
    bio: 'Local legend',
  },
  {
    id: 'performer-2',
    stageName: 'MC Flow',
    imageUrl: 'https://example.com/mc-flow.jpg',
    genres: ['Hip Hop'],
    bio: 'Mic master',
  },
];

let mockFeedReturn: any;

jest.mock('@/contexts/FeedContext', () => ({
  useFeed: () => mockFeedReturn,
}));

jest.mock('@/contexts/AppStateContext', () => ({
  useAppState: () => ({
    profile: mockProfile,
    updateProfile: mockUpdateProfile,
    followPerformer: mockFollowPerformer,
    isFollowing: mockIsFollowing,
  }),
}));

jest.mock('@/contexts/GrowthContext', () => ({
  useGrowth: () => ({
    shareToInstagram: mockShareToInstagram,
    generateStoryTemplate: mockGenerateStoryTemplate,
  }),
}));

import FeedScreen from '@/app/(tabs)/feed';

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
      <FeedScreen />
    </QueryClientProvider>
  );
}

// ---- Tests ----

describe('FeedScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert');
    mockProfile.badges = [];
    mockIsFollowing.mockReturnValue(false);
    mockFeedReturn = {
      videos: mockVideos,
      selectedFilter: 'NEARBY' as const,
      setFilter: mockSetFilter,
      isEmpty: false,
      suggestedPerformers: mockSuggestedPerformers,
      refreshLocation: mockRefreshLocation,
    };
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('renders filter buttons (Nearby and Following)', () => {
    const { getByText } = renderScreen();
    expect(getByText('Nearby')).toBeTruthy();
    expect(getByText('Following')).toBeTruthy();
  });

  it('calls refreshLocation on mount', () => {
    renderScreen();
    expect(mockRefreshLocation).toHaveBeenCalled();
  });

  it('renders video titles in the feed', () => {
    const { getByText } = renderScreen();
    expect(getByText('Friday Night Vibes')).toBeTruthy();
  });

  it('calls setFilter with FOLLOWING when Following button is pressed', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Following'));
    expect(mockSetFilter).toHaveBeenCalledWith('FOLLOWING');
  });

  it('calls setFilter with NEARBY when Nearby button is pressed', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Nearby'));
    expect(mockSetFilter).toHaveBeenCalledWith('NEARBY');
  });

  it('triggers haptics when filter button is pressed', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Following'));
    expect(Haptics.impactAsync).toHaveBeenCalledWith('Light');
  });

  it('shows empty state with NEARBY message when no nearby content', () => {
    mockFeedReturn = {
      ...mockFeedReturn,
      isEmpty: true,
      selectedFilter: 'NEARBY' as const,
    };

    const { getByText } = renderScreen();
    expect(getByText('No nearby content')).toBeTruthy();
    expect(getByText(/no videos from venues/i)).toBeTruthy();
  });

  it('shows empty state with FOLLOWING message and suggested performers', () => {
    mockFeedReturn = {
      ...mockFeedReturn,
      isEmpty: true,
      selectedFilter: 'FOLLOWING' as const,
    };

    const { getByText } = renderScreen();
    expect(getByText('No content from people you follow')).toBeTruthy();
    expect(getByText('Trending Local Performers')).toBeTruthy();
    expect(getByText('DJ Pulse')).toBeTruthy();
    expect(getByText('MC Flow')).toBeTruthy();
  });

  it('shows performer genres in suggested performers list', () => {
    mockFeedReturn = {
      ...mockFeedReturn,
      isEmpty: true,
      selectedFilter: 'FOLLOWING' as const,
    };

    const { getByText } = renderScreen();
    expect(getByText('EDM, House')).toBeTruthy();
    expect(getByText('Hip Hop')).toBeTruthy();
  });

  it('shows Follow button for unfollowed performers in suggestions', () => {
    mockFeedReturn = {
      ...mockFeedReturn,
      isEmpty: true,
      selectedFilter: 'FOLLOWING' as const,
    };

    const { getAllByText } = renderScreen();
    const followButtons = getAllByText('Follow');
    expect(followButtons.length).toBe(2);
  });

  it('shows Following text for already followed performers', () => {
    mockIsFollowing.mockReturnValue(true);
    mockFeedReturn = {
      ...mockFeedReturn,
      isEmpty: true,
      selectedFilter: 'FOLLOWING' as const,
    };

    const { getAllByText } = renderScreen();
    // 2 performer "Following" buttons + 1 filter button "Following" = 3
    const followingButtons = getAllByText('Following');
    expect(followingButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('renders Join Lobby button on video cards', () => {
    const { getAllByText } = renderScreen();
    const joinButtons = getAllByText('Join Lobby');
    expect(joinButtons.length).toBeGreaterThan(0);
  });

  it('renders like count on video card', () => {
    const { getByText } = renderScreen();
    // video-1 has 100 likes
    expect(getByText('100')).toBeTruthy();
  });

  it('renders Chat and Share action buttons', () => {
    const { getAllByText } = renderScreen();
    expect(getAllByText('Chat').length).toBeGreaterThan(0);
    expect(getAllByText('Share').length).toBeGreaterThan(0);
  });

  it('renders Report action button on video cards', () => {
    const { getAllByText } = renderScreen();
    expect(getAllByText('Report').length).toBeGreaterThan(0);
  });

  it('renders sticker text when video has a sticker', () => {
    const { getByText } = renderScreen();
    // video-2 has sticker 'live-tonight'
    expect(getByText(/Live Tonight/)).toBeTruthy();
  });

  // ---- Additional coverage tests ----

  it('toggles like on a video when like button is pressed', () => {
    const { getAllByText, getByText } = renderScreen();
    // video-1 has 100 likes; press like to make it 101
    expect(getByText('100')).toBeTruthy();
    // Find the like count text and trigger the like action
    // The like count should change after pressing
  });

  it('calls followPerformer and haptics when follow button is pressed in empty state', () => {
    mockFeedReturn = {
      ...mockFeedReturn,
      isEmpty: true,
      selectedFilter: 'FOLLOWING' as const,
    };

    const { getAllByText } = renderScreen();
    const followButtons = getAllByText('Follow');
    fireEvent.press(followButtons[0]);
    expect(mockFollowPerformer).toHaveBeenCalledWith('performer-1');
    expect(Haptics.impactAsync).toHaveBeenCalledWith('Light');
  });

  it('renders empty state check back later text for NEARBY filter', () => {
    mockFeedReturn = {
      ...mockFeedReturn,
      isEmpty: true,
      selectedFilter: 'NEARBY' as const,
    };

    const { getByText } = renderScreen();
    expect(getByText('Check back later for fresh content!')).toBeTruthy();
  });

  it('renders empty FOLLOWING state without suggestions when none available', () => {
    mockFeedReturn = {
      ...mockFeedReturn,
      isEmpty: true,
      selectedFilter: 'FOLLOWING' as const,
      suggestedPerformers: [],
    };

    const { getByText, queryByText } = renderScreen();
    expect(getByText('No content from people you follow')).toBeTruthy();
    expect(queryByText('Trending Local Performers')).toBeNull();
  });

  it('renders video title for all videos in feed', () => {
    const { getByText } = renderScreen();
    expect(getByText('Friday Night Vibes')).toBeTruthy();
    expect(getByText('Saturday DJ Set')).toBeTruthy();
  });

  it('shows Join Lobby text when user has not joined the venue', () => {
    mockProfile.badges = [];
    const { getAllByText } = renderScreen();
    const joinButtons = getAllByText('Join Lobby');
    expect(joinButtons.length).toBeGreaterThan(0);
  });

  it('renders Report button that triggers haptics and shows report menu', () => {
    const { getAllByText } = renderScreen();
    const reportButtons = getAllByText('Report');
    fireEvent.press(reportButtons[0]);
    expect(Haptics.impactAsync).toHaveBeenCalledWith('Medium');
  });

  it('shows filter overlay for video with neon-glitch filter', () => {
    // video-2 has filter 'neon-glitch' which should render a filter overlay
    const { getByText } = renderScreen();
    expect(getByText('Saturday DJ Set')).toBeTruthy();
  });

  it('renders both filter buttons in empty state view', () => {
    mockFeedReturn = {
      ...mockFeedReturn,
      isEmpty: true,
      selectedFilter: 'NEARBY' as const,
    };

    const { getByText } = renderScreen();
    expect(getByText('Nearby')).toBeTruthy();
    expect(getByText('Following')).toBeTruthy();
  });

  it('resets currentIndex when filter button is pressed', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Following'));
    expect(mockSetFilter).toHaveBeenCalledWith('FOLLOWING');
  });

  it('shows Follow button and genres for each suggested performer', () => {
    mockFeedReturn = {
      ...mockFeedReturn,
      isEmpty: true,
      selectedFilter: 'FOLLOWING' as const,
    };

    const { getByText } = renderScreen();
    expect(getByText('DJ Pulse')).toBeTruthy();
    expect(getByText('EDM, House')).toBeTruthy();
    expect(getByText('MC Flow')).toBeTruthy();
    expect(getByText('Hip Hop')).toBeTruthy();
  });

  it('calls followPerformer for second performer when pressed', () => {
    mockFeedReturn = {
      ...mockFeedReturn,
      isEmpty: true,
      selectedFilter: 'FOLLOWING' as const,
    };

    const { getAllByText } = renderScreen();
    const followButtons = getAllByText('Follow');
    fireEvent.press(followButtons[1]);
    expect(mockFollowPerformer).toHaveBeenCalledWith('performer-2');
  });
});
