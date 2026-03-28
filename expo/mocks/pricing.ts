import { DynamicPricing, PriceAlert } from '@/types';

// Mock Dynamic Pricing
export const mockDynamicPricing: DynamicPricing[] = [
  {
    id: 'pricing-1',
    venueId: 'venue-1',
    basePrice: 25,
    currentPrice: 15,
    discountPercentage: 40,
    validUntil: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
    reason: 'HAPPY_HOUR',
    description: 'Happy Hour Special - 40% off before 9pm',
  },
  {
    id: 'pricing-2',
    venueId: 'venue-2',
    basePrice: 30,
    currentPrice: 20,
    discountPercentage: 33,
    validUntil: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours
    reason: 'APP_EXCLUSIVE',
    description: 'App Exclusive - 33% off for VibeLink users',
  },
  {
    id: 'pricing-3',
    venueId: 'venue-3',
    basePrice: 20,
    currentPrice: 10,
    discountPercentage: 50,
    validUntil: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour
    reason: 'FLASH_SALE',
    description: 'Flash Sale - 50% off for the next hour!',
  },
  {
    id: 'pricing-4',
    venueId: 'venue-4',
    basePrice: 35,
    currentPrice: 25,
    discountPercentage: 29,
    validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    reason: 'EARLY_BIRD',
    description: 'Early Bird - Get tickets now for 29% off',
  },
];

// Mock Price Alerts
export const mockPriceAlerts: PriceAlert[] = [
  {
    id: 'alert-1',
    userId: 'user-me',
    venueId: 'venue-1',
    targetDiscount: 30,
    isActive: true,
    createdAt: '2026-01-03T10:00:00Z',
  },
  {
    id: 'alert-2',
    userId: 'user-me',
    venueId: 'venue-4',
    targetDiscount: 25,
    isActive: true,
    createdAt: '2026-01-04T15:00:00Z',
    notifiedAt: '2026-01-05T20:00:00Z',
  },
];

// Helper Functions
export function getActivePricingForVenue(venueId: string): DynamicPricing | undefined {
  const now = new Date();
  return mockDynamicPricing.find(pricing => {
    const validUntil = new Date(pricing.validUntil);
    return pricing.venueId === venueId && validUntil > now;
  });
}

export function getAllActivePricing(): DynamicPricing[] {
  const now = new Date();
  return mockDynamicPricing.filter(pricing => {
    const validUntil = new Date(pricing.validUntil);
    return validUntil > now;
  });
}

export function getUserPriceAlerts(userId: string): PriceAlert[] {
  return mockPriceAlerts.filter(alert => alert.userId === userId && alert.isActive);
}
