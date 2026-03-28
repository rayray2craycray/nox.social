import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { RefreshCcw, AlertCircle } from 'lucide-react-native';

interface RetryableSectionProps {
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  retryText?: string;
  errorTitle?: string;
  children?: React.ReactNode;
  minHeight?: number;
}

const COLORS = {
  primary: '#ff0080',
  background: '#000000',
  surface: '#1a1a1a',
  text: '#ffffff',
  textSecondary: '#999999',
  error: '#EF4444',
  border: '#333333',
};

export const RetryableSection: React.FC<RetryableSectionProps> = ({
  isLoading,
  error,
  onRetry,
  retryText = 'Try Again',
  errorTitle = 'Something went wrong',
  children,
  minHeight = 200,
}) => {
  if (isLoading) {
    return (
      <View style={[styles.container, { minHeight }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { minHeight }]}>
        <View style={styles.errorIcon}>
          <AlertCircle size={48} color={COLORS.error} />
        </View>
        <Text style={styles.errorTitle}>{errorTitle}</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          activeOpacity={0.7}
        >
          <RefreshCcw size={20} color={COLORS.text} />
          <Text style={styles.retryButtonText}>{retryText}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
});
