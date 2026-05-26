import { Stack } from "expo-router";
import React from "react";

export default function CompanyPortalLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="orders" />
    </Stack>
  );
}
