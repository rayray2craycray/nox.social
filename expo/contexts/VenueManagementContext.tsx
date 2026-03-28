/**
 * Venue Management Context
 * Handles business profiles, venue permissions, and venue editing
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';
import { businessApi, venueManagementApi } from '@/services/api';
import type {
  BusinessProfile,
  VenueRole,
  VenuePermission,
  BusinessRegistrationData,
  Venue,
} from '@/types';

interface VenueManagementContextType {
  // Business Profile
  businessProfile: BusinessProfile | null;
  isLoadingProfile: boolean;
  hasBusinessProfile: boolean;

  // Venue Roles & Permissions
  venueRoles: VenueRole[];
  managedVenues: string[]; // Venue IDs user can manage

  // Permission Checks
  canEditVenue: (venueId: string) => boolean;
  canEditDisplay: (venueId: string) => boolean;
  canManageEvents: (venueId: string) => boolean;
  canManageStaff: (venueId: string) => boolean;
  hasPermission: (venueId: string, permission: VenuePermission) => boolean;
  getVenueRole: (venueId: string) => VenueRole | null;

  // Actions
  registerBusiness: (data: BusinessRegistrationData) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  updateVenueInfo: (venueId: string, updates: Partial<Venue>) => Promise<void>;
  updateVenueDisplay: (
    venueId: string,
    displayUpdates: {
      imageUrl?: string;
      description?: string;
      tags?: string[];
    }
  ) => Promise<void>;
}

const VenueManagementContext = createContext<VenueManagementContextType | undefined>(
  undefined
);

export function useVenueManagement() {
  const context = useContext(VenueManagementContext);
  if (!context) {
    throw new Error('useVenueManagement must be used within VenueManagementProvider');
  }
  return context;
}

interface VenueManagementProviderProps {
  children: ReactNode;
}

export function VenueManagementProvider({ children }: VenueManagementProviderProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's business profile
  const {
    data: businessProfile = null,
    isLoading: isLoadingProfile,
  } = useQuery({
    queryKey: ['businessProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      try {
        const response = await businessApi.getProfile();
        return response.data?.businessProfile || null;
      } catch (error) {
        console.error('Failed to fetch business profile:', error);
        return null;
      }
    },
    enabled: !!user?.id,
  });

  // Fetch user's venue roles
  const { data: venueRoles = [] } = useQuery({
    queryKey: ['venueRoles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      try {
        const response = await venueManagementApi.getUserRoles();
        return response.data?.roles || [];
      } catch (error) {
        console.error('Failed to fetch venue roles:', error);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  // Derived state
  const hasBusinessProfile = !!businessProfile;
  const managedVenues = venueRoles
    .filter((role) => role.isActive)
    .map((role) => role.venueId);

  // Permission checking functions
  const getVenueRole = (venueId: string): VenueRole | null => {
    return venueRoles.find((role) => role.venueId === venueId && role.isActive) || null;
  };

  const hasPermission = (venueId: string, permission: VenuePermission): boolean => {
    const role = getVenueRole(venueId);
    if (!role) return false;

    // HEAD_MODERATOR has all permissions
    if (role.role === 'HEAD_MODERATOR' || role.permissions.includes('FULL_ACCESS')) {
      return true;
    }

    return role.permissions.includes(permission);
  };

  const canEditVenue = (venueId: string): boolean => {
    return hasPermission(venueId, 'EDIT_VENUE_INFO');
  };

  const canEditDisplay = (venueId: string): boolean => {
    return hasPermission(venueId, 'EDIT_VENUE_DISPLAY');
  };

  const canManageEvents = (venueId: string): boolean => {
    return hasPermission(venueId, 'MANAGE_EVENTS');
  };

  const canManageStaff = (venueId: string): boolean => {
    return hasPermission(venueId, 'MANAGE_STAFF');
  };

  // Register business mutation
  const registerBusinessMutation = useMutation({
    mutationFn: async (data: BusinessRegistrationData) => {
      const response = await businessApi.register(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessProfile'] });
    },
    onError: (error) => {
      console.error('Business registration error:', error);
      throw error;
    },
  });

  // Resend verification email mutation
  const resendVerificationMutation = useMutation({
    mutationFn: async () => {
      if (!businessProfile?.id) {
        throw new Error('No business profile found');
      }

      const response = await businessApi.resendVerificationEmail();
      return response.data;
    },
    onError: (error) => {
      console.error('Resend verification error:', error);
      throw error;
    },
  });

  // Update venue info mutation
  const updateVenueInfoMutation = useMutation({
    mutationFn: async ({
      venueId,
      updates,
    }: {
      venueId: string;
      updates: Partial<Venue>;
    }) => {
      if (!canEditVenue(venueId)) {
        throw new Error('You do not have permission to edit this venue');
      }

      const response = await venueManagementApi.updateVenueInfo(venueId, updates);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['venue', variables.venueId] });
      Alert.alert('Success', 'Venue information updated successfully');
    },
    onError: (error: Error) => {
      console.error('Update venue error:', error);
      Alert.alert('Error', error.message || 'Failed to update venue');
    },
  });

  // Update venue display mutation
  const updateVenueDisplayMutation = useMutation({
    mutationFn: async ({
      venueId,
      displayUpdates,
    }: {
      venueId: string;
      displayUpdates: {
        imageUrl?: string;
        description?: string;
        tags?: string[];
      };
    }) => {
      if (!canEditDisplay(venueId)) {
        throw new Error('You do not have permission to edit this venue display');
      }

      const response = await venueManagementApi.updateVenueDisplay(
        venueId,
        displayUpdates
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['venue', variables.venueId] });
      Alert.alert('Success', 'Venue display updated successfully');
    },
    onError: (error: Error) => {
      console.error('Update venue display error:', error);
      Alert.alert('Error', error.message || 'Failed to update venue display');
    },
  });

  // Context value
  const value: VenueManagementContextType = {
    // Business Profile
    businessProfile,
    isLoadingProfile,
    hasBusinessProfile,

    // Venue Roles & Permissions
    venueRoles,
    managedVenues,

    // Permission Checks
    canEditVenue,
    canEditDisplay,
    canManageEvents,
    canManageStaff,
    hasPermission,
    getVenueRole,

    // Actions
    registerBusiness: async (data: BusinessRegistrationData) => {
      await registerBusinessMutation.mutateAsync(data);
    },
    resendVerificationEmail: async () => {
      await resendVerificationMutation.mutateAsync();
    },
    updateVenueInfo: async (venueId: string, updates: Partial<Venue>) => {
      await updateVenueInfoMutation.mutateAsync({ venueId, updates });
    },
    updateVenueDisplay: async (
      venueId: string,
      displayUpdates: {
        imageUrl?: string;
        description?: string;
        tags?: string[];
      }
    ) => {
      await updateVenueDisplayMutation.mutateAsync({ venueId, displayUpdates });
    },
  };

  return (
    <VenueManagementContext.Provider value={value}>
      {children}
    </VenueManagementContext.Provider>
  );
}
