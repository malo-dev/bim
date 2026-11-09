import { Stack } from "expo-router";
import React from "react";
import { BimBackground } from "@/components/bim/ui";

/** Espace gestion : fond du thème BIM NEXT derrière toutes les pages, fondu entre les pages. */
export default function GestionLayout() {
  return (
    <BimBackground enter={false}>
      <Stack screenOptions={{ headerShown: false, animation: "fade", animationDuration: 260, contentStyle: { backgroundColor: "transparent" } }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="home" />
        <Stack.Screen name="orders" />
        <Stack.Screen name="users" />
      </Stack>
    </BimBackground>
  );
}
