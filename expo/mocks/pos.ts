import { POSLocation, POSIntegration, SpendRule, POSProviderType } from '@/types';

/**
 * Mock POS locations for both Toast and Square providers
 * Used in development mode for testing POS integration
 */
export const mockPOSLocations: POSLocation[] = [
  // Toast Locations
  {
    id: 'toast-loc-1',
    name: 'The Nox Room - Main Bar',
    address: '1234 Broadway St, Los Angeles, CA',
    provider: 'TOAST',
    metadata: {
      restaurantGuid: 'toast-guid-1',
      merchantName: 'The Nox Room',
      currency: 'USD',
      timezone: 'America/Los_Angeles',
    },
  },
  {
    id: 'toast-loc-2',
    name: 'The Nox Room - Rooftop',
    address: '1234 Broadway St, Los Angeles, CA',
    provider: 'TOAST',
    metadata: {
      restaurantGuid: 'toast-guid-2',
      merchantName: 'The Nox Room',
      currency: 'USD',
      timezone: 'America/Los_Angeles',
    },
  },
  {
    id: 'toast-loc-3',
    name: 'Velvet Underground - Main Floor',
    address: '567 Sunset Blvd, Los Angeles, CA',
    provider: 'TOAST',
    metadata: {
      restaurantGuid: 'toast-guid-3',
      merchantName: 'Velvet Underground',
      currency: 'USD',
      timezone: 'America/Los_Angeles',
    },
  },
  // Square Locations
  {
    id: 'square-loc-1',
    name: 'Echo Nightclub - Main Bar',
    address: '789 Hollywood Blvd, Los Angeles, CA',
    provider: 'SQUARE',
    metadata: {
      merchantName: 'Echo Nightclub',
      currency: 'USD',
      timezone: 'America/Los_Angeles',
    },
  },
  {
    id: 'square-loc-2',
    name: 'Echo Nightclub - VIP Lounge',
    address: '789 Hollywood Blvd, Los Angeles, CA',
    provider: 'SQUARE',
    metadata: {
      merchantName: 'Echo Nightclub',
      currency: 'USD',
      timezone: 'America/Los_Angeles',
    },
  },
];

/**
 * Mock POS integration for development
 * Shows disconnected state by default
 */
export const mockPOSIntegration: POSIntegration = {
  id: 'pos-int-1',
  venueId: 'venue-1',
  provider: 'TOAST',
  status: 'DISCONNECTED',
  metadata: {},
  syncConfig: {
    enabled: false,
    interval: 300000, // 5 minutes
  },
};

/**
 * Mock connected POS integration (Toast)
 */
export const mockConnectedToastIntegration: POSIntegration = {
  id: 'pos-int-toast-1',
  venueId: 'venue-1',
  provider: 'TOAST',
  status: 'CONNECTED',
  metadata: {
    locationName: 'The Nox Room - Main Bar',
    merchantName: 'The Nox Room',
    currency: 'USD',
    timezone: 'America/Los_Angeles',
  },
  syncConfig: {
    enabled: true,
    interval: 300000,
    lastSyncAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    lastSyncStatus: 'SUCCESS',
  },
  connectedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
  stats: {
    transactionCount: 247,
    totalRevenue: 28450, // in cents ($284.50)
    averageTransaction: 115, // in cents ($1.15)
  },
};

/**
 * Mock connected POS integration (Square)
 */
export const mockConnectedSquareIntegration: POSIntegration = {
  id: 'pos-int-square-1',
  venueId: 'venue-2',
  provider: 'SQUARE',
  status: 'CONNECTED',
  metadata: {
    locationName: 'Echo Nightclub - Main Bar',
    merchantName: 'Echo Nightclub',
    currency: 'USD',
    timezone: 'America/Los_Angeles',
    webhookUrl: 'https://api.nox.social/pos/webhooks/square',
  },
  syncConfig: {
    enabled: true,
    interval: 300000,
    lastSyncAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    lastSyncStatus: 'SUCCESS',
  },
  webhooks: {
    enabled: true,
    events: ['payment.created', 'payment.updated', 'order.created'],
  },
  connectedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
  stats: {
    transactionCount: 512,
    totalRevenue: 67800, // in cents ($678.00)
    averageTransaction: 132, // in cents ($1.32)
  },
};

/**
 * Mock spend rules for tier unlocking
 * Demonstrates different rule types and configurations
 */
export const mockSpendRules: SpendRule[] = [
  {
    id: 'rule-1',
    venueId: 'venue-1',
    threshold: 50, // $50
    tierUnlocked: 'REGULAR',
    serverAccessLevel: 'PUBLIC_LOBBY',
    isLiveOnly: false,
    description: 'Unlock REGULAR tier with $50 lifetime spend',
    priority: 1,
    isActive: true,
    stats: {
      timesTriggered: 127,
      lastTriggeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      usersUnlocked: 127,
    },
  },
  {
    id: 'rule-2',
    venueId: 'venue-1',
    threshold: 200, // $200
    tierUnlocked: 'PLATINUM',
    serverAccessLevel: 'INNER_CIRCLE',
    isLiveOnly: true,
    liveTimeWindow: {
      startTime: '22:00',
      endTime: '02:00',
    },
    description: 'Unlock PLATINUM tier during live hours (10pm-2am) with $200 spend',
    priority: 2,
    isActive: true,
    stats: {
      timesTriggered: 43,
      lastTriggeredAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      usersUnlocked: 43,
    },
  },
  {
    id: 'rule-3',
    venueId: 'venue-1',
    threshold: 500, // $500
    tierUnlocked: 'WHALE',
    serverAccessLevel: 'INNER_CIRCLE',
    isLiveOnly: false,
    description: 'Unlock WHALE tier with $500 lifetime spend',
    priority: 3,
    isActive: true,
    stats: {
      timesTriggered: 12,
      lastTriggeredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      usersUnlocked: 12,
    },
  },
  {
    id: 'rule-4',
    venueId: 'venue-2',
    threshold: 100, // $100
    tierUnlocked: 'REGULAR',
    serverAccessLevel: 'PUBLIC_LOBBY',
    isLiveOnly: false,
    description: 'Echo Nightclub - Unlock REGULAR tier with $100 lifetime spend',
    priority: 1,
    isActive: true,
    stats: {
      timesTriggered: 89,
      lastTriggeredAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      usersUnlocked: 89,
    },
  },
  {
    id: 'rule-5',
    venueId: 'venue-1',
    threshold: 150, // $150
    tierUnlocked: 'PLATINUM',
    serverAccessLevel: 'INNER_CIRCLE',
    isLiveOnly: true,
    liveTimeWindow: {
      startTime: '20:00',
      endTime: '23:00',
    },
    description: 'Happy hour special - PLATINUM tier for $150 (8pm-11pm)',
    priority: 4,
    isActive: false, // Disabled for testing
    stats: {
      timesTriggered: 5,
      lastTriggeredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      usersUnlocked: 5,
    },
  },
];

/**
 * Helper to get mock locations by provider
 */
export function getMockLocationsByProvider(provider: POSProviderType): POSLocation[] {
  return mockPOSLocations.filter(loc => loc.provider === provider);
}

/**
 * Helper to get mock spend rules by venue
 */
export function getMockSpendRulesByVenue(venueId: string): SpendRule[] {
  return mockSpendRules.filter(rule => rule.venueId === venueId);
}

/**
 * Helper to get active mock spend rules
 */
export function getActiveMockSpendRules(): SpendRule[] {
  return mockSpendRules.filter(rule => rule.isActive);
}
