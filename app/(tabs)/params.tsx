/**
 * Langue et réglages avancés (design BIM NEXT) : langue, couleurs, e-mail de notification,
 * espaces professionnels (révélés par code d'accès). La suppression du compte est dans Profil.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, Switch, TextInput, View } from "react-native";
import type { TextInputInstance } from "react-native";
import { useAppTheme } from "@/app/_layout";
import { BimIcon, BimIconName } from "@/components/bim/icons";
import { useTh } from "@/components/bim/theme";
import { Appear, BimPage, Glass, MenuRow, PillButton, PressScale, SectionLabel, T, TextField } from "@/components/bim/ui";
import { StaffRole } from "@/constants/accessCodes";
import { changeLanguage } from "@/i18n";
import { useVerifyAccessCodeMutation } from "@/services/authService";
import { useGetUserByIdQuery, useUpdateUserMutation } from "@/services/userService";

const LANGUAGES = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ln", label: "Lingala", flag: "🇨🇩" },
  { code: "sw", label: "Swahili", flag: "🇹🇿" },
];
const STAFF: { role: StaffRole; label: string; icon: BimIconName; route: string }[] = [
  { role: "LIVREUR" as StaffRole, label: "Espace livreur", icon: "bike", route: "/livreur/login" },
  { role: "CHAUFFEUR" as StaffRole, label: "Espace chauffeur", icon: "car", route: "/transport/mode-chauffeur" },
  { role: "BIM" as StaffRole, label: "Espace gestion", icon: "shield", route: "/gestion/login" },
];

export default function Params() {
  const th = useTh();
  const router = useRouter();
  const { i18n } = useTranslation();
  const { isDark, toggleTheme, followSystem, setFollowSystem } = useAppTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [lang, setLang] = useState(i18n.language ?? "fr");
  const [notifEmail, setNotifEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeFocus, setCodeFocus] = useState(false);
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const codeRef = useRef<TextInputInstance>(null);
  const [verifyAccessCode, { isLoading: checking }] = useVerifyAccessCodeMutation();
  const [updateUser, { isLoading: saving }] = useUpdateUserMutation();

  useEffect(() => {
    AsyncStorage.getItem("userId").then(setUserId);
    AsyncStorage.getItem("revealedStaffRoles").then((v) => setRoles(v ? JSON.parse(v) : []));
  }, []);
  const { data: user } = useGetUserByIdQuery(userId!, { skip: !userId });
  useEffect(() => { if (user?.notificationEmail) setNotifEmail(user.notificationEmail); }, [user?.notificationEmail]);

  const pickLang = async (c: string) => { setLang(c); await changeLanguage(c); };

  const saveEmail = async () => {
    if (!userId) return;
    if (notifEmail.trim() && !notifEmail.includes("@")) { Alert.alert("E-mail invalide", "Vérifie l'adresse e-mail."); return; }
    try {
      const fd = new FormData();
      fd.append("notificationEmail", notifEmail.trim());
      await updateUser({ id: userId, formData: fd }).unwrap();
      Alert.alert("E-mail enregistré", "Tu recevras aussi tes notifications de commande par e-mail.");
    } catch (err: any) {
      Alert.alert("Erreur", err?.data?.message || "Impossible d'enregistrer l'e-mail.");
    }
  };

  const checkCode = async () => {
    if (!code) return;
    try {
      const res: any = await verifyAccessCode(code.trim()).unwrap();
      const role = res.role as StaffRole;
      const next = roles.includes(role) ? roles : [...roles, role];
      setRoles(next);
      await AsyncStorage.setItem("revealedStaffRoles", JSON.stringify(next));
      setCode("");
      Alert.alert("Accès accordé", "Ton espace professionnel est disponible ci-dessous.");
    } catch {
      Alert.alert("Code invalide", "Ce code d'accès n'est pas reconnu.");
    }
  };

  return (
    <BimPage title="Réglages avancés" onBack={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)" as any))}>
      <Appear kind="rise" delay={60}>
        <SectionLabel style={{ marginTop: 20 }}>LANGUE</SectionLabel>
        <View style={{ marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {LANGUAGES.map((l) => {
            const on = lang === l.code;
            return (
              <PressScale key={l.code} scaleTo={0.96} onPress={() => pickLang(l.code)} accessibilityLabel={l.label} style={{ width: "48%", flexGrow: 1 }}>
                <View style={{ height: 54, borderRadius: 27, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16,
                  borderWidth: on ? 2 : 1, borderColor: on ? th.fg : th.glass(0.2), backgroundColor: on ? th.glass(0.22) : th.glassFill(0.12), boxShadow: th.glassFx }}>
                  <T size={20}>{l.flag}</T>
                  <T w={on ? "bold" : "regular"} size={15} style={{ flex: 1 }}>{l.label}</T>
                  {on && <BimIcon name="check" size={16} color={th.fg} strokeWidth={2.6} />}
                </View>
              </PressScale>
            );
          })}
        </View>
      </Appear>

      <Appear kind="rise" delay={120}>
        <SectionLabel style={{ marginTop: 22 }}>APPARENCE</SectionLabel>
        <Glass a={0.12} b={0.2} radius={22} style={{ marginTop: 8, overflow: "hidden" }}>
          <MenuRow icon="palette" label="Couleurs de l'app" value={th.name} onPress={() => router.push("/theme" as any)} last />
        </Glass>
      </Appear>

      <Appear kind="rise" delay={180}>
        <SectionLabel style={{ marginTop: 22 }}>NOTIFICATIONS PAR E-MAIL</SectionLabel>
        <Glass a={0.12} b={0.2} radius={24} style={{ marginTop: 8, padding: 14, gap: 12 }}>
          <T size={13} color={th.muted} style={{ lineHeight: 19 }}>Facultatif : reçois aussi tes notifications de commande par e-mail.</T>
          <TextField id="pa-email" label="E-mail de notification" hideLabel icon="mail" value={notifEmail} onChange={setNotifEmail} keyboardType="email-address" placeholder="nom@exemple.com" />
          <PillButton variant="accent" label={saving ? "Enregistrement…" : "Enregistrer"} onPress={saveEmail} disabled={saving} />
        </Glass>
      </Appear>

      {roles.length > 0 && (
        <Appear kind="rise">
          <SectionLabel style={{ marginTop: 22 }}>ESPACES PROFESSIONNELS</SectionLabel>
          <View style={{ marginTop: 8, gap: 8 }}>
            {STAFF.filter((s) => roles.includes(s.role)).map((s) => (
              <PressScale key={s.role} scaleTo={0.97} onPress={() => router.push(s.route as any)} accessibilityLabel={s.label}
                style={{ height: 58, borderRadius: 29, flexDirection: "row", alignItems: "center", gap: 12, paddingLeft: 6, paddingRight: 18, backgroundColor: th.accent }}>
                <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: th.knob, alignItems: "center", justifyContent: "center" }}>
                  <BimIcon name={s.icon} size={20} color="#FFFFFF" />
                </View>
                <T w="bold" size={15} color={th.onAccent} style={{ flex: 1 }}>{s.label}</T>
                <BimIcon name="chevron" size={18} color={th.onAccent} />
              </PressScale>
            ))}
            <Glass a={0.12} b={0.2} radius={22} style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
              <View style={{ minHeight: 52, flexDirection: "row", alignItems: "center", gap: 12 }}>
                <T size={14} style={{ flex: 1 }}>Suivre le système (espaces pro)</T>
                <Switch value={followSystem} onValueChange={setFollowSystem} trackColor={{ false: th.glass(0.25), true: th.knob }} thumbColor="#FFFFFF" />
              </View>
              <View style={{ minHeight: 52, flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 1, borderTopColor: th.glass(0.12) }}>
                <T size={14} style={{ flex: 1 }} color={followSystem ? th.muted : th.fg}>Mode sombre (espaces pro)</T>
                <Switch value={isDark} onValueChange={followSystem ? undefined : toggleTheme} disabled={followSystem} trackColor={{ false: th.glass(0.25), true: th.knob }} thumbColor="#FFFFFF" />
              </View>
            </Glass>
          </View>
        </Appear>
      )}

      {/* Code d'accès discret (masqué par des points, fiable sur tous les claviers Android) */}
      <View style={{ marginTop: "auto", paddingTop: 30, flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Pressable onPress={() => codeRef.current?.focus()} accessibilityLabel="Code d'accès"
          style={{ flex: 1, height: 46, borderRadius: 23, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 6,
            backgroundColor: th.glass(0.08), borderWidth: 1, borderColor: codeFocus ? th.glass(0.4) : th.glass(0.14) }}>
          {code.length === 0 && !codeFocus && <T size={13} color={th.muted}>Code d'accès</T>}
          {Array.from({ length: code.length }).map((_, i) => <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: th.fg }} />)}
          <TextInput ref={codeRef} value={code} onChangeText={(v) => setCode(v.replace(/[^0-9]/g, ""))} onFocus={() => setCodeFocus(true)} onBlur={() => setCodeFocus(false)}
            keyboardType="number-pad" maxLength={6} style={{ position: "absolute", opacity: 0, width: 1, height: 1 }} />
        </Pressable>
        <PressScale onPress={checkCode} disabled={!code || checking} accessibilityLabel="Valider le code"
          style={{ height: 46, paddingHorizontal: 18, borderRadius: 23, backgroundColor: th.glass(0.14), justifyContent: "center" }}>
          <T w="bold" size={13}>{checking ? "…" : "Valider"}</T>
        </PressScale>
      </View>
    </BimPage>
  );
}
