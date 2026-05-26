import { ArrowIcon, ArrowRightIcon } from "@/assets/svg/ArrowIcon";
import GradientButton from "@/components/ui/GradientButton";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  StatusBar,
  useColorScheme,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { API_URL_BASE } from "@/constants/api";
import { Colors } from "@/constants/theme";

/* ─── Hook thème (même pattern) ─────────────────────────────────────── */
function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  return { isDark, t: isDark ? Colors.dark : Colors.light };
}

/* ─── PALETTE BRAND (fixe) ───────────────────────────────────────────── */
const B = {
  primary: "#0353CC",
  violet:  "#3906C7",
  deep:    "#302E99",
  accent:  "#4D96FF",
  gold:    "#FFD700",
  white:   "#FFFFFF",
};

/* ─── FIELD CONFIG is now built inside the component to use tr() ─────── */

type FieldKey = "username" | "nom" | "poste" | "email" | "tel" | "adresse";

/* ─── ANIMATED INPUT ─────────────────────────────────────────────────── */
function AnimatedField({
  fieldKey, label, icon, keyboard, placeholder, value, onChange, isDark, t,
}: {
  fieldKey: FieldKey; label: string; icon: any; keyboard: any;
  placeholder: string; value: string;
  onChange: (k: FieldKey, v: string) => void;
  isDark: boolean; t: any;
}) {
  const focused = useRef(new Animated.Value(0)).current;

  const focus = () => Animated.timing(focused, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  const blur  = () => Animated.timing(focused, { toValue: 0, duration: 200, useNativeDriver: false }).start();

  const borderColor = focused.interpolate({
    inputRange:  [0, 1],
    outputRange: [
      isDark ? "rgba(77,150,255,0.20)" : "rgba(3,83,204,0.12)",
      B.primary,
    ],
  });
  const bgColor = focused.interpolate({
    inputRange:  [0, 1],
    outputRange: [
      isDark ? "rgba(30,42,60,0.80)" : "rgba(3,83,204,0.06)",
      isDark ? "rgba(30,58,110,0.60)" : "rgba(3,83,204,0.10)",
    ],
  });

  return (
    <View style={s.fieldWrap}>
      <Text style={[s.label, { color: isDark ? "#93C5FD" : B.primary }]}>
        {label}
      </Text>
      <Animated.View style={[s.inputBox, { borderColor, backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={18} color={isDark ? "#93C5FD" : B.primary} style={{ opacity: 0.75 }} />
        <TextInput
          style={[s.input, { color: isDark ? t.text : "#0D1B3E" }]}
          value={value}
          onChangeText={(v) => onChange(fieldKey, v)}
          placeholder={placeholder}
          placeholderTextColor={isDark ? "rgba(148,163,184,0.5)" : "#7B8DB0"}
          keyboardType={keyboard as any}
          onFocus={focus}
          onBlur={blur}
          returnKeyType="next"
        />
      </Animated.View>
    </View>
  );
}

/* ─── MAIN SCREEN ────────────────────────────────────────────────────── */
export default function ProfileScreen() {
  const router = useRouter();
  const { isDark, t } = useTheme();
  const { t: tr } = useTranslation();

  const FIELDS = [
    { key: "username", label: tr("profile.username"),  icon: "person-circle-outline", keyboard: "default",       placeholder: tr("profile.usernamePH")    },
    { key: "nom",      label: tr("profile.fullName"),   icon: "person-outline",        keyboard: "default",       placeholder: tr("profile.fullNamePH")     },
    { key: "poste",    label: tr("profile.position"),   icon: "briefcase-outline",     keyboard: "default",       placeholder: tr("profile.positionPH")     },
    { key: "email",    label: tr("profile.email"),      icon: "mail-outline",          keyboard: "email-address", placeholder: tr("profile.emailPH")        },
    { key: "tel",      label: tr("profile.phone"),      icon: "call-outline",          keyboard: "phone-pad",     placeholder: tr("profile.phonePH")        },
    { key: "adresse",  label: tr("profile.address"),    icon: "location-outline",      keyboard: "default",       placeholder: tr("profile.addressPH")      },
  ] as const;
  const scrollAnim = useRef(new Animated.Value(0)).current;

  const [userId,  setUserId]  = useState<string | null>(null);
  const [profile, setProfile] = useState({
    username: "", nom: "", poste: "", email: "", tel: "", adresse: "", photo: "",
  });

  const { data: user, isLoading, isError, refetch } = useGetUserByIdQuery(userId!, { skip: !userId });
  const [updateUser,         { isLoading: isUpdating }]  = useUpdateUserMutation();
  const [createHistory,      { isLoading: isLoadHist }]  = useCreateHistoryMutation();
  const [createNotification, { isLoading: isLoadNotif }] = useCreateNotificationMutation();

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
        : "https://www.w3schools.com/howto/img_avatar.png",
    });
  }, [user]);

  const handleChange = (field: FieldKey | "photo", value: string) =>
    setProfile(p => ({ ...p, [field]: value }));

  /* ── upload image ── */
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
    if (!granted) { Alert.alert(tr("common.permDenied"), tr("profile.permDenied")); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images as any,
      quality: 0.7, allowsEditing: true,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      handleChange("photo", uri);
      try { await uploadImage(uri); refetch(); Alert.alert("✅ Succès", tr("profile.photoSuccess")); }
      catch { Alert.alert("Erreur", tr("profile.photoError")); }
    }
  };

  /* ── save ── */
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
      const res = await updateUser({ id: userId, formData: fd });
      if (res) {
        await createHistory({ type: "MODIFICATION_PROFIL", description: "Profil mis à jour.", userId, action: "Profil modifié ✅" });
        await createNotification({ title: "Profil mis à jour", message: "Votre profil a été mis à jour avec succès.", type: "SUCCESS", userId });
      }
      Alert.alert("✅ Succès", tr("profile.profileSuccess"));
    } catch (err: any) {
      await createHistory({ type: "MODIFICATION_PROFIL", description: "Échec de la mise à jour.", userId, action: "Échec ❌" });
      await createNotification({ title: "Erreur", message: "Mise à jour du profil échouée.", type: "ERREUR", userId });
      Alert.alert("Erreur", err?.message || "Impossible de mettre à jour");
    }
  };

  /* ── header shrink ── */
  const headerHeight = scrollAnim.interpolate({ inputRange: [0, 80], outputRange: [190, 120], extrapolate: "clamp" });
  const avatarScale  = scrollAnim.interpolate({ inputRange: [0, 80], outputRange: [1, 0.7],   extrapolate: "clamp" });
  const avatarTop    = scrollAnim.interpolate({ inputRange: [0, 80], outputRange: [110, 65],   extrapolate: "clamp" });

  /* ── gradient selon thème ── */
  const headerGradient: [string, string] = isDark
    ? ["#1A1F3A", "#0A1628"]
    : [B.deep, B.primary];

  if (isLoading) return (
    <View style={[s.centerFill, { backgroundColor: isDark ? "#0A1628" : B.primary }]}>
      <LinearGradient colors={headerGradient} style={StyleSheet.absoluteFill} />
      <Text style={{ color: B.white, fontSize: 16, fontFamily: "NexaLight" }}>{tr("common.loading")}</Text>
    </View>
  );

  if (isError) return (
    <View style={[s.centerFill, { backgroundColor: isDark ? t.background : "#f0f4ff" }]}>
      <Ionicons name="cloud-offline-outline" size={48} color={isDark ? "#4D96FF" : "#7B8DB0"} />
      <Text style={{ color: isDark ? "#93C5FD" : "#7B8DB0", marginTop: 12, fontFamily: "NexaLight" }}>
        {tr("profile.loadError")}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar barStyle="light-content" />

      <View style={[s.root, { backgroundColor: isDark ? t.background : B.white }]}>

        {/* ── ANIMATED HEADER ── */}
        <Animated.View style={[s.header, {
          height: headerHeight,
          shadowColor: isDark ? "#000" : B.primary,
        }]}>
          <LinearGradient
            colors={headerGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[s.deco1, {
            backgroundColor: isDark ? "rgba(77,150,255,0.10)" : "rgba(255,255,255,0.06)",
            borderWidth: isDark ? 1 : 0,
            borderColor: "rgba(77,150,255,0.15)",
          }]} />
          <View style={[s.deco2, {
            backgroundColor: isDark ? "rgba(57,6,199,0.18)" : "rgba(255,255,255,0.04)",
          }]} />

          <View style={s.topBar}>
            <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={B.white} />
            </TouchableOpacity>
            <Text style={s.headerTitle}>{tr("profile.title")}</Text>
            <TouchableOpacity style={s.iconBtn} onPress={() => router.push("/notification")}>
              <Ionicons name="notifications-outline" size={22} color={B.white} />
              <View style={[s.notifDot, { borderColor: isDark ? "#1A1F3A" : B.deep }]} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── FLOATING AVATAR ── */}
        <Animated.View style={[s.avatarOuter, { top: avatarTop, transform: [{ scale: avatarScale }] }]}>
          <TouchableOpacity onPress={handlePickImage} activeOpacity={0.85}>
            <View style={[s.avatarRing, {
              borderColor: isDark ? "#4D96FF" : B.gold,
              shadowColor: isDark ? "#4D96FF" : B.primary,
            }]}>
              <Image source={{ uri: profile.photo }} contentFit="cover" transition={300} style={s.avatar} />
            </View>
            <View style={s.cameraBadge}>
              <Ionicons name="camera" size={14} color={B.white} />
            </View>
          </TouchableOpacity>

          <Text style={[s.profileName, { color: isDark ? t.text : "#0D1B3E" }]}>
            {profile.nom || profile.username || "Votre nom"}
          </Text>
          <Text style={[s.profilePoste, { color: isDark ? t.textSecondary : "#7B8DB0" }]}>
            {profile.poste || tr("profile.defaultPosition")}
          </Text>
        </Animated.View>

        {/* ── FORM CARD ── */}
        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollAnim } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          <View style={[s.card, {
            backgroundColor: isDark ? t.card : B.white,
            shadowColor:     isDark ? "#000" : "#000",
            shadowOpacity:   isDark ? 0.3 : 0.07,
            // Bordure subtile en dark
            borderWidth:  isDark ? 1 : 0,
            borderColor:  isDark ? "rgba(77,150,255,0.15)" : "transparent",
          }]}>
            <Text style={[s.sectionTitle, { color: isDark ? t.text : "#0D1B3E" }]}>
              {tr("profile.infoSection")}
            </Text>

            {FIELDS.map(f => (
              <AnimatedField
                key={f.key}
                fieldKey={f.key}
                label={f.label}
                icon={f.icon}
                keyboard={f.keyboard}
                placeholder={f.placeholder}
                value={profile[f.key]}
                onChange={handleChange}
                isDark={isDark}
                t={t}
              />
            ))}

            <View style={s.saveBtn}>
              <GradientButton
                isLoad={isUpdating || isLoadHist || isLoadNotif}
                title={tr("profile.save")}
                onPress={handleSave}
                leftIcon={<ArrowIcon width={18} height={12} color={B.violet} />}
                rightIcon={<ArrowRightIcon width={26} height={20} />}
              />
            </View>
          </View>

          {/* ── Mes commandes ── */}
          <TouchableOpacity
            style={[s.ordersRow, { backgroundColor: isDark ? t.card : B.white, borderColor: isDark ? "rgba(77,150,255,0.15)" : "rgba(3,83,204,0.10)" }]}
            onPress={() => router.push("/bim-supermarche/my-orders")}
            activeOpacity={0.82}
          >
            <View style={[s.ordersIcon, { backgroundColor: isDark ? "rgba(3,83,204,0.15)" : "rgba(3,83,204,0.08)" }]}>
              <Ionicons name="receipt-outline" size={20} color={B.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.ordersTitle, { color: isDark ? t.text : "#0D1B3E" }]}>Mes commandes</Text>
              <Text style={[s.ordersSub, { color: isDark ? t.textSecondary : "#7B8DB0" }]}>Suivre et consulter vos commandes</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={isDark ? t.textSecondary : "#7B8DB0"} />
          </TouchableOpacity>

          <View style={{ height: 60 }} />
        </Animated.ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
const B_bg = "#0353CC";

const s = StyleSheet.create({
  root: { flex: 1 },

  centerFill: {
    flex: 1, justifyContent: "center", alignItems: "center",
  },

  header: {
    width: "100%",
    overflow: "hidden",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },

  deco1: {
    position: "absolute", width: 200, height: 200,
    borderRadius: 100,
    top: -60, right: -50,
  },
  deco2: {
    position: "absolute", width: 140, height: 140,
    borderRadius: 70,
    bottom: -30, left: -20,
  },

  topBar: {
    marginTop: Platform.OS === "ios" ? 48 : 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },

  headerTitle: {
    color: B.white, fontSize: 18,
    fontFamily: "NexaLight", letterSpacing: 0.3,
  },

  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },

  notifDot: {
    position: "absolute", top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: B.gold, borderWidth: 1.5,
  },

  avatarOuter: {
    position: "absolute", left: 0, right: 0,
    alignItems: "center", zIndex: 10,
  },

  avatarRing: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 3,
    overflow: "hidden",
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },

  avatar: { width: "100%", height: "100%" },

  cameraBadge: {
    position: "absolute", bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: B.accent,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: B.white,
  },

  profileName: {
    marginTop: 8, fontSize: 16,
    fontFamily: "NexaLight", letterSpacing: 0.2,
  },
  profilePoste: {
    fontSize: 12, marginTop: 1,
    fontFamily: "NexaLight",
  },

  scrollContent: { paddingTop: 140, paddingHorizontal: 14 },

  card: {
    borderRadius: 24, padding: 16,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
  },

  sectionTitle: {
    fontSize: 14, fontFamily: "NexaLight",
    marginBottom: 12, letterSpacing: 0.3,
  },

  fieldWrap: { marginBottom: 10 },

  label: {
    fontSize: 11, fontFamily: "NexaLight",
    marginBottom: 4,
    textTransform: "uppercase", letterSpacing: 0.8,
  },

  inputBox: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 12, borderWidth: 1.5,
    paddingHorizontal: 12, height: 46, gap: 8,
  },

  input: {
    flex: 1, fontSize: 13, fontFamily: "NexaLight",
  },

  saveBtn: { marginTop: 6 },

  ordersRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    marginHorizontal: 16, marginTop: 14,
    borderRadius: 20, padding: 16,
    borderWidth: 1,
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  ordersIcon:  { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  ordersTitle: { fontFamily: "NexaLight", fontSize: 14, fontWeight: "700" },
  ordersSub:   { fontFamily: "NexaLight", fontSize: 11, marginTop: 2 },
});