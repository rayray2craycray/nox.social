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

const mockRouterPush = jest.fn();
const mockRouterBack = jest.fn();

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

import ForgotPasswordScreen from '@/app/auth/forgot-password';

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
      <ForgotPasswordScreen />
    </QueryClientProvider>
  );
}

// ---- Tests ----

describe('ForgotPasswordScreen', () => {
  const mockAlert = jest.fn();
  let fetchSpy: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as any).alert = mockAlert;
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    });
    fetchSpy = (globalThis as any).fetch;
  });

  it('renders the Reset Password header', () => {
    const { getByText } = renderScreen();
    expect(getByText('Reset Password')).toBeTruthy();
  });

  it('renders the subtitle instruction text', () => {
    const { getByText } = renderScreen();
    expect(
      getByText(/Enter your email and we'll send you instructions to reset your password/)
    ).toBeTruthy();
  });

  it('renders the email input field', () => {
    const { getByPlaceholderText } = renderScreen();
    expect(getByPlaceholderText('your@email.com')).toBeTruthy();
  });

  it('renders the Send Reset Link button', () => {
    const { getByText } = renderScreen();
    expect(getByText('Send Reset Link')).toBeTruthy();
  });

  it('renders the sign in link', () => {
    const { getByText } = renderScreen();
    expect(getByText('Remember your password? Sign In')).toBeTruthy();
  });

  it('shows alert when submitting with empty email', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Send Reset Link'));
    expect(mockAlert).toHaveBeenCalledWith('Please enter your email');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('calls fetch API with email when submitted', async () => {
    const { getByText, getByPlaceholderText } = renderScreen();
    fireEvent.changeText(getByPlaceholderText('your@email.com'), 'test@example.com');
    fireEvent.press(getByText('Send Reset Link'));
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/forgot-password',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com' }),
        })
      );
    });
  });

  it('shows success screen after successful API call', async () => {
    fetchSpy.mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    } as Response);
    const { getByText, getByPlaceholderText } = renderScreen();
    fireEvent.changeText(getByPlaceholderText('your@email.com'), 'test@example.com');
    fireEvent.press(getByText('Send Reset Link'));
    await waitFor(() => {
      expect(getByText('Check Your Email')).toBeTruthy();
    });
    expect(getByText('test@example.com')).toBeTruthy();
    expect(getByText('Click the link in the email to reset your password.')).toBeTruthy();
    expect(getByText('Back to Sign In')).toBeTruthy();
  });

  it('shows error alert when API returns failure', async () => {
    fetchSpy.mockResolvedValue({
      json: () => Promise.resolve({ success: false, message: 'Email not found' }),
    } as Response);
    const { getByText, getByPlaceholderText } = renderScreen();
    fireEvent.changeText(getByPlaceholderText('your@email.com'), 'bad@example.com');
    fireEvent.press(getByText('Send Reset Link'));
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Email not found');
    });
  });

  it('shows generic error alert when fetch throws', async () => {
    fetchSpy.mockRejectedValue(new Error('Network error'));
    const { getByText, getByPlaceholderText } = renderScreen();
    fireEvent.changeText(getByPlaceholderText('your@email.com'), 'test@example.com');
    fireEvent.press(getByText('Send Reset Link'));
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Could not send reset email. Please try again.');
    });
  });

  it('navigates to sign in from success screen', async () => {
    fetchSpy.mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    } as Response);
    const { getByText, getByPlaceholderText } = renderScreen();
    fireEvent.changeText(getByPlaceholderText('your@email.com'), 'test@example.com');
    fireEvent.press(getByText('Send Reset Link'));
    await waitFor(() => {
      expect(getByText('Back to Sign In')).toBeTruthy();
    });
    fireEvent.press(getByText('Back to Sign In'));
    expect(mockRouterPush).toHaveBeenCalledWith('/auth/sign-in');
  });

  it('navigates to sign in from the form screen link', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Remember your password? Sign In'));
    expect(mockRouterPush).toHaveBeenCalledWith('/auth/sign-in');
  });
});
