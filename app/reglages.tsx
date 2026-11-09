/**
 * Réglages — toutes les pages de l'app qui ne sont pas dans la maquette.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BimIconName } from "@/components/bim/icons";
import { useTh } from "@/components/bim/theme";
import { Appear, BimBackground, Glass, Header, MenuRow, SectionLabel, T } from "@/components/bim/ui";
import { useGetUserByIdQuery } from "@/services/userService";

type Item = { icon: BimIconName; label: string; to: string; show?: boolean };

export default function Reglages() {
  const th = useTh();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => { AsyncStorage.getItem("userId").then(setUserId); }, []);
  const { data: user } = useGetUserByIdQuery(userId!, { skip: !userId });

  const groups: { title: string; items: Item[] }[] = [
    { title: "MON COMPTE", items: [
      { icon: "user", label: "Modifier mon profil", to: "/profile" },
      { icon: "lock", label: "Sécurité et mot de passe", to: "/securiser-compte" },
      { icon: "settings", label: "Langue et réglages avancés", to: "/(tabs)/params" },
    ] },
    { title: "MON ARGENT", items: [
      { icon: "wallet", label: "Mon solde", to: "/solde" },
      { icon: "clock", label: "Historique des transactions", to: "/history" },
      { icon: "download", label: "Retrait", to: "/retrait" },
      { icon: "qr", label: "Recevoir de l'argent", to: "/receive" },
      { icon: "recharge", label: "Payer un partenaire", to: "/payment" },
    ] },
    { title: "MES ACTIVITÉS", items: [
      { icon: "box", label: "Mes commandes", to: "/commandes" },
      { icon: "car", label: "Mes courses en taxi", to: "/transport/historique" },
      { icon: "heart", label: "Mes favoris", to: "/favorites" },
    ] },
    { title: "RÉSEAU BIM", items: [
      { icon: "seat", label: "Mon réseau", to: "/(tabs)/reseaux" },
      { icon: "tag", label: "Mes statistiques", to: "/(tabs)/stats" },
      { icon: "doc", label: "Formation", to: "/formation" },
      { icon: "shield", label: "BIM SOS", to: "/bim-sos" },
      { icon: "sparkle", label: "Espace agent", to: "/agent-dashboard", show: !!user?.isAgent },
    ] },
    { title: "AIDE", items: [
      { icon: "help", label: "Aide et support", to: "/support" },
      { icon: "message", label: "Questions fréquentes", to: "/faqs" },
      { icon: "info", label: "À propos de BIM NEXT", to: "/apropos" },
      { icon: "doc", label: "Conditions d'utilisation", to: "/terms" },
    ] },
  ];

  return (
    <BimBackground>
      <ScrollView contentContainerStyle={{ paddingTop: 28 + insets.top, paddingHorizontal: 20, paddingBottom: 40 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <Header title="Réglages" onBack={() => router.back()} />
        <Appear kind="rise" delay={40}>
          <SectionLabel style={{ marginTop: 18 }}>APPARENCE</SectionLabel>
          <Glass a={0.12} b={0.2} radius={22} style={{ marginTop: 8, overflow: "hidden" }}>
            <MenuRow icon="palette" label="Couleurs de l'app" value={th.name} onPress={() => router.push("/theme" as any)} last />
          </Glass>
        </Appear>
        {groups.map((g, gi) => {
          const items = g.items.filter((i) => i.show !== false);
          return (
            <Appear key={g.title} kind="rise" delay={110 + gi * 70}>
              <SectionLabel style={{ marginTop: 18 }}>{g.title}</SectionLabel>
              <Glass a={0.12} b={0.2} radius={22} style={{ marginTop: 8, overflow: "hidden" }}>
                {items.map((it, i) => (
                  <MenuRow key={it.to} icon={it.icon} label={it.label} onPress={() => router.push(it.to as any)} last={i === items.length - 1} />
                ))}
              </Glass>
            </Appear>
          );
        })}
        <View style={{ marginTop: 22, alignItems: "center" }}>
          <T size={12} color={th.muted}>BIM NEXT · Eau, gaz, carburant et taxi</T>
        </View>
      </ScrollView>
    </BimBackground>
  );
}
