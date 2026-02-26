import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT || 'development';

export const initSentry = () => {
  // Only initialize Sentry if DSN is provided and not in development
  if (!SENTRY_DSN) {
    console.log('[Sentry] Skipping initialization - No DSN provided');
    return;
  }

  if (__DEV__) {
    console.log('[Sentry] Skipping initialization - Development mode');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000, // 30 seconds

    // Performance Monitoring
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.2 : 1.0, // 20% in prod, 100% in staging

    // Set release version
    release: Constants.expoConfig?.version || '1.0.0',
    dist: Constants.expoConfig?.android?.versionCode?.toString() ||
          Constants.expoConfig?.ios?.buildNumber ||
          '1',

    // Breadcrumbs
    maxBreadcrumbs: 50,
    attachStacktrace: true,

    // Events filtering
    beforeSend(event, hint) {
      // Filter out known non-critical errors
      const error = hint.originalException;

      if (error && typeof error === 'object' && 'message' in error) {
        const message = String(error.message);

        // Ignore network errors in development
        if (__DEV__ && message.includes('Network request failed')) {
          return null;
        }

        // Ignore AbortController timeouts (handled gracefully)
        if (message.includes('AbortError') || message.includes('timeout')) {
          return null;
        }
      }

      return event;
    },

    // Integrations
    integrations: [
      Sentry.reactNavigationIntegration(),
    ],
  });

  console.log('[Sentry] Initialized successfully');
  console.log(`[Sentry] Environment: ${ENVIRONMENT}`);
};

// Helper to capture exceptions with additional context (no-op if Sentry not initialized)
export const captureException = (error: Error, context?: Record<string, any>) => {
  if (__DEV__) {
    console.error('[Sentry] Exception:', error, context);
    return;
  }
  if (!SENTRY_DSN) return;
  try {
    Sentry.captureException(error, {
      contexts: {
        custom: context ?? {},
      },
    });
  } catch (_) {
    // ignore so app never crashes due to Sentry
  }
};

// Helper to capture messages/logs (no-op if Sentry not initialized)
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  if (__DEV__) {
    console.log(`[Sentry] Message (${level}):`, message);
    return;
  }
  if (!SENTRY_DSN) return;
  try {
    Sentry.captureMessage(message, level);
  } catch (_) {}
};

// Helper to add breadcrumbs for debugging (no-op if Sentry not initialized)
export const addBreadcrumb = (message: string, category: string, data?: Record<string, any>) => {
  if (!SENTRY_DSN) return;
  try {
    Sentry.addBreadcrumb({ message, category, data, level: 'info' });
  } catch (_) {}
};

// Helper to set user context (no-op if Sentry not initialized)
export const setUserContext = (userId: string | null, email?: string, username?: string) => {
  if (!SENTRY_DSN) return;
  try {
    if (userId) {
      Sentry.setUser({ id: userId, email, username });
    } else {
      Sentry.setUser(null);
    }
  } catch (_) {}
};

export default Sentry;
