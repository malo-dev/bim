/**
 * Sécurité et mot de passe (design BIM NEXT) : choisir / changer le mot de passe du compte.
 */
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, View } from "react-native";
import { BimIcon } from "@/components/bim/icons";
import { useTh } from "@/components/bim/theme";
import { Appear, BimPage, Glass, PageTitle, SlideButton, T, TextField } from "@/components/bim/ui";
import { useSecureMyAccountMutation } from "@/services/authService";

export default function SecuriserCompteScreen() {
  const th = useTh();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [secureMyAccount, { isLoading }] = useSecureMyAccountMutation();

  const strength = password.length >= 8 && /\d/.test(password) && /[a-zA-Z]/.test(password) ? 3 : password.length >= 6 ? 2 : password.length >= 4 ? 1 : 0;
  const strengthLabel = ["Trop court", "Faible", "Correct", "Solide"][strength];
  const strengthColor = ["#FF5A66", "#F59E0B", "#38B6FF", "#22C55E"][strength];

  const submit = async () => {
    if (password.trim().length < 4) { Alert.alert("Mot de passe trop court", "Le mot de passe doit contenir au moins 4 caractères."); return; }
    if (password !== confirm) { Alert.alert("Erreur", "Les deux mots de passe ne correspondent pas."); return; }
    try {
      await secureMyAccount(password.trim()).unwrap();
      Alert.alert("Compte sécurisé", "Ton mot de passe a été changé.", [{ text: "OK", onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert("Erreur", e?.data?.message || "Impossible de changer le mot de passe.");
    }
  };

  return (
    <BimPage title="Sécurité">
      <Appear kind="pop" delay={40} style={{ alignSelf: "center", marginTop: 24 }}>
        <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: th.glassFill(0.14), borderWidth: 1, borderColor: th.glass(0.24), alignItems: "center", justifyContent: "center", boxShadow: th.glassFx }}>
          <BimIcon name="shield" size={36} color={th.fg} strokeWidth={1.7} />
        </View>
      </Appear>
      <PageTitle light="Protège" bold="ton compte" text="Choisis un nouveau mot de passe. Il te sera demandé à chaque connexion, avec ton numéro de téléphone." />

      <Appear kind="rise" delay={140}>
        <Glass a={0.12} b={0.2} radius={24} style={{ marginTop: 20, padding: 14, gap: 14 }}>
          <TextField id="sc-pwd" label="Nouveau mot de passe" icon="lock" value={password} onChange={setPassword} secure placeholder="••••••••" autoFocus />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ flex: 1, flexDirection: "row", gap: 4 }}>
              {[1, 2, 3].map((n) => <View key={n} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: strength >= n ? strengthColor : th.glass(0.2) }} />)}
            </View>
            <T size={12} w="bold" color={password ? strengthColor : th.muted}>{password ? strengthLabel : "Force"}</T>
          </View>
          <TextField id="sc-confirm" label="Confirmer le mot de passe" icon="lock" value={confirm} onChange={setConfirm} secure placeholder="••••••••" />
          {!!confirm && confirm !== password && <T size={13} color="#FF5A66">Les deux mots de passe ne correspondent pas.</T>}
        </Glass>
      </Appear>

      <View style={{ marginTop: "auto", paddingTop: 22 }}>
        <SlideButton variant="accent" loading={isLoading} label="Changer le mot de passe" icon="lock" onDone={submit} />
      </View>
    </BimPage>
  );
}
