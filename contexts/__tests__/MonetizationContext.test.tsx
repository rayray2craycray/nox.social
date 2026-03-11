import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alert } from 'react-native';

// Mock dependencies
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('@/services/api', () => ({
  pricingApi: {
    getAllActivePricing: jest.fn(),
    getUserPriceAlerts: jest.fn(),
    createPriceAlert: jest.fn(),
    deletePriceAlert: jest.fn(),
  },
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    userId: 'test-user-id',
    accessToken: 'test-token',
    isAuthenticated: true,
  })),
}));

import { pricingApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';

const mockPricingApi = pricingApi as jest.Mocked<typeof pricingApi>;
const mockUseAuth = useAuth as jest.Mock;

// Import after mocks
import { MonetizationProvider, useMonetization } from '../MonetizationContext';

// Suppress console noise
let logSpy: jest.SpyInstance;
let errorSpy: jest.SpyInstance;
let alertSpy: jest.SpyInstance;
beforeAll(() => {
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});
afterAll(() => {
  logSpy.mockRestore();
  errorSpy.mockRestore();
  alertSpy.mockRestore();
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MonetizationProvider>{children}</MonetizationProvider>
    </QueryClientProvider>
  );
}

describe('MonetizationContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      userId: 'test-user-id',
      accessToken: 'test-token',
      isAuthenticated: true,
    });
    // Default: APIs return empty data
    mockPricingApi.getAllActivePricing.mockResolvedValue({ success: true, data: [] });
    mockPricingApi.getUserPriceAlerts.mockResolvedValue({ success: true, data: [] });
  });

  it('should provide default values for activePricing and userPriceAlerts', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useMonetization(), { wrapper });

    expect(result.current.activePricing).toBeDefined();
    expect(Array.isArray(result.current.activePricing)).toBe(true);
    expect(result.current.userPriceAlerts).toBeDefined();
    expect(Array.isArray(result.current.userPriceAlerts)).toBe(true);
  });

  it('should expose all expected methods and properties', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useMonetization(), { wrapper });

    expect(typeof result.current.getDynamicPricing).toBe('function');
    expect(typeof result.current.setPriceAlert).toBe('function');
    expect(typeof result.current.removePriceAlert).toBe('function');
    expect(typeof result.current.applyDiscount).toBe('function');
    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('should load active pricing from API', async () => {
    const mockPricing = [
      {
        id: 'dp-1',
        venueId: 'v1',
        basePrice: 20,
        currentPrice: 15,
        discountPercentage: 25,
        validUntil: '2027-01-01T00:00:00Z',
        reason: 'HAPPY_HOUR',
        description: 'Happy hour pricing',
      },
    ];
    mockPricingApi.getAllActivePricing.mockResolvedValue({
      success: true,
      data: mockPricing,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useMonetization(), { wrapper });

    await waitFor(() => {
      expect(result.current.activePricing).toHaveLength(1);
    });

    expect(result.current.activePricing[0].venueId).toBe('v1');
  });

  it('should load user price alerts from API', async () => {
    const mockAlerts = [
      {
        id: 'alert-1',
        userId: 'test-user-id',
        venueId: 'v1',
        targetDiscount: 20,
        isActive: true,
        createdAt: '2025-01-01',
      },
    ];
    mockPricingApi.getUserPriceAlerts.mockResolvedValue({
      success: true,
      data: mockAlerts,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useMonetization(), { wrapper });

    await waitFor(() => {
      expect(result.current.userPriceAlerts).toHaveLength(1);
    });
  });

  it('should return undefined for getDynamicPricing when no pricing exists', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useMonetization(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const pricing = result.current.getDynamicPricing('nonexistent-venue');
    expect(pricing).toBeUndefined();
  });

  it('should return pricing for getDynamicPricing when valid pricing exists', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString(); // tomorrow
    mockPricingApi.getAllActivePricing.mockResolvedValue({
      success: true,
      data: [
        {
          id: 'dp-1',
          venueId: 'v1',
          basePrice: 20,
          currentPrice: 14,
          discountPercentage: 30,
          validUntil: futureDate,
          reason: 'SLOW_HOUR',
          description: 'Slow hour discount',
        },
      ],
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useMonetization(), { wrapper });

    await waitFor(() => {
      expect(result.current.activePricing).toHaveLength(1);
    });

    const pricing = result.current.getDynamicPricing('v1');
    expect(pricing).toBeDefined();
    expect(pricing!.discountPercentage).toBe(30);
  });

  it('should not return expired pricing from getDynamicPricing', async () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString(); // yesterday
    mockPricingApi.getAllActivePricing.mockResolvedValue({
      success: true,
      data: [
        {
          id: 'dp-expired',
          venueId: 'v1',
          basePrice: 20,
          currentPrice: 10,
          discountPercentage: 50,
          validUntil: pastDate,
          reason: 'FLASH_SALE',
          description: 'Flash sale expired',
        },
      ],
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useMonetization(), { wrapper });

    await waitFor(() => {
      expect(result.current.activePricing).toHaveLength(1);
    });

    const pricing = result.current.getDynamicPricing('v1');
    expect(pricing).toBeUndefined();
  });

  it('should call createPriceAlert via setPriceAlert', async () => {
    mockPricingApi.createPriceAlert.mockResolvedValue({
      success: true,
      data: { id: 'alert-new', userId: 'test-user-id', venueId: 'v1', targetDiscount: 20, isActive: true, createdAt: '' },
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useMonetization(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setPriceAlert('v1', 20);
    });

    await waitFor(() => {
      expect(mockPricingApi.createPriceAlert).toHaveBeenCalledWith({
        userId: 'test-user-id',
        venueId: 'v1',
        targetDiscount: 20,
      });
    });
  });

  it('should show success alert and trigger haptics on setPriceAlert success', async () => {
    mockPricingApi.createPriceAlert.mockResolvedValue({
      success: true,
      data: { id: 'alert-new', userId: 'test-user-id', venueId: 'v1', targetDiscount: 20, isActive: true, createdAt: '' },
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useMonetization(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setPriceAlert('v1', 20);
    });

    await waitFor(() => {
      expect(Haptics.notificationAsync).toHaveBeenCalled();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Price Alert Set!',
      expect.stringContaining('notify')
    );
  });

  it('should show error alert on setPriceAlert failure', async () => {
    mockPricingApi.createPriceAlert.mockRejectedValue(new Error('Server error'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useMonetization(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setPriceAlert('v1', 20);
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', expect.any(String));
    });
  });

  it('should call deletePriceAlert via removePriceAlert', async () => {
    mockPricingApi.deletePriceAlert.mockResolvedValue({ success: true, data: {} as any });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useMonetization(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.removePriceAlert('alert-1');
    });

    await waitFor(() => {
      expect(mockPricingApi.deletePriceAlert).toHaveBeenCalledWith('alert-1');
    });
  });

  it('should trigger haptics on removePriceAlert success', async () => {
    mockPricingApi.deletePriceAlert.mockResolvedValue({ success: true, data: {} as any });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useMonetization(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.removePriceAlert('alert-1');
    });

    await waitFor(() => {
      expect(Haptics.impactAsync).toHaveBeenCalled();
    });
  });

  it('should return pricing from applyDiscount when valid pricing exists', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    mockPricingApi.getAllActivePricing.mockResolvedValue({
      success: true,
      data: [
        {
          id: 'dp-1',
          venueId: 'v1',
          basePrice: 20,
          currentPrice: 16,
          discountPercentage: 20,
          validUntil: futureDate,
          reason: 'EARLY_BIRD',
          description: 'Early bird discount',
        },
      ],
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useMonetization(), { wrapper });

    await waitFor(() => {
      expect(result.current.activePricing).toHaveLength(1);
    });

    const applied = result.current.applyDiscount('v1');
    expect(applied).not.toBeNull();
    expect(applied!.discountPercentage).toBe(20);
  });

  it('should return null from applyDiscount when no pricing exists', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useMonetization(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const applied = result.current.applyDiscount('nonexistent');
    expect(applied).toBeNull();
  });

  it('should handle empty API responses gracefully', async () => {
    mockPricingApi.getAllActivePricing.mockResolvedValue({ success: true, data: undefined as any });
    mockPricingApi.getUserPriceAlerts.mockResolvedValue({ success: true, data: undefined as any });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useMonetization(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.activePricing).toEqual([]);
    expect(result.current.userPriceAlerts).toEqual([]);
  });

  it('should handle API errors gracefully and return empty arrays', async () => {
    mockPricingApi.getAllActivePricing.mockRejectedValue(new Error('Network error'));
    mockPricingApi.getUserPriceAlerts.mockRejectedValue(new Error('Network error'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useMonetization(), { wrapper });

    // Should not crash and should eventually settle
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.activePricing).toEqual([]);
    expect(result.current.userPriceAlerts).toEqual([]);
  });

  it('should return empty alerts when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      userId: null,
      accessToken: null,
      isAuthenticated: false,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useMonetization(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.userPriceAlerts).toEqual([]);
    // Should not have called getUserPriceAlerts (userId is null)
  });
});
