/**
 * Suivi d'une commande précise (depuis « Mes commandes » ou l'accueil).
 */
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { OrderTracking } from "@/components/bim/orders";
import { BimBackground } from "@/components/bim/ui";

export default function SuiviCommande() {
  const router = useRouter();
  const { orderNumber } = useLocalSearchParams<{ orderNumber: string }>();
  const back = () => (router.canGoBack() ? router.back() : router.replace("/commandes" as any));
  return (
    <BimBackground>
      <OrderTracking orderNumber={String(orderNumber)} backLabel="Retour à mes commandes" onHome={back}
        onAll={() => router.replace("/commandes" as any)} onRestart={() => router.replace("/(tabs)" as any)} />
    </BimBackground>
  );
}
