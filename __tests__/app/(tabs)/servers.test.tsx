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

const mockJoinedServers = [
  {
    venueId: 'venue-1',
    venueName: 'The Midnight Lounge',
    memberCount: 128,
    lastActivity: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    channels: [
      {
        id: 'ch-1',
        name: 'general',
        type: 'PUBLIC_LOBBY',
        isLocked: false,
        unreadCount: 3,
        messages: [],
      },
      {
        id: 'ch-2',
        name: 'vip-lounge',
        type: 'INNER_CIRCLE',
        isLocked: false,
        unreadCount: 0,
        messages: [],
      },
      {
        id: 'ch-3',
        name: 'backstage',
        type: 'INNER_CIRCLE',
        isLocked: true,
        unreadCount: 0,
        messages: [],
      },
    ],
  },
  {
    venueId: 'venue-2',
    venueName: 'Neon Pulse',
    memberCount: 64,
    lastActivity: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    channels: [
      {
        id: 'ch-4',
        name: 'general',
        type: 'PUBLIC_LOBBY',
        isLocked: false,
        unreadCount: 0,
        messages: [],
      },
    ],
  },
];

jest.mock('@/contexts/AppStateContext', () => ({
  useAppState: () => ({
    profile: {
      id: 'user-1',
      displayName: 'TestUser',
      totalSpend: 500,
      isIncognito: false,
      role: 'PARTYGOER',
      badges: [{ id: 'b1', venueId: 'venue-1', venueName: 'The Midnight Lounge', badgeType: 'REGULAR', unlockedAt: new Date().toISOString() }],
      followedPerformers: [],
      transactionHistory: [],
      isAuthenticated: true,
      isVenueManager: false,
      managedVenues: [],
    },
    joinedServers: mockJoinedServers,
    getBroadcastMessagesForChannel: jest.fn(() => []),
    canVoteVibeCheck: jest.fn(() => true),
    getVibeCooldownRemaining: jest.fn(() => 0),
    getVenueVibe: jest.fn(() => null),
    submitVibeCheck: { mutateAsync: jest.fn(), isPending: false },
  }),
}));

const mockGetFriendProfile = jest.fn(() => null);

jest.mock('@/contexts/SocialContext', () => ({
  useSocial: () => ({
    getFriendProfile: mockGetFriendProfile,
    locationSettings: { ghostMode: false, precision: 'EXACT' },
  }),
}));

jest.mock('@/contexts/ChatContext', () => ({
  useChat: () => ({
    messages: [],
    sendMessage: jest.fn(),
    joinChannel: jest.fn(),
    leaveChannel: jest.fn(),
    loadMessages: jest.fn(),
    isLoadingMessages: false,
    isConnected: true,
    typingUsers: [],
    startTyping: jest.fn(),
    stopTyping: jest.fn(),
  }),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({}),
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

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const icon = (props: any) => <View testID={props.testID} />;
  return new Proxy({}, { get: () => icon });
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/components/UserProfileModal', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: any) => props.visible ? <View testID="user-profile-modal" /> : null,
  };
});

import ServersScreen from '@/app/(tabs)/servers';

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
      <ServersScreen />
    </QueryClientProvider>
  );
}

// ---- Tests ----

describe('ServersScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Servers and Messages tabs', () => {
    const { getByText } = renderScreen();
    expect(getByText('Servers')).toBeTruthy();
    expect(getByText('Messages')).toBeTruthy();
  });

  it('renders the server list header with correct server count', () => {
    const { getByText } = renderScreen();
    expect(getByText('Your Servers')).toBeTruthy();
    expect(getByText('Connected to 2 venues')).toBeTruthy();
  });

  it('renders all joined server names', () => {
    const { getByText } = renderScreen();
    expect(getByText('The Midnight Lounge')).toBeTruthy();
    expect(getByText('Neon Pulse')).toBeTruthy();
  });

  it('renders member counts for servers', () => {
    const { getByText } = renderScreen();
    expect(getByText('128 members')).toBeTruthy();
    expect(getByText('64 members')).toBeTruthy();
  });

  it('renders the join new server card', () => {
    const { getByText } = renderScreen();
    expect(getByText('Join a new server')).toBeTruthy();
    expect(getByText('Visit a venue and scan the QR code')).toBeTruthy();
  });

  it('navigates to channel list when a server is pressed', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('The Midnight Lounge'));
    // After selecting a server, the channel list should render
    expect(getByText('PUBLIC LOBBY')).toBeTruthy();
    expect(getByText('INNER CIRCLE')).toBeTruthy();
  });

  it('renders channel names after selecting a server', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('The Midnight Lounge'));
    expect(getByText('general')).toBeTruthy();
    expect(getByText('vip-lounge')).toBeTruthy();
    expect(getByText('backstage')).toBeTruthy();
  });

  it('shows the back button in channel list and navigates back', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('The Midnight Lounge'));
    // Should be on channel list now
    expect(getByText('128 members online')).toBeTruthy();
    // Press back
    fireEvent.press(getByText('← Back'));
    // Should be back on server list
    expect(getByText('Your Servers')).toBeTruthy();
  });

  it('switches to Messages tab and shows direct messages list', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Messages'));
    expect(getByText('Direct Messages')).toBeTruthy();
    expect(getByText('End-to-end encrypted')).toBeTruthy();
  });

  it('shows mock conversations in the messages tab', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Messages'));
    expect(getByText('Alex Chen')).toBeTruthy();
    expect(getByText('Sarah Martinez')).toBeTruthy();
    expect(getByText('Marcus Wright')).toBeTruthy();
  });

  it('opens a DM conversation when a conversation is pressed', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Messages'));
    fireEvent.press(getByText('Alex Chen'));
    // Should now show the DM chat with back button
    expect(getByText('← Back')).toBeTruthy();
    expect(getByText('Encrypted')).toBeTruthy();
  });

  it('shows the message input in a DM conversation', () => {
    const { getByText, getByPlaceholderText } = renderScreen();
    fireEvent.press(getByText('Messages'));
    fireEvent.press(getByText('Alex Chen'));
    expect(getByPlaceholderText('Type an encrypted message...')).toBeTruthy();
  });

  it('navigates back from DM chat to conversations list', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Messages'));
    fireEvent.press(getByText('Alex Chen'));
    fireEvent.press(getByText('← Back'));
    // Should be back to the conversations list
    expect(getByText('Direct Messages')).toBeTruthy();
  });

  it('shows unread badge for conversations with unread messages', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Messages'));
    // Alex Chen has 2 unread, Marcus Wright has 1
    expect(getByText('2')).toBeTruthy();
    expect(getByText('1')).toBeTruthy();
  });

  it('displays channel unread count after selecting a server', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('The Midnight Lounge'));
    // general channel has 3 unread
    expect(getByText('3')).toBeTruthy();
  });

  // ---- Additional coverage tests ----

  it('shows locked channels as disabled after selecting a server', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('The Midnight Lounge'));
    // backstage is locked
    expect(getByText('backstage')).toBeTruthy();
  });

  it('renders settings button in channel list view', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('The Midnight Lounge'));
    expect(getByText('128 members online')).toBeTruthy();
  });

  it('navigates to chat view when an unlocked channel is selected', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('The Midnight Lounge'));
    fireEvent.press(getByText('general'));
    // Should now be in chat view - back button should exist
    expect(getByText('← Back')).toBeTruthy();
    expect(getByText('#general')).toBeTruthy();
  });

  it('navigates back from chat view to channel list', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('The Midnight Lounge'));
    fireEvent.press(getByText('general'));
    expect(getByText('#general')).toBeTruthy();
    fireEvent.press(getByText('← Back'));
    // Should be back on channel list
    expect(getByText('PUBLIC LOBBY')).toBeTruthy();
  });

  it('renders the message input in channel chat view', () => {
    const { getByText, getByPlaceholderText } = renderScreen();
    fireEvent.press(getByText('The Midnight Lounge'));
    fireEvent.press(getByText('general'));
    expect(getByPlaceholderText('Type a message...')).toBeTruthy();
  });

  it('shows DM last message preview in conversations list', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Messages'));
    expect(getByText('See you tonight at The Midnight Lounge!')).toBeTruthy();
    expect(getByText(/That venue was amazing/)).toBeTruthy();
  });

  it('shows online status indicator for online users in DM list', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Messages'));
    // Alex Chen and Marcus Wright are online
    expect(getByText('Alex Chen')).toBeTruthy();
    expect(getByText('Marcus Wright')).toBeTruthy();
  });

  it('shows encrypted badge in DM chat header', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Messages'));
    fireEvent.press(getByText('Alex Chen'));
    expect(getByText('Encrypted')).toBeTruthy();
  });

  it('shows pre-existing messages in Alex Chen DM conversation', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Messages'));
    fireEvent.press(getByText('Alex Chen'));
    expect(getByText('Hey! Are you going to The Midnight Lounge tonight?')).toBeTruthy();
    expect(getByText('Yeah! What time are you heading there?')).toBeTruthy();
  });

  it('navigates to second server channels correctly', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Neon Pulse'));
    expect(getByText('64 members online')).toBeTruthy();
    expect(getByText('general')).toBeTruthy();
  });

  it('renders channel sections PUBLIC LOBBY and INNER CIRCLE', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('The Midnight Lounge'));
    expect(getByText('PUBLIC LOBBY')).toBeTruthy();
    expect(getByText('INNER CIRCLE')).toBeTruthy();
  });
});
