/**
 * Modifier mon profil (design BIM NEXT) : photo, informations personnelles, enregistrement.
 * Même logique qu'avant : PUT /auth/users/:id (champs) + /auth/users/:id/profile (photo).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { API_URL_BASE } from "@/constants/api";
import { BimIcon, BimIconName } from "@/components/bim/icons";
import { useTh } from "@/components/bim/theme";
import { Appear, BimPage, EmptyState, Glass, PressScale, SectionLabel, SlideButton, T, TextField } from "@/components/bim/ui";
import { useCreateHistoryMutation } from "@/services/historyService";
import { useCreateNotificationMutation } from "@/services/notificationService";
import { useGetUserByIdQuery, useUpdateUserMutation } from "@/services/userService";

type FieldKey = "username" | "nom" | "poste" | "email" | "tel" | "adresse";
const FIELDS: { key: FieldKey; label: string; icon: BimIconName; keyboard?: any; placeholder: string }[] = [
  { key: "username", label: "Nom d'utilisateur", icon: "user", placeholder: "Ex. malo243" },
  { key: "nom", label: "Nom complet", icon: "user", placeholder: "Ex. Malo Leader" },
  { key: "poste", label: "Profession", icon: "briefcase", placeholder: "Ex. Commerçant" },
  { key: "email", label: "E-mail", icon: "mail", keyboard: "email-address", placeholder: "nom@exemple.com" },
  { key: "tel", label: "Téléphone", icon: "phone", keyboard: "phone-pad", placeholder: "+243 81 234 5678" },
  { key: "adresse", label: "Adresse", icon: "pin", placeholder: "Quartier, avenue, Bunia" },
];

export default function ProfileScreen() {
  const th = useTh();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState({ username: "", nom: "", poste: "", email: "", tel: "", adresse: "", photo: "" });
  const [uploading, setUploading] = useState(false);
  const { data: user, isLoading, isError, refetch } = useGetUserByIdQuery(userId!, { skip: !userId });
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [createHistory] = useCreateHistoryMutation();
  const [createNotification] = useCreateNotificationMutation();

  useEffect(() => { AsyncStorage.getItem("userId").then(setUserId); }, []);
  useEffect(() => {
    if (!user) return;
    const clean = (v?: string) => (v && !String(v).startsWith("quick_") ? v : "");
    setProfile({
      username: clean(user.username), nom: user.fullname || "", poste: user.poste || "",
      email: clean(user.email) || user.notificationEmail || "", tel: user.telephone || "", adresse: user.adresse || "",
      photo: user.imageUrl ? (user.imageUrl.startsWith("http") ? user.imageUrl : `${API_URL_BASE}${user.imageUrl}`) : "",
    });
  }, [user]);

  const set = (k: FieldKey | "photo", v: string) => setProfile((p) => ({ ...p, [k]: v }));
  const display = profile.nom || profile.username || "Ton nom";
  const initials = (display.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("")).toUpperCase();

  const uploadImage = async (uri: string) => {
    const token = await AsyncStorage.getItem("token");
    if (!userId) return;
    const fileName = uri.split("/").pop() || `photo_${Date.now()}.jpg`;
    const ext = fileName.split(".").pop()?.toLowerCase();
    const fd = new FormData();
    fd.append("image", { uri, name: fileName, type: ext === "png" ? "image/png" : "image/jpeg" } as any);
    const res = await fetch(`${API_URL_BASE}/api/v1/auth/users/${userId}/profile`, { method: "PUT", body: fd, headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw await res.json();
  };

  const pickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) { Alert.alert("Autorisation refusée", "Autorise l'accès à tes photos pour changer ta photo de profil."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    set("photo", uri);
    setUploading(true);
    try { await uploadImage(uri); refetch(); Alert.alert("Photo mise à jour", "Ta nouvelle photo de profil est enregistrée."); }
    catch { Alert.alert("Erreur", "La photo n'a pas pu être envoyée. Réessaie."); }
    finally { setUploading(false); }
  };

  const save = async () => {
    if (!userId) return;
    try {
      const fd = new FormData();
      fd.append("username", profile.username);
      fd.append("fullname", profile.nom);
      fd.append("poste", profile.poste);
      fd.append("email", profile.email);
      fd.append("telephone", profile.tel);
      fd.append("adresse", profile.adresse);
      await updateUser({ id: userId, formData: fd }).unwrap();
      createHistory({ type: "MODIFICATION_PROFIL", description: "Profil mis à jour.", userId, action: "Profil modifié" }).catch(() => {});
      createNotification({ title: "Profil mis à jour", message: "Ton profil a été mis à jour avec succès.", type: "SUCCESS", userId }).catch(() => {});
      refetch();
      Alert.alert("Profil enregistré", "Tes informations ont été mises à jour.");
    } catch (err: any) {
      Alert.alert("Erreur", err?.data?.message || err?.message || "Impossible de mettre à jour ton profil.");
    }
  };

  if (isError) return <BimPage title="Modifier mon profil"><EmptyState icon="wifiOff" title="Profil indisponible" text="Vérifie ta connexion puis réessaie." action={{ label: "Réessayer", onPress: () => refetch() }} /></BimPage>;

  return (
    <BimPage title="Modifier mon profil">
      {isLoading || !user ? <EmptyState loading title="Chargement…" /> : (
        <>
          <Appear kind="pop" delay={60} style={{ alignItems: "center", marginTop: 24 }}>
            <View style={{ width: 112, height: 112 }}>
              <View style={{ width: 112, height: 112, borderRadius: 56, backgroundColor: profile.photo || (profile.nom || profile.username) ? th.accent : "#FFFFFF", alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 3, borderColor: th.glass(0.35) }}>
                {profile.photo ? <Image source={{ uri: profile.photo }} style={{ width: 112, height: 112 }} contentFit="cover" /> : (profile.nom || profile.username) ? <T w="bold" size={38} color={th.onAccent}>{initials}</T>
                  : <Image source={require("@/assets/images/icon.png")} style={{ width: 96, height: 96 }} contentFit="contain" />}
              </View>
              <PressScale onPress={pickImage} accessibilityLabel="Changer ma photo de profil"
                style={{ position: "absolute", right: -2, bottom: -2, width: 40, height: 40, borderRadius: 20, backgroundColor: th.knob, borderWidth: 3, borderColor: th.base, alignItems: "center", justifyContent: "center" }}>
                <BimIcon name="camera" size={18} color="#FFFFFF" strokeWidth={2} />
              </PressScale>
            </View>
            <T w="bold" size={21} style={{ marginTop: 14 }}>{display}</T>
            <T size={13} color={th.muted} style={{ marginTop: 2 }}>{uploading ? "Envoi de la photo…" : profile.poste || "Membre BIM NEXT"}</T>
          </Appear>

          <Appear kind="rise" delay={140}>
            <SectionLabel style={{ marginTop: 22 }}>INFORMATIONS PERSONNELLES</SectionLabel>
            <Glass a={0.12} b={0.2} radius={24} style={{ marginTop: 8, padding: 14, gap: 14 }}>
              {FIELDS.map((f) => (
                <TextField key={f.key} id={`pf-${f.key}`} label={f.label} icon={f.icon} value={profile[f.key]} onChange={(v) => set(f.key, v)}
                  placeholder={f.placeholder} keyboardType={f.keyboard} />
              ))}
            </Glass>
          </Appear>

          <View style={{ marginTop: "auto", paddingTop: 22 }}>
            <SlideButton variant="accent" loading={isUpdating} label="Enregistrer les modifications" icon="check" onDone={save} />
          </View>
        </>
      )}
    </BimPage>
  );
}
