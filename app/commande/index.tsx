/**
 * Commander — étape 1 : « Qu'est-ce que tu aimerais commander ? » (Gaz, Eau, Carburant).
 * Le choix ouvre la liste des produits de la catégorie (/commande/[type]) et le parcours continue.
 */
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BimIcon, BimIconName } from "@/components/bim/icons";
import { fallbackArt } from "@/components/bim/illustrations";
import { BimType, TYPE_META, useTh } from "@/components/bim/theme";
import { Appear, BimBackground, Glow, Header, PressScale, ProductArt, SectionLabel, Swap, T } from "@/components/bim/ui";

const CHOICES: { type: BimType; icon: BimIconName; text: string; art: string }[] = [
  { type: "gaz", icon: "flame", text: "Recharge ou bouteille neuve, livrée chez toi.", art: "bouteille 12 kg" },
  { type: "eau", icon: "drop", text: "Bonbonnes, packs et sachets livrés à domicile.", art: "bonbonne 20 l" },
  { type: "carburant", icon: "pump", text: "Essence et gasoil, moins cher chez TRILEX.", art: "essence" },
];

export default function CommanderChoix() {
  const th = useTh();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <BimBackground>
      <Glow top={80} opacity={0.16} />
      <ScrollView contentContainerStyle={{ paddingTop: 28 + insets.top, paddingHorizontal: 22, paddingBottom: 40 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <Header title="Commander" backLabel="Retour à l'accueil" onBack={() => router.back()} />

        <Appear kind="rise" delay={60}>
          <T style={{ marginTop: 26 }}><T w="light" size={32} style={{ lineHeight: 37 }}>Qu'est-ce que tu{"\n"}</T><T w="bold" size={32} style={{ lineHeight: 37 }}>aimerais commander ?</T></T>
          <T size={15} color={th.muted} style={{ marginTop: 8, lineHeight: 22 }}>Choisis une catégorie pour voir tous ses produits.</T>
        </Appear>

        <View style={{ marginTop: 22, gap: 12 }}>
          {CHOICES.map((c, i) => (
            <Appear key={c.type} kind="page" delay={140 + i * 90}>
              <PressScale scaleTo={0.97} onPress={() => router.push(`/commande/${c.type}` as any)} accessibilityLabel={`Commander : ${TYPE_META[c.type].title}`}
                style={{ minHeight: 112, borderRadius: 28, backgroundColor: th.glassFill(0.14), borderWidth: 1, borderColor: th.glass(0.2), boxShadow: th.glassFx,
                  flexDirection: "row", alignItems: "center", gap: 14, paddingLeft: 12, paddingRight: 18, paddingVertical: 12, overflow: "hidden" }}>
                <View style={{ width: 88, height: 88, borderRadius: 24, backgroundColor: th.glass(0.14), alignItems: "center", justifyContent: "center" }}>
                  <ProductArt xml={fallbackArt(c.type, c.art)} size={80} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <BimIcon name={c.icon} size={18} color={th.fg} strokeWidth={2} />
                    <T w="bold" size={20} style={{ letterSpacing: 0.6 }}>{TYPE_META[c.type].label}</T>
                  </View>
                  <T size={13} color={th.muted} style={{ marginTop: 4, lineHeight: 19 }}>{c.text}</T>
                </View>
                <Swap><T size={15} color={th.muted} style={{ letterSpacing: 2 }}>›››</T></Swap>
              </PressScale>
            </Appear>
          ))}
        </View>

        {/* Autres produits disponibles chez BIM NEXT (même parcours de commande) */}
        <Appear kind="rise" delay={440}>
          <SectionLabel style={{ marginTop: 26 }}>AUTRES PRODUITS</SectionLabel>
          <PressScale scaleTo={0.97} onPress={() => router.push("/commande/autres" as any)} accessibilityLabel="Voir les autres produits disponibles"
            style={{ marginTop: 10, minHeight: 96, borderRadius: 28, backgroundColor: th.accent, flexDirection: "row", alignItems: "center", gap: 14,
              paddingLeft: 12, paddingRight: 18, paddingVertical: 12, overflow: "hidden", boxShadow: th.glassFx }}>
            <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: th.ink, alignItems: "center", justifyContent: "center" }}>
              <BimIcon name="box" size={30} color={th.onInk} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <T w="bold" size={18} color={th.onAccent} style={{ letterSpacing: 0.4 }}>Tous nos autres produits</T>
              <T size={13} color={th.onAccent} style={{ marginTop: 4, lineHeight: 19, opacity: 0.75 }}>Rangés par catégorie, livrés et payés comme le reste.</T>
            </View>
            <T w="bold" size={15} color={th.onAccent} style={{ letterSpacing: 2 }}>›››</T>
          </PressScale>
        </Appear>
      </ScrollView>
    </BimBackground>
  );
}
