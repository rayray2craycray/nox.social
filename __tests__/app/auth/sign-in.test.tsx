jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
  NotificationFeedbackType: { Success: 'Success', Warning: 'Warning', Error: 'Error' },
}));

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ---- Mocks ----

const mockSignIn = jest.fn();
const mockRouterPush = jest.fn();
const mockRouterBack = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    isSigningIn: false,
  }),
}));

jest.mock('expo-router', () => ({
  router: {
    push: (...args: any[]) => mockRouterPush(...args),
    replace: jest.fn(),
    back: (...args: any[]) => mockRouterBack(...args),
  },
  Stack: {
    Screen: (_props: any) => null,
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

import SignInScreen from '@/app/auth/sign-in';

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
      <SignInScreen />
    </QueryClientProvider>
  );
}

// ---- Tests ----

describe('SignInScreen', () => {
  const mockAlert = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as any).alert = mockAlert;
  });

  it('renders the welcome header text', () => {
    const { getByText } = renderScreen();
    expect(getByText('Welcome Back')).toBeTruthy();
    expect(getByText('Sign in to continue')).toBeTruthy();
  });

  it('renders email and password input fields', () => {
    const { getByPlaceholderText } = renderScreen();
    expect(getByPlaceholderText('your@email.com')).toBeTruthy();
    expect(getByPlaceholderText('••••••••')).toBeTruthy();
  });

  it('renders the Sign In button', () => {
    const { getByText } = renderScreen();
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('renders the Forgot Password link', () => {
    const { getByText } = renderScreen();
    expect(getByText('Forgot Password?')).toBeTruthy();
  });

  it('renders the Sign Up link', () => {
    const { getByText } = renderScreen();
    expect(getByText("Don't have an account? Sign Up")).toBeTruthy();
  });

  it('shows alert when submitting with empty fields', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Sign In'));
    expect(mockAlert).toHaveBeenCalledWith('Please fill in all fields');
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('shows alert when only email is filled', () => {
    const { getByText, getByPlaceholderText } = renderScreen();
    fireEvent.changeText(getByPlaceholderText('your@email.com'), 'test@example.com');
    fireEvent.press(getByText('Sign In'));
    expect(mockAlert).toHaveBeenCalledWith('Please fill in all fields');
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('calls signIn with email and password when both are provided', () => {
    const { getByText, getByPlaceholderText } = renderScreen();
    fireEvent.changeText(getByPlaceholderText('your@email.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'mypassword123');
    fireEvent.press(getByText('Sign In'));
    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'mypassword123',
    });
  });

  it('navigates to forgot password when link is pressed', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Forgot Password?'));
    expect(mockRouterPush).toHaveBeenCalledWith('/auth/forgot-password');
  });

  it('navigates to sign up when link is pressed', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText("Don't have an account? Sign Up"));
    expect(mockRouterPush).toHaveBeenCalledWith('/auth/sign-up');
  });

  it('renders the or divider', () => {
    const { getByText } = renderScreen();
    expect(getByText('or')).toBeTruthy();
  });

  it('updates email input value on change', () => {
    const { getByPlaceholderText } = renderScreen();
    const input = getByPlaceholderText('your@email.com');
    fireEvent.changeText(input, 'user@test.com');
    expect(input.props.value).toBe('user@test.com');
  });
});
