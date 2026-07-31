import { Stack } from "expo-router";
import React from "react";

export default function CarburantProductLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[productId]" options={{ headerShown: false }} />
    </Stack>
  );
}
