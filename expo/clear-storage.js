// Run this in browser console to clear all AsyncStorage
// Copy and paste this entire script into the browser console

(async () => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;

    const keys = await AsyncStorage.getAllKeys();
    console.log('Found keys:', keys);

    await AsyncStorage.multiRemove(keys);
    console.log('✅ Cleared all AsyncStorage!');
    console.log('Please refresh the page now.');
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
})();
