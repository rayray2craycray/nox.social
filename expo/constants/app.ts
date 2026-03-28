/**
 * Application-wide constants
 * Centralizes magic numbers and configuration values for better maintainability
 */

// ============================================================================
// TIME CONSTANTS (in milliseconds)
// ============================================================================

export const TIME = {
  /** 1 second in milliseconds */
  SECOND: 1000,
  /** 1 minute in milliseconds */
  MINUTE: 60 * 1000,
  /** 1 hour in milliseconds */
  HOUR: 60 * 60 * 1000,
  /** 1 day in milliseconds */
  DAY: 24 * 60 * 60 * 1000,
  /** 1 week in milliseconds */
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

// ============================================================================
// VIBE CHECK CONFIGURATION
// ============================================================================

export const VIBE_CHECK = {
  /** How long a user must wait before voting again for the same venue (1 hour) */
  VOTE_COOLDOWN_MS: TIME.HOUR,

  /** How long vibe data remains valid before decaying (4 hours) */
  DATA_DECAY_MS: 4 * TIME.HOUR,

  /** Vote weight multiplier for VIP users (WHALE or PLATINUM) */
  VIP_VOTE_WEIGHT: 2.0,

  /** Vote weight for regular users */
  REGULAR_VOTE_WEIGHT: 1.0,
} as const;

// ============================================================================
// VIDEO CONFIGURATION
// ============================================================================

export const VIDEO = {
  /** Minimum video duration in seconds */
  MIN_DURATION_SECONDS: 10,

  /** Maximum video duration in seconds */
  MAX_DURATION_SECONDS: 15,

  /** Video aspect ratio (vertical for TikTok-style) */
  ASPECT_RATIO: '9:16',

  /** Recording countdown timer duration in seconds */
  COUNTDOWN_DURATION_SECONDS: 3,
} as const;

// ============================================================================
// POS INTEGRATION (Toast & Square)
// ============================================================================

export const POS_CONFIG = {
  /** Simulated connection delay in development (2 seconds) */
  MOCK_CONNECTION_DELAY_MS: 2 * TIME.SECOND,

  /** Default sync interval for POS transactions (5 minutes) */
  DEFAULT_SYNC_INTERVAL_MS: 5 * TIME.MINUTE,

  /** Timeout for POS API validation requests (10 seconds) */
  VALIDATION_TIMEOUT_MS: 10 * TIME.SECOND,
} as const;

/**
 * @deprecated Use POS_CONFIG instead
 */
export const TOAST_POS = POS_CONFIG;

// ============================================================================
// USER TIERS AND ACCESS LEVELS
// ============================================================================

export const USER_TIERS = {
  GUEST: 'GUEST',
  REGULAR: 'REGULAR',
  PLATINUM: 'PLATINUM',
  WHALE: 'WHALE',
} as const;

export const SERVER_ACCESS_LEVELS = {
  PUBLIC: 'PUBLIC',
  INNER_CIRCLE: 'INNER_CIRCLE',
} as const;

// ============================================================================
// SPEND THRESHOLDS (in cents)
// ============================================================================

export const SPEND_THRESHOLDS = {
  /** Minimum spend to unlock REGULAR tier (example: $50) */
  REGULAR_TIER: 5000,

  /** Minimum spend to unlock PLATINUM tier (example: $200) */
  PLATINUM_TIER: 20000,

  /** Minimum spend to unlock WHALE tier (example: $500) */
  WHALE_TIER: 50000,
} as const;

// ============================================================================
// LOCATION & MAP CONFIGURATION
// ============================================================================

export const MAP = {
  /** Default map zoom level */
  DEFAULT_ZOOM: 15,

  /** Minimum distance in meters to trigger location update */
  MIN_DISTANCE_METERS: 10,

  /** Location update interval in milliseconds */
  UPDATE_INTERVAL_MS: 10 * TIME.SECOND,
} as const;

export const LOCATION_SHARING_PRECISION = {
  OFF: 'OFF',
  APPROXIMATE: 'APPROXIMATE',    // ~1km radius
  PRECISE: 'PRECISE',             // Exact location
} as const;

// ============================================================================
// ANALYTICS & TRACKING
// ============================================================================

export const ANALYTICS = {
  /** How often to refresh analytics data */
  REFRESH_INTERVAL_MS: 5 * TIME.MINUTE,

  /** Number of days to show in analytics history */
  HISTORY_DAYS: 30,
} as const;

// ============================================================================
// UI & UX CONSTANTS
// ============================================================================

export const UI = {
  /** Haptic feedback vibration duration in milliseconds */
  HAPTIC_DURATION_MS: 10,

  /** Animation duration for transitions in milliseconds */
  ANIMATION_DURATION_MS: 300,

  /** Debounce delay for search inputs in milliseconds */
  SEARCH_DEBOUNCE_MS: 500,

  /** Toast/notification display duration in milliseconds */
  NOTIFICATION_DURATION_MS: 3 * TIME.SECOND,
} as const;

// ============================================================================
// SOCIAL FEATURES
// ============================================================================

export const SOCIAL = {
  /** Maximum number of friends to show on map simultaneously */
  MAX_VISIBLE_FRIENDS: 50,

  /** Friend location staleness threshold (show as "last seen" if older) */
  LOCATION_STALE_MS: 5 * TIME.MINUTE,
} as const;

// ============================================================================
// FEED CONFIGURATION
// ============================================================================

export const FEED = {
  /** Number of videos to preload in feed */
  PRELOAD_COUNT: 3,

  /** Maximum distance in km for "Nearby" filter */
  NEARBY_RADIUS_KM: 50,
} as const;

// ============================================================================
// VALIDATION LIMITS
// ============================================================================

export const VALIDATION = {
  /** Maximum length for user display name */
  MAX_DISPLAY_NAME_LENGTH: 50,

  /** Maximum length for bio */
  MAX_BIO_LENGTH: 500,

  /** Minimum password length */
  MIN_PASSWORD_LENGTH: 8,

  /** Maximum password length */
  MAX_PASSWORD_LENGTH: 128,

  /** Username minimum length */
  MIN_USERNAME_LENGTH: 3,

  /** Username maximum length */
  MAX_USERNAME_LENGTH: 30,
} as const;

// ============================================================================
// API CONFIGURATION
// ============================================================================

export const API = {
  /** Default API request timeout in milliseconds */
  REQUEST_TIMEOUT_MS: 30 * TIME.SECOND,

  /** Number of retry attempts for failed requests */
  MAX_RETRIES: 3,

  /** Delay between retry attempts in milliseconds */
  RETRY_DELAY_MS: 1 * TIME.SECOND,
} as const;

// Type exports for TypeScript
export type UserTier = typeof USER_TIERS[keyof typeof USER_TIERS];
export type ServerAccessLevel = typeof SERVER_ACCESS_LEVELS[keyof typeof SERVER_ACCESS_LEVELS];
export type LocationSharingPrecision = typeof LOCATION_SHARING_PRECISION[keyof typeof LOCATION_SHARING_PRECISION];
