/**
 * Espace chauffeur — code d'accès (design BIM NEXT) : code personnel à 6 chiffres donné par BIM.
 * Même logique : chauffeurAccess(code) → session → /transport/mode-chauffeur.
 */
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Alert, DeviceEventEmitter, Pressable, TextInput, View } from "react-native";
import { useTh } from "@/components/bim/theme";
import { Appear, BimPage, SlideButton, StaffHero, T } from "@/components/bim/ui";
import { useChauffeurAccessMutation } from "@/services/chauffeurService";
import { persistAuthSession } from "@/utils/authSession.utils";

export default function ChauffeurAccessScreen() {
  const th = useTh();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [focus, setFocus] = useState(true);
  const ref = useRef<any>(null);
  const [chauffeurAccess, { isLoading }] = useChauffeurAccessMutation();

  const submit = async () => {
    if (code.trim().length < 4) { Alert.alert("Code invalide", "Entre le code à 6 chiffres donné par l'administration BIM."); return; }
    try {
      const res: any = await chauffeurAccess(code.trim()).unwrap();
      await persistAuthSession(res.token, res.refreshToken, { isQuickAccount: false });
      DeviceEventEmitter.emit("auth:loggedIn");
      router.replace("/transport/mode-chauffeur" as any);
    } catch (err: any) {
      Alert.alert("Accès refusé", err?.data?.message || "Code d'accès invalide.");
    }
  };

  const slots = Array.from({ length: 6 });
  return (
    <BimPage title="Espace chauffeur">
      <StaffHero icon="car" badge="Chauffeur" title="Code d'accès" text="Entre le code personnel donné par l'administration BIM pour ouvrir ton espace chauffeur." />
      <Appear kind="rise" delay={140}>
        <Pressable onPress={() => ref.current?.focus()} accessibilityLabel="Code d'accès" style={{ marginTop: 26, flexDirection: "row", justifyContent: "center", gap: 10 }}>
          {slots.map((_, i) => {
            const filled = i < code.length; const active = focus && i === Math.min(code.length, 5);
            return (
              <View key={i} style={{ width: 46, height: 58, borderRadius: 16, alignItems: "center", justifyContent: "center",
                backgroundColor: th.glassFill(filled ? 0.2 : 0.12), borderWidth: active ? 2 : 1, borderColor: active ? th.fg : th.glass(0.24), boxShadow: th.glassFx }}>
                {filled && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: th.fg }} />}
              </View>
            );
          })}
          <TextInput ref={ref} value={code} onChangeText={(v) => setCode(v.replace(/[^0-9]/g, "").slice(0, 6))} keyboardType="number-pad" maxLength={6} autoFocus
            onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} caretHidden style={{ position: "absolute", opacity: 0, width: 1, height: 1 }} />
        </Pressable>
        <T size={12} color={th.muted} style={{ marginTop: 12, textAlign: "center" }}>{code.length}/6 chiffres</T>
      </Appear>
      <View style={{ marginTop: "auto", paddingTop: 24 }}>
        <SlideButton variant="accent" loading={isLoading} label="Accéder à mon espace" icon="car" onDone={submit} />
      </View>
    </BimPage>
  );
}
