/**
 * Espace gestion — connexion (design BIM NEXT). Réservé aux comptes rôle « BIM ».
 * Même logique : login { email, password } → rôle BIM obligatoire → session → /gestion/home.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import React, { useState } from "react";
import { Alert, DeviceEventEmitter, View } from "react-native";
import { BimIcon } from "@/components/bim/icons";
import { useTh } from "@/components/bim/theme";
import { Appear, BimPage, Glass, SlideButton, StaffHero, T, TextField } from "@/components/bim/ui";
import { useLoginMutation } from "@/services/authService";

export default function GestionLoginScreen() {
  const th = useTh();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, { isLoading }] = useLoginMutation();

  const submit = async () => {
    if (!email.trim() || !password) { Alert.alert("Champs requis", "Entre ton e-mail et ton mot de passe administrateur."); return; }
    try {
      const res: any = await login({ email: email.trim().toLowerCase(), password }).unwrap();
      if (res.role !== "BIM") { Alert.alert("Accès refusé", "Ce compte n'a pas accès à l'espace gestion."); return; }
      await AsyncStorage.multiSet([["token", res.token], ["refreshToken", res.refreshToken], ["lastActivity", String(Date.now())], ["accountType", "traditional"]]);
      const decoded: any = jwtDecode(res.token);
      await AsyncStorage.multiSet([["userId", String(decoded?.userId)], ["email", decoded?.email ?? ""]]);
      DeviceEventEmitter.emit("auth:loggedIn");
      router.replace("/gestion/home" as any);
    } catch (err: any) {
      Alert.alert("Connexion impossible", err?.data?.message || "E-mail ou mot de passe incorrect.");
    }
  };

  return (
    <BimPage title="Espace gestion">
      <StaffHero icon="shield" badge="Administration" title="Connexion admin" text="Connexion réservée aux administrateurs BIM NEXT." />
      <Appear kind="rise" delay={140}>
        <Glass a={0.12} b={0.2} radius={24} style={{ marginTop: 22, padding: 14, gap: 14 }}>
          <TextField id="gl-email" label="Adresse e-mail" icon="mail" value={email} onChange={setEmail} keyboardType="email-address" placeholder="admin@bimreseau.com" autoFocus />
          <TextField id="gl-pwd" label="Mot de passe" icon="lock" value={password} onChange={setPassword} secure placeholder="••••••••" />
        </Glass>
        <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <BimIcon name="lock" size={13} color={th.muted} strokeWidth={2} />
          <T size={12} color={th.muted}>Session chiffrée · rôle BIM Admin requis</T>
        </View>
      </Appear>
      <View style={{ marginTop: "auto", paddingTop: 24 }}>
        <SlideButton variant="accent" loading={isLoading} label="Se connecter" onDone={submit} />
      </View>
    </BimPage>
  );
}
