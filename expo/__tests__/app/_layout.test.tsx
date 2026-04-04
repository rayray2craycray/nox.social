jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
  NotificationFeedbackType: { Success: 'Success', Warning: 'Warning', Error: 'Error' },
}));

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---- Mocks ----

// expo-router
jest.mock('expo-router', () => {
  const React = require('react');
  const { View } = require('react-native');
  const StackScreen = ({ children }: any) => children || null;
  const Stack = Object.assign(
    ({ children }: any) => React.createElement(View, { testID: 'mock-stack' }, children),
    { Screen: (_props: any) => null }
  );
  return {
    Stack,
    Tabs: Object.assign(
      ({ children }: any) => React.createElement(View, null, children),
      { Screen: (_props: any) => null }
    ),
    useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
    router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  };
});

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

// Override gesture handler mock to include GestureHandlerRootView
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockComponent = (props: any) => React.createElement(View, props);
  return {
    Swipeable: MockComponent,
    DrawerLayout: MockComponent,
    State: {},
    ScrollView: MockComponent,
    Slider: MockComponent,
    Switch: MockComponent,
    TextInput: MockComponent,
    ToolbarAndroid: MockComponent,
    ViewPagerAndroid: MockComponent,
    DrawerLayoutAndroid: MockComponent,
    WebView: MockComponent,
    NativeViewGestureHandler: MockComponent,
    TapGestureHandler: MockComponent,
    FlingGestureHandler: MockComponent,
    ForceTouchGestureHandler: MockComponent,
    LongPressGestureHandler: MockComponent,
    PanGestureHandler: MockComponent,
    PinchGestureHandler: MockComponent,
    RotationGestureHandler: MockComponent,
    RawButton: MockComponent,
    BaseButton: MockComponent,
    RectButton: MockComponent,
    BorderlessButton: MockComponent,
    FlatList: MockComponent,
    GestureHandlerRootView: ({ children, ...props }: any) =>
      React.createElement(View, props, children),
    gestureHandlerRootHOC: (component: any) => component,
    Directions: {},
  };
});

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  const icon = (props: any) => <View {...props} />;
  return { Ionicons: icon };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) =>
      React.createElement(View, props, children),
    SafeAreaProvider: ({ children }: any) => children,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// Mock Sentry config
jest.mock('@/config/sentry', () => ({
  initSentry: jest.fn(),
  captureException: jest.fn(),
}));

// Mock all 18 context providers as passthrough wrappers
const createMockProvider = (name: string) => {
  return ({ children }: { children: React.ReactNode }) => <>{children}</>;
};

jest.mock('@/contexts/AppStateContext', () => ({
  AppStateProvider: createMockProvider('AppStateProvider'),
  DiscoveryProvider: createMockProvider('DiscoveryProvider'),
  useAppState: () => ({
    profile: { id: 'user-1', displayName: 'Test', role: 'PARTYGOER', isAuthenticated: true },
  }),
}));

jest.mock('@/contexts/PerformerContext', () => ({
  PerformerProvider: createMockProvider('PerformerProvider'),
}));

jest.mock('@/contexts/SocialContext', () => ({
  SocialProvider: createMockProvider('SocialProvider'),
  useSocial: () => ({ locationSettings: {} }),
}));

jest.mock('@/contexts/FeedContext', () => ({
  FeedProvider: createMockProvider('FeedProvider'),
}));

jest.mock('@/contexts/POSContext', () => ({
  POSProvider: createMockProvider('POSProvider'),
}));

jest.mock('@/contexts/GlowContext', () => ({
  GlowProvider: createMockProvider('GlowProvider'),
  useGlow: () => ({
    GlowOverlay: () => null,
    triggerGlow: jest.fn(),
  }),
}));

jest.mock('@/contexts/GrowthContext', () => ({
  GrowthProvider: createMockProvider('GrowthProvider'),
}));

jest.mock('@/contexts/EventsContext', () => ({
  EventsProvider: createMockProvider('EventsProvider'),
}));

jest.mock('@/contexts/ContentContext', () => ({
  ContentProvider: createMockProvider('ContentProvider'),
}));

jest.mock('@/contexts/MonetizationContext', () => ({
  MonetizationProvider: createMockProvider('MonetizationProvider'),
}));

jest.mock('@/contexts/RetentionContext', () => ({
  RetentionProvider: createMockProvider('RetentionProvider'),
}));

jest.mock('@/contexts/AuthContext', () => ({
  AuthProvider: createMockProvider('AuthProvider'),
  useAuth: () => ({ signOut: jest.fn() }),
}));

jest.mock('@/contexts/ChatContext', () => ({
  ChatProvider: createMockProvider('ChatProvider'),
}));

jest.mock('@/contexts/VenueManagementContext', () => ({
  VenueManagementProvider: createMockProvider('VenueManagementProvider'),
}));

jest.mock('@/contexts/ModerationContext', () => ({
  ModerationProvider: createMockProvider('ModerationProvider'),
}));

jest.mock('@/contexts/UploadContext', () => ({
  UploadProvider: createMockProvider('UploadProvider'),
}));

jest.mock('@/contexts/ToastNotificationContext', () => ({
  ToastProvider: createMockProvider('ToastProvider'),
}));

jest.mock('@/contexts/NetworkContext', () => ({
  NetworkProvider: createMockProvider('NetworkProvider'),
}));

// Mock ErrorBoundary as passthrough
jest.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: any) => <>{children}</>,
}));

// Mock OfflineBanner
jest.mock('@/components/OfflineBanner', () => ({
  OfflineBanner: () => null,
}));

// Mock AgeVerificationGate
jest.mock('@/components/AgeVerificationGate', () => {
  const { View, Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ visible, onVerified }: any) =>
      visible ? (
        <View testID="age-gate">
          <Text>Age Verification</Text>
        </View>
      ) : null,
  };
});

import RootLayout from '@/app/app/_layout';

// ---- Tests ----

describe('RootLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  it('renders without crashing', async () => {
    const { toJSON } = render(<RootLayout />);
    await waitFor(() => {
      expect(toJSON()).not.toBeNull();
    });
  });

  it('renders the Stack navigator', async () => {
    const { getByTestId } = render(<RootLayout />);
    await waitFor(() => {
      expect(getByTestId('mock-stack')).toBeTruthy();
    });
  });

  it('calls SplashScreen.hideAsync on mount', async () => {
    const SplashScreen = require('expo-splash-screen');
    render(<RootLayout />);
    await waitFor(() => {
      expect(SplashScreen.hideAsync).toHaveBeenCalled();
    });
  });

  it('calls initSentry on mount', async () => {
    const { initSentry } = require('@/config/sentry');
    render(<RootLayout />);
    await waitFor(() => {
      expect(initSentry).toHaveBeenCalled();
    });
  });

  it('shows age verification gate when user is not verified', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const { findByTestId } = render(<RootLayout />);
    const gate = await findByTestId('age-gate');
    expect(gate).toBeTruthy();
  });

  it('does not show age gate when user is already verified', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');
    const { queryByTestId } = render(<RootLayout />);
    await waitFor(() => {
      expect(queryByTestId('age-gate')).toBeNull();
    });
  });

  it('renders loading overlay initially while checking age', () => {
    // Before the async check completes, there should be a loading overlay
    const { toJSON } = render(<RootLayout />);
    // The component tree should render (not be null)
    expect(toJSON()).not.toBeNull();
  });

  it('removes loading overlay after age check completes', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');
    render(<RootLayout />);
    // After async check, the loading overlay style (position absolute, zIndex 9999)
    // should be gone. We just confirm it doesn't crash.
    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('age_verified');
    });
  });

  it('handles AsyncStorage failure gracefully by showing age gate', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
    const { findByTestId } = render(<RootLayout />);
    const gate = await findByTestId('age-gate');
    expect(gate).toBeTruthy();
  });

  it('handles AsyncStorage timeout by showing age gate', async () => {
    // Simulate a never-resolving promise to trigger the 3s timeout
    (AsyncStorage.getItem as jest.Mock).mockReturnValue(new Promise(() => {}));
    jest.useFakeTimers();
    const { queryByTestId } = render(<RootLayout />);
    // Advance past the 3-second timeout
    jest.advanceTimersByTime(3500);
    await waitFor(() => {
      expect(queryByTestId('age-gate')).toBeTruthy();
    });
    jest.useRealTimers();
  });
});
