import { Stack } from "expo-router";
import React from "react";
import { BimBackground } from "@/components/bim/ui";

/** Espace livreur : fond du thème BIM NEXT derrière toutes les pages, fondu entre les pages. */
export default function LivreurLayout() {
  return (
    <BimBackground enter={false}>
      <Stack screenOptions={{ headerShown: false, animation: "fade", animationDuration: 260, contentStyle: { backgroundColor: "transparent" } }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="apply" />
        <Stack.Screen name="space" />
      </Stack>
    </BimBackground>
  );
}
