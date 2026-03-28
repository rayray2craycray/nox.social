# Fix Google Places API Error

## Error Message
```
You're calling a legacy API, which is not enabled for your project.
To get newer features and more functionality, switch to the Places API (New)
```

## Quick Fix: Enable Legacy Places API

1. Go to: https://console.cloud.google.com/apis/library
2. Search for: **"Places API"** (NOT "Places API (New)")
3. Click on **Places API**
4. Click **Enable**
5. Wait 30 seconds for activation

## Alternative: The app is now configured to work with the legacy API.

If you want to use the NEW Places API instead, we'd need to rewrite the places.service.ts file to use the new endpoints and format.

## After Enabling

1. Restart Expo: `npx expo start --clear`
2. Open Discovery tab
3. Venues should now load!

## Verify in Google Cloud Console

Go to: https://console.cloud.google.com/apis/dashboard

You should see:
- ✅ Places API (enabled)
- ✅ Places API (New) (optional)
