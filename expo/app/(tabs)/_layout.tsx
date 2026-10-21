import { Tabs } from "expo-router";
import { Flame, MapPin, MessageCircle, User, Sparkles } from "lucide-react-native";
import React from "react";
import { Platform } from "react-native";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { FEATURE_FLAGS } from "@/constants/app";

const COLORS = {
  background: '#000000',
  tabBar: '#1a1a1a',
  active: '#ff0080',
  inactive: '#666680',
};

export default function TabLayout() {
  // Register the Expo push token once authenticated. Lives here (not in the
  // root layout) so the expo-notifications native calls fire only after
  // navigation into the main app — native calls during root startup are the
  // TurboModule crash pattern from builds 55/57/75.
  usePushNotifications();

  return (
    <Tabs
      initialRouteName="discovery"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.active,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarStyle: {
          backgroundColor: COLORS.tabBar,
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          paddingHorizontal: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600' as const,
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      {/* Map is the home tab for v1. */}
      <Tabs.Screen
        name="discovery"
        options={{
          title: "Map",
          tabBarIcon: ({ color }) => <MapPin color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="servers"
        options={{
          title: "Chat",
          tabBarIcon: ({ color }) => <MessageCircle color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User color={color} size={22} />,
        }}
      />
      {/* Deferred post-launch — kept as routes (href:null hides the tab) so any
          lingering links don't crash, but they're off the tab bar for v1. */}
      <Tabs.Screen
        name="feed"
        options={{
          title: "Feed",
          href: FEATURE_FLAGS.FEED ? undefined : null,
          tabBarIcon: ({ color }) => <Flame color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="studio"
        options={{
          title: "Studio",
          href: FEATURE_FLAGS.STUDIO ? undefined : null,
          tabBarIcon: ({ color }) => <Sparkles color={color} size={22} />,
        }}
      />
    </Tabs>
  );
}
