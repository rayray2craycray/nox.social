import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureException } from '@/config/sentry';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Global Error Boundary Component
 * Catches unhandled errors in the component tree and displays a fallback UI
 *
 * Usage:
 * <ErrorBoundary onError={(error, errorInfo) => logErrorToService(error, errorInfo)}>
 *   <App />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Error Info:', errorInfo);
    }

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler (e.g., to send to error tracking service)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to Sentry with the component stack — this boundary is the LAST
    // stop for render crashes in production; without this call they vanish.
    try {
      captureException(error, {
        componentStack: errorInfo.componentStack ?? 'unavailable',
        boundary: 'root',
      });
    } catch {
      // Never let error reporting crash the error UI.
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.emoji}>😔</Text>
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.description}>
              We&apos;re sorry for the inconvenience. The app encountered an unexpected error.
            </Text>

            {this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorTitle}>
                  {__DEV__ ? 'Error Details (Dev Only):' : 'Error code (include this when reporting):'}
                </Text>
                <Text style={styles.errorMessage}>{this.state.error.toString()}</Text>
                {__DEV__ && this.state.errorInfo && (
                  <Text style={styles.errorStack} numberOfLines={10}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>

            <Text style={styles.helpText}>
              If the problem persists, please contact support
            </Text>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  errorDetails: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff6b6b',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 12,
    color: '#ff6b6b',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  errorStack: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
