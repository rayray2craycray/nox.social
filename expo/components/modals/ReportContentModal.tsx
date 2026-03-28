import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flag, X, AlertTriangle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface ReportContentModalProps {
  visible: boolean;
  onClose: () => void;
  contentType: 'video' | 'user' | 'comment' | 'message';
  contentId: string;
  reportedUserId?: string;
  onReportSubmit: (report: {
    contentType: string;
    contentId: string;
    reason: string;
    details: string;
    reportedUserId?: string;
  }) => void;
}

const REPORT_REASONS = {
  video: [
    { id: 'inappropriate', label: 'Inappropriate Content', description: 'Sexual, violent, or graphic content' },
    { id: 'spam', label: 'Spam or Misleading', description: 'Repetitive or deceptive content' },
    { id: 'harassment', label: 'Harassment or Bullying', description: 'Targeted abuse or threats' },
    { id: 'hate_speech', label: 'Hate Speech', description: 'Discriminatory or hateful content' },
    { id: 'copyright', label: 'Copyright Violation', description: 'Unauthorized use of copyrighted material' },
    { id: 'dangerous', label: 'Dangerous Activities', description: 'Encourages harmful behavior' },
    { id: 'other', label: 'Other', description: 'Something else' },
  ],
  user: [
    { id: 'fake_account', label: 'Fake Account', description: 'Impersonation or bot' },
    { id: 'harassment', label: 'Harassment', description: 'Harassing or bullying behavior' },
    { id: 'spam', label: 'Spam', description: 'Posting spam or scams' },
    { id: 'inappropriate', label: 'Inappropriate Behavior', description: 'Violates community guidelines' },
    { id: 'underage', label: 'Underage User', description: 'User appears to be under 18' },
    { id: 'other', label: 'Other', description: 'Something else' },
  ],
  comment: [
    { id: 'harassment', label: 'Harassment', description: 'Abusive or threatening language' },
    { id: 'hate_speech', label: 'Hate Speech', description: 'Discriminatory content' },
    { id: 'spam', label: 'Spam', description: 'Repetitive or promotional' },
    { id: 'inappropriate', label: 'Inappropriate', description: 'Sexual or graphic content' },
    { id: 'other', label: 'Other', description: 'Something else' },
  ],
  message: [
    { id: 'harassment', label: 'Harassment', description: 'Unwanted or threatening messages' },
    { id: 'spam', label: 'Spam', description: 'Unsolicited promotional messages' },
    { id: 'inappropriate', label: 'Inappropriate Content', description: 'Sexual or graphic content' },
    { id: 'scam', label: 'Scam or Fraud', description: 'Deceptive or fraudulent content' },
    { id: 'other', label: 'Other', description: 'Something else' },
  ],
};

/**
 * Report Content Modal
 * Allows users to report inappropriate content or users
 * Required for App Store approval (user-generated content moderation)
 */
export default function ReportContentModal({
  visible,
  onClose,
  contentType,
  contentId,
  reportedUserId,
  onReportSubmit,
}: ReportContentModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [details, setDetails] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons = REPORT_REASONS[contentType] || REPORT_REASONS.video;

  const handleReasonSelect = (reasonId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedReason(reasonId);
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason for reporting.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSubmitting(true);

    try {
      await onReportSubmit({
        contentType,
        contentId,
        reason: selectedReason,
        details: details.trim(),
        reportedUserId,
      });

      Alert.alert(
        'Report Submitted',
        'Thank you for reporting. Our moderation team will review this content within 24 hours.',
        [
          {
            text: 'OK',
            onPress: () => {
              setSelectedReason('');
              setDetails('');
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setDetails('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={['#1a1a2e', '#15151f']}
            style={styles.gradient}
          >
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Flag size={24} color="#ff6b6b" />
                <Text style={styles.title}>Report {contentType}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={24} color="#666680" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.warningBox}>
                <AlertTriangle size={16} color="#ffa64d" />
                <Text style={styles.warningText}>
                  False reports may result in account restrictions. Only report content that violates our Community Guidelines.
                </Text>
              </View>

              <Text style={styles.sectionTitle}>Select a Reason</Text>

              <View style={styles.reasonsList}>
                {reasons.map((reason) => (
                  <TouchableOpacity
                    key={reason.id}
                    style={[
                      styles.reasonCard,
                      selectedReason === reason.id && styles.reasonCardSelected,
                    ]}
                    onPress={() => handleReasonSelect(reason.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.radio,
                        selectedReason === reason.id && styles.radioSelected,
                      ]}
                    >
                      {selectedReason === reason.id && (
                        <View style={styles.radioDot} />
                      )}
                    </View>
                    <View style={styles.reasonContent}>
                      <Text style={styles.reasonLabel}>{reason.label}</Text>
                      <Text style={styles.reasonDescription}>
                        {reason.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Additional Details (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={details}
                onChangeText={setDetails}
                placeholder="Provide more information about this report..."
                placeholderTextColor="#666680"
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
              />

              <Text style={styles.charCount}>{details.length}/500 characters</Text>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!selectedReason || isSubmitting) && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!selectedReason || isSubmitting}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    selectedReason && !isSubmitting
                      ? ['#ff6b6b', '#ff8787']
                      : ['#666680', '#666680']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  <Text style={styles.submitButtonText}>
                    {isSubmitting ? 'Submitting...' : 'Submit Report'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end' as const,
  },
  container: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  gradient: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
    textTransform: 'capitalize' as const,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  scrollView: {
    maxHeight: 500,
    paddingHorizontal: 20,
  },
  warningBox: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 10,
    backgroundColor: 'rgba(255, 166, 77, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 166, 77, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginTop: 20,
    marginBottom: 24,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#ffa64d',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 12,
  },
  reasonsList: {
    gap: 8,
    marginBottom: 24,
  },
  reasonCard: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
  },
  reasonCardSelected: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderColor: 'rgba(255, 107, 107, 0.4)',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#666680',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 2,
  },
  radioSelected: {
    borderColor: '#ff6b6b',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff6b6b',
  },
  reasonContent: {
    flex: 1,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 2,
  },
  reasonDescription: {
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 14,
    minHeight: 100,
    marginBottom: 8,
  },
  charCount: {
    fontSize: 11,
    color: '#666680',
    textAlign: 'right' as const,
    marginBottom: 20,
  },
  footer: {
    flexDirection: 'row' as const,
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  submitButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitGradient: {
    paddingVertical: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
