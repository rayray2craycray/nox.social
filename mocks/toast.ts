import { ToastLocation, ToastIntegration, ToastSpendRule } from '@/types';

export const mockToastLocations: ToastLocation[] = [
  {
    id: 'loc-1',
    name: 'The Nox Room - Main Bar',
    address: '1234 Broadway St, Los Angeles, CA',
    provider: 'TOAST',
    restaurantGuid: 'toast-guid-1',
  },
  {
    id: 'loc-2',
    name: 'The Nox Room - Rooftop',
    address: '1234 Broadway St, Los Angeles, CA',
    provider: 'TOAST',
    restaurantGuid: 'toast-guid-2',
  },
  {
    id: 'loc-3',
    name: 'Velvet Underground - Main Floor',
    address: '567 Sunset Blvd, Los Angeles, CA',
    provider: 'TOAST',
    restaurantGuid: 'toast-guid-3',
  },
];

export const mockToastIntegration: ToastIntegration = {
  id: 'toast-int-1',
  venueId: 'venue-1',
  status: 'DISCONNECTED',
  metadata: {},
  syncConfig: {
    enabled: false,
    interval: 300,
  },
  selectedLocations: [],
  webhooksEnabled: false,
};

export const mockToastSpendRules: ToastSpendRule[] = [
  {
    id: 'toast-rule-1',
    venueId: 'venue-1',
    threshold: 50,
    tierUnlocked: 'REGULAR',
    serverAccessLevel: 'PUBLIC_LOBBY',
    isLiveOnly: false,
    isActive: true,
  },
  {
    id: 'toast-rule-2',
    venueId: 'venue-1',
    threshold: 200,
    tierUnlocked: 'PLATINUM',
    serverAccessLevel: 'INNER_CIRCLE',
    isLiveOnly: true,
    liveTimeWindow: {
      startTime: '22:00',
      endTime: '02:00',
    },
    isActive: true,
  },
  {
    id: 'toast-rule-3',
    venueId: 'venue-1',
    threshold: 500,
    tierUnlocked: 'WHALE',
    serverAccessLevel: 'INNER_CIRCLE',
    isLiveOnly: false,
    isActive: true,
  },
];
