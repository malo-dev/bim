import { Stack } from "expo-router";
import React from "react";

export default function LivreurLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="apply" />
      <Stack.Screen name="space" />
    </Stack>
  );
}
