import { Stack } from "expo-router";
import React from "react";

export default function GazLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
      <Stack.Screen name="product" options={{ headerShown: false }} />
    </Stack>
  );
}
