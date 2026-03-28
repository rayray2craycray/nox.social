import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alert } from 'react-native';

// Mock dependencies
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
}));

jest.mock('@/services/api', () => ({
  businessApi: {
    getProfile: jest.fn().mockResolvedValue({ data: null }),
    register: jest.fn(),
    resendVerificationEmail: jest.fn(),
  },
  venueManagementApi: {
    getUserRoles: jest.fn().mockResolvedValue({ data: { roles: [] } }),
    updateVenueInfo: jest.fn(),
    updateVenueDisplay: jest.fn(),
  },
}));

jest.mock('../AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    userId: 'test-user-id',
    accessToken: 'test-token',
  }),
}));

import { businessApi, venueManagementApi } from '@/services/api';
const mockBusinessApi = businessApi as jest.Mocked<typeof businessApi>;
const mockVenueManagementApi = venueManagementApi as jest.Mocked<typeof venueManagementApi>;

import { VenueManagementProvider, useVenueManagement } from '../VenueManagementContext';

// Suppress console noise
let logSpy: jest.SpyInstance;
let errorSpy: jest.SpyInstance;
beforeAll(() => {
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  logSpy.mockRestore();
  errorSpy.mockRestore();
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
      <VenueManagementProvider>{children}</VenueManagementProvider>
    </QueryClientProvider>
  );
}

const mockHeadModeratorRole = {
  id: 'role-1',
  venueId: 'venue-1',
  userId: 'test-user-id',
  role: 'HEAD_MODERATOR' as const,
  permissions: ['FULL_ACCESS' as const],
  assignedBy: 'admin',
  assignedAt: '2026-01-01T00:00:00Z',
  isActive: true,
};

const mockStaffRole = {
  id: 'role-2',
  venueId: 'venue-2',
  userId: 'test-user-id',
  role: 'STAFF' as const,
  permissions: ['EDIT_VENUE_DISPLAY' as const, 'VIEW_ANALYTICS' as const],
  assignedBy: 'admin',
  assignedAt: '2026-01-01T00:00:00Z',
  isActive: true,
};

const mockInactiveRole = {
  id: 'role-3',
  venueId: 'venue-3',
  userId: 'test-user-id',
  role: 'MODERATOR' as const,
  permissions: ['EDIT_VENUE_INFO' as const],
  assignedBy: 'admin',
  assignedAt: '2026-01-01T00:00:00Z',
  isActive: false,
};

const mockBusinessProfile = {
  id: 'bp-1',
  userId: 'test-user-id',
  venueName: 'Test Club',
  businessEmail: 'test@club.com',
  location: {
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'US',
  },
  businessType: 'CLUB' as const,
  status: 'VERIFIED' as const,
  emailVerified: true,
  documentsSubmitted: true,
  documentsApproved: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('VenueManagementContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw when used outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    expect(() => {
      renderHook(() => useVenueManagement());
    }).toThrow('useVenueManagement must be used within VenueManagementProvider');
    spy.mockRestore();
  });

  it('should provide all expected methods and state', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useVenueManagement(), { wrapper });

    expect(result.current.businessProfile).toBeDefined();
    expect(typeof result.current.isLoadingProfile).toBe('boolean');
    expect(typeof result.current.hasBusinessProfile).toBe('boolean');
    expect(Array.isArray(result.current.venueRoles)).toBe(true);
    expect(Array.isArray(result.current.managedVenues)).toBe(true);
    expect(typeof result.current.canEditVenue).toBe('function');
    expect(typeof result.current.canEditDisplay).toBe('function');
    expect(typeof result.current.canManageEvents).toBe('function');
    expect(typeof result.current.canManageStaff).toBe('function');
    expect(typeof result.current.hasPermission).toBe('function');
    expect(typeof result.current.getVenueRole).toBe('function');
    expect(typeof result.current.registerBusiness).toBe('function');
    expect(typeof result.current.resendVerificationEmail).toBe('function');
    expect(typeof result.current.updateVenueInfo).toBe('function');
    expect(typeof result.current.updateVenueDisplay).toBe('function');
  });

  it('should return null businessProfile and empty roles by default', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useVenueManagement(), { wrapper });

    await waitFor(() => {
      expect(result.current.businessProfile).toBeNull();
      expect(result.current.hasBusinessProfile).toBe(false);
      expect(result.current.venueRoles).toEqual([]);
      expect(result.current.managedVenues).toEqual([]);
    });
  });

  it('should fetch and expose business profile', async () => {
    mockBusinessApi.getProfile.mockResolvedValueOnce({
      data: { businessProfile: mockBusinessProfile, venues: [] },
    } as any);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useVenueManagement(), { wrapper });

    await waitFor(() => {
      expect(result.current.businessProfile).toEqual(mockBusinessProfile);
      expect(result.current.hasBusinessProfile).toBe(true);
    });
  });

  it('should compute managedVenues from active roles only', async () => {
    mockVenueManagementApi.getUserRoles.mockResolvedValueOnce({
      data: { roles: [mockHeadModeratorRole, mockStaffRole, mockInactiveRole] },
    } as any);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useVenueManagement(), { wrapper });

    await waitFor(() => {
      expect(result.current.managedVenues).toContain('venue-1');
      expect(result.current.managedVenues).toContain('venue-2');
      expect(result.current.managedVenues).not.toContain('venue-3');
      expect(result.current.managedVenues).toHaveLength(2);
    });
  });

  it('should grant HEAD_MODERATOR all permissions', async () => {
    mockVenueManagementApi.getUserRoles.mockResolvedValueOnce({
      data: { roles: [mockHeadModeratorRole] },
    } as any);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useVenueManagement(), { wrapper });

    await waitFor(() => {
      expect(result.current.venueRoles).toHaveLength(1);
    });

    expect(result.current.canEditVenue('venue-1')).toBe(true);
    expect(result.current.canEditDisplay('venue-1')).toBe(true);
    expect(result.current.canManageEvents('venue-1')).toBe(true);
    expect(result.current.canManageStaff('venue-1')).toBe(true);
    expect(result.current.hasPermission('venue-1', 'VIEW_ANALYTICS')).toBe(true);
  });

  it('should restrict STAFF to assigned permissions only', async () => {
    mockVenueManagementApi.getUserRoles.mockResolvedValueOnce({
      data: { roles: [mockStaffRole] },
    } as any);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useVenueManagement(), { wrapper });

    await waitFor(() => {
      expect(result.current.venueRoles).toHaveLength(1);
    });

    // Staff has EDIT_VENUE_DISPLAY and VIEW_ANALYTICS
    expect(result.current.canEditDisplay('venue-2')).toBe(true);
    expect(result.current.hasPermission('venue-2', 'VIEW_ANALYTICS')).toBe(true);

    // Staff does NOT have these
    expect(result.current.canEditVenue('venue-2')).toBe(false);
    expect(result.current.canManageEvents('venue-2')).toBe(false);
    expect(result.current.canManageStaff('venue-2')).toBe(false);
  });

  it('should return false for permissions on unknown venue', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useVenueManagement(), { wrapper });

    await waitFor(() => {
      expect(result.current.venueRoles).toEqual([]);
    });

    expect(result.current.canEditVenue('unknown-venue')).toBe(false);
    expect(result.current.canEditDisplay('unknown-venue')).toBe(false);
    expect(result.current.getVenueRole('unknown-venue')).toBeNull();
  });

  it('should return null for inactive role via getVenueRole', async () => {
    mockVenueManagementApi.getUserRoles.mockResolvedValueOnce({
      data: { roles: [mockInactiveRole] },
    } as any);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useVenueManagement(), { wrapper });

    await waitFor(() => {
      expect(result.current.venueRoles).toHaveLength(1);
    });

    expect(result.current.getVenueRole('venue-3')).toBeNull();
  });

  it('should register a business via mutation', async () => {
    mockBusinessApi.register.mockResolvedValueOnce({
      data: { businessProfile: mockBusinessProfile, message: 'Success' },
    } as any);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useVenueManagement(), { wrapper });

    const registrationData = {
      venueName: 'Test Club',
      businessEmail: 'test@club.com',
      location: {
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'US',
      },
      businessType: 'CLUB' as const,
    };

    await act(async () => {
      await result.current.registerBusiness(registrationData);
    });

    expect(mockBusinessApi.register).toHaveBeenCalledWith(registrationData);
  });

  it('should call updateVenueInfo and show success alert', async () => {
    mockVenueManagementApi.getUserRoles.mockResolvedValueOnce({
      data: { roles: [mockHeadModeratorRole] },
    } as any);
    mockVenueManagementApi.updateVenueInfo.mockResolvedValueOnce({
      data: { venue: { id: 'venue-1', name: 'Updated Club' } },
    } as any);

    const alertSpy = jest.spyOn(Alert, 'alert');
    const wrapper = createWrapper();
    const { result } = renderHook(() => useVenueManagement(), { wrapper });

    await waitFor(() => {
      expect(result.current.venueRoles).toHaveLength(1);
    });

    await act(async () => {
      await result.current.updateVenueInfo('venue-1', { name: 'Updated Club' } as any);
    });

    expect(mockVenueManagementApi.updateVenueInfo).toHaveBeenCalledWith('venue-1', { name: 'Updated Club' });
    expect(alertSpy).toHaveBeenCalledWith('Success', 'Venue information updated successfully');

    alertSpy.mockRestore();
  });

  it('should reject updateVenueInfo without permission', async () => {
    mockVenueManagementApi.getUserRoles.mockResolvedValueOnce({
      data: { roles: [mockStaffRole] },
    } as any);

    const alertSpy = jest.spyOn(Alert, 'alert');
    const wrapper = createWrapper();
    const { result } = renderHook(() => useVenueManagement(), { wrapper });

    await waitFor(() => {
      expect(result.current.venueRoles).toHaveLength(1);
    });

    await expect(
      act(async () => {
        await result.current.updateVenueInfo('venue-2', { name: 'Hacked' } as any);
      })
    ).rejects.toThrow('You do not have permission to edit this venue');

    alertSpy.mockRestore();
  });

  it('should call updateVenueDisplay with permission', async () => {
    mockVenueManagementApi.getUserRoles.mockResolvedValueOnce({
      data: { roles: [mockStaffRole] },
    } as any);
    mockVenueManagementApi.updateVenueDisplay.mockResolvedValueOnce({
      data: { venue: { id: 'venue-2' } },
    } as any);

    const alertSpy = jest.spyOn(Alert, 'alert');
    const wrapper = createWrapper();
    const { result } = renderHook(() => useVenueManagement(), { wrapper });

    await waitFor(() => {
      expect(result.current.venueRoles).toHaveLength(1);
    });

    const displayUpdates = { description: 'New description', tags: ['music', 'dance'] };

    await act(async () => {
      await result.current.updateVenueDisplay('venue-2', displayUpdates);
    });

    expect(mockVenueManagementApi.updateVenueDisplay).toHaveBeenCalledWith('venue-2', displayUpdates);
    expect(alertSpy).toHaveBeenCalledWith('Success', 'Venue display updated successfully');

    alertSpy.mockRestore();
  });
});
