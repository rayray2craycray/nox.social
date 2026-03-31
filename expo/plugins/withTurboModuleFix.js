/**
 * Expo Config Plugin: withTurboModuleFix
 *
 * PURPOSE: Force EAS to recompile the native binary with our patch-package fix applied.
 *
 * BACKGROUND:
 * EAS Build caches compiled IPA binaries keyed by a project "fingerprint". Changing
 * files in patches/ does NOT change the fingerprint, so EAS serves the same cached
 * binary even after patch changes. React.framework UUID was identical across builds
 * 44, 45, and 46 because the fingerprint never changed.
 *
 * HOW THIS FIXES IT:
 * A plugin registered in app.config.js IS part of the EAS fingerprint. Adding this
 * plugin changes the fingerprint → EAS compiles fresh → npm postinstall runs
 * patch-package → RCTTurboModule.mm gets patched → new binary compiled with fix.
 *
 * THE ACTUAL FIX (in patches/react-native+0.81.5.patch):
 * In RCTTurboModule.mm, two async void method @catch blocks were rethrowing
 * NSExceptions as C++ exceptions on background dispatch queues. With no handler
 * in the async context, this triggers std::terminate → SIGABRT on iOS 26+.
 * The patch replaces both throws with NSLog statements.
 */
const { withInfoPlist } = require('@expo/config-plugins');

module.exports = function withTurboModuleFix(config) {
  return withInfoPlist(config, (config) => {
    // Adds a marker to Info.plist to indicate the iOS 26 TurboModule fix is active.
    // This key is unknown to iOS and is harmlessly ignored at runtime.
    // Its presence here ensures the EAS fingerprint changes when this plugin is added/updated,
    // forcing a fresh native compilation that picks up the patch-package fix.
    config.modResults['RCTTurboModuleFixVersion'] = '9';
    return config;
  });
};
