/**
 * Expo App Configuration
 * Dynamic configuration that reads from environment variables
 *
 * Usage:
 * - Development: Uses default values
 * - Production: Set environment variables before building
 */

const IS_PRODUCTION = process.env.APP_ENV === 'production';
const IS_STAGING = process.env.APP_ENV === 'staging';

// API URLs
const API_URL = process.env.API_URL ||
  (IS_PRODUCTION ? 'https://api.nox.social' :
   IS_STAGING ? 'https://staging-api.nox.social' :
   'http://localhost:5000');

// App identifiers
const APP_NAME = process.env.APP_NAME || 'Nox Nightlife';
const APP_SLUG = process.env.APP_SLUG || 'nox';
const APP_VERSION = process.env.APP_VERSION || '1.0.0';
const BUILD_NUMBER = process.env.BUILD_NUMBER || '1';

// Bundle identifiers
const IOS_BUNDLE_ID = process.env.IOS_BUNDLE_ID || 'social.nox';
const ANDROID_PACKAGE = process.env.ANDROID_PACKAGE || 'social.nox';

// EAS Build configuration
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID || '';

module.exports = {
  expo: {
    owner: 'rayantaimur',
    name: APP_NAME,
    slug: APP_SLUG,
    version: APP_VERSION,
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'nox',
    userInterfaceStyle: 'dark',
    // newArchEnabled not set — matches working nox-rebuild config.

    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#000000',
    },

    ios: {
      supportsTablet: false,
      bundleIdentifier: IOS_BUNDLE_ID,
      buildNumber: BUILD_NUMBER,
      jsEngine: 'jsc',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription: 'Nox needs camera access to capture venue moments and create video highlights.',
        NSMicrophoneUsageDescription: 'Nox needs microphone access to record video highlights.',
        NSPhotoLibraryUsageDescription: 'Nox needs photo library access to upload your memories.',
        NSLocationWhenInUseUsageDescription: 'Nox needs your location to verify you\'re at a venue when capturing memories.',
        NSLocationAlwaysAndWhenInUseUsageDescription: 'Nox needs your location to verify you\'re at a venue.',
        NSLocationAlwaysUsageDescription: 'Nox needs your location to discover nearby venues.',
        UIBackgroundModes: ['location'],
      },
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY || '',
      },
    },

    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#000000',
      },
      package: ANDROID_PACKAGE,
      versionCode: parseInt(BUILD_NUMBER, 10),
      permissions: [
        'android.permission.VIBRATE',
        'CAMERA',
        'RECORD_AUDIO',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'ACCESS_COARSE_LOCATION',
        'ACCESS_FINE_LOCATION',
        'FOREGROUND_SERVICE',
        'FOREGROUND_SERVICE_LOCATION',
        'ACCESS_BACKGROUND_LOCATION',
        'INTERNET',
        'ACCESS_NETWORK_STATE',
      ],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY || '',
        },
      },
    },

    web: {
      favicon: './assets/images/favicon.png',
      bundler: 'metro',
    },

    plugins: [
      './plugins/withTurboModuleFix',
      '@react-native-community/datetimepicker',
      'expo-secure-store',
      [
        'expo-router',
        {
          origin: IS_PRODUCTION ? 'https://nox.social/' : 'https://nox.social/',
        },
      ],
      'expo-font',
      'expo-web-browser',
      [
        'expo-camera',
        {
          cameraPermission: 'Nox needs camera access to capture venue moments.',
          microphonePermission: 'Nox needs microphone access to record videos.',
          recordAudioAndroid: true,
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'Nox needs access to your photos to upload memories.',
        },
      ],
      [
        'expo-location',
        {
          isAndroidForegroundServiceEnabled: true,
          isAndroidBackgroundLocationEnabled: false,
          isIosBackgroundLocationEnabled: false,
          locationAlwaysAndWhenInUsePermission: 'Nox needs your location to verify venue check-ins.',
        },
      ],
      [
        'expo-notifications',
        {
          // Custom small icon/color come later — defaults are fine for v1.0.
        },
      ],
      [
        '@stripe/stripe-react-native',
        {
          // Apple Pay merchant ID — created in Apple Developer Console
          // 2026-07-27. This injects the com.apple.developer.in-app-payments
          // entitlement, so the next build MUST be interactive (`eas build`
          // answering the capability-sync prompts) to regenerate the
          // provisioning profile — a non-interactive build can't add it.
          merchantIdentifier: 'merchant.social.nox',
          enableGooglePay: false, // Google Pay deferred to v1.1
        },
      ],
    ],

    experiments: {
      typedRoutes: false,
    },

    // Extra configuration for runtime (also used by EAS)
    extra: {
      apiUrl: API_URL,
      environment: process.env.APP_ENV || 'development',
      easProjectId: EAS_PROJECT_ID || 'e5c57346-e187-4439-897d-085cf29a7456',
      cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
      sentryDsn: process.env.SENTRY_DSN || process.env.EXPO_PUBLIC_SENTRY_DSN || '',
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
      instagramClientId: process.env.INSTAGRAM_CLIENT_ID || '',
      stripePublishableKey:
        process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
        process.env.STRIPE_PUBLISHABLE_KEY ||
        '',
      eas: {
        projectId: EAS_PROJECT_ID || 'e5c57346-e187-4439-897d-085cf29a7456',
      },
    },


    // Runtime version (required even without updates)
    runtimeVersion: {
      policy: 'sdkVersion',
    },

  },
};
