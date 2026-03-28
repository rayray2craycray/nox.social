/**
 * Sentry error tracking via @sentry/browser (JS-only SDK).
 *
 * We use @sentry/browser instead of @sentry/react-native because the latter
 * relies on TurboModule native methods that cause SIGABRT crashes on iOS with
 * New Architecture enabled (SDK 54). The browser SDK is pure JavaScript — no
 * native modules, no ObjC exceptions, no crash risk.
 *
 * Trade-off: we lose native crash reporting (C++/ObjC-level crashes) and some
 * device-level context, but we gain reliable JS error tracking, breadcrumbs,
 * user context, and performance traces without any native integration risk.
 */

import * as Sentry from '@sentry/browser';

type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

const SENTRY_DSN =
  process.env.EXPO_PUBLIC_SENTRY_DSN ??
  'https://b198d5a4180a329ad71dc1fa5e213d0f@o4510789682266113.ingest.us.sentry.io/4510789691834368';

const SENTRY_ENVIRONMENT =
  process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT ?? 'development';

const IS_PRODUCTION = SENTRY_ENVIRONMENT === 'production';

let isInitialized = false;

/**
 * Initialize Sentry. Safe to call at mount time — no native modules involved.
 * Only enables sending in production; in dev it logs a message and no-ops.
 */
export const initSentry = () => {
  if (isInitialized) return;
  isInitialized = true;

  if (__DEV__) {
    console.log('[Sentry] Dev mode — initialized with debug transport (events not sent)');
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: SENTRY_ENVIRONMENT,
      enabled: IS_PRODUCTION,
      tracesSampleRate: 0.2,
      integrations: (defaults) =>
        defaults.filter((integration) => {
          // Remove integrations that depend on browser-specific globals
          // (document, window.history, etc.) which don't exist in React Native.
          const browserOnly = [
            'BrowserApiErrors',
            'Breadcrumbs',
            'GlobalHandlers',
            'HttpContext',
            'TryCatch',
          ];
          return !browserOnly.includes(integration.name);
        }),
    });
  } catch (error) {
    // Never let Sentry initialization crash the app
    console.warn('[Sentry] Failed to initialize:', error);
  }
};

/**
 * Capture an exception and send it to Sentry with optional extra context.
 */
export const captureException = (
  error: Error,
  context?: Record<string, any>,
) => {
  if (__DEV__) {
    console.error('[Sentry] Exception:', error, context);
  }

  try {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setExtras(context);
      }
      Sentry.captureException(error);
    });
  } catch (e) {
    console.warn('[Sentry] Failed to capture exception:', e);
  }
};

/**
 * Capture a message at the given severity level.
 */
export const captureMessage = (
  message: string,
  level: SeverityLevel = 'info',
) => {
  if (__DEV__) {
    console.log(`[Sentry] Message (${level}):`, message);
  }

  try {
    Sentry.captureMessage(message, level);
  } catch (e) {
    console.warn('[Sentry] Failed to capture message:', e);
  }
};

/**
 * Set the current user context on all future Sentry events.
 */
export const setUser = (user: {
  id: string;
  email?: string;
  username?: string;
}) => {
  try {
    Sentry.setUser(user);
  } catch (e) {
    console.warn('[Sentry] Failed to set user:', e);
  }
};

/**
 * Clear the current user context (e.g. on logout).
 */
export const clearUser = () => {
  try {
    Sentry.setUser(null);
  } catch (e) {
    console.warn('[Sentry] Failed to clear user:', e);
  }
};

/**
 * Add a breadcrumb for debugging context in Sentry event trails.
 */
export const addBreadcrumb = (
  message: string,
  category: string,
  data?: Record<string, any>,
) => {
  try {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  } catch (e) {
    // silent
  }
};

/**
 * Legacy alias — kept for backward compatibility with existing call sites.
 */
export const setUserContext = (
  userId: string | null,
  email?: string,
  username?: string,
) => {
  if (userId) {
    setUser({ id: userId, email, username });
  } else {
    clearUser();
  }
};

export default Sentry;
