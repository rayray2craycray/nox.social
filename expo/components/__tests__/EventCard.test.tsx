jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
  NotificationFeedbackType: { Success: 'Success', Warning: 'Warning', Error: 'Error' },
}));

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// ---- Mocks ----

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

import { EventCard } from '../EventCard';
import * as Haptics from 'expo-haptics';
import { Event } from '@/types';

// ---- Test Data ----

const baseEvent: Event = {
  id: 'event-1',
  venueId: 'venue-1',
  venueName: 'Club Nox',
  title: 'Neon Pulse Night',
  description: 'An electrifying night of house music and neon lights.',
  performerIds: ['perf-1', 'perf-2'],
  date: '2026-04-15',
  startTime: '21:00',
  endTime: '02:00',
  ticketTiers: [
    {
      id: 'tier-1',
      eventId: 'event-1',
      name: 'General Admission',
      price: 25,
      quantity: 100,
      sold: 50,
      tier: 'GENERAL',
      salesWindow: { start: '2026-03-01', end: '2026-04-15' },
      isAppExclusive: false,
    },
    {
      id: 'tier-2',
      eventId: 'event-1',
      name: 'VIP',
      price: 75,
      quantity: 20,
      sold: 5,
      tier: 'VIP',
      salesWindow: { start: '2026-03-01', end: '2026-04-15' },
      isAppExclusive: true,
    },
  ],
  imageUrl: 'https://example.com/event.jpg',
  genres: ['House', 'Techno', 'EDM', 'Trance'],
  totalCapacity: 120,
  createdAt: '2026-03-01T00:00:00Z',
  status: 'UPCOMING',
};

function renderCard(overrides: Partial<Event> = {}, props: { onPress?: () => void; size?: 'small' | 'large' } = {}) {
  const event = { ...baseEvent, ...overrides };
  return render(<EventCard event={event} {...props} />);
}

// ---- Tests ----

describe('EventCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the event title in large mode', () => {
    const { getByText } = renderCard();
    expect(getByText('Neon Pulse Night')).toBeTruthy();
  });

  it('renders the event description in large mode', () => {
    const { getByText } = renderCard();
    expect(getByText('An electrifying night of house music and neon lights.')).toBeTruthy();
  });

  it('renders venue name in large mode', () => {
    const { getByText } = renderCard();
    expect(getByText('Club Nox')).toBeTruthy();
  });

  it('renders formatted time range', () => {
    const { getByText } = renderCard();
    expect(getByText('9:00 PM - 2:00 AM')).toBeTruthy();
  });

  it('renders the lowest ticket price', () => {
    const { getByText } = renderCard();
    expect(getByText('From $25')).toBeTruthy();
  });

  it('renders tickets remaining count', () => {
    // 100-50 + 20-5 = 65 remaining
    const { getByText } = renderCard();
    expect(getByText('65 left')).toBeTruthy();
  });

  it('renders genre tags (max 3) and overflow count', () => {
    const { getByText } = renderCard();
    expect(getByText('House')).toBeTruthy();
    expect(getByText('Techno')).toBeTruthy();
    expect(getByText('EDM')).toBeTruthy();
    expect(getByText('+1')).toBeTruthy();
  });

  it('calls onPress with haptic feedback when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = renderCard({}, { onPress });

    fireEvent.press(getByText('Neon Pulse Night'));

    expect(Haptics.impactAsync).toHaveBeenCalledWith('Light');
    expect(onPress).toHaveBeenCalled();
  });

  it('does not trigger haptics when onPress is not provided', () => {
    const { getByText } = renderCard();

    fireEvent.press(getByText('Neon Pulse Night'));

    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('shows Free Entry when there are no ticket tiers', () => {
    const { getByText } = renderCard({ ticketTiers: [] });
    expect(getByText('Free Entry')).toBeTruthy();
  });

  it('renders in small card mode', () => {
    const { getByText } = renderCard({}, { size: 'small' });
    expect(getByText('Neon Pulse Night')).toBeTruthy();
    // Small mode shows price differently
    expect(getByText('From $25')).toBeTruthy();
  });

  it('shows Selling Fast badge when less than 20% tickets remain', () => {
    const sellingFastEvent: Partial<Event> = {
      ticketTiers: [
        {
          id: 'tier-1',
          eventId: 'event-1',
          name: 'GA',
          price: 30,
          quantity: 100,
          sold: 95, // only 5% remaining
          tier: 'GENERAL',
          salesWindow: { start: '2026-03-01', end: '2026-04-15' },
          isAppExclusive: false,
        },
      ],
    };
    const { getAllByText } = renderCard(sellingFastEvent);
    // The selling fast badge appears in large mode
    const badges = getAllByText(/Selling Fast/);
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('does not show Selling Fast badge when plenty of tickets remain', () => {
    const { queryByText } = renderCard();
    // 65/120 = ~54% remaining, so no badge
    expect(queryByText(/Selling Fast/)).toBeNull();
  });

  it('renders date badge with month and day', () => {
    const { getByText, queryByText } = renderCard();
    expect(getByText('Apr')).toBeTruthy();
    // Day may be 14 or 15 depending on timezone
    expect(queryByText('14') || queryByText('15')).toBeTruthy();
  });

  it('falls back to "Venue" when venueName is not provided', () => {
    const { getByText } = renderCard({ venueName: undefined });
    expect(getByText('Venue')).toBeTruthy();
  });
});
