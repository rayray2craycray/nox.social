/**
 * Sentry Error Tracking Configuration
 * Monitors errors, performance, and crashes in production
 */

const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');

// Track if Sentry is initialized
let sentryInitialized = false;

/**
 * Initialize Sentry
 * MUST be called before any other code
 */
function initSentry() {
  // Only enable in production or if explicitly set
  if (process.env.NODE_ENV !== 'production' && !process.env.SENTRY_DSN) {
    console.log('ℹ️  Sentry disabled (not in production mode)');
    sentryInitialized = false;
    return;
  }

  if (!process.env.SENTRY_DSN) {
    console.warn('⚠️  SENTRY_DSN not set - error tracking disabled');
    sentryInitialized = false;
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev

    // Profiling
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      nodeProfilingIntegration(),
    ],

    // Release tracking (optional - helps identify which version has issues)
    release: process.env.SENTRY_RELEASE || 'nox-social@2.0.0',

    // Server name for identification
    serverName: process.env.RENDER_SERVICE_NAME || 'nox-social-backend',

    // Filter out health checks and other noise
    beforeSend(event, hint) {
      // Don't send health check errors
      if (event.request?.url?.includes('/health')) {
        return null;
      }

      // Don't send known/expected errors
      const error = hint.originalException;
      if (error?.message?.includes('ECONNREFUSED') && process.env.NODE_ENV !== 'production') {
        return null; // Local development connection errors
      }

      return event;
    },
  });

  sentryInitialized = true;

  console.log('✅ Sentry error tracking enabled');
  console.log(`   Environment: ${process.env.NODE_ENV}`);
  console.log(`   Server: ${process.env.RENDER_SERVICE_NAME || 'local'}`);
}

/**
 * Express error handler middleware
 * Captures errors and sends to Sentry before responding
 */
function sentryErrorHandler() {
  if (!sentryInitialized || !Sentry.Handlers) {
    return (err, req, res, next) => next(err);
  }
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture all errors with status >= 500
      if (error.status >= 500) {
        return true;
      }

      // Also capture specific error types
      if (error.name === 'MongoError' || error.name === 'ValidationError') {
        return true;
      }

      return false;
    },
  });
}

/**
 * Express request handler middleware
 * Tracks request context
 */
function sentryRequestHandler() {
  if (!sentryInitialized || !Sentry.Handlers) {
    return (req, res, next) => next();
  }
  return Sentry.Handlers.requestHandler({
    user: ['id', 'email', 'username'],
  });
}

/**
 * Express tracing middleware
 * Tracks performance
 */
function sentryTracingHandler() {
  if (!sentryInitialized || !Sentry.Handlers) {
    return (req, res, next) => next();
  }
  return Sentry.Handlers.tracingHandler();
}

/**
 * Manually capture an exception
 */
function captureException(error, context = {}) {
  if (!sentryInitialized) return;
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Manually capture a message
 */
function captureMessage(message, level = 'info', context = {}) {
  if (!sentryInitialized) return;
  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Add user context to error reports
 */
function setUser(user) {
  if (!sentryInitialized) return;
  if (user) {
    Sentry.setUser({
      id: user._id?.toString(),
      email: user.email,
      username: user.username || user.displayName,
    });
  } else {
    Sentry.setUser(null);
  }
}

module.exports = {
  initSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
  captureException,
  captureMessage,
  setUser,
  Sentry,
};
