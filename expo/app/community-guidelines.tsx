import { Stack } from "expo-router";
import CommunityGuidelines from "@/components/CommunityGuidelines";

/**
 * Community Guidelines Screen
 * Displays comprehensive community standards and policies
 */
export default function CommunityGuidelinesScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Community Guidelines",
          headerShown: true,
          headerStyle: {
            backgroundColor: "#0a0a0f",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "700",
          },
        }}
      />
      <CommunityGuidelines />
    </>
  );
}
