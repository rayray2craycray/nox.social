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
const IOS_BUNDLE_ID = process.env.IOS_BUNDLE_ID || 'social.nox.nightlife';
const ANDROID_PACKAGE = process.env.ANDROID_PACKAGE || 'social.nox.nightlife';

// EAS Build configuration
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID || '';

module.exports = {
  expo: {
    name: APP_NAME,
    slug: APP_SLUG,
    version: APP_VERSION,
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'nox',
    userInterfaceStyle: 'automatic',
    // newArchEnabled removed - SDK 53 doesn't need this

    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#000000',
    },

    ios: {
      supportsTablet: false,
      bundleIdentifier: IOS_BUNDLE_ID,
      buildNumber: BUILD_NUMBER,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription: 'Nox needs camera access to capture venue moments and create video highlights.',
        NSMicrophoneUsageDescription: 'Nox needs microphone access to record video highlights.',
        NSPhotoLibraryUsageDescription: 'Nox needs photo library access to upload your memories.',
        NSLocationWhenInUseUsageDescription: 'Nox needs your location to verify you\'re at a venue when capturing memories.',
        NSLocationAlwaysAndWhenInUseUsageDescription: 'Nox needs your location to verify you\'re at a venue.',
        NSLocationAlwaysUsageDescription: 'Nox needs your location to discover nearby venues.',
        NSContactsUsageDescription: 'Nox uses contacts to help you find friends who are also using the app.',
        UIBackgroundModes: ['audio', 'location'],
      },
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY || 'AIzaSyBTR8B7HNcmI58gqKP23Pr0Bb0uO4ymJhI',
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
          apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY || 'AIzaSyBTR8B7HNcmI58gqKP23Pr0Bb0uO4ymJhI',
        },
      },
    },

    web: {
      favicon: './assets/images/favicon.png',
      bundler: 'metro',
    },

    plugins: [
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
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyBTR8B7HNcmI58gqKP23Pr0Bb0uO4ymJhI',
      instagramClientId: process.env.INSTAGRAM_CLIENT_ID || '',
      eas: {
        projectId: EAS_PROJECT_ID || 'e5c57346-e187-4439-897d-085cf29a7456',
      },
    },


    // Runtime version (required even without updates)
    runtimeVersion: {
      policy: 'sdkVersion',
    },

    // Asset bundling
    assetBundlePatterns: ['**/*'],

    // Privacy
    privacy: 'public',

    // Hooks
    hooks: {
      postPublish: [],
    },
  },
};
