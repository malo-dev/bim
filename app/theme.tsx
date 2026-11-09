/**
 * Couleurs de l'app : page dédiée au choix du thème (ouverte depuis Profil et Réglages).
 * Aperçu en direct en haut, puis les 8 thèmes ; le choix s'applique tout de suite.
 */
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BimIcon } from "@/components/bim/icons";
import { useTh } from "@/components/bim/theme";
import { Appear, BimBackground, Glass, Header, SectionLabel, T, ThemeList } from "@/components/bim/ui";

export default function ThemeScreen() {
  const th = useTh();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <BimBackground>
      <ScrollView contentContainerStyle={{ paddingTop: 28 + insets.top, paddingHorizontal: 20, paddingBottom: 40 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <Header title="Couleurs de l'app" backLabel="Retour au profil" onBack={() => router.back()} />

        <Appear kind="rise" delay={60}>
          <T style={{ marginTop: 22 }}><T w="light" size={30} style={{ lineHeight: 35 }}>Choisis{"\n"}</T><T w="bold" size={30} style={{ lineHeight: 35 }}>ton thème</T></T>
          <T size={14} color={th.muted} style={{ marginTop: 8, lineHeight: 21 }}>Le thème s'applique tout de suite à toute l'application.</T>
        </Appear>

        <Appear kind="rise" delay={120}>
          <Glass a={0.14} b={0.22} radius={22} style={{ marginTop: 18, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: th.ink, alignItems: "center", justifyContent: "center" }}>
              <BimIcon name="drop" size={22} color={th.onInk} strokeWidth={1.7} />
            </View>
            <View style={{ flex: 1 }}>
              <T size={12} color={th.muted}>Aperçu · {th.name}</T>
              <T w="bold" size={22}>19.00 <T w="light" size={13}>EC</T></T>
            </View>
            <View style={{ height: 34, paddingHorizontal: 14, borderRadius: 17, backgroundColor: th.accent, justifyContent: "center" }}>
              <T w="bold" size={13} color={th.onAccent}>+ Recharger</T>
            </View>
          </Glass>
        </Appear>

        <Appear kind="rise" delay={180}>
          <SectionLabel style={{ marginTop: 20 }}>TOUS LES THÈMES</SectionLabel>
          <ThemeList />
        </Appear>
      </ScrollView>
    </BimBackground>
  );
}
