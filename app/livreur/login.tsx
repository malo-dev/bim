/**
 * Espace livreur — connexion (design BIM NEXT).
 * Même logique : loginLivreur { email, password } → livreurToken / livreurId / livreurUser → /livreur/space.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, View } from "react-native";
import { useTh } from "@/components/bim/theme";
import { Appear, BimPage, Glass, PressScale, SlideButton, StaffHero, T, TextField } from "@/components/bim/ui";
import { useLoginLivreurMutation } from "@/services/livreurService";

export default function LivreurLoginScreen() {
  const th = useTh();
  const router = useRouter();
  const [loginLivreur, { isLoading }] = useLoginLivreurMutation();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const submit = async () => {
    if (!email.trim() || !pass.trim()) { Alert.alert("Champs requis", "Entre ton e-mail et ton mot de passe livreur."); return; }
    const res = await loginLivreur({ email: email.trim().toLowerCase(), password: pass });
    if (res.error) { Alert.alert("Connexion impossible", (res.error as any).data?.message || "Identifiants incorrects."); return; }
    const { token, user, livreur } = res.data as any;
    await AsyncStorage.multiSet([
      ["livreurToken", token], ["livreurId", String(livreur.livreurId)],
      ["livreurUser", JSON.stringify({ ...user, livreur })], ["livreurLastActivity", String(Date.now())],
    ]);
    router.replace("/livreur/space" as any);
  };

  return (
    <BimPage title="Espace livreur">
      <StaffHero icon="bike" badge="Livreur" title="Connexion livreur" text="Connecte-toi avec le mot de passe livreur reçu par e-mail." />
      <Appear kind="rise" delay={140}>
        <Glass a={0.12} b={0.2} radius={24} style={{ marginTop: 22, padding: 14, gap: 14 }}>
          <TextField id="ll-email" label="E-mail BIM NEXT" icon="mail" value={email} onChange={setEmail} keyboardType="email-address" placeholder="nom@exemple.com" />
          <TextField id="ll-pwd" label="Mot de passe livreur" icon="lock" value={pass} onChange={setPass} secure placeholder="Reçu par e-mail" />
        </Glass>
      </Appear>
      <View style={{ marginTop: "auto", paddingTop: 24, gap: 14 }}>
        <SlideButton variant="accent" loading={isLoading} label="Accéder à mon espace" icon="bike" onDone={submit} />
        <PressScale onPress={() => router.push("/livreur/apply" as any)} accessibilityLabel="Devenir livreur" style={{ alignSelf: "center", minHeight: 44, justifyContent: "center" }}>
          <T size={14} color={th.muted}>Pas encore livreur ? <T w="bold" size={14}>Postuler</T></T>
        </PressScale>
      </View>
    </BimPage>
  );
}
