import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
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

// SplashScreen.preventAutoHideAsync() removed - testing if this native call causes iOS 26 crash

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { GlowOverlay } = useGlow();
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState(false);

  useEffect(() => {
    // Check if user has already verified their age.
    // Do NOT block Stack rendering on this check — if AsyncStorage hangs
    // (e.g. on iOS 26 with TurboModule exception swallowing), returning null
    // here prevents expo-router navigation from ever initialising and the
    // splash screen never hides. The AgeVerificationGate is a Modal that
    // can appear on top of the rendered Stack once the check resolves.
    const timeout = setTimeout(() => {
      // Fallback: if AsyncStorage hasn't responded in 3s, show the gate.
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

// Diagnostic error boundary that always shows errors visually (even in production)
class DiagnosticBoundary extends React.Component<
  { name: string; children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#ff0000', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold' }}>
            Error in: {this.props.name}
          </Text>
          <Text style={{ color: '#ffffff', fontSize: 14, marginTop: 10 }}>
            {this.state.error.message}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  // Splash is hidden by the native stage-based auto-hide in RCTSurfaceHostingView._updateViews
  // when the surface transitions to "running" (React content ready). No explicit JS call needed.

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Global error caught:', error, errorInfo);
  };

  return (
    <DiagnosticBoundary name="Root">
      <ErrorBoundary onError={handleError}>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <DiagnosticBoundary name="AuthProvider">
              <AuthProvider>
                <DiagnosticBoundary name="ChatProvider">
                  <ChatProvider>
                    <DiagnosticBoundary name="ToastProvider">
                      <ToastProvider>
                        <DiagnosticBoundary name="NetworkProvider">
                          <NetworkProvider>
                            <DiagnosticBoundary name="AppStateProvider">
                              <AppStateProvider>
                                <DiagnosticBoundary name="GlowProvider">
                                  <GlowProvider>
                                    <DiagnosticBoundary name="InnerProviders">
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
                                    </DiagnosticBoundary>
                                  </GlowProvider>
                                </DiagnosticBoundary>
                              </AppStateProvider>
                            </DiagnosticBoundary>
                          </NetworkProvider>
                        </DiagnosticBoundary>
                      </ToastProvider>
                    </DiagnosticBoundary>
                  </ChatProvider>
                </DiagnosticBoundary>
              </AuthProvider>
            </DiagnosticBoundary>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </DiagnosticBoundary>
  );
}
