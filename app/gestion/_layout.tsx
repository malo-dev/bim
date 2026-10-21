import { Stack } from "expo-router";
import React from "react";

export default function GestionLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="home" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="users" />
    </Stack>
  );
}
