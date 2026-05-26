import { Stack } from "expo-router";
import React from "react";

export default function SupermarcheLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" />
      <Stack.Screen name="cart" />
      <Stack.Screen name="order-tracking" />
      <Stack.Screen name="my-orders" />
    </Stack>
  );
}
