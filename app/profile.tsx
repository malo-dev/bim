import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useGetUserByIdQuery,
  useUpdateUserMutation,
} from "@/services/userService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCreateHistoryMutation } from "@/services/historyService";
import { useCreateNotificationMutation } from "@/services/notificationService";
import { Image } from "expo-image";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { API_URL_BASE } from "@/constants/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/app/_layout";

/* ─── PALETTE ─────────────────────────────────────────────────────────── */
const LIGHT = {
  primary:    "#0035C5",
  bg:         "#F9F9F9",
  surface:    "#FFFFFF",
  onSurface:  "#1A1C1C",
  onSurfVar:  "#434657",
  secondary:  "#5C5E63",
  outlineVar: "#C4C5DA",
  outline:    "#747688",
  green:      "#22C55E",
  amber:      "#F59E0B",
  error:      "#DC2626",
};

const DARK: typeof LIGHT = {
  primary:    "#4D8DFF",
  bg:         "#0B1220",
  surface:    "#121A2B",
  onSurface:  "#EAF0FF",
  onSurfVar:  "#9FB0D0",
  secondary:  "#9FB0D0",
  outlineVar: "#1F2A44",
  outline:    "#9FB0D0",
  green:      "#22C55E",
  amber:      "#F59E0B",
  error:      "#FF5A5A",
};

/* ─── STYLES FACTORY ──────────────────────────────────────────────────── */
function mkS(C: typeof LIGHT) {
  const s = StyleSheet.create({
    fill: { flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" },
    loadTxt: { fontFamily: "NexaLight", fontSize: 14, color: C.outline, marginTop: 12 },

    /* top bar */
    topBar: {
      position: "absolute", top: 0, left: 0, right: 0, zIndex: 50,
      backgroundColor: C.surface,
      borderBottomWidth: 1, borderBottomColor: C.outlineVar + "2E",
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: 16, paddingBottom: 12,
      elevation: 2,
      shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 4,
    },
    topBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
    topTitle: {
      fontFamily: "NexaBold", fontSize: 17, color: C.primary,
    },
    notifDot: {
      position: "absolute", top: 8, right: 8,
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: C.primary,
      borderWidth: 2, borderColor: C.surface,
    },

    scroll: { paddingHorizontal: 16 },

    /* avatar */
    avatarSection: { alignItems: "center", marginBottom: 24 },
    avatarWrap:    { position: "relative", marginBottom: 12 },
    avatarRing: {
      width: 112, height: 112, borderRadius: 56,
      backgroundColor: C.outlineVar + "40",
      borderWidth: 3, borderColor: C.surface,
      overflow: "hidden", alignItems: "center", justifyContent: "center",
      elevation: 4,
      shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.10, shadowRadius: 8,
    },
    avatarImg: { width: "100%", height: "100%" },
    cameraBadge: {
      position: "absolute", bottom: 2, right: 2,
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: C.primary,
      alignItems: "center", justifyContent: "center",
      borderWidth: 2.5, borderColor: C.surface,
      elevation: 3,
      shadowColor: C.primary, shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3, shadowRadius: 4,
    },
    profileName:  { fontFamily: "NexaBold", fontSize: 20, color: C.onSurface },
    profilePoste: {
      fontFamily: "NexaLight", fontSize: 11, color: C.secondary,
      textTransform: "uppercase", letterSpacing: 1.5, marginTop: 2, opacity: 0.8,
    },

    /* form card */
    card: {
      backgroundColor: C.surface,
      borderRadius: 20, padding: 20, marginBottom: 16,
      borderWidth: 1, borderColor: C.outlineVar + "26",
      elevation: 2,
      shadowColor: "rgba(0,71,255,0.06)",
      shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12,
    },
    cardTitle: {
      fontFamily: "NexaBold", fontSize: 17, color: C.onSurface, marginBottom: 16,
    },

    /* save button */
    saveBtn: {
      marginTop: 8, backgroundColor: C.primary,
      borderRadius: 14, paddingVertical: 16,
      alignItems: "center",
      elevation: 3,
      shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25, shadowRadius: 8,
    },
    saveTxt: { fontFamily: "NexaBold", fontSize: 15, color: "#FFFFFF" },

    /* sections */
    section: { marginBottom: 16 },
    group: {
      backgroundColor: C.surface,
      borderRadius: 16, overflow: "hidden",
      borderWidth: 1, borderColor: C.outlineVar + "26",
      elevation: 1,
      shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04, shadowRadius: 4,
    },
    divider: { height: 1, backgroundColor: C.outlineVar + "26", marginHorizontal: 16 },
  });

  const f = StyleSheet.create({
    wrap:  { marginBottom: 12 },
    label: {
      fontFamily: "NexaLight", fontSize: 10, color: C.onSurfVar,
      textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 5, marginLeft: 2,
    },
    box: {
      flexDirection: "row", alignItems: "center", gap: 10,
      backgroundColor: C.bg, borderWidth: 1.5,
      borderRadius: 14, paddingHorizontal: 14, height: 50,
    },
    input: {
      flex: 1, fontFamily: "NexaLight", fontSize: 14, color: C.onSurface,
    },
  });

  const mr = StyleSheet.create({
    row: {
      flexDirection: "row", alignItems: "center", gap: 14,
      padding: 16, backgroundColor: C.surface,
    },
    dangerRow: { backgroundColor: "rgba(255,218,214,0.25)" },
    iconBox: {
      width: 40, height: 40, borderRadius: 12,
      alignItems: "center", justifyContent: "center",
    },
    title: { fontFamily: "NexaBold", fontSize: 14, color: C.onSurface },
    sub:   { fontFamily: "NexaLight", fontSize: 12, color: C.secondary, marginTop: 1 },
  });

  const sl = StyleSheet.create({
    text: {
      fontFamily: "NexaLight", fontSize: 10, color: C.onSurfVar,
      textTransform: "uppercase", letterSpacing: 1.5,
      marginBottom: 8, marginLeft: 2,
    },
  });

  return { s, f, mr, sl };
}

type Styles = ReturnType<typeof mkS>;

type FieldKey = "username" | "nom" | "poste" | "email" | "tel" | "adresse";

/* ─── FIELD ROW ──────────────────────────────────────────────────────── */
function FieldRow({
  label, icon, value, onChange, placeholder, keyboard, fieldKey,
  C, fst,
}: {
  label: string; icon: string; value: string; placeholder: string;
  keyboard: any; fieldKey: FieldKey;
  onChange: (k: FieldKey, v: string) => void;
  C: typeof LIGHT; fst: Styles["f"];
}) {
  const border = useRef(new Animated.Value(0)).current;
  const focus  = () => Animated.timing(border, { toValue: 1, duration: 180, useNativeDriver: false }).start();
  const blur   = () => Animated.timing(border, { toValue: 0, duration: 180, useNativeDriver: false }).start();

  const borderCol = border.interpolate({
    inputRange: [0, 1],
    outputRange: [C.outlineVar + "80", C.primary],
  });

  return (
    <View style={fst.wrap}>
      <Text style={fst.label}>{label}</Text>
      <Animated.View style={[fst.box, { borderColor: borderCol }]}>
        <Ionicons name={icon as any} size={18} color={C.primary + "59"} />
        <TextInput
          style={fst.input}
          value={value}
          onChangeText={v => onChange(fieldKey, v)}
          placeholder={placeholder}
          placeholderTextColor={C.outline}
          keyboardType={keyboard}
          onFocus={focus}
          onBlur={blur}
          returnKeyType="next"
        />
      </Animated.View>
    </View>
  );
}

/* ─── MENU ROW ───────────────────────────────────────────────────────── */
function MenuRow({
  icon, iconBg, iconColor, title, sub, onPress, danger = false,
  C, mst,
}: {
  icon: string; iconBg: string; iconColor: string;
  title: string; sub: string; onPress: () => void; danger?: boolean;
  C: typeof LIGHT; mst: Styles["mr"];
}) {
  return (
    <TouchableOpacity
      style={[mst.row, danger && mst.dangerRow]}
      onPress={onPress}
      activeOpacity={0.78}
    >
      <View style={[mst.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[mst.title, danger && { color: C.error }]}>{title}</Text>
        <Text style={[mst.sub, danger && { color: C.error + "B3" }]}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={danger ? C.error : C.outlineVar} />
    </TouchableOpacity>
  );
}

/* ─── SECTION LABEL ──────────────────────────────────────────────────── */
function SLabel({ title, sst }: { title: string; sst: Styles["sl"] }) {
  return <Text style={sst.text}>{title}</Text>;
}

/* ─── MAIN ────────────────────────────────────────────────────────────── */
export default function ProfileScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { t }   = useTranslation();

  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const { s, f, mr, sl } = useMemo(() => mkS(C), [isDark]);

  const FIELDS = [
    { key: "username", label: t("profile.username"),  icon: "person-circle-outline",  keyboard: "default",       placeholder: t("profile.usernamePH")  },
    { key: "nom",      label: t("profile.fullName"),  icon: "person-outline",          keyboard: "default",       placeholder: t("profile.fullNamePH")  },
    { key: "poste",    label: t("profile.position"),  icon: "briefcase-outline",       keyboard: "default",       placeholder: t("profile.positionPH")  },
    { key: "email",    label: t("profile.email"),     icon: "mail-outline",            keyboard: "email-address", placeholder: t("profile.emailPH")     },
    { key: "tel",      label: t("profile.phone"),     icon: "call-outline",            keyboard: "phone-pad",     placeholder: t("profile.phonePH")     },
    { key: "adresse",  label: t("profile.address"),   icon: "location-outline",        keyboard: "default",       placeholder: t("profile.addressPH")   },
  ] as const;

  const [userId,  setUserId]  = useState<string | null>(null);
  const [profile, setProfile] = useState({
    username: "", nom: "", poste: "", email: "", tel: "", adresse: "", photo: "",
  });

  const { data: user, isLoading, isError, refetch } = useGetUserByIdQuery(userId!, { skip: !userId });
  const [updateUser,         { isLoading: isUpdating }]  = useUpdateUserMutation();
  const [createHistory]                                   = useCreateHistoryMutation();
  const [createNotification]                              = useCreateNotificationMutation();

  useEffect(() => { AsyncStorage.getItem("userId").then(setUserId); }, []);

  useEffect(() => {
    if (!user) return;
    setProfile({
      username: user.username  || "",
      nom:      user.fullname  || "",
      poste:    user.poste     || "",
      email:    user.email     || "",
      tel:      user.telephone || "",
      adresse:  user.adresse   || "",
      photo:    user.imageUrl
        ? user.imageUrl.startsWith("http") ? user.imageUrl : `${API_URL_BASE}${user.imageUrl}`
        : "",
    });
  }, [user]);

  const handleChange = (field: FieldKey | "photo", value: string) =>
    setProfile(p => ({ ...p, [field]: value }));

  const uploadImage = async (uri: string) => {
    const token    = await AsyncStorage.getItem("token");
    if (!userId) return;
    const fileName = uri.split("/").pop() || `photo_${Date.now()}.jpg`;
    const ext      = fileName.split(".").pop()?.toLowerCase();
    const mimeType = ext === "png" ? "image/png" : "image/jpeg";
    const formData = new FormData();
    formData.append("image", { uri, name: fileName, type: mimeType } as any);
    const res = await fetch(`${API_URL_BASE}/api/v1/auth/users/${userId}/profile`, {
      method: "PUT", body: formData,
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw await res.json();
  };

  const handlePickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) { Alert.alert(t("common.permDenied"), t("profile.permDenied")); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images as any,
      quality: 0.7, allowsEditing: true,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      handleChange("photo", uri);
      try {
        await uploadImage(uri); refetch();
        Alert.alert("✅", t("profile.photoSuccess"));
      } catch {
        Alert.alert("Erreur", t("profile.photoError"));
      }
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    try {
      const fd = new FormData();
      fd.append("username",  profile.username);
      fd.append("fullname",  profile.nom);
      fd.append("poste",     profile.poste);
      fd.append("email",     profile.email);
      fd.append("telephone", profile.tel);
      fd.append("adresse",   profile.adresse);
      await updateUser({ id: userId, formData: fd });
      await createHistory({ type: "MODIFICATION_PROFIL", description: "Profil mis à jour.", userId, action: "Profil modifié ✅" });
      await createNotification({ title: "Profil mis à jour", message: "Votre profil a été mis à jour avec succès.", type: "SUCCESS", userId });
      Alert.alert("✅", t("profile.profileSuccess"));
    } catch (err: any) {
      Alert.alert("Erreur", err?.message || "Impossible de mettre à jour");
    }
  };

  const TOP_H = (Platform.OS === "ios" ? insets.top : StatusBar.currentHeight ?? 0) + 56;

  if (isLoading) return (
    <View style={s.fill}>
      <Text style={s.loadTxt}>Chargement…</Text>
    </View>
  );

  if (isError) return (
    <View style={s.fill}>
      <Ionicons name="cloud-offline-outline" size={48} color={C.outlineVar} />
      <Text style={s.loadTxt}>{t("profile.loadError")}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={C.surface} />

      {/* ── TOP BAR (fixe) ── */}
      <View style={[s.topBar, {
        paddingTop: Platform.OS === "ios" ? insets.top : (StatusBar.currentHeight ?? 0) + 8,
      }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.topBtn}>
          <Ionicons name="arrow-back" size={22} color={C.onSurface} />
        </TouchableOpacity>

        <Text style={s.topTitle}>Mon Profil</Text>

        <TouchableOpacity onPress={() => router.push("/notification")} style={s.topBtn}>
          <Ionicons name="notifications-outline" size={22} color={C.onSurface} />
          <View style={s.notifDot} />
        </TouchableOpacity>
      </View>

      {/* ── SCROLL ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scroll, { paddingTop: TOP_H + 16 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── AVATAR ── */}
        <View style={s.avatarSection}>
          <View style={s.avatarWrap}>
            <View style={s.avatarRing}>
              {profile.photo
                ? <Image source={{ uri: profile.photo }} contentFit="cover" style={s.avatarImg} />
                : <Ionicons name="person" size={52} color={C.outlineVar} />
              }
            </View>
            <TouchableOpacity style={s.cameraBadge} onPress={handlePickImage}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={s.profileName}>{profile.nom || profile.username || "Votre nom"}</Text>
          <Text style={s.profilePoste}>{profile.poste || t("profile.defaultPosition")}</Text>
        </View>

        {/* ── FORM CARD ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Informations personnelles</Text>

          {FIELDS.map(fi => (
            <FieldRow
              key={fi.key}
              fieldKey={fi.key}
              label={fi.label}
              icon={fi.icon}
              keyboard={fi.keyboard}
              placeholder={fi.placeholder}
              value={profile[fi.key]}
              onChange={handleChange}
              C={C}
              fst={f}
            />
          ))}

          <TouchableOpacity
            style={[s.saveBtn, isUpdating && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={isUpdating}
            activeOpacity={0.85}
          >
            {isUpdating
              ? <Ionicons name="hourglass-outline" size={18} color="#fff" />
              : <Text style={s.saveTxt}>Enregistrer les modifications</Text>
            }
          </TouchableOpacity>
        </View>

        {/* ── ACTIVITÉS ── */}
        <View style={s.section}>
          <SLabel title="ACTIVITÉS" sst={sl} />
          <View style={s.group}>
            <MenuRow
              icon="receipt-outline" iconBg={C.primary + "0F"} iconColor={C.primary}
              title="Mes commandes" sub="Suivre et consulter vos commandes"
              onPress={() => router.push("/mes-commandes" as any)}
              C={C} mst={mr}
            />
            <View style={s.divider} />
            <MenuRow
              icon="cart-outline" iconBg={C.primary + "0F"} iconColor={C.primary}
              title="Mon panier" sub="Voir et gérer votre panier d'achats"
              onPress={() => router.push("/bim-supermarche/cart")}
              C={C} mst={mr}
            />
          </View>
        </View>

        {/* ── SERVICES ── */}
        <View style={s.section}>
          <SLabel title="SERVICES" sst={sl} />
          <View style={s.group}>
            <MenuRow
              icon="bicycle" iconBg={C.green + "14"} iconColor={C.green}
              title="Espace Livreur" sub="Accéder à votre espace de livraison"
              onPress={() => router.push("/livreur/login")}
              C={C} mst={mr}
            />
            <View style={s.divider} />
            <MenuRow
              icon="paper-plane-outline" iconBg={C.amber + "14"} iconColor={C.amber}
              title="Devenir livreur" sub="Soumettre votre candidature"
              onPress={() => router.push("/livreur/apply")}
              C={C} mst={mr}
            />
          </View>
        </View>

        {/* ── ASSISTANCE ── */}
        <View style={s.section}>
          <SLabel title="ASSISTANCE" sst={sl} />
          <View style={s.group}>
            <MenuRow
              icon="warning" iconBg={C.error + "1F"} iconColor={C.error}
              title="BIM SOS" sub="Sécurité · Urgence · Santé — signaler à BIM NEXT"
              onPress={() => router.push("/bim-sos")}
              danger
              C={C} mst={mr}
            />
          </View>
        </View>

        <View style={{ height: insets.bottom + 80 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
