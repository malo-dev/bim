/**
 * Mon profil (maquette) : carte membre, COMPTE (Modifier mon profil, Thème…), déconnexion,
 * et « Supprimer mon compte » (exigé par l'App Store) avec confirmation.
 * Les autres pages de l'app sont regroupées dans Réglages.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_URL_BASE } from "@/constants/api";
import { useTabBarScroll } from "@/components/bim/tabBlur";
import { useTh } from "@/components/bim/theme";
import { BimDialog, bimAlert } from "@/components/bim/alert";
import { BimIcon } from "@/components/bim/icons";
import { Appear, BimBackground, Glass, Header, MenuRow, PillButton, PressScale, SectionLabel, T, TextField } from "@/components/bim/ui";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useLogOutMutation } from "@/services/authService";
import { useDeleteAccountMutation, useGetUserByIdQuery } from "@/services/userService";
const APP_ICON = require("@/assets/images/icon.png");

export default function Profil() {
  const th = useTh();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unread } = useUnreadNotifications();
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => { AsyncStorage.getItem("userId").then(setUserId); }, []);
  const { data: user } = useGetUserByIdQuery(userId!, { skip: !userId });
  const [logOut, { isLoading }] = useLogOutMutation();
  const [deleteAccount, { isLoading: deleting }] = useDeleteAccountMutation();
  const [delOpen, setDelOpen] = useState(false);
  const [delPwd, setDelPwd] = useState("");
  const barScroll = useTabBarScroll("profil", 130 + insets.bottom);

  const raw: string = user?.username ?? "";
  const name = !raw ? "…" : raw.startsWith("quick_") ? "Mon compte" : raw;
  const initials = (!raw || raw.startsWith("quick_") ? "" : raw.trim().split(/\s+/).slice(0, 2).map((w: string) => w[0]).join("")).toUpperCase();
  const realEmail = user?.email && !String(user.email).startsWith("quick_") ? user.email : user?.notificationEmail;
  const subtitle = [user?.telephone, realEmail].filter(Boolean).join(" · ") || "Complète ton profil";
  const avatar = user?.imageUrl ? (String(user.imageUrl).startsWith("http") ? user.imageUrl : `${API_URL_BASE}${user.imageUrl}`) : null;

  const handleLogout = () => {
    Alert.alert("Se déconnecter", "Tu devras entrer ton numéro et ton mot de passe pour revenir.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Se déconnecter", style: "destructive",
        onPress: async () => {
          try {
            const email = await AsyncStorage.getItem("email");
            const keep = await AsyncStorage.multiGet(["privacyAcceptedAt", "bimnextTheme2", "bimnextThemeChosen"]);
            await logOut({ email: String(email) }).unwrap().catch(() => {});
            await AsyncStorage.clear();
            if (email) await AsyncStorage.setItem("email", email);
            await AsyncStorage.multiSet(keep.filter(([, v]) => v != null) as [string, string][]);
            router.replace({ pathname: "/onboarding", params: { step: "phone" } } as any);
          } catch (err: any) {
            Alert.alert("Erreur", err?.data?.message || "Déconnexion impossible.");
          }
        },
      },
    ]);
  };

  const handleDelete = async () => {
    try {
      await deleteAccount(delPwd.trim() ? { password: delPwd.trim() } : { confirm: true }).unwrap();
      setDelOpen(false); setDelPwd("");
      const keep = await AsyncStorage.multiGet(["privacyAcceptedAt", "bimnextTheme2", "bimnextThemeChosen"]);
      await AsyncStorage.clear();
      await AsyncStorage.multiSet(keep.filter(([, v]) => v != null) as [string, string][]);
      bimAlert("Compte supprimé", "Ton compte BIM NEXT et tes données ont été effacés définitivement.", [
        { text: "OK", onPress: () => router.replace("/onboarding" as any) },
      ], { kind: "success" });
    } catch (err: any) {
      const msg = err?.data?.message || "La suppression n'a pas pu être faite. Réessaie.";
      setDelOpen(false);
      bimAlert("Suppression impossible", msg, [{ text: "OK", onPress: () => setDelOpen(true) }], { kind: "error" });
    }
  };

  return (
    <BimBackground>
      <ScrollView {...barScroll} contentContainerStyle={{ flexGrow: 1, paddingTop: 28 + insets.top, paddingHorizontal: 20, paddingBottom: 130 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <Header title="Mon profil" backLabel="Retour à l'accueil" onBack={() => router.navigate("/(tabs)" as any)} />

        <Appear kind="rise" delay={60}>
          <Glass a={0.14} b={0.22} radius={24} style={{ marginTop: 18, padding: 14, flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: avatar || initials ? th.accent : "#FFFFFF", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {avatar ? <Image source={{ uri: avatar }} style={{ width: 60, height: 60 }} contentFit="cover" />
                : initials ? <T w="bold" size={24} color={th.onAccent}>{initials}</T>
                : <Image source={APP_ICON} style={{ width: 50, height: 50 }} contentFit="contain" />}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <T w="bold" size={19} numberOfLines={1}>{name}</T>
              <T size={13} color={th.muted} numberOfLines={1} style={{ marginTop: 2 }}>{subtitle}</T>
            </View>
            <PressScale onPress={() => router.push("/profile" as any)} accessibilityLabel="Modifier mon profil"
              style={{ height: 36, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, borderColor: th.glass(0.3), justifyContent: "center" }}>
              <T size={13}>Modifier</T>
            </PressScale>
          </Glass>
        </Appear>

        <Appear kind="rise" delay={140}>
          <SectionLabel style={{ marginTop: 18 }}>COMPTE</SectionLabel>
          <Glass a={0.12} b={0.2} radius={22} style={{ marginTop: 8, overflow: "hidden" }}>
            <MenuRow icon="user" label="Modifier mon profil" onPress={() => router.push("/profile" as any)} />
            <MenuRow icon="palette" label="Thème" value={th.name} onPress={() => router.push("/theme" as any)} />
            <MenuRow icon="bell" label="Notifications" badge={unread} onPress={() => router.push("/notification" as any)} />
            <MenuRow icon="lock" label="Sécurité et mot de passe" onPress={() => router.push("/securiser-compte" as any)} />
            <MenuRow icon="settings" label="Langue" value="Français" onPress={() => router.push("/(tabs)/params" as any)} />
            <MenuRow icon="box" label="Réglages" onPress={() => router.push("/reglages" as any)} />
            <MenuRow icon="logout" label={isLoading ? "Déconnexion…" : "Se déconnecter"} onPress={handleLogout} last />
          </Glass>
        </Appear>

        <Appear kind="fade" delay={300} style={{ marginTop: "auto", paddingTop: 24 }}>
          <PressScale onPress={() => { setDelPwd(""); setDelOpen(true); }} accessibilityLabel="Supprimer mon compte"
            style={{ height: 50, borderRadius: 25, borderWidth: 1, borderColor: "rgba(224,30,43,0.7)", backgroundColor: "rgba(224,30,43,0.14)",
              flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <BimIcon name="trash" size={18} color="#FF5A66" strokeWidth={2} />
            <T w="bold" size={15} color="#FF5A66">Supprimer mon compte</T>
          </PressScale>
        </Appear>
      </ScrollView>

      <BimDialog visible={delOpen} kind="warning" title="Supprimer ton compte ?"
        message="Ton solde, ton historique, tes commandes et tes données seront effacés définitivement. Cette action est irréversible."
        onRequestClose={deleting ? undefined : () => setDelOpen(false)}
        actions={[
          { label: "Annuler", variant: "glass", onPress: () => setDelOpen(false), disabled: deleting },
          { label: deleting ? "Suppression…" : "Supprimer", variant: "danger", onPress: handleDelete, disabled: deleting },
        ]}>
        <TextField id="del-pwd" label="Ton mot de passe" value={delPwd} onChange={setDelPwd} secure placeholder="••••••" />
        <T size={12} color={th.muted} style={{ marginTop: 8, lineHeight: 18 }}>Compte créé sans mot de passe ? Laisse ce champ vide.</T>
      </BimDialog>
    </BimBackground>
  );
}
