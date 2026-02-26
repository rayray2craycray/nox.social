import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppStateProvider, DiscoveryProvider } from "@/contexts/AppStateContext";
import { PerformerProvider } from "@/contexts/PerformerContext";
import { SocialProvider } from "@/contexts/SocialContext";
import { FeedProvider } from "@/contexts/FeedContext";
import { POSProvider } from "@/contexts/POSContext";
import { GlowProvider, useGlow } from "@/contexts/GlowContext";
import { GrowthProvider } from "@/contexts/GrowthContext";
import { EventsProvider } from "@/contexts/EventsContext";
import { ContentProvider } from "@/contexts/ContentContext";
import { MonetizationProvider } from "@/contexts/MonetizationContext";
import { RetentionProvider } from "@/contexts/RetentionContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { VenueManagementProvider } from "@/contexts/VenueManagementContext";
import { ModerationProvider } from "@/contexts/ModerationContext";
import { UploadProvider } from "@/contexts/UploadContext";
import { ToastProvider } from "@/contexts/ToastNotificationContext";
import { NetworkProvider } from "@/contexts/NetworkContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import AgeVerificationGate from "@/components/AgeVerificationGate";
import { initSentry, captureException } from "@/config/sentry";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { GlowOverlay } = useGlow();
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [isCheckingAge, setIsCheckingAge] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAgeVerification = async () => {
      try {
        // Check if user has already verified their age
        const verified = await AsyncStorage.getItem('age_verified');

        if (!isMounted) return;

        const hasVerified = verified === 'true';
        setIsAgeVerified(hasVerified);
        setShowAgeGate(!hasVerified);
      } catch (error) {
        console.error('Failed to load age verification status', error);
        // Fail-safe: show the age gate instead of a blank screen
        if (!isMounted) return;
        setIsAgeVerified(false);
        setShowAgeGate(true);
      } finally {
        if (isMounted) {
          setIsCheckingAge(false);
        }
      }
    };

    checkAgeVerification();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAgeVerified = async (dateOfBirth: Date) => {
    await AsyncStorage.setItem('age_verified', 'true');
    await AsyncStorage.setItem('date_of_birth', dateOfBirth.toISOString());
    setIsAgeVerified(true);
    setShowAgeGate(false);
  };

  // Hide the splash screen only after the age check resolves, so the splash
  // stays visible during the async check and there is no black screen flash.
  useEffect(() => {
    if (!isCheckingAge) {
      SplashScreen.hideAsync();
    }
  }, [isCheckingAge]);

  // Keep returning null while checking — splash screen is still covering the screen
  if (isCheckingAge) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerBackTitle: "Back" }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="create-account" options={{ headerShown: false }} />
        <Stack.Screen name="auth/sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="auth/sign-up" options={{ headerShown: false }} />
        <Stack.Screen name="auth/forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="community-guidelines" options={{ headerShown: false }} />
        <Stack.Screen name="blocked-users" options={{ headerShown: false }} />
        <Stack.Screen name="management" options={{ headerShown: false }} />
      </Stack>
      <GlowOverlay />
      <OfflineBanner />
      <AgeVerificationGate
        visible={showAgeGate}
        onVerified={handleAgeVerified}
      />
    </>
  );
}

export default function RootLayout() {
  // Defer Sentry initialization to after React mounts — calling it at module
  // load time caused TurboModule void-method crashes on startup.
  useEffect(() => {
    initSentry();
  }, []);

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Send error to Sentry
    captureException(error, {
      errorInfo: errorInfo.componentStack,
      errorBoundary: 'GlobalErrorBoundary',
    });
    console.error('Global error caught:', error, errorInfo);
  };

  return (
    <ErrorBoundary onError={handleError}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthProvider>
            <ChatProvider>
              <ToastProvider>
                <NetworkProvider>
                  <AppStateProvider>
                <GlowProvider>
                  <POSProvider>
                    <UploadProvider>
                      <ModerationProvider>
                      <SocialProvider>
                        <GrowthProvider>
                          <EventsProvider>
                            <ContentProvider>
                              <MonetizationProvider>
                                <RetentionProvider>
                                  <VenueManagementProvider>
                                    <FeedProvider>
                                      <DiscoveryProvider>
                                        <PerformerProvider>
                                          <RootLayoutNav />
                                        </PerformerProvider>
                                      </DiscoveryProvider>
                                    </FeedProvider>
                                  </VenueManagementProvider>
                                </RetentionProvider>
                              </MonetizationProvider>
                            </ContentProvider>
                          </EventsProvider>
                        </GrowthProvider>
                      </SocialProvider>
                      </ModerationProvider>
                    </UploadProvider>
                  </POSProvider>
                </GlowProvider>
                  </AppStateProvider>
                </NetworkProvider>
              </ToastProvider>
            </ChatProvider>
          </AuthProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
