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
import * as Haptics from 'expo-haptics';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  Stack: { Screen: () => null },
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

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const icon = (props: any) => <View testID={props.testID} />;
  return new Proxy({}, { get: () => icon });
});

// --- Disconnected state mock (default) ---
const mockConnectPOS = { mutateAsync: jest.fn() };
const mockDisconnectPOS = { mutate: jest.fn() };
const mockValidateCredentials = { mutateAsync: jest.fn().mockResolvedValue({ valid: true }) };
const mockUpdateSpendRule = { mutate: jest.fn() };
const mockTriggerGlow = jest.fn();

let mockPOSState = {
  integration: null as any,
  availableLocations: [],
  spendRules: [] as any[],
  isConnected: false,
  isConnecting: false,
  hasError: false,
  connectPOS: mockConnectPOS,
  disconnectPOS: mockDisconnectPOS,
  validateCredentials: mockValidateCredentials,
  updateSpendRule: mockUpdateSpendRule,
};

jest.mock('@/contexts/POSContext', () => ({
  usePOS: () => mockPOSState,
}));

jest.mock('@/contexts/GlowContext', () => ({
  useGlow: () => ({
    triggerGlow: mockTriggerGlow,
  }),
}));

import POSIntegrationScreen from '../pos-integration';

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
      <POSIntegrationScreen />
    </QueryClientProvider>
  );
}

describe('POSIntegrationScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert');

    // Reset to disconnected state
    mockPOSState = {
      integration: null,
      availableLocations: [],
      spendRules: [],
      isConnected: false,
      isConnecting: false,
      hasError: false,
      connectPOS: mockConnectPOS,
      disconnectPOS: mockDisconnectPOS,
      validateCredentials: mockValidateCredentials,
      updateSpendRule: mockUpdateSpendRule,
    };
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('renders header title and description', () => {
    const { getByText } = renderScreen();
    expect(getByText('POS Integration')).toBeTruthy();
    expect(
      getByText('Connect Toast or Square to automatically reward customers based on spending')
    ).toBeTruthy();
  });

  it('shows Disconnected status when not connected', () => {
    const { getByText } = renderScreen();
    expect(getByText('Disconnected')).toBeTruthy();
    expect(getByText('Integration Status')).toBeTruthy();
  });

  it('shows provider selector when disconnected', () => {
    const { getByText } = renderScreen();
    expect(getByText('POS Provider')).toBeTruthy();
    expect(getByText('TOAST')).toBeTruthy();
  });

  it('shows API key and location ID inputs when disconnected', () => {
    const { getByText } = renderScreen();
    expect(getByText('API Key')).toBeTruthy();
    expect(getByText('Restaurant GUID')).toBeTruthy();
  });

  it('shows Connect button when disconnected', () => {
    const { getByText } = renderScreen();
    expect(getByText('Connect to TOAST')).toBeTruthy();
  });

  it('shows environment toggle buttons', () => {
    const { getByText } = renderScreen();
    expect(getByText('Environment')).toBeTruthy();
    expect(getByText('Production')).toBeTruthy();
    expect(getByText('Sandbox')).toBeTruthy();
  });

  it('shows Toast setup instructions by default', () => {
    const { getByText } = renderScreen();
    expect(getByText('Toast Setup')).toBeTruthy();
    expect(getByText(/Log in to your Toast account/)).toBeTruthy();
  });

  it('toggles provider picker and shows Square option', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('TOAST'));
    expect(getByText('Toast POS')).toBeTruthy();
    expect(getByText('Square POS')).toBeTruthy();
  });

  it('switches labels when Square provider is selected', () => {
    const { getByText } = renderScreen();
    // Open picker
    fireEvent.press(getByText('TOAST'));
    // Select Square
    fireEvent.press(getByText('Square POS'));
    expect(getByText('Access Token')).toBeTruthy();
    expect(getByText('Location ID')).toBeTruthy();
    expect(getByText('Square Setup')).toBeTruthy();
  });

  it('shows error alert when API key is empty on connect', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Connect to TOAST'));
    expect(alertSpy).toHaveBeenCalledWith('Error', 'Please enter your API key');
  });

  it('shows error alert when location ID is empty on connect', () => {
    const { getByText, getByPlaceholderText } = renderScreen();
    const apiInput = getByPlaceholderText('Enter your Toast API key');
    fireEvent.changeText(apiInput, 'test-api-key');
    fireEvent.press(getByText('Connect to TOAST'));
    expect(alertSpy).toHaveBeenCalledWith('Error', 'Please enter your location ID');
  });

  it('shows How It Works info card', () => {
    const { getByText } = renderScreen();
    expect(getByText('How It Works')).toBeTruthy();
    expect(getByText(/All card data is tokenized/)).toBeTruthy();
  });

  it('renders Connected state with disconnect button and spend rules', () => {
    mockPOSState.isConnected = true;
    mockPOSState.integration = {
      provider: 'TOAST',
      connectedAt: '2026-03-01T10:00:00Z',
      metadata: { environment: 'PRODUCTION' },
      syncConfig: { lastSyncAt: '2026-03-10T08:00:00Z' },
      stats: { transactionCount: 42, totalRevenue: 150000 },
    };
    mockPOSState.spendRules = [
      {
        id: 'rule-1',
        venueId: 'venue-1',
        threshold: 50,
        tierUnlocked: 'REGULAR',
        serverAccessLevel: 'PUBLIC_LOBBY',
        isLiveOnly: false,
        isActive: true,
        description: 'Spend $50 to unlock Regular',
      },
    ];

    const { getByText } = renderScreen();
    expect(getByText('Connected')).toBeTruthy();
    expect(getByText('Disconnect')).toBeTruthy();
    expect(getByText('Spend Thresholds')).toBeTruthy();
    expect(getByText('$50+')).toBeTruthy();
    expect(getByText('REGULAR')).toBeTruthy();
    expect(getByText('Public Lobby')).toBeTruthy();
  });

  it('shows disconnect confirmation alert when Disconnect is pressed', () => {
    mockPOSState.isConnected = true;
    mockPOSState.integration = {
      provider: 'TOAST',
      connectedAt: '2026-03-01T10:00:00Z',
      metadata: {},
      syncConfig: {},
    };

    const { getByText } = renderScreen();
    fireEvent.press(getByText('Disconnect'));

    expect(alertSpy).toHaveBeenCalledWith(
      'Disconnect POS',
      expect.stringContaining('Are you sure you want to disconnect'),
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Disconnect', style: 'destructive' }),
      ])
    );
  });

  it('switches environment to Sandbox when pressed', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Sandbox'));
    // Environment button should exist and be interactable
    expect(getByText('Sandbox')).toBeTruthy();
  });
});
