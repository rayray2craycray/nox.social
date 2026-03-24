import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Slot } from "expo-router";

// BUILD 87 — MINIMAL DIAGNOSTIC
// If this bright green screen is visible, React is rendering.
// If still black, the issue is in the native layer (splash/surface transition).

export default function RootLayout() {
  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>NOX BUILD 87 — REACT IS ALIVE</Text>
      </View>
      <View style={styles.content}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00ff00',
  },
  banner: {
    backgroundColor: '#ff0000',
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  bannerText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
