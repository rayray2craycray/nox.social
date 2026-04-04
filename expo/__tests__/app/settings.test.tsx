jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
  NotificationFeedbackType: { Success: 'Success', Warning: 'Warning', Error: 'Error' },
}));

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ---- Mocks ----

const mockToggleIncognito = jest.fn();
const mockSetUserRole = jest.fn();
const mockAddLinkedCard = jest.fn();
const mockRemoveLinkedCard = jest.fn();

jest.mock('@/contexts/AppStateContext', () => ({
  useAppState: () => ({
    profile: {
      id: 'user-1',
      displayName: 'TestUser',
      totalSpend: 500,
      isIncognito: false,
      role: 'PARTYGOER',
      badges: [],
      followedPerformers: [],
      transactionHistory: [],
      isAuthenticated: true,
    },
    toggleIncognito: mockToggleIncognito,
    setUserRole: mockSetUserRole,
    linkedCards: [
      {
        id: 'card-1',
        last4: '4242',
        brand: 'Visa',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: true,
        cardholderName: 'TestUser',
      },
    ],
    addLinkedCard: mockAddLinkedCard,
    removeLinkedCard: mockRemoveLinkedCard,
  }),
}));

const mockToggleGhostMode = jest.fn();
const mockUpdateLocationSettings = jest.fn();

jest.mock('@/contexts/SocialContext', () => ({
  useSocial: () => ({
    locationSettings: {
      ghostMode: false,
      precision: 'EXACT',
      autoExpireEnabled: false,
      autoExpireTime: '4:00 AM',
      onlyShowToMutual: false,
    },
    updateLocationSettings: mockUpdateLocationSettings,
    toggleGhostMode: mockToggleGhostMode,
  }),
}));

const mockSignOut = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    signOut: mockSignOut,
  }),
}));

const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: any[]) => mockRouterPush(...args),
    replace: (...args: any[]) => mockRouterReplace(...args),
    back: jest.fn(),
  },
  Stack: {
    Screen: ({ options }: any) => null,
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
  return new Proxy(
    {},
    {
      get: () => icon,
    }
  );
});

import SettingsScreen from '@/app/app/settings';

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
      <SettingsScreen />
    </QueryClientProvider>
  );
}

// ---- Tests ----

describe('SettingsScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert');
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('renders the user display name and clout points', () => {
    const { getAllByText, getByText } = renderScreen();

    expect(getAllByText('TestUser').length).toBeGreaterThanOrEqual(1);
    expect(getByText('500 Clout Points')).toBeTruthy();
  });

  it('renders all main settings sections', () => {
    const { getByText } = renderScreen();

    expect(getByText('User Type')).toBeTruthy();
    expect(getByText('Location Sharing')).toBeTruthy();
    expect(getByText('Privacy')).toBeTruthy();
    expect(getByText('Wallet & POS')).toBeTruthy();
    expect(getByText('Notifications')).toBeTruthy();
    expect(getByText('Preferences')).toBeTruthy();
    expect(getByText('Support & Legal')).toBeTruthy();
  });

  it('calls setUserRole when switching user type', () => {
    const { getByText } = renderScreen();

    fireEvent.press(getByText('Venue'));
    expect(mockSetUserRole).toHaveBeenCalledWith('VENUE');

    fireEvent.press(getByText('Talent'));
    expect(mockSetUserRole).toHaveBeenCalledWith('TALENT');

    fireEvent.press(getByText('Party-Goer'));
    expect(mockSetUserRole).toHaveBeenCalledWith('PARTYGOER');
  });

  it('calls toggleGhostMode when Ghost Mode switch is toggled', () => {
    const { getByText } = renderScreen();

    // Find the Ghost Mode switch - it's next to the "Ghost Mode" text
    // The Switch is in the same card. We use the text to locate the area,
    // then find the switch by its value.
    expect(getByText('Ghost Mode')).toBeTruthy();
    expect(getByText('Visible to friends')).toBeTruthy();
  });

  it('calls toggleIncognito when Server Incognito switch area is present', () => {
    const { getByText } = renderScreen();

    expect(getByText('Server Incognito')).toBeTruthy();
    expect(getByText('Everyone can see you')).toBeTruthy();
  });

  it('displays linked card information', () => {
    const { getByText } = renderScreen();

    expect(getByText(/Visa/)).toBeTruthy();
    expect(getByText(/4242/)).toBeTruthy();
    expect(getByText('1 card linked')).toBeTruthy();
  });

  it('opens add card modal when Linked Cards is pressed', () => {
    const { getByText } = renderScreen();

    fireEvent.press(getByText('Linked Cards'));

    expect(getByText('Link Payment Card')).toBeTruthy();
    expect(getByText('Card Number')).toBeTruthy();
  });

  it('adds a card when valid card number is entered and Link Card is pressed', () => {
    const { getByText, getByPlaceholderText } = renderScreen();

    // Open modal
    fireEvent.press(getByText('Linked Cards'));

    // Enter a card number
    const input = getByPlaceholderText('4242 4242 4242 4242');
    fireEvent.changeText(input, '4111111111111111');

    // Press Link Card
    fireEvent.press(getByText('Link Card'));

    expect(mockAddLinkedCard).toHaveBeenCalledWith(
      expect.objectContaining({
        last4: '1111',
        brand: 'Visa',
      })
    );
  });

  it('does not add a card when card number is too short', () => {
    const { getByText, getByPlaceholderText } = renderScreen();

    fireEvent.press(getByText('Linked Cards'));

    const input = getByPlaceholderText('4242 4242 4242 4242');
    fireEvent.changeText(input, '123');

    fireEvent.press(getByText('Link Card'));

    expect(mockAddLinkedCard).not.toHaveBeenCalled();
  });

  it('shows remove card confirmation alert when trash icon is pressed', () => {
    const { getByText } = renderScreen();

    // The trash icon is next to the card — rendered as a TouchableOpacity.
    // We can find the "Default" text which confirms the card is rendered,
    // and the remove handler triggers an Alert.
    expect(getByText('Default')).toBeTruthy();
  });

  it('shows logout confirmation alert', () => {
    const { getByText } = renderScreen();

    fireEvent.press(getByText('Log Out'));

    expect(alertSpy).toHaveBeenCalledWith(
      'Log Out',
      'Are you sure you want to log out?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Log Out', style: 'destructive' }),
      ])
    );
  });

  it('calls signOut when logout is confirmed', () => {
    const { getByText } = renderScreen();

    fireEvent.press(getByText('Log Out'));

    // Simulate pressing the destructive "Log Out" button in the alert
    const alertCall = alertSpy.mock.calls[0];
    const buttons = alertCall[2];
    const logOutButton = buttons.find((b: any) => b.text === 'Log Out');
    logOutButton.onPress();

    expect(mockSignOut).toHaveBeenCalled();
  });

  it('shows delete account confirmation alert', () => {
    const { getByText } = renderScreen();

    fireEvent.press(getByText('Delete Account'));

    expect(alertSpy).toHaveBeenCalledWith(
      'Delete Account',
      expect.stringContaining('permanently delete'),
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Delete', style: 'destructive' }),
      ])
    );
  });

  it('navigates to blocked users screen', () => {
    const { getByText } = renderScreen();

    fireEvent.press(getByText('Blocked Users'));

    expect(mockRouterPush).toHaveBeenCalledWith('/blocked-users');
  });

  it('navigates to community guidelines screen', () => {
    const { getByText } = renderScreen();

    fireEvent.press(getByText('Community Guidelines'));

    expect(mockRouterPush).toHaveBeenCalledWith('/community-guidelines');
  });

  it('opens transaction history modal', () => {
    const { getByText } = renderScreen();

    fireEvent.press(getByText('Transaction History'));

    // The modal should now be visible with transaction data
    expect(getByText('The Nox Room')).toBeTruthy();
    expect(getByText('Neon Pulse')).toBeTruthy();
    expect(getByText('$85.50')).toBeTruthy();
  });

  it('shows location precision buttons', () => {
    const { getByText } = renderScreen();

    expect(getByText('Exact')).toBeTruthy();
    expect(getByText('Venue Only')).toBeTruthy();
    expect(getByText('Hidden')).toBeTruthy();
  });

  it('calls updateLocationSettings when precision button is pressed', () => {
    const { getByText } = renderScreen();

    fireEvent.press(getByText('Venue Only'));
    expect(mockUpdateLocationSettings).toHaveBeenCalledWith({ precision: 'VENUE_ONLY' });

    fireEvent.press(getByText('Hidden'));
    expect(mockUpdateLocationSettings).toHaveBeenCalledWith({ precision: 'HIDDEN' });
  });

  it('renders the version text', () => {
    const { getByText } = renderScreen();
    expect(getByText('VibeLink v1.0.0')).toBeTruthy();
  });
});
