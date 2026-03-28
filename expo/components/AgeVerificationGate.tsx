import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, AlertCircle, X } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';

interface AgeVerificationGateProps {
  visible: boolean;
  onVerified: (dateOfBirth: Date) => void;
  onClose?: () => void;
}

/**
 * Age Verification Gate Component
 * Ensures users are 18+ before accessing the app (required for alcohol/nightlife content)
 * Complies with App Store requirements for age-restricted content
 */
export default function AgeVerificationGate({
  visible,
  onVerified,
  onClose,
}: AgeVerificationGateProps) {
  const [dateOfBirth, setDateOfBirth] = useState<Date>(new Date(2000, 0, 1));
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState<string>('');

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const handleVerify = () => {
    const age = calculateAge(dateOfBirth);

    if (age < 18) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError('You must be 18 or older to use this app.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setError('');
    onVerified(dateOfBirth);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (selectedDate) {
      setDateOfBirth(selectedDate);
      setError('');
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={['#1a1a2e', '#15151f']}
            style={styles.gradient}
          >
            {onClose && (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={24} color="#666680" />
              </TouchableOpacity>
            )}

            <View style={styles.iconContainer}>
              <Calendar size={48} color="#ff0080" />
            </View>

            <Text style={styles.title}>Age Verification Required</Text>

            <Text style={styles.description}>
              You must be 18 years or older to use Nox Nightlife. This app contains content related to nightlife venues, events, and alcohol service.
            </Text>

            <View style={styles.dateSection}>
              <Text style={styles.label}>Select Your Date of Birth</Text>

              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowPicker(true);
                }}
                activeOpacity={0.7}
              >
                <Calendar size={20} color="#ff0080" />
                <Text style={styles.dateText}>{formatDate(dateOfBirth)}</Text>
              </TouchableOpacity>

              {(showPicker || Platform.OS === 'ios') && (
                <DateTimePicker
                  value={dateOfBirth}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                  textColor="#ffffff"
                  themeVariant="dark"
                />
              )}
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <AlertCircle size={16} color="#ff6b6b" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.verifyButton}
              onPress={handleVerify}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#ff0080', '#ff6b9d']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.verifyGradient}
              >
                <Text style={styles.verifyButtonText}>Verify Age</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.disclaimer}>
              <AlertCircle size={14} color="#666680" />
              <Text style={styles.disclaimerText}>
                By verifying, you confirm that you are 18 years or older. False information may result in account termination.
              </Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    overflow: 'hidden',
  },
  gradient: {
    padding: 32,
    alignItems: 'center' as const,
  },
  closeButton: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    zIndex: 10,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 0, 128, 0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 0, 128, 0.2)',
  },
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#fff',
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 32,
  },
  dateSection: {
    width: '100%',
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#ccc',
    marginBottom: 12,
    textAlign: 'center' as const,
  },
  dateButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 12,
    backgroundColor: 'rgba(255, 0, 128, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 128, 0.3)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  errorContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#ff6b6b',
    lineHeight: 18,
  },
  verifyButton: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  verifyGradient: {
    paddingVertical: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  verifyButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
  },
  disclaimer: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 8,
    paddingHorizontal: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: '#666680',
    lineHeight: 16,
  },
});
