import { Stack } from "expo-router";
import React from "react";
import { BimBackground } from "@/components/bim/ui";

/** Taxi + espace chauffeur : fond du thème BIM NEXT derrière les pages (celles qui ont leur propre fond le gardent). */
export default function TransportLayout() {
  return (
    <BimBackground enter={false}>
      <Stack screenOptions={{ headerShown: false, animation: "fade", animationDuration: 260, contentStyle: { backgroundColor: "transparent" } }}>
        <Stack.Screen name="[id]" />
        <Stack.Screen name="choix-gamme" />
        <Stack.Screen name="choix-chauffeur" />
        <Stack.Screen name="suivi" />
        <Stack.Screen name="fin-course" />
        <Stack.Screen name="historique" />
        <Stack.Screen name="mode-chauffeur" />
        <Stack.Screen name="course-en-cours" />
        <Stack.Screen name="chauffeur-access" />
      </Stack>
    </BimBackground>
  );
}
