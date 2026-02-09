import { Stack } from "expo-router";
import React from "react";

export default function SanteLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="[id]" options={{ headerShown: false }} /> {/* <- chaque page du dossier */}
    </Stack>
  );
}
