import { Stack } from "expo-router";
import React from "react";

export default function TRansportLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // désactive le header natif
      }}
    >
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
      <Stack.Screen name="choix-gamme" options={{ headerShown: false }} />
      <Stack.Screen name="choix-chauffeur" options={{ headerShown: false }} />
      <Stack.Screen name="suivi" options={{ headerShown: false }} />
      <Stack.Screen name="fin-course" options={{ headerShown: false }} />
      <Stack.Screen name="historique" options={{ headerShown: false }} />
      <Stack.Screen name="mode-chauffeur" options={{ headerShown: false }} />
      <Stack.Screen name="course-en-cours" options={{ headerShown: false }} />
    </Stack>
  );
}
