import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
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

// No SplashScreen.preventAutoHideAsync() — splash is hidden by the native
// stage-based auto-hide in RCTSurfaceHostingView._updateViews when the surface
// transitions to "running" (React content ready). No explicit JS call needed.

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { GlowOverlay } = useGlow();
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState(false);

  useEffect(() => {
    // Do NOT block Stack rendering on this check — if AsyncStorage hangs
    // (e.g. on iOS 26 with TurboModule exception swallowing), returning null
    // here prevents expo-router navigation from ever initialising and the
    // splash screen never hides. The AgeVerificationGate is a Modal that
    // can appear on top of the rendered Stack once the check resolves.
    const timeout = setTimeout(() => {
      setShowAgeGate(true);
    }, 3000);

    AsyncStorage.getItem('age_verified').then((verified) => {
      clearTimeout(timeout);
      setIsAgeVerified(verified === 'true');
      setShowAgeGate(verified !== 'true');
    }).catch(() => {
      clearTimeout(timeout);
      setShowAgeGate(true);
    });

    return () => clearTimeout(timeout);
  }, []);

  const handleAgeVerified = async (dateOfBirth: Date) => {
    await AsyncStorage.setItem('age_verified', 'true');
    await AsyncStorage.setItem('date_of_birth', dateOfBirth.toISOString());
    setIsAgeVerified(true);
    setShowAgeGate(false);
  };

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
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
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
