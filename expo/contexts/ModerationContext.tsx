/**
 * Moderation Context
 * Handles content reporting, user blocking, and moderation actions
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { apiClient } from '@/services/api';
import { API_ENDPOINTS } from '@/services/config';
import { useAuth } from './AuthContext';

interface ReportSubmission {
  contentType: 'video' | 'user' | 'comment' | 'message';
  contentId: string;
  reason: string;
  details: string;
  reportedUserId?: string;
}

interface BlockedUser {
  id: string;
  blockedUserId: {
    _id: string;
    username: string;
    displayName: string;
    profilePicture?: string;
  };
  createdAt: string;
}

interface ModerationContextType {
  // Report functions
  submitReport: (report: ReportSubmission) => Promise<void>;
  isSubmittingReport: boolean;

  // Block functions
  blockUser: (userId: string, userName?: string) => void;
  unblockUser: (userId: string) => Promise<void>;
  isBlocking: boolean;
  isUnblocking: boolean;

  // Block list
  blockedUsers: BlockedUser[];
  isLoadingBlockedUsers: boolean;
  refetchBlockedUsers: () => void;

  // Check if user is blocked
  checkIfBlocked: (userId: string) => Promise<boolean>;
}

const ModerationContext = createContext<ModerationContextType | undefined>(undefined);

export function ModerationProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { userId, accessToken } = useAuth();

  // Submit report mutation
  const submitReportMutation = useMutation({
    mutationFn: async (report: ReportSubmission) => {
      const response = await apiClient.post<any>(API_ENDPOINTS.MODERATION.REPORTS.CREATE, report);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate any relevant queries
      queryClient.invalidateQueries({ queryKey: ['my-reports'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-stats'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Report Submitted', 'Thank you for helping keep our community safe.');
    },
    onError: (error: any) => {
      console.error('[Moderation] Report error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Report Failed', error.message || 'Could not submit report. Please try again.');
    },
  });

  // Block user mutation
  const blockUserMutation = useMutation({
    mutationFn: async (userIdToBlock: string) => {
      const response = await apiClient.post<any>(API_ENDPOINTS.MODERATION.BLOCKING.BLOCK, {
        userIdToBlock,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-stats'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('User Blocked', 'You will no longer see content from this user.');
    },
    onError: (error: any) => {
      console.error('[Moderation] Block error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Block Failed', error.message || 'Could not block user. Please try again.');
    },
  });

  // Unblock user mutation
  const unblockUserMutation = useMutation({
    mutationFn: async (userIdToUnblock: string) => {
      const response = await apiClient.post<any>(
        API_ENDPOINTS.MODERATION.BLOCKING.UNBLOCK(userIdToUnblock),
        {}
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-stats'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('User Unblocked', 'You can now see content from this user again.');
    },
    onError: (error: any) => {
      console.error('[Moderation] Unblock error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Unblock Failed', error.message || 'Could not unblock user. Please try again.');
    },
  });

  // Get blocked users query
  const { data: blockedUsersData, isLoading: isLoadingBlockedUsers, refetch: refetchBlockedUsers } = useQuery({
    queryKey: ['blocked-users', userId],
    queryFn: async () => {
      try {
        const response = await apiClient.get<any>(API_ENDPOINTS.MODERATION.BLOCKING.BLOCKED_USERS);
        return (response.data || []).map((user: any) => ({
          id: user._id || user.id,
          blockedUserId: user.blockedUserId?._id ? {
            _id: user.blockedUserId._id,
            username: user.blockedUserId.displayName || user.blockedUserId.username,
            displayName: user.blockedUserId.displayName || user.blockedUserId.username,
            profilePicture: user.blockedUserId.profileImageUrl || user.blockedUserId.profilePicture,
          } : user.blockedUserId,
          createdAt: user.createdAt,
        })) as BlockedUser[];
      } catch (error) {
        console.error('[Moderation] Error fetching blocked users:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId && !!accessToken,
  });

  // Check if user is blocked
  const checkIfBlocked = async (userIdToCheck: string): Promise<boolean> => {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.MODERATION.BLOCKING.IS_BLOCKED(userIdToCheck));
      return response.data?.isBlocked || false;
    } catch (error) {
      console.error('Error checking if user is blocked:', error);
      return false;
    }
  };

  // Helper function to show report dialog
  const showReportDialog = (
    contentType: 'video' | 'comment' | 'user' | 'message',
    contentId: string,
    reportedUserId?: string
  ) => {
    Alert.alert(
      'Report Content',
      'Why are you reporting this content?',
      [
        {
          text: 'Inappropriate Content',
          onPress: () => submitReportMutation.mutate({
            contentType,
            contentId,
            reason: 'inappropriate',
            details: 'Inappropriate content',
            reportedUserId,
          }),
        },
        {
          text: 'Spam',
          onPress: () => submitReportMutation.mutate({
            contentType,
            contentId,
            reason: 'spam',
            details: 'Spam content',
            reportedUserId,
          }),
        },
        {
          text: 'Harassment',
          onPress: () => submitReportMutation.mutate({
            contentType,
            contentId,
            reason: 'harassment',
            details: 'Harassment',
            reportedUserId,
          }),
        },
        {
          text: 'Violence',
          onPress: () => submitReportMutation.mutate({
            contentType,
            contentId,
            reason: 'violence',
            details: 'Violence or dangerous content',
            reportedUserId,
          }),
        },
        {
          text: 'Other',
          onPress: () => submitReportMutation.mutate({
            contentType,
            contentId,
            reason: 'other',
            details: 'Other violation',
            reportedUserId,
          }),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  // Helper function to block user with confirmation
  const blockUserWithConfirmation = (userIdToBlock: string, userName?: string) => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${userName || 'this user'}? You will no longer see their content.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => blockUserMutation.mutate(userIdToBlock),
        },
      ]
    );
  };

  const value: ModerationContextType = {
    submitReport: submitReportMutation.mutateAsync,
    isSubmittingReport: submitReportMutation.isPending,

    blockUser: blockUserWithConfirmation,
    unblockUser: unblockUserMutation.mutateAsync,
    isBlocking: blockUserMutation.isPending,
    isUnblocking: unblockUserMutation.isPending,

    blockedUsers: blockedUsersData || [],
    isLoadingBlockedUsers,
    refetchBlockedUsers,

    checkIfBlocked,
  };

  return (
    <ModerationContext.Provider value={value}>
      {children}
    </ModerationContext.Provider>
  );
}

export function useModeration() {
  const context = useContext(ModerationContext);
  if (context === undefined) {
    throw new Error('useModeration must be used within a ModerationProvider');
  }
  return context;
}
