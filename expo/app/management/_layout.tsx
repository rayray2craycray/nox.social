import { Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Building2 } from 'lucide-react-native';
import { useAppState } from '@/contexts/AppStateContext';

export default function ManagementLayout() {
  const { profile } = useAppState();
  const router = useRouter();

  useEffect(() => {
    if (profile.role !== 'VENUE') {
      router.replace('/feed');
    }
  }, [profile.role, router]);

  if (profile.role !== 'VENUE') {
    return (
      <View style={styles.accessDeniedContainer}>
        <LinearGradient
          colors={['#ff006e', '#8338ec'] as [string, string, ...string[]]}
          style={styles.accessDeniedIconContainer}
        >
          <Building2 size={48} color="#ffffff" strokeWidth={2.5} />
        </LinearGradient>
        <Text style={styles.accessDeniedTitle}>Venue Access Only</Text>
        <Text style={styles.accessDeniedText}>
          The Management Dashboard is exclusively for venue owners and managers.
          Please sign in with a venue account to access these features.
        </Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0a0a0f',
        },
        headerTintColor: '#ff0080',
        headerTitleStyle: {
          fontWeight: '700' as const,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Management Dashboard',
          headerShown: true,
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="rules-engine"
        options={{
          title: 'Rules Engine',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="server-command"
        options={{
          title: 'Server Command Center',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="talent-booking"
        options={{
          title: 'Talent Booking',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="analytics"
        options={{
          title: 'Analytics & ROI',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="toast-integration"
        options={{
          title: 'Toast POS Integration',
          headerShown: true,
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#0a0a0f',
  },
  accessDeniedIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  accessDeniedText: {
    fontSize: 15,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 22,
  },
});
