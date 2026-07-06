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

import RulesEngineScreen from '@/app/management/rules-engine';

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
      <RulesEngineScreen />
    </QueryClientProvider>
  );
}

describe('RulesEngineScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert');
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('renders header title and description', () => {
    const { getByText } = renderScreen();
    expect(getByText('Automation Rules')).toBeTruthy();
    expect(
      getByText('Configure triggers that automatically unlock server access and reward loyal customers')
    ).toBeTruthy();
  });

  it('renders the Create New Rule button', () => {
    const { getByText } = renderScreen();
    expect(getByText('Create New Rule')).toBeTruthy();
  });

  it('opens create modal when Create New Rule is pressed', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Create New Rule'));
    expect(getByText('Rule Type')).toBeTruthy();
    expect(getByText('Spending Tier')).toBeTruthy();
    expect(getByText('Frequency Tier')).toBeTruthy();
  });

  it('triggers haptic feedback when Create New Rule is pressed', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Create New Rule'));
    expect(Haptics.impactAsync).toHaveBeenCalledWith('Medium');
  });

  it('shows rule type options in create modal', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Create New Rule'));
    expect(getByText('Spending Tier')).toBeTruthy();
    expect(getByText('Frequency Tier')).toBeTruthy();
    expect(getByText('Specific Purchase')).toBeTruthy();
    expect(getByText('Performer Loyalty')).toBeTruthy();
  });

  it('shows trigger and reward form sections in create modal', () => {
    const { getByText, getAllByText } = renderScreen();
    fireEvent.press(getByText('Create New Rule'));
    expect(getAllByText('Trigger Settings').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('Reward Settings').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Condition Description')).toBeTruthy();
    expect(getAllByText('Threshold').length).toBeGreaterThanOrEqual(1);
  });

  it('shows badge type options in create modal', () => {
    const { getByText, getAllByText } = renderScreen();
    fireEvent.press(getByText('Create New Rule'));
    expect(getAllByText('GUEST').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('REGULAR').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('PLATINUM').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('WHALE').length).toBeGreaterThanOrEqual(1);
  });

  it('shows server access options in create modal', () => {
    const { getByText, getAllByText } = renderScreen();
    fireEvent.press(getByText('Create New Rule'));
    expect(getAllByText('Public Lobby').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('Inner Circle').length).toBeGreaterThanOrEqual(1);
  });

  it('creates a rule and shows success alert', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Create New Rule'));
    fireEvent.press(getByText('Create Rule'));

    expect(alertSpy).toHaveBeenCalledWith(
      'Rule Created',
      'Your new automation rule has been created and activated.',
      expect.any(Array)
    );
  });

  it('displays created rule in the list after creation', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Create New Rule'));
    fireEvent.press(getByText('Create Rule'));

    // After creating, the rule card should be visible
    expect(getByText('SPENDING TIER')).toBeTruthy();
    expect(getByText('Edit')).toBeTruthy();
    expect(getByText('Delete')).toBeTruthy();
  });

  it('shows delete confirmation alert when Delete is pressed on a rule', () => {
    const { getByText } = renderScreen();

    // First create a rule
    fireEvent.press(getByText('Create New Rule'));
    fireEvent.press(getByText('Create Rule'));

    // Now delete it
    fireEvent.press(getByText('Delete'));

    expect(alertSpy).toHaveBeenCalledWith(
      'Delete Rule',
      expect.stringContaining('Are you sure you want to delete'),
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Delete', style: 'destructive' }),
      ])
    );
  });

  it('removes rule from list when delete is confirmed', async () => {
    const { getByText, queryByText } = renderScreen();

    // Create a rule
    fireEvent.press(getByText('Create New Rule'));
    fireEvent.press(getByText('Create Rule'));
    expect(getByText('SPENDING TIER')).toBeTruthy();

    // Press Delete
    fireEvent.press(getByText('Delete'));

    // Confirm deletion inside act
    const alertCall = alertSpy.mock.calls.find(
      (c: any) => c[0] === 'Delete Rule'
    );
    const deleteButton = alertCall![2].find((b: any) => b.text === 'Delete');

    const { act } = require('@testing-library/react-native');
    await act(async () => {
      deleteButton.onPress();
    });

    // Rule should be gone
    expect(queryByText('SPENDING TIER')).toBeNull();
  });

  it('opens edit modal when Edit is pressed on a rule', () => {
    const { getByText } = renderScreen();

    // Create a rule first
    fireEvent.press(getByText('Create New Rule'));
    fireEvent.press(getByText('Create Rule'));

    // Press Edit
    fireEvent.press(getByText('Edit'));

    expect(getByText('Edit Rule')).toBeTruthy();
    expect(getByText('Save Changes')).toBeTruthy();
  });

  it('closes create modal when Cancel is pressed', () => {
    const { getByText, queryByText } = renderScreen();
    fireEvent.press(getByText('Create New Rule'));
    expect(getByText('Rule Type')).toBeTruthy();

    // Press cancel in the modal
    fireEvent.press(getByText('Cancel'));

    // Modal-specific content should be gone
    expect(queryByText('Rule Type')).toBeNull();
  });
});
