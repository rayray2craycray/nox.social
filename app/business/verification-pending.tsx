/**
 * Email Verification Pending Screen
 * Shows status while waiting for email verification
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Mail, RefreshCw, CheckCircle2, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useVenueManagement } from '@/contexts/VenueManagementContext';

const COLORS = {
  background: '#000000',
  surface: '#1a1a1a',
  text: '#ffffff',
  textSecondary: '#999999',
  accent: '#ff0080',
  accentDark: '#cc0066',
  success: '#34c759',
};

export default function VerificationPendingScreen() {
  const { resendVerificationEmail } = useVenueManagement();
  const [isResending, setIsResending] = useState(false);

  const handleResendEmail = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsResending(true);

    try {
      await resendVerificationEmail();
      Alert.alert('Email Sent!', 'A new verification email has been sent to your inbox.');
    } catch (error: any) {
      console.error('Resend email error:', error);
      const errorMessage = error?.message || 'Unable to resend email. Please try again later.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[COLORS.accent + '30', COLORS.accent + '10']}
            style={styles.iconGradient}
          >
            <Mail size={48} color={COLORS.accent} />
          </LinearGradient>
        </View>

        {/* Title */}
        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.subtitle}>
          We&apos;ve sent a verification link to your business email address.
        </Text>

        {/* Steps */}
        <View style={styles.stepsContainer}>
          <StepItem
            icon={<Mail size={20} color={COLORS.accent} />}
            title="Check your inbox"
            description="Look for an email from Nox"
          />
          <StepItem
            icon={<CheckCircle2 size={20} color={COLORS.accent} />}
            title="Click the verification link"
            description="This confirms you own the business email"
          />
          <StepItem
            icon={<Clock size={20} color={COLORS.accent} />}
            title="Wait for approval"
            description="We&apos;ll review your application within 24 hours"
          />
        </View>

        {/* Resend Button */}
        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResendEmail}
          disabled={isResending}
        >
          {isResending ? (
            <ActivityIndicator size="small" color={COLORS.accent} />
          ) : (
            <>
              <RefreshCw size={18} color={COLORS.accent} />
              <Text style={styles.resendText}>Resend Verification Email</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/(tabs)/profile');
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentDark]}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.backButtonText}>Back to Profile</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function StepItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.stepItem}>
      <View style={styles.stepIcon}>{icon}</View>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  stepsContainer: {
    gap: 24,
    marginBottom: 40,
  },
  stepItem: {
    flexDirection: 'row',
    gap: 16,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 16,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
  },
  backButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
