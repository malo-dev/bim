import { Stack } from "expo-router";
import React from "react";

export default function ServiceLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // désactive le header natif
      }}
    >
      <Stack.Screen name="[id]" options={{ headerShown: false }} /> {/* <- chaque page du dossier */}
    </Stack>
  );
}
