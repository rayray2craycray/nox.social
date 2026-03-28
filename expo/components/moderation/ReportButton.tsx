import React from 'react';
import { TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useModeration } from '@/contexts/ModerationContext';
import { useAuth } from '@/contexts/AuthContext';

interface ReportButtonProps {
  contentType: 'video' | 'comment' | 'user' | 'message';
  contentId: string;
  reportedUserId?: string;
  iconSize?: number;
  iconColor?: string;
  onReportSubmitted?: () => void;
}

export default function ReportButton({
  contentType,
  contentId,
  reportedUserId,
  iconSize = 24,
  iconColor = '#fff',
  onReportSubmitted,
}: ReportButtonProps) {
  const { submitReport, isSubmittingReport } = useModeration();
  const { isAuthenticated } = useAuth();

  const handleReport = () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please log in to report content.');
      return;
    }

    Alert.alert(
      'Report Content',
      'Why are you reporting this content?',
      [
        {
          text: 'Inappropriate Content',
          onPress: async () => {
            await submitReport({
              contentType,
              contentId,
              reason: 'inappropriate',
              details: 'Inappropriate content',
              reportedUserId,
            });
            if (onReportSubmitted) onReportSubmitted();
          },
        },
        {
          text: 'Spam',
          onPress: async () => {
            await submitReport({
              contentType,
              contentId,
              reason: 'spam',
              details: 'Spam content',
              reportedUserId,
            });
            if (onReportSubmitted) onReportSubmitted();
          },
        },
        {
          text: 'Harassment',
          onPress: async () => {
            await submitReport({
              contentType,
              contentId,
              reason: 'harassment',
              details: 'Harassment',
              reportedUserId,
            });
            if (onReportSubmitted) onReportSubmitted();
          },
        },
        {
          text: 'Violence',
          onPress: async () => {
            await submitReport({
              contentType,
              contentId,
              reason: 'violence',
              details: 'Violence or dangerous content',
              reportedUserId,
            });
            if (onReportSubmitted) onReportSubmitted();
          },
        },
        {
          text: 'Other',
          onPress: async () => {
            await submitReport({
              contentType,
              contentId,
              reason: 'other',
              details: 'Other violation',
              reportedUserId,
            });
            if (onReportSubmitted) onReportSubmitted();
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      onPress={handleReport}
      disabled={isSubmittingReport}
      style={styles.button}
    >
      <Ionicons
        name="flag-outline"
        size={iconSize}
        color={isSubmittingReport ? '#666' : iconColor}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
  },
});
