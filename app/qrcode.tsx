/**
 * Mon QR Code (maquette) — le vendeur le scanne pour encaisser, même sans data.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BimIcon } from "@/components/bim/icons";
import { F, useTh } from "@/components/bim/theme";
import { Appear, BimBackground, Glass, Glow, Header, ScanLine, SectionLabel, T } from "@/components/bim/ui";
import { useGetUserByIdQuery } from "@/services/userService";
import { Text } from "react-native";

export default function MonQrScreen() {
  const th = useTh();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => { AsyncStorage.getItem("userId").then(setUserId); }, []);
  const { data: user } = useGetUserByIdQuery(userId!, { skip: !userId });
  const value = user ? JSON.stringify({ userId: user.id, accountNumber: user.accountNumber }) : null;

  return (
    <BimBackground>
      <Glow top={120} size={460} opacity={0.2} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: "center", paddingTop: 28 + insets.top, paddingHorizontal: 20, paddingBottom: 40 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <View style={{ alignSelf: "stretch" }}>
          <Header title="Mon QR Code" backLabel="Retour à l'accueil" onBack={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)" as any))} />
        </View>

        <Appear kind="rise" delay={60}>
          <View style={{ marginTop: 30, flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, backgroundColor: th.glassFill(0.16), borderWidth: 1, borderColor: th.glass(0.22), boxShadow: th.glassFx }}>
            <BimIcon name="wifiOff" size={15} color={th.fg} strokeWidth={2} />
            <T size={13}>Fonctionne sans internet</T>
          </View>
        </Appear>

        <Appear kind="pop" delay={140}>
          <View style={{ marginTop: 26, width: 296, height: 296, padding: 28, borderRadius: 30, backgroundColor: "#FFFFFF",
            boxShadow: "0 24px 50px rgba(0,0,0,0.3)" }} accessibilityLabel="QR code de paiement BIMNEXT">
            <View style={{ width: 240, height: 240, alignItems: "center", justifyContent: "center" }}>
              {value ? <QRCode value={value} size={240} color="#1E2125" backgroundColor="#FFFFFF" ecl="H" /> : <ActivityIndicator color="#1E2125" />}
            </View>
            <ScanLine travel={236} inset={20} top={28} />
            <View style={{ position: "absolute", top: "50%", left: "50%", width: 46, height: 46, marginTop: -23, marginLeft: -23, borderRadius: 13, backgroundColor: th.ink,
              borderWidth: 4, borderColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontFamily: F.bold, fontSize: 19, color: th.onInk }}>B<Text style={{ color: th.dot }}>.</Text></Text>
            </View>
          </View>
        </Appear>

        <Appear kind="rise" delay={240} style={{ alignItems: "center" }}>
          <T size={13} color={th.muted} style={{ marginTop: 24 }}>Identifiant membre</T>
          <T w="bold" size={22} style={{ marginTop: 4, letterSpacing: 0.9 }} selectable>{user?.accountNumber ?? "…"}</T>
          <T size={14} color={th.muted} style={{ marginTop: 12, maxWidth: 300, textAlign: "center", lineHeight: 21 }}>
            Montre ce code au vendeur. Il le scanne avec son app BIMNEXT : tu n'as pas besoin de data.
          </T>
        </Appear>

        <Appear kind="fade" delay={340} style={{ alignSelf: "stretch", marginTop: "auto", paddingTop: 30 }}>
          <SectionLabel>ACCEPTÉ CHEZ</SectionLabel>
          <View style={{ marginTop: 10, flexDirection: "row", gap: 10 }}>
            {["Citadelle", "TRILEX"].map((n) => (
              <Glass key={n} a={0.14} b={0.2} radius={26} style={{ flex: 1, height: 52, alignItems: "center", justifyContent: "center" }}><T w="bold" size={14}>{n}</T></Glass>
            ))}
            <Glass a={0.14} b={0.2} radius={26} style={{ flex: 1, height: 52, alignItems: "center", justifyContent: "center" }}><T size={14} color={th.muted}>+ autres</T></Glass>
          </View>
        </Appear>
      </ScrollView>
    </BimBackground>
  );
}
